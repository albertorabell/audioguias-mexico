// Respaldo semanal. Corre en GitHub (workflow "Respaldo semanal") después de sincronizar los datos.
//   --textos   escribe TODOS los textos (todos los idiomas) en el Sheet "RESPALDO - Textos todos los idiomas" de Drive
//   --archivo  guarda un .tar.gz (textos, traducciones, imágenes y datos) en el bucket de respaldo de R2
//   --audio    copia a R2 (bucket de respaldo) los MP3 que aún no estén respaldados
// Nunca borra ni cambia nada del bucket principal ni de los Sheets de trabajo.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { readFullPieces } from './privado-lib.mjs';
import { cargarSitios } from './sitios-lib.mjs';
import { reemplazarPestana } from './google-sheets-lib.mjs';
import { DEFAULT_BUCKET, r2Key } from './r2-lib.mjs';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const BUCKET_RESPALDO = process.env.R2_BUCKET_RESPALDO || 'audioguias-respaldo';
export const SHEET_RESPALDO = process.env.RESPALDO_SHEET_ID || '1Ddn0nZbpTDkXcr0s0__Q9KIDrYiRohHmXTcHH0jNxvE';
const LIMITE_CELDA = 45000;
const IDIOMAS = ['en', 'fr', 'pl'];

const flag = (n) => process.argv.includes('--' + n);
const wr = (args, opts = {}) => run('npx', ['--yes', 'wrangler@4', ...args, '--remote'], { maxBuffer: 1 << 26, ...opts });
const log = (m) => console.log(m);

/** Convierte un objeto (pieza o sala) en filas [tipo, id, campo, idioma, texto] con sus campos de texto. */
export function filasDeTexto(tipo, id, obj) {
  const filas = [];
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v !== 'string' || !v.trim()) continue;
    const m = k.match(/^(.*)_(en|fr|pl)$/);
    const campo = m ? m[1] : k;
    const idioma = m ? m[2] : 'es';
    const texto = v.length > LIMITE_CELDA ? v.slice(0, LIMITE_CELDA) + ' […cortado por límite de celda]' : v;
    filas.push([tipo, id, campo, idioma, texto]);
  }
  return filas;
}

export async function recogerTextos(root = ROOT) {
  const sitios = await cargarSitios();
  const sitioDe = (id) => sitios.find((s) => s.prefijo && String(id).startsWith(s.prefijo))?.site_id || '';
  const filas = [];
  for (const p of readFullPieces(root)) for (const f of filasDeTexto('pieza', p.piece_id, p)) filas.push([sitioDe(p.piece_id), ...f]);
  const salasDe = [['mna', 'public/data/rooms.json'], ...sitios.filter((s) => s.site_id !== 'mna').map((s) => [s.site_id, `public/data/${s.site_id}/rooms.json`])];
  for (const [site, rel] of salasDe) {
    const f = path.join(root, rel);
    if (!fs.existsSync(f)) continue;
    for (const r of JSON.parse(fs.readFileSync(f, 'utf-8'))) for (const x of filasDeTexto('sala', r.room_id, r)) filas.push([site, ...x]);
  }
  return filas;
}

async function respaldarTextosEnDrive() {
  const filas = await recogerTextos();
  if (filas.length < 50) throw new Error(`Solo se encontraron ${filas.length} textos: algo salió mal, no se sobrescribe el respaldo.`);
  const fecha = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
  await reemplazarPestana(SHEET_RESPALDO, 'TEXTOS', [['sitio', 'tipo', 'id', 'campo', 'idioma', `texto (respaldo del ${fecha})`], ...filas]);
  const porIdioma = Object.fromEntries(['es', ...IDIOMAS].map((l) => [l, filas.filter((f) => f[4] === l).length]));
  log(`✅ Textos respaldados en Drive: ${filas.length} (${Object.entries(porIdioma).map(([l, n]) => `${l}: ${n}`).join(', ')}).`);
  console.log(`::notice title=Respaldo de textos en Drive::${filas.length} textos (${Object.entries(porIdioma).map(([l, n]) => `${l}: ${n}`).join(', ')})`);
}

async function asegurarBucket() {
  try {
    await wr(['r2', 'bucket', 'create', BUCKET_RESPALDO]);
    log(`🪣 Bucket ${BUCKET_RESPALDO} creado.`);
  } catch (e) {
    const msg = String(e.stderr || '') + String(e.stdout || '') + String(e.message || '');
    if (!/already exists|10004/i.test(msg)) throw new Error(`No se pudo crear/usar el bucket ${BUCKET_RESPALDO}: ${msg.split('\n').find((l) => l.trim())}`);
  }
}

