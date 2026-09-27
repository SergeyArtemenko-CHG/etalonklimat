#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Группировка горелок FBR по сериям.

Источник: data/nomenclature/Burners_boilers.csv (+ Burners_ExEco.csv при наличии FBR)
Выход:   src/data/burners_catalog_tree.json

Запуск:
  python scripts/build_burners_catalog_tree.py
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any, Optional
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
NOMENCLATURE = ROOT / "data" / "nomenclature"
DEFAULT_OUTPUT = ROOT / "src" / "data" / "burners_catalog_tree.json"
REDIRECTS_OUTPUT = ROOT / "src" / "data" / "fbr_product_redirects.json"
PRODUCTS_TS = ROOT / "src" / "data" / "products.ts"
PRODUCTS_IMAGES = ROOT / "public" / "images" / "products"

TRANSLIT = {
    "А": "A", "а": "a", "Б": "B", "б": "b", "В": "V", "в": "v", "Г": "G", "г": "g",
    "Д": "D", "д": "d", "Е": "E", "е": "e", "Ё": "E", "ё": "e", "Ж": "Zh", "ж": "zh",
    "З": "Z", "з": "z", "И": "I", "и": "i", "Й": "I", "й": "i", "К": "K", "к": "k",
    "Л": "L", "л": "l", "М": "M", "м": "m", "Н": "N", "н": "n", "О": "O", "о": "o",
    "П": "P", "п": "p", "Р": "R", "р": "r", "С": "S", "с": "s", "Т": "T", "т": "t",
    "У": "U", "у": "u", "Ф": "F", "ф": "f", "Х": "Kh", "х": "kh", "Ц": "Ts", "ц": "ts",
    "Ч": "Ch", "ч": "ch", "Ш": "Sh", "ш": "sh", "Щ": "Shch", "щ": "shch",
    "Ы": "Y", "ы": "y", "Э": "E", "э": "e", "Ю": "Yu", "ю": "yu", "Я": "Ya", "я": "ya",
    "Ь": "", "ь": "", "Ъ": "", "ъ": "",
}


def slugify_series(series: str) -> str:
    raw = "".join(TRANSLIT.get(ch, ch) for ch in (series or "").strip())
    raw = raw.lower()
    raw = re.sub(r"\bgas\s*p\s*", "gas-p", raw)
    raw = re.sub(r"\bgas\s*xp\s*", "gas-xp", raw)
    raw = re.sub(r"\bgas\s*x\s*", "gas-x", raw)
    raw = re.sub(r"[^a-z0-9]+", "-", raw)
    raw = re.sub(r"-+", "-", raw).strip("-")
    if raw.startswith("fbr-"):
        raw = raw[4:]
    return f"gorelki-fbr-{raw}" if raw else "gorelki-fbr-series"


def slugify_product(name: str, sku: str) -> str:
    raw = "".join(TRANSLIT.get(ch, ch) for ch in (name or "").strip())
    raw = raw.lower()
    raw = re.sub(r"[^a-z0-9]+", "-", raw).strip("-")
    return raw or re.sub(r"[^a-z0-9]+", "-", sku.lower()).strip("-") or "item"


def parse_num(value: Any) -> Optional[float]:
    if value is None:
        return None
    text = str(value).strip().replace("\xa0", " ").replace(" ", "").replace(",", ".")
    if not text or text.lower() in {"nan", "none", "-", ""}:
        return None
    m = re.search(r"-?\d+(?:\.\d+)?", text)
    if not m:
        return None
    try:
        return float(m.group(0))
    except ValueError:
        return None


def unique_sorted(values: list[str]) -> list[str]:
    return sorted({v for v in values if v}, key=lambda s: s.lower())


def find_col(columns: list[str], *aliases: str) -> Optional[str]:
    normalized = {re.sub(r"\s+", " ", str(c)).strip().lstrip("*"): c for c in columns}
    for a in aliases:
        for name, original in normalized.items():
            if a.lower() in name.lower():
                return original
    return None


