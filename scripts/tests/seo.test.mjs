// Páginas públicas para Google: lo que dicen, y que NUNCA lleven texto de pago.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ajustes, clipDe, botonMuestra, armarLlms, armarMapaGuias, enApp, armarPagina, armarSitemap, duracion, recorridoPrincipal, textoEnHtml, recortar, idiomaDisponible, direccion, contar, slugificar, armarPiezaPagina, piezaPublicable, direccionPieza } from '../seo-lib.mjs';

const cfg = { articulo: 'el', slugs: { es: 'museo', en: 'museum', fr: 'musee', pl: 'muzeum' }, nombres: { en: 'The Museum', fr: 'Le Musée', pl: 'Muzeum' } };

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
  const { html, url, titulo, descripcion } = armarPagina({ sitio, manifiesto, salas, piezas, cfg: { ...cfg, slugs: { es: 'museo-nacional-de-antropologia' } }, portada: '/images/pieces/a.webp' });
  assert.equal(url, 'https://xolotli.com/guias/museo-nacional-de-antropologia/');
  assert.match(titulo, /Museo Nacional de Antropología: audioguía y qué ver/);
  assert.ok(descripcion.length <= 160);
  assert.ok(html.includes('<link rel="canonical" href="https://xolotli.com/guias/museo-nacional-de-antropologia/">'));
  assert.ok(html.includes('href="/sitio/mna?idioma=es"'));
  assert.ok(html.includes('<h1>Museo Nacional de Antropología: audioguía para tu visita</h1>'));
  assert.ok(html.includes('Qué ver en el Museo Nacional de Antropología: Corta'));
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.deepEqual(ld['@graph'].map((x) => x['@type'].toString()), ['Museum,TouristAttraction', 'Product', 'FAQPage', 'WebPage', 'BreadcrumbList']);
  assert.ok(html.includes('og:image" content="https://xolotli.com/og/guias__museo-nacional-de-antropologia.jpg"'));
});

test('página: salas en orden, «Antes de ir» con listas, y el texto se escapa', () => {
  const { html } = armarPagina({ sitio, manifiesto, salas, piezas, cfg });
  assert.ok(html.indexOf('Sala Uno') < html.indexOf('Sala Dos'));
  assert.ok(html.includes('<li>Cierra los lunes</li>'));
  assert.ok(html.includes('Entrada &lt;libre&gt; los domingos'));
  assert.ok(!html.includes('<libre>'));
});

test('página: NUNCA lleva texto de pago, aunque la pieza lo traiga', () => {
  const { html } = armarPagina({ sitio, manifiesto, salas, piezas, cfg });
  assert.ok(!html.includes('SECRETO DE PAGO'));
  assert.ok(!html.includes('Adelanto'));
});

test('página: un sitio al aire libre habla de paradas y zonas', () => {
  const { html } = armarPagina({ sitio: { ...sitio, name: 'Zona Arqueológica de Teotihuacán', id: 'TEOTIHUACAN' }, manifiesto: { ...manifiesto, layout: 'zones' }, salas, piezas, cfg: { ...cfg, articulo: 'la' } });
  assert.ok(html.includes('<h2>Zonas</h2>'));
  assert.ok(html.includes('Sobre el sitio'));
  assert.ok(html.includes('Qué ver en la Zona Arqueológica de Teotihuacán'));
  assert.ok(!html.includes('"Museum"'));
});

test('sitemap: la portada y cada guía, con fecha', () => {
  const x = armarSitemap([[{ lang: 'es', url: 'https://xolotli.com/guias/a/' }]], new Date('2026-10-28T12:00:00Z'));
  assert.ok(x.includes('<loc>https://xolotli.com/</loc>'));
  assert.ok(!x.includes('lastmod'));
  assert.ok(x.includes('<loc>https://xolotli.com/guias/a/</loc>'));
});

test('textos: párrafos, listas y recorte sin partir palabras', () => {
  assert.equal(textoEnHtml('Uno\n\n- a\n- b'), '<p>Uno</p>\n<ul><li>a</li><li>b</li></ul>');
  assert.ok(recortar('palabra '.repeat(40), 50).length <= 50);
});

