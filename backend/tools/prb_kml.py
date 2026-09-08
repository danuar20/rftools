"""
Tool 2: Excel to PRB KML 3D Sector Polygon Visualizer
Builds 3D extruded sector polygons color-coded by PRB/RRC utilization.
Matches 24-row HTML balloon popup table and supports custom bands, ranges, and logos.
"""

import io
import math
import json
from typing import Optional, Dict, Any, Tuple, List
import pandas as pd
import simplekml
from simplekml import ListItemType, OverlayXY, ScreenXY, Units
from backend.tools.constants import (
    EARTH_RADIUS_GEODESIC_KM,
    get_band_params,
    get_kpi_color,
    get_dl_prb_color,
    get_ul_prb_color,
    get_rrc_color,
    DEFAULT_PRB_OPACITY,
    DEFAULT_LEFT_LOGO,
    DEFAULT_RIGHT_LOGO,
    DEFAULT_LEGEND_URL,
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

def format_cell_value(val: Any) -> str:
    """Formats attribute value, displaying '-' for empty or NaN values."""
    if val is None or pd.isna(val):
        return "-"
    s = str(val).strip()
    if s == "" or s.lower() == "nan":
        return "-"
    return s

def build_balloon_description(
    row_data: Dict[str, Any],
    left_logo: str,
    right_logo: str,
    color_dl: str,
    color_ul: str,
    color_rrc: str,
    dl_prb: float,
    ul_prb: float,
    rrc: float,
    payload_gb: float
) -> str:
    """
    Generates exact 24-row HTML balloon popup table matching attachment 01a0815f-1e68-77f0-a9d4-1e6945320dd5
    with dual header logos and copyright footer.
    """
    # Extract values with '-' fallback
    week = format_cell_value(row_data.get('WEEK'))
    sitename = format_cell_value(row_data.get('SITENAME'))
    cellname = format_cell_value(row_data.get('CELLNAME'))
    band = format_cell_value(row_data.get('BEAM'))
    bw = format_cell_value(row_data.get('BW (MHz)') or row_data.get('BW (MHZ)'))
    lon = format_cell_value(row_data.get('LONG'))
    lat = format_cell_value(row_data.get('LAT'))
    class_rev = format_cell_value(row_data.get('CLASS REV'))
    nop = format_cell_value(row_data.get('NOP'))
    rtpo = format_cell_value(row_data.get('RTPO'))
    propinsi = format_cell_value(row_data.get('PROPINSI'))
    kabupaten = format_cell_value(row_data.get('KABUPATEN'))
    kecamatan = format_cell_value(row_data.get('KECAMATAN'))
    desa = format_cell_value(row_data.get('DESA'))
    sdr = format_cell_value(row_data.get('SDR'))
    antenna_type = format_cell_value(row_data.get('ANTENNA_TYPE'))
    tower_height = format_cell_value(row_data.get('TOWER_HEIGHT'))
    antenna_height = format_cell_value(row_data.get('ANTENNA_HEIGHT'))
    azimuth = format_cell_value(row_data.get('DIRECTION'))
    m_tilt = format_cell_value(row_data.get('M-Tilt'))
    e_tilt = format_cell_value(row_data.get('E-Tilt'))
    pci = format_cell_value(row_data.get('PCI'))

    # Append MHz if numeric bandwidth
    if bw != "-" and not bw.lower().endswith("mhz"):
        bw_display = f"{bw} Mhz"
    else:
        bw_display = bw

    html = (
        '<STYLE TYPE="text/css">'
        'TD{font-family: Calibri, sans-serif; font-size: 8pt; color: Black;}'
        '.small-text{font-size: 6pt; color: #333;}'
        '</STYLE>'
        '<table border="1" cellspacing="0" cellpadding="2" style="border-collapse: collapse; width: 100%;">'
        '<tr>'
        f'<td style="text-align: center; vertical-align: middle; padding: 4px;"><b><img src="{left_logo}" width="184" height="56"></b></td>'
        f'<td style="text-align: center; vertical-align: middle; padding: 4px;"><center><img src="{right_logo}" width="184" height="56"></center></td>'
        '</tr>'
        f'<tr><td><b>WEEK.</b></td><td>{week}</td></tr>'
        f'<tr><td><b>SITENAME.</b></td><td>{sitename}</td></tr>'
        f'<tr><td><b>CELLNAME.</b></td><td>{cellname}</td></tr>'
        f'<tr><td><b>BAND.</b></td><td>{band}</td></tr>'
        f'<tr><td><b>DL PRB BDBH (%).</b></td><td bgcolor="#{color_dl}"><b><center>{dl_prb}</center></b></td></tr>'
        f'<tr><td><b>UL PRB BDBH (%).</b></td><td bgcolor="#{color_ul}"><b><center>{ul_prb}</center></b></td></tr>'
        f'<tr><td><b>RRC User BDBH.</b></td><td bgcolor="#{color_rrc}"><b><center>{rrc}</center></b></td></tr>'
        f'<tr><td><b>PAYLOAD (GB).</b></td><td><b><center>{payload_gb}</center></b></td></tr>'
        f'<tr><td><b>BANDWIDTH (MHz).</b></td><td>{bw_display}</td></tr>'
        f'<tr><td><b>LONGITUDE.</b></td><td>{lon}</td></tr>'
        f'<tr><td><b>LATITUDE.</b></td><td>{lat}</td></tr>'
        f'<tr><td><b>CLASS REV.</b></td><td>{class_rev}</td></tr>'
        f'<tr><td><b>NOP.</b></td><td>{nop}</td></tr>'
        f'<tr><td><b>RTPO.</b></td><td>{rtpo}</td></tr>'
        f'<tr><td><b>PROPINSI.</b></td><td>{propinsi}</td></tr>'
        f'<tr><td><b>KABUPATEN.</b></td><td>{kabupaten}</td></tr>'
        f'<tr><td><b>KECAMATAN.</b></td><td>{kecamatan}</td></tr>'
        f'<tr><td><b>DESA.</b></td><td>{desa}</td></tr>'
        f'<tr><td><b>SDR.</b></td><td>{sdr}</td></tr>'
        f'<tr><td><b>ANTENNA_TYPE.</b></td><td>{antenna_type}</td></tr>'
        f'<tr><td><b>TOWER_HEIGHT.</b></td><td>{tower_height}</td></tr>'
        f'<tr><td><b>ANTENNA_HEIGHT.</b></td><td>{antenna_height}</td></tr>'
        f'<tr><td><b>AZIMUTH.</b></td><td>{azimuth}</td></tr>'
        f'<tr><td><b>M-Tilt.</b></td><td>{m_tilt}</td></tr>'
        f'<tr><td><b>E-Tilt.</b></td><td>{e_tilt}</td></tr>'
        f'<tr><td><b>PCI.</b></td><td>{pci}</td></tr>'
        '</table>'
        '<table border="0" padding="0" style="margin-top: 4px;">'
        '<tr><td><span class="small-text"><b>©2026-Telkominfra- </b>danuartrianurrohman@telkominfra.com</span></td></tr>'
        '</table>'
    )
    return html

def convert_excel_to_prb_kml(
    file_bytes_or_path,
    color_by_metric: str = "DL_PRB",
    opacity_percent: int = DEFAULT_PRB_OPACITY,
    include_legend: bool = True,
    sheet_name: Optional[str] = "Sheet1",
    custom_bands: Optional[Dict[str, Dict[str, Any]]] = None,
    custom_ranges: Optional[Any] = None,
    left_logo_url: Optional[str] = None,
    right_logo_url: Optional[str] = None,
    legend_url: Optional[str] = None
) -> Tuple[bytes, Dict[str, Any]]:
    """
    Processes PRB Excel file and returns (kml_bytes, summary_dict).
    Supports custom bands, custom KPI ranges, selectable/custom header logos, and reliable fractional ScreenOverlay.
    """
    if isinstance(file_bytes_or_path, (bytes, bytearray)):
        file_obj = io.BytesIO(file_bytes_or_path)
    else:
        file_obj = file_bytes_or_path

    # Parse custom_bands if passed as JSON string
    if isinstance(custom_bands, str):
        try:
            custom_bands = json.loads(custom_bands)
        except Exception:
            custom_bands = None

    # Parse custom_ranges if passed as JSON string
    if isinstance(custom_ranges, str):
        try:
            custom_ranges = json.loads(custom_ranges)
        except Exception:
            custom_ranges = None

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

    # Setup Logos
    effective_left_logo = left_logo_url.strip() if (left_logo_url and left_logo_url.strip()) else DEFAULT_LEFT_LOGO
    effective_right_logo = right_logo_url.strip() if (right_logo_url and right_logo_url.strip()) else DEFAULT_RIGHT_LOGO

    kml = simplekml.Kml()
    kml.document.liststyle.listitemtype = ListItemType.checkhidechildren

    # ScreenOverlay for Legend with reliable fractional coordinates
    if include_legend:
        screen = kml.newscreenoverlay(name='Legend')
        effective_legend_url = legend_url.strip() if (legend_url and legend_url.strip()) else DEFAULT_LEGEND_URL
        screen.icon.href = effective_legend_url
        # Position at top-left with fractional screen coordinates (standard across all display sizes)
        screen.overlayxy = OverlayXY(x=0.02, y=0.98, xunits=Units.fraction, yunits=Units.fraction)
        screen.screenxy = ScreenXY(x=0.02, y=0.98, xunits=Units.fraction, yunits=Units.fraction)
        screen.size.x = 0.14
        screen.size.y = 0.24
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

            # Carrier band parameters (with custom_bands lookup)
            band_info = get_band_params(beam, custom_bands=custom_bands)
            altitude = band_info['altitude']
            beamwidth = band_info['beamwidth']
            radius_km = band_info['radius_km']

            # Determine colors (with custom_ranges support)
            color_dl = get_kpi_color(dl_prb, metric_type="DL_PRB", custom_ranges=custom_ranges)
            color_ul = get_kpi_color(ul_prb, metric_type="UL_PRB", custom_ranges=custom_ranges)
            color_rrc = get_kpi_color(rrc, metric_type="RRC", custom_ranges=custom_ranges)

            m_key = color_by_metric.upper()
            if "UL" in m_key:
                active_color = color_ul
            elif "RRC" in m_key:
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

            # Exact 24-row HTML Description Table
            row_dict = {str(k).strip(): v for k, v in row.items()}
            poligon.description = build_balloon_description(
                row_dict,
                left_logo=effective_left_logo,
                right_logo=effective_right_logo,
                color_dl=color_dl,
                color_ul=color_ul,
                color_rrc=color_rrc,
                dl_prb=dl_prb,
                ul_prb=ul_prb,
                rrc=rrc,
                payload_gb=payload_gb
            )
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
        "custom_bands_applied": bool(custom_bands),
        "custom_ranges_applied": bool(custom_ranges),
        "preview_rows": preview_rows,
    }
    return kml_str.encode('utf-8'), summary
