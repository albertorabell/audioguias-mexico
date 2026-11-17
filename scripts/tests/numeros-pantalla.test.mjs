import test from 'node:test';
import assert from 'node:assert/strict';
import { aDigitos } from '../../src/utils/numerosPantalla.js';
import { scriptFor } from '../audio-lib.mjs';

const c = (t) => aDigitos(t);

test('años y cantidades grandes', () => {
  assert.equal(c('En mil novecientos treinta y cuatro llegó.'), 'En 1934 llegó.');
  assert.equal(c('unos dos mil quinientos años'), 'unos 2500 años');
  assert.equal(c('entre setecientos y quinientos años antes de Cristo'), 'entre 700 y 500 años antes de Cristo');
  assert.equal(c('trescientos mil'), '300 000');
  assert.equal(c('dos millones de personas'), '2 millones de personas');
});

test('del uno al nueve se quedan en letra, salvo tras Monumento, Estructura…', () => {
  assert.equal(c('dos cerros y una vez'), 'dos cerros y una vez');
  assert.equal(c('el Monumento nueve y la Estructura cuatro'), 'el Monumento 9 y la Estructura 4');
  assert.equal(c('más de cuarenta monumentos; tres significados'), 'más de 40 monumentos; tres significados');
});

test('siglos y medidas', () => {
  assert.equal(c('en el siglo quince'), 'en el siglo XV');
  assert.equal(c('Mide un metro ochenta por un metro cincuenta'), 'Mide 1,80 m por 1,50 m');
});

test('no cruza la puntuación ni toca los destinos de enlaces', () => {
  assert.equal(c('cien; treinta y dos'), '100; 32');
  assert.equal(c('[Estructura cuatro](chz_05_estructura_4)'), '[Estructura 4](chz_05_estructura_4)');
  assert.equal(c('miles de años, mil años'), 'miles de años, 1000 años');
});

test('otros idiomas y valores raros pasan igual', () => {
  assert.equal(aDigitos('twenty years', 'en'), 'twenty years');
  assert.equal(aDigitos('', 'es'), '');
  assert.equal(aDigitos(undefined, 'es'), undefined);
});

test('el texto de voz no cambia: scriptFor sigue leyendo las letras', () => {
  const pieza = { guion_corto: 'En mil novecientos treinta y cuatro.' };
  assert.equal(scriptFor(pieza, 'es', 'corto'), 'En mil novecientos treinta y cuatro.');
});
