import test from 'node:test';
import assert from 'node:assert/strict';
import { pareceEspanol, revisarObjeto } from '../revisar-idiomas.mjs';

test('pareceEspanol detecta español dentro de otro idioma y no marca nombres propios', () => {
  assert.equal(pareceEspanol('Veintiuna paradas, cuatro caminatas y tres paradas en el Museo de Sitio, con rutas de lo esencial a la visita completa', 'en'), true);
  assert.equal(pareceEspanol('Twenty-one stops, four walks and three stops at the Site Museum, with routes from the essentials to the full visit', 'en'), false);
  assert.equal(pareceEspanol('Templo Mayor', 'en', 'Templo Mayor'), false);
  assert.equal(pareceEspanol('Frida, Diego et Trotski ont vécu ici, et l’on y mange, on y bavarde et on y flâne encore comme au village.', 'fr'), false);
  assert.equal(pareceEspanol('Continue diante da pirâmide: o que esta parada conta está dentro e debaixo dela.', 'pt'), false);
});

test('revisarObjeto marca campos traducibles a los que les falta un idioma', () => {
  const h = revisarObjeto([{ id: 'X', intro: 'Texto en español largo', intro_en: 'English text', intro_fr: 'Texte', intro_pl: 'Tekst', intro_de: 'Text', intro_pt: 'Texto' }], 'sites.json');
  assert.deepEqual(h.map((x) => x.campo), ['intro_it']);
});