const sitioEn = { ...sitio, name_en: 'National Museum', description_en: 'The key museum.', intro_en: 'First.' };
const rutasEn = [{ ...rutas[1], name_en: 'Short' }, rutas[0]];
const manEn = { routes: rutasEn, before_visit: [{ title: 'Horario', text: 'x', title_en: 'Hours', text_en: 'Tue to Sun.' }] };

test('idiomas: español siempre; otro idioma solo con nombre y al menos dos cosas traducidas', () => {
  assert.equal(idiomaDisponible({ sitio, manifiesto, cfg }, 'es'), true);
  assert.equal(idiomaDisponible({ sitio: sitioEn, manifiesto: manEn, cfg }, 'en'), true);
  assert.equal(idiomaDisponible({ sitio, manifiesto, cfg }, 'fr'), false);
  assert.equal(idiomaDisponible({ sitio: { ...sitio, name_en: 'X' }, manifiesto, cfg }, 'en'), false);
});

test('página en inglés: dirección propia, hreflang, botón con idioma y nada de español', () => {
  const { html, url } = armarPagina({ sitio: sitioEn, manifiesto: manEn, salas: [], piezas, cfg, lang: 'en', idiomas: ['es', 'en'] });
  assert.equal(url, 'https://xolotli.com/en/guides/museum/');
  assert.ok(html.includes('<html lang="en">'));
  assert.ok(html.includes('hreflang="es" href="https://xolotli.com/guias/museo/"'));
  assert.ok(html.includes('hreflang="x-default"'));
  assert.ok(html.includes('href="/sitio/mna?idioma=en"'));
  assert.ok(html.includes('Hours') && html.includes('Tue to Sun.'));
  assert.ok(!html.includes('Martes a domingo'));
  assert.ok(!html.includes('Larga'));
  assert.ok(!html.includes('SECRETO DE PAGO'));
});

test('sitemap: cada página con sus alternativas de idioma', () => {
  const x = armarSitemap([[{ lang: 'es', url: 'https://xolotli.com/guias/a/' }, { lang: 'en', url: 'https://xolotli.com/en/guides/a/' }]]);
  assert.ok(x.includes('hreflang="en" href="https://xolotli.com/en/guides/a/"'));
  assert.ok(x.includes('xmlns:xhtml'));
});

test('direcciones y plurales', () => {
  assert.equal(direccion('x', 'pl'), '/pl/przewodniki/x/');
  assert.equal(contar('pl', 2, true), '2 przystanki');
  assert.equal(contar('pl', 5, false), '5 dzieł');
  assert.equal(contar('fr', 1, false), '1 œuvre');
});

test('sitio sin publicar: la página dice «próximamente» y no lleva botón ni precio', () => {
  const { html } = armarPagina({ sitio, manifiesto, salas, piezas, cfg: { ...cfg, proximamente: true } });
  assert.ok(html.includes('Próximamente: esta audioguía'));
  assert.ok(!html.includes('/sitio/mna'));
  assert.ok(!html.includes('30 días'));
  assert.ok(!html.includes('gratis'));
});

const libre = { piece_id: 'a', titulo: 'Piedra del Sol', frase_gancho: 'El calendario mexica.', is_free: true, guion_corto: 'Corto con [Disco](mna_x).', guion_largo: 'Largo.\n\nOtro párrafo <b>.', titulo_en: 'Sun Stone', guion_corto_en: 'English text.' };

test('slug: sin acentos ni signos', () => {
  assert.equal(slugificar('Máscara de Pakal'), 'mascara-de-pakal');
  assert.equal(slugificar('Łódź – « Œuvre »'), 'lodz-oeuvre');
});

test('pieza: solo las gratis con título y texto en ese idioma tienen página', () => {
  assert.equal(piezaPublicable(libre, 'es'), true);
  assert.equal(piezaPublicable(libre, 'en'), true);
  assert.equal(piezaPublicable(libre, 'fr'), false);
  assert.equal(piezaPublicable({ ...libre, is_free: false }, 'es'), false);
  assert.equal(direccionPieza(cfg, libre, 'en'), '/en/guides/museum/sun-stone/');
});

