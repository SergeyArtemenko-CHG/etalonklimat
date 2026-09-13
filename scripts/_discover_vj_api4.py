# -*- coding: utf-8 -*-
import re, urllib.request
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36"
html = urllib.request.urlopen(
    urllib.request.Request("https://vandjord.com/product_selection/", headers={"User-Agent": UA}),
    timeout=90,
).read().decode("utf-8", "replace")

# find app mount
for marker in ['id="app"', "id='app'", "productselection", "ProductSelection", "vue", "createApp", "mount("]:
    print(marker, html.find(marker))

idx = html.find('id="app"')
chunk = html[idx:idx+150000] if idx >= 0 else html
open(r"c:\Users\omen1\ankas-ecommerce\scripts\_vj_app.html", "w", encoding="utf-8").write(chunk[:80000])

# search in chunk
for pat in [
    r'fetch\s*\(\s*["\']([^"\']+)["\']',
    r'axios\.(?:get|post)\s*\(\s*["\']([^"\']+)["\']',
    r'["\'](/[^"\']*\.php[^"\']*)["\']',
    r'action\s*:\s*["\']([^"\']+)["\']',
    r'mode\s*:\s*["\']([^"\']+)["\']',
    r'apiUrl\s*[=:]\s*["\']([^"\']+)["\']',
    r'endpoint\s*[=:]\s*["\']([^"\']+)["\']',
    r'bitrix/services/main/ajax\.php[^"\']*',
    r'c:vandjord[^"\']*',
    r'productselection[^"\']*ajax[^"\']*',
]:
    found = sorted(set(re.findall(pat, chunk, flags=re.I)))
    if found:
        print("\nPAT", pat[:50], len(found))
        for f in found[:30]:
            print(" ", f[:200])

# title-search-input-fixed context
i = html.find("title-search-input")
print("\ntitle-search", i)
if i >= 0:
    print(html[i-200:i+400])

# product selection component params in bitrix
for m in re.finditer(r'BX\.(?:message|ajax|bitrix)[^\n]{0,200}', chunk):
    print("BX", m.group(0)[:200])
