// Páginas públicas para Google: una por sitio, con su propia dirección (/guias/<nombre>/), título, descripción y datos estructurados.
// Se arman al compilar, solo con lo que ya es público (sites.json, recorridos, salas, «Antes de ir» y títulos de las piezas).
// NUNCA llevan el texto de pago: los guiones, retos, mitos y fichas no se leen aquí.

export const DOMINIO = 'https://xolotli.com';

/** Qué sitios tienen página y con qué nombre de dirección. Para sumar un sitio, agrégalo aquí. */
export const PAGINAS = {
  MNA: { slug: 'museo-nacional-de-antropologia', articulo: 'el' },
};

const NBSP = ' ';

export const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** 70 → «1 h 10 min» (con espacios que no se parten entre líneas). */
export function duracion(min) {
  const m = Math.round(Number(min) || 0);
  if (m <= 0) return '';
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r}${NBSP}min`;
  return r ? `${h}${NBSP}h ${r}${NBSP}min` : `${h}${NBSP}h`;
}

const minutosDe = (r) => Number(r.estimated_minutes) || (r.stops || []).length * 5;

/** Párrafos (separados por una línea en blanco) y listas (líneas que empiezan con «- »), igual que en la app. */
export function textoEnHtml(text) {
  const bloques = String(text || '').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return bloques
    .map((b) => {
      const lineas = b.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lineas.length && lineas.every((l) => /^[-•]\s+/.test(l))) {
        return `<ul>${lineas.map((l) => `<li>${esc(l.replace(/^[-•]\s+/, ''))}</li>`).join('')}</ul>`;
      }
      return `<p>${esc(b).replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');
}

