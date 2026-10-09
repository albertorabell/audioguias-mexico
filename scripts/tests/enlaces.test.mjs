// Pruebas de los enlaces entre piezas: [texto](piece_id) dentro de los guiones.
// Ejecutar con: node --test scripts/tests/enlaces.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { stripLinks, splitLinks, linkIds, hasBrokenLink, sameLinks } from '../../src/utils/pieceLinks.js';
import { scriptFor, textHash } from '../audio-lib.mjs';
import { avance, indice, splitPiece, buildBundles } from '../privado-lib.mjs';
import { buildSystemPrompt, validateTranslation } from '../traducir-lib.mjs';

const SYNC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'sync-sheets.js');
const ES = 'Ya viste el [Disco de la Muerte](mna_s04_disco_muerte) y el [Sol](mna_s06_piedra_sol). Sigamos.';

test('stripLinks deja solo el texto visible y no toca el resto', () => {
  assert.equal(stripLinks(ES), 'Ya viste el Disco de la Muerte y el Sol. Sigamos.');
  assert.equal(stripLinks('Sin enlaces (683) y [nota]'), 'Sin enlaces (683) y [nota]');
  assert.equal(stripLinks(undefined), '');
  assert.equal(stripLinks('a\n\n[b](mna_x)\n\nc'), 'a\n\nb\n\nc'); // los saltos de párrafo se conservan
});

test('splitLinks parte el texto en trozos sueltos y enlaces, en orden', () => {
  assert.deepEqual(splitLinks(ES), [
    { text: 'Ya viste el ' },
    { text: 'Disco de la Muerte', id: 'mna_s04_disco_muerte' },
    { text: ' y el ' },
    { text: 'Sol', id: 'mna_s06_piedra_sol' },
    { text: '. Sigamos.' },
  ]);
  assert.deepEqual(splitLinks('solo texto'), [{ text: 'solo texto' }]);
  assert.deepEqual(splitLinks(''), []);
  assert.deepEqual(splitLinks('[a](x1)[b](x2)').map((p) => p.id), ['x1', 'x2']);
});

test('linkIds devuelve los ids en orden (con repetidos)', () => {
  assert.deepEqual(linkIds(ES), ['mna_s04_disco_muerte', 'mna_s06_piedra_sol']);
  assert.deepEqual(linkIds('[a](x1) y [b](x1)'), ['x1', 'x1']);
  assert.deepEqual(linkIds('nada'), []);
});

test('hasBrokenLink detecta enlaces mal escritos pero no los buenos ni los paréntesis normales', () => {
  assert.equal(hasBrokenLink(ES), false);
  assert.equal(hasBrokenLink('En el año (683) nació.'), false);
  assert.equal(hasBrokenLink('Mira [esto] (mna_x)'), true); // espacio de más
  assert.equal(hasBrokenLink('Mira [esto](Mna_X)'), true); // mayúsculas en el id
  assert.equal(hasBrokenLink('Mira [esto] sin id'), true);
  assert.equal(hasBrokenLink('Mira [esto](mna_x'), true); // paréntesis sin cerrar
});

test('sameLinks: la traducción conserva los mismos ids, aunque cambie el texto y el orden', () => {
  assert.equal(sameLinks(ES, 'You saw the [Sun](mna_s06_piedra_sol) and the [Death Disk](mna_s04_disco_muerte).'), true);
  assert.equal(sameLinks(ES, 'You saw the [Death Disk](mna_s04_disco_muerte).'), false); // falta uno
  assert.equal(sameLinks(ES, 'You saw the Death Disk and the Sun.'), false); // sin enlaces
  assert.equal(sameLinks(ES, 'x [a](mna_s04_disco_muerte) [b](mna_s06_piedra_sol) [c](mna_s06_piedra_sol)'), false); // de más
  assert.equal(sameLinks('sin enlaces', 'no links'), true);
  assert.equal(sameLinks('[a](mna_x)', '[a](mna_y)'), false); // id cambiado
});

test('audio: el texto que se lee no lleva marcas, y la huella es la del texto visible', () => {
  const piece = { guion_corto: ES, guion_corto_en: 'You saw the [Sun](mna_s06_piedra_sol).' };
  assert.equal(scriptFor(piece, 'es', 'corto'), 'Ya viste el Disco de la Muerte y el Sol. Sigamos.');
  assert.equal(scriptFor(piece, 'en', 'corto'), 'You saw the Sun.');
  // Un MP3 hecho con el texto sin marcas sigue valiendo cuando solo se agregan enlaces
  const plain = { guion_corto: 'Ya viste el Disco de la Muerte y el Sol. Sigamos.' };
  assert.equal(textHash(scriptFor(piece, 'es', 'corto')), textHash(scriptFor(plain, 'es', 'corto')));
});

