/**
 * LuminaLens Studio - Public Portfolio & Gallery Client Engine
 * Pure Vanilla JavaScript (ES6+)
 * 
 * Features:
 * - Dynamic Data Fetching with Resilient Offline Sample Fallback
 * - Hero Slideshow Carousel with Ken-Burns Motion
 * - Category Filtering & Real-Time Search for Albums Catalog
 * - Single Album Presentation with Dynamic Masonry Grid
 * - Integrated Full-Screen Lightbox & Client Share Sheet
 * - Mobile Navigation & Floating Notifications
 */

// Embedded offline sample database for guaranteed rendering
const SAMPLE_ALBUMS = [
  {
    "id": "alb-wedding-01",
    "title": "Royal Botanical Wedding - Nimal & Kavindi",
    "slug": "wedding-nimal-kavindi",
    "category": "Wedding",
    "eventDate": "2026-05-18",
    "location": "Earl's Regency, Kandy",
    "description": "An enchanting outdoor wedding ceremony held at the Royal Botanical Gardens, Peradeniya. Capturing candid emotional moments, traditional poruwa rituals, and twilight couple portraits surrounded by lush tropical greenery.",
    "rawCoverUrl": "https://drive.google.com/file/d/1WD_NimalKavindi_Cover01/view?usp=sharing",
    "coverImage": "https://lh3.googleusercontent.com/d/1WD_NimalKavindi_Cover01=w1600",
    "coverThumbnail": "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop",
    "published": true,
    "clientDownloadEnabled": true,
    "photos": [
      {
        "id": "photo-w1",
        "url": "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&auto=format&fit=crop",
        "thumbnailUrl": "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop",
        "caption": "Traditional Poruwa Ceremony & Auspicious Blessing",
        "aspect": "wide"
      },
      {
        "id": "photo-w2",
        "url": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1600&auto=format&fit=crop",
        "thumbnailUrl": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&auto=format&fit=crop",
        "caption": "Exchange of Handcrafted Wedding Rings",
        "aspect": "portrait"
      },
      {
        "id": "photo-w3",
        "url": "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1600&auto=format&fit=crop",
        "thumbnailUrl": "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&auto=format&fit=crop",
        "caption": "Joyful Candid Laughter with Family & Friends",
        "aspect": "normal"
      },
      {
        "id": "photo-w4",
        "url": "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1600&auto=format&fit=crop",
        "thumbnailUrl": "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&auto=format&fit=crop",
        "caption": "Romantic Stroll along the Royal Palm Avenue",
        "aspect": "portrait"
      },
      {
        "id": "photo-w5",
        "url": "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=1600&auto=format&fit=crop",
        "thumbnailUrl": "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=600&auto=format&fit=crop",
        "caption": "Twilight Toast under Golden Fairy Lights",
        "aspect": "normal"
      },
      {
        "id": "photo-w6",
        "url": "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1600&auto=format&fit=crop",
        "thumbnailUrl": "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&auto=format&fit=crop",
        "caption": "First Dance in the Glasshouse Pavilion",
        "aspect": "wide"
      }
    ]
  },
  {
    "id": "alb-preshoot-02",
    "title": "Golden Sunset Coastal Pre-Shoot - Arjun & Maya",
    "slug": "coastal-preshoot-arjun-maya",
    "category": "Pre-Shoot",
    "eventDate": "2026-04-12",
    "location": "Mirissa Coastline, Sri Lanka",
    "description": "A romantic golden-hour pre-wedding shoot along the southern coast of Mirissa. Warm coastal breezes, dramatic cliffside ocean vistas, and intimate sunset silhouettes.",
    "rawCoverUrl": "https://drive.google.com/file/d/1PS_ArjunMaya_Cover02/view?usp=sharing",
    "coverImage": "https://lh3.googleusercontent.com/d/1PS_ArjunMaya_Cover02=w1600",
    "coverThumbnail": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
    "published": true,
    "clientDownloadEnabled": true,
    "photos": [
      {
        "id": "photo-p1",
        "url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop",
        "thumbnailUrl": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop",
        "caption": "Sunset Whispers on Coconut Tree Hill",
        "aspect": "normal"
      },
      {
        "id": "photo-p2",
        "url": "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=1600&auto=format&fit=crop",
        "thumbnailUrl": "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=600&auto=format&fit=crop",
        "caption": "Crashing Ocean Waves & Evening Silhouette",
        "aspect": "wide"
      },
      {
        "id": "photo-p3",
        "url": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop",
        "thumbnailUrl": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop",
        "caption": "Barefoot Walk on Secret Beach",
        "aspect": "portrait"
      },
      {
        "id": "photo-p4",
        "url": "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&auto=format&fit=crop",
        "thumbnailUrl": "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&auto=format&fit=crop",
        "caption": "Golden Hour Warm Embrace",
        "aspect": "normal"
      },
      {
        "id": "photo-p5",
        "url": "https://images.unsplash.com/photo-1515238152791-8216bfdf89a7?w=1600&auto=format&fit=crop",
        "thumbnailUrl": "https://images.unsplash.com/photo-1515238152791-8216bfdf89a7?w=600&auto=format&fit=crop",
        "caption": "Playful Moments in the Ocean Tide",
        "aspect": "portrait"
      },
      {
        "id": "photo-p6",
        "url": "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600&auto=format&fit=crop",
        "thumbnailUrl": "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&auto=format&fit=crop",
        "caption": "Twilight Horizon Reflections",
        "aspect": "wide"
      }
    ]
  },
  {
    "id": "alb-portrait-03",
    "title": "Studio Noir - Editorial & Fine Art Portraits",
    "slug": "studio-noir-portraits",
    "category": "Portraiture",
    "eventDate": "2026-03-25",
    "location": "Studio 07, Colombo",
    "description": "A striking editorial portrait series exploring dramatic chiaroscuro lighting, deep shadows, and contemporary fashion aesthetics in a monochrome studio setting.",
    "rawCoverUrl": "https://drive.google.com/file/d/1PT_StudioNoir_Cover03/view?usp=sharing",
    "coverImage": "https://lh3.googleusercontent.com/d/1PT_StudioNoir_Cover03=w1600",
    "coverThumbnail": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop",
    "published": true,
    "clientDownloadEnabled": true,
    "photos": [
      {
        "id": "photo-pt1",
        "url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1600&auto=format&fit=crop",
        "thumbnailUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop",
        "caption": "Dramatic Chiaroscuro Side Profile",
        "aspect": "portrait"
      },
      {
        "id": "photo-pt2",
        "url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1600&auto=format&fit=crop",
        "thumbnailUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop",
        "caption": "High-Contrast Monochrome Expression",
        "aspect": "normal"
      },
      {
        "id": "photo-pt3",
        "url": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1600&auto=format&fit=crop",
        "thumbnailUrl": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop",
        "caption": "Minimalist Fashion Silhouette",
        "aspect": "portrait"
      },
      {
        "id": "photo-pt4",
        "url": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=1600&auto=format&fit=crop",
        "thumbnailUrl": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop",
        "caption": "Texture & Gaze in Dark Studio Setting",
        "aspect": "normal"
      },
      {
        "id": "photo-pt5",
        "url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1600&auto=format&fit=crop",
        "thumbnailUrl": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop",
        "caption": "Prismatic Shadow Play",
        "aspect": "wide"
      }
    ]
  },
  {
    "id": "alb-landscape-04",
    "title": "Misty Highlands - Ceylon Mountain Expedition",
    "slug": "misty-highlands-expedition",
    "category": "Landscape",
    "eventDate": "2026-02-10",
    "location": "Central Highlands, Nuwara Eliya",
    "description": "A visual journey across Sri Lanka's central highlands. Early morning mists over Adam's Peak, terraced emerald tea hills in Nuwara Eliya, and dramatic mountain ridges.",
    "rawCoverUrl": "https://drive.google.com/file/d/1LS_MistyHighlands_Cover04/view?usp=sharing",
    "coverImage": "https://lh3.googleusercontent.com/d/1LS_MistyHighlands_Cover04=w1600",
    "coverThumbnail": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
    "published": true,
    "clientDownloadEnabled": true,
    "photos": [
      {
        "id": "photo-ls1",
        "url": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop",
        "thumbnailUrl": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop",
        "caption": "Dawn Mist Awakening Mountain Sanctuary",
        "aspect": "wide"
      },
      {
        "id": "photo-ls2",
        "url": "https://images.unsplash.com/photo-1511497584788-87676104235f?w=1600&auto=format&fit=crop",
        "thumbnailUrl": "https://images.unsplash.com/photo-1511497584788-87676104235f?w=600&auto=format&fit=crop",
        "caption": "Rolling Emerald Tea Estates of Nuwara Eliya",
        "aspect": "normal"
      },
      {
        "id": "photo-ls3",
        "url": "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1600&auto=format&fit=crop",
        "thumbnailUrl": "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600&auto=format&fit=crop",
        "caption": "Cascading Waters of Laxapana Gorge",
        "aspect": "portrait"
      },
      {
        "id": "photo-ls4",
        "url": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600&auto=format&fit=crop",
        "thumbnailUrl": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&auto=format&fit=crop",
        "caption": "Nine Arch Bridge Emerging from Morning Fog",
        "aspect": "wide"
      },
      {
        "id": "photo-ls5",
        "url": "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1600&auto=format&fit=crop",
        "thumbnailUrl": "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&auto=format&fit=crop",
        "caption": "Windblown Cloud Formations over Horton Plains",
        "aspect": "normal"
      },
      {
        "id": "photo-ls6",
        "url": "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=1600&auto=format&fit=crop",
        "thumbnailUrl": "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=600&auto=format&fit=crop",
        "caption": "Twilight Over the Knuckles Conservation Range",
        "aspect": "wide"
      }
    ]
  }
];

