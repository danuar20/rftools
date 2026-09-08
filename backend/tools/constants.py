"""
RF TOOLS Constants & Engineering Parameters
Defines standard telecom parameters, 3GPP thresholds, and GIS projections.
"""

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

def get_band_params(beam: str) -> dict:
    """Return altitude, beamwidth, and radius for a given carrier beam."""
    if not beam:
        return DEFAULT_BAND_PARAM
    key = str(beam).strip()
    return BAND_PARAMETERS.get(key, DEFAULT_BAND_PARAM)

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

# Default KML Styles
DEFAULT_POINT_ICON = "http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png"
DEFAULT_POINT_COLOR = (85, 0, 0)
DEFAULT_LABEL_COLOR = (255, 255, 0)
DEFAULT_POINT_SCALE = 0.7
DEFAULT_PRB_OPACITY = 40  # 40% alpha fill
