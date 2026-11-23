import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugDeRuta } from '../../src/utils/aliado.js';

test('slugDeRuta: solo /h/<slug> válido', () => {
  assert.equal(slugDeRuta('/h/presidente'), 'presidente');
  assert.equal(slugDeRuta('/h/Presidente/'), 'presidente');
  assert.equal(slugDeRuta('/h/casa-azul_2'), 'casa-azul_2');
  assert.equal(slugDeRuta('/h/'), '');
  assert.equal(slugDeRuta('/h/a'), '');
  assert.equal(slugDeRuta('/h/x/y'), '');
  assert.equal(slugDeRuta('/sitio/mna'), '');
  assert.equal(slugDeRuta('/h/ñandú'), '');
  assert.equal(slugDeRuta(''), '');
});
