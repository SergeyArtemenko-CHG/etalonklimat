#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Группировка насосов Vandjord по «Родительская Серия».

Вход:  data/nomenclature/updated_pumps_base.csv
Выход: src/data/pumps_catalog_tree.json

Запуск:
  python scripts/build_pumps_catalog_tree.py
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any, Optional

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "data" / "nomenclature" / "updated_pumps_base.csv"
DEFAULT_OUTPUT = ROOT / "src" / "data" / "pumps_catalog_tree.json"

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
    raw = re.sub(r"[^a-z0-9]+", "-", raw)
    raw = re.sub(r"-+", "-", raw).strip("-")
    return f"nasosy-vandjord-{raw}" if raw else "nasosy-vandjord-series"


def parse_num(value: Any) -> Optional[float]:
    if value is None:
        return None
    text = str(value).strip().replace("\xa0", " ").replace(" ", "")
    if not text or text.lower() in {"nan", "none", "-", ""}:
        return None
    text = text.replace(",", ".")
    m = re.search(r"-?\d+(?:\.\d+)?", text)
    if not m:
        return None
    try:
        return float(m.group(0))
    except ValueError:
        return None


def parse_price(value: Any) -> Optional[float]:
    if value is None:
        return None
    text = str(value).strip().replace("\xa0", " ")
    text = re.sub(r"[^\d,.\-]", "", text).replace(",", ".")
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def parse_in_stock(value: Any) -> bool:
    """Наличие: 1 / true / да → True; иначе False."""
    if value is None:
        return False
    text = str(value).strip().lower().replace(",", ".")
    if not text or text in {"nan", "none", "-", ""}:
        return False
    if text in {"1", "1.0", "true", "yes", "да", "в наличии"}:
        return True
    try:
        return float(text) == 1.0
    except ValueError:
        return False


def resolve_photo_path(value: Any) -> str:
    """
    Имя файла из CSV (CRV.jpeg) → публичный путь /images/products/CRV.webp.
    На сайте картинки продуктов в webp.
    """
    raw = str(value or "").strip().replace("\\", "/")
    if not raw or raw.lower() in {"nan", "none", "-", ""}:
        return ""
    name = raw.split("/")[-1]
    stem = re.sub(r"\.(jpe?g|png|gif|webp|bmp)$", "", name, flags=re.I)
    if not stem:
        return ""
    return f"/images/products/{stem}.webp"


def unique_sorted_nums(values: list[Optional[float]]) -> list[float]:
    out = sorted({v for v in values if v is not None})
    return out


def load_csv(path: Path):
    try:
        import pandas as pd
    except ImportError as exc:
        raise SystemExit(
            "Нужен pandas: pip install pandas"
        ) from exc

    for enc in ("utf-8-sig", "cp1251", "utf-8"):
        try:
            return pd.read_csv(path, sep=";", encoding=enc, dtype=str, engine="python")
        except UnicodeDecodeError:
            continue
    return pd.read_csv(path, sep=";", encoding="utf-8-sig", dtype=str, engine="python")


def build_tree(df) -> dict[str, Any]:
    cols = {re.sub(r"\s+", " ", str(c)).strip(): c for c in df.columns}

    def col(*aliases: str) -> Optional[str]:
        for a in aliases:
            for name, original in cols.items():
                if a.lower() in name.lower():
                    return original
        return None

    c_sku = col("Артикул")
    c_name = col("Оригинальное название", "Номенклатура")
    c_series = col("Родительская Серия")
    c_price = col("Цена", "Столбец1")
    c_power = col("Мощность")
    c_flow = col("расход")
    c_head = col("напор")
    c_dn = col("DN", "Диаметр")
    c_poles = col("Полюса")
    c_source = col("Источник")
    c_stock = col("Наличие")
    c_photo = col("Фото", "картин", "image", "файл картинки")

    if not c_sku or not c_series:
        raise SystemExit(f"Нет колонок Артикул / Родительская Серия. Есть: {list(df.columns)}")

    # Excel иногда переименовывает «Цена» → «Столбец1»
    if c_price is None and "Столбец1" in cols:
        c_price = cols["Столбец1"]

    groups: dict[str, list[dict[str, Any]]] = defaultdict(list)

    for _, row in df.iterrows():
        series = str(row.get(c_series) or "").strip()
        sku = str(row.get(c_sku) or "").strip()
        if not series or not sku:
            continue

        groups[series].append(
            {
                "sku": sku,
                "name": str(row.get(c_name) or "").strip() if c_name else "",
                "priceRub": parse_price(row.get(c_price)) if c_price else None,
                "powerKw": parse_num(row.get(c_power)) if c_power else None,
                "flowM3h": parse_num(row.get(c_flow)) if c_flow else None,
                "headM": parse_num(row.get(c_head)) if c_head else None,
                "dnMm": parse_num(row.get(c_dn)) if c_dn else None,
                "polesRpm": str(row.get(c_poles) or "").strip() if c_poles else "",
                "source": str(row.get(c_source) or "").strip() if c_source else "",
                "inStock": parse_in_stock(row.get(c_stock)) if c_stock else False,
                "image": resolve_photo_path(row.get(c_photo)) if c_photo else "",
            }
        )

    series_list: list[dict[str, Any]] = []
    for series_name in sorted(groups.keys(), key=lambda s: s.lower()):
        mods = groups[series_name]
        mods.sort(
            key=lambda m: (
                m["headM"] is None,
                m["headM"] if m["headM"] is not None else 0,
                m["flowM3h"] is None,
                m["flowM3h"] if m["flowM3h"] is not None else 0,
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
                    "headM": unique_sorted_nums([m["headM"] for m in mods]),
                    "flowM3h": unique_sorted_nums([m["flowM3h"] for m in mods]),
                    "powerKw": unique_sorted_nums([m["powerKw"] for m in mods]),
                    "dnMm": unique_sorted_nums([m["dnMm"] for m in mods]),
                },
                "priceMin": min(
                    (m["priceRub"] for m in mods if m["priceRub"] is not None),
                    default=None,
                ),
                "priceMax": max(
                    (m["priceRub"] for m in mods if m["priceRub"] is not None),
                    default=None,
                ),
                "models": mods,
            }
        )

    return {
        "brand": "Vandjord",
        "version": 1,
        "generatedFrom": "data/nomenclature/updated_pumps_base.csv",
        "seriesCount": len(series_list),
        "modelCount": sum(s["modelCount"] for s in series_list),
        "series": series_list,
    }


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Дерево каталога насосов Vandjord")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args(argv)

    if not args.input.exists():
        raise SystemExit(f"Нет файла: {args.input}")

    df = load_csv(args.input)
    tree = build_tree(df)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(tree, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(
        f"OK → {args.output} "
        f"({tree['seriesCount']} серий, {tree['modelCount']} моделей)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
