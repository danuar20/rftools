/**
 * Engineering Documentation Component
 * Features tabbed viewer for Formulae, Color Thresholds, Schema Specs, and Developer Guide
 */

export class DocsComponent {
  constructor(container) {
    this.container = container;
    this.activeTab = 'overview';
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div style="max-width: 1200px; margin: 0 auto;">
        <!-- Header -->
        <div style="margin-bottom: 28px;">
          <h1 style="font-size: 1.875rem; font-weight: 700; color: var(--color-text-primary); margin: 0 0 8px 0;">
            Engineering Documentation &amp; Calculation Standards
          </h1>
          <p style="font-size: 0.9375rem; color: var(--color-text-secondary); margin: 0;">
            Mathematical formulae, 3GPP telecommunications standards, spatial indexing theorems, and schema specifications governing the RF TOOLS calculation suite.
          </p>
        </div>

        <!-- Navigation Tabs -->
        <div class="tab-nav" id="docs-tab-nav">
          <button class="tab-btn ${this.activeTab === 'overview' ? 'tab-btn--active' : ''}" data-tab="overview">
            1. System Overview &amp; Geodesy
          </button>
          <button class="tab-btn ${this.activeTab === 'formulae' ? 'tab-btn--active' : ''}" data-tab="formulae">
            2. Mathematical Formulae
          </button>
          <button class="tab-btn ${this.activeTab === 'thresholds' ? 'tab-btn--active' : ''}" data-tab="thresholds">
            3. PRB &amp; RRC KPI Matrix
          </button>
          <button class="tab-btn ${this.activeTab === 'schemas' ? 'tab-btn--active' : ''}" data-tab="schemas">
            4. Schema Specifications
          </button>
          <button class="tab-btn ${this.activeTab === 'devguide' ? 'tab-btn--active' : ''}" data-tab="devguide">
            5. Developer Engine Guide
          </button>
        </div>

        <!-- Tab Content -->
        <div id="docs-tab-content">
          ${this.renderTabContent()}
        </div>
      </div>
    `;

    const tabBtns = this.container.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('tab-btn--active'));
        btn.classList.add('tab-btn--active');
        this.activeTab = btn.dataset.tab;
        const content = this.container.querySelector('#docs-tab-content');
        if (content) content.innerHTML = this.renderTabContent();
      });
    });
  }

  renderTabContent() {
    switch (this.activeTab) {
      case 'overview':
        return `
          <div class="guide-card">
            <h3>Geodetic Reference Frame &amp; Coordinate System (CRS)</h3>
            <p>
              All calculation engines throughout the RF TOOLS suite operate strictly in the <b>World Geodetic System 1984 (WGS84, EPSG:4326)</b> coordinate reference system.
            </p>
            <div class="formula-box">
              Datum: WGS84 (EPSG:4326)<br>
              Latitude Bounds: [-90.000000&deg;, +90.000000&deg;] (South to North)<br>
              Longitude Bounds: [-180.000000&deg;, +180.000000&deg;] (West to East)<br>
              Standard Output Precision: 6 decimal places (~0.11 meter resolution at equator)
            </div>
            <p>
              Coordinate data ingested via Excel (.xlsx, .xls) or CSV is checked for valid boundary limits. Out-of-range latitude values (> 90 or < -90) or swapped coordinate pairs (where latitude exceeds 90 but longitude is within range) are caught by the ingestion validator without failing the entire batch.
            </p>
          </div>
        `;

      case 'formulae':
        return `
          <div class="guide-card">
            <h3>1. Haversine Great-Circle Distance Algorithm</h3>
            <p>
              Used in the <b>Inter-Site Distance (ISD) Calculator</b> to compute accurate spherical distances between two coordinate points on Earth without Cartesian planar distortion.
            </p>
            <div class="formula-box">
              &Delta;lat = rad(lat_2) - rad(lat_1)<br>
              &Delta;lon = rad(lon_2) - rad(lon_1)<br>
              a = sin&sup2;(&Delta;lat / 2) + cos(rad(lat_1)) &bull; cos(rad(lat_2)) &bull; sin&sup2;(&Delta;lon / 2)<br>
              c = 2 &bull; atan2(&radic;a, &radic;(1 - a))<br>
              d = R &bull; c<br>
              <br>
              Earth Mean Volumetric Radius R = 6371.0088 km (IUGG standard)
            </div>
          </div>

          <div class="guide-card">
            <h3>2. Forward Spherical Geodesic Projection</h3>
            <p>
              Used in the <b>PRB KML 3D Sector Visualizer</b> to construct 5 sector arc points projecting from an antenna tower origin along its azimuth heading.
            </p>
            <div class="formula-box">
              angular_distance = d_km / 6371.000 km<br>
              lat_target = asin( sin(lat_origin)*cos(d) + cos(lat_origin)*sin(d)*cos(azimuth) )<br>
              lon_target = lon_origin + atan2( sin(azimuth)*sin(d)*cos(lat_origin), cos(d) - sin(lat_origin)*sin(lat_target) )
            </div>
            <p>
              The sector boundary is formed by 7 vertices: tower origin (lat, lon, alt) &rarr; arc point 1 (&theta; - BW/2) &rarr; arc point 2 (&theta; - BW/4) &rarr; arc point 3 (&theta; center) &rarr; arc point 4 (&theta; + BW/4) &rarr; arc point 5 (&theta; + BW/2) &rarr; closing back to tower origin.
            </p>
          </div>

          <div class="guide-card">
            <h3>3. Geohash Base-32 Spatial Interleaving</h3>
            <p>
              Geohash partitions two-dimensional space into hierarchical hierarchical bounding boxes using Morton Z-order space-filling curves and standard 32-symbol base-32 encoding.
            </p>
            <div class="formula-box">
              Alphabet: 0123456789bcdefghjkmnpqrstuvwxyz (omits characters 'a', 'i', 'l', 'o' to avoid confusion)<br>
              Odd bit positions = Longitude interval bisections [-180, 180]<br>
              Even bit positions = Latitude interval bisections [-90, 90]
            </div>
          </div>
        `;

      case 'thresholds':
        return `
          <div class="guide-card">
            <h3>3GPP Telecom Traffic Load &amp; Congestion Thresholds</h3>
            <p>
              In cellular telecommunications planning, Physical Resource Block (PRB) utilization during the Busy Day Busy Hour (BDBH) serves as the primary KPI determining sector congestion and expansion requirements.
            </p>
            <table class="rf-band-table" style="margin-top: 16px;">
              <thead>
                <tr>
                  <th>Traffic State</th>
                  <th>DL / UL PRB Utilization</th>
                  <th>RRC Connected Users</th>
                  <th>Hex Color Token</th>
                  <th>Visual Indicator</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><b>Inactive / Zero</b></td>
                  <td>PRB = 0.0%</td>
                  <td>RRC = 0</td>
                  <td class="rf-mono">#BFBFBF</td>
                  <td><span class="rf-kpi-chip rf-kpi-chip--gray"><span class="rf-kpi-chip__dot"></span>Inactive</span></td>
                </tr>
                <tr>
                  <td><b>Low Utilization</b></td>
                  <td>0% &lt; PRB &le; 35%</td>
                  <td>RRC &le; 40</td>
                  <td class="rf-mono">#3B82F6</td>
                  <td><span class="rf-kpi-chip rf-kpi-chip--blue"><span class="rf-kpi-chip__dot"></span>Low Load</span></td>
                </tr>
                <tr>
                  <td><b>Normal / Optimal</b></td>
                  <td>35% &lt; PRB &le; 60%</td>
                  <td>40 &lt; RRC &le; 60</td>
                  <td class="rf-mono">#22C55E</td>
                  <td><span class="rf-kpi-chip rf-kpi-chip--green"><span class="rf-kpi-chip__dot"></span>Normal</span></td>
                </tr>
                <tr>
                  <td><b>Medium / Warning</b></td>
                  <td>60% &lt; PRB &le; 75%</td>
                  <td>60 &lt; RRC &le; 90</td>
                  <td class="rf-mono">#EAB308</td>
                  <td><span class="rf-kpi-chip rf-kpi-chip--yellow"><span class="rf-kpi-chip__dot"></span>Medium</span></td>
                </tr>
                <tr>
                  <td><b>High Load</b></td>
                  <td>75% &lt; PRB &le; 90%</td>
                  <td>90 &lt; RRC &le; 120</td>
                  <td class="rf-mono">#F59E0B</td>
                  <td><span class="rf-kpi-chip rf-kpi-chip--amber"><span class="rf-kpi-chip__dot"></span>High Load</span></td>
                </tr>
                <tr>
                  <td><b>Congested / Critical</b></td>
                  <td>PRB &gt; 90%</td>
                  <td>RRC &gt; 120</td>
                  <td class="rf-mono">#EF4444</td>
                  <td><span class="rf-kpi-chip rf-kpi-chip--red"><span class="rf-kpi-chip__dot"></span>Congested</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        `;

      case 'schemas':
        return `
          <div class="guide-card">
            <h3>Input Column Contracts by Engine</h3>
            <p>Every tool supports automatic heuristic detection for typical carrier column naming conventions:</p>
            <ul>
              <li><b>Excel &rarr; Point KML:</b> Requires <code>LAT</code>, <code>LONG</code>, optional <code>Site</code> or <code>SITENAME</code></li>
              <li><b>Excel &rarr; PRB 3D Sector:</b> Requires <code>LAT</code>, <code>LONG</code>, <code>BEAM</code>, <code>DIRECTION</code>, optional <code>DL PRB BDBH</code>, <code>UL PRB BDBH</code>, <code>RRC User BDBH</code>, <code>PCI</code>, <code>TOWER_HEIGHT</code></li>
              <li><b>ISD Calculator:</b> File A (<code>SITE_ID</code>, <code>LAT</code>, <code>LONG</code>), File B (<code>SITE_ID</code>, <code>LAT</code>, <code>LONG</code>)</li>
              <li><b>Geohash &rarr; Shapefile:</b> Column containing valid base-32 string tokens</li>
              <li><b>Geohash &rarr; Lat/Long:</b> Column containing valid base-32 string tokens</li>
              <li><b>Lat/Long &rarr; Geohash:</b> Paired latitude and longitude numeric columns</li>
            </ul>
          </div>
        `;

      case 'devguide':
        return `
          <div class="guide-card">
            <h3>Adding New Calculation Engines to RF TOOLS</h3>
            <p>Follow this 4-step architectural pattern to introduce new RF calculation utilities:</p>
            <ol style="line-height: 1.8;">
              <li><b>Create Pure Logic Module:</b> Add <code>backend/tools/your_tool.py</code> decoupled from FastAPI web code. Accepts bytes or DataFrame and returns bytes + summary dict.</li>
              <li><b>Add Unit &amp; Integration Tests:</b> Add test cases in <code>tests/test_your_tool.py</code> verifying formula precision and boundary handling.</li>
              <li><b>Register API Route:</b> Expose endpoint in <code>backend/api/v1/tools.py</code> with <code>preview: bool = Query(False)</code> query support.</li>
              <li><b>Add Workspace UI:</b> Add tool entry in <code>frontend/js/components/workspace.js</code> defining mapping fields, parameters, and preview table headers.</li>
            </ol>
          </div>
        `;
    }
  }
}
