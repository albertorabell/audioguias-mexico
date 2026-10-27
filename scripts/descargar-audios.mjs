// Baja de Cloudflare R2 todos los MP3 de UN idioma (para tener una copia local). Los deja en audios-descarga/<idioma>/ y revisa que cada
// archivo pese lo mismo que dice el manifiesto.  Uso:  node scripts/descargar-audios.mjs --lang es
// Necesita CLOUDFLARE_API_TOKEN y CLOUDFLARE_ACCOUNT_ID (los mismos del respaldo semanal).
import fs from 'node:fs';
import path from 'node:path';
import { wranglerR2, r2Key } from './r2-lib.mjs';

export const SALIDA = 'audios-descarga';

/** Lista de archivos del manifiesto para un idioma: {key (en R2), rel (nombre), bytes}. */
export function listaDeAudios(manifest, lang) {
  const out = [];
  for (const [pieceId, modos] of Object.entries(manifest?.items?.[lang] || {})) {
    for (const entry of Object.values(modos)) {
      if (!entry?.file) continue;
      out.push({ key: r2Key(Boolean(entry.remote), entry.file), rel: entry.file, bytes: Number(entry.bytes) || 0, pieceId });
    }
  }
  return out.sort((a, b) => a.rel.localeCompare(b.rel));
}

async function main() {
  const i = process.argv.indexOf('--lang');
  const lang = i > -1 ? process.argv[i + 1] : '';
  if (!/^[a-z]{2}$/.test(lang)) throw new Error('Indica el idioma: --lang es|en|fr|pl');
  const manifest = JSON.parse(fs.readFileSync('public/audio/manifest.json', 'utf-8'));
  const lista = listaDeAudios(manifest, lang);
  if (!lista.length) throw new Error(`El manifiesto no tiene audios en ${lang}.`);
  const r2 = wranglerR2();
  const dir = path.join(SALIDA, lang);
  fs.mkdirSync(dir, { recursive: true });
  const fallos = [];
  let hechos = 0;
  const cola = [...lista];
  const t0 = Date.now();
  async function obrero() {
    while (cola.length) {
      const a = cola.shift();
      const destino = path.join(SALIDA, a.rel);
      fs.mkdirSync(path.dirname(destino), { recursive: true });
      try {
        for (let intento = 1; ; intento++) {
          try {
            r2.get(a.key, destino);
            break;
          } catch (e) {
            if (intento >= 3) throw e;
          }
        }
        const real = fs.statSync(destino).size;
        if (a.bytes && real !== a.bytes) throw new Error(`pesa ${real} bytes y el manifiesto dice ${a.bytes}`);
        hechos++;
        if (hechos % 25 === 0) console.log(`  … ${hechos}/${lista.length} (${Math.round((Date.now() - t0) / 60000)} min)`);
      } catch (e) {
        fallos.push(`${a.rel}: ${String(e.message).split('\n')[0]}`);
      }
    }
  }
  await Promise.all(Array.from({ length: 4 }, obrero));
  const mb = lista.reduce((s, a) => s + a.bytes, 0) / 1e6;
  console.log(`Descargados ${hechos}/${lista.length} audios (${mb.toFixed(0)} MB) del idioma ${lang}.`);
  if (fallos.length) {
    for (const f of fallos.slice(0, 20)) console.error(`  ✗ ${f}`);
    throw new Error(`${fallos.length} audio(s) no se pudieron bajar o no pesan lo esperado.`);
  }
}

import { pathToFileURL } from 'node:url';
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(`❌ ${e.message}`);
    process.exit(1);
  });
}
