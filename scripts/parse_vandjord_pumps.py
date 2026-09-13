#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Парсер характеристик насосов Vandjord для конфигуратора.

Вход:  data/nomenclature/Pumps.csv
Выход: data/nomenclature/updated_pumps_base.csv

Стратегия:
  1) --use-playwright: Chromium открывает vandjord.com (куки/сессия),
     затем POST /product_selection/submit.php через page.request
     (activeTab=search, articleInput=чистый артикул) — JSON с Q/H/DN.
  2) HTTP-поиск по /search/?q=… (fallback, verify=False, паузы 3–7 сек).
  3) Если сайт недоступен / модель не найдена — математический разбор
     названия (TPV / NBV / CRV / VCM / Hydro-*).

Запуск:
  pip install -r scripts/requirements-pumps-parser.txt
  python scripts/parse_vandjord_pumps.py
  python scripts/parse_vandjord_pumps.py --math-only
  python scripts/parse_vandjord_pumps.py --limit 20
  python scripts/parse_vandjord_pumps.py --use-playwright --limit 5 --force
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import random
import re
import sys
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Optional
from urllib.parse import quote_plus, urljoin

import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ---------------------------------------------------------------------------
# Зависимости
# ---------------------------------------------------------------------------
try:
    import pandas as pd
except ImportError as exc:  # pragma: no cover
    raise SystemExit(
        "Нужен pandas. Установите: pip install -r scripts/requirements-pumps-parser.txt"
    ) from exc

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError as exc:  # pragma: no cover
    raise SystemExit(
        "Нужны requests и beautifulsoup4. "
        "Установите: pip install -r scripts/requirements-pumps-parser.txt"
    ) from exc

# ---------------------------------------------------------------------------
# Пути / константы
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "data" / "nomenclature" / "Pumps.csv"
DEFAULT_OUTPUT = ROOT / "data" / "nomenclature" / "updated_pumps_base.csv"
CACHE_DIR = ROOT / "scripts" / ".vandjord_cache"
CHECKPOINT_PATH = CACHE_DIR / "checkpoint.jsonl"

BASE_URL = "https://vandjord.com"
SEARCH_URL = f"{BASE_URL}/search/"
PRODUCT_SELECTION_URL = f"{BASE_URL}/product_selection/"
VJ_SUBMIT_URL = f"{PRODUCT_SELECTION_URL}submit.php"

# Индексы колонок в dataTableContent (см. tableHeaders в ответе submit.php)
VJ_COL_POWER = 5
VJ_COL_NOM_FLOW = 8
VJ_COL_NOM_HEAD = 9
VJ_COL_SUCTION_DN = 19
VJ_COL_DISCHARGE_DN = 20
VJ_COL_POLES = 31

MIN_DELAY_SEC = 3.0
MAX_DELAY_SEC = 7.0
REQUEST_TIMEOUT = 40
STAGE_HEAD_M = 5.7  # CRV: H = stages * 5.7

POLE_RPM = {
    2: 2900,
    4: 1450,
    6: 960,
}

