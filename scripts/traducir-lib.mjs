// scripts/traducir-lib.mjs
//
// Piezas sueltas del traductor (sin red, fáciles de probar):
//   - qué campos se traducen y cuándo una traducción sigue vigente (huella del texto en español)
//   - el glosario de nombres propios
//   - las instrucciones para el traductor
//   - las revisiones automáticas de cada traducción
//   - la unión de las traducciones guardadas con las piezas (la usa scripts/sync-sheets.js)

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Qué se traduce
// ---------------------------------------------------------------------------
export const PIECE_FIELDS = ['titulo', 'frase_gancho', 'puente_narrativo', 'guion_corto', 'guion_largo', 'retos_observacion', 'especificaciones', 'faq_mito'];
export const ROOM_FIELDS = ['nombre_oficial', 'frase_gancho', 'introduccion_narrativa'];
export const SPOKEN_FIELDS = ['guion_corto', 'guion_largo'];

// Idiomas que ya tienen glosario y reglas. Los demás se agregan cuando existan.
export const LANG_NAMES = { en: 'English (US)' };
export const TRANSLATE_LANGS = Object.keys(LANG_NAMES);

export const TRANSLATIONS_DIR = 'traducciones';
export const GLOSSARY_FILE = 'glosario/glosario.csv';

const isEmptyValue = (v) =>
  v == null ||
  (typeof v === 'string' && !v.trim()) ||
  (Array.isArray(v) && v.length === 0) ||
  (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);

/** Huella corta del texto en español. Si el texto cambia, la huella cambia y la traducción vieja deja de valer. */
export function fieldHash(value) {
  return crypto.createHash('sha1').update(JSON.stringify(value).normalize('NFC')).digest('hex').slice(0, 16);
}

/** Campos con texto de una pieza o sala, tal como están en pieces.json / rooms.json. */
export function sourceFields(kind, item) {
  const names = kind === 'pieza' ? PIECE_FIELDS : ROOM_FIELDS;
  const out = {};
  for (const f of names) if (!isEmptyValue(item[f])) out[f] = item[f];
  return out;
}

export const unitId = (kind, item) => (kind === 'pieza' ? item.piece_id : item.room_id);

export function translationFile(root, lang, kind, id) {
  return path.join(root, TRANSLATIONS_DIR, lang, `${kind}_${id}.json`);
}

export function readStored(root, lang, kind, id) {
  const file = translationFile(root, lang, kind, id);
  if (!fs.existsSync(file)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    return data && typeof data === 'object' && data.campos && typeof data.campos === 'object' ? data : null;
  } catch {
    return null;
  }
}

/** Campos que faltan por traducir (no hay traducción, o el texto en español cambió desde que se tradujo). */
export function pendingFields(fields, stored) {
  return Object.keys(fields).filter((f) => stored?.campos?.[f]?.hash !== fieldHash(fields[f]));
}

