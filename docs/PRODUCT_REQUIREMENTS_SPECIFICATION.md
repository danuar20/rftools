# Product Requirements Specification: RF TOOLS Web Platform

**Document Version:** 1.0  
**Phase:** Discovery & Specifications  
**Author:** Product Requirements Agent  
**Status:** Approved for Design & Implementation  
**Target Port:** 5005  

---

## 1. Executive Summary & Product Brief

### 1.1 Business Objective
**RF TOOLS** is a unified, cloud-ready engineering web platform designed to centralize and modernize mission-critical Radio Frequency (RF) and Geospatial (GIS) desktop calculation scripts into a high-performance, modular web application. 

Telecom operators, radio network planning (RNP) teams, and RF optimization (RNO) engineers frequently rely on fragmented desktop scripts (Tkinter GUIs) for site mapping, sector KPI rendering, inter-site distance analysis, and spatial geohash conversions. RF TOOLS consolidates these disparate tools into a single browser-accessible platform while **strictly preserving 100% of underlying calculation algorithms, constants, and engineering logic**.

### 1.2 Core Value Proposition
- **Zero-Setup Engineering Workstation:** Eliminates local desktop Python/Tkinter dependency issues, OS differences, and local library version mismatches.
- **Architectural Modularity:** Decouples core mathematical and GIS calculation engines from web and UI layers, enabling rapid onboarding of new `.py` engineering tools.
- **Interactive Visual Feedback:** Replaces opaque batch file execution with live tabular data previews, column auto-mapping, execution progress indicators, and instant downloads.
- **Precision & Transparency:** Surfaces full engineering formulas, band-specific lookup parameters, sample templates, and comprehensive documentation alongside every tool.

---

## 2. Target Users & User Personas

| Persona | Role | Key Needs & Pain Points | Primary Tools Used |
|---|---|---|---|
| **RF Planning Engineer (RNP)** | Cellular Network Planning & Topology | Needs fast Inter-Site Distance (ISD) verification, nearest-neighbor clustering, and placemark KML generation for site survey verification. | ISD Calculator, Excel → KML Point Converter |
| **RF Optimization Engineer (RNO)** | Network Performance & Capacity Optimization | Needs 3D multi-carrier sector visualization in Google Earth, color-coded by downlink/uplink PRB utilization and active RRC users during busy hours. | Excel → PRB KML 3D Sector Visualizer |
| **GIS & Geospatial Analyst** | Spatial Telecom Analytics | Converts large datasets between tabular lat/long coordinates, geohashes, and GIS ESRI shapefiles for coverage simulation and polygon analysis. | Geohash → Shapefile, Geohash → Lat/Long, Lat/Long → Geohash |
| **Field Engineer / RF Student** | Site Survey & Telecommunications Education | Requires downloadable sample Excel templates, clear column mapping guides, and transparent formula explanations. | All Tools, In-app Documentation & Templates |

---

## 3. High-Level Architecture & Technical Constraints

### 3.1 Technology Stack
- **Backend Framework:** Python 3.10+ with **FastAPI** (asynchronous, high performance, OpenAPI documentation).
- **Runtime Environment:** Dedicated Python virtual environment (`venv/`), never global packages.
- **Server / Host:** Uvicorn ASGI server bound to `0.0.0.0` on mandatory port **`5005`**.
- **Frontend Architecture:** Modern, responsive, dark-themed engineering UI (HTML5, TailwindCSS / modern CSS component library, Vanilla JS / Alpine.js or React/Vue SPA) optimized for fast loading and reactive interactions.
- **Calculation Engines:** Pure Python service layer wrapping NumPy, Pandas, Geopandas, Shapely, PyProj, PyGeohash, SimpleKML, OpenPyXL.

