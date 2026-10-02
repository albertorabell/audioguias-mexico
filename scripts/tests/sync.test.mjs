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
    fs.writeFileSync(path.join(dir, 'public/audio/es/p00_corto.mp3'), 'x');
    const manifest = {
      version: 1,
      items: {
        es: {
          p00: {
            corto: { hash: textHash('Corto 0.'), file: 'es/p00_corto.mp3', seconds: 3 }, // gratis y vigente: se une
            largo: { hash: textHash('otro texto'), file: 'es/p00_largo.mp3' },            // texto cambió: no se une
          },
          p02: { corto: { hash: textHash('Corto 2.'), file: 'es/p02_corto.mp3', remote: true } }, // gratis pero remoto: no se une
          p01: { corto: { hash: textHash('Corto 1.'), file: 'es/p01_corto.mp3', remote: true } }, // de pago y remoto: se une
          fantasma: { corto: { hash: 'x', file: 'es/fantasma_corto.mp3' } },
        },
        en: { p00: { corto: { hash: textHash('Short 0.'), file: 'en/p00_corto.mp3' } } },       // el archivo no existe: no se une
      },
    };
    fs.writeFileSync(path.join(dir, 'public/audio/manifest.json'), JSON.stringify(manifest));
  }
  return dir;
}

function runSync(dir) {
  const out = execFileSync('node', [SYNC], { cwd: dir, env: { ...process.env, SYNC_LOCAL_DIR: path.join(dir, 'csv') }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  return out;
}
const read = (dir, f) => JSON.parse(fs.readFileSync(path.join(dir, 'public/data', f), 'utf8'));

test('traducciones: solo aparecen las que tienen texto', () => {
  const dir = makeProject({ withManifest: false });
  runSync(dir);
  const pieces = read(dir, 'pieces.json');
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

test('audio: solo se unen MP3 vigentes, que existen y con el tipo correcto', () => {
  const dir = makeProject({ withManifest: true });
  const log = runSync(dir);
  const pieces = read(dir, 'pieces.json');
  const by = (id) => pieces.find((p) => p.piece_id === id);
  assert.deepEqual(by('p00').audio, { es: { corto: { path: 'audio/es/p00_corto.mp3', remote: false, seconds: 3 } } });
  assert.deepEqual(by('p01').audio, { es: { corto: { path: 'es/p01_corto.mp3', remote: true } } });
  assert.equal('audio' in by('p02'), false);
  assert.ok(log.includes('Audios unidos') || log.includes('Audios MP3 unidos a las piezas: 2'), log);
});
