"""
RF TOOLS Constants & Engineering Parameters
Defines standard telecom parameters, 3GPP thresholds, and GIS projections.
"""

from typing import Optional, Dict, Any, List

# Earth Radius Constants
EARTH_RADIUS_GEODESIC_KM = 6371.0       # Used for sector forward geodesic projection
EARTH_RADIUS_HAVERSINE_KM = 6371.0088    # Used for Inter-Site Distance (Haversine formula)

# Band Lookup Table: (Altitude in meters, Beamwidth in degrees, Sector Radius in km)
BAND_PARAMETERS = {
    "LTE700": {"altitude": 42, "beamwidth": 23, "radius_km": 0.038},
    "LTE900": {"altitude": 40, "beamwidth": 23, "radius_km": 0.042},
    "LTE1800": {"altitude": 38, "beamwidth": 23, "radius_km": 0.046},
    "LTE2100": {"altitude": 36, "beamwidth": 23, "radius_km": 0.050},
    "LTE2300-1st": {"altitude": 34, "beamwidth": 25, "radius_km": 0.054},
    "LTE2300-2nd": {"altitude": 32, "beamwidth": 25, "radius_km": 0.058},
    "LTE2300-3rd": {"altitude": 30, "beamwidth": 25, "radius_km": 0.062},
}

DEFAULT_BAND_PARAM = {"altitude": 28, "beamwidth": 27, "radius_km": 0.080}

def get_band_params(beam: str, custom_bands: Optional[Dict[str, Dict[str, Any]]] = None) -> dict:
    """Return altitude, beamwidth, and radius for a given carrier beam with custom bands support."""
    if not beam:
        return DEFAULT_BAND_PARAM
    key = str(beam).strip()
    key_upper = key.upper()

    # Check custom bands first
    if custom_bands and isinstance(custom_bands, dict):
        for cb_name, cb_vals in custom_bands.items():
            if str(cb_name).strip().upper() == key_upper and isinstance(cb_vals, dict):
                return {
                    "altitude": float(cb_vals.get("altitude", DEFAULT_BAND_PARAM["altitude"])),
                    "beamwidth": float(cb_vals.get("beamwidth", DEFAULT_BAND_PARAM["beamwidth"])),
                    "radius_km": float(cb_vals.get("radius_km", DEFAULT_BAND_PARAM["radius_km"])),
                }

    # Standard lookup
    for band_name, band_vals in BAND_PARAMETERS.items():
        if band_name.upper() == key_upper:
            return band_vals

    return DEFAULT_BAND_PARAM

# Telecom KPI Color Lookup Functions (Hex format without leading '#')
def get_dl_prb_color(dl_prb: float) -> str:
    """Determine hex color based on DL PRB utilization (%)."""
    if dl_prb == 0:
        return 'BFBFBF'
    elif 0 < dl_prb <= 35:
        return '0000FF'  # Cobalt Blue
    elif 35 < dl_prb <= 60:
        return '00FF00'  # Emerald Green
    elif 60 < dl_prb <= 75:
        return 'FFFF00'  # Electric Yellow
    elif 75 < dl_prb <= 90:
        return 'FFBF00'  # Amber Orange
    elif dl_prb > 90:
        return 'FF0000'  # Vivid Red
    return 'FFFFFF'

def get_ul_prb_color(ul_prb: float) -> str:
    """Determine hex color based on UL PRB utilization (%)."""
    if ul_prb == 0:
        return 'BFBFBF'
    elif 0 < ul_prb <= 35:
        return '0000FF'
    elif 35 < ul_prb <= 60:
        return '00FF00'
    elif 60 < ul_prb <= 75:
        return 'FFFF00'
    elif 75 < ul_prb <= 90:
        return 'FFBF00'
    elif ul_prb > 90:
        return 'FF0000'
    return 'FFFFFF'

def get_rrc_color(rrc: float) -> str:
    """Determine hex color based on active RRC user count."""
    if rrc == 0:
        return 'BFBFBF'
    elif 0 < rrc <= 40:
        return '0000FF'
    elif 40 < rrc <= 60:
        return '00FF00'
    elif 60 < rrc <= 90:
        return 'FFFF00'
    elif 90 < rrc <= 120:
        return 'FFBF00'
    elif rrc > 120:
        return 'FF0000'
    return 'FFFFFF'

def get_kpi_color(val: float, metric_type: str = "DL_PRB", custom_ranges: Optional[Any] = None) -> str:
    """
    Evaluates value against custom_ranges if provided, else falls back to default 3GPP thresholds.
    custom_ranges can be:
      - A dict with keys 'dl_prb', 'ul_prb', 'rrc', each containing a list of {min, max, color}
      - A direct list of {min, max, color}
    """
    if custom_ranges:
        ranges_list = None
        if isinstance(custom_ranges, dict):
            m_key = str(metric_type).lower().replace(" ", "_")
            if m_key in custom_ranges:
                ranges_list = custom_ranges[m_key]
            elif "ranges" in custom_ranges:
                ranges_list = custom_ranges["ranges"]
        elif isinstance(custom_ranges, list):
            ranges_list = custom_ranges

        if ranges_list and isinstance(ranges_list, list):
            for r in ranges_list:
                try:
                    r_min = float(r.get("min", 0))
                    r_max = float(r.get("max", 999999))
                    color = str(r.get("color", "FFFFFF")).lstrip("#").upper()
                    if r_min == 0 and r_max == 0:
                        if val == 0:
                            return color
                    elif r_min < val <= r_max or (r_min == 0 and val == 0):
                        return color
                    elif r_min <= val <= r_max:
                        return color
                except Exception:
                    continue

    # Fallback to standard 3GPP functions
    m_norm = str(metric_type).upper()
    if "UL" in m_norm:
        return get_ul_prb_color(val)
    elif "RRC" in m_norm:
        return get_rrc_color(val)
    else:
        return get_dl_prb_color(val)

# Default KML Styles
DEFAULT_POINT_ICON = "http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png"
DEFAULT_POINT_COLOR = (85, 0, 0)
DEFAULT_LABEL_COLOR = (255, 255, 0)
DEFAULT_POINT_SCALE = 0.7
DEFAULT_PRB_OPACITY = 40  # 40% alpha fill

# Default Logo & Legend Assets
DEFAULT_LEFT_LOGO = "https://raw.githubusercontent.com/danuar20/image/main/Infra.png"
DEFAULT_RIGHT_LOGO = "https://raw.githubusercontent.com/danuar20/image/main/PUMA.png"
DEFAULT_RF_TOOLS_LEFT_LOGO = "assets/logos/rf_tools_logo_left.png"
DEFAULT_RF_TOOLS_RIGHT_LOGO = "assets/logos/rf_tools_logo_right.png"
DEFAULT_LEGEND_URL = "https://raw.githubusercontent.com/danuar20/image/main/Legend.png"
