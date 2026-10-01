/**
 * 4-Zone Workspace Component for RF TOOLS
 * Implements Zone 1 (Ingestion), Zone 2 (Mapping), Zone 3 (Parameters), Zone 4 (Results Preview)
 */

import { state } from '../state.js';
import { ApiService } from '../api.js';
import { toast } from './toast.js';
import {
  decode as ghDecode,
  encode as ghEncode,
  getNeighbors as ghGetNeighbors,
  toBitRepresentation as ghToBitRep,
  isValidGeohash as ghIsValid,
  PRECISION_META,
  BASE32
} from '../utils/geohash.js';

export class WorkspaceComponent {
  constructor(container, toolId) {
    this.container = container;
    this.toolId = toolId;
    this.ws = state.workspaces[toolId] || (toolId === 'nettilt3d' ? state.workspaces['nettilt-3d'] : null);
    if (!this.ws) {
      this.ws = state.initWorkspace ? state.initWorkspace(toolId, {}) : { params: {} };
    }
    this.activeSheetTab = 'result'; // For ISD dual sheet preview
    this.activeCovTab = 'elevation'; // For coverage simulation tab
    this.activeOhTab = 'curve'; // For Okumura Hata tab
    this.activeTiltTab = 'perspective'; // For NetTilt 3D tab
    this.render();

    this.unsubscribe = state.subscribe((event) => {
      const isRouteMatch = state.route === `tool-${this.toolId}` ||
        (this.toolId === 'nettilt3d' && state.route === 'tool-nettilt-3d') ||
        (this.toolId === 'nettilt-3d' && state.route === 'tool-nettilt3d');
      if (!isRouteMatch) return;
      if (event === 'language-change' || event === 'theme-change') {
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

  getToolMeta() {
    const metaMap = {
      'excel-to-kml': {
        title: state.t('tool_excel_to_kml_title'),
        category: state.t('nav_kml'),
        icon: 'tool-excel-to-kml.svg',
        description: state.t('tool_excel_to_kml_desc'),
        sample_template_id: 'point_kml',
        outputExt: 'kml'
      },
      'prb-kml': {
        title: state.t('tool_prb_kml_title'),
        category: state.t('nav_kml'),
        icon: 'tool-prb-kml.svg',
        description: state.t('tool_prb_kml_desc'),
        sample_template_id: 'prb_kml',
        outputExt: 'kml'
      },
      'isd-calculator': {
        title: state.t('tool_isd_calculator_title'),
        category: state.t('nav_topology'),
        icon: 'tool-isd-calculator.svg',
        description: state.t('tool_isd_calculator_desc'),
        sample_template_id: 'isd_a',
        outputExt: 'xlsx'
      },
      'coverage-simulation': {
        title: state.t('tool_coverage_simulation_title', 'Coverage Simulation'),
        category: state.t('nav_coverage', 'Coverage'),
        icon: 'tool-coverage-simulation.svg',
        description: state.t('tool_coverage_simulation_desc', 'Calculate RF antenna down-tilt coverage footprint, beam edges, and ground coverage area.'),
        sample_template_id: null,
        outputExt: 'json'
      },
      'okumura-hata': {
        title: state.t('tool_okumura_hata_title', 'Okumura-Hata Model'),
        category: state.t('nav_coverage', 'Coverage'),
        icon: 'tool-okumura-hata.svg',
        description: state.t('tool_okumura_hata_desc', 'Empirical propagation loss model and maximum allowable path loss (MAPL) coverage radius estimation.'),
        sample_template_id: null,
        outputExt: 'json'
      },
      'nettilt-3d': {
        title: state.t('tool_nettilt_3d_title', 'NetTilt 3D'),
        category: state.t('nav_coverage', 'Coverage'),
        icon: 'tool-nettilt-3d.svg',
        description: state.t('tool_nettilt_3d_desc', '3D antenna downtilt optimization, boresight ground impact, and vertical radiation geometry.'),
        sample_template_id: null,
        outputExt: 'json'
      },
      'nettilt3d': {
        title: state.t('tool_nettilt3d_title', 'NetTilt 3D'),
        category: state.t('nav_coverage', 'Coverage'),
        icon: 'tool-nettilt-3d.svg',
        description: state.t('tool_nettilt3d_desc', '3D antenna downtilt optimization, boresight ground impact, and vertical radiation geometry.'),
        sample_template_id: null,
        outputExt: 'json'
      },
      'geohash-to-shp': {
        title: state.t('tool_geohash_to_shp_title'),
        category: state.t('nav_gis'),
        icon: 'tool-geohash-to-shp.svg',
        description: state.t('tool_geohash_to_shp_desc'),
        sample_template_id: 'geohash',
        outputExt: 'zip'
      },
      'geohash-to-latlon': {
        title: state.t('tool_geohash_to_latlon_title'),
        category: state.t('nav_gis'),
        icon: 'tool-geohash-to-latlon.svg',
        description: state.t('tool_geohash_to_latlon_desc'),
        sample_template_id: 'geohash',
        outputExt: 'xlsx'
      },
      'latlon-to-geohash': {
        title: state.t('tool_latlon_to_geohash_title'),
        category: state.t('nav_gis'),
        icon: 'tool-latlon-to-geohash.svg',
        description: state.t('tool_latlon_to_geohash_desc'),
        sample_template_id: 'latlon',
        outputExt: 'xlsx'
      },
      'geohash-converter': {
        title: state.t('tool_geohash_converter_title', 'Geohash Converter'),
        category: state.t('nav_gis', 'Geospatial & Geohash'),
        icon: 'tool-geohash-converter.svg',
        description: state.t('tool_geohash_converter_desc', 'Instant bidirectional conversion between GeoHash strings and Lat/Lng coordinates with precision control and boundary inspection.'),
        sample_template_id: null,
        outputExt: 'json'
      }
    };

    return metaMap[this.toolId] || { title: this.toolId, category: 'Tool', icon: 'rf-logo.svg', sample_template_id: 'point_kml', outputExt: 'xlsx' };
  }

  render() {
    const isMatchingRoute = state.route === `tool-${this.toolId}` ||
      (this.toolId === 'nettilt3d' && state.route === 'tool-nettilt-3d') ||
      (this.toolId === 'nettilt-3d' && state.route === 'tool-nettilt3d');
    if (!isMatchingRoute) return;
    if (this.toolId === 'geohash-converter') {
      this.renderGeohashConverter();
      return;
    }
    if (this.toolId === 'coverage-simulation') {
      this.renderCoverageSimulation();
      return;
    }
    if (this.toolId === 'okumura-hata') {
      this.renderOkumuraHata();
      return;
    }
    if (this.toolId === 'nettilt-3d' || this.toolId === 'nettilt3d') {
      this.renderNetTilt3D();
      return;
    }
    const meta = this.getToolMeta();
    const isISD = this.toolId === 'isd-calculator';

    this.container.innerHTML = `
      <div class="workspace-container">
        <!-- WORKSPACE TOOLBAR HEADER -->
        <header class="workspace-header-bar">
          <div class="workspace-title-group">
            <div class="workspace-icon-box">
              <img src="/assets/icons/${meta.icon}" alt="${meta.title}">
            </div>
            <div>
              <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                <h1 class="workspace-title">${meta.title}</h1>
                <span class="zone-badge">CRS EPSG:4326</span>
              </div>
              <p class="workspace-desc">${meta.description}</p>
            </div>
          </div>

          <div class="workspace-header-actions">
            <button class="rf-btn rf-btn-secondary" id="ws-download-template-btn" title="Download official sample template">
              <span>📥 ${state.t('btn_download_template')}</span>
            </button>
            <button class="rf-btn rf-btn-ghost" id="ws-formula-guide-btn" title="View math formulae &amp; specifications">
              <span>📖 Guide</span>
            </button>
            <button class="rf-btn rf-btn-ghost" id="ws-reset-btn" title="Reset workspace form">
              <span>🔄 ${state.t('btn_reset')}</span>
            </button>
          </div>
        </header>

        <!-- ZONE 1: INGESTION DROPZONE -->
        <section class="zone-card">
          <div class="zone-header">
            <span class="zone-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--color-primary);margin-right:6px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>${state.t('zone1_title')}
            </span>
            <span class="zone-badge" id="zone1-status-badge">
              ${isISD ? (this.ws.fileA && this.ws.fileB ? state.t('zone1_file_loaded') : 'Awaiting 2 Files') : (this.ws.file ? state.t('zone1_file_loaded') : 'Awaiting File')}
            </span>
          </div>
          <div class="zone-body" id="zone1-dropzone-container">
            ${this.renderDropzoneContent()}
          </div>
        </section>

        <!-- ZONE 2 & ZONE 3 SPLIT GRID -->
        <div class="workspace-split-grid">
          <!-- ZONE 2: COLUMN MAPPING FORM -->
          <section class="zone-card">
            <div class="zone-header">
              <span class="zone-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--color-primary);margin-right:6px;"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>${state.t('zone2_title')}
              </span>
              <div style="display: flex; gap: 8px; align-items: center;">
                <button class="rf-btn rf-btn-ghost" id="reset-mappings-btn" style="padding: 2px 8px; font-size: 0.75rem;" title="Restore initial detected matches">
                  ↺ ${state.t('btn_reset')}
                </button>
                <span class="rf-confidence-pill rf-confidence-pill--high" id="mapping-count-pill">
                  ${this.getMappingStatusPill()}
                </span>
              </div>
            </div>
            <div class="zone-body" id="zone2-mapping-container">
              ${this.renderMappingContent()}
            </div>
          </section>

          <!-- ZONE 3: PARAMETERS & PHYSICS -->
          <section class="zone-card">
            <div class="zone-header">
              <span class="zone-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--color-primary);margin-right:6px;"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>${state.t('zone3_title')}
              </span>
              <span class="zone-badge">Config</span>
            </div>
            <div class="zone-body" id="zone3-params-container">
              ${this.renderParamsContent()}
            </div>
          </section>
        </div>

        <!-- STICKY ACTION BAR -->
        <div class="sticky-action-bar">
          <div class="action-bar-status">
            <span id="action-bar-validation-msg">
              ${this.getValidationStatusText()}
            </span>
          </div>
          <div class="action-bar-buttons">
            <button class="rf-btn rf-btn-secondary" id="action-preview-btn" ${this.canCalculate() ? '' : 'disabled'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>${state.t('zone4_preview_tab')}</span>
            </button>
            <button class="rf-btn rf-btn-primary" id="action-execute-btn" ${this.canCalculate() ? '' : 'disabled'}>
              <span id="action-execute-spinner" class="spinner" style="display: none;"></span>
              <span id="action-execute-text">${state.t('btn_execute')}</span>
            </button>
          </div>
        </div>

        <!-- ZONE 4: RESULTS & DATA PREVIEW -->
        <section class="zone-card" id="zone4-results-card" style="${this.ws.previewData || this.ws.resultSummary ? '' : 'display: none;'}">
          <div class="zone-header">
            <span class="zone-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--color-primary);margin-right:6px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>${state.t('zone4_title')}
            </span>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button class="rf-btn rf-btn-ghost" id="results-copy-btn" style="padding: 3px 10px; font-size: 0.75rem;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>${state.t('btn_copy')}
              </button>
              <button class="rf-btn rf-btn-ghost" id="results-fullscreen-btn" style="padding: 3px 10px; font-size: 0.75rem;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>Fullscreen
              </button>
            </div>
          </div>
          <div class="zone-body results-zone" id="zone4-results-body">
            ${this.renderResultsContent()}
          </div>
        </section>
      </div>

      <!-- Formula Modal -->
      <div class="modal-overlay" id="formula-modal-overlay">
        <div class="command-palette" style="width: 720px; max-height: 85vh; display: flex; flex-direction: column;">
          <div class="command-palette__input-wrap" style="justify-content: space-between;">
            <div style="font-weight: 700; color: var(--color-text-primary); font-size: 1.1rem;">
              📖 Calculation Formula &amp; Engineering Specification
            </div>
            <button class="rf-btn rf-btn-ghost" id="formula-modal-close" style="padding: 4px 8px;">&times;</button>
          </div>
          <div style="padding: 24px; overflow-y: auto; font-size: 0.875rem; color: var(--color-text-secondary); line-height: 1.6;">
            ${this.renderFormulaGuideText()}
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  renderDropzoneContent() {
    if (this.toolId === 'isd-calculator') {
      return `
        <div class="rf-dropzone-dual">
          <!-- File A Dropzone -->
          <div>
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--color-primary); margin-bottom: 8px; text-transform: uppercase;">
              ${state.t('zone1_file_a')}
            </div>
            ${this.ws.fileA ? this.renderLoadedChip('A', this.ws.fileA, this.ws.inspectionA) : this.renderEmptyDropzone('A')}
          </div>

          <!-- File B Dropzone -->
          <div>
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--color-accent-indigo); margin-bottom: 8px; text-transform: uppercase;">
              ${state.t('zone1_file_b')}
            </div>
            ${this.ws.fileB ? this.renderLoadedChip('B', this.ws.fileB, this.ws.inspectionB) : this.renderEmptyDropzone('B')}
          </div>
        </div>
        <div style="margin-top: 14px; display: flex; justify-content: flex-end; gap: 8px;">
          <button class="rf-btn rf-btn-secondary" id="load-sample-isd-btn" style="padding: 6px 14px; font-size: 0.8125rem;">
            <span>📄 ${state.t('btn_load_sample')}</span>
          </button>
        </div>
      `;
    }

    if (this.ws.file) {
      return `
        ${this.renderLoadedChip('single', this.ws.file, this.ws.inspection)}
      `;
    }

    return `
      ${this.renderEmptyDropzone('single')}
      <div style="margin-top: 14px; display: flex; justify-content: flex-end; gap: 8px;">
        <button class="rf-btn rf-btn-secondary" id="load-sample-data-btn" style="padding: 6px 14px; font-size: 0.8125rem;">
          <span>📄 ${state.t('btn_load_sample')}</span>
        </button>
      </div>
    `;
  }

  renderEmptyDropzone(id) {
    return `
      <div class="rf-dropzone" id="dropzone-${id}">
        <input type="file" id="file-input-${id}" accept=".xlsx,.xls,.csv" style="display: none;">
        <svg class="rf-dropzone__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <div class="rf-dropzone__title">${state.t('zone1_drop_title')}</div>
        <div class="rf-dropzone__desc">${state.t('zone1_drop_subtitle')}</div>
        <div class="rf-dropzone__formats">
          <span class="rf-dropzone__format-pill">.XLSX</span>
          <span class="rf-dropzone__format-pill">.XLS</span>
          <span class="rf-dropzone__format-pill">.CSV</span>
        </div>
      </div>
    `;
  }

  renderLoadedChip(id, file, inspection) {
    const ext = (file.name.split('.').pop() || 'FILE').toUpperCase();
    const sizeKb = Math.round(file.size / 1024);
    const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
    const rowCount = inspection ? inspection.total_rows : '...';
    const colCount = inspection ? inspection.total_columns : '...';

    return `
      <div class="rf-dropzone-chip">
        <div class="rf-dropzone-chip__meta">
          <span class="rf-dropzone-chip__format">${ext}</span>
          <div>
            <div class="rf-dropzone-chip__name">${file.name}</div>
            <div class="rf-dropzone-chip__stats">
              <span>${sizeStr}</span>
              <span>&bull;</span>
              <span class="rf-tabular-nums">${rowCount} rows &times; ${colCount} cols</span>
              ${inspection && inspection.sheets && inspection.sheets.length > 1 ? `
                <span>&bull;</span>
                <select class="rf-mapping-select sheet-selector" data-target="${id}" style="width: auto; padding: 2px 24px 2px 8px; font-size: 0.75rem;">
                  ${inspection.sheets.map(sh => `<option ${sh === inspection.active_sheet ? 'selected' : ''}>${sh}</option>`).join('')}
                </select>
              ` : ''}
            </div>
          </div>
        </div>
        <div class="rf-dropzone-chip__actions">
          <input type="file" id="replace-input-${id}" accept=".xlsx,.xls,.csv" style="display: none;">
          <button class="rf-btn rf-btn-secondary replace-file-btn" data-target="${id}" style="padding: 5px 10px; font-size: 0.75rem;">
            <span>🔄 Replace</span>
          </button>
          <button class="rf-btn rf-btn-destructive remove-file-btn" data-target="${id}" style="padding: 5px 10px; font-size: 0.75rem;">
            <span>✕ Remove</span>
          </button>
        </div>
      </div>
    `;
  }

  getMappingRequirements() {
    switch (this.toolId) {
      case 'excel-to-kml':
        return {
          mandatory: [
            { key: 'lat_col', label: 'Latitude Coordinate', defaultRole: 'latitude', icon: '📍', required: true },
            { key: 'lon_col', label: 'Longitude Coordinate', defaultRole: 'longitude', icon: '📍', required: true }
          ],
          optional: [
            { key: 'name_col', label: 'Site Name / Label', defaultRole: 'site_name', icon: '🏷️', required: false }
          ]
        };
      case 'prb-kml':
        return {
          mandatory: [
            { key: 'lat', label: 'Latitude Coordinate (LAT)', defaultRole: 'latitude', icon: '📍', required: true },
            { key: 'lon', label: 'Longitude Coordinate (LONG)', defaultRole: 'longitude', icon: '📍', required: true },
            { key: 'azimuth', label: 'Azimuth Direction (0-360°)', defaultRole: 'azimuth', icon: '🧭', required: true },
            { key: 'beam', label: 'Beam / Carrier Band (LTE1800...)', defaultRole: 'beam', icon: '📡', required: true }
          ],
          optional: [
            { key: 'sitename', label: 'Site Name (SITENAME)', defaultRole: 'site_name', icon: '🏷️', required: false },
            { key: 'cellname', label: 'Cell Name (CELLNAME)', defaultRole: 'cell_name', icon: '📶', required: false },
            { key: 'dl_prb', label: 'DL PRB Utilization (%)', defaultRole: 'dl_prb', icon: '📊', required: false },
            { key: 'ul_prb', label: 'UL PRB Utilization (%)', defaultRole: 'ul_prb', icon: '📊', required: false },
            { key: 'rrc_user', label: 'RRC Connected Users', defaultRole: 'rrc_user', icon: '👥', required: false }
          ]
        };
      case 'isd-calculator':
        return {
          mandatoryA: [
            { key: 'lat_col_a', label: 'File A Latitude', defaultRole: 'latitude', icon: '📍', required: true },
            { key: 'lon_col_a', label: 'File A Longitude', defaultRole: 'longitude', icon: '📍', required: true }
          ],
          optionalA: [
            { key: 'name_col_a', label: 'File A Site ID / Name', defaultRole: 'site_name', icon: '🏷️', required: false }
          ],
          mandatoryB: [
            { key: 'lat_col_b', label: 'File B Latitude', defaultRole: 'latitude', icon: '📍', required: true },
            { key: 'lon_col_b', label: 'File B Longitude', defaultRole: 'longitude', icon: '📍', required: true }
          ],
          optionalB: [
            { key: 'name_col_b', label: 'File B Site ID / Name', defaultRole: 'site_name', icon: '🏷️', required: false }
          ]
        };
      case 'geohash-to-shp':
        return {
          mandatory: [
            { key: 'geohash_col', label: 'Geohash Token Column', defaultRole: 'geohash', icon: '🌐', required: true }
          ],
          optional: []
        };
      case 'geohash-to-latlon':
        return {
          mandatory: [
            { key: 'geohash_col', label: 'Geohash Token Column', defaultRole: 'geohash', icon: '🌐', required: true }
          ],
          optional: []
        };
      case 'latlon-to-geohash':
        return {
          mandatory: [
            { key: 'lat_col', label: 'Latitude Coordinate', defaultRole: 'latitude', icon: '📍', required: true },
            { key: 'lon_col', label: 'Longitude Coordinate', defaultRole: 'longitude', icon: '📍', required: true }
          ],
          optional: []
        };
      default:
        return { mandatory: [], optional: [] };
    }
  }

  renderMappingContent() {
    if (this.toolId === 'isd-calculator') {
      return this.renderISDMapping();
    }

    const inspection = this.ws.inspection;
    if (!inspection || !inspection.columns || inspection.columns.length === 0) {
      return `
        <div style="padding: 32px; text-align: center; color: var(--color-text-muted); font-size: 0.875rem;">
          <div style="font-size: 1.5rem; margin-bottom: 8px;">🎛️</div>
          <div>Upload a workbook in Zone 1 to auto-detect and map columns.</div>
        </div>
      `;
    }

    const reqs = this.getMappingRequirements();
    return `
      <div class="rf-mapping-group-title">Mandatory Target Fields</div>
      ${reqs.mandatory.map(field => this.renderMappingRow(field, inspection, 'single')).join('')}

      ${reqs.optional.length > 0 ? `
        <div class="rf-mapping-group-title">Optional Metadata Attributes</div>
        ${reqs.optional.map(field => this.renderMappingRow(field, inspection, 'single')).join('')}
      ` : ''}
    `;
  }

  renderISDMapping() {
    const reqs = this.getMappingRequirements();
    const inspA = this.ws.inspectionA;
    const inspB = this.ws.inspectionB;

    if (!inspA && !inspB) {
      return `
        <div style="padding: 32px; text-align: center; color: var(--color-text-muted); font-size: 0.875rem;">
          <div style="font-size: 1.5rem; margin-bottom: 8px;">🎛️</div>
          <div>Upload File A and File B in Zone 1 to configure coordinate mappings.</div>
        </div>
      `;
    }

    return `
      <div style="margin-bottom: 16px;">
        <div class="rf-mapping-group-title" style="color: var(--color-primary);">File A: Source Sites Mapping</div>
        ${inspA ? `
          ${reqs.mandatoryA.map(f => this.renderMappingRow(f, inspA, 'A')).join('')}
          ${reqs.optionalA.map(f => this.renderMappingRow(f, inspA, 'A')).join('')}
        ` : '<div style="font-size: 0.8125rem; color: var(--color-text-muted); padding: 8px 0;">Upload File A above</div>'}
      </div>

      <div>
        <div class="rf-mapping-group-title" style="color: var(--color-accent-indigo);">File B: Target Candidates Mapping</div>
        ${inspB ? `
          ${reqs.mandatoryB.map(f => this.renderMappingRow(f, inspB, 'B')).join('')}
          ${reqs.optionalB.map(f => this.renderMappingRow(f, inspB, 'B')).join('')}
        ` : '<div style="font-size: 0.8125rem; color: var(--color-text-muted); padding: 8px 0;">Upload File B above</div>'}
      </div>
    `;
  }

  renderMappingRow(field, inspection, fileTarget) {
    const columns = inspection.columns;
    const mappingStore = fileTarget === 'A' ? this.ws.mappingsA : fileTarget === 'B' ? this.ws.mappingsB : this.ws.mappings;
    
    // Auto match or load saved
    let selectedCol = mappingStore[field.key];
    if (!selectedCol) {
      // Find candidate by suggested role or alias
      const found = columns.find(c => c.suggested_role === field.defaultRole);
      if (found) {
        selectedCol = found.name;
      } else {
        // Fallback exact header match
        const exact = columns.find(c => c.name.toLowerCase() === field.key.toLowerCase());
        if (exact) selectedCol = exact.name;
      }
      if (selectedCol) {
        mappingStore[field.key] = selectedCol;
      }
    }

    // Get sample value
    const matchedColObj = columns.find(c => c.name === selectedCol);
    let sampleVal = 'None';
    let confidencePill = '<span class="rf-confidence-pill rf-confidence-pill--unmapped">Unassigned</span>';

    if (matchedColObj) {
      if (matchedColObj.sample_values && matchedColObj.sample_values.length > 0) {
        sampleVal = matchedColObj.sample_values[0];
      }
      if (matchedColObj.confidence >= 0.9) {
        confidencePill = '<span class="rf-confidence-pill rf-confidence-pill--high">100% Match</span>';
      } else if (matchedColObj.confidence > 0.5) {
        confidencePill = '<span class="rf-confidence-pill rf-confidence-pill--medium">Fuzzy Match</span>';
      } else {
        confidencePill = '<span class="rf-confidence-pill rf-confidence-pill--high" style="background-color: rgba(14,165,233,0.15); color: #0EA5E9; border-color: rgba(14,165,233,0.35);">Manual</span>';
      }
    } else if (field.required) {
      confidencePill = '<span class="rf-confidence-pill rf-confidence-pill--unmapped">Required</span>';
    }

    return `
      <div class="rf-mapping-row">
        <div class="rf-mapping-label">
          <span>${field.icon} ${field.label}</span>
          ${field.required ? '<span class="rf-mapping-label__required">*</span>' : ''}
        </div>
        <div class="rf-mapping-control-wrap">
          <select class="rf-mapping-select column-select" data-field="${field.key}" data-target="${fileTarget}">
            <option value="">-- Select Column --</option>
            ${columns.map(c => `
              <option value="${c.name}" ${c.name === selectedCol ? 'selected' : ''}>
                ${c.name} (${c.type})
              </option>
            `).join('')}
          </select>
          <div class="rf-sample-chip">Row 1 Sample: ${sampleVal}</div>
        </div>
        <div style="text-align: right;">
          ${confidencePill}
        </div>
      </div>
    `;
  }

  getMappingStatusPill() {
    const reqs = this.getMappingRequirements();
    if (this.toolId === 'isd-calculator') {
      const mandCount = reqs.mandatoryA.length + reqs.mandatoryB.length;
      let satisfied = 0;
      reqs.mandatoryA.forEach(f => { if (this.ws.mappingsA[f.key]) satisfied++; });
      reqs.mandatoryB.forEach(f => { if (this.ws.mappingsB[f.key]) satisfied++; });
      return `${satisfied}/${mandCount} Mapped`;
    }

    const mandCount = reqs.mandatory.length;
    let satisfied = 0;
    reqs.mandatory.forEach(f => { if (this.ws.mappings[f.key]) satisfied++; });
    return `${satisfied}/${mandCount} Mapped`;
  }

  getEffectiveLeftLogo(p) {
    if (p && p.logoPreset === 'rf_tools') {
      return '/assets/logos/rf_tools_logo_left.png';
    }
    if (p && p.logoPreset === 'custom' && p.leftLogoUrl && p.leftLogoUrl.trim()) {
      return p.leftLogoUrl.trim();
    }
    return 'https://raw.githubusercontent.com/danuar20/image/main/Infra.png';
  }

  getEffectiveRightLogo(p) {
    if (p && p.logoPreset === 'rf_tools') {
      return '/assets/logos/rf_tools_logo_right.png';
    }
    if (p && p.logoPreset === 'custom' && p.rightLogoUrl && p.rightLogoUrl.trim()) {
      return p.rightLogoUrl.trim();
    }
    return 'https://raw.githubusercontent.com/danuar20/image/main/PUMA.png';
  }

  renderParamsContent() {
    const p = this.ws.params;

    switch (this.toolId) {
      case 'excel-to-kml':
        return `
          <div class="rf-param-group">
            <div class="rf-param-header">
              <span class="rf-param-title">KML Folder Name</span>
              <span style="font-size: 0.75rem; color: var(--color-text-muted);">Organization</span>
            </div>
            <div class="rf-param-desc">Root folder tag in Google Earth hierarchy</div>
            <input type="text" class="rf-stepper-input" id="param-folder-name" value="${p.folderName || 'SITENAME'}" style="width: 100%; text-align: left;">
          </div>

          <div class="rf-param-group">
            <div class="rf-param-header">
              <span class="rf-param-title">Placemark Icon Scale</span>
              <span class="rf-tabular-nums" style="color: var(--color-primary);" id="scale-display">${p.scale || 0.7}x</span>
            </div>
            <div class="rf-param-desc">Symbol size scaling factor (0.1 to 3.0)</div>
            <div class="rf-slider-row">
              <input type="range" class="rf-slider" id="param-scale-slider" min="0.1" max="3.0" step="0.1" value="${p.scale || 0.7}">
              <input type="number" class="rf-stepper-input" id="param-scale-num" min="0.1" max="3.0" step="0.1" value="${p.scale || 0.7}">
            </div>
          </div>

          <div class="rf-param-group">
            <div class="rf-param-header">
              <span class="rf-param-title">Icon &amp; Label Colors (RGB)</span>
            </div>
            <div class="rf-param-desc">Placemark marker tint and site label text styling</div>
            <div style="display: flex; gap: 24px; align-items: center;">
              <div>
                <label style="font-size: 0.75rem; color: var(--color-text-secondary); display: block; margin-bottom: 4px;">Icon Color</label>
                <div class="rf-color-picker-row">
                  <input type="color" id="param-color-rgb" value="${p.colorRgb || '#550000'}" class="rf-color-swatch">
                  <input type="text" id="param-color-rgb-hex" value="${p.colorRgb || '#550000'}" class="rf-hex-input">
                </div>
              </div>
              <div>
                <label style="font-size: 0.75rem; color: var(--color-text-secondary); display: block; margin-bottom: 4px;">Label Color</label>
                <div class="rf-color-picker-row">
                  <input type="color" id="param-label-color" value="${p.labelColor || '#FFFF00'}" class="rf-color-swatch">
                  <input type="text" id="param-label-color-hex" value="${p.labelColor || '#FFFF00'}" class="rf-hex-input">
                </div>
              </div>
            </div>
          </div>
        `;

      case 'prb-kml':
        return `
          <div class="rf-param-group">
            <div class="rf-param-header">
              <span class="rf-param-title">Traffic Metric Color Driver</span>
              <span class="rf-confidence-pill rf-confidence-pill--high">Active Driver</span>
            </div>
            <div class="rf-param-desc">Select primary KPI to govern 3D sector threshold color matrix</div>
            <div class="rf-segmented-switch" style="width: 100%;">
              <button class="rf-segmented-item ${p.colorByMetric === 'DL_PRB' ? 'rf-segmented-item--active' : ''}" data-metric="DL_PRB" style="flex: 1;">DL PRB (%)</button>
              <button class="rf-segmented-item ${p.colorByMetric === 'UL_PRB' ? 'rf-segmented-item--active' : ''}" data-metric="UL_PRB" style="flex: 1;">UL PRB (%)</button>
              <button class="rf-segmented-item ${p.colorByMetric === 'RRC_USER' ? 'rf-segmented-item--active' : ''}" data-metric="RRC_USER" style="flex: 1;">RRC Users</button>
            </div>
          </div>

          <div class="rf-param-group">
            <div class="rf-param-header">
              <span class="rf-param-title">Polygon Fill Opacity</span>
              <span class="rf-tabular-nums" style="color: var(--color-primary);" id="opacity-display">${p.opacityPercent || 40}%</span>
            </div>
            <div class="rf-param-desc">Alpha transparency in Google Earth polygon rendering (10% to 100%)</div>
            <div class="rf-slider-row">
              <input type="range" class="rf-slider" id="param-opacity-slider" min="10" max="100" step="5" value="${p.opacityPercent || 40}">
              <input type="number" class="rf-stepper-input" id="param-opacity-num" min="10" max="100" step="5" value="${p.opacityPercent || 40}">
            </div>
          </div>

          <!-- Dual Header Logos Selection -->
          <div class="rf-param-group">
            <div class="rf-param-header">
              <span class="rf-param-title">Balloon Popup Dual Logos</span>
              <span style="font-size: 0.75rem; color: var(--color-text-muted);">Header Logos</span>
            </div>
            <div class="rf-param-desc">Select logo preset or specify custom image URLs for the 24-row balloon popup header</div>
            <div class="rf-segmented-switch" style="width: 100%; margin-bottom: 12px;">
              <button class="rf-segmented-item ${(!p.logoPreset || p.logoPreset === 'telkominfra_puma') ? 'rf-segmented-item--active' : ''}" data-logo-preset="telkominfra_puma" style="flex: 1;">TelkomInfra &amp; PUMA</button>
              <button class="rf-segmented-item ${p.logoPreset === 'rf_tools' ? 'rf-segmented-item--active' : ''}" data-logo-preset="rf_tools" style="flex: 1;">RF Tools Default</button>
              <button class="rf-segmented-item ${p.logoPreset === 'custom' ? 'rf-segmented-item--active' : ''}" data-logo-preset="custom" style="flex: 1;">Custom Logos</button>
            </div>
            <div id="custom-logo-inputs" style="${p.logoPreset === 'custom' ? '' : 'display: none;'} margin-bottom: 12px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                  <label style="font-size: 0.75rem; color: var(--color-text-secondary); display: block; margin-bottom: 4px;">Left Logo URL</label>
                  <input type="text" class="rf-stepper-input" id="param-left-logo-url" value="${p.leftLogoUrl || ''}" placeholder="https://.../left_logo.png" style="width: 100%; text-align: left;">
                </div>
                <div>
                  <label style="font-size: 0.75rem; color: var(--color-text-secondary); display: block; margin-bottom: 4px;">Right Logo URL</label>
                  <input type="text" class="rf-stepper-input" id="param-right-logo-url" value="${p.rightLogoUrl || ''}" placeholder="https://.../right_logo.png" style="width: 100%; text-align: left;">
                </div>
              </div>
            </div>
            <!-- Logo Preview -->
            <div style="display: flex; gap: 12px; align-items: center; justify-content: center; padding: 8px; background: var(--color-bg-sunken); border: 1px solid var(--color-border-subtle); border-radius: var(--rounded-sm);">
              <div style="display: flex; align-items: center; justify-content: center; width: 140px; height: 38px; background: #ffffff; border-radius: 3px; padding: 2px;">
                <img id="preview-logo-left" src="${this.getEffectiveLeftLogo(p)}" alt="Left Logo" style="max-width: 130px; max-height: 34px; object-fit: contain;">
              </div>
              <span style="color: var(--color-text-muted); font-size: 0.75rem;">&amp;</span>
              <div style="display: flex; align-items: center; justify-content: center; width: 140px; height: 38px; background: #ffffff; border-radius: 3px; padding: 2px;">
                <img id="preview-logo-right" src="${this.getEffectiveRightLogo(p)}" alt="Right Logo" style="max-width: 130px; max-height: 34px; object-fit: contain;">
              </div>
            </div>
          </div>

          <!-- Custom PRB Range Inputs (6 Tiers) -->
          <div class="rf-param-group">
            <div class="rf-param-header">
              <span class="rf-param-title">KPI Color Thresholds (6 Tiers)</span>
              <span style="font-size: 0.75rem; color: var(--color-text-muted);">Tiers: Idle / Blue / Green / Yellow / Amber / Red</span>
            </div>
            <div class="rf-param-desc">Customize threshold cutoffs aligned with standard 6-tier KPI scales (0=Idle, T1=Blue, T2=Green, T3=Yellow, T4=Amber, &gt;T4=Red)</div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
              <!-- DL PRB (%) -->
              <div style="background: var(--color-bg-sunken); padding: 8px 10px; border-radius: var(--rounded-sm); border: 1px solid var(--color-border-subtle);">
                <div style="font-size: 0.75rem; font-weight: 700; color: var(--color-text-primary); margin-bottom: 6px; display: flex; justify-content: space-between;">
                  <span>DL PRB (%)</span>
                  <span style="font-size: 0.6875rem; color: var(--color-text-muted);">6 Tiers</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.6875rem; color: var(--color-text-secondary);">
                    <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #BFBFBF; display: inline-block;"></span> 0% Idle:</span>
                    <span style="font-family: monospace; color: var(--color-text-muted);">0%</span>
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                    <span style="font-size: 0.6875rem; color: var(--color-text-secondary); display: flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #0000FF; display: inline-block;"></span> &le; % (Blue):</span>
                    <input type="number" class="rf-stepper-input" id="range-dl-t1" value="${p.ranges?.dl_t1 ?? 35}" style="width: 58px;">
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                    <span style="font-size: 0.6875rem; color: var(--color-text-secondary); display: flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #00FF00; display: inline-block;"></span> &le; % (Green):</span>
                    <input type="number" class="rf-stepper-input" id="range-dl-t2" value="${p.ranges?.dl_t2 ?? 60}" style="width: 58px;">
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                    <span style="font-size: 0.6875rem; color: var(--color-text-secondary); display: flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #FFFF00; display: inline-block;"></span> &le; % (Yellow):</span>
                    <input type="number" class="rf-stepper-input" id="range-dl-t3" value="${p.ranges?.dl_t3 ?? (p.ranges?.dl_mid ?? 75)}" style="width: 58px;">
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                    <span style="font-size: 0.6875rem; color: var(--color-text-secondary); display: flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #FFBF00; display: inline-block;"></span> &le; % (Amber):</span>
                    <input type="number" class="rf-stepper-input" id="range-dl-t4" value="${p.ranges?.dl_t4 ?? (p.ranges?.dl_high ?? 90)}" style="width: 58px;">
                  </div>
                  <input type="hidden" id="range-dl-high" value="${p.ranges?.dl_high ?? 90}">
                  <input type="hidden" id="range-dl-mid" value="${p.ranges?.dl_mid ?? 75}">
                  <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.6875rem; color: var(--color-text-secondary); padding-top: 2px;">
                    <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #FF0000; display: inline-block;"></span> &gt; Amber:</span>
                    <span style="color: #EF4444; font-weight: 600;">Red (Crit)</span>
                  </div>
                </div>
              </div>

              <!-- UL PRB (%) -->
              <div style="background: var(--color-bg-sunken); padding: 8px 10px; border-radius: var(--rounded-sm); border: 1px solid var(--color-border-subtle);">
                <div style="font-size: 0.75rem; font-weight: 700; color: var(--color-text-primary); margin-bottom: 6px; display: flex; justify-content: space-between;">
                  <span>UL PRB (%)</span>
                  <span style="font-size: 0.6875rem; color: var(--color-text-muted);">6 Tiers</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.6875rem; color: var(--color-text-secondary);">
                    <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #BFBFBF; display: inline-block;"></span> 0% Idle:</span>
                    <span style="font-family: monospace; color: var(--color-text-muted);">0%</span>
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                    <span style="font-size: 0.6875rem; color: var(--color-text-secondary); display: flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #0000FF; display: inline-block;"></span> &le; % (Blue):</span>
                    <input type="number" class="rf-stepper-input" id="range-ul-t1" value="${p.ranges?.ul_t1 ?? 35}" style="width: 58px;">
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                    <span style="font-size: 0.6875rem; color: var(--color-text-secondary); display: flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #00FF00; display: inline-block;"></span> &le; % (Green):</span>
                    <input type="number" class="rf-stepper-input" id="range-ul-t2" value="${p.ranges?.ul_t2 ?? 60}" style="width: 58px;">
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                    <span style="font-size: 0.6875rem; color: var(--color-text-secondary); display: flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #FFFF00; display: inline-block;"></span> &le; % (Yellow):</span>
                    <input type="number" class="rf-stepper-input" id="range-ul-t3" value="${p.ranges?.ul_t3 ?? (p.ranges?.ul_mid ?? 75)}" style="width: 58px;">
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                    <span style="font-size: 0.6875rem; color: var(--color-text-secondary); display: flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #FFBF00; display: inline-block;"></span> &le; % (Amber):</span>
                    <input type="number" class="rf-stepper-input" id="range-ul-t4" value="${p.ranges?.ul_t4 ?? (p.ranges?.ul_high ?? 90)}" style="width: 58px;">
                  </div>
                  <input type="hidden" id="range-ul-high" value="${p.ranges?.ul_high ?? 90}">
                  <input type="hidden" id="range-ul-mid" value="${p.ranges?.ul_mid ?? 75}">
                  <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.6875rem; color: var(--color-text-secondary); padding-top: 2px;">
                    <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #FF0000; display: inline-block;"></span> &gt; Amber:</span>
                    <span style="color: #EF4444; font-weight: 600;">Red (Crit)</span>
                  </div>
                </div>
              </div>

              <!-- RRC Users -->
              <div style="background: var(--color-bg-sunken); padding: 8px 10px; border-radius: var(--rounded-sm); border: 1px solid var(--color-border-subtle);">
                <div style="font-size: 0.75rem; font-weight: 700; color: var(--color-text-primary); margin-bottom: 6px; display: flex; justify-content: space-between;">
                  <span>RRC Users</span>
                  <span style="font-size: 0.6875rem; color: var(--color-text-muted);">6 Tiers</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.6875rem; color: var(--color-text-secondary);">
                    <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #BFBFBF; display: inline-block;"></span> 0 Users:</span>
                    <span style="font-family: monospace; color: var(--color-text-muted);">0</span>
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                    <span style="font-size: 0.6875rem; color: var(--color-text-secondary); display: flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #0000FF; display: inline-block;"></span> &le; User (Blue):</span>
                    <input type="number" class="rf-stepper-input" id="range-rrc-t1" value="${p.ranges?.rrc_t1 ?? 40}" style="width: 58px;">
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                    <span style="font-size: 0.6875rem; color: var(--color-text-secondary); display: flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #00FF00; display: inline-block;"></span> &le; User (Green):</span>
                    <input type="number" class="rf-stepper-input" id="range-rrc-t2" value="${p.ranges?.rrc_t2 ?? 60}" style="width: 58px;">
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                    <span style="font-size: 0.6875rem; color: var(--color-text-secondary); display: flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #FFFF00; display: inline-block;"></span> &le; User (Yellow):</span>
                    <input type="number" class="rf-stepper-input" id="range-rrc-t3" value="${p.ranges?.rrc_t3 ?? (p.ranges?.rrc_mid ?? 90)}" style="width: 58px;">
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                    <span style="font-size: 0.6875rem; color: var(--color-text-secondary); display: flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #FFBF00; display: inline-block;"></span> &le; User (Amber):</span>
                    <input type="number" class="rf-stepper-input" id="range-rrc-t4" value="${p.ranges?.rrc_t4 ?? (p.ranges?.rrc_high ?? 120)}" style="width: 58px;">
                  </div>
                  <input type="hidden" id="range-rrc-high" value="${p.ranges?.rrc_high ?? 120}">
                  <input type="hidden" id="range-rrc-mid" value="${p.ranges?.rrc_mid ?? 90}">
                  <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.6875rem; color: var(--color-text-secondary); padding-top: 2px;">
                    <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 8px; height: 8px; border-radius: 50%; background: #FF0000; display: inline-block;"></span> &gt; Amber:</span>
                    <span style="color: #EF4444; font-weight: 600;">Red (Crit)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Editable Band Stacking Table with Add-Band -->
          <div class="rf-param-group">
            <div class="rf-param-header">
              <span class="rf-param-title">3GPP Carrier Band Altitude &amp; Radius Stacking</span>
              <button type="button" class="rf-btn rf-btn-secondary" id="btn-add-band" style="padding: 3px 10px; font-size: 0.75rem;">
                + Add Band
              </button>
            </div>
            <div class="rf-param-desc">Custom altitude, beam radius, and horizontal beamwidth for 3D polygon sector layers</div>
            <div style="overflow-x: auto;">
              <table class="rf-band-table" id="table-custom-bands">
                <thead>
                  <tr>
                    <th>Band Tier</th>
                    <th>Altitude (m)</th>
                    <th>Radius (m)</th>
                    <th>Beamwidth (°)</th>
                    <th style="width: 36px;"></th>
                  </tr>
                </thead>
                <tbody>
                  ${(p.bands || []).map((b, idx) => `
                    <tr data-band-row="${idx}">
                      <td><input type="text" class="rf-stepper-input band-input-name" data-idx="${idx}" value="${b.name || ''}" style="width: 90px; text-align: left;"></td>
                      <td><input type="number" class="rf-stepper-input band-input-alt" data-idx="${idx}" value="${b.altitude || 30}" style="width: 65px;"></td>
                      <td><input type="number" class="rf-stepper-input band-input-radius" data-idx="${idx}" value="${b.radius_m || Math.round((b.radius_km || 0.05) * 1000)}" style="width: 65px;"></td>
                      <td><input type="number" class="rf-stepper-input band-input-bw" data-idx="${idx}" value="${b.beamwidth || 65}" style="width: 60px;"></td>
                      <td>
                        <button type="button" class="rf-btn rf-btn-ghost btn-remove-band" data-idx="${idx}" title="Delete band" style="padding: 2px 6px; color: var(--color-status-danger); font-size: 0.8125rem;">&times;</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <div class="rf-param-group">
            <div class="rf-param-header">
              <span class="rf-param-title">Google Earth Legend &amp; Extrusion</span>
            </div>
            <div style="display: flex; gap: 24px; align-items: center;">
              <label style="display: flex; align-items: center; gap: 8px; font-size: 0.84rem; cursor: pointer;">
                <input type="checkbox" id="param-legend-toggle" ${p.includeLegend !== false ? 'checked' : ''}>
                <span>Include KPI Legend Overlay</span>
              </label>
              <label style="display: flex; align-items: center; gap: 8px; font-size: 0.84rem; cursor: pointer;">
                <input type="checkbox" id="param-extrude-toggle" ${p.extrude !== false ? 'checked' : ''}>
                <span>Extrude Polygons to Ground</span>
              </label>
            </div>
          </div>
        `;

      case 'isd-calculator':
        return `
          <div class="rf-param-group">
            <div class="rf-param-header">
              <span class="rf-param-title">N-Nearest Neighbors</span>
              <span class="rf-tabular-nums" style="color: var(--color-primary);" id="nearest-display">${p.nNearest || 1} Neighbors</span>
            </div>
            <div class="rf-param-desc">Number of closest candidate sites to compute per source site (1 to 5)</div>
            <div class="rf-slider-row">
              <input type="range" class="rf-slider" id="param-n-slider" min="1" max="5" step="1" value="${p.nNearest || 1}">
              <input type="number" class="rf-stepper-input" id="param-n-num" min="1" max="5" step="1" value="${p.nNearest || 1}">
            </div>
          </div>

          <div class="rf-param-group">
            <div class="rf-param-header">
              <span class="rf-param-title">Distance Computation Units</span>
              <span class="rf-confidence-pill rf-confidence-pill--high" id="isd-unit-pill">${p.distanceUnit === 'm' ? 'Meters (m)' : 'Kilometers (km)'}</span>
            </div>
            <div class="rf-param-desc">Select output distance calculation metric (Kilometers vs Meters)</div>
            <div class="rf-segmented-switch" style="width: 100%;">
              <button class="rf-segmented-item ${p.distanceUnit !== 'm' ? 'rf-segmented-item--active' : ''}" data-isd-unit="km" style="flex: 1;">Kilometers (km)</button>
              <button class="rf-segmented-item ${p.distanceUnit === 'm' ? 'rf-segmented-item--active' : ''}" data-isd-unit="m" style="flex: 1;">Meters (m)</button>
            </div>
          </div>

          <div class="rf-param-group">
            <div class="rf-param-header">
              <span class="rf-param-title">Dual-Sheet Export Structure</span>
            </div>
            <div class="rf-param-desc">
              Generated workbook includes:
              <br>&bull; <b>Sheet 1: ISD_Result</b> (Ranked Site ID pairs with exact Haversine ${p.distanceUnit === 'm' ? 'meters' : 'km'})
              <br>&bull; <b>Sheet 2: Summary</b> (Distance distribution: count, min, mean, max in ${p.distanceUnit === 'm' ? 'meters' : 'km'})
            </div>
          </div>
        `;

      case 'geohash-to-shp':
        return `
          <div class="rf-param-group">
            <div class="rf-param-header">
              <span class="rf-param-title">Polygon Generation Mode</span>
            </div>
            <div class="rf-param-desc">ESRI shapefile boundary construction algorithm</div>
            <div class="rf-segmented-switch" style="width: 100%;">
              <button class="rf-segmented-item ${p.mode === 'default' ? 'rf-segmented-item--active' : ''}" data-mode="default" style="flex: 1;">Default Bounding Box</button>
              <button class="rf-segmented-item ${p.mode === 'custom' ? 'rf-segmented-item--active' : ''}" data-mode="custom" style="flex: 1;">Custom Metric Square</button>
            </div>
          </div>

          <div class="rf-param-group" id="shp-size-group" style="${p.mode === 'custom' ? '' : 'opacity: 0.45; pointer-events: none;'}">
            <div class="rf-param-header">
              <span class="rf-param-title">Square Grid Size</span>
              <span class="rf-tabular-nums" style="color: var(--color-primary);" id="size-display">${p.sizeM || 500}m</span>
            </div>
            <div class="rf-param-desc">Projected UTM metric square dimension (100m to 5000m)</div>
            <div class="rf-slider-row">
              <input type="range" class="rf-slider" id="param-size-slider" min="100" max="5000" step="50" value="${p.sizeM || 500}">
              <input type="number" class="rf-stepper-input" id="param-size-num" min="100" max="5000" step="50" value="${p.sizeM || 500}">
            </div>
          </div>

          <div class="rf-param-group">
            <div class="rf-param-header">
              <span class="rf-param-title">ESRI DBF Constraint Protection</span>
            </div>
            <div class="rf-param-desc">
              Attributes truncated to 10 chars with automatic duplicate deduplication (_1, _2) to conform strictly to ESRI standards.
            </div>
          </div>
        `;

      case 'geohash-to-latlon':
        return `
          <div class="rf-param-group">
            <div class="rf-param-header">
              <span class="rf-param-title">Output Export Format</span>
            </div>
            <div class="rf-segmented-switch" style="width: 100%;">
              <button class="rf-segmented-item ${p.outputFormat === 'xlsx' ? 'rf-segmented-item--active' : ''}" data-fmt="xlsx" style="flex: 1;">Excel (.xlsx)</button>
              <button class="rf-segmented-item ${p.outputFormat === 'csv' ? 'rf-segmented-item--active' : ''}" data-fmt="csv" style="flex: 1;">CSV (.csv)</button>
            </div>
          </div>

          <div class="rf-param-group">
            <div class="rf-param-header">
              <span class="rf-param-title">Coordinate Precision</span>
              <span class="rf-tabular-nums" style="color: var(--color-primary);">${p.precision || 6} Decimals</span>
            </div>
            <div class="rf-param-desc">Decimal degree resolution (6 decimals = ~0.11m precision)</div>
            <div class="rf-slider-row">
              <input type="range" class="rf-slider" id="param-prec-slider" min="4" max="8" step="1" value="${p.precision || 6}">
              <input type="number" class="rf-stepper-input" id="param-prec-num" min="4" max="8" step="1" value="${p.precision || 6}">
            </div>
          </div>
        `;

      case 'latlon-to-geohash':
        const resText = this.getPrecisionResolution(p.precision || 7);
        return `
          <div class="rf-param-group">
            <div class="rf-param-header">
              <span class="rf-param-title">Geohash Character Precision</span>
              <span class="rf-tabular-nums" style="color: var(--color-primary);" id="prec-display">${p.precision || 7} Characters</span>
            </div>
            <div class="rf-param-desc" id="prec-res-text">Resolution: ${resText}</div>
            <div class="rf-slider-row">
              <input type="range" class="rf-slider" id="param-ghprec-slider" min="1" max="12" step="1" value="${p.precision || 7}">
              <input type="number" class="rf-stepper-input" id="param-ghprec-num" min="1" max="12" step="1" value="${p.precision || 7}">
            </div>
          </div>

          <div class="rf-param-group">
            <div class="rf-param-header">
              <span class="rf-param-title">Output Export Format</span>
            </div>
            <div class="rf-segmented-switch" style="width: 100%;">
              <button class="rf-segmented-item ${p.outputFormat === 'xlsx' ? 'rf-segmented-item--active' : ''}" data-fmt="xlsx" style="flex: 1;">Excel (.xlsx)</button>
              <button class="rf-segmented-item ${p.outputFormat === 'csv' ? 'rf-segmented-item--active' : ''}" data-fmt="csv" style="flex: 1;">CSV (.csv)</button>
            </div>
          </div>
        `;

      default:
        return '<div>No parameters for this tool.</div>';
    }
  }

  getPrecisionResolution(p) {
    const table = {
      1: '~5,000 km (Continental)',
      2: '~1,250 km (Sub-continental)',
      3: '~156 km (Metropolitan)',
      4: '~39 km (City-wide)',
      5: '~4.9 km (District)',
      6: '~1.2 km (Neighborhood)',
      7: '~153 m (Local Cell Site)',
      8: '~38 m (Property boundary)',
      9: '~4.8 m (Room/Street accuracy)',
      10: '~1.2 m (Sub-meter)',
      11: '~14.9 cm (Centimeter)',
      12: '~3.7 cm (Millimeter)'
    };
    return table[p] || `Precision ${p}`;
  }

  canCalculate() {
    if (this.toolId === 'isd-calculator') {
      if (!this.ws.fileA || !this.ws.fileB) return false;
      const reqs = this.getMappingRequirements();
      for (const f of reqs.mandatoryA) {
        if (!this.ws.mappingsA[f.key]) return false;
      }
      for (const f of reqs.mandatoryB) {
        if (!this.ws.mappingsB[f.key]) return false;
      }
      return true;
    }

    if (!this.ws.file) return false;
    const reqs = this.getMappingRequirements();
    for (const f of reqs.mandatory) {
      if (!this.ws.mappings[f.key]) return false;
    }
    return true;
  }

  getValidationStatusText() {
    if (this.toolId === 'isd-calculator') {
      if (!this.ws.fileA && !this.ws.fileB) return 'Please drop Source File A and Target File B in Zone 1';
      if (!this.ws.fileA) return 'Please drop Source File A';
      if (!this.ws.fileB) return 'Please drop Target File B';
      const reqs = this.getMappingRequirements();
      for (const f of reqs.mandatoryA) {
        if (!this.ws.mappingsA[f.key]) return `Please map mandatory ${f.label} for File A`;
      }
      for (const f of reqs.mandatoryB) {
        if (!this.ws.mappingsB[f.key]) return `Please map mandatory ${f.label} for File B`;
      }
      return 'All inputs verified &bull; Ready to calculate nearest neighbors';
    }

    if (!this.ws.file) return 'Please drag &amp; drop calculation spreadsheet in Zone 1';
    const reqs = this.getMappingRequirements();
    for (const f of reqs.mandatory) {
      if (!this.ws.mappings[f.key]) return `Please map mandatory field: ${f.label}`;
    }
    const rowCount = this.ws.inspection ? this.ws.inspection.total_rows : 'dataset';
    return `Ready &bull; ${rowCount} records configured for calculation`;
  }

  renderResultsContent() {
    const summary = this.ws.resultSummary || (this.ws.previewData ? this.ws.previewData.summary : null);
    if (!summary) return '<div>No results to display.</div>';

    const previewRows = summary.preview_rows || [];
    const meta = this.getToolMeta();
    const isISD = this.toolId === 'isd-calculator';

    return `
      <!-- Summary Bar -->
      <div class="rf-table-summary-bar">
        <div class="rf-table-stats">
          <span style="font-weight: 600; color: var(--color-text-primary);">
            ${summary.folder_name ? `Folder: ${summary.folder_name}` : `Tool: ${this.toolId}`}
          </span>
          <span>&bull;</span>
          <span class="rf-tabular-nums">
            ${summary.total_rows !== undefined ? `${summary.total_rows} Records Processed` : `${previewRows.length} Sample Rows`}
          </span>
          <span>&bull;</span>
          <span class="rf-tabular-nums" style="color: var(--color-status-success);">
            ${this.ws.lastExecutionTimeMs ? `Computed in ${this.ws.lastExecutionTimeMs}ms` : 'Computed successfully'}
          </span>
        </div>
        <div>
          <button class="rf-btn rf-btn-primary" id="download-deliverable-cta" style="padding: 8px 18px; font-size: 0.875rem;">
            <span>📥 Download Deliverable (.${meta.outputExt})</span>
          </button>
        </div>
      </div>

      <!-- ISD KPI Stat Cards -->
      ${isISD && (summary.min_km !== undefined || summary.min_m !== undefined) ? `
        <div class="kpi-summary-grid" style="margin-top: 12px;">
          <div class="kpi-summary-card">
            <span class="kpi-summary-label">Total Pairs</span>
            <span class="kpi-summary-value">${summary.total_pairs || 0}</span>
          </div>
          <div class="kpi-summary-card">
            <span class="kpi-summary-label">Min Distance</span>
            <span class="kpi-summary-value" style="color: var(--color-status-success);">
              ${(summary.distance_unit === 'm' || summary.unit === 'm') && summary.min_m !== undefined ? `${summary.min_m} m` : `${summary.min_km ?? summary.min_m} ${(summary.distance_unit === 'm' || summary.unit === 'm') ? 'm' : 'km'}`}
            </span>
          </div>
          <div class="kpi-summary-card">
            <span class="kpi-summary-label">Mean Distance</span>
            <span class="kpi-summary-value" style="color: var(--color-primary);">
              ${(summary.distance_unit === 'm' || summary.unit === 'm') && summary.mean_m !== undefined ? `${summary.mean_m} m` : `${summary.mean_km ?? summary.mean_m} ${(summary.distance_unit === 'm' || summary.unit === 'm') ? 'm' : 'km'}`}
            </span>
          </div>
          <div class="kpi-summary-card">
            <span class="kpi-summary-label">Max Distance</span>
            <span class="kpi-summary-value" style="color: var(--color-status-warning);">
              ${(summary.distance_unit === 'm' || summary.unit === 'm') && summary.max_m !== undefined ? `${summary.max_m} m` : `${summary.max_km ?? summary.max_m} ${(summary.distance_unit === 'm' || summary.unit === 'm') ? 'm' : 'km'}`}
            </span>
          </div>
        </div>
      ` : ''}

      <!-- ISD Sheet Tabs -->
      ${isISD ? `
        <div class="tab-nav" style="margin-top: 16px; margin-bottom: 0;">
          <button class="tab-btn ${this.activeSheetTab === 'result' ? 'tab-btn--active' : ''}" id="isd-tab-result">
            Sheet 1: ISD_Result (${previewRows.length} preview rows)
          </button>
          <button class="tab-btn ${this.activeSheetTab === 'summary' ? 'tab-btn--active' : ''}" id="isd-tab-summary">
            Sheet 2: Summary Stats
          </button>
        </div>
      ` : ''}

      <!-- Interactive Data Grid -->
      <div class="rf-table-wrap" style="margin-top: 12px;">
        ${this.renderPreviewTableGrid(summary, previewRows)}
      </div>
    `;
  }

  renderPreviewTableGrid(summary, previewRows) {
    if (this.toolId === 'isd-calculator' && this.activeSheetTab === 'summary') {
      const isMeters = summary.distance_unit === 'm' || summary.unit === 'm' || this.ws.params.distanceUnit === 'm';
      const u = isMeters ? 'm' : 'km';
      const minVal = isMeters && summary.min_m !== undefined ? summary.min_m : (summary.min_km ?? summary.min_m);
      const meanVal = isMeters && summary.mean_m !== undefined ? summary.mean_m : (summary.mean_km ?? summary.mean_m);
      const maxVal = isMeters && summary.max_m !== undefined ? summary.max_m : (summary.max_km ?? summary.max_m);

      return `
        <table class="rf-table">
          <thead>
            <tr>
              <th>Metric Property</th>
              <th>Calculated Value</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Total Evaluated Neighbor Pairs</td><td class="rf-mono">${summary.total_pairs}</td><td>pairs</td></tr>
            <tr><td>Minimum Distance (Min)</td><td class="rf-mono" style="color: var(--color-status-success); font-weight: 600;">${minVal}</td><td>${u}</td></tr>
            <tr><td>Mean Distance (Average)</td><td class="rf-mono" style="color: var(--color-primary); font-weight: 600;">${meanVal}</td><td>${u}</td></tr>
            <tr><td>Maximum Distance (Max)</td><td class="rf-mono" style="color: var(--color-status-warning); font-weight: 600;">${maxVal}</td><td>${u}</td></tr>
          </tbody>
        </table>
      `;
    }

    if (!previewRows || previewRows.length === 0) {
      return '<div style="padding: 24px; text-align: center; color: var(--color-text-muted);">No preview records returned.</div>';
    }

    const headers = Object.keys(previewRows[0]);

    return `
      <table class="rf-table" id="preview-data-table">
        <thead>
          <tr>
            ${headers.map(h => `<th>${h.toUpperCase()}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${previewRows.map(row => `
            <tr>
              ${headers.map(h => {
                const val = row[h];
                if (h.toLowerCase().includes('lat') || h.toLowerCase().includes('lon')) {
                  const num = Number(val);
                  return `<td class="rf-mono">${!isNaN(num) ? num.toFixed(6) : val}</td>`;
                }
                if (h.toLowerCase() === 'color_hex' && val) {
                  return `
                    <td>
                      <span class="rf-kpi-chip" style="background-color: ${val}22; border-color: ${val}; color: var(--color-text-primary);">
                        <span class="rf-kpi-chip__dot" style="background-color: ${val};"></span>
                        ${val}
                      </span>
                    </td>
                  `;
                }
                if (h.toLowerCase() === 'dl_prb' || h.toLowerCase() === 'ul_prb') {
                  return `<td class="rf-mono">${val}%</td>`;
                }
                if (h.toLowerCase() === 'distance_km') {
                  return `<td class="rf-mono" style="color: var(--color-primary); font-weight: 600;">${val} km</td>`;
                }
                return `<td>${val !== null && val !== undefined ? val : ''}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  renderFormulaGuideText() {
    switch (this.toolId) {
      case 'excel-to-kml':
        return `
          <h3>Point Placemark KML Generation</h3>
          <p>Iterates rows of the active worksheet, extracts coordinates, styles Placemark points, and serializes into Google Earth KML format.</p>
          <div class="formula-box">
            Coordinate Format: WGS84 Decimal Degrees (EPSG:4326)<br>
            Placemark Point: &lt;Point&gt;&lt;coordinates&gt;lon,lat,alt&lt;/coordinates&gt;&lt;/Point&gt;
          </div>
          <h4>Input Specifications:</h4>
          <ul>
            <li><b>Latitude:</b> Range [-90.0, +90.0]</li>
            <li><b>Longitude:</b> Range [-180.0, +180.0]</li>
            <li><b>Scale Factor:</b> 0.1 to 3.0</li>
          </ul>
        `;

      case 'prb-kml':
        return `
          <h3>3D Sector Forward Spherical Geodesic Projection</h3>
          <p>Models antenna sectors as extruded 3D polygons extending along a central azimuth arc with specified horizontal beamwidth.</p>
          <div class="formula-box">
            lat_new = asin( sin(lat)*cos(d/R) + cos(lat)*sin(d/R)*cos(&theta;) )<br>
            lon_new = lon + atan2( sin(&theta;)*sin(d/R)*cos(lat), cos(d/R) - sin(lat)*sin(lat_new) )<br>
            R = 6371.000 km (Earth Mean Geodesic Radius)
          </div>
          <h4>Carrier Band Altitudes:</h4>
          <p>To prevent multi-carrier polygon collision when viewing multi-band towers, sectors are extruded at staggered altitudes:</p>
          <ul>
            <li><b>LTE700:</b> 42m altitude, 38m radius</li>
            <li><b>LTE900:</b> 38m altitude, 45m radius</li>
            <li><b>LTE1800:</b> 34m altitude, 60m radius</li>
            <li><b>LTE2100:</b> 32m altitude, 75m radius</li>
            <li><b>LTE2300:</b> 30m altitude, 100m radius</li>
          </ul>
        `;

      case 'isd-calculator':
        return `
          <h3>Haversine Great-Circle Distance</h3>
          <p>Computes spherical surface distance between source coordinates (lat1, lon1) and candidate coordinates (lat2, lon2).</p>
          <div class="formula-box">
            a = sin&sup2;(&Delta;lat/2) + cos(lat_1) &bull; cos(lat_2) &bull; sin&sup2;(&Delta;lon/2)<br>
            c = 2 &bull; atan2( &radic;a, &radic;(1-a) )<br>
            d = R &bull; c  (where R = 6371.0088 km)
          </div>
          <h4>Nearest Neighbor Engine:</h4>
          <p>For each source site in File A, all candidate sites in File B are evaluated, and the <i>N</i> closest sites are selected, sorted, and reported with summary distributions.</p>
        `;

      case 'geohash-to-shp':
        return `
          <h3>Geohash to ESRI Shapefile Polygon Conversion</h3>
          <p>Decodes base-32 geohashes into WGS84 bounding box coordinates or local UTM projected metric squares (e.g. 500m x 500m).</p>
          <div class="formula-box">
            ESRI DBF Limits: Column headers strictly clamped to 10 characters.<br>
            Collisions: Automatically resolved with unique numeric suffixes (_1, _2).
          </div>
        `;

      case 'geohash-to-latlon':
        return `
          <h3>Geohash Decoding to WGS84 Centroid</h3>
          <p>Inverts base-32 geohash grid interleaving into decimal degree bounding coordinates and extracts the centroid midpoint.</p>
          <div class="formula-box">
            lat_centroid = (lat_min + lat_max) / 2<br>
            lon_centroid = (lon_min + lon_max) / 2
          </div>
        `;

      case 'latlon-to-geohash':
        return `
          <h3>Latitude/Longitude to Base-32 Geohash Encoding</h3>
          <p>Interleaves binary representations of latitude and longitude, encoding each 5-bit segment into standard base-32 characters.</p>
          <div class="formula-box">
            Alphabet: 0123456789bcdefghjkmnpqrstuvwxyz (no a, i, l, o)<br>
            Precision 7: Cell resolution approx 153m x 153m
          </div>
        `;

      default:
        return 'Engineering specifications.';
    }
  }

  bindEvents() {
    // Sample template download in header
    const tplBtn = this.container.querySelector('#ws-download-template-btn');
    if (tplBtn) {
      tplBtn.addEventListener('click', async () => {
        const meta = this.getToolMeta();
        try {
          tplBtn.disabled = true;
          toast.info(`Downloading ${meta.sample_template_id} reference template...`);
          const fn = await ApiService.downloadTemplate(meta.sample_template_id);
          toast.success(`Saved ${fn}`);
        } catch (err) {
          toast.error(`Download failed: ${err.message}`);
        } finally {
          tplBtn.disabled = false;
        }
      });
    }

    // Formula Guide Modal
    const guideBtn = this.container.querySelector('#ws-formula-guide-btn');
    const modalOverlay = this.container.querySelector('#formula-modal-overlay');
    const modalClose = this.container.querySelector('#formula-modal-close');

    if (guideBtn && modalOverlay) {
      guideBtn.addEventListener('click', () => {
        modalOverlay.classList.add('modal-overlay--open');
      });
      modalClose.addEventListener('click', () => {
        modalOverlay.classList.remove('modal-overlay--open');
      });
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) modalOverlay.classList.remove('modal-overlay--open');
      });
    }

    // Reset Form
    const resetBtn = this.container.querySelector('#ws-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset workspace inputs and loaded files?')) {
          this.ws = state.workspaces[this.toolId] = state.initWorkspace(this.toolId, {});
          this.render();
          toast.info('Workspace reset');
        }
      });
    }

