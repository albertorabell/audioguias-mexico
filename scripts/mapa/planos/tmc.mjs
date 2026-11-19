// Dibuja el esquema de pisos del Museo del Templo Mayor (la Catedral sale de OpenStreetMap: ver desde-osm.mjs y catedral.json) (muros solamente; salas, rótulos y paradas los pone la app).
// Museo: esquema de pisos del recorrido (Gaceta de Museos INAH: ocho salas, cuatro por deidad, una por nivel).
// Uso: node scripts/mapa/planos/tmc.mjs   → public/plano/tmc-museo.svg
import fs from 'node:fs';

const FONDO = '#F9F9F8', MASA = '#ECEDF0', MURO = '#9AA0AC', FINO = '#C4C8D0';
const rect = (x, y, w, h, f = MASA, s = MURO, sw = 3) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" stroke="${s}" stroke-width="${sw}"/>`;
const linea = (x1, y1, x2, y2, s = FINO, sw = 1.5) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${s}" stroke-width="${sw}"/>`;
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${FONDO}"/>${body}</svg>\n`;

// --- Museo del Templo Mayor (412 x 640): corte con cuatro niveles por lado y el vestíbulo abajo al centro.
export const MUS = { size: [412, 640], sur: [40, 170], norte: [242, 372], niveles: [120, 220, 320, 420, 520] };
function museo() {
  const m = MUS;
  let b = '';
  b += rect(m.sur[0], m.niveles[0], m.norte[1] - m.sur[0], m.niveles[4] - m.niveles[0]);
  for (const y of m.niveles.slice(1, -1)) b += linea(m.sur[0], y, m.sur[1], y, MURO, 2.5) + linea(m.norte[0], y, m.norte[1], y, MURO, 2.5);
  b += linea(m.sur[1], m.niveles[0], m.sur[1], m.niveles[4], MURO, 2.5) + linea(m.norte[0], m.niveles[0], m.norte[0], m.niveles[4], MURO, 2.5);
  // vestíbulo bajo el patio central
  b += rect(m.sur[1] - 30, m.niveles[4], m.norte[0] - m.sur[1] + 60, 70, '#E2E4E9', MURO, 2.5);
  // escaleras: zigzag a cada lado del patio
  for (let i = 0; i < 4; i++) {
    const y = m.niveles[4 - i], y2 = m.niveles[3 - i];
    b += `<path d="M${m.sur[1] + 6} ${y - 6} L${m.sur[1] + 22} ${y2 + 6}" stroke="${FINO}" stroke-width="2" fill="none"/>`;
    b += `<path d="M${m.norte[0] - 6} ${y - 6} L${m.norte[0] - 22} ${y2 + 6}" stroke="${FINO}" stroke-width="2" fill="none"/>`;
  }
  b += `<rect x="190" y="${m.niveles[4] + 68}" width="32" height="6" fill="${FONDO}"/>`;
  return svg(...m.size, b);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fs.writeFileSync('public/plano/tmc-museo.svg', museo());
  console.log('public/plano/tmc-museo.svg listo');
}
