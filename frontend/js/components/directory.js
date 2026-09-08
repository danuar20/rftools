/**
 * Tools Directory & Specifications Component
 */

import { state } from '../state.js';
import { ApiService } from '../api.js';
import { toast } from './toast.js';

export class DirectoryComponent {
  constructor(container) {
    this.container = container;
    this.render();

    state.subscribe((event) => {
      if (event === 'tools-loaded') {
        this.render();
      }
    });
  }

  render() {
    this.container.innerHTML = `
      <div style="max-width: 1400px; margin: 0 auto;">
        <!-- Header -->
        <div style="margin-bottom: 32px;">
          <h1 style="font-size: 1.875rem; font-weight: 700; color: var(--color-text-primary); margin: 0 0 8px 0;">
            Engineering Tools Directory
          </h1>
          <p style="font-size: 0.9375rem; color: var(--color-text-secondary); margin: 0; max-width: 800px;">
            Exhaustive catalog of specialized telecom radio frequency and geospatial calculation utilities.
            All engines run in local isolated Python environments, preserving 100% calculation fidelity.
          </p>
        </div>

        <!-- Section 1: KML & Site Visualization -->
        <section style="margin-bottom: 48px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; border-bottom: 1px solid var(--color-border-default); padding-bottom: 8px;">
            <span style="font-size: 1.25rem;">📡</span>
            <h2 style="font-size: 1.25rem; font-weight: 600; color: var(--color-text-primary); margin: 0;">
              Domain A: KML &amp; Site Visualization
            </h2>
            <span class="rf-confidence-pill rf-confidence-pill--high">2 Engines</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 20px;">
            <!-- Tool 1 -->
            <div class="component-box" style="margin-bottom: 0;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div style="display: flex; gap: 12px; align-items: center;">
                  <div class="workspace-icon-box" style="width: 40px; height: 40px;">
                    <img src="/assets/icons/tool-excel-to-kml.svg" alt="Point KML">
                  </div>
                  <div>
                    <h3 style="font-size: 1.1rem; font-weight: 600; margin: 0; color: var(--color-text-primary);">Excel &rarr; Point KML</h3>
                    <span style="font-size: 0.75rem; color: var(--color-primary); font-family: 'JetBrains Mono', monospace;">excel_to_kml.py</span>
                  </div>
                </div>
                <a href="#tool-excel-to-kml" class="rf-btn rf-btn-primary" style="padding: 4px 12px; font-size: 0.75rem;">Launch</a>
              </div>
              <p style="font-size: 0.8125rem; color: var(--color-text-secondary); line-height: 1.5; margin-bottom: 16px;">
                Transforms tabular coordinate sheets into Google Earth placemark files. Features heuristic header detection, custom RGB icon tinting, scale factor overrides, and hierarchical KML folder grouping.
              </p>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <span class="rf-dropzone__format-pill">Input: .xlsx, .xls</span>
                <span class="rf-dropzone__format-pill">Output: .kml Placemark</span>
                <span class="rf-dropzone__format-pill">Formula: WGS84 Point</span>
              </div>
            </div>

            <!-- Tool 2 -->
            <div class="component-box" style="margin-bottom: 0;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div style="display: flex; gap: 12px; align-items: center;">
                  <div class="workspace-icon-box" style="width: 40px; height: 40px;">
                    <img src="/assets/icons/tool-prb-kml.svg" alt="PRB KML">
                  </div>
                  <div>
                    <h3 style="font-size: 1.1rem; font-weight: 600; margin: 0; color: var(--color-text-primary);">Excel &rarr; PRB 3D Sector</h3>
                    <span style="font-size: 0.75rem; color: var(--color-primary); font-family: 'JetBrains Mono', monospace;">prb_kml.py</span>
                  </div>
                </div>
                <a href="#tool-prb-kml" class="rf-btn rf-btn-primary" style="padding: 4px 12px; font-size: 0.75rem;">Launch</a>
              </div>
              <p style="font-size: 0.8125rem; color: var(--color-text-secondary); line-height: 1.5; margin-bottom: 16px;">
                Models closed 3D antenna sector polygons using forward spherical geodesics. Enforces 3GPP LTE band altitudes (LTE700 30m up to LTE2300 54m) to prevent overlapping layers, with 6-tier PRB load coloring and rich HTML popups.
              </p>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <span class="rf-dropzone__format-pill">Input: .xlsx (Sheet1)</span>
                <span class="rf-dropzone__format-pill">Output: .kml 3D Polygon</span>
                <span class="rf-dropzone__format-pill">Formula: Spherical Geodesic</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Section 2: Network Topology & ISD -->
        <section style="margin-bottom: 48px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; border-bottom: 1px solid var(--color-border-default); padding-bottom: 8px;">
            <span style="font-size: 1.25rem;">📐</span>
            <h2 style="font-size: 1.25rem; font-weight: 600; color: var(--color-text-primary); margin: 0;">
              Domain B: Network Topology &amp; ISD
            </h2>
            <span class="rf-confidence-pill rf-confidence-pill--high">1 Engine</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr; gap: 20px;">
            <!-- Tool 3 -->
            <div class="component-box" style="margin-bottom: 0;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div style="display: flex; gap: 12px; align-items: center;">
                  <div class="workspace-icon-box" style="width: 40px; height: 40px;">
                    <img src="/assets/icons/tool-isd-calculator.svg" alt="ISD">
                  </div>
                  <div>
                    <h3 style="font-size: 1.1rem; font-weight: 600; margin: 0; color: var(--color-text-primary);">Inter-Site Distance (ISD) Calculator</h3>
                    <span style="font-size: 0.75rem; color: var(--color-primary); font-family: 'JetBrains Mono', monospace;">isd_calculator.py</span>
                  </div>
                </div>
                <a href="#tool-isd-calculator" class="rf-btn rf-btn-primary" style="padding: 4px 12px; font-size: 0.75rem;">Launch</a>
              </div>
              <p style="font-size: 0.8125rem; color: var(--color-text-secondary); line-height: 1.5; margin-bottom: 16px;">
                Computes pairwise geodesic Haversine distance matrix between two independent site workbooks (File A Source to File B Target). Extracts N-nearest neighbors (1 to 5) and produces dual-sheet Excel outputs with distance rankings and statistical distributions.
              </p>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <span class="rf-dropzone__format-pill">Input: Dual .xlsx (File A &amp; B)</span>
                <span class="rf-dropzone__format-pill">Output: Dual-Sheet .xlsx</span>
                <span class="rf-dropzone__format-pill">Formula: Haversine (R=6371.0088 km)</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Section 3: Geospatial & Geohash Utilities -->
        <section style="margin-bottom: 48px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; border-bottom: 1px solid var(--color-border-default); padding-bottom: 8px;">
            <span style="font-size: 1.25rem;">🌐</span>
            <h2 style="font-size: 1.25rem; font-weight: 600; color: var(--color-text-primary); margin: 0;">
              Domain C: Geospatial &amp; Geohash Utilities
            </h2>
            <span class="rf-confidence-pill rf-confidence-pill--high">3 Engines</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 20px;">
            <!-- Tool 4 -->
            <div class="component-box" style="margin-bottom: 0;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div style="display: flex; gap: 12px; align-items: center;">
                  <div class="workspace-icon-box" style="width: 40px; height: 40px;">
                    <img src="/assets/icons/tool-geohash-to-shp.svg" alt="Geohash to SHP">
                  </div>
                  <div>
                    <h3 style="font-size: 1.05rem; font-weight: 600; margin: 0; color: var(--color-text-primary);">Geohash &rarr; Shapefile</h3>
                    <span style="font-size: 0.75rem; color: var(--color-primary); font-family: 'JetBrains Mono', monospace;">geohash_to_shp.py</span>
                  </div>
                </div>
                <a href="#tool-geohash-to-shp" class="rf-btn rf-btn-primary" style="padding: 4px 12px; font-size: 0.75rem;">Launch</a>
              </div>
              <p style="font-size: 0.8125rem; color: var(--color-text-secondary); line-height: 1.5; margin-bottom: 16px;">
                Generates ESRI polygon layer shapefiles with ESRI DBF 10-character field truncation and automatic collision resolution. Supports default WGS84 bounding boxes or local metric UTM squares.
              </p>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <span class="rf-dropzone__format-pill">Input: .xlsx, .csv</span>
                <span class="rf-dropzone__format-pill">Output: .zip (.shp, .shx, .dbf, .prj)</span>
              </div>
            </div>

            <!-- Tool 5 -->
            <div class="component-box" style="margin-bottom: 0;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div style="display: flex; gap: 12px; align-items: center;">
                  <div class="workspace-icon-box" style="width: 40px; height: 40px;">
                    <img src="/assets/icons/tool-geohash-to-latlon.svg" alt="Decoder">
                  </div>
                  <div>
                    <h3 style="font-size: 1.05rem; font-weight: 600; margin: 0; color: var(--color-text-primary);">Geohash &rarr; Lat / Long</h3>
                    <span style="font-size: 0.75rem; color: var(--color-primary); font-family: 'JetBrains Mono', monospace;">geohash_to_latlon.py</span>
                  </div>
                </div>
                <a href="#tool-geohash-to-latlon" class="rf-btn rf-btn-primary" style="padding: 4px 12px; font-size: 0.75rem;">Launch</a>
              </div>
              <p style="font-size: 0.8125rem; color: var(--color-text-secondary); line-height: 1.5; margin-bottom: 16px;">
                Decodes alphanumeric base-32 geohashes into decimal degree centroid coordinates (WGS84 EPSG:4326), appending clean floating point latitude and longitude columns.
              </p>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <span class="rf-dropzone__format-pill">Input: .xlsx, .csv</span>
                <span class="rf-dropzone__format-pill">Output: .xlsx / .csv</span>
              </div>
            </div>

            <!-- Tool 6 -->
            <div class="component-box" style="margin-bottom: 0;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div style="display: flex; gap: 12px; align-items: center;">
                  <div class="workspace-icon-box" style="width: 40px; height: 40px;">
                    <img src="/assets/icons/tool-latlon-to-geohash.svg" alt="Encoder">
                  </div>
                  <div>
                    <h3 style="font-size: 1.05rem; font-weight: 600; margin: 0; color: var(--color-text-primary);">Lat / Long &rarr; Geohash</h3>
                    <span style="font-size: 0.75rem; color: var(--color-primary); font-family: 'JetBrains Mono', monospace;">latlon_to_geohash.py</span>
                  </div>
                </div>
                <a href="#tool-latlon-to-geohash" class="rf-btn rf-btn-primary" style="padding: 4px 12px; font-size: 0.75rem;">Launch</a>
              </div>
              <p style="font-size: 0.8125rem; color: var(--color-text-secondary); line-height: 1.5; margin-bottom: 16px;">
                Encodes paired coordinate columns into geohash grid identifiers. Allows precision adjustments from 1 to 12 characters (regional down to sub-meter cell dimensions).
              </p>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <span class="rf-dropzone__format-pill">Input: .xlsx, .csv</span>
                <span class="rf-dropzone__format-pill">Output: .xlsx / .csv</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    `;
  }
}
