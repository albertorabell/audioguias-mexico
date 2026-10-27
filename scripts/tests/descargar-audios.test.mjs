import test from 'node:test';
import assert from 'node:assert/strict';
import { listaDeAudios } from '../descargar-audios.mjs';

test('descargar audios: usa la carpeta libre/ o pago/ según el manifiesto y solo el idioma pedido', () => {
  const manifest = {
    version: 1,
    items: {
      es: {
        mna_a: { corto: { file: 'es/mna_a_corto.mp3', remote: false, bytes: 10 }, largo: { file: 'es/mna_a_largo.mp3', remote: true, bytes: 20 } },
      },
      en: { mna_a: { corto: { file: 'en/mna_a_corto.mp3', remote: true, bytes: 5 } } },
    },
  };
  const es = listaDeAudios(manifest, 'es');
  assert.deepEqual(es.map((a) => a.key), ['libre/es/mna_a_corto.mp3', 'pago/es/mna_a_largo.mp3']);
  assert.deepEqual(listaDeAudios(manifest, 'en').map((a) => a.key), ['pago/en/mna_a_corto.mp3']);
  assert.deepEqual(listaDeAudios(manifest, 'fr'), []);
});
