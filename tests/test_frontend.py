"""
Frontend Integration Tests for RF TOOLS Web Application
"""

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_frontend_html_root():
    res = client.get("/", headers={"Accept": "text/html"})
    assert res.status_code == 200
    assert "text/html" in res.headers["content-type"]
    assert "RF Tools-Telco" in res.text
    assert "app-shell" in res.text
    assert "tokens.css?v=1.1.1" in res.text
    assert "components.css?v=1.1.1" in res.text
    assert "app.css?v=1.1.1" in res.text
    assert "app.js?v=1.1.1" in res.text
    assert "Cache-Control" in res.headers
    assert "no-cache, no-store, must-revalidate" in res.headers["Cache-Control"]

def test_frontend_json_root():
    res = client.get("/", headers={"Accept": "application/json"})
    assert res.status_code == 200
    assert "application/json" in res.headers["content-type"]
    assert res.json()["status"] == "online"

def test_frontend_static_css():
    res = client.get("/static/css/tokens.css")
    assert res.status_code == 200
    assert "--color-primary" in res.text

    res2 = client.get("/static/css/components.css")
    assert res2.status_code == 200
    assert "rf-dropzone" in res2.text

    res3 = client.get("/static/css/app.css")
    assert res3.status_code == 200
    assert "app-shell" in res3.text

def test_frontend_static_js():
    res = client.get("/static/js/app.js")
    assert res.status_code == 200
    assert "App" in res.text

    res2 = client.get("/static/js/api.js")
    assert res2.status_code == 200
    assert "ApiService" in res2.text

    res3 = client.get("/static/js/components/workspace.js")
    assert res3.status_code == 200
    assert "WorkspaceComponent" in res3.text

def test_frontend_static_icons():
    res = client.get("/assets/icons/rf-logo.svg")
    assert res.status_code == 200
    assert "<svg" in res.text

    for icon in ["tool-excel-to-kml.svg", "tool-prb-kml.svg", "tool-isd-calculator.svg", "tool-geohash-to-shp.svg"]:
        res_i = client.get(f"/assets/icons/{icon}")
        assert res_i.status_code == 200
        assert "<svg" in res_i.text

def test_frontend_app_route():
    res = client.get("/app")
    assert res.status_code == 200
    assert "text/html" in res.headers["content-type"]
    assert "RF Tools-Telco" in res.text

def test_ui_revamp_light_dark_theme():
    res = client.get("/static/css/tokens.css")
    assert res.status_code == 200
    assert 'html[data-theme="light"]' in res.text
    assert 'html[data-theme="dark"]' in res.text

    res_app = client.get("/static/css/app.css")
    assert res_app.status_code == 200
    assert 'html[data-theme="light"]' in res_app.text
    assert "header-control-btn" in res_app.text

def test_ui_revamp_i18n_module():
    res = client.get("/static/js/i18n.js")
    assert res.status_code == 200
    assert "translations" in res.text
    assert "en:" in res.text or "'en':" in res.text or '"en":' in res.text
    assert "id:" in res.text or "'id':" in res.text or '"id":' in res.text

def test_ui_revamp_no_port_or_latency_badges():
    # Navbar must not have port 5005 or latency badges
    res_nav = client.get("/static/js/components/navbar.js")
    assert res_nav.status_code == 200
    assert "navbar-health-pill" not in res_nav.text
    assert "navbar-theme-btn" in res_nav.text
    assert "navbar-lang-group" in res_nav.text

    # Sidebar must not have port 5005 Live badge
    res_side = client.get("/static/js/components/sidebar.js")
    assert res_side.status_code == 200
    assert "Port 5005 Live" not in res_side.text

    # Dashboard must not have Port 5005 hero stat
    res_dash = client.get("/static/js/components/dashboard.js")
    assert res_dash.status_code == 200
    assert "Port 5005" not in res_dash.text

