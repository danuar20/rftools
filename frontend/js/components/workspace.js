/**
 * 4-Zone Workspace Component for RF TOOLS
 * Implements Zone 1 (Ingestion), Zone 2 (Mapping), Zone 3 (Parameters), Zone 4 (Results Preview)
 */

import { state } from '../state.js';
import { ApiService } from '../api.js';
import { toast } from './toast.js';

export class WorkspaceComponent {
  constructor(container, toolId) {
    this.container = container;
    this.toolId = toolId;
    this.ws = state.workspaces[toolId];
    this.activeSheetTab = 'result'; // For ISD dual sheet preview
    this.render();
  }

  getToolMeta() {
    const defaultMeta = {
      'excel-to-kml': {
        title: 'Excel to Point KML Placemark Converter',
        category: 'KML & Site Visualization',
        icon: 'tool-excel-to-kml.svg',
        description: 'Transforms spreadsheet site coordinates into Google Earth placemark KML files with custom icon scales, colors, and hierarchical folders.',
        sample_template_id: 'point_kml',
        outputExt: 'kml'
      },
      'prb-kml': {
        title: 'Excel to PRB KML 3D Sector Polygon Visualizer',
        category: 'KML & Site Visualization',
        icon: 'tool-prb-kml.svg',
        description: 'Generates extruded 3D antenna sector polygons color-coded by busy-hour DL/UL PRB utilization, RRC connected users, and 3GPP band altitudes.',
        sample_template_id: 'prb_kml',
        outputExt: 'kml'
      },
      'isd-calculator': {
        title: 'Inter-Site Distance (ISD) Calculator',
        category: 'Network Topology & ISD',
        icon: 'tool-isd-calculator.svg',
        description: 'Calculates high-speed geodesic Haversine distance matrix between two site datasets finding N-nearest neighbor relationships.',
        sample_template_id: 'isd_a',
        outputExt: 'xlsx'
      },
      'geohash-to-shp': {
        title: 'Geohash to ESRI Shapefile Generator',
        category: 'Geospatial & Geohash Utilities',
        icon: 'tool-geohash-to-shp.svg',
        description: 'Transforms geohash records into GIS vector polygon shapefile packages (.zip containing .shp, .shx, .dbf, .prj) with exact bbox or metric squares.',
        sample_template_id: 'geohash',
        outputExt: 'zip'
      },
      'geohash-to-latlon': {
        title: 'Geohash to Centroid Lat/Long Decoder',
        category: 'Geospatial & Geohash Utilities',
        icon: 'tool-geohash-to-latlon.svg',
        description: 'Decodes geohash string tokens into WGS84 decimal degree centroid coordinates (latitude and longitude).',
        sample_template_id: 'geohash',
        outputExt: 'xlsx'
      },
      'latlon-to-geohash': {
        title: 'Lat/Long to Geohash Encoder',
        category: 'Geospatial & Geohash Utilities',
        icon: 'tool-latlon-to-geohash.svg',
        description: 'Encodes paired geographic latitude/longitude coordinates into standardized geohash string tokens with user-defined precision (1 to 12).',
        sample_template_id: 'latlon',
        outputExt: 'xlsx'
      }
    };

    const found = state.tools.find(t => t.id === this.toolId);
    return found || defaultMeta[this.toolId] || { title: this.toolId, category: 'Tool', icon: 'rf-logo.svg', sample_template_id: 'point_kml' };
  }

  render() {
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
              <span>📥 Download Template (.xlsx)</span>
            </button>
            <button class="rf-btn rf-btn-ghost" id="ws-formula-guide-btn" title="View math formulae &amp; specifications">
              <span>📖 Guide</span>
            </button>
            <button class="rf-btn rf-btn-ghost" id="ws-reset-btn" title="Reset workspace form">
              <span>🔄 Reset</span>
            </button>
          </div>
        </header>

        <!-- ZONE 1: INGESTION DROPZONE -->
        <section class="zone-card">
          <div class="zone-header">
            <span class="zone-title">
              <span>📥</span> Zone 1: File Ingestion Dropzone
            </span>
            <span class="zone-badge" id="zone1-status-badge">
              ${isISD ? (this.ws.fileA && this.ws.fileB ? '2 Files Loaded' : 'Awaiting 2 Files') : (this.ws.file ? 'File Loaded' : 'Awaiting File')}
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
                <span>🎛️</span> Zone 2: Column Mapping Engine
              </span>
              <div style="display: flex; gap: 8px; align-items: center;">
                <button class="rf-btn rf-btn-ghost" id="reset-mappings-btn" style="padding: 2px 8px; font-size: 0.75rem;" title="Restore initial detected matches">
                  ↺ Reset Auto-Detect
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
                <span>⚡</span> Zone 3: Parameter Controls &amp; Physics
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
              <span>👁 Live Data Preview</span>
            </button>
            <button class="rf-btn rf-btn-primary" id="action-execute-btn" ${this.canCalculate() ? '' : 'disabled'}>
              <span id="action-execute-spinner" class="spinner" style="display: none;"></span>
              <span id="action-execute-text">⚡ Process &amp; Generate Deliverable</span>
            </button>
          </div>
        </div>

        <!-- ZONE 4: RESULTS & DATA PREVIEW -->
        <section class="zone-card" id="zone4-results-card" style="${this.ws.previewData || this.ws.resultSummary ? '' : 'display: none;'}">
          <div class="zone-header">
            <span class="zone-title">
              <span>📋</span> Zone 4: Results &amp; Data Preview Panel
            </span>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button class="rf-btn rf-btn-ghost" id="results-copy-btn" style="padding: 3px 10px; font-size: 0.75rem;">
                📋 Copy Data
              </button>
              <button class="rf-btn rf-btn-ghost" id="results-fullscreen-btn" style="padding: 3px 10px; font-size: 0.75rem;">
                🔍 Fullscreen
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
              File A: Source Sites Workbook (.xlsx)
            </div>
            ${this.ws.fileA ? this.renderLoadedChip('A', this.ws.fileA, this.ws.inspectionA) : this.renderEmptyDropzone('A')}
          </div>

          <!-- File B Dropzone -->
          <div>
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--color-accent-indigo); margin-bottom: 8px; text-transform: uppercase;">
              File B: Target Candidates Workbook (.xlsx)
            </div>
            ${this.ws.fileB ? this.renderLoadedChip('B', this.ws.fileB, this.ws.inspectionB) : this.renderEmptyDropzone('B')}
          </div>
        </div>
        <div style="margin-top: 14px; display: flex; justify-content: flex-end; gap: 8px;">
          <button class="rf-btn rf-btn-secondary" id="load-sample-isd-btn" style="padding: 6px 14px; font-size: 0.8125rem;">
            <span>📄 Load Sample Data for Both Files</span>
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
          <span>📄 Load Verified Sample Data into Workspace</span>
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
        <div class="rf-dropzone__title">Drag and drop spreadsheet here, or click to browse</div>
        <div class="rf-dropzone__desc">Instant header inspection and automatic column matching</div>
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

