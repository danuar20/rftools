"""
Geohash Conversion API Router
Provides bidirectional point conversion between Geohash and Latitude/Longitude coordinates.
Supports selectable precision (1-12), bounding box boundaries, dimensions, and adjacent neighbors.
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Body, Request
from pydantic import BaseModel, Field

from backend.tools.geohash_converter import convert_geohash_point

router = APIRouter(prefix="/geohash", tags=["geohash"])

class GeohashConvertRequest(BaseModel):
    geohash: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    lng: Optional[float] = None
    precision: Optional[int] = Field(None, ge=1, le=12)

async def _handle_conversion(
    geohash: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    lng: Optional[float] = None,
    precision: Optional[int] = None
) -> Dict[str, Any]:
    eff_lat = latitude if latitude is not None else lat
    eff_lon = longitude if longitude is not None else (lon if lon is not None else lng)

    try:
        return convert_geohash_point(
            geohash=geohash,
            latitude=eff_lat,
            longitude=eff_lon,
            precision=precision
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Conversion error: {str(exc)}")

@router.get("/convert")
async def convert_geohash_get(
    geohash: Optional[str] = Query(None, description="Geohash string (1-12 chars)"),
    latitude: Optional[float] = Query(None, description="Latitude in decimal degrees (-90 to 90)"),
    longitude: Optional[float] = Query(None, description="Longitude in decimal degrees (-180 to 180)"),
    lat: Optional[float] = Query(None, description="Latitude alias"),
    lon: Optional[float] = Query(None, description="Longitude alias"),
    lng: Optional[float] = Query(None, description="Longitude alias"),
    precision: Optional[int] = Query(None, ge=1, le=12, description="Target geohash precision (1-12)")
):
    """Bidirectional conversion between Geohash and Lat/Long via GET query parameters."""
    return await _handle_conversion(
        geohash=geohash,
        latitude=latitude,
        longitude=longitude,
        lat=lat,
        lon=lon,
        lng=lng,
        precision=precision
    )

@router.post("/convert")
async def convert_geohash_post(
    request: Request,
    payload: Optional[GeohashConvertRequest] = Body(None),
    geohash: Optional[str] = Query(None),
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
    precision: Optional[int] = Query(None)
):
    """Bidirectional conversion between Geohash and Lat/Long via POST JSON body or Form data."""
    gh = None
    lat_val = None
    lon_val = None
    prec = None

    if payload:
        gh = payload.geohash
        lat_val = payload.latitude if payload.latitude is not None else payload.lat
        lon_val = payload.longitude if payload.longitude is not None else (payload.lon if payload.lon is not None else payload.lng)
        prec = payload.precision

    if gh is None and lat_val is None and lon_val is None:
        try:
            form = await request.form()
            if form:
                gh = form.get("geohash")
                lat_raw = form.get("latitude") or form.get("lat")
                lon_raw = form.get("longitude") or form.get("lon") or form.get("lng")
                prec_raw = form.get("precision")
                if lat_raw is not None:
                    lat_val = float(lat_raw)
                if lon_raw is not None:
                    lon_val = float(lon_raw)
                if prec_raw is not None:
                    prec = int(prec_raw)
        except Exception:
            pass

    if gh is None and geohash is not None:
        gh = geohash
    if lat_val is None and latitude is not None:
        lat_val = latitude
    if lon_val is None and longitude is not None:
        lon_val = longitude
    if prec is None and precision is not None:
        prec = precision

    return await _handle_conversion(
        geohash=gh,
        latitude=lat_val,
        longitude=lon_val,
        precision=prec
    )
