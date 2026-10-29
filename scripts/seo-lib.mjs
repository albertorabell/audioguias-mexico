// Páginas públicas para Google: una por sitio y por idioma, con su propia dirección, título, descripción y datos estructurados.
// Se arman al compilar, solo con lo que ya es público (sites.json, recorridos, salas, «Antes de ir» y títulos de las piezas).
// NUNCA llevan el texto de pago: los guiones, retos, mitos y fichas no se leen aquí.
//
// Direcciones:  es → /guias/<nombre>/   en → /en/guides/<nombre>/   fr → /fr/guides/<nombre>/   pl → /pl/przewodniki/<nombre>/
// Un idioma solo sale si el sitio tiene sus textos traducidos (nunca se publica una página en inglés con texto en español).

import { stripLinks } from '../src/utils/pieceLinks.js';

export const DOMINIO = 'https://xolotli.com';
export const IDIOMAS = ['es', 'en', 'fr', 'pl'];

const RUTA = { es: '/guias/', en: '/en/guides/', fr: '/fr/guides/', pl: '/pl/przewodniki/' };
const OG_LOCALE = { es: 'es_MX', en: 'en_US', fr: 'fr_FR', pl: 'pl_PL' };

/**
 * Qué sitios tienen página. slugs = nombre en la dirección, por idioma; nombres = cómo se llama el sitio en cada idioma
 * (solo si el sitio no trae `name_<idioma>` en sites.json); articulo = «el»/«la» para «Qué ver en el Museo…» (español).
 * Para sumar un sitio, agrégalo aquí (la clave es su id en sites.json, en mayúsculas).
 */
export const PAGINAS = {
  MNA: {
    articulo: 'el',
    slugs: { es: 'museo-nacional-de-antropologia', en: 'national-museum-of-anthropology', fr: 'musee-national-d-anthropologie', pl: 'narodowe-muzeum-antropologii' },
    nombres: { en: 'National Museum of Anthropology', fr: 'Musée national d’anthropologie', pl: 'Narodowe Muzeum Antropologii' },
  },
  TEOTIHUACAN: {
    articulo: 'la',
    slugs: { es: 'zona-arqueologica-de-teotihuacan', en: 'teotihuacan-archaeological-zone', fr: 'zone-archeologique-de-teotihuacan', pl: 'strefa-archeologiczna-teotihuacan' },
    nombres: { en: 'Teotihuacan Archaeological Zone', fr: 'Zone archéologique de Teotihuacan', pl: 'Strefa archeologiczna Teotihuacán' },
  },
  CHAPULTEPEC: {
    articulo: 'el',
    slugs: { es: 'castillo-de-chapultepec', en: 'chapultepec-castle', fr: 'chateau-de-chapultepec', pl: 'zamek-chapultepec' },
    nombres: { en: 'Chapultepec Castle', fr: 'Château de Chapultepec', pl: 'Zamek Chapultepec' },
  },
  CENTRO_HISTORICO: {
    articulo: 'el',
    slugs: { es: 'centro-historico-ciudad-de-mexico', en: 'historic-centre-mexico-city', fr: 'centre-historique-mexico', pl: 'centrum-historyczne-miasta-meksyk' },
    nombres: { en: 'Historic Centre of Mexico City', fr: 'Centre historique de Mexico', pl: 'Centrum Historyczne miasta Meksyk' },
  },
  CHICHEN_ITZA: {
    articulo: 'la',
    slugs: { es: 'zona-arqueologica-de-chichen-itza', en: 'chichen-itza-archaeological-zone', fr: 'zone-archeologique-de-chichen-itza', pl: 'strefa-archeologiczna-chichen-itza' },
    nombres: { en: 'Chichén Itzá Archaeological Zone', fr: 'Zone archéologique de Chichén Itzá', pl: 'Strefa archeologiczna Chichén Itzá' },
  },
  TEMPLO_MAYOR_CATEDRAL: {
    articulo: 'el',
    slugs: { es: 'templo-mayor-y-catedral-metropolitana', en: 'templo-mayor-and-metropolitan-cathedral', fr: 'templo-mayor-et-cathedrale-metropolitaine', pl: 'templo-mayor-i-katedra-metropolitalna' },
    nombres: { en: 'Templo Mayor and Metropolitan Cathedral', fr: 'Templo Mayor et cathédrale métropolitaine', pl: 'Templo Mayor i Katedra Metropolitalna' },
  },
  MUSEO_FRIDA_KAHLO: {
    articulo: 'el',
    slugs: { es: 'museo-frida-kahlo-casa-azul', en: 'frida-kahlo-museum-blue-house', fr: 'musee-frida-kahlo-maison-bleue', pl: 'muzeum-fridy-kahlo-niebieski-dom' },
    nombres: { en: 'Frida Kahlo Museum (The Blue House)', fr: 'Musée Frida Kahlo (La Maison Bleue)', pl: 'Muzeum Fridy Kahlo (Niebieski Dom)' },
  },
};

