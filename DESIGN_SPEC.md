# UX/UI Design Specification & Visual Architecture
**Project:** LuminaLens Studio  
**System Type:** Professional Photography Portfolio & Online Album Management System  
**Design Theme:** "Obsidian Gallery" (Dark Luxury Editorial & Cinematic Photography Experience)  
**Target Stack:** Pure Semantic HTML5, Modern Modular CSS3, Vanilla ES6+ JavaScript, Java HTTP Backend, File-based JSON Data (`data/albums.json`), and Google Drive CDN  
**Document Version:** 1.0.0  
**Author:** UX/UI Designer  

---

## 1. Executive Summary & Design Philosophy

LuminaLens Studio is engineered for high-end photography presentation, client proofing, and friction-free album delivery. The primary design goal is **visual reverence for imagery**: the interface recedes into an elegant dark obsidian canvas, allowing photographs to shine with maximum contrast, fidelity, and emotional impact.

### Core UX Tenets
1. **Gallery-Grade Immersion ("Obsidian Canvas"):** Ultra-deep neutral backdrops (`#0b0c10`, `#14171f`) eliminate eye strain, preserve color perception, and create a cinema-like showcase.
2. **Champagne Gold Accents:** Sophisticated warm amber and champagne gold gradients (`#f39c12` $\to$ `#f5af19`) denote craftsmanship and luxury, used sparingly for active states, CTA triggers, and brand crests.
3. **Editorial Typography Pairing:** The high-fashion elegance of *Cormorant Garamond* (display serif) harmonized with the precision clarity of *Plus Jakarta Sans* (modern grotesque body) and *Fira Code* (monospaced metadata and timestamps).
4. **Seamless Client Delivery:** Instant access to private and public albums via custom short URLs (e.g. `/album?slug=wedding-nimal-kavindi`), full-screen immersive lightbox, and WhatsApp/Copy link sharing.
5. **Zero-Friction Admin Workflows:** Instant bulk parsing of Google Drive shareable links into high-speed thumbnail matrices with drag-to-reorder and live preview.

---

## 2. Visual Identity & Design System ("Obsidian Gallery")

### 2.1 Color Palette & Token Hierarchy

All colors are defined as CSS Custom Properties on `:root` to ensure system-wide coherence and instantaneous maintenance.

```css
:root {
  /* Canvas & Neutral Surfaces */
  --bg-canvas: #0b0c10;            /* Primary dark background (Deep Obsidian) */
  --bg-surface: #14171f;           /* Card containers, modals, table rows */
  --bg-surface-elevated: #1c212d;  /* Dropdowns, tooltips, active states */
  --bg-glass: rgba(20, 23, 31, 0.75); /* Sticky glass navbar & controls */
  --bg-glass-heavy: rgba(11, 12, 16, 0.92); /* Lightbox backdrop */

  /* Borders & Dividers */
  --border-subtle: rgba(255, 255, 255, 0.08); /* Minimal 1px hairline dividers */
  --border-medium: rgba(255, 255, 255, 0.16); /* Interactive outlines */
  --border-gold: rgba(243, 156, 18, 0.40);    /* Accent gold borders */

  /* Accent & Brand Luxury Tones */
  --accent-gold-primary: #f39c12;    /* Vibrant Champagne Gold */
  --accent-gold-light: #f5af19;      /* Warm Amber Highlight */
  --accent-gold-gradient: linear-gradient(135deg, #f5af19 0%, #f39c12 50%, #d35400 100%);
  --accent-gold-glow: rgba(243, 156, 18, 0.25); /* Focus & hover glow */

  /* Text & Readability Hierarchy */
  --text-primary: #f8fafc;          /* High-contrast crisp headlines (White 95%) */
  --text-secondary: #cbd5e1;        /* Body text, descriptions (Slate 300) */
  --text-muted: #808b96;            /* Metadata, dates, photo counts (Slate 500) */
  --text-gold: #f5af19;             /* Highlighted badges and links */

  /* Functional Status Indicators */
  --status-published: #10b981;      /* Emerald Green: Live public album */
  --status-private: #f59e0b;        /* Amber: Private client link only */
  --status-hidden: #64748b;         /* Muted Slate: Draft / Disabled */
  --status-danger: #ef4444;         /* Rose Red: Deletion, error states */

  /* Dimensions & Glass Effects */
  --blur-glass: blur(16px);
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-full: 9999px;
}
```

