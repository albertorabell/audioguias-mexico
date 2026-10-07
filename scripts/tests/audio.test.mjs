// Pruebas del generador de MP3. Se corren con:  node --test scripts/tests/audio.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { planAudio, mp3Duration, silentMp3, splitText, textHash, scriptFor } from '../audio-lib.mjs';
import { parseArgs } from '../generar-audio.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GEN = path.resolve(HERE, '../generar-audio.mjs');

const pieces = [
  { piece_id: 'a_gratis', is_free: true, guion_corto: 'Hola. Texto corto.', guion_largo: 'Texto largo. Con más frases. Y más.', guion_corto_en: 'Hello. Short text.' },
  { piece_id: 'b_pago', is_free: false, guion_corto: 'Pieza de pago corta.', guion_largo: 'Pieza de pago larga.' },
  { piece_id: 'c_vacia', is_free: true, guion_corto: '', guion_largo: '' },
];

function tmpProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'audio-test-'));
  fs.mkdirSync(path.join(dir, 'public/data'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'public/data/pieces.json'), JSON.stringify(pieces));
  return dir;
}
const run = (dir, ...args) =>
  execFileSync('node', [GEN, ...args], { cwd: dir, encoding: 'utf-8', env: { ...process.env, AZURE_SPEECH_KEY: '', OPENAI_API_KEY: '' } });
const readManifest = (dir) => JSON.parse(fs.readFileSync(path.join(dir, 'public/audio/manifest.json'), 'utf-8'));

test('mp3Duration lee la duración de un MP3 sin programas externos', () => {
  assert.ok(Math.abs(mp3Duration(silentMp3(3)) - 3) < 0.05);
  assert.equal(mp3Duration(Buffer.from('esto no es un mp3')), null);
});

test('splitText no corta frases y respeta el máximo', () => {
  const text = 'Primera frase. Segunda frase un poco más larga. Tercera!';
  const parts = splitText(text, 30);
  assert.ok(parts.every((p) => p.length <= 30), JSON.stringify(parts));
  assert.equal(parts.join(' ').replace(/\s+/g, ' '), text);
});

test('planAudio: genera lo que falta, omite lo vigente, detecta cambios de tipo', () => {
  const manifest = {
    items: {
      es: {
        a_gratis: { corto: { hash: textHash(scriptFor(pieces[0], 'es', 'corto')), file: 'es/a_gratis_corto.mp3', remote: false } },
        b_pago: { corto: { hash: textHash('texto viejo'), file: 'es/b_pago_corto.mp3', remote: true }, largo: { hash: textHash('Pieza de pago larga.'), file: 'es/b_pago_largo.mp3', remote: false } },
      },
    },
  };
  const plan = planAudio(pieces, manifest, { langs: ['es'] });
  const keys = plan.todo.map((i) => `${i.pieceId}/${i.mode}`).sort();
  assert.deepEqual(keys, ['a_gratis/largo', 'b_pago/corto']); // el de pago "corto" cambió de texto
  assert.equal(plan.keep.length, 1); // a_gratis/corto
  assert.equal(plan.move.length, 1); // b_pago/largo: era público y ahora la pieza es de pago
  assert.equal(plan.move[0].remote, true);
  assert.equal(plan.skipped.length, 2); // c_vacia en los dos modos
});

test('planAudio respeta idioma, tipo, piezas y límite', () => {
  assert.equal(planAudio(pieces, {}, { langs: ['en'] }).todo.length, 1); // solo a_gratis tiene texto en inglés (corto)
  assert.equal(planAudio(pieces, {}, { langs: ['es'], only: 'premium' }).todo.every((i) => i.remote), true);
  assert.equal(planAudio(pieces, {}, { langs: ['es'], ids: ['a_gratis'] }).todo.length, 2);
  const limited = planAudio(pieces, {}, { langs: ['es'], limit: 1 });
  assert.equal(limited.todo.length, 1);
  assert.equal(limited.pending, 4);
});

test('parseArgs rechaza opciones inválidas', () => {
  assert.throws(() => parseArgs(['--lang', 'xx']));
  assert.throws(() => parseArgs(['--modo', 'medio']));
  assert.throws(() => parseArgs(['--hola']));
  assert.deepEqual(parseArgs(['--lang', 'es,en']).lang, ['es', 'en']);
});

test('sin --generar solo muestra el plan y no escribe nada', () => {
  const dir = tmpProject();
  const out = run(dir);
  assert.match(out, /Por generar: 4/);
  assert.match(out, /No se generó nada/);
  assert.equal(fs.existsSync(path.join(dir, 'public/audio')), false);
});

