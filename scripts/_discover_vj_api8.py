# -*- coding: utf-8 -*-
import re, urllib.request
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36"
url = "https://vandjord.com/product_selection/main.js"
js = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=120).read().decode("utf-8", "replace")
print("len", len(js))
open(r"c:\Users\omen1\ankas-ecommerce\scripts\_vj_main.js", "w", encoding="utf-8").write(js)

for pat in [
    r'fetch\s*\(\s*[`"\']([^`"\']+)[`"\']',
    r'["\'](/product_selection[^"\']+)["\']',
    r'["\'](/product_selection_new[^"\']+)["\']',
    r'action\s*:\s*["\']([^"\']+)["\']',
    r'mode\s*:\s*["\']([^"\']+)["\']',
    r'article|артикул|searchBy|quickSearch|nameSearch',
]:
    if pat.startswith("article"):
        continue
    found = sorted(set(re.findall(pat, js, flags=re.I)))
    if found:
        print("\n===", pat[:50], len(found), "===")
        for f in found[:40]:
            print(f[:200])

for kw in ["article", "артикул", "searchBy", "quick", "nameSearch", "row_data", "smart_filter", "activeTab", "search", "sku", "арт"]:
    idx = 0
    n = 0
    while n < 6:
        i = js.lower().find(kw.lower(), idx)
        if i < 0:
            break
        print(f"\n--- {kw} @ {i} ---")
        print(js[max(0,i-80):i+220].replace("\n", " ")[:300])
        idx = i + len(kw)
        n += 1