const NBSP = ' ';

export const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const lleno = (v) => typeof v === 'string' && v.trim().length > 0;

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

// ───────────────────────── Textos de las páginas, por idioma ─────────────────────────

const plPl = (n, uno, pocos, muchos) => {
  const m10 = n % 10;
  const m100 = n % 100;
  return n === 1 ? uno : m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14) ? pocos : muchos;
};

/** «12 obras», «1 parada», «5 works», «3 étapes», «2 przystanki». */
export function contar(lang, n, aireLibre) {
  const f = {
    es: aireLibre ? ['parada', 'paradas'] : ['obra', 'obras'],
    en: aireLibre ? ['stop', 'stops'] : ['work', 'works'],
    fr: aireLibre ? ['étape', 'étapes'] : ['œuvre', 'œuvres'],
  };
  if (lang === 'pl') return `${n} ${aireLibre ? plPl(n, 'przystanek', 'przystanki', 'przystanków') : plPl(n, 'dzieło', 'dzieła', 'dzieł')}`;
  return `${n} ${n === 1 ? f[lang][0] : f[lang][1]}`;
}

const T = {
  es: {
    titulo: (n) => `${n}: audioguía y guía de visita`,
    h1: (n) => `${n}: audioguía para tu visita`,
    desc: (n, cuantas, rango, gratis) => `${n}: audioguía en tu celular con ${cuantas} explicadas${rango ? `, recorridos de ${rango}` : ''}${gratis ? `, ${gratis} gratis para probar` : ''} y uso sin internet.`,
    pronto: 'Próximamente: esta audioguía estará disponible muy pronto.',
    gratisTitulo: (aire) => (aire ? 'Paradas para probar gratis' : 'Obras para probar gratis'),
    piezaTitulo: (p, n) => `${p}: historia y ubicación (${n})`,
    ubic: (sala, n) => `Ubicación: ${sala ? `${sala}, ` : ''}${n}.`,
    piezaCta: (n) => `Escucha la audioguía completa de ${n}`,
    volver: (n) => `Ver la guía de ${n}`,
    piezaDesc: (p, n) => `${p} en ${n}: su historia, qué significa y dónde encontrarla. Texto gratuito de la audioguía.`,
    abrir: 'Abrir la audioguía',
    precio: (p) => `Pase de 72 horas por ${p}, sin suscripción. `,
    gratis: (c) => `${c} para escuchar gratis, sin registro.`,
    sobre: (aire) => (aire ? 'Sobre el sitio' : 'Sobre el museo'),
    queVer: (n, art, ruta) => `Qué ver en ${[art, n].filter(Boolean).join(' ')}: ${ruta}`,
    queVerSub: (c, d) => `${c}${d ? ` en unos ${d}` : ''}, en el orden en que se camina.`,
    recorridos: 'Recorridos',
    recorridosSub: (aire) => `Elige uno según el tiempo que tengas. La audioguía te lleva ${aire ? 'parada por parada' : 'obra por obra'}.`,
    lugares: (aire) => (aire ? 'Zonas' : 'Salas'),
    antes: 'Antes de ir',
    otras: 'Otras guías',
    pie: 'audioguías en tu celular para museos y zonas arqueológicas de México. Funcionan sin internet una vez descargadas.',
  },
  en: {
    titulo: (n) => `${n}: audio guide and visitor guide`,
    h1: (n) => `${n}: audio guide for your visit`,
    desc: (n, cuantas, rango, gratis) => `${n}: audio guide on your phone with ${cuantas} explained${rango ? `, tours from ${rango}` : ''}${gratis ? `, ${gratis} free to try` : ''} and offline use.`,
    pronto: 'Coming soon: this audio guide will be available shortly.',
    gratisTitulo: (aire) => (aire ? 'Free stops to try' : 'Free works to try'),
    piezaTitulo: (p, n) => `${p}: history and location (${n})`,
    ubic: (sala, n) => `Location: ${sala ? `${sala}, ` : ''}${n}.`,
    piezaCta: (n) => `Listen to the full audio guide for ${n}`,
    volver: (n) => `See the guide to ${n}`,
    piezaDesc: (p, n) => `${p} at ${n}: its story, what it means and where to find it. Free text from the audio guide.`,
    abrir: 'Open the audio guide',
    precio: (p) => `72-hour pass for ${p}, no subscription. `,
    gratis: (c) => `${c} to listen to for free, no sign-up.`,
    sobre: (aire) => (aire ? 'About the site' : 'About the museum'),
    queVer: (n, art, ruta) => `What to see: ${ruta}`,
    queVerSub: (c, d) => `${c}${d ? ` in about ${d}` : ''}, in the order you walk.`,
    recorridos: 'Tours',
    recorridosSub: () => 'Pick one for the time you have. The audio guide takes you one stop at a time.',
    lugares: (aire) => (aire ? 'Zones' : 'Rooms'),
    antes: 'Before you go',
    otras: 'Other guides',
    pie: 'audio guides on your phone for museums and archaeological sites in Mexico. They work offline once downloaded.',
  },
  fr: {
    titulo: (n) => `${n} : audioguide et guide de visite`,
    h1: (n) => `${n} : l’audioguide pour votre visite`,
    desc: (n, cuantas, rango, gratis) => `${n} : audioguide sur votre téléphone avec ${cuantas} expliquées${rango ? `, parcours de ${rango}` : ''}${gratis ? `, ${gratis} gratuites à essayer` : ''} et utilisation hors ligne.`,
    pronto: 'Bientôt disponible : cet audioguide sera prêt très prochainement.',
    gratisTitulo: (aire) => (aire ? 'Étapes gratuites à essayer' : 'Œuvres gratuites à essayer'),
    piezaTitulo: (p, n) => `${p} : histoire et emplacement (${n})`,
    ubic: (sala, n) => `Emplacement : ${sala ? `${sala}, ` : ''}${n}.`,
    piezaCta: (n) => `Écoutez l’audioguide complet de ${n}`,
    volver: (n) => `Voir le guide : ${n}`,
    piezaDesc: (p, n) => `${p} – ${n} : son histoire, sa signification et où la trouver. Texte gratuit de l’audioguide.`,
    abrir: 'Ouvrir l’audioguide',
    precio: (p) => `Pass de 72 heures pour ${p}, sans abonnement. `,
    gratis: (c) => `${c} à écouter gratuitement, sans inscription.`,
    sobre: (aire) => (aire ? 'À propos du site' : 'À propos du musée'),
    queVer: (n, art, ruta) => `Que voir : ${ruta}`,
    queVerSub: (c, d) => `${c}${d ? ` en environ ${d}` : ''}, dans l’ordre de la marche.`,
    recorridos: 'Parcours',
    recorridosSub: () => 'Choisissez-en un selon le temps dont vous disposez. L’audioguide vous mène étape par étape.',
    lugares: (aire) => (aire ? 'Zones' : 'Salles'),
    antes: 'Avant de partir',
    otras: 'Autres guides',
    pie: 'audioguides sur votre téléphone pour les musées et sites archéologiques du Mexique. Ils fonctionnent hors ligne une fois téléchargés.',
  },
  pl: {
    titulo: (n) => `${n}: audioprzewodnik i poradnik zwiedzania`,
    h1: (n) => `${n}: audioprzewodnik na Twoją wizytę`,
    desc: (n, cuantas, rango, gratis) => `${n}: audioprzewodnik w telefonie, ${cuantas} objaśnionych${rango ? `, trasy od ${rango}` : ''}${gratis ? `, ${gratis} za darmo na próbę` : ''} i działanie bez internetu.`,
    pronto: 'Wkrótce: ten audioprzewodnik będzie dostępny już niedługo.',
    gratisTitulo: (aire) => (aire ? 'Przystanki do wypróbowania za darmo' : 'Dzieła do wypróbowania za darmo'),
    piezaTitulo: (p, n) => `${p}: historia i lokalizacja (${n})`,
    ubic: (sala, n) => `Lokalizacja: ${sala ? `${sala}, ` : ''}${n}.`,
    piezaCta: (n) => `Posłuchaj pełnego audioprzewodnika: ${n}`,
    volver: (n) => `Zobacz przewodnik: ${n}`,
    piezaDesc: (p, n) => `${p} – ${n}: historia, znaczenie i miejsce, gdzie ją znaleźć. Bezpłatny tekst z audioprzewodnika.`,
    abrir: 'Otwórz audioprzewodnik',
    precio: (p) => `Karnet na 72 godziny za ${p}, bez subskrypcji. `,
    gratis: (c) => `${c} do posłuchania za darmo, bez rejestracji.`,
    sobre: (aire) => (aire ? 'O stanowisku' : 'O muzeum'),
    queVer: (n, art, ruta) => `Co zobaczyć: ${ruta}`,
    queVerSub: (c, d) => `${c}${d ? `, około ${d}` : ''}, w kolejności zwiedzania.`,
    recorridos: 'Trasy',
    recorridosSub: () => 'Wybierz trasę na tyle czasu, ile masz. Audioprzewodnik prowadzi Cię przystanek po przystanku.',
    lugares: (aire) => (aire ? 'Strefy' : 'Sale'),
    antes: 'Przed wizytą',
    otras: 'Inne przewodniki',
    pie: 'audioprzewodniki w telefonie po muzeach i stanowiskach archeologicznych Meksyku. Po pobraniu działają bez internetu.',
  },
};

