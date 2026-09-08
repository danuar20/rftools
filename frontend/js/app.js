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

    this.activeComponent = null;

    this.init();
  }

  async init() {
    // Bind route change
    state.subscribe((event, route) => {
      if (event === 'route-change') {
        this.renderRoute(route);
      }
    });

    // Global keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        state.toggleSidebar();
      }
    });

    // Immediate initial render
    this.renderRoute(state.route);

    // Non-blocking health check
    this.checkHealth();
    setInterval(() => this.checkHealth(), 15000);

    // Non-blocking tool catalog fetch
    try {
      const tools = await ApiService.getTools();
      if (tools && Array.isArray(tools)) {
        state.tools = tools;
        state.emit('tools-loaded', tools);
      }
    } catch (err) {
      console.warn('Could not fetch tools catalog from API, using fallback catalog.', err);
    }
  }

  async checkHealth() {
    const res = await ApiService.getHealth();
    state.health = res;
    state.emit('health-update', res);
  }

  renderRoute(route) {
    if (!this.viewport) return;
    this.viewport.innerHTML = '';
    window.scrollTo(0, 0);

    if (!route || route === 'dashboard') {
      this.activeComponent = new DashboardComponent(this.viewport);
    } else if (route === 'tools') {
      this.activeComponent = new DirectoryComponent(this.viewport);
    } else if (route.startsWith('tool-')) {
      const toolId = route.replace('tool-', '');
      this.activeComponent = new WorkspaceComponent(this.viewport, toolId);
    } else if (route === 'docs') {
      this.activeComponent = new DocsComponent(this.viewport);
    } else if (route === 'templates') {
      this.activeComponent = new TemplatesComponent(this.viewport);
    } else if (route === 'about') {
      this.activeComponent = new AboutComponent(this.viewport);
    } else {
      this.activeComponent = new DashboardComponent(this.viewport);
    }
  }
}

// Boot application
function boot() {
  if (!window.rfApp) {
    console.log('Booting RF TOOLS App...');
    window.rfApp = new App();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

