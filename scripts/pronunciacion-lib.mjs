// scripts/pronunciacion-lib.mjs
//
// Lista de pronunciaciones (glosario/pronunciacion.csv) para las voces de Azure: arregla palabras que la voz lee mal
// ("Mexica" como "Mechica") sin cambiar el texto que se ve en pantalla.

import fs from 'node:fs';

export const PRONUNCIATION_FILE = 'glosario/pronunciacion.csv';
// alias: se lee como otro texto · ipa: fonética (el español de México NO tiene el sonido "sh") ·
// lang: "en-US=texto", cambia el idioma de la palabra (solo voces multilingües) ·
// voz: "en-US-AvaMultilingualNeural=texto", una voz distinta lee solo esa palabra
export const KINDS = ['alias', 'ipa', 'lang', 'voz'];

export const xmlEscape = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

/** Lee el archivo. Devuelve [{ lang, word, kind: 'alias'|'ipa', value }]. Ignora comentarios (#), filas vacías y tipos desconocidos. */
export function loadPronunciations(file, lang = null) {
  if (!fs.existsSync(file)) return [];
  const lines = fs.readFileSync(file, 'utf-8').replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#'));
  const head = parseCsvLine(lines.shift() || '').map((h) => h.trim());
  const col = (n) => head.indexOf(n);
  const [iL, iW, iT, iV] = ['idioma', 'palabra', 'tipo', 'valor'].map(col);
  if ([iL, iW, iT, iV].some((i) => i < 0)) return [];
  const out = [];
  for (const l of lines) {
    const r = parseCsvLine(l);
    const e = { lang: (r[iL] || '').trim(), word: (r[iW] || '').trim(), kind: (r[iT] || '').trim(), value: (r[iV] || '').trim() };
    if (!e.lang || !e.word || !e.value || !KINDS.includes(e.kind)) continue;
    if (lang && e.lang !== lang) continue;
    out.push(e);
  }
  return out;
}

/** Elemento SSML de una pronunciación. Para "voz" hace falta el nombre de la voz principal (se cierra y se vuelve a abrir). */
export function pronunciationElement(kind, value, original, outerVoice = null) {
  if (kind === 'ipa') return `<phoneme alphabet="ipa" ph="${xmlEscape(value)}">${xmlEscape(original)}</phoneme>`;
  if (kind === 'lang' || kind === 'voz') {
    const i = value.indexOf('=');
    if (i < 1 || i === value.length - 1) throw new Error(`Pronunciación "${kind}" mal escrita: "${value}" (usa ${kind === 'lang' ? 'en-US=texto' : 'NombreDeVoz=texto'})`);
    const target = value.slice(0, i).trim();
    const said = xmlEscape(value.slice(i + 1).trim());
    if (kind === 'lang') return `<lang xml:lang="${xmlEscape(target)}">${said}</lang>`;
    if (!outerVoice) throw new Error('Una pronunciación de tipo "voz" necesita saber cuál es la voz principal.');
    return `</voice><voice name="${xmlEscape(target)}">${said}</voice><voice name="${xmlEscape(outerVoice)}">`;
  }
  return `<sub alias="${xmlEscape(value)}">${xmlEscape(original)}</sub>`;
}

/** Texto → contenido SSML (escapado), con las pronunciaciones aplicadas a palabras completas. Sin lista = solo escapa. */
export function toSsmlInner(text, entries = [], outerVoice = null) {
  if (!entries.length) return xmlEscape(text);
  const byWord = new Map(entries.map((e) => [e.word.toLowerCase(), e]));
  const words = [...byWord.keys()].sort((a, b) => b.length - a.length);
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(${words.map(escapeRe).join('|')})(?![\\p{L}\\p{N}])`, 'giu');
  let out = '';
  let last = 0;
  for (const m of text.matchAll(re)) {
    out += xmlEscape(text.slice(last, m.index));
    const e = byWord.get(m[1].toLowerCase());
    out += pronunciationElement(e.kind, e.value, m[1], outerVoice);
    last = m.index + m[1].length;
  }
  return out + xmlEscape(text.slice(last));
}