USER_AGENTS = [
    (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0"
    ),
    (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
]

OUTPUT_COLUMNS = [
    "Артикул",
    "Оригинальное название",
    "Родительская Серия",
    "Цена",
    "Мощность, кВт",
    "Номинальный расход, м3/ч",
    "Номинальный напор, м",
    "Диаметр DN, мм",
    "Полюса/Обороты",
    "Источник данных",
]

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("vandjord_pumps")


# ---------------------------------------------------------------------------
# Модель результата
# ---------------------------------------------------------------------------
@dataclass
class PumpSpecs:
    sku: str = ""
    name: str = ""
    parent_series: str = ""
    price: str = ""
    power_kw: str = ""
    flow_m3h: Optional[float] = None
    head_m: Optional[float] = None
    dn_mm: Optional[float] = None
    poles_rpm: str = ""
    source: str = ""
    notes: str = ""
    extra: dict[str, Any] = field(default_factory=dict)

    def merge_missing(self, other: "PumpSpecs") -> None:
        """Дополняет пустые поля значениями из other (обычно math-fallback)."""
        for key in (
            "parent_series",
            "flow_m3h",
            "head_m",
            "dn_mm",
            "poles_rpm",
        ):
            if getattr(self, key) in (None, "") and getattr(other, key) not in (None, ""):
                setattr(self, key, getattr(other, key))
        if other.source and self.source and other.source not in self.source:
            self.source = f"{self.source}+{other.source}"
        elif other.source and not self.source:
            self.source = other.source


# ---------------------------------------------------------------------------
# Утилиты
# ---------------------------------------------------------------------------
def polite_sleep(force: bool = True) -> None:
    if not force:
        return
    delay = random.uniform(MIN_DELAY_SEC, MAX_DELAY_SEC)
    log.debug("sleep %.2fs", delay)
    time.sleep(delay)


def normalize_number(value: Any) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip().replace("\xa0", " ").replace(" ", "")
    if not text or text.lower() in {"nan", "none", "-"}:
        return None
    text = text.replace(",", ".")
    m = re.search(r"-?\d+(?:\.\d+)?", text)
    if not m:
        return None
    try:
        return float(m.group(0))
    except ValueError:
        return None


def format_num(value: Optional[float]) -> str:
    if value is None:
        return ""
    if abs(value - round(value)) < 1e-9:
        return str(int(round(value)))
    return f"{value:.2f}".rstrip("0").rstrip(".")


def poles_label(poles: Optional[int]) -> str:
    if not poles:
        return ""
    rpm = POLE_RPM.get(poles)
    if rpm:
        return f"{poles} / {rpm}"
    return str(poles)


def clean_search_query(value: str) -> str:
    """
    Чистый поисковый запрос: артикул или модель без «мусорных» символов.
    Убирает двоеточия и хвосты вида «CRV 1-3C:», которые ломают поиск.
    """
    text = (value or "").replace("\xa0", " ").strip()
    # срезаем подписи вида «Модель: …» / «Артикул: …»
    if ":" in text:
        parts = [p.strip() for p in text.split(":") if p.strip()]
        text = parts[-1] if parts else text
    text = text.replace(":", " ").replace(";", " ").replace(",", " ")
    text = re.sub(r"[^\w\s.\-/]+", " ", text, flags=re.UNICODE)
    text = re.sub(r"\s+", " ", text).strip(" .-_/")
    return text


def build_search_path(query: str) -> str:
    """Путь поисковой выдачи: /search/?q=CRV+1-3C"""
    q = clean_search_query(query)
    if not q:
        return "/search/"
    return f"/search/?q={quote_plus(q)}"


def build_search_url(query: str) -> str:
    return f"{BASE_URL}{build_search_path(query)}"


def detect_encoding(path: Path) -> str:
    raw = path.read_bytes()[:4096]
    for enc in ("utf-8-sig", "cp1251", "utf-8"):
        try:
            raw.decode(enc)
            return enc
        except UnicodeDecodeError:
            continue
    return "cp1251"


# ---------------------------------------------------------------------------
# Математический разбор названия (fallback)
# ---------------------------------------------------------------------------
_RE_TPV_NBV = re.compile(
    r"^(?P<series>TPV|NBV(?:\s*iNOX)?)\s*"
    r"(?P<dn>\d+)\s*-\s*(?P<head>\d+)\s*-\s*(?P<power>[\d.,]+)\s*/\s*(?P<poles>\d+)",
    re.I,
)
_RE_CRV_VCM = re.compile(
    r"^(?P<series>CRV(?:-CN)?|CRVE?|VCM)\s*"
    r"(?P<flow>[\d.,]+)\s*-\s*(?P<stages>\d+)\s*(?P<suffix>[A-Za-z]*)",
    re.I,
)
_RE_HYDRO = re.compile(
    r"^(?P<series>Hydro-[A-Za-z]+(?:-[A-Za-z]+)?)"
    r"(?:\s+\d+(?:\s*/\s*\d+)?)?\s+"
    r"(?P<sub>CRVE?|CRV(?:-CN)?|VCM)\s*"
    r"(?P<flow>[\d.,]+)\s*-\s*(?P<stages>\d+)(?:-\d+)?",
    re.I,
)
_RE_VNK = re.compile(
    r"^VNK\s+(?P<a>\d+)\s*-\s*(?P<b>\d+)\s*/\s*(?P<head>\d+)",
    re.I,
)


def parse_from_model_name(name: str, series_hint: str = "") -> PumpSpecs:
    """Резервный алгоритм из ТЗ (+ близкие серии NBV/VCM/Hydro)."""
    raw = re.sub(r"\s+", " ", (name or "").strip())
    specs = PumpSpecs(name=raw, source="math")

    m = _RE_TPV_NBV.match(raw)
    if m:
        dn = int(m.group("dn"))
        head_dm = int(m.group("head"))
        poles = int(m.group("poles"))
        series = m.group("series").upper().replace("  ", " ")
        if "INOX" in series.upper():
            series = "NBV iNOX"
        elif series.upper().startswith("NBV"):
            series = "NBV"
        else:
            series = "TPV"
        specs.parent_series = f"{series} {dn}/{poles}"
        specs.dn_mm = float(dn)
        specs.head_m = head_dm / 10.0
        specs.poles_rpm = poles_label(poles)
        specs.notes = f"power_in_name={m.group('power')}"
        return specs

    m = _RE_HYDRO.match(raw)
    if m:
        flow = normalize_number(m.group("flow"))
        stages = int(m.group("stages"))
        sub = m.group("sub").upper()
        specs.parent_series = f"{m.group('series')} / {sub} {format_num(flow)}"
        specs.flow_m3h = flow
        specs.head_m = stages * STAGE_HEAD_M
        specs.notes = f"stages={stages}"
        return specs

    m = _RE_CRV_VCM.match(raw)
    if m:
        flow = normalize_number(m.group("flow"))
        stages = int(m.group("stages"))
        series = m.group("series").upper()
        if series.startswith("CRV"):
            # CRV / CRV-CN / CRVE → родительская серия вида «CRV 1»
            base = "CRV-CN" if "CN" in series else "CRV"
            specs.parent_series = f"{base} {format_num(flow)}"
        else:
            specs.parent_series = f"VCM {format_num(flow)}"
        specs.flow_m3h = flow
        specs.head_m = stages * STAGE_HEAD_M
        specs.notes = f"stages={stages}"
        # Для CRV номинальные обороты обычно 2900 (2 полюса)
        if series.startswith("CRV") or series.startswith("VCM"):
            specs.poles_rpm = poles_label(2)
        return specs

    m = _RE_VNK.match(raw)
    if m:
        # VNK 100-80/119 → DN≈80 (напорный), напор из хвоста как дм? оставляем head как есть /10 осторожно
        specs.parent_series = f"VNK {m.group('a')}-{m.group('b')}"
        specs.dn_mm = float(m.group("b"))
        # В обозначении /119 чаще габарит рабочего колеса, не напор — не угадываем H
        specs.notes = "vnk_partial"
        return specs

    if series_hint:
        specs.parent_series = series_hint.strip()
    return specs


# ---------------------------------------------------------------------------
# HTTP-клиент
# ---------------------------------------------------------------------------
class VandjordClient:
    def __init__(self) -> None:
        self.session = requests.Session()
        self._rotate_headers()
        CACHE_DIR.mkdir(parents=True, exist_ok=True)

    def _rotate_headers(self) -> None:
        ua = random.choice(USER_AGENTS)
        self.session.headers.update(
            {
                "User-Agent": ua,
                "Accept": (
                    "text/html,application/xhtml+xml,application/xml;"
                    "q=0.9,image/avif,image/webp,*/*;q=0.8"
                ),
                "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "none",
                "Sec-Fetch-User": "?1",
                "Cache-Control": "max-age=0",
            }
        )

    def get(self, url: str, *, use_cache: bool = True) -> Optional[str]:
        cache_key = re.sub(r"[^a-zA-Z0-9]+", "_", url)[:180] + ".html"
        cache_path = CACHE_DIR / cache_key
        if use_cache and cache_path.exists():
            return cache_path.read_text(encoding="utf-8", errors="replace")

        self._rotate_headers()
        polite_sleep(True)
        try:
            resp = self.session.get(url, timeout=REQUEST_TIMEOUT, verify=False)
            if resp.status_code == 429:
                log.warning("429 Too Many Requests — пауза 60с")
                time.sleep(60)
                resp = self.session.get(url, timeout=REQUEST_TIMEOUT, verify=False)
            if resp.status_code >= 400:
                log.warning("HTTP %s for %s", resp.status_code, url)
                return None
            # requests сам учитывает charset из заголовков
            text = resp.text
            if use_cache:
                cache_path.write_text(text, encoding="utf-8")
            return text
        except requests.RequestException as exc:
            log.warning("request failed %s: %s", url, exc)
            return None

    def post(self, url: str, **kwargs: Any) -> Optional[requests.Response]:
        """POST с отключённой проверкой SSL (на случай AJAX/форм)."""
        self._rotate_headers()
        polite_sleep(True)
        try:
            kwargs.setdefault("timeout", REQUEST_TIMEOUT)
            kwargs["verify"] = False
            return self.session.post(url, **kwargs)
        except requests.RequestException as exc:
            log.warning("POST failed %s: %s", url, exc)
            return None


# ---------------------------------------------------------------------------
# Парсинг HTML поиска / карточки
# ---------------------------------------------------------------------------
def _extract_spec_map(soup: BeautifulSoup) -> dict[str, str]:
    """Собирает пары характеристика→значение из таблиц и definition lists."""
    data: dict[str, str] = {}

    for table in soup.select("table"):
        for tr in table.select("tr"):
            cells = [c.get_text(" ", strip=True) for c in tr.find_all(["th", "td"])]
            if len(cells) >= 2:
                data[cells[0].lower()] = cells[1]

    for dl in soup.select("dl"):
        dts = dl.find_all("dt")
        dds = dl.find_all("dd")
        for dt, dd in zip(dts, dds):
            data[dt.get_text(" ", strip=True).lower()] = dd.get_text(" ", strip=True)

    # Блоки вида «Напор: 12 м»
    text = soup.get_text("\n", strip=True)
    for m in re.finditer(
        r"(?P<k>напор|расход|подача|диаметр|патруб|DN|мощность|обороты|полюс)"
        r"[^\n:]{0,40}[:\s]+(?P<v>[^\n]{1,40})",
        text,
        flags=re.I,
    ):
        data[m.group("k").lower()] = m.group("v").strip()

    return data


def _pick_from_map(spec_map: dict[str, str], *needles: str) -> Optional[str]:
    for key, val in spec_map.items():
        for needle in needles:
            if needle.lower() in key:
                return val
    return None


def parse_product_html(html: str, sku: str, name: str) -> PumpSpecs:
    soup = BeautifulSoup(html, "html.parser")
    specs = PumpSpecs(sku=sku, name=name, source="web")
    spec_map = _extract_spec_map(soup)

    head_raw = _pick_from_map(
        spec_map, "номинальный напор", "напор", "head", "h ном"
    )
    flow_raw = _pick_from_map(
        spec_map, "номинальный расход", "расход", "подача", "flow", "q ном"
    )
    dn_raw = _pick_from_map(
        spec_map, "диаметр", "патруб", "dn", "присоединен"
    )
    poles_raw = _pick_from_map(spec_map, "полюс", "оборот", "скорость вращения")

    specs.head_m = normalize_number(head_raw)
    # если напор в дм (редко) — эвристика: очень большое число при малом DN
    if specs.head_m and specs.head_m > 500 and "дм" in (head_raw or "").lower():
        specs.head_m = specs.head_m / 10.0

    specs.flow_m3h = normalize_number(flow_raw)

    if dn_raw:
        dn_m = re.search(r"(?:DN\s*)?(\d{2,3})", dn_raw, flags=re.I)
        if dn_m:
            specs.dn_mm = float(dn_m.group(1))

    if poles_raw:
        poles_m = re.search(r"([246])\s*(?:полюс|p)?", poles_raw, flags=re.I)
        rpm_m = re.search(r"(\d{3,4})\s*об", poles_raw, flags=re.I)
        if poles_m:
            specs.poles_rpm = poles_label(int(poles_m.group(1)))
        elif rpm_m:
            rpm = int(rpm_m.group(1))
            inv = {v: k for k, v in POLE_RPM.items()}
            # ближайшие обороты
            poles = min(inv.keys(), key=lambda x: abs(x - rpm))
            # map rpm->poles via closest known rpm
            closest_rpm = min(POLE_RPM.values(), key=lambda x: abs(x - rpm))
            specs.poles_rpm = poles_label(
                next(p for p, r in POLE_RPM.items() if r == closest_rpm)
            )

    # Если на странице ничего полезного — считаем «не найдено»
    if specs.head_m is None and specs.flow_m3h is None and specs.dn_mm is None:
        specs.source = ""
    return specs


def find_product_links(search_html: str, query: str) -> list[str]:
    soup = BeautifulSoup(search_html, "html.parser")
    links: list[str] = []
    q_norm = re.sub(r"\s+", " ", query).lower()

    for a in soup.select("a[href]"):
        href = a.get("href") or ""
        text = a.get_text(" ", strip=True).lower()
        if "/product/" not in href and "/catalog/" not in href:
            continue
        if any(bad in href for bad in ("/filter/", "#", "javascript:")):
            continue
        full = urljoin(BASE_URL, href)
        score = 0
        if q_norm and q_norm in text:
            score += 3
        if q_norm and q_norm.replace(" ", "-") in href.lower():
            score += 2
        if score:
            links.append(full)

    # уникальные с сохранением порядка
    seen = set()
    out = []
    for u in links:
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out[:5]


def scrape_vandjord_http(client: VandjordClient, sku: str, name: str) -> PumpSpecs:
    """Поиск по чистому артикулу/модели на vandjord.com (без кликов по UI)."""
    queries = []
    for raw in (sku, name):
        q = clean_search_query(raw)
        if q and q not in queries:
            queries.append(q)

    for q in queries:
        url = build_search_url(q)
        log.info("HTTP search: %s", url)
        html = client.get(url)
        if not html:
            continue
        links = find_product_links(html, q)
        for link in links:
            page = client.get(link)
            if not page:
                continue
            specs = parse_product_html(page, sku=sku, name=name)
            if specs.source:
                specs.extra["url"] = link
                log.info("web hit %s via %s", name, link)
                return specs
    return PumpSpecs(sku=sku, name=name, source="")


def _parse_specs_from_page_text(body: str, sku: str, name: str) -> PumpSpecs:
    """Эвристический разбор Q/H/DN из текста HTML/страницы."""
    specs = PumpSpecs(sku=sku, name=name, source="")
    head_m = None
    flow_m = None
    dn_m = None

    # Номинальный напор (H)
    for pat in (
        r"номинальн(?:ый|ого)?\s+напор[^\d]{0,40}([\d.,]+)\s*м",
        r"(?:^|\s)(?:H|Напор)\s*[:=]?\s*([\d.,]+)\s*м",
        r"H\s*\(\s*м\s*\)\s*[:=]?\s*([\d.,]+)",
    ):
        m = re.search(pat, body, flags=re.I | re.M)
        if m:
            head_m = normalize_number(m.group(1))
            break

    # Номинальный расход (Q)
    for pat in (
        r"номинальн(?:ый|ого)?\s+расход[^\d]{0,40}([\d.,]+)\s*м",
        r"(?:^|\s)(?:Q|Расход|Подача)\s*[:=]?\s*([\d.,]+)\s*м",
        r"Q\s*\(\s*м\s*[³3]?/?ч\s*\)\s*[:=]?\s*([\d.,]+)",
    ):
        m = re.search(pat, body, flags=re.I | re.M)
        if m:
            flow_m = normalize_number(m.group(1))
            break

    # Диаметр DN
    for pat in (
        r"(?:диаметр|патруб|присоедин)[^\n]{0,40}DN\s*([0-9]{2,3})",
        r"DN\s*([0-9]{2,3})",
    ):
        m = re.search(pat, body, flags=re.I)
        if m:
            dn_m = float(m.group(1))
            break

    if head_m or flow_m or dn_m:
        specs.head_m = head_m
        specs.flow_m3h = flow_m
        specs.dn_mm = dn_m
        specs.source = "playwright"
    return specs


def _extract_sku_digits(sku: str) -> str:
    """Строго цифровой артикул: 74111740."""
    cleaned = clean_search_query(sku)
    digits = re.sub(r"\D+", "", cleaned)
    return digits or cleaned


def build_vj_submit_payload(article: str) -> dict[str, Any]:
    """Тело POST /product_selection/submit.php (вкладка search)."""
    return {
        "selectedManufacturer": "",
        "application": "",
        "equipmentTypes": [],
        "flowValue": "",
        "analogDl": "",
        "analogDlV": "",
        "analogPvikl": "",
        "analogPviklQ": "",
        "analogPw": "",
        "analogT": "",
        "selectedName": None,
        "analogRpat": "",
        "flowUnit": "м³/ч",
        "pressureValue": "",
        "pressureUnit": "м",
        "staticPressureValue": "",
        "staticPressureUnit": "м",
        "liquidValue": "Вода",
        "maxTempValue": 20,
        "concentrationValue": 1,
        "concentrationUnit": "%",
        "densityValue": "998.2",
        "densityValueV": "",
        "densityUnit": "кг/м³",
        "selectedParallelConnection": "",
        "selectedBackupPumps": "",
        "frequencyControl": False,
        "frequencyControlZon": False,
        "frequencyControlZonService": False,
        "downLoadArtFull": False,
        "count": 50,
        "page": 50,
        "tolerance": "",
        "addCustomGraph": False,
        "customGraph": None,
        "hidePrice": "",
        "hideArticle": "",
        "articleInput": article,
        "selectedDischargeSizes": [],
        "selectedSuctionSizes": [],
        "selectedTypeMontag": [],
        "selectedTimeWork": [],
        "selectedVsPopVikl": [],
        "selectedVsPopViklQ": [],
        "selectedPowers": [],
        "bodyMaterial": "",
        "wheelMaterial": "",
        "wheelType": "",
        "maxWorkingPressure": "",
        "maxWorkingPressureFree": "",
        "selectedSizeTypes": [],
        "selectedServiceFactor": [],
        "selectedPhaseCount": "",
        "selectedPoleCount": "",
        "activeTab": "search",
        "domenInfo": BASE_URL,
    }


def parse_dn_from_cell(value: Any) -> Optional[float]:
    """Из «DN 25 / DN 32» берём максимальный DN."""
    if value is None:
        return None
    text = str(value)
    nums = [float(x) for x in re.findall(r"DN\s*(\d{2,3})", text, flags=re.I)]
    if not nums:
        nums = [float(x) for x in re.findall(r"\b(\d{2,3})\b", text)]
    return max(nums) if nums else None


def parse_vj_submit_response(data: dict[str, Any], sku: str, name: str) -> PumpSpecs:
    """Разбор JSON submit.php → PumpSpecs."""
    specs = PumpSpecs(sku=sku, name=name, source="")
    rows = data.get("dataTableContent") or []
    if not rows:
        return specs

    article_digits = _extract_sku_digits(sku)
    row: Optional[list[Any]] = None
    for candidate in rows:
        if len(candidate) > 1 and str(candidate[1]).strip() == article_digits:
            row = candidate
            break
    if row is None:
        row = rows[0]

    if len(row) > VJ_COL_NOM_HEAD:
        specs.flow_m3h = normalize_number(row[VJ_COL_NOM_FLOW])
        specs.head_m = normalize_number(row[VJ_COL_NOM_HEAD])

    if len(row) > VJ_COL_POWER:
        power = normalize_number(row[VJ_COL_POWER])
        if power is not None:
            specs.power_kw = format_num(power).replace(".", ",")

    if len(row) > VJ_COL_DISCHARGE_DN:
        specs.dn_mm = parse_dn_from_cell(row[VJ_COL_DISCHARGE_DN])
        if specs.dn_mm is None:
            specs.dn_mm = parse_dn_from_cell(row[VJ_COL_SUCTION_DN])

    if len(row) > VJ_COL_POLES:
        poles_raw = row[VJ_COL_POLES]
        if isinstance(poles_raw, (int, float)) and not isinstance(poles_raw, bool):
            specs.poles_rpm = poles_label(int(poles_raw))
        else:
            poles_m = re.search(r"([246])\s*(?:полюс|p)?", str(poles_raw), flags=re.I)
            if poles_m:
                specs.poles_rpm = poles_label(int(poles_m.group(1)))

    if specs.flow_m3h or specs.head_m or specs.dn_mm:
        specs.source = "vj_api"
        specs.extra["analytics_id"] = data.get("ID_ANALITICS")
        if row:
            specs.extra["row_id"] = row[0] if row else None
    return specs


# ---------------------------------------------------------------------------
# Playwright: VJ Select API через page.request (без кликов по UI)
# ---------------------------------------------------------------------------
class VJSelectBrowser:
    """
    Один браузер на весь прогон: загрузка vandjord.com для куки/сессии,
    затем POST submit.php через page.request с activeTab=search.
    """

    def __init__(self, *, headless: bool = True) -> None:
        self._pw = None
        self._browser = None
        self._context = None
        self._page = None
        self._ready = False
        self._headless = headless

    def __enter__(self) -> "VJSelectBrowser":
        self.start()
        return self

    def __exit__(self, *args: Any) -> None:
        self.close()

    def start(self) -> None:
        try:
            from playwright.sync_api import sync_playwright
        except ImportError as exc:
            raise SystemExit(
                "Playwright не установлен. "
                "pip install playwright && playwright install chromium"
            ) from exc

        log.info("Playwright → %s (инициализация сессии)", BASE_URL)
        self._pw = sync_playwright().start()
        self._browser = self._pw.chromium.launch(headless=self._headless)
        self._context = self._browser.new_context(
            user_agent=random.choice(USER_AGENTS),
            locale="ru-RU",
            viewport={"width": 1440, "height": 900},
            ignore_https_errors=True,
        )
        self._page = self._context.new_page()
        self._page.goto(BASE_URL, wait_until="domcontentloaded", timeout=90000)
        self._page.wait_for_load_state("networkidle", timeout=90000)
        self._page.goto(
            PRODUCT_SELECTION_URL,
            wait_until="domcontentloaded",
            timeout=90000,
        )
        self._page.wait_for_timeout(int(random.uniform(1500, 2500)))
        self._ready = True
        log.info("Сессия VJ Select готова")

    def close(self) -> None:
        for obj in (self._context, self._browser):
            try:
                if obj:
                    obj.close()
            except Exception:  # noqa: BLE001
                pass
        try:
            if self._pw:
                self._pw.stop()
        except Exception:  # noqa: BLE001
            pass
        self._pw = self._browser = self._context = self._page = None
        self._ready = False

    def search_by_sku(self, sku: str, name: str = "") -> PumpSpecs:
        """POST submit.php с чистым артикулом → Q / H / DN из JSON."""
        if not self._ready or self._page is None:
            self.start()

        page = self._page
        assert page is not None
        article = _extract_sku_digits(sku)
        if not article:
            return PumpSpecs(sku=sku, name=name, source="")

        polite_sleep(True)
        log.info("VJ API: артикул %s (%s)", article, name)

        try:
            payload = build_vj_submit_payload(article)
            resp = page.request.post(
                VJ_SUBMIT_URL,
                data=json.dumps(payload, ensure_ascii=False),
                headers={
                    "Content-Type": "application/json; charset=utf-8",
                    "Accept": "application/json",
                    "Referer": PRODUCT_SELECTION_URL,
                    "Origin": BASE_URL,
                },
                timeout=90000,
            )
            if resp.status >= 400:
                log.warning("VJ API HTTP %s для %s: %s", resp.status, article, resp.text()[:200])
                return PumpSpecs(sku=sku, name=name, source="")

            data = resp.json()
            specs = parse_vj_submit_response(data, sku=sku, name=name or article)
            if specs.source:
                log.info(
                    "VJ API OK %s → Q=%s H=%s DN=%s poles=%s",
                    article,
                    specs.flow_m3h,
                    specs.head_m,
                    specs.dn_mm,
                    specs.poles_rpm,
                )
            else:
                log.warning("VJ API: пустой ответ для артикула %s", article)
            return specs
        except Exception as exc:  # noqa: BLE001
            log.warning("VJ API failed for %s: %s", article, exc)
            return PumpSpecs(sku=sku, name=name, source="")


def scrape_vandjord_playwright(
    sku: str,
    name: str,
    browser: Optional[VJSelectBrowser] = None,
) -> PumpSpecs:
    """Совместимая обёртка: использует общий браузер или создаёт разовый."""
    own = False
    session = browser
    if session is None:
        session = VJSelectBrowser()
        session.start()
        own = True
    try:
        return session.search_by_sku(sku, name)
    finally:
        if own:
            session.close()


# ---------------------------------------------------------------------------
# Загрузка исходного CSV
# ---------------------------------------------------------------------------
def load_pumps_df(path: Path) -> pd.DataFrame:
    enc = detect_encoding(path)
    log.info("Читаю %s (encoding=%s)", path, enc)
    df = pd.read_csv(path, sep=";", encoding=enc, dtype=str, engine="python")
    df.columns = [re.sub(r"\s+", " ", str(c)).strip() for c in df.columns]

    def col(*aliases: str) -> Optional[str]:
        for a in aliases:
            for c in df.columns:
                if a.lower() in c.lower():
                    return c
        return None

    mapping = {
        "sku": col("Артикул"),
        "name": col("Номенклатура"),
        "price": col("Цена РУБ", "Цена РУБ"),
        "power": col("Мощность P2", "Мощность, кВт  P1", "Мощность"),
        "series": col("Серия"),
        "dn_exist": col("Трубное присоединение"),
    }
    missing = [k for k, v in mapping.items() if v is None and k in {"sku", "name"}]
    if missing:
        raise SystemExit(f"В CSV нет обязательных колонок: {missing}. Есть: {list(df.columns)}")

    out = pd.DataFrame(
        {
            "sku": df[mapping["sku"]].fillna("").astype(str).str.strip(),
            "name": df[mapping["name"]].fillna("").astype(str).str.strip(),
            "price": df[mapping["price"]].fillna("").astype(str).str.strip()
            if mapping["price"]
            else "",
            "power": df[mapping["power"]].fillna("").astype(str).str.strip()
            if mapping["power"]
            else "",
            "series": df[mapping["series"]].fillna("").astype(str).str.strip()
            if mapping["series"]
            else "",
            "dn_exist": df[mapping["dn_exist"]].fillna("").astype(str).str.strip()
            if mapping["dn_exist"]
            else "",
        }
    )
    out = out[out["sku"].astype(bool) | out["name"].astype(bool)].reset_index(drop=True)
    log.info("Строк к обработке: %s", len(out))
    return out


def load_checkpoint() -> dict[str, dict]:
    if not CHECKPOINT_PATH.exists():
        return {}
    data: dict[str, dict] = {}
    with CHECKPOINT_PATH.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                data[str(obj.get("sku") or obj.get("name"))] = obj
            except json.JSONDecodeError:
                continue
    return data


def append_checkpoint(row: dict) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    with CHECKPOINT_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(row, ensure_ascii=False) + "\n")


