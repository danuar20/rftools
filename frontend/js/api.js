/**
 * RF TOOLS API Service Client
 * Connects frontend interface with FastAPI endpoints on port 5005
 */

const API_BASE = ''; // Relative path when served on port 5005, or http://localhost:5005

export class ApiService {
  /**
   * Pings backend health endpoint and measures latency
   */
  static async getHealth() {
    const start = performance.now();
    try {
      const res = await fetch(`${API_BASE}/api/v1/health`, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      const latency = Math.round(performance.now() - start);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { ok: true, latency, data };
    } catch (err) {
      const latency = Math.round(performance.now() - start);
      return { ok: false, latency, error: err.message };
    }
  }

  /**
   * Fetches metadata catalog of all 6 tools
   */
  static async getTools() {
    const res = await fetch(`${API_BASE}/api/v1/tools`);
    if (!res.ok) throw new Error(`Failed to fetch tools: ${res.statusText}`);
    return await res.json();
  }

  /**
   * Fetches detail for a single tool
   */
  static async getTool(toolId) {
    const res = await fetch(`${API_BASE}/api/v1/tools/${encodeURIComponent(toolId)}`);
    if (!res.ok) throw new Error(`Tool ${toolId} not found`);
    return await res.json();
  }

  /**
   * Inspects spreadsheet columns using FastAPI heuristic engine
   */
  static async inspectColumns(file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/api/v1/inspect-columns`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      let detail = 'File inspection failed';
      try {
        const errJson = await res.json();
        detail = errJson.detail || detail;
      } catch (e) {}
      throw new Error(detail);
    }

    return await res.json();
  }

  /**
   * Downloads a sample reference template file (.xlsx)
   */
  static async downloadTemplate(templateId) {
    const url = `${API_BASE}/api/v1/templates/${encodeURIComponent(templateId)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Template ${templateId} not found`);

    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition') || '';
    let filename = `${templateId}_template.xlsx`;
    const match = disposition.match(/filename=["']?([^"';]+)["']?/);
    if (match && match[1]) {
      filename = match[1];
    }

    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
    return filename;
  }

  /**
   * Fetches sample template as File object for direct loading into dropzone
   */
  static async fetchTemplateFile(templateId) {
    const url = `${API_BASE}/api/v1/templates/${encodeURIComponent(templateId)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Template ${templateId} not found`);

    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition') || '';
    let filename = `${templateId}_sample.xlsx`;
    const match = disposition.match(/filename=["']?([^"';]+)["']?/);
    if (match && match[1]) {
      filename = match[1];
    }

    return new File([blob], filename, { type: blob.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /**
   * Executes tool calculation with preview or full deliverable download
   */
  static async processTool(toolId, formData, preview = false) {
    const query = preview ? '?preview=true' : '';
    const url = `${API_BASE}/api/v1/tools/${encodeURIComponent(toolId)}/process${query}`;

    const res = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      let detail = 'Calculation engine failed';
      try {
        const errJson = await res.json();
        detail = errJson.detail || detail;
      } catch (e) {
        detail = `HTTP ${res.status}: ${res.statusText}`;
      }
      throw new Error(detail);
    }

    if (preview) {
      return await res.json();
    }

    // Handle full download deliverable
    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition') || '';
    let filename = `output_${toolId}`;
    const match = disposition.match(/filename=["']?([^"';]+)["']?/);
    if (match && match[1]) {
      filename = match[1];
    }

    let summary = {};
    const summaryHeader = res.headers.get('X-Summary');
    if (summaryHeader) {
      try {
        summary = JSON.parse(summaryHeader);
      } catch (e) {}
    }

    // Trigger browser file save
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);

    return { success: true, filename, size: blob.size, summary };
  }
}
