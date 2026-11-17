// Busca en Wikimedia Commons planos y croquis de los sitios y baja los que tienen licencia abierta
// (dominio público, CC0, CC BY, CC BY-SA). Guarda el archivo y su ficha (autor, licencia, página) para revisar
// a mano cuáles sirven como referencia para redibujar los planos de la app. No publica nada.
// Uso: node scripts/mapa/commons-planos.mjs <carpeta-salida>
import fs from 'node:fs';
import path from 'node:path';

const API = 'https://commons.wikimedia.org/w/api.php';
const AGENTE = 'XolotliMapas/1.0 (+https://xolotli.com)';

// Búsquedas por sitio (texto libre en archivos) y archivos conocidos por nombre exacto.
const BUSQUEDAS = {
  mna: ['Museo Nacional de Antropología plano', 'National Museum of Anthropology Mexico floor plan'],
  chapultepec: ['Castillo de Chapultepec plano', 'Chapultepec Castle plan'],
  templo_mayor_catedral: ['Catedral Metropolitana México planta', 'Templo Mayor Tenochtitlan plano etapas', 'Museo del Templo Mayor plano', 'Recinto ceremonial Tenochtitlan plano'],
  museo_frida_kahlo: ['Casa Azul Frida Kahlo plano', 'Museo Frida Kahlo planta'],
  basilica_guadalupe: ['Basílica de Guadalupe plano', 'Villa de Guadalupe plano Tepeyac', 'Antigua Basílica de Guadalupe planta'],
  teotihuacan: ['Teotihuacan map plan', 'Teotihuacan plano Calzada de los Muertos', 'Ciudadela Teotihuacan plan'],
  chichen_itza: ['Chichen Itza map plan', 'Chichén Itzá plano'],
  xochicalco: ['Xochicalco plano', 'Xochicalco map'],
  chalcatzingo: ['Chalcatzingo plano', 'Chalcatzingo map monuments'],
};
const EXACTOS = ['File:Croquis de Catedral Metropolitana CD Mexico.svg'];

const LIBRE = /^(public domain|pd|cc0|cc[- ]by(-sa)?([- ][\d.]+)?|cc by(-sa)? [\d.]+|attribution|gfdl)/i;

async function api(params) {
  const u = new URL(API);
  for (const [k, v] of Object.entries({ format: 'json', formatversion: '2', ...params })) u.searchParams.set(k, v);
  const r = await fetch(u, { headers: { 'User-Agent': AGENTE } });
  if (!r.ok) throw new Error(`Commons HTTP ${r.status}`);
  return r.json();
}

async function fichas(titulos) {
  if (!titulos.length) return [];
  const d = await api({ action: 'query', titles: titulos.join('|'), prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1600' });
  return (d.query?.pages || []).filter((p) => p.imageinfo?.length).map((p) => {
    const ii = p.imageinfo[0];
    const m = ii.extmetadata || {};
    const limpiar = (s) => String(s?.value || '').replace(/<[^>]+>/g, '').trim();
    return {
      titulo: p.title,
      pagina: ii.descriptionurl,
      url: ii.url,
      miniatura: ii.thumburl,
      mime: ii.mime,
      ancho: ii.width,
      alto: ii.height,
      bytes: ii.size,
      licencia: limpiar(m.LicenseShortName),
      autor: limpiar(m.Artist),
      descripcion: limpiar(m.ImageDescription).slice(0, 400),
      fecha: limpiar(m.DateTimeOriginal),
    };
  });
}

const [, , salida = 'osm-datos/planos'] = process.argv;
fs.mkdirSync(salida, { recursive: true });
const todo = {};
for (const [sitio, consultas] of Object.entries(BUSQUEDAS)) {
  const titulos = new Set(sitio === 'templo_mayor_catedral' ? EXACTOS : []);
  for (const q of consultas) {
    try {
      const d = await api({ action: 'query', list: 'search', srnamespace: '6', srlimit: '12', srsearch: q });
      for (const s of d.query?.search || []) titulos.add(s.title);
    } catch (e) { console.warn(`${sitio} «${q}»: ${e.message}`); }
    await new Promise((ok) => setTimeout(ok, 800));
  }
  const lista = [];
  const arr = [...titulos];
  for (let i = 0; i < arr.length; i += 40) lista.push(...(await fichas(arr.slice(i, i + 40))));
  const dir = path.join(salida, sitio);
  fs.mkdirSync(dir, { recursive: true });
  for (const f of lista) {
    f.libre = LIBRE.test(f.licencia);
    // Se baja una vista de 1600 px (o el SVG original) solo si la licencia es abierta
    if (!f.libre) continue;
    const src = f.mime === 'image/svg+xml' && f.bytes < 8e6 ? f.url : f.miniatura;
    if (!src) continue;
    const nombre = f.titulo.replace(/^File:/, '').replace(/[^\w.\-]+/g, '_').slice(0, 120) + (src === f.url ? '' : '.jpg');
    try {
      const r = await fetch(src, { headers: { 'User-Agent': AGENTE } });
      if (r.ok) { fs.writeFileSync(path.join(dir, nombre), Buffer.from(await r.arrayBuffer())); f.archivo = nombre; }
    } catch (e) { f.error = e.message; }
    await new Promise((ok) => setTimeout(ok, 400));
  }
  todo[sitio] = lista;
  console.log(`${sitio}: ${lista.length} archivos encontrados, ${lista.filter((f) => f.archivo).length} bajados`);
}
fs.writeFileSync(path.join(salida, 'fichas.json'), JSON.stringify(todo, null, 1));
