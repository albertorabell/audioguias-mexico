/**
 * URL and Data Resolution Helpers for GitHub Pages and Local Environments
 */

export const PIECE_ALIASES: Record<string, string> = {
  'disco-de-la-muerte': 'mna_s04_disco_muerte',
  'disco-de-la-muerte-mictlantecuhtli': 'mna_s04_disco_muerte',
  'piedra-del-sol': 'mna_s06_piedra_sol',
  'coatlicue': 'mna_s06_coatlicue',
  'coyolxauhqui': 'mna_s06_coyolxauhqui',
  'cabeza-de-coyolxauhqui': 'mna_s06_coyolxauhqui',
  'diosa-del-agua-chalchiuhtlicue': 'mna_s04_chalchiuhtlicue',
  'chalchiuhtlicue': 'mna_s04_chalchiuhtlicue',
  'mascara-de-calakmul': 'mna_s09_mascara_pakal',
  'mascara-de-pakal': 'mna_s09_mascara_pakal',
  'cabeza-colosal': 'mna_s08_cabeza_colosal_6',
  'atlante-de-tula': 'mna_s05_atlante_tula',
};

/**
 * Formats fetch URLs cleanly using import.meta.env.BASE_URL and GitHub Pages detection
 */
export function getAssetUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }

  const cleanPath = path.replace(/^\/+/, '');
  const baseUrl = import.meta.env.BASE_URL || './';
  let baseDir = baseUrl.replace(/\/$/, '');

  // Detect GitHub Pages repo subpath (e.g. /audioguias-mexico/)
  if (typeof window !== 'undefined' && window.location.pathname) {
    const segments = window.location.pathname.split('/').filter(Boolean);
    if (window.location.hostname.endsWith('github.io') && segments.length > 0) {
      baseDir = `/${segments[0]}`;
    }
  }

  if (!baseDir || baseDir === '.') {
    return `./${cleanPath}`;
  }

  return `${baseDir}/${cleanPath}`;
}

/**
 * Ensures a piece exposes both piece.id and piece.piece_id
 */
export function normalizePiece<T extends Record<string, any>>(piece: T): T {
  if (!piece) return piece;
  const p = piece as any;
  const id = p.piece_id || p.id || p.poi_id || '';
  const roomId = p.room_id || p.roomId || '';
  const title = p.titulo || p.title || p.identification?.title || '';

  p.id = id;
  p.piece_id = id;
  p.poi_id = id;

  if (roomId) {
    p.room_id = roomId;
    p.roomId = roomId;
  }
  if (title) {
    p.titulo = title;
    p.title = title;
  }
  return piece;
}

/**
 * Searches for a piece in an array checking piece_id, id, poi_id and canonical aliases
 */
export function findPiece(pieces: any[], targetId: string): any {
  if (!pieces || !targetId) return undefined;
  const canonicalId = PIECE_ALIASES[targetId] || targetId;
  const lowerTarget = targetId.toLowerCase();
  const lowerCanonical = canonicalId.toLowerCase();

  return pieces.find((p: any) => {
    if (!p) return false;
    const pId = p.piece_id || p.id || p.poi_id;
    if (pId === targetId || pId === canonicalId) return true;
    if (p.piece_id === targetId || p.id === targetId || p.poi_id === targetId) return true;
    if (p.piece_id === canonicalId || p.id === canonicalId || p.poi_id === canonicalId) return true;

    if (typeof pId === 'string') {
      const pIdLower = pId.toLowerCase();
      if (pIdLower === lowerTarget || pIdLower === lowerCanonical) return true;
    }
    return false;
  });
}
