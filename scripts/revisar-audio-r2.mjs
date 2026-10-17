#!/usr/bin/env node
// scripts/revisar-audio-r2.mjs
// Compara la lista de audios (manifiesto) con lo que de verdad hay en Cloudflare R2. No gasta voz.
//   --sitio mna|teotihuacan|todos   --lang es,en,fr,pl
//   --adoptar   si en R2 hay un MP3 que la lista no tiene (corrida que subió pero no alcanzó a guardar la lista), lo anota en la lista
//   --aplicar   escribe los cambios: quita de la lista los audios que NO están en R2 (así el próximo "generar" solo rehace esos) y anota los adoptados
// Sin --aplicar solo informa.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { MODES, scriptFor, textHash, mp3Duration } from './audio-lib.mjs';
import { r2Key, DEFAULT_BUCKET } from './r2-lib.mjs';
import { readFullPieces } from './privado-lib.mjs';

const run = promisify(execFile);
const ROOT = process.cwd();
const MANIFEST_FILE = path.join(ROOT, 'public/audio/manifest.json');

const arg = (n, d) => {
  const i = process.argv.indexOf('--' + n);
  return i >= 0 ? process.argv[i + 1] : d;
};
const flag = (n) => process.argv.includes('--' + n);
const sitio = arg('sitio', 'todos');
const langs = (arg('lang', 'es,en,fr,pl')).split(',').map((s) => s.trim()).filter(Boolean);
const adoptar = flag('adoptar');
const aplicar = flag('aplicar');
const bucket = process.env.R2_BUCKET || DEFAULT_BUCKET;
if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID) {
  console.error('❌ Faltan CLOUDFLARE_API_TOKEN y CLOUDFLARE_ACCOUNT_ID.');
  process.exit(1);
}

const prefijo = { mna: 'mna_', teotihuacan: 'teo_' }[sitio];
const pieces = readFullPieces(ROOT).filter((p) => !prefijo || String(p.piece_id).startsWith(prefijo));
const manifest = fs.existsSync(MANIFEST_FILE) ? JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf-8')) : { version: 1, items: {} };
manifest.items ||= {};

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'r2rev-'));
let n = 0;
/** 'ok' (con bytes y segundos) | 'falta' (confirmado que no existe) | 'duda' (error de red u otro; no se toca nada) */
async function bajar(key) {
  const f = path.join(tmp, `${n++}.mp3`);
  for (let intento = 1; intento <= 3; intento++) {
    try {
      await run('npx', ['--yes', 'wrangler@4', 'r2', 'object', 'get', `${bucket}/${key}`, '--file', f, '--remote'], { maxBuffer: 1 << 24 });
      const buf = fs.readFileSync(f);
      fs.rmSync(f, { force: true });
      return { estado: 'ok', bytes: buf.length, seconds: mp3Duration(buf) };
    } catch (e) {
      const msg = String(e.stderr || '') + String(e.stdout || '') + String(e.message || '');
      if (/does not exist|10007|NoSuchKey|not found/i.test(msg)) return { estado: 'falta' };
      if (intento === 3) return { estado: 'duda', msg: msg.split('\n').find((l) => l.trim()) || '' };
    }
  }
}

const tareas = [];
for (const p of pieces) {
  const remote = !p.is_free;
  for (const lang of langs) {
    for (const mode of MODES) {
      const script = scriptFor(p, lang, mode);
      if (!script) continue;
      const hash = textHash(script);
      const old = manifest.items?.[lang]?.[p.piece_id]?.[mode];
      if (old && old.hash !== hash) continue; // texto cambió: ese MP3 ya no sirve, no hay nada que revisar
      const rel = `${lang}/${p.piece_id}_${mode}.mp3`;
      tareas.push({ lang, id: p.piece_id, mode, rel, key: r2Key(Boolean(old ? old.remote : remote), rel), hash, remote: Boolean(old ? old.remote : remote), old });
    }
  }
}
console.log(`Revisando ${tareas.length} audio(s) en R2 (sitio ${sitio}; idiomas ${langs.join(',')}) …`);