// ---------------------------------------------------------------------------
// Glosario
// ---------------------------------------------------------------------------
function parseCsvRows(input) {
  const text = String(input).replace(/^﻿/, '');
  const rows = [];
  let row = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; } else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); cur = ''; rows.push(row); row = [];
    } else cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordRe = (term) => new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(term)}(?![\\p{L}\\p{N}])`, 'iu');

/**
 * Lee glosario/glosario.csv. Devuelve entradas { es, alts, en, keep, first, check }.
 *   keep  = el nombre se queda igual
 *   first = en inglés lleva una aclaración entre paréntesis que se usa solo la primera vez
 * Las filas "revisar" (sin decisión) se ignoran.
 */
export function loadGlossary(file) {
  if (!fs.existsSync(file)) return [];
  const rows = parseCsvRows(fs.readFileSync(file, 'utf-8'));
  const head = rows.shift() || [];
  const col = (name) => head.indexOf(name);
  const iTipo = col('tipo'), iEs = col('espanol'), iEn = col('ingles_propuesto');
  const out = [];
  for (const r of rows) {
    const tipo = (r[iTipo] || '').trim();
    const es = (r[iEs] || '').trim();
    const en = (r[iEn] || '').trim();
    if (!es || !en || tipo === 'revisar') continue;
    const alts = es.split(' / ').map((s) => s.trim()).filter(Boolean);
    const keep = tipo === 'igual' || alts.some((a) => a.toLowerCase() === en.toLowerCase());
    const base = en.replace(/\s*\([^)]*\)\s*$/, '').trim();
    out.push({
      es,
      alts,
      en,
      base,
      keep,
      first: /\([^)]*\)\s*$/.test(en) && !alts.some((a) => a.includes('(')),
      // "Sala" → "Hall" depende de la frase; no se revisa palabra por palabra
      check: es !== 'Sala',
      re: alts.map(wordRe),
    });
  }
  return out;
}

/** Entradas del glosario que aparecen en estos textos en español. */
export function glossaryFor(glossary, texts) {
  const hay = texts.join('\n');
  return glossary.filter((g) => g.re.some((re) => re.test(hay)));
}

export const flatText = (v) => (typeof v === 'string' ? v : Array.isArray(v) ? v.map(flatText).join('\n') : v && typeof v === 'object' ? Object.entries(v).map(([k, x]) => `${k}: ${flatText(x)}`).join('\n') : '');

// ---------------------------------------------------------------------------
// Instrucciones para el traductor
// ---------------------------------------------------------------------------
export function buildSystemPrompt(lang) {
  const name = LANG_NAMES[lang];
  if (!name) throw new Error(`Todavía no hay reglas ni glosario para el idioma "${lang}".`);
  return `You are a professional translator for a museum audio-guide app about the National Museum of Anthropology (MNA) in Mexico City. You translate from Mexican Spanish into natural, polished ${name} for curious visitors who are not specialists.

You receive a JSON object. Translate every value and return ONE JSON object with exactly the same keys, in the same order, and nothing else: no commentary, no code fences.

Keep the shapes identical:
- A string stays a string.
- An array stays an array with the same number of items, in the same order.
- "especificaciones" is an object: keep the same number of entries, in the same order. Translate both the labels (keys) and the values. Use these fixed labels: Cultura = Culture; Periodo = Period; Material = Material; Procedencia = Origin; Medidas = Dimensions; Región = Region; Técnica/Material = Technique/Material; Función = Function; Pueblo = People; Pueblo Indígena = Indigenous People; Autor/Cultura = Author/Culture; Año = Year; Ubicación = Location; Antigüedad = Age. Translate any other label plainly.
- "faq_mito" is an object with the keys "pregunta" and "respuesta". Keep those two keys exactly as they are and translate only the values. The Spanish values begin with "Mito:" and "Realidad:"; write "Myth:" and "Reality:".

Spoken scripts ("guion_corto" and "guion_largo"):
- They are read aloud by a text-to-speech voice. Write flowing spoken prose: no lists, no markdown, no emojis, no parenthetical asides (except glossary terms that the glossary shows with parentheses).
- Same sentences, same information, same order. Do not add, explain, summarize or omit anything.
- Keep years, dates and numbers as digits when the source uses digits. If the source writes a number in words, write it in words.
- Keep metric units. Never convert to miles, feet or pounds.

All texts:
- Translate meaning faithfully, with the tone of the source: evocative but accurate. Do not invent facts.
- Never leave Spanish words in the English text, except proper names covered by the glossary.
- The glossary in the user message is mandatory: names marked KEEP stay exactly as written (keep their accents); the others use the English given.
- A glossary English term shown with a parenthetical, such as "Voladores (Flyers)", gets the parenthetical only the first time it appears within the text you are translating; afterwards use the term without it.
- "Sala X" (a hall of the museum) becomes "X Hall".
- Follow the capitalization of the source for glossary terms: a lowercase concept stays lowercase (for example "guerra sagrada" as a general idea becomes "sacred war"), while a capitalized name stays capitalized.
- Eras: "d.C." becomes "AD" and "a.C." becomes "BC", placed after the year or range as in the source (for example "1250-1521 d.C." becomes "1250-1521 AD").
- If the source spells a glossary name slightly differently from the glossary (for example "Nahui Olin" and the glossary says "Nahui Ollin"), use the glossary spelling.
- Use typographic quotation marks (“ ”) and apostrophes (’), like the Spanish source, never straight quotes.`;
}

export function buildUserPrompt(fields, glossaryEntries) {
  const lines = glossaryEntries.map((g) => (g.keep ? `- ${g.es} → KEEP as "${g.en}"` : `- ${g.es} → ${g.en}${g.first ? ' (parenthetical only the first time)' : ''}`));
  return `GLOSSARY (mandatory, only the terms that appear in this text):
