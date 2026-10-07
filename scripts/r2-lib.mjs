// scripts/r2-lib.mjs
// Todo el audio vive en Cloudflare R2 (bucket "audioguias-audio"), en dos carpetas:
//   libre/<idioma>/<pieza>_<modo>.mp3   → piezas gratis: cualquiera las escucha (sin clave)
//   pago/<idioma>/<pieza>_<modo>.mp3    → piezas de pago: solo con un pase vigente
// Cambiar una pieza de gratis a pago (o al revés) es MOVER el archivo de una carpeta a la otra; no se vuelve a generar ni a pagar la voz.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export const DEFAULT_BUCKET = 'audioguias-audio';
export const GENERATED_DIR = 'audio-generado';
export const FILE_RE = /^[a-z]{2}\/[A-Za-z0-9_-]+_(corto|largo)\.mp3$/;

/** Carpeta en R2 según el tipo de pieza. premium = true → "pago". */
export const prefixFor = (premium) => (premium ? 'pago' : 'libre');
export const r2Key = (premium, rel) => `${prefixFor(premium)}/${rel}`;

/** Lista los MP3 recién generados como { file, rel }. rel = <idioma>/<pieza>_<modo>.mp3. */
export function listGeneratedFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const lang of fs.readdirSync(dir).sort()) {
    const langDir = path.join(dir, lang);
    if (!fs.statSync(langDir).isDirectory()) continue;
    for (const name of fs.readdirSync(langDir).sort()) {
      const rel = `${lang}/${name}`;
      if (FILE_RE.test(rel)) out.push({ file: path.join(langDir, name), rel });
    }
  }
  return out;
}

/** Operaciones sobre el bucket usando wrangler (la herramienta oficial de Cloudflare). `run` se puede cambiar en las pruebas. */
export function wranglerR2(bucket = process.env.R2_BUCKET || DEFAULT_BUCKET, run = execFileSync) {
  const wr = (args, stdio = ['ignore', 'ignore', 'pipe']) => run('npx', ['--yes', 'wrangler@4', 'r2', 'object', ...args, '--remote'], { stdio });
  return {
    bucket,
    put: (key, file) => wr(['put', `${bucket}/${key}`, '--file', file, '--content-type', 'audio/mpeg']),
    get: (key, file) => wr(['get', `${bucket}/${key}`, '--file', file]),
    del: (key) => wr(['delete', `${bucket}/${key}`]),
  };
}

/** Pasa un objeto de una carpeta a otra: baja, sube a la nueva, borra la vieja. Si ya estaba movido (corrida cortada a medias), lo da por bueno. */
export function moveObject(r2, fromKey, toKey, tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'r2mv-'))) {
  const tmp = path.join(tmpDir, 'x.mp3');
  try {
    r2.get(fromKey, tmp);
  } catch (e) {
    try {
      r2.get(toKey, tmp); // ¿ya está en la carpeta nueva?
      return 'ya-estaba';
    } catch {
      throw new Error(`no encontré ${fromKey} ni ${toKey} en el bucket`);
    }
  }
  r2.put(toKey, tmp);
  r2.del(fromKey);
  fs.rmSync(tmp, { force: true });
  return 'movido';
}

/**
 * Mueve en R2 los audios cuyo tipo cambió y actualiza el manifiesto de los que sí se movieron.
 * @returns {{moved: number, failed: string[]}}
 */
export function relocateInR2(moves, manifest, r2, log = console.log) {
  let moved = 0;
  const failed = [];
  for (const m of moves) {
    const rel = `${m.lang}/${m.pieceId}_${m.mode}.mp3`;
    try {
      moveObject(r2, r2Key(Boolean(m.from.remote), rel), r2Key(m.remote, rel));
      manifest.items[m.lang][m.pieceId][m.mode].remote = m.remote;
      moved++;
      log(`↪ ${rel}: ahora está en ${prefixFor(m.remote)}/`);
    } catch (e) {
      failed.push(rel);
      log(`⚠️  ${rel}: ${e.message}. Hay que regenerarlo con --forzar.`);
    }
  }
  return { moved, failed };
}