// Document Initialization
document.addEventListener('DOMContentLoaded', () => {
  initNavbarScroll();
  initMobileNavigation();
  initClientAccessModal();

  // Page-specific routing
  const path = window.location.pathname.toLowerCase();
  if (path.includes('albums.html') || path === '/albums' || path === '/albums/') {
    initAlbumsDirectory();
  } else if (path.includes('album.html') || path.startsWith('/album/') || path === '/album' || path === '/album/') {
    initSingleAlbumView();
  } else {
    initHomepage();
  }
});

/* ==========================================================================
   1. Global Navigation & Modals
   ========================================================================== */
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });
}

function initMobileNavigation() {
  const toggleBtn = document.getElementById('nav-toggle-btn');
  const menu = document.getElementById('nav-menu');
  if (!toggleBtn || !menu) return;

  toggleBtn.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    toggleBtn.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  menu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      toggleBtn.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });
}

function initClientAccessModal() {
  const clientBtn = document.getElementById('client-access-btn');
  const modal = document.getElementById('client-access-modal');
  const closeBtn = document.getElementById('close-client-modal');
  const form = document.getElementById('client-access-form');
  const input = document.getElementById('client-album-code');

  if (clientBtn && modal) {
    clientBtn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('active');
      if (input) input.focus();
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }

  if (form && input) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = input.value.trim().toLowerCase();
      if (code) {
        window.location.href = `album.html?slug=${encodeURIComponent(code)}`;
      }
    });
  }
}

