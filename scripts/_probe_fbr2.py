# -*- coding: utf-8 -*-
import re
from pathlib import Path
from collections import Counter, defaultdict

text = Path(r"c:\Users\omen1\ankas-ecommerce\src\data\products.ts").read_text(
    encoding="utf-8", errors="replace"
)
parts = re.split(r"\n  \{\n", text)
fbr = []
for p in parts:
    if not re.search(r'brand:\s*"FBR"', p):
        continue
    sku = re.search(r'sku:\s*"([^"]+)"', p)
    name = re.search(r'name:\s*"([^"]+)"', p)
    slug = re.search(r'slug:\s*"([^"]+)"', p)
    sub = re.search(r'subCategorySlug:\s*"([^"]+)"', p)
    price = re.search(r'priceRub:\s*(\d+|undefined)', p)
    image = re.search(r'image:\s*"([^"]*)"', p)
    power_min = re.search(r'burnerPowerMin:\s*([\d.]+|undefined)', p)
    power_max = re.search(r'burnerPowerMax:\s*([\d.]+|undefined)', p)
    if not name:
        continue
    fbr.append({
        "sku": sku.group(1) if sku else "",
        "name": name.group(1),
        "slug": slug.group(1) if slug else "",
        "sub": sub.group(1) if sub else "",
        "priceRub": None if not price or price.group(1) == "undefined" else int(price.group(1)),
        "image": image.group(1) if image else "",
        "powerMin": None if not power_min or power_min.group(1)=="undefined" else float(power_min.group(1)),
        "powerMax": None if not power_max or power_max.group(1)=="undefined" else float(power_max.group(1)),
    })

# Extract FBR model core: after "FBR "
def parse_mod(name: str):
    n = name.strip()
    # strip leading product type words
    n2 = re.sub(r"^Горелка\s+(газовая|комбинированная|дизельная|ж/т|мазутная)\s+", "", n, flags=re.I)
    # split ramp
    if "+" in n2:
        left, ramp = n2.split("+", 1)
        ramp = ramp.strip().rstrip("\\").strip()
    else:
        left, ramp = n2, ""
    left = left.strip()
    # tube length
    tube = None
    m = re.search(r"\b(TC|TL)\b", left, flags=re.I)
    if m:
        tube = m.group(1).upper()
        left_wo = re.sub(r"\b(TC|TL)\b", " ", left, flags=re.I)
        left_wo = re.sub(r"\s+", " ", left_wo).strip()
    else:
        left_wo = left
    # leak control from ramp
    leak = "CT" if re.search(r"(?:^|[\s\-])CT(?:$|[\s\-])|-CT\b", ramp, flags=re.I) else "NO_CT"
    # series: FBR + model family without TC/TL
    # Prefer compact: GAS P 150, GAS P 100/2, GAS XP 60/M
    series = left_wo
    series = re.sub(r"^FBR\s+", "FBR ", series, flags=re.I)
    return {
        "seriesRaw": series,
        "tube": tube,
        "ramp": ramp,
        "leak": leak,
        "left": left,
    }

# Focus gas GAS P*
gas_p = [x for x in fbr if re.search(r"\bGAS\s*P\b", x["name"], re.I)]
print("GAS P count", len(gas_p))

# Series key proposal A: remove TC/TL and everything after +, keep CE/EVO/EL
# Series key proposal B: extract GAS P <num>(/<2|M>)?
def series_b(name):
    m = re.search(r"FBR\s+(GAS\s*P\s*\d+(?:\s*/\s*[2M])?)", name, re.I)
    if m:
        s = re.sub(r"\s+", " ", m.group(1).upper().replace("GAS P", "GAS P ").replace("  ", " "))
        s = re.sub(r"GAS\s*P\s*", "GAS P ", s)
        s = re.sub(r"\s*/\s*", "/", s).strip()
        return s
    parsed = parse_mod(name)
    # fallback shorter
    s = parsed["seriesRaw"]
    s = re.sub(r"\b(CE|EVO|EL|MEC|EVO2)\b", " ", s, flags=re.I)
    s = re.sub(r"\s+", " ", s).strip()
    return s

c = Counter(series_b(x["name"]) for x in gas_p)
print("GAS P series B")
for k,v in c.most_common(30):
    print(v, k)

# detail GAS P 150
p150 = [x for x in gas_p if re.search(r"GAS\s*P\s*150\b", x["name"], re.I)]
print("\nGAS P 150", len(p150))
for x in p150[:20]:
    pm = parse_mod(x["name"])
    print(x["sku"], "|", pm["tube"], "|", pm["leak"], "|", pm["ramp"], "|", x["name"][:90])

# slugify test
def slugify(series: str) -> str:
    s = series.lower()
    s = s.replace("ё","e")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return "gorelki-fbr-" + s.strip("-")

print("\nslug examples:")
for k,_ in c.most_common(10):
    print(slugify(k), "<-", k)
