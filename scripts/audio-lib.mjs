// scripts/audio-lib.mjs
// Piezas comunes del sistema de audio MP3: qué texto se lee y cómo saber si un MP3
// quedó desactualizado (porque el texto cambió en el Sheets después de generarlo).
import crypto from 'node:crypto';

export const MODES = ['corto', 'largo'];
export const AUDIO_LANGS = ['es', 'en', 'fr', 'pl', 'ru', 'ja'];

/** Texto que se lee en voz alta: el guion de la pieza en ese idioma y modo. */
export function scriptFor(piece, lang, mode) {
  const key = mode === 'corto' ? 'guion_corto' : 'guion_largo';
  const raw = lang === 'es' ? piece[key] : piece[`${key}_${lang}`];
  return String(raw || '').replace(/\s+/g, ' ').trim();
}

/** Huella corta del texto. Si el texto cambia, la huella cambia y el MP3 deja de valer. */
export function textHash(text) {
  return crypto.createHash('sha1').update(String(text).normalize('NFC')).digest('hex').slice(0, 16);
}

export function audioFileName(lang, pieceId, mode) {
  return `${lang}/${pieceId}_${mode}.mp3`;
}
