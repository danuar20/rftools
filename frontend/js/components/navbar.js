/**
 * Top Action Header & Navbar Component
 */

import { state } from '../state.js';

export class NavbarComponent {
  constructor(container) {
    this.container = container;
    this.render();

    state.subscribe((event, data) => {
      if (event === 'route-change' || event === 'tools-loaded' || event === 'health-update') {
        this.update();
      }
    });
  }

  render() {
    this.container.innerHTML = `
      <header class="top-header">
        <div class="top-header__left">
          <nav class="breadcrumbs" id="navbar-breadcrumbs">
            <a href="#dashboard">Dashboard</a>
          </nav>
        </div>
        <div class="top-header__right">
          <button class="search-trigger" id="navbar-search-btn" title="Quick search (Ctrl+K)">
            <span>🔍 Search or jump to tool...</span>
            <span class="kbd-shortcut">Ctrl+K</span>
          </button>

          <div class="status-pill" id="navbar-health-pill">
            <span class="pulse-dot" id="navbar-health-dot"></span>
            <span id="navbar-health-text">Checking...</span>
          </div>

          <a href="#docs" class="rf-btn rf-btn-ghost" style="padding: 6px 12px; font-size: 0.8125rem;" title="Engineering Documentation">
            <span>📖 Docs</span>
          </a>

          <a href="#templates" class="rf-btn rf-btn-ghost" style="padding: 6px 12px; font-size: 0.8125rem;" title="Sample Reference Spreadsheets">
            <span>📥 Templates</span>
          </a>
        </div>
      </header>
    `;

    const searchBtn = this.container.querySelector('#navbar-search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('open-command-palette'));
      });
    }

    this.update();
  }

  update() {
    const breadcrumbs = this.container.querySelector('#navbar-breadcrumbs');
    if (breadcrumbs) {
      breadcrumbs.innerHTML = this.buildBreadcrumbs(state.route);
    }

    const healthDot = this.container.querySelector('#navbar-health-dot');
    const healthText = this.container.querySelector('#navbar-health-text');
    if (healthDot && healthText) {
      if (state.health.ok) {
        healthDot.className = 'pulse-dot';
        healthText.textContent = `Live: Port 5005 (${state.health.latency}ms)`;
      } else {
        healthDot.className = 'pulse-dot pulse-dot--danger';
        healthText.textContent = 'Backend Offline';
      }
    }
  }

  buildBreadcrumbs(route) {
    if (!route || route === 'dashboard') {
      return '<span class="breadcrumbs__current">Dashboard</span>';
    }
    if (route === 'tools') {
      return `
        <a href="#dashboard">Dashboard</a>
        <span class="breadcrumbs__sep">&gt;</span>
        <span class="breadcrumbs__current">Tools Directory</span>
      `;
    }
    if (route.startsWith('tool-')) {
      const toolId = route.replace('tool-', '');
      const tool = state.tools.find(t => t.id === toolId);
      const toolTitle = tool ? tool.title : toolId;
      return `
        <a href="#dashboard">Dashboard</a>
        <span class="breadcrumbs__sep">&gt;</span>
        <a href="#tools">Tools</a>
        <span class="breadcrumbs__sep">&gt;</span>
        <span class="breadcrumbs__current">${toolTitle}</span>
      `;
    }
    if (route === 'docs') {
      return `
        <a href="#dashboard">Dashboard</a>
        <span class="breadcrumbs__sep">&gt;</span>
        <span class="breadcrumbs__current">Engineering Documentation</span>
      `;
    }
    if (route === 'templates') {
      return `
        <a href="#dashboard">Dashboard</a>
        <span class="breadcrumbs__sep">&gt;</span>
        <span class="breadcrumbs__current">Sample Template Hub</span>
      `;
    }
    if (route === 'about') {
      return `
        <a href="#dashboard">Dashboard</a>
        <span class="breadcrumbs__sep">&gt;</span>
        <span class="breadcrumbs__current">System Architecture &amp; Verification</span>
      `;
    }
    return `<span class="breadcrumbs__current">${route}</span>`;
  }
}
