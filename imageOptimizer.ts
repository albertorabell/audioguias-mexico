/**
 * Image URL optimization helper for cultural heritage webapp.
 * - Handles empty or incompatible formats (.pdf, .djvu) by returning an elegant fallback SVG.
 * - Proxies external images through wsrv.nl to prevent 403 Forbidden / hotlinking blocks
 *   and serve lightweight modern WebP format.
 */

// Fallback cultural heritage SVG represented as a data URI to guarantee 100% offline availability
export const CULTURAL_FALLBACK_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#241E1C"/>
        <stop offset="50%" stop-color="#181615"/>
        <stop offset="100%" stop-color="#0E0C0C"/>
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#C05638"/>
        <stop offset="100%" stop-color="#E28743"/>
      </linearGradient>
      <pattern id="archGrid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#FFFFFF" stroke-width="0.5" stroke-opacity="0.04"/>
      </pattern>
    </defs>
    <rect width="800" height="600" fill="url(#bgGrad)"/>
    <rect width="800" height="600" fill="url(#archGrid)"/>
    
    <!-- Central Solar / Archaeological Glyph Motif -->
    <g transform="translate(400, 270)">
      <!-- Outer rays circle -->
      <circle r="110" fill="none" stroke="url(#goldGrad)" stroke-width="1.5" stroke-opacity="0.35" stroke-dasharray="4 6"/>
      <circle r="92" fill="none" stroke="#C05638" stroke-width="1" stroke-opacity="0.5"/>
      <circle r="80" fill="#C05638" fill-opacity="0.08"/>
      
      <!-- Stepped Pyramid / Monolith Silhouette -->
      <path d="M -50 50 L -40 20 L -30 20 L -25 -5 L -15 -5 L -10 -30 L 10 -30 L 15 -5 L 25 -5 L 30 20 L 40 20 L 50 50 Z" 
            fill="none" stroke="url(#goldGrad)" stroke-width="2.5" stroke-linejoin="round"/>
      <line x1="-60" y1="50" x2="60" y2="50" stroke="url(#goldGrad)" stroke-width="2.5" stroke-linecap="round"/>
      
      <!-- Solar disk in center -->
      <circle cx="0" cy="-4" r="10" fill="url(#goldGrad)" fill-opacity="0.85"/>
    </g>

    <!-- Refined Typography -->
    <text x="400" y="440" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="13" font-weight="700" letter-spacing="4" fill="#E5E5E5" text-anchor="middle">ACERVO HISTÓRICO Y CULTURAL</text>
    <text x="400" y="470" font-family="'Newsreader', Georgia, serif" font-style="italic" font-size="15" fill="#A8A29E" text-anchor="middle">Museo Nacional de Antropología · México</text>
  </svg>`
)}`;

/**
 * Returns an optimized image URL:
 * - If url is missing or points to an incompatible format (.pdf, .djvu, .tif, .tiff), returns fallback SVG.
 * - If already a data URI or local asset path (/data/ or data/), returns it directly.
 * - Otherwise proxies through wsrv.nl to prevent 403 hotlink blocks and convert to WebP at width 800.
 */
export function getOptimizedImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') {
    return CULTURAL_FALLBACK_SVG;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return CULTURAL_FALLBACK_SVG;
  }

  // Check for incompatible document extensions (.pdf, .djvu, .tif, .tiff)
  const lowerUrl = trimmed.toLowerCase();
  const incompatibleExtensions = ['.pdf', '.djvu', '.tif', '.tiff'];
  const hasIncompatibleExt = incompatibleExtensions.some((ext) => {
    // Check if URL ends with ext, or contains ext before query string / hash
    const cleanUrl = lowerUrl.split('?')[0].split('#')[0];
    return cleanUrl.endsWith(ext);
  });

  if (hasIncompatibleExt) {
    return CULTURAL_FALLBACK_SVG;
  }

  // If it's a data URI or SVG data URI, return as-is
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // If it's a local relative file or SVG vector
  if (trimmed.startsWith('/') || trimmed.startsWith('data/') || trimmed.endsWith('.svg')) {
    return trimmed;
  }

  // For any external web URL (Wikimedia, Unsplash, etc.), route through wsrv.nl proxy
  // This bypasses Wikimedia 403 Forbidden header restrictions and serves optimal WebP
  return `https://wsrv.nl/?url=${encodeURIComponent(trimmed)}&w=800&output=webp`;
}
