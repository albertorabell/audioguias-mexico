// Páginas públicas para Google: lo que dicen, y que NUNCA lleven texto de pago.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { armarPagina, armarSitemap, duracion, recorridoPrincipal, textoEnHtml, recortar } from '../seo-lib.mjs';

const sitio = { id: 'MNA', name: 'Museo Nacional de Antropología', location: 'Bosque de Chapultepec, Ciudad de México', description: 'El recinto más importante.', intro: 'Primer párrafo.\n\nSegundo párrafo.', pass_price_mxn: 99 };
const piezas = [
  { piece_id: 'a', title: 'Piedra del Sol', frase_gancho: 'El calendario mexica.', is_free: true, image_filename: 'a.webp', guion_corto: 'SECRETO DE PAGO', avance: 'Adelanto' },
  { piece_id: 'b', title: 'Coatlicue', frase_gancho: 'Madre de dioses.', is_free: false },
];
const rutas = [
  { id: 'r1', name: 'Larga', duration: '3 h', estimated_minutes: 180, stops: [{ id: 'b', piece_id: 'b', title: 'Coatlicue' }, { id: 'a', piece_id: 'a', title: 'Piedra del Sol' }] },
  { id: 'r2', name: 'Corta', duration: '40 min', estimated_minutes: 40, stops: [{ id: 'a', piece_id: 'a', title: 'Piedra del Sol' }] },
];
const manifiesto = { routes: rutas, before_visit: [{ topic: 'horario', title: 'Horario', text: 'Martes a domingo.\n\n- Cierra los lunes\n- Entrada <libre> los domingos' }] };
const salas = [{ room_id: 's2', numero_oficial: '2', nombre_oficial: 'Sala Dos' }, { room_id: 's1', numero_oficial: '1', nombre_oficial: 'Sala Uno', frase_gancho: 'La primera.' }];

test('duración: minutos a texto con espacios que no se parten', () => {
  assert.equal(duracion(70), '1 h 10 min');
  assert.equal(duracion(120), '2 h');
  assert.equal(duracion(40), '40 min');
  assert.equal(duracion(0), '');
});

test('recorrido principal: el marcado; si no, el más corto', () => {
  assert.equal(recorridoPrincipal(rutas).id, 'r2');
  assert.equal(recorridoPrincipal([{ ...rutas[0], principal: true }, rutas[1]]).id, 'r1');
  assert.equal(recorridoPrincipal([]), null);
});

test('página: título, descripción, dirección canónica, datos estructurados y botón a la app', () => {
  const { html, url, titulo, descripcion } = armarPagina({ sitio, manifiesto, salas, piezas, slug: 'museo-nacional-de-antropologia', articulo: 'el', portada: '/images/pieces/a.webp' });
  assert.equal(url, 'https://xolotli.com/guias/museo-nacional-de-antropologia/');
  assert.match(titulo, /Museo Nacional de Antropología: audioguía/);
  assert.ok(descripcion.length <= 160);
  assert.ok(html.includes('<link rel="canonical" href="https://xolotli.com/guias/museo-nacional-de-antropologia/">'));
  assert.ok(html.includes('href="/?sitio=MNA"'));
  assert.ok(html.includes('<h1>Museo Nacional de Antropología: audioguía para tu visita</h1>'));
  assert.ok(html.includes('Qué ver en el Museo Nacional de Antropología: Corta'));
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.deepEqual(ld['@graph'].map((x) => x['@type'].toString()), ['Museum,TouristAttraction', 'WebPage', 'BreadcrumbList']);
  assert.ok(html.includes('og:image" content="https://xolotli.com/images/pieces/a.webp"'));
});

test('página: salas en orden, «Antes de ir» con listas, y el texto se escapa', () => {
  const { html } = armarPagina({ sitio, manifiesto, salas, piezas, slug: 'x' });
  assert.ok(html.indexOf('Sala Uno') < html.indexOf('Sala Dos'));
  assert.ok(html.includes('<li>Cierra los lunes</li>'));
  assert.ok(html.includes('Entrada &lt;libre&gt; los domingos'));
  assert.ok(!html.includes('<libre>'));
});

test('página: NUNCA lleva texto de pago, aunque la pieza lo traiga', () => {
  const { html } = armarPagina({ sitio, manifiesto, salas, piezas, slug: 'x' });
  assert.ok(!html.includes('SECRETO DE PAGO'));
  assert.ok(!html.includes('Adelanto'));
});

test('página: un sitio al aire libre habla de paradas y zonas', () => {
  const { html } = armarPagina({ sitio: { ...sitio, name: 'Zona Arqueológica de Teotihuacán', id: 'TEOTIHUACAN' }, manifiesto: { ...manifiesto, layout: 'zones' }, salas, piezas, slug: 'teo', articulo: 'la' });
  assert.ok(html.includes('<h2>Zonas</h2>'));
  assert.ok(html.includes('Sobre el sitio'));
  assert.ok(html.includes('Qué ver en la Zona Arqueológica de Teotihuacán'));
  assert.ok(!html.includes('"Museum"'));
});

test('sitemap: la portada y cada guía, con fecha', () => {
  const x = armarSitemap(['https://xolotli.com/guias/a/'], new Date('2026-10-28T12:00:00Z'));
  assert.ok(x.includes('<loc>https://xolotli.com/</loc><lastmod>2026-10-28</lastmod>'));
  assert.ok(x.includes('<loc>https://xolotli.com/guias/a/</loc>'));
});

test('textos: párrafos, listas y recorte sin partir palabras', () => {
  assert.equal(textoEnHtml('Uno\n\n- a\n- b'), '<p>Uno</p>\n<ul><li>a</li><li>b</li></ul>');
  assert.ok(recortar('palabra '.repeat(40), 50).length <= 50);
});