          <div class="rf-param-group">
            <div class="rf-param-header">
              <span class="rf-param-title">3GPP Carrier Band Altitude Stacking</span>
              <span style="font-size: 0.75rem; color: var(--color-text-muted);">Specs</span>
            </div>
            <div class="rf-param-desc">Pre-configured antenna layer altitudes preventing polygon collision</div>
            <table class="rf-band-table">
              <thead>
                <tr>
                  <th>Band Tier</th>
                  <th>Altitude</th>
                  <th>Beam Radius</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>LTE 700</td><td style="color: var(--color-primary);">42 m</td><td>38 m</td></tr>
                <tr><td>LTE 900</td><td style="color: var(--color-primary);">38 m</td><td>45 m</td></tr>
                <tr><td>LTE 1800</td><td style="color: var(--color-primary);">34 m</td><td>60 m</td></tr>
                <tr><td>LTE 2100</td><td style="color: var(--color-primary);">32 m</td><td>75 m</td></tr>
                <tr><td>LTE 2300</td><td style="color: var(--color-primary);">30 m</td><td>100 m</td></tr>
              </tbody>
            </table>
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
            </div>
            <div class="rf-segmented-switch" style="width: 100%;">
              <button class="rf-segmented-item rf-segmented-item--active" style="flex: 1;">Kilometers (km)</button>
              <button class="rf-segmented-item" style="flex: 1;">Meters (m)</button>
            </div>
          </div>

          <div class="rf-param-group">
            <div class="rf-param-header">
              <span class="rf-param-title">Dual-Sheet Export Structure</span>
            </div>
            <div class="rf-param-desc">
              Generated workbook includes:
              <br>&bull; <b>Sheet 1: ISD_Result</b> (Ranked Site ID pairs with exact Haversine km)
              <br>&bull; <b>Sheet 2: Summary</b> (Distance distribution: count, min, mean, max)
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
      ${isISD && summary.min_km !== undefined ? `
        <div class="kpi-summary-grid" style="margin-top: 12px;">
          <div class="kpi-summary-card">
            <span class="kpi-summary-label">Total Pairs</span>
            <span class="kpi-summary-value">${summary.total_pairs || 0}</span>
          </div>
          <div class="kpi-summary-card">
            <span class="kpi-summary-label">Min Distance</span>
            <span class="kpi-summary-value" style="color: var(--color-status-success);">${summary.min_km} km</span>
          </div>
          <div class="kpi-summary-card">
            <span class="kpi-summary-label">Mean Distance</span>
            <span class="kpi-summary-value" style="color: var(--color-primary);">${summary.mean_km} km</span>
          </div>
          <div class="kpi-summary-card">
            <span class="kpi-summary-label">Max Distance</span>
            <span class="kpi-summary-value" style="color: var(--color-status-warning);">${summary.max_km} km</span>
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
            <tr><td>Minimum Distance (Min)</td><td class="rf-mono" style="color: var(--color-status-success); font-weight: 600;">${summary.min_km}</td><td>km</td></tr>
            <tr><td>Mean Distance (Average)</td><td class="rf-mono" style="color: var(--color-primary); font-weight: 600;">${summary.mean_km}</td><td>km</td></tr>
            <tr><td>Maximum Distance (Max)</td><td class="rf-mono" style="color: var(--color-status-warning); font-weight: 600;">${summary.max_km}</td><td>km</td></tr>
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
                      <span class="rf-kpi-chip" style="background-color: ${val}22; border-color: ${val}; color: #F8FAFC;">
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
}