def test_ui_revamp_no_top_level_docs_or_templates_menu():
    # Navbar must not have top-level docs/templates buttons
    res_nav = client.get("/static/js/components/navbar.js")
    assert 'href="#docs"' not in res_nav.text
    assert 'href="#templates"' not in res_nav.text

    # Sidebar must not have docs or sample templates menu items
    res_side = client.get("/static/js/components/sidebar.js")
    assert 'href="#docs"' not in res_side.text
    assert 'href="#templates"' not in res_side.text

def test_about_view_route_guard_and_destroy():
    res_about = client.get("/static/js/components/about.js")
    assert res_about.status_code == 200
    assert "destroy()" in res_about.text
    assert "if (state.route !== 'about') return;" in res_about.text

    res_app = client.get("/static/js/app.js")
    assert res_app.status_code == 200
    assert "this.activeComponent.destroy()" in res_app.text

def test_tools_dictionary_and_simplified_breadcrumbs():
    # Test nav_tools naming in i18n
    res_i18n = client.get("/static/js/i18n.js")
    assert res_i18n.status_code == 200
    assert "Tools Dictionary" in res_i18n.text
    assert "Kamus Alat" in res_i18n.text

    # Test navbar breadcrumbs has no parent hierarchy or separators
    res_nav = client.get("/static/js/components/navbar.js")
    assert res_nav.status_code == 200
    assert "breadcrumbs__sep" not in res_nav.text
    assert 'buildBreadcrumbs(route)' in res_nav.text

def test_layout_and_navigation_refinements():
    # 1. Top Navbar
    res_nav = client.get("/static/js/components/navbar.js")
    assert res_nav.status_code == 200
    # No search trigger in navbar
    assert "navbar-search-btn" not in res_nav.text
    # About button in navbar right after language group, as a button without href
    assert "navbar-about-btn" in res_nav.text
    assert '<button type="button"' in res_nav.text
    assert 'href="#about"' not in res_nav.text
    assert res_nav.text.index("navbar-lang-group") < res_nav.text.index("navbar-about-btn")

    # 2. Sidebar
    res_side = client.get("/static/js/components/sidebar.js")
    assert res_side.status_code == 200
    # No Tools Dictionary link in sidebar
    assert 'href="#tools"' not in res_side.text
    # No About link in sidebar
    assert 'href="#about"' not in res_side.text
    # Polished toggle in footer, RF - Tools box removed
    assert '<button class="sidebar__toggle"' in res_side.text
    assert res_side.text.index("sidebar__footer") < res_side.text.index("sidebar__toggle")
    assert "sidebar__header" in res_side.text
    assert "RF Tools-Telco" in res_side.text
    assert "version v1.0.0" in res_side.text
    assert "RF - Tools" not in res_side.text

    # 3. Routing: #tools reroutes to #dashboard
    res_app = client.get("/static/js/app.js")
    assert res_app.status_code == 200
    assert "if (route === 'tools')" in res_app.text
    assert "window.location.hash = '#dashboard'" in res_app.text

def test_about_modal_and_developer_contact():
    res_about = client.get("/static/js/components/about.js")
    assert res_about.status_code == 200
    assert "about-modal-overlay" in res_about.text
    assert "modal-overlay--open" in res_about.text
    assert "RF Tools-Telco" in res_about.text
    assert "Danuar Trianur Rohman" in res_about.text
    assert "danuartrianurrohman@gmail.com" in res_about.text
    assert "+6282116513070" in res_about.text
    assert "© 2025 - 2026 RF Tools. All rights reserved." in res_about.text
    # Checks for 6 tool function cards
    for tool_id in ["excel-to-kml", "prb-kml", "isd-calculator", "geohash-to-shp", "geohash-to-latlon", "latlon-to-geohash"]:
        assert tool_id in res_about.text