test('generar con el proveedor de prueba: todo a audio-generado/ (nada en carpetas públicas), manifiesto con el tipo, y es incremental', () => {
  const dir = tmpProject();
  run(dir, '--proveedor', 'prueba', '--generar');
  for (const f of ['a_gratis_corto', 'a_gratis_largo', 'b_pago_corto']) assert.ok(fs.existsSync(path.join(dir, `audio-generado/es/${f}.mp3`)), f);
  assert.equal(fs.existsSync(path.join(dir, 'public/audio/es')), false, 'ningún MP3 debe quedar en la carpeta pública');
  assert.equal(fs.existsSync(path.join(dir, 'audio-premium')), false);
  const m = readManifest(dir);
  assert.equal(m.items.es.b_pago.corto.remote, true);
  assert.equal(m.items.es.a_gratis.corto.remote, false);
  assert.ok(m.items.es.a_gratis.corto.seconds >= 1);
  assert.equal(m.items.es.a_gratis.corto.hash, textHash('Hola. Texto corto.'));

  // segunda corrida: nada que hacer
  assert.match(run(dir, '--proveedor', 'prueba', '--generar'), /Nada que generar/);

  // si cambia el texto, solo se regenera ese audio
  const changed = pieces.map((p) => (p.piece_id === 'a_gratis' ? { ...p, guion_corto: 'Texto nuevo.' } : p));
  fs.writeFileSync(path.join(dir, 'public/data/pieces.json'), JSON.stringify(changed));
  const out = run(dir, '--proveedor', 'prueba', '--generar');
  assert.match(out, /1 generados/);
  assert.equal(readManifest(dir).items.es.a_gratis.corto.hash, textHash('Texto nuevo.'));
  assert.equal(fs.existsSync(path.join(dir, 'audio-generado/_borrar.json')), false);
});

test('si una pieza cambia de tipo Y su texto cambió, se regenera y la copia vieja de la otra carpeta de R2 queda anotada para borrar', () => {
  const dir = tmpProject();
  run(dir, '--proveedor', 'prueba', '--generar');
  const flipped = pieces.map((p) => (p.piece_id === 'a_gratis' ? { ...p, is_free: false, guion_corto: 'Texto cambiado.', guion_largo: 'Largo cambiado.' } : p));
  fs.writeFileSync(path.join(dir, 'public/data/pieces.json'), JSON.stringify(flipped));
  run(dir, '--proveedor', 'prueba', '--generar', '--piezas', 'a_gratis');
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, 'audio-generado/_borrar.json'), 'utf-8')), ['libre/es/a_gratis_corto.mp3', 'libre/es/a_gratis_largo.mp3']);
  assert.equal(readManifest(dir).items.es.a_gratis.corto.remote, true);
});

test('--reubicar sin claves de Cloudflare falla con un mensaje claro y no toca el manifiesto', () => {
  const dir = tmpProject();
  run(dir, '--proveedor', 'prueba', '--generar');
  const flipped = pieces.map((p) => (p.piece_id === 'a_gratis' ? { ...p, is_free: false } : p));
  fs.writeFileSync(path.join(dir, 'public/data/pieces.json'), JSON.stringify(flipped));
  const before = fs.readFileSync(path.join(dir, 'public/audio/manifest.json'), 'utf-8');
  assert.throws(
    () => execFileSync('node', [GEN, '--reubicar'], { cwd: dir, encoding: 'utf-8', stdio: 'pipe', env: { ...process.env, CLOUDFLARE_API_TOKEN: '', CLOUDFLARE_ACCOUNT_ID: '' } }),
    /CLOUDFLARE_API_TOKEN/
  );
  assert.equal(fs.readFileSync(path.join(dir, 'public/audio/manifest.json'), 'utf-8'), before);
  // la vista previa solo avisa
  assert.match(run(dir), /cambiaron de tipo/);
});

test('sin clave del proveedor real, falla con un mensaje claro', () => {
  const dir = tmpProject();
  assert.throws(() => run(dir, '--proveedor', 'azure', '--generar'), /AZURE_SPEECH_KEY/);
});

// ---------------------------------------------------------------------------
// R2: carpetas libre/ y pago/, subida y movimiento
// ---------------------------------------------------------------------------
function fakeR2(initial = {}) {
  const store = new Map(Object.entries(initial));
  const calls = [];
  return {
    store,
    calls,
    put: (key, file) => (calls.push(['put', key]), store.set(key, fs.readFileSync(file, 'utf-8'))),
    get: (key, file) => {
      calls.push(['get', key]);
      if (!store.has(key)) throw new Error('no existe');
      fs.writeFileSync(file, store.get(key));
    },
    del: (key) => (calls.push(['del', key]), store.delete(key)),
  };
}

test('r2: libre/ y pago/ según el tipo de pieza', async () => {
  const { r2Key, prefixFor } = await import('../r2-lib.mjs');
  assert.equal(prefixFor(false), 'libre');
  assert.equal(prefixFor(true), 'pago');
  assert.equal(r2Key(true, 'es/p_corto.mp3'), 'pago/es/p_corto.mp3');
  assert.equal(r2Key(false, 'es/p_corto.mp3'), 'libre/es/p_corto.mp3');
});

