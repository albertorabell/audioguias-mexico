// Después de compilar la app: escribe en dist/ las páginas públicas de cada sitio (dist/guias/<nombre>/index.html) y dist/sitemap.xml.
// Uso: node scripts/generar-paginas-seo.mjs [carpeta-dist]   (por defecto: dist)
import fs from 'node:fs';
import path from 'node:path';
import { PAGINAS, DOMINIO, armarPagina, armarSitemap } from './seo-lib.mjs';

const DIST = path.resolve(process.argv[2] || 'dist');
const leer = (rel) => JSON.parse(fs.readFileSync(path.join(DIST, rel), 'utf-8'));
const existe = (rel) => fs.existsSync(path.join(DIST, rel));

const sitios = leer('data/sites.json');
const hechas = [];
const urls = [];

for (const [id, cfg] of Object.entries(PAGINAS)) {
  const sitio = sitios.find((s) => String(s.id).toUpperCase() === id);
  if (!sitio || (sitio.status && sitio.status !== 'active')) {
    console.log(`SEO: ${id} no está publicado, se salta`);
    continue;
  }
  const manifiesto = leer(sitio.path);
  // Los sitios con datos propios traen sus rutas de zonas y piezas; el MNA usa los archivos de la raíz de data/
  const salas = leer(manifiesto.rooms_path || 'data/rooms.json');
  const piezas = leer(manifiesto.pieces_path || 'data/pieces.json');
  const cover = piezas.find((p) => p.piece_id === sitio.cover_piece_id)?.image_filename || sitio.cover_image || '';
  const portada = cover && existe(`images/pieces/${cover}`) ? `/images/pieces/${cover}` : '';
  hechas.push({ id, cfg, sitio, manifiesto, salas, piezas, portada });
  urls.push(`${DOMINIO}/guias/${cfg.slug}/`);
}

for (const h of hechas) {
  const otras = hechas.filter((o) => o.id !== h.id).map((o) => ({ nombre: o.sitio.name, url: `/guias/${o.cfg.slug}/` }));
  const { html, url } = armarPagina({ sitio: h.sitio, manifiesto: h.manifiesto, salas: h.salas, piezas: h.piezas, slug: h.cfg.slug, articulo: h.cfg.articulo, otras, portada: h.portada });
  const dir = path.join(DIST, 'guias', h.cfg.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log(`SEO: ${url} (${(html.length / 1024).toFixed(1)} KB)`);
}

fs.writeFileSync(path.join(DIST, 'sitemap.xml'), armarSitemap(urls));
console.log(`SEO: sitemap.xml con ${urls.length + 1} direcciones`);
