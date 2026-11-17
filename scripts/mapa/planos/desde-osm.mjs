// Dibuja el plano interior de un edificio a partir de lo que ya está mapeado en OpenStreetMap
// (contorno, muros, columnas y áreas con indoor=*), con el mismo estilo de los demás planos de la app.
// Datos © colaboradores de OpenStreetMap (ODbL). El plano es un trabajo derivado: lleva la atribución en la app.
// Uso: node scripts/mapa/planos/desde-osm.mjs <osm-datos/sitio.json> <config.json>
//   config: { salida, edificios: [osm id…], nivel: "0", metro: 4.3, margen: 30, areas: { "<nombre OSM>": { id, hue, nombre, rotulo } } }
// Escribe <salida>.svg (muros) y <salida>.json (tamaño, proyección y salas en unidades del dibujo).
import fs from 'node:fs';

const FONDO = '#F9F9F8', MASA = '#ECEDF0', MURO = '#9AA0AC', FINO = '#C4C8D0';

/** Proyección local: metros desde la esquina noroeste, multiplicados por `metro` unidades por metro. */
export function proyeccion(bbox, metro, margen) {
  const [s, w, n, e] = bbox;
  const lat0 = (s + n) / 2;
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180), ky = 110540;
  const toXY = ([lat, lng]) => [+(margen + (lng - w) * kx * metro).toFixed(1), +(margen + (n - lat) * ky * metro).toFixed(1)];
  const size = [Math.ceil(2 * margen + (e - w) * kx * metro), Math.ceil(2 * margen + (n - s) * ky * metro)];
  return { toXY, size, origen: { norte: n, oeste: w, kx, ky, metro, margen } };
}

const anillos = (g) => (Array.isArray(g) && g.length && typeof g[0][0] === 'number' ? [g] : (g || []).map((m) => m.geom));
const ruta = (pts, cerrar) => `M${pts.map((p) => p.join(' ')).join('L')}${cerrar ? 'Z' : ''}`;

export function dibujar(datos, cfg) {
  const enNivel = (t) => cfg.nivel === undefined || String(t.level ?? cfg.nivel).split(';').includes(String(cfg.nivel));
  const edificios = datos.edificios.filter((e) => cfg.edificios.includes(e.id));
  const pts = edificios.flatMap((e) => anillos(e.geom).flat());
  const lats = pts.map((p) => p[0]), lngs = pts.map((p) => p[1]);
  const bbox = [Math.min(...lats), Math.min(...lngs), Math.max(...lats), Math.max(...lngs)];
  const P = proyeccion(bbox, cfg.metro, cfg.margen);
  const dentro = (at) => at && at[0] >= bbox[0] - 1e-5 && at[0] <= bbox[2] + 1e-5 && at[1] >= bbox[1] - 1e-5 && at[1] <= bbox[3] + 1e-5;
  let b = '';
  for (const e of edificios) for (const r of anillos(e.geom)) b += `<path d="${ruta(r.map(P.toXY), true)}" fill="${MASA}" stroke="${MURO}" stroke-width="3" stroke-linejoin="round"/>`;
  const interior = datos.interior.filter((e) => dentro(e.at) && enNivel(e.tags));
  const salas = [];
  for (const e of interior) {
    const t = e.tags;
    for (const r of anillos(e.geom)) {
      const xy = r.map(P.toXY);
      const cerrado = r.length > 2 && r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1];
      if (t.indoor === 'column') b += `<path d="${ruta(xy, true)}" fill="${MURO}"/>`;
      else if (t.indoor === 'wall') b += `<path d="${ruta(xy, cerrado)}" fill="none" stroke="${MURO}" stroke-width="2"/>`;
      else if (t.indoor === 'area' || t.indoor === 'room' || t.indoor === 'corridor') {
        b += `<path d="${ruta(xy, true)}" fill="none" stroke="${FINO}" stroke-width="1"/>`;
        const def = t.name && cfg.areas?.[t.name];
        if (def) salas.push({ ...def, osm: e.id, poly: (cerrado ? xy.slice(0, -1) : xy) });
      }
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${P.size[0]}" height="${P.size[1]}" viewBox="0 0 ${P.size[0]} ${P.size[1]}"><rect width="${P.size[0]}" height="${P.size[1]}" fill="${FONDO}"/>${b}</svg>\n`;
  return { svg, size: P.size, origen: P.origen, salas, toXY: P.toXY };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , archivo, archivoCfg] = process.argv;
  const datos = JSON.parse(fs.readFileSync(archivo, 'utf-8'));
  const cfg = JSON.parse(fs.readFileSync(archivoCfg, 'utf-8'));
  const r = dibujar(datos, cfg);
  const puntos = Object.fromEntries(Object.entries(cfg.puntos || {}).map(([id, ll]) => [id, r.toXY(ll)]));
  fs.writeFileSync(`${cfg.salida}.svg`, r.svg);
  fs.writeFileSync(`${cfg.salida}.json`, JSON.stringify({ size: r.size, origen: r.origen, salas: r.salas, puntos }, null, 1));
  console.log(`${cfg.salida}.svg ${r.size.join('x')}, ${r.salas.length} salas, ${Object.keys(puntos).length} puntos`);
}
