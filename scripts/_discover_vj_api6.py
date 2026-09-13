# -*- coding: utf-8 -*-
import re, urllib.request
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36"
url = "https://vandjord.com/local/components/vandjord/productselection/templates/custom_new/frontend/src/js/modules/D3js.js?v=25"
js = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=120).read().decode("utf-8", "replace")
print("len", len(js))
for kw in ["fetch(", "axios", "/ajax", "bitrix", "product_selection", "search", "article", "артикул", "sessid", "action", "php", "XMLHttpRequest", "api/"]:
    idx = 0
    n = 0
    while n < 8:
        i = js.find(kw, idx)
        if i < 0:
            break
        print(f"\n--- {kw} @ {i} ---")
        print(js[max(0,i-60):i+180].replace("\n", " ")[:240])
        idx = i + len(kw)
        n += 1

# all URL-like strings with vandjord or php
for m in sorted(set(re.findall(r'["\'](/[^"\']{5,120})["\']', js))):
    if any(k in m.lower() for k in ("ajax", "php", "api", "search", "select", "product", "bitrix")):
        print("URL", m)