---

### 2.2 Typography System

The typography scale balances timeless high-editorial serif drama with crisp digital legibility.

#### Font Families
1. **Display & Editorial Headings:** `'Cormorant Garamond'`, Georgia, serif (Weights: 400 Regular, 600 Semi-Bold, 700 Bold, Italic).
2. **UI, Body & Navigation:** `'Plus Jakarta Sans'`, system-ui, -apple-system, sans-serif (Weights: 400 Regular, 500 Medium, 600 Semi-Bold).
3. **Monospaced Data & Metadata:** `'Fira Code'`, monospace (Weights: 400, 500).

#### Typography Scale Matrix

| Style Level | Font Family | Size (Desktop / Mobile) | Weight | Line Height | Tracking / Spacing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Display** | Cormorant Garamond | `4.25rem` / `2.75rem` | 600 / 700 | 1.08 | `-0.02em` |
| **Section Title (H1)**| Cormorant Garamond | `3.0rem` / `2.0rem` | 600 | 1.15 | `-0.01em` |
| **Album Title (H2)** | Cormorant Garamond | `2.0rem` / `1.5rem` | 600 | 1.25 | `0` |
| **Subheadings (H3)** | Plus Jakarta Sans | `1.25rem` / `1.125rem`| 600 | 1.4 | `0` |
| **Lead Paragraph** | Plus Jakarta Sans | `1.125rem` / `1.0rem` | 400 | 1.65 | `0.01em` |
| **Body Regular** | Plus Jakarta Sans | `1.0rem` / `0.9375rem`| 400 | 1.6 | `0` |
| **UI Button / Nav** | Plus Jakarta Sans | `0.875rem` / `0.875rem`| 500 / 600 | 1.0 | `0.05em` (Caps) |
| **Metadata & Badges**| Fira Code | `0.8125rem` / `0.75rem` | 500 | 1.3 | `0.03em` |

---

### 2.3 Elevation, Shadows & Depth

- **Surface Layer 0 (Canvas):** Pure `#0b0c10` with subtle radial vignette.
- **Surface Layer 1 (Card/Container):** `#14171f` with hairline border `1px solid var(--border-subtle)` and soft ambient shadow `0 4px 20px rgba(0,0,0,0.4)`.
- **Surface Layer 2 (Hover/Active):** `#1c212d` with gold-tinted hairline border `1px solid var(--border-gold)` and elevated shadow `0 16px 36px -8px rgba(0,0,0,0.65), 0 0 20px -4px var(--accent-gold-glow)`.
- **Surface Layer 3 (Overlay / Modal / Lightbox):** Ultra-dark glass backdrop `var(--bg-glass-heavy)` with `backdrop-filter: blur(20px)` at `z-index: 10000`.

---

## 3. Public Pages Architecture & Wireframes

### 3.1 Global Header & Navigation

#### Layout & Wireframe
```
+-----------------------------------------------------------------------------------------------+
|  [✦ LUMINALENS STUDIO]          [Portfolio]   [Albums]   [About]   [Contact]   [Client Access] ☰ |
+-----------------------------------------------------------------------------------------------+
```

#### Specifications:
- **Navbar Position:** Fixed sticky at `top: 0`, full width, `z-index: 1000`.
- **Blur Transition:** At `window.scrollY === 0`, navbar background is transparent. When scrolled $> 30px$, transitions smoothly (`transition: all 0.3s ease`) to `background: var(--bg-glass)` with `backdrop-filter: var(--blur-glass)`.
- **Brand Crest:** Serif mark `"LUMINALENS"` with small superscript `"STUDIO"` and amber lens icon `✦`.
- **Client Access Button:** Subtle outline pill button (`border: 1px solid var(--border-medium)`) leading directly to client album code / slug prompt modal.
- **Mobile Hamburger:** Sleek 2-line minimalist icon that transforms into an "X", unveiling a full-bleed luxury overlay.

---

### 3.2 Homepage (`index.html`)

The homepage delivers immediate cinematic impact, establishing the photographer's caliber and leading visitors directly into curated albums.