    // Reset Mappings to Auto-Detected
    const resetMappingsBtn = this.container.querySelector('#reset-mappings-btn');
    if (resetMappingsBtn) {
      resetMappingsBtn.addEventListener('click', () => {
        this.ws.mappings = {};
        this.ws.mappingsA = {};
        this.ws.mappingsB = {};
        state.saveMappings(this.toolId, {});
        this.updateMappingViews();
        toast.info('Column mappings reset to auto-detected values');
      });
    }

    // Bind Dropzone file drag & drop & click
    this.bindDropzones();

    // Bind Column Mapping Selectors
    this.bindMappingSelectors();

    // Bind Parameters
    this.bindParams();

    // Bind Sticky Action Bar (Preview & Execute)
    this.bindActions();

    // Bind Results Zone actions
    this.bindResultsActions();
  }

  bindDropzones() {
    const isISD = this.toolId === 'isd-calculator';

    if (isISD) {
      this.setupDropzoneTarget('A');
      this.setupDropzoneTarget('B');

      const loadSampleISDBtn = this.container.querySelector('#load-sample-isd-btn');
      if (loadSampleISDBtn) {
        loadSampleISDBtn.addEventListener('click', async () => {
          try {
            loadSampleISDBtn.disabled = true;
            toast.info('Loading sample datasets for Source File A and Target File B...');
            const fileA = await ApiService.fetchTemplateFile('isd_a');
            const fileB = await ApiService.fetchTemplateFile('isd_b');
            await this.handleFileSelect('A', fileA);
            await this.handleFileSelect('B', fileB);
            toast.success('Loaded sample datasets for both files!');
          } catch (err) {
            toast.error(`Failed to load sample: ${err.message}`);
          } finally {
            loadSampleISDBtn.disabled = false;
          }
        });
      }
    } else {
      this.setupDropzoneTarget('single');

      const loadSampleBtn = this.container.querySelector('#load-sample-data-btn');
      if (loadSampleBtn) {
        loadSampleBtn.addEventListener('click', async () => {
          const meta = this.getToolMeta();
          try {
            loadSampleBtn.disabled = true;
            toast.info(`Loading sample template for ${meta.title}...`);
            const file = await ApiService.fetchTemplateFile(meta.sample_template_id);
            await this.handleFileSelect('single', file);
            toast.success(`Loaded ${file.name} successfully!`);
          } catch (err) {
            toast.error(`Failed to load sample: ${err.message}`);
          } finally {
            loadSampleBtn.disabled = false;
          }
        });
      }
    }

    // Replace and Remove handlers
    const removeBtns = this.container.querySelectorAll('.remove-file-btn');
    removeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = btn.dataset.target;
        if (target === 'A') {
          this.ws.fileA = null;
          this.ws.inspectionA = null;
          this.ws.mappingsA = {};
        } else if (target === 'B') {
          this.ws.fileB = null;
          this.ws.inspectionB = null;
          this.ws.mappingsB = {};
        } else {
          this.ws.file = null;
          this.ws.inspection = null;
          this.ws.mappings = {};
        }
        this.render();
      });
    });

    const replaceBtns = this.container.querySelectorAll('.replace-file-btn');
    replaceBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        const input = this.container.querySelector(`#replace-input-${target}`);
        if (input) input.click();
      });
    });

    ['single', 'A', 'B'].forEach(target => {
      const repInput = this.container.querySelector(`#replace-input-${target}`);
      if (repInput) {
        repInput.addEventListener('change', (e) => {
          if (e.target.files && e.target.files[0]) {
            this.handleFileSelect(target, e.target.files[0]);
          }
        });
      }
    });
  }

  setupDropzoneTarget(target) {
    const dropzone = this.container.querySelector(`#dropzone-${target}`);
    const fileInput = this.container.querySelector(`#file-input-${target}`);
    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.handleFileSelect(target, e.target.files[0]);
      }
    });

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('rf-dropzone--dragover');
    });

    dropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('rf-dropzone--dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('rf-dropzone--dragover');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.handleFileSelect(target, e.dataTransfer.files[0]);
      }
    });
  }

  async handleFileSelect(target, file) {
    // Validate file
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      toast.error('Unsupported file format. Please upload .xlsx, .xls, or .csv');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error('File size exceeds 100 MB limit.');
      return;
    }

    try {
      toast.info(`Inspecting columns for ${file.name}...`);
      const inspection = await ApiService.inspectColumns(file);

      if (target === 'A') {
        this.ws.fileA = file;
        this.ws.inspectionA = inspection;
      } else if (target === 'B') {
        this.ws.fileB = file;
        this.ws.inspectionB = inspection;
      } else {
        this.ws.file = file;
        this.ws.inspection = inspection;
      }

      toast.success(`Inspected ${inspection.total_columns} columns &amp; ${inspection.total_rows} rows`);
      this.render();
    } catch (err) {
      toast.error(`Failed to inspect file: ${err.message}`);
    }
  }

  bindMappingSelectors() {
    const selects = this.container.querySelectorAll('.column-select');
    selects.forEach(select => {
      select.addEventListener('change', (e) => {
        const field = select.dataset.field;
        const target = select.dataset.target;
        const val = select.value;

        if (target === 'A') {
          this.ws.mappingsA[field] = val;
        } else if (target === 'B') {
          this.ws.mappingsB[field] = val;
        } else {
          this.ws.mappings[field] = val;
          state.saveMappings(this.toolId, this.ws.mappings);
        }

        this.updateMappingViews();
      });
    });
  }

  updateMappingViews() {
    const zone2 = this.container.querySelector('#zone2-mapping-container');
    if (zone2) zone2.innerHTML = this.renderMappingContent();

    const pill = this.container.querySelector('#mapping-count-pill');
    if (pill) pill.innerHTML = this.getMappingStatusPill();

    const valMsg = this.container.querySelector('#action-bar-validation-msg');
    if (valMsg) valMsg.innerHTML = this.getValidationStatusText();

    const prevBtn = this.container.querySelector('#action-preview-btn');
    const execBtn = this.container.querySelector('#action-execute-btn');
    const can = this.canCalculate();
    if (prevBtn) prevBtn.disabled = !can;
    if (execBtn) execBtn.disabled = !can;

    this.bindMappingSelectors();
  }

  refreshParamsZone() {
    const zone3 = this.container.querySelector('#zone3-params-container');
    if (zone3) {
      zone3.innerHTML = this.renderParamsContent();
      this.bindParams();
    }
  }

  bindParams() {
    const p = this.ws.params;

    // Excel to KML params
    const folderInput = this.container.querySelector('#param-folder-name');
    if (folderInput) {
      folderInput.addEventListener('input', (e) => { p.folderName = e.target.value; });
    }

    const scaleSlider = this.container.querySelector('#param-scale-slider');
    const scaleNum = this.container.querySelector('#param-scale-num');
    const scaleDisplay = this.container.querySelector('#scale-display');
    if (scaleSlider && scaleNum) {
      const syncScale = (v) => {
        p.scale = parseFloat(v);
        scaleSlider.value = v;
        scaleNum.value = v;
        if (scaleDisplay) scaleDisplay.textContent = `${v}x`;
      };
      scaleSlider.addEventListener('input', (e) => syncScale(e.target.value));
      scaleNum.addEventListener('input', (e) => syncScale(e.target.value));
    }

    const colorPicker = this.container.querySelector('#param-color-rgb');
    const colorHex = this.container.querySelector('#param-color-rgb-hex');
    if (colorPicker && colorHex) {
      colorPicker.addEventListener('input', (e) => {
        p.colorRgb = e.target.value;
        colorHex.value = e.target.value.toUpperCase();
      });
      colorHex.addEventListener('input', (e) => {
        p.colorRgb = e.target.value;
        colorPicker.value = e.target.value;
      });
    }

    const labelPicker = this.container.querySelector('#param-label-color');
    const labelHex = this.container.querySelector('#param-label-color-hex');
    if (labelPicker && labelHex) {
      labelPicker.addEventListener('input', (e) => {
        p.labelColor = e.target.value;
        labelHex.value = e.target.value.toUpperCase();
      });
      labelHex.addEventListener('input', (e) => {
        p.labelColor = e.target.value;
        labelPicker.value = e.target.value;
      });
    }

    // PRB KML params
    const metricButtons = this.container.querySelectorAll('[data-metric]');
    metricButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        metricButtons.forEach(b => b.classList.remove('rf-segmented-item--active'));
        btn.classList.add('rf-segmented-item--active');
        p.colorByMetric = btn.dataset.metric;
      });
    });

    const opacitySlider = this.container.querySelector('#param-opacity-slider');
    const opacityNum = this.container.querySelector('#param-opacity-num');
    const opacityDisplay = this.container.querySelector('#opacity-display');
    if (opacitySlider && opacityNum) {
      const syncOpacity = (v) => {
        p.opacityPercent = parseInt(v, 10);
        opacitySlider.value = v;
        opacityNum.value = v;
        if (opacityDisplay) opacityDisplay.textContent = `${v}%`;
      };
      opacitySlider.addEventListener('input', (e) => syncOpacity(e.target.value));
      opacityNum.addEventListener('input', (e) => syncOpacity(e.target.value));
    }

    const legendToggle = this.container.querySelector('#param-legend-toggle');
    if (legendToggle) {
      legendToggle.addEventListener('change', (e) => { p.includeLegend = e.target.checked; });
    }

    const extrudeToggle = this.container.querySelector('#param-extrude-toggle');
    if (extrudeToggle) {
      extrudeToggle.addEventListener('change', (e) => { p.extrude = e.target.checked; });
    }

    // PRB Dual Logo Presets & Custom URLs
    const logoPresetBtns = this.container.querySelectorAll('[data-logo-preset]');
    const customLogoInputs = this.container.querySelector('#custom-logo-inputs');
    const previewLeft = this.container.querySelector('#preview-logo-left');
    const previewRight = this.container.querySelector('#preview-logo-right');

    const updateLogoPreviews = () => {
      if (previewLeft) previewLeft.src = this.getEffectiveLeftLogo(p);
      if (previewRight) previewRight.src = this.getEffectiveRightLogo(p);
    };

    logoPresetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        logoPresetBtns.forEach(b => b.classList.remove('rf-segmented-item--active'));
        btn.classList.add('rf-segmented-item--active');
        p.logoPreset = btn.dataset.logoPreset;
        if (customLogoInputs) {
          customLogoInputs.style.display = p.logoPreset === 'custom' ? 'block' : 'none';
        }
        updateLogoPreviews();
      });
    });

    const leftLogoInput = this.container.querySelector('#param-left-logo-url');
    if (leftLogoInput) {
      leftLogoInput.addEventListener('input', (e) => {
        p.leftLogoUrl = e.target.value.trim();
        updateLogoPreviews();
      });
    }

    const rightLogoInput = this.container.querySelector('#param-right-logo-url');
    if (rightLogoInput) {
      rightLogoInput.addEventListener('input', (e) => {
        p.rightLogoUrl = e.target.value.trim();
        updateLogoPreviews();
      });
    }

    // PRB Custom KPI Range Inputs (6 Tiers)
    if (!p.ranges) {
      p.ranges = {
        dl_t1: 35, dl_t2: 60, dl_t3: 75, dl_t4: 90,
        ul_t1: 35, ul_t2: 60, ul_t3: 75, ul_t4: 90,
        rrc_t1: 40, rrc_t2: 60, rrc_t3: 90, rrc_t4: 120,
        dl_high: 90, dl_mid: 75, ul_high: 90, ul_mid: 75, rrc_high: 120, rrc_mid: 90
      };
    }
    const bindRangeInput = (id, key, syncKey) => {
      const el = this.container.querySelector(id);
      if (el) {
        el.addEventListener('input', (e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) {
            p.ranges[key] = v;
            if (syncKey) p.ranges[syncKey] = v;
          }
        });
      }
    };
    bindRangeInput('#range-dl-t1', 'dl_t1');
    bindRangeInput('#range-dl-t2', 'dl_t2');
    bindRangeInput('#range-dl-t3', 'dl_t3', 'dl_mid');
    bindRangeInput('#range-dl-t4', 'dl_t4', 'dl_high');
    bindRangeInput('#range-dl-high', 'dl_high', 'dl_t4');
    bindRangeInput('#range-dl-mid', 'dl_mid', 'dl_t3');

    bindRangeInput('#range-ul-t1', 'ul_t1');
    bindRangeInput('#range-ul-t2', 'ul_t2');
    bindRangeInput('#range-ul-t3', 'ul_t3', 'ul_mid');
    bindRangeInput('#range-ul-t4', 'ul_t4', 'ul_high');
    bindRangeInput('#range-ul-high', 'ul_high', 'ul_t4');
    bindRangeInput('#range-ul-mid', 'ul_mid', 'ul_t3');

    bindRangeInput('#range-rrc-t1', 'rrc_t1');
    bindRangeInput('#range-rrc-t2', 'rrc_t2');
    bindRangeInput('#range-rrc-t3', 'rrc_t3', 'rrc_mid');
    bindRangeInput('#range-rrc-t4', 'rrc_t4', 'rrc_high');
    bindRangeInput('#range-rrc-high', 'rrc_high', 'rrc_t4');
    bindRangeInput('#range-rrc-mid', 'rrc_mid', 'rrc_t3');

    // PRB Custom Bands Table
    if (!p.bands || !Array.isArray(p.bands)) {
      p.bands = [
        { name: 'LTE 700', altitude: 42, radius_m: 38, radius_km: 0.038, beamwidth: 65 },
        { name: 'LTE 900', altitude: 38, radius_m: 45, radius_km: 0.045, beamwidth: 65 },
        { name: 'LTE 1800', altitude: 34, radius_m: 60, radius_km: 0.060, beamwidth: 65 },
        { name: 'LTE 2100', altitude: 32, radius_m: 75, radius_km: 0.075, beamwidth: 65 },
        { name: 'LTE 2300', altitude: 30, radius_m: 100, radius_km: 0.100, beamwidth: 65 }
      ];
    }

    this.container.querySelectorAll('.band-input-name').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        if (p.bands[idx]) p.bands[idx].name = e.target.value;
      });
    });

    this.container.querySelectorAll('.band-input-alt').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        if (p.bands[idx]) p.bands[idx].altitude = parseFloat(e.target.value) || 30;
      });
    });

    this.container.querySelectorAll('.band-input-radius').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        if (p.bands[idx]) {
          p.bands[idx].radius_m = parseFloat(e.target.value) || 50;
          p.bands[idx].radius_km = p.bands[idx].radius_m / 1000.0;
        }
      });
    });

    this.container.querySelectorAll('.band-input-bw').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        if (p.bands[idx]) p.bands[idx].beamwidth = parseFloat(e.target.value) || 65;
      });
    });

    this.container.querySelectorAll('.btn-remove-band').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        if (!isNaN(idx) && p.bands.length > 1) {
          p.bands.splice(idx, 1);
          this.refreshParamsZone();
        }
      });
    });

    const addBandBtn = this.container.querySelector('#btn-add-band');
    if (addBandBtn) {
      addBandBtn.addEventListener('click', () => {
        const num = p.bands.length + 1;
        p.bands.push({
          name: `LTE ${2500 + num * 100}`,
          altitude: 28,
          radius_m: 60,
          radius_km: 0.06,
          beamwidth: 65
        });
        this.refreshParamsZone();
      });
    }

    // ISD Calculator params
    const nSlider = this.container.querySelector('#param-n-slider');
    const nNum = this.container.querySelector('#param-n-num');
    const nDisplay = this.container.querySelector('#nearest-display');
    if (nSlider && nNum) {
      const syncN = (v) => {
        p.nNearest = parseInt(v, 10);
        nSlider.value = v;
        nNum.value = v;
        if (nDisplay) nDisplay.textContent = `${v} Neighbors`;
      };
      nSlider.addEventListener('input', (e) => syncN(e.target.value));
      nNum.addEventListener('input', (e) => syncN(e.target.value));
    }

    // ISD Distance Computation Units (km vs m)
    const isdUnitBtns = this.container.querySelectorAll('[data-isd-unit]');
    isdUnitBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        isdUnitBtns.forEach(b => b.classList.remove('rf-segmented-item--active'));
        btn.classList.add('rf-segmented-item--active');
        p.distanceUnit = btn.dataset.isdUnit;
        const pill = this.container.querySelector('#isd-unit-pill');
        if (pill) pill.textContent = p.distanceUnit === 'm' ? 'Meters (m)' : 'Kilometers (km)';
      });
    });

    // Geohash to Shapefile params
    const modeButtons = this.container.querySelectorAll('[data-mode]');
    const shpSizeGroup = this.container.querySelector('#shp-size-group');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        modeButtons.forEach(b => b.classList.remove('rf-segmented-item--active'));
        btn.classList.add('rf-segmented-item--active');
        p.mode = btn.dataset.mode;
        if (shpSizeGroup) {
          if (p.mode === 'custom') {
            shpSizeGroup.style.opacity = '1';
            shpSizeGroup.style.pointerEvents = 'auto';
          } else {
            shpSizeGroup.style.opacity = '0.45';
            shpSizeGroup.style.pointerEvents = 'none';
          }
        }
      });
    });

    const sizeSlider = this.container.querySelector('#param-size-slider');
    const sizeNum = this.container.querySelector('#param-size-num');
    const sizeDisplay = this.container.querySelector('#size-display');
    if (sizeSlider && sizeNum) {
      const syncSize = (v) => {
        p.sizeM = parseFloat(v);
        sizeSlider.value = v;
        sizeNum.value = v;
        if (sizeDisplay) sizeDisplay.textContent = `${v}m`;
      };
      sizeSlider.addEventListener('input', (e) => syncSize(e.target.value));
      sizeNum.addEventListener('input', (e) => syncSize(e.target.value));
    }

    // Geohash format toggles (.xlsx / .csv)
    const fmtButtons = this.container.querySelectorAll('[data-fmt]');
    fmtButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        fmtButtons.forEach(b => b.classList.remove('rf-segmented-item--active'));
        btn.classList.add('rf-segmented-item--active');
        p.outputFormat = btn.dataset.fmt;
      });
    });

    // LatLon to Geohash Precision slider
    const ghPrecSlider = this.container.querySelector('#param-ghprec-slider');
    const ghPrecNum = this.container.querySelector('#param-ghprec-num');
    const precDisplay = this.container.querySelector('#prec-display');
    const precResText = this.container.querySelector('#prec-res-text');
    if (ghPrecSlider && ghPrecNum) {
      const syncPrec = (v) => {
        p.precision = parseInt(v, 10);
        ghPrecSlider.value = v;
        ghPrecNum.value = v;
        if (precDisplay) precDisplay.textContent = `${v} Characters`;
        if (precResText) precResText.textContent = `Resolution: ${this.getPrecisionResolution(p.precision)}`;
      };
      ghPrecSlider.addEventListener('input', (e) => syncPrec(e.target.value));
      ghPrecNum.addEventListener('input', (e) => syncPrec(e.target.value));
    }
  }

  buildFormData() {
    const fd = new FormData();
    const p = this.ws.params;

    if (this.toolId === 'isd-calculator') {
      fd.append('file_a', this.ws.fileA);
      fd.append('file_b', this.ws.fileB);
      fd.append('n_nearest', String(p.nNearest || 1));
      fd.append('distance_unit', String(p.distanceUnit || 'km'));
      if (this.ws.mappingsA['lat_col_a']) fd.append('lat_col_a', this.ws.mappingsA['lat_col_a']);
      if (this.ws.mappingsA['lon_col_a']) fd.append('lon_col_a', this.ws.mappingsA['lon_col_a']);
      if (this.ws.mappingsA['name_col_a']) fd.append('name_col_a', this.ws.mappingsA['name_col_a']);
      if (this.ws.mappingsB['lat_col_b']) fd.append('lat_col_b', this.ws.mappingsB['lat_col_b']);
      if (this.ws.mappingsB['lon_col_b']) fd.append('lon_col_b', this.ws.mappingsB['lon_col_b']);
      if (this.ws.mappingsB['name_col_b']) fd.append('name_col_b', this.ws.mappingsB['name_col_b']);
      return fd;
    }

    fd.append('file', this.ws.file);

    switch (this.toolId) {
      case 'excel-to-kml':
        fd.append('folder_name', p.folderName || 'SITENAME');
        fd.append('scale', String(p.scale || 0.7));
        fd.append('color_rgb', p.colorRgb || '#550000');
        fd.append('label_color', p.labelColor || '#FFFF00');
        if (this.ws.mappings['lat_col']) fd.append('lat_col', this.ws.mappings['lat_col']);
        if (this.ws.mappings['lon_col']) fd.append('lon_col', this.ws.mappings['lon_col']);
        if (this.ws.mappings['name_col']) fd.append('name_col', this.ws.mappings['name_col']);
        break;

      case 'prb-kml':
        fd.append('color_by_metric', p.colorByMetric || 'DL_PRB');
        fd.append('opacity_percent', String(p.opacityPercent || 40));
        fd.append('include_legend', String(p.includeLegend !== false));
        fd.append('sheet_name', p.sheetName || 'Sheet1');
        if (p.bands && Array.isArray(p.bands)) {
          const bandsDict = {};
          p.bands.forEach(b => {
            if (b.name) {
              bandsDict[b.name] = {
                altitude: parseFloat(b.altitude) || 30,
                beamwidth: parseFloat(b.beamwidth) || 65,
                radius_km: parseFloat(b.radius_km || (b.radius_m ? b.radius_m / 1000 : 0.05))
              };
            }
          });
          fd.append('custom_bands', JSON.stringify(bandsDict));
        }
        if (p.ranges) {
          const dl1 = parseFloat(p.ranges.dl_t1 ?? 35);
          const dl2 = parseFloat(p.ranges.dl_t2 ?? 60);
          const dl3 = parseFloat(p.ranges.dl_t3 ?? (p.ranges.dl_mid ?? 75));
          const dl4 = parseFloat(p.ranges.dl_t4 ?? (p.ranges.dl_high ?? 90));

          const ul1 = parseFloat(p.ranges.ul_t1 ?? 35);
          const ul2 = parseFloat(p.ranges.ul_t2 ?? 60);
          const ul3 = parseFloat(p.ranges.ul_t3 ?? (p.ranges.ul_mid ?? 75));
          const ul4 = parseFloat(p.ranges.ul_t4 ?? (p.ranges.ul_high ?? 90));

          const rrc1 = parseFloat(p.ranges.rrc_t1 ?? 40);
          const rrc2 = parseFloat(p.ranges.rrc_t2 ?? 60);
          const rrc3 = parseFloat(p.ranges.rrc_t3 ?? (p.ranges.rrc_mid ?? 90));
          const rrc4 = parseFloat(p.ranges.rrc_t4 ?? (p.ranges.rrc_high ?? 120));

          const customRanges = {
            dl_prb: [
              { min: 0, max: 0, color: 'BFBFBF' },
              { min: 0, max: dl1, color: '0000FF' },
              { min: dl1, max: dl2, color: '00FF00' },
              { min: dl2, max: dl3, color: 'FFFF00' },
              { min: dl3, max: dl4, color: 'FFBF00' },
              { min: dl4, max: 100, color: 'FF0000' }
            ],
            ul_prb: [
              { min: 0, max: 0, color: 'BFBFBF' },
              { min: 0, max: ul1, color: '0000FF' },
              { min: ul1, max: ul2, color: '00FF00' },
              { min: ul2, max: ul3, color: 'FFFF00' },
              { min: ul3, max: ul4, color: 'FFBF00' },
              { min: ul4, max: 100, color: 'FF0000' }
            ],
            rrc: [
              { min: 0, max: 0, color: 'BFBFBF' },
              { min: 0, max: rrc1, color: '0000FF' },
              { min: rrc1, max: rrc2, color: '00FF00' },
              { min: rrc2, max: rrc3, color: 'FFFF00' },
              { min: rrc3, max: rrc4, color: 'FFBF00' },
              { min: rrc4, max: 999999, color: 'FF0000' }
            ]
          };
          fd.append('custom_ranges', JSON.stringify(customRanges));
        }
        {
          let leftLogo = this.getEffectiveLeftLogo(p);
          let rightLogo = this.getEffectiveRightLogo(p);
          if (leftLogo && leftLogo.startsWith('/') && typeof window !== 'undefined' && window.location.origin) {
            leftLogo = window.location.origin + leftLogo;
          }
          if (rightLogo && rightLogo.startsWith('/') && typeof window !== 'undefined' && window.location.origin) {
            rightLogo = window.location.origin + rightLogo;
          }
          if (leftLogo) fd.append('left_logo_url', leftLogo);
          if (rightLogo) fd.append('right_logo_url', rightLogo);
        }
        break;

      case 'geohash-to-shp':
        fd.append('mode', p.mode || 'default');
        fd.append('size_m', String(p.sizeM || 500));
        if (this.ws.mappings['geohash_col']) fd.append('geohash_col', this.ws.mappings['geohash_col']);
        break;

      case 'geohash-to-latlon':
        fd.append('output_format', p.outputFormat || 'xlsx');
        if (this.ws.mappings['geohash_col']) fd.append('geohash_col', this.ws.mappings['geohash_col']);
        break;

      case 'latlon-to-geohash':
        fd.append('precision', String(p.precision || 7));
        fd.append('output_format', p.outputFormat || 'xlsx');
        if (this.ws.mappings['lat_col']) fd.append('lat_col', this.ws.mappings['lat_col']);
        if (this.ws.mappings['lon_col']) fd.append('lon_col', this.ws.mappings['lon_col']);
        break;
    }

    return fd;
  }

  bindActions() {
    const previewBtn = this.container.querySelector('#action-preview-btn');
    const executeBtn = this.container.querySelector('#action-execute-btn');
    const spinner = this.container.querySelector('#action-execute-spinner');
    const execText = this.container.querySelector('#action-execute-text');

    if (previewBtn) {
      previewBtn.addEventListener('click', async () => {
        if (!this.canCalculate()) return;
        const start = performance.now();
        try {
          previewBtn.disabled = true;
          executeBtn.disabled = true;
          toast.info('Requesting calculation preview from engine...');
          const fd = this.buildFormData();
          const res = await ApiService.processTool(this.toolId, fd, true);
          this.ws.lastExecutionTimeMs = Math.round(performance.now() - start);
          this.ws.previewData = res;
          this.ws.resultSummary = res.summary;
          toast.success(`Preview generated in ${this.ws.lastExecutionTimeMs}ms!`);
          this.showResultsZone();
        } catch (err) {
          toast.error(`Preview failed: ${err.message}`);
        } finally {
          previewBtn.disabled = !this.canCalculate();
          executeBtn.disabled = !this.canCalculate();
        }
      });
    }

    if (executeBtn) {
      executeBtn.addEventListener('click', async () => {
        if (!this.canCalculate()) return;
        const start = performance.now();
        try {
          previewBtn.disabled = true;
          executeBtn.disabled = true;
          if (spinner) spinner.style.display = 'inline-block';
          if (execText) execText.textContent = 'Processing & Packaging...';
          toast.info('Running pure calculation engine...');

          const fd = this.buildFormData();
          const res = await ApiService.processTool(this.toolId, fd, false);
          this.ws.lastExecutionTimeMs = Math.round(performance.now() - start);
          this.ws.resultSummary = res.summary;
          toast.success(`Generated deliverable: ${res.filename} (${Math.round(res.size / 1024)} KB)`);
          this.showResultsZone();
        } catch (err) {
          toast.error(`Processing failed: ${err.message}`);
        } finally {
          if (spinner) spinner.style.display = 'none';
          if (execText) execText.textContent = '⚡ Process & Generate Deliverable';
          previewBtn.disabled = !this.canCalculate();
          executeBtn.disabled = !this.canCalculate();
        }
      });
    }
  }

  showResultsZone() {
    const card = this.container.querySelector('#zone4-results-card');
    const body = this.container.querySelector('#zone4-results-body');
    if (card && body) {
      card.style.display = 'block';
      body.innerHTML = this.renderResultsContent();
      this.bindResultsActions();
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  bindResultsActions() {
    const dlCta = this.container.querySelector('#download-deliverable-cta');
    if (dlCta) {
      dlCta.addEventListener('click', () => {
        const execBtn = this.container.querySelector('#action-execute-btn');
        if (execBtn) execBtn.click();
      });
    }

    const copyBtn = this.container.querySelector('#results-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const table = this.container.querySelector('#preview-data-table');
        if (!table) {
          toast.info('No table data to copy.');
          return;
        }
        let text = '';
        const rows = table.querySelectorAll('tr');
        rows.forEach(r => {
          const cells = Array.from(r.querySelectorAll('th, td')).map(c => c.textContent.trim());
          text += cells.join('\t') + '\n';
        });
        navigator.clipboard.writeText(text).then(() => {
          toast.success('Preview table copied to clipboard (TSV format)!');
        }).catch(() => {
          toast.error('Failed to copy to clipboard.');
        });
      });
    }

    const fsBtn = this.container.querySelector('#results-fullscreen-btn');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        const card = this.container.querySelector('#zone4-results-card');
        if (card) {
          if (!document.fullscreenElement) {
            card.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen();
          }
        }
      });
    }

    // ISD tab buttons
    const tabRes = this.container.querySelector('#isd-tab-result');
    const tabSum = this.container.querySelector('#isd-tab-summary');
    if (tabRes && tabSum) {
      tabRes.addEventListener('click', () => {
        this.activeSheetTab = 'result';
        tabRes.classList.add('tab-btn--active');
        tabSum.classList.remove('tab-btn--active');
        const wrap = this.container.querySelector('.rf-table-wrap');
        const summary = this.ws.resultSummary || (this.ws.previewData ? this.ws.previewData.summary : null);
        if (wrap && summary) {
          wrap.innerHTML = this.renderPreviewTableGrid(summary, summary.preview_rows || []);
        }
      });
      tabSum.addEventListener('click', () => {
        this.activeSheetTab = 'summary';
        tabSum.classList.add('tab-btn--active');
        tabRes.classList.remove('tab-btn--active');
        const wrap = this.container.querySelector('.rf-table-wrap');
        const summary = this.ws.resultSummary || (this.ws.previewData ? this.ws.previewData.summary : null);
        if (wrap && summary) {
          wrap.innerHTML = this.renderPreviewTableGrid(summary, summary.preview_rows || []);
        }
      });
    }
  }

  /* ==========================================================================
     Geohash Converter View & Interaction Logic (geohash.co style UX)
     ========================================================================== */

  renderGeohashConverter() {
    const meta = this.getToolMeta();
    const params = this.ws.params || {};
    const curHash = params.geohash || 'qqguygv';
    const curLat = params.latitude !== undefined ? Number(params.latitude) : -6.175392;
    const curLon = params.longitude !== undefined ? Number(params.longitude) : 106.827153;
    const curPrec = params.precision || 7;

    let decoded = null;
    let neighbors = null;
    let bits = null;
    let isValid = ghIsValid(curHash);

    if (isValid) {
      try {
        decoded = ghDecode(curHash);
        neighbors = ghGetNeighbors(curHash);
        bits = ghToBitRep(curHash);
      } catch (e) {
        isValid = false;
      }
    }

    const precMeta = PRECISION_META[curPrec] || { label: 'Custom', scale: 'Block' };

    this.container.innerHTML = `
      <div class="workspace-container">
        <!-- WORKSPACE TOOLBAR HEADER -->
        <header class="workspace-header-bar">
          <div class="workspace-title-group">
            <div class="workspace-icon-box">
              <img src="/assets/icons/${meta.icon}" alt="${meta.title}">
            </div>
            <div>
              <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                <h1 class="workspace-title">${meta.title}</h1>
                <span class="zone-badge">CRS EPSG:4326</span>
                <span class="zone-badge" style="background: rgba(16, 185, 129, 0.15); color: #10B981; border-color: rgba(16, 185, 129, 0.3);">
                  ${state.lang === 'id' ? 'Interaktif ⇄' : 'Interactive ⇄'}
                </span>
                <span class="zone-badge">Base-32 Morton</span>
              </div>
              <p class="workspace-desc">${meta.description}</p>
            </div>
          </div>

          <div class="workspace-header-actions">
            <button class="rf-btn rf-btn-ghost" id="gh-reset-btn" title="Reset to default coordinates">
              <span>🔄 ${state.t('btn_reset', 'Reset')}</span>
            </button>
          </div>
        </header>

        <!-- GEOHASH CONVERTER LAYOUT -->
        <div class="gh-converter-wrap">
          <div class="gh-converter-grid">
            <!-- LEFT COLUMN: TWO-WAY INPUTS & CONTROLS -->
            <div style="display: flex; flex-direction: column; gap: var(--spacing-lg);">
              
              <!-- CARD 1: GEOHASH STRING (DECODE) -->
              <div class="gh-card">
                <div class="gh-card__header">
                  <h2 class="gh-card__title">
                    <span>#️⃣</span>
                    <span>${state.lang === 'id' ? 'Kode String GeoHash' : 'GeoHash String'}</span>
                  </h2>
                  <span class="gh-card__badge" id="gh-status-badge">
                    ${isValid ? `● Valid Base-32 (${curHash.length} chars)` : `⚠️ ${state.lang === 'id' ? 'Tidak Valid' : 'Invalid Base-32'}`}
                  </span>
                </div>

                <div class="gh-big-input-wrap">
                  <input 
                    type="text" 
                    id="gh-input-hash" 
                    class="gh-big-input" 
                    placeholder="e.g. qqguygv" 
                    value="${curHash}" 
                    maxlength="12" 
                    autocomplete="off" 
                    spellcheck="false"
                  >
                  <div style="position: absolute; right: 8px; display: flex; gap: 4px;">
                    <button class="rf-btn rf-btn-ghost" id="gh-copy-hash-btn" title="Copy GeoHash" style="padding: 6px 10px; font-size: 0.75rem;">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    </button>
                    <button class="rf-btn rf-btn-ghost" id="gh-clear-hash-btn" title="Clear input" style="padding: 6px 10px; font-size: 0.75rem;">
                      <span>✕</span>
                    </button>
                  </div>
                </div>

                <!-- Character Token Breakdown -->
                <div>
                  <div class="gh-field-label" style="margin-bottom: 4px;">
                    <span>${state.lang === 'id' ? 'Karakter Base-32 (5-bit per karakter)' : 'Base-32 Characters (5-bit per token)'}</span>
                    <span style="font-family: var(--font-mono); font-size: 0.6875rem;" id="gh-bits-summary">
                      ${bits ? `${bits.totalBits} bits (${bits.lonBits.length} lon / ${bits.latBits.length} lat)` : ''}
                    </span>
                  </div>
                  <div class="gh-char-tokens" id="gh-char-tokens">
                    ${this.renderCharTokens(curHash)}
                  </div>
                </div>
              </div>

              <!-- CARD 2: LAT / LONG COORDINATES (ENCODE) -->
              <div class="gh-card">
                <div class="gh-card__header">
                  <h2 class="gh-card__title">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-primary);"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    <span>${state.lang === 'id' ? 'Koordinat WGS84 (Lat / Long)' : 'WGS84 Coordinates (Lat / Long)'}</span>
                  </h2>
                  <div style="display: flex; gap: 6px;">
                    <button class="rf-btn rf-btn-secondary" id="gh-copy-coords-btn" style="padding: 3px 10px; font-size: 0.75rem;">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      <span>${state.lang === 'id' ? 'Salin Koordinat' : 'Copy Coords'}</span>
                    </button>
                    <button class="rf-btn rf-btn-ghost" id="gh-swap-coords-btn" title="Swap Lat and Long" style="padding: 3px 8px; font-size: 0.75rem;">
                      <span>⇄</span>
                    </button>
                  </div>
                </div>

                <div class="gh-coords-grid">
                  <div class="gh-field-group">
                    <label class="gh-field-label" for="gh-input-lat">
                      <span>${state.lang === 'id' ? 'Lintang / Latitude (°N/S)' : 'Latitude (°N/S)'}</span>
                      <span style="color: var(--color-text-muted); font-size: 0.6875rem;">-90 to +90</span>
                    </label>
                    <input 
                      type="number" 
                      id="gh-input-lat" 
                      class="gh-input" 
                      step="any" 
                      min="-90" 
                      max="90" 
                      value="${curLat.toFixed(6)}"
                    >
                  </div>

                  <div class="gh-field-group">
                    <label class="gh-field-label" for="gh-input-lon">
                      <span>${state.lang === 'id' ? 'Bujur / Longitude (°E/W)' : 'Longitude (°E/W)'}</span>
                      <span style="color: var(--color-text-muted); font-size: 0.6875rem;">-180 to +180</span>
                    </label>
                    <input 
                      type="number" 
                      id="gh-input-lon" 
                      class="gh-input" 
                      step="any" 
                      min="-180" 
                      max="180" 
                      value="${curLon.toFixed(6)}"
                    >
                  </div>
                </div>

                <!-- Combined Quick-Paste Input -->
                <div class="gh-field-group" style="margin-top: 4px;">
                  <label class="gh-field-label" for="gh-input-combined">
                    <span>${state.lang === 'id' ? 'Tempel Cepat Pasangan "Lat, Long"' : 'Quick-Paste "Lat, Long" Pair'}</span>
                    <span style="font-size: 0.6875rem; color: var(--color-text-muted);">${state.lang === 'id' ? 'Format: Lat, Lon' : 'Format: Lat, Lon'}</span>
                  </label>
                  <input 
                    type="text" 
                    id="gh-input-combined" 
                    class="gh-input" 
                    placeholder="-6.175392, 106.827153" 
                    value="${curLat.toFixed(6)}, ${curLon.toFixed(6)}"
                  >
                </div>
              </div>

              <!-- CARD 3: PRECISION CONTROL (1 - 12) -->
              <div class="gh-card">
                <div class="gh-card__header">
                  <h2 class="gh-card__title">
                    <span>🎯</span>
                    <span>${state.lang === 'id' ? 'Pengaturan Presisi (1 – 12)' : 'Precision Tuning (1 – 12)'}</span>
                  </h2>
                  <span class="gh-card__badge" id="gh-prec-badge" style="background: rgba(56, 189, 248, 0.15); color: var(--color-primary); border-color: rgba(56, 189, 248, 0.3);">
                    ${curPrec} chars &bull; ${precMeta.label}
                  </span>
                </div>

                <div class="gh-precision-control">
                  <div class="gh-slider-row">
                    <button class="rf-btn rf-btn-secondary" id="gh-prec-dec-btn" style="padding: 4px 12px; font-size: 0.8125rem; font-weight: 700;">-</button>
                    <input 
                      type="range" 
                      id="gh-slider-precision" 
                      class="gh-slider" 
                      min="1" 
                      max="12" 
                      step="1" 
                      value="${curPrec}"
                    >
                    <button class="rf-btn rf-btn-secondary" id="gh-prec-inc-btn" style="padding: 4px 12px; font-size: 0.8125rem; font-weight: 700;">+</button>
                    <span style="font-family: var(--font-mono); font-size: 1.1rem; font-weight: 700; min-width: 28px; text-align: center;" id="gh-prec-val-display">
                      ${curPrec}
                    </span>
                  </div>

                  <!-- Quick Presets -->
                  <div class="gh-quick-prec-pills" id="gh-quick-prec-pills">
                    ${[4, 5, 6, 7, 8, 9, 10].map(p => `
                      <button class="gh-quick-pill ${p === curPrec ? 'gh-quick-pill--active' : ''}" data-prec="${p}">
                        P${p} (${PRECISION_META[p].scale})
                      </button>
                    `).join('')}
                  </div>

                  <div style="font-size: 0.8125rem; color: var(--color-text-secondary); margin-top: 4px; padding: 6px 10px; background: var(--color-bg-sunken); border-radius: var(--rounded-xs); border: 1px solid var(--color-border-subtle);" id="gh-prec-desc-box">
                    <strong>${state.lang === 'id' ? 'Dimensi Sel Geodesi:' : 'Cell Geodesic Dimensions:'}</strong>
                    ${precMeta.label} (${precMeta.scale})
                  </div>
                </div>
              </div>

            </div>

            <!-- RIGHT COLUMN: BOUNDING BOX & 8-NEIGHBOR EXPLORER -->
            <div style="display: flex; flex-direction: column; gap: var(--spacing-lg);">
              
              <!-- CARD 4: BOUNDING BOX & EXTENTS -->
              <div class="gh-card">
                <div class="gh-card__header">
                  <h2 class="gh-card__title">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--color-primary);"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                    <span>${state.lang === 'id' ? 'Batas Sel Bounding Box' : 'Bounding Box & Dimensions'}</span>
                  </h2>
                  <div style="display: flex; gap: 6px;">
                    <button class="rf-btn rf-btn-secondary" id="gh-copy-bbox-btn" style="padding: 3px 10px; font-size: 0.75rem;">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      <span>BBox JSON</span>
                    </button>
                    <button class="rf-btn rf-btn-ghost" id="gh-copy-geojson-btn" style="padding: 3px 10px; font-size: 0.75rem;">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
                      <span>GeoJSON</span>
                    </button>
                  </div>
                </div>

                <div class="gh-bbox-diagram" id="gh-bbox-diagram">
                  ${this.renderBboxDiagram(decoded)}
                </div>

                <table class="gh-dim-table" id="gh-dim-table">
                  ${this.renderDimTable(decoded)}
                </table>
              </div>

              <!-- CARD 5: 8-NEIGHBOR COMPASS PAD (3X3 GRID) -->
              <div class="gh-card">
                <div class="gh-card__header">
                  <h2 class="gh-card__title">
                    <span>🧭</span>
                    <span>${state.lang === 'id' ? 'Eksplorasi 8-Tetangga Terdekat' : '8-Neighbor Adjacent Explorer'}</span>
                  </h2>
                  <span class="gh-card__badge">${state.lang === 'id' ? '3x3 Matriks' : '3x3 Matrix'}</span>
                </div>
                <div style="font-size: 0.75rem; color: var(--color-text-secondary);">
                  ${state.lang === 'id' ? 'Klik sel tetangga untuk berpindah koordinat secara interaktif:' : 'Click any neighbor cell to navigate to that adjacent bucket:'}
                </div>

                <div class="gh-neighbor-grid" id="gh-neighbor-grid">
                  ${this.renderNeighborGrid(curHash, neighbors)}
                </div>
              </div>

              <!-- CARD 6: PRESETS & BACKEND TELEMETRY -->
              <div class="gh-card">
                <div class="gh-card__header">
                  <h2 class="gh-card__title">
                    <span>📍</span>
                    <span>${state.lang === 'id' ? 'Pilihan Landmark Populer' : 'Quick Landmark Presets'}</span>
                  </h2>
                  <span class="gh-card__badge" id="gh-backend-sync" style="background: rgba(16, 185, 129, 0.1); color: #10B981; border-color: rgba(16, 185, 129, 0.3);">
                    ● Backend Sync
                  </span>
                </div>

                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                  <button class="rf-btn rf-btn-ghost gh-preset-btn" data-lat="-6.175392" data-lon="106.827153" data-name="Monas Jakarta" style="padding: 5px 10px; font-size: 0.75rem;">
                    🇮🇩 Monas Jakarta
                  </button>
                  <button class="rf-btn rf-btn-ghost gh-preset-btn" data-lat="-6.218335" data-lon="106.802216" data-name="GBK Senayan" style="padding: 5px 10px; font-size: 0.75rem;">
                    🇮🇩 GBK Stadium
                  </button>
                  <button class="rf-btn rf-btn-ghost gh-preset-btn" data-lat="-6.230556" data-lon="106.819444" data-name="Telkom Landmark" style="padding: 5px 10px; font-size: 0.75rem;">
                    🏢 Telkom Landmark
                  </button>
                  <button class="rf-btn rf-btn-ghost gh-preset-btn" data-lat="48.858370" data-lon="2.294480" data-name="Eiffel Tower" style="padding: 5px 10px; font-size: 0.75rem;">
                    🇫🇷 Eiffel Tower
                  </button>
                  <button class="rf-btn rf-btn-ghost gh-preset-btn" data-lat="35.658580" data-lon="139.745430" data-name="Tokyo Tower" style="padding: 5px 10px; font-size: 0.75rem;">
                    🇯🇵 Tokyo Tower
                  </button>
                  <button class="rf-btn rf-btn-ghost gh-preset-btn" data-lat="40.758896" data-lon="-73.985130" data-name="Times Square" style="padding: 5px 10px; font-size: 0.75rem;">
                    🇺🇸 Times Square
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    `;

    this.bindGeohashConverter();
  }

  renderCharTokens(hash) {
    if (!hash) return '';
    const clean = String(hash).trim().toLowerCase();
    return clean.split('').map((c, i) => {
      const idx = BASE32.indexOf(c);
      const bin = idx !== -1 ? idx.toString(2).padStart(5, '0') : '?????';
      return `
        <div class="gh-char-chip" title="Character '${c}' = decimal ${idx}, binary ${bin}">
          <span>${c}</span>
          <span class="bits">${bin}</span>
        </div>
      `;
    }).join('');
  }

  renderBboxDiagram(decoded) {
    if (!decoded || !decoded.boundingBox) {
      return `
        <div style="text-align: center; padding: 24px; color: var(--color-text-muted);">
          Awaiting valid geohash...
        </div>
      `;
    }
    const b = decoded.boundingBox;
    return `
      <div class="gh-bbox-compass">
        <div class="gh-bbox-node north" title="Northernmost Latitude">
          <span style="color: var(--color-text-muted); font-size: 0.65rem; display: block;">NORTH (Max Lat)</span>
          <strong>${b.maxLat.toFixed(6)}°</strong>
        </div>
        <div class="gh-bbox-node west" title="Westernmost Longitude">
          <span style="color: var(--color-text-muted); font-size: 0.65rem; display: block;">WEST (Min Lon)</span>
          <strong>${b.minLon.toFixed(6)}°</strong>
        </div>
        <div class="gh-bbox-node center" title="Cell Centroid Coordinate">
          <span style="font-size: 0.65rem; color: var(--color-primary); display: block;">CENTROID</span>
          <span>${decoded.latitude.toFixed(6)}°, ${decoded.longitude.toFixed(6)}°</span>
        </div>
        <div class="gh-bbox-node east" title="Easternmost Longitude">
          <span style="color: var(--color-text-muted); font-size: 0.65rem; display: block;">EAST (Max Lon)</span>
          <strong>${b.maxLon.toFixed(6)}°</strong>
        </div>
        <div class="gh-bbox-node south" title="Southernmost Latitude">
          <span style="color: var(--color-text-muted); font-size: 0.65rem; display: block;">SOUTH (Min Lat)</span>
          <strong>${b.minLat.toFixed(6)}°</strong>
        </div>
      </div>
    `;
  }

  renderDimTable(decoded) {
    if (!decoded || !decoded.dimensions) {
      return `
        <tbody>
          <tr>
            <td colspan="2" style="text-align: center; color: var(--color-text-muted);">No dimension data</td>
          </tr>
        </tbody>
      `;
    }
    const d = decoded.dimensions;
    const isId = state.lang === 'id';
    const heightStr = d.heightM >= 1000 ? `${d.heightKm.toFixed(3)} km` : `${d.heightM.toFixed(1)} m`;
    const widthStr = d.widthM >= 1000 ? `${d.widthKm.toFixed(3)} km` : `${d.widthM.toFixed(1)} m`;
    const areaKm2 = d.heightKm * d.widthKm;
    const areaStr = areaKm2 >= 1 ? `${areaKm2.toFixed(2)} km²` : `${(d.heightM * d.widthM).toFixed(0)} m²`;

    return `
      <tbody>
        <tr>
          <td class="label">${isId ? 'Tinggi Sel (Rentang Lintang)' : 'Cell Height (Lat Span)'}</td>
          <td class="val">${heightStr} (${d.latSpanDeg.toFixed(6)}°)</td>
        </tr>
        <tr>
          <td class="label">${isId ? 'Lebar Sel (Rentang Bujur)' : 'Cell Width (Lon Span)'}</td>
          <td class="val">${widthStr} (${d.lonSpanDeg.toFixed(6)}°)</td>
        </tr>
        <tr>
          <td class="label">${isId ? 'Perkiraan Luas Area' : 'Approximate Area'}</td>
          <td class="val">${areaStr}</td>
        </tr>
        <tr>
          <td class="label">${isId ? 'Toleransi Margin Error' : 'Centroid Error Margin'}</td>
          <td class="val">&plusmn;${decoded.error.latitude.toFixed(6)}° Lat, &plusmn;${decoded.error.longitude.toFixed(6)}° Lon</td>
        </tr>
      </tbody>
    `;
  }

  renderNeighborGrid(hash, neighbors) {
    const items = [
      { dir: 'NW', key: 'nw', label: '↖ NW' },
      { dir: 'N', key: 'n', label: '↑ N' },
      { dir: 'NE', key: 'ne', label: '↗ NE' },
      { dir: 'W', key: 'w', label: '← W' },
      { dir: 'CENTER', key: 'center', label: '● CENTER' },
      { dir: 'E', key: 'e', label: '→ E' },
      { dir: 'SW', key: 'sw', label: '↙ SW' },
      { dir: 'S', key: 's', label: '↓ S' },
      { dir: 'SE', key: 'se', label: '↘ SE' }
    ];

    return items.map(item => {
      if (item.key === 'center') {
        return `
          <div class="gh-neighbor-btn gh-neighbor-btn--center" title="Current Active Geohash">
            <span class="gh-neighbor-dir">${item.label}</span>
            <span class="gh-neighbor-val">${hash}</span>
          </div>
        `;
      }
      const nHash = neighbors ? neighbors[item.key] : null;
      return `
        <button 
          type="button" 
          class="gh-neighbor-btn gh-neighbor-item-btn" 
          data-neighbor-hash="${nHash || ''}" 
          title="Navigate to ${item.dir} neighbor: ${nHash || ''}"
          ${!nHash ? 'disabled' : ''}
        >
          <span class="gh-neighbor-dir">${item.label}</span>
          <span class="gh-neighbor-val">${nHash || '—'}</span>
        </button>
      `;
    }).join('');
  }

  bindGeohashConverter() {
    const inputHash = this.container.querySelector('#gh-input-hash');
    const inputLat = this.container.querySelector('#gh-input-lat');
    const inputLon = this.container.querySelector('#gh-input-lon');
    const inputCombined = this.container.querySelector('#gh-input-combined');
    const sliderPrec = this.container.querySelector('#gh-slider-precision');
    const btnDec = this.container.querySelector('#gh-prec-dec-btn');
    const btnInc = this.container.querySelector('#gh-prec-inc-btn');
    const btnCopyHash = this.container.querySelector('#gh-copy-hash-btn');
    const btnClearHash = this.container.querySelector('#gh-clear-hash-btn');
    const btnCopyCoords = this.container.querySelector('#gh-copy-coords-btn');
    const btnSwapCoords = this.container.querySelector('#gh-swap-coords-btn');
    const btnCopyBbox = this.container.querySelector('#gh-copy-bbox-btn');
    const btnCopyGeoJson = this.container.querySelector('#gh-copy-geojson-btn');
    const btnReset = this.container.querySelector('#gh-reset-btn');

    const statusBadge = this.container.querySelector('#gh-status-badge');
    const precBadge = this.container.querySelector('#gh-prec-badge');
    const precNum = this.container.querySelector('#gh-prec-val-display');
    const precDescBox = this.container.querySelector('#gh-prec-desc-box');
    const charTokens = this.container.querySelector('#gh-char-tokens');
    const bitsSummary = this.container.querySelector('#gh-bits-summary');
    const bboxDiagram = this.container.querySelector('#gh-bbox-diagram');
    const dimTable = this.container.querySelector('#gh-dim-table');
    const neighborGrid = this.container.querySelector('#gh-neighbor-grid');
    const backendSyncBadge = this.container.querySelector('#gh-backend-sync');

    let isInternalUpdate = false;
    let syncTimeout = null;

    const copyText = async (text, msg) => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        toast.success(msg || state.t('toast_copied', 'Copied to clipboard!'));
      } catch (e) {
        toast.error('Could not copy to clipboard');
      }
    };

    const scheduleBackendSync = (hash, lat, lon, prec) => {
      if (syncTimeout) clearTimeout(syncTimeout);
      if (backendSyncBadge) {
        backendSyncBadge.innerHTML = '● Syncing...';
        backendSyncBadge.style.color = '#38BDF8';
      }
      syncTimeout = setTimeout(async () => {
        try {
          const t0 = performance.now();
          await ApiService.convertGeohash({ geohash: hash, latitude: lat, longitude: lon, precision: prec });
          const ms = Math.round(performance.now() - t0);
          if (backendSyncBadge) {
            backendSyncBadge.innerHTML = `● Verified (${ms}ms)`;
            backendSyncBadge.style.color = '#10B981';
          }
        } catch (e) {
          if (backendSyncBadge) {
            backendSyncBadge.innerHTML = '● Client Engine';
            backendSyncBadge.style.color = '#94A3B8';
          }
        }
      }, 350);
    };

    const bindNeighborButtons = () => {
      if (!neighborGrid) return;
      neighborGrid.querySelectorAll('.gh-neighbor-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const nHash = btn.dataset.neighborHash;
          if (nHash && ghIsValid(nHash)) {
            if (inputHash) inputHash.value = nHash;
            updateFromHash(nHash);
            toast.info(`Navigated to ${nHash}`);
          }
        });
      });
    };

    const updatePills = (prec) => {
      const pills = this.container.querySelectorAll('.gh-quick-pill');
      pills.forEach(pill => {
        const p = parseInt(pill.dataset.prec, 10);
        if (p === prec) {
          pill.classList.add('gh-quick-pill--active');
        } else {
          pill.classList.remove('gh-quick-pill--active');
        }
      });
    };

    const updateFromHash = (rawHash, skipInputs = false) => {
      const hash = String(rawHash).trim().toLowerCase();
      const valid = ghIsValid(hash);

      if (!valid) {
        if (statusBadge) {
          statusBadge.innerHTML = `⚠️ ${state.lang === 'id' ? 'Karakter Base-32 tidak valid' : 'Invalid Base-32 chars'}`;
          statusBadge.style.color = '#EF4444';
        }
        return;
      }

      try {
        const decoded = ghDecode(hash);
        const neighbors = ghGetNeighbors(hash);
        const bits = ghToBitRep(hash);
        const prec = hash.length;
        const pMeta = PRECISION_META[prec] || { label: 'Custom', scale: 'Block' };

        this.ws.params.geohash = hash;
        this.ws.params.latitude = decoded.latitude;
        this.ws.params.longitude = decoded.longitude;
        this.ws.params.precision = prec;

        isInternalUpdate = true;
        if (!skipInputs) {
          if (inputLat) inputLat.value = decoded.latitude.toFixed(6);
          if (inputLon) inputLon.value = decoded.longitude.toFixed(6);
          if (inputCombined) inputCombined.value = `${decoded.latitude.toFixed(6)}, ${decoded.longitude.toFixed(6)}`;
        }
        if (sliderPrec) sliderPrec.value = prec;
        if (precNum) precNum.textContent = prec;
        isInternalUpdate = false;

        if (statusBadge) {
          statusBadge.innerHTML = `● Valid Base-32 (${prec} chars)`;
          statusBadge.style.color = '#10B981';
        }
        if (precBadge) {
          precBadge.innerHTML = `${prec} chars &bull; ${pMeta.label}`;
        }
        if (precDescBox) {
          precDescBox.innerHTML = `<strong>${state.lang === 'id' ? 'Dimensi Sel Geodesi:' : 'Cell Geodesic Dimensions:'}</strong> ${pMeta.label} (${pMeta.scale})`;
        }
        if (charTokens) {
          charTokens.innerHTML = this.renderCharTokens(hash);
        }
        if (bitsSummary && bits) {
          bitsSummary.textContent = `${bits.totalBits} bits (${bits.lonBits.length} lon / ${bits.latBits.length} lat)`;
        }
        if (bboxDiagram) {
          bboxDiagram.innerHTML = this.renderBboxDiagram(decoded);
        }
        if (dimTable) {
          dimTable.innerHTML = this.renderDimTable(decoded);
        }
        if (neighborGrid) {
          neighborGrid.innerHTML = this.renderNeighborGrid(hash, neighbors);
          bindNeighborButtons();
        }

        updatePills(prec);
        scheduleBackendSync(hash, decoded.latitude, decoded.longitude, prec);
      } catch (err) {
        console.warn('Geohash decode error:', err);
      }
    };

    const updateFromCoords = (latVal, lonVal) => {
      const lat = parseFloat(latVal);
      const lon = parseFloat(lonVal);

      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return;
      }

      const prec = parseInt(sliderPrec.value, 10) || 7;
      const hash = ghEncode(lat, lon, prec);

      this.ws.params.geohash = hash;
      this.ws.params.latitude = lat;
      this.ws.params.longitude = lon;
      this.ws.params.precision = prec;

      isInternalUpdate = true;
      if (inputHash) inputHash.value = hash;
      if (inputCombined) inputCombined.value = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
      isInternalUpdate = false;

      updateFromHash(hash, true);
    };

    // 1. Hash input listener
    if (inputHash) {
      inputHash.addEventListener('input', (e) => {
        if (isInternalUpdate) return;
        const val = e.target.value.toLowerCase().replace(/[^0-9bcdefghjkmnpqrstuvwxyz]/g, '');
        e.target.value = val;
        updateFromHash(val);
      });
    }

    // 2. Lat and Lon input listeners
    if (inputLat && inputLon) {
      const onCoordInput = () => {
        if (isInternalUpdate) return;
        updateFromCoords(inputLat.value, inputLon.value);
      };
      inputLat.addEventListener('input', onCoordInput);
      inputLon.addEventListener('input', onCoordInput);
    }

    // 3. Combined input listener
    if (inputCombined) {
      inputCombined.addEventListener('input', (e) => {
        if (isInternalUpdate) return;
        const parts = e.target.value.split(/[,;\s]+/).map(p => parseFloat(p.trim())).filter(n => !isNaN(n));
        if (parts.length >= 2) {
          const lat = parts[0];
          const lon = parts[1];
          if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
            isInternalUpdate = true;
            if (inputLat) inputLat.value = lat.toFixed(6);
            if (inputLon) inputLon.value = lon.toFixed(6);
            isInternalUpdate = false;
            updateFromCoords(lat, lon);
          }
        }
      });
    }

    // 4. Precision slider and steppers
    const setPrecision = (p) => {
      const prec = Math.max(1, Math.min(12, p));
      if (sliderPrec) sliderPrec.value = prec;
      if (precNum) precNum.textContent = prec;
      const lat = parseFloat(inputLat.value) || this.ws.params.latitude || -6.175392;
      const lon = parseFloat(inputLon.value) || this.ws.params.longitude || 106.827153;
      updateFromCoords(lat, lon);
    };

    if (sliderPrec) {
      sliderPrec.addEventListener('input', (e) => {
        setPrecision(parseInt(e.target.value, 10));
      });
    }
    if (btnDec) {
      btnDec.addEventListener('click', () => {
        const cur = parseInt(sliderPrec.value, 10) || 7;
        setPrecision(cur - 1);
      });
    }
    if (btnInc) {
      btnInc.addEventListener('click', () => {
        const cur = parseInt(sliderPrec.value, 10) || 7;
        setPrecision(cur + 1);
      });
    }

    // Quick precision pills
    this.container.querySelectorAll('.gh-quick-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        const p = parseInt(pill.dataset.prec, 10);
        if (!isNaN(p)) {
          setPrecision(p);
        }
      });
    });

    // 5. Button actions
    if (btnCopyHash && inputHash) {
      btnCopyHash.addEventListener('click', () => {
        copyText(inputHash.value, 'GeoHash code copied!');
      });
    }

    if (btnClearHash && inputHash) {
      btnClearHash.addEventListener('click', () => {
        inputHash.value = '';
        inputHash.focus();
        if (statusBadge) {
          statusBadge.innerHTML = '⚠️ Awaiting geohash input';
          statusBadge.style.color = '#94A3B8';
        }
      });
    }

    if (btnCopyCoords && inputLat && inputLon) {
      btnCopyCoords.addEventListener('click', () => {
        copyText(`${inputLat.value}, ${inputLon.value}`, 'Coordinates (Lat, Lng) copied!');
      });
    }

    if (btnSwapCoords && inputLat && inputLon) {
      btnSwapCoords.addEventListener('click', () => {
        const tmp = inputLat.value;
        inputLat.value = inputLon.value;
        inputLon.value = tmp;
        updateFromCoords(inputLat.value, inputLon.value);
        toast.info('Swapped Latitude & Longitude');
      });
    }

    if (btnCopyBbox) {
      btnCopyBbox.addEventListener('click', () => {
        const hash = inputHash.value;
        if (ghIsValid(hash)) {
          const d = ghDecode(hash);
          const bboxJson = JSON.stringify({
            geohash: hash,
            precision: hash.length,
            centroid: { latitude: d.latitude, longitude: d.longitude },
            boundingBox: d.boundingBox,
            dimensions: d.dimensions
          }, null, 2);
          copyText(bboxJson, 'Bounding Box JSON copied!');
        } else {
          toast.error('Invalid geohash');
        }
      });
    }

    if (btnCopyGeoJson) {
      btnCopyGeoJson.addEventListener('click', () => {
        const hash = inputHash.value;
        if (ghIsValid(hash)) {
          const d = ghDecode(hash);
          const b = d.boundingBox;
          const geojson = JSON.stringify({
            type: "Feature",
            properties: { geohash: hash, precision: hash.length },
            geometry: {
              type: "Polygon",
              coordinates: [[
                [b.minLon, b.minLat],
                [b.maxLon, b.minLat],
                [b.maxLon, b.maxLat],
                [b.minLon, b.maxLat],
                [b.minLon, b.minLat]
              ]]
            }
          }, null, 2);
          copyText(geojson, 'GeoJSON Polygon copied!');
        } else {
          toast.error('Invalid geohash');
        }
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (inputHash) inputHash.value = 'qqguygv';
        if (sliderPrec) sliderPrec.value = 7;
        updateFromHash('qqguygv');
        toast.info('Reset to Monas Jakarta (qqguygv)');
      });
    }

    // 6. Landmark presets
    this.container.querySelectorAll('.gh-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lat = parseFloat(btn.dataset.lat);
        const lon = parseFloat(btn.dataset.lon);
        const name = btn.dataset.name || 'Landmark';
        if (!isNaN(lat) && !isNaN(lon)) {
          if (inputLat) inputLat.value = lat.toFixed(6);
          if (inputLon) inputLon.value = lon.toFixed(6);
          updateFromCoords(lat, lon);
          toast.info(`Loaded ${name}`);
        }
      });
    });

    // 7. Initial bind for neighbor buttons
    bindNeighborButtons();
  }

  // =========================================================================
  // COVERAGE & PROPAGATION ENGINEERING WORKSPACES
  // =========================================================================

  copyToClipboard(text, msg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        toast.success(msg || state.t('toast_copied', 'Copied to clipboard!'));
      }).catch(() => {
        toast.info(text);
      });
    } else {
      toast.info(text);
    }
  }

  // --- 1. COVERAGE SIMULATION ---
  calculateCoverageData(params) {
    const p = params || {};
    const h = Math.max(1, parseFloat(p.antenna_height) || 30.0);
    const mech = parseFloat(p.mechanical_tilt) !== undefined && !isNaN(parseFloat(p.mechanical_tilt)) ? parseFloat(p.mechanical_tilt) : 3.0;
    const elec = parseFloat(p.electrical_tilt) !== undefined && !isNaN(parseFloat(p.electrical_tilt)) ? parseFloat(p.electrical_tilt) : 6.0;
    const vbw = Math.max(1, parseFloat(p.v_beamwidth) || 10.0);
    const hbw = Math.max(1, parseFloat(p.h_beamwidth) || 65.0);
    const freq = parseFloat(p.frequency) || 2100.0;
    const elev = parseFloat(p.elevation) || 0.0;

    const totalTilt = Math.round((mech + elec) * 100) / 100;
    const totalTiltRad = Math.abs(totalTilt) * Math.PI / 180;
    const halfV = vbw / 2;
    const halfH = hbw / 2;

    let centerDist = 0;
    if (Math.abs(totalTilt) > 0.01 && Math.abs(totalTilt) < 89) {
      centerDist = Math.round((h / Math.tan(totalTiltRad)) * 100) / 100;
    } else if (Math.abs(totalTilt) >= 89) {
      centerDist = Math.round((h / Math.tan(89 * Math.PI / 180)) * 100) / 100;
    }

    const nearAngle = totalTilt + halfV;
    let nearDist = 0;
    if (nearAngle > 0 && nearAngle < 90) {
      nearDist = Math.round((h / Math.tan(nearAngle * Math.PI / 180)) * 100) / 100;
    }

    const farAngle = Math.abs(totalTilt) - halfV;
    let farDist = 0;
    if (farAngle > 0) {
      farDist = Math.round((h / Math.tan(farAngle * Math.PI / 180)) * 100) / 100;
    } else {
      farDist = Math.round((h / Math.tan(0.1 * Math.PI / 180)) * 100) / 100;
    }

    const coverageWidth = Math.round((2 * farDist * Math.tan(halfH * Math.PI / 180)) * 100) / 100;
    const avgWidth = centerDist > 0 ? 2 * centerDist * Math.tan(halfH * Math.PI / 180) : 0;
    const depth = Math.max(0, farDist - nearDist);
    const coverageAreaHa = Math.round(((coverageWidth + avgWidth) / 2 * depth / 10000) * 100) / 100;
    const coverageAreaKm2 = Math.round((coverageAreaHa / 100) * 1000) / 1000;

    return {
      h, mech, elec, vbw, hbw, freq, elev,
      totalTilt, nearDist, centerDist, farDist,
      coverageWidth, depth, coverageAreaHa, coverageAreaKm2
    };
  }

  renderCoverageSimulation() {
    const meta = this.getToolMeta();
    const p = this.ws.params || {};
    const d = this.calculateCoverageData(p);
    const isId = state.lang === 'id';

    this.container.innerHTML = `
      <div class="workspace-container">
        <!-- WORKSPACE TOOLBAR HEADER -->
        <header class="workspace-header-bar">
          <div class="workspace-title-group">
            <div class="workspace-icon-box">
              <img src="/assets/icons/tool-coverage-simulation.svg" alt="${meta.title}">
            </div>
            <div>
              <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                <h1 class="workspace-title">${meta.title}</h1>
                <span class="zone-badge">CRS EPSG:4326</span>
                <span class="rf-cov-status-chip rf-cov-status-chip--pulse">LIVE DOWNTILT ENGINE</span>
              </div>
              <p class="workspace-desc">${meta.description}</p>
            </div>
          </div>

          <div class="workspace-header-actions">
            <button class="rf-btn rf-btn-secondary" id="cov-copy-summary-btn" title="Copy calculated summary to clipboard">
              <span>📋 ${state.t('btn_copy', 'Copy')} Summary</span>
            </button>
            <button class="rf-btn rf-btn-ghost" id="cov-export-btn" title="Export calculation data as JSON">
              <span>💾 Export JSON</span>
            </button>
            <button class="rf-btn rf-btn-ghost" id="cov-reset-btn" title="Reset parameters to standard defaults">
              <span>🔄 ${state.t('btn_reset', 'Reset')}</span>
            </button>
          </div>
        </header>

        <!-- QUICK SCENARIO PRESETS -->
        <div class="rf-cov-presets">
          <span class="rf-cov-presets-label">⚡ ${isId ? 'Preset Skenario' : 'Quick Presets'}:</span>
          <button type="button" class="rf-cov-preset-pill" data-preset="dense">🏙️ Dense Urban (25m)</button>
          <button type="button" class="rf-cov-preset-pill" data-preset="macro">🏢 Standard Macro (30m)</button>
          <button type="button" class="rf-cov-preset-pill" data-preset="suburban">🏡 Suburban (45m)</button>
          <button type="button" class="rf-cov-preset-pill" data-preset="rural">🌾 Rural Highway (60m)</button>
        </div>

        <!-- KPI METRIC CARDS -->
        <div class="rf-coverage-grid" id="cov-kpi-grid">
          ${this.renderCovKpiCards(d)}
        </div>

        <!-- MAIN SPLIT WORKSPACE: PARAMETERS vs VISUALIZER -->
        <div class="workspace-split-grid">
          <!-- LEFT: PARAMETERS & GEOMETRY TUNING -->
          <section class="zone-card">
            <div class="zone-header">
              <span class="zone-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--color-primary);margin-right:6px;"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                ${isId ? 'Parameter Antena & Sudut Tilt' : 'Antenna Parameters & Tilt Angles'}
              </span>
              <span class="zone-badge">Reactive Inputs</span>
            </div>

            <div class="zone-body" style="padding: 14px;">
              <!-- Fieldset 1: Tower & Site Infrastructure -->
              <div class="rf-cov-fieldset">
                <div class="rf-cov-legend">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="22" x2="9" y2="2"/><line x1="15" y1="22" x2="15" y2="2"/></svg>
                  <span>${isId ? 'Infrastruktur Site & Menara' : 'Tower & Site Infrastructure'}</span>
                  <div class="rf-cov-legend-line"></div>
                </div>

                <!-- Antenna Height -->
                <div class="rf-cov-param-row">
                  <div class="rf-cov-param-header">
                    <span class="rf-cov-param-label">${isId ? 'Tinggi Antena (AGL)' : 'Antenna Height (AGL)'}</span>
                    <div class="rf-cov-param-value-wrap">
                      <input type="number" class="rf-cov-param-input" id="cov-input-height" min="1" max="200" step="0.5" value="${d.h}">
                      <span style="font-size: 0.75rem; color: var(--color-text-secondary);">m</span>
                    </div>
                  </div>
                  <input type="range" class="rf-cov-slider" id="cov-slider-height" min="1" max="150" step="0.5" value="${d.h}">
                </div>

                <!-- Ground Elevation -->
                <div class="rf-cov-param-row">
                  <div class="rf-cov-param-header">
                    <span class="rf-cov-param-label">${isId ? 'Elevasi Permukaan Tanah (AMSL)' : 'Site Ground Elevation (AMSL)'}</span>
                    <div class="rf-cov-param-value-wrap">
                      <input type="number" class="rf-cov-param-input" id="cov-input-elev" min="0" max="1000" step="5" value="${d.elev}">
                      <span style="font-size: 0.75rem; color: var(--color-text-secondary);">m</span>
                    </div>
                  </div>
                  <input type="range" class="rf-cov-slider" id="cov-slider-elev" min="0" max="500" step="5" value="${d.elev}">
                </div>

                <!-- Carrier Frequency -->
                <div class="rf-cov-param-row" style="margin-bottom: 0;">
                  <div class="rf-cov-param-header">
                    <span class="rf-cov-param-label">${isId ? 'Frekuensi Carrier' : 'Carrier Frequency'}</span>
                    <div class="rf-cov-param-value-wrap">
                      <input type="number" class="rf-cov-param-input" id="cov-input-freq" min="400" max="3800" step="50" value="${d.freq}">
                      <span style="font-size: 0.75rem; color: var(--color-text-secondary);">MHz</span>
                    </div>
                  </div>
                  <input type="range" class="rf-cov-slider" id="cov-slider-freq" min="700" max="3500" step="50" value="${d.freq}">
                </div>
              </div>

              <!-- Fieldset 2: Downtilt & Beamforming Geometry -->
              <div class="rf-cov-fieldset" style="margin-bottom: 0;">
                <div class="rf-cov-legend">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  <span>${isId ? 'Geometri Downtilt & Beamforming' : 'Downtilt & Beamforming Geometry'}</span>
                  <div class="rf-cov-legend-line"></div>
                </div>

                <!-- Mechanical Tilt -->
                <div class="rf-cov-param-row">
                  <div class="rf-cov-param-header">
                    <span class="rf-cov-param-label">
                      Mechanical Tilt
                      <span class="rf-tilt-badge rf-tilt-badge--mech">Mech</span>
                    </span>
                    <div class="rf-cov-param-value-wrap">
                      <input type="number" class="rf-cov-param-input" id="cov-input-mech" min="-15" max="25" step="0.5" value="${d.mech}">
                      <span style="font-size: 0.75rem; color: var(--color-text-secondary);">°</span>
                    </div>
                  </div>
                  <input type="range" class="rf-cov-slider" id="cov-slider-mech" min="-10" max="20" step="0.5" value="${d.mech}">
                </div>

                <!-- Electrical Tilt -->
                <div class="rf-cov-param-row">
                  <div class="rf-cov-param-header">
                    <span class="rf-cov-param-label">
                      Electrical Tilt (RET)
                      <span class="rf-tilt-badge rf-tilt-badge--elec">Elec</span>
                    </span>
                    <div class="rf-cov-param-value-wrap">
                      <input type="number" class="rf-cov-param-input" id="cov-input-elec" min="0" max="16" step="0.5" value="${d.elec}">
                      <span style="font-size: 0.75rem; color: var(--color-text-secondary);">°</span>
                    </div>
                  </div>
                  <input type="range" class="rf-cov-slider" id="cov-slider-elec" min="0" max="16" step="0.5" value="${d.elec}">
                </div>

                <!-- Vertical Beamwidth -->
                <div class="rf-cov-param-row">
                  <div class="rf-cov-param-header">
                    <span class="rf-cov-param-label">Vertical Beamwidth (3dB)</span>
                    <div class="rf-cov-param-value-wrap">
                      <input type="number" class="rf-cov-param-input" id="cov-input-vbw" min="2" max="30" step="0.5" value="${d.vbw}">
                      <span style="font-size: 0.75rem; color: var(--color-text-secondary);">°</span>
                    </div>
                  </div>
                  <input type="range" class="rf-cov-slider" id="cov-slider-vbw" min="2" max="25" step="0.5" value="${d.vbw}">
                </div>

                <!-- Horizontal Beamwidth -->
                <div class="rf-cov-param-row" style="margin-bottom: 0;">
                  <div class="rf-cov-param-header">
                    <span class="rf-cov-param-label">Horizontal Beamwidth (Azimuth 3dB)</span>
                    <div class="rf-cov-param-value-wrap">
                      <input type="number" class="rf-cov-param-input" id="cov-input-hbw" min="20" max="120" step="1" value="${d.hbw}">
                      <span style="font-size: 0.75rem; color: var(--color-text-secondary);">°</span>
                    </div>
                  </div>
                  <input type="range" class="rf-cov-slider" id="cov-slider-hbw" min="30" max="120" step="1" value="${d.hbw}">
                </div>
              </div>
            </div>
          </section>

          <!-- RIGHT: INTERACTIVE DIAGRAM VISUALIZER -->
          <section class="zone-card" style="display: flex; flex-direction: column;">
            <div class="rf-coverage-canvas-frame" style="flex: 1; min-height: 420px;">
              <div class="rf-coverage-canvas-header">
                <span style="display: flex; align-items: center; gap: 6px;">
                  <span>📐</span> ${isId ? 'Visualisasi Cakupan & Geometri Radiasi' : 'Coverage & Radiation Geometry Visualizer'}
                </span>
                <div class="rf-cov-tabs" id="cov-tab-bar">
                  <button type="button" class="rf-cov-tab-btn ${this.activeCovTab === 'elevation' ? 'rf-cov-tab-btn--active' : ''}" data-tab="elevation">
                    ${isId ? 'Profil Elevasi (Samping)' : 'Elevation Profile (Side)'}
                  </button>
                  <button type="button" class="rf-cov-tab-btn ${this.activeCovTab === 'footprint' ? 'rf-cov-tab-btn--active' : ''}" data-tab="footprint">
                    ${isId ? 'Jejak Sektor (Atas)' : 'Sector Footprint (Top)'}
                  </button>
                </div>
              </div>

              <div class="rf-coverage-canvas-body" id="cov-diagram-body">
                ${this.activeCovTab === 'elevation' ? this.renderCovElevationSvg(d) : this.renderCovFootprintSvg(d)}
              </div>
              <div class="rf-diagram-hud">
                <div class="rf-diagram-hud__legend">
                  <span class="rf-diagram-hud__item">
                    <span class="rf-diagram-hud__dot" style="background:#10b981;"></span>
                    <span>Boresight Axis</span>
                  </span>
                  <span class="rf-diagram-hud__item">
                    <span class="rf-diagram-hud__dot" style="background:#0284c7;"></span>
                    <span>3dB Beam Cone</span>
                  </span>
                  <span class="rf-diagram-hud__item">
                    <span class="rf-diagram-hud__dot" style="background:#f59e0b;"></span>
                    <span>Inner/Outer Bounds</span>
                  </span>
                </div>
                <div class="rf-diagram-hud__readout" id="cov-hud-readout">
                  Center: ${d.centerDist.toFixed(1)}m | Width: ${d.coverageWidth.toFixed(1)}m | Area: ${d.coverageAreaHa.toFixed(2)} ha
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;

    this.bindCoverageSimulation();
  }

  renderCovKpiCards(d) {
    const isId = state.lang === 'id';
    return `
      <div class="rf-metric-card rf-metric-card--accent">
        <div class="rf-metric-card__header">
          <span class="rf-metric-card__label">${isId ? 'Total Downtilt' : 'Total Downtilt'}</span>
          <span class="rf-tilt-badge rf-tilt-badge--net">${d.totalTilt}°</span>
        </div>
        <div class="rf-metric-card__value" id="kpi-cov-tilt">${d.totalTilt.toFixed(1)}<span class="rf-metric-card__unit">°</span></div>
        <div class="rf-metric-card__meta">${d.mech.toFixed(1)}° Mech + ${d.elec.toFixed(1)}° Elec</div>
      </div>

      <div class="rf-metric-card rf-metric-card--nominal">
        <div class="rf-metric-card__header">
          <span class="rf-metric-card__label">${isId ? 'Jarak Boresight (Pusat)' : 'Boresight Center'}</span>
          <span class="rf-coverage-chip rf-coverage-chip--good">Target</span>
        </div>
        <div class="rf-metric-card__value" id="kpi-cov-center">${d.centerDist.toFixed(1)}<span class="rf-metric-card__unit">m</span></div>
        <div class="rf-metric-card__meta">Ground impact @ ${d.totalTilt.toFixed(1)}°</div>
      </div>

      <div class="rf-metric-card rf-metric-card--warning">
        <div class="rf-metric-card__header">
          <span class="rf-metric-card__label">${isId ? 'Batas Dekat (Near Edge)' : 'Near Beam Edge'}</span>
          <span class="rf-coverage-chip rf-coverage-chip--fair">Inner</span>
        </div>
        <div class="rf-metric-card__value" id="kpi-cov-near">${d.nearDist.toFixed(1)}<span class="rf-metric-card__unit">m</span></div>
        <div class="rf-metric-card__meta">Upper 3dB boundary ray</div>
      </div>

      <div class="rf-metric-card rf-metric-card--optimal">
        <div class="rf-metric-card__header">
          <span class="rf-metric-card__label">${isId ? 'Batas Jauh (Far Edge)' : 'Far Beam Edge'}</span>
          <span class="rf-coverage-chip rf-coverage-chip--excellent">Outer</span>
        </div>
        <div class="rf-metric-card__value" id="kpi-cov-far">${d.farDist.toFixed(1)}<span class="rf-metric-card__unit">m</span></div>
        <div class="rf-metric-card__meta">Lower 3dB boundary ray</div>
      </div>

      <div class="rf-metric-card rf-metric-card--nominal">
        <div class="rf-metric-card__header">
          <span class="rf-metric-card__label">${isId ? 'Lebar Sektor di Far Edge' : 'Beam Width @ Far Edge'}</span>
          <span class="rf-coverage-chip rf-coverage-chip--good">Spread</span>
        </div>
        <div class="rf-metric-card__value" id="kpi-cov-width">${d.coverageWidth.toFixed(1)}<span class="rf-metric-card__unit">m</span></div>
        <div class="rf-metric-card__meta">Azimuth 3dB span (${d.hbw}°)</div>
      </div>

      <div class="rf-metric-card rf-metric-card--optimal">
        <div class="rf-metric-card__header">
          <span class="rf-metric-card__label">${isId ? 'Estimasi Luas Cakupan' : 'Ground Coverage Area'}</span>
          <span class="rf-coverage-chip rf-coverage-chip--excellent">Footprint</span>
        </div>
        <div class="rf-metric-card__value" id="kpi-cov-area">${d.coverageAreaHa.toFixed(2)}<span class="rf-metric-card__unit">ha</span></div>
        <div class="rf-metric-card__meta">${d.coverageAreaKm2.toFixed(3)} km² footprint</div>
      </div>
    `;
  }

  renderCovElevationSvg(d) {
    const maxD = Math.max(d.farDist * 1.15, d.centerDist * 1.3, 100);
    const scaleX = (dist) => 70 + Math.min(410, (dist / maxD) * 410);

    const xNear = scaleX(d.nearDist);
    const xCenter = scaleX(d.centerDist);
    const xFar = scaleX(d.farDist);
    const yGround = 210;
    const yAntenna = 65;
    const xTower = 70;

    return `
      <svg viewBox="0 0 520 270" width="100%" height="270" xmlns="http://www.w3.org/2000/svg" class="rf-coverage-svg">
        <!-- Ground Horizon Grid Line -->
        <line x1="30" y1="${yGround}" x2="495" y2="${yGround}" stroke="#E2E8F0" class="diagram-grid" stroke-width="1.8" stroke-linecap="round"/>
        <text x="495" y="${yGround + 15}" fill="#64748B" class="diagram-text-muted" font-size="8.5" text-anchor="end">Ground Plane (0m)</text>

        <!-- Shaded Beam Footprint Sector Polygon -->
        <polygon points="${xTower},${yAntenna} ${xNear},${yGround} ${xFar},${yGround}" fill="#0284C7" fill-opacity="0.12" stroke="#0284C7" stroke-opacity="0.25" stroke-width="1"/>

        <!-- Ground Footprint Span Bar -->
        <line x1="${xNear}" y1="${yGround}" x2="${xFar}" y2="${yGround}" stroke="#10B981" stroke-width="3.5" stroke-linecap="round"/>

        <!-- Beam Projection Rays -->
        <!-- Near Ray (Upper 3dB) -->
        <line x1="${xTower}" y1="${yAntenna}" x2="${xNear}" y2="${yGround}" stroke="#0284C7" stroke-width="1.6" stroke-dasharray="3 3"/>
        <!-- Center Boresight Ray -->
        <line x1="${xTower}" y1="${yAntenna}" x2="${xCenter}" y2="${yGround}" stroke="#10B981" stroke-width="2.2" stroke-linecap="round"/>
        <!-- Far Ray (Lower 3dB) -->
        <line x1="${xTower}" y1="${yAntenna}" x2="${xFar}" y2="${yGround}" stroke="#0284C7" stroke-width="1.8" stroke-linecap="round"/>

        <!-- Ground Ray Hit Nodes -->
        <circle cx="${xNear}" cy="${yGround}" r="3.5" fill="#0284C7"/>
        <circle cx="${xCenter}" cy="${yGround}" r="4.5" fill="#10B981"/>
        <circle cx="${xFar}" cy="${yGround}" r="3.5" fill="#0284C7"/>

        <!-- Distance Callout Labels on Ground -->
        <g transform="translate(${xNear}, ${yGround + 18})">
          <rect x="-24" y="-2" width="48" height="15" rx="3" fill="#FFFFFF" stroke="#E2E8F0" class="diagram-panel" stroke-width="1"/>
          <text x="0" y="9" fill="#0284C7" font-size="7.5" font-weight="bold" font-family="monospace" text-anchor="middle">${d.nearDist.toFixed(0)}m Near</text>
        </g>
        <g transform="translate(${xCenter}, ${yGround + 36})">
          <rect x="-30" y="-2" width="60" height="16" rx="3" fill="#10B981" fill-opacity="0.15" stroke="#10B981" stroke-width="1"/>
          <text x="0" y="9.5" fill="#047857" class="diagram-text-success" font-size="8" font-weight="bold" font-family="monospace" text-anchor="middle">${d.centerDist.toFixed(0)}m Center</text>
        </g>
        <g transform="translate(${xFar}, ${yGround + 18})">
          <rect x="-24" y="-2" width="48" height="15" rx="3" fill="#FFFFFF" stroke="#E2E8F0" class="diagram-panel" stroke-width="1"/>
          <text x="0" y="9" fill="#0284C7" font-size="7.5" font-weight="bold" font-family="monospace" text-anchor="middle">${d.farDist.toFixed(0)}m Far</text>
        </g>

        <!-- Tower Mast Structure -->
        <path d="${xTower - 14} ${yGround} L ${xTower} ${yAntenna} L ${xTower + 14} ${yGround}" stroke="#0284C7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="${xTower - 10}" y1="175" x2="${xTower + 10}" y2="175" stroke="#0284C7" stroke-width="1.2"/>
        <line x1="${xTower - 7}" y1="135" x2="${xTower + 7}" y2="135" stroke="#0284C7" stroke-width="1.2"/>
        <line x1="${xTower - 4}" y1="95" x2="${xTower + 4}" y2="95" stroke="#0284C7" stroke-width="1.2"/>

        <!-- Tower Height Label -->
        <line x1="38" y1="${yAntenna}" x2="38" y2="${yGround}" stroke="#64748B" stroke-width="1.2" stroke-dasharray="2 2"/>
        <path d="M 35 ${yAntenna + 4} L 38 ${yAntenna} L 41 ${yAntenna + 4} M 35 ${yGround - 4} L 38 ${yGround} L 41 ${yGround - 4}" stroke="#64748B" stroke-width="1.2" stroke-linecap="round"/>
        <text x="32" y="${(yAntenna + yGround) / 2 + 4}" fill="#0F172A" class="diagram-text-title" font-size="8" font-family="monospace" font-weight="bold" text-anchor="end">H=${d.h}m</text>

        <!-- Antenna Panel on Mast (Rotated by Downtilt) -->
        <g transform="translate(${xTower}, ${yAntenna}) rotate(${Math.min(45, Math.max(-15, d.totalTilt))})">
          <rect x="-3" y="-12" width="6" height="24" rx="2" fill="#0284C7" stroke="#0369A1" stroke-width="1.2"/>
          <line x1="0" y1="0" x2="22" y2="0" stroke="#10B981" stroke-width="1.5" stroke-linecap="round"/>
        </g>
        <circle cx="${xTower}" cy="${yAntenna}" r="3" fill="#10B981"/>

        <!-- Downtilt Badge Card in Top Left -->
        <g transform="translate(100, 20)">
          <rect width="180" height="28" rx="4" fill="#FFFFFF" stroke="#E2E8F0" class="diagram-panel" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.08))"/>
          <text x="12" y="18" fill="#0F172A" class="diagram-text-title" font-size="8.5" font-weight="bold" font-family="sans-serif">
            Net Downtilt: <tspan fill="#0284C7">${d.totalTilt.toFixed(1)}°</tspan> (${d.mech}°M + ${d.elec}°E)
          </text>
        </g>
      </svg>
    `;
  }

  renderCovFootprintSvg(d) {
    const cx = 260;
    const cy = 240;
    const maxR = 190;
    const maxDist = Math.max(d.farDist * 1.15, d.centerDist * 1.3, 100);

    const rNear = Math.max(15, (d.nearDist / maxDist) * maxR);
    const rCenter = Math.max(25, (d.centerDist / maxDist) * maxR);
    const rFar = Math.max(35, Math.min(maxR, (d.farDist / maxDist) * maxR));

    const halfAngleRad = (d.hbw / 2) * (Math.PI / 180);
    const aLeft = -Math.PI / 2 - halfAngleRad;
    const aRight = -Math.PI / 2 + halfAngleRad;

    const pNearL = { x: cx + rNear * Math.cos(aLeft), y: cy + rNear * Math.sin(aLeft) };
    const pNearR = { x: cx + rNear * Math.cos(aRight), y: cy + rNear * Math.sin(aRight) };
    const pFarL = { x: cx + rFar * Math.cos(aLeft), y: cy + rFar * Math.sin(aLeft) };
    const pFarR = { x: cx + rFar * Math.cos(aRight), y: cy + rFar * Math.sin(aRight) };

    return `
      <svg viewBox="0 0 520 270" width="100%" height="270" xmlns="http://www.w3.org/2000/svg" class="rf-coverage-svg">
        <!-- Radar Range Rings -->
        <circle cx="${cx}" cy="${cy}" r="${maxR * 0.33}" fill="none" stroke="#E2E8F0" class="diagram-grid" stroke-dasharray="2 2"/>
        <circle cx="${cx}" cy="${cy}" r="${maxR * 0.66}" fill="none" stroke="#E2E8F0" class="diagram-grid" stroke-dasharray="2 2"/>
        <circle cx="${cx}" cy="${cy}" r="${maxR}" fill="none" stroke="#E2E8F0" class="diagram-grid" stroke-dasharray="2 2"/>

        <!-- Azimuth Radial Guides -->
        <line x1="${cx}" y1="${cy}" x2="${cx}" y2="30" stroke="#E2E8F0" class="diagram-grid" stroke-dasharray="2 2"/>
        <text x="${cx}" y="24" fill="#64748B" class="diagram-text-muted" font-size="8" text-anchor="middle">0° (Boresight Azimuth)</text>

        <!-- Sector Fan Fill -->
        <path d="M ${pNearL.x} ${pNearL.y} A ${rNear} ${rNear} 0 0 1 ${pNearR.x} ${pNearR.y} L ${pFarR.x} ${pFarR.y} A ${rFar} ${rFar} 0 0 0 ${pFarL.x} ${pFarL.y} Z" fill="#0284C7" fill-opacity="0.15" stroke="#0284C7" stroke-width="1.5"/>

        <!-- Center Boresight Arc -->
        <path d="M ${cx + rCenter * Math.cos(aLeft)} ${cy + rCenter * Math.sin(aLeft)} A ${rCenter} ${rCenter} 0 0 1 ${cx + rCenter * Math.cos(aRight)} ${cy + rCenter * Math.sin(aRight)}" fill="none" stroke="#10B981" stroke-width="2" stroke-dasharray="3 3"/>

        <!-- Center Radial Ray -->
        <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - rFar}" stroke="#10B981" stroke-width="1.8"/>
        <circle cx="${cx}" cy="${cy - rCenter}" r="3.5" fill="#10B981"/>

        <!-- Antenna Site Node -->
        <circle cx="${cx}" cy="${cy}" r="5" fill="#0284C7"/>
        <circle cx="${cx}" cy="${cy}" r="10" fill="none" stroke="#0284C7" stroke-width="1.2" opacity="0.6"/>
        <text x="${cx}" y="${cy + 18}" fill="#0F172A" class="diagram-text-title" font-size="8" font-family="monospace" font-weight="bold" text-anchor="middle">Site Antenna Origin</text>

        <!-- Coverage Width Callout Line -->
        <line x1="${pFarL.x}" y1="${pFarL.y - 10}" x2="${pFarR.x}" y2="${pFarR.y - 10}" stroke="#0284C7" stroke-width="1.2"/>
        <path d="M ${pFarL.x + 3} ${pFarL.y - 13} L ${pFarL.x} ${pFarL.y - 10} L ${pFarL.x + 3} ${pFarL.y - 7} M ${pFarR.x - 3} ${pFarR.y - 13} L ${pFarR.x} ${pFarR.y - 10} L ${pFarR.x - 3} ${pFarR.y - 7}" stroke="#0284C7" stroke-width="1.2" stroke-linecap="round"/>
        <text x="${cx}" y="${pFarL.y - 16}" fill="#0284C7" font-size="8" font-family="monospace" font-weight="bold" text-anchor="middle">Width: ${d.coverageWidth.toFixed(0)}m (${d.hbw}° HBW)</text>

        <!-- Area Tag Badge -->
        <g transform="translate(20, 20)">
          <rect width="160" height="28" rx="4" fill="#FFFFFF" stroke="#E2E8F0" class="diagram-panel" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.08))"/>
          <text x="10" y="18" fill="#0F172A" class="diagram-text-title" font-size="8.5" font-weight="bold" font-family="sans-serif">
            Area: <tspan fill="#10B981">${d.coverageAreaHa.toFixed(2)} ha</tspan> (${d.coverageAreaKm2.toFixed(3)} km²)
          </text>
        </g>
      </svg>
    `;
  }

  bindCoverageSimulation() {
    const bindPair = (inputId, sliderId, key) => {
      const input = this.container.querySelector(inputId);
      const slider = this.container.querySelector(sliderId);
      if (!input || !slider) return;

      const update = (val) => {
        const num = parseFloat(val);
        if (!isNaN(num)) {
          this.ws.params[key] = num;
          input.value = num;
          slider.value = num;
          this.refreshCovUi();
        }
      };

      input.addEventListener('input', (e) => update(e.target.value));
      slider.addEventListener('input', (e) => update(e.target.value));
    };

    bindPair('#cov-input-height', '#cov-slider-height', 'antenna_height');
    bindPair('#cov-input-mech', '#cov-slider-mech', 'mechanical_tilt');
    bindPair('#cov-input-elec', '#cov-slider-elec', 'electrical_tilt');
    bindPair('#cov-input-vbw', '#cov-slider-vbw', 'v_beamwidth');
    bindPair('#cov-input-hbw', '#cov-slider-hbw', 'h_beamwidth');
    bindPair('#cov-input-freq', '#cov-slider-freq', 'frequency');
    bindPair('#cov-input-elev', '#cov-slider-elev', 'elevation');

    // Quick Presets
    const presetPills = this.container.querySelectorAll('.rf-cov-presets [data-preset]');
    presetPills.forEach(pill => {
      pill.addEventListener('click', () => {
        presetPills.forEach(p => p.classList.remove('rf-cov-preset-pill--active'));
        pill.classList.add('rf-cov-preset-pill--active');
        const preset = pill.dataset.preset;
        if (preset === 'dense') {
          this.ws.params = { ...this.ws.params, antenna_height: 25.0, mechanical_tilt: 2.0, electrical_tilt: 6.0, v_beamwidth: 10.0, h_beamwidth: 65.0, frequency: 2100.0, elevation: 0.0 };
        } else if (preset === 'macro') {
          this.ws.params = { ...this.ws.params, antenna_height: 30.0, mechanical_tilt: 3.0, electrical_tilt: 6.0, v_beamwidth: 10.0, h_beamwidth: 65.0, frequency: 1800.0, elevation: 0.0 };
        } else if (preset === 'suburban') {
          this.ws.params = { ...this.ws.params, antenna_height: 45.0, mechanical_tilt: 1.0, electrical_tilt: 4.0, v_beamwidth: 8.0, h_beamwidth: 65.0, frequency: 900.0, elevation: 0.0 };
        } else if (preset === 'rural') {
          this.ws.params = { ...this.ws.params, antenna_height: 60.0, mechanical_tilt: 0.0, electrical_tilt: 2.0, v_beamwidth: 7.0, h_beamwidth: 65.0, frequency: 750.0, elevation: 0.0 };
        }
        this.renderCoverageSimulation();
        toast.info(`Preset applied: ${pill.textContent.trim()}`);
      });
    });

    // Tabs
    const tabBtns = this.container.querySelectorAll('#cov-tab-bar .rf-cov-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        tabBtns.forEach(b => b.classList.remove('rf-cov-tab-btn--active'));
        btn.classList.add('rf-cov-tab-btn--active');
        this.activeCovTab = btn.dataset.tab;
        this.refreshCovUi();
      });
    });

    // Actions
    const copyBtn = this.container.querySelector('#cov-copy-summary-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const d = this.calculateCoverageData(this.ws.params);
        const text = `RF Coverage Simulation Results:
