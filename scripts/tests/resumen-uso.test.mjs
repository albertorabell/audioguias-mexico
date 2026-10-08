import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resumir } from '../resumen-uso.mjs';

test('resumen de uso: suma días, ordena obras y separa voz buena / voz del teléfono', () => {
  const conteos = {
    '2026-10-08': { 'app_open|mna||es||': 3, 'piece_view|mna|a_uno|es||': 5, 'piece_view|mna|b_dos|es||': 2, 'audio_play|mna|a_uno|es|corto|mp3': 4, 'audio_play|mna|a_uno|es|corto|voz': 1, 'purchase|mna|||||mxn': 1, _descartados: 9 },
    '2026-10-07': { 'piece_view|mna|b_dos|en||': 4, 'app_open|mna||en||': 1 },
  };
  const t = resumir(conteos, 7);
  assert.match(t, /Veces que se abrió la app: \*\*4\*\*/);
  assert.match(t, /Obras vistas: \*\*11\*\*/);
  assert.match(t, /voz buena: 4, voz del teléfono: 1/);
  assert.ok(t.indexOf('1. b_dos — 6') < t.indexOf('2. a_uno — 5'));
  assert.match(resumir({}, 30), /todavía no hay datos/);
});
