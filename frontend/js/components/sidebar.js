/**
 * Collapsible Left Navigation Sidebar Component
 */

import { state } from '../state.js';

export class SidebarComponent {
  constructor(container) {
    this.container = container;
    this.render();

    state.subscribe((event, data) => {
      if (event === 'route-change' || event === 'tools-loaded' || event === 'sidebar-toggle' || event === 'health-update') {
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
        <a href="#dashboard" class="sidebar__brand">
          <img src="/assets/icons/rf-logo.svg" alt="RF TOOLS" class="sidebar__logo">
          <div class="sidebar__brand-text">
            <span class="sidebar__brand-title">RF TOOLS</span>
            <span class="sidebar__brand-subtitle">Engineering Suite</span>
          </div>
        </a>
        <button class="sidebar__toggle" id="sidebar-toggle-btn" title="Toggle Sidebar (Ctrl+B)">
          <span>${isCollapsed ? '▶' : '◀'}</span>
        </button>
      </div>

      <!-- Navigation Tree -->
      <nav class="sidebar__nav">
        <!-- Overview -->
        <div>
          <div class="sidebar__section-title">Overview</div>
          <ul class="sidebar__menu">
            <li>
              <a href="#dashboard" class="sidebar__link ${currentRoute === 'dashboard' ? 'sidebar__link--active' : ''}" title="Dashboard">
                <span class="sidebar__link-icon">📊</span>
                <span class="sidebar__link-text">Dashboard</span>
              </a>
            </li>
            <li>
              <a href="#tools" class="sidebar__link ${currentRoute === 'tools' ? 'sidebar__link--active' : ''}" title="Tools Directory">
                <span class="sidebar__link-icon">🧰</span>
                <span class="sidebar__link-text">Tools Directory</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Domain A: KML & Site Visualization -->
        <div>
          <div class="sidebar__section-title">KML &amp; Visualization</div>
          <ul class="sidebar__menu">
            <li>
              <a href="#tool-excel-to-kml" class="sidebar__link ${currentRoute === 'tool-excel-to-kml' ? 'sidebar__link--active' : ''}" title="Point KML Converter">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-excel-to-kml.svg" alt="Point KML">
                </span>
                <span class="sidebar__link-text">Excel &rarr; Point KML</span>
              </a>
            </li>
            <li>
              <a href="#tool-prb-kml" class="sidebar__link ${currentRoute === 'tool-prb-kml' ? 'sidebar__link--active' : ''}" title="PRB 3D Sector Visualizer">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-prb-kml.svg" alt="PRB KML">
                </span>
                <span class="sidebar__link-text">Excel &rarr; PRB 3D Sector</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Domain B: Network Topology & ISD -->
        <div>
          <div class="sidebar__section-title">Topology &amp; Distance</div>
          <ul class="sidebar__menu">
            <li>
              <a href="#tool-isd-calculator" class="sidebar__link ${currentRoute === 'tool-isd-calculator' ? 'sidebar__link--active' : ''}" title="Inter-Site Distance Calculator">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-isd-calculator.svg" alt="ISD">
                </span>
                <span class="sidebar__link-text">ISD Calculator (Dual)</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Domain C: Geospatial & Geohash Utilities -->
        <div>
          <div class="sidebar__section-title">Geospatial &amp; Geohash</div>
          <ul class="sidebar__menu">
            <li>
              <a href="#tool-geohash-to-shp" class="sidebar__link ${currentRoute === 'tool-geohash-to-shp' ? 'sidebar__link--active' : ''}" title="Geohash to Shapefile">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-geohash-to-shp.svg" alt="Geohash to SHP">
                </span>
                <span class="sidebar__link-text">Geohash &rarr; Shapefile</span>
              </a>
            </li>
            <li>
              <a href="#tool-geohash-to-latlon" class="sidebar__link ${currentRoute === 'tool-geohash-to-latlon' ? 'sidebar__link--active' : ''}" title="Geohash to Lat/Long">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-geohash-to-latlon.svg" alt="Decoder">
                </span>
                <span class="sidebar__link-text">Geohash &rarr; Lat / Long</span>
              </a>
            </li>
            <li>
              <a href="#tool-latlon-to-geohash" class="sidebar__link ${currentRoute === 'tool-latlon-to-geohash' ? 'sidebar__link--active' : ''}" title="Lat/Long to Geohash">
                <span class="sidebar__link-icon">
                  <img src="/assets/icons/tool-latlon-to-geohash.svg" alt="Encoder">
                </span>
                <span class="sidebar__link-text">Lat / Long &rarr; Geohash</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Documentation & Specs -->
        <div>
          <div class="sidebar__section-title">Reference &amp; Specs</div>
          <ul class="sidebar__menu">
            <li>
              <a href="#docs" class="sidebar__link ${currentRoute === 'docs' ? 'sidebar__link--active' : ''}" title="Documentation">
                <span class="sidebar__link-icon">📖</span>
                <span class="sidebar__link-text">Documentation</span>
              </a>
            </li>
            <li>
              <a href="#templates" class="sidebar__link ${currentRoute === 'templates' ? 'sidebar__link--active' : ''}" title="Sample Templates">
                <span class="sidebar__link-icon">📥</span>
                <span class="sidebar__link-text">Sample Templates</span>
              </a>
            </li>
            <li>
              <a href="#about" class="sidebar__link ${currentRoute === 'about' ? 'sidebar__link--active' : ''}" title="Architecture &amp; System Health">
                <span class="sidebar__link-icon">⚙️</span>
                <span class="sidebar__link-text">About &amp; Architecture</span>
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Sidebar Footer -->
      <div class="sidebar__footer">
        <div class="sidebar__status-box">
          <span class="pulse-dot ${state.health.ok ? '' : 'pulse-dot--danger'}"></span>
          <span class="sidebar__status-text">
            ${state.health.ok ? 'Port 5005 Live' : 'Port 5005 Disconnected'}
          </span>
          <span class="rf-tabular-nums sidebar__status-text" style="font-size: 0.6875rem; color: var(--color-text-muted);">
            v1.0.0
          </span>
        </div>
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
