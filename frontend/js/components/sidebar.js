/**
 * Collapsible Left Navigation Sidebar Component
 * Streamlined hierarchy with refined bottom toggle and localized navigation
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

    this.container.className = `sidebar${isCollapsed ? ' sidebar--collapsed' : ''}`;
    this.container.innerHTML = `
      <!-- Brand Header -->
      <div class="sidebar__header">
        <a href="#dashboard" class="sidebar__brand" title="RF Tools-Telco version v1.0.0">
          <img src="/assets/icons/rf-logo.svg" alt="RF Tools-Telco" class="sidebar__logo">
          <div class="sidebar__brand-text">
            <span class="sidebar__brand-title">RF Tools-Telco</span>
            <span class="sidebar__brand-version">version v1.0.0</span>
          </div>
        </a>
      </div>

      <!-- Navigation Tree -->
      <nav class="sidebar__nav">
        <!-- Section: Overview -->
        <div>
          <div class="sidebar__section-title">${state.t('nav_overview')}</div>
          <ul class="sidebar__menu">
            <li>
              <a href="#dashboard" class="sidebar__link ${currentRoute === 'dashboard' ? 'sidebar__link--active' : ''}" title="${state.t('nav_dashboard')}">
                <span class="sidebar__link-icon">📊</span>
                <span class="sidebar__link-text">${state.t('nav_dashboard')}</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Section: KML & Visualization -->
        <div>
          <div class="sidebar__section-title">${state.t('nav_kml')}</div>
          <ul class="sidebar__menu">
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
        <div>
          <div class="sidebar__section-title">${state.t('nav_topology')}</div>
          <ul class="sidebar__menu">
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

        <!-- Section: Geospatial & Geohash Utilities -->
        <div>
          <div class="sidebar__section-title">${state.t('nav_gis')}</div>
          <ul class="sidebar__menu">
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
          <span class="sidebar__toggle-icon">${isCollapsed ? '▶' : '◀'}</span>
          ${isCollapsed ? '' : `<span class="sidebar__toggle-label">${state.lang === 'id' ? 'Ciutkan Menu' : 'Collapse Sidebar'}</span>`}
        </button>
      </div>
    `;

    const toggleBtn = this.container.querySelector('#sidebar-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        state.toggleSidebar();
      });
    }
  }
}
