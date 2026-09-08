"""
Tool 6: Lat/Long to Geohash Encoder
Encodes geographic coordinate pairs into standardized geohash string tokens.
"""

import io
import os
from typing import Optional, Dict, Any, Tuple
import pandas as pd
import pygeohash
from backend.tools.geohash_to_shp import load_data_table

def convert_latlon_to_geohash(
    file_bytes_or_path,
    filename: str = "data.xlsx",
    lat_col: Optional[str] = None,
    lon_col: Optional[str] = None,
    precision: int = 7,
    output_format: str = "xlsx"
) -> Tuple[bytes, Dict[str, Any]]:
    """
    Encodes lat/lon into geohash tokens.
    Returns (file_bytes, summary_dict).
    """
    precision = max(1, min(12, int(precision)))
    df = load_data_table(file_bytes_or_path, filename)
    if df.empty:
        raise ValueError("Uploaded file contains no data rows.")

    # Resolve lat/lon columns
    col_lat_found = None
    col_lon_found = None

    if lat_col and lat_col in df.columns:
        col_lat_found = lat_col
    if lon_col and lon_col in df.columns:
        col_lon_found = lon_col

    for c in df.columns:
        c_low = str(c).lower().strip()
        if not col_lat_found and c_low in ('lat', 'latitude', 'y'):
            col_lat_found = c
        elif not col_lon_found and c_low in ('lon', 'long', 'longitude', 'x', 'lng'):
            col_lon_found = c

    if not col_lat_found or not col_lon_found:
        raise ValueError("Could not detect or find Latitude and Longitude columns.")

    geohashes = []
    valid_count = 0
    skipped_count = 0

    for _, row in df.iterrows():
        try:
            lat_val = row[col_lat_found]
            lon_val = row[col_lon_found]
            if pd.isna(lat_val) or pd.isna(lon_val):
                geohashes.append("")
                skipped_count += 1
                continue

            lat = float(lat_val)
            lon = float(lon_val)

            if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
                geohashes.append("")
                skipped_count += 1
                continue

            gh = pygeohash.encode(lat, lon, precision=precision)
            geohashes.append(gh)
            valid_count += 1
        except Exception:
            geohashes.append("")
            skipped_count += 1

    if valid_count == 0:
        raise ValueError(f"No valid coordinate records could be encoded from columns '{col_lat_found}' and '{col_lon_found}'.")

    df_out = df.copy()
    # Remove existing conflicting 'geohash' column if present
    if 'geohash' in [str(c).lower().strip() for c in df_out.columns]:
        to_drop = [c for c in df_out.columns if str(c).lower().strip() == 'geohash']
        df_out = df_out.drop(columns=to_drop)

    df_out['geohash'] = geohashes

    out_bio = io.BytesIO()
    if output_format.lower() == "csv":
        df_out.to_csv(out_bio, index=False)
    else:
        df_out.to_excel(out_bio, index=False, engine="openpyxl")
    file_bytes = out_bio.getvalue()

    preview_df = df_out.head(10).fillna("")
    preview_rows = preview_df.to_dict(orient="records")

    summary = {
        "tool": "latlon_to_geohash",
        "lat_column": col_lat_found,
        "lon_column": col_lon_found,
        "precision": precision,
        "total_rows": len(df),
        "valid_count": valid_count,
        "skipped_count": skipped_count,
        "output_format": output_format.lower(),
        "columns": list(df_out.columns),
        "preview_rows": preview_rows,
    }
    return file_bytes, summary
