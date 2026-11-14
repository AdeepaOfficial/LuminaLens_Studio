/**
 * LuminaLens Studio - Full-Screen Interactive Lightbox
 * Pure Vanilla JavaScript (ES6+)
 * 
 * Features:
 * - Full-screen immersive obsidian viewer with backdrop blur
 * - Keyboard navigation (Left, Right arrows, Escape to close)
 * - Mobile touch swipe gestures (left/right)
 * - Photo counter & descriptive caption overlay
 * - High-res Google Drive image loader with fallback handling
 * - Zoom inspection toggle & direct photo download
 * - Synchronized bottom thumbnail carousel
 */

class LuminaLightbox {
  constructor() {
    this.photos = [];
    this.currentIndex = 0;
    this.albumTitle = '';
    this.isOpen = false;
    this.isZoomed = false;

    // Touch gesture tracking
    this.touchStartX = 0;
    this.touchEndX = 0;

    this.initDOM();
    this.bindEvents();
  }

  /* Injects Lightbox DOM if not already in document */
  initDOM() {
    let modal = document.getElementById('lumina-lightbox');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'lumina-lightbox';
      modal.className = 'lightbox-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-label', 'Full Screen Photo Viewer');
      modal.innerHTML = `
        <!-- Top Bar -->
        <div class="lightbox-top-bar">
          <div class="lightbox-album-title" id="lightbox-title">LuminaLens Gallery</div>
          <div class="lightbox-counter-pill" id="lightbox-counter">0 / 0</div>
          <div class="lightbox-controls">
            <button type="button" class="lightbox-btn" id="lightbox-zoom-btn" title="Toggle Zoom Inspection" aria-label="Toggle Zoom">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
            <button type="button" class="lightbox-btn" id="lightbox-download-btn" title="Download High-Res Photograph" aria-label="Download Photo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
            <button type="button" class="lightbox-btn" id="lightbox-close-btn" title="Close Lightbox (Esc)" aria-label="Close Lightbox">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Main Viewport -->
        <div class="lightbox-stage" id="lightbox-stage">
          <button type="button" class="lightbox-nav-btn prev-btn" id="lightbox-prev-btn" title="Previous Image (Left Arrow)" aria-label="Previous Photo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>

          <div class="lightbox-img-wrapper" id="lightbox-img-wrapper">
            <img src="" alt="" class="lightbox-main-img" id="lightbox-image">
            <div class="lightbox-caption-bar" id="lightbox-caption"></div>
          </div>

          <button type="button" class="lightbox-nav-btn next-btn" id="lightbox-next-btn" title="Next Image (Right Arrow)" aria-label="Next Photo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

        <!-- Bottom Thumbnail Carousel -->
        <div class="lightbox-thumb-strip" id="lightbox-thumb-strip" aria-label="Photo Thumbnails"></div>
      `;
      document.body.appendChild(modal);
    }

    this.modal = modal;
    this.titleEl = document.getElementById('lightbox-title');
    this.counterEl = document.getElementById('lightbox-counter');
    this.imageEl = document.getElementById('lightbox-image');
    this.captionEl = document.getElementById('lightbox-caption');
    this.thumbStripEl = document.getElementById('lightbox-thumb-strip');
    this.stageEl = document.getElementById('lightbox-stage');
    this.zoomBtn = document.getElementById('lightbox-zoom-btn');
    this.downloadBtn = document.getElementById('lightbox-download-btn');
    this.closeBtn = document.getElementById('lightbox-close-btn');
    this.prevBtn = document.getElementById('lightbox-prev-btn');
    this.nextBtn = document.getElementById('lightbox-next-btn');
  }

  /* Event bindings */
  bindEvents() {
    this.closeBtn.addEventListener('click', () => this.close());
    this.prevBtn.addEventListener('click', (e) => { e.stopPropagation(); this.prev(); });
    this.nextBtn.addEventListener('click', (e) => { e.stopPropagation(); this.next(); });
    this.zoomBtn.addEventListener('click', () => this.toggleZoom());
    this.downloadBtn.addEventListener('click', () => this.downloadCurrent());

    // Backdrop click outside image to close
    this.stageEl.addEventListener('click', (e) => {
      if (e.target === this.stageEl || e.target.id === 'lightbox-img-wrapper') {
        this.close();
      }
    });

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
      if (e.key === 'f' || e.key === 'F') this.toggleZoom();
    });

    // Touch swipe gestures
    this.stageEl.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    this.stageEl.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    }, { passive: true });
  }

  handleSwipe() {
    const deltaX = this.touchEndX - this.touchStartX;
    if (Math.abs(deltaX) > 45) {
      if (deltaX > 0) {
        this.prev();
      } else {
        this.next();
      }
    }
  }

  /* Open Lightbox */
  open(photos, startIndex = 0, albumTitle = 'LuminaLens Gallery') {
    if (!photos || photos.length === 0) return;
    this.photos = photos;
    this.currentIndex = startIndex;
    this.albumTitle = albumTitle;
    this.isOpen = true;
    this.isZoomed = false;

    this.titleEl.textContent = this.albumTitle;
    document.body.style.overflow = 'hidden';

    this.renderThumbnails();
    this.updateView();
    this.modal.classList.add('active');
  }

  /* Close Lightbox */
  close() {
    this.isOpen = false;
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
    if (this.isZoomed) this.toggleZoom();
  }

  /* Navigation */
  next() {
    if (this.currentIndex < this.photos.length - 1) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0; // Loop to start
    }
    this.updateView();
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.photos.length - 1; // Loop to end
    }
    this.updateView();
  }

  goTo(index) {
    if (index >= 0 && index < this.photos.length) {
      this.currentIndex = index;
      this.updateView();
    }
  }

  toggleZoom() {
    this.isZoomed = !this.isZoomed;
    this.imageEl.classList.toggle('zoomed', this.isZoomed);
  }

  /* Resolve High-Res & Thumbnail URLs */
  resolvePhotoUrls(photo) {
    let fullUrl = photo.url || photo.rawUrl || '';
    let thumbUrl = photo.thumbnailUrl || photo.url || '';
    const fileId = photo.driveId || this.extractDriveId(photo.rawUrl || photo.url);

    if (window.GDriveHelper && fileId) {
      if (!fullUrl || fullUrl.includes('drive.google.com/file')) {
        fullUrl = window.GDriveHelper.getFullResUrl(fileId, 1920);
      }
      if (!thumbUrl || thumbUrl.includes('drive.google.com/file')) {
        thumbUrl = window.GDriveHelper.getThumbnailUrl(fileId, 600);
      }
    } else if (fileId) {
      // Direct Google Drive CDN resolution
      if (!fullUrl || fullUrl.includes('drive.google.com/file')) {
        fullUrl = `https://lh3.googleusercontent.com/d/${fileId}=w1920`;
      }
      if (!thumbUrl || thumbUrl.includes('drive.google.com/file')) {
        thumbUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`;
      }
    }

    return { fullUrl, thumbUrl };
  }

  extractDriveId(url) {
    if (window.GDriveHelper && window.GDriveHelper.extractGoogleDriveId) {
      return window.GDriveHelper.extractGoogleDriveId(url);
    }
    if (!url || typeof url !== 'string') return null;
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                  url.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
                  url.match(/google\.com\/uc\?id=([a-zA-Z0-9_-]+)/) ||
                  url.match(/thumbnail\?id=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  /* Render bottom thumbnail strip */
  renderThumbnails() {
    this.thumbStripEl.innerHTML = '';
    this.photos.forEach((photo, idx) => {
      const { thumbUrl } = this.resolvePhotoUrls(photo);
      const thumb = document.createElement('div');
      thumb.className = `lightbox-thumb-item ${idx === this.currentIndex ? 'active' : ''}`;
      thumb.setAttribute('data-index', idx);
      thumb.innerHTML = `<img src="${thumbUrl}" alt="Thumb ${idx + 1}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop'">`;
      thumb.addEventListener('click', () => this.goTo(idx));
      this.thumbStripEl.appendChild(thumb);
    });
  }

  /* Update active image and UI state */
  updateView() {
    if (this.isZoomed) this.toggleZoom();
    const photo = this.photos[this.currentIndex];
    if (!photo) return;

    const { fullUrl } = this.resolvePhotoUrls(photo);

    // Fade image transition
    this.imageEl.style.opacity = '0.3';
    this.imageEl.src = fullUrl;
    this.imageEl.alt = photo.caption || `Photograph ${this.currentIndex + 1}`;

    this.imageEl.onload = () => {
      this.imageEl.style.opacity = '1';
    };
    this.imageEl.onerror = () => {
      // Graceful fallback to high-quality sample image if Google Drive placeholder ID isn't live
      this.imageEl.src = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&auto=format&fit=crop';
      this.imageEl.style.opacity = '1';
    };

    // Update Counter & Caption
    this.counterEl.textContent = `Frame ${this.currentIndex + 1} of ${this.photos.length}`;
    this.captionEl.textContent = photo.caption || '';

    // Synchronize thumbnails
    const thumbs = this.thumbStripEl.querySelectorAll('.lightbox-thumb-item');
    thumbs.forEach((t, idx) => {
      const isActive = idx === this.currentIndex;
      t.classList.toggle('active', isActive);
      if (isActive) {
        t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });

    // Preload next image for instant switching
    this.preloadAdjacent();
  }

  preloadAdjacent() {
    const nextIdx = (this.currentIndex + 1) % this.photos.length;
    const prevIdx = (this.currentIndex - 1 + this.photos.length) % this.photos.length;
    [nextIdx, prevIdx].forEach(idx => {
      if (this.photos[idx]) {
        const { fullUrl } = this.resolvePhotoUrls(this.photos[idx]);
        const img = new Image();
        img.src = fullUrl;
      }
    });
  }

  /* Download current high-res photo */
  downloadCurrent() {
    const photo = this.photos[this.currentIndex];
    if (!photo) return;
    const { fullUrl } = this.resolvePhotoUrls(photo);

    const a = document.createElement('a');
    a.href = fullUrl;
    a.target = '_blank';
    a.download = `luminalens-${this.albumTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${this.currentIndex + 1}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

// Global singleton instance
window.LuminaLightbox = new LuminaLightbox();
