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
    this.sidebarCollapsed = localStorage.getItem('rf_sidebar_collapsed') === 'true';

    // Theme & Language
    this.theme = localStorage.getItem('rf_tools_theme') || 'dark';
    this.lang = localStorage.getItem('rf_tools_lang') || 'en';

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
          dl_high: 90,
          dl_mid: 80,
          ul_high: 70,
          ul_mid: 50,
          rrc_high: 100,
          rrc_mid: 50
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
    this.listeners.forEach(fn => fn(event, data));
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
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
