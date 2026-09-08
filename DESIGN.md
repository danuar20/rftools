---
version: alpha
name: RF-TOOLS-Design-System
description: High-precision engineering design tokens and visual specifications for the RF TOOLS telecommunications platform.
colors:
  primary: "#0EA5E9"
  primary-hover: "#0284C7"
  primary-active: "#0369A1"
  bg-base: "#0B0F17"
  bg-surface: "#111827"
  bg-elevated: "#1E293B"
  bg-overlay: "#253349"
  bg-sunken: "#070A10"
  border-subtle: "#1E293B"
  border-default: "#334155"
  border-strong: "#475569"
  border-accent: "#0EA5E9"
  text-primary: "#F8FAFC"
  text-secondary: "#94A3B8"
  text-muted: "#7C8B9E"
  text-inverse: "#0B0F17"
  text-white: "#FFFFFF"
  accent-indigo: "#4F46E5"
  accent-emerald: "#10B981"
  status-success: "#10B981"
  status-warning: "#F59E0B"
  status-danger: "#EF4444"
  status-info: "#0EA5E9"
  kpi-gray: "#BFBFBF"
  kpi-blue: "#3B82F6"
  kpi-green: "#22C55E"
  kpi-yellow: "#EAB308"
  kpi-amber: "#F59E0B"
  kpi-red: "#EF4444"
typography:
  h1:
    fontFamily: "Inter"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  h2:
    fontFamily: "Inter"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  h3:
    fontFamily: "Inter"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  body-lg:
    fontFamily: "Inter"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.5
  body-md:
    fontFamily: "Inter"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Inter"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
  mono-sm:
    fontFamily: "JetBrains Mono"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.4
  badge:
    fontFamily: "Inter"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
rounded:
  xs: "2px"
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.text-white}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-destructive:
    backgroundColor: "{colors.status-danger}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  dropzone-idle:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.lg}"
    padding: "32px"
  dropzone-hover:
    backgroundColor: "{colors.bg-overlay}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "32px"
  dropzone-meta-chip:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  mapping-selector:
    backgroundColor: "{colors.bg-sunken}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  mapping-chip-sample:
    backgroundColor: "{colors.bg-sunken}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.xs}"
    padding: "2px 6px"
  param-slider-track:
    backgroundColor: "{colors.border-subtle}"
    rounded: "{rounded.full}"
  param-toggle-active:
    backgroundColor: "{colors.border-accent}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
  status-badge-success:
    backgroundColor: "{colors.status-success}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  status-badge-warning:
    backgroundColor: "{colors.status-warning}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  status-badge-info:
    backgroundColor: "{colors.status-info}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  kpi-chip-gray:
    backgroundColor: "{colors.kpi-gray}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  kpi-chip-blue:
    backgroundColor: "{colors.kpi-blue}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  kpi-chip-green:
    backgroundColor: "{colors.kpi-green}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  kpi-chip-yellow:
    backgroundColor: "{colors.kpi-yellow}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  kpi-chip-amber:
    backgroundColor: "{colors.kpi-amber}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  kpi-chip-red:
    backgroundColor: "{colors.kpi-red}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  table-header-cell:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-secondary}"
    padding: "10px 14px"
  table-body-cell:
    backgroundColor: "{colors.bg-base}"
    textColor: "{colors.text-primary}"
    padding: "8px 14px"
  card-tool:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "20px"
  border-indicator:
    backgroundColor: "{colors.border-default}"
    textColor: "{colors.text-primary}"
  border-heavy:
    backgroundColor: "{colors.border-strong}"
    textColor: "{colors.text-primary}"
  accent-badge-indigo:
    backgroundColor: "{colors.accent-indigo}"
    textColor: "{colors.text-white}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  accent-badge-emerald:
    backgroundColor: "{colors.accent-emerald}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  hint-text-muted:
    backgroundColor: "{colors.bg-base}"
    textColor: "{colors.text-muted}"
---

## Overview

RF TOOLS is a high-precision geospatial and radio frequency engineering web application. It transitions enterprise telecom calculation engines (point placemark generation, 3D PRB antenna sector modeling, inter-site distance analysis, and geohash GIS conversions) into an interactive dark-themed workspace.

