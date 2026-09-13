# -*- coding: utf-8 -*-
import re, urllib.request
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36"
url = "https://vandjord.com/local/components/vandjord/productselection/templates/custom_new/d3.js"
req = urllib.request.Request(url, headers={"User-Agent": UA})
js = urllib.request.urlopen(req, timeout=120).read().decode("utf-8", "replace")
print("len", len(js))

patterns = [
    r'https?://[^"\']+',
    r'["\'](/[^"\']*(?:ajax|api|php|search|select|product)[^"\']*)["\']',
    r'action["\']?\s*[:=]\s*["\']([^"\']+)["\']',
    r'fetch\s*\([^)]{0,300}\)',
    r'\.post\s*\([^)]{0,300}\)',
    r'\.get\s*\([^)]{0,300}\)',
    r'axios[^;]{0,200}',
    r'bitrix[^;]{0,200}',
    r'артикул[^;]{0,120}',
    r'search[^;]{0,120}',
]
for pat in patterns:
    found = re.findall(pat, js, flags=re.I)
    uniq = []
    for x in found:
        s = x if isinstance(x, str) else str(x)
        if s not in uniq and len(uniq) < 40:
            uniq.append(s)
    if uniq:
        print("\n===", pat[:40], "count", len(found), "sample", len(uniq), "===")
        for u in uniq[:25]:
            print(u[:220])

# save snippets around 'ajax' or 'searchBy'
for kw in ["ajax", "searchBy", "article", "артикул", "productselection", "bitrix/services", "action:", "mode:", "sessid", "csrf"]:
    idx = 0
    hits = 0
    while hits < 5:
        i = js.lower().find(kw.lower(), idx)
        if i < 0:
            break
        print(f"\n--- {kw} @ {i} ---")
        print(js[max(0,i-80):i+200].replace("\n", " ")[:280])
        idx = i + len(kw)
        hits += 1
