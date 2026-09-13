# -*- coding: utf-8 -*-
import re, urllib.request
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36"

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8", "replace")

# list likely module files
base = "https://vandjord.com/local/components/vandjord/productselection/templates/custom_new/frontend/src/js/"
for name in [
    "modules/App.js", "modules/app.js", "modules/Main.js", "modules/main.js",
    "modules/ProjectApp.js", "modules/projectApp.js", "modules/Store.js",
    "modules/SearchByName.js", "modules/SearchByArticle.js", "modules/ArticleSearch.js",
    "modules/ProductSearch.js", "modules/ApiService.js", "modules/Http.js",
    "modules/Fetch.js", "modules/Data.js", "modules/Selection.js",
    "modules/TabSearch.js", "modules/SearchTab.js", "modules/QuickSearch.js",
    "modules/AnalogSearch.js", "modules/ExtendedSearch.js",
    "app.js", "main.js", "bundle.js", "script.js",
]:
    url = base + name
    try:
        body = fetch(url)
        print("OK", name, len(body))
        for m in re.findall(r'(?:fetch|axios|\.get|\.post|XMLHttpRequest|/bitrix/|ajax|php\?)[^\n]{0,120}', body, flags=re.I):
            print(" ", m[:150])
    except Exception as e:
        pass

# read d3.js wrapper maybe imports other files
for p in [
    "/local/components/vandjord/productselection/templates/custom_new/d3.js",
    "/product_selection/style.css",
]:
    try:
        body = fetch("https://vandjord.com" + p)
        print("FILE", p, len(body))
        for m in re.findall(r'/local/components/vandjord/productselection[^"\']+', body):
            print(" ref", m)
    except Exception as e:
        print("ERR", p, e)

# grep product_selection html for fetch/ajax endpoints in inline vue
html = fetch("https://vandjord.com/product_selection/")
for m in re.findall(r'(?:fetch|axios|BX\.ajax|\.post|\.get)\([^\)]{0,200}', html):
    print("INLINE", m[:200])
for m in re.findall(r'["\']([^"\']*productselection[^"\']*)["\']', html, flags=re.I):
    print("PS", m[:200])
for m in re.findall(r'bitrix/services/main/ajax\.php[^"\']*', html):
    print("BXAJAX", m[:200])
