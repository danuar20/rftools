"""
Tool 4: Geohash to Shapefile (.shp/.zip) Converter
Transforms tabular geohash records into GIS vector polygon shapefile packages.
"""

import io
import os
import zipfile
import tempfile
from typing import Optional, Dict, Any, Tuple, List
import pandas as pd
import geopandas as gpd
from shapely.geometry import Polygon
import pygeohash
from pyproj import CRS, Transformer

def load_data_table(file_bytes_or_path, filename: str = "") -> pd.DataFrame:
    """Load DataFrame from CSV or Excel bytes or path."""
    ext = os.path.splitext(filename)[1].lower()
    if isinstance(file_bytes_or_path, (bytes, bytearray)):
        bio = io.BytesIO(file_bytes_or_path)
        if ext == ".csv" or (not ext and not filename):
            try:
                df = pd.read_csv(bio)
            except Exception:
                bio.seek(0)
                df = pd.read_excel(bio, engine="openpyxl")
        else:
            df = pd.read_excel(bio, engine="openpyxl")
    elif hasattr(file_bytes_or_path, 'read'):
        if ext == ".csv":
            df = pd.read_csv(file_bytes_or_path)
        else:
            df = pd.read_excel(file_bytes_or_path, engine="openpyxl")
    else:
        if file_bytes_or_path.lower().endswith(".csv"):
            df = pd.read_csv(file_bytes_or_path)
        else:
            df = pd.read_excel(file_bytes_or_path, engine="openpyxl")

    # Ensure clean unique string column names
    cols = [str(c).strip() for c in df.columns]
    seen = {}
    unique_cols = []
    for c in cols:
        if c not in seen:
            seen[c] = 1
            unique_cols.append(c)
        else:
            seen[c] += 1
            unique_cols.append(f"{c}_{seen[c]-1}")
    df.columns = unique_cols
    return df

def geohash_to_bbox_polygon(val: str) -> Optional[Polygon]:
    """Decode geohash into standard bounding box polygon."""
    try:
        val_str = str(val).strip()
        if not val_str:
            return None
        lat, lon, lat_e, lon_e = pygeohash.decode_exactly(val_str)
        return Polygon([
            (lon - lon_e, lat - lat_e),
            (lon + lon_e, lat - lat_e),
            (lon + lon_e, lat + lat_e),
            (lon - lon_e, lat + lat_e),
            (lon - lon_e, lat - lat_e),
        ])
    except Exception:
        return None

def geohash_to_custom_square(val: str, size_m: float) -> Optional[Polygon]:
    """Decode geohash centroid into localized metric square polygon reprojected to WGS84."""
    try:
        val_str = str(val).strip()
        if not val_str:
            return None
        lat, lon = pygeohash.decode(val_str)
        half = size_m / 2.0
        utm_zone = int((lon + 180) / 6) + 1
        utm = CRS.from_dict({
            "proj": "utm",
            "zone": utm_zone,
            "south": lat < 0,
            "datum": "WGS84",
            "units": "m"
        })
        t_fwd = Transformer.from_crs("EPSG:4326", utm, always_xy=True)
        t_inv = Transformer.from_crs(utm, "EPSG:4326", always_xy=True)
        cx, cy = t_fwd.transform(lon, lat)
        pts = [
            (cx - half, cy - half),
            (cx + half, cy - half),
            (cx + half, cy + half),
            (cx - half, cy + half),
            (cx - half, cy - half)
        ]
        return Polygon([t_inv.transform(x, y) for x, y in pts])
    except Exception:
        return None

def make_unique_dbf_columns(cols: List[str]) -> List[str]:
    """
    Truncates column names to max 10 characters (ESRI Shapefile DBF limit)
    and ensures all field names are strictly unique.
    """
    seen = {}
    new_cols = []
    for c in cols:
        name = str(c).strip()
        if name == "geometry":
            new_cols.append("geometry")
            continue

        base = name[:10] if name else "field"
        if base not in seen:
            seen[base] = 1
            new_name = base
        else:
            seen[base] += 1
            count = seen[base]
            suffix = f"_{count}"
            trimmed_base = base[:max(1, 10 - len(suffix))]
            new_name = f"{trimmed_base}{suffix}"
            while new_name in new_cols:
                count += 1
                seen[base] = count
                suffix = f"_{count}"
                trimmed_base = base[:max(1, 10 - len(suffix))]
                new_name = f"{trimmed_base}{suffix}"
        new_cols.append(new_name)
    return new_cols

def convert_geohash_to_shp(
    file_bytes_or_path,
    filename: str = "data.xlsx",
    geohash_col: Optional[str] = None,
    mode: str = "default",
    size_m: float = 500.0
) -> Tuple[bytes, Dict[str, Any]]:
    """
    Converts geohash table into ESRI Shapefile zipped archive (.zip).
    Returns (zip_bytes, summary_dict).
    """
    df = load_data_table(file_bytes_or_path, filename)
    if df.empty:
        raise ValueError("Uploaded file contains no data rows.")

    # Resolve geohash column
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
        raise ValueError("Could not detect or find geohash column.")

    geoms = []
    valid_mask = []
    preview_rows = []

    for idx, val in enumerate(df[col_found]):
        if mode == "custom":
            poly = geohash_to_custom_square(val, size_m)
        else:
            poly = geohash_to_bbox_polygon(val)

        if poly is not None and not poly.is_empty:
            geoms.append(poly)
            valid_mask.append(True)
            if len(preview_rows) < 10:
                preview_rows.append({
                    "row_index": idx + 1,
                    "geohash": str(val),
                    "mode": mode,
                    "bounds": [round(b, 6) for b in poly.bounds]
                })
        else:
            valid_mask.append(False)

    if not geoms:
        raise ValueError(f"No valid geohash records could be converted into polygons from column '{col_found}'.")

    df_valid = df[valid_mask].copy()
    gdf = gpd.GeoDataFrame(df_valid, geometry=geoms, crs="EPSG:4326")
    gdf.columns = make_unique_dbf_columns(list(gdf.columns))

    base_name = os.path.splitext(os.path.basename(filename))[0] if filename else "geohash_layer"
    base_name = "".join(c if c.isalnum() or c in ('_', '-') else '_' for c in base_name) or "geohash_layer"

    with tempfile.TemporaryDirectory() as tmpdir:
        shp_path = os.path.join(tmpdir, f"{base_name}.shp")
        gdf.to_file(shp_path, driver="ESRI Shapefile")

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_f:
            for f in os.listdir(tmpdir):
                full_f = os.path.join(tmpdir, f)
                if os.path.isfile(full_f):
                    zip_f.write(full_f, arcname=f)

        zip_bytes = zip_buffer.getvalue()

    summary = {
        "tool": "geohash_to_shp",
        "geohash_column": col_found,
        "mode": mode,
        "size_m": size_m if mode == "custom" else None,
        "total_rows": len(df),
        "valid_polygons": len(geoms),
        "skipped_rows": len(df) - len(geoms),
        "preview_rows": preview_rows,
    }
    return zip_bytes, summary
