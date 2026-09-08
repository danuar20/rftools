/**
 * Dashboard Component
 * Displays system overview, hero stats, domain filters, and interactive 6-tool grid
 */

import { state } from '../state.js';
import { ApiService } from '../api.js';
import { toast } from './toast.js';

export class DashboardComponent {
  constructor(container) {
    this.container = container;
    this.activeFilter = 'all';
    this.searchQuery = '';
    this.render();

    state.subscribe((event) => {
      if (event === 'tools-loaded' || event === 'health-update') {
        this.renderToolGrid();
      }
    });
  }

  render() {
    this.container.innerHTML = `
      <!-- Hero Banner -->
      <section class="hero-banner">
        <h1 class="hero-title">Radio Frequency &amp; Geospatial Engineering Suite</h1>
        <p class="hero-desc">
          Unified engineering workstation designed for RF planning engineers, optimization specialists, and GIS analysts.
          High-precision 3D sector modeling, great-circle distance topology, and multi-resolution geohash transformations.
        </p>

        <div class="hero-stats">
          <div class="hero-stat-item">
            <span class="hero-stat-value">6 Engines</span>
            <span class="hero-stat-label">Mathematical Modules</span>
          </div>
          <div class="hero-stat-item">
            <span class="hero-stat-value">EPSG:4326</span>
            <span class="hero-stat-label">WGS84 Geodesic CRS</span>
          </div>
          <div class="hero-stat-item">
            <span class="hero-stat-value">Port 5005</span>
            <span class="hero-stat-label">FastAPI Backend</span>
          </div>
          <div class="hero-stat-item">
            <span class="hero-stat-value">33 / 33 Pass</span>
            <span class="hero-stat-label">Verified Algorithms</span>
          </div>
        </div>
      </section>

      <!-- Filter and Search Bar -->
      <div class="filter-bar">
        <div class="filter-pills" id="dashboard-filter-pills">
          <button class="filter-pill filter-pill--active" data-filter="all">All Tools (6)</button>
          <button class="filter-pill" data-filter="kml">KML &amp; Site Visualization</button>
          <button class="filter-pill" data-filter="topology">Network Topology &amp; ISD</button>
          <button class="filter-pill" data-filter="gis">Geospatial &amp; Geohash</button>
        </div>

        <div style="position: relative; width: 280px;">
          <input type="text" class="rf-stepper-input" id="dashboard-search-input" placeholder="Filter tools by keyword..." style="width: 100%; text-align: left; padding-left: 32px; box-sizing: border-box;">
          <span style="position: absolute; left: 10px; top: 7px; color: var(--color-text-muted);">🔍</span>
        </div>
      </div>

      <!-- Tool Cards Grid -->
      <div class="rf-card-grid" id="dashboard-tool-grid">
      </div>
    `;

    // Bind filters
    const filterPills = this.container.querySelectorAll('.filter-pill');
    filterPills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        filterPills.forEach(p => p.classList.remove('filter-pill--active'));
        pill.classList.add('filter-pill--active');
        this.activeFilter = pill.dataset.filter;
        this.renderToolGrid();
      });
    });

    // Bind search
    const searchInput = this.container.querySelector('#dashboard-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.renderToolGrid();
      });
    }

    this.renderToolGrid();
  }

  renderToolGrid() {
    const grid = this.container.querySelector('#dashboard-tool-grid');
    if (!grid) return;

    let tools = state.tools && state.tools.length > 0 ? state.tools : [
      {
        id: 'excel-to-kml',
        title: 'Excel to Point KML Placemark Converter',
        category: 'KML & Site Visualization',
        category_id: 'kml_vis',
        description: 'Converts tabular site coordinates into Google Earth placemark KML files with customizable icon scales, colors, and hierarchical folders.',
        icon: 'tool-excel-to-kml.svg',
        outputs: ['Google Earth Placemark (.kml)'],
        sample_template_id: 'point_kml'
      },
      {
        id: 'prb-kml',
        title: 'Excel to PRB KML 3D Sector Polygon Visualizer',
        category: 'KML & Site Visualization',
        category_id: 'kml_vis',
        description: 'Generates extruded 3D antenna sector polygons color-coded by busy-hour DL/UL PRB utilization, RRC connected users, and 3GPP band altitudes.',
        icon: 'tool-prb-kml.svg',
        outputs: ['3D Sector Extruded Polygon (.kml)'],
        sample_template_id: 'prb_kml'
      },
      {
        id: 'isd-calculator',
        title: 'Inter-Site Distance (ISD) Calculator',
        category: 'Network Topology & ISD',
        category_id: 'topology',
        description: 'Calculates high-precision great-circle Haversine distances between two site datasets finding N-nearest neighbor relationships.',
        icon: 'tool-isd-calculator.svg',
        outputs: ['Dual-sheet Excel (.xlsx)'],
        sample_template_id: 'isd_a'
      },
      {
        id: 'geohash-to-shp',
        title: 'Geohash to ESRI Shapefile Generator',
        category: 'Geospatial & Geohash Utilities',
        category_id: 'gis',
        description: 'Transforms geohash records into GIS vector polygon shapefile packages (.zip containing .shp, .shx, .dbf, .prj) with exact bbox or metric squares.',
        icon: 'tool-geohash-to-shp.svg',
        outputs: ['ESRI Shapefile Archive (.zip)'],
        sample_template_id: 'geohash'
      },
      {
        id: 'geohash-to-latlon',
        title: 'Geohash to Centroid Lat/Long Decoder',
        category: 'Geospatial & Geohash Utilities',
        category_id: 'gis',
        description: 'Decodes geohash string tokens into WGS84 decimal degree centroid coordinates (latitude and longitude) in Excel or CSV.',
        icon: 'tool-geohash-to-latlon.svg',
        outputs: ['Spreadsheet (.xlsx, .csv)'],
        sample_template_id: 'geohash'
      },
      {
        id: 'latlon-to-geohash',
        title: 'Lat/Long to Geohash Encoder',
        category: 'Geospatial & Geohash Utilities',
        category_id: 'gis',
        description: 'Encodes paired geographic latitude/longitude coordinates into standardized geohash string tokens with user-defined precision (1 to 12).',
        icon: 'tool-latlon-to-geohash.svg',
        outputs: ['Spreadsheet (.xlsx, .csv)'],
        sample_template_id: 'latlon'
      }
    ];

    // Filter by category
    if (this.activeFilter === 'kml') {
      tools = tools.filter(t => t.category_id === 'kml_vis' || t.id.includes('kml'));
    } else if (this.activeFilter === 'topology') {
      tools = tools.filter(t => t.category_id === 'topology' || t.id.includes('isd'));
    } else if (this.activeFilter === 'gis') {
      tools = tools.filter(t => t.category_id === 'gis' || t.id.includes('geohash') || t.id.includes('latlon'));
    }

    // Filter by search query
    if (this.searchQuery) {
      tools = tools.filter(t =>
        t.title.toLowerCase().includes(this.searchQuery) ||
        t.description.toLowerCase().includes(this.searchQuery) ||
        t.category.toLowerCase().includes(this.searchQuery)
      );
    }

    if (tools.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 48px; text-align: center; color: var(--color-text-muted);">
          <div style="font-size: 1.5rem; margin-bottom: 8px;">🔍</div>
          <div>No tools match the active filter or query "${this.searchQuery}".</div>
        </div>
      `;
      return;
    }

    grid.innerHTML = tools.map(tool => `
      <div class="rf-card-tool">
        <div class="rf-card-tool__header">
          <div class="rf-card-tool__icon">
            <img src="/assets/icons/${tool.icon}" alt="${tool.title}" style="width: 24px; height: 24px;">
          </div>
          <span class="rf-card-tool__category">${tool.category}</span>
        </div>
        <h3 class="rf-card-tool__title">${tool.title}</h3>
        <p class="rf-card-tool__desc">${tool.description}</p>
        
        <div style="display: flex; gap: 8px; margin-bottom: 16px;">
          <span class="rf-dropzone__format-pill">CRS EPSG:4326</span>
          <span class="rf-dropzone__format-pill">${tool.outputs ? tool.outputs[0] : 'Output'}</span>
        </div>

        <div class="rf-card-tool__footer">
          <a href="#tool-${tool.id}" class="rf-btn rf-btn-primary" style="padding: 6px 14px; font-size: 0.8125rem;">
            <span>Launch Tool &rarr;</span>
          </a>
          <button class="rf-btn rf-btn-ghost download-tpl-btn" data-template="${tool.sample_template_id}" style="padding: 4px 8px; font-size: 0.75rem;">
            <span>📥 Template</span>
          </button>
        </div>
      </div>
    `).join('');

    // Attach sample template download handlers
    const dlBtns = grid.querySelectorAll('.download-tpl-btn');
    dlBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const templateId = btn.dataset.template;
        try {
          btn.disabled = true;
          toast.info(`Downloading sample template for ${templateId}...`);
          const fn = await ApiService.downloadTemplate(templateId);
          toast.success(`Saved ${fn}`);
        } catch (err) {
          toast.error(`Failed to download template: ${err.message}`);
        } finally {
          btn.disabled = false;
        }
      });
    });
  }
}
