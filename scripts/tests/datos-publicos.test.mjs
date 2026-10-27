// Ningún archivo de datos que se guarde en el repositorio (público) puede traer los textos de pago.
// Esos textos viven en datos-privados/ (fuera de git) y en Cloudflare R2.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const PRIVADOS = /^(guion_largo|guion_corto|retos_observacion|especificaciones|faq_mito)(_[a-z]{2})?$/;

function archivosPieces(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...archivosPieces(p));
    else if (e.name === 'pieces.json') out.push(p);
  }
  return out;
}

test('public/data/**/pieces.json no trae guiones, retos, mitos ni fichas técnicas', () => {
  const archivos = archivosPieces(path.join(ROOT, 'public/data'));
  assert.ok(archivos.length > 0);
  for (const f of archivos) {
    const piezas = JSON.parse(fs.readFileSync(f, 'utf8'));
    for (const pieza of piezas) {
      const campos = Object.keys(pieza).filter((k) => PRIVADOS.test(k) && String(pieza[k] || '').trim());
      assert.deepEqual(campos, [], `${path.relative(ROOT, f)} · ${pieza.piece_id || pieza.id}: trae texto de pago (${campos.join(', ')})`);
    }
  }
});
