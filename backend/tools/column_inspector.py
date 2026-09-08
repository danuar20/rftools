"""
File Column Inspector & Heuristic Matching Engine
Inspects spreadsheets, detects data types, and recommends column mappings.
"""

import io
import os
from typing import Dict, Any, List
import pandas as pd
import openpyxl

def classify_column(col_name: str, sample_vals: List[Any]) -> Dict[str, Any]:
    """Assigns suggested engineering role and confidence based on header and sample values."""
    name = str(col_name).strip().lower()

    # Latitude
    if name in ('lat', 'latitude', 'y', 'lat_deg', 'latitude_deg'):
        return {"role": "latitude", "confidence": 0.98, "match_type": "exact"}
    if 'lat' in name:
        return {"role": "latitude", "confidence": 0.85, "match_type": "fuzzy"}

    # Longitude
    if name in ('lon', 'long', 'longitude', 'x', 'lng', 'lon_deg', 'longitude_deg'):
        return {"role": "longitude", "confidence": 0.98, "match_type": "exact"}
    if any(k in name for k in ('lon', 'lng')):
        return {"role": "longitude", "confidence": 0.85, "match_type": "fuzzy"}

    # Geohash
    if name in ('geohash', 'hash', 'grid', 'gh', 'geohash_id'):
        return {"role": "geohash", "confidence": 0.98, "match_type": "exact"}
    if 'hash' in name or 'grid' in name:
        return {"role": "geohash", "confidence": 0.80, "match_type": "fuzzy"}

    # Azimuth / Direction
    if name in ('direction', 'azimuth', 'bearing', 'dir', 'heading'):
        return {"role": "azimuth", "confidence": 0.95, "match_type": "exact"}

    # Band / Beam
    if name in ('beam', 'band', 'carrier', 'technology', 'uarfc', 'freq'):
        return {"role": "beam", "confidence": 0.95, "match_type": "exact"}

    # DL PRB
    if 'dl prb' in name or 'dl_prb' in name:
        return {"role": "dl_prb", "confidence": 0.95, "match_type": "exact"}

    # UL PRB
    if 'ul prb' in name or 'ul_prb' in name:
        return {"role": "ul_prb", "confidence": 0.95, "match_type": "exact"}

    # RRC Users
    if 'rrc' in name:
        return {"role": "rrc_user", "confidence": 0.95, "match_type": "exact"}

    # Cell Name / Site Name
    if name in ('cellname', 'cell_name', 'cell', 'ci', 'cell_id'):
        return {"role": "cell_name", "confidence": 0.95, "match_type": "exact"}
    if name in ('sitename', 'site_name', 'site', 'siteid', 'site_id'):
        return {"role": "site_name", "confidence": 0.95, "match_type": "exact"}

    # Infer from sample values if available
    for v in sample_vals:
        if v is not None and str(v).strip():
            s = str(v).strip()
            # Geohash sample pattern: 5 to 12 alphanumeric characters without vowels a, i, l, o
            if len(s) in (6, 7, 8, 9) and s.isalnum() and not any(c in s.lower() for c in 'ai lo'):
                return {"role": "geohash", "confidence": 0.70, "match_type": "content_heuristic"}

    return {"role": None, "confidence": 0.0, "match_type": "unmapped"}

def inspect_file_columns(file_bytes_or_path, filename: str = "") -> Dict[str, Any]:
    """Inspects uploaded file and returns column metadata, types, and suggestions."""
    ext = os.path.splitext(filename)[1].lower() if filename else ""
    sheets = []
    active_sheet = None

    if isinstance(file_bytes_or_path, (bytes, bytearray)):
        bio = io.BytesIO(file_bytes_or_path)
        if ext == ".csv":
            try:
                df = pd.read_csv(bio)
            except Exception:
                bio.seek(0)
                df = pd.read_csv(bio, encoding="latin1")
            sheets = ["Sheet1"]
            active_sheet = "Sheet1"
        else:
            try:
                wb = openpyxl.load_workbook(bio, read_only=True, data_only=True)
                sheets = wb.sheetnames
                active_sheet = sheets[0] if sheets else "Sheet1"
                bio.seek(0)
                df = pd.read_excel(bio, sheet_name=active_sheet, engine="openpyxl")
            except Exception:
                bio.seek(0)
                df = pd.read_excel(bio, engine="openpyxl")
                sheets = ["Sheet1"]
                active_sheet = "Sheet1"
    else:
        if filename.lower().endswith(".csv"):
            df = pd.read_csv(file_bytes_or_path)
            sheets = ["Sheet1"]
            active_sheet = "Sheet1"
        else:
            wb = openpyxl.load_workbook(file_bytes_or_path, read_only=True, data_only=True)
            sheets = wb.sheetnames
            active_sheet = sheets[0] if sheets else "Sheet1"
            df = pd.read_excel(file_bytes_or_path, sheet_name=active_sheet, engine="openpyxl")

    columns_info = []
    for c in df.columns:
        col_str = str(c).strip()
        samples = [v for v in df[c].dropna().head(5).tolist()]
        # infer basic type
        if pd.api.types.is_numeric_dtype(df[c]):
            dtype_label = "numeric"
        elif pd.api.types.is_datetime64_any_dtype(df[c]):
            dtype_label = "datetime"
        else:
            dtype_label = "string"

        classification = classify_column(col_str, samples)
        columns_info.append({
            "name": col_str,
            "type": dtype_label,
            "sample_values": [str(s) for s in samples[:3]],
            "suggested_role": classification["role"],
            "confidence": classification["confidence"],
            "match_type": classification["match_type"]
        })

    preview_rows = df.head(5).fillna("").to_dict(orient="records")

    return {
        "filename": filename,
        "sheets": sheets,
        "active_sheet": active_sheet,
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "columns": columns_info,
        "preview_rows": preview_rows
    }
