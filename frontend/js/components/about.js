/**
 * About Pop-up Modal Component
 * Displays dynamic application version, tool functions, developer contact, and copyright.
 */

import { state } from '../state.js';
import { ApiService } from '../api.js';

export class AboutComponent {
  constructor(container = null) {
    this.container = container;
    this.isOpen = false;
    this.version = 'v1.0.0';
    this.status = 'online';

    this.initModal();
    this.fetchDynamicInfo();

    // Listen for global open event
    this.handleOpenEvent = () => this.open();
    document.addEventListener('open-about-modal', this.handleOpenEvent);

    // If instantiated with container or route is about, open immediately
    if (state.route === 'about') {
      this.open();
    }

    this.unsubscribe = state.subscribe((event) => {
      if (state.route !== 'about' && !this.isOpen) return;
      if (event === 'language-change' || event === 'health-update' || event === 'theme-change') {
        this.updateContent();
      }
    });
  }

  async fetchDynamicInfo() {
    try {
      const health = await ApiService.getHealth();
      if (health && health.version) {
        this.version = `v${health.version}`;
      }
      this.status = health && health.status === 'online' ? 'online' : 'ready';
      this.updateContent();
    } catch (e) {
      // Keep defaults
    }
  }

  initModal() {
    let overlay = document.getElementById('about-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.id = 'about-modal-overlay';
      overlay.innerHTML = `
        <div class="about-modal" role="dialog" aria-modal="true" aria-labelledby="about-modal-title">
          <div class="about-modal__header">
            <div class="about-modal__title-group">
              <span class="about-modal__logo">📡</span>
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <h2 class="about-modal__title" id="about-modal-title">RF Tools-Telco</h2>
                  <span class="about-modal__version-badge" id="about-modal-version">${this.version}</span>
                  <span class="about-modal__status-badge" id="about-modal-status">● ${this.status}</span>
                </div>
                <p class="about-modal__subtitle">RF Tools-Telco</p>
              </div>
            </div>
            <button class="about-modal__close-btn" id="about-modal-close-x" title="Close modal" aria-label="Close">&times;</button>
          </div>

          <div class="about-modal__body" id="about-modal-body">
            <!-- Dynamic body rendered in updateContent -->
          </div>

          <div class="about-modal__footer">
            <div class="about-modal__copyright">
              © 2025 - 2026 RF Tools. All rights reserved.
            </div>
            <button class="rf-btn rf-btn-secondary" id="about-modal-close-btn" style="padding: 6px 16px; font-size: 0.8125rem;">
              Close
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      // Event listeners for close
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.close();
      });

      const closeX = overlay.querySelector('#about-modal-close-x');
      if (closeX) closeX.addEventListener('click', () => this.close());

      const closeBtn = overlay.querySelector('#about-modal-close-btn');
      if (closeBtn) closeBtn.addEventListener('click', () => this.close());

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });
    }
    this.overlay = overlay;
    this.updateContent();
  }

  updateContent() {
    if (!this.overlay) return;

    const versionEl = this.overlay.querySelector('#about-modal-version');
    if (versionEl) versionEl.textContent = this.version;

    const statusEl = this.overlay.querySelector('#about-modal-status');
    if (statusEl) statusEl.textContent = `● ${this.status}`;

    const bodyEl = this.overlay.querySelector('#about-modal-body');
    if (bodyEl) {
      bodyEl.innerHTML = `
        <!-- Description -->
        <div class="about-section">
          <p class="about-desc">
            ${state.lang === 'id' 
              ? 'RF Tools adalah aplikasi rekayasa telekomunikasi dan analisis spasial tingkat lanjut. Dibangun untuk menyajikan komputasi geodesi WGS84 murni, pemodelan sektor antena 3D, analisis topologi jaringan, serta interoperabilitas format SIG standar.'
              : 'RF Tools is an advanced telecommunications engineering and spatial analysis suite. Designed to provide pure WGS84 geodetic computations, 3D antenna sector visualization, network topology analysis, and standard GIS format interoperability.'}
          </p>
        </div>

        <!-- Tool Functions (6 Tools) -->
        <div class="about-section">
          <h3 class="about-section__title">
            <span>⚙️</span> ${state.lang === 'id' ? 'Fungsi & Modul Perhitungan' : 'Engine Functions & Modules'}
          </h3>
          <div class="about-tools-grid">
            <div class="about-tool-card" data-tool-id="excel-to-kml">
              <div class="about-tool-card__header">
                <span class="about-tool-card__icon">📍</span>
                <span class="about-tool-card__name">Excel &rarr; Point KML</span>
              </div>
              <p class="about-tool-card__desc">
                ${state.lang === 'id'
                  ? 'Konversi koordinat sel/site ke placemark Google Earth dengan kustomisasi ikon, skala, dan label warna RGB.'
                  : 'Converts site coordinates into styled Google Earth placemarks with customizable icons, scale factors, and RGB label colors.'}
              </p>
            </div>

            <div class="about-tool-card" data-tool-id="prb-kml">
              <div class="about-tool-card__header">
                <span class="about-tool-card__icon">📡</span>
                <span class="about-tool-card__name">Excel &rarr; PRB 3D Sector</span>
              </div>
              <p class="about-tool-card__desc">
                ${state.lang === 'id'
                  ? 'Visualisasi poligon sektor 3D bertingkat berdasarkan frekuensi carrier, ambang batas warna KPI PRB, logo ganda, dan tabel balon 24 baris.'
                  : 'Visualizes 3D extruded antenna radiation sectors stacked by band altitude, PRB KPI heatmaps, dual logos, and 24-row telemetry balloon popup.'}
              </p>
            </div>

            <div class="about-tool-card" data-tool-id="isd-calculator">
              <div class="about-tool-card__header">
                <span class="about-tool-card__icon">📐</span>
                <span class="about-tool-card__name">ISD Calculator</span>
              </div>
              <p class="about-tool-card__desc">
                ${state.lang === 'id'
                  ? 'Perhitungan jarak antar-site (Inter-Site Distance) rumus Haversine untuk N-tetangga terdekat dengan pilihan satuan Kilometer atau Meter.'
                  : 'Computes great-circle inter-site distance topology matrix for N-nearest neighbors with selectable Kilometers (km) or Meters (m) units.'}
              </p>
            </div>

            <div class="about-tool-card" data-tool-id="geohash-to-shp">
              <div class="about-tool-card__header">
                <span class="about-tool-card__icon">🗺️</span>
                <span class="about-tool-card__name">Geohash &rarr; Shapefile</span>
              </div>
              <p class="about-tool-card__desc">
                ${state.lang === 'id'
                  ? 'Pembuatan paket arsip ESRI Shapefile (.shp, .shx, .dbf, .prj) dari kode geohash dengan bounding box atau grid metrik UTM.'
                  : 'Generates standard ESRI polygon shapefile packages (.shp, .shx, .dbf, .prj) from geohash spatial buckets with EPSG:4326 geodetic datum.'}
              </p>
            </div>

            <div class="about-tool-card" data-tool-id="geohash-to-latlon">
              <div class="about-tool-card__header">
                <span class="about-tool-card__icon">🔍</span>
                <span class="about-tool-card__name">Geohash &rarr; Lat / Long</span>
              </div>
              <p class="about-tool-card__desc">
                ${state.lang === 'id'
                  ? 'Dekoder token string geohash base-32 menjadi koordinat titik pusat lintang/bujur desimal dan batas bounding box.'
                  : 'Decodes base-32 geohash strings into high-precision latitude/longitude centroid coordinates and bounding box extents.'}
              </p>
            </div>

            <div class="about-tool-card" data-tool-id="latlon-to-geohash">
              <div class="about-tool-card__header">
                <span class="about-tool-card__icon">🌐</span>
                <span class="about-tool-card__name">Lat / Long &rarr; Geohash</span>
              </div>
              <p class="about-tool-card__desc">
                ${state.lang === 'id'
                  ? 'Enkoder pasangan koordinat lintang/bujur menjadi kode geohash spasial dengan presisi tingkat 1 hingga 12.'
                  : 'Encodes latitude/longitude coordinate pairs into standardized hierarchical geohash codes with precision tuning from 1 to 12.'}
              </p>
            </div>
          </div>
        </div>

        <!-- Developer Contact Card -->
        <div class="about-section">
          <h3 class="about-section__title">
            <span>👤</span> ${state.lang === 'id' ? 'Informasi Pengembang' : 'Developer & Engineering Contact'}
          </h3>
          <div class="about-contact-card">
            <div class="about-contact-row">
              <span class="about-contact-label">${state.lang === 'id' ? 'Pengembang' : 'Developer'}</span>
              <span class="about-contact-val"><b>Danuar Trianur Rohman</b></span>
            </div>
            <div class="about-contact-row">
              <span class="about-contact-label">Email</span>
              <span class="about-contact-val">
                <a href="mailto:danuartrianurrohman@gmail.com" class="about-contact-link">danuartrianurrohman@gmail.com</a>
              </span>
            </div>
            <div class="about-contact-row">
              <span class="about-contact-label">${state.lang === 'id' ? 'Telepon / WhatsApp' : 'Phone / WhatsApp'}</span>
              <span class="about-contact-val">
                <a href="tel:+6282116513070" class="about-contact-link">+6282116513070</a>
              </span>
            </div>
          </div>
        </div>
      `;
    }
  }

  open() {
    this.isOpen = true;
    if (this.overlay) {
      this.overlay.classList.add('modal-overlay--open');
      this.updateContent();
    }
  }

  close() {
    this.isOpen = false;
    if (this.overlay) {
      this.overlay.classList.remove('modal-overlay--open');
    }
    // If URL hash was #about, revert hash to previous or #dashboard
    if (window.location.hash === '#about') {
      window.location.hash = '#dashboard';
    }
  }

  render() {
    // Guard for backwards compatibility
    if (state.route !== 'about') return;
    this.open();
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.handleOpenEvent) {
      document.removeEventListener('open-about-modal', this.handleOpenEvent);
      this.handleOpenEvent = null;
    }
    this.close();
  }
}
