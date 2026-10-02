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

test('generar con el proveedor de prueba: gratis a public/audio, de pago a audio-premium, y es incremental', () => {
  const dir = tmpProject();
  run(dir, '--proveedor', 'prueba', '--generar');
  assert.ok(fs.existsSync(path.join(dir, 'public/audio/es/a_gratis_corto.mp3')));
  assert.ok(fs.existsSync(path.join(dir, 'public/audio/es/a_gratis_largo.mp3')));
  assert.ok(fs.existsSync(path.join(dir, 'audio-premium/es/b_pago_corto.mp3')));
  assert.equal(fs.existsSync(path.join(dir, 'public/audio/es/b_pago_corto.mp3')), false, 'el audio de pago no debe quedar en la carpeta pública');
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
});

test('--reubicar mueve el audio cuando la pieza pasa de gratis a pago, sin regenerar', () => {
  const dir = tmpProject();
  run(dir, '--proveedor', 'prueba', '--generar');
  const flipped = pieces.map((p) => (p.piece_id === 'a_gratis' ? { ...p, is_free: false } : p));
  fs.writeFileSync(path.join(dir, 'public/data/pieces.json'), JSON.stringify(flipped));
  const before = fs.readFileSync(path.join(dir, 'public/audio/es/a_gratis_corto.mp3'));
  run(dir, '--reubicar');
  assert.equal(fs.existsSync(path.join(dir, 'public/audio/es/a_gratis_corto.mp3')), false);
  assert.deepEqual(fs.readFileSync(path.join(dir, 'audio-premium/es/a_gratis_corto.mp3')), before);
  assert.equal(readManifest(dir).items.es.a_gratis.corto.remote, true);
});

test('sin clave del proveedor real, falla con un mensaje claro', () => {
  const dir = tmpProject();
  assert.throws(() => run(dir, '--proveedor', 'azure', '--generar'), /AZURE_SPEECH_KEY/);
});

test('subir audios de pago: solo lista MP3 de piezas con el nombre correcto, con la clave idioma/archivo', async () => {
  const { listPremiumFiles } = await import('../subir-audio-premium.mjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'premium-test-'));
  fs.mkdirSync(path.join(dir, 'es'));
  fs.mkdirSync(path.join(dir, 'en'));
  fs.writeFileSync(path.join(dir, 'es', 'mna_s06_coatlicue_corto.mp3'), 'x');
  fs.writeFileSync(path.join(dir, 'es', 'mna_s06_coatlicue_largo.mp3'), 'x');
  fs.writeFileSync(path.join(dir, 'en', 'mna_s06_coatlicue_corto.mp3'), 'x');
  fs.writeFileSync(path.join(dir, 'es', 'notas.txt'), 'no');
  fs.writeFileSync(path.join(dir, 'raro.mp3'), 'no');
  fs.writeFileSync(path.join(dir, 'es', 'sin_modo.mp3'), 'no');
  const keys = listPremiumFiles(dir).map((f) => f.key);
  assert.deepEqual(keys, ['en/mna_s06_coatlicue_corto.mp3', 'es/mna_s06_coatlicue_corto.mp3', 'es/mna_s06_coatlicue_largo.mp3']);
  assert.deepEqual(listPremiumFiles(path.join(dir, 'no-existe')), []);
});

test('subir audios de pago: sin claves de Cloudflare falla con un mensaje claro; en simulación no sube nada', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'premium-run-'));
  fs.mkdirSync(path.join(dir, 'audio-premium/es'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'audio-premium/es/mna_s06_coatlicue_corto.mp3'), 'x');
  const script = path.resolve(HERE, '../subir-audio-premium.mjs');
  const env = { ...process.env, CLOUDFLARE_API_TOKEN: '', CLOUDFLARE_ACCOUNT_ID: '' };
  const sim = execFileSync('node', [script, '--simular'], { cwd: dir, encoding: 'utf-8', env });
  assert.match(sim, /Se subirían 1 audio/);
  assert.throws(() => execFileSync('node', [script], { cwd: dir, encoding: 'utf-8', env, stdio: 'pipe' }), /CLOUDFLARE_API_TOKEN/);
});
