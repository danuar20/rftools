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
            ${isDark 
              ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
              : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
            }
            <span style="font-size: 0.75rem;">${isDark ? state.t('theme_light') : state.t('theme_dark')}</span>
          </button>

          <!-- Language Selector -->
          <div class="lang-toggle-group" id="navbar-lang-group" title="${state.t('toggle_lang')}">
            <button class="lang-btn ${currentLang === 'en' ? 'lang-btn--active' : ''}" data-lang="en">EN</button>
            <button class="lang-btn ${currentLang === 'id' ? 'lang-btn--active' : ''}" data-lang="id">ID</button>
          </div>

          <!-- About Button (Modal Trigger) -->
          <button type="button" class="header-control-btn" id="navbar-about-btn" title="${state.t('nav_about')}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
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
      const tool = (state.tools || []).find(t => t.id === toolId);
      const fallback = state.t(`tool_${toolId.replace(/-/g, '_')}_title`, toolId);
      const toolTitle = tool ? (state.t(`tool_${toolId.replace(/-/g, '_')}_title`, tool.title)) : fallback;
      return `<span class="breadcrumbs__current">${toolTitle}</span>`;
    }
    if (route === 'about') {
      return `<span class="breadcrumbs__current">${state.t('nav_about')}</span>`;
    }
    return `<span class="breadcrumbs__current">${route}</span>`;
  }
}