const moneda = (lang, sitio, manifiesto) => {
  const usd = Number(sitio.pass_price_usd ?? manifiesto.pass_price_usd) || 0;
  const mxn = Number(sitio.pass_price_mxn ?? manifiesto.pass_price_mxn) || 0;
  if (lang !== 'es' && usd) return `US$${usd}`;
  return mxn ? `$${mxn} MXN` : '';
};

/** Dirección de la página de un sitio en un idioma. */
export const direccion = (slug, lang) => `${RUTA[lang]}${slug}/`;

/**
 * ¿Hay datos suficientes para publicar este sitio en este idioma? Español siempre. Otro idioma: el sitio debe tener nombre en ese idioma
 * y al menos dos de estas cuatro cosas traducidas: descripción, presentación, algún recorrido, algún tema de «Antes de ir».
 */
export function idiomaDisponible({ sitio, manifiesto = {}, cfg }, lang) {
  if (lang === 'es') return true;
  if (!lleno(sitio[`name_${lang}`]) && !lleno(cfg.nombres?.[lang])) return false;
  const hechas = [
    lleno(sitio[`description_${lang}`]),
    lleno(sitio[`intro_${lang}`]),
    (manifiesto.routes || []).some((r) => r.stops?.length && lleno(r[`name_${lang}`])),
    (manifiesto.before_visit || []).some((a) => lleno(a[`title_${lang}`]) && lleno(a[`text_${lang}`])),
  ].filter(Boolean).length;
  return hechas >= 2;
}

