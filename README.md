# RF TOOLS: Interactive RF Engineering Web Application

> Professional RF Engineering Tools — Calculate, Analyze, and Design with Confidence.

**RF TOOLS** is a unified, cloud-ready engineering web platform designed to centralize and modernize Radio Frequency (RF) and Geospatial (GIS) desktop calculation scripts into a high-performance, modular web application powered by **FastAPI** running on port **`5005`**.

---

## 1. Project Overview

Cellular planning engineers, radio network optimization (RNO) specialists, and GIS analysts frequently rely on disparate Tkinter/Python desktop scripts for site mapping, sector KPI visualization, inter-site distance matrix calculations, and spatial geohash transformations. 

RF TOOLS consolidates these utilities into an interactive, modular web architecture while **preserving 100% of underlying calculation algorithms, constants, and engineering logic**.

---

## 2. Features

### Core Calculation Engines (Modularized in `backend/tools/`):
1. **Excel to Point KML Converter (`/tools/excel-to-kml`):**
   - Converts tabular site coordinates into styled Google Earth Placemark KML points.
   - Configurable icon URLs, folder hierarchies, scale multipliers, and label colors.
   - Heuristic column detection (`LAT`, `LONG`, `Site`, `SITENAME`).

2. **Excel to PRB KML 3D Sector Polygon Visualizer (`/tools/prb-kml`):**
   - Forward spherical geodesic projection of 3D antenna sector polygons.
   - Carrier band parameter lookups (`LTE700`, `LTE900`, `LTE1800`, `LTE2100`, `LTE2300-1st/2nd/3rd`).
   - 3GPP busy-hour Physical Resource Block (DL/UL PRB) and connected RRC user color coding.
   - Rich HTML description tables, altitude extrusion, and Google Earth screen legend overlays.

3. **Inter-Site Distance (ISD) Calculator (`/tools/isd-calculator`):**
   - High-precision Haversine formula calculation ($R = 6371.0088\text{ km}$).
   - Computes $N$-nearest neighbors (1 to 5) between Source File A and Target File B.
   - Generates dual-sheet Excel outputs (`ISD_Result` rankings and `Summary` statistics: count, min, mean, max).

4. **Geohash to ESRI Shapefile Generator (`/tools/geohash-to-shp`):**
   - Decodes geohash tokens into GIS vector polygon shapefile packages (`.zip` containing `.shp`, `.shx`, `.dbf`, `.prj`).
   - Supports both standard WGS84 bounding box and metric localized UTM custom squares.
   - Enforces strict ESRI DBF 10-character field truncation and collision deduplication.

5. **Geohash to Centroid Lat/Long Decoder (`/tools/geohash-to-latlon`):**
   - Decodes base-32 geohashes into decimal degree coordinates (`latitude`, `longitude`).
   - Clean collision handling and spreadsheet export (`.xlsx` or `.csv`).

6. **Lat/Long to Geohash Encoder (`/tools/latlon-to-geohash`):**
   - Encodes geographic coordinate pairs into standardized geohash string tokens with customizable precision (1 to 12).

### System & Developer Features:
- **Heuristic Column Inspector (`/api/v1/inspect-columns`):** Instant pre-execution column inspection with fuzzy matching and confidence scores.
- **Sample Reference Templates (`/api/v1/templates/{id}`):** Downloadable Excel templates with embedded formulas and valid telecom data.
- **RESTful OpenAPI Documentation:** Fully documented endpoints accessible at `/api/docs`.

---

## 3. Technology Stack

- **Runtime & Language:** Python 3.10+ (tested on Python 3.13)
- **Web Framework:** FastAPI (asynchronous ASGI, Pydantic v2 data validation)
- **Server:** Uvicorn (`uvicorn[standard]`) on port `5005`
- **Calculation Engines:**
  - **Tabular Data:** Pandas, OpenPyXL
  - **KML Generation:** SimpleKML
  - **Geospatial & Vector:** GeoPandas, Shapely, PyProj, PyGeohash
