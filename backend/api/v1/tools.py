"""
RF TOOLS API Routes: Tool Catalog & Process Execution Endpoints
"""

import json
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, Query, HTTPException, Response
from fastapi.responses import Response, StreamingResponse
import io

from backend.schemas.models import ToolMetadata
from backend.tools.excel_to_kml import convert_excel_to_kml
from backend.tools.prb_kml import convert_excel_to_prb_kml
from backend.tools.isd_calculator import calculate_isd
from backend.tools.geohash_to_shp import convert_geohash_to_shp
from backend.tools.geohash_to_latlon import convert_geohash_to_latlon
from backend.tools.latlon_to_geohash import convert_latlon_to_geohash

router = APIRouter(prefix="/tools", tags=["tools"])

TOOLS_CATALOG = [
    ToolMetadata(
        id="excel-to-kml",
        title="Excel to Point KML Placemark Converter",
        category="KML & Site Visualization",
        category_id="kml_vis",
        description="Converts tabular site coordinates into Google Earth placemark KML files with custom icon styles, folders, and label colors.",
        icon="tool-excel-to-kml.svg",
        route="/tools/excel-to-kml",
        inputs=["Excel Workbook (.xlsx, .xls)"],
        outputs=["Google Earth Placemark (.kml)"],
        supported_formats=[".xlsx", ".xls"],
        documentation_summary="Reads site coordinates, styles placemarks with configurable scale/color, and packages points into a hierarchical KML folder.",
        sample_template_id="point_kml"
    ),
    ToolMetadata(
        id="prb-kml",
        title="Excel to PRB KML 3D Sector Polygon Visualizer",
        category="KML & Site Visualization",
        category_id="kml_vis",
        description="Generates extruded 3D antenna sector polygons color-coded by busy-hour DL/UL PRB utilization and connected RRC users.",
        icon="tool-prb-kml.svg",
        route="/tools/prb-kml",
        inputs=["Cell Metrics Excel (.xlsx) with Sheet1"],
        outputs=["3D Sector Extruded Polygon (.kml)"],
        supported_formats=[".xlsx"],
        documentation_summary="Models spherical geodesic antenna beams (LTE700-LTE2300) with carrier-specific altitudes, azimuths, PRB thresholds, and popup KPI tables.",
        sample_template_id="prb_kml"
    ),
    ToolMetadata(
        id="isd-calculator",
        title="Inter-Site Distance (ISD) Calculator",
        category="Network Topology & ISD",
        category_id="topology",
        description="Calculates great-circle Haversine distances between two site datasets (Source A to Target B) finding the N-nearest neighbors.",
        icon="tool-isd-calculator.svg",
        route="/tools/isd-calculator",
        inputs=["Source Sites (.xlsx)", "Candidate Sites (.xlsx)"],
        outputs=["Dual-sheet Excel (.xlsx) with Distances & Summary"],
        supported_formats=[".xlsx"],
        documentation_summary="Computes precise Haversine distance matrix (R=6371.0088km) and generates nearest neighbor rankings with summary statistics.",
        sample_template_id="isd_a"
    ),
    ToolMetadata(
        id="geohash-to-shp",
        title="Geohash to ESRI Shapefile Generator",
        category="Geospatial & Geohash Utilities",
        category_id="gis",
        description="Transforms geohash records into GIS vector polygon shapefile packages (.zip containing .shp, .shx, .dbf, .prj).",
        icon="tool-geohash-to-shp.svg",
        route="/tools/geohash-to-shp",
        inputs=["Geohash Spreadsheet (.xlsx, .xls, .csv)"],
        outputs=["ESRI Shapefile Archive (.zip)"],
        supported_formats=[".xlsx", ".xls", ".csv"],
        documentation_summary="Generates WGS84 bounding box or localized metric UTM square polygons, truncating and deduplicating DBF attributes.",
        sample_template_id="geohash"
    ),
    ToolMetadata(
        id="geohash-to-latlon",
        title="Geohash to Centroid Lat/Long Decoder",
        category="Geospatial & Geohash Utilities",
        category_id="gis",
        description="Decodes geohash string tokens into WGS84 decimal degree centroid coordinates (latitude and longitude).",
        icon="tool-geohash-to-latlon.svg",
        route="/tools/geohash-to-latlon",
        inputs=["Geohash Spreadsheet (.xlsx, .csv)"],
        outputs=["Spreadsheet with latitude/longitude columns"],
        supported_formats=[".xlsx", ".csv"],
        documentation_summary="Decodes base-32 geohashes to precise floating point coordinates, replacing conflicting fields cleanly.",
        sample_template_id="geohash"
    ),
    ToolMetadata(
        id="latlon-to-geohash",
        title="Lat/Long to Geohash Encoder",
        category="Geospatial & Geohash Utilities",
        category_id="gis",
        description="Encodes paired geographic latitude/longitude coordinates into standardized geohash string tokens with custom precision.",
        icon="tool-latlon-to-geohash.svg",
        route="/tools/latlon-to-geohash",
        inputs=["Coordinate Spreadsheet (.xlsx, .csv)"],
        outputs=["Spreadsheet with geohash column"],
        supported_formats=[".xlsx", ".csv"],
        documentation_summary="Encodes coordinate pairs into geohashes with user-defined precision (1 to 12) for spatial indexing.",
        sample_template_id="latlon"
    ),
]

