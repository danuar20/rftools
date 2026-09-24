/**
 * Dashboard Component
 * Features: Interactive showcase slideshow displaying sample output visuals for each tool,
 * domain category filters, and quick tool launcher cards.
 */

import { state } from '../state.js';
import { ApiService } from '../api.js';

export class DashboardComponent {
  constructor(container) {
    this.container = container;
    this.activeFilter = 'all';
    this.searchQuery = '';
    this.currentSlide = typeof state.dashboardSlide === 'number' ? state.dashboardSlide : 0;
    this.slideshowTimer = null;

    this.render();

    this.unsubscribe = state.subscribe((event) => {
      if (state.route && state.route !== 'dashboard') return;
      if (event === 'tools-loaded' || event === 'language-change' || event === 'theme-change') {
        this.render();
      }
    });
  }

  destroy() {
    this.stopAutoplay();
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  getSlides() {
    const isId = state.lang === 'id';
    return [
      {
        id: 'prb-kml',
        route: '#tool-prb-kml',
        tag: isId ? 'VISUALISASI 3D & TRAFIK SEL' : '3D SECTOR & TRAFFIC VISUALIZATION',
        title: isId ? 'Excel → Sektor PRB 3D' : 'Excel → PRB 3D Sector Engine',
        desc: isId
          ? 'Ekstrusi poligon 3D sektor antena seluler berdasarkan frekuensi carrier, gradasi warna PRB KPI, logo ganda (Telkominfra & PUMA / RF Tools), dan tabel balon 24 baris telemetri.'
          : 'Extrudes 3D antenna radiation sectors stacked by carrier band altitude, PRB KPI threshold heatmaps, dual header logos (Telkominfra & PUMA / RF Tools), and 24-row telemetry balloon popup.',
        specs: ['KML 2.2', '3D Extrusion', 'Dual Logos', '24-Row Balloon Table'],
        visual: `
          <svg viewBox="0 0 420 230" width="100%" height="230" xmlns="http://www.w3.org/2000/svg" class="diagram-canvas">
            <defs>
              <linearGradient id="secBlue" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#0284C7" stop-opacity="0.85"/>
                <stop offset="100%" stop-color="#0369A1" stop-opacity="0.45"/>
              </linearGradient>
              <linearGradient id="secRed" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#EF4444" stop-opacity="0.9"/>
                <stop offset="100%" stop-color="#B91C1C" stop-opacity="0.55"/>
              </linearGradient>
              <linearGradient id="secGreen" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#10B981" stop-opacity="0.85"/>
                <stop offset="100%" stop-color="#047857" stop-opacity="0.45"/>
              </linearGradient>
            </defs>

            <!-- Coordinate / Radar Azimuth Range Rings -->
            <circle cx="125" cy="180" r="140" fill="none" class="diagram-grid" stroke-dasharray="3 3"/>
            <circle cx="125" cy="180" r="95" fill="none" class="diagram-grid" stroke-dasharray="3 3"/>
            <circle cx="125" cy="180" r="50" fill="none" class="diagram-grid" stroke-dasharray="3 3"/>
            
            <!-- Azimuth Radial Guides -->
            <line x1="125" y1="180" x2="125" y2="35" class="diagram-grid" stroke-dasharray="2 2"/>
            <line x1="125" y1="180" x2="230" y2="75" class="diagram-grid" stroke-dasharray="2 2"/>
            <text x="128" y="48" class="diagram-text-muted" font-size="8">0° (N)</text>
            <text x="215" y="88" class="diagram-text-muted" font-size="8">150° (Beam)</text>

            <!-- 3D Stacked Carrier Sectors -->
            <!-- Band 2100 (Blue - L2100) -->
            <path d="M 125 180 L 185 65 A 135 135 0 0 1 250 125 Z" fill="url(#secBlue)" stroke="#0284C7" stroke-width="1.5"/>
            <!-- Band 1800 (Red - L1800 Critical PRB) -->
            <path d="M 125 180 L 170 95 A 95 95 0 0 1 215 140 Z" fill="url(#secRed)" stroke="#EF4444" stroke-width="1.5"/>
            <!-- Band 900 (Green - L900 Normal) -->
            <path d="M 125 180 L 150 130 A 55 55 0 0 1 175 155 Z" fill="url(#secGreen)" stroke="#10B981" stroke-width="1.5"/>

            <!-- Sector Altitude Extrusion Guides -->
            <line x1="125" y1="180" x2="125" y2="192" stroke="#0284C7" stroke-width="1.8" stroke-linecap="round"/>
            <line x1="185" y1="65" x2="185" y2="72" stroke="#0284C7" stroke-width="1.2" stroke-linecap="round"/>

            <!-- Site Origin Node -->
            <circle cx="125" cy="180" r="5" fill="#0284C7"/>
            <circle cx="125" cy="180" r="10" fill="none" stroke="#0284C7" stroke-width="1.5" opacity="0.6"/>
            <text x="100" y="206" class="diagram-text-title" font-size="9" font-weight="600" font-family="monospace">Site Origin</text>
            <text x="96" y="217" class="diagram-text-muted" font-size="7.5">Parbulu_01</text>

            <!-- Google Earth Balloon Telemetry Card -->
            <g transform="translate(252, 16)">
              <rect width="154" height="198" rx="6" class="diagram-panel" filter="drop-shadow(0 2px 8px rgba(0,0,0,0.12))"/>

              <!-- Dual Logos Header Simulation -->
              <rect x="7" y="7" width="67" height="22" rx="3" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
              <text x="12" y="21" fill="#DC2626" font-size="8" font-weight="bold" font-family="sans-serif">TelkomInfra</text>

              <rect x="79" y="7" width="68" height="22" rx="3" fill="#0F172A"/>
              <text x="88" y="21" fill="#38BDF8" font-size="8.5" font-weight="800" font-family="sans-serif">PUMA / RF</text>

              <!-- Telemetry Header Line -->
              <line x1="7" y1="35" x2="147" y2="35" class="diagram-divider"/>

              <text x="9" y="47" class="diagram-text-title" font-size="7.5" font-family="monospace">WEEK: 06</text>
              <text x="65" y="47" class="diagram-text-title" font-size="7.5" font-family="monospace">SITE: Parbulu</text>
              <text x="9" y="59" class="diagram-text-body" font-size="7.5" font-family="monospace">CARRIER: LTE1800 (FDD)</text>

              <!-- KPI Threshold Status Chips -->
              <rect x="7" y="65" width="140" height="16" fill="#DC2626" rx="3"/>
              <text x="12" y="77" fill="#FFFFFF" font-size="8" font-weight="bold" font-family="sans-serif">DL PRB: 91.9% (Critical)</text>

              <rect x="7" y="85" width="140" height="16" fill="#2563EB" rx="3"/>
              <text x="12" y="97" fill="#FFFFFF" font-size="8" font-weight="bold" font-family="sans-serif">UL PRB: 16.5% (Normal)</text>

              <rect x="7" y="105" width="140" height="16" fill="#16A34A" rx="3"/>
              <text x="12" y="117" fill="#FFFFFF" font-size="8" font-weight="bold" font-family="sans-serif">RRC Connected: 44.71</text>

              <!-- Radio Metrics Details -->
              <text x="9" y="134" class="diagram-text-body" font-size="7.5" font-family="monospace">PAYLOAD: 6.68 GB</text>
              <text x="9" y="146" class="diagram-text-body" font-size="7.5" font-family="monospace">AZIMUTH: 150° | TILT: 4°</text>
              <text x="9" y="158" class="diagram-text-body" font-size="7.5" font-family="monospace">PCI: 166 | EARFCN: 1750</text>
              <text x="9" y="170" class="diagram-text-body" font-size="7.5" font-family="monospace">ALTITUDE: 42.0m AGL</text>

              <!-- Card Footer -->
              <line x1="7" y1="178" x2="147" y2="178" class="diagram-divider"/>
              <text x="14" y="190" class="diagram-text-muted" font-size="6.5">© 2025 TelkomInfra • RF 3D</text>
            </g>
          </svg>
        `
      },
      {
        id: 'excel-to-kml',
        route: '#tool-excel-to-kml',
        tag: isId ? 'PEMETAAN KML PLACEMARK' : 'POINT KML PLACEMARK ENGINE',
        title: isId ? 'Excel → Point KML' : 'Excel → Point KML Placemarks',
        desc: isId
          ? 'Konversi tabel koordinat situs seluler menjadi berkas Google Earth KML terstruktur lengkap dengan kustomisasi ikon penanda, skala visual, serta label warna RGB.'
          : 'Converts multi-vendor site coordinates into high-precision Google Earth KML placemarks with customizable styling, icon scales, and RGB label colors.',
        specs: ['KML 2.2', 'EPSG:4326', 'Auto Lat/Lon Detect', 'Custom RGB Tint'],
        visual: `
          <svg viewBox="0 0 420 230" width="100%" height="230" xmlns="http://www.w3.org/2000/svg" class="diagram-canvas">
            <!-- Earth Graticule Lines -->
            <path d="M 15 55 Q 120 75 220 55" fill="none" class="diagram-grid" stroke-width="1.2"/>
            <path d="M 15 115 Q 120 135 220 115" fill="none" class="diagram-grid" stroke-width="1.2"/>
            <path d="M 15 175 Q 120 195 220 175" fill="none" class="diagram-grid" stroke-width="1.2"/>
            <line x1="60" y1="20" x2="60" y2="210" class="diagram-grid" stroke-dasharray="3 3"/>
            <line x1="120" y1="20" x2="120" y2="210" class="diagram-grid" stroke-dasharray="3 3"/>
            <line x1="180" y1="20" x2="180" y2="210" class="diagram-grid" stroke-dasharray="3 3"/>

            <!-- Geodetic Datum Badge -->
            <rect x="20" y="20" width="108" height="18" rx="3" class="diagram-panel-subtle"/>
            <text x="26" y="32" class="diagram-text-muted" font-size="8" font-weight="600">WGS84 EPSG:4326</text>

            <!-- Inter-site Geodesic Track -->
            <path d="M 85 110 Q 125 65 175 75" fill="none" stroke="#0284C7" stroke-width="1.2" stroke-dasharray="3 3"/>

            <!-- Placemark Site 1 (Sky Blue) -->
            <g transform="translate(85, 110)">
              <circle cx="0" cy="0" r="14" fill="#0284C7" fill-opacity="0.18"/>
              <circle cx="0" cy="0" r="8" fill="#0284C7" fill-opacity="0.45"/>
              <circle cx="0" cy="0" r="3.5" fill="#0284C7"/>
              <circle cx="0" cy="0" r="1.5" fill="#FFFFFF"/>
              <text x="12" y="4" class="diagram-text-title" font-size="9" font-weight="700" font-family="monospace">JKT_SITE_01</text>
            </g>

            <!-- Placemark Site 2 (Coral Red Hub) -->
            <g transform="translate(175, 75)">
              <circle cx="0" cy="0" r="15" fill="#EF4444" fill-opacity="0.18"/>
              <circle cx="0" cy="0" r="9" fill="#EF4444" fill-opacity="0.45"/>
              <circle cx="0" cy="0" r="3.5" fill="#EF4444"/>
              <circle cx="0" cy="0" r="1.5" fill="#FFFFFF"/>
              <text x="12" y="4" class="diagram-text-title" font-size="9" font-weight="700" font-family="monospace">BDG_HUB_09</text>
            </g>

            <!-- Placemark Site 3 (Emerald Green Micro) -->
            <g transform="translate(140, 165)">
              <circle cx="0" cy="0" r="13" fill="#10B981" fill-opacity="0.18"/>
              <circle cx="0" cy="0" r="7" fill="#10B981" fill-opacity="0.45"/>
              <circle cx="0" cy="0" r="3" fill="#10B981"/>
              <circle cx="0" cy="0" r="1.2" fill="#FFFFFF"/>
              <text x="12" y="4" class="diagram-text-title" font-size="9" font-weight="700" font-family="monospace">SUB_MICRO_14</text>
            </g>

            <!-- Google Earth Placemark Inspection Card -->
            <g transform="translate(225, 20)">
              <rect width="180" height="190" rx="6" class="diagram-panel" filter="drop-shadow(0 2px 8px rgba(0,0,0,0.12))"/>
              
              <!-- Inspector Header -->
              <rect x="0" y="0" width="180" height="30" rx="5" class="diagram-header-primary"/>
              <text x="12" y="20" fill="#FFFFFF" font-size="10" font-weight="bold" font-family="sans-serif">📍 Placemark Inspector</text>

              <g transform="translate(12, 45)">
                <text x="0" y="0" class="diagram-text-muted" font-size="7.5">TARGET SITENAME:</text>
                <text x="0" y="13" class="diagram-text-title" font-size="9.5" font-weight="bold" font-family="monospace">JKT_SITE_01</text>

                <line x1="0" y1="22" x2="156" y2="22" class="diagram-divider"/>

                <text x="0" y="34" class="diagram-text-muted" font-size="7.5">LATITUDE (WGS84):</text>
                <text x="0" y="46" class="diagram-text-primary" font-size="9" font-weight="600" font-family="monospace">-6.175392° S</text>

                <text x="0" y="60" class="diagram-text-muted" font-size="7.5">LONGITUDE (WGS84):</text>
                <text x="0" y="72" class="diagram-text-primary" font-size="9" font-weight="600" font-family="monospace">106.827153° E</text>

                <line x1="0" y1="81" x2="156" y2="81" class="diagram-divider"/>

                <text x="0" y="93" class="diagram-text-body" font-size="8" font-family="monospace">Scale: 1.1x | Color: #0284C7</text>
                <text x="0" y="105" class="diagram-text-body" font-size="8" font-family="monospace">Icon: wht-pushpin.png</text>
                <text x="0" y="117" class="diagram-text-body" font-size="8" font-family="monospace">Altitude: 45.0m (Clamped)</text>

                <!-- Status Chip -->
                <rect x="0" y="124" width="156" height="16" rx="3" class="diagram-badge-success" stroke-width="1"/>
                <text x="78" y="135" class="diagram-text-success" font-size="8" font-weight="bold" font-family="sans-serif" text-anchor="middle">✓ KML 2.2 Compliant</text>
              </g>
            </g>
          </svg>
        `
      },
      {
        id: 'isd-calculator',
        route: '#tool-isd-calculator',
        tag: isId ? 'JARAK & TOPOLOGI JARINGAN' : 'INTER-SITE DISTANCE (ISD)',
        title: isId ? 'Kalkulator ISD (Jarak Antar-Situs)' : 'Inter-Site Distance (ISD) Calculator',
        desc: isId
          ? 'Perhitungan jarak spherical Haversine untuk menemukan N-tetangga terdekat antara File Sumber dan File Kandidat dengan dukungan penuh satuan Kilometer (km) dan Meter (m).'
          : 'High-speed Haversine great-circle distance engine computing N-nearest neighbor relationships between Source and Candidate sites with full Kilometers (km) and Meters (m) support.',
        specs: ['Haversine Formula', 'Meters & Kilometers', 'N-Nearest (1-5)', 'Dual-Sheet XLSX'],
        visual: `
          <svg viewBox="0 0 420 230" width="100%" height="230" xmlns="http://www.w3.org/2000/svg" class="diagram-canvas">
            <!-- Topology Mesh -->
            <g transform="translate(125, 115)">
              <!-- Range concentric distance circles -->
              <circle cx="0" cy="0" r="105" fill="none" class="diagram-grid" stroke-dasharray="3 3"/>
              <circle cx="0" cy="0" r="65" fill="none" class="diagram-grid" stroke-dasharray="3 3"/>
              <text x="4" y="-68" class="diagram-text-muted" font-size="7">500 m</text>
              <text x="4" y="-108" class="diagram-text-muted" font-size="7">1.0 km</text>

              <!-- Connection Vectors -->
              <line x1="0" y1="0" x2="100" y2="-55" stroke="#0284C7" stroke-width="1.8" stroke-dasharray="4 2"/>
              <line x1="0" y1="0" x2="115" y2="40" stroke="#0284C7" stroke-width="1.4" stroke-dasharray="3 3"/>
              <line x1="0" y1="0" x2="-75" y2="55" class="diagram-axis" stroke-width="1" stroke-dasharray="2 2"/>

              <!-- Distance Badge Pills -->
              <g transform="translate(48, -35)">
                <rect x="-30" y="-9" width="60" height="17" rx="8" class="diagram-header-primary"/>
                <text x="0" y="3" fill="#FFFFFF" font-size="8.5" font-weight="bold" font-family="monospace" text-anchor="middle">428.5 m</text>
              </g>

              <g transform="translate(62, 25)">
                <rect x="-30" y="-9" width="60" height="17" rx="8" class="diagram-panel"/>
                <text x="0" y="3" class="diagram-text-primary" font-size="8.5" font-weight="bold" font-family="monospace" text-anchor="middle">1.25 km</text>
              </g>

              <!-- Source Node (Center - Site A01) -->
              <circle cx="0" cy="0" r="14" fill="#EF4444" fill-opacity="0.2"/>
              <circle cx="0" cy="0" r="7" fill="#EF4444"/>
              <circle cx="0" cy="0" r="2.5" fill="#FFFFFF"/>
              <text x="-25" y="24" class="diagram-text-danger" font-size="9" font-weight="bold" font-family="monospace">Site_A01</text>

              <!-- Candidate Neighbors -->
              <circle cx="100" cy="-55" r="7" fill="#0284C7"/>
              <circle cx="100" cy="-55" r="2.5" fill="#FFFFFF"/>
              <text x="110" y="-52" class="diagram-text-primary" font-size="8.5" font-weight="600" font-family="monospace">Site_B04 (1st)</text>

              <circle cx="115" cy="40" r="6" fill="#10B981"/>
              <circle cx="115" cy="40" r="2" fill="#FFFFFF"/>
              <text x="125" y="44" class="diagram-text-success" font-size="8.5" font-weight="600" font-family="monospace">Site_B12 (2nd)</text>

              <circle cx="-75" cy="55" r="5" fill="#64748B"/>
              <text x="-125" y="59" class="diagram-text-muted" font-size="8" font-family="monospace">Site_B27</text>
            </g>

            <!-- Unit Selector Pill Banner -->
            <g transform="translate(262, 16)">
              <rect width="144" height="40" rx="6" class="diagram-panel"/>
              <text x="10" y="16" class="diagram-text-muted" font-size="7.5" font-family="sans-serif">Distance Unit Active:</text>
              <rect x="10" y="21" width="58" height="15" rx="3" class="diagram-header-primary"/>
              <text x="39" y="32" fill="#FFFFFF" font-size="8" font-weight="bold" font-family="monospace" text-anchor="middle">Meters</text>
              <rect x="74" y="21" width="58" height="15" rx="3" class="diagram-panel-subtle"/>
              <text x="103" y="32" class="diagram-text-muted" font-size="8" font-weight="600" font-family="monospace" text-anchor="middle">Km (km)</text>
            </g>

            <!-- Output Excel Preview Card -->
            <g transform="translate(262, 68)">
              <rect width="144" height="144" rx="6" class="diagram-panel" filter="drop-shadow(0 2px 8px rgba(0,0,0,0.12))"/>
              <rect x="0" y="0" width="144" height="24" rx="5" class="diagram-header-success"/>
              <text x="10" y="16" fill="#FFFFFF" font-size="9" font-weight="bold" font-family="sans-serif">📊 ISD_Results.xlsx</text>

              <g transform="translate(10, 38)">
                <text x="0" y="0" class="diagram-text-muted" font-size="7.5">COMPUTED PAIRS:</text>
                <text x="0" y="12" class="diagram-text-success" font-size="9" font-weight="bold" font-family="monospace">1,482 pairs</text>

                <line x1="0" y1="20" x2="124" y2="20" class="diagram-divider"/>

                <text x="0" y="32" class="diagram-text-body" font-size="8" font-family="monospace">Min ISD: 182.40 m</text>
                <text x="0" y="44" class="diagram-text-body" font-size="8" font-family="monospace">Mean ISD: 842.15 m</text>
                <text x="0" y="56" class="diagram-text-body" font-size="8" font-family="monospace">Max ISD: 4,920.00 m</text>

                <line x1="0" y1="64" x2="124" y2="64" class="diagram-divider"/>

                <text x="0" y="76" class="diagram-text-primary" font-size="7.5" font-family="monospace">Sheet 1: Ranked Pairs</text>
                <text x="0" y="88" class="diagram-text-primary" font-size="7.5" font-family="monospace">Sheet 2: Distribution</text>
              </g>
            </g>
          </svg>
        `
      },
      {
        id: 'geohash-to-shp',
        route: '#tool-geohash-to-shp',
        tag: isId ? 'ARSIP SHAPEFILE VEKTOR' : 'ESRI POLYGON SHAPEFILE ENGINE',
        title: isId ? 'Geohash → Shapefile (.zip)' : 'Geohash → ESRI Shapefile',
        desc: isId
          ? 'Memproduksi arsip standar GIS ESRI Shapefile komprehensif (.shp, .shx, .dbf, .prj) langsung dari kumpulan kode string geohash berstandar geodesi WGS84.'
          : 'Packages geohash spatial buckets into production-ready ESRI polygon shapefile archives (.shp, .shx, .dbf, .prj) with boundary coordinates and DBF attributes.',
        specs: ['ESRI Polyline/Polygon', 'EPSG:4326', 'DBF Attributes', 'ZIP Bundle'],
        visual: `
          <svg viewBox="0 0 420 230" width="100%" height="230" xmlns="http://www.w3.org/2000/svg" class="diagram-canvas">
            <!-- GIS Grid Polygons Matrix -->
            <g transform="translate(35, 30)">
              <!-- Row 1 -->
              <rect x="0" y="0" width="65" height="52" fill="#0284C7" fill-opacity="0.12" stroke="#0284C7" stroke-width="1.2"/>
              <text x="8" y="22" class="diagram-text-primary" font-size="8.5" font-weight="600" font-family="monospace">qqguw4</text>
              <circle cx="32" cy="26" r="2.5" fill="#0284C7"/>

              <rect x="70" y="0" width="65" height="52" fill="#6366F1" fill-opacity="0.2" stroke="#4F46E5" stroke-width="1.8"/>
              <text x="78" y="22" class="diagram-text-accent" font-size="8.5" font-weight="bold" font-family="monospace">qqguw5</text>
              <circle cx="102" cy="26" r="3" fill="#4F46E5"/>

              <rect x="140" y="0" width="65" height="52" fill="#0284C7" fill-opacity="0.12" stroke="#0284C7" stroke-width="1.2"/>
              <text x="148" y="22" class="diagram-text-primary" font-size="8.5" font-weight="600" font-family="monospace">qqguw7</text>
              <circle cx="172" cy="26" r="2.5" fill="#0284C7"/>

              <!-- Row 2 -->
              <rect x="0" y="58" width="65" height="52" class="diagram-panel-subtle" stroke-width="1"/>
              <text x="8" y="80" class="diagram-text-muted" font-size="8.5" font-family="monospace">qqguwh</text>

              <rect x="70" y="58" width="65" height="52" fill="#10B981" fill-opacity="0.16" stroke="#059669" stroke-width="1.4"/>
              <text x="78" y="80" class="diagram-text-success" font-size="8.5" font-weight="600" font-family="monospace">qqguwj</text>
              <circle cx="102" cy="84" r="2.5" fill="#059669"/>

              <rect x="140" y="58" width="65" height="52" class="diagram-panel-subtle" stroke-width="1"/>
              <text x="148" y="80" class="diagram-text-muted" font-size="8.5" font-family="monospace">qqguwm</text>
            </g>

            <!-- Coordinate Axes -->
            <line x1="28" y1="150" x2="245" y2="150" class="diagram-axis" stroke-width="1.2"/>
            <line x1="28" y1="150" x2="28" y2="20" class="diagram-axis" stroke-width="1.2"/>
            <text x="215" y="165" class="diagram-text-muted" font-size="8" font-family="monospace">Lon &rarr;</text>
            <text x="12" y="16" class="diagram-text-muted" font-size="8" font-family="monospace">&uarr; Lat</text>

            <!-- Shapefile Bundle Card -->
            <g transform="translate(255, 20)">
              <rect width="150" height="190" rx="6" class="diagram-panel" filter="drop-shadow(0 2px 8px rgba(0,0,0,0.12))"/>
              
              <rect x="0" y="0" width="150" height="28" rx="5" class="diagram-header-accent"/>
              <text x="12" y="18" fill="#FFFFFF" font-size="10" font-weight="bold" font-family="sans-serif">📦 ESRI Shapefile Bundle</text>

              <g transform="translate(12, 40)">
                <text x="0" y="10" class="diagram-text-primary" font-size="9" font-weight="bold" font-family="monospace">• layer.shp</text>
                <text x="0" y="22" class="diagram-text-muted" font-size="7.5">Vector Polygon Geometries</text>

                <text x="0" y="42" class="diagram-text-accent" font-size="9" font-weight="bold" font-family="monospace">• layer.shx</text>
                <text x="0" y="54" class="diagram-text-muted" font-size="7.5">Spatial Index Offsets</text>

                <text x="0" y="74" class="diagram-text-success" font-size="9" font-weight="bold" font-family="monospace">• layer.dbf</text>
                <text x="0" y="86" class="diagram-text-muted" font-size="7.5">dBase Attribute Records</text>

                <text x="0" y="106" class="diagram-text-warning" font-size="9" font-weight="bold" font-family="monospace">• layer.prj</text>
                <text x="0" y="118" class="diagram-text-muted" font-size="7.5">WGS84 EPSG:4326 Projection</text>

                <!-- ZIP Packaging Pill -->
                <rect x="0" y="128" width="126" height="16" rx="3" class="diagram-badge-accent" stroke-width="1"/>
                <text x="63" y="139" class="diagram-text-accent" font-size="7.5" font-weight="bold" font-family="sans-serif" text-anchor="middle">ZIP Archive Container</text>
              </g>
            </g>
          </svg>
        `
      },
      {
        id: 'geohash-to-latlon',
        route: '#tool-geohash-to-latlon',
        tag: isId ? 'DEKODER KOORDINAT SPASIAL' : 'GEOHASH CENTROID DECODER',
        title: isId ? 'Geohash → Lintang / Bujur' : 'Geohash to Lat/Long Decoder',
        desc: isId
          ? 'Dekripsi kode string token geohash base-32 menjadi koordinat pusat (Centroid) lintang dan bujur desimal WGS84 berserta dimensi bounding box presisi tinggi.'
          : 'Decodes base-32 geohash string tokens into WGS84 decimal degree centroid coordinates and bounding box extents.',
        specs: ['Base-32 Decoder', 'Centroid Extraction', 'Bounding Extents', 'Batch Excel & CSV'],
        visual: `
          <svg viewBox="0 0 420 230" width="100%" height="230" xmlns="http://www.w3.org/2000/svg" class="diagram-canvas">
            <!-- Target Cell Bounds -->
            <g transform="translate(48, 42)">
              <rect width="170" height="135" fill="#0284C7" fill-opacity="0.08" stroke="#0284C7" stroke-width="1.8" stroke-dasharray="5 3"/>

              <!-- Crosshair Centroid -->
              <line x1="85" y1="15" x2="85" y2="120" stroke="#0284C7" stroke-width="1.4"/>
              <line x1="25" y1="67" x2="145" y2="67" stroke="#0284C7" stroke-width="1.4"/>
              <circle cx="85" cy="67" r="7" fill="#EF4444" fill-opacity="0.2"/>
              <circle cx="85" cy="67" r="4.5" fill="#EF4444"/>
              <circle cx="85" cy="67" r="1.5" fill="#FFFFFF"/>

              <text x="94" y="60" class="diagram-text-danger" font-size="9" font-weight="bold" font-family="monospace">Centroid</text>

              <!-- Extents Labels -->
              <text x="45" y="-8" class="diagram-text-muted" font-size="8" font-family="monospace">Lat Max: -6.1750°</text>
              <text x="45" y="148" class="diagram-text-muted" font-size="8" font-family="monospace">Lat Min: -6.2150°</text>
              <text x="-40" y="71" class="diagram-text-muted" font-size="7.5" font-family="monospace">Lon Min</text>
              <text x="176" y="71" class="diagram-text-muted" font-size="7.5" font-family="monospace">Lon Max</text>
            </g>

            <!-- Decoded Data Preview Card -->
            <g transform="translate(250, 25)">
              <rect width="154" height="180" rx="6" class="diagram-panel" filter="drop-shadow(0 2px 8px rgba(0,0,0,0.12))"/>
              
              <rect x="0" y="0" width="154" height="28" rx="5" class="diagram-header-primary"/>
              <text x="12" y="19" fill="#FFFFFF" font-size="10" font-weight="bold" font-family="monospace">TOKEN: "qqguw5"</text>

              <g transform="translate(12, 42)">
                <text x="0" y="0" class="diagram-text-muted" font-size="7.5">DECODED CENTROID:</text>
                <text x="0" y="15" class="diagram-text-primary" font-size="11" font-weight="bold" font-family="monospace">-6.195000° S</text>
                <text x="0" y="30" class="diagram-text-primary" font-size="11" font-weight="bold" font-family="monospace">106.828125° E</text>

                <line x1="0" y1="40" x2="130" y2="40" class="diagram-divider"/>

                <text x="0" y="54" class="diagram-text-success" font-size="8" font-weight="600" font-family="monospace">± 0.02° Precision</text>
                <text x="0" y="68" class="diagram-text-body" font-size="8" font-family="monospace">Area: ~4.9 × 4.9 km</text>
                <text x="0" y="82" class="diagram-text-body" font-size="8" font-family="monospace">Bits: 30-bit Decoded</text>
                <text x="0" y="96" class="diagram-text-body" font-size="8" font-family="monospace">Datum: WGS84 Geodetic</text>

                <rect x="0" y="106" width="130" height="18" rx="3" class="diagram-badge-success" stroke-width="1"/>
                <text x="65" y="118" class="diagram-text-success" font-size="7.5" font-weight="bold" font-family="sans-serif" text-anchor="middle">✓ Bounding Box Enclosed</text>
              </g>
            </g>
          </svg>
        `
      },
      {
        id: 'latlon-to-geohash',
        route: '#tool-latlon-to-geohash',
        tag: isId ? 'ENKODER KOORDINAT GEOGRAFIS' : 'LAT/LONG TO GEOHASH ENCODER',
        title: isId ? 'Lintang / Bujur → Geohash' : 'Lat/Long to Geohash Encoder',
        desc: isId
          ? 'Enkripsi pasangan koordinat lintang dan bujur desimal menjadi representasi geohash bertingkat dengan penyesuaian skala presisi tingkat 1 hingga 12.'
          : 'Encodes latitude and longitude coordinate pairs into hierarchical spatial geohash codes with configurable precision tuning from regional down to sub-meter scale.',
        specs: ['1-12 Precision Scale', 'Hierarchical Quadtree', 'Bulk Spreadsheet', 'Sub-Meter Accuracy'],
        visual: `
          <svg viewBox="0 0 420 230" width="100%" height="230" xmlns="http://www.w3.org/2000/svg" class="diagram-canvas">
            <!-- Coordinate Point on Earth Grid -->
            <g transform="translate(18, 20)">
              <rect width="174" height="190" rx="6" class="diagram-panel"/>
              
              <!-- Concentric Rings -->
              <circle cx="87" cy="78" r="55" fill="none" class="diagram-grid" stroke-dasharray="3 3"/>
              <circle cx="87" cy="78" r="38" fill="none" class="diagram-grid" stroke-dasharray="2 2"/>
              <circle cx="87" cy="78" r="22" fill="#6366F1" fill-opacity="0.12"/>
              <circle cx="87" cy="78" r="22" fill="none" stroke="#6366F1" stroke-width="1.2"/>
              <circle cx="87" cy="78" r="4.5" fill="#4F46E5"/>
              <circle cx="87" cy="78" r="1.5" fill="#FFFFFF"/>

              <!-- Reticle Crosshairs -->
              <line x1="87" y1="18" x2="87" y2="138" stroke="#6366F1" stroke-width="1.2" stroke-dasharray="2 2"/>
              <line x1="27" y1="78" x2="147" y2="78" stroke="#6366F1" stroke-width="1.2" stroke-dasharray="2 2"/>

              <!-- Coordinate Badge -->
              <rect x="14" y="150" width="146" height="24" rx="4" class="diagram-panel-subtle"/>
              <text x="87" y="166" class="diagram-text-title" font-size="8.5" font-weight="600" font-family="monospace" text-anchor="middle">-6.2088°, 106.8456°</text>
            </g>

            <!-- Encoding Pipeline Card -->
            <g transform="translate(204, 20)">
              <rect width="198" height="190" rx="6" class="diagram-panel" filter="drop-shadow(0 2px 8px rgba(0,0,0,0.12))"/>
              
              <text x="14" y="24" class="diagram-text-title" font-size="10.5" font-weight="bold" font-family="sans-serif">⚡ Geohash Pipeline</text>
              <line x1="14" y1="32" x2="184" y2="32" class="diagram-divider"/>

              <!-- Precision Bar -->
              <text x="14" y="48" class="diagram-text-muted" font-size="8" font-family="sans-serif">Precision Scale: Level 7 / 12</text>
              
              <!-- Segmented meter (7 active, 5 muted) -->
              <g transform="translate(14, 54)">
                <rect x="0" y="0" width="20" height="6" rx="2" class="diagram-meter-active"/>
                <rect x="24" y="0" width="20" height="6" rx="2" class="diagram-meter-active"/>
                <rect x="48" y="0" width="20" height="6" rx="2" class="diagram-meter-active"/>
                <rect x="72" y="0" width="20" height="6" rx="2" class="diagram-meter-active"/>
                <rect x="96" y="0" width="20" height="6" rx="2" class="diagram-meter-active"/>
                <rect x="120" y="0" width="20" height="6" rx="2" class="diagram-meter-active"/>
                <rect x="144" y="0" width="20" height="6" rx="2" class="diagram-meter-active"/>
              </g>

              <!-- Base-32 Geohash Token Output Container -->
              <text x="14" y="80" class="diagram-text-muted" font-size="8" font-family="sans-serif">Base-32 Geohash Token:</text>
              <rect x="14" y="86" width="170" height="34" rx="5" class="diagram-badge-accent" stroke-width="1.5"/>
              <text x="99" y="108" class="diagram-text-accent" font-size="14" font-weight="bold" font-family="monospace" text-anchor="middle" letter-spacing="1.5">qqguw7k</text>

              <!-- Specifications Box -->
              <rect x="14" y="128" width="170" height="50" rx="4" class="diagram-panel-subtle"/>
              <text x="22" y="142" class="diagram-text-success" font-size="8" font-weight="600" font-family="monospace">• Cell: ~153 × 153 m</text>
              <text x="22" y="155" class="diagram-text-body" font-size="8" font-family="monospace">• Bits: 35-bit Interleaved</text>
              <text x="22" y="168" class="diagram-text-body" font-size="8" font-family="monospace">• Datum: WGS84 Standard</text>
            </g>
          </svg>
        `
      }
    ];
  }

  render() {
    if (state.route && state.route !== 'dashboard') return;
    const slides = this.getSlides();
    if (this.currentSlide >= slides.length || this.currentSlide < 0) {
      this.currentSlide = 0;
      state.dashboardSlide = 0;
    }

    this.container.innerHTML = `
      <!-- INTERACTIVE SHOWCASE SLIDESHOW -->
      <section class="dashboard-slideshow" id="dashboard-slideshow">
        <div class="slideshow-viewport">
          <div class="slideshow-track" id="slideshow-track" style="transform: translateX(-${this.currentSlide * 100}%);">
            ${slides.map((s, idx) => `
              <div class="slideshow-slide" data-slide-index="${idx}">
                <div class="slide-content">
                  <div class="slide-tag">
                    <span>📡</span> ${s.tag}
                  </div>
                  <h2 class="slide-title">${s.title}</h2>
                  <p class="slide-desc">${s.desc}</p>
                  
                  <div class="slide-specs">
                    ${s.specs.map(spec => `<span class="slide-spec-pill">${spec}</span>`).join('')}
                  </div>

                  <div class="slide-actions">
                    <a href="${s.route}" class="rf-btn rf-btn-primary" style="padding: 8px 18px; text-decoration: none;">
                      <span>⚡ ${state.lang === 'id' ? 'Buka Ruang Kerja' : 'Launch Workspace'} &rarr;</span>
                    </a>
                  </div>
                </div>

                <div class="slide-visual">
                  ${s.visual}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Slideshow Controls -->
        <div class="slideshow-controls">
          <div style="display: flex; gap: 8px; align-items: center;">
            <button class="slideshow-nav-btn" id="slideshow-prev-btn" title="Previous tool visual" aria-label="Previous">‹</button>
            <button class="slideshow-nav-btn" id="slideshow-next-btn" title="Next tool visual" aria-label="Next">›</button>
          </div>

          <div class="slideshow-dots" id="slideshow-dots">
            ${slides.map((_, idx) => `
              <button class="slideshow-dot ${idx === this.currentSlide ? 'slideshow-dot--active' : ''}" data-index="${idx}" title="Go to slide ${idx + 1}" aria-label="Slide ${idx + 1}"></button>
            `).join('')}
          </div>

          <div class="slideshow-meta">
            <span class="slideshow-counter" id="slideshow-counter">
              ${this.currentSlide + 1} / ${slides.length}
            </span>
          </div>
        </div>
      </section>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <div class="filter-pills" id="dashboard-filter-pills">
          <button class="filter-pill ${this.activeFilter === 'all' ? 'filter-pill--active' : ''}" data-filter="all">
            ${state.t('filter_all', 'All Tools (6)')}
          </button>
          <button class="filter-pill ${this.activeFilter === 'kml' ? 'filter-pill--active' : ''}" data-filter="kml">
            ${state.t('filter_kml', 'KML & Visualization')}
          </button>
          <button class="filter-pill ${this.activeFilter === 'topology' ? 'filter-pill--active' : ''}" data-filter="topology">
            ${state.t('filter_topology', 'Topology & Distance')}
          </button>
          <button class="filter-pill ${this.activeFilter === 'gis' ? 'filter-pill--active' : ''}" data-filter="gis">
            ${state.t('filter_gis', 'Geospatial & Geohash')}
          </button>
        </div>

        <div style="position: relative; min-width: 280px; max-width: 320px;">
          <input 
            type="text" 
            class="rf-stepper-input" 
            id="dashboard-search-input" 
            placeholder="${state.t('search_tools_input', 'Filter tools by name or keyword...')}" 
            value="${this.searchQuery}"
            style="width: 100%; text-align: left; padding-left: 34px; border-radius: 9999px; box-sizing: border-box; font-size: 0.8125rem;"
          >
          <span style="position: absolute; left: 12px; top: 7px; color: var(--color-text-muted); font-size: 0.875rem; pointer-events: none;">🔍</span>
        </div>
      </div>

      <!-- Tool Cards Grid -->
      <div class="rf-card-grid" id="dashboard-tool-grid">
      </div>
    `;

    this.bindSlideshow();
    this.bindFilters();
    this.renderToolGrid();
  }

  bindSlideshow() {
    const track = this.container.querySelector('#slideshow-track');
    const prevBtn = this.container.querySelector('#slideshow-prev-btn');
    const nextBtn = this.container.querySelector('#slideshow-next-btn');
    const dots = this.container.querySelectorAll('.slideshow-dot');
    const counter = this.container.querySelector('#slideshow-counter');
    const container = this.container.querySelector('#dashboard-slideshow');
    const slides = this.getSlides();

    const updateSlide = () => {
      if (!track) return;
      track.style.transform = `translateX(-${this.currentSlide * 100}%)`;
      state.dashboardSlide = this.currentSlide;

      if (counter) {
        counter.textContent = `${this.currentSlide + 1} / ${slides.length}`;
      }

      dots.forEach((dot, idx) => {
        if (idx === this.currentSlide) {
          dot.classList.add('slideshow-dot--active');
        } else {
          dot.classList.remove('slideshow-dot--active');
        }
      });
    };

    // Immediately reflect active slide upon binding/re-render
    updateSlide();

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.currentSlide = (this.currentSlide - 1 + slides.length) % slides.length;
        updateSlide();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.currentSlide = (this.currentSlide + 1) % slides.length;
        updateSlide();
      });
    }

    dots.forEach(dot => {
      dot.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        if (!isNaN(idx)) {
          this.currentSlide = idx;
          updateSlide();
        }
      });
    });

    // Auto-advance every 5 seconds
    this.startAutoplay(updateSlide, slides.length);

    if (container) {
      container.addEventListener('mouseenter', () => this.stopAutoplay());
      container.addEventListener('mouseleave', () => this.startAutoplay(updateSlide, slides.length));
    }
  }

  startAutoplay(updateCallback, total) {
    this.stopAutoplay();
    this.slideshowTimer = setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % total;
      if (updateCallback) updateCallback();
    }, 5000);
  }

  stopAutoplay() {
    if (this.slideshowTimer) {
      clearInterval(this.slideshowTimer);
      this.slideshowTimer = null;
    }
  }

  bindFilters() {
    const filterPills = this.container.querySelectorAll('.filter-pill');
    filterPills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        filterPills.forEach(p => p.classList.remove('filter-pill--active'));
        pill.classList.add('filter-pill--active');
        this.activeFilter = pill.dataset.filter;
        this.renderToolGrid();
      });
    });

    const searchInput = this.container.querySelector('#dashboard-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.renderToolGrid();
      });
    }
  }

  getToolsList() {
    const isId = state.lang === 'id';
    return [
      {
        id: 'excel-to-kml',
        title: isId ? 'Excel ke Point KML Placemark' : 'Excel to Point KML Placemark',
        category: isId ? 'KML & VISUALISASI' : 'KML & VISUALIZATION',
        category_id: 'kml',
        description: isId
          ? 'Konversi koordinat sel/site ke placemark Google Earth dengan kustomisasi ikon, warna, dan folder.'
          : 'Convert tabular site coordinates into styled Google Earth placemark KML files with custom icons, colors, and folders.',
        icon: 'tool-excel-to-kml.svg',
        tags: ['EPSG:4326', 'Google Earth (.kml)'],
        sample_template_id: 'point_kml'
      },
      {
        id: 'prb-kml',
        title: isId ? 'Excel ke PRB 3D Sector Polygon' : 'Excel to PRB 3D Sector Polygon',
        category: isId ? 'KML & VISUALISASI' : 'KML & VISUALIZATION',
        category_id: 'kml',
        description: isId
          ? 'Buat poligon sektor antena 3D dengan kode warna utilisasi PRB, pengguna RRC, dan ketinggian band.'
          : 'Generate 3D antenna sector polygons color-coded by PRB utilization, RRC connected users, and band altitudes.',
        icon: 'tool-prb-kml.svg',
        tags: ['EPSG:4326', '3D Extruded (.kml)'],
        sample_template_id: 'prb_kml'
      },
      {
        id: 'isd-calculator',
        title: isId ? 'Kalkulator Inter-Site Distance (ISD)' : 'Inter-Site Distance (ISD) Calculator',
        category: isId ? 'TOPOLOGI & JARAK' : 'TOPOLOGY & DISTANCE',
        category_id: 'topology',
        description: isId
          ? 'Hitung jarak geodetik Haversine presisi tinggi antar dataset site dan identifikasi N-tetangga terdekat.'
          : 'Calculate high-precision geodesic Haversine distances between site datasets and identify N-nearest neighbors.',
        icon: 'tool-isd-calculator.svg',
        tags: ['EPSG:4326', 'Dual-Sheet (.xlsx)'],
        sample_template_id: 'isd_a'
      },
      {
        id: 'geohash-converter',
        title: isId ? 'Geohash Converter' : 'Geohash Converter',
        category: isId ? 'GEOSPASIAL & GEOHASH' : 'GEOSPATIAL & GEOHASH',
        category_id: 'gis',
        description: isId
          ? 'Konversi dua arah instan antara kode string GeoHash dan koordinat lintang/bujur (Lat/Lng) dengan kontrol presisi.'
          : 'Instant bidirectional conversion between GeoHash strings and Lat/Lng coordinates with precision control and boundary inspection.',
        icon: 'tool-geohash-converter.svg',
        tags: ['Hierarchical Base-32', 'WGS84 Coordinates', 'geohash.co UX'],
        sample_template_id: null
      },
      {
        id: 'geohash-to-shp',
        title: isId ? 'Geohash ke ESRI Shapefile' : 'Geohash to ESRI Shapefile',
        category: isId ? 'GEOSPASIAL & GEOHASH' : 'GEOSPATIAL & GEOHASH',
        category_id: 'gis',
        description: isId
          ? 'Transformasi data geohash menjadi shapefile poligon vektor (arsip .zip dengan .shp, .shx, .dbf, .prj).'
          : 'Transform geohash records into vector polygon shapefiles (.zip archive with .shp, .shx, .dbf, .prj).',
        icon: 'tool-geohash-to-shp.svg',
        tags: ['EPSG:4326', 'ESRI Shapefile (.zip)'],
        sample_template_id: 'geohash'
      },
      {
        id: 'geohash-to-latlon',
        title: isId ? 'Geohash ke Titik Pusat Lat/Long' : 'Geohash to Centroid Lat/Long',
        category: isId ? 'GEOSPASIAL & GEOHASH' : 'GEOSPATIAL & GEOHASH',
        category_id: 'gis',
        description: isId
          ? 'Dekode string token geohash menjadi koordinat lintang dan bujur desimal WGS84.'
          : 'Decode geohash string tokens into WGS84 decimal latitude and longitude centroid coordinates.',
        icon: 'tool-geohash-to-latlon.svg',
        tags: ['WGS84 Datum', 'Spreadsheet (.xlsx/.csv)'],
        sample_template_id: 'geohash'
      },
      {
        id: 'latlon-to-geohash',
        title: isId ? 'Enkoder Lat/Long ke Geohash' : 'Lat/Long to Geohash Encoder',
        category: isId ? 'GEOSPASIAL & GEOHASH' : 'GEOSPATIAL & GEOHASH',
        category_id: 'gis',
        description: isId
          ? 'Enkode koordinat geografis menjadi token geohash standar dengan pilihan presisi (1-12).'
          : 'Encode geographic coordinates into standardized geohash tokens with selectable precision (1-12).',
        icon: 'tool-latlon-to-geohash.svg',
        tags: ['Hierarchical Grid', 'Spreadsheet (.xlsx/.csv)'],
        sample_template_id: 'latlon'
      }
    ];
  }

  renderToolGrid() {
    const grid = this.container.querySelector('#dashboard-tool-grid');
    if (!grid) return;

    let tools = this.getToolsList();

    if (this.activeFilter !== 'all') {
      tools = tools.filter(t => t.category_id === this.activeFilter);
    }

    if (this.searchQuery) {
      const q = this.searchQuery;
      tools = tools.filter(t => 
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)))
      );
    }

    if (tools.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 24px; color: var(--color-text-muted);">
          <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
          <div>${state.t('no_tools_found', 'No tools match your filter or search.')}</div>
        </div>
      `;
      return;
    }

    grid.innerHTML = tools.map(tool => `
      <div class="rf-card rf-card-tool" data-tool-id="${tool.id}">
        <div class="rf-card-tool__header">
          <div class="rf-card-tool__icon">
            <img src="/assets/icons/${tool.icon}" alt="${tool.title}" width="24" height="24">
          </div>
          <span class="rf-card-tool__category">${tool.category}</span>
        </div>

        <h3 class="rf-card-tool__title">
          <a href="#tool-${tool.id}" class="rf-card__link">
            ${tool.title}
          </a>
        </h3>

        <p class="rf-card-tool__desc">${tool.description}</p>

        <div class="rf-card-tool__tags">
          ${tool.tags.map(tag => `<span class="rf-card-tool__tag">${tag}</span>`).join('')}
        </div>

        <div class="rf-card-tool__footer">
          <a href="#tool-${tool.id}" class="rf-btn rf-btn-primary" style="padding: 7px 16px; font-size: 0.8125rem; text-decoration: none; border-radius: 6px; font-weight: 500;">
            <span>Launch Tool &rarr;</span>
          </a>
          ${tool.sample_template_id ? `
          <a 
            href="/api/v1/templates/${tool.sample_template_id}/download" 
            class="rf-template-link" 
            download 
            title="Download sample template file"
            style="display: flex; align-items: center; gap: 4px; font-size: 0.8125rem; color: var(--color-text-secondary); text-decoration: none; font-weight: 500;"
          >
            <span>📥 Template</span>
          </a>` : `
          <span style="font-size: 0.8125rem; color: var(--color-brand, #38BDF8); font-weight: 600; display: inline-flex; align-items: center; gap: 5px;">
            <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#10B981; box-shadow: 0 0 6px #10B981;"></span>
            <span>${state.lang === 'id' ? 'Interaktif ⇄' : 'Interactive ⇄'}</span>
          </span>`}
        </div>
      </div>
    `).join('');
  }
}
