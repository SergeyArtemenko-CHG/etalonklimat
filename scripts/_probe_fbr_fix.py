# -*- coding: utf-8 -*-
import re
from pathlib import Path
import pandas as pd

text = Path(r"c:\Users\omen1\ankas-ecommerce\src\data\products.ts").read_text(
    encoding="utf-8", errors="replace"
)
idx = text.find("GAS P 100/2 CE TC EVO")
print("products.ts snippet:", repr(text[idx : idx + 120]))

# Find product object for sku
m = re.search(
    r'\{[^{}]*?sku:\s*"002365R057035"[^{}]*?\}',
    text,
    flags=re.S,
)
# better: find by sku then take window
i = text.find('sku: "002365R057035"')
print("sku idx", i)
print(text[i - 200 : i + 900])

csv = pd.read_csv(
    r"c:\Users\omen1\ankas-ecommerce\data\nomenclature\Burners_boilers.csv",
    sep=";",
    encoding="cp1251",
    dtype=str,
)
row = csv[csv["Артикул"].astype(str).str.strip() == "002365R057035"]
print("\nCSV row:")
if len(row):
    r = row.iloc[0]
    print("name", repr(r["Номенклатура"]))
    print("priceEur", r.get("*Цена Евро"), "priceRub", r.get("*Цена РУБ"))
    print("power min", r.get("*Мощность горелки, кВт МИН"), "max", r.get("*Мощность горелки, кВт МАКС"))

# stats on trailing backslash in CSV names
names = csv["Номенклатура"].fillna("").astype(str)
print("csv names ending with \\", int(names.str.endswith("\\").sum()))
print("sample", [repr(n) for n in names[names.str.contains(r"\+", regex=True)].head(5)])

# burners tree stats
import json
tree = json.loads(
    Path(r"c:\Users\omen1\ankas-ecommerce\src\data\burners_catalog_tree.json").read_text(
        encoding="utf-8"
    )
)
prices = [m.get("priceRub") for s in tree["series"] for m in s["models"]]
powers = [m.get("powerMin") for s in tree["series"] for m in s["models"]]
print("tree price non-null", sum(1 for p in prices if p is not None), "/", len(prices))
print("tree powerMin non-null", sum(1 for p in powers if p is not None), "/", len(powers))
print("name sample", tree["series"][20]["models"][0]["name"] if tree["series"] else None)
