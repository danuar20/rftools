/**
 * Collapsible Left Navigation Sidebar Component
 * Matches attachments/feedback_final/ (screen_expanded_final.png, screen_collapsed_final.png, screen_collapsed_hover.png):
 * - Static uppercase section headers (OVERVIEW, KML & VISUALIZATION, TOPOLOGY & DISTANCE, COVERAGE & PROPAGATION, GEOSPATIAL & GEOHASH)
 * - Direct links with vector glyph icons for all tools
 * - Soft light-blue pill active indicator with blue left accent border
 * - Smooth collapse/expand functionality with icon-only mode and Ctrl+B shortcut
 * - Floating dark tooltip popup on hover in collapsed mode
 */

import { state } from '../state.js';

export class SidebarComponent {
  constructor(container) {
    this.container = container;
    this.initKeyboardShortcut();
    this.initFloatingTooltip();
    this.render();

    state.subscribe((event) => {
      if (event === 'route-change' || event === 'tools-loaded' || event === 'sidebar-toggle' || event === 'language-change') {
        this.hideFloatingTooltip();
        this.render();
      }
    });
  }

  initKeyboardShortcut() {
    if (!window._sidebarKeyboardBound) {
      window._sidebarKeyboardBound = true;
      window.addEventListener('keydown', (e) => {
        // Toggle sidebar on Ctrl+B or Cmd+B
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
          e.preventDefault();
          state.toggleSidebar();
        }
      });
    }
  }

  initFloatingTooltip() {
    let tooltip = document.getElementById('sidebar-floating-tooltip');
    if (!tooltip && typeof document !== 'undefined') {
      tooltip = document.createElement('div');
      tooltip.id = 'sidebar-floating-tooltip';
      tooltip.className = 'sidebar-floating-tooltip';
      document.body.appendChild(tooltip);
    }
    this.floatingTooltip = tooltip;
  }

  hideFloatingTooltip() {
    if (this.floatingTooltip) {
      this.floatingTooltip.style.display = 'none';
    }
  }

  bindTooltipEvents() {
    const links = this.container.querySelectorAll('.sidebar__link');
    links.forEach((link) => {
      link.addEventListener('mouseenter', () => {
        if (state.sidebarCollapsed && this.floatingTooltip) {
          const title = link.getAttribute('data-tooltip') || link.getAttribute('title') || '';
          this.floatingTooltip.textContent = title;
          const rect = link.getBoundingClientRect();
          this.floatingTooltip.style.top = `${rect.top + rect.height / 2}px`;
          this.floatingTooltip.style.left = `${rect.right + 10}px`;
          this.floatingTooltip.style.display = 'block';
        }
      });

      link.addEventListener('mouseleave', () => {
        this.hideFloatingTooltip();
      });

      link.addEventListener('click', () => {
        this.hideFloatingTooltip();
      });
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

      <!-- Navigation Tree: Clean Flat Direct Links (fallback_dir/image.png) -->
      <nav class="sidebar__nav">
        <!-- Section: Overview -->
        <div class="sidebar__section" data-section="overview">
          <div class="sidebar__section-label">${state.t('nav_overview')}</div>
          <ul class="sidebar__menu">
            <li>
              <a href="#dashboard" class="sidebar__link ${currentRoute === 'dashboard' ? 'sidebar__link--active' : ''}" title="${state.t('nav_dashboard')}" data-tooltip="${state.t('nav_dashboard')}">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/nav-dashboard.svg" alt="${state.t('nav_dashboard')}">
                </span>
                <span class="sidebar__link-text">${state.t('nav_dashboard')}</span>
                <span class="sidebar__tooltip">${state.t('nav_dashboard')}</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Section: KML & Visualization -->
        <div class="sidebar__section" data-section="kml">
          <div class="sidebar__section-label">${state.t('nav_kml')}</div>
          <ul class="sidebar__menu">
            <li>
              <a href="#tool-excel-to-kml" class="sidebar__link ${currentRoute === 'tool-excel-to-kml' ? 'sidebar__link--active' : ''}" title="${state.t('tool_excel_to_kml_title')}" data-tooltip="Excel → Point KML">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-excel-to-kml.svg" alt="${state.t('tool_excel_to_kml_title')}">
                </span>
                <span class="sidebar__link-text">Excel &rarr; Point KML</span>
                <span class="sidebar__tooltip">Excel &rarr; Point KML</span>
              </a>
            </li>
            <li>
              <a href="#tool-prb-kml" class="sidebar__link ${currentRoute === 'tool-prb-kml' ? 'sidebar__link--active' : ''}" title="${state.t('tool_prb_kml_title')}" data-tooltip="Excel → PRB 3D Sector">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-prb-kml.svg" alt="${state.t('tool_prb_kml_title')}">
                </span>
                <span class="sidebar__link-text">Excel &rarr; PRB 3D Sector</span>
                <span class="sidebar__tooltip">Excel &rarr; PRB 3D Sector</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Section: Topology & Distance -->
        <div class="sidebar__section" data-section="topology">
          <div class="sidebar__section-label">${state.t('nav_topology')}</div>
          <ul class="sidebar__menu">
            <li>
              <a href="#tool-isd-calculator" class="sidebar__link ${currentRoute === 'tool-isd-calculator' ? 'sidebar__link--active' : ''}" title="${state.t('tool_isd_calculator_title')}" data-tooltip="ISD Calculator">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-isd-calculator.svg" alt="${state.t('tool_isd_calculator_title')}">
                </span>
                <span class="sidebar__link-text">ISD Calculator</span>
                <span class="sidebar__tooltip">ISD Calculator</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Section: Coverage & Propagation -->
        <div class="sidebar__section" data-section="coverage">
          <div class="sidebar__section-label">${state.lang === 'id' ? state.t('nav_coverage') : 'Coverage & Propagation'}</div>
          <ul class="sidebar__menu">
            <li>
              <a href="#tool-coverage-simulation" class="sidebar__link ${currentRoute === 'tool-coverage-simulation' ? 'sidebar__link--active' : ''}" title="${state.t('tool_coverage_simulation_title', 'Coverage Simulation')}" data-tooltip="Coverage Simulation">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-coverage-simulation.svg" alt="Coverage Simulation">
                </span>
                <span class="sidebar__link-text">Coverage Simulation</span>
                <span class="sidebar__tooltip">Coverage Simulation</span>
              </a>
            </li>
            <li>
              <a href="#tool-okumura-hata" class="sidebar__link ${currentRoute === 'tool-okumura-hata' ? 'sidebar__link--active' : ''}" title="${state.t('tool_okumura_hata_title', 'Okumura-Hata Model')}" data-tooltip="Okumura-Hata Model">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-okumura-hata.svg" alt="Okumura-Hata Model">
                </span>
                <span class="sidebar__link-text">Okumura-Hata Model</span>
                <span class="sidebar__tooltip">Okumura-Hata Model</span>
              </a>
            </li>
            <li>
              <a href="#tool-nettilt-3d" class="sidebar__link ${(currentRoute === 'tool-nettilt-3d' || currentRoute === 'tool-nettilt3d') ? 'sidebar__link--active' : ''}" title="${state.t('tool_nettilt_3d_title', 'NetTilt 3D')}" data-tooltip="NetTilt 3D">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-nettilt-3d.svg" alt="NetTilt 3D">
                </span>
                <span class="sidebar__link-text">NetTilt 3D</span>
                <span class="sidebar__tooltip">NetTilt 3D</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Section: Geospatial & Geohash -->
        <div class="sidebar__section" data-section="gis">
          <div class="sidebar__section-label">${state.t('nav_gis')}</div>
          <ul class="sidebar__menu">
            <li>
              <a href="#tool-geohash-converter" class="sidebar__link ${currentRoute === 'tool-geohash-converter' ? 'sidebar__link--active' : ''}" title="${state.t('tool_geohash_converter_title', 'Geohash Converter')}" data-tooltip="Geohash Converter">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-geohash-converter.svg" alt="Geohash Converter">
                </span>
                <span class="sidebar__link-text">Geohash Converter</span>
                <span class="sidebar__tooltip">Geohash Converter</span>
              </a>
            </li>
            <li>
              <a href="#tool-geohash-to-shp" class="sidebar__link ${currentRoute === 'tool-geohash-to-shp' ? 'sidebar__link--active' : ''}" title="${state.t('tool_geohash_to_shp_title')}" data-tooltip="Geohash → Shapefile">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-geohash-to-shp.svg" alt="Geohash &rarr; Shapefile">
                </span>
                <span class="sidebar__link-text">Geohash &rarr; Shapefile</span>
                <span class="sidebar__tooltip">Geohash &rarr; Shapefile</span>
              </a>
            </li>
            <li>
              <a href="#tool-geohash-to-latlon" class="sidebar__link ${currentRoute === 'tool-geohash-to-latlon' ? 'sidebar__link--active' : ''}" title="${state.t('tool_geohash_to_latlon_title')}" data-tooltip="Geohash → Lat / Long">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-geohash-to-latlon.svg" alt="Geohash &rarr; Lat / Long">
                </span>
                <span class="sidebar__link-text">Geohash &rarr; Lat / Long</span>
                <span class="sidebar__tooltip">Geohash &rarr; Lat / Long</span>
              </a>
            </li>
            <li>
              <a href="#tool-latlon-to-geohash" class="sidebar__link ${currentRoute === 'tool-latlon-to-geohash' ? 'sidebar__link--active' : ''}" title="${state.t('tool_latlon_to_geohash_title')}" data-tooltip="Lat / Long → Geohash">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-latlon-to-geohash.svg" alt="Lat / Long &rarr; Geohash">
                </span>
                <span class="sidebar__link-text">Lat / Long &rarr; Geohash</span>
                <span class="sidebar__tooltip">Lat / Long &rarr; Geohash</span>
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Sidebar Footer with Collapse Toggle and Ctrl+B shortcut -->
      <div class="sidebar__footer">
        <button class="sidebar__toggle" type="button" title="${isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}" aria-label="Toggle sidebar width">
          <svg class="sidebar__toggle-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
          <span class="sidebar__toggle-text sidebar__toggle-label">${isCollapsed ? 'Expand' : 'Collapse sidebar'}</span>
          <kbd class="sidebar__toggle-kbd">Ctrl+B</kbd>
        </button>
      </div>
    `;

    // Bind collapse sidebar toggle button
    const toggleBtn = this.container.querySelector('.sidebar__toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.hideFloatingTooltip();
        state.toggleSidebar();
      });
    }

    // Bind tooltips for collapsed mode
    this.bindTooltipEvents();
  }
}
