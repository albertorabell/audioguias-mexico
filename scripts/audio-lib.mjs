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

// ---------------------------------------------------------------------------
// Utilidades para generar y revisar los MP3
// ---------------------------------------------------------------------------

/** Un cuadro de MP3 en silencio (MPEG-2 capa III, 24 kHz, 48 kbps, 144 bytes, 24 ms). Sirve para el proveedor de prueba. */
const SILENT_FRAME = Buffer.from(
  '//NkxAAAAANIAAAAAExBTUVVVVVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
  'base64'
);

/** MP3 en silencio de la duración pedida (para probar todo sin gastar nada). */
export function silentMp3(seconds) {
  const frames = Math.max(1, Math.round(seconds / 0.024));
  return Buffer.concat(Array.from({ length: frames }, () => SILENT_FRAME));
}

const BITRATES = {
  // [versión][capa III] en kbps; versión 1 = MPEG-1, 2 = MPEG-2 / 2.5
  1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
};
const SAMPLE_RATES = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };

/** Duración en segundos de un MP3 leyendo sus cuadros (sin programas externos). null si no parece un MP3. */
export function mp3Duration(buf) {
  let pos = 0;
  if (buf.length > 10 && buf.toString('latin1', 0, 3) === 'ID3') {
    pos = 10 + ((buf[6] & 0x7f) << 21) + ((buf[7] & 0x7f) << 14) + ((buf[8] & 0x7f) << 7) + (buf[9] & 0x7f);
  }
  let seconds = 0;
  let frames = 0;
  while (pos + 4 <= buf.length) {
    if (buf[pos] !== 0xff || (buf[pos + 1] & 0xe0) !== 0xe0) {
      pos++;
      continue;
    }
    const versionBits = (buf[pos + 1] >> 3) & 3; // 3 = MPEG1, 2 = MPEG2, 0 = MPEG2.5
    const layer = (buf[pos + 1] >> 1) & 3; // 1 = capa III
    const bitrateIdx = (buf[pos + 2] >> 4) & 15;
    const rateIdx = (buf[pos + 2] >> 2) & 3;
    const padding = (buf[pos + 2] >> 1) & 1;
    if (versionBits === 1 || layer !== 1 || bitrateIdx === 0 || bitrateIdx === 15 || rateIdx === 3) {
      pos++;
      continue;
    }
    const isV1 = versionBits === 3;
    const bitrate = BITRATES[isV1 ? 1 : 2][bitrateIdx] * 1000;
    const rate = SAMPLE_RATES[versionBits][rateIdx];
    const samples = isV1 ? 1152 : 576;
    const frameLen = Math.floor(((isV1 ? 144 : 72) * bitrate) / rate) + padding;
    seconds += samples / rate;
    frames++;
    pos += frameLen;
  }
  return frames > 0 ? seconds : null;
}

/** Parte un texto en trozos de hasta `max` caracteres sin cortar frases. */
export function splitText(text, max = 3000) {
  const sentences = String(text).match(/[^.!?…]+[.!?…]+["»”)]*\s*|[^.!?…]+$/g) || [String(text)];
  const chunks = [];
  let cur = '';
  for (const s of sentences) {
    if (s.length > max) {
      // frase gigante: se corta por palabras
      if (cur) chunks.push(cur.trim()), (cur = '');
      let part = '';
      for (const w of s.split(/\s+/)) {
        if ((part + ' ' + w).length > max) chunks.push(part.trim()), (part = w);
        else part += ' ' + w;
      }
      cur = part;
      continue;
    }
    if ((cur + s).length > max) chunks.push(cur.trim()), (cur = s);
    else cur += s;
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.filter(Boolean);
}

/** Precios de referencia en dólares por millón de caracteres. Son aproximados: confirma en la página del proveedor antes de generar. */
export const REFERENCE_PRICE_USD_PER_MILLION_CHARS = {
  azure: 15, // Azure AI Speech, voces neuronales estándar; cifra de un sitio de comparación, confírmala con Microsoft (la capa gratuita da unos 500 mil caracteres al mes)
  openai: 15, // OpenAI tts-1
  prueba: 0,
};

/**
 * Decide qué hay que generar. Es una función pura: no toca archivos ni internet.
 * @returns {{todo: object[], reuse: object[], move: object[], skipped: object[], chars: number}}
 */
export function planAudio(pieces, manifest, { langs = ['es'], modes = MODES, only = 'todas', ids = null, limit = null, force = false } = {}) {
  const todo = [];
  const move = [];
  const keep = [];
  const skipped = [];
  let chars = 0;
  for (const piece of pieces) {
    if (ids && !ids.includes(piece.piece_id)) continue;
    const remote = !piece.is_free;
    if (only === 'gratis' && remote) continue;
    if (only === 'premium' && !remote) continue;
    for (const lang of langs) {
      for (const mode of modes) {
        const script = scriptFor(piece, lang, mode);
        const item = { pieceId: piece.piece_id, lang, mode, remote, script, hash: textHash(script) };
        if (!script) {
          skipped.push({ ...item, why: 'sin texto' });
          continue;
        }
        const old = manifest?.items?.[lang]?.[piece.piece_id]?.[mode];
        if (!force && old && old.hash === item.hash) {
          if (Boolean(old.remote) !== remote) move.push({ ...item, from: old });
          else keep.push(item);
          continue;
        }
        todo.push(old ? { ...item, from: old } : item);
        chars += script.length;
      }
    }
  }
  const limited = limit ? todo.slice(0, limit) : todo;
  const limitedChars = limit ? limited.reduce((n, i) => n + i.script.length, 0) : chars;
  return { todo: limited, pending: todo.length, move, keep, skipped, chars: limitedChars };
}

/**
 * Los nombres de las voces Dragon HD llevan ":" (en-US-Adam:DragonHDLatestNeural). Los nombres de archivo de las muestras
 * lo cambian por "-", y es fácil copiar ese nombre por error: aquí se vuelve a poner el ":" para que Azure reconozca la voz.
 */
export function fixVoiceName(name) {
  return String(name).trim().replace(/^([a-z]{2,3}-[A-Z]{2}-[A-Za-z]+)-(DragonHD\w*)$/, '$1:$2');
}
