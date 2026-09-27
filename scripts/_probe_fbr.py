# -*- coding: utf-8 -*-
import re
from pathlib import Path
from collections import Counter

text = Path(r"c:\Users\omen1\ankas-ecommerce\src\data\products.ts").read_text(
    encoding="utf-8", errors="replace"
)

# Extract product objects roughly by splitting on "{\n    id:"
parts = re.split(r"\n  \{\n", text)
fbr = []
for p in parts:
    if 'brand: "FBR"' not in p and "brand: 'FBR'" not in p:
        # also Vanjord misspellings not relevant
        if re.search(r'brand:\s*"FBR"', p) is None:
            continue
    sku = re.search(r'sku:\s*"([^"]+)"', p)
    name = re.search(r'name:\s*"([^"]+)"', p)
    slug = re.search(r'slug:\s*"([^"]+)"', p)
    cat = re.search(r'categorySlug:\s*"([^"]+)"', p)
    sub = re.search(r'subCategorySlug:\s*"([^"]+)"', p)
    price = re.search(r'priceRub:\s*(\d+|undefined)', p)
    image = re.search(r'image:\s*"([^"]*)"', p)
    if not name:
        continue
    fbr.append({
        "sku": sku.group(1) if sku else "",
        "name": name.group(1),
        "slug": slug.group(1) if slug else "",
        "categorySlug": cat.group(1) if cat else "",
        "subCategorySlug": sub.group(1) if sub else "",
        "priceRub": None if not price or price.group(1) == "undefined" else int(price.group(1)),
        "image": image.group(1) if image else "",
    })

print("FBR products", len(fbr))
print("by subCategory", Counter(x["subCategorySlug"] for x in fbr))
print("by category", Counter(x["categorySlug"] for x in fbr))
print("\n--- samples ---")
for x in fbr[:40]:
    print(f"{x['sku']}\t{x['name']}")

# Look for + and TC/TL/CT patterns
plus = [x for x in fbr if "+" in x["name"]]
print("\nwith + in name", len(plus))
for x in plus[:25]:
    print(x["name"])

tc = [x for x in fbr if re.search(r"\bTC\b", x["name"])]
tl = [x for x in fbr if re.search(r"\bTL\b", x["name"])]
ct = [x for x in fbr if "-CT" in x["name"] or " CT" in x["name"]]
print("TC", len(tc), "TL", len(tl), "CT", len(ct))

# Suggested series key: strip after + and tube length markers
def series_key(name: str) -> str:
    n = name.strip()
    # remove FBR prefix for grouping display? keep in series name
    base = n.split("+", 1)[0].strip()
    base = re.sub(r"\s+(TC|TL)\b", "", base, flags=re.I).strip()
    return base

keys = Counter(series_key(x["name"]) for x in fbr)
print("\n--- top series keys ---")
for k, c in keys.most_common(40):
    print(c, k)
