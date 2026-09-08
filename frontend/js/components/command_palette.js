/**
 * Command Palette & Global Search Modal (Ctrl+K)
 * Clean, fast keyboard navigation across all tools and system controls
 */

import { state } from '../state.js';

export class CommandPaletteComponent {
  constructor() {
    this.isOpen = false;
    this.selectedIndex = 0;
    this.filteredItems = [];

    this.render();
    this.bindEvents();
  }

  getItems() {
    return [
      { id: 'excel-to-kml', title: state.t('tool_excel_to_kml_title'), category: state.t('nav_kml'), route: '#tool-excel-to-kml' },
      { id: 'prb-kml', title: state.t('tool_prb_kml_title'), category: state.t('nav_kml'), route: '#tool-prb-kml' },
      { id: 'isd-calculator', title: state.t('tool_isd_calculator_title'), category: state.t('nav_topology'), route: '#tool-isd-calculator' },
      { id: 'geohash-to-shp', title: state.t('tool_geohash_to_shp_title'), category: state.t('nav_gis'), route: '#tool-geohash-to-shp' },
      { id: 'geohash-to-latlon', title: state.t('tool_geohash_to_latlon_title'), category: state.t('nav_gis'), route: '#tool-geohash-to-latlon' },
      { id: 'latlon-to-geohash', title: state.t('tool_latlon_to_geohash_title'), category: state.t('nav_gis'), route: '#tool-latlon-to-geohash' },
      { id: 'dashboard', title: state.t('nav_dashboard'), category: state.t('nav_overview'), route: '#dashboard' },
      { id: 'theme-toggle', title: state.t('toggle_theme'), category: 'Preferences', action: () => state.toggleTheme() },
      { id: 'lang-en', title: 'English (EN)', category: 'Language', action: () => state.setLanguage('en') },
      { id: 'lang-id', title: 'Bahasa Indonesia (ID)', category: 'Language', action: () => state.setLanguage('id') },
      { id: 'about', title: state.t('nav_about'), category: 'System', route: '#about' }
    ];
  }

  render() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.id = 'command-palette-overlay';
    this.overlay.innerHTML = `
      <div class="command-palette" role="dialog" aria-modal="true">
        <div class="command-palette__input-wrap">
          <span style="color: var(--color-primary); font-size: 1.1rem;">🔍</span>
          <input type="text" class="command-palette__input" id="command-input" placeholder="${state.t('search_placeholder')}" autocomplete="off">
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
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // Search input
    this.input.addEventListener('input', () => {
      this.filter(this.input.value);
    });
  }

  open() {
    this.isOpen = true;
    this.overlay.classList.add('modal-overlay--open');
    this.input.value = '';
    this.input.placeholder = state.t('search_placeholder');
    this.filter('');
    setTimeout(() => this.input.focus(), 50);
  }

  close() {
    this.isOpen = false;
    this.overlay.classList.remove('modal-overlay--open');
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  filter(query) {
    const q = query.trim().toLowerCase();
    const items = this.getItems();
    if (!q) {
      this.filteredItems = items;
    } else {
      this.filteredItems = items.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }
    this.selectedIndex = 0;
    this.renderResults();
  }

  renderResults() {
    if (this.filteredItems.length === 0) {
      this.resultsContainer.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--color-text-muted); font-size: 0.875rem;">
          ${state.t('no_tools_found')}
        </div>
      `;
      return;
    }

    this.resultsContainer.innerHTML = this.filteredItems.map((item, idx) => `
      <div class="command-item ${idx === this.selectedIndex ? 'command-item--active' : ''}" data-index="${idx}">
        <div>
          <span class="command-item__category">${item.category}</span>
          <span class="command-item__title">${item.title}</span>
        </div>
        <span class="kbd-shortcut">↵</span>
      </div>
    `).join('');

    const itemEls = this.resultsContainer.querySelectorAll('.command-item');
    itemEls.forEach(el => {
      el.addEventListener('click', () => {
        this.selectedIndex = parseInt(el.dataset.index, 10);
        this.selectActive();
      });
      el.addEventListener('mouseenter', () => {
        this.selectedIndex = parseInt(el.dataset.index, 10);
        this.updateActiveStyles();
      });
    });
  }

  moveSelection(delta) {
    if (this.filteredItems.length === 0) return;
    this.selectedIndex = (this.selectedIndex + delta + this.filteredItems.length) % this.filteredItems.length;
    this.updateActiveStyles();
  }

  updateActiveStyles() {
    const itemEls = this.resultsContainer.querySelectorAll('.command-item');
    itemEls.forEach((el, idx) => {
      if (idx === this.selectedIndex) {
        el.classList.add('command-item--active');
        el.scrollIntoView({ block: 'nearest' });
      } else {
        el.classList.remove('command-item--active');
      }
    });
  }

  selectActive() {
    const item = this.filteredItems[this.selectedIndex];
    if (!item) return;

    this.close();
    if (item.action) {
      item.action();
    } else if (item.route) {
      window.location.hash = item.route;
    }
  }
}
