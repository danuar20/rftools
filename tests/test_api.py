"""
API Integration Tests for RF TOOLS FastAPI Endpoints
"""

import io
import openpyxl
from fastapi.testclient import TestClient
from backend.main import app
from backend.tools.template_generator import generate_template

client = TestClient(app)

def test_health_check():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["port"] == 5005
    assert "excel_to_kml" in data["engines"]

def test_tools_catalog():
    res = client.get("/api/v1/tools")
    assert res.status_code == 200
    tools = res.json()
    assert len(tools) == 6
    tool_ids = [t["id"] for t in tools]
    assert "excel-to-kml" in tool_ids
    assert "prb-kml" in tool_ids
    assert "isd-calculator" in tool_ids
    assert "geohash-to-shp" in tool_ids
    assert "geohash-to-latlon" in tool_ids
    assert "latlon-to-geohash" in tool_ids

def test_tool_detail():
    res = client.get("/api/v1/tools/prb-kml")
    assert res.status_code == 200
    assert res.json()["id"] == "prb-kml"

def test_template_download():
    res = client.get("/api/v1/templates/point_kml")
    assert res.status_code == 200
    assert "spreadsheetml" in res.headers["content-type"]
    assert len(res.content) > 0

def test_inspect_columns_api():
    wb_bytes, _ = generate_template("point_kml")
    files = {"file": ("Sample_Point_KML.xlsx", wb_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    res = client.post("/api/v1/inspect-columns", files=files)
    assert res.status_code == 200
    data = res.json()
    assert "columns" in data
    col_names = [c["name"] for c in data["columns"]]
    assert "LAT" in col_names
    assert "LONG" in col_names

def test_process_excel_to_kml_api():
    wb_bytes, _ = generate_template("point_kml")
    files = {"file": ("points.xlsx", wb_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    data = {"folder_name": "Test_Folder", "scale": "0.8"}
    res = client.post("/api/v1/tools/excel-to-kml/process", files=files, data=data)
    assert res.status_code == 200
    assert "kml" in res.headers["content-type"]
    assert b"<kml" in res.content

def test_process_prb_kml_api():
    wb_bytes, _ = generate_template("prb_kml")
    files = {"file": ("prb.xlsx", wb_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    data = {"color_by_metric": "DL_PRB"}
    res = client.post("/api/v1/tools/prb-kml/process", files=files, data=data)
    assert res.status_code == 200
    assert b"<Polygon" in res.content

def test_process_isd_api():
    wb_a, _ = generate_template("isd_a")
    wb_b, _ = generate_template("isd_b")
    files = {
        "file_a": ("isd_a.xlsx", wb_a, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
        "file_b": ("isd_b.xlsx", wb_b, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    }
    data = {"n_nearest": "1"}
    res = client.post("/api/v1/tools/isd-calculator/process", files=files, data=data)
    assert res.status_code == 200
    assert "spreadsheetml" in res.headers["content-type"]
    wb = openpyxl.load_workbook(io.BytesIO(res.content))
    assert "ISD_Result" in wb.sheetnames

def test_process_geohash_to_shp_api():
    wb_bytes, _ = generate_template("geohash")
    files = {"file": ("geohash.xlsx", wb_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    data = {"mode": "default"}
    res = client.post("/api/v1/tools/geohash-to-shp/process", files=files, data=data)
    assert res.status_code == 200
    assert "zip" in res.headers["content-type"]
    assert len(res.content) > 100

def test_process_geohash_to_latlon_api():
    wb_bytes, _ = generate_template("geohash")
    files = {"file": ("geohash.xlsx", wb_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    data = {"output_format": "csv"}
    res = client.post("/api/v1/tools/geohash-to-latlon/process", files=files, data=data)
    assert res.status_code == 200
    assert b"latitude" in res.content

def test_process_latlon_to_geohash_api():
    wb_bytes, _ = generate_template("latlon")
    files = {"file": ("latlon.xlsx", wb_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    data = {"precision": "7", "output_format": "csv"}
    res = client.post("/api/v1/tools/latlon-to-geohash/process", files=files, data=data)
    assert res.status_code == 200
    assert b"geohash" in res.content