/** Recorta a ~max caracteres sin partir palabras. */
export function recortar(texto, max = 155) {
  const t = String(texto || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

/** El recorrido de «qué ver»: el marcado como principal; si no hay, el más corto con paradas. */
export function recorridoPrincipal(rutas) {
  const con = (rutas || []).filter((r) => r.stops?.length);
  return con.find((r) => r.principal) || [...con].sort((a, b) => minutosDe(a) - minutosDe(b))[0] || null;
}

/**
 * Arma el HTML de la página de un sitio.
 * datos: { sitio (entrada de sites.json), manifiesto, salas, piezas, slug, otras: [{ nombre, url }], portada (ruta /images/... o '') }
 */
export function armarPagina({ sitio, manifiesto = {}, salas = [], piezas = [], slug, articulo = '', otras = [], portada = '' }) {
  const url = `${DOMINIO}/guias/${slug}/`;
  const nombre = sitio.name;
  const enLugar = ['en', articulo, nombre].filter(Boolean).join(' '); // «en el Museo Nacional de Antropología»
  const aireLibre = manifiesto.layout === 'zones';
  const unidad = aireLibre ? { uno: 'parada', varias: 'paradas', lugares: 'Zonas' } : { uno: 'obra', varias: 'obras', lugares: 'Salas' };
  const rutas = (manifiesto.routes || []).filter((r) => r.stops?.length);
  const porId = new Map(piezas.map((p) => [p.piece_id, p]));
  const principal = recorridoPrincipal(rutas);
  const gratis = piezas.filter((p) => p.is_free);
  const minutos = rutas.map(minutosDe).filter((m) => m > 0);
  const rango = minutos.length ? { min: Math.min(...minutos), max: Math.max(...minutos) } : null;
  const precio = Number(sitio.pass_price_mxn ?? manifiesto.pass_price_mxn) || 0;
  const antes = manifiesto.before_visit || [];
  const intro = String(sitio.intro || '').trim();
  const lead = String(sitio.description || '').trim();
  const abrir = `/?sitio=${encodeURIComponent(sitio.id)}`;
  const n = piezas.length;

  const titulo = `${nombre}: audioguía y guía de visita`;
  const descripcion = recortar(
    `${nombre}: audioguía en tu celular con ${n} ${unidad.varias} explicadas${rango ? `, recorridos de ${duracion(rango.min)} a ${duracion(rango.max)}` : ''}${gratis.length ? `, ${gratis.length} gratis para probar` : ''} y uso sin internet.`.replaceAll(NBSP, ' ')
  );

  const lugar = {
    '@type': aireLibre ? ['TouristAttraction'] : ['Museum', 'TouristAttraction'],
    '@id': `${url}#lugar`,
    name: nombre,
    ...(lead ? { description: lead } : {}),
    url,
    ...(sitio.location ? { address: sitio.location } : {}),
    ...(portada ? { image: `${DOMINIO}${portada}` } : {}),
  };
  const grafo = [
    lugar,
    {
      '@type': 'WebPage',
      '@id': url,
      url,
      name: titulo,
      description: descripcion,
      inLanguage: 'es',
      about: { '@id': `${url}#lugar` },
      isPartOf: { '@type': 'WebSite', name: 'Audioguía Xolo', url: `${DOMINIO}/` },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Audioguía Xolo', item: `${DOMINIO}/` },
        { '@type': 'ListItem', position: 2, name: nombre, item: url },
      ],
    },
  ];
  const jsonld = JSON.stringify({ '@context': 'https://schema.org', '@graph': grafo }).replace(/</g, '\\u003c');

  const queVer = principal
    ? principal.stops
        .map((s) => {
          const p = porId.get(s.piece_id || s.id);
          const gancho = p?.frase_gancho ? ` <span class="gancho">${esc(p.frase_gancho)}</span>` : '';
          return `<li><strong>${esc(s.title || p?.title || p?.titulo || '')}</strong>${gancho}</li>`;
        })
        .join('\n')
    : '';

  const listaRutas = rutas
    .map((r) => {
      const d = r.duration || duracion(minutosDe(r));
      return `<li><strong>${esc(r.name)}</strong> <span class="dato">${esc(d)} · ${r.stops.length} ${r.stops.length === 1 ? unidad.uno : unidad.varias}</span>${r.description ? `<br>${esc(r.description)}` : ''}</li>`;
    })
    .join('\n');

  const listaSalas = [...salas]
    .sort((a, b) => (parseInt(a.numero_oficial, 10) || 0) - (parseInt(b.numero_oficial, 10) || 0))
    .map((s) => `<li><strong>${esc(s.nombre_oficial)}</strong>${s.frase_gancho ? ` <span class="gancho">${esc(s.frase_gancho)}</span>` : ''}</li>`)
    .join('\n');

  const bloqueAntes = antes.map((a) => `<h3>${esc(a.title)}</h3>\n${textoEnHtml(a.text)}`).join('\n');

  const cta = () => `<p class="cta"><a class="boton" href="${esc(abrir)}">Abrir la audioguía</a></p>
<p class="nota">${precio ? `Pase de 72 horas por $${precio} MXN, sin suscripción. ` : ''}${gratis.length ? `${gratis.length} ${gratis.length === 1 ? unidad.uno : unidad.varias} para escuchar gratis, sin registro.` : ''}</p>`;

  const enlacesOtras = otras.length
    ? `<h2>Otras guías</h2>\n<ul class="otras">${otras.map((o) => `<li><a href="${esc(o.url)}">${esc(o.nombre)}</a></li>`).join('')}</ul>`
    : '';

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Audioguía Xolo">
<meta property="og:locale" content="es_MX">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:url" content="${url}">
${portada ? `<meta property="og:image" content="${DOMINIO}${esc(portada)}">\n` : ''}<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#FBF6EE">
<link rel="icon" type="image/svg+xml" href="/icon.svg">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<style>
:root{--bg:#FBF6EE;--ink:#2a1f1a;--ink2:#5a4a40;--linea:#e4d9c9;--acento:#a30f48}
@media (prefers-color-scheme:dark){:root{--bg:#1c1613;--ink:#f1e8dc;--ink2:#c4b5a5;--linea:#3a2f28;--acento:#ff6b9a}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:1.0625rem/1.65 Georgia,'Times New Roman',serif}
.envoltura{max-width:42rem;margin:0 auto;padding:0 1.25rem 3rem}
header.marca{padding:1rem 0;border-bottom:1px solid var(--linea);font:600 1rem system-ui,sans-serif}
header.marca a{color:var(--ink);text-decoration:none}
h1{font-size:2rem;line-height:1.2;margin:1.5rem 0 .75rem;font-weight:500;text-wrap:balance}
h2{font-size:1.5rem;line-height:1.25;margin:2.5rem 0 .75rem;font-weight:500}
h3{margin:1.5rem 0 .25rem;font:600 1.0625rem system-ui,sans-serif}
.lead{font-size:1.1875rem;color:var(--ink2)}
.portada{display:block;width:100%;height:auto;aspect-ratio:3/2;object-fit:cover;border-radius:12px;margin-top:1.25rem;background:var(--linea)}
ul,ol{padding-left:1.25rem}
li{margin:.5rem 0}
.gancho{color:var(--ink2)}
.dato{font:.875rem system-ui,sans-serif;color:var(--ink2)}
.nota{font:.9375rem system-ui,sans-serif;color:var(--ink2);margin-top:.5rem}
.cta{margin:1.5rem 0 0}
a.boton{display:block;text-align:center;background:var(--acento);color:#fff;text-decoration:none;font:700 1.0625rem system-ui,sans-serif;padding:.9rem 1rem;border-radius:999px}
a{color:var(--acento)}
ul.otras{list-style:none;padding:0}
footer{margin-top:3rem;padding-top:1.5rem;border-top:1px solid var(--linea);font:.9375rem system-ui,sans-serif;color:var(--ink2)}
</style>
<script type="application/ld+json">${jsonld}</script>
</head>
<body>
<div class="envoltura">
<header class="marca"><a href="/">Audioguía Xolo</a></header>
<main>
<h1>${esc(nombre)}: audioguía para tu visita</h1>
${lead ? `<p class="lead">${esc(lead)}</p>` : ''}
${portada ? `<img class="portada" src="${esc(portada)}" alt="${esc(nombre)}" width="1200" height="800" fetchpriority="high">` : ''}
${cta()}
${intro ? `<h2>${aireLibre ? 'Sobre el sitio' : 'Sobre el museo'}</h2>\n${textoEnHtml(intro)}` : ''}
${principal ? `<h2>Qué ver ${esc(enLugar)}: ${esc(principal.name)}</h2>\n<p>${principal.stops.length} ${unidad.varias}${minutosDe(principal) ? ` en unos ${duracion(minutosDe(principal))}` : ''}, en el orden en que se camina.</p>\n<ol>\n${queVer}\n</ol>` : ''}
${rutas.length ? `<h2>Recorridos</h2>\n<p>Elige uno según el tiempo que tengas. La audioguía te lleva ${unidad.uno} por ${unidad.uno}.</p>\n<ul>\n${listaRutas}\n</ul>` : ''}
${listaSalas ? `<h2>${unidad.lugares}</h2>\n<ul>\n${listaSalas}\n</ul>` : ''}
${antes.length ? `<h2>Antes de ir</h2>\n${bloqueAntes}` : ''}
${cta()}
${enlacesOtras}
</main>
<footer><p><a href="/">Audioguía Xolo</a>: audioguías en tu celular para museos y zonas arqueológicas de México. Funcionan sin internet una vez descargadas.</p></footer>
</div>
</body>
</html>
`;
  return { html, url, titulo, descripcion };
}

/** sitemap.xml con la portada y cada página de guía. */
export function armarSitemap(urls, fecha = new Date()) {
  const dia = fecha.toISOString().slice(0, 10);
  const items = [`${DOMINIO}/`, ...urls].map((u) => `  <url><loc>${esc(u)}</loc><lastmod>${dia}</lastmod></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`;
}
