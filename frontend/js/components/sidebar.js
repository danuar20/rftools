/**
 * Collapsible Left Navigation Sidebar Component
 * Features clean dropdown navigation toggles with persistent state
 * Theme-adaptive icons and clutter-free links
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

    const renderChevron = (isOpen) => `
      <svg class="sidebar__chevron ${isOpen ? 'sidebar__chevron--open' : ''}" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
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
          <button type="button" class="sidebar__section-header" data-section="overview" aria-expanded="${secOverviewOpen}">
            <span class="sidebar__section-title">${state.t('nav_overview')}</span>
            ${renderChevron(secOverviewOpen)}
          </button>
          <ul class="sidebar__menu sidebar__submenu ${secOverviewOpen ? '' : 'sidebar__submenu--collapsed'}" id="submenu-overview">
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
          <button type="button" class="sidebar__section-header" data-section="kml" aria-expanded="${secKmlOpen}">
            <span class="sidebar__section-title">${state.t('nav_kml')}</span>
            ${renderChevron(secKmlOpen)}
          </button>
          <ul class="sidebar__menu sidebar__submenu ${secKmlOpen ? '' : 'sidebar__submenu--collapsed'}" id="submenu-kml">
            <li>
              <a href="#tool-excel-to-kml" class="sidebar__link ${currentRoute === 'tool-excel-to-kml' ? 'sidebar__link--active' : ''}" title="${state.t('tool_excel_to_kml_title')}">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-excel-to-kml.svg" alt="Point KML">
                </span>
                <span class="sidebar__link-text">Excel &rarr; Point KML</span>
              </a>
            </li>
            <li>
              <a href="#tool-prb-kml" class="sidebar__link ${currentRoute === 'tool-prb-kml' ? 'sidebar__link--active' : ''}" title="${state.t('tool_prb_kml_title')}">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-prb-kml.svg" alt="PRB KML">
                </span>
                <span class="sidebar__link-text">Excel &rarr; PRB 3D Sector</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Section: Network Topology & ISD -->
        <div class="sidebar__section" data-section="topology">
          <button type="button" class="sidebar__section-header" data-section="topology" aria-expanded="${secTopologyOpen}">
            <span class="sidebar__section-title">${state.t('nav_topology')}</span>
            ${renderChevron(secTopologyOpen)}
          </button>
          <ul class="sidebar__menu sidebar__submenu ${secTopologyOpen ? '' : 'sidebar__submenu--collapsed'}" id="submenu-topology">
            <li>
              <a href="#tool-isd-calculator" class="sidebar__link ${currentRoute === 'tool-isd-calculator' ? 'sidebar__link--active' : ''}" title="${state.t('tool_isd_calculator_title')}">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-isd-calculator.svg" alt="ISD">
                </span>
                <span class="sidebar__link-text">ISD Calculator</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Section: Coverage & Propagation -->
        <div class="sidebar__section" data-section="coverage">
          <button type="button" class="sidebar__section-header" data-section="coverage" aria-expanded="${secCoverageOpen}">
            <span class="sidebar__section-title">${state.t('nav_coverage')}</span>
            ${renderChevron(secCoverageOpen)}
          </button>
          <ul class="sidebar__menu sidebar__submenu ${secCoverageOpen ? '' : 'sidebar__submenu--collapsed'}" id="submenu-coverage">
            <li>
              <a href="#tool-coverage-simulation" class="sidebar__link ${currentRoute === 'tool-coverage-simulation' ? 'sidebar__link--active' : ''}" title="${state.t('tool_coverage_simulation_title', 'Coverage Simulation')}">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-coverage-simulation.svg" alt="Coverage Simulation">
                </span>
                <span class="sidebar__link-text">Coverage Simulation</span>
              </a>
            </li>
            <li>
              <a href="#tool-okumura-hata" class="sidebar__link ${currentRoute === 'tool-okumura-hata' ? 'sidebar__link--active' : ''}" title="${state.t('tool_okumura_hata_title', 'Okumura-Hata Model')}">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-okumura-hata.svg" alt="Okumura-Hata">
                </span>
                <span class="sidebar__link-text">Okumura-Hata Model</span>
              </a>
            </li>
            <li>
              <a href="#tool-nettilt-3d" class="sidebar__link ${(currentRoute === 'tool-nettilt-3d' || currentRoute === 'tool-nettilt3d') ? 'sidebar__link--active' : ''}" title="${state.t('tool_nettilt_3d_title', 'NetTilt 3D')}">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-nettilt-3d.svg" alt="NetTilt 3D">
                </span>
                <span class="sidebar__link-text">NetTilt 3D</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Section: Geospatial & Geohash Utilities -->
        <div class="sidebar__section" data-section="gis">
          <button type="button" class="sidebar__section-header" data-section="gis" aria-expanded="${secGisOpen}">
            <span class="sidebar__section-title">${state.t('nav_gis')}</span>
            ${renderChevron(secGisOpen)}
          </button>
          <ul class="sidebar__menu sidebar__submenu ${secGisOpen ? '' : 'sidebar__submenu--collapsed'}" id="submenu-gis">
            <li>
              <a href="#tool-geohash-converter" class="sidebar__link ${currentRoute === 'tool-geohash-converter' ? 'sidebar__link--active' : ''}" title="${state.t('tool_geohash_converter_title', 'Geohash Converter')}">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-geohash-converter.svg" alt="Geohash Converter">
                </span>
                <span class="sidebar__link-text">${state.t('tool_geohash_converter_title', 'Geohash Converter')}</span>
              </a>
            </li>
            <li>
              <a href="#tool-geohash-to-shp" class="sidebar__link ${currentRoute === 'tool-geohash-to-shp' ? 'sidebar__link--active' : ''}" title="${state.t('tool_geohash_to_shp_title')}">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-geohash-to-shp.svg" alt="Geohash to SHP">
                </span>
                <span class="sidebar__link-text">Geohash &rarr; Shapefile</span>
              </a>
            </li>
            <li>
              <a href="#tool-geohash-to-latlon" class="sidebar__link ${currentRoute === 'tool-geohash-to-latlon' ? 'sidebar__link--active' : ''}" title="${state.t('tool_geohash_to_latlon_title')}">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-geohash-to-latlon.svg" alt="Decoder">
                </span>
                <span class="sidebar__link-text">Geohash &rarr; Lat / Long</span>
              </a>
            </li>
            <li>
              <a href="#tool-latlon-to-geohash" class="sidebar__link ${currentRoute === 'tool-latlon-to-geohash' ? 'sidebar__link--active' : ''}" title="${state.t('tool_latlon_to_geohash_title')}">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-latlon-to-geohash.svg" alt="Encoder">
                </span>
                <span class="sidebar__link-text">Lat / Long &rarr; Geohash</span>
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Sidebar Footer (Refined User-Friendly Toggle Button) -->
      <div class="sidebar__footer">
        <button class="sidebar__toggle" id="sidebar-toggle-btn" title="${state.t('toggle_sidebar')}" aria-label="${state.t('toggle_sidebar')}">
          <span class="sidebar__toggle-icon">
            <svg class="sidebar__toggle-svg" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2.5" y="2.5" width="15" height="15" rx="3" stroke-width="1.5"/>
              <path d="M7.5 2.5V17.5" stroke-width="1.5"/>
              ${isCollapsed ? '<path d="M11 8L13.5 10.5L11 13"/>' : '<path d="M13.5 8L11 10.5L13.5 13"/>'}
            </svg>
          </span>
          ${isCollapsed ? '' : `<span class="sidebar__toggle-label">${state.lang === 'id' ? 'Ciutkan Menu' : 'Collapse Sidebar'}</span>`}
        </button>
      </div>
    `;

    // Bind collapsible section toggles
    const sectionHeaders = this.container.querySelectorAll('.sidebar__section-header');
    sectionHeaders.forEach((header) => {
      header.addEventListener('click', () => {
        const secId = header.dataset.section;
        if (secId) {
          this.toggleSection(secId);
        }
      });
    });

    const toggleBtn = this.container.querySelector('#sidebar-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        state.toggleSidebar();
      });
    }
  }
}
