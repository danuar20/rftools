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