### 3.2 Architectural Layering
```text
┌─────────────────────────────────────────────────────────────┐
│                    Web Frontend UI (Port 5005)              │
│  - Directory & Navigation   - Column Auto-Detection UI     │
│  - Interactive Previews     - Template Download Manager     │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON & Multipart
┌──────────────────────────────▼──────────────────────────────┐
│                    FastAPI Service Layer                    │
│  - Pydantic Input/Output Validation                         │
│  - File Upload Streamer & Multipart Parsing                 │
│  - Centralized Error Handling & RFC 7807 Error Responses    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Clean Python API Calls
┌──────────────────────────────▼──────────────────────────────┐
│                 Core RF Calculation Modules                 │
│  ├── tools/excel_to_kml/     ├── tools/geohash_to_shp/      │
│  ├── tools/prb_kml/          ├── tools/geohash_to_latlon/   │
│  └── tools/isd_calculator/   └── tools/latlon_to_geohash/   │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│            Original Imported Python Logic Engines           │
│        (kml_isd.py  &  geohash converter.py)                │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Comprehensive Tool Breakdowns & Contracts

### 4.1 Tool 1: Excel → KML (Point Converter)

#### 4.1.1 Overview & Objective
Converts tabular Excel site coordinates into Google Earth Placemark KML points with configurable icon styling, folder organization, and label colors.

#### 4.1.2 Input Data Contract
- **Input File:** `.xlsx` workbook (active sheet parsed with `data_only=True`).
- **Required Columns (Auto-Detected or Manual Selection):**
  - `Latitude`: Auto-matched with case-insensitive names `lat`, `latitude`, `y`. Fallback index: column 3.
  - `Longitude`: Auto-matched with case-insensitive names `lon`, `long`, `longitude`, `x`. Fallback index: column 2.
  - `Site Name / Placemark Label`: Auto-matched from column 4 (`Site`), column 1 (`SITENAME`), or column 0 (`SITE_ID`).
- **Configuration Parameters:**
  - `folder_name` (string, default: `"SITENAME"`): Folder grouping in KML tree.
  - `icon_url` (string, default: `http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png`).
  - `color_rgb` (RGB array/hex, default: `#550000` / `(85, 0, 0)`).
  - `label_color` (RGB array/hex, default: `#FFFF00` / `(255, 255, 0)`).
  - `scale` (float, range: `0.1` – `3.0`, default: `0.7`).

#### 4.1.3 Processing & Algorithm
1. Parse Excel data rows via OpenPyXL. Skip empty rows or malformed coordinate cells.
2. Construct KML folder hierarchy.
3. Instantiate `simplekml.Style()` applying icon href, scale, RGB color tinting, and label styling.
4. Iterate rows, creating `simplekml.Point` placemarks positioned at `[(lon, lat)]`.
5. Serialize and stream the resulting `.kml` file.

#### 4.1.4 Output Contract
- **Format:** `.kml` XML file download (MIME type: `application/vnd.google-earth.kml+xml`).
- **Sample Template Provided:** `Sample_Point_KML.xlsx` with headers `["SITE_ID", "SITENAME", "Site", "LONG", "LAT"]` and valid sample rows.

---

### 4.2 Tool 2: Excel → PRB KML (3D Sector Polygon Visualizer)

#### 4.2.1 Overview & Objective
Transforms cell site operational metrics into extruded 3D antenna sector polygons in Google Earth. Sectors are color-coded based on Downlink (DL) and Uplink (UL) Physical Resource Block (PRB) utilization percentages and active RRC connected user counts, with rich HTML popup property tables and screen legend overlays.

#### 4.2.2 Input Data Contract
- **Input File:** Excel file (`.xlsx`, `Sheet1`).
- **Required Column Schema:**
  - `WEEK`: Monitoring week (e.g., `"W29"`).
  - `SITEID`: Unique site identifier.
  - `SITENAME`: Site name.
  - `CELLNAME`: Sector/cell identifier.
  - `BEAM`: Technology carrier band. Must match or map to:
    - `"LTE700"`, `"LTE900"`, `"LTE1800"`, `"LTE2100"`, `"LTE2300-1st"`, `"LTE2300-2nd"`, `"LTE2300-3rd"`.
  - `DL PRB BDBH`: Busy-hour Downlink PRB utilization percentage ($0.00$ – $100.00\%$).
  - `UL PRB BDBH`: Busy-hour Uplink PRB utilization percentage ($0.00$ – $100.00\%$).
  - `RRC User BDBH`: Busy-hour active connected RRC user count.
  - `PAYLOAD (MB)`: Data traffic payload in megabytes.
  - `BW (MHz)`: Channel bandwidth in MHz (e.g. 10, 15, 20).
  - `LONG`: Site longitude in decimal degrees (WGS84).
  - `LAT`: Site latitude in decimal degrees (WGS84).
  - `DIRECTION`: Antenna boresight azimuth in degrees ($0^{\circ}$ – $360^{\circ}$).
  - *Optional Metadata Fields:* `CLASS REV`, `NOP`, `RTPO`, `PROPINSI`, `KABUPATEN`, `KECAMATAN`, `DESA`, `SDR`, `ANTENNA_TYPE`, `TOWER_HEIGHT`, `ANTENNA_HEIGHT`, `M-Tilt`, `E-Tilt`, `PCI`.