/* ==========================================================================
   2. API Data Fetcher with Fallback
   ========================================================================== */
async function fetchAllAlbums() {
  try {
    const res = await fetch('/api/albums');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.warn('API /api/albums not reachable, loading fallback database:', err);
  }

  // Fallback to local data/albums.json or embedded data
  try {
    const res = await fetch('data/albums.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.warn('data/albums.json fallback:', e);
  }

  return SAMPLE_ALBUMS;
}

async function fetchAlbumBySlug(slug) {
  try {
    let res = await fetch(`/api/albums/${encodeURIComponent(slug)}`);
    if (!res.ok) {
      res = await fetch(`/api/album?slug=${encodeURIComponent(slug)}`);
    }
    if (res.ok) {
      const album = await res.json();
      if (album && album.slug) return album;
    }
  } catch (err) {
    console.warn('API fetchAlbumBySlug failed, checking fallback list:', err);
  }

  const all = await fetchAllAlbums();
  return all.find(a => a.slug === slug || a.id === slug) || all[0];
}

/* ==========================================================================
   3. Homepage Logic
   ========================================================================== */
async function initHomepage() {
  initHeroSlideshow();
  const albums = await fetchAllAlbums();
  renderFeaturedAlbums(albums.slice(0, 3));
}

function initHeroSlideshow() {
  const slides = document.querySelectorAll('.hero-slide');
  if (!slides || slides.length === 0) return;

  let current = 0;
  setInterval(() => {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 6500);
}

function renderFeaturedAlbums(albums) {
  const container = document.getElementById('featured-albums-grid');
  if (!container || !albums) return;

  container.innerHTML = albums.map(album => createAlbumCardHtml(album)).join('');
}

/* ==========================================================================
   4. Albums Catalog Directory (albums.html)
   ========================================================================== */
async function initAlbumsDirectory() {
  const albums = await fetchAllAlbums();
  const grid = document.getElementById('albums-catalog-grid');
  const searchInput = document.getElementById('catalog-search');
  const filterPills = document.querySelectorAll('.filter-pill');

  let activeCategory = 'all';
  let searchQuery = '';

  // Parse category or search filter from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get('cat') || urlParams.get('category');
  if (catParam) {
    activeCategory = catParam.toLowerCase();
    filterPills.forEach(pill => {
      const pCat = (pill.getAttribute('data-category') || '').toLowerCase();
      if (pCat === activeCategory) {
        pill.classList.add('active');
        pill.setAttribute('aria-selected', 'true');
      } else {
        pill.classList.remove('active');
        pill.setAttribute('aria-selected', 'false');
      }
    });
  }

  const queryParam = urlParams.get('q') || urlParams.get('search');
  if (queryParam && searchInput) {
    searchQuery = queryParam.trim();
    searchInput.value = searchQuery;
  }

  function applyFilters() {
    if (!grid) return;
    const filtered = albums.filter(album => {
      const matchesCat = activeCategory === 'all' || 
                         album.category.toLowerCase().includes(activeCategory.toLowerCase());
      const query = searchQuery.toLowerCase();
      const matchesQuery = !query || 
                           album.title.toLowerCase().includes(query) ||
                           (album.location && album.location.toLowerCase().includes(query)) ||
                           (album.description && album.description.toLowerCase().includes(query));
      return matchesCat && matchesQuery;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
          <h3 style="font-size: 1.75rem; margin-bottom: 12px;">No matching collections found</h3>
          <p style="color: var(--text-muted);">Try adjusting your category filter or search keywords.</p>
        </div>
      `;
    } else {
      grid.innerHTML = filtered.map(album => createAlbumCardHtml(album)).join('');
    }
  }

  // Filter Pill clicks
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-selected', 'false');
      });
      pill.classList.add('active');
      pill.setAttribute('aria-selected', 'true');
      activeCategory = pill.getAttribute('data-category') || 'all';
      applyFilters();
    });
  });

  // Search input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      applyFilters();
    });
  }

  applyFilters();
}

function createAlbumCardHtml(album) {
  const photoCount = Array.isArray(album.photos) ? album.photos.length : 0;
  let coverUrl = album.coverThumbnail || album.coverImage || (album.photos && album.photos[0] ? (album.photos[0].thumbnailUrl || album.photos[0].url) : '');
  
  // Resolve Google Drive cover if available
  if (window.GDriveHelper && (album.rawCoverUrl || coverUrl)) {
    const driveId = window.GDriveHelper.extractGoogleDriveId(album.rawCoverUrl || coverUrl);
    if (driveId) {
      coverUrl = window.GDriveHelper.getThumbnailUrl(driveId, 800);
    }
  }

  const formattedDate = formatDate(album.eventDate);
  const albumUrl = `album.html?slug=${encodeURIComponent(album.slug)}`;

  return `
    <article class="album-card">
      <a href="${escapeHtml(albumUrl)}" class="album-cover-wrapper" aria-label="View ${escapeHtml(album.title)}">
        <span class="album-category-badge">${escapeHtml(album.category)}</span>
        <span class="album-photo-count-pill">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
          <span>${photoCount} Frames</span>
        </span>
        <img src="${escapeHtml(coverUrl)}" alt="${escapeHtml(album.title)}" class="album-cover-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop'">
      </a>
      <div class="album-card-body">
        <div class="album-date">${escapeHtml(formattedDate)} • ${escapeHtml(album.location || 'Location')}</div>
        <h3 class="album-title"><a href="${escapeHtml(albumUrl)}" style="color: inherit; text-decoration: none;">${escapeHtml(album.title)}</a></h3>
        <p class="album-description">${escapeHtml(album.description)}</p>
        <div class="album-card-footer">
          <a href="${escapeHtml(albumUrl)}" class="view-album-link">
            <span>Explore Collection</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </a>
        </div>
      </div>
    </article>
  `;
}

/* ==========================================================================
   5. Single Dedicated Album View (album.html)
   ========================================================================== */
async function initSingleAlbumView() {
  const params = new URLSearchParams(window.location.search);
  let slug = params.get('slug');
  if (!slug) {
    const p = window.location.pathname;
    if (p.startsWith('/album/')) {
      const parts = p.substring('/album/'.length).split('/');
      if (parts[0] && parts[0].trim()) {
        slug = decodeURIComponent(parts[0].trim());
      }
    }
  }
  if (!slug) {
    slug = 'wedding-nimal-kavindi';
  }

  const album = await fetchAlbumBySlug(slug);
  if (!album) {
    showToast('❌ Album could not be found.');
    return;
  }

  // Populate Header Details
  setText('album-category', album.category);
  setText('album-title', album.title);
  setText('album-date', formatDate(album.eventDate));
  setText('album-location', album.location || 'Sri Lanka');
  setText('album-count', `${(album.photos || []).length} Photographs`);
  setText('album-desc', album.description);
  document.title = `${album.title} | LuminaLens Studio`;

  // Render Photo Gallery Grid
  const grid = document.getElementById('album-gallery-grid');
  if (grid && Array.isArray(album.photos)) {
    grid.innerHTML = album.photos.map((photo, index) => {
      const aspectClass = photo.aspect === 'portrait' ? 'aspect-portrait' : photo.aspect === 'wide' ? 'aspect-wide' : '';
      const thumb = photo.thumbnailUrl || photo.url;
      return `
        <div class="photo-gallery-item ${aspectClass}" data-index="${index}">
          <img src="${escapeHtml(thumb)}" alt="${escapeHtml(photo.caption || 'Photograph')}" class="gallery-thumbnail-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop'">
          <div class="photo-caption-overlay">
            <span>${escapeHtml(photo.caption || `Frame ${index + 1}`)}</span>
            <svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
          </div>
        </div>
      `;
    }).join('');

    // Wire Lightbox Click
    grid.querySelectorAll('.photo-gallery-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.getAttribute('data-index'), 10);
        if (window.LuminaLightbox) {
          window.LuminaLightbox.open(album.photos, idx, album.title);
        }
      });
    });
  }

  // Wire Share Button & Modal
  const shareBtn = document.getElementById('share-album-btn');
  const shareModal = document.getElementById('share-modal');
  const closeShareBtn = document.getElementById('close-share-modal');
  const shareUrlInput = document.getElementById('share-url-input');
  const copyShareBtn = document.getElementById('copy-share-btn');
  const whatsappShareBtn = document.getElementById('whatsapp-share-btn');

  const currentUrl = window.location.href;
  if (shareUrlInput) shareUrlInput.value = currentUrl;

  if (shareBtn && shareModal) {
    shareBtn.addEventListener('click', () => shareModal.classList.add('active'));
  }
  if (closeShareBtn && shareModal) {
    closeShareBtn.addEventListener('click', () => shareModal.classList.remove('active'));
  }
  if (shareModal) {
    shareModal.addEventListener('click', (e) => {
      if (e.target === shareModal) shareModal.classList.remove('active');
    });
  }

  if (copyShareBtn) {
    copyShareBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(currentUrl);
        showToast('✓ Album share link copied to clipboard!');
      } catch (e) {
        if (shareUrlInput) {
          shareUrlInput.select();
          document.execCommand('copy');
          showToast('✓ Link copied to clipboard!');
        }
      }
    });
  }

  if (whatsappShareBtn) {
    whatsappShareBtn.addEventListener('click', () => {
      const msg = encodeURIComponent(`Explore "${album.title}" on LuminaLens Studio: ${currentUrl}`);
      window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
    });
  }

  // Wire Download All
  const downloadAllBtn = document.getElementById('download-all-btn');
  if (downloadAllBtn) {
    downloadAllBtn.addEventListener('click', () => {
      showToast('📥 Initiating high-resolution photo collection package...');
      // If photos have rawUrl, open first or direct download
      if (album.photos && album.photos[0]) {
        window.open(album.photos[0].url || album.photos[0].rawUrl, '_blank');
      }
    });
  }
}

/* ==========================================================================
   6. Utilities & Toast System
   ========================================================================== */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val || '';
}

function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(msg) {
  let toast = document.getElementById('lumina-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'lumina-toast';
    toast.className = 'toast-notification';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent-gold-primary);">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
    <span>${escapeHtml(msg)}</span>
  `;

  toast.classList.add('active');
  setTimeout(() => {
    toast.classList.remove('active');
  }, 3500);
}
