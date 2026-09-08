/**
 * Sample Reference Templates Component
 * Allows one-click downloads and instant launching of sample datasets
 */

import { ApiService } from '../api.js';
import { toast } from './toast.js';

export class TemplatesComponent {
  constructor(container) {
    this.container = container;
    this.templates = [
      {
        id: 'point_kml',
        title: 'Point KML Reference Template',
        filename: 'Sample_Point_KML.xlsx',
        toolId: 'excel-to-kml',
        toolName: 'Excel to Point KML',
        description: 'Standard coordinate spreadsheet containing site identifiers and WGS84 coordinates.',
        headers: ['SITE_ID', 'SITENAME', 'Site', 'LONG', 'LAT'],
        sampleRows: [
          ['JKT001', 'Jakarta_Monas_01', 'JKT001 : Jakarta_Monas_01', '106.827153', '-6.175392'],
          ['JKT002', 'Jakarta_GBK_02', 'JKT002 : Jakarta_GBK_02', '106.801444', '-6.243589'],
          ['BDG001', 'Bandung_GedungSate_01', 'BDG001 : Bandung_GedungSate_01', '107.619123', '-6.917464']
        ]
      },
      {
        id: 'prb_kml',
        title: 'PRB 3D Sector Reference Template',
        filename: 'Sample_PRB_KML.xlsx',
        toolId: 'prb-kml',
        toolName: 'Excel to PRB KML 3D Sector',
        description: 'Comprehensive 3GPP cellular site dump with PRB loads, azimuths, beamwidths, tower heights, and tilts.',
        headers: ['SITEID', 'SITENAME', 'CELLNAME', 'BEAM', 'DL PRB BDBH', 'LONG', 'LAT', 'DIRECTION', 'TOWER_HEIGHT'],
        sampleRows: [
          ['JKT001', 'JKT_MONAS_01', 'JKT_MONAS_01_Sec1', 'LTE1800', '25.5%', '106.827153', '-6.175392', '0°', '30m'],
          ['JKT001', 'JKT_MONAS_01', 'JKT_MONAS_01_Sec2', 'LTE1800', '68.4%', '106.827153', '-6.175392', '120°', '30m'],
          ['JKT001', 'JKT_MONAS_01', 'JKT_MONAS_01_Sec3', 'LTE1800', '92.1%', '106.827153', '-6.175392', '240°', '30m']
        ]
      },
      {
        id: 'isd_a',
        title: 'ISD Source Sites (File A)',
        filename: 'Sample_ISD_FileA.xlsx',
        toolId: 'isd-calculator',
        toolName: 'ISD Calculator (Source)',
        description: 'Source cell cluster coordinate list evaluated for nearest neighbor distances.',
        headers: ['SITE_ID', 'LAT', 'LONG'],
        sampleRows: [
          ['SITE_A01', '-6.175392', '106.827153'],
          ['SITE_A02', '-6.917464', '107.619123']
        ]
      },
      {
        id: 'isd_b',
        title: 'ISD Candidate Sites (File B)',
        filename: 'Sample_ISD_FileB.xlsx',
        toolId: 'isd-calculator',
        toolName: 'ISD Calculator (Target)',
        description: 'Target or competitor cell site list to match against Source File A.',
        headers: ['SITE_ID', 'LAT', 'LONG'],
        sampleRows: [
          ['SITE_B01', '-6.243589', '106.801444'],
          ['SITE_B02', '-6.183333', '106.841667'],
          ['SITE_B03', '-6.921852', '107.607140']
        ]
      },
      {
        id: 'geohash',
        title: 'Geohash GIS Reference Template',
        filename: 'Sample_Geohash.xlsx',
        toolId: 'geohash-to-shp',
        toolName: 'Geohash to Shapefile / Decoder',
        description: 'Sample geohash dataset for GIS polygon layer packaging or latitude/longitude centroid decoding.',
        headers: ['SITE_ID', 'SITENAME', 'GEOHASH', 'TRAFFIC_GB'],
        sampleRows: [
          ['JKT01', 'Monas_Center', 'qqgu4u2', '142.5'],
          ['JKT02', 'Gambir_Station', 'qqgu4uq', '210.8'],
          ['JKT03', 'Thamrin_Tower', 'qqgu4ev', '380.2']
        ]
      },
      {
        id: 'latlon',
        title: 'Coordinates for Geohash Encoding',
        filename: 'Sample_LatLon.xlsx',
        toolId: 'latlon-to-geohash',
        toolName: 'Lat/Long to Geohash Encoder',
        description: 'Tabular coordinate pairs formatted for base-32 geohash spatial index generation.',
        headers: ['SITE_ID', 'SITENAME', 'LAT', 'LONG'],
        sampleRows: [
          ['JKT01', 'Monas_Center', '-6.175392', '106.827153'],
          ['JKT02', 'Gambir_Station', '-6.176650', '106.830670'],
          ['JKT03', 'Thamrin_Tower', '-6.191200', '106.823400']
        ]
      }
    ];
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div style="max-width: 1400px; margin: 0 auto;">
        <!-- Header -->
        <div style="margin-bottom: 32px;">
          <h1 style="font-size: 1.875rem; font-weight: 700; color: var(--color-text-primary); margin: 0 0 8px 0;">
            Sample Reference Templates
          </h1>
          <p style="font-size: 0.9375rem; color: var(--color-text-secondary); margin: 0; max-width: 800px;">
            Download verified Excel reference workbooks (.xlsx) structured specifically for each RF TOOLS calculation workflow.
          </p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 24px;">
          ${this.templates.map(t => `
            <div class="component-box" style="margin-bottom: 0; display: flex; flex-direction: column;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div>
                  <h3 style="font-size: 1.15rem; font-weight: 600; color: var(--color-text-primary); margin: 0 0 4px 0;">
                    ${t.title}
                  </h3>
                  <span class="rf-dropzone-chip__format" style="font-size: 0.6875rem;">${t.filename}</span>
                </div>
                <div style="display: flex; gap: 8px;">
                  <a href="#tool-${t.toolId}" class="rf-btn rf-btn-secondary" style="padding: 5px 10px; font-size: 0.75rem;">
                    Open Tool &rarr;
                  </a>
                  <button class="rf-btn rf-btn-primary download-template-btn" data-id="${t.id}" style="padding: 5px 12px; font-size: 0.75rem;">
                    <span>📥 Download</span>
                  </button>
                </div>
              </div>

              <p style="font-size: 0.8125rem; color: var(--color-text-secondary); line-height: 1.45; margin-bottom: 16px;">
                ${t.description}
              </p>

              <!-- Mini Data Table Preview -->
              <div class="rf-table-wrap" style="border: 1px solid var(--color-border-subtle); border-radius: var(--rounded-sm); flex: 1;">
                <table class="rf-table">
                  <thead>
                    <tr>
                      ${t.headers.map(h => `<th>${h}</th>`).join('')}
                    </tr>
                  </thead>
                  <tbody>
                    ${t.sampleRows.map(row => `
                      <tr>
                        ${row.map(val => `<td class="rf-mono">${val}</td>`).join('')}
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const dlBtns = this.container.querySelectorAll('.download-template-btn');
    dlBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        try {
          btn.disabled = true;
          toast.info(`Downloading ${id} template from server...`);
          const fn = await ApiService.downloadTemplate(id);
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