def test_dashboard_interactive_slideshow_and_directory():
    res_dash = client.get("/static/js/components/dashboard.js")
    assert res_dash.status_code == 200
    assert "dashboard-slideshow" in res_dash.text
    assert "slideshow-prev-btn" in res_dash.text
    assert "slideshow-next-btn" in res_dash.text
    assert "slideshow-track" in res_dash.text
    # Visual slides for tools
    for tool_id in ["excel-to-kml", "prb-kml", "isd-calculator", "geohash-to-shp", "geohash-to-latlon", "latlon-to-geohash"]:
        assert f"id: '{tool_id}'" in res_dash.text and f"#tool-{tool_id}" in res_dash.text

    # Lat/Long to geohash slide visual has no broken <b> tags and is contained
    assert "<b>" not in res_dash.text
    assert "qqguw7k" in res_dash.text

    # Dashboard Directory Layout
    assert "All Tools (6)" in res_dash.text
    assert "KML & Visualization" in res_dash.text or "KML &amp; Visualization" in res_dash.text
    assert "Topology & Distance" in res_dash.text or "Topology &amp; Distance" in res_dash.text
    assert "Geospatial & Geohash" in res_dash.text or "Geospatial &amp; Geohash" in res_dash.text
    assert "Filter tools by name or keyword..." in res_dash.text
    assert "rf-card-tool" in res_dash.text
    assert "rf-card-tool__category" in res_dash.text
    assert "rf-card-tool__tags" in res_dash.text
    assert "Launch Tool &rarr;" in res_dash.text or "Launch Tool →" in res_dash.text
    assert "📥 Template" in res_dash.text

def test_workspace_isd_and_prb_controls():
    res_ws = client.get("/static/js/components/workspace.js")
    assert res_ws.status_code == 200
    # ISD distance unit toggle (km vs m)
    assert 'data-isd-unit="km"' in res_ws.text
    assert 'data-isd-unit="m"' in res_ws.text
    assert "distance_unit" in res_ws.text
    # PRB logo presets & custom URLs
    assert 'data-logo-preset="telkominfra_puma"' in res_ws.text
    assert 'data-logo-preset="rf_tools"' in res_ws.text
    assert 'data-logo-preset="custom"' in res_ws.text
    assert 'param-left-logo-url' in res_ws.text
    assert 'param-right-logo-url' in res_ws.text
    # PRB custom bands table & ranges
    assert 'btn-add-band' in res_ws.text
    assert 'btn-remove-band' in res_ws.text
    assert 'custom_bands' in res_ws.text
    assert 'custom_ranges' in res_ws.text

def test_prb_six_tier_ranges_and_logo_enhancements():
    # 1. Workspace has 6-tier inputs (T1 to T4 for DL, UL, RRC)
    res_ws = client.get("/static/js/components/workspace.js")
    assert res_ws.status_code == 200
    assert "range-dl-t1" in res_ws.text
    assert "range-dl-t2" in res_ws.text
    assert "range-dl-t3" in res_ws.text
    assert "range-dl-t4" in res_ws.text
    assert "range-ul-t1" in res_ws.text
    assert "range-rrc-t1" in res_ws.text
    assert "6 Tiers" in res_ws.text

    # 2. Right logo preview box has white background (#ffffff)
    assert 'preview-logo-right' in res_ws.text
    # Ensure Right Logo preview box container has #ffffff
    assert 'background: #ffffff; border-radius: 3px; padding: 2px;' in res_ws.text
    assert 'background: #000000; border-radius: 3px; padding: 2px;' not in res_ws.text

    # 3. COLOR_HEX cell text is responsive (uses var(--color-text-primary) for dark/light contrast)
    assert 'color: var(--color-text-primary);' in res_ws.text

    # 4. State prb-kml ranges defaults match the 6 tiers (35, 60, 75, 90 for PRB; 40, 60, 90, 120 for RRC)
    res_state = client.get("/static/js/state.js")
    assert res_state.status_code == 200
    assert "dl_t1: 35" in res_state.text
    assert "dl_t2: 60" in res_state.text
    assert "dl_t3: 75" in res_state.text
    assert "dl_t4: 90" in res_state.text
    assert "rrc_t1: 40" in res_state.text
    assert "rrc_t2: 60" in res_state.text
    assert "rrc_t3: 90" in res_state.text
    assert "rrc_t4: 120" in res_state.text

    # 5. Default RF Tools logos exist and have RGBA mode
    res_left = client.get("/assets/logos/rf_tools_logo_left.png")
    assert res_left.status_code == 200
    assert len(res_left.content) > 500

    res_right = client.get("/assets/logos/rf_tools_logo_right.png")
    assert res_right.status_code == 200
    assert len(res_right.content) > 500