#### Section Breakdown & Wireframe
```
+-----------------------------------------------------------------------------------------------+
|                                                                                               |
|                                       ✦ LUMINALENS ✦                                          |
|                         Visual Stories Captured in Timeless Light                             |
|                                                                                               |
|            [ HERO SHOWCASE: Fullscreen Cinematic Slideshow / Vignette Background ]            |
|                                                                                               |
|                      [ Explore Albums ↓ ]        [ Book a Session → ]                         |
|                                                                                               |
+-----------------------------------------------------------------------------------------------+
|                                                                                               |
|  ABOUT THE ARTIST                                                                             |
|  "Mastering light, raw emotion, and editorial precision across Sri Lanka and worldwide."      |
|                                                                                               |
|  +--------------------+  +--------------------+  +--------------------+  +-----------------+  |
|  |       150+         |  |        12+         |  |       45,000+      |  |      Award      |  |
|  |  Weddings Captured |  |  Years of Mastery  |  |   Frames Curated   |  |   Winning Eye   |  |
|  +--------------------+  +--------------------+  +--------------------+  +-----------------+  |
|                                                                                               |
+-----------------------------------------------------------------------------------------------+
|                                                                                               |
|  FEATURED COLLECTIONS                                                        [View All (18)]  |
|                                                                                               |
|  +-----------------------------+  +-----------------------------+  +------------------------+ |
|  | [COVER: Wedding Celebration]|  | [COVER: Coastal Portrait]   |  | [COVER: Wild Elephants]  | |
|  | KANDY, SRI LANKA            |  | MIRISSA SHORES              |  | YALA NATIONAL PARK     | |
|  | Nimal & Kavindi             |  | Golden Hour Solitude        |  | The Silent Giants      | |
|  | 142 Photos • Dec 2026       |  | 48 Photos • Nov 2026        |  | 86 Photos • Oct 2026   | |
|  +-----------------------------+  +-----------------------------+  +------------------------+ |
|                                                                                               |
+-----------------------------------------------------------------------------------------------+
```

#### Hero Showcase Mechanics:
- Full-bleed background slideshow featuring 3-4 top photographs fading every 6 seconds.
- Dark gradient overlay: `linear-gradient(to bottom, rgba(11,12,16,0.4) 0%, rgba(11,12,16,0.95) 100%)`.
- Subtle ken-burns slow pan animation (`transform: scale(1.05)` over 6 seconds) with smooth cross-fade.

---

### 3.3 Albums Directory (`albums.html`)

A comprehensive, filterable catalog of all published albums.

#### Wireframe & Filter Matrix
```
+-----------------------------------------------------------------------------------------------+
|  ALL COLLECTIONS                                                                              |
|  Explore client stories, editorial shoots, and wildlife chronicles.                          |
|                                                                                               |
|  [ ALL (18) ]    [ Weddings (8) ]    [ Portraits (4) ]    [ Wildlife (3) ]    [ Events (3) ]  |
|                                                                                               |
|  +-------------------------------------+     +-------------------------------------+          |
|  | [COVER: Nuwara Eliya Highlands]    |     | [COVER: Studio Editorial Session]   |          |
|  | +---------------------------------+ |     | +---------------------------------+ |          |
|  | | WEDDING • 120 PHOTOS            | |     | | PORTRAIT • 45 PHOTOS            | |          |
|  | +---------------------------------+ |     | +---------------------------------+ |          |
|  | The Royal Glenloch Wedding          |     | Minimalist Monochromatic Series     |          |
|  | Date: November 18, 2026             |     | Date: October 05, 2026              |          |
|  | [ View Gallery ➔ ]                  |     | [ View Gallery ➔ ]                  |          |
|  +-------------------------------------+     +-------------------------------------+          |
+-----------------------------------------------------------------------------------------------+
```

#### Album Card Specifications:
- Aspect Ratio: `4:5` portrait or `16:10` landscape responsive grid.
- Hover Effect: Image scales smoothly (`transform: scale(1.04)`), dark vignette brightens, gold border glows.
- Cover Fallback: Google Drive thumbnail converter loads progressive low-res placeholder before full cover arrives.

---

### 3.4 Album View (`album.html?slug={slug}`)

The dedicated presentation page for a specific photography collection.

