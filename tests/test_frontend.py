"""
Frontend Integration Tests for RF TOOLS Web Application
"""

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_frontend_html_root():
    res = client.get("/", headers={"Accept": "text/html"})
    assert res.status_code == 200
    assert "text/html" in res.headers["content-type"]
    assert "RF TOOLS" in res.text
    assert "app-shell" in res.text

def test_frontend_json_root():
    res = client.get("/", headers={"Accept": "application/json"})
    assert res.status_code == 200
    assert "application/json" in res.headers["content-type"]
    assert res.json()["status"] == "online"

def test_frontend_static_css():
    res = client.get("/static/css/tokens.css")
    assert res.status_code == 200
    assert "--color-primary" in res.text

    res2 = client.get("/static/css/components.css")
    assert res2.status_code == 200
    assert "rf-dropzone" in res2.text

    res3 = client.get("/static/css/app.css")
    assert res3.status_code == 200
    assert "app-shell" in res3.text

def test_frontend_static_js():
    res = client.get("/static/js/app.js")
    assert res.status_code == 200
    assert "App" in res.text

    res2 = client.get("/static/js/api.js")
    assert res2.status_code == 200
    assert "ApiService" in res2.text

    res3 = client.get("/static/js/components/workspace.js")
    assert res3.status_code == 200
    assert "WorkspaceComponent" in res3.text

def test_frontend_static_icons():
    res = client.get("/assets/icons/rf-logo.svg")
    assert res.status_code == 200
    assert "<svg" in res.text

    for icon in ["tool-excel-to-kml.svg", "tool-prb-kml.svg", "tool-isd-calculator.svg", "tool-geohash-to-shp.svg"]:
        res_i = client.get(f"/assets/icons/{icon}")
        assert res_i.status_code == 200
        assert "<svg" in res_i.text

def test_frontend_app_route():
    res = client.get("/app")
    assert res.status_code == 200
    assert "text/html" in res.headers["content-type"]
    assert "RF TOOLS" in res.text
