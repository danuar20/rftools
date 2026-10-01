/**
 * RF TOOLS Reactive State Management & Router
 * Central store for workspace data, column mappings, and user preferences
 */

import { translate } from './i18n.js';

const STORAGE_PREFIX = 'rf_tools_mapping_';

export class AppState {
  constructor() {
    this.route = this.getHashRoute();
    this.tools = [];
    this.health = { ok: false, latency: 0, engines: {}, port: 5005 };
    const urlParams = typeof window !== 'undefined' && window.location ? new URLSearchParams(window.location.search) : null;
    const urlCollapsed = urlParams ? urlParams.get('collapsed') : null;
    if (urlCollapsed !== null) {
      this.sidebarCollapsed = urlCollapsed === 'true' || urlCollapsed === '1';
    } else {
      this.sidebarCollapsed = localStorage.getItem('rf_sidebar_collapsed') === 'true';
    }

    // Theme & Language
    this.theme = localStorage.getItem('rf_tools_theme') || 'light';
    this.lang = localStorage.getItem('rf_tools_lang') || 'en';
    this.dashboardSlide = 0;

    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', this.theme);
      document.documentElement.setAttribute('lang', this.lang);
    }

    // Tool workspaces storage
    this.workspaces = {
      'excel-to-kml': this.initWorkspace('excel-to-kml', {
        folderName: 'SITENAME',
        iconUrl: 'http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png',
        scale: 0.7,
        colorRgb: '#550000',
        labelColor: '#FFFF00',
      }),
      'prb-kml': this.initWorkspace('prb-kml', {
        colorByMetric: 'DL_PRB',
        opacityPercent: 40,
        includeLegend: true,
        extrude: true,
        sheetName: 'Sheet1',
        bands: [
          { name: 'LTE 700', altitude: 42, radius_m: 38, radius_km: 0.038, beamwidth: 65 },
          { name: 'LTE 900', altitude: 38, radius_m: 45, radius_km: 0.045, beamwidth: 65 },
          { name: 'LTE 1800', altitude: 34, radius_m: 60, radius_km: 0.060, beamwidth: 65 },
          { name: 'LTE 2100', altitude: 32, radius_m: 75, radius_km: 0.075, beamwidth: 65 },
          { name: 'LTE 2300', altitude: 30, radius_m: 100, radius_km: 0.100, beamwidth: 65 }
        ],
        ranges: {
          dl_t1: 35,
          dl_t2: 60,
          dl_t3: 75,
          dl_t4: 90,
          ul_t1: 35,
          ul_t2: 60,
          ul_t3: 75,
          ul_t4: 90,
          rrc_t1: 40,
          rrc_t2: 60,
          rrc_t3: 90,
          rrc_t4: 120,
          dl_high: 90,
          dl_mid: 75,
          ul_high: 90,
          ul_mid: 75,
          rrc_high: 120,
          rrc_mid: 90
        },
        logoPreset: 'telkominfra_puma',
        leftLogoUrl: '',
        rightLogoUrl: ''
      }),
      'isd-calculator': this.initWorkspace('isd-calculator', {
        nNearest: 1,
        distanceUnit: 'km',
        namePrefix: 'ISD_Result'
      }),
      'geohash-to-shp': this.initWorkspace('geohash-to-shp', {
        mode: 'default',
        sizeM: 500
      }),
      'geohash-to-latlon': this.initWorkspace('geohash-to-latlon', {
        outputFormat: 'xlsx',
        precision: 6
      }),
      'latlon-to-geohash': this.initWorkspace('latlon-to-geohash', {
        precision: 7,
        outputFormat: 'xlsx'
      }),
      'geohash-converter': this.initWorkspace('geohash-converter', {
        geohash: 'qqguygv',
        latitude: -6.175392,
        longitude: 106.827153,
        precision: 7
      }),
      'coverage-simulation': this.initWorkspace('coverage-simulation', {
        antenna_height: 30.0,
        mechanical_tilt: 3.0,
        electrical_tilt: 6.0,
        v_beamwidth: 10.0,
        h_beamwidth: 65.0,
        frequency: 2100.0,
        elevation: 0.0
      }),
      'okumura-hata': this.initWorkspace('okumura-hata', {
        frequency: 2100.0,
        hb: 30.0,
        hm: 1.5,
        tx_power: 43.0,
        gain: 18.0,
        cable_loss: 2.0,
        rx_sensitivity: -102.0,
        elec_tilt: 6.0,
        mech_tilt: 3.0,
        v_beamwidth: 10.0,
        h_beamwidth: 65.0,
        env_type: 'urban'
      }),
      'nettilt-3d': this.initWorkspace('nettilt-3d', {
        tower_height: 35.0,
        user_height: 1.5,
        delta_h: 0.0,
        target_distance: 500.0,
        mechanical_tilt: 2.0,
        electrical_tilt: 4.0,
        v_beamwidth: 8.0,
        h_beamwidth: 65.0
      }),
      'nettilt3d': this.initWorkspace('nettilt3d', {
        tower_height: 35.0,
        user_height: 1.5,
        delta_h: 0.0,
        target_distance: 500.0,
        mechanical_tilt: 2.0,
        electrical_tilt: 4.0,
        v_beamwidth: 8.0,
        h_beamwidth: 65.0
      })
    };

    this.listeners = [];

    window.addEventListener('hashchange', () => {
      this.route = this.getHashRoute();
      this.emit('route-change', this.route);
    });
  }

  getHashRoute() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    return hash;
  }

  setRoute(newRoute) {
    window.location.hash = newRoute;
  }

  initWorkspace(toolId, defaultParams) {
    const savedMappings = this.loadSavedMappings(toolId);
    return {
      toolId,
      file: null,
      fileA: null, // For ISD
      fileB: null, // For ISD
      inspection: null,
      inspectionA: null, // For ISD
      inspectionB: null, // For ISD
      mappings: savedMappings || {},
      mappingsA: {}, // For ISD
      mappingsB: {}, // For ISD
      params: { ...defaultParams },
      previewData: null,
      resultSummary: null,
      isInspecting: false,
      isExecuting: false,
      error: null,
      lastExecutionTimeMs: null
    };
  }

  loadSavedMappings(toolId) {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}${toolId}`);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  }

  saveMappings(toolId, mappings) {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${toolId}`, JSON.stringify(mappings));
    } catch (e) {}
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  emit(event, data) {
    this.listeners.forEach(fn => {
      try {
        fn(event, data);
      } catch (err) {
        console.error(`Error in state listener for event "${event}":`, err);
      }
    });
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    localStorage.setItem('rf_sidebar_collapsed', String(this.sidebarCollapsed));
    this.emit('sidebar-toggle', this.sidebarCollapsed);
  }

  setSidebarCollapsed(collapsed) {
    this.sidebarCollapsed = Boolean(collapsed);
    localStorage.setItem('rf_sidebar_collapsed', String(this.sidebarCollapsed));
    this.emit('sidebar-toggle', this.sidebarCollapsed);
  }

  setTheme(theme) {
    this.theme = theme;
    localStorage.setItem('rf_tools_theme', theme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    this.emit('theme-change', theme);
  }

  toggleTheme() {
    const nextTheme = this.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
  }

  setLanguage(lang) {
    this.lang = lang;
    localStorage.setItem('rf_tools_lang', lang);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', lang);
    }
    this.emit('language-change', lang);
  }

  t(key, fallback = '') {
    return translate(this.lang, key, fallback);
  }
}


export const state = new AppState();
