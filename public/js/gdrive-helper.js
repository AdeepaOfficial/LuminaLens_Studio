/**
 * LuminaLens Studio - Google Drive CDN & Media Parser Helper
 * Normalizes Google Drive shareable URLs into low-latency thumbnails and high-res presentation links.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GDriveHelper = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Extracts Google Drive file ID from varied URL formats or raw file IDs.
   * @param {string} url - Input share link, direct link, or ID
   * @returns {string|null} - 28-33 char Google Drive ID or null
   */
  function extractGoogleDriveId(url) {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();

    // 1. /file/d/{ID}
    let match = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return match[1];

    // 2. id={ID} query parameter
    match = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return match[1];

    // 3. /d/{ID}
    match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return match[1];

    // 4. Raw file ID (alphanumeric with underscores/dashes, typically 20-50 chars)
    if (/^[a-zA-Z0-9_-]{15,60}$/.test(trimmed)) {
      return trimmed;
    }

    return null;
  }

  /**
   * Generates low-bandwidth fast thumbnail URL for grids & previews.
   * @param {string} fileId 
   * @param {number} size - Width in pixels (default 600)
   * @returns {string}
   */
  function getThumbnailUrl(fileId, size = 600) {
    if (!fileId) return '';
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w${size}`;
  }

  /**
   * Generates high-resolution image URL for lightbox and hero presentation.
   * Uses Google usercontent direct CDN link.
   * @param {string} fileId 
   * @param {number} width - Max width in pixels (default 1600)
   * @returns {string}
   */
  function getFullResUrl(fileId, width = 1600) {
    if (!fileId) return '';
    return `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=w${width}`;
  }

  /**
   * Parses multiline input text containing Google Drive URLs line-by-line.
   * Ignores empty lines and comments.
   * @param {string} text 
   * @returns {Array<{ id: string, driveId: string, rawUrl: string, url: string, thumbnailUrl: string, caption: string }>}
   */
  function parseBulkLinks(text) {
    if (!text || typeof text !== 'string') return [];

    const lines = text.split(/\r?\n/);
    const results = [];
    const seenIds = new Set();

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const driveId = extractGoogleDriveId(trimmed);
      if (driveId && !seenIds.has(driveId)) {
        seenIds.add(driveId);
        const photoId = 'photo-' + Date.now().toString(36) + '-' + (results.length + 1);
        results.push({
          id: photoId,
          driveId: driveId,
          rawUrl: trimmed.startsWith('http') ? trimmed : `https://drive.google.com/file/d/${driveId}/view?usp=sharing`,
          url: getFullResUrl(driveId, 1600),
          thumbnailUrl: getThumbnailUrl(driveId, 600),
          caption: `Photograph #${results.length + 1}`
        });
      }
    });

    return results;
  }

  /**
   * Checks if an image URL or Drive ID loads properly via an Image test element.
   * @param {string} urlOrId 
   * @returns {Promise<boolean>}
   */
  function testImageLoad(urlOrId) {
    return new Promise((resolve) => {
      const driveId = extractGoogleDriveId(urlOrId);
      const testUrl = driveId ? getThumbnailUrl(driveId, 300) : urlOrId;
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = testUrl;
    });
  }

  return {
    extractGoogleDriveId,
    getThumbnailUrl,
    getFullResUrl,
    parseBulkLinks,
    testImageLoad
  };
});