${lines.length ? lines.join('\n') : '(none)'}

TEXT TO TRANSLATE (JSON):
${JSON.stringify(fields, null, 2)}

Return only the JSON object.`;
}

/** Saca el objeto JSON de la respuesta aunque venga con ``` o texto alrededor. */
export function parseJsonReply(text) {
  const s = String(text || '');
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('la respuesta no trae un objeto JSON');
  return JSON.parse(s.slice(a, b + 1));
}

// ---------------------------------------------------------------------------
// Revisiones automáticas
// ---------------------------------------------------------------------------
const ES_STOPWORDS = new Set(['el', 'la', 'los', 'las', 'de', 'del', 'que', 'y', 'en', 'un', 'una', 'con', 'por', 'para', 'se', 'su', 'sus', 'es', 'al', 'como', 'más', 'pero', 'esta', 'este', 'estos', 'estas']);
const words = (s) => (String(s).toLowerCase().match(/\p{L}+/gu) || []);

function spanishRatio(text) {
  const w = words(text);
  if (!w.length) return 0;
  return w.filter((x) => ES_STOPWORDS.has(x)).length / w.length;
}

const strings = (v) => (typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : []);

/**
 * Compara el texto en español con la traducción.
 * errors  → la traducción NO se guarda.
 * warnings → se guarda, pero queda anotado para que alguien la revise.
 * Con fake=true (proveedor de prueba) solo se revisa la forma, no el idioma.
 */
