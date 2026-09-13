# -*- coding: utf-8 -*-
import json, urllib.request, ssl
import urllib3
urllib3.disable_warnings()

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def post(url, payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "User-Agent": "Mozilla/5.0 Chrome/122",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Referer": "https://vandjord.com/product_selection/",
            "Origin": "https://vandjord.com",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, context=ctx, timeout=60) as r:
        return json.loads(r.read().decode("utf-8", "replace"))

# minimal payload from main.js defaults
payload = {
    "selectedManufacturer": "",
    "application": "",
    "equipmentTypes": [],
    "flowValue": "",
    "flowUnit": "m3/h",
    "pressureValue": "",
    "pressureUnit": "m",
    "staticPressureValue": "",
    "staticPressureUnit": "m",
    "liquidValue": "Вода",
    "maxTempValue": "",
    "concentrationValue": "",
    "concentrationUnit": "%",
    "densityValue": "",
    "densityValueV": "",
    "densityUnit": "kg/m3",
    "selectedParallelConnection": None,
    "selectedBackupPumps": "",
    "frequencyControl": False,
    "frequencyControlZon": False,
    "frequencyControlZonService": False,
    "downLoadArtFull": "",
    "count": 25,
    "page": 1,
    "tolerance": 0,
    "addCustomGraph": False,
    "customGraph": None,
    "hidePrice": "",
    "hideArticle": "",
    "articleInput": "74111740",
    "selectedDischargeSizes": [],
    "selectedSuctionSizes": [],
    "selectedTypeMontag": [],
    "selectedTimeWork": [],
    "selectedVsPopVikl": [],
    "selectedVsPopViklQ": [],
    "selectedPowers": [],
    "bodyMaterial": "",
    "wheelMaterial": "",
    "wheelType": "",
    "maxWorkingPressure": "",
    "maxWorkingPressureFree": "",
    "selectedSizeTypes": [],
    "selectedServiceFactor": [],
    "selectedPhaseCount": "",
    "selectedPoleCount": "",
    "activeTab": "search",
    "domenInfo": "https://vandjord.com",
}

print("submit...")
data = post("https://vandjord.com/product_selection/submit.php", payload)
print("keys", list(data.keys())[:20])
rows = data.get("dataTableContent") or []
print("rows", len(rows))
if rows:
    print("row0", rows[0][:5] if isinstance(rows[0], list) else rows[0])
    row_payload = {
        "application": "",
        "equipmentTypes": [],
        "flowValue": "",
        "flowUnit": "m3/h",
        "pressureValue": "",
        "pressureUnit": "m",
        "staticPressureValue": "",
        "staticPressureUnit": "m",
        "liquidValue": "Вода",
        "articleInput": "74111740",
        "activeTab": "search",
        "selectedCellData": rows[0][0] if isinstance(rows[0], list) else rows[0],
        "idIndoAnalId": data.get("ID_ANALITICS"),
    }
    print("row_data...")
    rd = post("https://vandjord.com/product_selection/row_data.php", row_payload)
    print("row_data keys", [k for k in rd.keys() if k in ("NAME","techData","JSON_INFO","error") or "Q" in k or "H" in k][:30])
    # dump interesting fields
    for k in sorted(rd.keys()):
        if any(x in k.lower() for x in ("tech", "name", "dn", "flow", "press", "napor", "rasch", "json")):
            v = rd[k]
            if isinstance(v, (str,int,float)) and len(str(v)) < 200:
                print(k, ":", v)
    open(r"c:\Users\omen1\ankas-ecommerce\scripts\_vj_row_data_sample.json","w",encoding="utf-8").write(json.dumps(rd, ensure_ascii=False, indent=2)[:50000])