def resolve_image(filename: Any) -> str:
    raw = str(filename or "").strip().replace("\\", "/")
    if not raw or raw.lower() in {"nan", "none"}:
        return ""
    name = raw.split("/")[-1]
    stem = re.sub(r"\.(jpe?g|png|gif|webp|bmp)$", "", name, flags=re.I)
    if not stem:
        return ""
    webp = PRODUCTS_IMAGES / f"{stem}.webp"
    if webp.exists():
        return f"/images/products/{stem}.webp"
    # try sanitized stem like generate script
    alt = re.sub(r"[^\w\-]+", "_", stem)
    if (PRODUCTS_IMAGES / f"{alt}.webp").exists():
        return f"/images/products/{alt}.webp"
    return f"/images/products/{stem}.webp"


def parse_burner_name(name: str) -> dict[str, Any]:
    """Полное имя не трогаем для отображения; series/ramp/tube — отдельно."""
    raw = re.sub(r"\s+", " ", (name or "").strip())
    # убрать только мусорный хвостовой одиночный backslash из битых выгрузок
    raw = raw.rstrip("\\").strip()

    fuel = ""
    m_fuel = re.match(
        r"^Горелка\s+(газовая|комбинированная|дизельная|ж/т|мазутная)\s+",
        raw,
        flags=re.I,
    )
    if m_fuel:
        fuel = m_fuel.group(1)
        body = raw[m_fuel.end() :].strip()
    else:
        body = raw

    if "+" in body:
        left, ramp = body.split("+", 1)
        left = left.strip()
        ramp = ramp.strip()
    else:
        left, ramp = body, ""

    tube = ""
    m_tube = re.search(r"\b(TC|TL)\b", left, flags=re.I)
    if m_tube:
        tube = m_tube.group(1).upper()
        series_left = re.sub(r"\b(TC|TL)\b", " ", left, flags=re.I)
        series_left = re.sub(r"\s+", " ", series_left).strip()
    else:
        series_left = left

    series = re.sub(r"^FBR\s+", "", series_left, flags=re.I).strip()
    series = re.sub(r"\s+", " ", series)
    leak = bool(re.search(r"(?:-CT\b)|(?:\bCT\b)", ramp, flags=re.I))

    return {
        "series": series or "FBR",
        "tubeLength": tube,
        "ramp": ramp,
        "leakControl": leak,
        "fuelTypeLabel": fuel,
        "displayName": raw,
    }