#### 4.2.3 Exact Mathematical & Engineering Models

##### A. Band Parameters Lookup
| Carrier Band (`BEAM`) | Altitude (m agl) | Beamwidth ($\beta$) | Sector Radius ($R_{\text{sec}}$) |
|---|---|---|---|
| `LTE700` | 42 m | 23° | 0.038 km (38 m) |
| `LTE900` | 40 m | 23° | 0.042 km (42 m) |
| `LTE1800` | 38 m | 23° | 0.046 km (46 m) |
| `LTE2100` | 36 m | 23° | 0.050 km (50 m) |
| `LTE2300-1st` | 34 m | 25° | 0.054 km (54 m) |
| `LTE2300-2nd` | 32 m | 25° | 0.058 km (58 m) |
| `LTE2300-3rd` | 30 m | 25° | 0.062 km (62 m) |
| *Default / Other* | 28 m | 27° | 0.080 km (80 m) |

##### B. Sector Geometry Forward Spherical Geodesic Projection
For each sector with site origin $(\phi_0, \lambda_0)$ in radians, azimuth $\alpha$ in degrees, and radius $R_{\text{sec}}$:
1. Angular distance: $d_R = \frac{R_{\text{sec}}}{R_{\text{Earth}}}$ where $R_{\text{Earth}} = 6371.0\text{ km}$.
2. Five sector boundary azimuths:
   - $\theta_1 = \alpha - \frac{\beta}{2}$
   - $\theta_2 = \frac{\theta_1 + \alpha}{2}$
   - $\theta_3 = \alpha$
   - $\theta_4 = \frac{\theta_5 + \alpha}{2}$
   - $\theta_5 = \alpha + \frac{\beta}{2}$
3. Great-circle destination point calculation for each $\theta \in \{\theta_1, \dots, \theta_5\}$:
   $$\phi_{\text{new}} = \arcsin\left(\sin(\phi_0)\cos(d_R) + \cos(\phi_0)\sin(d_R)\cos(\theta)\right)$$
   $$\lambda_{\text{new}} = \lambda_0 + \operatorname{atan2}\left(\sin(\theta)\sin(d_R)\cos(\phi_0), \; \cos(d_R) - \sin(\phi_0)\sin(\phi_{\text{new}})\right)$$
4. Closed polygon coordinates:
   $$\text{Poly} = [(\lambda_0, \phi_0, H), (\lambda_1, \phi_1, H), (\lambda_2, \phi_2, H), (\lambda_3, \phi_3, H), (\lambda_4, \phi_4, H), (\lambda_5, \phi_5, H), (\lambda_0, \phi_0, H)]$$
   where $H$ is the band-specific altitude.

##### C. Color Mapping Thresholds (RGB Hex)
| Metric | Value = 0 | 0 < Val ≤ 35 (40 for RRC) | 35 < Val ≤ 60 (40-60 for RRC) | 60 < Val ≤ 75 (60-90 for RRC) | 75 < Val ≤ 90 (90-120 for RRC) | Val > 90 (> 120 for RRC) |
|---|---|---|---|---|---|---|
| **DL PRB (%)** | `#BFBFBF` (Gray) | `#0000FF` (Blue) | `#00FF00` (Green) | `#FFFF00` (Yellow) | `#FFBF00` (Amber) | `#FF0000` (Red) |
| **UL PRB (%)** | `#BFBFBF` (Gray) | `#0000FF` (Blue) | `#00FF00` (Green) | `#FFFF00` (Yellow) | `#FFBF00` (Amber) | `#FF0000` (Red) |
| **RRC Users** | `#BFBFBF` (Gray) | `#0000FF` (≤40) | `#00FF00` (41-60) | `#FFFF00` (61-90) | `#FFBF00` (91-120) | `#FF0000` (>120) |