test('subir audios: lista solo MP3 con el nombre correcto', async () => {
  const { listGeneratedFiles } = await import('../r2-lib.mjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-test-'));
  fs.mkdirSync(path.join(dir, 'es'));
  fs.mkdirSync(path.join(dir, 'en'));
  for (const f of ['es/mna_s06_coatlicue_corto.mp3', 'es/mna_s06_coatlicue_largo.mp3', 'en/mna_s06_coatlicue_corto.mp3']) fs.writeFileSync(path.join(dir, f), 'x');
  fs.writeFileSync(path.join(dir, 'es', 'notas.txt'), 'no');
  fs.writeFileSync(path.join(dir, 'raro.mp3'), 'no');
  fs.writeFileSync(path.join(dir, 'es', 'sin_modo.mp3'), 'no');
  assert.deepEqual(listGeneratedFiles(dir).map((f) => f.rel), ['en/mna_s06_coatlicue_corto.mp3', 'es/mna_s06_coatlicue_corto.mp3', 'es/mna_s06_coatlicue_largo.mp3']);
  assert.deepEqual(listGeneratedFiles(path.join(dir, 'no-existe')), []);
});

test('subir audios: cada MP3 va a libre/ o pago/ según el manifiesto; borra copias viejas; un archivo desconocido detiene todo', async () => {
  const { main } = await import('../subir-audio.mjs');
  const dir = tmpProject();
  run(dir, '--proveedor', 'prueba', '--generar');
  fs.writeFileSync(path.join(dir, 'audio-generado/_borrar.json'), JSON.stringify(['pago/es/viejo_corto.mp3']));
  const r2 = fakeR2({ 'pago/es/viejo_corto.mp3': 'x' });
  const out = [];
  const res = main({ root: dir, r2, log: (m) => out.push(m) });
  assert.deepEqual([...r2.store.keys()].sort(), ['libre/es/a_gratis_corto.mp3', 'libre/es/a_gratis_largo.mp3', 'pago/es/b_pago_corto.mp3', 'pago/es/b_pago_largo.mp3']);
  assert.equal(res.subidos, 4);
  assert.equal(res.borrados, 1);
  assert.equal(fs.existsSync(path.join(dir, 'audio-generado/_borrar.json')), false);

  fs.writeFileSync(path.join(dir, 'audio-generado/es/suelto_corto.mp3'), 'x');
  assert.throws(() => main({ root: dir, r2: fakeR2(), log() {} }), /no están en el manifiesto/);
});

test('subir audios: en simulación no sube ni borra; sin claves de Cloudflare falla con mensaje claro', async () => {
  const { main } = await import('../subir-audio.mjs');
  const dir = tmpProject();
  run(dir, '--proveedor', 'prueba', '--generar');
  const out = [];
  main({ root: dir, simular: true, log: (m) => out.push(m) });
  assert.match(out.join('\n'), /Se subirían 4 audio\(s\) a R2 \(2 libres, 2 de pago\)/);
  const script = path.resolve(HERE, '../subir-audio.mjs');
  assert.throws(
    () => execFileSync('node', [script], { cwd: dir, encoding: 'utf-8', stdio: 'pipe', env: { ...process.env, CLOUDFLARE_API_TOKEN: '', CLOUDFLARE_ACCOUNT_ID: '' } }),
    /CLOUDFLARE_API_TOKEN/
  );
});

test('mover en R2: baja, sube a la carpeta nueva y borra la vieja; tolera una corrida cortada a medias; avisa si no existe', async () => {
  const { moveObject, relocateInR2 } = await import('../r2-lib.mjs');
  const r2 = fakeR2({ 'libre/es/p_corto.mp3': 'AUDIO' });
  assert.equal(moveObject(r2, 'libre/es/p_corto.mp3', 'pago/es/p_corto.mp3'), 'movido');
  assert.deepEqual([...r2.store.entries()], [['pago/es/p_corto.mp3', 'AUDIO']]);
  // ya estaba movido
  assert.equal(moveObject(r2, 'libre/es/p_corto.mp3', 'pago/es/p_corto.mp3'), 'ya-estaba');
  assert.throws(() => moveObject(fakeR2(), 'libre/es/x_corto.mp3', 'pago/es/x_corto.mp3'), /ni pago\/es\/x_corto.mp3/);

  const manifest = { items: { es: { p: { corto: { remote: false }, largo: { remote: false } } } } };
  const r2b = fakeR2({ 'libre/es/p_corto.mp3': 'A' });
  const log = [];
  const res = relocateInR2(
    [
      { lang: 'es', pieceId: 'p', mode: 'corto', remote: true, from: { remote: false } },
      { lang: 'es', pieceId: 'p', mode: 'largo', remote: true, from: { remote: false } },
    ],
    manifest,
    r2b,
    (m) => log.push(m)
  );
  assert.equal(res.moved, 1);
  assert.deepEqual(res.failed, ['es/p_largo.mp3']);
  assert.equal(manifest.items.es.p.corto.remote, true, 'el movido se actualiza');
  assert.equal(manifest.items.es.p.largo.remote, false, 'el que falló no se toca');
});