@router.get("", response_model=List[ToolMetadata])
async def list_tools():
    """Returns catalog of all registered RF and GIS tools."""
    return TOOLS_CATALOG

@router.get("/{tool_id}", response_model=ToolMetadata)
async def get_tool(tool_id: str):
    """Returns detailed metadata for a specific tool."""
    for t in TOOLS_CATALOG:
        if t.id == tool_id:
            return t
    raise HTTPException(status_code=404, detail=f"Tool '{tool_id}' not found.")

@router.post("/excel-to-kml/process")
async def process_excel_to_kml(
    file: UploadFile = File(...),
    folder_name: str = Form("SITENAME"),
    icon_url: Optional[str] = Form(None),
    color_rgb: Optional[str] = Form(None),
    label_color: Optional[str] = Form(None),
    scale: float = Form(0.7),
    lat_col: Optional[str] = Form(None),
    lon_col: Optional[str] = Form(None),
    name_col: Optional[str] = Form(None),
    preview: bool = Query(False)
):
    """Converts Excel site locations into a Point KML placemark file."""
    try:
        content = await file.read()
        kml_bytes, summary = convert_excel_to_kml(
            content,
            folder_name=folder_name,
            icon_url=icon_url,
            color_rgb=color_rgb or (85, 0, 0),
            label_color=label_color or (255, 255, 0),
            scale=scale,
            lat_col=lat_col,
            lon_col=lon_col,
            name_col=name_col
        )
        if preview:
            return {"success": True, "summary": summary}

        filename = f"{folder_name or 'sites'}.kml"
        headers = {
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Summary": json.dumps(summary)
        }
        return Response(content=kml_bytes, media_type="application/vnd.google-earth.kml+xml", headers=headers)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@router.post("/prb-kml/process")
async def process_prb_kml(
    file: UploadFile = File(...),
    color_by_metric: str = Form("DL_PRB"),
    opacity_percent: int = Form(40),
    include_legend: bool = Form(True),
    sheet_name: Optional[str] = Form("Sheet1"),
    custom_bands: Optional[str] = Form(None),
    custom_ranges: Optional[str] = Form(None),
    left_logo_url: Optional[str] = Form(None),
    right_logo_url: Optional[str] = Form(None),
    legend_url: Optional[str] = Form(None),
    preview: bool = Query(False)
):
    """Converts cell metrics into a 3D PRB KML sector file with custom bands, ranges, and logos."""
    try:
        content = await file.read()
        kml_bytes, summary = convert_excel_to_prb_kml(
            content,
            color_by_metric=color_by_metric,
            opacity_percent=opacity_percent,
            include_legend=include_legend,
            sheet_name=sheet_name,
            custom_bands=custom_bands,
            custom_ranges=custom_ranges,
            left_logo_url=left_logo_url,
            right_logo_url=right_logo_url,
            legend_url=legend_url
        )
        if preview:
            return {"success": True, "summary": summary}

        headers = {
            "Content-Disposition": 'attachment; filename="PRB_Sectors.kml"',
            "X-Summary": json.dumps(summary)
        }
        return Response(content=kml_bytes, media_type="application/vnd.google-earth.kml+xml", headers=headers)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@router.post("/isd-calculator/process")