- **Fill Opacity:** $40\%$ alpha (`int(255 * 0.40) = 102`).
- **Line Outline:** $100\%$ alpha (`255`).
- **Extrusion:** `extrude = 1`, `altitudemode = AltitudeMode.relativetoground`.
- **Popup Table:** Formatted HTML displaying all parameters, converted payload ($\text{Payload (GB)} = \frac{\text{Payload (MB)}}{1024}$), and metric background color badges.
- **Screen Overlay:** KML screen overlay referencing the color legend.

#### 4.2.4 Output Contract
- **Format:** `.kml` file download containing styled 3D sector polygons.
- **Sample Template Provided:** `Sample_PRB_KML.xlsx` with embedded column hints.

---

### 4.3 Tool 3: ISD (Inter-Site Distance) Calculator

#### 4.3.1 Overview & Objective
Computes great-circle distances between sets of cellular towers from two input datasets (Source File A and Target File B), identifying the $N$ nearest neighbors for each site in File A along with full statistical distribution summaries.

#### 4.3.2 Input Data Contract
- **File A (Source Sites):** `.xlsx` containing site identifiers and lat/lon coordinates.
- **File B (Candidate/Target Sites):** `.xlsx` containing target site identifiers and lat/lon coordinates.
- **Column Detection:** Looks for `lat`/`latitude`/`y` and `lon`/`long`/`longitude`/`x` (fallback col 3 & 2).
- **Parameters:**
  - `n_nearest` (integer, range: $1$ to $5$, default: $1$): Number of closest target sites to record per source site.

#### 4.3.3 Exact Mathematical Formula (Haversine)
Mean Earth Radius: $R = 6371.0088\text{ km}$.
For points $(\phi_1, \lambda_1)$ and $(\phi_2, \lambda_2)$ in radians:
$$\Delta\phi = \phi_2 - \phi_1, \quad \Delta\lambda = \lambda_2 - \lambda_1$$
$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$c = 2 \cdot \operatorname{atan2}\left(\sqrt{a}, \sqrt{1 - a}\right)$$
$$d = R \cdot c \quad (\text{kilometers})$$

#### 4.3.4 Output Contract
- **Format:** Dual-sheet Excel workbook (`.xlsx`):
  - **Sheet 1 (`ISD_Result`):** Columns: `siteA`, `latA`, `lonA`, `nearestSiteB`, `latB`, `lonB`, `distance_km` (rounded to 6 decimal places).
  - **Sheet 2 (`Summary`):** Statistical breakdown: `count`, `min_km`, `mean_km`, `max_km`.
- **Sample Templates Provided:** `Sample_ISD_FileA.xlsx` and `Sample_ISD_FileB.xlsx`.

---

### 4.4 Tool 4: Geohash → Shapefile (.shp / .zip) Converter

#### 4.4.1 Overview & Objective
Converts tabular geohash records into GIS vector polygon shapefiles, generating either standard bounding box polygons or projected metric square footprints.

#### 4.4.2 Input Data Contract
- **Input File:** `.xlsx`, `.xls`, or `.csv`.
- **Geohash Column:** Name of the column containing geohash string tokens (auto-matched by keywords `geohash`, `grid`, `hash`, `id`).
- **Geometry Mode:**
  - `default`: Geohash standard bounding box (WGS84 lat/lon bounds).
  - `custom`: Center-anchored square of custom metric dimension.
- **Parameters (for `custom` mode):**
  - `size_m` (float > 0, default: `500.0` meters): Width and height of square footprint.

#### 4.4.3 GIS Projection & Polygon Construction
- **Default Mode:**
  - Calls `pygeohash.decode_exactly(hash)` $\rightarrow (\text{lat}, \text{lon}, \text{lat\_err}, \text{lon\_err})$.
  - Bounding polygon:
    $$\text{Box} = [(\lambda - \Delta\lambda, \phi - \Delta\phi), (\lambda + \Delta\lambda, \phi - \Delta\phi), (\lambda + \Delta\lambda, \phi + \Delta\phi), (\lambda - \Delta\lambda, \phi + \Delta\phi), (\lambda - \Delta\lambda, \phi - \Delta\phi)]$$
