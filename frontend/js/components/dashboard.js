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
    this.currentSlide = 0;
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
          <svg viewBox="0 0 420 230" width="100%" height="230" xmlns="http://www.w3.org/2000/svg" style="background: linear-gradient(135deg, #090d16 0%, #111a2e 100%); border-radius: 6px;">
            <defs>
              <linearGradient id="secRed" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#EF4444" stop-opacity="0.85"/>
                <stop offset="100%" stop-color="#B91C1C" stop-opacity="0.5"/>
              </linearGradient>
              <linearGradient id="secBlue" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.85"/>
                <stop offset="100%" stop-color="#1D4ED8" stop-opacity="0.4"/>
              </linearGradient>
              <linearGradient id="secGreen" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#10B981" stop-opacity="0.85"/>
                <stop offset="100%" stop-color="#047857" stop-opacity="0.4"/>
              </linearGradient>
            </defs>

            <!-- Grid Radar Lines -->
            <circle cx="130" cy="180" r="140" fill="none" stroke="#1E293B" stroke-dasharray="3 3"/>
            <circle cx="130" cy="180" r="95" fill="none" stroke="#1E293B" stroke-dasharray="3 3"/>
            <circle cx="130" cy="180" r="50" fill="none" stroke="#1E293B" stroke-dasharray="3 3"/>
            <line x1="130" y1="180" x2="230" y2="60" stroke="#334155" stroke-dasharray="2 2"/>

            <!-- 3D Sector Polygons Stacked -->
            <!-- Layer 3: Band 2100 (Blue) -->
            <path d="M 130 180 L 190 70 A 130 130 0 0 1 255 125 Z" fill="url(#secBlue)" stroke="#60A5FA" stroke-width="1.5"/>
            <!-- Layer 2: Band 1800 (Red - High DL PRB) -->
            <path d="M 130 180 L 175 95 A 95 95 0 0 1 220 140 Z" fill="url(#secRed)" stroke="#F87171" stroke-width="1.5"/>
            <!-- Layer 1: Band 900 (Green) -->
            <path d="M 130 180 L 155 130 A 55 55 0 0 1 180 155 Z" fill="url(#secGreen)" stroke="#34D399" stroke-width="1.5"/>

            <!-- Origin Antenna Site -->
            <circle cx="130" cy="180" r="5" fill="#0EA5E9"/>
            <circle cx="130" cy="180" r="10" fill="none" stroke="#0EA5E9" stroke-width="1.5" opacity="0.6"/>
            <text x="110" y="202" fill="#94A3B8" font-size="10" font-family="monospace">Site Origin</text>

            <!-- Balloon Telemetry Card Preview -->
            <g transform="translate(255, 20)">
              <rect width="150" height="185" rx="5" fill="#0F172A" stroke="#38BDF8" stroke-width="1.5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))"/>
              
              <!-- Dual Logos Header Simulation -->
              <rect x="6" y="6" width="66" height="22" rx="2" fill="#FFFFFF"/>
              <text x="10" y="21" fill="#DC2626" font-size="8" font-weight="bold" font-family="sans-serif">TelkomInfra</text>
              <rect x="78" y="6" width="66" height="22" rx="2" fill="#000000"/>
              <text x="88" y="21" fill="#F8FAFC" font-size="9" font-weight="900" font-style="italic" font-family="sans-serif">PUMA</text>

              <!-- Table Rows -->
              <line x1="6" y1="34" x2="144" y2="34" stroke="#334155"/>
              <text x="8" y="46" fill="#94A3B8" font-size="8" font-family="monospace">WEEK: 06</text>
              <text x="8" y="58" fill="#94A3B8" font-size="8" font-family="monospace">SITENAME: Parbulu</text>
              <text x="8" y="70" fill="#94A3B8" font-size="8" font-family="monospace">BAND: LTE1800</text>

              <!-- KPI Rows with Color -->
              <rect x="6" y="76" width="138" height="15" fill="#DC2626" rx="2"/>
              <text x="10" y="87" fill="#FFFFFF" font-size="8" font-weight="bold" font-family="sans-serif">DL PRB: 91.9% (Critical)</text>

              <rect x="6" y="94" width="138" height="15" fill="#2563EB" rx="2"/>
              <text x="10" y="105" fill="#FFFFFF" font-size="8" font-weight="bold" font-family="sans-serif">UL PRB: 16.5%</text>

              <rect x="6" y="112" width="138" height="15" fill="#16A34A" rx="2"/>
              <text x="10" y="123" fill="#FFFFFF" font-size="8" font-weight="bold" font-family="sans-serif">RRC Users: 44.71</text>

              <text x="8" y="140" fill="#94A3B8" font-size="8" font-family="monospace">PAYLOAD: 6.68 GB</text>
              <text x="8" y="152" fill="#94A3B8" font-size="8" font-family="monospace">AZIMUTH: 150°</text>
              <text x="8" y="164" fill="#94A3B8" font-size="8" font-family="monospace">TILT: 4° | PCI: 166</text>

              <!-- Footer -->
              <line x1="6" y1="170" x2="144" y2="170" stroke="#334155"/>
              <text x="12" y="180" fill="#64748B" font-size="6.5" font-family="sans-serif">&copy; 2025 TelkomInfra</text>
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
          <svg viewBox="0 0 420 230" width="100%" height="230" xmlns="http://www.w3.org/2000/svg" style="background: linear-gradient(135deg, #090d16 0%, #0e1e38 100%); border-radius: 6px;">
            <!-- Earth Grid Lines -->
            <path d="M 20 60 Q 210 90 400 60" fill="none" stroke="#1E293B" stroke-width="1.5"/>
            <path d="M 20 120 Q 210 150 400 120" fill="none" stroke="#1E293B" stroke-width="1.5"/>
            <path d="M 20 180 Q 210 210 400 180" fill="none" stroke="#1E293B" stroke-width="1.5"/>
            <line x1="110" y1="20" x2="110" y2="210" stroke="#1E293B" stroke-dasharray="3 3"/>
            <line x1="220" y1="20" x2="220" y2="210" stroke="#1E293B" stroke-dasharray="3 3"/>
            <line x1="330" y1="20" x2="330" y2="210" stroke="#1E293B" stroke-dasharray="3 3"/>

            <!-- Coordinate Labels -->
            <text x="30" y="35" fill="#0EA5E9" font-size="10" font-family="monospace">WGS84 EPSG:4326</text>

            <!-- Placemark Pin 1 (Cyan) -->
            <g transform="translate(100, 110)">
              <circle cx="0" cy="0" r="14" fill="#0EA5E9" fill-opacity="0.25"/>
              <circle cx="0" cy="0" r="8" fill="#0EA5E9" fill-opacity="0.6"/>
              <circle cx="0" cy="0" r="3" fill="#FFFFFF"/>
              <text x="12" y="4" fill="#38BDF8" font-size="10" font-weight="bold" font-family="monospace">JKT_SITE_01</text>
            </g>

            <!-- Placemark Pin 2 (Red) -->
            <g transform="translate(210, 75)">
              <circle cx="0" cy="0" r="16" fill="#EF4444" fill-opacity="0.25"/>
              <circle cx="0" cy="0" r="9" fill="#EF4444" fill-opacity="0.7"/>
              <circle cx="0" cy="0" r="3.5" fill="#FFFFFF"/>
              <text x="12" y="4" fill="#F87171" font-size="10" font-weight="bold" font-family="monospace">BDG_HUB_09</text>
            </g>

            <!-- Placemark Pin 3 (Green) -->
            <g transform="translate(290, 140)">
              <circle cx="0" cy="0" r="12" fill="#10B981" fill-opacity="0.25"/>
              <circle cx="0" cy="0" r="7" fill="#10B981" fill-opacity="0.6"/>
              <circle cx="0" cy="0" r="2.5" fill="#FFFFFF"/>
              <text x="12" y="4" fill="#34D399" font-size="10" font-weight="bold" font-family="monospace">SUB_MICRO_14</text>
            </g>

            <!-- Google Earth Placemark Card Popup -->
            <g transform="translate(180, 105)">
              <rect width="190" height="95" rx="5" fill="#0F172A" stroke="#0EA5E9" stroke-width="1.5" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.6))"/>
              <text x="12" y="24" fill="#F8FAFC" font-size="11" font-weight="bold" font-family="sans-serif">📍 Placemark Attributes</text>
              <line x1="12" y1="32" x2="178" y2="32" stroke="#334155"/>
              <text x="12" y="48" fill="#94A3B8" font-size="9" font-family="monospace">SITENAME: JKT_SITE_01</text>
              <text x="12" y="62" fill="#38BDF8" font-size="9" font-family="monospace">LAT: -6.175392° S</text>
              <text x="12" y="76" fill="#38BDF8" font-size="9" font-family="monospace">LON: 106.827153° E</text>
              <text x="12" y="90" fill="#E2E8F0" font-size="8.5" font-family="monospace">Scale: 0.7x | Marker: Red</text>
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
          <svg viewBox="0 0 420 230" width="100%" height="230" xmlns="http://www.w3.org/2000/svg" style="background: linear-gradient(135deg, #090d16 0%, #151a30 100%); border-radius: 6px;">
            <!-- Topology Mesh -->
            <g transform="translate(130, 115)">
              <!-- Connection Vectors -->
              <line x1="0" y1="0" x2="110" y2="-60" stroke="#0EA5E9" stroke-width="2" stroke-dasharray="4 2"/>
              <line x1="0" y1="0" x2="130" y2="45" stroke="#38BDF8" stroke-width="1.5" stroke-dasharray="3 3"/>
              <line x1="0" y1="0" x2="-80" y2="60" stroke="#64748B" stroke-width="1" stroke-dasharray="2 2"/>

              <!-- Distance Pills -->
              <g transform="translate(50, -38)">
                <rect x="-34" y="-10" width="70" height="18" rx="9" fill="#0284C7" stroke="#38BDF8"/>
                <text x="0" y="3" fill="#FFFFFF" font-size="9" font-weight="bold" font-family="monospace" text-anchor="middle">428.5 m</text>
              </g>

              <g transform="translate(68, 28)">
                <rect x="-34" y="-10" width="70" height="18" rx="9" fill="#1E293B" stroke="#0EA5E9"/>
                <text x="0" y="3" fill="#38BDF8" font-size="9" font-weight="bold" font-family="monospace" text-anchor="middle">1.25 km</text>
              </g>

              <!-- Source Node (Center) -->
              <circle cx="0" cy="0" r="14" fill="#EF4444" fill-opacity="0.3"/>
              <circle cx="0" cy="0" r="8" fill="#EF4444"/>
              <text x="-25" y="24" fill="#F87171" font-size="9" font-weight="bold" font-family="monospace">Site_A01</text>

              <!-- Candidate Neighbors -->
              <circle cx="110" cy="-60" r="7" fill="#0EA5E9"/>
              <text x="120" y="-56" fill="#38BDF8" font-size="9" font-family="monospace">Site_B04 (1st)</text>

              <circle cx="130" cy="45" r="6" fill="#0284C7"/>
              <text x="140" y="49" fill="#94A3B8" font-size="9" font-family="monospace">Site_B12 (2nd)</text>

              <circle cx="-80" cy="60" r="5" fill="#475569"/>
              <text x="-135" y="64" fill="#64748B" font-size="8" font-family="monospace">Site_B27</text>
            </g>

            <!-- Unit Selector Pill Banner -->
            <g transform="translate(265, 15)">
              <rect width="140" height="42" rx="6" fill="#0F172A" stroke="#334155" stroke-width="1"/>
              <text x="12" y="18" fill="#94A3B8" font-size="8" font-family="sans-serif">Distance Unit Active:</text>
              <rect x="12" y="23" width="55" height="15" rx="3" fill="#0284C7"/>
              <text x="25" y="34" fill="#FFFFFF" font-size="8.5" font-weight="bold" font-family="monospace">Meters</text>
              <rect x="72" y="23" width="55" height="15" rx="3" fill="#1E293B"/>
              <text x="82" y="34" fill="#94A3B8" font-size="8.5" font-family="monospace">Km (km)</text>
            </g>

            <!-- Output Excel Preview Card -->
            <g transform="translate(265, 75)">
              <rect width="140" height="135" rx="5" fill="#0F172A" stroke="#10B981" stroke-width="1.2"/>
              <rect x="0" y="0" width="140" height="22" rx="4" fill="#065F46"/>
              <text x="10" y="15" fill="#ECFDF5" font-size="8.5" font-weight="bold" font-family="sans-serif">📊 ISD_Results.xlsx</text>
              
              <text x="8" y="38" fill="#A7F3D0" font-size="7.5" font-family="monospace">Count: 1,482 pairs</text>
              <text x="8" y="52" fill="#E2E8F0" font-size="7.5" font-family="monospace">Min: 182.40 m</text>
              <text x="8" y="66" fill="#E2E8F0" font-size="7.5" font-family="monospace">Mean: 842.15 m</text>
              <text x="8" y="80" fill="#E2E8F0" font-size="7.5" font-family="monospace">Max: 4,920.00 m</text>

              <line x1="8" y1="90" x2="132" y2="90" stroke="#334155"/>
              <text x="8" y="104" fill="#38BDF8" font-size="7.5" font-family="monospace">Sheet 1: Ranked Pairs</text>
              <text x="8" y="118" fill="#38BDF8" font-size="7.5" font-family="monospace">Sheet 2: Distribution</text>
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
          <svg viewBox="0 0 420 230" width="100%" height="230" xmlns="http://www.w3.org/2000/svg" style="background: linear-gradient(135deg, #090d16 0%, #171d2b 100%); border-radius: 6px;">
            <!-- GIS Grid Polygons -->
            <g transform="translate(40, 35)">
              <rect x="0" y="0" width="70" height="55" fill="#0EA5E9" fill-opacity="0.15" stroke="#0EA5E9" stroke-width="1.5"/>
              <text x="8" y="24" fill="#38BDF8" font-size="9" font-family="monospace">qqguw4</text>
              <circle cx="35" cy="27" r="2.5" fill="#38BDF8"/>

              <rect x="75" y="0" width="70" height="55" fill="#6366F1" fill-opacity="0.25" stroke="#818CF8" stroke-width="2"/>
              <text x="83" y="24" fill="#C7D2FE" font-size="9" font-weight="bold" font-family="monospace">qqguw5</text>
              <circle cx="110" cy="27" r="3" fill="#FFFFFF"/>

              <rect x="150" y="0" width="70" height="55" fill="#0EA5E9" fill-opacity="0.15" stroke="#0EA5E9" stroke-width="1.5"/>
              <text x="158" y="24" fill="#38BDF8" font-size="9" font-family="monospace">qqguw7</text>
              <circle cx="185" cy="27" r="2.5" fill="#38BDF8"/>

              <rect x="0" y="60" width="70" height="55" fill="#0EA5E9" fill-opacity="0.1" stroke="#334155" stroke-width="1"/>
              <text x="8" y="84" fill="#64748B" font-size="9" font-family="monospace">qqguwh</text>

              <rect x="75" y="60" width="70" height="55" fill="#10B981" fill-opacity="0.2" stroke="#34D399" stroke-width="1.5"/>
              <text x="83" y="84" fill="#6EE7B7" font-size="9" font-family="monospace">qqguwj</text>
              <circle cx="110" cy="87" r="2.5" fill="#34D399"/>

              <rect x="150" y="60" width="70" height="55" fill="#0EA5E9" fill-opacity="0.1" stroke="#334155" stroke-width="1"/>
              <text x="158" y="84" fill="#64748B" font-size="9" font-family="monospace">qqguwm</text>
            </g>

            <!-- Coordinate Axes -->
            <line x1="30" y1="160" x2="270" y2="160" stroke="#475569" stroke-width="1.5"/>
            <line x1="30" y1="160" x2="30" y2="25" stroke="#475569" stroke-width="1.5"/>
            <text x="240" y="175" fill="#94A3B8" font-size="8" font-family="monospace">Longitude &rarr;</text>
            <text x="15" y="20" fill="#94A3B8" font-size="8" font-family="monospace">&uarr; Lat</text>

            <!-- Shapefile Bundle Card -->
            <g transform="translate(265, 30)">
              <rect width="140" height="165" rx="6" fill="#0F172A" stroke="#818CF8" stroke-width="1.5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))"/>
              <text x="14" y="26" fill="#F8FAFC" font-size="11" font-weight="bold" font-family="sans-serif">📦 ESRI Shapefile</text>
              <line x1="14" y1="36" x2="126" y2="36" stroke="#334155"/>

              <g transform="translate(14, 48)">
                <text x="0" y="10" fill="#38BDF8" font-size="9" font-family="monospace">&bull; layer.shp</text>
                <text x="0" y="25" fill="#94A3B8" font-size="7.5">Geometry Vectors</text>

                <text x="0" y="45" fill="#818CF8" font-size="9" font-family="monospace">&bull; layer.shx</text>
                <text x="0" y="60" fill="#94A3B8" font-size="7.5">Spatial Index</text>

                <text x="0" y="80" fill="#34D399" font-size="9" font-family="monospace">&bull; layer.dbf</text>
                <text x="0" y="95" fill="#94A3B8" font-size="7.5">Attributes Table</text>

                <text x="0" y="115" fill="#F59E0B" font-size="9" font-family="monospace">&bull; layer.prj</text>
                <text x="0" y="127" fill="#94A3B8" font-size="7.5">WGS84 EPSG:4326</text>
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
          <svg viewBox="0 0 420 230" width="100%" height="230" xmlns="http://www.w3.org/2000/svg" style="background: linear-gradient(135deg, #090d16 0%, #0d2229 100%); border-radius: 6px;">
            <!-- Target Cell Bounds -->
            <g transform="translate(60, 45)">
              <rect width="160" height="130" fill="#0EA5E9" fill-opacity="0.1" stroke="#0EA5E9" stroke-width="2" stroke-dasharray="6 3"/>
              
              <!-- Crosshair Centroid -->
              <line x1="80" y1="20" x2="80" y2="110" stroke="#38BDF8" stroke-width="1.5"/>
              <line x1="30" y1="65" x2="130" y2="65" stroke="#38BDF8" stroke-width="1.5"/>
              <circle cx="80" cy="65" r="6" fill="#EF4444"/>
              <circle cx="80" cy="65" r="14" fill="none" stroke="#EF4444" stroke-width="1.5" stroke-dasharray="2 2"/>

              <text x="88" y="58" fill="#F87171" font-size="9" font-weight="bold" font-family="monospace">Centroid</text>

              <!-- Extents Labels -->
              <text x="45" y="-6" fill="#94A3B8" font-size="8" font-family="monospace">Lat Max: -6.1750°</text>
              <text x="45" y="142" fill="#94A3B8" font-size="8" font-family="monospace">Lat Min: -6.2150°</text>
              <text x="-48" y="70" fill="#94A3B8" font-size="8" font-family="monospace">Lon Min</text>
              <text x="168" y="70" fill="#94A3B8" font-size="8" font-family="monospace">Lon Max</text>
            </g>

            <!-- Decoded Data Preview Card -->
            <g transform="translate(255, 35)">
              <rect width="150" height="150" rx="5" fill="#0F172A" stroke="#0EA5E9" stroke-width="1.5"/>
              <rect x="0" y="0" width="150" height="26" rx="4" fill="#0284C7"/>
              <text x="10" y="18" fill="#FFFFFF" font-size="10" font-weight="bold" font-family="monospace">TOKEN: "qqguw5"</text>

              <text x="10" y="48" fill="#94A3B8" font-size="8.5" font-family="sans-serif">Decoded Centroid:</text>
              <text x="10" y="66" fill="#38BDF8" font-size="11" font-weight="bold" font-family="monospace">-6.195000°</text>
              <text x="10" y="82" fill="#38BDF8" font-size="11" font-weight="bold" font-family="monospace">106.828125°</text>

              <line x1="10" y1="94" x2="140" y2="94" stroke="#334155"/>
              <text x="10" y="112" fill="#A7F3D0" font-size="8" font-family="monospace">&plusmn; 0.02° Precision</text>
              <text x="10" y="126" fill="#E2E8F0" font-size="8" font-family="monospace">Area: ~4.9 &times; 4.9 km</text>
              <text x="10" y="140" fill="#64748B" font-size="7.5" font-family="monospace">WGS84 Geodetic Std</text>
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
          <svg viewBox="0 0 420 230" width="100%" height="230" xmlns="http://www.w3.org/2000/svg" style="background: linear-gradient(135deg, #090d16 0%, #1a1025 100%); border-radius: 6px;">
            <defs>
              <linearGradient id="purpleBarGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#9333EA"/>
                <stop offset="100%" stop-color="#C084FC"/>
              </linearGradient>
              <radialGradient id="targetGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#C084FC" stop-opacity="0.6"/>
                <stop offset="100%" stop-color="#9333EA" stop-opacity="0"/>
              </radialGradient>
            </defs>

            <!-- Coordinate Point on Earth Grid -->
            <g transform="translate(18, 20)">
              <rect width="174" height="190" rx="8" fill="#0B0F19" stroke="#2E1065" stroke-width="1.2"/>
              <circle cx="87" cy="80" r="60" fill="none" stroke="#6B21A8" stroke-width="1" stroke-dasharray="3 3"/>
              <circle cx="87" cy="80" r="42" fill="none" stroke="#9333EA" stroke-width="1" stroke-dasharray="2 2"/>
              <circle cx="87" cy="80" r="24" fill="url(#targetGlow)"/>
              <circle cx="87" cy="80" r="24" fill="none" stroke="#C084FC" stroke-width="1.2"/>
              <circle cx="87" cy="80" r="5" fill="#FAF5FF"/>
              <circle cx="87" cy="80" r="2" fill="#9333EA"/>

              <!-- Crosshairs -->
              <line x1="87" y1="15" x2="87" y2="145" stroke="#7E22CE" stroke-width="1" stroke-dasharray="2 2"/>
              <line x1="22" y1="80" x2="152" y2="80" stroke="#7E22CE" stroke-width="1" stroke-dasharray="2 2"/>

              <!-- Coordinate Badge -->
              <rect x="14" y="152" width="146" height="24" rx="4" fill="#1E1B4B" stroke="#4338CA" stroke-width="1"/>
              <text x="87" y="167" fill="#E0E7FF" font-size="8.5" font-weight="600" font-family="monospace" text-anchor="middle">-6.2088°, 106.8456°</text>
            </g>

            <!-- Encoding Pipeline Card -->
            <g transform="translate(204, 20)">
              <rect width="198" height="190" rx="8" fill="#0F172A" stroke="#4C1D95" stroke-width="1.2"/>
              <text x="14" y="24" fill="#FAF5FF" font-size="10.5" font-weight="bold" font-family="sans-serif">⚡ Geohash Pipeline</text>
              <line x1="14" y1="32" x2="184" y2="32" stroke="#334155" stroke-width="1"/>

              <!-- Precision Bar -->
              <text x="14" y="48" fill="#94A3B8" font-size="8.5" font-family="sans-serif">Precision Scale: Level 7 / 12</text>
              <rect x="14" y="54" width="170" height="6" rx="3" fill="#1E293B"/>
              <rect x="14" y="54" width="99" height="6" rx="3" fill="url(#purpleBarGrad)"/>

              <!-- Interleaved Base-32 Result Box -->
              <text x="14" y="78" fill="#94A3B8" font-size="8.5" font-family="sans-serif">Base-32 Geohash Token:</text>
              <rect x="14" y="84" width="170" height="34" rx="5" fill="#3B0764" stroke="#A855F7" stroke-width="1.2"/>
              <text x="99" y="106" fill="#FFFFFF" font-size="14" font-weight="bold" font-family="monospace" text-anchor="middle" letter-spacing="1.5">qqguw7k</text>

              <!-- Specs Box -->
              <rect x="14" y="126" width="170" height="52" rx="4" fill="#090D16" stroke="#1E293B" stroke-width="1"/>
              <text x="22" y="142" fill="#34D399" font-size="8.5" font-family="monospace">• Cell: ~153 × 153 m</text>
              <text x="22" y="156" fill="#94A3B8" font-size="8" font-family="monospace">• Bits: 35-bit Interleaved</text>
              <text x="22" y="169" fill="#94A3B8" font-size="8" font-family="monospace">• Datum: WGS84 Standard</text>
            </g>
          </svg>
        `
      }
    ];
  }

  render() {
    if (state.route && state.route !== 'dashboard') return;
    const slides = this.getSlides();

    this.container.innerHTML = `
      <!-- INTERACTIVE SHOWCASE SLIDESHOW -->
      <section class="dashboard-slideshow" id="dashboard-slideshow">
        <div class="slideshow-viewport">
          <div class="slideshow-track" id="slideshow-track">
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
          <a 
            href="/api/v1/templates/${tool.sample_template_id}/download" 
            class="rf-template-link" 
            download 
            title="Download sample template file"
            style="display: flex; align-items: center; gap: 4px; font-size: 0.8125rem; color: var(--color-text-secondary); text-decoration: none; font-weight: 500;"
          >
            <span>📥 Template</span>
          </a>
        </div>
      </div>
    `).join('');
  }
}
