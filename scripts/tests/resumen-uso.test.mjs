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

test('resumen de uso: embudo, aliados, primer audio y paradas de ruta', () => {
  const conteos = {
    '2026-11-16': {
      'app_open|mna||es||qr': 10, 'first_audio|||||10': 4, 'first_audio|||||60': 2, 'free_end|mna|a_uno|es||': 3,
      'paywall_block|mna|a_uno|es||': 2, 'paywall_open|mna|||||': 2, 'checkout_start|mna||es||': 1, 'purchase|mna|||||mxn': 1,
      'ally_visit|||||hotel_x': 3, 'route_stop|mna|ruta_a|||1': 5, 'route_stop|mna|ruta_a|||2': 3, 'audio_error|mna|a_uno|es||': 1,
      'guide_sample|mna|mna_s06_piedra_sol|es||': 4, 'guide_sample|mna|mna_s06_piedra_sol|en||': 1,
    },
  };
  const t = resumir(conteos, 7);
  assert.match(t, /2\. Primer audio: \*\*6\*\* \(60 % de las visitas\)/);
  assert.match(t, /6\. Pagaron: \*\*1\*\* \(100 % de quienes abrieron el pago\)/);
  assert.match(t, /- hotel_x: 3/);
  assert.match(t, /ruta_a: parada 1: 5 · parada 2: 3/);
  assert.match(t, /- 10: 4\n- 60: 2/);
  assert.match(t, /Errores de audio: 1/);
  assert.match(t, /Escuchar 30 s.*\n- mna \/ mna_s06_piedra_sol: 5/);
});