test('pieza: página con su texto, sin marcas de enlace, escapada, y botón a la app', () => {
  const { html, url } = armarPiezaPagina({ sitio, manifiesto, cfg, pieza: libre, sala: salas[1], lang: 'es', idiomas: ['es', 'en'] });
  assert.equal(url, 'https://xolotli.com/guias/museo/piedra-del-sol/');
  assert.ok(html.includes('<h1>Piedra del Sol</h1>'));
  assert.ok(html.includes('Otro párrafo &lt;b&gt;.'));
  assert.ok(!html.includes('mna_x'));
  assert.ok(html.includes('Ubicación: Sala Uno, Museo Nacional de Antropología.'));
  assert.ok(html.includes('hreflang="en" href="https://xolotli.com/en/guides/museum/sun-stone/"'));
  assert.ok(html.includes('href="/sitio/mna/a?idioma=es"'));
});

test('pieza en inglés: nada de español', () => {
  const { html } = armarPiezaPagina({ sitio: { ...sitio, name_en: 'National Museum' }, manifiesto, cfg, pieza: libre, lang: 'en', idiomas: ['es', 'en'] });
  assert.ok(html.includes('<h1>Sun Stone</h1>'));
  assert.ok(html.includes('English text.'));
  assert.ok(!html.includes('Corto') && !html.includes('Largo') && !html.includes('calendario'));
});

test('página del sitio: lista las piezas gratis con enlace', () => {
  const { html } = armarPagina({ sitio, manifiesto, salas, piezas, cfg, gratisEnlaces: [{ titulo: 'Piedra del Sol', url: '/guias/museo/piedra-del-sol/' }] });
  assert.ok(html.includes('<h2>Obras para probar gratis</h2>'));
  assert.ok(html.includes('<a href="/guias/museo/piedra-del-sol/">Piedra del Sol</a>'));
});

test('alemán y portugués: dirección propia, hreflang y textos en su idioma; sin sus datos no hay página', () => {
  const cfg2 = { ...cfg, slugs: { ...cfg.slugs, de: 'museum-de', pt: 'museu-pt' }, nombres: { ...cfg.nombres, de: 'Das Museum', pt: 'O Museu' } };
  assert.equal(direccion('museum-de', 'de'), '/de/fuehrer/museum-de/');
  assert.equal(direccion('museu-pt', 'pt'), '/pt/guias/museu-pt/');
  assert.equal(contar('de', 2, false), '2 Werke');
  assert.equal(contar('pt', 1, true), '1 parada');
  const s2 = { ...sitio, description_de: 'Das wichtigste Haus.', intro_de: 'Erster Absatz.', description_pt: 'O espaço mais importante.', intro_pt: 'Primeiro parágrafo.' };
  assert.equal(idiomaDisponible({ sitio, manifiesto: {}, cfg: cfg2 }, 'de'), false);
  assert.equal(idiomaDisponible({ sitio: s2, manifiesto: {}, cfg: cfg2 }, 'de'), true);
  const de = armarPagina({ sitio: s2, manifiesto, salas, piezas, cfg: cfg2, lang: 'de', idiomas: ['es', 'de', 'pt'] });
  assert.equal(de.url, 'https://xolotli.com/de/fuehrer/museum-de/');
  assert.ok(de.html.includes('<html lang="de">') && de.html.includes('hreflang="pt"') && de.html.includes('og:locale" content="de_DE"'));
  assert.ok(de.html.includes('Audioguide für deinen Besuch'));
  const pt = armarPagina({ sitio: s2, manifiesto, salas, piezas, cfg: cfg2, lang: 'pt', idiomas: ['es', 'de', 'pt'] });
  assert.ok(pt.html.includes('<html lang="pt">') && pt.html.includes('og:locale" content="pt_BR"'));
});