def load_fbr_rows() -> list[dict[str, Any]]:
    try:
        import pandas as pd
    except ImportError as exc:
        raise SystemExit("Нужен pandas") from exc

    files = [
        NOMENCLATURE / "Burners_boilers.csv",
        NOMENCLATURE / "Burners_ExEco.csv",
    ]
    frames = []
    for path in files:
        if not path.exists():
            continue
        df = None
        for enc in ("cp1251", "utf-8-sig", "utf-8"):
            try:
                df = pd.read_csv(path, sep=";", encoding=enc, dtype=str, engine="python")
                break
            except UnicodeDecodeError:
                continue
        if df is None:
            continue
        df["__source"] = path.name
        frames.append(df)

    if not frames:
        raise SystemExit("Нет CSV горелок в data/nomenclature/")

    import pandas as pd

    df = pd.concat(frames, ignore_index=True)
    cols = list(df.columns)
    c_sku = find_col(cols, "Артикул")
    c_name = find_col(cols, "Номенклатура")
    c_brand = find_col(cols, "Бренд")
    c_cat = find_col(cols, "Вид номенклатуры")
    c_sub = find_col(cols, "Подвид")
    c_price_eur = find_col(cols, "Цена Евро")
    c_price_rub = find_col(cols, "Цена РУБ")
    c_power_min = find_col(cols, "Мощность горелки, кВт МИН", "Мощность горелки мин")
    c_power_max = find_col(cols, "Мощность горелки, кВт МАКС", "Мощность горелки макс")
    c_image = find_col(cols, "Файл картинки")
    c_stock = find_col(cols, "Наличие")
    c_lead = find_col(cols, "Срок поставки")

    if not c_sku or not c_name or not c_brand:
        raise SystemExit(f"Нет нужных колонок. Есть: {cols}")

    out: list[dict[str, Any]] = []
    seen: set[str] = set()
    for _, row in df.iterrows():
        brand = str(row.get(c_brand) or "").strip()
        if brand.upper() != "FBR":
            continue
        sku = str(row.get(c_sku) or "").strip()
        name = str(row.get(c_name) or "").strip()
        if not sku or not name or name.lower() == "nan":
            continue
        if sku in seen:
            continue
        seen.add(sku)

        stock_raw = str(row.get(c_stock) or "").strip() if c_stock else ""
        in_stock = stock_raw in {"1", "1.0", "true", "да", "Да"}

        out.append(
            {
                "sku": sku,
                "name": name,
                "productSlug": slugify_product(name, sku),
                "subCategory": str(row.get(c_sub) or "").strip() if c_sub else "",
                "category": str(row.get(c_cat) or "").strip() if c_cat else "",
                "priceEur": parse_num(row.get(c_price_eur)) if c_price_eur else None,
                "priceRub": parse_num(row.get(c_price_rub)) if c_price_rub else None,
                "powerMin": parse_num(row.get(c_power_min)) if c_power_min else None,
                "powerMax": parse_num(row.get(c_power_max)) if c_power_max else None,
                "image": resolve_image(row.get(c_image)) if c_image else "",
                "inStock": in_stock,
                "leadTime": (
                    str(row.get(c_lead) or "").strip()
                    if c_lead and str(row.get(c_lead) or "").strip().lower() not in {"nan", ""}
                    else None
                ),
            }
        )
    return out


def build_tree(products: list[dict[str, Any]]) -> dict[str, Any]:
    groups: dict[str, list[dict[str, Any]]] = defaultdict(list)

    for prod in products:
        parsed = parse_burner_name(prod["name"])
        model = {
            "sku": prod["sku"],
            "name": parsed["displayName"],  # полное имя из CSV
            "productSlug": prod["productSlug"],
            "priceRub": prod["priceRub"],
            "priceEur": prod["priceEur"],
            "powerMin": prod["powerMin"],
            "powerMax": prod["powerMax"],
            "image": prod["image"],
            "inStock": prod["inStock"],
            "leadTime": prod["leadTime"],
            "subCategorySlug": "",
            "ramp": parsed["ramp"],
            "tubeLength": parsed["tubeLength"],
            "leakControl": parsed["leakControl"],
            "fuelTypeLabel": parsed["fuelTypeLabel"],
        }
        groups[parsed["series"]].append(model)

    series_list: list[dict[str, Any]] = []
    for series_name in sorted(groups.keys(), key=lambda s: s.lower()):
        mods = groups[series_name]
        mods.sort(
            key=lambda m: (
                m["tubeLength"] or "ZZ",
                0 if m["leakControl"] else 1,
                m["ramp"] or "",
                m["sku"],
            )
        )
        slug = slugify_series(series_name)
        series_list.append(
            {
                "series": series_name,
                "slug": slug,
                "path": f"/catalog/{slug}",
                "modelCount": len(mods),
                "filters": {
                    "ramp": unique_sorted([m["ramp"] for m in mods if m["ramp"]]),
                    "tubeLength": unique_sorted(
                        [m["tubeLength"] for m in mods if m["tubeLength"]]
                    ),
                    "leakControl": sorted(
                        {True if m["leakControl"] else False for m in mods}
                    ),
                },
                "priceMin": min(
                    (
                        m["priceRub"]
                        for m in mods
                        if m["priceRub"] is not None
                    ),
                    default=None,
                ),
                "priceMax": max(
                    (
                        m["priceRub"]
                        for m in mods
                        if m["priceRub"] is not None
                    ),
                    default=None,
                ),
                "priceEurMin": min(
                    (m["priceEur"] for m in mods if m["priceEur"] is not None),
                    default=None,
                ),
                "priceEurMax": max(
                    (m["priceEur"] for m in mods if m["priceEur"] is not None),
                    default=None,
                ),
                "powerMin": min(
                    (m["powerMin"] for m in mods if m["powerMin"] is not None),
                    default=None,
                ),
                "powerMax": max(
                    (m["powerMax"] for m in mods if m["powerMax"] is not None),
                    default=None,
                ),
                "image": next((m["image"] for m in mods if m["image"]), ""),
                "models": mods,
            }
        )

    return {
        "brand": "FBR",
        "version": 2,
        "generatedFrom": "data/nomenclature/Burners_*.csv",
        "seriesCount": len(series_list),
        "modelCount": sum(s["modelCount"] for s in series_list),
        "series": series_list,
    }


