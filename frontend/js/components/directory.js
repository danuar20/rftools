/**
 * Tools Directory & Specifications Component
 * Clean, minimal catalog with localized copy and direct launches
 */

import { state } from '../state.js';
import { ApiService } from '../api.js';
import { toast } from './toast.js';

export class DirectoryComponent {
  constructor(container) {
    this.container = container;
    this.render();

    this.unsubscribe = state.subscribe((event) => {
      if (state.route !== 'tools') return;
      if (event === 'tools-loaded' || event === 'language-change' || event === 'theme-change') {
        this.render();
      }
    });
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  render() {
    if (state.route !== 'tools') return;
    this.container.innerHTML = `
      <div style="max-width: 1300px; margin: 0 auto;">
        <!-- Header -->
        <div style="margin-bottom: 28px;">
          <h1 style="font-size: 1.75rem; font-weight: 700; color: var(--color-text-primary); margin: 0 0 6px 0;">
            ${state.t('nav_tools')}
          </h1>
          <p style="font-size: 0.9375rem; color: var(--color-text-secondary); margin: 0; max-width: 700px;">
            ${state.t('hero_subtitle')}
          </p>
        </div>

        <!-- Section 1: KML & Site Visualization -->
        <section style="margin-bottom: 40px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; border-bottom: 1px solid var(--color-border-default); padding-bottom: 8px;">
            <span style="font-size: 1.25rem;">📡</span>
            <h2 style="font-size: 1.15rem; font-weight: 600; color: var(--color-text-primary); margin: 0;">
              ${state.t('nav_kml')}
            </h2>
            <span class="rf-confidence-pill rf-confidence-pill--high">2 Engines</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 18px;">
            <!-- Tool 1 -->
            <div class="component-box" style="margin-bottom: 0;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div style="display: flex; gap: 12px; align-items: center;">
                  <div class="workspace-icon-box" style="width: 36px; height: 36px;">
                    <img src="/assets/icons/tool-excel-to-kml.svg" alt="Point KML">
                  </div>
                  <div>
                    <h3 style="font-size: 1.05rem; font-weight: 600; margin: 0; color: var(--color-text-primary);">
                      ${state.t('tool_excel_to_kml_title')}
                    </h3>
                    <span style="font-size: 0.75rem; color: var(--color-primary); font-family: 'JetBrains Mono', monospace;">excel_to_kml.py</span>
                  </div>
                </div>
                <a href="#tool-excel-to-kml" class="rf-btn rf-btn-primary" style="padding: 5px 12px; font-size: 0.75rem;">
                  ${state.t('btn_launch')}
                </a>
              </div>
              <p style="font-size: 0.8125rem; color: var(--color-text-secondary); line-height: 1.5; margin-bottom: 14px;">
                ${state.t('tool_excel_to_kml_desc')}
              </p>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <span class="rf-dropzone__format-pill">.xlsx, .xls</span>
                <span class="rf-dropzone__format-pill">.kml Placemark</span>
                <span class="rf-dropzone__format-pill">WGS84</span>
              </div>
            </div>

            <!-- Tool 2 -->
            <div class="component-box" style="margin-bottom: 0;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div style="display: flex; gap: 12px; align-items: center;">
                  <div class="workspace-icon-box" style="width: 36px; height: 36px;">
                    <img src="/assets/icons/tool-prb-kml.svg" alt="PRB KML">
                  </div>
                  <div>
                    <h3 style="font-size: 1.05rem; font-weight: 600; margin: 0; color: var(--color-text-primary);">
                      ${state.t('tool_prb_kml_title')}
                    </h3>
                    <span style="font-size: 0.75rem; color: var(--color-primary); font-family: 'JetBrains Mono', monospace;">prb_kml.py</span>
                  </div>
                </div>
                <a href="#tool-prb-kml" class="rf-btn rf-btn-primary" style="padding: 5px 12px; font-size: 0.75rem;">
                  ${state.t('btn_launch')}
                </a>
              </div>
              <p style="font-size: 0.8125rem; color: var(--color-text-secondary); line-height: 1.5; margin-bottom: 14px;">
                ${state.t('tool_prb_kml_desc')}
              </p>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <span class="rf-dropzone__format-pill">.xlsx (Sheet1)</span>
                <span class="rf-dropzone__format-pill">3D .kml</span>
                <span class="rf-dropzone__format-pill">3GPP LTE</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Section 2: Topology & Distance -->
        <section style="margin-bottom: 40px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; border-bottom: 1px solid var(--color-border-default); padding-bottom: 8px;">
            <span style="font-size: 1.25rem;">📐</span>
            <h2 style="font-size: 1.15rem; font-weight: 600; color: var(--color-text-primary); margin: 0;">
              ${state.t('nav_topology')}
            </h2>
            <span class="rf-confidence-pill rf-confidence-pill--high">1 Engine</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 18px;">
            <div class="component-box" style="margin-bottom: 0;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div style="display: flex; gap: 12px; align-items: center;">
                  <div class="workspace-icon-box" style="width: 36px; height: 36px;">
                    <img src="/assets/icons/tool-isd-calculator.svg" alt="ISD">
                  </div>
                  <div>
                    <h3 style="font-size: 1.05rem; font-weight: 600; margin: 0; color: var(--color-text-primary);">
                      ${state.t('tool_isd_calculator_title')}
                    </h3>
                    <span style="font-size: 0.75rem; color: var(--color-primary); font-family: 'JetBrains Mono', monospace;">isd_calculator.py</span>
                  </div>
                </div>
                <a href="#tool-isd-calculator" class="rf-btn rf-btn-primary" style="padding: 5px 12px; font-size: 0.75rem;">
                  ${state.t('btn_launch')}
                </a>
              </div>
              <p style="font-size: 0.8125rem; color: var(--color-text-secondary); line-height: 1.5; margin-bottom: 14px;">
                ${state.t('tool_isd_calculator_desc')}
              </p>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <span class="rf-dropzone__format-pill">Dual .xlsx / Sheet</span>
                <span class="rf-dropzone__format-pill">Haversine</span>
                <span class="rf-dropzone__format-pill">Nearest-N</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Section 3: Geospatial & Geohash -->
        <section style="margin-bottom: 40px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; border-bottom: 1px solid var(--color-border-default); padding-bottom: 8px;">
            <span style="font-size: 1.25rem;">🌐</span>
            <h2 style="font-size: 1.15rem; font-weight: 600; color: var(--color-text-primary); margin: 0;">
              ${state.t('nav_gis')}
            </h2>
            <span class="rf-confidence-pill rf-confidence-pill--high">3 Engines</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 18px;">
            <!-- Geohash to SHP -->
            <div class="component-box" style="margin-bottom: 0;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div style="display: flex; gap: 12px; align-items: center;">
                  <div class="workspace-icon-box" style="width: 36px; height: 36px;">
                    <img src="/assets/icons/tool-geohash-to-shp.svg" alt="Geohash to SHP">
                  </div>
                  <div>
                    <h3 style="font-size: 1.05rem; font-weight: 600; margin: 0; color: var(--color-text-primary);">
                      ${state.t('tool_geohash_to_shp_title')}
                    </h3>
                    <span style="font-size: 0.75rem; color: var(--color-primary); font-family: 'JetBrains Mono', monospace;">geohash_to_shp.py</span>
                  </div>
                </div>
                <a href="#tool-geohash-to-shp" class="rf-btn rf-btn-primary" style="padding: 5px 12px; font-size: 0.75rem;">
                  ${state.t('btn_launch')}
                </a>
              </div>
              <p style="font-size: 0.8125rem; color: var(--color-text-secondary); line-height: 1.5; margin-bottom: 14px;">
                ${state.t('tool_geohash_to_shp_desc')}
              </p>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <span class="rf-dropzone__format-pill">Input: Geohashes</span>
                <span class="rf-dropzone__format-pill">Output: .zip Shapefile</span>
              </div>
            </div>

            <!-- Geohash to LatLon -->
            <div class="component-box" style="margin-bottom: 0;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div style="display: flex; gap: 12px; align-items: center;">
                  <div class="workspace-icon-box" style="width: 36px; height: 36px;">
                    <img src="/assets/icons/tool-geohash-to-latlon.svg" alt="Geohash Decoder">
                  </div>
                  <div>
                    <h3 style="font-size: 1.05rem; font-weight: 600; margin: 0; color: var(--color-text-primary);">
                      ${state.t('tool_geohash_to_latlon_title')}
                    </h3>
                    <span style="font-size: 0.75rem; color: var(--color-primary); font-family: 'JetBrains Mono', monospace;">geohash_to_latlon.py</span>
                  </div>
                </div>
                <a href="#tool-geohash-to-latlon" class="rf-btn rf-btn-primary" style="padding: 5px 12px; font-size: 0.75rem;">
                  ${state.t('btn_launch')}
                </a>
              </div>
              <p style="font-size: 0.8125rem; color: var(--color-text-secondary); line-height: 1.5; margin-bottom: 14px;">
                ${state.t('tool_geohash_to_latlon_desc')}
              </p>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <span class="rf-dropzone__format-pill">Input: Tokens</span>
                <span class="rf-dropzone__format-pill">Output: Centroids</span>
              </div>
            </div>

            <!-- LatLon to Geohash -->
            <div class="component-box" style="margin-bottom: 0;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div style="display: flex; gap: 12px; align-items: center;">
                  <div class="workspace-icon-box" style="width: 36px; height: 36px;">
                    <img src="/assets/icons/tool-latlon-to-geohash.svg" alt="Geohash Encoder">
                  </div>
                  <div>
                    <h3 style="font-size: 1.05rem; font-weight: 600; margin: 0; color: var(--color-text-primary);">
                      ${state.t('tool_latlon_to_geohash_title')}
                    </h3>
                    <span style="font-size: 0.75rem; color: var(--color-primary); font-family: 'JetBrains Mono', monospace;">latlon_to_geohash.py</span>
                  </div>
                </div>
                <a href="#tool-latlon-to-geohash" class="rf-btn rf-btn-primary" style="padding: 5px 12px; font-size: 0.75rem;">
                  ${state.t('btn_launch')}
                </a>
              </div>
              <p style="font-size: 0.8125rem; color: var(--color-text-secondary); line-height: 1.5; margin-bottom: 14px;">
                ${state.t('tool_latlon_to_geohash_desc')}
              </p>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <span class="rf-dropzone__format-pill">Input: Lat/Long</span>
                <span class="rf-dropzone__format-pill">Output: Geohash</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    `;
  }
}