test('botón «Escuchar 30 s»: solo si hay clip, nunca arranca solo, y en el idioma de la página', () => {
  const existe = (r) => r === '/audio/muestras/piedra_sol_es.mp3' || r === '/audio/muestras/x_en.mp3';
  assert.equal(clipDe(existe, 'mna_s06_piedra_sol', 'es'), '/audio/muestras/piedra_sol_es.mp3');
  assert.equal(clipDe(existe, 'x', 'en'), '/audio/muestras/x_en.mp3');
  assert.equal(clipDe(existe, 'x', 'fr'), '');
  assert.equal(botonMuestra('es', ''), '');
  assert.ok(botonMuestra('en', '/audio/muestras/x_en.mp3').includes('▶ Listen for 30 s'));
  const con = armarPagina({ sitio, manifiesto, salas, piezas, cfg, muestra: '/audio/muestras/piedra_sol_es.mp3' }).html;
  assert.ok(con.includes('data-src="/audio/muestras/piedra_sol_es.mp3"') && con.includes('▶ Escuchar 30 s') && con.includes('/guias-muestra.js'));
  assert.ok(!/autoplay/i.test(con));
  const sin = armarPagina({ sitio, manifiesto, salas, piezas, cfg }).html;
  assert.ok(!sin.includes('muestra-btn"') && !sin.includes('guias-muestra.js'));
});

test('precio: oferta en datos estructurados y «30 días» en el texto (ya no 72 horas)', () => {
  const { html } = armarPagina({ sitio: { ...sitio, pass_price_usd: 7 }, manifiesto, salas, piezas, cfg });
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  const prod = ld['@graph'].find((x) => x['@type'] === 'Product');
  assert.deepEqual(prod.offers.map((o) => [o.price, o.priceCurrency]), [[99, 'MXN'], [7, 'USD']]);
  assert.ok(html.includes('Acceso completo de 30 días por $99 MXN'));
  assert.ok(!html.includes('72'));
  const en = armarPagina({ sitio: { ...sitio, pass_price_usd: 7, name_en: 'Museum' }, manifiesto, salas, piezas, cfg, lang: 'en', idiomas: ['es', 'en'] }).html;
  assert.ok(en.includes('30-day full access for US$7'));
});

test('llms.txt: sitios, idiomas, paradas gratis y precio; nada de texto de pago', () => {
  const t = armarLlms([{ nombre: 'Museo', resumen: 'El recinto.', precio: 'MX$99 / US$7', paginas: { es: 'https://xolotli.com/guias/museo/', en: 'https://xolotli.com/en/guides/museum/' }, gratis: [{ titulo: 'Piedra del Sol', url: 'https://xolotli.com/guias/museo/piedra-del-sol/' }] }]);
  assert.ok(t.startsWith('# Xolotli'));
  assert.ok(t.includes('- [Museo](https://xolotli.com/guias/museo/): El recinto. Acceso completo de 30 días: MX$99 / US$7.'));
  assert.ok(t.includes('[en](https://xolotli.com/en/guides/museum/)'));
  assert.ok(t.includes('[Piedra del Sol](https://xolotli.com/guias/museo/piedra-del-sol/)'));
  assert.ok(t.includes('sitemap.xml'));
});

test('mapa de guías para la canónica de /sitio/, y dirección dentro de la app', () => {
  const m = armarMapaGuias([{ id: 'MNA', urlSitio: '/guias/museo/', paradas: { a: '/guias/museo/piedra-del-sol/' } }, { id: 'X' }]);
  assert.deepEqual(m, { v: 1, sitios: { mna: '/guias/museo/' }, paradas: { 'mna/a': '/guias/museo/piedra-del-sol/' } });
  assert.equal(enApp('MNA', 'fr'), '/sitio/mna?idioma=fr');
  assert.equal(enApp('MNA', 'fr', 'a b'), '/sitio/mna/a%20b?idioma=fr');
});

test('botón «Escuchar 30 s»: con servidor de medición lleva sitio, pieza, idioma y dirección; sin él no mide', () => {
  const antes = ajustes.api;
  try {
    ajustes.api = 'https://pagos.example/';
    const con = botonMuestra('en', '/audio/muestras/x_en.mp3', { sitio: 'MNA', pieza: 'mna_s06_piedra_sol' });
    assert.ok(con.includes('data-api="https://pagos.example"') && con.includes('data-site="mna"') && con.includes('data-piece="mna_s06_piedra_sol"') && con.includes('data-lang="en"'));
    ajustes.api = '';
    assert.ok(!botonMuestra('en', '/audio/muestras/x_en.mp3', { sitio: 'MNA' }).includes('data-api'));
  } finally {
    ajustes.api = antes;
  }
});