- Antenna Height: ${d.h}m AGL
- Tilt: ${d.totalTilt}° (${d.mech}° Mech + ${d.elec}° Elec)
- Beamwidth: ${d.vbw}° Vert, ${d.hbw}° Horiz
- Boresight Ground Hit: ${d.centerDist.toFixed(1)}m
- Near Edge: ${d.nearDist.toFixed(1)}m | Far Edge: ${d.farDist.toFixed(1)}m
- Coverage Width: ${d.coverageWidth.toFixed(1)}m
- Ground Area: ${d.coverageAreaHa.toFixed(2)} ha (${d.coverageAreaKm2.toFixed(3)} km²)`;
        this.copyToClipboard(text, 'Coverage summary copied to clipboard!');
      });
    }

    const exportBtn = this.container.querySelector('#cov-export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const d = this.calculateCoverageData(this.ws.params);
        const json = JSON.stringify(d, null, 2);
        this.copyToClipboard(json, 'Calculation JSON copied to clipboard!');
      });
    }

    const resetBtn = this.container.querySelector('#cov-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.ws.params = {
          antenna_height: 30.0,
          mechanical_tilt: 3.0,
          electrical_tilt: 6.0,
          v_beamwidth: 10.0,
          h_beamwidth: 65.0,
          frequency: 2100.0,
          elevation: 0.0
        };
        this.renderCoverageSimulation();
        toast.info('Coverage parameters reset to defaults');
      });
    }
  }

  refreshCovUi() {
    const d = this.calculateCoverageData(this.ws.params);
    const kpiGrid = this.container.querySelector('#cov-kpi-grid');
    if (kpiGrid) kpiGrid.innerHTML = this.renderCovKpiCards(d);

    const diagramBody = this.container.querySelector('#cov-diagram-body');
    if (diagramBody) {
      diagramBody.innerHTML = this.activeCovTab === 'elevation'
        ? this.renderCovElevationSvg(d)
        : this.renderCovFootprintSvg(d);
    }

    const hudReadout = this.container.querySelector('#cov-hud-readout');
    if (hudReadout) {
      hudReadout.textContent = `Center: ${d.centerDist.toFixed(1)}m | Width: ${d.coverageWidth.toFixed(1)}m | Area: ${d.coverageAreaHa.toFixed(2)} ha`;
    }
  }

  // --- 2. OKUMURA-HATA PROPAGATION MODEL ---
  calculateOkumuraHataData(params) {
    const p = params || {};
    const f = Math.max(150, Math.min(2500, parseFloat(p.frequency) || 2100.0));
    const hb = Math.max(10, Math.min(300, parseFloat(p.hb) || 30.0));
    const hm = Math.max(1, Math.min(20, parseFloat(p.hm) || 1.5));
    const env = p.env_type || 'urban';
    const txPower = parseFloat(p.tx_power) !== undefined && !isNaN(parseFloat(p.tx_power)) ? parseFloat(p.tx_power) : 43.0;
    const gain = parseFloat(p.gain) !== undefined && !isNaN(parseFloat(p.gain)) ? parseFloat(p.gain) : 18.0;
    const cableLoss = parseFloat(p.cable_loss) !== undefined && !isNaN(parseFloat(p.cable_loss)) ? parseFloat(p.cable_loss) : 2.0;
    const rxSens = parseFloat(p.rx_sensitivity) !== undefined && !isNaN(parseFloat(p.rx_sensitivity)) ? parseFloat(p.rx_sensitivity) : -102.0;
    const mech = parseFloat(p.mech_tilt) || 3.0;
    const elec = parseFloat(p.elec_tilt) || 6.0;
    const vbw = parseFloat(p.v_beamwidth) || 10.0;
    const hbw = parseFloat(p.h_beamwidth) || 65.0;

    let a_hm = (1.1 * Math.log10(f) - 0.7) * hm - (1.56 * Math.log10(f) - 0.8);
    let L_1km = 0;
    let confidence = 0.85;
    let envLabel = "Urban";

    if (env === 'urban') {
      if (f <= 300) {
        a_hm = 8.29 * Math.pow(Math.log10(1.54 * f), 2) - 1.1;
      } else {
        a_hm = 3.2 * Math.pow(Math.log10(11.75 * hm), 2) - 4.97;
      }
      const L_u = 69.55 + 26.16 * Math.log10(f) - 13.82 * Math.log10(hb) - a_hm;
      L_1km = L_u + 26.16 * Math.log10(f) - 65.55;
      confidence = 0.85;
      envLabel = "Urban (Large City)";
    } else if (env === 'suburban') {
      const L_u = 69.55 + 26.16 * Math.log10(f) - 13.82 * Math.log10(hb) - a_hm;
      const L_sub = L_u - 2 * Math.pow(Math.log10(f / 28), 2) - 5.4;
      L_1km = L_sub + 26.16 * Math.log10(f) - 65.55;
      confidence = 0.80;
      envLabel = "Suburban";
    } else {
      const L_u = 69.55 + 26.16 * Math.log10(f) - 13.82 * Math.log10(hb) - a_hm;
      const L_rur = L_u - 4.78 * Math.pow(Math.log10(f), 2) + 18.33 * Math.log10(f) - 40.94;
      L_1km = L_rur + 26.16 * Math.log10(f) - 65.55;
      confidence = 0.75;
      envLabel = "Rural (Open Area)";
    }

    const eirp = Math.round((txPower + gain - cableLoss) * 100) / 100;
    const maxPl = Math.round((eirp - rxSens) * 100) / 100;

    const exponent = (maxPl - L_1km) / 35.2;
    const covRadiusKm = exponent > 0 ? Math.round(Math.pow(10, exponent) * 1000) / 1000 : 0.05;
    const sectorAreaKm2 = Math.round(((hbw / 360) * Math.PI * Math.pow(covRadiusKm, 2)) * 1000) / 1000;
    const sectorAreaHa = Math.round(sectorAreaKm2 * 100 * 100) / 100;

    const totalTilt = Math.round((elec + mech) * 100) / 100;
    const totalTiltRad = totalTilt * Math.PI / 180;
    const boresightDist = Math.abs(totalTilt) > 0.5 ? Math.round((hb / Math.tan(Math.abs(totalTiltRad))) * 10) / 10 : covRadiusKm * 1000;

    return {
      f, hb, hm, env, txPower, gain, cableLoss, rxSens,
      mech, elec, vbw, hbw, totalTilt, a_hm: Math.round(a_hm * 100) / 100,
      L_1km: Math.round(L_1km * 100) / 100,
      confidence, envLabel, eirp, maxPl, covRadiusKm, sectorAreaKm2, sectorAreaHa, boresightDist
    };
  }

  renderOkumuraHata() {
    const meta = this.getToolMeta();
    const p = this.ws.params || {};
    const d = this.calculateOkumuraHataData(p);
    const isId = state.lang === 'id';
    const txWatts = Math.pow(10, (d.txPower - 30) / 10);

    this.container.innerHTML = `
      <div class="workspace-container">
        <!-- WORKSPACE TOOLBAR HEADER -->
        <header class="workspace-header-bar">
          <div class="workspace-title-group">
            <div class="workspace-icon-box">
              <img src="/assets/icons/tool-okumura-hata.svg" alt="${meta.title}">
            </div>
            <div>
              <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                <h1 class="workspace-title">${meta.title}</h1>
                <span class="zone-badge">150–2100 MHz</span>
                <span class="rf-cov-status-chip rf-cov-status-chip--pulse">EMPIRICAL PROPAGATION</span>
              </div>
              <p class="workspace-desc">${meta.description}</p>
            </div>
          </div>

          <div class="workspace-header-actions">
            <button class="rf-btn rf-btn-secondary" id="oh-copy-summary-btn" title="Copy calculated summary to clipboard">
              <span>📋 ${state.t('btn_copy', 'Copy')} Summary</span>
            </button>
            <button class="rf-btn rf-btn-ghost" id="oh-export-btn" title="Export calculation data as JSON">
              <span>💾 Export JSON</span>
            </button>
            <button class="rf-btn rf-btn-ghost" id="oh-reset-btn" title="Reset parameters to standard defaults">
              <span>🔄 ${state.t('btn_reset', 'Reset')}</span>
            </button>
          </div>
        </header>

        <!-- KPI METRIC CARDS -->
        <div class="rf-coverage-grid" id="oh-kpi-grid">
          ${this.renderOhKpiCards(d)}
        </div>

        <!-- MAIN SPLIT WORKSPACE: PARAMETERS vs VISUALIZER -->
        <div class="workspace-split-grid">
          <!-- LEFT: RF LINK BUDGET & MORPHOLOGY PARAMETERS -->
          <section class="zone-card">
            <div class="zone-header">
              <span class="zone-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--color-primary);margin-right:6px;"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
                ${isId ? 'Konfigurasi Link RF & Lingkungan' : 'RF Link Budget & Environment'}
              </span>
              <span class="zone-badge">${d.envLabel}</span>
            </div>

            <div class="zone-body" style="padding: 14px;">
              <!-- Fieldset 1: Environment Morphology & Spectrum -->
              <div class="rf-cov-fieldset">
                <div class="rf-cov-legend">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  <span>${isId ? 'Morfologi Lingkungan & Spektrum' : 'Morphology & Carrier Spectrum'}</span>
                  <div class="rf-cov-legend-line"></div>
                </div>

                <!-- Environment Type Segmented Selector -->
                <div class="rf-cov-param-row">
                  <div class="rf-cov-param-header">
                    <span class="rf-cov-param-label">${isId ? 'Tipe Lingkungan Propagasi' : 'Propagation Environment'}</span>
                  </div>
                  <div class="rf-env-selector" id="oh-env-selector">
                    <button type="button" class="rf-env-option ${d.env === 'urban' ? 'rf-env-option--active' : ''}" data-env="urban">
                      Urban (Kota)
                    </button>
                    <button type="button" class="rf-env-option ${d.env === 'suburban' ? 'rf-env-option--active' : ''}" data-env="suburban">
                      Suburban
                    </button>
                    <button type="button" class="rf-env-option ${d.env === 'rural' ? 'rf-env-option--active' : ''}" data-env="rural">
                      Rural (Terbuka)
                    </button>
                  </div>
                </div>

                <!-- Carrier Frequency with Band Presets -->
                <div class="rf-cov-param-row">
                  <div class="rf-cov-param-header">
                    <span class="rf-cov-param-label">${isId ? 'Frekuensi Carrier' : 'Carrier Frequency'}</span>
                    <div class="rf-cov-param-value-wrap">
                      <input type="number" class="rf-cov-param-input" id="oh-input-freq" min="150" max="2500" step="50" value="${d.f}">
                      <span style="font-size: 0.75rem; color: var(--color-text-secondary);">MHz</span>
                    </div>
                  </div>
                  <input type="range" class="rf-cov-slider" id="oh-slider-freq" min="150" max="2100" step="50" value="${d.f}">
                  <div class="rf-band-presets" id="oh-band-presets">
                    <button type="button" class="rf-band-btn ${d.f === 750 ? 'rf-band-btn--active' : ''}" data-band="750">LTE 700</button>
                    <button type="button" class="rf-band-btn ${d.f === 900 ? 'rf-band-btn--active' : ''}" data-band="900">GSM 900</button>
                    <button type="button" class="rf-band-btn ${d.f === 1800 ? 'rf-band-btn--active' : ''}" data-band="1800">DCS 1800</button>
                    <button type="button" class="rf-band-btn ${d.f === 2100 ? 'rf-band-btn--active' : ''}" data-band="2100">UMTS 2100</button>
                  </div>
                </div>

                <!-- Base Station Antenna Height (hb) -->
                <div class="rf-cov-param-row">
                  <div class="rf-cov-param-header">
                    <span class="rf-cov-param-label">${isId ? 'Tinggi Antena BS (hb)' : 'Base Station Height (hb)'}</span>
                    <div class="rf-cov-param-value-wrap">
                      <input type="number" class="rf-cov-param-input" id="oh-input-hb" min="15" max="200" step="1" value="${d.hb}">
                      <span style="font-size: 0.75rem; color: var(--color-text-secondary);">m</span>
                    </div>
                  </div>
                  <input type="range" class="rf-cov-slider" id="oh-slider-hb" min="20" max="150" step="1" value="${d.hb}">
                </div>

                <!-- Mobile Antenna Height (hm) -->
                <div class="rf-cov-param-row" style="margin-bottom: 0;">
                  <div class="rf-cov-param-header">
                    <span class="rf-cov-param-label">${isId ? 'Tinggi Antena Pengguna (hm)' : 'Mobile Height (hm)'}</span>
                    <div class="rf-cov-param-value-wrap">
                      <input type="number" class="rf-cov-param-input" id="oh-input-hm" min="1" max="10" step="0.5" value="${d.hm}">
                      <span style="font-size: 0.75rem; color: var(--color-text-secondary);">m</span>
                    </div>
                  </div>
                  <input type="range" class="rf-cov-slider" id="oh-slider-hm" min="1" max="10" step="0.5" value="${d.hm}">
                </div>
              </div>

              <!-- Fieldset 2: Link Budget & Sensitivity -->
              <div class="rf-cov-fieldset" style="margin-bottom: 0;">
                <div class="rf-cov-legend">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  <span>${isId ? 'Link Budget & Sensitivitas' : 'RF Link Budget & Sensitivity'}</span>
                  <div class="rf-cov-legend-line"></div>
                </div>

                <!-- Transmitter Power (tx_power) with Live Watt Conversion -->
                <div class="rf-cov-param-row">
                  <div class="rf-cov-param-header">
                    <span class="rf-cov-param-label">
                      TX Power
                      <span class="rf-watt-badge" id="oh-watt-display">${txWatts.toFixed(1)} W</span>
                    </span>
                    <div class="rf-cov-param-value-wrap">
                      <input type="number" class="rf-cov-param-input" id="oh-input-tx" min="20" max="55" step="1" value="${d.txPower}">
                      <span style="font-size: 0.75rem; color: var(--color-text-secondary);">dBm</span>
                    </div>
                  </div>
                  <input type="range" class="rf-cov-slider" id="oh-slider-tx" min="30" max="50" step="1" value="${d.txPower}">
                </div>

                <!-- Antenna Gain & Cable Loss -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;" class="rf-cov-param-row">
                  <div>
                    <div class="rf-cov-param-header">
                      <span class="rf-cov-param-label">Antenna Gain</span>
                      <input type="number" class="rf-cov-param-input" id="oh-input-gain" min="5" max="25" step="0.5" value="${d.gain}" style="width: 55px;">
                    </div>
                    <input type="range" class="rf-cov-slider" id="oh-slider-gain" min="10" max="24" step="0.5" value="${d.gain}">
                  </div>
                  <div>
                    <div class="rf-cov-param-header">
                      <span class="rf-cov-param-label">Cable Loss</span>
                      <input type="number" class="rf-cov-param-input" id="oh-input-loss" min="0" max="10" step="0.5" value="${d.cableLoss}" style="width: 55px;">
                    </div>
                    <input type="range" class="rf-cov-slider" id="oh-slider-loss" min="0" max="8" step="0.5" value="${d.cableLoss}">
                  </div>
                </div>

                <!-- RX Sensitivity -->
                <div class="rf-cov-param-row" style="margin-bottom: 0;">
                  <div class="rf-cov-param-header">
                    <span class="rf-cov-param-label">RX Sensitivity Threshold</span>
                    <div class="rf-cov-param-value-wrap">
                      <input type="number" class="rf-cov-param-input" id="oh-input-rx" min="-130" max="-70" step="1" value="${d.rxSens}">
                      <span style="font-size: 0.75rem; color: var(--color-text-secondary);">dBm</span>
                    </div>
                  </div>
                  <input type="range" class="rf-cov-slider" id="oh-slider-rx" min="-120" max="-80" step="1" value="${d.rxSens}">
                </div>
              </div>
            </div>
          </section>

          <!-- RIGHT: INTERACTIVE DIAGRAM VISUALIZER -->
          <section class="zone-card" style="display: flex; flex-direction: column;">
            <div class="rf-coverage-canvas-frame" style="flex: 1; min-height: 420px;">
              <div class="rf-coverage-canvas-header">
                <span style="display: flex; align-items: center; gap: 6px;">
                  <span>📈</span> ${isId ? 'Kurva Redaman & Ambang Batas MAPL' : 'Path Loss Decay Curve & MAPL Threshold'}
                </span>
                <div class="rf-cov-tabs" id="oh-tab-bar">
                  <button type="button" class="rf-cov-tab-btn ${this.activeOhTab === 'curve' ? 'rf-cov-tab-btn--active' : ''}" data-tab="curve">
                    ${isId ? 'Kurva Path Loss vs Jarak' : 'Path Loss Curve vs Distance'}
                  </button>
                  <button type="button" class="rf-cov-tab-btn ${this.activeOhTab === 'budget' ? 'rf-cov-tab-btn--active' : ''}" data-tab="budget">
                    ${isId ? 'Rincian Link Budget' : 'Link Budget Waterfall'}
                  </button>
                </div>
              </div>

              <div class="rf-coverage-canvas-body" id="oh-diagram-body">
                ${this.activeOhTab === 'curve' ? this.renderOhCurveSvg(d) : this.renderOhBudgetSvg(d)}
              </div>
              <div class="rf-diagram-hud">
                <div class="rf-diagram-hud__legend">
                  <span class="rf-diagram-hud__item">
                    <span class="rf-diagram-hud__dot" style="background:#0284c7;"></span>
                    <span>Propagation Curve</span>
                  </span>
                  <span class="rf-diagram-hud__item">
                    <span class="rf-diagram-hud__dot" style="background:#ef4444;"></span>
                    <span>MAPL Ceiling</span>
                  </span>
                  <span class="rf-diagram-hud__item">
                    <span class="rf-diagram-hud__dot" style="background:#10b981;"></span>
                    <span>Max Reach (R-Cov)</span>
                  </span>
                </div>
                <div class="rf-diagram-hud__readout" id="oh-hud-readout">
                  MAPL: ${d.maxPl.toFixed(1)} dB | R-Cov: ${(d.covRadiusKm * 1000).toFixed(0)}m | L1km: ${d.L_1km.toFixed(1)} dB
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;

    this.bindOkumuraHata();
  }

  renderOhKpiCards(d) {
    const isId = state.lang === 'id';
    return `
      <div class="rf-metric-card rf-metric-card--nominal">
        <div class="rf-metric-card__header">
          <span class="rf-metric-card__label">EIRP Transmitter</span>
          <span class="rf-coverage-chip rf-coverage-chip--good">RF Power</span>
        </div>
        <div class="rf-metric-card__value" id="kpi-oh-eirp">${d.eirp.toFixed(1)}<span class="rf-metric-card__unit">dBm</span></div>
        <div class="rf-metric-card__meta">${d.txPower} dBm + ${d.gain} dBi - ${d.cableLoss} dB</div>
      </div>

      <div class="rf-metric-card rf-metric-card--accent">
        <div class="rf-metric-card__header">
          <span class="rf-metric-card__label">Max Allowable Loss (MAPL)</span>
          <span class="rf-coverage-chip rf-coverage-chip--excellent">Budget</span>
        </div>
        <div class="rf-metric-card__value" id="kpi-oh-mapl">${d.maxPl.toFixed(1)}<span class="rf-metric-card__unit">dB</span></div>
        <div class="rf-metric-card__meta">EIRP - (${d.rxSens} dBm sensitivity)</div>
      </div>

      <div class="rf-metric-card rf-metric-card--warning">
        <div class="rf-metric-card__header">
          <span class="rf-metric-card__label">Path Loss @ 1 km (L1km)</span>
          <span class="rf-coverage-chip rf-coverage-chip--fair">${d.env}</span>
        </div>
        <div class="rf-metric-card__value" id="kpi-oh-l1km">${d.L_1km.toFixed(1)}<span class="rf-metric-card__unit">dB</span></div>
        <div class="rf-metric-card__meta">Correction a(hm)=${d.a_hm.toFixed(2)} dB</div>
      </div>

      <div class="rf-metric-card rf-metric-card--optimal">
        <div class="rf-metric-card__header">
          <span class="rf-metric-card__label">${isId ? 'Radius Jangkauan Maks' : 'Max Coverage Radius'}</span>
          <span class="rf-coverage-chip rf-coverage-chip--excellent">R-Cov</span>
        </div>
        <div class="rf-metric-card__value" id="kpi-oh-rcov">${d.covRadiusKm.toFixed(3)}<span class="rf-metric-card__unit">km</span></div>
        <div class="rf-metric-card__meta">${(d.covRadiusKm * 1000).toFixed(0)} meters reach</div>
      </div>

      <div class="rf-metric-card rf-metric-card--nominal">
        <div class="rf-metric-card__header">
          <span class="rf-metric-card__label">${isId ? 'Luas Area Sektor' : 'Sector Coverage Area'}</span>
          <span class="rf-coverage-chip rf-coverage-chip--good">Area</span>
        </div>
        <div class="rf-metric-card__value" id="kpi-oh-area">${d.sectorAreaKm2.toFixed(3)}<span class="rf-metric-card__unit">km²</span></div>
        <div class="rf-metric-card__meta">${d.sectorAreaHa.toFixed(1)} ha (${d.hbw}° sector)</div>
      </div>

      <div class="rf-metric-card rf-metric-card--optimal">
        <div class="rf-metric-card__header">
          <span class="rf-metric-card__label">${isId ? 'Keandalan Model' : 'Model Confidence'}</span>
          <span class="rf-coverage-chip rf-coverage-chip--good">${Math.round(d.confidence * 100)}%</span>
        </div>
        <div class="rf-metric-card__value" id="kpi-oh-conf">${(d.confidence * 100).toFixed(0)}<span class="rf-metric-card__unit">%</span></div>
        <div class="rf-metric-card__meta">${d.envLabel} morphology</div>
      </div>
    `;
  }

  renderOhCurveSvg(d) {
    const maxDistKm = Math.max(5, Math.min(20, d.covRadiusKm * 1.5));
    const minLoss = Math.floor(d.L_1km - 15);
    const maxLoss = Math.ceil(d.maxPl + 15);

    const scaleX = (distKm) => 60 + Math.min(420, (distKm / maxDistKm) * 420);
    const scaleY = (lossDb) => 220 - ((lossDb - minLoss) / (maxLoss - minLoss)) * 170;

    // Generate Path Loss curve points: L(d) = L_1km + 35.2 * log10(d)
    const points = [];
    const steps = 30;
    for (let i = 1; i <= steps; i++) {
      const dist = (i / steps) * maxDistKm;
      const loss = d.L_1km + 35.2 * Math.log10(Math.max(0.1, dist));
      const px = scaleX(dist);
      const py = scaleY(loss);
      points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
    }

    const maplY = scaleY(d.maxPl);
    const rX = scaleX(d.covRadiusKm);

    return `
      <svg viewBox="0 0 520 270" width="100%" height="270" xmlns="http://www.w3.org/2000/svg" class="rf-coverage-svg">
        <!-- Axes -->
        <line x1="60" y1="50" x2="60" y2="220" stroke="#E2E8F0" class="diagram-grid" stroke-width="1.5"/>
        <line x1="60" y1="220" x2="490" y2="220" stroke="#E2E8F0" class="diagram-grid" stroke-width="1.5"/>

        <!-- Grid Lines & Tick Labels -->
        <line x1="60" y1="50" x2="490" y2="50" stroke="#E2E8F0" class="diagram-grid" stroke-dasharray="2 2"/>
        <line x1="60" y1="135" x2="490" y2="135" stroke="#E2E8F0" class="diagram-grid" stroke-dasharray="2 2"/>
        
        <text x="52" y="54" fill="#64748B" class="diagram-text-muted" font-size="8" text-anchor="end">${maxLoss}dB</text>
        <text x="52" y="139" fill="#64748B" class="diagram-text-muted" font-size="8" text-anchor="end">${Math.round((minLoss + maxLoss)/2)}dB</text>
        <text x="52" y="224" fill="#64748B" class="diagram-text-muted" font-size="8" text-anchor="end">${minLoss}dB</text>

        <text x="490" y="235" fill="#64748B" class="diagram-text-muted" font-size="8" text-anchor="end">${maxDistKm.toFixed(1)} km</text>
        <text x="60" y="235" fill="#64748B" class="diagram-text-muted" font-size="8">0 km</text>

        <!-- MAPL Threshold Horizontal Line (Red/Danger) -->
        <line x1="60" y1="${maplY}" x2="490" y2="${maplY}" stroke="#EF4444" stroke-width="1.8" stroke-dasharray="4 3"/>
        <text x="490" y="${maplY - 5}" fill="#EF4444" font-size="8" font-weight="bold" font-family="monospace" text-anchor="end">MAPL: ${d.maxPl} dB</text>

        <!-- Path Loss Decay Curve (Emerald/Primary) -->
        <polyline points="${points.join(' ')}" fill="none" stroke="#0284C7" stroke-width="2.5" stroke-linecap="round"/>

        <!-- Intersection Point (R-Cov) -->
        <line x1="${rX}" y1="${maplY}" x2="${rX}" y2="220" stroke="#10B981" stroke-width="1.5" stroke-dasharray="3 3"/>
        <circle cx="${rX}" cy="${maplY}" r="5" fill="#10B981"/>
        <circle cx="${rX}" cy="${maplY}" r="9" fill="none" stroke="#10B981" stroke-width="1.5" opacity="0.6"/>

        <!-- Coverage Intercept Badge -->
        <g transform="translate(${Math.min(390, rX + 10)}, ${Math.min(180, maplY + 10)})">
          <rect width="115" height="30" rx="4" fill="#FFFFFF" stroke="#10B981" class="diagram-panel" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.1))"/>
          <text x="8" y="14" fill="#047857" class="diagram-text-success" font-size="8" font-weight="bold">Coverage Limit</text>
          <text x="8" y="25" fill="#0F172A" class="diagram-text-title" font-size="8" font-family="monospace">R = ${d.covRadiusKm.toFixed(3)} km</text>
        </g>
      </svg>
    `;
  }

  renderOhBudgetSvg(d) {
    return `
      <svg viewBox="0 0 520 270" width="100%" height="270" xmlns="http://www.w3.org/2000/svg" class="rf-coverage-svg">
        <!-- Waterfall Link Budget Steps -->
        <g transform="translate(40, 30)">
          <!-- Step 1: TX Power -->
          <rect x="0" y="20" width="65" height="150" rx="4" fill="#0284C7" fill-opacity="0.85"/>
          <text x="32" y="15" fill="#0F172A" class="diagram-text-title" font-size="8" font-weight="bold" text-anchor="middle">TX Power</text>
          <text x="32" y="100" fill="#FFFFFF" font-size="8.5" font-weight="bold" font-family="monospace" text-anchor="middle">+${d.txPower} dBm</text>

          <!-- Step 2: Antenna Gain -->
          <rect x="75" y="60" width="65" height="70" rx="4" fill="#10B981" fill-opacity="0.85"/>
          <text x="107" y="15" fill="#0F172A" class="diagram-text-title" font-size="8" font-weight="bold" text-anchor="middle">+ Gain</text>
          <text x="107" y="100" fill="#FFFFFF" font-size="8.5" font-weight="bold" font-family="monospace" text-anchor="middle">+${d.gain} dBi</text>

          <!-- Step 3: Cable Loss -->
          <rect x="150" y="80" width="65" height="30" rx="4" fill="#F59E0B" fill-opacity="0.85"/>
          <text x="182" y="15" fill="#0F172A" class="diagram-text-title" font-size="8" font-weight="bold" text-anchor="middle">- Cable Loss</text>
          <text x="182" y="98" fill="#FFFFFF" font-size="8" font-weight="bold" font-family="monospace" text-anchor="middle">-${d.cableLoss} dB</text>

          <!-- Step 4: Total EIRP -->
          <rect x="225" y="20" width="70" height="170" rx="4" fill="#6366F1" fill-opacity="0.9"/>
          <text x="260" y="15" fill="#0F172A" class="diagram-text-title" font-size="8" font-weight="bold" text-anchor="middle">= EIRP</text>
          <text x="260" y="105" fill="#FFFFFF" font-size="9" font-weight="bold" font-family="monospace" text-anchor="middle">${d.eirp} dBm</text>

          <!-- Step 5: MAPL Path Loss -->
          <rect x="305" y="20" width="70" height="170" rx="4" fill="#EF4444" fill-opacity="0.85"/>
          <text x="340" y="15" fill="#0F172A" class="diagram-text-title" font-size="8" font-weight="bold" text-anchor="middle">- Max Loss</text>
          <text x="340" y="105" fill="#FFFFFF" font-size="8.5" font-weight="bold" font-family="monospace" text-anchor="middle">${d.maxPl} dB</text>

          <!-- Step 6: RX Sensitivity -->
          <rect x="385" y="160" width="65" height="40" rx="4" fill="#0284C7" fill-opacity="0.5"/>
          <text x="417" y="15" fill="#0F172A" class="diagram-text-title" font-size="8" font-weight="bold" text-anchor="middle">= RX Sens</text>
          <text x="417" y="185" fill="#FFFFFF" font-size="8" font-weight="bold" font-family="monospace" text-anchor="middle">${d.rxSens} dBm</text>
        </g>
      </svg>
    `;
  }

  bindOkumuraHata() {
    const bindPair = (inputId, sliderId, key) => {
      const input = this.container.querySelector(inputId);
      const slider = this.container.querySelector(sliderId);
      if (!input || !slider) return;

      const update = (val) => {
        const num = parseFloat(val);
        if (!isNaN(num)) {
          this.ws.params[key] = num;
          input.value = num;
          slider.value = num;
          this.refreshOhUi();
        }
      };

      input.addEventListener('input', (e) => update(e.target.value));
      slider.addEventListener('input', (e) => update(e.target.value));
    };

    bindPair('#oh-input-freq', '#oh-slider-freq', 'frequency');
    bindPair('#oh-input-hb', '#oh-slider-hb', 'hb');
    bindPair('#oh-input-hm', '#oh-slider-hm', 'hm');
    bindPair('#oh-input-tx', '#oh-slider-tx', 'tx_power');
    bindPair('#oh-input-gain', '#oh-slider-gain', 'gain');
    bindPair('#oh-input-loss', '#oh-slider-loss', 'cable_loss');
    bindPair('#oh-input-rx', '#oh-slider-rx', 'rx_sensitivity');

    // Quick Band Presets
    const bandBtns = this.container.querySelectorAll('#oh-band-presets .rf-band-btn');
    bandBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        bandBtns.forEach(b => b.classList.remove('rf-band-btn--active'));
        btn.classList.add('rf-band-btn--active');
        const freqVal = parseFloat(btn.dataset.band);
        this.ws.params.frequency = freqVal;
        const fInput = this.container.querySelector('#oh-input-freq');
        const fSlider = this.container.querySelector('#oh-slider-freq');
        if (fInput) fInput.value = freqVal;
        if (fSlider) fSlider.value = freqVal;
        this.refreshOhUi();
      });
    });

    // Environment Selector
    const envOptions = this.container.querySelectorAll('#oh-env-selector .rf-env-option');
    envOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        envOptions.forEach(o => o.classList.remove('rf-env-option--active'));
        opt.classList.add('rf-env-option--active');
        this.ws.params.env_type = opt.dataset.env;
        this.refreshOhUi();
      });
    });

    // Tab buttons
    const tabBtns = this.container.querySelectorAll('#oh-tab-bar .rf-cov-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('rf-cov-tab-btn--active'));
        btn.classList.add('rf-cov-tab-btn--active');
        this.activeOhTab = btn.dataset.tab;
        this.refreshOhUi();
      });
    });

    // Actions
    const copyBtn = this.container.querySelector('#oh-copy-summary-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const d = this.calculateOkumuraHataData(this.ws.params);
        const text = `Okumura-Hata Propagation Model Results:
- Frequency: ${d.f} MHz | Environment: ${d.envLabel}
- Base Station: ${d.hb}m | Mobile: ${d.hm}m
- EIRP: ${d.eirp} dBm (TX: ${d.txPower} dBm, Gain: ${d.gain} dBi, Loss: ${d.cableLoss} dB)
- MAPL: ${d.maxPl} dB (Sensitivity: ${d.rxSens} dBm)
- Path Loss @ 1 km: ${d.L_1km} dB
- Max Coverage Radius: ${d.covRadiusKm.toFixed(3)} km (${(d.covRadiusKm * 1000).toFixed(0)}m)
- Sector Coverage Area: ${d.sectorAreaKm2.toFixed(3)} km² (${d.sectorAreaHa.toFixed(1)} ha)
- Model Confidence: ${(d.confidence * 100).toFixed(0)}%`;
        this.copyToClipboard(text, 'Okumura-Hata summary copied to clipboard!');
      });
    }

    const exportBtn = this.container.querySelector('#oh-export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const d = this.calculateOkumuraHataData(this.ws.params);
        this.copyToClipboard(JSON.stringify(d, null, 2), 'Calculation JSON copied to clipboard!');
      });
    }

    const resetBtn = this.container.querySelector('#oh-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.ws.params = {
          frequency: 2100.0,
          hb: 30.0,
          hm: 1.5,
          tx_power: 43.0,
          gain: 18.0,
          cable_loss: 2.0,
          rx_sensitivity: -102.0,
          mech_tilt: 3.0,
          elec_tilt: 6.0,
          v_beamwidth: 10.0,
          h_beamwidth: 65.0,
          env_type: 'urban'
        };
        this.renderOkumuraHata();
        toast.info('Okumura-Hata parameters reset to defaults');
      });
    }
  }

  refreshOhUi() {
    const d = this.calculateOkumuraHataData(this.ws.params);
    const kpiGrid = this.container.querySelector('#oh-kpi-grid');
    if (kpiGrid) kpiGrid.innerHTML = this.renderOhKpiCards(d);

    const diagramBody = this.container.querySelector('#oh-diagram-body');
    if (diagramBody) {
      diagramBody.innerHTML = this.activeOhTab === 'curve'
        ? this.renderOhCurveSvg(d)
        : this.renderOhBudgetSvg(d);
    }

    const hudReadout = this.container.querySelector('#oh-hud-readout');
    if (hudReadout) {
      hudReadout.textContent = `MAPL: ${d.maxPl.toFixed(1)} dB | R-Cov: ${(d.covRadiusKm * 1000).toFixed(0)}m | L1km: ${d.L_1km.toFixed(1)} dB`;
    }

    const wattDisplay = this.container.querySelector('#oh-watt-display');
    if (wattDisplay) {
      const watts = Math.pow(10, (d.txPower - 30) / 10);
      wattDisplay.textContent = `${watts.toFixed(1)} W`;
    }
  }

  // --- 3. NETTILT 3D OPTIMIZER ---
  calculateNetTilt3DData(params) {
    const p = params || {};
    const towerH = Math.max(5, parseFloat(p.tower_height) || 35.0);
    const userH = Math.max(0, parseFloat(p.user_height) || 1.5);
    const deltaH = parseFloat(p.delta_h) || 0.0;
    const targetDist = Math.max(20, parseFloat(p.target_distance) || 500.0);
    const mech = parseFloat(p.mechanical_tilt) !== undefined && !isNaN(parseFloat(p.mechanical_tilt)) ? parseFloat(p.mechanical_tilt) : 2.0;
    const elec = parseFloat(p.electrical_tilt) !== undefined && !isNaN(parseFloat(p.electrical_tilt)) ? parseFloat(p.electrical_tilt) : 4.0;
    const vbw = Math.max(1, parseFloat(p.v_beamwidth) || 8.0);
    const hbw = Math.max(1, parseFloat(p.h_beamwidth) || 65.0);

    const effHeight = Math.max(1, (towerH - userH) - deltaH);
    const totalTilt = Math.round((mech + elec) * 100) / 100;
    const totalTiltRad = totalTilt * Math.PI / 180;

    const optTiltRad = Math.atan(effHeight / targetDist);
    const optTiltDeg = Math.round((optTiltRad * 180 / Math.PI) * 100) / 100;
    const tiltDelta = Math.round((totalTilt - optTiltDeg) * 100) / 100;

    let alignStatus = 'optimal';
    let alignLabel = 'Optimal Alignment';
    if (Math.abs(tiltDelta) <= 0.4) {
      alignStatus = 'optimal';
      alignLabel = 'Optimal Alignment (±0.4°)';
    } else if (tiltDelta > 0.4) {
      alignStatus = 'over';
      alignLabel = `Over-tilted (+${tiltDelta.toFixed(1)}° Down)`;
    } else {
      alignStatus = 'under';
      alignLabel = `Under-tilted (${tiltDelta.toFixed(1)}° Up)`;
    }

    let boresightDist = 0;
    if (totalTilt > 0.05) {
      boresightDist = Math.round((effHeight / Math.tan(totalTiltRad)) * 10) / 10;
    } else {
      boresightDist = 9999;
    }

    const halfV = vbw / 2;
    const innerAngle = totalTilt + halfV;
    let innerDist = 0;
    if (innerAngle > 0 && innerAngle < 90) {
      innerDist = Math.round((effHeight / Math.tan(innerAngle * Math.PI / 180)) * 10) / 10;
    }

    const outerAngle = totalTilt - halfV;
    let outerDist = 0;
    if (outerAngle > 0.05) {
      outerDist = Math.round((effHeight / Math.tan(outerAngle * Math.PI / 180)) * 10) / 10;
    } else {
      outerDist = Math.round((effHeight / Math.tan(0.05 * Math.PI / 180)) * 10) / 10;
    }

    const footprintLength = Math.max(0, Math.round((outerDist - innerDist) * 10) / 10);

    return {
      towerH, userH, deltaH, targetDist, mech, elec, vbw, hbw,
      effHeight: Math.round(effHeight * 10) / 10,
      totalTilt, optTiltDeg, tiltDelta, alignStatus, alignLabel,
      boresightDist, innerDist, outerDist, footprintLength
    };
  }

  renderNetTilt3D() {
    const meta = this.getToolMeta();
    const p = this.ws.params || {};
    const d = this.calculateNetTilt3DData(p);
    const isId = state.lang === 'id';

    this.container.innerHTML = `
      <div class="workspace-container">
        <!-- WORKSPACE TOOLBAR HEADER -->
        <header class="workspace-header-bar">
          <div class="workspace-title-group">
            <div class="workspace-icon-box">
              <img src="/assets/icons/tool-nettilt-3d.svg" alt="${meta.title}">
            </div>
            <div>
              <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                <h1 class="workspace-title">${meta.title}</h1>
                <span class="zone-badge">3D Geometry</span>
                <span class="rf-cov-status-chip rf-cov-status-chip--pulse">3D RET OPTIMIZER</span>
              </div>
              <p class="workspace-desc">${meta.description}</p>
            </div>
          </div>

          <div class="workspace-header-actions">
            <button class="rf-btn rf-btn-secondary" id="tilt-copy-summary-btn" title="Copy calculated summary to clipboard">
              <span>📋 ${state.t('btn_copy', 'Copy')} Summary</span>
            </button>
            <button class="rf-btn rf-btn-ghost" id="tilt-export-btn" title="Export calculation data as JSON">
              <span>💾 Export JSON</span>
            </button>
            <button class="rf-btn rf-btn-ghost" id="tilt-reset-btn" title="Reset parameters to standard defaults">
              <span>🔄 ${state.t('btn_reset', 'Reset')}</span>
            </button>
          </div>
        </header>

        <!-- QUICK TARGET DISTANCE PRESETS -->
        <div class="rf-cov-presets">
          <span class="rf-cov-presets-label">🎯 ${isId ? 'Target Cepat' : 'Target Presets'}:</span>
          <button type="button" class="rf-cov-preset-pill" data-target-dist="250">250m (Dense)</button>
          <button type="button" class="rf-cov-preset-pill" data-target-dist="500">500m (Urban)</button>
          <button type="button" class="rf-cov-preset-pill" data-target-dist="1000">1000m (Suburban)</button>
          <button type="button" class="rf-cov-preset-pill" data-target-dist="2000">2000m (Rural)</button>
        </div>

        <!-- KPI METRIC CARDS -->
        <div class="rf-coverage-grid" id="tilt-kpi-grid">
          ${this.renderTiltKpiCards(d)}
        </div>

        <!-- MAIN SPLIT WORKSPACE: PARAMETERS vs VISUALIZER -->
        <div class="workspace-split-grid">
          <!-- LEFT: PARAMETERS & GEOMETRY TUNING -->
          <section class="zone-card">
            <div class="zone-header">
              <span class="zone-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--color-primary);margin-right:6px;"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                ${isId ? 'Geometri Menara & Target Jarak' : 'Tower & Target Geometry'}
              </span>
              <button class="rf-btn rf-btn-secondary" id="tilt-autotune-btn" style="padding: 3px 9px; font-size: 0.72rem;">
                ⚡ Auto-Tune RET
              </button>
            </div>

            <div class="zone-body" style="padding: 14px;">
              <!-- Fieldset 1: Tower Site & Target Geometry -->
              <div class="rf-cov-fieldset">
                <div class="rf-cov-legend">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>
                  <span>${isId ? 'Geometri Site & Target' : 'Site Geometry & Target'}</span>
                  <div class="rf-cov-legend-line"></div>
                </div>

                <!-- Target Coverage Distance -->
                <div class="rf-cov-param-row">
                  <div class="rf-cov-param-header">
                    <span class="rf-cov-param-label">
                      ${isId ? 'Target Jarak Cakupan' : 'Target Coverage Distance'}
                      <span class="rf-coverage-chip rf-coverage-chip--good">Target</span>
                    </span>
                    <div class="rf-cov-param-value-wrap">
                      <input type="number" class="rf-cov-param-input" id="tilt-input-target" min="50" max="3000" step="25" value="${d.targetDist}">
                      <span style="font-size: 0.75rem; color: var(--color-text-secondary);">m</span>
                    </div>
                  </div>
                  <input type="range" class="rf-cov-slider" id="tilt-slider-target" min="50" max="2000" step="25" value="${d.targetDist}">
                </div>

                <!-- Tower Antenna Height -->
                <div class="rf-cov-param-row">
                  <div class="rf-cov-param-header">
                    <span class="rf-cov-param-label">${isId ? 'Tinggi Menara (H)' : 'Tower Antenna Height (H)'}</span>
                    <div class="rf-cov-param-value-wrap">
                      <input type="number" class="rf-cov-param-input" id="tilt-input-height" min="10" max="150" step="1" value="${d.towerH}">
                      <span style="font-size: 0.75rem; color: var(--color-text-secondary);">m</span>
                    </div>
                  </div>
                  <input type="range" class="rf-cov-slider" id="tilt-slider-height" min="10" max="100" step="1" value="${d.towerH}">
                </div>

                <!-- Terrain Elevation Delta (ΔH) -->
                <div class="rf-cov-param-row" style="margin-bottom: 0;">
                  <div class="rf-cov-param-header">
                    <span class="rf-cov-param-label">${isId ? 'Beda Elevasi Kontur (ΔH)' : 'Terrain Elevation Delta (ΔH)'}</span>
                    <div class="rf-cov-param-value-wrap">
                      <input type="number" class="rf-cov-param-input" id="tilt-input-deltah" min="-50" max="50" step="1" value="${d.deltaH}">
                      <span style="font-size: 0.75rem; color: var(--color-text-secondary);">m</span>
                    </div>
                  </div>
                  <input type="range" class="rf-cov-slider" id="tilt-slider-deltah" min="-30" max="30" step="1" value="${d.deltaH}">
                </div>
              </div>

              <!-- Fieldset 2: Downtilt Configuration & Tuning -->
              <div class="rf-cov-fieldset" style="margin-bottom: 0;">
                <div class="rf-cov-legend">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  <span>${isId ? 'Konfigurasi Downtilt' : 'Downtilt Configuration'}</span>
                  <div class="rf-cov-legend-line"></div>
                </div>

                <!-- Mechanical Tilt -->
                <div class="rf-cov-param-row">
                  <div class="rf-cov-param-header">
                    <span class="rf-cov-param-label">
                      Mechanical Downtilt
                      <span class="rf-tilt-badge rf-tilt-badge--mech">Mech</span>
                    </span>
                    <div class="rf-cov-param-value-wrap">
                      <input type="number" class="rf-cov-param-input" id="tilt-input-mech" min="-5" max="15" step="0.5" value="${d.mech}">
                      <span style="font-size: 0.75rem; color: var(--color-text-secondary);">°</span>
                    </div>
                  </div>
                  <input type="range" class="rf-cov-slider" id="tilt-slider-mech" min="-5" max="12" step="0.5" value="${d.mech}">
                </div>

                <!-- Electrical Tilt -->
                <div class="rf-cov-param-row">
                  <div class="rf-cov-param-header">
                    <span class="rf-cov-param-label">
                      Electrical Downtilt (RET)
                      <span class="rf-tilt-badge rf-tilt-badge--elec">Elec</span>
                    </span>
                    <div class="rf-cov-param-value-wrap">
                      <input type="number" class="rf-cov-param-input" id="tilt-input-elec" min="0" max="14" step="0.5" value="${d.elec}">
                      <span style="font-size: 0.75rem; color: var(--color-text-secondary);">°</span>
                    </div>
                  </div>
                  <input type="range" class="rf-cov-slider" id="tilt-slider-elec" min="0" max="14" step="0.5" value="${d.elec}">
                </div>

                <!-- Vertical Beamwidth -->
                <div class="rf-cov-param-row" style="margin-bottom: 0;">
                  <div class="rf-cov-param-header">
                    <span class="rf-cov-param-label">Vertical Beamwidth (3dB)</span>
                    <div class="rf-cov-param-value-wrap">
                      <input type="number" class="rf-cov-param-input" id="tilt-input-vbw" min="2" max="20" step="0.5" value="${d.vbw}">
                      <span style="font-size: 0.75rem; color: var(--color-text-secondary);">°</span>
                    </div>
                  </div>
                  <input type="range" class="rf-cov-slider" id="tilt-slider-vbw" min="3" max="16" step="0.5" value="${d.vbw}">
                </div>
              </div>
            </div>
          </section>

          <!-- RIGHT: INTERACTIVE DIAGRAM VISUALIZER -->
          <section class="zone-card" style="display: flex; flex-direction: column;">
            <div class="rf-coverage-canvas-frame" style="flex: 1; min-height: 420px;">
              <div class="rf-coverage-canvas-header">
                <span style="display: flex; align-items: center; gap: 6px;">
                  <span>📡</span> ${isId ? 'Geometri Visualisasi NetTilt 3D' : 'NetTilt 3D Radiation Geometry'}
                </span>
                <div class="rf-cov-tabs" id="tilt-tab-bar">
                  <button type="button" class="rf-cov-tab-btn ${this.activeTiltTab === 'perspective' ? 'rf-cov-tab-btn--active' : ''}" data-tab="perspective">
                    ${isId ? 'Perspektif 3D Balok Radiasi' : '3D Perspective Beam'}
                  </button>
                  <button type="button" class="rf-cov-tab-btn ${this.activeTiltTab === 'gauge' ? 'rf-cov-tab-btn--active' : ''}" data-tab="gauge">
                    ${isId ? 'Meteran Deviasi Sudut' : 'Tilt Deviation Gauge'}
                  </button>
                </div>
              </div>

              <div class="rf-coverage-canvas-body" id="tilt-diagram-body">
                ${this.activeTiltTab === 'perspective' ? this.renderTiltPerspectiveSvg(d) : this.renderTiltGaugeSvg(d)}
              </div>
              <div class="rf-diagram-hud">
                <div class="rf-diagram-hud__legend">
                  <span class="rf-diagram-hud__item">
                    <span class="rf-diagram-hud__dot" style="background:#6366f1;"></span>
                    <span>Net Vector (${d.totalTilt.toFixed(1)}°)</span>
                  </span>
                  <span class="rf-diagram-hud__item">
                    <span class="rf-diagram-hud__dot" style="background:#10b981;"></span>
                    <span>Target (${d.targetDist}m)</span>
                  </span>
                  <span class="rf-diagram-hud__item">
                    <span class="rf-diagram-hud__dot" style="background:#0284c7;"></span>
                    <span>Ground Hit (${d.boresightDist.toFixed(0)}m)</span>
                  </span>
                </div>
                <div class="rf-diagram-hud__readout" id="tilt-hud-readout">
                  Optimum: ${d.optTiltDeg.toFixed(2)}° | Deviation: ${d.tiltDelta > 0 ? '+' : ''}${d.tiltDelta.toFixed(1)}° | Hit: ${d.boresightDist.toFixed(1)}m
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    `;

    this.bindNetTilt3D();
  }

  renderTiltKpiCards(d) {
    const isId = state.lang === 'id';
    const statusClass = d.alignStatus === 'optimal'
      ? 'rf-coverage-chip--excellent'
      : (d.alignStatus === 'over' ? 'rf-coverage-chip--bad' : 'rf-coverage-chip--fair');
    const statusCardClass = d.alignStatus === 'optimal'
      ? 'rf-metric-card--optimal'
      : (d.alignStatus === 'over' ? 'rf-metric-card--critical' : 'rf-metric-card--warning');

    return `
      <div class="rf-metric-card rf-metric-card--accent">
        <div class="rf-metric-card__header">
          <span class="rf-metric-card__label">${isId ? 'Total Net Tilt' : 'Total Net Tilt'}</span>
          <span class="rf-tilt-badge rf-tilt-badge--net">${d.totalTilt}°</span>
        </div>
        <div class="rf-metric-card__value" id="kpi-tilt-total">${d.totalTilt.toFixed(1)}<span class="rf-metric-card__unit">°</span></div>
        <div class="rf-metric-card__meta">${d.mech.toFixed(1)}° Mech + ${d.elec.toFixed(1)}° RET</div>
      </div>

      <div class="rf-metric-card rf-metric-card--optimal">
        <div class="rf-metric-card__header">
          <span class="rf-metric-card__label">${isId ? 'Sudut Optimum Target' : 'Optimum Target Tilt'}</span>
          <span class="rf-coverage-chip rf-coverage-chip--good">Calculated</span>
        </div>
        <div class="rf-metric-card__value" id="kpi-tilt-opt">${d.optTiltDeg.toFixed(2)}<span class="rf-metric-card__unit">°</span></div>
        <div class="rf-metric-card__meta">For ${d.targetDist}m @ H=${d.effHeight}m</div>
      </div>

      <div class="rf-metric-card ${statusCardClass}">
        <div class="rf-metric-card__header">
          <span class="rf-metric-card__label">${isId ? 'Status Keselarasan' : 'Alignment Status'}</span>
          <span class="rf-coverage-chip ${statusClass}">${d.alignStatus.toUpperCase()}</span>
        </div>
        <div class="rf-metric-card__value" style="font-size: 1.05rem;" id="kpi-tilt-status">${d.alignLabel}</div>
        <div class="rf-metric-card__meta">Delta: ${d.tiltDelta > 0 ? '+' : ''}${d.tiltDelta.toFixed(1)}°</div>
      </div>

      <div class="rf-metric-card rf-metric-card--nominal">
        <div class="rf-metric-card__header">
          <span class="rf-metric-card__label">${isId ? 'Titik Jatuh Boresight' : 'Boresight Ground Hit'}</span>
          <span class="rf-coverage-chip rf-coverage-chip--good">Center</span>
        </div>
        <div class="rf-metric-card__value" id="kpi-tilt-boresight">${d.boresightDist.toFixed(1)}<span class="rf-metric-card__unit">m</span></div>
        <div class="rf-metric-card__meta">Target is @ ${d.targetDist}m</div>
      </div>

      <div class="rf-metric-card rf-metric-card--warning">
        <div class="rf-metric-card__header">
          <span class="rf-metric-card__label">Inner & Outer 3dB</span>
          <span class="rf-coverage-chip rf-coverage-chip--fair">Span</span>
        </div>
        <div class="rf-metric-card__value" id="kpi-tilt-innerouter">${d.innerDist.toFixed(0)} / ${d.outerDist.toFixed(0)}<span class="rf-metric-card__unit">m</span></div>
        <div class="rf-metric-card__meta">Near: ${d.innerDist.toFixed(0)}m, Far: ${d.outerDist.toFixed(0)}m</div>
      </div>

      <div class="rf-metric-card rf-metric-card--optimal">
        <div class="rf-metric-card__header">
          <span class="rf-metric-card__label">${isId ? 'Panjang Jejak Radiasi' : 'Ground Footprint Depth'}</span>
          <span class="rf-coverage-chip rf-coverage-chip--excellent">Coverage</span>
        </div>
        <div class="rf-metric-card__value" id="kpi-tilt-footprint">${d.footprintLength.toFixed(1)}<span class="rf-metric-card__unit">m</span></div>
        <div class="rf-metric-card__meta">Continuous 3dB zone</div>
      </div>
    `;
  }

  renderTiltPerspectiveSvg(d) {
    const maxD = Math.max(d.targetDist * 1.35, d.outerDist * 1.1, 400);
    const scaleX = (dist) => 80 + Math.min(380, (dist / maxD) * 380);

    const xTarget = scaleX(d.targetDist);
    const xBoresight = scaleX(Math.min(maxD, d.boresightDist));
    const xInner = scaleX(d.innerDist);
    const xOuter = scaleX(Math.min(maxD, d.outerDist));

    const yGround = 210;
    const yTower = 60;
    const xTower = 80;

    return `
      <svg viewBox="0 0 520 270" width="100%" height="270" xmlns="http://www.w3.org/2000/svg" class="rf-coverage-svg">
        <!-- 3D Perspective Ground Plane Mesh -->
        <polygon points="40,240 160,180 480,180 480,240" fill="#0284C7" fill-opacity="0.04" stroke="#E2E8F0" class="diagram-grid" stroke-width="1"/>
        <line x1="40" y1="${yGround}" x2="480" y2="${yGround}" stroke="#E2E8F0" class="diagram-grid" stroke-width="1.8"/>

        <!-- 3D Ground Footprint Ellipse Between Inner and Outer -->
        <ellipse cx="${(xInner + xOuter) / 2}" cy="${yGround}" rx="${Math.max(10, (xOuter - xInner) / 2)}" ry="12" fill="#0284C7" fill-opacity="0.14" stroke="#0284C7" stroke-width="1.2" stroke-dasharray="2 2"/>

        <!-- 3D Beam Cone Envelope -->
        <polygon points="${xTower},${yTower} ${xInner},${yGround} ${xOuter},${yGround}" fill="#6366F1" fill-opacity="0.08" stroke="#6366F1" stroke-opacity="0.25" stroke-width="1"/>

        <!-- Boresight Ray (Solid Line) -->
        <line x1="${xTower}" y1="${yTower}" x2="${xBoresight}" y2="${yGround}" stroke="#10B981" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="${xBoresight}" cy="${yGround}" r="4.5" fill="#10B981"/>

        <!-- Target Pin Marker -->
        <g transform="translate(${xTarget}, ${yGround})">
          <line x1="0" y1="0" x2="0" y2="-28" stroke="#EF4444" stroke-width="1.8"/>
          <circle cx="0" cy="-28" r="4.5" fill="#EF4444"/>
          <rect x="-24" y="-44" width="48" height="14" rx="2" fill="#FFFFFF" stroke="#EF4444" stroke-width="1"/>
          <text x="0" y="-34" fill="#EF4444" font-size="7" font-weight="bold" font-family="monospace" text-anchor="middle">Target ${d.targetDist}m</text>
        </g>

        <!-- Antenna Tower Structure -->
        <path d="${xTower - 12} ${yGround} L ${xTower} ${yTower} L ${xTower + 12} ${yGround}" stroke="#0284C7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="${xTower - 8}" y1="165" x2="${xTower + 8}" y2="165" stroke="#0284C7" stroke-width="1.2"/>
        <line x1="${xTower - 5}" y1="115" x2="${xTower + 5}" y2="115" stroke="#0284C7" stroke-width="1.2"/>

        <!-- Antenna Panel Rotated by Tilt -->
        <g transform="translate(${xTower}, ${yTower}) rotate(${Math.min(45, Math.max(-10, d.totalTilt))})">
          <rect x="-3" y="-12" width="6" height="24" rx="2" fill="#0284C7" stroke="#0369A1" stroke-width="1.2"/>
          <line x1="0" y1="0" x2="24" y2="0" stroke="#10B981" stroke-width="1.6" stroke-linecap="round"/>
        </g>
        <circle cx="${xTower}" cy="${yTower}" r="3" fill="#10B981"/>

        <!-- Info Badge in Top Left -->
        <g transform="translate(110, 20)">
          <rect width="210" height="32" rx="4" fill="#FFFFFF" stroke="#E2E8F0" class="diagram-panel" filter="drop-shadow(0 1px 4px rgba(0,0,0,0.08))"/>
          <text x="12" y="16" fill="#0F172A" class="diagram-text-title" font-size="8" font-weight="bold">
            Total Tilt: <tspan fill="#6366F1">${d.totalTilt}°</tspan> | Optimum: <tspan fill="#10B981">${d.optTiltDeg.toFixed(1)}°</tspan>
          </text>
          <text x="12" y="27" fill="${d.alignStatus === 'optimal' ? '#10B981' : '#EF4444'}" font-size="7.5" font-weight="bold">
            ${d.alignLabel}
          </text>
        </g>
      </svg>
    `;
  }

  renderTiltGaugeSvg(d) {
    const cx = 260;
    const cy = 200;
    const r = 115;
    // Map tilt angles (0 deg to 15 deg) to gauge arc from -140 deg to -40 deg (180 deg span)
    const angleToRad = (tilt) => {
      const clamped = Math.max(0, Math.min(15, tilt));
      const normalized = clamped / 15; // 0 to 1
      const deg = 180 + normalized * 180; // 180 (left) to 360 (right)
      return deg * (Math.PI / 180);
    };

    const optRad = angleToRad(d.optTiltDeg);
    const curRad = angleToRad(d.totalTilt);

    // Needle coords
    const needleLen = 95;
    const nx = cx + needleLen * Math.cos(curRad);
    const ny = cy + needleLen * Math.sin(curRad);

    return `
      <svg viewBox="0 0 520 270" width="100%" height="270" xmlns="http://www.w3.org/2000/svg" class="rf-coverage-svg">
        <!-- Gauge Outer Arc Track -->
        <path d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}" fill="none" stroke="#E2E8F0" class="diagram-grid" stroke-width="16" stroke-linecap="round"/>

        <!-- Colored Sectors on Gauge -->
        <!-- Optimal Target Zone (Emerald) -->
        <path d="M ${cx + (r) * Math.cos(angleToRad(Math.max(0, d.optTiltDeg - 0.7)))} ${cy + (r) * Math.sin(angleToRad(Math.max(0, d.optTiltDeg - 0.7)))} A ${r} ${r} 0 0 1 ${cx + (r) * Math.cos(angleToRad(Math.min(15, d.optTiltDeg + 0.7)))} ${cy + (r) * Math.sin(angleToRad(Math.min(15, d.optTiltDeg + 0.7)))}" fill="none" stroke="#10B981" stroke-width="16"/>

        <!-- Target Marker Line -->
        <line x1="${cx + (r - 12) * Math.cos(optRad)}" y1="${cy + (r - 12) * Math.sin(optRad)}" x2="${cx + (r + 12) * Math.cos(optRad)}" y2="${cy + (r + 12) * Math.sin(optRad)}" stroke="#047857" stroke-width="3" stroke-linecap="round"/>

        <!-- Gauge Pivot and Needle -->
        <line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="#EF4444" stroke-width="3" stroke-linecap="round"/>
        <circle cx="${cx}" cy="${cy}" r="9" fill="#0F172A"/>
        <circle cx="${cx}" cy="${cy}" r="4" fill="#EF4444"/>

        <!-- Gauge Dial Labels -->
        <text x="${cx - r - 8}" y="${cy + 15}" fill="#64748B" class="diagram-text-muted" font-size="8.5" text-anchor="middle">0°</text>
        <text x="${cx}" y="${cy - r - 8}" fill="#64748B" class="diagram-text-muted" font-size="8.5" text-anchor="middle">7.5°</text>
        <text x="${cx + r + 8}" y="${cy + 15}" fill="#64748B" class="diagram-text-muted" font-size="8.5" text-anchor="middle">15°</text>

        <!-- Digital Readout Center Card -->
        <g transform="translate(185, 205)">
          <rect width="150" height="42" rx="5" fill="#FFFFFF" stroke="#E2E8F0" class="diagram-panel" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.08))"/>
          <text x="75" y="18" fill="#64748B" class="diagram-text-muted" font-size="7.5" font-weight="bold" text-anchor="middle">CURRENT TILT vs OPTIMUM</text>
          <text x="75" y="34" fill="#0F172A" class="diagram-text-title" font-size="11" font-weight="bold" font-family="monospace" text-anchor="middle">
            <tspan fill="#EF4444">${d.totalTilt}°</tspan> / <tspan fill="#10B981">${d.optTiltDeg}°</tspan>
          </text>
        </g>
      </svg>
    `;
  }

  bindNetTilt3D() {
    const bindPair = (inputId, sliderId, key) => {
      const input = this.container.querySelector(inputId);
      const slider = this.container.querySelector(sliderId);
      if (!input || !slider) return;

      const update = (val) => {
        const num = parseFloat(val);
        if (!isNaN(num)) {
          this.ws.params[key] = num;
          input.value = num;
          slider.value = num;
          this.refreshTiltUi();
        }
      };

      input.addEventListener('input', (e) => update(e.target.value));
      slider.addEventListener('input', (e) => update(e.target.value));
    };

    bindPair('#tilt-input-target', '#tilt-slider-target', 'target_distance');
    bindPair('#tilt-input-height', '#tilt-slider-height', 'tower_height');
    bindPair('#tilt-input-mech', '#tilt-slider-mech', 'mechanical_tilt');
    bindPair('#tilt-input-elec', '#tilt-slider-elec', 'electrical_tilt');
    bindPair('#tilt-input-vbw', '#tilt-slider-vbw', 'v_beamwidth');
    bindPair('#tilt-input-deltah', '#tilt-slider-deltah', 'delta_h');

    // Quick Target Distance Presets
    const targetPills = this.container.querySelectorAll('.rf-cov-presets [data-target-dist]');
    targetPills.forEach(pill => {
      pill.addEventListener('click', () => {
        targetPills.forEach(p => p.classList.remove('rf-cov-preset-pill--active'));
        pill.classList.add('rf-cov-preset-pill--active');
        const dist = parseFloat(pill.dataset.targetDist);
        this.ws.params.target_distance = dist;
        const targetInput = this.container.querySelector('#tilt-input-target');
        const targetSlider = this.container.querySelector('#tilt-slider-target');
        if (targetInput) targetInput.value = dist;
        if (targetSlider) targetSlider.value = dist;
        this.refreshTiltUi();
        toast.info(`Target distance set to ${dist}m`);
      });
    });

    // Auto-tune button
    const autoTuneBtn = this.container.querySelector('#tilt-autotune-btn');
    if (autoTuneBtn) {
      autoTuneBtn.addEventListener('click', () => {
        const d = this.calculateNetTilt3DData(this.ws.params);
        // Desired electrical tilt = optTiltDeg - mech
        const targetElec = Math.max(0, Math.min(14, Math.round((d.optTiltDeg - d.mech) * 2) / 2));
        this.ws.params.electrical_tilt = targetElec;
        const elecInput = this.container.querySelector('#tilt-input-elec');
        const elecSlider = this.container.querySelector('#tilt-slider-elec');
        if (elecInput) elecInput.value = targetElec;
        if (elecSlider) elecSlider.value = targetElec;
        this.refreshTiltUi();
        toast.success(`Aligned electrical tilt to ${targetElec}° (Total tilt: ${(d.mech + targetElec).toFixed(1)}°)`);
      });
    }

    // Tabs
    const tabBtns = this.container.querySelectorAll('#tilt-tab-bar .rf-cov-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('rf-cov-tab-btn--active'));
        btn.classList.add('rf-cov-tab-btn--active');
        this.activeTiltTab = btn.dataset.tab;
        this.refreshTiltUi();
      });
    });

    // Actions
    const copyBtn = this.container.querySelector('#tilt-copy-summary-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const d = this.calculateNetTilt3DData(this.ws.params);
        const text = `NetTilt 3D Optimization Results:
- Target Distance: ${d.targetDist}m | Effective Height: ${d.effHeight}m
- Total Tilt: ${d.totalTilt}° (${d.mech}° Mech + ${d.elec}° RET)
- Calculated Optimum Tilt: ${d.optTiltDeg}°
- Alignment Status: ${d.alignLabel} (Delta: ${d.tiltDelta > 0 ? '+' : ''}${d.tiltDelta}°)
- Boresight Ground Impact: ${d.boresightDist.toFixed(1)}m
- Inner/Outer 3dB Edges: ${d.innerDist.toFixed(1)}m - ${d.outerDist.toFixed(1)}m
- Continuous Footprint Depth: ${d.footprintLength.toFixed(1)}m`;
        this.copyToClipboard(text, 'NetTilt 3D summary copied to clipboard!');
      });
    }

    const exportBtn = this.container.querySelector('#tilt-export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const d = this.calculateNetTilt3DData(this.ws.params);
        this.copyToClipboard(JSON.stringify(d, null, 2), 'Calculation JSON copied to clipboard!');
      });
    }

    const resetBtn = this.container.querySelector('#tilt-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.ws.params = {
          tower_height: 35.0,
          user_height: 1.5,
          delta_h: 0.0,
          target_distance: 500.0,
          mechanical_tilt: 2.0,
          electrical_tilt: 4.0,
          v_beamwidth: 8.0,
          h_beamwidth: 65.0
        };
        this.renderNetTilt3D();
        toast.info('NetTilt 3D parameters reset to defaults');
      });
    }
  }

  refreshTiltUi() {
    const d = this.calculateNetTilt3DData(this.ws.params);
    const kpiGrid = this.container.querySelector('#tilt-kpi-grid');
    if (kpiGrid) kpiGrid.innerHTML = this.renderTiltKpiCards(d);

    const diagramBody = this.container.querySelector('#tilt-diagram-body');
    if (diagramBody) {
      diagramBody.innerHTML = this.activeTiltTab === 'perspective'
        ? this.renderTiltPerspectiveSvg(d)
        : this.renderTiltGaugeSvg(d);
    }

    const hudReadout = this.container.querySelector('#tilt-hud-readout');
    if (hudReadout) {
      hudReadout.textContent = `Optimum: ${d.optTiltDeg.toFixed(2)}° | Deviation: ${d.tiltDelta > 0 ? '+' : ''}${d.tiltDelta.toFixed(1)}° | Hit: ${d.boresightDist.toFixed(1)}m`;
    }
  }

}