The visual language is characterized by:
- **Engineered Density:** High information density without visual clutter, prioritizing readable data grids, concise form controls, and contextual tooltips.
- **Mission-Critical Dark Palette:** Deep slate backgrounds (`#0B0F17` and `#111827`) paired with a technical cyan accent (`#0EA5E9`) that minimizes eye fatigue during extended planning sessions in NOC and engineering environments.
- **Domain Authenticity:** Rigorous adherence to 3GPP and telecom engineering standards, notably color-coded PRB congestion thresholds and exact WGS84 coordinate formatting.
- **Immediate State Visibility:** Highly tactile drag-and-drop feedback, confidence pills for auto-detected headers, and instantaneous row-level data previews.

---

## Colors

The color palette is built on an Obsidian Slate hierarchy complemented by interaction cyan, system status markers, and telecommunications KPI indicators.

### 1. Canvas and Surface Hierarchy
- **`bg-base` (`#0B0F17`):** The primary canvas background (Obsidian Slate). Establishes a deep, low-glare backdrop.
- **`bg-surface` (`#111827`):** Workspace card surfaces, primary panel backgrounds, and table header rows.
- **`bg-elevated` (`#1E293B`):** Elevated surfaces including modals, dropdown menus, metadata badges, and popover drawers.
- **`bg-overlay` (`#253349`):** Interactive hover states for elevated elements and active drag-over wash.
- **`bg-sunken` (`#070A10`):** Recessed wells for form inputs, code editors, sample preview chips, and dropzone troughs.

### 2. Borders and Dividers
- **`border-subtle` (`#1E293B`):** Internal table row dividers and muted component separators.
- **`border-default` (`#334155`):** Standard card boundaries, inactive input borders, and panel dividers.
- **`border-strong` (`#475569`):** Focused inputs, active container outlines, and hover borders.
- **`border-accent` (`#0EA5E9`):** Vibrant cyan indicator for active tools, valid dropzone targets, and selected tabs.

### 3. Typography and Foregrounds
- **`text-primary` (`#F8FAFC`):** Pure light slate for high-contrast titles, metrics, and active values (17.5:1 contrast on `#0B0F17`).
- **`text-secondary` (`#94A3B8`):** Muted slate for input labels, table column headers, and secondary descriptions (7.4:1 contrast).
- **`text-muted` (`#7C8B9E`):** WCAG AA compliant slate (5.5:1 contrast) for placeholder hints, metadata chips, and unit suffixes.
- **`text-inverse` (`#0B0F17`):** Deep dark text applied on vibrant light backgrounds (Cyan, Emerald, Yellow, Gray) ensuring >4.5:1 to 10:1 contrast ratios.
- **`text-white` (`#FFFFFF`):** Crisp white for high-saturation color badges (Indigo, Dark Cyan active, Crimson).

### 4. Interactive Accents
- **`primary` (`#0EA5E9`):** Technical Cyan 500 — primary call-to-action button, active state rings, and brand highlights.
- **`primary-hover` (`#0284C7`):** Cyan 600 — hover state for primary action buttons.
- **`primary-active` (`#0369A1`):** Cyan 700 — pressed state for primary controls.
- **`accent-indigo` (`#4F46E5`):** Geospatial and Shapefile layer indicator.
- **`accent-emerald` (`#10B981`):** Topology and Inter-Site Distance indicator.

### 5. Telecom KPI Threshold Matrix (PRB and RRC Load)
Applied to 3D sector polygon generation, legend popups, and preview table chips:
- **Inactive / Zero (`#BFBFBF`):** Value = 0 (Gray) — unassigned or offline carrier sectors.
- **Low Load (`#3B82F6`):** 0 < PRB <= 35% or RRC <= 40 (Telecom Cobalt Blue) — underutilized sector capacity.
- **Normal / Nominal (`#22C55E`):** 35 < PRB <= 60% or 40 < RRC <= 60 (Emerald Green) — optimal operational load.
- **Medium / Warning (`#EAB308`):** 60 < PRB <= 75% or 60 < RRC <= 90 (Electric Yellow) — elevated traffic approaching threshold.
- **High / Congestion Risk (`#F59E0B`):** 75 < PRB <= 90% or 90 < RRC <= 120 (Amber Orange) — heavy utilization requiring attention.
- **Congested / Critical (`#EF4444`):** PRB > 90% or RRC > 120 (Vivid Red) — overloaded sector causing call drops or throttling.

