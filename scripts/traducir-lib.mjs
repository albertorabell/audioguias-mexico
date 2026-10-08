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
export const LANG_NAMES = { en: 'English (US)', fr: 'French (France)', pl: 'Polish (Poland)' };
// Columna del glosario con la decisión de cada idioma
export const GLOSSARY_COLUMNS = { en: 'ingles_propuesto', fr: 'frances_propuesto', pl: 'polaco_propuesto' };
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
// plural=true: en francés un nombre que se queda igual puede llevar -s o -x al final ("les Mexicas")
const wordRe = (term, plural = false) => new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(term).replace(/['’]/g, "['’]")}${plural ? '[sx]?' : ''}(?![\\p{L}\\p{N}])`, 'iu');

/**
 * Lee glosario/glosario.csv. Devuelve entradas { es, alts, en, keep, first, check }.
 * La propiedad "en" guarda la decisión del idioma pedido (inglés o francés).
 *   keep  = el nombre se queda igual
 *   first = en inglés lleva una aclaración entre paréntesis que se usa solo la primera vez
 * Las filas "revisar" (sin decisión) se ignoran.
 */
export function loadGlossary(file, lang = 'en') {
  if (!fs.existsSync(file)) return [];
  const rows = parseCsvRows(fs.readFileSync(file, 'utf-8'));
  const head = rows.shift() || [];
  const col = (name) => head.indexOf(name);
  const iTipo = col('tipo'), iEs = col('espanol'), iEn = col(GLOSSARY_COLUMNS[lang] || GLOSSARY_COLUMNS.en);
  if (iEn < 0) return [];
  const out = [];
  for (const r of rows) {
    const tipo = (r[iTipo] || '').trim();
    const es = (r[iEs] || '').trim();
    const en = (r[iEn] || '').trim();
    if (!es || !en || tipo === 'revisar') continue;
    const alts = es.split(' / ').map((s) => s.trim()).filter(Boolean);
    const keep = (lang === 'en' && tipo === 'igual') || alts.some((a) => a.toLowerCase() === en.toLowerCase());
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
      re: alts.map((a) => wordRe(a)),
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

function buildFrenchSystemPrompt() {
  return `You are a professional translator for a museum audio-guide app about the National Museum of Anthropology (MNA) in Mexico City. You translate from Mexican Spanish into natural, polished French (France) for curious visitors who are not specialists. Address the visitor with "vous".

You receive a JSON object. Translate every value and return ONE JSON object with exactly the same keys, in the same order, and nothing else: no commentary, no code fences.

Keep the shapes identical:
- Keep the JSON keys of the object exactly as they are: never translate or rename them (for example "titulo" stays "titulo"). Only the values are translated, and the labels inside "especificaciones" as described below.
- A string stays a string.
- An array stays an array with the same number of items, in the same order.
- "especificaciones" is an object: keep the same number of entries, in the same order. Translate both the labels (keys) and the values. Use these fixed labels: Cultura = Culture; Periodo = Période; Material = Matériau; Procedencia = Provenance; Medidas = Dimensions; Región = Région; Técnica/Material = Technique/Matériau; Función = Fonction; Pueblo = Peuple; Pueblo Indígena = Peuple autochtone; Autor/Cultura = Auteur/Culture; Año = Année; Ubicación = Emplacement; Antigüedad = Âge. Translate any other label plainly.
- "faq_mito" is an object with the keys "pregunta" and "respuesta". Keep those two keys exactly as they are and translate only the values. The Spanish values begin with "Mito:" and "Realidad:"; write "Mythe :" and "Réalité :".

Spoken scripts ("guion_corto" and "guion_largo"):
- They are read aloud by a text-to-speech voice. Write flowing spoken prose: no lists, no markdown, no emojis, no parenthetical asides (except glossary terms that the glossary shows with parentheses).
- Same sentences, same information, same order. Do not add, explain, summarize or omit anything.
- Keep years and dates as digits when the source uses digits. If the source writes a number in words, write it in words. Write years without separators (1521); write other large numbers with a no-break space as the thousands separator (12 000) and a decimal comma (2,5).
- Keep metric units. Never convert to miles, feet or pounds.

All texts:
- Translate meaning faithfully, with the tone of the source: evocative but accurate. Do not invent facts.
- Never leave Spanish words in the French text, except proper names covered by the glossary.
- The glossary in the user message is mandatory: names marked KEEP stay exactly as written (keep their accents; they may take the French plural -s, for example "les Mexicas"); the others use the French given.
- A glossary French term shown with a parenthetical, such as "Voladores (Hommes volants)", gets the parenthetical only the first time it appears within the text you are translating; afterwards use the term without it.
- "Sala X" (a hall of the museum) becomes "Salle X".
- Follow the French capitalization conventions, but a glossary term keeps the capitalization the glossary gives it.
- Names of peoples used as nouns take a capital letter and agree in number ("les Mayas", "un Toltèque"); as adjectives they are lowercase and agree in gender and number ("la culture maya", "les sculptures olmèques"). Inflect the glossary form accordingly (Toltèque → toltèque, toltèques).
- Eras: "d.C." becomes "apr. J.-C." and "a.C." becomes "av. J.-C.", placed after the year or range as in the source (for example "1250-1521 d.C." becomes "1250-1521 apr. J.-C.").
- If the source spells a glossary name slightly differently from the glossary (for example "Nahui Olin" and the glossary says "Nahui Ollin"), use the glossary spelling.
- Places: the city is "Mexico", the country is "le Mexique", the state is "l’État de Mexico", the gulf is "le golfe du Mexique". Inside names the glossary marks KEEP (such as "México-Tenochtitlan") keep the accent.
- Typography: use French quotation marks « » with a no-break space inside them (« comme ceci »), a no-break space before : ; ! and ?, and the typographic apostrophe (’), never straight quotes.`;
}

function buildPolishSystemPrompt() {
  return `You are a professional translator for a museum audio-guide app about the National Museum of Anthropology (MNA) in Mexico City. You translate from Mexican Spanish into natural, polished Polish (Poland) for curious visitors who are not specialists. Address the visitor directly in the informal second person singular ("ty", lowercase), because the Spanish source addresses the visitor with "tú".

You receive a JSON object. Translate every value and return ONE JSON object with exactly the same keys, in the same order, and nothing else: no commentary, no code fences.

Keep the shapes identical:
- Keep the JSON keys of the object exactly as they are: never translate or rename them (for example "titulo" stays "titulo"). Only the values are translated, and the labels inside "especificaciones" as described below.
- A string stays a string.
- An array stays an array with the same number of items, in the same order.
- "especificaciones" is an object: keep the same number of entries, in the same order. Translate both the labels (keys) and the values. Use these fixed labels: Cultura = Kultura; Periodo = Okres; Material = Materiał; Procedencia = Pochodzenie; Medidas = Wymiary; Región = Region; Técnica/Material = Technika/Materiał; Función = Funkcja; Pueblo = Lud; Pueblo Indígena = Lud tubylczy; Autor/Cultura = Autor/Kultura; Año = Rok; Ubicación = Lokalizacja; Antigüedad = Wiek. Translate any other label plainly.
- "faq_mito" is an object with the keys "pregunta" and "respuesta". Keep those two keys exactly as they are and translate only the values. The Spanish values begin with "Mito:" and "Realidad:"; write "Mit:" and "Rzeczywistość:".

Spoken scripts ("guion_corto" and "guion_largo"):
- They are read aloud by a text-to-speech voice. Write flowing spoken prose: no lists, no markdown, no emojis, no parenthetical asides (except glossary terms that the glossary shows with parentheses).
- Same sentences, same information, same order. Do not add, explain, summarize or omit anything.
- Keep years and dates as digits when the source uses digits. If the source writes a number in words, write it in words. Write years without separators (1521); write other large numbers with a no-break space as the thousands separator (12 000) and a decimal comma (2,5).
- Keep metric units. Never convert to miles, feet or pounds.

All texts:
- Translate meaning faithfully, with the tone of the source: evocative but accurate. Do not invent facts.
- Never leave Spanish words in the Polish text, except proper names covered by the glossary.
- The glossary in the user message is mandatory: names marked KEEP stay exactly as written (keep their accents) but you MUST inflect them by case according to Polish grammar when the sentence needs it (for example "Quetzalcóatl" → "Quetzalcóatla", "w Teotihuacán"); the others use the Polish given, inflected by case and number as needed. Peoples given in the glossary in the nominative plural (for example "Majowie") are inflected normally ("Majów", "Majom", "kultura Majów"; adjective forms such as "majski" are fine when natural).
- A glossary Polish term shown with a parenthetical, such as "Voladores (Latający Ludzie)", gets the parenthetical only the first time it appears within the text you are translating; afterwards use the term without it.
- "Sala X" (a hall of the museum) becomes "Sala X".
- Eras: "d.C." becomes "n.e." and "a.C." becomes "p.n.e.", placed after the year or range as in the source (for example "1250-1521 d.C." becomes "1250-1521 n.e.").
- If the source spells a glossary name slightly differently from the glossary (for example "Nahui Olin" and the glossary says "Nahui Ollin"), use the glossary spelling.
- Places: the country is "Meksyk", the city is "Miasto Meksyk", the state is "Stan Meksyk", the gulf is "Zatoka Meksykańska". Inside names the glossary marks KEEP (such as "México-Tenochtitlan") keep the accent.
- Typography: use Polish quotation marks („ ”) and the typographic apostrophe (’), never straight quotes.`;
}

export function buildSystemPrompt(lang) {
  const name = LANG_NAMES[lang];
  if (!name) throw new Error(`Todavía no hay reglas ni glosario para el idioma "${lang}".`);
  if (lang === 'fr') return buildFrenchSystemPrompt();
  if (lang === 'pl') return buildPolishSystemPrompt();
  return `You are a professional translator for a museum audio-guide app about the National Museum of Anthropology (MNA) in Mexico City. You translate from Mexican Spanish into natural, polished ${name} for curious visitors who are not specialists.

You receive a JSON object. Translate every value and return ONE JSON object with exactly the same keys, in the same order, and nothing else: no commentary, no code fences.

Keep the shapes identical:
- Keep the JSON keys of the object exactly as they are: never translate or rename them (for example "titulo" stays "titulo"). Only the values are translated, and the labels inside "especificaciones" as described below.
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
- Use the standard English forms of people and culture names, never the Spanish plural or ending: "the Maya", "the Nahua", "a Toltec ruler", "Olmec art", "Zapotec", "Mixtec", "Totonac", "Teotihuacán culture". Proper names that the glossary marks KEEP stay as written.
- Write "Mexico" without an accent in English (for example "State of Mexico", "Mexico City"), except inside names the glossary marks KEEP (such as "México-Tenochtitlan").
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

/** Saca el PRIMER objeto JSON completo de la respuesta, aunque venga con ``` o con texto (incluso con llaves) antes o después. */
export function parseJsonReply(text) {
  const s = String(text || '');
  const a = s.indexOf('{');
  if (a < 0) throw new Error('la respuesta no trae un objeto JSON');
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = a; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return JSON.parse(s.slice(a, i + 1));
  }
  const b = s.lastIndexOf('}');
  if (b <= a) throw new Error('la respuesta no trae un objeto JSON');
  return JSON.parse(s.slice(a, b + 1));
}

/**
 * A veces el traductor "traduce" el nombre de un campo (titulo → titre). Si hay el mismo número de campos y los que sobran
 * y los que faltan son los mismos en cantidad, se renombran por posición (la respuesta debe llevar los campos en el mismo orden).
 */
export function alignKeys(source, out) {
  if (!out || typeof out !== 'object' || Array.isArray(out)) return out;
  const want = Object.keys(source);
  const got = Object.keys(out);
  const unknown = got.filter((k) => !want.includes(k));
  const missing = want.filter((k) => !got.includes(k));
  // Trae todos los campos pedidos y además uno inventado (p. ej. "titre" de más): se descarta el sobrante
  if (!missing.length && unknown.length) return Object.fromEntries(want.map((k) => [k, out[k]]));
  if (want.length !== got.length || !unknown.length || unknown.length !== missing.length) return out;
  const fixed = {};
  got.forEach((k, i) => {
    fixed[want.includes(k) ? k : want[i]] = out[k];
  });
  return Object.keys(fixed).length === want.length && want.every((k) => k in fixed) ? fixed : out;
}

// ---------------------------------------------------------------------------
// Revisiones automáticas
// ---------------------------------------------------------------------------
const ES_STOPWORDS = new Set(['el', 'la', 'los', 'las', 'de', 'del', 'que', 'y', 'en', 'un', 'una', 'con', 'por', 'para', 'se', 'su', 'sus', 'es', 'al', 'como', 'más', 'pero', 'esta', 'este', 'estos', 'estas']);
const words = (s) => (String(s).toLowerCase().match(/\p{L}+/gu) || []);

// El francés comparte "de", "la", "en", "un", "que", "se", "y": para ese idioma solo cuentan las palabras que NO existen en francés
const ES_ONLY_STOPWORDS = new Set(['el', 'los', 'las', 'del', 'una', 'con', 'por', 'para', 'su', 'sus', 'al', 'como', 'más', 'pero', 'esta', 'este', 'estos', 'estas', 'fue', 'son', 'han', 'sido', 'también', 'donde']);

function spanishRatio(text, lang = 'en') {
  const w = words(text);
  if (!w.length) return 0;
  const set = lang === 'fr' || lang === 'pl' ? ES_ONLY_STOPWORDS : ES_STOPWORDS;
  // Solo cuentan las palabras escritas en minúscula: "El Tajín" o "El Zapotal" son nombres propios, no español sin traducir
  const lower = (String(text).match(/\p{L}+/gu) || []).filter((x) => x === x.toLowerCase());
  const hits = lower.filter((x) => set.has(x)).length;
  // Con menos de 3 palabras de español no es una señal confiable (fichas cortas con nombres como "Ignacio de la Llave")
  return hits < 3 ? 0 : hits / w.length;
}

const strings = (v) => (typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : []);

/**
 * Compara el texto en español con la traducción.
 * errors  → la traducción NO se guarda.
 * warnings → se guarda, pero queda anotado para que alguien la revise.
 * Con fake=true (proveedor de prueba) solo se revisa la forma, no el idioma.
 */
export function validateTranslation(source, out, glossaryEntries = [], { fake = false, lang = 'en' } = {}) {
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
      if (spanishRatio(oText, lang) > 0.08) errors.push(`${f}: parece que quedó texto en español`);
    }

    // En francés los miles llevan espacio y los decimales coma: se comparan solo los dígitos
    const flat = lang === 'fr' || lang === 'pl' ? (t) => t.replace(/(?<=\d)[\s\u00a0\u202f.,](?=\d)/g, '') : (t) => t;
    const digitsIn = (sText.match(/\d[\d.,]*/g) || []).map((d) => d.replace(/[.,]+$/, ''));
    const oFlat = flat(oText);
    const lost = [...new Set(digitsIn)].filter((d) => !oFlat.includes(flat(d)));
    if (lost.length) warn(f, `no encuentro estos números del español: ${lost.join(', ')}`);

    const pl = lang === 'fr';
    const passes = (g) => (g.keep ? wordRe(g.base, pl).test(oText) : wordRe(g.base, pl).test(oText) || g.alts.some((a) => wordRe(a, pl).test(oText)));
    // En polaco los nombres cambian de forma según la frase (casos gramaticales): la revisión palabra por palabra no sirve y se omite
    for (const g of lang === 'pl' ? [] : glossaryEntries) {
      if (!g.check || !g.re.some((re) => re.test(sText))) continue;
      if (passes(g)) continue;
      // Un mismo término en español puede tener dos filas (p. ej. "Nahuas": pueblo y sala): basta con que se cumpla una
      if (glossaryEntries.some((h) => h !== g && h.es === g.es && passes(h))) continue;
      warn(f, `el glosario pide "${g.base}" para "${g.es}" y no aparece`);
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
  // Medido en la prueba real (5 piezas): el inglés sale a ~0.5 tokens por carácter del español.
  // El francés (20 % más) y el polaco (60 % más, el polaco gasta más tokens por letra) NO están medidos: son suposiciones hasta tener una corrida real.
  const outTok = chars * (lang === 'pl' ? 0.8 : lang === 'fr' ? 0.6 : 0.5);
  // Margen 1.28: en la corrida real de 56 unidades el costo salió 16 % arriba de lo estimado con 1.1
  return { chars, usd: ((inTok * prices.input + outTok * prices.output) / 1e6) * 1.28 };
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
