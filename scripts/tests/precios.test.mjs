import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leerAcceso, leerComboPase, construirPrecios, aplicarPreciosASites, manifiestoSitio } from '../sitios-extra-lib.mjs';
import { leerCodigos } from '../publicar-codigos.mjs';

test('leerAcceso entiende pago, gratis y código con o sin acentos', () => {
  for (const v of ['', 'pago', 'Pago', 'de pago']) assert.equal(leerAcceso(v), 'pago');
  for (const v of ['gratis', 'Gratuito', 'libre']) assert.equal(leerAcceso(v), 'gratis');
  for (const v of ['código', 'codigo', 'Solo código', 'SOLO CODIGO']) assert.equal(leerAcceso(v), 'codigo');
  assert.equal(leerAcceso('quizá'), null);
});

test('leerComboPase: lee la fila, respeta activo=NO y exige precio en pesos', () => {
  const cab = ['activo', 'nombre', 'precio_mxn', 'precio_usd'];
  assert.deepEqual(leerComboPase([cab, ['SI', 'Todos los sitios', '$249', '14.5']]), { nombre: 'Todos los sitios', mxn: 249, usd: 14.5 });
  assert.equal(leerComboPase([cab, ['NO', 'x', '249', '14']]), null);
  assert.equal(leerComboPase([cab, ['SI', 'x', '', '14']]), null);
  assert.equal(leerComboPase([cab]), null);
  assert.equal(leerComboPase(null), null);
});

test('construirPrecios arma la tabla y avisa de lo que falta', () => {
  const avisos = [];
  const t = construirPrecios(
    [
      { site_id: 'mna', prefijo: 'mna_', nombre: 'MNA', precio_mxn: '99', precio_usd: '6', acceso: 'pago' },
      { site_id: 'muestra', prefijo: 'mue_', nombre: 'Muestra', acceso: 'Gratis' },
      { site_id: 'raro', prefijo: 'raro', nombre: 'Sin guion bajo' },
      { site_id: 'torpe', prefijo: 'tor_', nombre: 'Torpe', precio_mxn: '80', acceso: 'quizá' },
      { site_id: 'sinprecio', prefijo: 'sin_', nombre: 'Sin precio' },
    ],
    { nombre: 'Todos', mxn: 249, usd: null },
    (m) => avisos.push(m)
  );
  assert.deepEqual(Object.keys(t.sites), ['mna', 'muestra', 'torpe', 'sinprecio']);
  assert.deepEqual(t.sites.mna, { prefijo: 'mna_', nombre: 'MNA', acceso: 'pago', mxn: 99, usd: 6 });
  assert.equal(t.sites.muestra.acceso, 'gratis');
  assert.equal(t.sites.torpe.acceso, 'pago');
  assert.equal(t.combo.mxn, 249);
  assert.equal(avisos.length, 3); // prefijo inválido, acceso que no se entiende, pago sin precio
  assert.equal(construirPrecios([], null).combo, null);
});

test('aplicarPreciosASites pone acceso y precios sin borrar los que ya había', () => {
  const tabla = construirPrecios([
    { site_id: 'mna', prefijo: 'mna_', precio_usd: '6' },
    { site_id: 'chichen_itza', prefijo: 'chi_', precio_mxn: '120', acceso: 'codigo' },
  ]);
  const lista = aplicarPreciosASites([{ id: 'MNA', pass_price_mxn: 99 }, { id: 'CHICHEN_ITZA' }, { id: 'OTRO' }], tabla);
  assert.deepEqual(lista[0], { id: 'MNA', pass_price_mxn: 99, pass_price_usd: 6, access: 'paid' });
  assert.deepEqual(lista[1], { id: 'CHICHEN_ITZA', pass_price_mxn: 120, access: 'code' });
  assert.deepEqual(lista[2], { id: 'OTRO' });
});

test('manifiestoSitio incluye el precio en dólares', () => {
  const m = manifiestoSitio({ site_id: 'x_y', nombre: 'X', precio_mxn: '99', precio_usd: '6' }, [], null);
  assert.equal(m.pass_price_mxn, 99);
  assert.equal(m.pass_price_usd, 6);
});

test('leerCodigos: normaliza, valida y avisa', () => {
  const cab = ['codigo', 'sitio', 'horas', 'usos', 'vence', 'activo', 'nota'];
  const { codes, avisos } = leerCodigos([
    cab,
    ['hotel-mx1', 'Hotel', '24', '50', '2026-12-31', '', 'convenio'],
    ['AB', 'mna', '', '', '', '', ''],
    ['SINSITIO1', '', '', '', '', '', ''],
    ['HOTELMX1', 'mna', '', '', '', '', ''], // repetido
    ['VIEJO123', 'todos', '', '', '31/12/2026', 'NO', ''],
    ['', '', '', '', '', '', ''],
  ]);
  assert.deepEqual(codes, [
    { code: 'HOTELMX1', site: 'hotel', hours: 24, uses: 50, expires: '2026-12-31' },
    { code: 'VIEJO123', site: 'todos', active: false },
  ]);
  assert.equal(avisos.length, 4);
  assert.deepEqual(leerCodigos([cab]), { codes: [], avisos: [] });
});