- **Custom Square Mode:**
  - Center: $(\phi, \lambda) = \operatorname{decode}(\text{hash})$.
  - Calculate UTM Zone:
    $$\text{zone} = \left\lfloor \frac{\lambda + 180}{6} \right\rfloor + 1, \quad \text{south} = (\phi < 0)$$
  - Transform $(\lambda, \phi)$ from EPSG:4326 to localized UTM metric CRS.
  - Compute square vertices with half-side $h = \frac{\text{size\_m}}{2}$:
    $$(c_x \pm h, c_y \pm h)$$
  - Reproject vertices back to EPSG:4326.
- **ESRI DBF Field Constraint:**
  - Column names are truncated to max 10 characters and deduplicated strictly (e.g. `colname`, `colname_1`, `colname_2`).

#### 4.4.4 Output Contract
- **Format:** Zip archive (`.zip`) containing standard ESRI shapefile set:
  - `<filename>.shp` (geometry)
  - `<filename>.shx` (index)
  - `<filename>.dbf` (dBase table attributes)
  - `<filename>.prj` (WGS84 EPSG:4326 projection definition)
- **API Response:** JSON summary with feature count (`valid / total`) and download URI.

---

### 4.5 Tool 5: Geohash → Lat / Long (.xlsx / .csv)

#### 4.5.1 Overview & Objective
Decodes geohash strings into their centroid geographic coordinates (latitude and longitude in WGS84 decimal degrees).

#### 4.5.2 Input Data Contract
- **Input File:** `.xlsx` or `.csv`.
- **Geohash Column:** Selected geohash column name.

#### 4.5.3 Processing
- Invokes `pygeohash.decode(val)` for each row.
- Replaces existing `latitude` or `longitude` columns if present (preventing collisions).
- Leaves cells blank/null if geohash string is malformed or empty without failing the entire batch.

#### 4.5.4 Output Contract
- **Format:** Processed `.xlsx` or `.csv` (preserving original non-conflicting columns) with appended `latitude` and `longitude` float columns.
- **In-App Data Preview:** First 10 rows rendered in an interactive table.

---

### 4.6 Tool 6: Lat / Long → Geohash (.xlsx / .csv)

#### 4.6.1 Overview & Objective
Encodes paired latitude and longitude coordinates into standardized Geohash strings with user-controlled precision.

#### 4.6.2 Input Data Contract
- **Input File:** `.xlsx` or `.csv`.
- **Latitude Column:** Auto-matched by keyword `lat`.
- **Longitude Column:** Auto-matched by keywords `lon`, `long`, `lng`.
- **Parameters:**
  - `precision` (integer, range: $1$ to $12$, default: $7$): Determines geohash grid resolution (e.g., precision 7 corresponds to approx $153\text{ m} \times 153\text{ m}$).

#### 4.6.3 Processing & Output Contract
- Validates latitude in $[-90, 90]$ and longitude in $[-180, 180]$.
- Invokes `pygeohash.encode(lat, lon, precision=precision)`.
- **Format:** Processed `.xlsx` or `.csv` with appended `geohash` string column.

---

## 5. API Endpoint Specifications

All API endpoints follow RESTful conventions, returning JSON or binary file streams.

### 5.1 System & Tool Metadata
- **`GET /api/v1/tools`**
  - Returns catalog of all available RF tools, categories, icons, descriptions, and required inputs.
- **`GET /api/v1/tools/{tool_id}`**
  - Returns detailed tool metadata, schema definition, formula summary, and documentation.
- **`GET /api/v1/templates/{template_id}`**
  - Streams pre-generated sample Excel templates: `point_kml`, `prb_kml`, `isd_a`, `isd_b`.