def dn_from_existing(text: str) -> Optional[float]:
    if not text:
        return None
    m = re.search(r"(?:DN\s*)?(\d{2,3})", text, flags=re.I)
    if m:
        return float(m.group(1))
    return None


# ---------------------------------------------------------------------------
# Основной цикл
# ---------------------------------------------------------------------------
def process_row(
    row: pd.Series,
    *,
    client: Optional[VandjordClient],
    math_only: bool,
    use_playwright: bool,
    vj_browser: Optional[VJSelectBrowser] = None,
) -> PumpSpecs:
    sku = str(row["sku"])
    name = str(row["name"])
    series = str(row.get("series") or "")

    math_specs = parse_from_model_name(name, series_hint=series)
    # DN из исходного CSV, если уже заполнен
    exist_dn = dn_from_existing(str(row.get("dn_exist") or ""))
    if exist_dn and math_specs.dn_mm is None:
        math_specs.dn_mm = exist_dn

    result = PumpSpecs(
        sku=sku,
        name=name,
        price=str(row.get("price") or ""),
        power_kw=str(row.get("power") or "").replace(".", ","),
        source="",
    )

    if not math_only:
        # VJ Select (headed) — приоритетный источник полных H/Q/DN
        if use_playwright and vj_browser is not None:
            pw = vj_browser.search_by_sku(sku, name)
            if pw.source:
                result.merge_missing(pw)
                result.source = pw.source
        elif use_playwright and vj_browser is None:
            pw = scrape_vandjord_playwright(sku, name)
            if pw.source:
                result.merge_missing(pw)
                result.source = pw.source

        # HTTP /search/ — только если Playwright не дал данных
        if not result.source and client is not None:
            web = scrape_vandjord_http(client, sku, name)
            if web.source:
                result.merge_missing(web)
                result.source = web.source

    # Всегда добираем пробелы математикой
    result.merge_missing(math_specs)
    if not result.parent_series:
        result.parent_series = math_specs.parent_series or series
    if not result.source:
        result.source = math_specs.source or "math"
    elif "math" not in result.source and (
        math_specs.flow_m3h or math_specs.head_m or math_specs.dn_mm
    ):
        # помечаем, что часть полей добита математикой
        if any(
            [
                result.flow_m3h == math_specs.flow_m3h and math_specs.flow_m3h is not None,
                result.head_m == math_specs.head_m and math_specs.head_m is not None,
                result.dn_mm == math_specs.dn_mm and math_specs.dn_mm is not None,
            ]
        ):
            result.source = f"{result.source}+math"

    return result