---

## Typography

The typography system pairs Inter for clean UI readability with JetBrains Mono for engineering precision.

### 1. Font Families
- **Primary UI Stack:** `Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif`
- **Technical Monospace Stack:** `JetBrains Mono, Geist Mono, Fira Code, monospace`

### 2. Type Hierarchy
- **`h1` (Display and Workspace Headers):** 30px / 1.875rem, Weight 700, Line height 1.2, Tracking -0.02em.
- **`h2` (Section and Panel Titles):** 24px / 1.5rem, Weight 600, Line height 1.25, Tracking -0.015em.
- **`h3` (Card Titles and Tool Groupings):** 20px / 1.25rem, Weight 600, Line height 1.3.
- **`body-lg` (Tool Descriptions and Lead Text):** 18px / 1.125rem, Weight 400, Line height 1.5.
- **`body-md` (Default Interface Copy and Buttons):** 16px / 1rem, Weight 400, Line height 1.5.
- **`body-sm` (Input Labels and Secondary Explanations):** 14px / 0.875rem, Weight 400, Line height 1.4.
- **`mono-sm` (Coordinates, Formulas, Lat/Lon, Geohash):** 13px / 0.8125rem, Weight 400, Line height 1.4, Tabular numerals.
- **`badge` (Status Tags and Confidence Indicators):** 12px / 0.75rem, Weight 600, Line height 1.2.

### 3. Monospace Formatting Rules
1. **Coordinates:** Always format WGS84 GPS latitude and longitude with 6 decimal places (`-6.175392`, `106.827153`) using `mono-sm` and `tabular-nums`.
2. **Geohash Strings:** Render geohash keys (`qqguyw8`, `w21z7t`) in monospace with subtle letter spacing (+0.05em) to differentiate easily confused glyphs.
3. **Band Altitudes and Radii:** Numerical ranges (`38m`, `42m`, `150m`) must be aligned right in data tables for rapid column scanning.

---

## Layout

The layout uses a modular 4px baseline grid supporting responsive desktop, tablet, and field mobile views.

### 1. Spacing Scale
- `xs` (4px): Micro-spacing between icon and label, chip internal padding.
- `sm` (8px): Standard spacing between form rows, input padding, compact button gaps.
- `md` (16px): Panel padding, container gutters, standard margin between input groups.
- `lg` (24px): Card padding, section separations in workspace views.
- `xl` (32px): Major layout grid gaps, dropzone vertical padding.
- `xxl` (48px): Page-level vertical padding, hero banner margins.

### 2. Dual-Column Workspace Architecture
Tools are laid out in a 4-Zone structure:
- **Zone 1 (Ingestion Bar):** Full-width container across the top of the workspace.
- **Zone 2 and Zone 3 Split (55% / 45%):**
  - **Zone 2 (Column Mapping Engine - 55% Left):** High-density form grouping mandatory and optional target fields, auto-selected dropdowns, and live sample preview chips.
  - **Zone 3 (Parameter Tuning and Physics - 45% Right):** Sliders with synchronized numerical inputs, segmented mode toggles, color swatches, and band altitude override tables.
- **Zone 4 (Results and Data Preview - Full Width):** Appears smoothly below Zones 2 and 3 once calculation completes, providing summary KPI counters, CTA download buttons, and a 10-row virtualized data grid.

### 3. Responsive Breakpoints
- **Desktop (>= 1280px):** Dual-column 55/45 split layout for Zones 2 and 3.
- **Tablet (768px - 1279px):** Stacked vertical zones with sticky floating calculation bar at the bottom.
- **Mobile (< 768px):** Step-by-step accordion wizard (`Step 1: Ingest` -> `Step 2: Map` -> `Step 3: Tune` -> `Step 4: Execute`).

---

## Elevation & Depth

Surfaces are elevated using subtle border strokes and calibrated drop shadows to preserve contrast on dark themes.