#### Layout & Wireframe
```
+-----------------------------------------------------------------------------------------------+
|  [ ← Back to Collections ]                                    [ 🔗 Share ]   [ 📥 Download ]  |
|                                                                                               |
|  ============================== ALBUM BANNER & STORY =======================================  |
|                                                                                               |
|                                   ✦ WEDDINGS & CELEBRATIONS ✦                                 |
|                                Nimal & Kavindi's Wedding Day                                  |
|                            Earl's Regency, Kandy • December 12, 2026                          |
|                                        142 Photographs                                        |
|                                                                                               |
|  "A romantic celebration captured amidst the misty hills of Kandy, featuring traditional      |
|   Poruwa rituals, intimate family moments, and golden hour portraiture."                      |
|                                                                                               |
|  ================================== PHOTO GALLERY GRID =====================================  |
|                                                                                               |
|  +------------------+   +------------------------+   +------------------+   +---------------+ |
|  | [PHOTO 01]       |   | [PHOTO 02 - TALL]      |   | [PHOTO 03]       |   | [PHOTO 04]    | |
|  |                  |   |                        |   |                  |   |               | |
|  |                  |   |                        |   |                  |   |               | |
|  +------------------+   |                        |   +------------------+   +---------------+ |
|  +------------------+   |                        |   +--------------------------------------+ |
|  | [PHOTO 05]       |   +------------------------+   | [PHOTO 06 - WIDE]                    | |
|  |                  |   +------------------------+   |                                      | |
|  +------------------+   | [PHOTO 07]             |   +--------------------------------------+ |
+-----------------------------------------------------------------------------------------------+
```

#### Photo Grid Layout:
- Flexible CSS Columns or CSS Grid Masonry (`grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))`).
- Rounded corners: `var(--radius-sm)` (8px).
- Click Action: Any photo click triggers the Interactive Lightbox starting at that specific index.
- Lazy Loading: Native `loading="lazy"` on all image tags with skeleton shimmer background.

---

### 3.5 Interactive Lightbox Modal Viewer

The full-screen viewing experience for client proofing and inspection.

#### Lightbox Wireframe
```
+-----------------------------------------------------------------------------------------------+
| [✦ LuminaLens]   Nimal & Kavindi Wedding — Frame 14 of 142       [🔍 Zoom] [📥 Save] [✕ Close] |
|-----------------------------------------------------------------------------------------------|
|                                                                                               |
|     <                                                                                   >     |
|  [ PREV ]                                                                            [ NEXT ] |
|                                   +-------------------------+                                 |
|                                   |                         |                                 |
|                                   |                         |                                 |
|                                   |   FULL RESOLUTION       |                                 |
|                                   |   PHOTOGRAPH DISPLAY    |                                 |
|                                   |                         |                                 |
|                                   |                         |                                 |
|                                   +-------------------------+                                 |
|                                                                                               |
|-----------------------------------------------------------------------------------------------|
|  [ ◀ Thumbnail Strip:  [▫] [▫] [▫] [▪ ACTIVE] [▫] [▫] [▫] [▫] [▫] [▫]                      ▶ ] |
+-----------------------------------------------------------------------------------------------+
```

#### Lightbox Interactive Controls & Accessibility:
1. **Navigation:**
   - Previous (`Left Arrow` key or `[<]` button).
   - Next (`Right Arrow` key or `[>]` button).
   - Close (`Escape` key, `[✕]` button, or backdrop click).
2. **Keyboard Trapping & ARIA:**
   - `role="dialog"`, `aria-modal="true"`, `aria-label="Photo Viewer"`.
   - Focus is retained within the modal while open.
3. **Bottom Thumbnail Strip:**
   - Horizontal scrolling carousel of thumbnails with active highlight indicator in champagne gold.
4. **Touch & Gesture Support:**
   - Mobile touch swipe left/right to navigate images.
   - Double-tap or pinch to zoom.

---

### 3.6 Client Share Sheet Modal

When clicking `[🔗 Share]` on any album:
- **Share Card Options:**
  1. **Direct Unique Link:** Pre-selected input field with instant `[Copy Link]` button and temporary `✓ Copied!` state.
  2. **WhatsApp Direct Share:** One-click button initiating `https://api.whatsapp.com/send?text=...` formatted with album title and direct URL.
  3. **QR Code Generator:** Instant canvas-rendered QR code for clients to scan directly off a screen onto their smartphones.

