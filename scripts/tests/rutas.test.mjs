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