async def process_isd_calculator(
    file_a: UploadFile = File(...),
    file_b: UploadFile = File(...),
    n_nearest: int = Form(1),
    distance_unit: str = Form("km"),
    lat_col_a: Optional[str] = Form(None),
    lon_col_a: Optional[str] = Form(None),
    name_col_a: Optional[str] = Form(None),
    lat_col_b: Optional[str] = Form(None),
    lon_col_b: Optional[str] = Form(None),
    name_col_b: Optional[str] = Form(None),
    preview: bool = Query(False)
):
    """Calculates nearest neighbor distances between File A and File B (supports km and m units)."""
    try:
        content_a = await file_a.read()
        content_b = await file_b.read()
        xlsx_bytes, summary = calculate_isd(
            content_a,
            content_b,
            n_nearest=n_nearest,
            distance_unit=distance_unit,
            lat_col_a=lat_col_a,
            lon_col_a=lon_col_a,
            name_col_a=name_col_a,
            lat_col_b=lat_col_b,
            lon_col_b=lon_col_b,
            name_col_b=name_col_b
        )
        if preview:
            return {"success": True, "summary": summary}

        headers = {
            "Content-Disposition": 'attachment; filename="ISD_Results.xlsx"',
            "X-Summary": json.dumps(summary)
        }
        return Response(
            content=xlsx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=headers
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@router.post("/geohash-to-shp/process")
async def process_geohash_to_shp(
    file: UploadFile = File(...),
    geohash_col: Optional[str] = Form(None),
    mode: str = Form("default"),
    size_m: float = Form(500.0),
    preview: bool = Query(False)
):
    """Transforms geohash records into an ESRI Shapefile bundle (.zip)."""
    try:
        content = await file.read()
        zip_bytes, summary = convert_geohash_to_shp(
            content,
            filename=file.filename or "data.xlsx",
            geohash_col=geohash_col,
            mode=mode,
            size_m=size_m
        )
        if preview:
            return {"success": True, "summary": summary}

        headers = {
            "Content-Disposition": 'attachment; filename="geohash_shapefile.zip"',
            "X-Summary": json.dumps(summary)
        }
        return Response(content=zip_bytes, media_type="application/zip", headers=headers)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@router.post("/geohash-to-latlon/process")
async def process_geohash_to_latlon(
    file: UploadFile = File(...),
    geohash_col: Optional[str] = Form(None),
    output_format: str = Form("xlsx"),
    preview: bool = Query(False)
):
    """Decodes geohashes into latitude and longitude columns."""
    try:
        content = await file.read()
        file_bytes, summary = convert_geohash_to_latlon(
            content,
            filename=file.filename or "data.xlsx",
            geohash_col=geohash_col,
            output_format=output_format
        )
        if preview:
            return {"success": True, "summary": summary}

        media_type = "text/csv" if output_format.lower() == "csv" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        out_ext = "csv" if output_format.lower() == "csv" else "xlsx"
        headers = {
            "Content-Disposition": f'attachment; filename="geohash_coordinates.{out_ext}"',
            "X-Summary": json.dumps(summary)
        }
        return Response(content=file_bytes, media_type=media_type, headers=headers)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@router.post("/latlon-to-geohash/process")
async def process_latlon_to_geohash(
    file: UploadFile = File(...),
    lat_col: Optional[str] = Form(None),
    lon_col: Optional[str] = Form(None),
    precision: int = Form(7),
    output_format: str = Form("xlsx"),
    preview: bool = Query(False)
):
    """Encodes coordinate pairs into geohashes."""
    try:
        content = await file.read()
        file_bytes, summary = convert_latlon_to_geohash(
            content,
            filename=file.filename or "data.xlsx",
            lat_col=lat_col,
            lon_col=lon_col,
            precision=precision,
            output_format=output_format
        )
        if preview:
            return {"success": True, "summary": summary}

        media_type = "text/csv" if output_format.lower() == "csv" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        out_ext = "csv" if output_format.lower() == "csv" else "xlsx"
        headers = {
            "Content-Disposition": f'attachment; filename="coordinates_geohash.{out_ext}"',
            "X-Summary": json.dumps(summary)
        }
        return Response(content=file_bytes, media_type=media_type, headers=headers)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))