---

## 4. Admin Panel Architecture & Wireframes

The admin interface (`/admin`) is protected by password authentication and provides rapid, intuitive album lifecycle management.

### 4.1 Admin Authentication Screen (`/admin/login.html`)

#### Wireframe
```
+-----------------------------------------------------------------------------------------------+
|                                                                                               |
|                                  +--------------------------+                                 |
|                                  |      ✦ LUMINALENS        |                                 |
|                                  |     STUDIO CONSOLE       |                                 |
|                                  |                          |                                 |
|                                  |  Access Key / Password   |                                 |
|                                  |  [ ••••••••••••••••••  ] |                                 |
|                                  |                          |                                 |
|                                  |  [  Authenticate ➔  ]    |                                 |
|                                  +--------------------------+                                 |
|                                                                                               |
+-----------------------------------------------------------------------------------------------+
```

---

### 4.2 Admin Dashboard (`/admin/index.html`)

#### Wireframe & Management Matrix
```
+-----------------------------------------------------------------------------------------------+
|  ✦ LUMINALENS CONSOLE             [Overview]   [Albums]   [Settings]           [Log Out ➔]    |
+-----------------------------------------------------------------------------------------------+
|                                                                                               |
|  DASHBOARD METRICS                                                                            |
|  +--------------------+  +--------------------+  +--------------------+  +-----------------+  |
|  |         18         |  |        1,420       |  |       12,840       |  |  Google Drive   |  |
|  |   Total Albums     |  |   Managed Photos   |  |   Total Pageviews  |  |  Cloud Connected|  |
|  +--------------------+  +--------------------+  +--------------------+  +-----------------+  |
|                                                                                               |
|  ALBUM MANAGEMENT                              [ 🔍 Search Albums... ]   [ + Create New Album]|
|                                                                                               |
|  Cover  Title & Slug              Category   Date         Photos  Status       Actions        |
|  -------------------------------------------------------------------------------------------  |
|  [Img]  Nimal & Kavindi Wedding   Wedding    12 Dec 2026   142    ● Published  [Edit] [Link] 🗑|
|         /album?slug=wedding-nimal                                                             |
|                                                                                               |
|  [Img]  Coastal Sunset Portfolio  Portrait   20 Nov 2026    48    ● Published  [Edit] [Link] 🗑|
|         /album?slug=coastal-sunset                                                            |
|                                                                                               |
|  [Img]  Private Client Proofing   Event      02 Nov 2026    86    ◌ Private    [Edit] [Link] 🗑|
|         /album?slug=pre-shoot-001                                                             |
+-----------------------------------------------------------------------------------------------+
```

#### Key Dashboard Functions:
- **Instant Search & Category Filter:** Filters albums as you type without server reload.
- **Quick Status Toggle:** Change between Published (Public), Private (Direct link only), and Hidden (Disabled) in one click.
- **Copy Link Button:** Copies the client's direct shareable URL directly to the clipboard with visual toast.

---

### 4.3 Album Creator & Editor (`/admin/album-editor.html` or Modal)

The core tool for the photographer to input details and bulk-import Google Drive photographs.

