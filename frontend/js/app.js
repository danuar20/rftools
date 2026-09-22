/**
 * RF TOOLS Main Application Entrypoint
 */

import { state } from './state.js';
import { ApiService } from './api.js';
import { NavbarComponent } from './components/navbar.js';
import { SidebarComponent } from './components/sidebar.js';
import { CommandPaletteComponent } from './components/command_palette.js';
import { DashboardComponent } from './components/dashboard.js';
import { DirectoryComponent } from './components/directory.js';
import { WorkspaceComponent } from './components/workspace.js';
import { DocsComponent } from './components/docs.js';
import { TemplatesComponent } from './components/templates.js';
import { AboutComponent } from './components/about.js';
import { toast } from './components/toast.js';

class App {
  constructor() {
    this.viewport = document.getElementById('content-viewport');
    this.sidebarContainer = document.getElementById('sidebar-container');
    this.navbarContainer = document.getElementById('navbar-container');

    this.navbar = new NavbarComponent(this.navbarContainer);
    this.sidebar = new SidebarComponent(this.sidebarContainer);
    this.commandPalette = new CommandPaletteComponent();
    this.aboutModal = new AboutComponent();

    this.activeComponent = null;

    this.init();
  }

  async init() {
    // Initial health check
    await this.checkHealth();
    // Periodic health check every 15s
    setInterval(() => this.checkHealth(), 15000);

    // Fetch tool catalog
    try {
      const tools = await ApiService.getTools();
      state.tools = tools;
      state.emit('tools-loaded', tools);
    } catch (err) {
      console.warn('Could not fetch tools catalog from API, using fallback catalog.', err);
    }

    // Bind route and language changes
    state.subscribe((event, data) => {
      if (event === 'route-change') {
        this.renderRoute(data);
      } else if (event === 'language-change') {
        this.renderRoute(state.route);
      }
    });

    // Global keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        state.toggleSidebar();
      }
    });

    // Initial render
    this.renderRoute(state.route);
  }

  async checkHealth() {
    const res = await ApiService.getHealth();
    state.health = res;
    state.emit('health-update', res);
  }

  renderRoute(route) {
    if (!this.viewport) return;

    // Clean up previous active component listeners
    if (this.activeComponent && typeof this.activeComponent.destroy === 'function') {
      try {
        this.activeComponent.destroy();
      } catch (err) {
        console.warn('Component destroy error:', err);
      }
      this.activeComponent = null;
    }

    this.viewport.innerHTML = '';
    window.scrollTo(0, 0);

    if (!route || route === 'dashboard') {
      this.activeComponent = new DashboardComponent(this.viewport);
    } else if (route === 'tools') {
      window.location.hash = '#dashboard';
      return;
    } else if (route.startsWith('tool-')) {
      const toolId = route.replace('tool-', '');
      this.activeComponent = new WorkspaceComponent(this.viewport, toolId);
    } else if (route === 'docs') {
      this.activeComponent = new DocsComponent(this.viewport);
    } else if (route === 'templates') {
      this.activeComponent = new TemplatesComponent(this.viewport);
    } else if (route === 'about') {
      this.activeComponent = new DashboardComponent(this.viewport);
      if (this.aboutModal) {
        this.aboutModal.open();
      }
    } else {
      this.activeComponent = new DashboardComponent(this.viewport);
    }
  }
}

// Boot application
function boot() {
  if (!window.rfApp) {
    window.rfApp = new App();
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