### 1. Elevation Levels
- **Level 0 (Canvas):** `#0B0F17`, no shadow.
- **Level 1 (Cards and Workspace Panels):** `#111827`, border `1px solid #334155`, shadow `0 1px 3px rgba(0,0,0,0.5)`.
- **Level 2 (Dropdowns, Overlays and Floating Chips):** `#1E293B`, border `1px solid #475569`, shadow `0 10px 25px -5px rgba(0,0,0,0.6)`.
- **Level 3 (Modal Dialogs and Formula Drawers):** `#1E293B`, border `1px solid #475569`, shadow `0 25px 50px -12px rgba(0,0,0,0.8)`.

### 2. Ambient Glow Effects
- **Cyan Focus and Drag Glow:** `box-shadow: 0 0 20px -2px rgba(14, 165, 233, 0.35)`
- **Error and Danger Glow:** `box-shadow: 0 0 20px -2px rgba(239, 68, 68, 0.35)`

---

## Shapes

Precise, geometric corner radii reflect mathematical instruments rather than playful consumer apps.

### 1. Corner Radii
- **`rounded-xs` (2px):** Micro tags, table cell pills, coordinate badges.
- **`rounded-sm` (4px):** Form inputs, action buttons, select dropdowns, parameter steppers.
- **`rounded-md` (6px):** Dashboard tool cards, metadata preview chips, toast notifications.
- **`rounded-lg` (8px):** Dropzones, workspace container panels, modal windows.
- **`rounded-full` (9999px):** Status indicator dots, segmented switch thumbs, circular icon buttons.

---

## Components

Exhaustive styling and behavioral specifications for all primary interaction components.

### 1. File Ingestion Dropzones (Zone 1)
- **Idle State:**
  - Border: `2px dashed #334155`
  - Background: `#111827`
  - Content: Centered upload icon (32px, `#0EA5E9`), "Drag and drop calculation workbook (.xlsx, .xls, .csv)" in `#F8FAFC`, format pill badges in `#1E293B`.
- **Drag-Over State:**
  - Border: `2px solid #0EA5E9`
  - Background: `#253349` with `0 0 20px -2px rgba(14, 165, 233, 0.25)` glow
  - Icon: Animated vertical bounce (4px transform).
- **Processing / Ingesting State:**
  - Determinate progress bar (`#0EA5E9`) with byte counter (`4.2 MB / 18.5 MB`) and animated diagonal stripe.
- **Loaded Metadata Chip State:**
  - Collapses into a compact, high-density metadata badge (`#1E293B` background, `1px solid #334155`).
  - File format badge (`.XLSX` in emerald/cyan pill).
  - File name in bold `#F8FAFC` (`Carrier_Traffic_Q3_2026.xlsx`).
  - File size badge (`1.42 MB`).
  - Row and Column count chip (`1,450 rows · 18 columns`).
  - Sheet selector dropdown (if multi-sheet workbook detected).
  - Action buttons: `[Replace File]` (`#334155` border) and `[Remove]` (`#EF4444` hover).
- **Dual Dropzone Variant (ISD Tool):**
  - Side-by-side split: Left container labeled `File A: Source Sites` (cyan tag), Right container labeled `File B: Target Sites` (indigo tag).

### 2. Column Mapping Selectors (Zone 2)
- **Field Grouping:**
  - Two clearly demarcated groups: `Mandatory Parameters` (red asterisk `*`) and `Optional Parameters` (subtle italic hint).
- **Mapping Row Anatomy:**
  - **Left Label:** Target requirement (e.g. `Azimuth Angle (Direction)`), data type indicator icon, and tooltip trigger.
  - **Right Selector:** Dropdown menu styled with `#070A10` background, `#334155` border, and custom SVG chevron. Auto-populated with detected headers from the uploaded file.
  - **Confidence Badge:**
    - `100% Match` (`#10B981` emerald text on emerald-tinted pill) for exact canonical matches.
    - `Fuzzy Match` (`#EAB308` amber text on amber-tinted pill) for alias matches (e.g. `DIR` -> `DIRECTION`).
    - `Unmapped` (`#EF4444` red border and text) if a mandatory field remains unassigned.
  - **Row 1 Sample Value Preview:**
    - Inline monospace chip showing the actual data extracted from row 1 (e.g. `Sample: 120 deg` or `Sample: -6.175392`). Provides instant engineering verification.

### 3. Parameter Controls (Zone 3)
- **Sliders with Dual Numeric Steppers:**
  - Slider track: `#1E293B` with `#0EA5E9` filled active track.
  - Slider thumb: 16px white circle with 2px `#0EA5E9` outline.
  - Accompanying input box: Right-aligned numerical input allowing exact manual typing or keyboard arrow stepping.
