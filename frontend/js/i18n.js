/**
 * RF TOOLS Internationalization (i18n) Module
 * Supports English (en) and Indonesian (id)
 */

export const translations = {
  en: {
    // Shell & Branding
    app_title: 'RF Tools-Telco',
    app_subtitle: 'Engineering Suite',
    system_ready: 'System Ready',
    system_offline: 'Offline',
    search_placeholder: 'Search tools... (Ctrl+K)',
    toggle_sidebar: 'Toggle Sidebar (Ctrl+B)',
    toggle_theme: 'Switch theme',
    toggle_lang: 'Switch language',
    theme_dark: 'Dark',
    theme_light: 'Light',
    lang_en: 'EN',
    lang_id: 'ID',

    // Navigation
    nav_overview: 'Overview',
    nav_dashboard: 'Dashboard',
    nav_tools: 'Tools Dictionary',
    nav_kml: 'KML & Visualization',
    nav_topology: 'Topology & Distance',
    nav_gis: 'Geospatial & Geohash',
    nav_about: 'About',

    // Hero & Stats
    hero_title: 'RF Engineering Suite',
    hero_subtitle: 'High-precision RF planning, 3D antenna visualization, and geospatial analysis.',
    stat_engines_value: '6 Engines',
    stat_engines_label: 'Calculation Modules',
    stat_crs_value: 'EPSG:4326',
    stat_crs_label: 'WGS84 Geodetic Standard',
    stat_verified_value: 'Production Ready',
    stat_verified_label: 'Verified Algorithms',

    // Dashboard Filters
    filter_all: 'All Tools (6)',
    filter_kml: 'KML & Visualization',
    filter_topology: 'Topology & Distance',
    filter_gis: 'Geospatial & Geohash',
    search_tools_input: 'Filter tools by name or keyword...',
    no_tools_found: 'No tools match your filter or search.',

    // Common Buttons & Actions
    btn_launch: 'Launch Tool →',
    btn_template: 'Template',
    btn_download_template: 'Download Template (.xlsx)',
    btn_download_result: 'Download Output',
    btn_execute: 'Execute Calculation',
    btn_executing: 'Processing...',
    btn_load_sample: 'Load Sample Data',
    btn_inspect: 'Inspect File',
    btn_browse: 'Browse File',
    btn_close: 'Close',
    btn_apply: 'Apply',
    btn_reset: 'Reset',
    btn_copy: 'Copy',

    // Workspace Zones
    zone1_title: '1. Ingestion',
    zone1_drop_title: 'Drop your spreadsheet here',
    zone1_drop_subtitle: 'or click to browse (.xlsx, .xls, .csv)',
    zone1_file_loaded: 'File Loaded',
    zone1_change_file: 'Change File',
    zone1_sheet_select: 'Select Sheet:',
    zone1_file_a: 'Primary Site Dataset (Sheet A)',
    zone1_file_b: 'Neighbor Site Dataset (Sheet B)',

    zone2_title: '2. Column Mapping',
    zone2_subtitle: 'Reactive parameter binding with heuristic detection.',
    zone2_unmapped: '-- Select Column --',
    zone2_required_badge: 'Required',
    zone2_optional_badge: 'Optional',
    confidence_high: 'High Confidence',
    confidence_medium: 'Medium Confidence',
    confidence_low: 'Low Confidence',
    confidence_manual: 'User Specified',

    zone3_title: '3. Parameters & Styling',
    zone3_subtitle: 'Tune calculation settings and presentation options.',

    zone4_title: '4. Output & Preview',
    zone4_subtitle: 'Live data preview and direct artifact export.',
    zone4_empty_title: 'No Output Generated Yet',
    zone4_empty_desc: 'Upload your dataset, verify column mappings, and click Execute Calculation.',
    zone4_completed: 'Calculation Successful',
    zone4_records: 'records generated',
    zone4_elapsed: 'Elapsed:',
    zone4_preview_tab: 'Data Preview',
    zone4_summary_tab: 'Summary Statistics',

    // Tool Specific Titles & Descriptions
    tool_excel_to_kml_title: 'Excel to Point KML Placemark',
    tool_excel_to_kml_desc: 'Convert tabular site coordinates into styled Google Earth placemark KML files with custom icons, colors, and folders.',
    
    tool_prb_kml_title: 'Excel to PRB 3D Sector Polygon',
    tool_prb_kml_desc: 'Generate 3D antenna sector polygons color-coded by PRB utilization, RRC connected users, and band altitudes.',

    tool_isd_calculator_title: 'Inter-Site Distance (ISD) Calculator',
    tool_isd_calculator_desc: 'Calculate high-precision geodesic Haversine distances between site datasets and identify N-nearest neighbors.',

    tool_geohash_to_shp_title: 'Geohash to ESRI Shapefile',
    tool_geohash_to_shp_desc: 'Transform geohash records into vector polygon shapefiles (.zip archive with .shp, .shx, .dbf, .prj).',

    tool_geohash_to_latlon_title: 'Geohash to Centroid Lat/Long',
    tool_geohash_to_latlon_desc: 'Decode geohash string tokens into WGS84 decimal latitude and longitude centroid coordinates.',

    tool_latlon_to_geohash_title: 'Lat/Long to Geohash Encoder',
    tool_latlon_to_geohash_desc: 'Encode geographic coordinates into standardized geohash tokens with selectable precision (1-12).',

    // Toast & Alerts
    toast_template_downloading: 'Downloading sample template...',
    toast_template_saved: 'Template downloaded successfully',
    toast_template_failed: 'Failed to download template',
    toast_executing: 'Running engineering engine...',
    toast_success: 'Operation completed successfully',
    toast_error: 'Calculation failed'
  },

  id: {
    // Shell & Branding
    app_title: 'RF Tools-Telco',
    app_subtitle: 'Suite Rekayasa',
    system_ready: 'Sistem Siap',
    system_offline: 'Terputus',
    search_placeholder: 'Cari alat... (Ctrl+K)',
    toggle_sidebar: 'Bilah Sisi (Ctrl+B)',
    toggle_theme: 'Ganti tema',
    toggle_lang: 'Ganti bahasa',
    theme_dark: 'Gelap',
    theme_light: 'Terang',
    lang_en: 'EN',
    lang_id: 'ID',

    // Navigation
    nav_overview: 'Ikhtisar',
    nav_dashboard: 'Dasbor',
    nav_tools: 'Kamus Alat',
    nav_kml: 'KML & Visualisasi',
    nav_topology: 'Topologi & Jarak',
    nav_gis: 'Geospasial & Geohash',
    nav_about: 'Tentang',

    // Hero & Stats
    hero_title: 'Suite Rekayasa RF',
    hero_subtitle: 'Perencanaan RF presisi tinggi, visualisasi antena 3D, dan analisis geospasial.',
    stat_engines_value: '6 Modul',
    stat_engines_label: 'Mesin Perhitungan',
    stat_crs_value: 'EPSG:4326',
    stat_crs_label: 'Standar Geodesi WGS84',
    stat_verified_value: 'Siap Produksi',
    stat_verified_label: 'Algoritma Terverifikasi',

    // Dashboard Filters
    filter_all: 'Semua Alat (6)',
    filter_kml: 'KML & Visualisasi',
    filter_topology: 'Topologi & Jarak',
    filter_gis: 'Geospasial & Geohash',
    search_tools_input: 'Cari alat berdasarkan nama atau kata kunci...',
    no_tools_found: 'Tidak ada alat yang sesuai dengan pencarian.',

    // Common Buttons & Actions
    btn_launch: 'Buka Alat →',
    btn_template: 'Templat',
    btn_download_template: 'Unduh Templat (.xlsx)',
    btn_download_result: 'Unduh Hasil',
    btn_execute: 'Jalankan Perhitungan',
    btn_executing: 'Memproses...',
    btn_load_sample: 'Gunakan Data Sampel',
    btn_inspect: 'Periksa File',
    btn_browse: 'Pilih File',
    btn_close: 'Tutup',
    btn_apply: 'Terapkan',
    btn_reset: 'Atur Ulang',
    btn_copy: 'Salin',

    // Workspace Zones
    zone1_title: '1. Masukan Data',
    zone1_drop_title: 'Tarik & lepas spreadsheet ke sini',
    zone1_drop_subtitle: 'atau klik untuk memilih file (.xlsx, .xls, .csv)',
    zone1_file_loaded: 'File Berhasil Dimuat',
    zone1_change_file: 'Ganti File',
    zone1_sheet_select: 'Pilih Lembar Kerja:',
    zone1_file_a: 'Data Site Utama (Lembar A)',
    zone1_file_b: 'Data Site Tetangga (Lembar B)',

    zone2_title: '2. Pemetaan Kolom',
    zone2_subtitle: 'Penetapan parameter reaktif dengan deteksi heuristik otomatis.',
    zone2_unmapped: '-- Pilih Kolom --',
    zone2_required_badge: 'Wajib',
    zone2_optional_badge: 'Opsional',
    confidence_high: 'Keyakinan Tinggi',
    confidence_medium: 'Keyakinan Sedang',
    confidence_low: 'Keyakinan Rendah',
    confidence_manual: 'Pilihan Pengguna',

    zone3_title: '3. Parameter & Gaya',
    zone3_subtitle: 'Sesuaikan konfigurasi perhitungan dan opsi visualisasi.',

    zone4_title: '4. Hasil & Pratinjau',
    zone4_subtitle: 'Pratinjau data interaktif dan unduhan langsung.',
    zone4_empty_title: 'Belum Ada Hasil',
    zone4_empty_desc: 'Unggah file data, periksa pemetaan kolom, lalu klik Jalankan Perhitungan.',
    zone4_completed: 'Perhitungan Berhasil',
    zone4_records: 'baris data dihasilkan',
    zone4_elapsed: 'Waktu:',
    zone4_preview_tab: 'Pratinjau Data',
    zone4_summary_tab: 'Statistik Ringkasan',

    // Tool Specific Titles & Descriptions
    tool_excel_to_kml_title: 'Excel ke KML Placemark Titik',
    tool_excel_to_kml_desc: 'Konversi koordinat tabel menjadi file KML Google Earth dengan kustomisasi ikon, warna, dan folder bertingkat.',

    tool_prb_kml_title: 'Excel ke KML Sektor 3D PRB',
    tool_prb_kml_desc: 'Hasilkan polygon sektor antena 3D bertingkat berdasarkan beban utilisasi PRB, pengguna RRC, dan ketinggian band.',

    tool_isd_calculator_title: 'Kalkulator Jarak Antar Site (ISD)',
    tool_isd_calculator_desc: 'Hitung jarak geodesik Haversine presisi tinggi antar site dan tentukan N-tetangga terdekat.',

    tool_geohash_to_shp_title: 'Geohash ke ESRI Shapefile',
    tool_geohash_to_shp_desc: 'Konversi data geohash menjadi paket shapefile polygon GIS (.zip berisi .shp, .shx, .dbf, .prj).',

    tool_geohash_to_latlon_title: 'Geohash ke Lat/Long Centroid',
    tool_geohash_to_latlon_desc: 'Dekode token geohash menjadi koordinat titik tengah latitude dan longitude desimal WGS84.',

    tool_latlon_to_geohash_title: 'Lat/Long ke Geohash Encoder',
    tool_latlon_to_geohash_desc: 'Enkode koordinat geografis menjadi token geohash standar dengan pilihan presisi (1-12).',

    // Toast & Alerts
    toast_template_downloading: 'Mengunduh templat sampel...',
    toast_template_saved: 'Templat berhasil diunduh',
    toast_template_failed: 'Gagal mengunduh templat',
    toast_executing: 'Menjalankan mesin perhitungan...',
    toast_success: 'Operasi berhasil diselesaikan',
    toast_error: 'Perhitungan gagal'
  }
};

export function translate(lang, key, fallback = '') {
  const currentLang = translations[lang] || translations.en;
  if (currentLang && currentLang[key] !== undefined) {
    return currentLang[key];
  }
  if (translations.en && translations.en[key] !== undefined) {
    return translations.en[key];
  }
  return fallback || key;
}
