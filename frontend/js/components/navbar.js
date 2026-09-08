/**
 * Top Action Header & Navbar Component
 * Features: Clean single-title breadcrumbs, Dark/Light theme toggle, EN/ID language switcher, About link
 */

import { state } from '../state.js';

export class NavbarComponent {
  constructor(container) {
    this.container = container;
    this.render();

    state.subscribe((event) => {
      if (event === 'route-change' || event === 'tools-loaded' || event === 'theme-change' || event === 'language-change') {
        this.render();
      }
    });
  }

  render() {
    const isDark = state.theme !== 'light';
    const currentLang = state.lang || 'en';
    const currentRoute = state.route;

    this.container.innerHTML = `
      <header class="top-header">
        <div class="top-header__left">
          <nav class="breadcrumbs" id="navbar-breadcrumbs">
            ${this.buildBreadcrumbs(currentRoute)}
          </nav>
        </div>
        <div class="top-header__right">
          <!-- Theme Toggle -->
          <button class="header-control-btn" id="navbar-theme-btn" title="${state.t('toggle_theme')}">
            <span>${isDark ? '☀️' : '🌙'}</span>
            <span style="font-size: 0.75rem;">${isDark ? state.t('theme_light') : state.t('theme_dark')}</span>
          </button>

          <!-- Language Selector -->
          <div class="lang-toggle-group" id="navbar-lang-group" title="${state.t('toggle_lang')}">
            <button class="lang-btn ${currentLang === 'en' ? 'lang-btn--active' : ''}" data-lang="en">EN</button>
            <button class="lang-btn ${currentLang === 'id' ? 'lang-btn--active' : ''}" data-lang="id">ID</button>
          </div>

          <!-- About Button (Modal Trigger) -->
          <button type="button" class="header-control-btn" id="navbar-about-btn" title="${state.t('nav_about')}">
            <span>⚙️</span>
            <span style="font-size: 0.75rem;">${state.t('nav_about')}</span>
          </button>
        </div>
      </header>
    `;

    // Theme toggle event
    const themeBtn = this.container.querySelector('#navbar-theme-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        state.toggleTheme();
      });
    }

    // Language toggle event
    const langBtns = this.container.querySelectorAll('.lang-btn');
    langBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lang = e.currentTarget.dataset.lang;
        if (lang && lang !== state.lang) {
          state.setLanguage(lang);
        }
      });
    });

    // About modal event
    const aboutBtn = this.container.querySelector('#navbar-about-btn');
    if (aboutBtn) {
      aboutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.dispatchEvent(new CustomEvent('open-about-modal'));
      });
    }
  }

  buildBreadcrumbs(route) {
    if (!route || route === 'dashboard') {
      return `<span class="breadcrumbs__current">${state.t('nav_dashboard')}</span>`;
    }
    if (route === 'tools') {
      return `<span class="breadcrumbs__current">${state.t('nav_tools')}</span>`;
    }
    if (route.startsWith('tool-')) {
      const toolId = route.replace('tool-', '');
      const tool = state.tools.find(t => t.id === toolId);
      const toolTitle = tool ? (state.t(`tool_${toolId.replace(/-/g, '_')}_title`, tool.title)) : toolId;
      return `<span class="breadcrumbs__current">${toolTitle}</span>`;
    }
    if (route === 'about') {
      return `<span class="breadcrumbs__current">${state.t('nav_about')}</span>`;
    }
    return `<span class="breadcrumbs__current">${route}</span>`;
  }
}
