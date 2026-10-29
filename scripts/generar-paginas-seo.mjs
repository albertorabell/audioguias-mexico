// Después de compilar la app: escribe en dist/ las páginas públicas de cada sitio y de cada idioma
// (dist/guias/…, dist/en/guides/…, dist/fr/guides/…, dist/pl/przewodniki/…) y dist/sitemap.xml.
// Uso: node scripts/generar-paginas-seo.mjs [carpeta-dist]   (por defecto: dist)
import fs from 'node:fs';
import path from 'node:path';
import { PAGINAS, IDIOMAS, DOMINIO, armarPagina, armarSitemap, direccion, idiomaDisponible } from './seo-lib.mjs';

const DIST = path.resolve(process.argv[2] || 'dist');
const leer = (rel) => JSON.parse(fs.readFileSync(path.join(DIST, rel), 'utf-8'));
const existe = (rel) => fs.existsSync(path.join(DIST, rel));

const SEO_DIR = path.resolve('.seo-data');
// Sitios aún sin publicar en la app (solo «próximamente»): sus datos viven en .seo-data/, fuera de lo que se publica
const seoSitios = fs.existsSync(path.join(SEO_DIR, 'sites.json')) ? JSON.parse(fs.readFileSync(path.join(SEO_DIR, 'sites.json'), 'utf-8')) : [];
const sitios = [...leer('data/sites.json'), ...seoSitios.map((x) => ({ ...x, _seo: true }))];
const hechas = [];

for (const [id, cfg] of Object.entries(PAGINAS)) {
  const sitio = sitios.find((s) => String(s.id).toUpperCase() === id);
  const aceptable = sitio && (sitio._seo || !sitio.status || sitio.status === 'active' || (cfg.proximamente && sitio.status === 'preview'));
  if (!aceptable) {
    console.log(`SEO: ${id} no está publicado, se salta`);
    continue;
  }
  let manifiesto, salas, piezas;
  try {
  const leerDe = (rel) => (sitio._seo ? JSON.parse(fs.readFileSync(path.join(SEO_DIR, rel.replace(/^data\//, '')), 'utf-8')) : leer(rel));
  manifiesto = leerDe(sitio.path);
  // Los sitios con datos propios traen sus rutas de zonas y piezas; el MNA usa los archivos de la raíz de data/
  salas = leerDe(manifiesto.rooms_path || 'data/rooms.json');
  piezas = leerDe(manifiesto.pieces_path || 'data/pieces.json');
  } catch (e) {
    console.log(`SEO: ${id} sin datos (${e.code || e.message}), se salta`);
    continue;
  }
  const cover = piezas.find((p) => p.piece_id === sitio.cover_piece_id)?.image_filename || sitio.cover_image || '';
  const portada = cover && existe(`images/pieces/${cover}`) ? `/images/pieces/${cover}` : '';
  const idiomas = IDIOMAS.filter((l) => idiomaDisponible({ sitio, manifiesto, cfg }, l));
  hechas.push({ id, cfg, sitio, manifiesto, salas, piezas, portada, idiomas });
}

const grupos = [];
for (const h of hechas) {
  const grupo = [];
  for (const lang of h.idiomas) {
    const otras = hechas
      .filter((o) => o.id !== h.id && o.idiomas.includes(lang))
      .map((o) => ({
        nombre: (lang === 'es' ? o.sitio.name : o.sitio[`name_${lang}`] || o.cfg.nombres?.[lang]) || o.sitio.name,
        url: direccion(o.cfg.slugs[lang], lang),
      }));
    const { html, url } = armarPagina({ sitio: h.sitio, manifiesto: h.manifiesto, salas: h.salas, piezas: h.piezas, cfg: h.cfg, lang, idiomas: h.idiomas, otras, portada: h.portada });
    const dir = path.join(DIST, direccion(h.cfg.slugs[lang], lang));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    grupo.push({ lang, url });
    console.log(`SEO: ${url} (${(html.length / 1024).toFixed(1)} KB)`);
  }
  grupos.push(grupo);
}

fs.writeFileSync(path.join(DIST, 'sitemap.xml'), armarSitemap(grupos));
console.log(`SEO: sitemap.xml con ${grupos.flat().length + 1} direcciones`);
