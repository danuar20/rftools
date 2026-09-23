"""
RF TOOLS FastAPI Main Application Entrypoint
Target port: 5005
"""

import os
import time
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from backend.config import HOST, PORT, CORS_ORIGINS, APP_ENV
from backend.api.v1.tools import router as tools_router
from backend.api.v1.templates import router as templates_router
from backend.api.v1.inspect import router as inspect_router
from backend.api.v1.geohash import router as geohash_router

app = FastAPI(
    title="RF TOOLS API",
    description="Interactive Radio Frequency & Geospatial Calculation Suite",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# GZip Compression Middleware (compress responses >= 1000 bytes)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Global Request Timing, Smart Caching & Error Sanitizer
@app.middleware("http")
async def add_process_time_and_security(request: Request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = f"{process_time:.4f}s"

        path = request.url.path
        content_type = response.headers.get("content-type", "")

        is_html = (
            path in ("/", "/app", "/index.html")
            or path.startswith("/app/")
            or "text/html" in content_type
        )
        is_static = path.startswith("/static/") or path.startswith("/assets/")

        if is_html:
            # HTML shell is always uncached for instantaneous updates & fresh asset links
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        elif is_static:
            # Smart caching: versioned assets (e.g. ?v=1.1.1) get long-lived immutable cache
            is_versioned = bool(
                request.query_params.get("v")
                or request.query_params.get("version")
                or request.query_params.get("hash")
                or request.query_params.get("t")
            )
            if is_versioned:
                response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
                if "pragma" in response.headers:
                    del response.headers["pragma"]
                if "expires" in response.headers:
                    del response.headers["expires"]
            else:
                response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
                response.headers["Pragma"] = "no-cache"
                response.headers["Expires"] = "0"
        elif path in ("/robots.txt", "/sitemap.xml"):
            response.headers["Cache-Control"] = "public, max-age=86400"
            if "pragma" in response.headers:
                del response.headers["pragma"]
            if "expires" in response.headers:
                del response.headers["expires"]

        return response
    except Exception as exc:
        process_time = time.time() - start_time
        # Sanitized error response - do not leak stack traces in production
        return JSONResponse(
            status_code=500,
            content={
                "type": "about:blank",
                "title": "Internal Server Error",
                "status": 500,
                "detail": "An unexpected calculation error occurred. Please verify your dataset and column mappings.",
                "instance": str(request.url.path)
            },
            headers={"X-Process-Time": f"{process_time:.4f}s"}
        )

# Register API v1 Routers
app.include_router(tools_router, prefix="/api/v1")
app.include_router(templates_router, prefix="/api/v1")
app.include_router(inspect_router, prefix="/api/v1")
app.include_router(geohash_router, prefix="/api/v1")

# Mount static assets if directory exists
if os.path.isdir("assets"):
    app.mount("/assets", StaticFiles(directory="assets"), name="assets")

# Mount frontend static directory if exists
if os.path.isdir("frontend"):
    app.mount("/static", StaticFiles(directory="frontend"), name="static")

# Health Check & Root Endpoints
@app.get("/api/v1/health", tags=["system"])
@app.get("/health", tags=["system"])
async def health_check():
    return {
        "status": "healthy",
        "service": "rf-tools-backend",
        "version": "1.0.0",
        "port": PORT,
        "environment": APP_ENV,
        "engines": {
            "excel_to_kml": "active",
            "prb_kml": "active",
            "isd_calculator": "active",
            "geohash_to_shp": "active",
            "geohash_to_latlon": "active",
            "latlon_to_geohash": "active",
            "geohash_converter": "active"
        }
    }

@app.get("/", tags=["system"])
async def root(request: Request):
    accept = request.headers.get("accept", "")
    if "text/html" in accept and os.path.isfile("frontend/index.html"):
        return FileResponse("frontend/index.html")
    if "application/json" in accept:
        return {
            "name": "RF TOOLS Engineering Suite",
            "tagline": "Professional RF Engineering Tools — Calculate, Analyze, and Design with Confidence.",
            "status": "online",
            "docs": "/api/docs",
            "api_v1": "/api/v1/tools",
            "port": PORT
        }
    if os.path.isfile("frontend/index.html"):
        return FileResponse("frontend/index.html")
    return {
        "name": "RF TOOLS Engineering Suite",
        "tagline": "Professional RF Engineering Tools — Calculate, Analyze, and Design with Confidence.",
        "status": "online",
        "docs": "/api/docs",
        "api_v1": "/api/v1/tools",
        "port": PORT
    }

@app.get("/index.html", tags=["frontend"])
@app.get("/app", tags=["frontend"])
@app.get("/app/{path:path}", tags=["frontend"])
async def serve_frontend_app(path: str = ""):
    if os.path.isfile("frontend/index.html"):
        return FileResponse("frontend/index.html")
    return JSONResponse(status_code=404, content={"detail": "Frontend application not found"})

@app.get("/robots.txt", tags=["seo"], include_in_schema=False)
async def serve_robots_txt():
    for candidate in ("frontend/robots.txt", "robots.txt"):
        if os.path.isfile(candidate):
            return FileResponse(candidate, media_type="text/plain")
    return Response(
        content="User-agent: *\nAllow: /\nSitemap: https://rftools.infrahub.web.id/sitemap.xml\n",
        media_type="text/plain"
    )

@app.get("/sitemap.xml", tags=["seo"], include_in_schema=False)
async def serve_sitemap_xml():
    for candidate in ("frontend/sitemap.xml", "sitemap.xml"):
        if os.path.isfile(candidate):
            return FileResponse(candidate, media_type="application/xml")
    return Response(
        content="<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n  <url><loc>https://rftools.infrahub.web.id/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>\n</urlset>",
        media_type="application/xml"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=(APP_ENV == "development"))
