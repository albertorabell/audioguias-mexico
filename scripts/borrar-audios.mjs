#!/usr/bin/env node
// scripts/borrar-audios.mjs
//
// Borra de Cloudflare R2 TODOS los MP3 que lista public/audio/manifest.json y deja el manifiesto vacío.
// Se usa cuando los textos cambiaron tanto que las voces viejas ya no corresponden (la app vuelve a la voz del teléfono hasta regenerarlas).
// No se puede deshacer: para tener voz otra vez hay que volver a generar los audios (gasta voz).
//
//   node scripts/borrar-audios.mjs --simular   → solo muestra qué borraría
//   node scripts/borrar-audios.mjs             → borra de verdad (necesita CLOUDFLARE_API_TOKEN y CLOUDFLARE_ACCOUNT_ID)
//
// Si algún archivo no se pudo borrar, el manifiesto conserva ESA entrada para poder repetir el botón sin perder la cuenta.
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DEFAULT_BUCKET, r2Key } from './r2-lib.mjs';

/** Todas las llaves de R2 que el manifiesto dice que existen: [{ lang, pieceId, mode, key }]. */
export function keysFromManifest(manifest) {
  const out = [];
  for (const [lang, pieces] of Object.entries(manifest?.items || {})) {
    for (const [pieceId, modes] of Object.entries(pieces || {})) {
      for (const [mode, e] of Object.entries(modes || {})) {
        if (!e?.file) continue;
        out.push({ lang, pieceId, mode, key: r2Key(Boolean(e.remote), e.file) });
      }
    }
  }
  return out;
}

/** Un error de "ese archivo ya no existe" cuenta como borrado (lo que queremos es que no esté). */
export const isGone = (msg) => /not exist|nosuchkey|not found|404|10007/i.test(String(msg || ''));

/** Cliente de R2 asíncrono (wrangler) para borrar de a varios a la vez. */
export function wranglerR2Async(bucket = process.env.R2_BUCKET || DEFAULT_BUCKET) {
  return {
    bucket,
    del: (key) =>
      new Promise((resolve, reject) => {
        execFile('npx', ['--yes', 'wrangler@4', 'r2', 'object', 'delete', `${bucket}/${key}`, '--remote'], { encoding: 'utf-8' }, (err, _out, stderr) => {
          if (err) reject(new Error(`${stderr || ''} ${err.message}`.trim()));
          else resolve();
        });
      }),
  };
}

/** Corre `fn` sobre cada elemento con a lo más `n` al mismo tiempo. */
async function pool(items, n, fn) {
  let i = 0;
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) {
      const item = items[i++];
      await fn(item);
    }
  });
  await Promise.all(workers);
}

export async function main({ simular = process.argv.includes('--simular'), root = process.cwd(), r2 = null, log = console.log, concurrencia = 8 } = {}) {
  const manifestFile = path.join(root, 'public/audio/manifest.json');
  const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf-8')) : { version: 1, items: {} };
  const keys = keysFromManifest(manifest);
  if (!keys.length) {
    log('El manifiesto ya está vacío: no hay audios que borrar.');
    return { borrados: 0, yaNoEstaban: 0, fallaron: [] };
  }
  const porLang = {};
  for (const k of keys) porLang[k.lang] = (porLang[k.lang] || 0) + 1;
  log(`${simular ? 'Se borrarían' : 'Borrando'} ${keys.length} audio(s) de R2: ${Object.entries(porLang).map(([l, n]) => `${l} ${n}`).join(', ')}.`);
  if (simular) return { borrados: 0, yaNoEstaban: 0, fallaron: [], simulado: keys.length };
  if (!r2 && (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID)) {
    throw new Error('Faltan CLOUDFLARE_API_TOKEN y CLOUDFLARE_ACCOUNT_ID. No se borró nada.');
  }
  const client = r2 || wranglerR2Async();
  let borrados = 0;
  let yaNoEstaban = 0;
  const fallaron = [];
  let hechos = 0;
  await pool(keys, concurrencia, async (k) => {
    try {
      await client.del(k.key);
      borrados++;
    } catch (e) {
      if (isGone(e.message)) yaNoEstaban++;
      else {
        fallaron.push(k);
        log(`⚠️  ${k.key}: ${String(e.message).split('\n')[0]}`);
      }
    }
    hechos++;
    if (hechos % 50 === 0 || hechos === keys.length) log(`  ${hechos}/${keys.length}`);
  });
  // El manifiesto conserva solo lo que no se pudo borrar (para repetir el botón); lo demás ya no existe.
  const quedan = { version: manifest.version ?? 1, items: {} };
  for (const k of fallaron) {
    quedan.items[k.lang] ??= {};
    quedan.items[k.lang][k.pieceId] ??= {};
    quedan.items[k.lang][k.pieceId][k.mode] = manifest.items[k.lang][k.pieceId][k.mode];
  }
  fs.writeFileSync(manifestFile, JSON.stringify(quedan, null, 2) + '\n');
  log(`Listo: ${borrados} borrados, ${yaNoEstaban} que ya no estaban, ${fallaron.length} que fallaron.`);
  if (fallaron.length) throw new Error(`No se pudieron borrar ${fallaron.length} audio(s); siguen en el manifiesto. Vuelve a correr el botón.`);
  return { borrados, yaNoEstaban, fallaron };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error('❌ ' + e.message);
    process.exit(1);
  });
}
