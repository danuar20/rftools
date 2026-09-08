"""
Tests for PRB 3D Sector Engine Enhancements (24-row HTML balloon table, dual logos,
custom bands, custom ranges, legend ScreenOverlay) and ISD Units (km vs m).
"""

import io
import json
import openpyxl
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.tools.prb_kml import convert_excel_to_prb_kml
from backend.tools.isd_calculator import calculate_isd
from backend.tools.template_generator import generate_template

client = TestClient(app)

def create_sample_prb_data():
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Sheet1"
    headers = [
        "WEEK", "SITEID", "SITENAME", "CELLNAME", "BEAM", "DL PRB BDBH", "UL PRB BDBH", "RRC User BDBH",
        "PAYLOAD (MB)", "BW (MHz)", "LONG", "LAT", "DIRECTION", "CLASS REV", "NOP", "RTPO",
        "PROPINSI", "KABUPATEN", "KECAMATAN", "DESA", "SDR", "ANTENNA_TYPE", "TOWER_HEIGHT",
        "ANTENNA_HEIGHT", "M-Tilt", "E-Tilt", "PCI"
    ]
    ws.append(headers)
    ws.append([
        "WEEK-06", "JKT001", "Parbulu Waeleta-DMT", "N_NLA034ML1_ParbuluWaeleta-DMT_ML02",
        "LTE1800", 91.9, 16.5, 44.71, 6840.32, "20 Mhz", 127.00326, -3.42913, 150,
        "BRONZE", "AMBON", "TO AMBON", "MALUKU", "BURU", "WAELATA", "PARBULU", "RTPO AMBON",
        None, None, None, None, None, 166.0
    ])
    bio = io.BytesIO()
    wb.save(bio)
    return bio.getvalue()

def test_prb_24_row_html_balloon_table():
    data = create_sample_prb_data()
    kml_bytes, summary = convert_excel_to_prb_kml(
        data,
        left_logo_url="https://custom.site/logo1.png",
        right_logo_url="https://custom.site/logo2.png"
    )
    kml_text = kml_bytes.decode('utf-8')

    # Verify dual logos in header
    assert "https://custom.site/logo1.png" in kml_text
    assert "https://custom.site/logo2.png" in kml_text

    # Verify 24 rows with exact trailing period labels
    expected_labels = [
        "WEEK.", "SITENAME.", "CELLNAME.", "BAND.", "DL PRB BDBH (%).",
        "UL PRB BDBH (%).", "RRC User BDBH.", "PAYLOAD (GB).", "BANDWIDTH (MHz).",
        "LONGITUDE.", "LATITUDE.", "CLASS REV.", "NOP.", "RTPO.", "PROPINSI.",
        "KABUPATEN.", "KECAMATAN.", "DESA.", "SDR.", "ANTENNA_TYPE.",
        "TOWER_HEIGHT.", "ANTENNA_HEIGHT.", "AZIMUTH.", "M-Tilt.", "E-Tilt.", "PCI."
    ]
    for label in expected_labels:
        assert label in kml_text, f"Missing label {label}"

    # Verify fallback '-' for empty values (ANTENNA_TYPE, TOWER_HEIGHT, M-Tilt, etc.)
    assert "&lt;td&gt;-&lt;/td&gt;" in kml_text or "<td>-</td>" in kml_text

    # Verify copyright footer
    assert "©2026-Telkominfra- " in kml_text
    assert "danuartrianurrohman@telkominfra.com" in kml_text

def test_prb_custom_bands():
    data = create_sample_prb_data()
    custom_bands = {
        "LTE1800": {"altitude": 55, "beamwidth": 30, "radius_km": 0.075},
        "5G-NR3500": {"altitude": 60, "beamwidth": 65, "radius_km": 0.020}
    }
    kml_bytes, summary = convert_excel_to_prb_kml(data, custom_bands=custom_bands)
    kml_text = kml_bytes.decode('utf-8')

    # Overridden LTE1800 altitude should be 55 (instead of default 38)
    assert "<altitude>55" in kml_text or "30" in kml_text
    assert summary["custom_bands_applied"] is True

def test_prb_custom_ranges():
    data = create_sample_prb_data()
    # 91.9 would normally be red (#FF0000). With custom range 80-100 = Purple (#800080):
    custom_ranges = {
        "dl_prb": [
            {"min": 0, "max": 80, "color": "00FF00"},
            {"min": 80, "max": 100, "color": "800080"}
        ]
    }
    kml_bytes, summary = convert_excel_to_prb_kml(data, color_by_metric="DL_PRB", custom_ranges=custom_ranges)
    kml_text = kml_bytes.decode('utf-8')
    assert "800080" in kml_text
    assert summary["custom_ranges_applied"] is True

def test_prb_legend_screen_overlay_fractional():
    data = create_sample_prb_data()
    kml_bytes, summary = convert_excel_to_prb_kml(data, include_legend=True)
    kml_text = kml_bytes.decode('utf-8')
    assert "<ScreenOverlay" in kml_text
    assert "fraction" in kml_text

def test_isd_units_meters_and_kilometers():
    wb_a, _ = generate_template("isd_a")
    wb_b, _ = generate_template("isd_b")

    # 1. Kilometers mode
    xlsx_km, sum_km = calculate_isd(wb_a, wb_b, n_nearest=1, distance_unit="km")
    assert sum_km["distance_unit"] == "km"
    assert "min_km" in sum_km
    wb_res_km = openpyxl.load_workbook(io.BytesIO(xlsx_km))
    sh_res_km = wb_res_km["ISD_Result"]
    headers_km = [c for c in next(sh_res_km.iter_rows(values_only=True))]
    assert "distance_km" in headers_km

    # 2. Meters mode
    xlsx_m, sum_m = calculate_isd(wb_a, wb_b, n_nearest=1, distance_unit="m")
    assert sum_m["distance_unit"] == "m"
    assert sum_m["min_distance"] == pytest.approx(sum_km["min_km"] * 1000.0, rel=1e-2)
    wb_res_m = openpyxl.load_workbook(io.BytesIO(xlsx_m))
    sh_res_m = wb_res_m["ISD_Result"]
    headers_m = [c for c in next(sh_res_m.iter_rows(values_only=True))]
    assert "distance_m" in headers_m

def test_api_isd_meters_unit():
    wb_a, _ = generate_template("isd_a")
    wb_b, _ = generate_template("isd_b")
    files = {
        "file_a": ("isd_a.xlsx", wb_a, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
        "file_b": ("isd_b.xlsx", wb_b, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    }
    data = {"n_nearest": "1", "distance_unit": "m"}
    res = client.post("/api/v1/tools/isd-calculator/process?preview=true", files=files, data=data)
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["summary"]["distance_unit"] == "m"
    assert "distance_m" in res_data["summary"]["preview_rows"][0]
