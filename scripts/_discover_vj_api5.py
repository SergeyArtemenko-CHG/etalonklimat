# -*- coding: utf-8 -*-
import re, urllib.request
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36"
html = urllib.request.urlopen(
    urllib.request.Request("https://vandjord.com/product_selection/", headers={"User-Agent": UA}),
    timeout=90,
).read().decode("utf-8", "replace")

# All script src from vandjord component
for m in re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', html, flags=re.I):
    if "vandjord" in m or "product_selection" in m or "selection" in m.lower():
        print("SCRIPT", m)

# inline scripts mentioning search/article/sku
blocks = re.findall(r"<script[^>]*>(.*?)</script>", html, flags=re.I | re.S)
print("script blocks", len(blocks))
for i, b in enumerate(blocks):
    low = b.lower()
    if any(k in low for k in ("productselection", "артикул", "search", "ajax", "fetch(", "axios", "api", "vue.", "createapp", "mount", "action")):
        if len(b) > 50:
            print(f"\n=== BLOCK {i} len {len(b)} ===")
            print(b[:2500])

# component include path
for m in re.findall(r'/local/components/vandjord/productselection[^"\']*', html):
    print("COMP", m)

# data attributes on app root
idx = html.find('id="app"')
if idx >= 0:
    print("\nAPP SNIPPET:")
    print(html[idx:idx+8000])
