import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { avance, indice, splitPiece, buildBundles, bundleLangs, writePrivate, readFullPieces } from '../privado-lib.mjs';
import { main as subir, listTextFiles } from '../subir-textos.mjs';

const pieza = {
  piece_id: 'p1', titulo: 'Uno', frase_gancho: 'Gancho', guion_corto: 'Primera frase. Segunda frase. Tercera frase.', guion_largo: 'Largo completo secreto.',
  retos_observacion: ['a', 'b'], especificaciones: { Cultura: 'Maya', Material: 'Jade' }, faq_mito: { pregunta: 'p', respuesta: 'r' },
  guion_corto_en: 'First sentence. Second.', guion_largo_en: 'Long text.', faq_mito_fr: { pregunta: 'q', respuesta: 'a' },
};

test('avance: primeras frases sin pasarse; vacío si no hay texto', () => {
  assert.equal(avance(''), '');
  assert.equal(avance('Una. Dos. Tres.', 8), 'Una.');
  const largo = 'Palabra '.repeat(80);
  assert.ok(avance(largo).length <= 262 && avance(largo).endsWith('…'));
});

test('índice: palabras distintas, sin acentos y en orden alfabético', () => {
  assert.equal(indice('Piedra del Sol, piedra Mexica'), 'mexica piedra');
});

test('splitPiece: lo privado sale de lo público y se agregan adelanto, cultura, índice e idiomas con texto', () => {
  const { pub, priv } = splitPiece(pieza);
  for (const k of ['guion_corto', 'guion_largo', 'retos_observacion', 'especificaciones', 'faq_mito', 'guion_corto_en', 'faq_mito_fr']) {
    assert.ok(!(k in pub), k);
    assert.ok(k in priv, k);
  }
  assert.equal(pub.titulo, 'Uno');
  assert.equal(pub.cultura, 'Maya');
  assert.equal(pub.avance, 'Primera frase. Segunda frase. Tercera frase.');
  assert.equal(pub.avance_en, 'First sentence. Second.');
  assert.deepEqual(pub.idiomas_texto, ['en']);
  assert.ok(pub.indice.includes('frase'));
  assert.ok(!JSON.stringify(pub).includes('secreto'));
});

test('archivos por idioma: español sin lo de otros idiomas; inglés con lo base y lo suyo; solo idiomas con texto', () => {
  assert.deepEqual(bundleLangs([pieza]).sort(), ['en', 'es']);
  const b = buildBundles([pieza], ['es', 'en', 'fr']);
  assert.ok(b.es.pieces.p1.guion_largo && !('guion_corto_en' in b.es.pieces.p1) && !('faq_mito_fr' in b.es.pieces.p1));
  assert.equal(b.en.pieces.p1.guion_corto_en, 'First sentence. Second.');
  assert.ok(b.en.pieces.p1.guion_largo);
  assert.ok('faq_mito_fr' in b.fr.pieces.p1 && !('guion_corto_en' in b.fr.pieces.p1));
});

test('writePrivate + readFullPieces + subir-textos (simulado y con cliente falso)', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'textos-'));
  writePrivate(root, [pieza]);
  assert.equal(readFullPieces(root)[0].guion_largo, 'Largo completo secreto.');
  assert.deepEqual(listTextFiles(root).map((f) => f.key), ['texto/en.json', 'texto/es.json']);
  const logs = [];
  subir({ simular: true, root, log: (m) => logs.push(m) });
  assert.ok(logs.join('\n').includes('texto/es.json'));
  const puestos = [];
  const r = subir({ root, r2: { put: (key, file, ct) => puestos.push([key, ct, fs.existsSync(file)]) }, log: () => {} });
  assert.equal(r.subidos, 2);
  assert.deepEqual(puestos.map((p) => p[0]), ['texto/en.json', 'texto/es.json']);
  assert.ok(puestos.every((p) => p[1].startsWith('application/json') && p[2]));
});

test('subir-textos se niega si falta el español, si no hay archivos o si faltan las claves', () => {
  const vacio = fs.mkdtempSync(path.join(os.tmpdir(), 'textos-'));
  assert.throws(() => subir({ simular: true, root: vacio, log: () => {} }), /No hay textos/);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'textos-'));
  fs.mkdirSync(path.join(root, 'datos-privados/texto'), { recursive: true });
  fs.writeFileSync(path.join(root, 'datos-privados/texto/en.json'), '{}');
  assert.throws(() => subir({ simular: true, root, log: () => {} }), /español/);
  fs.writeFileSync(path.join(root, 'datos-privados/texto/es.json'), '{}');
  const antes = { ...process.env };
  delete process.env.CLOUDFLARE_API_TOKEN;
  delete process.env.CLOUDFLARE_ACCOUNT_ID;
  assert.throws(() => subir({ root, log: () => {} }), /CLOUDFLARE_API_TOKEN/);
  Object.assign(process.env, antes);
});