### 5.2 Tool Execution Endpoints
| Endpoint | Method | Payload Type | Request Parameters / Files | Response |
|---|---|---|---|---|
| `/api/v1/tools/excel-to-kml/process` | POST | `multipart/form-data` | `file`, `folder_name`, `scale`, `color_rgb`, `label_color` | Binary `.kml` stream or JSON download ticket |
| `/api/v1/tools/prb-kml/process` | POST | `multipart/form-data` | `file` (`.xlsx`) | Binary `.kml` stream or JSON download ticket |
| `/api/v1/tools/isd-calculator/process` | POST | `multipart/form-data` | `file_a` (`.xlsx`), `file_b` (`.xlsx`), `n_nearest` (int 1-5) | Binary `.xlsx` stream (dual-sheet) |
| `/api/v1/tools/geohash-to-shp/process` | POST | `multipart/form-data` | `file`, `geohash_col`, `mode` (`default`/`custom`), `size_m` | Binary `.zip` archive (ESRI Shapefile bundle) |
| `/api/v1/tools/geohash-to-latlon/process` | POST | `multipart/form-data` | `file`, `geohash_col` | Binary `.xlsx`/`.csv` with `latitude`, `longitude` |
| `/api/v1/tools/latlon-to-geohash/process` | POST | `multipart/form-data` | `file`, `lat_col`, `lon_col`, `precision` (int 1-12) | Binary `.xlsx`/`.csv` with `geohash` |
| `/api/v1/inspect-columns` | POST | `multipart/form-data` | `file` | JSON array of detected column names and types |

---

## 6. Page Requirements & UI/UX Workflow

### 6.1 Design System & Theme
- **Aesthetic:** Dark-mode primary (deep slate/charcoal `#0F172A`, surface cards `#1E293B`, subtle borders `#334155`, technical cyan/blue `#0EA5E9` accents, warning amber `#F59E0B`, success green `#10B981`).
- **Typography:** Monospace fonts for coordinates/code/hashes (JetBrains Mono / Fira Code), clean geometric sans-serif for UI labels (Inter / Segoe UI).
- **Responsiveness:** Full desktop optimization for complex multi-column data, with fluid tablet/mobile adaptive layouts.

### 6.2 Key Pages & Views

#### 1. Home / Dashboard (`/`)
- Brand header with tagline: *"Professional RF Engineering Tools — Calculate, Analyze, and Design with Confidence."*
- Quick stats: 6 active calculation engines, WGS84 GIS CRS support, 3D KML generation.
- Search and Category Filter: "All", "KML & Site Visualization", "Network Topology & ISD", "Geospatial & Geohash".
- Interactive Tool Cards with tool title, description, category badge, icon, and direct "Launch Tool" CTA.

#### 2. Individual Tool Execution Workspace (`/tools/{tool_id}`)
- **Header:** Breadcrumb navigation, Tool Title, category, and "How to Use / Formula" drawer toggle.
- **Action Bar:** "Download Sample Template (.xlsx)" button prominently displayed at the top.
- **Upload Zone:** Drag-and-drop file upload supporting `.xlsx`, `.xls`, `.csv` with immediate client-side column extraction via `/api/v1/inspect-columns`.
- **Dynamic Configuration Form:** Auto-populates column dropdown selectors with smart heuristics (e.g., auto-selecting `LAT`, `LONG`, `geohash`).
- **Parameter Controls:** Sliders/inputs for numeric parameters (precision, nearest neighbors, custom square size).
- **Execution Bar:** "Run Calculation" button, spinner/progress indicator with percentage & stage status, and cancel action.
- **Results Panel:**
  - Execution summary (time elapsed, records processed, valid vs skipped count).
  - Interactive table preview of the top rows.
  - "Download Results" button with file size and format indicator.

#### 3. In-App Documentation & Engineering Specs (`/docs` or Drawer)
- Purpose and theory for each tool.
- Mathematical formulations (rendered with LaTeX/MathJax or formatted markdown).
- Band-specific carrier tables and color-coded PRB/RRC threshold legends.
- Step-by-step tutorial with sample files.
- Notes on limitations and edge cases (e.g., ESRI DBF 10-character column limits).

#### 4. About & Reference Information (`/about`)
- Application version and technical stack overview.
- Original script credits (Telkominfra RNP/RNO engineering toolkit).

---

## 7. Non-Functional Requirements & Guardrails

1. **Port & Runtime:** The backend application must run on port **`5005`** (`http://localhost:5005` or `0.0.0.0:5005`).
2. **Virtual Environment Isolation:** Dependencies strictly installed in local `venv/`, never globally.
3. **Security:**
   - Eliminate hardcoded desktop credential scraping / GitHub raw URL authentication scripts found in the original desktop files.
   - Strictly validate and sanitize file uploads (allow only `.xlsx`, `.xls`, `.csv`).
   - Do NOT execute arbitrary Python code or eval user input.
   - Do NOT leak stack traces in production API responses.
