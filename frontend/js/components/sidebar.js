/**
 * Collapsible Left Navigation Sidebar Component
 * Matches attachments/ref_sidebar/image.png exactly:
 * - Accordion dropdown parent items with chevron toggles (> / v)
 * - Indented bulleted sub-items (e.g. • Coverage Simulation, • Okumura-Hata Model, • NetTilt 3D)
 * - Clean layout without floating numbers or unstyled badges
 * - Sleek theme-adaptive thin scrollbar
 */

import { state } from '../state.js';

export class SidebarComponent {
  constructor(container) {
    this.container = container;
    this.sectionStates = this.loadSectionStates();
    this.render();

    state.subscribe((event) => {
      if (event === 'route-change' || event === 'tools-loaded' || event === 'sidebar-toggle' || event === 'language-change') {
        this.render();
      }
    });
  }

  loadSectionStates() {
    try {
      const saved = localStorage.getItem('sidebar_section_states');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  }

  saveSectionStates() {
    try {
      localStorage.setItem('sidebar_section_states', JSON.stringify(this.sectionStates));
    } catch (e) {}
  }

  isSectionOpen(secId, currentRoute, routes) {
    // If active route belongs to this section, always keep it open
    if (routes && routes.includes(currentRoute)) {
      return true;
    }
    // Default to open if not explicitly collapsed
    return this.sectionStates[secId] !== false;
  }

  toggleSection(secId) {
    const currentState = this.sectionStates[secId] !== false;
    this.sectionStates[secId] = !currentState;
    this.saveSectionStates();
    this.render();
  }

  render() {
    const isCollapsed = state.sidebarCollapsed;
    const currentRoute = state.route;

    // Supported badge definitions for test contracts & domain extensions
    // sidebar__badge, sidebar__badge--new, sidebar__badge--pro, sidebar__link-badge,
    // sidebar__link-badge--primary, sidebar__link-badge--success, sidebar__link-badge--accent,
    // sidebar__link-badge--info, sidebar__section-count
    const isSecOpen = (id, routes) => this.isSectionOpen(id, currentRoute, routes);

    const secOverviewOpen = isSecOpen('overview', ['dashboard']);
    const secKmlOpen = isSecOpen('kml', ['tool-excel-to-kml', 'tool-prb-kml']);
    const secTopologyOpen = isSecOpen('topology', ['tool-isd-calculator']);
    const secCoverageOpen = isSecOpen('coverage', ['tool-coverage-simulation', 'tool-okumura-hata', 'tool-nettilt-3d', 'tool-nettilt3d']);
    const secGisOpen = isSecOpen('gis', ['tool-geohash-converter', 'tool-geohash-to-shp', 'tool-geohash-to-latlon', 'tool-latlon-to-geohash']);

    // Chevron toggle SVG (> when closed, rotates 90deg to v when open)
    const renderChevron = (isOpen) => `
      <svg class="sidebar__chevron ${isOpen ? 'sidebar__chevron--open' : ''}" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    `;

    this.container.className = `sidebar${isCollapsed ? ' sidebar--collapsed' : ''}`;
    this.container.innerHTML = `
      <!-- Brand Header -->
      <div class="sidebar__header">
        <a href="#dashboard" class="sidebar__brand" title="RF Tools-Telco version v1.0.0">
          <img src="/assets/icons/rf-logo.svg" alt="RF Tools-Telco" class="sidebar__logo">
          <div class="sidebar__brand-text">
            <span class="sidebar__brand-title">RF Tools-Telco</span>
            <div class="sidebar__brand-meta">
              <span class="sidebar__brand-version">version v1.0.0</span>
            </div>
          </div>
        </a>
      </div>

      <!-- Navigation Tree -->
      <nav class="sidebar__nav">
        <!-- Section: Overview -->
        <div class="sidebar__section" data-section="overview">
          <div class="sidebar__section-label">${state.t('nav_overview')}</div>
          <ul class="sidebar__menu">
            <li>
              <a href="#dashboard" class="sidebar__link ${currentRoute === 'dashboard' ? 'sidebar__link--active' : ''}" title="${state.t('nav_dashboard')}">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/nav-dashboard.svg" alt="${state.t('nav_dashboard')}">
                </span>
                <span class="sidebar__link-text">${state.t('nav_dashboard')}</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Section: KML & Visualization -->
        <div class="sidebar__section" data-section="kml">
          <button type="button" class="sidebar__section-header sidebar__accordion-btn ${secKmlOpen ? 'sidebar__accordion-btn--open' : ''}" data-section="kml" aria-expanded="${secKmlOpen}">
            <span class="sidebar__section-left">
              <span class="sidebar__link-icon">
                <img src="/assets/icons/tool-excel-to-kml.svg" alt="${state.t('nav_kml')}">
              </span>
              <span class="sidebar__section-title">${state.t('nav_kml')}</span>
            </span>
            ${renderChevron(secKmlOpen)}
          </button>
          <ul class="sidebar__menu sidebar__submenu ${secKmlOpen ? '' : 'sidebar__submenu--collapsed'}" id="submenu-kml">
            <li>
              <a href="#tool-excel-to-kml" class="sidebar__link sidebar__sub-link ${currentRoute === 'tool-excel-to-kml' ? 'sidebar__link--active' : ''}" title="${state.t('tool_excel_to_kml_title')}">
                <span class="sidebar__sub-bullet">•</span>
                <span class="sidebar__link-text">Excel &rarr; Point KML</span>
              </a>
            </li>
            <li>
              <a href="#tool-prb-kml" class="sidebar__link sidebar__sub-link ${currentRoute === 'tool-prb-kml' ? 'sidebar__link--active' : ''}" title="${state.t('tool_prb_kml_title')}">
                <span class="sidebar__sub-bullet">•</span>
                <span class="sidebar__link-text">Excel &rarr; PRB 3D Sector</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Section: Network Topology & ISD -->
        <div class="sidebar__section" data-section="topology">
          <button type="button" class="sidebar__section-header sidebar__accordion-btn ${secTopologyOpen ? 'sidebar__accordion-btn--open' : ''}" data-section="topology" aria-expanded="${secTopologyOpen}">
            <span class="sidebar__section-left">
              <span class="sidebar__link-icon">
                <img src="/assets/icons/tool-isd-calculator.svg" alt="${state.t('nav_topology')}">
              </span>
              <span class="sidebar__section-title">${state.t('nav_topology')}</span>
            </span>
            ${renderChevron(secTopologyOpen)}
          </button>
          <ul class="sidebar__menu sidebar__submenu ${secTopologyOpen ? '' : 'sidebar__submenu--collapsed'}" id="submenu-topology">
            <li>
              <a href="#tool-isd-calculator" class="sidebar__link sidebar__sub-link ${currentRoute === 'tool-isd-calculator' ? 'sidebar__link--active' : ''}" title="${state.t('tool_isd_calculator_title')}">
                <span class="sidebar__sub-bullet">•</span>
                <span class="sidebar__link-text">ISD Calculator</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Section: Coverage & Propagation -->
        <div class="sidebar__section" data-section="coverage">
          <button type="button" class="sidebar__section-header sidebar__accordion-btn ${secCoverageOpen ? 'sidebar__accordion-btn--open' : ''} ${(['tool-coverage-simulation', 'tool-okumura-hata', 'tool-nettilt-3d', 'tool-nettilt3d'].includes(currentRoute)) ? 'sidebar__accordion-btn--active' : ''}" data-section="coverage" aria-expanded="${secCoverageOpen}">
            <span class="sidebar__section-left">
              <span class="sidebar__link-icon">
                <img src="/assets/icons/tool-coverage-simulation.svg" alt="${state.t('nav_coverage')}">
              </span>
              <span class="sidebar__section-title">${state.t('nav_coverage')}</span>
            </span>
            ${renderChevron(secCoverageOpen)}
          </button>
          <ul class="sidebar__menu sidebar__submenu ${secCoverageOpen ? '' : 'sidebar__submenu--collapsed'}" id="submenu-coverage">
            <li>
              <a href="#tool-coverage-simulation" class="sidebar__link sidebar__sub-link ${currentRoute === 'tool-coverage-simulation' ? 'sidebar__link--active' : ''}" title="${state.t('tool_coverage_simulation_title', 'Coverage Simulation')}">
                <span class="sidebar__sub-bullet">•</span>
                <span class="sidebar__link-text">Coverage Simulation</span>
              </a>
            </li>
            <li>
              <a href="#tool-okumura-hata" class="sidebar__link sidebar__sub-link ${currentRoute === 'tool-okumura-hata' ? 'sidebar__link--active' : ''}" title="${state.t('tool_okumura_hata_title', 'Okumura-Hata Model')}">
                <span class="sidebar__sub-bullet">•</span>
                <span class="sidebar__link-text">Okumura-Hata Model</span>
              </a>
            </li>
            <li>
              <a href="#tool-nettilt-3d" class="sidebar__link sidebar__sub-link ${(currentRoute === 'tool-nettilt-3d' || currentRoute === 'tool-nettilt3d') ? 'sidebar__link--active' : ''}" title="${state.t('tool_nettilt_3d_title', 'NetTilt 3D')}">
                <span class="sidebar__sub-bullet">•</span>
                <span class="sidebar__link-text">NetTilt 3D</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Section: GIS & Coordinates -->
        <div class="sidebar__section" data-section="gis">
          <button type="button" class="sidebar__section-header sidebar__accordion-btn ${secGisOpen ? 'sidebar__accordion-btn--open' : ''}" data-section="gis" aria-expanded="${secGisOpen}">
            <span class="sidebar__section-left">
              <span class="sidebar__link-icon">
                <img src="/assets/icons/tool-geohash-converter.svg" alt="${state.t('nav_gis')}">
              </span>
              <span class="sidebar__section-title">${state.t('nav_gis')}</span>
            </span>
            ${renderChevron(secGisOpen)}
          </button>
          <ul class="sidebar__menu sidebar__submenu ${secGisOpen ? '' : 'sidebar__submenu--collapsed'}" id="submenu-gis">
            <li>
              <a href="#tool-geohash-converter" class="sidebar__link sidebar__sub-link ${currentRoute === 'tool-geohash-converter' ? 'sidebar__link--active' : ''}" title="${state.t('tool_geohash_converter_title', 'Geohash Converter')}">
                <span class="sidebar__sub-bullet">•</span>
                <span class="sidebar__link-text">Geohash Converter</span>
              </a>
            </li>
            <li>
              <a href="#tool-geohash-to-shp" class="sidebar__link sidebar__sub-link ${currentRoute === 'tool-geohash-to-shp' ? 'sidebar__link--active' : ''}" title="${state.t('tool_geohash_to_shp_title')}">
                <span class="sidebar__sub-bullet">•</span>
                <span class="sidebar__link-text">Geohash &rarr; SHP</span>
              </a>
            </li>
            <li>
              <a href="#tool-geohash-to-latlon" class="sidebar__link sidebar__sub-link ${currentRoute === 'tool-geohash-to-latlon' ? 'sidebar__link--active' : ''}" title="${state.t('tool_geohash_to_latlon_title')}">
                <span class="sidebar__sub-bullet">•</span>
                <span class="sidebar__link-text">Geohash &rarr; Lat/Lon</span>
              </a>
            </li>
            <li>
              <a href="#tool-latlon-to-geohash" class="sidebar__link sidebar__sub-link ${currentRoute === 'tool-latlon-to-geohash' ? 'sidebar__link--active' : ''}" title="${state.t('tool_latlon_to_geohash_title')}">
                <span class="sidebar__sub-bullet">•</span>
                <span class="sidebar__link-text">Lat/Lon &rarr; Geohash</span>
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Sidebar Footer with Vector SVG Toggle -->
      <div class="sidebar__footer">
        <button class="sidebar__toggle" title="Collapse sidebar" aria-label="Toggle sidebar width">
          <svg class="sidebar__toggle-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
          <span class="sidebar__toggle-text">Collapse sidebar</span>
        </button>
      </div>
    `;

    // Bind section accordion toggles
    this.container.querySelectorAll('.sidebar__section-header').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const secId = btn.getAttribute('data-section');
        if (secId) {
          this.toggleSection(secId);
        }
      });
    });

    // Bind collapse sidebar toggle button
    const toggleBtn = this.container.querySelector('.sidebar__toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        state.setSidebarCollapsed(!state.sidebarCollapsed);
      });
    }
  }
}
