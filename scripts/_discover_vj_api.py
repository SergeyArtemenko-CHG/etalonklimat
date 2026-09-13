# -*- coding: utf-8 -*-
"""Discover VJ Select API endpoints from vandjord.com."""
import re
import urllib.request

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8", "replace")

html = fetch("https://vandjord.com/product_selection/")
print("html", len(html))

# inline scripts with ajax/api
for pat in [
    r'["\'](/[^"\']*(?:ajax|api|productselection|product_selection)[^"\']*)["\']',
    r'fetch\s*\(\s*["\']([^"\']+)["\']',
    r'\.(?:get|post)\s*\(\s*["\']([^"\']+)["\']',
    r'action[=:]\s*["\']([^"\']+)["\']',
]:
    found = set(re.findall(pat, html, flags=re.I))
    for x in sorted(found):
        if any(k in x.lower() for k in ("ajax", "api", "select", "search", "product")):
            print("HTML:", x[:200])

# download index.js from component
paths = [
    "/local/components/vandjord/productselection/templates/custom_new/frontend/src/js/index.js",
    "/local/components/vandjord/productselection/templates/custom_new/frontend/src/js/modules/Api.js",
    "/local/components/vandjord/productselection/templates/custom_new/frontend/src/js/modules/api.js",
    "/local/components/vandjord/productselection/templates/custom_new/frontend/src/js/modules/Search.js",
    "/local/components/vandjord/productselection/templates/custom_new/frontend/src/js/modules/Request.js",
    "/local/components/vandjord/productselection/ajax.php",
    "/local/components/vandjord/productselection/templates/custom_new/ajax.php",
    "/ajax/product_selection.php",
    "/bitrix/services/main/ajax.php",
]
for p in paths:
    try:
        body = fetch("https://vandjord.com" + p)
        print("OK", p, "len", len(body))
        open(rf"c:\Users\omen1\ankas-ecommerce\scripts\_vj_{p.replace('/','_')}", "w", encoding="utf-8").write(body[:200000])
        for m in re.findall(r'["\'](/[^"\']*(?:ajax|api|php)[^"\']*)["\']', body):
            print("  ->", m[:150])
        for m in re.findall(r'https?://[^"\']+', body):
            if "vandjord" in m or "ajax" in m:
                print("  ABS", m[:150])
    except Exception as e:
        print("ERR", p, type(e).__name__, str(e)[:80])
