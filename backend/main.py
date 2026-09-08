"""
RF TOOLS FastAPI Main Application Entrypoint
Target port: 5005
"""

import os
import tempfile
import time

# Ensure tempfile uses a stable system temp directory regardless of task-scoped TMPDIR
if not os.path.exists(tempfile.gettempdir()) or "multica-task" in os.environ.get("TMPDIR", ""):
    os.environ["TMPDIR"] = "/tmp"
    os.environ["TEMP"] = "/tmp"
    os.environ["TMP"] = "/tmp"
    tempfile.tempdir = "/tmp"

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from backend.config import HOST, PORT, CORS_ORIGINS, APP_ENV
from backend.api.v1.tools import router as tools_router
from backend.api.v1.templates import router as templates_router
from backend.api.v1.inspect import router as inspect_router

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
)

# Global Request Timing & Error Sanitizer
@app.middleware("http")
async def add_process_time_and_security(request: Request, call_next):
    if not tempfile.tempdir or not os.path.isdir(tempfile.tempdir):
        tempfile.tempdir = "/tmp"
    start_time = time.time()
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = f"{process_time:.4f}s"
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
            "latlon_to_geohash": "active"
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=(APP_ENV == "development"))
