/**
 * Command Palette & Global Search Modal (Ctrl+K)
 */

import { state } from '../state.js';

export class CommandPaletteComponent {
  constructor() {
    this.isOpen = false;
    this.selectedIndex = 0;
    this.filteredItems = [];

    this.items = [
      { id: 'excel-to-kml', title: 'Excel to Point KML Placemark Converter', category: 'KML Tool', route: '#tool-excel-to-kml' },
      { id: 'prb-kml', title: 'Excel to PRB KML 3D Sector Visualizer', category: 'KML Tool', route: '#tool-prb-kml' },
      { id: 'isd-calculator', title: 'Inter-Site Distance (ISD) Calculator', category: 'Topology Tool', route: '#tool-isd-calculator' },
      { id: 'geohash-to-shp', title: 'Geohash to ESRI Shapefile Generator', category: 'GIS Tool', route: '#tool-geohash-to-shp' },
      { id: 'geohash-to-latlon', title: 'Geohash to Centroid Lat/Long Decoder', category: 'GIS Tool', route: '#tool-geohash-to-latlon' },
      { id: 'latlon-to-geohash', title: 'Lat/Long to Geohash Encoder', category: 'GIS Tool', route: '#tool-latlon-to-geohash' },
      { id: 'dashboard', title: 'Workstation Dashboard & Overview', category: 'Navigation', route: '#dashboard' },
      { id: 'tools', title: 'Full Tools Directory & Feature Matrix', category: 'Navigation', route: '#tools' },
      { id: 'docs-formulae', title: 'Calculation Formulae: Haversine & Geodesic Projection', category: 'Docs', route: '#docs' },
      { id: 'docs-thresholds', title: 'Telecom KPI Matrix & PRB Load Thresholds', category: 'Docs', route: '#docs' },
      { id: 'docs-dev', title: 'Developer Guide: Adding Python Calculation Engines', category: 'Docs', route: '#docs' },
      { id: 'templates', title: 'Download Reference Spreadsheets (.xlsx)', category: 'Templates', route: '#templates' },
      { id: 'about', title: 'System Architecture & Port 5005 Health', category: 'System', route: '#about' }
    ];

    this.render();
    this.bindEvents();
  }

  render() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.id = 'command-palette-overlay';
    this.overlay.innerHTML = `
      <div class="command-palette" role="dialog" aria-modal="true">
        <div class="command-palette__input-wrap">
          <span style="color: var(--color-primary); font-size: 1.1rem;">🔍</span>
          <input type="text" class="command-palette__input" id="command-input" placeholder="Search tools, formulae, templates, or documentation..." autocomplete="off">
          <span class="kbd-shortcut">ESC</span>
        </div>
        <div class="command-palette__results" id="command-results">
        </div>
      </div>
    `;
    document.body.appendChild(this.overlay);

    this.input = this.overlay.querySelector('#command-input');
    this.resultsContainer = this.overlay.querySelector('#command-results');
  }

  bindEvents() {
    // Open event
    document.addEventListener('open-command-palette', () => this.open());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.toggle();
      } else if (e.key === 'Escape' && this.isOpen) {
        this.close();
      } else if (this.isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.moveSelection(1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.moveSelection(-1);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          this.selectActive();
        }
      }
    });

    // Close on overlay backdrop click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    // Input filtering
    this.input.addEventListener('input', () => {
      this.filter(this.input.value.trim().toLowerCase());
    });
  }

  open() {
    this.isOpen = true;
    this.overlay.classList.add('modal-overlay--open');
    this.input.value = '';
    this.filter('');
    setTimeout(() => this.input.focus(), 50);
  }

  close() {
    this.isOpen = false;
    this.overlay.classList.remove('modal-overlay--open');
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  filter(query) {
    if (!query) {
      this.filteredItems = [...this.items];
    } else {
      this.filteredItems = this.items.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query)
      );
    }

    this.selectedIndex = 0;
    this.renderResults();
  }

  renderResults() {
    if (this.filteredItems.length === 0) {
      this.resultsContainer.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--color-text-muted); font-size: 0.875rem;">
          No engineering tools or documentation matches found.
        </div>
      `;
      return;
    }

    this.resultsContainer.innerHTML = this.filteredItems.map((item, idx) => `
      <a href="${item.route}" class="command-palette__item${idx === this.selectedIndex ? ' command-palette__item--active' : ''}" data-index="${idx}">
        <div>
          <div class="command-palette__item-title">${item.title}</div>
        </div>
        <span class="command-palette__item-cat">${item.category}</span>
      </a>
    `).join('');

    const itemElements = this.resultsContainer.querySelectorAll('.command-palette__item');
    itemElements.forEach(el => {
      el.addEventListener('click', () => {
        this.close();
      });
    });
  }

  moveSelection(delta) {
    if (this.filteredItems.length === 0) return;
    this.selectedIndex = (this.selectedIndex + delta + this.filteredItems.length) % this.filteredItems.length;
    this.updateActiveItem();
  }

  updateActiveItem() {
    const items = this.resultsContainer.querySelectorAll('.command-palette__item');
    items.forEach((el, idx) => {
      if (idx === this.selectedIndex) {
        el.classList.add('command-palette__item--active');
        el.scrollIntoView({ block: 'nearest' });
      } else {
        el.classList.remove('command-palette__item--active');
      }
    });
  }

  selectActive() {
    if (this.filteredItems[this.selectedIndex]) {
      const active = this.filteredItems[this.selectedIndex];
      window.location.hash = active.route;
      this.close();
    }
  }
}