- **Testing:** Pytest (33 unit and integration tests), HTTPX

---

## 4. Requirements & Installation

### Prerequisites
- Python 3.10+ installed
- Standard build tools

### Setup Local Virtual Environment

```bash
# Clone or navigate to the repository
cd rf-tools

# Create dedicated virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default configuration:
```env
APP_ENV=development
HOST=0.0.0.0
PORT=5005
CORS_ORIGINS=*
```

---

## 5. Running the Application

Start the FastAPI server via Uvicorn on mandatory port `5005`:

```bash
./venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 5005
```

The application, frontend UI, and documentation are accessible at:
- **Interactive Web Workstation:** [http://localhost:5005](http://localhost:5005) (Serves the complete frontend single-page application)
- **Interactive Swagger Docs:** [http://localhost:5005/api/docs](http://localhost:5005/api/docs)
- **Redoc Documentation:** [http://localhost:5005/api/redoc](http://localhost:5005/api/redoc)
- **Health Check:** [http://localhost:5005/api/v1/health](http://localhost:5005/api/v1/health)
- **Tools Catalog:** [http://localhost:5005/api/v1/tools](http://localhost:5005/api/v1/tools)

---

## 6. Frontend Architecture & 4-Zone Workspace Model

The frontend is an engineering-first, dark-themed (Obsidian Slate) Single Page Application built natively with ES6 modules, CSS design tokens (`DESIGN.md`, `tokens.css`, `components.css`), and responsive grid layouts:

- **Persistent Navigation:** Collapsible left sidebar (260px expanded / 72px collapsed), dynamic breadcrumbs, keyboard shortcuts (`Ctrl+K` command palette, `Ctrl+B` sidebar toggle, `Escape`).
- **Dashboard & Catalog:** Hero metrics, category filtering pills, live keyword search, 6-card tool catalog.
- **The 4-Zone Workspace Architecture:**
  1. **Zone 1 (Ingestion):** Drag-and-drop dropzones with automatic column inspection, sheet selection, row/column count chips, and one-click sample template data loaders (dual dropzones for ISD tool).
  2. **Zone 2 (Column Mapping):** Heuristic auto-detection with confidence badges (100% High Match, Fuzzy Match, Unmapped), live Row 1 sample value preview pills, and `localStorage` mapping persistence.
  3. **Zone 3 (Parameter Tuning & Physics):** Sliders with synchronized numerical inputs, segmented mode switches, RGB color pickers with swatches, and 3GPP carrier band altitude stacking specification tables.
  4. **Zone 4 (Results & Live Data Preview):** Execution stats (row count, latency, file size), one-click deliverable downloads (`.kml`, `.xlsx`, `.zip`), 10-row virtualized preview grid with monospace coordinate alignment, and telecom KPI load chips.
- **Documentation & Spec Hub:** Tabbed viewer covering Haversine distance, forward spherical geodesics, base-32 geohashes, PRB/RRC color matrix, and developer engine guide.
- **Sample Template Hub:** Direct downloads and instant "Open in Tool" launchers for all 6 reference templates.

---

## 7. Adding New RF Tools

RF TOOLS is designed with a strictly modular architecture so telecom engineers can easily contribute new `.py` calculation modules:

1. **Add Pure Calculation Module:**
   - Create a new module in `backend/tools/your_tool_name.py`.
   - Implement your calculation logic as pure Python functions accepting dataframes, paths, or bytes without any web or GUI dependencies.
2. **Register Tool Constants & Formulas:**
   - Add any lookup dictionaries, band models, or thresholds to `backend/tools/constants.py`.
3. **Define Pydantic Request/Response Models:**
   - Add parameter schemas in `backend/schemas/models.py`.
4. **Register API Routes:**
   - Add the calculation endpoint to `backend/api/v1/tools.py` under `/api/v1/tools/your-tool-id/process`.
   - Register the tool in `TOOLS_CATALOG` in `backend/api/v1/tools.py`.
5. **Provide Sample Template:**
   - Add sample workbook generation in `backend/tools/template_generator.py`.
6. **Add Automated Unit Tests:**
   - Add test functions in `tests/test_your_tool.py` testing normal, boundary, and edge inputs.
   - Run `pytest` to verify accuracy.

---

## 8. Testing & Verification

Run the comprehensive automated test suite with pytest:

```bash
./venv/bin/pytest -v
```

All 39 automated tests verify:
- Exact carrier band altitudes, beamwidths, and sector radii lookups.
- Geodesic forward spherical coordinate projection accuracy.
- Telecom KPI threshold color mapping (PRB and RRC).
- Haversine great-circle distance matrix and statistical summaries.
- Bidirectional geohash encode/decode accuracy at precision 7.
- ESRI Shapefile polygon packaging (.zip containing .shp, .shx, .dbf, .prj) and DBF 10-char name uniqueness.
- REST API v1 endpoints, file uploads, sample template downloads, and column inspection.

---

## 9. Directory Structure

```text
.
├── backend/
│   ├── __init__.py
│   ├── config.py                   # Environment & host/port settings
│   ├── main.py                     # FastAPI application setup, static mounts & routes
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── models.py               # Pydantic validation models
│   ├── tools/                      # Pure Python calculation engines
│   │   ├── __init__.py
│   │   ├── constants.py            # Telecom 3GPP thresholds & band lookup tables
│   │   ├── excel_to_kml.py         # Tool 1: Excel -> Point KML Placemarks
│   │   ├── prb_kml.py              # Tool 2: Excel -> PRB 3D Sector Visualizer
│   │   ├── isd_calculator.py       # Tool 3: Inter-Site Distance Calculator
│   │   ├── geohash_to_shp.py       # Tool 4: Geohash -> ESRI Shapefile
│   │   ├── geohash_to_latlon.py    # Tool 5: Geohash -> Centroid Lat/Long
│   │   ├── latlon_to_geohash.py    # Tool 6: Lat/Long -> Geohash
│   │   ├── column_inspector.py     # Heuristic column detection engine
│   │   └── template_generator.py   # Reference sample Excel generators
│   └── api/
│       └── v1/
│           ├── __init__.py
│           ├── tools.py            # Tool catalog & execution endpoints
│           ├── templates.py        # Reference template streaming routes
│           └── inspect.py          # Column inspection route
├── frontend/                       # Interactive Web Application (Port 5005)
│   ├── index.html                  # Single Page Application entrypoint
│   ├── css/
│   │   ├── tokens.css              # Obsidian Slate design tokens & colors
│   │   ├── components.css          # Design system component classes
│   │   └── app.css                 # Layout shell, 4-zone workspaces & toasts
│   └── js/
│       ├── api.js                  # FastAPI HTTP client wrapper
│       ├── state.js                # Reactive store & localStorage persistence
│       ├── app.js                  # Application boot & hash router
│       └── components/
│           ├── navbar.js           # Top action header & latency indicator
│           ├── sidebar.js          # Collapsible navigation sidebar
│           ├── command_palette.js  # Global search modal (Ctrl+K)
│           ├── dashboard.js        # Overview, metrics & 6-card tool grid
│           ├── directory.js        # Comprehensive tools directory & matrix
│           ├── workspace.js        # Unified 4-Zone engineering workspace
│           ├── docs.js             # Tabbed documentation & formula viewer
│           ├── templates.js        # Sample templates download hub
│           ├── about.js            # System architecture & engine health
│           └── toast.js            # Floating notification alerts
├── tests/                          # Automated Pytest suite (39 tests)
│   ├── __init__.py
│   ├── test_excel_to_kml.py
│   ├── test_prb_kml.py
│   ├── test_isd_calculator.py
│   ├── test_geohash.py
│   ├── test_api.py
│   ├── test_frontend.py
│   └── test_edge_cases.py
├── docs/                           # Specifications & UX Architecture
├── assets/                         # Vector icons & design system assets
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```
