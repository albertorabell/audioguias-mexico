// Después de compilar la app: escribe en dist/ las páginas públicas de cada sitio y de cada idioma
// (dist/guias/…, dist/en/guides/…, dist/fr/guides/…, dist/pl/przewodniki/…) y dist/sitemap.xml.
// Uso: node scripts/generar-paginas-seo.mjs [carpeta-dist]   (por defecto: dist)
import fs from 'node:fs';
import path from 'node:path';
import { TERMS, TERMS_UPDATED } from '../src/i18n/terminos.js';
import { PRIVACY } from '../src/i18n/privacidad.js';
import { PAGINAS, IDIOMAS, DOMINIO, armarPagina, armarSitemap, direccion, idiomaDisponible, armarPiezaPagina, piezaPublicable, direccionPieza, tituloDePieza, clipDe, armarLlms, armarMapaGuias, ajustes, HUBS, armarHub, direccionHub } from './seo-lib.mjs';

const DIST = path.resolve(process.argv[2] || 'dist');
const leer = (rel) => JSON.parse(fs.readFileSync(path.join(DIST, rel), 'utf-8'));
const existe = (rel) => fs.existsSync(path.join(DIST, rel));

// Dirección del servidor de cobro: ahí se cuentan (de forma anónima) los toques del botón «Escuchar 30 s»
ajustes.api = process.env.VITE_PAYMENTS_API_URL || '';

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
const llms = [];
const paraMapa = [];
// Clips de 30 s publicados (public/audio/muestras/): el botón «Escuchar 30 s» sale solo donde hay clip
const hayClip = (ruta) => existe(ruta.replace(/^\//, ''));
const escribir = (rel, html) => {
  const dir = path.join(DIST, rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
};
const fotoDe = (p) => (p?.image_filename && existe(`images/pieces/${p.image_filename}`) ? `/images/pieces/${p.image_filename}` : '');

// Páginas agrupadas: solo los sitios publicados (no «próximamente») y disponibles en cada idioma; sin menos de 2 sitios no sale
const nombreEn = (o, lang) => (lang === 'es' ? o.sitio.name : o.sitio[`name_${lang}`] || o.cfg.nombres?.[lang]) || o.sitio.name;
const entradasHub = (hub, lang) =>
  hub.sitios
    .map((id) => hechas.find((o) => o.id === id && !o.cfg.proximamente && o.idiomas.includes(lang)))
    .filter(Boolean)
    .map((o) => ({ nombre: nombreEn(o, lang), url: direccion(o.cfg.slugs[lang], lang), lead: String((lang === 'es' ? o.sitio.description : o.sitio[`description_${lang}`]) || '').trim() }));
const idiomasHub = (hub) => Object.keys(hub.slugs).filter((l) => entradasHub(hub, l).length >= 2);

for (const h of hechas) {
  const grupo = [];
  // Piezas gratis con página (su texto ya es público en la app). Los sitios «próximamente» no tienen.
  const gratis = h.cfg.proximamente ? [] : h.piezas.filter((p) => p.is_free === true);
  const paginasPieza = (lang) => {
    const vistos = new Set();
    return gratis.filter((p) => {
      if (!piezaPublicable(p, lang)) return false;
      const dir = direccionPieza(h.cfg, p, lang);
      if (vistos.has(dir)) return false;
      vistos.add(dir);
      return true;
    });
  };
  for (const lang of h.idiomas) {
    const enlacesHub = Object.values(HUBS).filter((hub) => hub.sitios.includes(h.id) && idiomasHub(hub).includes(lang)).map((hub) => ({ nombre: hub.h1[lang], url: direccionHub(hub, lang) }));
    const otras = [...enlacesHub, ...hechas
      .filter((o) => o.id !== h.id && o.idiomas.includes(lang))
      .map((o) => ({
        nombre: (lang === 'es' ? o.sitio.name : o.sitio[`name_${lang}`] || o.cfg.nombres?.[lang]) || o.sitio.name,
        url: direccion(o.cfg.slugs[lang], lang),
      }))];
    const delIdioma = paginasPieza(lang);
    const gratisEnlaces = delIdioma.map((p) => ({ titulo: tituloDePieza(p, lang), url: direccionPieza(h.cfg, p, lang) }));
    // Clip de la primera pieza gratis que tenga uno en este idioma (hoy: la Piedra del Sol del MNA)
    const conClip = gratis.map((p) => ({ p, src: clipDe(hayClip, p.piece_id, lang) })).find((x) => x.src);
    const muestraPieza = conClip?.src || '';
    const { html, url } = armarPagina({ sitio: h.sitio, manifiesto: h.manifiesto, salas: h.salas, piezas: h.piezas, cfg: h.cfg, lang, idiomas: h.idiomas, otras, portada: h.portada, gratisEnlaces, muestra: h.cfg.proximamente ? '' : muestraPieza, muestraPieza: conClip?.p.piece_id || '' });
    escribir(direccion(h.cfg.slugs[lang], lang), html);
    grupo.push({ lang, url });
    console.log(`SEO: ${url} (${(html.length / 1024).toFixed(1)} KB)`);
  }
  grupos.push(grupo);

  // Una página por pieza gratis, en cada idioma donde exista su texto y el sitio tenga página
  for (const p of gratis) {
    const langs = h.idiomas.filter((l) => paginasPieza(l).includes(p));
    if (!langs.length) continue;
    const g = [];
    const sala = h.salas.find((r) => r.room_id === (p.room_id || p.roomId)) || null;
    for (const lang of langs) {
      const { html, url } = armarPiezaPagina({ sitio: h.sitio, manifiesto: h.manifiesto, cfg: h.cfg, pieza: p, sala, lang, idiomas: langs, portada: fotoDe(p) || h.portada, muestra: clipDe(hayClip, p.piece_id, lang) });
      escribir(direccionPieza(h.cfg, p, lang), html);
      g.push({ lang, url });
    }
    grupos.push(g);
  }
  console.log(`SEO: ${h.id}: ${gratis.length} piezas gratis`);

  // Para llms.txt (sitios ya publicados) y para el mapa de canónicas de /sitio/
  if (!h.cfg.proximamente) {
    const paginas = Object.fromEntries(h.idiomas.map((l) => [l, `${DOMINIO}${direccion(h.cfg.slugs[l], l)}`]));
    const nombreEs = h.sitio.name;
    const mxn = Number(h.sitio.pass_price_mxn ?? h.manifiesto.pass_price_mxn) || 0;
    const usd = Number(h.sitio.pass_price_usd ?? h.manifiesto.pass_price_usd) || 0;
    llms.push({
      nombre: nombreEs,
      resumen: String(h.sitio.description || '').trim(),
      precio: [mxn ? `MX$${mxn}` : '', usd ? `US$${usd}` : ''].filter(Boolean).join(' / '),
      paginas,
      gratis: paginasPieza('es').map((p) => ({ titulo: tituloDePieza(p, 'es'), url: `${DOMINIO}${direccionPieza(h.cfg, p, 'es')}` })),
    });
    paraMapa.push({ id: h.id, urlSitio: direccion(h.cfg.slugs.es, 'es'), paradas: Object.fromEntries(paginasPieza('es').map((p) => [p.piece_id, direccionPieza(h.cfg, p, 'es')])) });
  }
}

// Páginas agrupadas por tema
for (const hub of Object.values(HUBS)) {
  const idiomas = idiomasHub(hub);
  const g = [];
  for (const lang of idiomas) {
    const r = armarHub({ hub, lang, idiomas, entradas: entradasHub(hub, lang) });
    if (!r) continue;
    escribir(direccionHub(hub, lang), r.html);
    g.push({ lang, url: r.url });
    console.log(`SEO: ${r.url} (agrupada)`);
  }
  if (g.length) grupos.push(g);
}

// Términos de venta y aviso de privacidad (Stripe pide una dirección pública de cada uno):
// /terminos/<idioma>/ y /privacidad/<idioma>/ en los 7 idiomas. Sin índice de buscadores y fuera del sitemap.
const esc2 = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const textosLegales = {
  terminos: (l) => ({ title: TERMS[l].title, intro: TERMS[l].intro, blocks: TERMS[l].blocks, updated: TERMS[l].updated, seller: TERMS[l].seller }),
  privacidad: (l) => ({ title: PRIVACY[l].title, intro: PRIVACY[l].intro, blocks: PRIVACY[l].blocks, updated: PRIVACY[l].updated, seller: '' }),
};
for (const [carpeta, texto] of Object.entries(textosLegales)) {
  const otra = carpeta === 'terminos' ? 'privacidad' : 'terminos';
  for (const l of IDIOMAS) {
    const t = texto(l);
    const enlaces = IDIOMAS.map((x) => (x === l ? `<strong>${x.toUpperCase()}</strong>` : `<a href="/${carpeta}/${x}/">${x.toUpperCase()}</a>`)).join(' · ');
    escribir(`${carpeta}/${l}`, `<!doctype html>
<html lang="${l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc2(t.title)} · Xolotli</title><meta name="robots" content="noindex"><link rel="canonical" href="${DOMINIO}/${carpeta}/${l}/">
<style>body{font:17px/1.6 system-ui,sans-serif;max-width:40rem;margin:0 auto;padding:1.5rem;color:#1c1917}h1{font-size:1.7rem}h2{font-size:1.05rem;margin:1.6rem 0 .2rem}p{margin:.2rem 0}.s{margin-top:2rem;font-size:.7rem;color:#78716c}nav{font-size:.9rem;color:#57534e}a{color:#9d174d}</style></head>
<body><nav>${enlaces}</nav><h1>${esc2(t.title)}</h1><p>${esc2(t.intro)}</p>
${t.blocks.map(([h, b]) => `<h2>${esc2(h)}</h2><p>${esc2(b)}</p>`).join('\n')}
<p class="s">${esc2(t.updated)}</p>${t.seller ? `<p class="s">${esc2(t.seller)}</p>` : ''}
<p><a href="/${otra}/${l}/">${esc2(otra === 'terminos' ? TERMS[l].label : PRIVACY[l].title)}</a> · <a href="/">xolotli.com</a></p></body></html>`);
  }
}
console.log(`SEO: términos y privacidad en ${IDIOMAS.length} idiomas (${TERMS_UPDATED})`);

fs.writeFileSync(path.join(DIST, 'sitemap.xml'), armarSitemap(grupos));
fs.writeFileSync(path.join(DIST, 'llms.txt'), armarLlms(llms));
fs.mkdirSync(path.join(DIST, 'data'), { recursive: true });
fs.writeFileSync(path.join(DIST, 'data/guias.json'), JSON.stringify(armarMapaGuias(paraMapa)));
console.log(`SEO: llms.txt (${llms.length} sitios) y data/guias.json`);
console.log(`SEO: sitemap.xml con ${grupos.flat().length + 1} direcciones`);

// Copia de la app para las direcciones /sitio/… (ver public/_redirects): la misma página, con otro nombre de archivo
if (existe('index.html')) {
  fs.copyFileSync(path.join(DIST, 'index.html'), path.join(DIST, 'app.html'));
  console.log('SEO: app.html (copia de index.html para /sitio/…)');
}
