"""
Tool 2: Excel to PRB KML 3D Sector Polygon Visualizer
Builds 3D extruded sector polygons color-coded by PRB/RRC utilization.
"""

import io
import math
from typing import Optional, Dict, Any, Tuple, List
import pandas as pd
import simplekml
from simplekml import ListItemType, OverlayXY, ScreenXY, Units
from backend.tools.constants import (
    EARTH_RADIUS_GEODESIC_KM,
    get_band_params,
    get_dl_prb_color,
    get_ul_prb_color,
    get_rrc_color,
    DEFAULT_PRB_OPACITY,
)

def calculate_new_coords(rad_lat: float, rad_lon: float, azimuth_rad: float, d_r: float) -> Tuple[float, float]:
    """Forward spherical geodesic projection."""
    rad_lat_new = math.asin(
        math.sin(rad_lat) * math.cos(d_r) +
        math.cos(rad_lat) * math.sin(d_r) * math.cos(azimuth_rad)
    )
    rad_lon_new = rad_lon + math.atan2(
        math.sin(azimuth_rad) * math.sin(d_r) * math.cos(rad_lat),
        math.cos(d_r) - math.sin(rad_lat) * math.sin(rad_lat_new)
    )
    lat_new = math.degrees(rad_lat_new)
    lon_new = math.degrees(rad_lon_new)
    return lon_new, lat_new

def generate_sector_polygon_coords(
    lat: float,
    lon: float,
    azimuth: float,
    beamwidth: float,
    radius_km: float,
    altitude: float
) -> List[Tuple[float, float, float]]:
    """Generates closed 7-point polygon coordinates tuple for 3D sector."""
    rad_lat = math.radians(lat)
    rad_lon = math.radians(lon)
    d_r = radius_km / EARTH_RADIUS_GEODESIC_KM

    azimuth_left2 = azimuth - (beamwidth / 2.0)
    azimuth_left1 = (azimuth_left2 + azimuth) / 2.0
    azimuth_right2 = azimuth + (beamwidth / 2.0)
    azimuth_right1 = (azimuth_right2 + azimuth) / 2.0

    thetas = [
        math.radians(azimuth_left2),
        math.radians(azimuth_left1),
        math.radians(azimuth),
        math.radians(azimuth_right1),
        math.radians(azimuth_right2),
    ]

    pts = [(lon, lat, altitude)]
    for th in thetas:
        new_lon, new_lat = calculate_new_coords(rad_lat, rad_lon, th, d_r)
        pts.append((new_lon, new_lat, altitude))
    pts.append((lon, lat, altitude))
    return pts