def test_dashboard_slide_retention():
    # 1. State contains dashboardSlide property
    res_state = client.get("/static/js/state.js")
    assert res_state.status_code == 200
    assert "this.dashboardSlide = 0" in res_state.text

    # 2. DashboardComponent initializes from and persists to state.dashboardSlide
    res_dash = client.get("/static/js/components/dashboard.js")
    assert res_dash.status_code == 200
    assert "this.currentSlide = typeof state.dashboardSlide === 'number' ? state.dashboardSlide : 0" in res_dash.text
    assert "state.dashboardSlide = this.currentSlide" in res_dash.text

def test_geohash_converter_frontend_integration():
    # 1. Sidebar menu contains Geohash Converter with explicit fallback
    res_side = client.get("/static/js/components/sidebar.js")
    assert res_side.status_code == 200
    assert "#tool-geohash-converter" in res_side.text
    assert "tool-geohash-converter.svg" in res_side.text
    assert "state.t('tool_geohash_converter_title', 'Geohash Converter')" in res_side.text

    # 2. Dashboard directory includes Geohash Converter with interactive launch badge
    res_dash = client.get("/static/js/components/dashboard.js")
    assert res_dash.status_code == 200
    assert "geohash-converter" in res_dash.text
    assert "Interactive ⇄" in res_dash.text

    # 3. Dedicated workspace route rendering and interactive controls
    res_ws = client.get("/static/js/components/workspace.js")
    assert res_ws.status_code == 200
    assert "renderGeohashConverter" in res_ws.text
    assert "bindGeohashConverter" in res_ws.text
    assert "gh-input-hash" in res_ws.text
    assert "gh-input-lat" in res_ws.text
    assert "gh-input-lon" in res_ws.text
    assert "gh-input-combined" in res_ws.text
    assert "gh-slider-precision" in res_ws.text
    assert "gh-copy-hash-btn" in res_ws.text
    assert "gh-copy-coords-btn" in res_ws.text
    assert "gh-copy-bbox-btn" in res_ws.text
    assert "gh-neighbor-grid" in res_ws.text
    assert "gh-bbox-diagram" in res_ws.text

    # 4. Command palette and About modal integration
    res_cp = client.get("/static/js/components/command_palette.js")
    assert res_cp.status_code == 200
    assert "geohash-converter" in res_cp.text

    res_about = client.get("/static/js/components/about.js")
    assert res_about.status_code == 200
    assert 'data-tool-id="geohash-converter"' in res_about.text

    # 5. Client-side geohash utility module and icon asset
    res_gh = client.get("/static/js/utils/geohash.js")
    assert res_gh.status_code == 200
    assert "export function decode" in res_gh.text
    assert "export function encode" in res_gh.text
    assert "export function getNeighbors" in res_gh.text

    res_icon = client.get("/assets/icons/tool-geohash-converter.svg")
    assert res_icon.status_code == 200
    assert "<svg" in res_icon.text

def test_geohash_converter_api_integration():
    # Test POST endpoint with geohash string
    res_post = client.post("/api/v1/geohash/convert", json={"geohash": "qqguygv"})
    assert res_post.status_code == 200
    data = res_post.json()
    assert data["geohash"] == "qqguygv"
    assert data["precision"] == 7
    assert -6.20 < data["latitude"] < -6.15
    assert 106.80 < data["longitude"] < 106.85
    assert "bounding_box" in data
    assert "neighbors" in data
    assert data["neighbors"]["n"] is not None

    # Test POST endpoint with lat/lon coordinates and precision
    res_coords = client.post("/api/v1/geohash/convert", json={
        "latitude": -6.175392,
        "longitude": 106.827153,
        "precision": 7
    })
    assert res_coords.status_code == 200
    assert res_coords.json()["geohash"] == "qqguygv"

    # Test GET endpoint with query parameter
    res_get = client.get("/api/v1/geohash/convert?geohash=qqguygv")
    assert res_get.status_code == 200
    assert res_get.json()["geohash"] == "qqguygv"

