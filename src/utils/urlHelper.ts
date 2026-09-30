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
  'teocalli-de-la-guerra-sagrada': 'mna_s06_teocalli_guerra_sagrada',
  'teocalli-guerra-sagrada': 'mna_s06_teocalli_guerra_sagrada',
  'diosa-del-agua-chalchiuhtlicue': 'mna_s04_chalchiuhtlicue',
  'chalchiuhtlicue': 'mna_s04_chalchiuhtlicue',
  'mascara-de-calakmul': 'mna_s09_mascara_pakal',
  'mascara-de-pakal': 'mna_s09_mascara_pakal',
  'cabeza-colosal': 'mna_s08_cabeza_colosal_6',
  'cabeza-colosal-6': 'mna_s08_cabeza_colosal_6',
  'atlante-de-tula': 'mna_s05_atlante_tula',
  'atlante-tula': 'mna_s05_atlante_tula',
  'chacmool': 'mna_s06_chacmool_mexica',
  'chacmool-mexica': 'mna_s06_chacmool_mexica',
  'chacmool-de-chichen-itza': 'mna_s09_chacmool_chichen',
  'chacmool-chichen': 'mna_s09_chacmool_chichen',
  'xochipilli': 'mna_s06_xochipilli',
  'tlaltecuhtli': 'mna_s06_tlaltecuhtli',
  'piedra-de-tizoc': 'mna_s06_piedra_tizoc',
  'mono-de-obsidiana': 'mna_s06_mono_obsidiana',
  'vasija-del-mono-de-obsidiana': 'mna_s06_mono_obsidiana',
  'guerrero-aguila': 'mna_s06_guerrero_aguila',
  'guerrero-jaguar': 'mna_s06_guerrero_jaguar',
  'piramide-de-quetzalcoatl': 'mna_s04_piramide_quetzalcoatl',
  'coyote-emplumado': 'mna_s05_coyote_lid_tula',
  'lapida-del-templo-mayor': 'mna_s06_lapida_templo_mayor',
  'dintel-26': 'mna_s09_dintel_26_yaxchilan',
  'dintel-26-de-yaxchilan': 'mna_s09_dintel_26_yaxchilan',
  'estela-48-de-izapa': 'mna_s09_estela_48_izapa',
  'adolescente-huasteco': 'mna_s08_adolescente_huasteco',
  'luchador-olmeca': 'mna_s08_luchador_olmeca',
  'senor-las-limas': 'mna_s08_senor_las_limas',
  'ofrenda4-laventa': 'mna_s08_ofrenda4_laventa',
  'hacha-votiva-jade': 'mna_s08_hacha_votiva_jade',
  'carita-sonriente': 'mna_s08_carita_sonriente',
  'yugo-sapo': 'mna_s08_yugo_sapo',
  'palma-sacrificio': 'mna_s08_palma_sacrificio',
  'cihuateteo-zapotal': 'mna_s08_cihuateteo_zapotal',
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
  const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || './';
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
 * Resolves candidate image URLs for a piece across .webp, .png, .jpg and local base path.
 * Guarantees that PieceImage and ImageZoomModal share the exact same resolution logic.
 */
export function resolvePieceImageCandidates(
  filename?: string,
  pieceId?: string
): string[] {
  const rawTarget = (filename || '').trim();
  const urls: string[] = [];
  const cleanPieceId = (pieceId || '').trim();
  const canonicalId = cleanPieceId ? (PIECE_ALIASES[cleanPieceId] || cleanPieceId) : '';

  if (rawTarget.startsWith('http://') || rawTarget.startsWith('https://') || rawTarget.startsWith('data:')) {
    urls.push(rawTarget);
    if (canonicalId) {
      urls.push(getAssetUrl(`images/pieces/${canonicalId}.webp`));
      urls.push(getAssetUrl(`images/pieces/${canonicalId}.png`));
    }
    return Array.from(new Set(urls));
  }

  if (rawTarget) {
    const cleanPath = rawTarget
      .replace(/^\/?(public\/)?/, '')
      .replace(/^\/?(images\/pieces\/)?/, '')
      .replace(/^\.\//, '');

    const extMatch = cleanPath.match(/\.(webp|png|jpg|jpeg)$/i);
    const baseName = extMatch ? cleanPath.replace(/\.(webp|png|jpg|jpeg)$/i, '') : cleanPath;
    const currentExt = extMatch ? extMatch[0].toLowerCase() : '';

    urls.push(getAssetUrl(`images/pieces/${cleanPath}`));
    if (currentExt === '.webp') {
      urls.push(getAssetUrl(`images/pieces/${baseName}.png`));
      urls.push(getAssetUrl(`images/pieces/${baseName}.jpg`));
    } else if (currentExt === '.png') {
      urls.push(getAssetUrl(`images/pieces/${baseName}.webp`));
      urls.push(getAssetUrl(`images/pieces/${baseName}.jpg`));
    } else {
      urls.push(getAssetUrl(`images/pieces/${baseName}.webp`));
      urls.push(getAssetUrl(`images/pieces/${baseName}.png`));
      urls.push(getAssetUrl(`images/pieces/${baseName}.jpg`));
    }
  }

  if (canonicalId) {
    urls.push(getAssetUrl(`images/pieces/${canonicalId}.webp`));
    urls.push(getAssetUrl(`images/pieces/${canonicalId}.png`));
    urls.push(getAssetUrl(`images/pieces/${canonicalId}.jpg`));
  }

  return Array.from(new Set(urls.filter(Boolean)));
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
  const targetCleanSlug = lowerTarget.replace(/^mna_s\d+_/i, '').replace(/_/g, '-');

  return pieces.find((p: any) => {
    if (!p) return false;
    const pId = p.piece_id || p.id || p.poi_id;
    if (pId === targetId || pId === canonicalId) return true;
    if (p.piece_id === targetId || p.id === targetId || p.poi_id === targetId) return true;
    if (p.piece_id === canonicalId || p.id === canonicalId || p.poi_id === canonicalId) return true;

    if (typeof pId === 'string') {
      const pIdLower = pId.toLowerCase();
      if (pIdLower === lowerTarget || pIdLower === lowerCanonical) return true;
      const pIdCleanSlug = pIdLower.replace(/^mna_s\d+_/i, '').replace(/_/g, '-');
      if (pIdCleanSlug === targetCleanSlug) return true;
    }
    return false;
  });
}