def specs_to_output_row(s: PumpSpecs) -> dict[str, str]:
    return {
        "Артикул": s.sku,
        "Оригинальное название": s.name,
        "Родительская Серия": s.parent_series,
        "Цена": s.price,
        "Мощность, кВт": s.power_kw,
        "Номинальный расход, м3/ч": format_num(s.flow_m3h),
        "Номинальный напор, м": format_num(s.head_m),
        "Диаметр DN, мм": format_num(s.dn_mm),
        "Полюса/Обороты": s.poles_rpm,
        "Источник данных": s.source,
    }


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Парсер параметров насосов Vandjord")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--limit", type=int, default=0, help="Обработать только N строк")
    parser.add_argument(
        "--math-only",
        action="store_true",
        help="Не ходить в сеть — только разбор названия",
    )
    parser.add_argument(
        "--use-playwright",
        action="store_true",
        help=(
            "VJ Select API через Playwright: сессия vandjord.com + "
            "POST submit.php (articleInput=SKU), разбор H/Q/DN из JSON"
        ),
    )
    parser.add_argument(
        "--headed",
        action="store_true",
        help="Показать окно браузера Playwright (по умолчанию headless)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Игнорировать checkpoint и пересчитать всё",
    )
    args = parser.parse_args(argv)

    if not args.input.exists():
        raise SystemExit(f"Нет файла: {args.input}")

    df = load_pumps_df(args.input)
    if args.limit and args.limit > 0:
        df = df.head(args.limit).copy()

    checkpoint = {} if args.force else load_checkpoint()
    client = None if args.math_only else VandjordClient()
    vj_browser: Optional[VJSelectBrowser] = None

    rows_out: list[dict[str, str]] = []
    total = len(df)
    try:
        if args.use_playwright and not args.math_only:
            vj_browser = VJSelectBrowser(headless=not args.headed)
            vj_browser.start()

        for i, (_, row) in enumerate(df.iterrows(), start=1):
            key = str(row["sku"]) or str(row["name"])
            if key in checkpoint and not args.force:
                rows_out.append(checkpoint[key])
                continue

            log.info("[%s/%s] %s | %s", i, total, row["sku"], row["name"])
            specs = process_row(
                row,
                client=client,
                math_only=args.math_only,
                use_playwright=args.use_playwright,
                vj_browser=vj_browser,
            )
            out = specs_to_output_row(specs)
            rows_out.append(out)
            append_checkpoint(out)

            # Промежуточное сохранение каждые 25 строк
            if i % 25 == 0:
                pd.DataFrame(rows_out, columns=OUTPUT_COLUMNS).to_csv(
                    args.output, index=False, sep=";", encoding="utf-8-sig"
                )
                log.info("checkpoint CSV → %s", args.output)
    finally:
        if vj_browser is not None:
            vj_browser.close()

    out_df = pd.DataFrame(rows_out, columns=OUTPUT_COLUMNS)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    out_df.to_csv(args.output, index=False, sep=";", encoding="utf-8-sig")
    log.info("Готово: %s (%s строк)", args.output, len(out_df))

    # Краткая статистика источников
    if "Источник данных" in out_df.columns:
        log.info("Источники:\n%s", out_df["Источник данных"].value_counts().to_string())
    return 0


if __name__ == "__main__":
    sys.exit(main())
