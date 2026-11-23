// Imágenes para compartir (Open Graph / Twitter): 1200 × 630, foto del lugar + degradado + nombre + marca.
// Se generan en el build, una por página pública, con un nombre que sale de su dirección (ver ogNombre).
import fs from 'node:fs';
import path from 'node:path';

export const OG_ANCHO = 1200;
export const OG_ALTO = 630;

/** Nombre del archivo (sin carpeta) de la imagen de una página: «/en/guides/x/» → «en__guides__x.jpg»; «/» → «inicio.jpg». */
export function ogNombre(ruta) {
  const limpia = String(ruta || '/').replace(/^https?:\/\/[^/]+/, '').split(/[?#]/)[0].replace(/^\/|\/$/g, '');
  return `${limpia ? limpia.replace(/\//g, '__') : 'inicio'}.jpg`;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Parte un título en hasta `max` líneas de ~`ancho` caracteres (por palabras). */
export function partirTitulo(texto, ancho = 26, max = 3) {
  const palabras = String(texto || '').trim().split(/\s+/).filter(Boolean);
  const lineas = [];
  let actual = '';
  for (const p of palabras) {
    if (actual && (actual + ' ' + p).length > ancho) {
      lineas.push(actual);
      actual = p;
    } else actual = actual ? `${actual} ${p}` : p;
  }
  if (actual) lineas.push(actual);
  if (lineas.length > max) {
    const resto = lineas.splice(max - 1).join(' ');
    lineas.push(resto.length > ancho + 6 ? `${resto.slice(0, ancho + 3).trim()}…` : resto);
  }
  return lineas;
}

/** SVG con degradado, título, línea de apoyo y marca (se pone encima de la foto). */
export function capaOg({ titulo, sub = '', marca = 'XOLOTLI' }) {
  const lineas = partirTitulo(titulo);
  const tam = lineas.length >= 3 ? 56 : 66;
  const base = 520 - (lineas.length - 1) * (tam + 8);
  const texto = lineas.map((l, i) => `<text x="64" y="${base + i * (tam + 8)}" font-size="${tam}" font-weight="700" fill="#fff">${esc(l)}</text>`).join('');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${OG_ANCHO}" height="${OG_ALTO}">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0.28" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.86"/></linearGradient></defs>
<rect width="100%" height="100%" fill="url(#g)"/>
<g font-family="Inter, 'DejaVu Sans', Arial, sans-serif">
<text x="64" y="84" font-size="30" font-weight="700" letter-spacing="6" fill="#fbbf24">${esc(marca)}</text>
${texto}
${sub ? `<text x="64" y="578" font-size="28" fill="#e7e5e4">${esc(sub)}</text>` : ''}
</g></svg>`);
}

/**
 * Escribe la imagen. foto = ruta absoluta de la foto de fondo (si no existe, queda un fondo liso).
 * Si algo falla con la foto, se intenta con fondo liso; si también falla, devuelve false (la página queda sin imagen propia).
 */
export async function hacerOg({ sharp, foto = '', titulo, sub = '', destino }) {
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  const fondo = { create: { width: OG_ANCHO, height: OG_ALTO, channels: 3, background: '#1c1917' } };
  const capa = capaOg({ titulo, sub });
  for (const conFoto of [true, false]) {
    if (conFoto && !(foto && fs.existsSync(foto))) continue;
    try {
      const base = conFoto ? sharp(foto).resize(OG_ANCHO, OG_ALTO, { fit: 'cover', position: 'attention' }) : sharp(fondo);
      await base.composite([{ input: capa }]).jpeg({ quality: 80, mozjpeg: true }).toFile(destino);
      return true;
    } catch (e) {
      console.warn(`SEO: aviso: imagen social ${path.basename(destino)} (${conFoto ? 'con foto' : 'lisa'}): ${e.message}`);
    }
  }
  return false;
}
