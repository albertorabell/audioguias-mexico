// Textos de pago: se separan de los datos públicos.
//
// Lo que se publica con el sitio (public/data/pieces.json) lleva título, frase gancho, foto, sala y un adelanto corto.
// Los guiones, los retos, el mito y la ficha técnica van a archivos privados (datos-privados/), que NO se publican con el sitio:
// se suben a Cloudflare R2 y el servidor de cobro solo los entrega con un pase vigente (GET /texto/<idioma>.json?t=<clave>).
import fs from 'node:fs';
import path from 'node:path';

export const PRIVATE_DIR = 'datos-privados';
export const FULL_FILE = 'piezas-completas.json';
export const TEXT_LANGS = ['en', 'fr', 'pl', 'ru', 'ja'];
/** Campos de la pieza que solo reciben quienes tienen pase. */
export const PRIVATE_BASE = ['guion_corto', 'guion_largo', 'retos_observacion', 'especificaciones', 'faq_mito'];

const suffixes = ['', ...TEXT_LANGS.map((l) => `_${l}`)];
export const PRIVATE_FIELDS = new Set(PRIVATE_BASE.flatMap((f) => suffixes.map((s) => `${f}${s}`)));

const nonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;

/** Primeras frases del texto, hasta ~max caracteres: sirve de adelanto a quien aún no tiene pase. */
export function avance(text, max = 220) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  const sentences = t.match(/[^.!?…]+[.!?…]+["”»)]?/g) || [t];
  let out = '';
  for (const s of sentences) {
    if (out && (out + s).length > max) break;
    out += s;
    if (out.length >= max * 0.6) break;
  }
  if (out.length > max + 40) out = out.slice(0, max).replace(/\s+\S*$/, '') + '…';
  return out.trim();
}

const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Lista de palabras distintas del guion corto en español (sin orden de lectura), para que el asistente de rutas pueda buscar temas sin tener el texto. */
export function indice(text) {
  const words = new Set(fold(text).match(/[a-zñ]{4,}/g) || []);
  return [...words].sort().join(' ');
}

/** Idiomas en los que la pieza tiene corto y largo traducidos. */
export function idiomasConTexto(piece) {
  return TEXT_LANGS.filter((l) => nonEmpty(piece[`guion_corto_${l}`]) && nonEmpty(piece[`guion_largo_${l}`]));
}

/** Parte la pieza en lo público y lo privado. */
export function splitPiece(piece) {
  const pub = {};
  const priv = {};
  for (const [k, v] of Object.entries(piece)) {
    if (PRIVATE_FIELDS.has(k)) priv[k] = v;
    else pub[k] = v;
  }
  const esp = piece.especificaciones || {};
  const cultura = esp.Cultura || esp.cultura || '';
  if (cultura) pub.cultura = cultura;
  const adv = avance(piece.guion_corto);
  if (adv) pub.avance = adv;
  for (const l of TEXT_LANGS) {
    const a = avance(piece[`guion_corto_${l}`]);
    if (a) pub[`avance_${l}`] = a;
  }
  const idx = indice(piece.guion_corto);
  if (idx) pub.indice = idx;
  const idiomas = idiomasConTexto(piece);
  if (idiomas.length) pub.idiomas_texto = idiomas;
  return { pub, priv };
}

/**
 * Un archivo por idioma. El de español lleva solo los textos base; el de otro idioma lleva los textos base (por si una pieza
 * aún no está traducida) y los de ese idioma. Cada archivo se pide una sola vez, con la clave del pase.
 */
export function buildBundles(pieces, langs) {
  const out = {};
  for (const lang of langs) {
    const items = {};
    for (const piece of pieces) {
      const { priv } = splitPiece(piece);
      const keep = {};
      for (const [k, v] of Object.entries(priv)) {
        const m = k.match(/_(en|fr|pl|ru|ja)$/);
        if (m && m[1] !== lang) continue;
        if (v === '' || v === null || (Array.isArray(v) && !v.length) || (typeof v === 'object' && v && !Array.isArray(v) && !Object.keys(v).length)) continue;
        keep[k] = v;
      }
      if (Object.keys(keep).length) items[piece.piece_id] = keep;
    }
    out[lang] = { v: 1, lang, pieces: items };
  }
  return out;
}

/** Idiomas que merecen su archivo: español y los que tienen al menos una pieza con texto traducido. */
export function bundleLangs(pieces) {
  const langs = new Set(['es']);
  for (const p of pieces) for (const l of idiomasConTexto(p)) langs.add(l);
  return [...langs];
}

/** Escribe datos-privados/ (piezas completas para los scripts y un archivo de texto por idioma). */
export function writePrivate(root, pieces, log = () => {}) {
  const dir = path.join(root, PRIVATE_DIR);
  fs.rmSync(path.join(dir, 'texto'), { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, 'texto'), { recursive: true });
  fs.writeFileSync(path.join(dir, FULL_FILE), JSON.stringify(pieces, null, 2), 'utf-8');
  const bundles = buildBundles(pieces, bundleLangs(pieces));
  for (const [lang, data] of Object.entries(bundles)) {
    const file = path.join(dir, 'texto', `${lang}.json`);
    fs.writeFileSync(file, JSON.stringify(data), 'utf-8');
    log(`🔒 Textos de pago (${lang}): ${Object.keys(data.pieces).length} piezas, ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
  }
  return bundles;
}

/** Piezas con todo el texto (para generar audios, traducir y muestras). Usa datos-privados/ si existe; si no, los datos públicos. */
export function readFullPieces(root) {
  const full = path.join(root, PRIVATE_DIR, FULL_FILE);
  const file = fs.existsSync(full) ? full : path.join(root, 'public/data/pieces.json');
  if (!fs.existsSync(file)) throw new Error('No existen los datos de piezas. Corre antes: npm run sync-data');
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}
