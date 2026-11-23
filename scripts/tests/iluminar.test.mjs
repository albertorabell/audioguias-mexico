import test from 'node:test';
import assert from 'node:assert/strict';
import { dividirFrases, fraseActiva } from '../../src/utils/iluminarTexto.js';

test('dividirFrases: al juntar las frases sale el texto original', () => {
  const t = 'Primera frase. ¿Segunda? ¡Tercera!\n\nOtro párrafo con "comillas." Y fin…';
  assert.equal(dividirFrases(t).map((f) => f.texto).join(''), t);
  assert.ok(dividirFrases(t).length >= 5);
});

test('dividirFrases: un enlace no se parte aunque tenga punto dentro', () => {
  const f = dividirFrases('Mira [Piedra del Sol. Famosa](mna_s06) ahora. Luego sigue.');
  assert.ok(f[0].texto.includes('[Piedra del Sol. Famosa](mna_s06)'));
  assert.equal(f.length, 2);
});

test('dividirFrases: texto vacío o sin puntuación', () => {
  assert.deepEqual(dividirFrases(''), []);
  assert.equal(dividirFrases('Sin punto final').length, 1);
});

test('fraseActiva: -1 al inicio, avanza con el progreso y termina en la última', () => {
  const f = dividirFrases('Una frase corta. Otra frase un poco más larga que la anterior. Final.');
  assert.equal(fraseActiva(f, 0), -1);
  assert.equal(fraseActiva(f, 0.01), 0);
  assert.equal(fraseActiva(f, 0.99), f.length - 1);
  assert.equal(fraseActiva(f, 1), f.length - 1);
  let previo = -1;
  for (let p = 0.01; p <= 1; p += 0.05) {
    const i = fraseActiva(f, p);
    assert.ok(i >= previo);
    previo = i;
  }
  assert.equal(fraseActiva([], 0.5), -1);
});