- **Segmented Toggles:**
  - Container: `#070A10` background, `#334155` border, 4px border-radius.
  - Active Segment: `#0EA5E9` background with `#0B0F17` text and subtle shadow.
  - Inactive Segment: `#7C8B9E` text, transitioning to `#F8FAFC` on hover.
- **Color Pickers:**
  - Interactive swatch square showing active hex color.
  - Hex input field (`#550000`, `#FFFF00`) with uppercase validation.
  - Preset swatches for standard telecom KML placemark palettes.
- **LTE Band Altitude Override Table:**
  - Embedded micro-table for PRB KML tool: rows for LTE700, LTE900, LTE1800, LTE2100, LTE2300 with editable altitude (`30m`-`54m`) and sector radius (`120m`-`200m`).

### 4. KPI Threshold Chips
- High-density pills with 2px status indicator dot:
  - `0% / Inactive`: Background `rgba(191, 191, 191, 0.12)`, Border `rgba(191, 191, 191, 0.30)`, Text `#BFBFBF`
  - `<=35% / Low`: Background `rgba(59, 130, 246, 0.15)`, Border `rgba(59, 130, 246, 0.40)`, Text `#3B82F6`
  - `35-60% / Normal`: Background `rgba(34, 197, 94, 0.15)`, Border `rgba(34, 197, 94, 0.40)`, Text `#22C55E`
  - `60-75% / Medium`: Background `rgba(234, 179, 8, 0.15)`, Border `rgba(234, 179, 8, 0.40)`, Text `#EAB308`
  - `75-90% / High`: Background `rgba(245, 158, 11, 0.15)`, Border `rgba(245, 158, 11, 0.40)`, Text `#F59E0B`
  - `>90% / Congested`: Background `rgba(239, 68, 68, 0.18)`, Border `rgba(239, 68, 68, 0.45)`, Text `#EF4444`

### 5. Virtualized Data Preview Tables (Zone 4)
- **Table Anatomy:**
  - Container: `#111827` background, `1px solid #334155` border, `rounded-md`.
  - Header Row: `#111827` sticky header, `#94A3B8` uppercase labels (11px, weight 600), sorting indicators, and data-type icons.
  - Rows: Alternating zebra striping (`#0B0F17` / `#111827`), hover highlight (`#1E293B`).
  - Cells: Monospace alignment for coordinates, geohashes, and percentages. Tabular numerical figures.
  - Execution Summary Bar: Positioned above table displaying `Total Records: 1,450`, `Processing Latency: 320ms`, and output format tag.
  - Primary CTA Button: Prominent Cyan button: `[Download Output Deliverable (.kml / .xlsx / .zip)]`.

---

## Do's and Don'ts

### Do's
- **Do** format all geographic coordinates in monospace with 6 decimal places (`+-DD.DDDDDD`) to ensure visual alignment in tables.
- **Do** auto-map column headers using normalized alias matching (`lat`, `latitude`, `y`) and display the detected confidence badge.
- **Do** provide an instantaneous Row 1 value preview chip beside every mapped dropdown so engineers verify mapping correctness before execution.
- **Do** enforce dark `#0B0F17` text on high-luminosity solid buttons (`#0EA5E9`, `#22C55E`, `#EAB308`) to preserve WCAG AAA contrast ratios.
- **Do** allow the file dropzone to collapse into a persistent metadata chip once loaded, reclaiming 80% vertical space for mapping and parameters.

### Don'ts
- **Don't** use generic white or light-gray backgrounds; the application must strictly adhere to the Obsidian Slate dark theme.
- **Don't** use pure `#FFFFFF` text on bright `#0EA5E9` primary buttons; the contrast ratio is only 2.77:1 (failing WCAG AA). Always use `#0B0F17`.
- **Don't** render un-truncated ESRI Shapefile attribute column names in Tool 4; clamp headers to 10 characters and deduplicate collisions.
- **Don't** disable the calculation button without informing the user; display a dynamic badge indicating remaining unmapped mandatory fields.
- **Don't** discard user-configured column mapping overrides; persist mappings to browser localStorage keyed by tool ID.
