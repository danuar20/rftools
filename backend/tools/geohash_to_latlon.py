"""
Tool 5: Geohash to Lat/Long Converter
Decodes geohash string tokens into centroid WGS84 coordinates.
"""

import io
import os
from typing import Optional, Dict, Any, Tuple
import pandas as pd
import pygeohash
from backend.tools.geohash_to_shp import load_data_table

def convert_geohash_to_latlon(
    file_bytes_or_path,
    filename: str = "data.xlsx",
    geohash_col: Optional[str] = None,
    output_format: str = "xlsx"
) -> Tuple[bytes, Dict[str, Any]]:
    """
    Decodes geohashes into latitude & longitude columns.
    Returns (file_bytes, summary_dict).
    """
    df = load_data_table(file_bytes_or_path, filename)
    if df.empty:
        raise ValueError("Uploaded file contains no data rows.")

    col_found = None
    if geohash_col and geohash_col in df.columns:
        col_found = geohash_col
    else:
        for c in df.columns:
            c_low = str(c).lower().strip()
            if any(k in c_low for k in ('geohash', 'hash', 'grid', 'gh')):
                col_found = c
                break
        if not col_found and len(df.columns) > 0:
            col_found = df.columns[0]

    if not col_found:
        raise ValueError("Could not identify geohash column.")

    lats = []
    lons = []
    valid_count = 0
    skipped_count = 0

    for val in df[col_found]:
        try:
            val_str = str(val).strip() if pd.notna(val) else ""
            if not val_str:
                lats.append(None)
                lons.append(None)
                skipped_count += 1
                continue
            lat, lon = pygeohash.decode(val_str)
            lats.append(round(float(lat), 7))
            lons.append(round(float(lon), 7))
            valid_count += 1
        except Exception:
            lats.append(None)
            lons.append(None)
            skipped_count += 1

    df_out = df.copy()
    # Remove existing conflicting latitude/longitude if any
    cols_to_drop = [c for c in df_out.columns if str(c).lower().strip() in ('latitude', 'longitude')]
    if cols_to_drop:
        df_out = df_out.drop(columns=cols_to_drop)

    df_out['latitude'] = lats
    df_out['longitude'] = lons

    out_bio = io.BytesIO()
    if output_format.lower() == "csv":
        df_out.to_csv(out_bio, index=False)
    else:
        df_out.to_excel(out_bio, index=False, engine="openpyxl")
    file_bytes = out_bio.getvalue()

    preview_df = df_out.head(10).fillna("")
    preview_rows = preview_df.to_dict(orient="records")

    summary = {
        "tool": "geohash_to_latlon",
        "geohash_column": col_found,
        "total_rows": len(df),
        "valid_count": valid_count,
        "skipped_count": skipped_count,
        "output_format": output_format.lower(),
        "columns": list(df_out.columns),
        "preview_rows": preview_rows,
    }
    return file_bytes, summary
