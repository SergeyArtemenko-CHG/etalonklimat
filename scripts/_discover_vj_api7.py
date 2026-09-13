# -*- coding: utf-8 -*-
import re, urllib.request
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36"

def try_url(path):
    url = "https://vandjord.com" + path
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        data = urllib.request.urlopen(req, timeout=30).read()
        print("OK", path, len(data))
        return data.decode("utf-8", "replace") if path.endswith((".js",".html",".php",".vue")) else None
    except Exception as e:
        print("ERR", path, str(e)[:60])

for p in [
    "/product_selection/app.js",
    "/product_selection/main.js",
    "/product_selection/dist/app.js",
    "/product_selection/js/app.js",
    "/product_selection/script.js",
    "/local/components/vandjord/productselection/templates/custom_new/script.js",
    "/local/components/vandjord/productselection/templates/custom_new/app.js",
    "/local/components/vandjord/productselection/templates/custom_new/bundle.js",
    "/local/components/vandjord/productselection/templates/custom_new/dist/app.js",
    "/local/components/vandjord/productselection/templates/custom_new/frontend/dist/app.js",
    "/local/components/vandjord/productselection/templates/custom_new/frontend/dist/main.js",
    "/local/components/vandjord/productselection/templates/custom_new/frontend/build/app.js",
]:
    body = try_url(p)
    if body and len(body) > 500:
        for m in re.findall(r'fetch\s*\(\s*["\']([^"\']+)["\']', body):
            print(" fetch", m)
        for m in re.findall(r'["\'](/[^"\']*ajax[^"\']*)["\']', body, flags=re.I):
            print(" ajax", m)

html = urllib.request.urlopen(
    urllib.request.Request("https://vandjord.com/product_selection/", headers={"User-Agent": UA}),
    timeout=90,
).read().decode("utf-8", "replace")

# extract full vue app section - from id="app" to end of component
start = html.find('id="app"')
end = html.find("</div><!-- end component", start)
if end < 0:
    end = start + 200000
chunk = html[start:end]
print("\nchunk len", len(chunk))
open(r"c:\Users\omen1\ankas-ecommerce\scripts\_vj_vue_chunk.html", "w", encoding="utf-8").write(chunk)

for kw in ["fetch(", "axios", "ajax", "searchArticle", "searchBy", "getProduct", "article", "артикул", "bitrix/services", "/api/", "sessid", "action:"]:
    if kw in chunk.lower() or kw in chunk:
        print("FOUND kw", kw, chunk.lower().count(kw.lower()))

# find script after app div
scripts_after = html[start:]
for m in re.finditer(r"<script[^>]*>(.*?)</script>", scripts_after[:100000], flags=re.I|re.S):
    b = m.group(1)
    if "createApp" in b or "Vue" in b or "fetch" in b or "axios" in b or "activeTab" in b:
        print("\nVUE SCRIPT len", len(b))
        print(b[:4000])