#### Wireframe & Bulk Link Ingestion
```
+-----------------------------------------------------------------------------------------------+
|  CREATE / EDIT ALBUM                                                        [✕ Close / Cancel]|
+-----------------------------------------------------------------------------------------------+
|                                                                                               |
|  Album Title *                           URL Slug (Auto-generated) *                          |
|  [ Nimal & Kavindi Wedding           ]   [ wedding-nimal-kavindi                             ] |
|                                                                                               |
|  Event Category                          Event Date                                           |
|  [ Weddings & Engagements      ▼ ]       [ 2026-12-12                                        ] |
|                                                                                               |
|  Album Description                                                                            |
|  [ Elegant wedding ceremony at Earl's Regency Kandy with traditional Poruwa ceremony...      ] |
|                                                                                               |
|  Album Cover Image URL (Google Drive Share Link or Direct URL) *                              |
|  [ https://drive.google.com/file/d/1A2B3C4D5E6F.../view?usp=sharing                         ] |
|  [ Preview: 🖼️ Cover Loaded Successfully ]                                                   |
|                                                                                               |
|  Visibility Setting                                                                           |
|  (●) Published (Public Gallery)     ( ) Private (Only via direct URL)     ( ) Draft / Hidden  |
|                                                                                               |
|  -------------------------------------------------------------------------------------------  |
|  GOOGLE DRIVE PHOTO LINKS (Bulk Ingestion)                                                    |
|  Paste raw Google Drive shareable links (one URL per line):                                   |
|  +-----------------------------------------------------------------------------------------+  |
|  | https://drive.google.com/file/d/1XyZ987.../view?usp=sharing                             |  |
|  | https://drive.google.com/file/d/2AbC654.../view?usp=sharing                             |  |
|  | https://drive.google.com/file/d/3DeF321.../view?usp=sharing                             |  |
|  +-----------------------------------------------------------------------------------------+  |
|  [ ⚡ Parse & Validate Links (3 detected) ]                                                   |
|                                                                                               |
|  LIVE PHOTO THUMBNAIL MATRIX (Drag to re-order, click ✕ to delete):                           |
|  +-------------+  +-------------+  +-------------+  +-------------+                           |
|  | [Photo #01] |  | [Photo #02] |  | [Photo #03] |  | + Add More  |                           |
|  | ✕ Remove    |  | ✕ Remove    |  | ✕ Remove    |  |             |                           |
|  +-------------+  +-------------+  +-------------+  +-------------+                           |
|                                                                                               |
|  [ Save & Publish Album ➔ ]                       [ Discard Changes ]                         |
+-----------------------------------------------------------------------------------------------+
```

---

## 5. Google Drive Integration & Image Delivery Strategy

Because all high-resolution images live in Google Drive, the client's browser must render them efficiently without CORS blocks or bandwidth choking.

### 5.1 Google Drive URL Normalization Engine
Users paste links in varied formats:
1. `https://drive.google.com/file/d/{FILE_ID}/view?usp=sharing`
2. `https://drive.google.com/open?id={FILE_ID}`
3. `https://drive.google.com/uc?id={FILE_ID}&export=download`

