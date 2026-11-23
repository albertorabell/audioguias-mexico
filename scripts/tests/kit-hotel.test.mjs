import { test } from 'node:test';
import assert from 'node:assert/strict';
import { textosKit, urlAliado } from '../kit-hotel.mjs';

test('kit de hotel: enlace y oferta según gratis o descuento', () => {
  assert.equal(urlAliado('presidente'), 'https://xolotli.com/h/presidente');
  assert.match(textosKit({ nombre: 'Hotel X', descuento: 15, gratis: false }).es.oferta, /15% de descuento/);
  assert.match(textosKit({ nombre: 'Hotel X', descuento: 15, gratis: false }).en.oferta, /15% off/);
  assert.match(textosKit({ nombre: 'Hotel X', descuento: 15, gratis: true }).es.oferta, /gratis/);
  assert.match(textosKit({ nombre: 'Hotel X', descuento: 15, gratis: true }).es.sub, /Hotel X/);
});