const res = { ok: 0, adoptados: [], quitar: [], dudas: [], tamano: [], sinListaNiR2: 0 };
let i = 0;
async function trabajador() {
  while (i < tareas.length) {
    const t = tareas[i++];
    const r = await bajar(t.key);
    if (r.estado === 'ok') {
      res.ok++;
      if (!t.old) {
        if (adoptar && r.seconds) {
          manifest.items[t.lang] ||= {};
          manifest.items[t.lang][t.id] ||= {};
          manifest.items[t.lang][t.id][t.mode] = { hash: t.hash, file: t.rel, remote: t.remote, seconds: Math.round(r.seconds), bytes: r.bytes, provider: 'azure' };
          res.adoptados.push(t.rel);
        }
      } else if (t.old.bytes && Math.abs(t.old.bytes - r.bytes) > 16) res.tamano.push(`${t.rel} (lista ${t.old.bytes} · R2 ${r.bytes})`);
    } else if (r.estado === 'falta') {
      if (t.old) res.quitar.push(`${t.lang}/${t.id}/${t.mode}`);
      else res.sinListaNiR2++;
    } else res.dudas.push(`${t.rel}: ${r.msg}`);
    if (i % 100 === 0) console.log(`  ${i}/${tareas.length} revisados`);
  }
}
await Promise.all(Array.from({ length: 6 }, trabajador));

console.log(`\nEn R2 y bien: ${res.ok}`);
console.log(`Adoptados a la lista (estaban en R2 pero no en la lista): ${res.adoptados.length}${adoptar ? '' : ' (no se adoptan sin --adoptar)'}`);
console.log(`En la lista pero NO en R2: ${res.quitar.length}`);
res.quitar.slice(0, 60).forEach((x) => console.log('   - ' + x));
console.log(`Sin lista y sin R2 (aún no generados): ${res.sinListaNiR2}`);
console.log(`Tamaño distinto (revisar): ${res.tamano.length}`);
res.tamano.slice(0, 30).forEach((x) => console.log('   - ' + x));
console.log(`No se pudo comprobar (no se toca): ${res.dudas.length}`);
res.dudas.slice(0, 30).forEach((x) => console.log('   - ' + x));

// Los registros de la corrida no se pueden leer desde fuera, pero las anotaciones sí: dejamos aquí el resumen
const nota = (t) => t.replace(/%/g, '%25').replace(/\r/g, '').replace(/\n/g, '%0A');
console.log('::notice title=Resumen R2::' + nota(`revisados ${tareas.length} · bien ${res.ok} · adoptados ${res.adoptados.length} · faltan en R2 ${res.quitar.length} · tamaño distinto ${res.tamano.length} · dudas ${res.dudas.length} · sin lista ni R2 ${res.sinListaNiR2}`));
if (res.quitar.length) console.log('::warning title=Faltan en R2::' + nota(res.quitar.join('\n').slice(0, 3500)));
if (res.dudas.length) console.log('::warning title=Sin comprobar::' + nota(res.dudas.join('\n').slice(0, 3500)));
if (res.tamano.length) console.log('::warning title=Tamaño distinto::' + nota(res.tamano.join('\n').slice(0, 3500)));

if (aplicar) {
  // Seguridad: si casi todo "falta", algo anda mal con la conexión; no se escribe nada
  if (res.ok === 0 && res.quitar.length > 0) {
    console.error('❌ No se encontró ni un solo audio en R2; parece un problema de conexión o permisos. No se cambia nada.');
    process.exit(1);
  }
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
  fs.writeFileSync(path.join(process.env.RUNNER_TEMP || os.tmpdir(), 'quitar.json'), JSON.stringify(res.quitar));
  console.log('\nCambios preparados (se guardan en el repositorio en el siguiente paso).');
} else console.log('\n(Solo revisión: no se cambió nada. Marca "aplicar" para guardar los cambios.)');
if (res.dudas.length) process.exitCode = 1;