def test_navbar_breadcrumbs_tool_definition_and_state_emit_guard():
    # 1. Verify navbar.js defines tool before using it in buildBreadcrumbs
    res_nav = client.get("/static/js/components/navbar.js")
    assert res_nav.status_code == 200
    assert "const tool = (state.tools || []).find(t => t.id === toolId);" in res_nav.text
    assert "const fallback = state.t(`tool_${toolId.replace(/-/g, '_')}_title`, toolId);" in res_nav.text

    # 2. Verify state.js emit wraps each listener execution in a try...catch block
    res_state = client.get("/static/js/state.js")
    assert res_state.status_code == 200
    assert "try {" in res_state.text
    assert "fn(event, data);" in res_state.text
    assert "console.error(`Error in state listener for event" in res_state.text

def test_enterprise_light_mode_foundation_and_anti_slop_refinements():
    # 1. State defaults to light mode on startup
    res_state = client.get("/static/js/state.js")
    assert res_state.status_code == 200
    assert "this.theme = localStorage.getItem('rf_tools_theme') || 'light';" in res_state.text

    # 2. HTML template declares data-theme="light" by default
    res_html = client.get("/", headers={"Accept": "text/html"})
    assert res_html.status_code == 200
    assert '<html lang="en" data-theme="light">' in res_html.text

    # 3. Design tokens provide light foundation with crisp typography & elevation
    res_tokens = client.get("/static/css/tokens.css")
    assert res_tokens.status_code == 200
    assert ':root,\nhtml[data-theme="light"]' in res_tokens.text
    assert '--shadow-xs' in res_tokens.text
    assert '--shadow-focus' in res_tokens.text
    assert '--font-sans' in res_tokens.text
    assert '--font-mono' in res_tokens.text

    # 4. Component styling has no tacky AI glow effects on buttons or cards
    res_comp = client.get("/static/css/components.css")
    assert res_comp.status_code == 200
    assert "0 0 16px rgba(14, 165, 233, 0.4)" not in res_comp.text
    assert "0 0 24px -2px rgba(14, 165, 233, 0.35)" not in res_comp.text
    assert "0 8px 24px -4px rgba(0, 0, 0, 0.6), 0 0 16px -2px rgba(14, 165, 233, 0.2)" not in res_comp.text

    # 5. Workspace headers utilize clean SVG icons rather than decorative emojis
    res_ws = client.get("/static/js/components/workspace.js")
    assert res_ws.status_code == 200
    assert "<span>📥</span>" not in res_ws.text
    assert "<span>🎛️</span>" not in res_ws.text
    assert "<span>📋</span>" not in res_ws.text

def test_suite_icons_aesthetic_and_vector_glyphs():
    icons = [
        "tool-excel-to-kml.svg",
        "tool-prb-kml.svg",
        "tool-isd-calculator.svg",
        "tool-geohash-to-shp.svg",
        "tool-geohash-to-latlon.svg",
        "tool-latlon-to-geohash.svg",
        "tool-geohash-converter.svg",
        "rf-logo.svg",
        "nav-dashboard.svg"
    ]
    for icon in icons:
        res = client.get(f"/assets/icons/{icon}")
        assert res.status_code == 200, f"Icon {icon} must return 200"
        assert "<svg" in res.text, f"Icon {icon} must be an SVG"
        # No harsh dark container blocks
        assert "#1E293B" not in res.text, f"Icon {icon} must not contain harsh dark container #1E293B"
        assert "#111827" not in res.text, f"Icon {icon} must not contain dark container #111827"
        if icon == "rf-logo.svg":
            assert 'viewBox="0 0 48 48"' in res.text
        else:
            assert 'viewBox="0 0 32 32"' in res.text