// ── Páginas agrupadas ──
import { HUBS, armarHub, direccionHub, detalleDeSitio } from '../seo-lib.mjs';

test('hubs: cada grupo tiene dirección, título, texto en los 7 idiomas y no repite direcciones', () => {
  const vistas = new Set();
  for (const hub of Object.values(HUBS)) {
    for (const l of ['es', 'en', 'fr', 'pl', 'de', 'pt', 'it']) {
      for (const campo of ['h1', 'titulo', 'lead', 'intro', 'slugs']) assert.ok(hub[campo][l] && hub[campo][l].length > 3, `${campo} ${l}`);
      const d = direccionHub(hub, l);
      assert.ok(!vistas.has(d), `repetida ${d}`);
      vistas.add(d);
    }
  }
});

test('hubs: arma la página con enlaces a los sitios, hreflang y datos estructurados; con menos de 2 sitios no sale', () => {
  const hub = HUBS.morelos;
  const entradas = [{ nombre: 'Cuernavaca Histórica', url: '/guias/cuernavaca-historica/', lead: 'Centro.' }, { nombre: 'Xochicalco', url: '/guias/zona-arqueologica-de-xochicalco/', lead: '' }];
  const r = armarHub({ hub, lang: 'es', idiomas: ['es', 'en'], entradas });
  assert.match(r.html, /<title>Qué ver en Morelos/);
  assert.match(r.html, /href="\/guias\/cuernavaca-historica\/"/);
  assert.match(r.html, /hreflang="en" href="https:\/\/xolotli.com\/en\/guides\/what-to-see-in-morelos\/"/);
  assert.match(r.html, /CollectionPage/);
  assert.equal(armarHub({ hub, lang: 'es', entradas: entradas.slice(0, 1) }), null);
});

import { ofertaDigital } from '../seo-lib.mjs';
test('oferta del pase: trae política de devolución (30 días, enlace a los términos) y envío gratuito inmediato', () => {
  const o = ofertaDigital(149, 'MXN', 'https://xolotli.com/guias/x/', 'fr');
  assert.equal(o.hasMerchantReturnPolicy.merchantReturnDays, 30);
  assert.equal(o.hasMerchantReturnPolicy.merchantReturnLink, 'https://xolotli.com/terminos/fr/');
  assert.equal(o.shippingDetails.shippingRate.value, 0);
  assert.equal(o.shippingDetails.shippingRate.currency, 'MXN');
  assert.ok(o.shippingDetails.shippingDestination.length > 5);
});

test('portada con texto: enlaces a las guías, otros idiomas y JSON-LD con la lista', async () => {
  const { armarPortadaEstatica, inyectarPortada } = await import('../seo-lib.mjs');
  const portada = armarPortadaEstatica({
    sitios: [{ nombre: 'Museo <Uno>', lugar: 'CDMX', lead: 'Un museo.', mxn: 149, nombres: { en: 'Museum One' }, urls: { es: '/guias/museo-uno/', en: '/en/guides/museum-one/' } }, { nombre: 'Sin página', urls: {} }],
    hubs: [{ nombre: 'Zonas arqueológicas', url: '/guias/zonas/' }],
  });
  assert.match(portada.cuerpo, /<h1>Xolotli: audioguías/);
  assert.match(portada.cuerpo, /href="\/guias\/museo-uno\/"/);
  assert.match(portada.cuerpo, /href="\/en\/guides\/museum-one\/" hreflang="en"/);
  assert.match(portada.cuerpo, /Museo &lt;Uno&gt;/);
  assert.doesNotMatch(portada.cuerpo, /Sin página/);
  assert.equal(portada.itemList.itemListElement.length, 1);

  const base = '<head><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebSite","name":"X"}]}</script></head><body><div id="root" class="a b">\n  </div><script src="/x.js"></script></body>';
  const html = inyectarPortada(base, portada);
  assert.match(html, /<div id="root" class="a b">\n<style>/);
  assert.match(html, /"@type":"ItemList"/);
  assert.match(html, /"@type":"WebSite"/);
  assert.equal(inyectarPortada(base, portada).match(/"@type":"ItemList"/g).length, 1);
  assert.equal(inyectarPortada('<div id="root">ya tiene algo</div>', portada), null);
});