export function validateTranslation(source, out, glossaryEntries = [], { fake = false } = {}) {
  const errors = [];
  const warnings = {};
  const warn = (field, msg) => (warnings[field] ||= []).push(msg);

  if (!out || typeof out !== 'object' || Array.isArray(out)) return { errors: ['la respuesta no es un objeto'], warnings };
  const want = Object.keys(source);
  const got = Object.keys(out);
  const missing = want.filter((k) => !got.includes(k));
  const extra = got.filter((k) => !want.includes(k));
  if (missing.length) errors.push(`faltan campos: ${missing.join(', ')}`);
  if (extra.length) errors.push(`campos de más: ${extra.join(', ')}`);

  for (const f of want) {
    const src = source[f];
    const val = out[f];
    if (val === undefined) continue;
    if (typeof src === 'string') {
      if (typeof val !== 'string' || !val.trim()) { errors.push(`${f}: debe ser un texto no vacío`); continue; }
    } else if (Array.isArray(src)) {
      if (!Array.isArray(val) || val.length !== src.length || val.some((x) => typeof x !== 'string' || !x.trim())) {
        errors.push(`${f}: debe ser una lista de ${src.length} textos`);
        continue;
      }
    } else if (f === 'faq_mito') {
      const k = val && typeof val === 'object' ? Object.keys(val).sort().join(',') : '';
      if (k !== 'pregunta,respuesta' || strings(val).some((x) => !x.trim())) { errors.push(`${f}: debe tener "pregunta" y "respuesta"`); continue; }
    } else if (src && typeof src === 'object') {
      if (!val || typeof val !== 'object' || Array.isArray(val) || Object.keys(val).length !== Object.keys(src).length || strings(val).some((x) => !x.trim())) {
        errors.push(`${f}: debe tener ${Object.keys(src).length} entradas`);
        continue;
      }
    }

    const sText = strings(src).join(' ');
    const oText = strings(val).join(' ');
    if (/```|\*\*|^#/m.test(oText)) errors.push(`${f}: trae formato (markdown) que no debería`);
    if (fake) continue;

    if (sText.length >= 80) {
      const ratio = oText.length / sText.length;
      if (ratio < 0.5 || ratio > 1.5) errors.push(`${f}: el largo no cuadra (${Math.round(ratio * 100)} % del español)`);
      if (spanishRatio(oText) > 0.08) errors.push(`${f}: parece que quedó texto en español`);
    }

    const digitsIn = sText.match(/\d[\d.,]*/g) || [];
    const lost = [...new Set(digitsIn.map((d) => d.replace(/[.,]+$/, '')))].filter((d) => !oText.includes(d));
    if (lost.length) warn(f, `no encuentro estos números del español: ${lost.join(', ')}`);

    for (const g of glossaryEntries) {
      if (!g.check || !g.re.some((re) => re.test(sText))) continue;
      const ok = g.keep ? wordRe(g.base).test(oText) : wordRe(g.base).test(oText) || g.alts.some((a) => wordRe(a).test(oText));
      if (!ok) warn(f, `el glosario pide "${g.base}" para "${g.es}" y no aparece`);
    }
  }
  return { errors, warnings };
}

// ---------------------------------------------------------------------------
// Costo (aproximado: los precios se confirman en la página de Anthropic)
// ---------------------------------------------------------------------------
export const DEFAULT_PRICES = { input: 2, output: 10, cacheWrite: 2.5, cacheRead: 0.2 }; // USD por millón de tokens

export function usdFromUsage(usage, prices = DEFAULT_PRICES) {
  const u = usage || {};
  return (
    ((u.input_tokens || 0) * prices.input +
      (u.output_tokens || 0) * prices.output +
      (u.cache_creation_input_tokens || 0) * prices.cacheWrite +
      (u.cache_read_input_tokens || 0) * prices.cacheRead) /
    1e6
  );
}

/** Estimación antes de llamar: unos 3.2 caracteres por token. */
export function estimateUnit(fields, glossaryEntries, lang, prices = DEFAULT_PRICES) {
  const chars = JSON.stringify(fields).length;
  const promptChars = buildSystemPrompt(lang).length + glossaryEntries.length * 60;
  const inTok = (chars + promptChars) / 3.2;
  const outTok = (chars / 3.2) * 1.1;
  // El gasto real de la primera prueba (5 piezas) salió ~20 % por encima de la estimación: se corrige con un margen
  return { chars, usd: ((inTok * prices.input + outTok * prices.output) / 1e6) * 1.25 };
}

// ---------------------------------------------------------------------------
// Unir las traducciones guardadas con las piezas y salas (lo usa sync-sheets.js)
// ---------------------------------------------------------------------------
/**
 * Pone campo_<idioma> en cada pieza y sala cuando hay una traducción guardada CUYA huella coincide con el texto actual
 * en español. Si el texto en español cambió, la traducción vieja se ignora (la app vuelve al español).
 * Una celda con texto en el Sheets (campo_en) manda sobre la traducción guardada: así se corrige a mano.
 */
export function applyStoredTranslations(root, pieces, rooms, langs = TRANSLATE_LANGS) {
  const baseDir = process.env.TRADUCCIONES_DIR ? path.resolve(process.env.TRADUCCIONES_DIR) : path.join(root, TRANSLATIONS_DIR);
  const result = {};
  for (const lang of langs) {
    if (!fs.existsSync(path.join(baseDir, lang))) continue;
    let applied = 0;
    let stale = 0;
    for (const [kind, list, names] of [['pieza', pieces, PIECE_FIELDS], ['sala', rooms, ROOM_FIELDS]]) {
      for (const item of list) {
        const id = unitId(kind, item);
        const file = path.join(baseDir, lang, `${kind}_${id}.json`);
        if (!fs.existsSync(file)) continue;
        let stored;
        try {
          stored = JSON.parse(fs.readFileSync(file, 'utf-8'));
        } catch {
          continue;
        }
        for (const f of names) {
          const entry = stored?.campos?.[f];
          if (!entry || isEmptyValue(item[f]) || isEmptyValue(entry.texto)) continue;
          if (entry.hash !== fieldHash(item[f])) { stale++; continue; }
          if (!isEmptyValue(item[`${f}_${lang}`])) continue; // la hoja manda
          item[`${f}_${lang}`] = entry.texto;
          applied++;
        }
      }
    }
    result[lang] = { applied, stale };
  }
  return result;
}
