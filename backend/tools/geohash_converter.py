"""
Geohash Point Converter Engine
Bidirectional point conversion between Geohash strings and Latitude/Longitude coordinates.
Provides selectable precision (1-12), bounding box boundaries, dimensions, and 8-neighbor cells.
Inspired by geohash.co.
"""

import math
import re
from typing import Optional, Dict, Any
import pygeohash as pgh

BASE32_ALPHABET = "0123456789bcdefghjkmnpqrstuvwxyz"
BASE32_SET = set(BASE32_ALPHABET)
EARTH_RADIUS_KM = 6371.0088

def is_valid_geohash(geohash: str) -> bool:
    """Checks if a string is a valid Geohash."""
    if not geohash or not isinstance(geohash, str):
        return False
    s = geohash.strip().lower()
    if len(s) < 1 or len(s) > 12:
        return False
    return set(s).issubset(BASE32_SET)

def get_geohash_neighbors(gh: str) -> Dict[str, Optional[str]]:
    """Calculates all 8 adjacent neighbor geohash cells (N, S, E, W, NE, NW, SE, SW)."""
    neighbors: Dict[str, Optional[str]] = {
        "n": None, "s": None, "e": None, "w": None,
        "ne": None, "nw": None, "se": None, "sw": None
    }
    try:
        top = pgh.get_adjacent(gh, "top")
        bottom = pgh.get_adjacent(gh, "bottom")
        right = pgh.get_adjacent(gh, "right")
        left = pgh.get_adjacent(gh, "left")

        neighbors["n"] = top
        neighbors["s"] = bottom
        neighbors["e"] = right
        neighbors["w"] = left

        if top:
            neighbors["ne"] = pgh.get_adjacent(top, "right")
            neighbors["nw"] = pgh.get_adjacent(top, "left")
        if bottom:
            neighbors["se"] = pgh.get_adjacent(bottom, "right")
            neighbors["sw"] = pgh.get_adjacent(bottom, "left")
    except Exception:
        pass
    return neighbors

def convert_geohash_point(
    geohash: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    precision: Optional[int] = None
) -> Dict[str, Any]:
    """
    Performs bidirectional conversion between Geohash and Lat/Long coordinates.
    Either geohash OR (latitude, longitude) must be provided.
    """
    if geohash is not None and str(geohash).strip():
        gh_clean = str(geohash).strip().lower()
        if not is_valid_geohash(gh_clean):
            raise ValueError(f"Invalid geohash string '{geohash}'. Must contain 1-12 base32 characters ({BASE32_ALPHABET}).")

        # If custom precision requested, truncate or re-encode
        if precision is not None:
            if not (1 <= precision <= 12):
                raise ValueError("Precision must be an integer between 1 and 12.")
            if precision < len(gh_clean):
                gh_clean = gh_clean[:precision]
            elif precision > len(gh_clean):
                # Decode and re-encode with higher precision
                lat_c, lon_c = pgh.decode(gh_clean)
                gh_clean = pgh.encode(lat_c, lon_c, precision=precision)

        effective_precision = len(gh_clean)
        exact = pgh.decode_exactly(gh_clean)
        lat_center = float(exact.latitude)
        lon_center = float(exact.longitude)
        lat_err = float(exact.latitude_error)
        lon_err = float(exact.longitude_error)
        conversion_type = "geohash_to_latlon"

    elif latitude is not None and longitude is not None:
        try:
            lat_val = float(latitude)
            lon_val = float(longitude)
        except (TypeError, ValueError):
            raise ValueError("Latitude and Longitude must be valid numbers.")

        if not (-90.0 <= lat_val <= 90.0):
            raise ValueError(f"Latitude {lat_val} out of range. Must be between -90.0 and +90.0 degrees.")
        if not (-180.0 <= lon_val <= 180.0):
            raise ValueError(f"Longitude {lon_val} out of range. Must be between -180.0 and +180.0 degrees.")

        prec = 8 if precision is None else int(precision)
        if not (1 <= prec <= 12):
            raise ValueError("Precision must be an integer between 1 and 12.")

        gh_clean = pgh.encode(lat_val, lon_val, precision=prec)
        effective_precision = prec
        exact = pgh.decode_exactly(gh_clean)
        lat_center = float(exact.latitude)
        lon_center = float(exact.longitude)
        lat_err = float(exact.latitude_error)
        lon_err = float(exact.longitude_error)
        conversion_type = "latlon_to_geohash"

    else:
        raise ValueError("Either 'geohash' or both 'latitude' and 'longitude' must be provided.")

    # Calculate bounding box
    min_lat = round(lat_center - lat_err, 9)
    max_lat = round(lat_center + lat_err, 9)
    min_lon = round(lon_center - lon_err, 9)
    max_lon = round(lon_center + lon_err, 9)

    # Approximate physical dimensions in meters / km
    lat_span_deg = max_lat - min_lat
    lon_span_deg = max_lon - min_lon
    height_km = lat_span_deg * (math.pi / 180.0) * EARTH_RADIUS_KM
    width_km = lon_span_deg * (math.pi / 180.0) * EARTH_RADIUS_KM * math.cos(math.radians(lat_center))

    neighbors = get_geohash_neighbors(gh_clean)

    return {
        "success": True,
        "conversion_type": conversion_type,
        "geohash": gh_clean,
        "latitude": round(lat_center, 8),
        "longitude": round(lon_center, 8),
        "precision": effective_precision,
        "bounding_box": {
            "min_lat": min_lat,
            "max_lat": max_lat,
            "min_lon": min_lon,
            "max_lon": max_lon,
            "south": min_lat,
            "north": max_lat,
            "west": min_lon,
            "east": max_lon
        },
        "error": {
            "latitude_error": round(lat_err, 9),
            "longitude_error": round(lon_err, 9)
        },
        "dimensions": {
            "latitude_deg": round(lat_span_deg, 9),
            "longitude_deg": round(lon_span_deg, 9),
            "height_km": round(height_km, 4),
            "width_km": round(width_km, 4),
            "height_m": round(height_km * 1000.0, 2),
            "width_m": round(width_km * 1000.0, 2)
        },
        "neighbors": neighbors
    }