const ESTILOS = `<style>
:root{--bg:#FBF6EE;--ink:#2a1f1a;--ink2:#5a4a40;--linea:#e4d9c9;--acento:#a30f48}
@media (prefers-color-scheme:dark){:root{--bg:#1c1613;--ink:#f1e8dc;--ink2:#c4b5a5;--linea:#3a2f28;--acento:#ff6b9a}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:1.0625rem/1.65 Georgia,'Times New Roman',serif}
.envoltura{max-width:42rem;margin:0 auto;padding:0 1.25rem 3rem}
header.marca{display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-bottom:1px solid var(--linea);font:600 1rem system-ui,sans-serif}
header.marca a{color:var(--ink);text-decoration:none}
nav.idiomas{display:flex;gap:.9rem;font:600 .875rem system-ui,sans-serif}
nav.idiomas a{color:var(--ink2)}
nav.idiomas span{color:var(--acento)}
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
</style>`;

/** Cascarón común de todas las páginas: cabecera, datos para Google, estilos y pie. */
function plantilla({ lang, titulo, descripcion, url, hreflang, portada, jsonld, selector, cuerpo, pie }) {
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
<link rel="canonical" href="${url}">
${hreflang}
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Audioguía Xolo">
<meta property="og:locale" content="${OG_LOCALE[lang]}">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:url" content="${url}">
${portada ? `<meta property="og:image" content="${DOMINIO}${esc(portada)}">\n` : ''}<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#FBF6EE">
<link rel="icon" type="image/svg+xml" href="/icon.svg">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
${ESTILOS}
<script type="application/ld+json">${jsonld}</script>
</head>
<body>
<div class="envoltura">
<header class="marca"><a href="/">Audioguía Xolo</a>${selector}</header>
<main>
${cuerpo}
</main>
<footer><p><a href="/">Audioguía Xolo</a>: ${esc(pie)}</p></footer>
</div>
</body>
</html>
`;
}

/**
 * Arma el HTML de la página de un sitio en un idioma.
 * datos: { sitio, manifiesto, salas, piezas, cfg (de PAGINAS), lang, idiomas (los que sí salen), otras: [{ nombre, url }], portada }
 */
export function armarPagina({ sitio, manifiesto = {}, salas = [], piezas = [], cfg, lang = 'es', idiomas = [lang], otras = [], portada = '', gratisEnlaces = [] }) {
  const t = T[lang];
  const slug = cfg.slugs[lang];
  const url = `${DOMINIO}${direccion(slug, lang)}`;
  const nombre = (lang === 'es' ? sitio.name : sitio[`name_${lang}`] || cfg.nombres?.[lang]) || sitio.name;
  const aireLibre = manifiesto.layout === 'zones';
  const loc = (obj, campo) => (lang === 'es' ? obj[campo] : obj[`${campo}_${lang}`]);

  // Solo lo que existe en este idioma: lo demás no se publica (nunca español dentro de una página en otro idioma)
  const rutas = (manifiesto.routes || [])
    .filter((r) => r.stops?.length && (lang === 'es' || lleno(r[`name_${lang}`])))
    .map((r) => ({ ...r, nombreL: loc(r, 'name'), descL: loc(r, 'description') }));
  const antes = (manifiesto.before_visit || [])
    .map((a) => ({ titulo: loc(a, 'title'), texto: loc(a, 'text') }))
    .filter((a) => lleno(a.titulo) && lleno(a.texto));
  const intro = String(loc(sitio, 'intro') || '').trim();
  const lead = String(loc(sitio, 'description') || '').trim();

  const porId = new Map(piezas.map((p) => [p.piece_id, p]));
  const tituloPieza = (p, respaldo) => (lang === 'es' ? p?.titulo || p?.title || respaldo : p?.[`titulo_${lang}`] || p?.titulo || p?.title || respaldo);
  const principal = recorridoPrincipal(rutas);
  const gratis = piezas.filter((p) => p.is_free);
  const minutos = rutas.map(minutosDe).filter((m) => m > 0);
  const rango = minutos.length ? `${duracion(Math.min(...minutos))}${Math.min(...minutos) === Math.max(...minutos) ? '' : lang === 'es' ? ` a ${duracion(Math.max(...minutos))}` : lang === 'pl' ? ` do ${duracion(Math.max(...minutos))}` : lang === 'fr' ? ` à ${duracion(Math.max(...minutos))}` : ` to ${duracion(Math.max(...minutos))}`}` : '';
  const precio = moneda(lang, sitio, manifiesto);
  const abrir = `/?sitio=${encodeURIComponent(sitio.id)}&idioma=${lang}`;

  const titulo = t.titulo(nombre);
  const descripcion = recortar(t.desc(nombre, contar(lang, piezas.length, aireLibre), rango, gratis.length && !cfg.proximamente ? contar(lang, gratis.length, aireLibre) : ''));

  const alternativas = idiomas.map((l) => ({ l, href: `${DOMINIO}${direccion(cfg.slugs[l], l)}` }));
  const hreflang = [...alternativas.map((a) => `<link rel="alternate" hreflang="${a.l}" href="${a.href}">`), `<link rel="alternate" hreflang="x-default" href="${alternativas.find((a) => a.l === 'es')?.href || url}">`].join('\n');
  const selector = idiomas.length > 1 ? `<nav class="idiomas" aria-label="Idioma">${alternativas.map((a) => (a.l === lang ? `<span aria-current="true">${a.l.toUpperCase()}</span>` : `<a href="${a.href}" hreflang="${a.l}" lang="${a.l}">${a.l.toUpperCase()}</a>`)).join('')}</nav>` : '';

  const lugar = {
    '@type': aireLibre ? ['TouristAttraction'] : ['Museum', 'TouristAttraction'],
    '@id': `${url}#lugar`,
    name: nombre,
    ...(lead ? { description: lead } : {}),
    url,
    ...(loc(sitio, 'location') ? { address: loc(sitio, 'location') } : sitio.location ? { address: sitio.location } : {}),
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
      inLanguage: lang,
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
          const g = p ? loc(p, 'frase_gancho') : '';
          return `<li><strong>${esc(tituloPieza(p, s.title))}</strong>${lleno(g) ? ` <span class="gancho">${esc(g)}</span>` : ''}</li>`;
        })
        .join('\n')
    : '';

  const listaRutas = rutas
    .map((r) => {
      const d = lang === 'es' && r.duration ? r.duration : duracion(minutosDe(r));
      return `<li><strong>${esc(r.nombreL)}</strong> <span class="dato">${esc(d)} · ${esc(contar(lang, r.stops.length, aireLibre))}</span>${lleno(r.descL) ? `<br>${esc(r.descL)}` : ''}</li>`;
    })
    .join('\n');

  // En otros idiomas solo salas con nombre traducido (nunca el nombre en español dentro de otra página)
  const listaSalas = [...salas]
    .filter((s) => lang === 'es' || lleno(s[`nombre_oficial_${lang}`]))
    .sort((a, b) => (parseInt(a.numero_oficial, 10) || 0) - (parseInt(b.numero_oficial, 10) || 0))
    .map((s) => {
      const nom = lang === 'es' ? s.nombre_oficial : s[`nombre_oficial_${lang}`];
      const g = loc(s, 'frase_gancho');
      return `<li><strong>${esc(nom)}</strong>${lleno(g) ? ` <span class="gancho">${esc(g)}</span>` : ''}</li>`;
    })
    .join('\n');

  const bloqueAntes = antes.map((a) => `<h3>${esc(a.titulo)}</h3>\n${textoEnHtml(a.texto)}`).join('\n');

  const cta = () => cfg.proximamente
    ? `<p class="nota"><strong>${esc(t.pronto)}</strong></p>`
    : `<p class="cta"><a class="boton" href="${esc(abrir)}">${esc(t.abrir)}</a></p>
<p class="nota">${precio ? esc(t.precio(precio)) : ''}${gratis.length ? esc(t.gratis(contar(lang, gratis.length, aireLibre))) : ''}</p>`;

  const enlacesOtras = otras.length
    ? `<h2>${esc(t.otras)}</h2>\n<ul class="otras">${otras.map((o) => `<li><a href="${esc(o.url)}">${esc(o.nombre)}</a></li>`).join('')}</ul>`
    : '';

  const cuerpo = `<h1>${esc(t.h1(nombre))}</h1>
${lead ? `<p class="lead">${esc(lead)}</p>` : ''}
${portada ? `<img class="portada" src="${esc(portada)}" alt="${esc(nombre)}" width="1200" height="800" fetchpriority="high">` : ''}
${cta()}
${intro ? `<h2>${esc(t.sobre(aireLibre))}</h2>\n${textoEnHtml(intro)}` : ''}
${principal ? `<h2>${esc(t.queVer(nombre, lang === 'es' ? cfg.articulo : '', principal.nombreL))}</h2>\n<p>${esc(t.queVerSub(contar(lang, principal.stops.length, aireLibre), duracion(minutosDe(principal))))}</p>\n<ol>\n${queVer}\n</ol>` : ''}
${rutas.length ? `<h2>${esc(t.recorridos)}</h2>\n<p>${esc(t.recorridosSub(aireLibre))}</p>\n<ul>\n${listaRutas}\n</ul>` : ''}
${listaSalas ? `<h2>${esc(t.lugares(aireLibre))}</h2>\n<ul>\n${listaSalas}\n</ul>` : ''}
${antes.length ? `<h2>${esc(t.antes)}</h2>\n${bloqueAntes}` : ''}
${gratisEnlaces.length ? `<h2>${esc(t.gratisTitulo(aireLibre))}</h2>\n<ul>${gratisEnlaces.map((g) => `<li><a href="${esc(g.url)}">${esc(g.titulo)}</a></li>`).join('')}</ul>` : ''}
${cta()}
${enlacesOtras}`;
  const html = plantilla({ lang, titulo, descripcion, url, hreflang, portada, jsonld, selector, cuerpo, pie: t.pie });
  return { html, url, titulo, descripcion };
}

