#!/usr/bin/env node
// scripts/subir-audio.mjs
//
// Sube a Cloudflare R2 los MP3 recién generados (carpeta audio-generado/), cada uno a su carpeta:
// libre/ (piezas gratis) o pago/ (piezas de pago), según public/audio/manifest.json.
// También borra de la carpeta contraria las copias viejas de piezas que cambiaron de tipo (audio-generado/_borrar.json).
//
//   node scripts/subir-audio.mjs --simular   → solo muestra qué subiría
//   node scripts/subir-audio.mjs             → sube de verdad (necesita CLOUDFLARE_API_TOKEN y CLOUDFLARE_ACCOUNT_ID)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GENERATED_DIR, listGeneratedFiles, r2Key, wranglerR2 } from './r2-lib.mjs';

/** Decide la llave en R2 de cada archivo. Un archivo que el manifiesto no conoce NO se sube (no sabríamos si es gratis o de pago). */
export function planUpload(files, manifest) {
  const ups = [];
  const unknown = [];
  for (const { file, rel } of files) {
    const [lang, name] = rel.split('/');
    const m = name.match(/^(.+)_(corto|largo)\.mp3$/);
    const e = manifest?.items?.[lang]?.[m[1]]?.[m[2]];
    if (!e) unknown.push(rel);
    else ups.push({ file, rel, key: r2Key(Boolean(e.remote), rel) });
  }
  return { ups, unknown };
}

export function readDeleteList(dir) {
  const f = path.join(dir, '_borrar.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf-8')) : [];
}

export function main({ simular = process.argv.includes('--simular'), root = process.cwd(), r2 = null, log = console.log } = {}) {
  const dir = path.join(root, GENERATED_DIR);
  const manifestFile = path.join(root, 'public/audio/manifest.json');
  const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf-8')) : { items: {} };
  const { ups, unknown } = planUpload(listGeneratedFiles(dir), manifest);
  const borrar = readDeleteList(dir);
  if (unknown.length) throw new Error(`Estos audios no están en el manifiesto y no se suben: ${unknown.join(', ')}`);
  if (!ups.length && !borrar.length) {
    log(`No hay audios por subir (la carpeta ${GENERATED_DIR}/ está vacía o no existe).`);
    return { subidos: 0, borrados: 0 };
  }
  if (!simular && !r2 && (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID)) {
    throw new Error('Faltan CLOUDFLARE_API_TOKEN y CLOUDFLARE_ACCOUNT_ID. Ver docs/IDIOMA_MP3_COBRO.md.');
  }
  const client = simular ? null : r2 || wranglerR2();
  log(`${simular ? 'Se subirían' : 'Subiendo'} ${ups.length} audio(s) a R2 (${ups.filter((u) => u.key.startsWith('libre/')).length} libres, ${ups.filter((u) => u.key.startsWith('pago/')).length} de pago).`);
  let done = 0;
  for (const u of ups) {
    if (simular) log(`  - ${u.key}  (${(fs.statSync(u.file).size / 1024).toFixed(0)} KB)`);
    else {
      client.put(u.key, u.file);
      done++;
      if (done % 10 === 0 || done === ups.length) log(`  ${done}/${ups.length} subidos`);
    }
  }
  let borrados = 0;
  for (const key of borrar) {
    if (simular) log(`  - borraría la copia vieja ${key}`);
    else {
      try {
        client.del(key);
        borrados++;
      } catch {
        log(`  (la copia vieja ${key} ya no estaba)`);
      }
    }
  }
  if (!simular) fs.rmSync(path.join(dir, '_borrar.json'), { force: true });
  return { subidos: done, borrados };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (e) {
    console.error('❌ ' + e.message);
    process.exit(1);
  }
}