test('portadas por idioma: título, hreflang recíproco con x-default, lista de guías y aviso de entrada', async () => {
  const { armarPortadaIdioma, hreflangPortadas } = await import('../seo-lib.mjs');
  const sitios = [{ nombre: 'Museo Uno', nombres: { en: 'Museum One' }, lugar: 'CDMX', lead: 'x', leads: { en: 'The museum.' }, mxn: 99, usd: 7, urls: { es: '/guias/museo-uno/', en: '/en/guides/museum-one/' } }];
  const r = armarPortadaIdioma({ lang: 'en', sitios, hubs: [], idiomas: ['es', 'en', 'fr'] });
  assert.equal(r.url, 'https://xolotli.com/en/');
  assert.ok(r.titulo.length <= 60);
  assert.ok(r.descripcion.length <= 160);
  assert.ok(r.html.includes('href="/en/guides/museum-one/"'));
  assert.ok(r.html.includes('30-day full access: US$7'));
  assert.ok(r.html.includes('Admission to the site is not included.'));
  assert.ok(r.html.includes('hreflang="x-default" href="https://xolotli.com/"'));
  assert.ok(r.html.includes('hreflang="fr" href="https://xolotli.com/fr/"'));
  assert.ok(hreflangPortadas(['es', 'en']).includes('hreflang="es" href="https://xolotli.com/"'));
});

test('imágenes sociales: nombre de archivo por dirección, título partido y og:image propio en cada página', async () => {
  const { ogNombre, partirTitulo, capaOg } = await import('../og-lib.mjs');
  assert.equal(ogNombre('https://xolotli.com/'), 'inicio.jpg');
  assert.equal(ogNombre('/en/'), 'en.jpg');
  assert.equal(ogNombre('https://xolotli.com/en/guides/museum/sun-stone/'), 'en__guides__museum__sun-stone.jpg');
  const l = partirTitulo('Templo Mayor y Catedral Metropolitana de la Ciudad de México y más');
  assert.ok(l.length <= 3 && l.every((x) => x.length <= 34));
  assert.ok(capaOg({ titulo: 'A & B <x>' }).toString().includes('A &amp; B &lt;x&gt;'));
  const { armarPortadaIdioma } = await import('../seo-lib.mjs');
  const r = armarPortadaIdioma({ lang: 'fr', sitios: [], hubs: [] });
  assert.ok(r.html.includes('<meta property="og:image" content="https://xolotli.com/og/fr.jpg">'));
  assert.ok(r.html.includes('og:image:width" content="1200"'));
});

test('inyectarPortada: los hreflang del <head> se añaden aunque el cuerpo ya traiga enlaces con hreflang', async () => {
  const { armarPortadaEstatica, inyectarPortada, hreflangPortadas } = await import('../seo-lib.mjs');
  const idx = '<html><head><meta property="og:image" content="https://xolotli.com/pwa-512x512.png"><script type="application/ld+json">{}</script></head><body><div id="root"></div></body></html>';
  const p = armarPortadaEstatica({ sitios: [{ nombre: 'M', nombres: { en: 'M' }, urls: { es: '/guias/m/', en: '/en/guides/m/' } }] });
  const out = inyectarPortada(idx, p, hreflangPortadas());
  assert.ok(out.slice(0, out.indexOf('</head>')).includes('hreflang="x-default"'));
  assert.ok(out.includes('content="https://xolotli.com/og/inicio.jpg"'));
});

