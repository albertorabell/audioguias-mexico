// Trae lugares con nombre y coordenadas alrededor de un sitio, desde OpenStreetMap (Overpass) y Wikipedia (es/en).
// Solo reúne candidatos: las coordenadas finales de cada parada las confirma una persona.
// Uso: node scripts/mapa/obtener-coordenadas.mjs <carpeta-salida> <lat> <lng> [radio-metros]
import fs from 'node:fs';
import path from 'node:path';

const [, , salida = 'salida-mapa', latS = '19.6925', lngS = '-98.8438', radioS = '3500'] = process.argv;
const lat = Number(latS), lng = Number(lngS), radio = Number(radioS);
fs.mkdirSync(salida, { recursive: true });

const dLat = radio / 111320;
const dLng = radio / (111320 * Math.cos((lat * Math.PI) / 180));
const bbox = [lat - dLat, lng - dLng, lat + dLat, lng + dLng].map((n) => n.toFixed(5)).join(',');

async function conReintentos(url, opts = {}, intentos = 4) {
  let ultimo;
  for (let i = 0; i < intentos; i++) {
    try {
      const r = await fetch(url, { ...opts, headers: { 'User-Agent': 'audioguias-mexico/1.0 (albertorabell@gmail.com)', ...(opts.headers || {}) } });
      if (r.ok) return r;
      ultimo = new Error(`${url} → ${r.status}`);
    } catch (e) {
      ultimo = e;
    }
    await new Promise((res) => setTimeout(res, 3000 * (i + 1)));
  }
  throw ultimo;
}

// 1) OpenStreetMap
const consulta = `[out:json][timeout:90];
(
  nwr["name"]["historic"](${bbox});
  nwr["name"]["tourism"](${bbox});
  nwr["name"]["archaeological_site"](${bbox});
  nwr["name"]["amenity"](${bbox});
  nwr["name"]["man_made"](${bbox});
  nwr["name"]["building"](${bbox});
  nwr["name"]["leisure"](${bbox});
  nwr["entrance"](${bbox});
  nwr["barrier"="gate"](${bbox});
  nwr["amenity"="parking"](${bbox});
);
out center tags;`;
const osm = await (await conReintentos('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(consulta), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })).json();
const lugares = osm.elements
  .map((e) => ({
    fuente: 'osm',
    id: `${e.type}/${e.id}`,
    nombre: e.tags?.name || e.tags?.['name:es'] || '(sin nombre)',
    lat: e.lat ?? e.center?.lat,
    lng: e.lon ?? e.center?.lon,
    tipo: ['historic', 'tourism', 'archaeological_site', 'amenity', 'man_made', 'building', 'leisure', 'entrance', 'barrier'].map((k) => (e.tags?.[k] ? `${k}=${e.tags[k]}` : '')).filter(Boolean).join(' '),
  }))
  .filter((l) => l.lat && l.lng);

// 2) Wikipedia (artículos con coordenadas cerca)
for (const idioma of ['es', 'en']) {
  const url = `https://${idioma}.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lng}&gsradius=${Math.min(radio, 10000)}&gslimit=500&format=json`;
  const wiki = await (await conReintentos(url)).json();
  for (const g of wiki.query?.geosearch || []) lugares.push({ fuente: `wikipedia-${idioma}`, id: String(g.pageid), nombre: g.title, lat: g.lat, lng: g.lon, tipo: 'articulo' });
}

fs.writeFileSync(path.join(salida, 'lugares.json'), JSON.stringify(lugares, null, 1));
const filas = lugares.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map((l) => `| ${l.nombre} | ${l.lat.toFixed(6)} | ${l.lng.toFixed(6)} | ${l.fuente} | ${l.tipo} |`);
fs.writeFileSync(path.join(salida, 'LEEME.md'), `# Lugares cerca de ${lat}, ${lng} (${radio} m)\n\n| Nombre | Lat | Lng | Fuente | Tipo |\n|---|---|---|---|---|\n${filas.join('\n')}\n`);
console.log(`Listo: ${lugares.length} lugares`);
