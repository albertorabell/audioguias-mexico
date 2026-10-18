// Pruebas de los sitios genéricos de CONTROL: recorridos, manifiesto y entrada de sites.json.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { partirRutas, leerDefinicionesRutas, construirRutasSitio, manifiestoSitio, entradaSitio, mezclarSites } from '../sitios-extra-lib.mjs';

const defs = leerDefinicionesRutas([
  ['ruta', 'nombre', 'duracion', 'minutos', 'descripcion', 'nombre_en'],
  ['corto', 'Corto', '3 h', '180', 'Lo esencial', 'Short'],
  ['completa', 'Completo', '2 días', '720', 'Todo', ''],
  ['', 'sin clave', '', '', '', ''],
]);
const salas = [{ room_id: 'r2', numero_oficial: '2', nombre_oficial: 'Dos' }, { room_id: 'r1', numero_oficial: '1', nombre_oficial: 'Uno' }];
const piezas = [
  { piece_id: 'x_b', room_id: 'r2', orden_sugerido: 1, titulo: 'B', is_free: true, image_filename: 'x_b.webp', map_x: 50, map_y: 50 },
  { piece_id: 'x_a', room_id: 'r1', orden_sugerido: 2, titulo: 'A', is_free: false, image_filename: '', map_x: 50, map_y: 50 },
  { piece_id: 'x_c', room_id: 'r1', orden_sugerido: 1, titulo: 'C', is_free: true, image_filename: 'x_c.webp', map_x: 50, map_y: 50 },
];
const rutasPorId = new Map([['x_b', partirRutas('corto|completa')], ['x_a', partirRutas('completa')], ['x_c', partirRutas(' Completa ')]]);

test('sitios genéricos: las definiciones salen de la pestaña RUTAS y se ignoran las filas sin clave', () => {
  assert.deepEqual(defs.map((d) => d.key), ['corto', 'completa']);
  assert.equal(defs[0].estimated_minutes, 180);
  assert.equal(defs[0].name_en, 'Short');
  assert.equal(defs[1].name_en, undefined);
});

test('sitios genéricos: cada recorrido ordena por zona y orden sugerido, y avisa de claves desconocidas', () => {
  const avisos = [];
  const rutas = construirRutasSitio('x', piezas, salas, defs, new Map([...rutasPorId, ['x_a', ['raro']]]), (k, m) => avisos.push(`${k} ${m}`));
  assert.deepEqual(rutas[0].stops.map((s) => s.id), ['x_b']);
  assert.deepEqual(rutas[1].stops.map((s) => s.id), ['x_c', 'x_b']);
  assert.equal(avisos.length, 1);
  const todas = construirRutasSitio('x', piezas, salas, defs, rutasPorId);
  assert.deepEqual(todas[1].stops.map((s) => s.id), ['x_c', 'x_a', 'x_b']);
  assert.equal(todas[1].stops[1].is_premium, true);
  assert.equal(todas[1].stops[0].file, 'data/x/pieces.json');
});

test('sitios genéricos: manifiesto y entrada de sites.json', () => {
  const sitio = { site_id: 'centro_historico', nombre: 'Centro Histórico', precio_mxn: '99', ubicacion: 'CDMX', descripcion: 'Dos días a pie', insignia: 'Patrimonio' };
  const m = manifiestoSitio(sitio, []);
  assert.equal(m.site_id, 'CENTRO_HISTORICO');
  assert.equal(m.pass_price_mxn, 99);
  assert.equal(m.layout, 'zones');
  assert.equal(m.pieces_path, 'data/centro_historico/pieces.json');
  const e = entradaSitio(sitio, salas, piezas, { name_en: 'Historic Centre', short_name: 'Centro' }, { preview: true });
  assert.equal(e.status, 'preview');
  assert.equal(e.name_en, 'Historic Centre');
  assert.equal(e.short_name, 'Centro');
  assert.equal(e.path, 'data/centro_historico/centro_historico.json');
  assert.equal(e.total_stops, 2);
  assert.equal(e.highlights_count, 3);
  assert.equal(e.cover_image, 'x_b.webp');
  const sin = entradaSitio({ site_id: 'y', nombre: 'Y' }, [], [], {});
  assert.equal(sin.status, 'active');
  assert.equal(sin.pass_price_mxn, undefined);
});

test('sitios genéricos: sites.json reemplaza la entrada del mismo id y agrega las nuevas', () => {
  const r = mezclarSites([{ id: 'MNA' }, { id: 'CHAPULTEPEC', status: 'coming_soon' }], [{ id: 'CHAPULTEPEC', status: 'active' }, { id: 'NUEVO', status: 'preview' }]);
  assert.deepEqual(r.map((s) => `${s.id}:${s.status || ''}`), ['MNA:', 'CHAPULTEPEC:active', 'NUEVO:preview']);
});

test('recorridos del MNA y Teotihuacán: la pestaña RUTAS pisa solo lo que trae lleno', async () => {
  const { aplicarDefiniciones, leerDefinicionesRutas } = await import('../sitios-extra-lib.mjs');
  const defs = leerDefinicionesRutas([
    ['ruta', 'nombre', 'duracion', 'minutos', 'descripcion', 'descripcion_en'],
    ['ruta-uno', 'Uno nuevo', '', '', 'Texto nuevo', 'New text'],
    ['express', 'Exprés', '1 h', '60', '', ''],
    ['no-existe', 'X', '', '', 'x', ''],
  ]);
  const rutas = [
    { id: 'ruta-uno', name: 'Uno', duration: '45 min', description: 'viejo', description_fr: 'ancien', stops: [1] },
    { id: 'ruta-express', name: 'Exprés', duration: '3 h', description: 'viejo2', stops: [2] },
  ];
  const r = aplicarDefiniciones(rutas, defs, (x) => (x.id === 'ruta-express' ? 'express' : ''));
  assert.equal(r.rutas[0].name, 'Uno nuevo');
  assert.equal(r.rutas[0].duration, '45 min');
  assert.equal(r.rutas[0].description, 'Texto nuevo');
  assert.equal(r.rutas[0].description_en, 'New text');
  assert.equal(r.rutas[0].description_fr, 'ancien');
  assert.deepEqual(r.rutas[0].stops, [1]);
  assert.equal(r.rutas[1].name, 'Exprés');
  assert.equal(r.rutas[1].duration, '1 h');
  assert.equal(r.rutas[1].estimated_minutes, 60);
  assert.deepEqual(r.sinUsar, ['no-existe']);
});
