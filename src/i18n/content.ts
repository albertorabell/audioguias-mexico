import { SupportedLanguage } from './languages';

/**
 * Textos de piezas y salas en otros idiomas.
 * En el Sheets viven en columnas opcionales con el sufijo del idioma (guion_corto_en, titulo_en...).
 * Si falta la traducción de un campo se usa el español. Nunca se inventa texto.
 */

const nonEmpty = (v: unknown): boolean =>
  typeof v === 'string' ? v.trim().length > 0 : Array.isArray(v) ? v.length > 0 : !!v && typeof v === 'object' && Object.keys(v as object).length > 0;

const PIECE_FIELDS = [
  'titulo',
  'frase_gancho',
  'puente_narrativo',
  'avance',
  'guion_corto',
  'guion_largo',
  'retos_observacion',
  'especificaciones',
  'faq_mito',
] as const;

const ROOM_FIELDS = ['nombre_oficial', 'frase_gancho', 'introduccion_narrativa', 'etiqueta'] as const;
const SITE_FIELDS = ['name', 'location', 'badge', 'description'] as const;
const ROUTE_FIELDS = ['name', 'description'] as const;

/** ¿Las dos versiones de lectura (corta y larga) de esta pieza existen en ese idioma? */
export function hasTranslatedScripts(piece: any, lang: SupportedLanguage): boolean {
  if (!piece || lang === 'es') return true;
  // Sin pase los guiones no están en la pieza: el dato público `idiomas_texto` dice en qué idiomas existen
  if (Array.isArray(piece.idiomas_texto)) return piece.idiomas_texto.includes(lang);
  return nonEmpty(piece[`guion_corto_${lang}`]) && nonEmpty(piece[`guion_largo_${lang}`]);
}

/** Idioma en el que se leerá el guion de esta pieza: el elegido si hay traducción, si no español. */
export function scriptLanguage(piece: any, lang: SupportedLanguage): SupportedLanguage {
  return hasTranslatedScripts(piece, lang) ? lang : 'es';
}

/**
 * Idioma en el que se leerá la introducción de una sala: el elegido si la sala tiene esa traducción, si no español.
 * (La introducción es `introduccion_narrativa`; si la sala no tiene, se lee la frase gancho.)
 */
export function roomScriptLanguage(room: any, lang: SupportedLanguage): SupportedLanguage {
  if (!room || lang === 'es') return 'es';
  if (nonEmpty(room[`introduccion_narrativa_${lang}`])) return lang;
  const hasIntro = nonEmpty(room.introduccion_narrativa) && room.introduccion_narrativa !== room[`introduccion_narrativa_${lang}`];
  if (!hasIntro && nonEmpty(room[`frase_gancho_${lang}`])) return lang;
  return 'es';
}

function localize<T extends Record<string, any>>(obj: T, lang: SupportedLanguage, fields: readonly string[], aliases: Record<string, string[]>): T {
  if (!obj || lang === 'es') return obj;
  let out: any = null;
  for (const f of fields) {
    const v = (obj as any)[`${f}_${lang}`];
    if (nonEmpty(v)) {
      out ||= { ...obj };
      out[`${f}_es`] = (obj as any)[f]; // se conserva el original para buscar con el nombre en español
      out[f] = v;
      for (const a of aliases[f] || []) out[a] = v;
    }
  }
  return (out || obj) as T;
}

/** Devuelve la pieza con los textos en el idioma pedido (los que existan). */
export function localizePiece<T extends Record<string, any>>(piece: T, lang: SupportedLanguage): T {
  return localize(piece, lang, PIECE_FIELDS, { titulo: ['title'] });
}

export function localizeRoom<T extends Record<string, any>>(room: T, lang: SupportedLanguage): T {
  return localize(room, lang, ROOM_FIELDS, { nombre_oficial: ['name'] });
}

/** Sitios (data/sites.json) y rutas sugeridas con sus campos *_en cuando existan. */
export function localizeSite<T extends Record<string, any>>(site: T, lang: SupportedLanguage): T {
  return localize(site, lang, SITE_FIELDS, {});
}

export function localizeRoute<T extends Record<string, any>>(route: T, lang: SupportedLanguage): T {
  return localize(route, lang, ROUTE_FIELDS, { name: ['title'] });
}