4. **Performance:**
   - Small batches (< 1,000 rows) must execute in under 1 second.
   - Large datasets (up to 50,000 rows) must process within 10 seconds with streaming progress feedback.
   - Memory management: Temporary processing files must be cleaned up after download or stream generation.
5. **Robust Error Handling:**
   - Meaningful HTTP status codes: `400 Bad Request` for invalid column mapping or bad coordinates, `422 Unprocessable Entity` for empty files, `500 Internal Server Error` with sanitized messages.

---

## 8. Acceptance Criteria (Given-When-Then)

### AC 1: System Startup & Accessibility
- **Given** a cleanly configured environment with Python `venv/`,
- **When** the application is started via `uvicorn backend.main:app --port 5005`,
- **Then** the application must respond with HTTP 200 at `http://localhost:5005`, presenting the RF TOOLS Directory with all 6 tools available.

### AC 2: Excel to KML Placemark Generation
- **Given** a user uploads `Sample_Point_KML.xlsx` (with columns `SITE_ID`, `SITENAME`, `LONG`, `LAT`),
- **When** the user clicks "Convert to KML",
- **Then** the system generates a valid `.kml` file containing placemarks matching the coordinates and names, styled with the requested color and icon, downloadable immediately.

### AC 3: Excel to PRB KML 3D Sector Generation & Color Thresholds
- **Given** an Excel sheet containing cellular cell rows with valid `BEAM`, `LAT`, `LONG`, `DIRECTION`, `DL PRB BDBH`, `UL PRB BDBH`, and `RRC User BDBH`,
- **When** the user triggers the PRB KML generation,
- **Then**:
  - Sector geometry is extruded to the exact band-specific altitude (e.g. LTE1800 at 38m, LTE2100 at 36m).
  - Sector beamwidth and radius adhere to the lookup specifications (e.g. LTE1800 beam=23°, radius=0.046km).
  - Polygon fill color strictly reflects the PRB utilization threshold (e.g., 92.1% DL PRB mapped to Red `#FF0000`).
  - The generated KML opens cleanly in Google Earth with 3D polygons, popup HTML tables, and legend overlay.

### AC 4: ISD Multi-Neighbor Calculation & Summary
- **Given** File A with source sites and File B with target sites, with `n_nearest` set to `2`,
- **When** the calculation is executed,
- **Then** the output `.xlsx` contains:
  - `ISD_Result` sheet with 2 rows per source site representing the 1st and 2nd nearest neighbors with Haversine distance in km rounded to 6 decimals.
  - `Summary` sheet with `count`, `min_km`, `mean_km`, and `max_km` statistics.

### AC 5: Geohash to Shapefile Package
- **Given** a CSV or Excel file containing valid geohash strings,
- **When** the user converts using `default` or `custom` square (500m) mode,
- **Then** the server produces a `.zip` file containing valid `.shp`, `.shx`, `.dbf`, and `.prj` files, with DBF column names truncated to ≤ 10 characters and deduplicated.

### AC 6: Geohash Coordinate Decoding & Encoding Bidirectionality
- **Given** a coordinate pair `(-6.175392, 106.827153)` at precision 7,
- **When** encoded to geohash and subsequently decoded,
- **Then** the decoded centroid matches the original coordinate within the precision threshold (approx ±0.00078 degrees).

### AC 7: In-App Documentation & Sample Templates
- **Given** an engineer viewing any tool page,
- **When** clicking "Download Sample Template",
- **Then** an authentic `.xlsx` template file with valid headers and sample data is instantly downloaded to guide user file preparation.

---

## 9. Handoff Guidance for Implementation Team

- **For UX/UI Designer:** Follow the professional dark-themed layout defined in Section 6. Provide clear visual cues for file drop, column mapping selects, progress states, and preview tables.
- **For Software Engineer:**
  - Use FastAPI in `backend/` with routers in `backend/api/v1/`.
  - Maintain the Python calculation modules in `backend/tools/` as pure functions without web dependencies.
  - Test all calculation functions with Pytest in `tests/` verifying accuracy against original Tkinter scripts.
  - Keep the app running reliably on port `5005`.