/** sitemap.xml: la portada y cada página de guía, con sus versiones en otros idiomas. */
export function armarSitemap(paginas, fecha = new Date()) {
  const dia = fecha.toISOString().slice(0, 10);
  const alt = (grupo) =>
    grupo.length > 1
      ? grupo.map((g) => `\n    <xhtml:link rel="alternate" hreflang="${g.lang}" href="${esc(g.url)}"/>`).join('') +
        `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${esc((grupo.find((g) => g.lang === 'es') || grupo[0]).url)}"/>`
      : '';
  const items = [`  <url><loc>${DOMINIO}/</loc><lastmod>${dia}</lastmod></url>`];
  for (const grupo of paginas) {
    for (const g of grupo) items.push(`  <url><loc>${esc(g.url)}</loc><lastmod>${dia}</lastmod>${alt(grupo)}\n  </url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${items.join('\n')}\n</urlset>\n`;
}


// ───────────────────────── Páginas de piezas gratis ─────────────────────────
// Solo piezas marcadas is_free: su texto ya es público en la app. Las de pago NUNCA tienen página.

/** «Piedra del Sol» → «piedra-del-sol» (sin acentos, solo letras y números). */
export function slugificar(texto) {
  return String(texto || '')
    .toLowerCase()
    .replace(/ł/g, 'l')
    .replace(/œ/g, 'oe')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
    .replace(/-+$/g, '');
}

/** Texto de la pieza en un idioma (el más largo disponible); '' si no existe en ese idioma. */
export function textoPieza(p, lang) {
  const sfx = lang === 'es' ? '' : `_${lang}`;
  const largo = p[`guion_largo${sfx}`];
  const corto = p[`guion_corto${sfx}`];
  return String(lleno(largo) ? largo : lleno(corto) ? corto : '').trim();
}

export const tituloDePieza = (p, lang) => String((lang === 'es' ? p.titulo || p.title : p[`titulo_${lang}`]) || '').trim();

/** ¿Esta pieza tiene página en este idioma? Gratis, con título y texto en ese idioma. */
export const piezaPublicable = (p, lang) => p.is_free === true && lleno(tituloDePieza(p, lang)) && lleno(textoPieza(p, lang));

/** Dirección de una pieza: la de su sitio + el nombre de la pieza. */
export const direccionPieza = (cfg, p, lang) => `${direccion(cfg.slugs[lang], lang)}${slugificar(tituloDePieza(p, lang))}/`;

/**
 * Página de una pieza gratis. datos: { sitio, cfg, pieza, sala, lang, idiomas (en los que esta pieza tiene página), idiomasSitio, portada }
 */
export function armarPiezaPagina({ sitio, manifiesto = {}, cfg, pieza, sala = null, lang = 'es', idiomas = [lang], portada = '' }) {
  const t = T[lang];
  const nombre = (lang === 'es' ? sitio.name : sitio[`name_${lang}`] || cfg.nombres?.[lang]) || sitio.name;
  const nombrePieza = tituloDePieza(pieza, lang);
  const url = `${DOMINIO}${direccionPieza(cfg, pieza, lang)}`;
  const urlSitio = `${DOMINIO}${direccion(cfg.slugs[lang], lang)}`;
  const loc = (obj, campo) => (lang === 'es' ? obj?.[campo] : obj?.[`${campo}_${lang}`]);
  const nombreSala = sala ? String((lang === 'es' ? sala.nombre_oficial : sala[`nombre_oficial_${lang}`]) || '').trim() : '';
  const gancho = String(loc(pieza, 'frase_gancho') || '').trim();
  const texto = stripLinks(textoPieza(pieza, lang));
  const precio = moneda(lang, sitio, manifiesto);
  const abrir = `/?sitio=${encodeURIComponent(sitio.id)}&idioma=${lang}`;

  const titulo = t.piezaTitulo(nombrePieza, nombre);
  const descripcion = recortar(gancho ? `${gancho} ${t.piezaDesc(nombrePieza, nombre)}` : t.piezaDesc(nombrePieza, nombre));

  const alt = idiomas.map((l) => ({ l, href: `${DOMINIO}${direccionPieza(cfg, pieza, l)}` }));
  const hreflang = [...alt.map((a) => `<link rel="alternate" hreflang="${a.l}" href="${a.href}">`), `<link rel="alternate" hreflang="x-default" href="${alt.find((a) => a.l === 'es')?.href || url}">`].join('\n');
  const selector = idiomas.length > 1 ? `<nav class="idiomas" aria-label="Idioma">${alt.map((a) => (a.l === lang ? `<span aria-current="true">${a.l.toUpperCase()}</span>` : `<a href="${a.href}" hreflang="${a.l}" lang="${a.l}">${a.l.toUpperCase()}</a>`)).join('')}</nav>` : '';

  const grafo = [
    {
      '@type': 'WebPage',
      '@id': url,
      url,
      name: titulo,
      description: descripcion,
      inLanguage: lang,
      ...(portada ? { primaryImageOfPage: { '@type': 'ImageObject', url: `${DOMINIO}${portada}` } } : {}),
      isPartOf: { '@type': 'WebSite', name: 'Audioguía Xolo', url: `${DOMINIO}/` },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Audioguía Xolo', item: `${DOMINIO}/` },
        { '@type': 'ListItem', position: 2, name: nombre, item: urlSitio },
        { '@type': 'ListItem', position: 3, name: nombrePieza, item: url },
      ],
    },
  ];
  const jsonld = JSON.stringify({ '@context': 'https://schema.org', '@graph': grafo }).replace(/</g, '\\u003c');

  const cta = `<p class="cta"><a class="boton" href="${esc(abrir)}">${esc(t.piezaCta(nombre))}</a></p>
<p class="nota">${precio ? esc(t.precio(precio)) : ''}</p>`;

  const cuerpo = `<p class="dato"><a href="${urlSitio}">${esc(nombre)}</a></p>
<h1>${esc(nombrePieza)}</h1>
${gancho ? `<p class="lead">${esc(gancho)}</p>` : ''}
${portada ? `<img class="portada" src="${esc(portada)}" alt="${esc(nombrePieza)}" width="1200" height="800" fetchpriority="high">` : ''}
<p class="dato">${esc(t.ubic(nombreSala, nombre))}</p>
${textoEnHtml(texto)}
${cta}
<p><a href="${urlSitio}">${esc(t.volver(nombre))}</a></p>`;

  const html = plantilla({ lang, titulo, descripcion, url, hreflang, portada, jsonld, selector, cuerpo, pie: t.pie });
  return { html, url, titulo, descripcion };
}
