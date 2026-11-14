/**
 * LuminaLens Studio - Administrative Console Controller
 * Handles session authentication, album CRUD REST operations, Google Drive matrix parsing,
 * search filtering, and clipboard interactions.
 */

(function (window, document) {
  'use strict';

  // State Management
  let allAlbums = [];
  let currentFilteredAlbums = [];
  let modalParsedPhotos = [];
  let formParsedPhotos = [];
  let albumToDeleteId = null;

  // ==========================================================================
  // Toast Notification System
  // ==========================================================================

  function showToast(message, type = 'success', duration = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = '✦';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '⚠️';
    if (type === 'info') icon = 'ℹ️';

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message" style="flex: 1;">${escapeHtml(message)}</span>
      <button type="button" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 2px;" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
      .replace(/\-\-+/g, '-')         // Replace multiple - with single -
      .replace(/^-+/, '')             // Trim - from start of text
      .replace(/-+$/, '');            // Trim - from end of text
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  }

  // ==========================================================================
  // Authentication & Session Checking
  // ==========================================================================

  async function checkAuthStatus() {
    try {
      const res = await fetch('/api/auth/status', {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated === false) {
          redirectToLogin();
          return false;
        }
        return true;
      } else if (res.status === 401) {
        redirectToLogin();
        return false;
      }
    } catch (err) {
      console.warn('Authentication status check warning:', err.message);
      // If server is offline or testing file directly, verify local storage token
      const token = localStorage.getItem('lumina_auth_token');
      if (!token) {
        // In local mock dev without token, redirect to login
        if (window.location.pathname.includes('/admin/') && !window.location.pathname.endsWith('login.html')) {
          redirectToLogin();
          return false;
        }
      }
    }
    return true;
  }

  function redirectToLogin() {
    const isInsideAdmin = window.location.pathname.includes('/admin/');
    const loginUrl = isInsideAdmin ? 'login.html' : 'admin/login.html';
    window.location.href = loginUrl;
  }

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('lumina_auth_token');
    localStorage.removeItem('lumina_remember');
    showToast('Signed out of studio console.', 'info');
    setTimeout(() => {
      redirectToLogin();
    }, 400);
  }

  // ==========================================================================
  // REST API Client
  // ==========================================================================

  async function fetchAlbumsApi() {
    try {
      // Try /api/albums?all=true first
      let res = await fetch('/api/albums?all=true');
      if (!res.ok) {
        res = await fetch('/api/albums');
      }
      if (res.ok) {
        const data = await res.json();
        // Handle { albums: [...] } or direct array [...]
        return Array.isArray(data) ? data : (data.albums || []);
      }
    } catch (err) {
      console.warn('API /api/albums unreachable, attempting fallback to data/albums.json:', err.message);
    }

    // Fallback to static JSON file if server REST endpoint is not yet mounted
    try {
      const fallbackRes = await fetch('../data/albums.json');
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        return Array.isArray(data) ? data : (data.albums || []);
      }
    } catch (e) {
      console.warn('Fallback data/albums.json fetch failed:', e.message);
    }

    return [];
  }

  async function createAlbumApi(albumData) {
    // Try POST /api/admin/albums then POST /api/albums
    let res = await fetch('/api/admin/albums', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(albumData)
    }).catch(() => null);

    if (!res || !res.ok) {
      res = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(albumData)
      });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Failed to create album on server.');
    }
    return await res.json().catch(() => albumData);
  }

  async function updateAlbumApi(id, albumData) {
    let res = await fetch(`/api/admin/albums/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(albumData)
    }).catch(() => null);

    if (!res || !res.ok) {
      res = await fetch(`/api/albums/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(albumData)
      });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Failed to update album on server.');
    }
    return await res.json().catch(() => albumData);
  }

  async function deleteAlbumApi(id) {
    let res = await fetch(`/api/admin/albums/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }).catch(() => null);

    if (!res || !res.ok) {
      res = await fetch(`/api/albums/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Failed to delete album on server.');
    }
    return true;
  }

  // ==========================================================================
  // Clipboard & Link Sharing Helper
  // ==========================================================================

  function copyAlbumLink(slug) {
    if (!slug) return;
    const origin = window.location.origin;
    // Public album path: /album.html?slug={slug}
    const publicUrl = `${origin}/album.html?slug=${encodeURIComponent(slug)}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(publicUrl).then(() => {
        showToast(`✓ Copied direct link: ${publicUrl}`, 'success');
      }).catch(() => {
        fallbackCopyText(publicUrl);
      });
    } else {
      fallbackCopyText(publicUrl);
    }
  }

  function fallbackCopyText(text) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      showToast(`✓ Copied direct link: ${text}`, 'success');
    } catch (e) {
      prompt('Copy this link:', text);
    }
    document.body.removeChild(tempInput);
  }

  // ==========================================================================
  // Admin Dashboard View Controller (`/admin/index.html`)
  // ==========================================================================

  async function initAdminDashboard() {
    await checkAuthStatus();

    // Bind logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', logout);
    }

    // Bind Search & Filters
    const searchInput = document.getElementById('albumSearchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const visibilityFilter = document.getElementById('visibilityFilter');

    if (searchInput) {
      searchInput.addEventListener('input', applyFilters);
    }
    if (categoryFilter) {
      categoryFilter.addEventListener('change', applyFilters);
    }
    if (visibilityFilter) {
      visibilityFilter.addEventListener('change', applyFilters);
    }

    // Bind New Album Modal Triggers
    const btnOpenNewAlbumModal = document.getElementById('btnOpenNewAlbumModal');
    if (btnOpenNewAlbumModal) {
      btnOpenNewAlbumModal.addEventListener('click', () => openAlbumModal(null));
    }

    const btnCloseAlbumModal = document.getElementById('btnCloseAlbumModal');
    const btnCancelModal = document.getElementById('btnCancelModal');
    if (btnCloseAlbumModal) btnCloseAlbumModal.addEventListener('click', closeAlbumModal);
    if (btnCancelModal) btnCancelModal.addEventListener('click', closeAlbumModal);

    const btnSaveModal = document.getElementById('btnSaveModal');
    if (btnSaveModal) {
      btnSaveModal.addEventListener('click', handleSaveModalAlbum);
    }

    // Modal Live Inputs & Slugs
    const modalTitle = document.getElementById('modalTitle');
    const modalSlug = document.getElementById('modalSlug');
    if (modalTitle && modalSlug) {
      modalTitle.addEventListener('input', () => {
        if (!document.getElementById('modalAlbumId').value) {
          modalSlug.value = slugify(modalTitle.value);
        }
      });
    }

    // Modal Cover Image Preview
    const modalCoverUrl = document.getElementById('modalCoverUrl');
    if (modalCoverUrl) {
      modalCoverUrl.addEventListener('input', updateModalCoverPreview);
    }

    // Modal Bulk Google Drive Parser
    const modalBulkPhotos = document.getElementById('modalBulkPhotos');
    if (modalBulkPhotos) {
      modalBulkPhotos.addEventListener('input', updateModalPhotoMatrix);
    }

    const btnModalAddSamplePhotos = document.getElementById('btnModalAddSamplePhotos');
    if (btnModalAddSamplePhotos) {
      btnModalAddSamplePhotos.addEventListener('click', injectSamplePhotosToModal);
    }

    // Delete Confirmation Modal Triggers
    const btnCloseDeleteModal = document.getElementById('btnCloseDeleteModal');
    const btnCancelDelete = document.getElementById('btnCancelDelete');
    const btnConfirmDelete = document.getElementById('btnConfirmDelete');

    if (btnCloseDeleteModal) btnCloseDeleteModal.addEventListener('click', closeDeleteModal);
    if (btnCancelDelete) btnCancelDelete.addEventListener('click', closeDeleteModal);
    if (btnConfirmDelete) btnConfirmDelete.addEventListener('click', handleConfirmDelete);

    // Initial Data Fetch
    await reloadDashboard();
  }

  async function reloadDashboard() {
    const tableBody = document.getElementById('albumsTableBody');
    if (!tableBody) return;

    try {
      allAlbums = await fetchAlbumsApi();
      updateMetrics(allAlbums);
      applyFilters();
    } catch (err) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--status-danger);">
            ⚠️ Failed to load albums from server: ${escapeHtml(err.message)}
          </td>
        </tr>
      `;
    }
  }

  function updateMetrics(albums) {
    const totalAlbumsEl = document.getElementById('metricTotalAlbums');
    const publishedCountEl = document.getElementById('metricPublishedCount');
    const privateCountEl = document.getElementById('metricPrivateCount');
    const totalPhotosEl = document.getElementById('metricTotalPhotos');

    if (!totalAlbumsEl) return;

    const total = albums.length;
    let published = 0;
    let privateCount = 0;
    let totalPhotos = 0;

    albums.forEach(alb => {
      const isPub = alb.published === true || alb.visibility === 'published';
      if (isPub) {
        published++;
      } else {
        privateCount++;
      }
      if (Array.isArray(alb.photos)) {
        totalPhotos += alb.photos.length;
      }
    });

    totalAlbumsEl.textContent = total;
    if (publishedCountEl) publishedCountEl.textContent = `${published} Published`;
    if (privateCountEl) privateCountEl.textContent = `${privateCount} Private`;
    if (totalPhotosEl) totalPhotosEl.textContent = totalPhotos.toLocaleString();
  }

  function applyFilters() {
    const searchInput = document.getElementById('albumSearchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const visibilityFilter = document.getElementById('visibilityFilter');
    const countEl = document.getElementById('tableResultsCount');

    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedCat = categoryFilter ? categoryFilter.value : 'ALL';
    const selectedVis = visibilityFilter ? visibilityFilter.value : 'ALL';

    currentFilteredAlbums = allAlbums.filter(album => {
      // Category match
      if (selectedCat !== 'ALL') {
        const cat = (album.category || '').toLowerCase();
        if (cat !== selectedCat.toLowerCase()) return false;
      }

      // Visibility match
      const isPublished = album.published === true || album.visibility === 'published';
      if (selectedVis === 'published' && !isPublished) return false;
      if (selectedVis === 'private' && isPublished) return false;

      // Text query match
      if (query) {
        const title = (album.title || '').toLowerCase();
        const slug = (album.slug || '').toLowerCase();
        const desc = (album.description || '').toLowerCase();
        const loc = (album.location || '').toLowerCase();
        if (!title.includes(query) && !slug.includes(query) && !desc.includes(query) && !loc.includes(query)) {
          return false;
        }
      }

      return true;
    });

    if (countEl) {
      countEl.textContent = `Showing ${currentFilteredAlbums.length} of ${allAlbums.length} collections`;
    }

    renderAlbumsTable(currentFilteredAlbums);
  }

  function renderAlbumsTable(albums) {
    const tableBody = document.getElementById('albumsTableBody');
    if (!tableBody) return;

    if (albums.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="table-empty-state">
              <div class="empty-state-icon">📷</div>
              <h3 class="empty-state-title">No Photography Collections Found</h3>
              <p class="empty-state-text">No albums matched your search filters or none have been curated yet.</p>
              <button type="button" class="btn btn-primary" onclick="document.getElementById('btnOpenNewAlbumModal').click()">
                <span>+ Create First Album</span>
              </button>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = albums.map(album => {
      const isPublished = album.published === true || album.visibility === 'published';
      const photoCount = Array.isArray(album.photos) ? album.photos.length : 0;
      
      // Determine cover thumbnail
      let coverThumb = album.coverThumbnail;
      if (!coverThumb && album.coverImage) {
        coverThumb = typeof album.coverImage === 'object' ? album.coverImage.url : album.coverImage;
      }
      if (!coverThumb && album.rawCoverUrl && window.GDriveHelper) {
        const driveId = window.GDriveHelper.extractGoogleDriveId(album.rawCoverUrl);
        if (driveId) coverThumb = window.GDriveHelper.getThumbnailUrl(driveId, 300);
      }
      if (!coverThumb) {
        coverThumb = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22 fill=%22%23222%22><rect width=%22100%22 height=%22100%22 fill=%22%2314171f%22/><text x=%2250%%22 y=%2255%%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23f39c12%22 font-size=%2230%22>✦</text></svg>';
      }

      return `
        <tr data-album-id="${escapeHtml(album.id)}">
          <td class="album-cover-cell">
            <img 
              src="${escapeHtml(coverThumb)}" 
              alt="${escapeHtml(album.title)}" 
              class="table-cover-thumb" 
              loading="lazy"
              onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22 fill=%22%231c212d%22><rect width=%22100%22 height=%22100%22/><text x=%2250%%22 y=%2255%%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23808b96%22 font-size=%2226%22>📷</text></svg>'"
            >
          </td>
          <td class="album-title-cell">
            <div class="album-row-title">${escapeHtml(album.title)}</div>
            <div class="album-row-slug">
              <span>/album.html?slug=${escapeHtml(album.slug)}</span>
              <button 
                type="button" 
                class="copy-slug-btn" 
                title="Copy client share link"
                onclick="window.copyAlbumLink('${escapeHtml(album.slug)}')"
              >
                📋
              </button>
            </div>
          </td>
          <td>
            <span class="category-tag">${escapeHtml(album.category || 'Portfolio')}</span>
          </td>
          <td style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">
            ${escapeHtml(formatDate(album.eventDate))}
          </td>
          <td>
            <span class="photo-count-badge">
              <span>📷</span>
              <span>${photoCount}</span>
            </span>
          </td>
          <td>
            <button 
              type="button" 
              class="status-pill ${isPublished ? 'status-published' : 'status-private'}" 
              title="Click to toggle visibility (Published / Private)"
              onclick="window.toggleAlbumVisibility('${escapeHtml(album.id)}')"
            >
              <span class="status-dot"></span>
              <span>${isPublished ? 'Published' : 'Private'}</span>
            </button>
          </td>
          <td>
            <div class="row-actions">
              <a 
                href="../album.html?slug=${encodeURIComponent(album.slug)}" 
                target="_blank" 
                class="btn-action" 
                title="View public album"
              >
                👁️
              </a>
              <button 
                type="button" 
                class="btn-action" 
                title="Copy public link"
                onclick="window.copyAlbumLink('${escapeHtml(album.slug)}')"
              >
                🔗
              </button>
              <button 
                type="button" 
                class="btn-action" 
                title="Edit album in modal"
                onclick="window.openEditAlbumModal('${escapeHtml(album.id)}')"
              >
                ✏️
              </button>
              <button 
                type="button" 
                class="btn-action action-delete" 
                title="Delete album"
                onclick="window.promptDeleteAlbum('${escapeHtml(album.id)}', '${escapeHtml(album.title.replace(/'/g, "\\'"))}')"
              >
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ==========================================================================
  // Quick Visibility Toggle
  // ==========================================================================

  async function toggleAlbumVisibility(albumId) {
    const album = allAlbums.find(a => a.id === albumId);
    if (!album) return;

    const newPublished = !(album.published === true || album.visibility === 'published');
    const originalPublished = album.published;
    const originalVisibility = album.visibility;

    // Optimistic UI update
    album.published = newPublished;
    album.visibility = newPublished ? 'published' : 'private';
    applyFilters();

    try {
      await updateAlbumApi(albumId, {
        ...album,
        published: newPublished,
        visibility: newPublished ? 'published' : 'private',
        updatedAt: new Date().toISOString()
      });
      showToast(`Collection is now ${newPublished ? 'Published (Public)' : 'Private (Client Link Only)'}.`, 'success');
    } catch (err) {
      // Revert on failure
      album.published = originalPublished;
      album.visibility = originalVisibility;
      applyFilters();
      showToast(`Failed to update status: ${err.message}`, 'error');
    }
  }

  // ==========================================================================
  // Modal Controller: Create & Edit Albums
  // ==========================================================================

  function openAlbumModal(album = null) {
    const modal = document.getElementById('albumModal');
    if (!modal) return;

    const form = document.getElementById('modalAlbumForm');
    form.reset();

    const heading = document.getElementById('modalHeaderHeading');
    const submitText = document.getElementById('modalSubmitText');
    const idInput = document.getElementById('modalAlbumId');
    const titleInput = document.getElementById('modalTitle');
    const slugInput = document.getElementById('modalSlug');
    const catInput = document.getElementById('modalCategory');
    const dateInput = document.getElementById('modalDate');
    const locInput = document.getElementById('modalLocation');
    const descInput = document.getElementById('modalDescription');
    const coverInput = document.getElementById('modalCoverUrl');
    const pubInput = document.getElementById('modalPublished');
    const downInput = document.getElementById('modalAllowDownload');
    const bulkPhotos = document.getElementById('modalBulkPhotos');

    modalParsedPhotos = [];

    if (album) {
      heading.textContent = 'Edit Photography Album';
      submitText.textContent = 'Update Album ➔';
      idInput.value = album.id;
      titleInput.value = album.title || '';
      slugInput.value = album.slug || '';
      catInput.value = album.category || 'Wedding';
      dateInput.value = album.eventDate || '';
      locInput.value = album.location || '';
      descInput.value = album.description || '';
      
      const rawCover = album.rawCoverUrl || (album.coverImage && typeof album.coverImage === 'object' ? album.coverImage.url : album.coverImage) || '';
      coverInput.value = rawCover;

      pubInput.checked = album.published === true || album.visibility === 'published';
      downInput.checked = album.clientDownloadEnabled !== false && album.allowDownload !== false;

      // Extract existing photos to multiline
      if (Array.isArray(album.photos)) {
        modalParsedPhotos = [...album.photos];
        const lines = album.photos.map(p => p.rawUrl || (p.driveId ? `https://drive.google.com/file/d/${p.driveId}/view` : p.url)).filter(Boolean);
        bulkPhotos.value = lines.join('\n');
      } else {
        bulkPhotos.value = '';
      }
    } else {
      heading.textContent = 'Create New Album';
      submitText.textContent = 'Save & Publish Album ➔';
      idInput.value = '';
      dateInput.value = new Date().toISOString().split('T')[0];
      pubInput.checked = true;
      downInput.checked = true;
      bulkPhotos.value = '';
    }

    updateModalCoverPreview();
    renderModalPhotoMatrix();

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeAlbumModal() {
    const modal = document.getElementById('albumModal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function updateModalCoverPreview() {
    const coverInput = document.getElementById('modalCoverUrl');
    const previewBox = document.getElementById('modalCoverPreview');
    const previewImg = document.getElementById('modalCoverImg');
    const driveIdText = document.getElementById('modalCoverDriveId');

    if (!coverInput || !previewBox || !previewImg) return;
    const val = coverInput.value.trim();

    if (!val) {
      previewBox.style.display = 'none';
      return;
    }

    let thumbUrl = val;
    let driveId = null;

    if (window.GDriveHelper) {
      driveId = window.GDriveHelper.extractGoogleDriveId(val);
      if (driveId) {
        thumbUrl = window.GDriveHelper.getThumbnailUrl(driveId, 400);
      }
    }

    previewImg.src = thumbUrl;
    previewImg.onerror = () => {
      previewImg.src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22 fill=%22%23222%22><text x=%2250%%22 y=%2255%%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23888%22 font-size=%2224%22>No Preview</text></svg>';
    };

    if (driveIdText) {
      driveIdText.textContent = driveId ? `Drive ID: ${driveId}` : 'Direct Image Link';
    }
    previewBox.style.display = 'flex';
  }

  function updateModalPhotoMatrix() {
    const bulkInput = document.getElementById('modalBulkPhotos');
    if (!bulkInput || !window.GDriveHelper) return;

    const parsed = window.GDriveHelper.parseBulkLinks(bulkInput.value);
    modalParsedPhotos = parsed;
    renderModalPhotoMatrix();
  }

  function renderModalPhotoMatrix() {
    const matrixEl = document.getElementById('modalPhotoMatrix');
    const badgeEl = document.getElementById('modalMatrixBadge');
    if (!matrixEl) return;

    if (badgeEl) {
      badgeEl.textContent = `${modalParsedPhotos.length} Photos`;
    }

    if (modalParsedPhotos.length === 0) {
      matrixEl.innerHTML = `
        <div class="matrix-empty">
          No photographs parsed. Paste Google Drive links above.
        </div>
      `;
      return;
    }

    matrixEl.innerHTML = modalParsedPhotos.map((photo, idx) => {
      const thumb = photo.thumbnailUrl || (window.GDriveHelper && photo.driveId ? window.GDriveHelper.getThumbnailUrl(photo.driveId, 300) : photo.url);
      return `
        <div class="photo-preview-item" data-index="${idx}">
          <span class="photo-preview-index">#${idx + 1}</span>
          <button 
            type="button" 
            class="photo-preview-remove" 
            title="Remove photo"
            onclick="window.removeModalPhotoItem(${idx})"
          >
            ✕
          </button>
          <img 
            src="${escapeHtml(thumb)}" 
            alt="Photo ${idx + 1}" 
            class="photo-preview-img" 
            loading="lazy"
            onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22 fill=%22%2314171f%22><text x=%2250%%22 y=%2255%%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23f39c12%22 font-size=%2224%22>✦</text></svg>'"
          >
        </div>
      `;
    }).join('');
  }

  function removeModalPhotoItem(index) {
    if (index >= 0 && index < modalParsedPhotos.length) {
      modalParsedPhotos.splice(index, 1);
      // Update bulk text area to reflect removed item
      const bulkInput = document.getElementById('modalBulkPhotos');
      if (bulkInput) {
        bulkInput.value = modalParsedPhotos.map(p => p.rawUrl || (p.driveId ? `https://drive.google.com/file/d/${p.driveId}/view` : p.url)).join('\n');
      }
      renderModalPhotoMatrix();
    }
  }

  function injectSamplePhotosToModal() {
    const samples = [
      'https://drive.google.com/file/d/1WD_Photo_Poruwa01/view?usp=sharing',
      'https://drive.google.com/file/d/1WD_Photo_Rings02/view?usp=sharing',
      'https://drive.google.com/file/d/1WD_Photo_Candid03/view?usp=sharing',
      'https://drive.google.com/file/d/1WD_Photo_Avenue04/view?usp=sharing',
      'https://drive.google.com/file/d/1WD_Photo_Toast05/view?usp=sharing',
      'https://drive.google.com/file/d/1WD_Photo_Dance06/view?usp=sharing'
    ];

    const bulkInput = document.getElementById('modalBulkPhotos');
    if (bulkInput) {
      const existing = bulkInput.value.trim();
      bulkInput.value = existing ? existing + '\n' + samples.join('\n') : samples.join('\n');
      updateModalPhotoMatrix();
      showToast('Loaded 6 sample Google Drive photo links.', 'info');
    }
  }

  async function handleSaveModalAlbum() {
    const form = document.getElementById('modalAlbumForm');
    const title = document.getElementById('modalTitle').value.trim();
    let slug = document.getElementById('modalSlug').value.trim();
    const category = document.getElementById('modalCategory').value;
    const eventDate = document.getElementById('modalDate').value;
    const location = document.getElementById('modalLocation').value.trim();
    const description = document.getElementById('modalDescription').value.trim();
    const rawCoverUrl = document.getElementById('modalCoverUrl').value.trim();
    const published = document.getElementById('modalPublished').checked;
    const clientDownloadEnabled = document.getElementById('modalAllowDownload').checked;
    const id = document.getElementById('modalAlbumId').value;

    if (!title) {
      showToast('Please enter an album title.', 'error');
      document.getElementById('modalTitle').focus();
      return;
    }

    if (!slug) {
      slug = slugify(title);
    }

    if (!rawCoverUrl) {
      showToast('Please provide a cover image link.', 'error');
      document.getElementById('modalCoverUrl').focus();
      return;
    }

    // Resolve cover CDN links
    let driveCoverId = null;
    let coverThumbUrl = rawCoverUrl;
    let coverFullUrl = rawCoverUrl;

    if (window.GDriveHelper) {
      driveCoverId = window.GDriveHelper.extractGoogleDriveId(rawCoverUrl);
      if (driveCoverId) {
        coverThumbUrl = window.GDriveHelper.getThumbnailUrl(driveCoverId, 600);
        coverFullUrl = window.GDriveHelper.getFullResUrl(driveCoverId, 1600);
      }
    }

    const payload = {
      id: id || ('alb-' + slugify(title) + '-' + Date.now().toString(36)),
      title: title,
      slug: slug,
      category: category,
      eventDate: eventDate || new Date().toISOString().split('T')[0],
      location: location,
      description: description,
      rawCoverUrl: rawCoverUrl,
      coverImage: coverFullUrl,
      coverThumbnail: coverThumbUrl,
      published: published,
      visibility: published ? 'published' : 'private',
      clientDownloadEnabled: clientDownloadEnabled,
      allowDownload: clientDownloadEnabled,
      photos: modalParsedPhotos.map((p, idx) => ({
        id: p.id || ('photo-' + (idx + 1)),
        driveId: p.driveId || (window.GDriveHelper ? window.GDriveHelper.extractGoogleDriveId(p.rawUrl || p.url) : null),
        rawUrl: p.rawUrl || p.url,
        url: p.url || (window.GDriveHelper && p.driveId ? window.GDriveHelper.getFullResUrl(p.driveId, 1600) : p.rawUrl),
        thumbnailUrl: p.thumbnailUrl || (window.GDriveHelper && p.driveId ? window.GDriveHelper.getThumbnailUrl(p.driveId, 600) : p.rawUrl),
        caption: p.caption || `Frame #${idx + 1}`
      })),
      updatedAt: new Date().toISOString()
    };

    if (!id) {
      payload.createdAt = new Date().toISOString();
    }

    const btn = document.getElementById('btnSaveModal');
    btn.disabled = true;
    const oldText = btn.innerHTML;
    btn.innerHTML = '<span>Saving...</span>';

    try {
      if (id) {
        await updateAlbumApi(id, payload);
        showToast(`✓ Collection "${title}" successfully updated!`, 'success');
      } else {
        await createAlbumApi(payload);
        showToast(`✓ Collection "${title}" successfully published!`, 'success');
      }

      closeAlbumModal();
      await reloadDashboard();
    } catch (err) {
      showToast(`Error saving album: ${err.message}`, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = oldText;
    }
  }

  // ==========================================================================
  // Delete Album Flow
  // ==========================================================================

  function promptDeleteAlbum(id, title) {
    albumToDeleteId = id;
    const modal = document.getElementById('deleteModal');
    const titleText = document.getElementById('deleteAlbumTitleText');
    if (!modal) return;

    if (titleText) {
      titleText.textContent = `"${title}"`;
    }

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeDeleteModal() {
    albumToDeleteId = null;
    const modal = document.getElementById('deleteModal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  }

  async function handleConfirmDelete() {
    if (!albumToDeleteId) return;

    const btn = document.getElementById('btnConfirmDelete');
    btn.disabled = true;
    btn.textContent = 'Deleting...';

    try {
      await deleteAlbumApi(albumToDeleteId);
      showToast('✓ Collection deleted successfully.', 'success');
      closeDeleteModal();
      await reloadDashboard();
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Confirm Delete';
    }
  }

  // ==========================================================================
  // Standalone Album Form Page Controller (`/admin/album-form.html`)
  // ==========================================================================

  async function initAlbumFormPage() {
    await checkAuthStatus();

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    const form = document.getElementById('albumForm');
    if (!form) return;

    const params = new URLSearchParams(window.location.search);
    const editId = params.get('id');

    const formPageTitle = document.getElementById('formPageTitle');
    const formPageSubtitle = document.getElementById('formPageSubtitle');
    const titleInput = document.getElementById('albumTitle');
    const slugInput = document.getElementById('albumSlug');
    const catInput = document.getElementById('albumCategory');
    const dateInput = document.getElementById('albumDate');
    const locInput = document.getElementById('albumLocation');
    const descInput = document.getElementById('albumDescription');
    const coverInput = document.getElementById('albumCoverUrl');
    const pubInput = document.getElementById('albumPublished');
    const downInput = document.getElementById('albumAllowDownload');
    const bulkInput = document.getElementById('bulkPhotosInput');
    const submitBtnText = document.getElementById('submitBtnText');

    // Auto slugify on title change (only if creating new)
    titleInput.addEventListener('input', () => {
      if (!editId) {
        slugInput.value = slugify(titleInput.value);
      }
    });

    // Live cover preview
    coverInput.addEventListener('input', () => {
      updateStandaloneCoverPreview(coverInput.value);
    });

    // Bulk photo input listener
    bulkInput.addEventListener('input', () => {
      updateStandalonePhotoMatrix(bulkInput.value);
    });

    // Sample photos
    const btnSample = document.getElementById('btnLoadSamplePhotos');
    if (btnSample) {
      btnSample.addEventListener('click', () => {
        const samples = [
          'https://drive.google.com/file/d/1WD_Photo_Poruwa01/view?usp=sharing',
          'https://drive.google.com/file/d/1WD_Photo_Rings02/view?usp=sharing',
          'https://drive.google.com/file/d/1WD_Photo_Candid03/view?usp=sharing',
          'https://drive.google.com/file/d/1WD_Photo_Avenue04/view?usp=sharing',
          'https://drive.google.com/file/d/1WD_Photo_Toast05/view?usp=sharing',
          'https://drive.google.com/file/d/1WD_Photo_Dance06/view?usp=sharing'
        ];
        const existing = bulkInput.value.trim();
        bulkInput.value = existing ? existing + '\n' + samples.join('\n') : samples.join('\n');
        updateStandalonePhotoMatrix(bulkInput.value);
        showToast('Inserted sample Google Drive links.', 'info');
      });
    }

    // Clear bulk photos
    const btnClear = document.getElementById('btnClearBulkPhotos');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        bulkInput.value = '';
        updateStandalonePhotoMatrix('');
      });
    }

    // Load existing album if editing
    if (editId) {
      formPageTitle.textContent = 'Edit Photography Collection';
      formPageSubtitle.textContent = 'Update metadata, replace cover photograph, and manage photo indices.';
      submitBtnText.textContent = 'Update & Save Changes ➔';

      try {
        const albums = await fetchAlbumsApi();
        const album = albums.find(a => a.id === editId);
        if (album) {
          document.getElementById('albumId').value = album.id;
          titleInput.value = album.title || '';
          slugInput.value = album.slug || '';
          catInput.value = album.category || 'Wedding';
          dateInput.value = album.eventDate || '';
          locInput.value = album.location || '';
          descInput.value = album.description || '';
          coverInput.value = album.rawCoverUrl || (album.coverImage && typeof album.coverImage === 'object' ? album.coverImage.url : album.coverImage) || '';
          pubInput.checked = album.published === true || album.visibility === 'published';
          downInput.checked = album.clientDownloadEnabled !== false && album.allowDownload !== false;

          if (Array.isArray(album.photos)) {
            formParsedPhotos = [...album.photos];
            const lines = album.photos.map(p => p.rawUrl || (p.driveId ? `https://drive.google.com/file/d/${p.driveId}/view` : p.url)).filter(Boolean);
            bulkInput.value = lines.join('\n');
            updateStandalonePhotoMatrix(bulkInput.value);
          }
          updateStandaloneCoverPreview(coverInput.value);
        } else {
          showToast(`Album with ID "${editId}" not found.`, 'error');
        }
      } catch (err) {
        showToast('Error loading album details.', 'error');
      }
    } else {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    // Submit handler
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const title = titleInput.value.trim();
      let slug = slugInput.value.trim();
      const rawCoverUrl = coverInput.value.trim();

      if (!title) {
        showToast('Please enter an album title.', 'error');
        titleInput.focus();
        return;
      }

      if (!slug) {
        slug = slugify(title);
      }

      if (!rawCoverUrl) {
        showToast('Please provide a cover image link.', 'error');
        coverInput.focus();
        return;
      }

      let driveCoverId = null;
      let coverThumbUrl = rawCoverUrl;
      let coverFullUrl = rawCoverUrl;

      if (window.GDriveHelper) {
        driveCoverId = window.GDriveHelper.extractGoogleDriveId(rawCoverUrl);
        if (driveCoverId) {
          coverThumbUrl = window.GDriveHelper.getThumbnailUrl(driveCoverId, 600);
          coverFullUrl = window.GDriveHelper.getFullResUrl(driveCoverId, 1600);
        }
      }

      const payload = {
        id: editId || ('alb-' + slugify(title) + '-' + Date.now().toString(36)),
        title: title,
        slug: slug,
        category: catInput.value,
        eventDate: dateInput.value || new Date().toISOString().split('T')[0],
        location: locInput.value.trim(),
        description: descInput.value.trim(),
        rawCoverUrl: rawCoverUrl,
        coverImage: coverFullUrl,
        coverThumbnail: coverThumbUrl,
        published: pubInput.checked,
        visibility: pubInput.checked ? 'published' : 'private',
        clientDownloadEnabled: downInput.checked,
        allowDownload: downInput.checked,
        photos: formParsedPhotos.map((p, idx) => ({
          id: p.id || ('photo-' + (idx + 1)),
          driveId: p.driveId || (window.GDriveHelper ? window.GDriveHelper.extractGoogleDriveId(p.rawUrl || p.url) : null),
          rawUrl: p.rawUrl || p.url,
          url: p.url || (window.GDriveHelper && p.driveId ? window.GDriveHelper.getFullResUrl(p.driveId, 1600) : p.rawUrl),
          thumbnailUrl: p.thumbnailUrl || (window.GDriveHelper && p.driveId ? window.GDriveHelper.getThumbnailUrl(p.driveId, 600) : p.rawUrl),
          caption: p.caption || `Frame #${idx + 1}`
        })),
        updatedAt: new Date().toISOString()
      };

      if (!editId) {
        payload.createdAt = new Date().toISOString();
      }

      const submitBtn = document.getElementById('btnSubmitAlbum');
      submitBtn.disabled = true;
      const oldHtml = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span>Saving to Studio Database...</span>';

      try {
        if (editId) {
          await updateAlbumApi(editId, payload);
          showToast(`✓ Collection "${title}" updated successfully!`, 'success');
        } else {
          await createAlbumApi(payload);
          showToast(`✓ Collection "${title}" published successfully!`, 'success');
        }

        setTimeout(() => {
          window.location.href = 'index.html';
        }, 800);
      } catch (err) {
        showToast(`Save failed: ${err.message}`, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = oldHtml;
      }
    });
  }

  function updateStandaloneCoverPreview(url) {
    const previewBox = document.getElementById('coverPreviewContainer');
    const previewImg = document.getElementById('coverPreviewImg');
    const driveIdText = document.getElementById('coverDriveIdText');

    if (!previewBox || !previewImg) return;
    const val = (url || '').trim();

    if (!val) {
      previewBox.style.display = 'none';
      return;
    }

    let thumbUrl = val;
    let driveId = null;

    if (window.GDriveHelper) {
      driveId = window.GDriveHelper.extractGoogleDriveId(val);
      if (driveId) {
        thumbUrl = window.GDriveHelper.getThumbnailUrl(driveId, 400);
      }
    }

    previewImg.src = thumbUrl;
    previewImg.onerror = () => {
      previewImg.src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22 fill=%22%23222%22><text x=%2250%%22 y=%2255%%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23888%22 font-size=%2224%22>No Preview</text></svg>';
    };

    if (driveIdText) {
      driveIdText.textContent = driveId ? `Drive ID: ${driveId}` : 'Direct Image Link';
    }
    previewBox.style.display = 'flex';
  }

  function updateStandalonePhotoMatrix(text) {
    if (!window.GDriveHelper) return;
    formParsedPhotos = window.GDriveHelper.parseBulkLinks(text);
    renderStandalonePhotoMatrix();
  }

  function renderStandalonePhotoMatrix() {
    const matrixEl = document.getElementById('photoPreviewMatrix');
    const badgeEl = document.getElementById('photoMatrixCountBadge');
    if (!matrixEl) return;

    if (badgeEl) {
      badgeEl.textContent = `${formParsedPhotos.length} Photos`;
    }

    if (formParsedPhotos.length === 0) {
      matrixEl.innerHTML = `
        <div class="matrix-empty">
          No photographs parsed yet. Paste Google Drive links above to see live preview thumbnails.
        </div>
      `;
      return;
    }

    matrixEl.innerHTML = formParsedPhotos.map((photo, idx) => {
      const thumb = photo.thumbnailUrl || (window.GDriveHelper && photo.driveId ? window.GDriveHelper.getThumbnailUrl(photo.driveId, 300) : photo.url);
      return `
        <div class="photo-preview-item" data-index="${idx}">
          <span class="photo-preview-index">#${idx + 1}</span>
          <button 
            type="button" 
            class="photo-preview-remove" 
            title="Remove photo"
            onclick="window.removeStandalonePhotoItem(${idx})"
          >
            ✕
          </button>
          <img 
            src="${escapeHtml(thumb)}" 
            alt="Photo ${idx + 1}" 
            class="photo-preview-img" 
            loading="lazy"
            onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22 fill=%22%2314171f%22><text x=%2250%%22 y=%2255%%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23f39c12%22 font-size=%2224%22>✦</text></svg>'"
          >
        </div>
      `;
    }).join('');
  }

  function removeStandalonePhotoItem(index) {
    if (index >= 0 && index < formParsedPhotos.length) {
      formParsedPhotos.splice(index, 1);
      const bulkInput = document.getElementById('bulkPhotosInput');
      if (bulkInput) {
        bulkInput.value = formParsedPhotos.map(p => p.rawUrl || (p.driveId ? `https://drive.google.com/file/d/${p.driveId}/view` : p.url)).join('\n');
      }
      renderStandalonePhotoMatrix();
    }
  }

  // ==========================================================================
  // Global Window Exports
  // ==========================================================================

  window.initAdminDashboard = initAdminDashboard;
  window.initAlbumFormPage = initAlbumFormPage;
  window.showToast = showToast;
  window.copyAlbumLink = copyAlbumLink;
  window.toggleAlbumVisibility = toggleAlbumVisibility;
  window.openEditAlbumModal = function (id) {
    const alb = allAlbums.find(a => a.id === id);
    if (alb) openAlbumModal(alb);
  };
  window.promptDeleteAlbum = promptDeleteAlbum;
  window.removeModalPhotoItem = removeModalPhotoItem;
  window.removeStandalonePhotoItem = removeStandalonePhotoItem;

})(window, document);
