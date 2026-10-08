// Pruebas del sincronizador: traducciones opcionales y unión de MP3.
// Ejecutar con: node --test scripts/tests
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { textHash } from '../audio-lib.mjs';
import { fieldHash } from '../traducir-lib.mjs';

const SYNC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'sync-sheets.js');

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const csv = (headers, rows) => [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');

function makeProject({ withManifest }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-test-'));
  const csvDir = path.join(dir, 'csv');
  fs.mkdirSync(csvDir);
  fs.mkdirSync(path.join(dir, 'public/data'), { recursive: true });

  const roomH = ['room_id', 'numero_oficial', 'nombre_oficial', 'nombre_oficial_en', 'introduccion_narrativa_en'];
  fs.writeFileSync(csvDir + '/salas.csv', csv(roomH, [
    ['sala-01', '1', 'Sala Uno', 'Room One', 'Welcome to room one.'],
    ['sala-02', '2', 'Sala Dos', '', ''],
  ]));

  const pieceH = ['piece_id', 'room_id', 'titulo', 'guion_corto', 'guion_largo', 'is_free',
    'titulo_en', 'guion_corto_en', 'guion_largo_en', 'retos_observacion_en', 'especificaciones_en', 'faq_mito_en'];
  const rows = [];
  for (let i = 0; i < 25; i++) {
    const id = `p${String(i).padStart(2, '0')}`;
    rows.push([id, 'sala-01', `Pieza ${i}`, `Corto ${i}.`, `Largo ${i}.`, i === 0 || i === 2 ? 'TRUE' : 'FALSE', '', '', '', '', '', '']);
  }
  // p00: traducida por completo
  rows[0].splice(6, 6, 'Piece 0', 'Short 0.', 'Long 0.', 'Look left | Look right', 'Material: Basalt | Weight: 2 t', 'Is it true? | Yes.');
  // p01: solo el título en inglés
  rows[1][6] = 'Piece 1';
  fs.writeFileSync(csvDir + '/piezas.csv', csv(pieceH, rows));

  if (withManifest) {
    fs.mkdirSync(path.join(dir, 'public/audio/es'), { recursive: true });
    const manifest = {
      version: 1,
      items: {
        es: {
          p00: {
            corto: { hash: textHash('Corto 0.'), file: 'es/p00_corto.mp3', seconds: 3 }, // gratis y vigente: se une
            largo: { hash: textHash('otro texto'), file: 'es/p00_largo.mp3' },            // texto cambió: no se une
          },
          p02: { corto: { hash: textHash('Corto 2.'), file: 'es/p02_corto.mp3', remote: true } }, // la pieza es gratis pero el audio se generó de pago: no se une
          p01: { corto: { hash: textHash('Corto 1.'), file: 'es/p01_corto.mp3', remote: true } }, // de pago: se une (carpeta pago/)
          fantasma: { corto: { hash: 'x', file: 'es/fantasma_corto.mp3' } },
        },
        en: { p00: { corto: { hash: textHash('Short 0 viejo.'), file: 'en/p00_corto.mp3' } } }, // el texto en inglés cambió: no se une
      },
    };
    fs.writeFileSync(path.join(dir, 'public/audio/manifest.json'), JSON.stringify(manifest));
  }
  return dir;
}

function runSync(dir, opts = {}) {
  const out = execFileSync('node', [SYNC], { cwd: dir, env: { ...process.env, SYNC_LOCAL_DIR: path.join(dir, 'csv'), SYNC_PIEZAS_GRATIS: opts.gratis === false ? '' : 'true' }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  return out;
}
const read = (dir, f) => JSON.parse(fs.readFileSync(path.join(dir, 'public/data', f), 'utf8'));

test('traducciones: solo aparecen las que tienen texto', () => {
  const dir = makeProject({ withManifest: false });
  runSync(dir);
  // Lo que lleva texto de pago está en los datos privados; lo público conserva solo el título y lo demás
  const pieces = JSON.parse(fs.readFileSync(path.join(dir, 'datos-privados/piezas-completas.json'), 'utf-8'));
  const p0 = pieces.find((p) => p.piece_id === 'p00');
  assert.equal(p0.titulo_en, 'Piece 0');
  assert.equal(p0.guion_corto_en, 'Short 0.');
  assert.deepEqual(p0.retos_observacion_en, ['Look left', 'Look right']);
  assert.deepEqual(p0.especificaciones_en, { Material: 'Basalt', Weight: '2 t' });
  assert.deepEqual(p0.faq_mito_en, { pregunta: 'Is it true?', respuesta: 'Yes.' });
  const p1 = pieces.find((p) => p.piece_id === 'p01');
  assert.equal(p1.titulo_en, 'Piece 1');
  assert.equal('guion_corto_en' in p1, false);
  const p5 = pieces.find((p) => p.piece_id === 'p05');
  assert.equal(Object.keys(p5).some((k) => k.endsWith('_en')), false);
  assert.equal(p5.titulo, 'Pieza 5');
  const rooms = read(dir, 'rooms.json');
  assert.equal(rooms[0].nombre_oficial_en, 'Room One');
  assert.equal('nombre_oficial_en' in rooms[1], false);
  assert.equal(pieces.some((p) => 'audio' in p), false);
});

test('audio: solo se unen MP3 vigentes y con el tipo correcto; la ruta apunta a libre/ o pago/ de R2', () => {
  const dir = makeProject({ withManifest: true });
  const log = runSync(dir);
  const pieces = read(dir, 'pieces.json');
  const by = (id) => pieces.find((p) => p.piece_id === id);
  assert.deepEqual(by('p00').audio, { es: { corto: { path: 'libre/es/p00_corto.mp3', premium: false, seconds: 3 } } });
  assert.deepEqual(by('p01').audio, { es: { corto: { path: 'pago/es/p01_corto.mp3', premium: true } } });
  assert.equal('audio' in by('p02'), false);
  assert.ok(log.includes('Audios unidos') || log.includes('Audios MP3 unidos a las piezas: 2'), log);
});

test('seguridad: un MP3 de una pieza de pago dentro de public/audio detiene la publicación', () => {
  const dir = makeProject({ withManifest: true });
  // p01 es de pago: su MP3 en la carpeta pública sería una fuga
  fs.writeFileSync(path.join(dir, 'public/audio/es/p01_corto.mp3'), 'x');
  assert.throws(() => runSync(dir), (e) => /DE PAGO dentro de public\/audio/.test(String(e.stderr) + String(e.stdout) + String(e.message)));
});

test('seguridad: también detecta fugas en la raíz, en subcarpetas y con otras extensiones de audio', () => {
  for (const rel of ['p01_corto.mp3', 'extra/p01_largo.mp3', 'es/nuevo/p01_largo.m4a', 'es/p01.wav']) {
    const dir = makeProject({ withManifest: true });
    fs.mkdirSync(path.dirname(path.join(dir, 'public/audio', rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, 'public/audio', rel), 'x');
    assert.throws(() => runSync(dir), (e) => /DE PAGO dentro de public\/audio/.test(String(e.stderr) + String(e.stdout) + String(e.message)), rel);
  }
});

test('seguridad: un MP3 cuyo nombre solo se parece al de una pieza de pago no es fuga', () => {
  const dir = makeProject({ withManifest: true });
  fs.writeFileSync(path.join(dir, 'public/audio/es/p01_extra_corto.mp3'), 'x');
  fs.writeFileSync(path.join(dir, 'public/audio/es/notas.txt'), 'x');
  assert.doesNotThrow(() => runSync(dir));
});

test('traducciones guardadas: se unen si el español no cambió; la hoja manda; las viejas se ignoran', () => {
  const dir = makeProject({ withManifest: false });
  const tdir = path.join(dir, 'traducciones/en');
  fs.mkdirSync(tdir, { recursive: true });
  // p05: título vigente + frase vieja (el español de la hoja no la tiene: no se une nada de más)
  fs.writeFileSync(path.join(tdir, 'pieza_p05.json'), JSON.stringify({
    campos: {
      titulo: { hash: fieldHash('Pieza 5'), texto: 'Piece 5' },
      guion_corto: { hash: fieldHash('Texto que ya cambió'), texto: 'Old short' },
    },
  }));
  // p00 ya tiene titulo_en en la hoja ("Piece 0"): manda la hoja
  fs.writeFileSync(path.join(tdir, 'pieza_p00.json'), JSON.stringify({ campos: { titulo: { hash: fieldHash('Pieza 0'), texto: 'Guardada' } } }));
  // sala-02 sin traducción en la hoja: se usa la guardada
  fs.writeFileSync(path.join(tdir, 'sala_sala-02.json'), JSON.stringify({ campos: { nombre_oficial: { hash: fieldHash('Sala Dos'), texto: 'Room Two' } } }));
  const log = runSync(dir);
  const pieces = read(dir, 'pieces.json');
  const by = (id) => pieces.find((p) => p.piece_id === id);
  assert.equal(by('p05').titulo_en, 'Piece 5');
  assert.equal('guion_corto_en' in by('p05'), false);
  assert.equal(by('p00').titulo_en, 'Piece 0');
  assert.equal(read(dir, 'rooms.json')[1].nombre_oficial_en, 'Room Two');
  assert.ok(log.includes('Traducciones guardadas (en): 2 textos unidos, 1 ignorados'), log);
});

test('sin piezas gratis: por defecto ninguna pieza queda libre aunque el Sheets diga TRUE', () => {
  const dir = makeProject({ withManifest: false });
  runSync(dir, { gratis: false });
  const pieces = read(dir, 'pieces.json');
  assert.ok(pieces.length > 0);
  assert.equal(pieces.filter((p) => p.is_free).length, 0);
  // con el interruptor encendido sí respeta el Sheets
  const dir2 = makeProject({ withManifest: false });
  runSync(dir2);
  assert.ok(read(dir2, 'pieces.json').some((p) => p.is_free));
});

test('textos de pago: los datos públicos no llevan guiones, retos, mito ni ficha; van en datos-privados/ por idioma', () => {
  const dir = makeProject({ withManifest: false });
  runSync(dir);
  const pub = read(dir, 'pieces.json');
  const prohibido = ['guion_corto', 'guion_largo', 'retos_observacion', 'especificaciones', 'faq_mito'];
  for (const p of pub) {
    for (const k of Object.keys(p)) assert.ok(!prohibido.some((f) => k === f || k.startsWith(f + '_')), `${p.piece_id} lleva ${k}`);
  }
  // nada del texto privado se cuela en los archivos públicos
  const crudo = fs.readFileSync(path.join(dir, 'public/data/pieces.json'), 'utf-8') + fs.readFileSync(path.join(dir, 'public/data/mna/pieces.json'), 'utf-8');
  assert.ok(!crudo.includes('Long 0.') && !crudo.includes('Look left') && !crudo.includes('Basalt'));
  const p0 = pub.find((p) => p.piece_id === 'p00');
  assert.ok(p0.avance && p0.titulo && p0.piece_id);
  assert.deepEqual(p0.idiomas_texto, ['en']);
  // el archivo privado del español no trae lo del inglés; el del inglés trae lo base y lo suyo
  const es = JSON.parse(fs.readFileSync(path.join(dir, 'datos-privados/texto/es.json'), 'utf-8'));
  const en = JSON.parse(fs.readFileSync(path.join(dir, 'datos-privados/texto/en.json'), 'utf-8'));
  assert.ok(es.pieces.p00.guion_corto && !('guion_corto_en' in es.pieces.p00));
  assert.equal(en.pieces.p00.guion_corto_en, 'Short 0.');
  assert.ok(en.pieces.p00.guion_corto);
  assert.equal(en.lang, 'en');
  assert.ok(!fs.existsSync(path.join(dir, 'datos-privados/texto/fr.json')));
});