async function respaldarArchivo() {
  await asegurarBucket();
  const fecha = new Date().toISOString().slice(0, 10);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'respaldo-'));
  const tar = path.join(tmp, `respaldo-${fecha}.tar.gz`);
  const carpetas = ['datos-privados', 'traducciones', 'glosario', 'public/data', 'public/images/pieces'].filter((d) => fs.existsSync(path.join(ROOT, d)));
  execFileSync('tar', ['-czf', tar, '-C', ROOT, ...carpetas]);
  const mb = fs.statSync(tar).size / 1048576;
  if (mb > 290) throw new Error(`El archivo de respaldo pesa ${mb.toFixed(0)} MB y wrangler solo sube hasta 300 MB. Hay que partirlo.`);
  await wr(['r2', 'object', 'put', `${BUCKET_RESPALDO}/archivos/respaldo-${fecha}.tar.gz`, '--file', tar, '--content-type', 'application/gzip']);
  log(`✅ Archivo comprimido subido: archivos/respaldo-${fecha}.tar.gz (${mb.toFixed(1)} MB; carpetas: ${carpetas.join(', ')}).`);
  console.log(`::notice title=Respaldo comprimido::respaldo-${fecha}.tar.gz, ${mb.toFixed(1)} MB`);
  // Índice de archivos (para saber cuáles hay) y limpieza: se guardan los últimos 8
  const idxFile = path.join(tmp, 'idx.json');
  let idx = [];
  try { await wr(['r2', 'object', 'get', `${BUCKET_RESPALDO}/archivos/_indice.json`, '--file', idxFile]); idx = JSON.parse(fs.readFileSync(idxFile, 'utf-8')); } catch { /* primera vez */ }
  idx = [...new Set([...idx, fecha])].sort();
  while (idx.length > 8) {
    const viejo = idx.shift();
    try { await wr(['r2', 'object', 'delete', `${BUCKET_RESPALDO}/archivos/respaldo-${viejo}.tar.gz`]); log(`🧹 Borrado el respaldo más viejo: ${viejo}`); } catch (e) { log(`⚠️  No pude borrar ${viejo}: ${e.message.split('\n')[0]}`); }
  }
  fs.writeFileSync(idxFile, JSON.stringify(idx));
  await wr(['r2', 'object', 'put', `${BUCKET_RESPALDO}/archivos/_indice.json`, '--file', idxFile, '--content-type', 'application/json']);
  fs.rmSync(tmp, { recursive: true, force: true });
}

async function respaldarAudio() {
  await asegurarBucket();
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/audio/manifest.json'), 'utf-8'));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'respaldo-audio-'));
  const idxFile = path.join(tmp, 'indice.json');
  let indice = {};
  try { await wr(['r2', 'object', 'get', `${BUCKET_RESPALDO}/audio/_indice.json`, '--file', idxFile]); indice = JSON.parse(fs.readFileSync(idxFile, 'utf-8')); } catch { /* primera vez */ }
  const pendientes = [];
  for (const [lang, ps] of Object.entries(manifest.items || {})) for (const [id, ms] of Object.entries(ps)) for (const [mode, e] of Object.entries(ms)) {
    const rel = `${lang}/${id}_${mode}.mp3`;
    const key = r2Key(Boolean(e.remote), rel);
    if (indice[key] && indice[key] === e.hash) continue; // ya respaldado con el mismo texto
    pendientes.push({ key, rel, hash: e.hash });
  }
  const limite = Number(process.env.RESPALDO_AUDIO_LIMITE || 100000);
  const lista = pendientes.slice(0, limite);
  log(`🔊 Audios por respaldar: ${pendientes.length}${pendientes.length > lista.length ? ` (esta vez ${lista.length})` : ''}.`);
  let ok = 0; const fallos = []; let sigue = 0; const t0 = Date.now(); let ultimoIndice = Date.now();
  async function guardarIndice() {
    fs.writeFileSync(idxFile, JSON.stringify(indice));
    await wr(['r2', 'object', 'put', `${BUCKET_RESPALDO}/audio/_indice.json`, '--file', idxFile, '--content-type', 'application/json']);
  }
  async function trabajador(n) {
    while (sigue < lista.length) {
      const t = lista[sigue++];
      const f = path.join(tmp, `${n}.mp3`);
      let hecho = false;
      for (let intento = 1; intento <= 3 && !hecho; intento++) {
        try {
          await wr(['r2', 'object', 'get', `${process.env.R2_BUCKET || DEFAULT_BUCKET}/${t.key}`, '--file', f]);
          await wr(['r2', 'object', 'put', `${BUCKET_RESPALDO}/audio/${t.key}`, '--file', f, '--content-type', 'audio/mpeg']);
          indice[t.key] = t.hash; ok++; hecho = true;
        } catch (e) {
          if (intento === 3) fallos.push(`${t.key}: ${String(e.stderr || e.message).split('\n').find((l) => l.trim())}`);
          else await new Promise((r) => setTimeout(r, intento * 4000));
        }
      }
      fs.rmSync(f, { force: true });
      if (Date.now() - ultimoIndice > 10 * 60 * 1000) { ultimoIndice = Date.now(); await guardarIndice(); log(`  … ${ok}/${lista.length} audios (${Math.round((Date.now() - t0) / 60000)} min)`); }
    }
  }
  await Promise.all(Array.from({ length: 4 }, (_, i) => trabajador(i)));
  await guardarIndice();
  fs.rmSync(tmp, { recursive: true, force: true });
  log(`✅ Audios respaldados: ${ok} nuevos. Pendientes con error: ${fallos.length}.`);
  console.log(`::notice title=Respaldo de audio::${ok} nuevos, ${pendientes.length - ok} pendientes, ${fallos.length} con error`);
  if (fallos.length) {
    console.log(`::warning title=Audios sin respaldar::${fallos.slice(0, 8).join(' | ')}`);
    throw new Error(`No se pudieron respaldar ${fallos.length} audio(s).`);
  }
}

async function main() {
  if (!flag('textos') && !flag('archivo') && !flag('audio')) throw new Error('Indica qué respaldar: --textos, --archivo y/o --audio.');
  const errores = [];
  for (const [nombre, fn] of [['textos', respaldarTextosEnDrive], ['archivo', respaldarArchivo], ['audio', respaldarAudio]]) {
    if (!flag(nombre)) continue;
    try { await fn(); } catch (e) { errores.push(`${nombre}: ${e.message}`); console.log(`::error title=Respaldo ${nombre}::${e.message.slice(0, 400)}`); }
  }
  if (errores.length) { console.error('❌ ' + errores.join('\n❌ ')); process.exit(1); }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) main();
