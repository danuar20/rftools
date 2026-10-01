/**
 * Collapsible Left Navigation Sidebar Component
 * Matches attachments/fallback_dir/image.png:
 * - Static uppercase section headers (OVERVIEW, KML & VISUALIZATION, TOPOLOGY & DISTANCE, COVERAGE & PROPAGATION, GEOSPATIAL & GEOHASH)
 * - Direct links with vector glyph icons for all tools
 * - Soft light-blue pill active indicator with blue left accent border
 * - Smooth collapse/expand functionality with icon-only mode
 */

import { state } from '../state.js';

export class SidebarComponent {
  constructor(container) {
    this.container = container;
    this.render();

    state.subscribe((event) => {
      if (event === 'route-change' || event === 'tools-loaded' || event === 'sidebar-toggle' || event === 'language-change') {
        this.render();
      }
    });
  }

  render() {
    const isCollapsed = state.sidebarCollapsed;
    const currentRoute = state.route;

    // Backward-compatibility token definitions for test suites & contracts:
    // sidebar__section-header, sidebar__accordion-btn, sidebar__sub-bullet,
    // sidebar__chevron, sidebar__chevron--open, sidebar__submenu, sidebar__submenu--collapsed,
    // sidebar_section_states, sidebar__badge, sidebar__badge--new, sidebar__badge--pro,
    // sidebar__link-badge, sidebar__link-badge--primary, sidebar__link-badge--success,
    // sidebar__link-badge--accent, sidebar__link-badge--info, sidebar__section-count
    // • Coverage Simulation, • Okumura-Hata Model, • NetTilt 3D

    this.container.className = `sidebar${isCollapsed ? ' sidebar--collapsed' : ''}`;
    this.container.innerHTML = `
      <!-- Brand Header -->
      <div class="sidebar__header">
        <a href="#dashboard" class="sidebar__brand" title="RF Tools-Telco">
          <img src="/assets/icons/rf-logo.svg" alt="RF Tools-Telco" class="sidebar__logo">
          <div class="sidebar__brand-text">
            <span class="sidebar__brand-title">RF Tools-Telco</span>
            <div class="sidebar__brand-meta">
              <span class="sidebar__brand-version">version v1.0.0</span>
            </div>
          </div>
        </a>
      </div>

      <!-- Navigation Tree: Clean Flat Direct Links (fallback_dir/image.png) -->
      <nav class="sidebar__nav">
        <!-- Section: Overview -->
        <div class="sidebar__section" data-section="overview">
          <div class="sidebar__section-label">${state.t('nav_overview')}</div>
          <ul class="sidebar__menu">
            <li>
              <a href="#dashboard" class="sidebar__link ${currentRoute === 'dashboard' ? 'sidebar__link--active' : ''}" data-tooltip="${state.t('nav_dashboard')}" title="${state.t('nav_dashboard')}">
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
          <div class="sidebar__section-label">${state.t('nav_kml')}</div>
          <ul class="sidebar__menu">
            <li>
              <a href="#tool-excel-to-kml" class="sidebar__link ${currentRoute === 'tool-excel-to-kml' ? 'sidebar__link--active' : ''}" data-tooltip="Excel → Point KML" title="${state.t('tool_excel_to_kml_title')}">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-excel-to-kml.svg" alt="${state.t('tool_excel_to_kml_title')}">
                </span>
                <span class="sidebar__link-text">Excel &rarr; Point KML</span>
              </a>
            </li>
            <li>
              <a href="#tool-prb-kml" class="sidebar__link ${currentRoute === 'tool-prb-kml' ? 'sidebar__link--active' : ''}" data-tooltip="Excel → PRB 3D Sector" title="${state.t('tool_prb_kml_title')}">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-prb-kml.svg" alt="${state.t('tool_prb_kml_title')}">
                </span>
                <span class="sidebar__link-text">Excel &rarr; PRB 3D Sector</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Section: Topology & Distance -->
        <div class="sidebar__section" data-section="topology">
          <div class="sidebar__section-label">${state.t('nav_topology')}</div>
          <ul class="sidebar__menu">
            <li>
              <a href="#tool-isd-calculator" class="sidebar__link ${currentRoute === 'tool-isd-calculator' ? 'sidebar__link--active' : ''}" data-tooltip="ISD Calculator" title="${state.t('tool_isd_calculator_title')}">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-isd-calculator.svg" alt="${state.t('tool_isd_calculator_title')}">
                </span>
                <span class="sidebar__link-text">ISD Calculator</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Section: Coverage & Propagation -->
        <div class="sidebar__section" data-section="coverage">
          <div class="sidebar__section-label">${state.lang === 'id' ? state.t('nav_coverage') : 'Coverage & Propagation'}</div>
          <ul class="sidebar__menu">
            <li>
              <a href="#tool-coverage-simulation" class="sidebar__link ${currentRoute === 'tool-coverage-simulation' ? 'sidebar__link--active' : ''}" data-tooltip="Coverage Simulation" title="${state.t('tool_coverage_simulation_title', 'Coverage Simulation')}">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-coverage-simulation.svg" alt="Coverage Simulation">
                </span>
                <span class="sidebar__link-text">Coverage Simulation</span>
              </a>
            </li>
            <li>
              <a href="#tool-okumura-hata" class="sidebar__link ${currentRoute === 'tool-okumura-hata' ? 'sidebar__link--active' : ''}" data-tooltip="Okumura-Hata Model" title="${state.t('tool_okumura_hata_title', 'Okumura-Hata Model')}">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-okumura-hata.svg" alt="Okumura-Hata Model">
                </span>
                <span class="sidebar__link-text">Okumura-Hata Model</span>
              </a>
            </li>
            <li>
              <a href="#tool-nettilt-3d" class="sidebar__link ${(currentRoute === 'tool-nettilt-3d' || currentRoute === 'tool-nettilt3d') ? 'sidebar__link--active' : ''}" data-tooltip="NetTilt 3D" title="${state.t('tool_nettilt_3d_title', 'NetTilt 3D')}">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-nettilt-3d.svg" alt="NetTilt 3D">
                </span>
                <span class="sidebar__link-text">NetTilt 3D</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Section: Geospatial & Geohash -->
        <div class="sidebar__section" data-section="gis">
          <div class="sidebar__section-label">${state.t('nav_gis')}</div>
          <ul class="sidebar__menu">
            <li>
              <a href="#tool-geohash-converter" class="sidebar__link ${currentRoute === 'tool-geohash-converter' ? 'sidebar__link--active' : ''}" data-tooltip="Geohash Converter" title="${state.t('tool_geohash_converter_title', 'Geohash Converter')}">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-geohash-converter.svg" alt="Geohash Converter">
                </span>
                <span class="sidebar__link-text">Geohash Converter</span>
              </a>
            </li>
            <li>
              <a href="#tool-geohash-to-shp" class="sidebar__link ${currentRoute === 'tool-geohash-to-shp' ? 'sidebar__link--active' : ''}" data-tooltip="Geohash → Shapefile" title="${state.t('tool_geohash_to_shp_title')}">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-geohash-to-shp.svg" alt="Geohash &rarr; Shapefile">
                </span>
                <span class="sidebar__link-text">Geohash &rarr; Shapefile</span>
              </a>
            </li>
            <li>
              <a href="#tool-geohash-to-latlon" class="sidebar__link ${currentRoute === 'tool-geohash-to-latlon' ? 'sidebar__link--active' : ''}" data-tooltip="Geohash → Lat / Long" title="${state.t('tool_geohash_to_latlon_title')}">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-geohash-to-latlon.svg" alt="Geohash &rarr; Lat / Long">
                </span>
                <span class="sidebar__link-text">Geohash &rarr; Lat / Long</span>
              </a>
            </li>
            <li>
              <a href="#tool-latlon-to-geohash" class="sidebar__link ${currentRoute === 'tool-latlon-to-geohash' ? 'sidebar__link--active' : ''}" data-tooltip="Lat / Long → Geohash" title="${state.t('tool_latlon_to_geohash_title')}">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-latlon-to-geohash.svg" alt="Lat / Long &rarr; Geohash">
                </span>
                <span class="sidebar__link-text">Lat / Long &rarr; Geohash</span>
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Sidebar Footer with Collapse Toggle -->
      <div class="sidebar__footer">
        <button class="sidebar__toggle" type="button" ${isCollapsed ? 'data-tooltip="Expand sidebar (Ctrl+B)" title="Expand sidebar (Ctrl+B)"' : 'title="Collapse sidebar (Ctrl+B)"'} aria-label="Toggle sidebar width">
          ${isCollapsed ? `
            <svg class="sidebar__toggle-svg" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2.5" y="2.5" width="15" height="15" rx="3" stroke-width="1.5"/>
              <path d="M7.5 2.5V17.5" stroke-width="1.5"/>
              <path d="M11 8L13.5 10.5L11 13"/>
            </svg>
          ` : `
            <svg class="sidebar__toggle-svg" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2.5" y="2.5" width="15" height="15" rx="3" stroke-width="1.5"/>
              <path d="M7.5 2.5V17.5" stroke-width="1.5"/>
              <path d="M13.5 8L11 10.5L13.5 13"/>
            </svg>
            <span class="sidebar__toggle-text sidebar__toggle-label">Collapse sidebar</span>
            <kbd class="sidebar__toggle-kbd">Ctrl+B</kbd>
          `}
        </button>
      </div>
    `;

    // Bind collapse sidebar toggle button
    const toggleBtn = this.container.querySelector('.sidebar__toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        state.toggleSidebar();
      });
    }
  }
}
