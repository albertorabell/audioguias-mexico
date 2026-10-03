#!/usr/bin/env node
// scripts/subir-audio-premium.mjs
//
// Sube los MP3 de las piezas de PAGO (carpeta audio-premium/) al servidor de audio (Cloudflare R2).
// Ahí los entrega el servidor de cobro solo a quien tiene un pase vigente.
//
//   node scripts/subir-audio-premium.mjs --simular     → solo muestra qué subiría
//   node scripts/subir-audio-premium.mjs               → sube de verdad (necesita CLOUDFLARE_API_TOKEN y CLOUDFLARE_ACCOUNT_ID)
//
// Variable opcional: R2_BUCKET (por defecto "audioguias-audio", el mismo de pagos/wrangler.toml).

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const FILE_RE = /^[a-z]{2}\/[A-Za-z0-9_-]+_(corto|largo)\.mp3$/;

/** Lista los MP3 de la carpeta como { file, key }. key = <idioma>/<pieza>_<modo>.mp3 (así los pide el servidor de audio). */
export function listPremiumFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const lang of fs.readdirSync(dir).sort()) {
    const langDir = path.join(dir, lang);
    if (!fs.statSync(langDir).isDirectory()) continue;
    for (const name of fs.readdirSync(langDir).sort()) {
      const key = `${lang}/${name}`;
      if (!FILE_RE.test(key)) continue; // ignora cualquier archivo que no sea un MP3 de pieza
      out.push({ file: path.join(langDir, name), key });
    }
  }
  return out;
}

function main() {
  const simular = process.argv.includes('--simular');
  const bucket = process.env.R2_BUCKET || 'audioguias-audio';
  const files = listPremiumFiles(path.resolve(process.cwd(), 'audio-premium'));
  if (!files.length) {
    console.log('No hay audios de pago por subir (la carpeta audio-premium/ está vacía o no existe).');
    return;
  }
  if (!simular && (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID)) {
    throw new Error('Faltan CLOUDFLARE_API_TOKEN y CLOUDFLARE_ACCOUNT_ID. Ver docs/IDIOMA_MP3_COBRO.md.');
  }
  console.log(`${simular ? 'Se subirían' : 'Subiendo'} ${files.length} audio(s) de pago al bucket "${bucket}".`);
  let done = 0;
  for (const { file, key } of files) {
    if (simular) {
      console.log(`  - ${key}  (${(fs.statSync(file).size / 1024).toFixed(0)} KB)`);
      continue;
    }
    execFileSync('npx', ['--yes', 'wrangler@4', 'r2', 'object', 'put', `${bucket}/${key}`, '--file', file, '--content-type', 'audio/mpeg', '--remote'], {
      stdio: ['ignore', 'ignore', 'inherit'],
    });
    done++;
    if (done % 10 === 0 || done === files.length) console.log(`  ${done}/${files.length} subidos`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
