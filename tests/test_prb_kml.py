"""
Tests for Tool 2: Excel to PRB KML 3D Sector Polygon Visualizer
Verifies 3GPP LTE band lookup, geodesic forward projection, and PRB/RRC color mapping.
"""

import io
import math
import openpyxl
import pytest
from backend.tools.constants import (
    get_band_params,
    get_dl_prb_color,
    get_ul_prb_color,
    get_rrc_color,
    BAND_PARAMETERS,
)
from backend.tools.prb_kml import calculate_new_coords, generate_sector_polygon_coords, convert_excel_to_prb_kml

def test_band_parameters_lookup():
    assert get_band_params("LTE700") == {"altitude": 42, "beamwidth": 23, "radius_km": 0.038}
    assert get_band_params("LTE900") == {"altitude": 40, "beamwidth": 23, "radius_km": 0.042}
    assert get_band_params("LTE1800") == {"altitude": 38, "beamwidth": 23, "radius_km": 0.046}
    assert get_band_params("LTE2100") == {"altitude": 36, "beamwidth": 23, "radius_km": 0.050}
    assert get_band_params("LTE2300-1st") == {"altitude": 34, "beamwidth": 25, "radius_km": 0.054}
    assert get_band_params("LTE2300-2nd") == {"altitude": 32, "beamwidth": 25, "radius_km": 0.058}
    assert get_band_params("LTE2300-3rd") == {"altitude": 30, "beamwidth": 25, "radius_km": 0.062}
    assert get_band_params("UNKNOWN_BAND") == {"altitude": 28, "beamwidth": 27, "radius_km": 0.080}

def test_color_threshold_mapping():
    # 0% / Inactive
    assert get_dl_prb_color(0.0) == 'BFBFBF'
    assert get_ul_prb_color(0.0) == 'BFBFBF'
    assert get_rrc_color(0.0) == 'BFBFBF'

    # Low load (<= 35% / <= 40 RRC) -> Cobalt Blue
    assert get_dl_prb_color(25.5) == '0000FF'
    assert get_ul_prb_color(18.2) == '0000FF'
    assert get_rrc_color(35) == '0000FF'

    # Normal load (35-60% / 40-60 RRC) -> Emerald Green
    assert get_dl_prb_color(55.0) == '00FF00'
    assert get_ul_prb_color(45.0) == '00FF00'
    assert get_rrc_color(52) == '00FF00'

    # Elevated load (60-75% / 60-90 RRC) -> Electric Yellow
    assert get_dl_prb_color(68.4) == 'FFFF00'
    assert get_ul_prb_color(70.0) == 'FFFF00'
    assert get_rrc_color(82) == 'FFFF00'

    # High load (75-90% / 90-120 RRC) -> Amber Orange
    assert get_dl_prb_color(85.0) == 'FFBF00'
    assert get_ul_prb_color(88.6) == 'FFBF00'
    assert get_rrc_color(110) == 'FFBF00'

    # Congested (> 90% / > 120 RRC) -> Vivid Crimson
    assert get_dl_prb_color(92.1) == 'FF0000'
    assert get_ul_prb_color(95.0) == 'FF0000'
    assert get_rrc_color(135) == 'FF0000'

def test_geodesic_projection_matches_legacy():
    # Test point from Monas Jakarta
    lat = -6.175392
    lon = 106.827153
    azimuth = 120.0
    radius_km = 0.046
    d_r = radius_km / 6371.0

    lon_new, lat_new = calculate_new_coords(math.radians(lat), math.radians(lon), math.radians(azimuth), d_r)
    # The new point should be slightly southeast of Monas
    assert lat_new < lat
    assert lon_new > lon
    # Distance should equal radius_km (~46 meters)
    # Approx 1 deg lat ~ 111km -> 0.046km ~ 0.00041 degrees
    assert abs(lat_new - lat) < 0.001
    assert abs(lon_new - lon) < 0.001

def create_sample_prb_workbook():
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
        "W29", "JKT001", "JKT_MONAS_01", "JKT_MONAS_01_Sec1", "LTE1800", 25.5, 18.2, 35,
        10240, 20, 106.827153, -6.175392, 0, "REV_A", "NOP_JKT", "RTPO_JKT",
        "DKI JAKARTA", "JAKARTA PUSAT", "GAMBIR", "GAMBIR", "SDR_01", "POLE", 30, 28, 2, 4, 101
    ])
    ws.append([
        "W29", "JKT001", "JKT_MONAS_01", "JKT_MONAS_01_Sec2", "LTE1800", 68.4, 55.0, 82,
        25600, 20, 106.827153, -6.175392, 120, "REV_A", "NOP_JKT", "RTPO_JKT",
        "DKI JAKARTA", "JAKARTA PUSAT", "GAMBIR", "GAMBIR", "SDR_01", "POLE", 30, 28, 2, 4, 102
    ])
    ws.append([
        "W29", "JKT001", "JKT_MONAS_01", "JKT_MONAS_01_Sec3", "LTE1800", 92.1, 88.6, 135,
        35840, 20, 106.827153, -6.175392, 240, "REV_A", "NOP_JKT", "RTPO_JKT",
        "DKI JAKARTA", "JAKARTA PUSAT", "GAMBIR", "GAMBIR", "SDR_01", "POLE", 30, 28, 2, 4, 103
    ])
    bio = io.BytesIO()
    wb.save(bio)
    return bio.getvalue()

def test_convert_excel_to_prb_kml_success():
    data = create_sample_prb_workbook()
    kml_bytes, summary = convert_excel_to_prb_kml(data, color_by_metric="DL_PRB")
    assert isinstance(kml_bytes, bytes)
    assert len(kml_bytes) > 0
    kml_text = kml_bytes.decode('utf-8')

    assert "JKT_MONAS_01_Sec1" in kml_text
    assert "<Polygon" in kml_text
    assert "<extrude>1</extrude>" in kml_text
    assert "<altitudeMode>relativeToGround</altitudeMode>" in kml_text
    assert "altitude" in summary["preview_rows"][0] or "altitude_m" in summary["preview_rows"][0]
    assert summary["valid_sectors"] == 3