def convert_excel_to_prb_kml(
    file_bytes_or_path,
    color_by_metric: str = "DL_PRB",
    opacity_percent: int = DEFAULT_PRB_OPACITY,
    include_legend: bool = True,
    sheet_name: Optional[str] = "Sheet1"
) -> Tuple[bytes, Dict[str, Any]]:
    """
    Processes PRB Excel file and returns (kml_bytes, summary_dict).
    """
    if isinstance(file_bytes_or_path, (bytes, bytearray)):
        file_obj = io.BytesIO(file_bytes_or_path)
    else:
        file_obj = file_bytes_or_path

    # Try reading requested sheet, fallback to first sheet
    try:
        df = pd.read_excel(file_obj, sheet_name=sheet_name or 0, engine="openpyxl")
    except Exception:
        if hasattr(file_obj, 'seek'):
            file_obj.seek(0)
        df = pd.read_excel(file_obj, sheet_name=0, engine="openpyxl")

    if df.empty:
        raise ValueError("Excel sheet contains no data rows.")

    # Standardize column lookup (case-insensitive & stripped)
    col_map = {str(c).strip().upper(): c for c in df.columns}

    def get_val(row, key, default=None):
        actual_col = col_map.get(key.upper())
        if actual_col is not None and pd.notna(row[actual_col]):
            return row[actual_col]
        return default

    # Verify minimum required columns
    required_cols = ['LAT', 'LONG', 'BEAM', 'DIRECTION']
    missing = [c for c in required_cols if c not in col_map]
    if missing:
        raise ValueError(f"Missing required columns in PRB sheet: {', '.join(missing)}")

    kml = simplekml.Kml()
    kml.document.liststyle.listitemtype = ListItemType.checkhidechildren

    if include_legend:
        screen = kml.newscreenoverlay(name='Legend')
        YOUR_FILE_ID = "1FUMTnOF6rluHJ4WbFSqwmOdERQALn6rV"
        screen.icon.href = f"https://drive.google.com/uc?export=view&id={YOUR_FILE_ID}"
        screen.overlayxy = OverlayXY(x=0, y=1, xunits=Units.fraction, yunits=Units.fraction)
        screen.screenxy = ScreenXY(x=1728, y=270, xunits=Units.pixels, yunits=Units.pixels)
        screen.size.x = 0.075
        screen.size.y = 0.15
        screen.size.xunits = Units.fraction
        screen.size.yunits = Units.fraction

    total_rows = len(df)
    valid_sectors = 0
    skipped_rows = 0
    preview_rows = []

    opacity_a = int(255 * (opacity_percent / 100.0))

    for idx, row in df.iterrows():
        try:
            lat = float(get_val(row, 'LAT'))
            lon = float(get_val(row, 'LONG'))
            beam = str(get_val(row, 'BEAM', '')).strip()
            azimuth = float(get_val(row, 'DIRECTION', 0.0))

            dl_prb_raw = get_val(row, 'DL PRB BDBH', 0.0)
            ul_prb_raw = get_val(row, 'UL PRB BDBH', 0.0)
            rrc_raw = get_val(row, 'RRC User BDBH', 0.0)
            payload_mb_raw = get_val(row, 'PAYLOAD (MB)', 0.0)

            dl_prb = round(float(dl_prb_raw), 2) if pd.notna(dl_prb_raw) else 0.0
            ul_prb = round(float(ul_prb_raw), 2) if pd.notna(ul_prb_raw) else 0.0
            rrc = round(float(rrc_raw), 2) if pd.notna(rrc_raw) else 0.0
            payload_gb = round(float(payload_mb_raw) / 1024.0, 2) if pd.notna(payload_mb_raw) else 0.0

            cellname = str(get_val(row, 'CELLNAME', f'Cell_{idx+1}')).strip()
            sitename = str(get_val(row, 'SITENAME', f'Site_{idx+1}')).strip()
            week = str(get_val(row, 'WEEK', 'N/A')).strip()
            bw = str(get_val(row, 'BW (MHZ)', get_val(row, 'BW (MHz)', 'N/A'))).strip()

            band_info = get_band_params(beam)
            altitude = band_info['altitude']
            beamwidth = band_info['beamwidth']
            radius_km = band_info['radius_km']

            # Determine colors
            color_dl = get_dl_prb_color(dl_prb)
            color_ul = get_ul_prb_color(ul_prb)
            color_rrc = get_rrc_color(rrc)

            if color_by_metric.upper() in ("UL_PRB", "UL"):
                active_color = color_ul
            elif color_by_metric.upper() in ("RRC", "RRC_USER"):
                active_color = color_rrc
            else:
                active_color = color_dl

            # Calculate 3D sector coordinates
            coords = generate_sector_polygon_coords(lat, lon, azimuth, beamwidth, radius_km, altitude)

            poligon = kml.newpolygon(name=cellname)
            poligon.outerboundaryis = coords
            poligon.altitude = altitude
            poligon.extrude = 1
            poligon.altitudemode = simplekml.AltitudeMode.relativetoground

            poligon.style.polystyle.color = simplekml.Color.changealphaint(opacity_a, simplekml.Color.hex(active_color))
            poligon.style.linestyle.color = simplekml.Color.changealphaint(255, simplekml.Color.hex(active_color))

            # HTML Description Table
            description = (
                f"<STYLE TYPE='text/css'>"
                f"TD{{font-family: Calibri, sans-serif; font-size: 8pt; color: #111;}}"
                f".small-text{{font-size: 6pt; color: #555;}}"
                f"</STYLE>"
                f"<table border='1' cellspacing='0' cellpadding='4' style='border-collapse: collapse;'>"
                f"<tr bgcolor='#0B0F17' style='color: #F8FAFC; text-align: center;'>"
                f"<td colspan='2'><b>RF TOOLS — Sector Attributes</b></td></tr>"
                f"<tr><td><b>WEEK</b></td><td>{week}</td></tr>"
                f"<tr><td><b>SITENAME</b></td><td>{sitename}</td></tr>"
                f"<tr><td><b>CELLNAME</b></td><td>{cellname}</td></tr>"
                f"<tr><td><b>BAND</b></td><td>{beam}</td></tr>"
                f"<tr><td><b>DL PRB BDBH (%)</b></td><td bgcolor='#{color_dl}'><b><center>{dl_prb}</center></b></td></tr>"
                f"<tr><td><b>UL PRB BDBH (%)</b></td><td bgcolor='#{color_ul}'><b><center>{ul_prb}</center></b></td></tr>"
                f"<tr><td><b>RRC User BDBH</b></td><td bgcolor='#{color_rrc}'><b><center>{rrc}</center></b></td></tr>"
                f"<tr><td><b>PAYLOAD (GB)</b></td><td><b><center>{payload_gb}</center></b></td></tr>"
                f"<tr><td><b>BANDWIDTH (MHz)</b></td><td>{bw}</td></tr>"
                f"<tr><td><b>LONGITUDE</b></td><td>{lon}</td></tr>"
                f"<tr><td><b>LATITUDE</b></td><td>{lat}</td></tr>"
                f"<tr><td><b>AZIMUTH</b></td><td>{azimuth}&deg;</td></tr>"
                f"<tr><td><b>ALTITUDE / RADIUS</b></td><td>{altitude}m / {int(radius_km*1000)}m</td></tr>"
                f"</table>"
                f"<div class='small-text' style='margin-top: 4px;'>Generated by RF TOOLS &bull; 3GPP LTE Modeling</div>"
            )
            poligon.description = description
            valid_sectors += 1

            if len(preview_rows) < 10:
                preview_rows.append({
                    "cellname": cellname,
                    "sitename": sitename,
                    "beam": beam,
                    "altitude_m": altitude,
                    "radius_m": int(radius_km * 1000),
                    "azimuth": azimuth,
                    "dl_prb": dl_prb,
                    "ul_prb": ul_prb,
                    "rrc_user": rrc,
                    "color_hex": f"#{active_color}"
                })

        except Exception:
            skipped_rows += 1
            continue

    if valid_sectors == 0:
        raise ValueError("No valid sector rows could be converted into 3D polygons.")

    kml_str = kml.kml()
    summary = {
        "tool": "prb_kml",
        "total_rows": total_rows,
        "valid_sectors": valid_sectors,
        "skipped_rows": skipped_rows,
        "color_by_metric": color_by_metric,
        "preview_rows": preview_rows,
    }
    return kml_str.encode('utf-8'), summary
