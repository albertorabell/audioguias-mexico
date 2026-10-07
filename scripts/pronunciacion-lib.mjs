// scripts/pronunciacion-lib.mjs
//
// Lista de pronunciaciones (glosario/pronunciacion.csv) para las voces de Azure: arregla palabras que la voz lee mal
// ("Mexica" como "Mechica") sin cambiar el texto que se ve en pantalla.

import fs from 'node:fs';

export const PRONUNCIATION_FILE = 'glosario/pronunciacion.csv';

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
    if (!e.lang || !e.word || !e.value || !['alias', 'ipa'].includes(e.kind)) continue;
    if (lang && e.lang !== lang) continue;
    out.push(e);
  }
  return out;
}

/** Elemento SSML de una pronunciación. */
export function pronunciationElement(kind, value, original) {
  return kind === 'ipa'
    ? `<phoneme alphabet="ipa" ph="${xmlEscape(value)}">${xmlEscape(original)}</phoneme>`
    : `<sub alias="${xmlEscape(value)}">${xmlEscape(original)}</sub>`;
}

/** Texto → contenido SSML (escapado), con las pronunciaciones aplicadas a palabras completas. Sin lista = solo escapa. */
export function toSsmlInner(text, entries = []) {
  if (!entries.length) return xmlEscape(text);
  const byWord = new Map(entries.map((e) => [e.word.toLowerCase(), e]));
  const words = [...byWord.keys()].sort((a, b) => b.length - a.length);
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(${words.map(escapeRe).join('|')})(?![\\p{L}\\p{N}])`, 'giu');
  let out = '';
  let last = 0;
  for (const m of text.matchAll(re)) {
    out += xmlEscape(text.slice(last, m.index));
    const e = byWord.get(m[1].toLowerCase());
    out += pronunciationElement(e.kind, e.value, m[1]);
    last = m.index + m[1].length;
  }
  return out + xmlEscape(text.slice(last));
}
