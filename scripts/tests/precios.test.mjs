import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leerAcceso, leerCombos, construirPrecios, aplicarPreciosASites, manifiestoSitio } from '../sitios-extra-lib.mjs';
import { leerCodigos } from '../publicar-codigos.mjs';

test('leerAcceso entiende pago, gratis y código con o sin acentos', () => {
  for (const v of ['', 'pago', 'Pago', 'de pago']) assert.equal(leerAcceso(v), 'pago');
  for (const v of ['gratis', 'Gratuito', 'libre']) assert.equal(leerAcceso(v), 'gratis');
  for (const v of ['código', 'codigo', 'Solo código', 'SOLO CODIGO']) assert.equal(leerAcceso(v), 'codigo');
  assert.equal(leerAcceso('quizá'), null);
});

test('leerCombos: lee un renglón por paquete, con nombres por idioma, y avisa de lo dudoso', () => {
  const cab = ['id', 'nombre', 'nombre_en', 'sitios', 'precio_mxn', 'precio_usd', 'activo', 'notas'];
  const avisos = [];
  const c = leerCombos(
    [
      cab,
      ['Centro', 'Centro Histórico completo', 'Historic Centre', 'centro_historico, templo_mayor_catedral', '$139', '8', '', 'nota'],
      ['todos', 'Todos los sitios', '', 'TODOS', '399', '24', 'SI', ''],
      ['apagado', 'X', '', 'mna', '10', '', 'NO', ''],
      ['sinprecio', 'Y', '', 'mna', '', '', '', ''],
      ['m', 'id corto', '', 'mna', '10', '', '', ''],
      ['centro', 'Repetido', '', 'mna', '10', '', '', ''],
      ['', '', '', '', '', '', '', ''],
    ],
    (m) => avisos.push(m)
  );
  assert.deepEqual(c, [
    { id: 'centro', nombre: { es: 'Centro Histórico completo', en: 'Historic Centre' }, sitios: ['centro_historico', 'templo_mayor_catedral'], mxn: 139, usd: 8 },
    { id: 'todos', nombre: { es: 'Todos los sitios' }, sitios: 'todos', mxn: 399, usd: 24 },
  ]);
  assert.equal(avisos.length, 3);
  assert.deepEqual(leerCombos([cab]), []);
  assert.deepEqual(leerCombos(null), []);
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
    [
      { id: 'duo', nombre: { es: 'Dúo' }, sitios: ['mna', 'torpe', 'fantasma'], mxn: 150, usd: null },
      { id: 'vacio', nombre: { es: 'Vacío' }, sitios: ['fantasma'], mxn: 10, usd: null },
      { id: 'mna', nombre: { es: 'Choca' }, sitios: 'todos', mxn: 10, usd: null },
      { id: 'todos', nombre: { es: 'Mal' }, sitios: ['mna'], mxn: 10, usd: null },
    ],
    (m) => avisos.push(m)
  );
  assert.deepEqual(Object.keys(t.sites), ['mna', 'muestra', 'torpe', 'sinprecio']);
  assert.deepEqual(t.sites.mna, { prefijo: 'mna_', nombre: 'MNA', acceso: 'pago', mxn: 99, usd: 6 });
  assert.equal(t.sites.muestra.acceso, 'gratis');
  assert.equal(t.sites.torpe.acceso, 'pago');
  assert.deepEqual(t.combos, { duo: { nombre: { es: 'Dúo' }, sitios: ['mna', 'torpe'], mxn: 150, usd: null } });
  // prefijo inválido, acceso que no se entiende, pago sin precio, sitio inexistente (2 veces), id de sitio, «todos» mal usado
  assert.equal(avisos.length, 8);
  assert.deepEqual(construirPrecios([], undefined).combos, {});
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
