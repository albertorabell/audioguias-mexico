// Pruebas de la descarga de fotos: título del archivo y licencias permitidas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tituloDeUrl, licenciaPermitida } from '../descargar-fotos.mjs';

test('fotos: el título sale de la URL de Commons (con acentos y guiones bajos)', () => {
  assert.equal(tituloDeUrl('https://commons.wikimedia.org/wiki/File:Palacio_de_Bellas_Artes_%281%29.jpg'), 'File:Palacio de Bellas Artes (1).jpg');
  assert.equal(tituloDeUrl('https://example.com/foto.jpg'), null);
  assert.equal(tituloDeUrl(''), null);
});

test('fotos: solo licencias abiertas permitidas', () => {
  for (const ok of ['CC BY-SA 4.0', 'CC BY 3.0', 'CC0', 'Public domain', 'CC BY-SA 2.5 Generic']) assert.equal(licenciaPermitida(ok), true, ok);
  for (const no of ['CC BY-NC 4.0', 'CC BY-ND 2.0', 'CC BY-NC-SA 3.0', 'Copyrighted', '']) assert.equal(licenciaPermitida(no), false, no);
});