test('FAQ de la guía: visible, en JSON-LD, sin inventar datos, y no sale en sitios «próximamente»', async () => {
  const { faqDeGuia } = await import('../seo-lib.mjs');
  const { html } = armarPagina({ sitio, manifiesto, salas, piezas, cfg });
  assert.ok(html.includes('<dl class="faq">'));
  assert.ok(html.includes('Preguntas frecuentes sobre la audioguía de Museo Nacional de Antropología'));
  assert.ok(html.includes('hasta 2 teléfonos'));
  const f = faqDeGuia({ lang: 'en', nombre: 'Museum', precioTexto: '30-day full access for US$7.', nGratis: '2 stops', idiomas: ['es', 'en'] });
  assert.equal(f.length, 6);
  assert.ok(f[3][1].includes('Español, English'));
  assert.equal(faqDeGuia({ lang: 'fr', nombre: 'X', idiomas: ['fr'] }).some(([q]) => /gratuitement/.test(q)), false);
  const pronto = armarPagina({ sitio, manifiesto, salas, piezas, cfg: { ...cfg, proximamente: true } }).html;
  assert.ok(!pronto.includes('<dl class="faq">'));
});

test('inyectarPortada: la portada trae meta robots en el <head> y no la duplica si ya existe', async () => {
  const { armarPortadaEstatica, inyectarPortada } = await import('../seo-lib.mjs');
  const p = armarPortadaEstatica({ sitios: [] });
  const sin = '<html><head><script type="application/ld+json">{}</script></head><body><div id="root"></div></body></html>';
  const out = inyectarPortada(sin, p);
  const cabeza = out.slice(0, out.indexOf('</head>'));
  assert.equal(cabeza.match(/name="robots"/g).length, 1);
  assert.ok(cabeza.includes('content="index, follow, max-image-preview:large"'));
  const con = '<html><head><meta name="robots" content="index, follow"><script type="application/ld+json">{}</script></head><body><div id="root"></div></body></html>';
  const out2 = inyectarPortada(con, p);
  assert.equal(out2.slice(0, out2.indexOf('</head>')).match(/name="robots"/g).length, 1);
});


test('hubs: cada sitio sale con ficha (resumen, recorridos, piezas gratis, precio) y el grupo con preguntas frecuentes; nada del guion', () => {
  const hub = HUBS.morelos;
  const d = detalleDeSitio({ sitio, manifiesto, piezas, cfg, lang: 'es' });
  assert.equal(d.rutas.length, 2);
  assert.deepEqual(d.gratis.map((g) => g.titulo), ['Piedra del Sol']);
  assert.match(d.gratis[0].url, /^\/guias\/museo\/piedra-del-sol\/$/);
  assert.match(d.precio, /99/);
  const entradas = [
    { nombre: 'Museo A', url: '/guias/museo/', lead: 'Centro.', detalle: d },
    { nombre: 'Museo B', url: '/guias/otro/', lead: '', detalle: detalleDeSitio({ sitio, manifiesto, piezas, cfg, lang: 'es' }) },
  ];
  const r = armarHub({ hub, lang: 'es', idiomas: ['es', 'en'], entradas });
  assert.match(r.html, /<h3><a href="\/guias\/museo\/">Museo A<\/a><\/h3>/);
  assert.match(r.html, /Larga \(3 h/);
  assert.match(r.html, /href="\/guias\/museo\/piedra-del-sol\/">Piedra del Sol<\/a>/);
  assert.match(r.html, /"@type":"FAQPage"/);
  assert.match(r.html, /<h2>Preguntas frecuentes<\/h2>/);
  assert.ok(!r.html.includes('SECRETO DE PAGO'), 'el hub no lleva texto de guiones');
  // un sitio «próximamente» no ofrece precio ni piezas
  const pronto = detalleDeSitio({ sitio, manifiesto, piezas, cfg: { ...cfg, proximamente: true }, lang: 'es' });
  assert.equal(pronto.precio, '');
  assert.equal(pronto.gratis.length, 0);
  // en otro idioma solo salen recorridos con nombre traducido
  assert.equal(detalleDeSitio({ sitio, manifiesto, piezas, cfg, lang: 'en' }).rutas.length, 0);
});