def test_suite_icons_excel_to_kml_design():
    res = client.get("/assets/icons/tool-excel-to-kml.svg")
    assert res.status_code == 200
    assert "M16 5C11.58 5 8 8.58" in res.text
    assert "#0284C7" in res.text

def test_suite_icons_prb_kml_design():
    res = client.get("/assets/icons/tool-prb-kml.svg")
    assert res.status_code == 200
    assert "M16 25L6.5 12" in res.text
    assert "#0284C7" in res.text
    assert "#D97706" in res.text

def test_suite_icons_isd_calculator_design():
    res = client.get("/assets/icons/tool-isd-calculator.svg")
    assert res.status_code == 200
    assert "stroke-dasharray=\"2 2\"" in res.text
    assert "&Delta;d" in res.text
    assert "#10B981" in res.text

def test_suite_icons_geohash_to_shp_design():
    res = client.get("/assets/icons/tool-geohash-to-shp.svg")
    assert res.status_code == 200
    assert "polygon" in res.text.lower()
    assert "stroke=\"#4F46E5\"" in res.text

def test_suite_icons_geohash_to_latlon_design():
    res = client.get("/assets/icons/tool-geohash-to-latlon.svg")
    assert res.status_code == 200
    assert "M18 10.5H23" in res.text
    assert "#10B981" in res.text

def test_suite_icons_latlon_to_geohash_design():
    res = client.get("/assets/icons/tool-latlon-to-geohash.svg")
    assert res.status_code == 200
    assert "M17 17L21 21" in res.text
    assert "#10B981" in res.text
    assert "#0284C7" in res.text

def test_suite_icons_geohash_converter_design():
    res = client.get("/assets/icons/tool-geohash-converter.svg")
    assert res.status_code == 200
    assert "M16 8C20 8 24 10 25 14" in res.text
    assert "M16 24C12 24 8 22 7 18" in res.text

def test_suite_icons_rf_logo_design():
    res = client.get("/assets/icons/rf-logo.svg")
    assert res.status_code == 200
    assert "rfLogoGrad" in res.text
    assert "#BAE6FD" in res.text
    assert "M24 28V39" in res.text

def test_dashboard_slideshow_theme_adaptive_graphics():
    res_dash = client.get("/static/js/components/dashboard.js")
    assert res_dash.status_code == 200
    # No hardcoded dark gradient backgrounds on slide SVGs
    assert "style=\"background: linear-gradient(135deg, #090d16" not in res_dash.text
    assert "diagram-canvas" in res_dash.text
    assert "diagram-panel" in res_dash.text
    assert "diagram-grid" in res_dash.text

    # Verify CSS rules for diagrams provide theme adaptation
    res_css = client.get("/static/css/app.css")
    assert res_css.status_code == 200
    assert ".diagram-canvas" in res_css.text
    assert 'html[data-theme="light"] .diagram-canvas' in res_css.text
    assert 'html[data-theme="dark"] .diagram-canvas' in res_css.text

def test_dashboard_slideshow_kpi_visual_fidelity():
    res_dash = client.get("/static/js/components/dashboard.js")
    assert res_dash.status_code == 200
    assert "DL PRB: 91.9% (Critical)" in res_dash.text
    assert "TelkomInfra" in res_dash.text
    assert "PUMA" in res_dash.text

def test_sidebar_overview_vector_icon():
    res_side = client.get("/static/js/components/sidebar.js")
    assert res_side.status_code == 200
    assert "📊" not in res_side.text
    assert "nav-dashboard.svg" in res_side.text

def test_theme_adaptive_icon_containers():
    res_app = client.get("/static/css/app.css")
    assert res_app.status_code == 200
    assert ".sidebar__link-icon" in res_app.text
    assert ".workspace-icon-box" in res_app.text

    res_comp = client.get("/static/css/components.css")
    assert res_comp.status_code == 200
    assert ".rf-card-tool__icon" in res_comp.text






