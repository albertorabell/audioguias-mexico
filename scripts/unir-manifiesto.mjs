#!/usr/bin/env node
// scripts/unir-manifiesto.mjs
// Junta dos listas de audios (manifiestos) sin pelear: toma la que está ahora en public/audio/manifest.json (la más nueva del repositorio),
// le pone encima las entradas de "mi" lista y le quita las que digan "quitar".
//   node scripts/unir-manifiesto.mjs <mi_manifiesto.json> [<quitar.json>]      (quitar = lista de "idioma/pieza/modo")
import fs from 'node:fs';

export function unir(base, mio, quitar = []) {
  const out = { version: 1, items: {} };
  for (const src of [base, mio]) {
    for (const [lang, piezas] of Object.entries(src?.items || {})) {
      for (const [id, modos] of Object.entries(piezas)) {
        for (const [modo, e] of Object.entries(modos)) {
          ((out.items[lang] ||= {})[id] ||= {})[modo] = e;
        }
      }
    }
  }
  for (const k of quitar) {
    const [lang, id, modo] = k.split('/');
    if (out.items[lang]?.[id]) {
      delete out.items[lang][id][modo];
      if (!Object.keys(out.items[lang][id]).length) delete out.items[lang][id];
    }
  }
  const sorted = { version: 1, items: {} };
  for (const lang of Object.keys(out.items).sort()) {
    sorted.items[lang] = {};
    for (const id of Object.keys(out.items[lang]).sort()) sorted.items[lang][id] = out.items[lang][id];
  }
  return sorted;
}

if (process.argv[1] && process.argv[1].endsWith('unir-manifiesto.mjs')) {
  const F = 'public/audio/manifest.json';
  const read = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf-8')) : { items: {} });
  const mio = read(process.argv[2]);
  const quitar = process.argv[3] && fs.existsSync(process.argv[3]) ? JSON.parse(fs.readFileSync(process.argv[3], 'utf-8')) : [];
  fs.writeFileSync(F, JSON.stringify(unir(read(F), mio, quitar), null, 2) + '\n', 'utf-8');
}
