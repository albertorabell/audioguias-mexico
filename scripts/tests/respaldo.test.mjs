// Pruebas del respaldo: qué textos se recogen y cómo se parten los idiomas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filasDeTexto } from '../respaldo.mjs';

test('respaldo: cada texto sale con su campo e idioma; lo vacío y lo que no es texto se ignora', () => {
  const f = filasDeTexto('pieza', 'p1', { guion_corto: 'hola', guion_corto_en: 'hi', titulo_fr: 'titre', titulo_pl: 'tytuł', n: 3, vacio: '  ', audio: { x: 1 } });
  assert.deepEqual(f, [
    ['pieza', 'p1', 'guion_corto', 'es', 'hola'],
    ['pieza', 'p1', 'guion_corto', 'en', 'hi'],
    ['pieza', 'p1', 'titulo', 'fr', 'titre'],
    ['pieza', 'p1', 'titulo', 'pl', 'tytuł'],
  ]);
});

test('respaldo: un texto más largo que una celda de Google se corta con aviso', () => {
  const [fila] = filasDeTexto('pieza', 'p1', { guion_largo: 'a'.repeat(60000) });
  assert.ok(fila[4].length < 46000);
  assert.match(fila[4], /cortado/);
});
