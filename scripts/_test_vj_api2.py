# -*- coding: utf-8 -*-
import json, ssl, urllib.request, urllib3
urllib3.disable_warnings()
ctx = ssl.create_default_context(); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE

def post(url, payload):
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={
        "User-Agent": "Mozilla/5.0 Chrome/122",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Referer": "https://vandjord.com/product_selection/",
        "Origin": "https://vandjord.com",
    }, method="POST")
    with urllib.request.urlopen(req, context=ctx, timeout=90) as r:
        return r.read().decode("utf-8", "replace")

def build_submit(article):
    return {
        "selectedManufacturer": "",
        "application": "",
        "equipmentTypes": [],
        "flowValue": "",
        "analogDl": "",
        "analogDlV": "",
        "analogPvikl": "",
        "analogPviklQ": "",
        "analogPw": "",
        "analogT": "",
        "selectedName": None,
        "analogRpat": "",
        "flowUnit": "м³/ч",
        "pressureValue": "",
        "pressureUnit": "м",
        "staticPressureValue": "",
        "staticPressureUnit": "м",
        "liquidValue": "Вода",
        "maxTempValue": 20,
        "concentrationValue": 1,
        "concentrationUnit": "%",
        "densityValue": "998.2",
        "densityValueV": "",
        "densityUnit": "кг/м³",
        "selectedParallelConnection": "",
        "selectedBackupPumps": "",
        "frequencyControl": False,
        "frequencyControlZon": False,
        "frequencyControlZonService": False,
        "downLoadArtFull": False,
        "count": 50,
        "page": 50,
        "tolerance": "",
        "addCustomGraph": False,
        "customGraph": None,
        "hidePrice": "",
        "hideArticle": "",
        "articleInput": article,
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

def build_row_data(article, cell_id, anal_id):
    return {
        "application": "",
        "equipmentTypes": [],
        "flowValue": "",
        "flowUnit": "м³/ч",
        "pressureValue": "",
        "pressureUnit": "м",
        "staticPressureValue": "",
        "staticPressureUnit": "м",
        "liquidValue": "Вода",
        "maxTempValue": 20,
        "concentrationValue": 1,
        "concentrationUnit": "%",
        "densityValue": "998.2",
        "densityValueV": "",
        "densityUnit": "кг/м³",
        "selectedParallelConnection": "",
        "selectedBackupPumps": "",
        "frequencyControl": False,
        "frequencyControlZon": False,
        "frequencyControlZonService": False,
        "downLoadArtFull": False,
        "count": 50,
        "page": 50,
        "tolerance": "",
        "addCustomGraph": False,
        "customGraph": None,
        "hidePrice": "",
        "hideArticle": "",
        "articleInput": article,
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
        "idIndoAnalId": anal_id,
        "selectedName": None,
        "anal": "",
        "selectedCellData": cell_id,
    }

article = "74111740"
raw = post("https://vandjord.com/product_selection/submit.php", build_submit(article))
data = json.loads(raw)
open(r"c:\Users\omen1\ankas-ecommerce\scripts\_vj_submit_sample.json","w",encoding="utf-8").write(json.dumps(data, ensure_ascii=False, indent=2))

rows = data.get("dataTableContent") or []
headers = data.get("tableHeaders") or []
print("headers count", len(headers))
for i,h in enumerate(headers):
    print(i, repr(h.get("NAME") if isinstance(h, dict) else h))
if rows:
    print("row", rows[0])
    cell = rows[0][0]
    anal = data.get("ID_ANALITICS")
    try:
        rd_raw = post("https://vandjord.com/product_selection/row_data.php", build_row_data(article, cell, anal))
        rd = json.loads(rd_raw)
        open(r"c:\Users\omen1\ankas-ecommerce\scripts\_vj_row_data_sample.json","w",encoding="utf-8").write(json.dumps(rd, ensure_ascii=False, indent=2)[:120000])
        print("row_data OK keys", len(rd))
        print("techData type", type(rd.get("techData")))
        if isinstance(rd.get("techData"), str) and rd["techData"]:
            print("techData snippet", rd["techData"][:500])
    except Exception as e:
        print("row_data ERR", e)
