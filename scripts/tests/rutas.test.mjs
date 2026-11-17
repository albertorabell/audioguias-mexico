import test from 'node:test';
import assert from 'node:assert/strict';
import { leerRuta, rutaDe, canonicaDe } from '../../src/utils/rutas.js';

test('leerRuta: sitio y parada', () => {
  assert.deepEqual(leerRuta('/sitio/mna'), { sitio: 'mna', parada: '' });
  assert.deepEqual(leerRuta('/sitio/mna/'), { sitio: 'mna', parada: '' });
  assert.deepEqual(leerRuta('/sitio/teotihuacan/teo_11_piramide_sol'), { sitio: 'teotihuacan', parada: 'teo_11_piramide_sol' });
});

test('leerRuta: lo que no es una dirección de sitio da null', () => {
  for (const p of ['/', '', '/guias/museo/', '/sitio', '/sitio/', '/sitio/a/b/c', '/sitio/<script>', '/sitio/%E0%A4%A', undefined, null]) assert.equal(leerRuta(p), null, String(p));
});

test('rutaDe: minúsculas, codificada y sin sitio = raíz', () => {
  assert.equal(rutaDe('MNA'), '/sitio/mna');
  assert.equal(rutaDe('MNA', 'mna_s06_piedra_sol'), '/sitio/mna/mna_s06_piedra_sol');
  assert.equal(rutaDe(''), '/');
  assert.equal(rutaDe(null), '/');
});

test('canonicaDe: raíz, sitio y parada; el resto cae a la raíz', () => {
  assert.equal(canonicaDe('/'), 'https://xolotli.com/');
  assert.equal(canonicaDe('/sitio/MNA'), 'https://xolotli.com/sitio/mna');
  assert.equal(canonicaDe('/sitio/mna/x1'), 'https://xolotli.com/sitio/mna/x1');
  assert.equal(canonicaDe('/cualquier/cosa'), 'https://xolotli.com/');
});

test('canonicaDe con el mapa de guías: sitio → su guía; parada gratis → su página; parada de pago → la guía del sitio', () => {
  const mapa = { v: 1, sitios: { mna: '/guias/museo/' }, paradas: { 'mna/mna_s06_piedra_sol': '/guias/museo/piedra-del-sol/' } };
  assert.equal(canonicaDe('/sitio/MNA', mapa), 'https://xolotli.com/guias/museo/');
  assert.equal(canonicaDe('/sitio/mna/mna_s06_piedra_sol', mapa), 'https://xolotli.com/guias/museo/piedra-del-sol/');
  assert.equal(canonicaDe('/sitio/mna/mna_s06_coatlicue', mapa), 'https://xolotli.com/guias/museo/');
  assert.equal(canonicaDe('/sitio/otro/x', mapa), 'https://xolotli.com/sitio/otro/x');
  assert.equal(canonicaDe('/', mapa), 'https://xolotli.com/');
  assert.equal(canonicaDe('/sitio/mna', null), 'https://xolotli.com/sitio/mna');
});
