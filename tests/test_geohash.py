"""
Tests for Geohash & GIS Utilities (Tools 4, 5, 6)
Verifies coordinate encoding/decoding bidirectionality, ESRI Shapefile bundling, and DBF name limits.
"""

import io
import zipfile
import pytest
import pandas as pd
import pygeohash
from backend.tools.geohash_to_shp import (
    geohash_to_bbox_polygon,
    geohash_to_custom_square,
    make_unique_dbf_columns,
    convert_geohash_to_shp
)
from backend.tools.geohash_to_latlon import convert_geohash_to_latlon
from backend.tools.latlon_to_geohash import convert_latlon_to_geohash

def test_bidirectional_geohash_encoding_decoding():
    orig_lat, orig_lon = -6.175392, 106.827153
    gh = pygeohash.encode(orig_lat, orig_lon, precision=7)
    assert gh == "qqguygv"

    dec_lat, dec_lon = pygeohash.decode(gh)
    # At precision 7, cell width/height is ~150m (~0.001 degrees)
    assert abs(dec_lat - orig_lat) < 0.001
    assert abs(dec_lon - orig_lon) < 0.001

def test_make_unique_dbf_columns():
    cols = [
        "very_long_column_name_1",
        "very_long_column_name_2",
        "very_long_column_name_3",
        "id",
        "geometry"
    ]
    dbf_cols = make_unique_dbf_columns(cols)
    assert all(len(c) <= 10 for c in dbf_cols if c != "geometry")
    assert len(dbf_cols) == len(set(dbf_cols))
    assert dbf_cols[4] == "geometry"

def test_geohash_to_shp_default_and_custom():
    csv_text = "site_id,sitename,geohash\n1,Monas,qqguygv\n2,GBK,qqgu1ms\n"
    csv_data = csv_text.encode("utf-8")

    # Default BBox mode
    zip_bytes_default, summary_def = convert_geohash_to_shp(csv_data, filename="test.csv", mode="default")
    assert isinstance(zip_bytes_default, bytes)
    assert len(zip_bytes_default) > 0
    assert summary_def["valid_polygons"] == 2

    with zipfile.ZipFile(io.BytesIO(zip_bytes_default)) as zf:
        names = zf.namelist()
        assert any(n.endswith(".shp") for n in names)
        assert any(n.endswith(".shx") for n in names)
        assert any(n.endswith(".dbf") for n in names)
        assert any(n.endswith(".prj") for n in names)

    # Custom square mode (500m)
    zip_bytes_custom, summary_cust = convert_geohash_to_shp(csv_data, filename="test.csv", mode="custom", size_m=500.0)
    assert summary_cust["valid_polygons"] == 2
    assert summary_cust["size_m"] == 500.0

def test_geohash_to_latlon_conversion():
    csv_text = "id,name,geohash\n1,Monas,qqguygv\n2,GBK,qqgu1ms\n"
    csv_data = csv_text.encode("utf-8")

    out_csv, summary = convert_geohash_to_latlon(csv_data, filename="test.csv", output_format="csv")
    assert summary["valid_count"] == 2
    df = pd.read_csv(io.BytesIO(out_csv))
    assert "latitude" in df.columns
    assert "longitude" in df.columns
    assert -6.25 < df["latitude"].iloc[0] < -6.10
    assert 106.7 < df["longitude"].iloc[0] < 106.9

def test_latlon_to_geohash_conversion():
    csv_text = "id,name,lat,lon\n1,Monas,-6.175392,106.827153\n2,GBK,-6.243589,106.801444\n"
    csv_data = csv_text.encode("utf-8")

    out_csv, summary = convert_latlon_to_geohash(csv_data, filename="test.csv", precision=7, output_format="csv")
    assert summary["valid_count"] == 2
    df = pd.read_csv(io.BytesIO(out_csv))
    assert "geohash" in df.columns
    assert df["geohash"].iloc[0] == "qqguygv"
