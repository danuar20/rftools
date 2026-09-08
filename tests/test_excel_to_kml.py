"""
Tests for Tool 1: Excel to Point KML Placemark Converter
"""

import pytest
import io
import openpyxl
from backend.tools.excel_to_kml import convert_excel_to_kml, parse_color, find_latlon_columns

def create_sample_points_workbook():
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Sheet1"
    ws.append(["SITE_ID", "SITENAME", "Site", "LONG", "LAT"])
    ws.append(["JKT001", "Jakarta_Monas_01", "Monas Point", 106.827153, -6.175392])
    ws.append(["JKT002", "Jakarta_GBK_02", "GBK Point", 106.801444, -6.243589])
    ws.append(["INVALID_01", "Bad_Coord", "Invalid", 999.0, -999.0])
    bio = io.BytesIO()
    wb.save(bio)
    return bio.getvalue()

def test_parse_color():
    assert parse_color((255, 0, 0)) == (255, 0, 0)
    assert parse_color("#FF0000") == (255, 0, 0)
    assert parse_color("00FF00") == (0, 255, 0)

def test_find_latlon_columns():
    headers = ["ID", "Name", "Longitude", "Latitude"]
    lat_i, lon_i = find_latlon_columns(headers)
    assert lat_i == 3
    assert lon_i == 2

def test_convert_excel_to_kml_success():
    data = create_sample_points_workbook()
    kml_bytes, summary = convert_excel_to_kml(
        data,
        folder_name="Cell_Sites",
        color_rgb="#FF5500",
        scale=0.8
    )
    assert isinstance(kml_bytes, bytes)
    assert len(kml_bytes) > 0
    kml_text = kml_bytes.decode('utf-8')
    assert "<kml" in kml_text
    assert "Jakarta_Monas_01" in kml_text or "Monas Point" in kml_text
    assert "106.827153,-6.175392" in kml_text

    assert summary["valid_points"] == 2
    assert summary["skipped_points"] == 1
    assert len(summary["preview_rows"]) == 2

def test_convert_excel_to_kml_empty_file_error():
    wb = openpyxl.Workbook()
    bio = io.BytesIO()
    wb.save(bio)
    with pytest.raises(ValueError, match="empty"):
        convert_excel_to_kml(bio.getvalue())
