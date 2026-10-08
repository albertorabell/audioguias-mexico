#!/usr/bin/env node
// scripts/subir-textos.mjs
//
// Sube a Cloudflare R2 los textos de pago (datos-privados/texto/<idioma>.json → texto/<idioma>.json).
// El servidor de cobro los entrega solo con un pase vigente. Los crea la sincronización (npm run sync-data).
//
//   node scripts/subir-textos.mjs --simular   → solo muestra qué subiría
//   node scripts/subir-textos.mjs             → sube de verdad (necesita CLOUDFLARE_API_TOKEN y CLOUDFLARE_ACCOUNT_ID)
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { PRIVATE_DIR } from './privado-lib.mjs';
import { wranglerR2 } from './r2-lib.mjs';

export function listTextFiles(root) {
  const dir = path.join(root, PRIVATE_DIR, 'texto');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((n) => /^[a-z]{2}\.json$/.test(n))
    .sort()
    .map((n) => ({ file: path.join(dir, n), key: `texto/${n}` }));
}

export function main({ simular = process.argv.includes('--simular'), root = process.cwd(), r2 = null, log = console.log } = {}) {
  const files = listTextFiles(root);
  if (!files.length) throw new Error('No hay textos por subir: corre antes npm run sync-data (crea datos-privados/texto/).');
  if (!files.some((f) => f.key === 'texto/es.json')) throw new Error('Falta el archivo de español (texto/es.json): no se sube nada.');
  for (const f of files) JSON.parse(fs.readFileSync(f.file, 'utf-8')); // que sean JSON válidos antes de subir nada
  if (!simular && !r2 && (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID)) {
    throw new Error('Faltan CLOUDFLARE_API_TOKEN y CLOUDFLARE_ACCOUNT_ID. Ver docs/IDIOMA_MP3_COBRO.md.');
  }
  const client = simular ? null : r2 || wranglerR2();
  log(`${simular ? 'Se subirían' : 'Subiendo'} ${files.length} archivo(s) de texto de pago a R2.`);
  for (const f of files) {
    const kb = (fs.statSync(f.file).size / 1024).toFixed(0);
    if (simular) log(`  - ${f.key}  (${kb} KB)`);
    else {
      client.put(f.key, f.file, 'application/json; charset=utf-8');
      log(`  ✓ ${f.key}  (${kb} KB)`);
    }
  }
  return { subidos: simular ? 0 : files.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (e) {
    console.error('❌ ' + e.message);
    process.exit(1);
  }
}
