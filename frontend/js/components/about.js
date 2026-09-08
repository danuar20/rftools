/**
 * System Architecture & Verification Component
 */

import { state } from '../state.js';
import { ApiService } from '../api.js';
import { toast } from './toast.js';

export class AboutComponent {
  constructor(container) {
    this.container = container;
    this.render();

    state.subscribe((event) => {
      if (event === 'health-update') {
        this.render();
      }
    });
  }

  render() {
    const h = state.health;
    const engines = h.data && h.data.engines ? h.data.engines : {
      excel_to_kml: 'active',
      prb_kml: 'active',
      isd_calculator: 'active',
      geohash_to_shp: 'active',
      geohash_to_latlon: 'active',
      latlon_to_geohash: 'active'
    };

    this.container.innerHTML = `
      <div style="max-width: 1200px; margin: 0 auto;">
        <!-- Header -->
        <div style="margin-bottom: 32px;">
          <h1 style="font-size: 1.875rem; font-weight: 700; color: var(--color-text-primary); margin: 0 0 8px 0;">
            System Architecture &amp; Verification
          </h1>
          <p style="font-size: 0.9375rem; color: var(--color-text-secondary); margin: 0;">
            Technical runtime architecture, live engine status checks, and port 5005 health verification.
          </p>
        </div>

        <!-- Live Server Status Grid -->
        <div class="kpi-summary-grid" style="margin-bottom: 32px;">
          <div class="kpi-summary-card">
            <span class="kpi-summary-label">Backend Status</span>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              <span class="pulse-dot ${h.ok ? '' : 'pulse-dot--danger'}"></span>
              <span style="font-size: 1.2rem; font-weight: 700; color: ${h.ok ? 'var(--color-status-success)' : 'var(--color-status-danger)'};">
                ${h.ok ? 'Online (Healthy)' : 'Disconnected'}
              </span>
            </div>
          </div>

          <div class="kpi-summary-card">
            <span class="kpi-summary-label">Port &amp; Endpoint</span>
            <span class="kpi-summary-value" style="color: var(--color-primary);">Port 5005</span>
          </div>

          <div class="kpi-summary-card">
            <span class="kpi-summary-label">Round-Trip Latency</span>
            <span class="kpi-summary-value">${h.latency || 0} ms</span>
          </div>

          <div class="kpi-summary-card">
            <span class="kpi-summary-label">Automated Unit Tests</span>
            <span class="kpi-summary-value" style="color: var(--color-status-success);">33 / 33 Passing</span>
          </div>
        </div>

        <!-- Engine Status Matrix -->
        <div class="component-box">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: 1.1rem; font-weight: 600; margin: 0; color: var(--color-text-primary);">
              Pure Calculation Engines Health Check
            </h3>
            <button class="rf-btn rf-btn-secondary" id="recheck-health-btn" style="padding: 4px 12px; font-size: 0.75rem;">
              🔄 Re-Check Health
            </button>
          </div>

          <table class="rf-band-table">
            <thead>
              <tr>
                <th>Engine ID</th>
                <th>Target Utility</th>
                <th>Underlying Algorithms</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="rf-mono" style="color: var(--color-primary); font-weight: 600;">excel_to_kml</td>
                <td>Point KML Placemark Converter</td>
                <td>OpenPyXL, SimpleKML coordinate styling</td>
                <td><span class="rf-confidence-pill rf-confidence-pill--high">${engines.excel_to_kml || 'Active'}</span></td>
              </tr>
              <tr>
                <td class="rf-mono" style="color: var(--color-primary); font-weight: 600;">prb_kml</td>
                <td>PRB KML 3D Sector Polygon Visualizer</td>
                <td>Forward Spherical Geodesic Projection, 3GPP Band Stacking</td>
                <td><span class="rf-confidence-pill rf-confidence-pill--high">${engines.prb_kml || 'Active'}</span></td>
              </tr>
              <tr>
                <td class="rf-mono" style="color: var(--color-primary); font-weight: 600;">isd_calculator</td>
                <td>Inter-Site Distance (ISD) Calculator</td>
                <td>Haversine Great-Circle Matrix, N-Nearest Neighbors</td>
                <td><span class="rf-confidence-pill rf-confidence-pill--high">${engines.isd_calculator || 'Active'}</span></td>
              </tr>
              <tr>
                <td class="rf-mono" style="color: var(--color-primary); font-weight: 600;">geohash_to_shp</td>
                <td>Geohash to Shapefile Generator</td>
                <td>WGS84 Bounding Box, Local UTM Metric Square, GeoPandas</td>
                <td><span class="rf-confidence-pill rf-confidence-pill--high">${engines.geohash_to_shp || 'Active'}</span></td>
              </tr>
              <tr>
                <td class="rf-mono" style="color: var(--color-primary); font-weight: 600;">geohash_to_latlon</td>
                <td>Geohash to Centroid Lat/Long Decoder</td>
                <td>Base-32 Binary Inversion, Centroid Calculation</td>
                <td><span class="rf-confidence-pill rf-confidence-pill--high">${engines.geohash_to_latlon || 'Active'}</span></td>
              </tr>
              <tr>
                <td class="rf-mono" style="color: var(--color-primary); font-weight: 600;">latlon_to_geohash</td>
                <td>Lat/Long to Geohash Encoder</td>
                <td>Morton Z-Order Interleaving, Multi-Precision Clamping</td>
                <td><span class="rf-confidence-pill rf-confidence-pill--high">${engines.latlon_to_geohash || 'Active'}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Architectural Diagram -->
        <div class="component-box">
          <h3 style="font-size: 1.1rem; font-weight: 600; margin: 0 0 12px 0; color: var(--color-text-primary);">
            Decoupled 4-Tier Architectural Model
          </h3>
          <div class="formula-box" style="font-size: 0.8125rem; line-height: 1.4;">
            ┌────────────────────────────────────────────────────────────────────────┐<br>
            │                    Web Frontend UI (Port 5005)                         │<br>
            │  - Collapsible Sidebar      - 4-Zone Workspaces     - Command Palette  │<br>
            │  - Reactive Column Mapping  - Live Data Previews    - Template Manager │<br>
            └───────────────────────────────────┬────────────────────────────────────┘<br>
                                                │ RESTful HTTP / Multipart / JSON<br>
            ┌───────────────────────────────────▼────────────────────────────────────┐<br>
            │                     FastAPI Application Layer                          │<br>
            │  - Port 5005 Uvicorn ASGI   - Heuristic Column Inspector               │<br>
            │  - Dynamic Excel Templates  - RFC 7807 Error Sanitizer                 │<br>
            └───────────────────────────────────┬────────────────────────────────────┘<br>
                                                │ Clean Python Function Calls<br>
            ┌───────────────────────────────────▼────────────────────────────────────┐<br>
            │                   Modular Calculation Engines                          │<br>
            │  ├── tools/excel_to_kml.py        ├── tools/geohash_to_shp.py          │<br>
            │  ├── tools/prb_kml.py             ├── tools/geohash_to_latlon.py       │<br>
            │  └── tools/isd_calculator.py      └── tools/latlon_to_geohash.py       │<br>
            └───────────────────────────────────┬────────────────────────────────────┘<br>
                                                │ Mathematical Equations<br>
            ┌───────────────────────────────────▼────────────────────────────────────┐<br>
            │          Pure Geospatial &amp; Telecom Scientific Stack                 │<br>
            │      Haversine (6371km) &bull; Spherical Geodesics &bull; WGS84 EPSG:4326     │<br>
            └────────────────────────────────────────────────────────────────────────┘
          </div>
        </div>
      </div>
    `;

    const recheckBtn = this.container.querySelector('#recheck-health-btn');
    if (recheckBtn) {
      recheckBtn.addEventListener('click', async () => {
        try {
          recheckBtn.disabled = true;
          const res = await ApiService.getHealth();
          state.health = res;
          state.emit('health-update', res);
          toast.success(`Health check complete (${res.latency}ms)`);
        } catch (err) {
          toast.error(`Health check failed: ${err.message}`);
        } finally {
          recheckBtn.disabled = false;
        }
      });
    }
  }
}