#### URL Conversion Algorithm (Pure JS / Java Helper):
```javascript
function extractGoogleDriveFileId(url) {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                url.match(/id=([a-zA-Z0-9_-]+)/) ||
                url.match(/drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// Low-bandwidth fast thumbnail for album grid & preview:
function getGoogleDriveThumbnailUrl(fileId, size = 600) {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
}

// High-resolution image for lightbox viewing:
function getGoogleDriveFullResUrl(fileId) {
  return `https://lh3.googleusercontent.com/d/${fileId}`;
}
```

### 5.2 Performance & Loading States
1. **Grid Thumbnails:** Always request `sz=w600` or `sz=w800` to ensure rapid page loading and minimal data transfer.
2. **Lightbox Viewing:** Pre-load the full-resolution image (`sz=w1920` or direct LH3 link) only when an image is clicked or when the user hovers over a thumbnail.
3. **Progressive Shimmer:** All image containers render a sleek dark slate shimmer skeleton while the Google Drive image resolves.

---

## 6. Data Architecture & `albums.json` Schema

All data persists in a structured, lightweight JSON file: `C:\Users\Adeepa D. Marambage\OpenBot\Shared\LuminaLens_Studio\data\albums.json`.

```json
{
  "system": {
    "name": "LuminaLens Studio",
    "photographer": "Adeepa Marambage",
    "tagline": "Visual Stories Captured in Timeless Light",
    "contact": {
      "email": "adeepadmarambage@gmail.com",
      "phone": "+94 77 123 4567",
      "location": "Colombo, Sri Lanka",
      "instagram": "https://instagram.com/luminalens",
      "whatsapp": "+94771234567"
    }
  },
  "albums": [
    {
      "id": "alb_001",
      "slug": "wedding-nimal-kavindi",
      "title": "Nimal & Kavindi Wedding Celebration",
      "category": "Weddings",
      "eventDate": "2026-12-12",
      "location": "Earl's Regency, Kandy",
      "description": "An exquisite traditional Poruwa ceremony followed by a romantic evening reception amidst the scenic hills of Kandy.",
      "coverImage": {
        "fileId": "1A2B3C4D5E6F_SAMPLE_ID_01",
        "url": "https://drive.google.com/thumbnail?id=1A2B3C4D5E6F_SAMPLE_ID_01&sz=w1200"
      },
      "photos": [
        {
          "id": "pho_001",
          "fileId": "1A2B3C4D5E6F_SAMPLE_ID_01",
          "caption": "The Poruwa Blessing",
          "aspectRatio": "3:2"
        },
        {
          "id": "pho_002",
          "fileId": "1A2B3C4D5E6F_SAMPLE_ID_02",
          "caption": "Golden Hour Portraiture",
          "aspectRatio": "2:3"
        }
      ],
      "visibility": "published",
      "allowDownload": true,
      "createdAt": "2026-12-13T10:00:00Z",
      "updatedAt": "2026-12-13T14:30:00Z"
    }
  ]
}
```

---

## 7. Responsive Breakpoints & Accessibility (WCAG 2.1 AA)

### 7.1 Responsive Breakpoint Specifications

| Device Type | Viewport Width | Navigation Behavior | Album Grid Columns | Lightbox UI |
| :--- | :--- | :--- | :--- | :--- |
| **Mobile** | `< 640px` | Collapsed hamburger overlay | 1 column (full width) | Touch gestures, swipe navigation, bottom bar hidden |
| **Tablet** | `640px - 1024px`| Compact horizontal nav | 2 columns | Full controls, thumb strip visible |
| **Desktop**| `1024px - 1440px`| Full editorial navigation | 3 columns masonry | Complete keyboard shortcuts + zoom |
| **Ultra-Wide**| `> 1440px` | Centered max 1400px container | 4 columns masonry | High-res image scaling with margins |

### 7.2 Accessibility & Usability Checklist
- **Color Contrast:** Muted text on Obsidian canvas satisfies $4.5:1$ minimum; champagne gold accents satisfy $3.5:1$ for graphical objects and $4.5:1$ for bold labels.
- **Focus Indicators:** Interactive buttons and links display `outline: 2px solid var(--accent-gold-primary); outline-offset: 3px;` on `:focus-visible`.
- **Keyboard Trapping:** Modal dialogs and the Lightbox trap focus and close cleanly with `Escape`.
- **Screen Reader Support:** All image elements feature descriptive `alt` tags (e.g. `alt="Photograph from Nimal & Kavindi Wedding"`).

---

## 8. Frontend & Backend Engineering Blueprints

### Directory Layout
```
LuminaLens_Studio/
├── data/
│   └── albums.json              # File-based JSON database
├── public/
│   ├── index.html               # Public portfolio home
│   ├── albums.html              # Filterable album directory
│   ├── album.html               # Individual album & photo gallery
│   ├── css/
│   │   ├── style.css            # Obsidian design system, typography, components
│   │   └── admin.css            # Dashboard & editor styles
│   ├── js/
│   │   ├── app.js               # Public routing, data fetching, gallery renderer
│   │   ├── lightbox.js          # Standalone full-screen lightbox viewer
│   │   ├── gdrive-helper.js     # Google Drive ID parsing & thumbnail builder
│   │   └── admin.js             # Admin authentication, album CRUD, bulk link parser
│   └── admin/
│       ├── login.html           # Admin authentication gate
│       └── index.html           # Album management dashboard & editor
└── src/
    └── server/
        └── LuminaLensServer.java # Lightweight Java HTTP server & JSON REST API
```

### API Endpoint Contract (Java HTTP Backend)
- `GET /api/albums` $\to$ Returns array of all published albums (public).
- `GET /api/albums?all=true` $\to$ Returns all albums including private/hidden (admin auth required).
- `GET /api/album?slug={slug}` $\to$ Returns single album with photos.
- `POST /api/admin/login` $\to$ Verifies session token / credentials.
- `POST /api/albums` $\to$ Creates a new album in `albums.json`.
- `PUT /api/albums/{id}` $\to$ Updates album details, photos, or status.
- `DELETE /api/albums/{id}` $\to$ Removes album from `albums.json`.

---
*Specification authored by UX/UI Designer for LuminaLens Studio.*
