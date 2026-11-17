// Trae de OpenStreetMap (Overpass) los datos de mapa de cada sitio, para ubicar paradas y dibujar planos.
// Por sitio guarda un JSON con:
//   lugares   : todo lo que tiene nombre (sin calles), con su punto central y etiquetas
//   edificios : contornos de edificios, monumentos, templos y parques con nombre (para "entrar al edificio")
//   interior  : elementos con indoor=* o level=* (planos interiores que alguien ya mapeó en OSM)
//   caminos   : senderos, andadores y escaleras (solo zonas abiertas: para trazar el camino entre paradas)
// Datos © colaboradores de OpenStreetMap, licencia ODbL. Las coordenadas finales las confirma una persona.
// Uso: node scripts/mapa/osm-sitios.mjs <carpeta-salida> [sitio1,sitio2…]
import fs from 'node:fs';
import path from 'node:path';

// Recuadro de cada sitio: oeste, sur, este, norte. caminos = también senderos.
export const SITIOS = {
  mna: { bbox: [-99.1890, 19.4240, -99.1835, 19.4285], caminos: true },
  teotihuacan: { bbox: [-98.8620, 19.6740, -98.8340, 19.7060], caminos: true },
  chapultepec: { bbox: [-99.1870, 19.4175, -99.1775, 19.4245], caminos: true },
  centro_historico: { bbox: [-99.1490, 19.4280, -99.1280, 19.4400], caminos: false },
  chichen_itza: { bbox: [-88.5760, 20.6680, -88.5620, 20.6900], caminos: true },
  templo_mayor_catedral: { bbox: [-99.1350, 19.4320, -99.1290, 19.4370], caminos: true },
  museo_frida_kahlo: { bbox: [-99.1640, 19.3540, -99.1610, 19.3565], caminos: true },
  cuernavaca_historica: { bbox: [-99.2500, 18.9050, -99.2150, 18.9350], caminos: false },
  xochicalco: { bbox: [-99.3060, 18.7950, -99.2850, 18.8130], caminos: true },
  chalcatzingo: { bbox: [-98.7860, 18.6650, -98.7600, 18.6900], caminos: true },
  coyoacan: { bbox: [-99.1880, 19.3180, -99.1400, 19.3600], caminos: false },
  basilica_guadalupe: { bbox: [-99.1210, 19.4815, -99.1125, 19.4880], caminos: true },
  tacos: { bbox: [-99.1900, 19.3850, -99.1250, 19.4450], caminos: false, solo_comida: true },
};

const SERVIDORES = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
const AGENTE = 'XolotliMapas/1.0 (+https://xolotli.com)';

function consulta(s) {
  const [w, so, e, n] = s.bbox;
  const b = `(${so},${w},${n},${e})`;
  if (s.solo_comida) {
    return `[out:json][timeout:240];
nwr["amenity"~"^(restaurant|fast_food|cafe|bar)$"]["name"]${b};
out center tags;`;
  }
  return `[out:json][timeout:240];
nwr["name"][!"highway"][!"route"][!"public_transport"]${b}->.lugares;
.lugares out center tags;
out count;
(
  way["building"]["name"]${b}; relation["building"]["name"]${b};
  way["tourism"]${b}; relation["tourism"]${b};
  way["historic"]${b}; relation["historic"]${b};
  way["amenity"~"^(place_of_worship|marketplace)$"]${b}; relation["amenity"="place_of_worship"]${b};
  way["leisure"~"^(park|garden)$"]["name"]${b};
  way["man_made"]["name"]${b};
)->.edif;
.edif out geom tags;
out count;
nwr["indoor"]${b}->.ind;
.ind out geom tags;
out count;
${s.caminos ? `way["highway"~"^(footway|path|pedestrian|steps|corridor|track|service)$"]${b}->.cam;
.cam out geom tags;
out count;` : ''}`;
}

async function pedir(q) {
  let ultimo;
  for (const url of SERVIDORES) {
    for (let intento = 0; intento < 2; intento++) {
      try {
        const t0 = Date.now();
        const r = await fetch(url, { signal: AbortSignal.timeout(280000), method: 'POST', headers: { 'User-Agent': AGENTE, 'Content-Type': 'application/x-www-form-urlencoded' }, body: `data=${encodeURIComponent(q)}` });
        console.log(`  ${url} → HTTP ${r.status} en ${Math.round((Date.now() - t0) / 1000)} s`);
        if (r.ok) return await r.json();
        ultimo = `${url} HTTP ${r.status}`;
        if (r.status === 429 || r.status === 504) await new Promise((ok) => setTimeout(ok, 20000));
      } catch (e) {
        ultimo = `${url} ${e.message}`;
      }
    }
  }
  throw new Error(`Overpass no respondió: ${ultimo}`);
}

const r6 = (x) => Math.round(x * 1e6) / 1e6;
function centro(el) {
  if (el.type === 'node') return [r6(el.lat), r6(el.lon)];
  if (el.center) return [r6(el.center.lat), r6(el.center.lon)];
  if (el.bounds) return [r6((el.bounds.minlat + el.bounds.maxlat) / 2), r6((el.bounds.minlon + el.bounds.maxlon) / 2)];
  return null;
}
function geometria(el) {
  if (el.geometry) return el.geometry.map((p) => [r6(p.lat), r6(p.lon)]);
  if (el.members) return el.members.filter((m) => m.geometry && m.role !== 'inner').map((m) => ({ role: m.role, geom: m.geometry.map((p) => [r6(p.lat), r6(p.lon)]) }));
  return null;
}

function separar(json, s) {
  const out = { lugares: [], edificios: [], interior: [], caminos: [] };
  let seccion = 0;
  const destinos = s.solo_comida ? ['lugares'] : ['lugares', 'edificios', 'interior', 'caminos'];
  for (const el of json.elements || []) {
    if (el.type === 'count') { seccion++; continue; }
    const k = destinos[seccion] || 'caminos';
    const base = { id: `${el.type}/${el.id}`, tags: el.tags || {} };
    if (k === 'lugares') out.lugares.push({ ...base, at: centro(el) });
    else out[k].push({ ...base, at: centro(el), geom: geometria(el) });
  }
  return out;
}

const [, , salida = 'osm-sitios', lista] = process.argv;
const elegidos = lista ? lista.split(',').map((x) => x.trim()).filter(Boolean) : Object.keys(SITIOS);
fs.mkdirSync(salida, { recursive: true });
const resumen = [];
for (const id of elegidos) {
  const s = SITIOS[id];
  if (!s) { console.warn(`Sitio desconocido: ${id}`); continue; }
  try {
    const datos = separar(await pedir(consulta(s)), s);
    const archivo = path.join(salida, `${id}.json`);
    fs.writeFileSync(archivo, JSON.stringify({ sitio: id, bbox: s.bbox, fecha: new Date().toISOString(), licencia: 'Datos © colaboradores de OpenStreetMap, ODbL', ...datos }));
    const linea = `${id}: ${datos.lugares.length} lugares, ${datos.edificios.length} edificios, ${datos.interior.length} interiores, ${datos.caminos.length} caminos`;
    console.log(linea);
    resumen.push(linea);
  } catch (e) {
    console.error(`${id}: ${e.message}`);
    fs.writeFileSync(path.join(salida, `${id}.error.txt`), String(e.message));
    resumen.push(`${id}: ERROR ${e.message}`);
  }
  await new Promise((ok) => setTimeout(ok, 8000));
}
fs.writeFileSync(path.join(salida, 'RESUMEN.txt'), resumen.join('\n') + '\n');