def build_product_redirects(tree: dict[str, Any]) -> list[dict[str, Any]]:
    """
    301-маппинг старых /product/{slug|sku} → /catalog/gorelki-fbr-…?sku=
    для next.config redirects().
    """
    redirects: list[dict[str, Any]] = []
    seen: set[str] = set()
    sku_to_dest: dict[str, str] = {}

    def add(source: str, destination: str) -> None:
        if not source or source in seen:
            return
        seen.add(source)
        redirects.append(
            {
                "source": source,
                "destination": destination,
                "permanent": True,
            }
        )

    for series in tree.get("series") or []:
        path = series.get("path") or ""
        for m in series.get("models") or []:
            sku = str(m.get("sku") or "").strip()
            if not sku or not path:
                continue
            dest = f"{path}?sku={quote(sku, safe='')}"
            sku_to_dest[sku] = dest
            product_slug = str(m.get("productSlug") or "").strip()
            if product_slug:
                add(f"/product/{product_slug}", dest)
            add(f"/product/{sku}", dest)

    # ЧПУ из products.ts (могут чуть отличаться от productSlug в дереве)
    if PRODUCTS_TS.exists():
        text = PRODUCTS_TS.read_text(encoding="utf-8")
        for m in re.finditer(
            r'sku:\s*"(?P<sku>[^"]+)"\s*,\s*slug:\s*"(?P<slug>[^"]+)"',
            text,
        ):
            dest = sku_to_dest.get(m.group("sku"))
            if dest:
                add(f"/product/{m.group('slug')}", dest)

    redirects.sort(key=lambda r: r["source"])
    return redirects


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Дерево каталога горелок FBR")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--redirects-output", type=Path, default=REDIRECTS_OUTPUT)
    args = parser.parse_args(argv)

    products = load_fbr_rows()
    tree = build_tree(products)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(tree, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    redirects = build_product_redirects(tree)
    args.redirects_output.write_text(
        json.dumps(redirects, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    priced = sum(
        1
        for s in tree["series"]
        for m in s["models"]
        if m.get("priceRub") or m.get("priceEur")
    )
    powered = sum(
        1
        for s in tree["series"]
        for m in s["models"]
        if m.get("powerMin") is not None
    )
    sample = next(
        (s for s in tree["series"] if re.search(r"GAS\s*P\s*100/2", s["series"], re.I)),
        None,
    )
    print(
        f"OK → {args.output} ({tree['seriesCount']} серий, {tree['modelCount']} моделей; "
        f"с ценой {priced}, с мощностью {powered})"
    )
    print(f"OK redirects → {args.redirects_output} ({len(redirects)} правил)")
    if sample:
        m0 = sample["models"][0]
        print("sample path", sample["path"])
        print("sample name", m0["name"])
        print(
            "sample priceEur/Rub",
            m0.get("priceEur"),
            m0.get("priceRub"),
            "power",
            m0.get("powerMin"),
            m0.get("powerMax"),
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
