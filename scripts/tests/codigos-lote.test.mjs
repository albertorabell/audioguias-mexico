import test from 'node:test';
import assert from 'node:assert/strict';
import { generarLote, filasATexto, reporteATexto } from '../codigos-lote-lib.mjs';

test('lote: cantidad pedida, sin repetidos, un solo uso y días en horas', () => {
  const filas = generarLote({ prefijo: 'viator', cantidad: 50, sitio: 'cdmx', dias: 30, vence: '2027-12-31', nota: 'lote 1' });
  assert.equal(filas.length, 50);
  assert.equal(new Set(filas.map((f) => f[0])).size, 50);
  assert.match(filas[0][0], /^VIATOR-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  assert.deepEqual(filas[0].slice(1), ['cdmx', '720', '1', '2027-12-31', 'SI', 'lote 1']);
});

test('lote: repite si el azar choca', () => {
  let n = 0;
  const azar = () => (n++ < 2 ? 'AAAAAAAA' : `BBBBB${n}XX`.slice(0, 8));
  assert.equal(new Set(generarLote({ prefijo: 'X', cantidad: 2 }, azar).map((f) => f[0])).size, 2);
});

test('lote: rechaza datos malos con un mensaje claro', () => {
  assert.throws(() => generarLote({ prefijo: '', cantidad: 5 }), /prefijo/);
  assert.throws(() => generarLote({ prefijo: 'ABCDEFGHI', cantidad: 5 }), /prefijo/);
  assert.throws(() => generarLote({ prefijo: 'A', cantidad: 0 }), /cantidad/);
  assert.throws(() => generarLote({ prefijo: 'A', cantidad: 501 }), /cantidad/);
  assert.throws(() => generarLote({ prefijo: 'A', cantidad: 5, dias: 0 }), /días/);
  assert.throws(() => generarLote({ prefijo: 'A', cantidad: 5, vence: '31/12/2027' }), /AAAA-MM-DD/);
});

test('texto para pegar y reporte legible', () => {
  assert.equal(filasATexto([['A', 'b'], ['C', 'd']]), 'A\tb\nC\td');
  const t = reporteATexto({ total: 2, used: 1, redemptions: 1, codes: [{ code: 'VIATOR1', site: 'todos', uses: 1, maxUses: 1, expiresAt: Date.UTC(2027, 11, 31) }, { code: 'HOTEL2', site: 'mna', uses: 0, maxUses: 0, expiresAt: 0 }] });
  assert.match(t, /Códigos: 2 · usados: 1 · canjes: 1/);
  assert.match(t, /VIATOR1\ttodos\t1\t1\t2027-12-31/);
  assert.match(t, /HOTEL2\tmna\t0\t∞\t—/);
});