test('texto público: el adelanto y el índice de búsqueda no llevan marcas ni ids', () => {
  const adv = avance(ES);
  assert.ok(!adv.includes('](') && !adv.includes('mna_'), adv);
  assert.ok(adv.includes('Disco de la Muerte'));
  const words = indice(ES).split(' ');
  assert.ok(words.includes('muerte') && words.includes('sigamos'));
  assert.ok(!words.includes('piedra'), '"piedra" solo está en un id: no debe entrar al índice');
  const { pub, priv } = splitPiece({ piece_id: 'p1', titulo: 'T', guion_corto: ES, guion_largo: ES + ' Más.' });
  assert.ok(!JSON.stringify(pub).includes('mna_s04'), 'lo público no debe traer ids de enlaces');
  assert.ok(priv.guion_corto.includes('](mna_s04_disco_muerte)'), 'lo privado conserva la marca para la app');
});

test('texto privado: el paquete con pase conserva los enlaces', () => {
  const b = buildBundles([{ piece_id: 'p1', titulo: 'T', guion_corto: ES, guion_largo: ES }], ['es']);
  assert.ok(b.es.pieces.p1.guion_corto.includes('[Disco de la Muerte](mna_s04_disco_muerte)'));
});

test('traducción: las instrucciones piden conservar los enlaces y las palabras nahuas/mayas, en todos los idiomas', () => {
  for (const lang of ['en', 'fr', 'pl']) {
    const p = buildSystemPrompt(lang);
    assert.match(p, /\[visible text\]\(piece_id\)/, lang);
    assert.match(p, /character by character/, lang);
    assert.match(p, /Nahuatl, Maya/, lang);
    assert.match(p, /Tlamanaliztli/, lang);
  }
});

test('traducción: se rechaza si pierde, cambia o agrega un enlace, o deja corchetes sueltos', () => {
  const src = { guion_corto: ES };
  const ok = 'You saw the [Death Disk](mna_s04_disco_muerte) and the [Sun](mna_s06_piedra_sol). Let us go on.';
  assert.deepEqual(validateTranslation(src, { guion_corto: ok }, [], { fake: true }).errors, []);
  const falta = validateTranslation(src, { guion_corto: 'You saw the [Death Disk](mna_s04_disco_muerte). Let us go on.' }, [], { fake: true }).errors;
  assert.ok(falta.some((e) => /enlaces/.test(e)), falta.join('|'));
  const cambiado = validateTranslation(src, { guion_corto: ok.replace('mna_s06_piedra_sol', 'mna_s06_piedra_del_sol') }, [], { fake: true }).errors;
  assert.ok(cambiado.some((e) => /enlaces/.test(e)));
  const roto = validateTranslation(src, { guion_corto: 'You saw the [Death Disk] (mna_s04_disco_muerte) and the [Sun](mna_s06_piedra_sol).' }, [], { fake: false, lang: 'en' }).errors;
  assert.ok(roto.some((e) => /enlaces|corchetes/.test(e)), roto.join('|'));
  // Un campo sin enlaces sigue funcionando como siempre
  assert.deepEqual(validateTranslation({ guion_corto: 'Hola.' }, { guion_corto: 'Hi.' }, [], { fake: true }).errors, []);
});

// ---------------------------------------------------------------------------
// Sincronizador: avisos de enlaces
// ---------------------------------------------------------------------------
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const csv = (headers, rows) => [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');

function runSyncWith(textos) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'enlaces-sync-'));
  fs.mkdirSync(path.join(dir, 'csv'));
  fs.mkdirSync(path.join(dir, 'public/data'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'csv/salas.csv'), csv(['room_id', 'numero_oficial', 'nombre_oficial'], [['sala-01', '1', 'Sala Uno']]));
  const rows = [];
  for (let i = 0; i < 25; i++) {
    const id = `p${String(i).padStart(2, '0')}`;
    rows.push([id, 'sala-01', `Pieza ${i}`, textos[id]?.[0] ?? `Corto ${i}.`, textos[id]?.[1] ?? `Largo ${i}.`]);
  }
  fs.writeFileSync(path.join(dir, 'csv/piezas.csv'), csv(['piece_id', 'room_id', 'titulo', 'guion_corto', 'guion_largo'], rows));
  const r = spawnSync('node', [SYNC], { cwd: dir, env: { ...process.env, SYNC_LOCAL_DIR: path.join(dir, 'csv') }, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr + r.stdout); // los avisos no detienen la publicación
  return { dir, out: r.stdout + r.stderr };
}

test('sincronización: avisa de enlaces a piezas que no existen, a sí misma o mal escritos, y no detiene la publicación', () => {
  const { out, dir } = runSyncWith({
    p00: ['Mira [la otra](p01) y [un fantasma](p99).', 'Largo con [sí misma](p00).'],
    p02: ['Mira [roto] (p01).', 'Largo bien con [la otra](p03).'],
  });
  assert.match(out, /NO existen en el Sheets/);
  assert.match(out, /p00 \(guion_corto\) → p99/);
  assert.match(out, /propia pieza/);
  assert.match(out, /p00 \(guion_largo\)/);
  assert.match(out, /mal escritos/);
  assert.match(out, /p02 \(guion_corto\)/);
  assert.ok(!/p02 \(guion_largo\)/.test(out), 'un enlace bueno no debe avisar');
  // El adelanto público no lleva la marca
  const pub = JSON.parse(fs.readFileSync(path.join(dir, 'public/data/pieces.json'), 'utf8'));
  assert.ok(!JSON.stringify(pub).includes('](p01)'));
});
