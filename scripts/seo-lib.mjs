// Páginas públicas para Google: una por sitio y por idioma, con su propia dirección, título, descripción y datos estructurados.
// Se arman al compilar, solo con lo que ya es público (sites.json, recorridos, salas, «Antes de ir» y títulos de las piezas).
// NUNCA llevan el texto de pago: los guiones, retos, mitos y fichas no se leen aquí.
//
// Direcciones:  es → /guias/<nombre>/   en → /en/guides/<nombre>/   fr → /fr/guides/<nombre>/   pl → /pl/przewodniki/<nombre>/
// Un idioma solo sale si el sitio tiene sus textos traducidos (nunca se publica una página en inglés con texto en español).

import { stripLinks } from '../src/utils/pieceLinks.js';
import { aDigitos } from '../src/utils/numerosPantalla.js';
import { ogNombre } from './og-lib.mjs';

export const DOMINIO = 'https://xolotli.com';
export const IDIOMAS = ['es', 'en', 'fr', 'pl', 'de', 'pt', 'it'];

/** Frase corta de marca que va en las imágenes para compartir. */
export const OG_LEMA = { es: 'Audioguías de México', en: 'Audio guides for Mexico', fr: 'Audioguides du Mexique', pl: 'Audioprzewodniki po Meksyku', de: 'Audioguides für Mexiko', pt: 'Audioguias do México', it: 'Audioguide del Messico' };

const RUTA = { es: '/guias/', en: '/en/guides/', fr: '/fr/guides/', pl: '/pl/przewodniki/', de: '/de/fuehrer/', pt: '/pt/guias/', it: '/it/guide/' };
const OG_LOCALE = { es: 'es_MX', en: 'en_US', fr: 'fr_FR', pl: 'pl_PL', de: 'de_DE', pt: 'pt_BR', it: 'it_IT' };

/**
 * Qué sitios tienen página. slugs = nombre en la dirección, por idioma; nombres = cómo se llama el sitio en cada idioma
 * (solo si el sitio no trae `name_<idioma>` en sites.json); articulo = «el»/«la» para «Qué ver en el Museo…» (español).
 * Para sumar un sitio, agrégalo aquí (la clave es su id en sites.json, en mayúsculas).
 */
export const PAGINAS = {
  MNA: {
    articulo: 'el',
    slugs: { es: 'museo-nacional-de-antropologia', en: 'national-museum-of-anthropology', fr: 'musee-national-d-anthropologie', pl: 'narodowe-muzeum-antropologii', de: 'nationales-anthropologiemuseum', pt: 'museu-nacional-de-antropologia', it: 'museo-nazionale-di-antropologia' },
    nombres: { en: 'National Museum of Anthropology', fr: 'Musée national d’anthropologie', pl: 'Narodowe Muzeum Antropologii', de: 'Nationales Anthropologiemuseum', pt: 'Museu Nacional de Antropologia', it: 'Museo Nazionale di Antropologia' },
  },
  TEOTIHUACAN: {
    articulo: 'la',
    slugs: { es: 'zona-arqueologica-de-teotihuacan', en: 'teotihuacan-archaeological-zone', fr: 'zone-archeologique-de-teotihuacan', pl: 'strefa-archeologiczna-teotihuacan', de: 'archaeologische-zone-teotihuacan', pt: 'zona-arqueologica-de-teotihuacan', it: 'zona-archeologica-di-teotihuacan' },
    nombres: { en: 'Teotihuacan Archaeological Zone', fr: 'Zone archéologique de Teotihuacan', pl: 'Strefa archeologiczna Teotihuacán', de: 'Archäologische Zone Teotihuacán', pt: 'Zona Arqueológica de Teotihuacán', it: 'Zona archeologica di Teotihuacán' },
  },
  CHAPULTEPEC: {
    articulo: 'el',
    slugs: { es: 'castillo-de-chapultepec', en: 'chapultepec-castle', fr: 'chateau-de-chapultepec', pl: 'zamek-chapultepec', de: 'schloss-chapultepec', pt: 'castelo-de-chapultepec', it: 'castello-di-chapultepec' },
    nombres: { en: 'Chapultepec Castle', fr: 'Château de Chapultepec', pl: 'Zamek Chapultepec', de: 'Schloss Chapultepec', pt: 'Castelo de Chapultepec', it: 'Castello di Chapultepec' },
  },
  CENTRO_HISTORICO: {
    articulo: 'el',
    slugs: { es: 'centro-historico-ciudad-de-mexico', en: 'historic-centre-mexico-city', fr: 'centre-historique-mexico', pl: 'centrum-historyczne-miasta-meksyk', de: 'historisches-zentrum-mexiko-stadt', pt: 'centro-historico-da-cidade-do-mexico', it: 'centro-storico-di-citta-del-messico' },
    nombres: { en: 'Historic Centre of Mexico City', fr: 'Centre historique de Mexico', pl: 'Centrum Historyczne miasta Meksyk', de: 'Historisches Zentrum von Mexiko-Stadt', pt: 'Centro Histórico da Cidade do México', it: 'Centro storico di Città del Messico' },
  },
  CHICHEN_ITZA: {
    articulo: 'la',
    slugs: { es: 'zona-arqueologica-de-chichen-itza', en: 'chichen-itza-archaeological-zone', fr: 'zone-archeologique-de-chichen-itza', pl: 'strefa-archeologiczna-chichen-itza', de: 'archaeologische-zone-chichen-itza', pt: 'zona-arqueologica-de-chichen-itza', it: 'zona-archeologica-di-chichen-itza' },
    nombres: { en: 'Chichén Itzá Archaeological Zone', fr: 'Zone archéologique de Chichén Itzá', pl: 'Strefa archeologiczna Chichén Itzá', de: 'Archäologische Zone Chichén Itzá', pt: 'Zona Arqueológica de Chichén Itzá', it: 'Zona archeologica di Chichén Itzá' },
  },
  TEMPLO_MAYOR_CATEDRAL: {
    articulo: 'el',
    slugs: { es: 'templo-mayor-y-catedral-metropolitana', en: 'templo-mayor-and-metropolitan-cathedral', fr: 'templo-mayor-et-cathedrale-metropolitaine', pl: 'templo-mayor-i-katedra-metropolitalna', de: 'templo-mayor-und-metropolitankathedrale', pt: 'templo-mayor-e-catedral-metropolitana', it: 'templo-mayor-e-cattedrale-metropolitana' },
    nombres: { en: 'Templo Mayor and Metropolitan Cathedral', fr: 'Templo Mayor et cathédrale métropolitaine', pl: 'Templo Mayor i Katedra Metropolitalna', de: 'Templo Mayor und Metropolitankathedrale', pt: 'Templo Mayor e Catedral Metropolitana', it: 'Templo Mayor e Cattedrale Metropolitana' },
  },
  MUSEO_FRIDA_KAHLO: {
    articulo: 'el',
    slugs: { es: 'museo-frida-kahlo-casa-azul', en: 'frida-kahlo-museum-blue-house', fr: 'musee-frida-kahlo-maison-bleue', pl: 'muzeum-fridy-kahlo-niebieski-dom', de: 'frida-kahlo-museum-blaues-haus', pt: 'museu-frida-kahlo-casa-azul', it: 'museo-frida-kahlo-casa-azul' },
    nombres: { en: 'Frida Kahlo Museum (The Blue House)', fr: 'Musée Frida Kahlo (La Maison Bleue)', pl: 'Muzeum Fridy Kahlo (Niebieski Dom)', de: 'Frida-Kahlo-Museum (Das Blaue Haus)', pt: 'Museu Frida Kahlo (Casa Azul)', it: 'Museo Frida Kahlo (La Casa Azul)' },
  },
  CUERNAVACA_HISTORICA: {
    articulo: '',
    slugs: { es: 'cuernavaca-historica', en: 'historic-cuernavaca', fr: 'cuernavaca-historique', pl: 'historyczna-cuernavaca', de: 'historisches-cuernavaca', pt: 'cuernavaca-historica', it: 'cuernavaca-storica' },
    nombres: { en: 'Historic Cuernavaca', fr: 'Cuernavaca historique', pl: 'Historyczna Cuernavaca', de: 'Historisches Cuernavaca', pt: 'Cuernavaca Histórica', it: 'Cuernavaca storica' },
  },
  XOCHICALCO: {
    articulo: '',
    slugs: { es: 'zona-arqueologica-de-xochicalco', en: 'xochicalco-archaeological-zone', fr: 'zone-archeologique-de-xochicalco', pl: 'strefa-archeologiczna-xochicalco', de: 'archaeologische-zone-xochicalco', pt: 'zona-arqueologica-de-xochicalco', it: 'zona-archeologica-di-xochicalco' },
    nombres: { en: 'Xochicalco Archaeological Zone', fr: 'Zone archéologique de Xochicalco', pl: 'Strefa archeologiczna Xochicalco', de: 'Archäologische Zone Xochicalco', pt: 'Zona Arqueológica de Xochicalco', it: 'Zona archeologica di Xochicalco' },
  },
  CHALCATZINGO: {
    articulo: 'la',
    slugs: { es: 'zona-arqueologica-de-chalcatzingo', en: 'chalcatzingo-archaeological-zone', fr: 'zone-archeologique-de-chalcatzingo', pl: 'strefa-archeologiczna-chalcatzingo', de: 'archaeologische-zone-chalcatzingo', pt: 'zona-arqueologica-de-chalcatzingo', it: 'zona-archeologica-di-chalcatzingo' },
    nombres: { en: 'Chalcatzingo Archaeological Zone', fr: 'Zone archéologique de Chalcatzingo', pl: 'Strefa archeologiczna Chalcatzingo', de: 'Archäologische Zone Chalcatzingo', pt: 'Zona Arqueológica de Chalcatzingo', it: 'Zona archeologica di Chalcatzingo' },
  },
  COYOACAN: {
    articulo: 'el',
    slugs: { es: 'centro-de-coyoacan', en: 'coyoacan-centre', fr: 'centre-de-coyoacan', pl: 'centrum-coyoacan', de: 'zentrum-von-coyoacan', pt: 'centro-de-coyoacan', it: 'centro-di-coyoacan' },
    nombres: { en: 'Coyoacán Centre', fr: 'Centre de Coyoacán', pl: 'Centrum Coyoacán', de: 'Zentrum von Coyoacán', pt: 'Centro de Coyoacán', it: 'Centro di Coyoacán' },
  },
  BASILICA_GUADALUPE: {
    articulo: 'la',
    slugs: { es: 'basilica-de-guadalupe', en: 'basilica-of-guadalupe', fr: 'basilique-de-guadalupe', pl: 'bazylika-matki-bozej-z-guadalupe', de: 'basilika-von-guadalupe', pt: 'basilica-de-guadalupe', it: 'basilica-di-guadalupe' },
    nombres: { en: 'Basilica of Guadalupe', fr: 'Basilique de Guadalupe', pl: 'Bazylika Matki Bożej z Guadalupe', de: 'Basilika von Guadalupe', pt: 'Basílica de Guadalupe', it: 'Basilica di Guadalupe' },
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

/** «Coyoacán, Ciudad de México» → dirección postal de schema.org (localidad, región y país). Sin coma se deja el texto tal cual. */
export function direccionPostal(texto) {
  const t = String(texto || '').trim();
  if (!t) return '';
  const partes = t.split(',').map((x) => x.trim()).filter(Boolean);
  if (partes.length < 2) return t;
  return { '@type': 'PostalAddress', addressLocality: partes.slice(0, -1).join(', '), addressRegion: partes[partes.length - 1], addressCountry: 'MX' };
}

/** Recorta a ~max caracteres sin partir palabras. */
export function recortar(texto, max = 155) {
  const t = String(texto || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

/** De varias versiones (de la más completa a la más corta) elige la primera que cabe en `max` caracteres, SIN cortar frases. Si ninguna cabe, recorta la última. */
export function elegirCompleta(variantes, max = 155) {
  const limpias = variantes.map((v) => String(v || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
  return limpias.find((v) => v.length <= max) || recortar(limpias[limpias.length - 1] || '', max);
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
    de: aireLibre ? ['Stopp', 'Stopps'] : ['Werk', 'Werke'],
    pt: aireLibre ? ['parada', 'paradas'] : ['obra', 'obras'],
    it: aireLibre ? ['tappa', 'tappe'] : ['opera', 'opere'],
  };
  if (lang === 'pl') return `${n} ${aireLibre ? plPl(n, 'przystanek', 'przystanki', 'przystanków') : plPl(n, 'dzieło', 'dzieła', 'dzieł')}`;
  return `${n} ${n === 1 ? f[lang][0] : f[lang][1]}`;
}

const T = {
  es: {
    titulo: (n) => `${n}: audioguía y qué ver`,
    tituloCorto: (n) => `${n}: audioguía`,
    h1: (n) => `${n}: audioguía para tu visita`,
    desc: (n, cuantas, rango, gratis) => `${n}: qué ver y cómo llegar. Audioguía en tu celular con ${cuantas} explicadas${rango ? `, recorridos de ${rango}` : ''}${gratis ? `, ${gratis} gratis para probar` : ''} y uso sin internet.`,
    pronto: 'Próximamente: esta audioguía estará disponible muy pronto.',
    gratisTitulo: (aire) => (aire ? 'Paradas para probar gratis' : 'Obras para probar gratis'),
    piezaTitulo: (p, n) => `${p}: historia y ubicación (${n})`,
    piezaTituloCorto: (p) => `${p}: historia y ubicación`,
    ubic: (sala, n) => `Ubicación: ${sala ? `${sala}, ` : ''}${n}.`,
    piezaCta: (n) => `Escucha la audioguía completa de ${n}`,
    volver: (n) => `Ver la guía de ${n}`,
    pzUbic: 'Ubicación',
    pzTexto: 'Lo que cuenta la audioguía',
    pzMas: (n) => `Más paradas gratis de ${n}`,
    piezaDesc: (p, n) => `${p} en ${n}: su historia, qué significa y dónde encontrarla. Texto gratuito de la audioguía.`,
    abrir: 'Abrir la audioguía',
    precio: (p) => `Acceso completo de 30 días por ${p}, sin suscripción. La entrada al recinto no está incluida. `,
    gratis: (c) => `${c} para escuchar gratis, sin registro.`,
    sobre: (aire) => (aire ? 'Sobre el sitio' : 'Sobre el museo'),
    queVer: (n, art, ruta) => `Qué ver en ${[art, n].filter(Boolean).join(' ')}: ${ruta}`,
    queVerSub: (c, d) => `${c}${d ? ` en unos ${d}` : ''}, en el orden en que se camina.`,
    recorridos: 'Recorridos',
    recorridosSub: (aire) => `Elige uno según el tiempo que tengas. La audioguía te lleva ${aire ? 'parada por parada' : 'obra por obra'}.`,
    lugares: (aire) => (aire ? 'Zonas' : 'Salas'),
    antes: 'Antes de ir',
    otras: 'Otras guías',
    cerca: 'Cerca de aquí',
    pie: 'audioguías en tu celular para museos y zonas arqueológicas de México. Funcionan sin internet una vez descargadas.',
  },
  en: {
    titulo: (n) => `${n}: audio guide and what to see`,
    tituloCorto: (n) => `${n}: audio guide`,
    h1: (n) => `${n}: audio guide for your visit`,
    desc: (n, cuantas, rango, gratis) => `${n}: what to see and how to get there. Audio guide on your phone with ${cuantas} explained${rango ? `, tours from ${rango}` : ''}${gratis ? `, ${gratis} free to try` : ''} and offline use.`,
    pronto: 'Coming soon: this audio guide will be available shortly.',
    gratisTitulo: (aire) => (aire ? 'Free stops to try' : 'Free works to try'),
    piezaTitulo: (p, n) => `${p}: history and location (${n})`,
    piezaTituloCorto: (p) => `${p}: history and location`,
    ubic: (sala, n) => `Location: ${sala ? `${sala}, ` : ''}${n}.`,
    piezaCta: (n) => `Listen to the full audio guide for ${n}`,
    volver: (n) => `See the guide to ${n}`,
    pzUbic: 'Location',
    pzTexto: 'What the audio guide says',
    pzMas: (n) => `More free stops at ${n}`,
    piezaDesc: (p, n) => `${p} at ${n}: its story, what it means and where to find it. Free text from the audio guide.`,
    abrir: 'Open the audio guide',
    precio: (p) => `30-day full access for ${p}, no subscription. Admission to the site is not included. `,
    gratis: (c) => `${c} to listen to for free, no sign-up.`,
    sobre: (aire) => (aire ? 'About the site' : 'About the museum'),
    queVer: (n, art, ruta) => `What to see: ${ruta}`,
    queVerSub: (c, d) => `${c}${d ? ` in about ${d}` : ''}, in the order you walk.`,
    recorridos: 'Tours',
    recorridosSub: () => 'Pick one for the time you have. The audio guide takes you one stop at a time.',
    lugares: (aire) => (aire ? 'Zones' : 'Rooms'),
    antes: 'Before you go',
    otras: 'Other guides',
    cerca: 'Nearby',
    pie: 'audio guides on your phone for museums and archaeological sites in Mexico. They work offline once downloaded.',
  },
  fr: {
    titulo: (n) => `${n} : audioguide et visite`,
    tituloCorto: (n) => `${n} : audioguide`,
    h1: (n) => `${n} : l’audioguide pour votre visite`,
    desc: (n, cuantas, rango, gratis) => `${n} : que voir et comment s’y rendre. Audioguide sur votre téléphone avec ${cuantas} expliquées${rango ? `, parcours de ${rango}` : ''}${gratis ? `, ${gratis} gratuites à essayer` : ''} et utilisation hors ligne.`,
    pronto: 'Bientôt disponible : cet audioguide sera prêt très prochainement.',
    gratisTitulo: (aire) => (aire ? 'Étapes gratuites à essayer' : 'Œuvres gratuites à essayer'),
    piezaTitulo: (p, n) => `${p} : histoire et emplacement (${n})`,
    piezaTituloCorto: (p) => `${p} : histoire et emplacement`,
    ubic: (sala, n) => `Emplacement : ${sala ? `${sala}, ` : ''}${n}.`,
    piezaCta: (n) => `Écoutez l’audioguide complet de ${n}`,
    volver: (n) => `Voir le guide : ${n}`,
    pzUbic: 'Emplacement',
    pzTexto: 'Ce que raconte l’audioguide',
    pzMas: (n) => `Plus d’étapes gratuites : ${n}`,
    piezaDesc: (p, n) => `${p} – ${n} : son histoire, sa signification et où la trouver. Texte gratuit de l’audioguide.`,
    abrir: 'Ouvrir l’audioguide',
    precio: (p) => `Accès complet de 30 jours pour ${p}, sans abonnement. Le billet d’entrée du site n’est pas inclus. `,
    gratis: (c) => `${c} à écouter gratuitement, sans inscription.`,
    sobre: (aire) => (aire ? 'À propos du site' : 'À propos du musée'),
    queVer: (n, art, ruta) => `Que voir : ${ruta}`,
    queVerSub: (c, d) => `${c}${d ? ` en environ ${d}` : ''}, dans l’ordre de la marche.`,
    recorridos: 'Parcours',
    recorridosSub: () => 'Choisissez-en un selon le temps dont vous disposez. L’audioguide vous mène étape par étape.',
    lugares: (aire) => (aire ? 'Zones' : 'Salles'),
    antes: 'Avant de partir',
    otras: 'Autres guides',
    cerca: 'À proximité',
    pie: 'audioguides sur votre téléphone pour les musées et sites archéologiques du Mexique. Ils fonctionnent hors ligne une fois téléchargés.',
  },
  pl: {
    titulo: (n) => `${n}: audioprzewodnik i zwiedzanie`,
    tituloCorto: (n) => `${n}: audioprzewodnik`,
    h1: (n) => `${n}: audioprzewodnik na Twoją wizytę`,
    desc: (n, cuantas, rango, gratis) => `${n}: co zobaczyć i jak dojechać. Audioprzewodnik w telefonie, ${cuantas} objaśnionych${rango ? `, trasy od ${rango}` : ''}${gratis ? `, ${gratis} za darmo na próbę` : ''} i działanie bez internetu.`,
    pronto: 'Wkrótce: ten audioprzewodnik będzie dostępny już niedługo.',
    gratisTitulo: (aire) => (aire ? 'Przystanki do wypróbowania za darmo' : 'Dzieła do wypróbowania za darmo'),
    piezaTitulo: (p, n) => `${p}: historia i lokalizacja (${n})`,
    piezaTituloCorto: (p) => `${p}: historia i lokalizacja`,
    ubic: (sala, n) => `Lokalizacja: ${sala ? `${sala}, ` : ''}${n}.`,
    piezaCta: (n) => `Posłuchaj pełnego audioprzewodnika: ${n}`,
    volver: (n) => `Zobacz przewodnik: ${n}`,
    pzUbic: 'Lokalizacja',
    pzTexto: 'Co mówi audioprzewodnik',
    pzMas: (n) => `Więcej bezpłatnych przystanków: ${n}`,
    piezaDesc: (p, n) => `${p} – ${n}: historia, znaczenie i miejsce, gdzie ją znaleźć. Bezpłatny tekst z audioprzewodnika.`,
    abrir: 'Otwórz audioprzewodnik',
    precio: (p) => `Pełny dostęp na 30 dni za ${p}, bez subskrypcji. Bilet wstępu na miejsce nie jest wliczony. `,
    gratis: (c) => `${c} do posłuchania za darmo, bez rejestracji.`,
    sobre: (aire) => (aire ? 'O stanowisku' : 'O muzeum'),
    queVer: (n, art, ruta) => `Co zobaczyć: ${ruta}`,
    queVerSub: (c, d) => `${c}${d ? `, około ${d}` : ''}, w kolejności zwiedzania.`,
    recorridos: 'Trasy',
    recorridosSub: () => 'Wybierz trasę na tyle czasu, ile masz. Audioprzewodnik prowadzi Cię przystanek po przystanku.',
    lugares: (aire) => (aire ? 'Strefy' : 'Sale'),
    antes: 'Przed wizytą',
    otras: 'Inne przewodniki',
    cerca: 'W pobliżu',
    pie: 'audioprzewodniki w telefonie po muzeach i stanowiskach archeologicznych Meksyku. Po pobraniu działają bez internetu.',
  },
  de: {
    titulo: (n) => `${n}: Audioguide und Rundgang`,
    tituloCorto: (n) => `${n}: Audioguide`,
    h1: (n) => `${n}: Audioguide für deinen Besuch`,
    desc: (n, cuantas, rango, gratis) => `${n}: Sehenswertes und Anreise. Audioguide auf dem Handy, ${cuantas} erklärt${rango ? `, Touren von ${rango}` : ''}${gratis ? `, ${gratis} gratis zum Ausprobieren` : ''}, auch offline nutzbar.`,
    pronto: 'Demnächst: Dieser Audioguide ist bald verfügbar.',
    gratisTitulo: (aire) => (aire ? 'Gratis-Stopps zum Ausprobieren' : 'Gratis-Werke zum Ausprobieren'),
    piezaTitulo: (p, n) => `${p}: Geschichte und Standort (${n})`,
    piezaTituloCorto: (p) => `${p}: Geschichte und Standort`,
    ubic: (sala, n) => `Standort: ${sala ? `${sala}, ` : ''}${n}.`,
    piezaCta: (n) => `Hör dir den vollständigen Audioguide an: ${n}`,
    volver: (n) => `Zum Führer: ${n}`,
    pzUbic: 'Standort',
    pzTexto: 'Was der Audioguide erzählt',
    pzMas: (n) => `Weitere kostenlose Stationen: ${n}`,
    piezaDesc: (p, n) => `${p} – ${n}: Geschichte, Bedeutung und Fundort. Kostenloser Text aus dem Audioguide.`,
    abrir: 'Audioguide öffnen',
    precio: (p) => `30 Tage Vollzugang für ${p}, ohne Abo. Der Eintritt zur Stätte ist nicht enthalten. `,
    gratis: (c) => `${c} zum kostenlosen Anhören, ohne Anmeldung.`,
    sobre: (aire) => (aire ? 'Über den Ort' : 'Über das Museum'),
    queVer: (n, art, ruta) => `Was es zu sehen gibt: ${ruta}`,
    queVerSub: (c, d) => `${c}${d ? `, etwa ${d}` : ''}, in der Reihenfolge des Rundgangs.`,
    recorridos: 'Touren',
    recorridosSub: () => 'Wähle eine Tour passend zu deiner Zeit. Der Audioguide führt dich Stopp für Stopp.',
    lugares: (aire) => (aire ? 'Bereiche' : 'Säle'),
    antes: 'Vor dem Besuch',
    otras: 'Weitere Führer',
    cerca: 'In der Nähe',
    pie: 'Audioguides auf dem Handy für Museen und archäologische Stätten in Mexiko. Nach dem Download funktionieren sie offline.',
  },
  pt: {
    titulo: (n) => `${n}: audioguia e o que ver`,
    tituloCorto: (n) => `${n}: audioguia`,
    h1: (n) => `${n}: audioguia para a sua visita`,
    desc: (n, cuantas, rango, gratis) => `${n}: o que ver e como chegar. Audioguia no celular com ${cuantas} explicadas${rango ? `, roteiros de ${rango}` : ''}${gratis ? `, ${gratis} grátis para testar` : ''} e uso sem internet.`,
    pronto: 'Em breve: este audioguia estará disponível em pouco tempo.',
    gratisTitulo: (aire) => (aire ? 'Paradas grátis para testar' : 'Obras grátis para testar'),
    piezaTitulo: (p, n) => `${p}: história e localização (${n})`,
    piezaTituloCorto: (p) => `${p}: história e localização`,
    ubic: (sala, n) => `Localização: ${sala ? `${sala}, ` : ''}${n}.`,
    piezaCta: (n) => `Ouça o audioguia completo de ${n}`,
    volver: (n) => `Ver o guia: ${n}`,
    pzUbic: 'Localização',
    pzTexto: 'O que a audioguia conta',
    pzMas: (n) => `Mais paradas grátis em ${n}`,
    piezaDesc: (p, n) => `${p} em ${n}: sua história, o que significa e onde encontrá-la. Texto gratuito do audioguia.`,
    abrir: 'Abrir o audioguia',
    precio: (p) => `Acesso completo por 30 dias por ${p}, sem assinatura. O ingresso do local não está incluído. `,
    gratis: (c) => `${c} para ouvir de graça, sem cadastro.`,
    sobre: (aire) => (aire ? 'Sobre o local' : 'Sobre o museu'),
    queVer: (n, art, ruta) => `O que ver: ${ruta}`,
    queVerSub: (c, d) => `${c}${d ? ` em cerca de ${d}` : ''}, na ordem em que se caminha.`,
    recorridos: 'Roteiros',
    recorridosSub: () => 'Escolha um conforme o tempo que você tem. O audioguia leva você parada por parada.',
    lugares: (aire) => (aire ? 'Zonas' : 'Salas'),
    antes: 'Antes de ir',
    otras: 'Outros guias',
    cerca: 'Perto daqui',
    pie: 'audioguias no celular para museus e sítios arqueológicos do México. Funcionam sem internet depois de baixados.',
  },
  it: {
    titulo: (n) => `${n}: audioguida e cosa vedere`,
    tituloCorto: (n) => `${n}: audioguida`,
    h1: (n) => `${n}: l’audioguida per la tua visita`,
    desc: (n, cuantas, rango, gratis) => `${n}: cosa vedere e come arrivare. Audioguida sul tuo cellulare con ${cuantas} spiegate${rango ? `, percorsi da ${rango}` : ''}${gratis ? `, ${gratis} gratis da provare` : ''} e uso senza internet.`,
    pronto: 'Prossimamente: questa audioguida sarà disponibile a breve.',
    gratisTitulo: (aire) => (aire ? 'Tappe gratuite da provare' : 'Opere gratuite da provare'),
    piezaTitulo: (p, n) => `${p}: storia e posizione (${n})`,
    piezaTituloCorto: (p) => `${p}: storia e posizione`,
    ubic: (sala, n) => `Posizione: ${sala ? `${sala}, ` : ''}${n}.`,
    piezaCta: (n) => `Ascolta l’audioguida completa di ${n}`,
    volver: (n) => `Vai alla guida: ${n}`,
    pzUbic: 'Dove si trova',
    pzTexto: 'Cosa racconta l’audioguida',
    pzMas: (n) => `Altre tappe gratuite: ${n}`,
    piezaDesc: (p, n) => `${p} – ${n}: la sua storia, cosa significa e dove trovarla. Testo gratuito dell’audioguida.`,
    abrir: 'Apri l’audioguida',
    precio: (p) => `Accesso completo di 30 giorni a ${p}, senza abbonamento. Il biglietto d’ingresso al sito non è incluso. `,
    gratis: (c) => `${c} da ascoltare gratis, senza registrazione.`,
    sobre: (aire) => (aire ? 'Sul luogo' : 'Sul museo'),
    queVer: (n, art, ruta) => `Cosa vedere: ${ruta}`,
    queVerSub: (c, d) => `${c}${d ? ` in circa ${d}` : ''}, nell’ordine in cui si cammina.`,
    recorridos: 'Percorsi',
    recorridosSub: () => 'Scegline uno in base al tempo che hai. L’audioguida ti accompagna tappa dopo tappa.',
    lugares: (aire) => (aire ? 'Zone' : 'Sale'),
    antes: 'Prima di andare',
    otras: 'Altre guide',
    cerca: 'Nelle vicinanze',
    pie: 'audioguide sul cellulare per musei e siti archeologici del Messico. Funzionano senza internet una volta scaricate.',
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


/** Botón «Escuchar 30 s»: nunca arranca solo; la persona lo toca. */
const MUESTRA = {
  es: ['▶ Escuchar 30 s', '⏸ Pausar'],
  en: ['▶ Listen for 30 s', '⏸ Pause'],
  fr: ['▶ Écouter 30 s', '⏸ Pause'],
  pl: ['▶ Posłuchaj 30 s', '⏸ Pauza'],
  de: ['▶ 30 Sek. anhören', '⏸ Pause'],
  pt: ['▶ Ouvir 30 s', '⏸ Pausar'],
  it: ['▶ Ascolta 30 s', '⏸ Pausa'],
};
// Piezas cuyo clip se llama distinto (los primeros clips se cortaron con el nombre corto)
const CLIP_ALIAS = { mna_s06_piedra_sol: 'piedra_sol' };

/** Dirección del clip de 30 s de una pieza en un idioma, si existe. `existe(ruta)` dice si el archivo está publicado. */
export function clipDe(existe, pieceId, lang) {
  for (const base of [pieceId, CLIP_ALIAS[pieceId]].filter(Boolean)) {
    const ruta = `/audio/muestras/${base}_${lang}.mp3`;
    if (existe(ruta)) return ruta;
  }
  return '';
}

/** Dirección del servidor de cobro (donde se cuentan los toques del botón). La pone el script de compilación; vacía = no se mide. */
export const ajustes = { api: '' };

/** `medir` = { sitio, pieza }: de dónde es el clip, para contar los toques (anónimos, solo un contador). */
export function botonMuestra(lang, src, medir = {}) {
  if (!src) return '';
  const [jugar, pausar] = MUESTRA[lang] || MUESTRA.es;
  const dato = (k, v) => (v ? ` data-${k}="${esc(v)}"` : '');
  const medicion = ajustes.api ? `${dato('api', ajustes.api.replace(/\/$/, ''))}${dato('site', String(medir.sitio || '').toLowerCase())}${dato('piece', medir.pieza)}${dato('lang', lang)}` : '';
  return `<p class="muestra"><button type="button" class="muestra-btn" data-src="${esc(src)}" data-play="${esc(jugar)}" data-pause="${esc(pausar)}"${medicion} aria-pressed="false">${esc(jugar)}</button></p>`;
}

/** Dirección de un sitio (y de una pieza) dentro de la app. */
export const enApp = (sitioId, lang, piezaId = '') => `/sitio/${encodeURIComponent(String(sitioId).toLowerCase())}${piezaId ? `/${encodeURIComponent(piezaId)}` : ''}?idioma=${lang}`;

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
.muestra{margin:1.25rem 0 0}
.muestra-btn{display:inline-block;cursor:pointer;background:transparent;color:var(--acento);border:2px solid var(--acento);font:700 1rem system-ui,sans-serif;padding:.65rem 1.25rem;border-radius:999px}
.muestra-btn[aria-pressed=true]{background:var(--acento);color:#fff}
ul.otras{list-style:none;padding:0}
footer{margin-top:3rem;padding-top:1.5rem;border-top:1px solid var(--linea);font:.9375rem system-ui,sans-serif;color:var(--ink2)}
</style>`;

/** Cascarón común de todas las páginas: cabecera, datos para Google, estilos y pie. */
function plantilla({ lang, titulo, descripcion, url, hreflang, portada, jsonld, selector, cuerpo, pie, muestra = false }) {
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
<meta property="og:site_name" content="Xolotli">
<meta property="og:locale" content="${OG_LOCALE[lang]}">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${DOMINIO}/og/${ogNombre(url)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(titulo)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${DOMINIO}/og/${ogNombre(url)}">
<meta name="theme-color" content="#FBF6EE">
<link rel="icon" type="image/svg+xml" href="/icon.svg">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
${ESTILOS}
<script type="application/ld+json">${jsonld}</script>
</head>
<body>
<div class="envoltura">
<header class="marca"><a href="/">Xolotli</a>${selector}</header>
<main>
${cuerpo}
</main>
<footer data-nosnippet><p><a href="/">Xolotli</a>: ${esc(pie)}</p></footer>
</div>
${muestra ? '<script src="/guias-muestra.js" defer></script>\n' : ''}</body>
</html>
`;
}

/**
 * Arma el HTML de la página de un sitio en un idioma.
 * datos: { sitio, manifiesto, salas, piezas, cfg (de PAGINAS), lang, idiomas (los que sí salen), otras: [{ nombre, url }], portada }
 */
export function armarPagina({ sitio, manifiesto = {}, salas = [], piezas = [], cfg, lang = 'es', idiomas = [lang], otras = [], cerca = [], portada = '', portadaSrcset = '', gratisEnlaces = [], muestra = '', muestraPieza = '' }) {
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
  const rango = minutos.length ? `${duracion(Math.min(...minutos))}${Math.min(...minutos) === Math.max(...minutos) ? '' : lang === 'es' ? ` a ${duracion(Math.max(...minutos))}` : lang === 'pl' ? ` do ${duracion(Math.max(...minutos))}` : lang === 'fr' ? ` à ${duracion(Math.max(...minutos))}` : lang === 'de' ? ` bis ${duracion(Math.max(...minutos))}` : (lang === 'pt' || lang === 'it') ? ` a ${duracion(Math.max(...minutos))}` : ` to ${duracion(Math.max(...minutos))}`}` : '';
  const precio = moneda(lang, sitio, manifiesto);
  const abrir = enApp(sitio.id, lang);

  const sinPar = String(nombre).replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  const titulo = elegirCompleta([t.titulo(nombre), t.titulo(sinPar), t.tituloCorto(nombre), t.tituloCorto(sinPar)], 60);
  const nPiezas = contar(lang, piezas.length, aireLibre);
  const nGratis = gratis.length && !cfg.proximamente ? contar(lang, gratis.length, aireLibre) : '';
  const descripcion = elegirCompleta([t.desc(nombre, nPiezas, rango, nGratis), t.desc(nombre, nPiezas, '', nGratis), t.desc(nombre, nPiezas, rango, ''), t.desc(nombre, nPiezas, '', '')]);

  const alternativas = idiomas.map((l) => ({ l, href: `${DOMINIO}${direccion(cfg.slugs[l], l)}` }));
  const hreflang = [...alternativas.map((a) => `<link rel="alternate" hreflang="${a.l}" href="${a.href}">`), `<link rel="alternate" hreflang="x-default" href="${alternativas.find((a) => a.l === 'es')?.href || url}">`].join('\n');
  const selector = idiomas.length > 1 ? `<nav class="idiomas" data-nosnippet aria-label="Idioma">${alternativas.map((a) => (a.l === lang ? `<span aria-current="true">${a.l.toUpperCase()}</span>` : `<a href="${a.href}" hreflang="${a.l}" lang="${a.l}">${a.l.toUpperCase()}</a>`)).join(' ')}</nav>` : '';

  const lugar = {
    '@type': aireLibre ? ['TouristAttraction'] : ['Museum', 'TouristAttraction'],
    '@id': `${url}#lugar`,
    name: nombre,
    ...(lead ? { description: lead } : {}),
    url,
    ...(direccionPostal(loc(sitio, 'location') || sitio.location) ? { address: direccionPostal(loc(sitio, 'location') || sitio.location) } : {}),
    ...(portada ? { image: `${DOMINIO}${portada}` } : {}),
  };
  // Precio del pase (para buscadores y asistentes de IA): solo cuando el sitio ya se vende
  const mxnN = Number(sitio.pass_price_mxn ?? manifiesto.pass_price_mxn) || 0;
  const usdN = Number(sitio.pass_price_usd ?? manifiesto.pass_price_usd) || 0;
  const ofertas = [mxnN ? ofertaDigital(mxnN, 'MXN', url, lang) : null, usdN ? ofertaDigital(usdN, 'USD', url, lang) : null].filter(Boolean);
  const producto = !cfg.proximamente && ofertas.length
    ? [{ '@type': 'Product', '@id': `${url}#audioguia`, name: titulo, description: descripcion, brand: { '@type': 'Brand', name: 'Xolo' }, ...(portada ? { image: `${DOMINIO}${portada}` } : {}), offers: ofertas }]
    : [];
  const preguntas = cfg.proximamente ? [] : faqDeGuia({ lang, nombre, precioTexto: precio ? t.precio(precio) : '', nGratis, idiomas });
  const grafo = [
    lugar,
    ...producto,
    ...(preguntas.length ? [{ '@type': 'FAQPage', '@id': `${url}#preguntas`, inLanguage: lang, mainEntity: preguntas.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] : []),
    {
      '@type': 'WebPage',
      '@id': url,
      url,
      name: titulo,
      description: descripcion,
      inLanguage: lang,
      about: { '@id': `${url}#lugar` },
      isPartOf: { '@type': 'WebSite', name: 'Xolotli', url: `${DOMINIO}/` },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Xolotli', item: `${DOMINIO}/` },
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
    ? `<div data-nosnippet><h2>${esc(t.otras)}</h2>\n<ul class="otras">${otras.map((o) => `<li><a href="${esc(o.url)}">${esc(o.nombre)}</a></li>`).join('')}</ul></div>`
    : '';

  const cuerpo = `<h1>${esc(t.h1(nombre))}</h1>
${lead ? `<p class="lead">${esc(lead)}</p>` : ''}
${botonMuestra(lang, muestra, { sitio: sitio.id, pieza: muestraPieza })}
${portada ? `<img class="portada" src="${esc(portada)}"${portadaSrcset ? ` srcset="${esc(portadaSrcset)}" sizes="(min-width: 42rem) 632px, calc(100vw - 2.5rem)"` : ''} alt="${esc(nombre)}" width="1200" height="800" fetchpriority="high">` : ''}
${cta()}
${intro ? `<h2>${esc(t.sobre(aireLibre))}</h2>\n${textoEnHtml(intro)}` : ''}
${principal ? `<h2>${esc(t.queVer(nombre, lang === 'es' ? cfg.articulo : '', principal.nombreL))}</h2>\n<p>${esc(t.queVerSub(contar(lang, principal.stops.length, aireLibre), duracion(minutosDe(principal))))}</p>\n<ol>\n${queVer}\n</ol>` : ''}
${rutas.length ? `<h2>${esc(t.recorridos)}</h2>\n<p>${esc(t.recorridosSub(aireLibre))}</p>\n<ul>\n${listaRutas}\n</ul>` : ''}
${listaSalas ? `<h2>${esc(t.lugares(aireLibre))}</h2>\n<ul>\n${listaSalas}\n</ul>` : ''}
${antes.length ? `<h2>${esc(t.antes)}</h2>\n${bloqueAntes}` : ''}
${gratisEnlaces.length ? `<h2>${esc(t.gratisTitulo(aireLibre))}</h2>\n<ul>${gratisEnlaces.map((g) => `<li><a href="${esc(g.url)}">${esc(g.titulo)}</a></li>`).join('')}</ul>` : ''}
${cta()}
${preguntas.length ? `<h2>${esc(tituloFaq(lang, nombre))}</h2>\n<dl class="faq">${preguntas.map(([q, a]) => `<dt><strong>${esc(q)}</strong></dt><dd>${esc(a)}</dd>`).join('')}</dl>` : ''}
${cerca.length ? `<h2>${esc(t.cerca)}</h2>\n<ul>${cerca.map((o) => `<li><a href="${esc(o.url)}">${esc(o.nombre)}</a></li>`).join('')}</ul>` : ''}
${enlacesOtras}`;
  const html = plantilla({ lang, titulo, descripcion, url, hreflang, portada, jsonld, selector, cuerpo, pie: t.pie, muestra: !!muestra });
  return { html, url, titulo, descripcion };
}


// ───────────── Preguntas frecuentes de cada guía (solo lo que es cierto para todos los sitios) ─────────────
const FAQ = {
  es: {
    h: (n) => `Preguntas frecuentes sobre la audioguía de ${n}`,
    q: ['¿Cómo funciona?', '¿Necesito internet?', '¿Cuánto cuesta?', '¿En qué idiomas está?', '¿Puedo probarla gratis?', '¿Se puede usar en más de un teléfono?'],
    a: {
      como: (n) => `Abres Xolotli en el navegador de tu celular, eliges ${n} y escuchas cada parada mientras recorres el lugar. No tienes que instalar nada desde una tienda de apps.`,
      red: 'Durante el recorrido no: descargas la guía antes de entrar (necesitas conexión una vez) y después se escucha sin señal.',
      idiomas: (l) => `Disponible en: ${l}.`,
      prueba: (g) => `Sí: ${g} se pueden escuchar sin pagar.`,
      tel: 'Sí, el acceso completo funciona en hasta 2 teléfonos.',
    },
  },
  en: {
    h: (n) => `Frequently asked questions about the ${n} audio guide`,
    q: ['How does it work?', 'Do I need internet?', 'How much does it cost?', 'Which languages is it in?', 'Can I try it for free?', 'Can I use it on more than one phone?'],
    a: {
      como: (n) => `You open Xolotli in your phone’s browser, pick ${n} and listen to each stop as you walk around. There is nothing to install from an app store.`,
      red: 'Not during the visit: you download the guide before you go in (you need a connection once) and then it plays without signal.',
      idiomas: (l) => `Available in: ${l}.`,
      prueba: (g) => `Yes: ${g} can be listened to without paying.`,
      tel: 'Yes, the full access works on up to 2 phones.',
    },
  },
  fr: {
    h: (n) => `Questions fréquentes sur l’audioguide de ${n}`,
    q: ['Comment ça marche ?', 'Faut-il une connexion internet ?', 'Combien ça coûte ?', 'Dans quelles langues ?', 'Puis-je l’essayer gratuitement ?', 'Puis-je l’utiliser sur plusieurs téléphones ?'],
    a: {
      como: (n) => `Vous ouvrez Xolotli dans le navigateur de votre téléphone, choisissez ${n} et écoutez chaque étape pendant la visite. Rien à installer depuis une boutique d’applications.`,
      red: 'Pas pendant la visite : vous téléchargez le guide avant d’entrer (une connexion est nécessaire une fois), puis il s’écoute sans réseau.',
      idiomas: (l) => `Disponible en : ${l}.`,
      prueba: (g) => `Oui : ${g} peuvent être écoutés sans payer.`,
      tel: 'Oui, l’accès complet fonctionne sur 2 téléphones maximum.',
    },
  },
  pl: {
    h: (n) => `Najczęstsze pytania o audioprzewodnik: ${n}`,
    q: ['Jak to działa?', 'Czy potrzebuję internetu?', 'Ile to kosztuje?', 'W jakich językach jest dostępny?', 'Czy mogę wypróbować za darmo?', 'Czy mogę używać go na więcej niż jednym telefonie?'],
    a: {
      como: (n) => `Otwierasz Xolotli w przeglądarce telefonu, wybierasz ${n} i słuchasz każdego przystanku podczas zwiedzania. Nie trzeba nic instalować ze sklepu z aplikacjami.`,
      red: 'Nie w trakcie zwiedzania: pobierasz przewodnik przed wejściem (raz potrzebne jest połączenie), a potem działa bez zasięgu.',
      idiomas: (l) => `Dostępny w językach: ${l}.`,
      prueba: (g) => `Tak: ${g} można odsłuchać bez płacenia.`,
      tel: 'Tak, pełny dostęp działa na maksymalnie 2 telefonach.',
    },
  },
  de: {
    h: (n) => `Häufige Fragen zum Audioguide ${n}`,
    q: ['Wie funktioniert er?', 'Brauche ich Internet?', 'Was kostet er?', 'In welchen Sprachen gibt es ihn?', 'Kann ich ihn kostenlos testen?', 'Kann ich ihn auf mehreren Handys nutzen?'],
    a: {
      como: (n) => `Du öffnest Xolotli im Browser deines Handys, wählst ${n} und hörst jede Station beim Rundgang. Du musst nichts aus einem App-Store installieren.`,
      red: 'Nicht während des Besuchs: Du lädst den Guide vor dem Eintritt herunter (einmal ist eine Verbindung nötig) und hörst ihn danach ohne Empfang.',
      idiomas: (l) => `Verfügbar auf: ${l}.`,
      prueba: (g) => `Ja: ${g} kannst du ohne Bezahlung anhören.`,
      tel: 'Ja, der Vollzugang funktioniert auf bis zu 2 Handys.',
    },
  },
  pt: {
    h: (n) => `Perguntas frequentes sobre o audioguia de ${n}`,
    q: ['Como funciona?', 'Preciso de internet?', 'Quanto custa?', 'Em quais idiomas está?', 'Posso experimentar de graça?', 'Posso usar em mais de um celular?'],
    a: {
      como: (n) => `Você abre o Xolotli no navegador do celular, escolhe ${n} e ouve cada parada enquanto percorre o local. Não é preciso instalar nada de uma loja de aplicativos.`,
      red: 'Durante a visita, não: você baixa o guia antes de entrar (é preciso conexão uma vez) e depois ele toca sem sinal.',
      idiomas: (l) => `Disponível em: ${l}.`,
      prueba: (g) => `Sim: ${g} podem ser ouvidas sem pagar.`,
      tel: 'Sim, o acesso completo funciona em até 2 celulares.',
    },
  },
  it: {
    h: (n) => `Domande frequenti sull’audioguida di ${n}`,
    q: ['Come funziona?', 'Serve internet?', 'Quanto costa?', 'In quali lingue è disponibile?', 'Posso provarla gratis?', 'Posso usarla su più di un telefono?'],
    a: {
      como: (n) => `Apri Xolotli nel browser del telefono, scegli ${n} e ascolti ogni tappa mentre visiti il luogo. Non serve installare nulla da uno store di app.`,
      red: 'Non durante la visita: scarichi la guida prima di entrare (serve una connessione una volta) e poi si ascolta senza rete.',
      idiomas: (l) => `Disponibile in: ${l}.`,
      prueba: (g) => `Sì: ${g} si possono ascoltare senza pagare.`,
      tel: 'Sì, l’accesso completo funziona su 2 telefoni al massimo.',
    },
  },
};

/** Preguntas y respuestas de una guía: [[pregunta, respuesta]]. Solo afirma lo que vale para todos los sitios (cómo funciona, sin internet, precio, idiomas, prueba, teléfonos). */
export function faqDeGuia({ lang, nombre, precioTexto = '', nGratis = '', idiomas = [lang] }) {
  const f = FAQ[lang];
  if (!f) return [];
  const r = f.a;
  const costo = [precioTexto ? precioTexto.trim() : '', PROMO_GRATIS ? PORTADA[lang].gratis : ''].filter(Boolean).join(' ');
  return [
    [f.q[0], r.como(nombre)],
    [f.q[1], r.red],
    costo ? [f.q[2], costo] : null,
    [f.q[3], r.idiomas(idiomas.map((l) => ETIQUETAS_IDIOMA[l] || l).join(', '))],
    nGratis ? [f.q[4], r.prueba(nGratis)] : null,
    [f.q[5], r.tel],
  ].filter(Boolean);
}
export const tituloFaq = (lang, nombre) => FAQ[lang].h(nombre);

/** sitemap.xml: la portada y cada página de guía, con sus versiones en otros idiomas. */
// Sin <lastmod>: el contenido viene de las hojas y cada compilación daría la fecha de hoy a todo. Google pide que esa fecha
// sea la del último cambio real; si no se puede saber, es mejor no ponerla.
export function armarSitemap(paginas) {
  const alt = (grupo) =>
    grupo.length > 1
      ? grupo.map((g) => `\n    <xhtml:link rel="alternate" hreflang="${g.lang}" href="${esc(g.url)}"/>`).join('') +
        `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${esc((grupo.find((g) => g.lang === 'es') || grupo[0]).url)}"/>`
      : '';
  const items = paginas.some((g) => g.some((x) => x.url === `${DOMINIO}/`)) ? [] : [`  <url><loc>${DOMINIO}/</loc></url>`];
  for (const grupo of paginas) {
    for (const g of grupo) items.push(`  <url><loc>${esc(g.url)}</loc>${alt(grupo)}\n  </url>`);
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
export function armarPiezaPagina({ sitio, manifiesto = {}, cfg, pieza, sala = null, lang = 'es', idiomas = [lang], portada = '', portadaSrcset = '', muestra = '', hermanas = [] }) {
  const t = T[lang];
  const nombre = (lang === 'es' ? sitio.name : sitio[`name_${lang}`] || cfg.nombres?.[lang]) || sitio.name;
  const nombrePieza = tituloDePieza(pieza, lang);
  const url = `${DOMINIO}${direccionPieza(cfg, pieza, lang)}`;
  const urlSitio = `${DOMINIO}${direccion(cfg.slugs[lang], lang)}`;
  const loc = (obj, campo) => (lang === 'es' ? obj?.[campo] : obj?.[`${campo}_${lang}`]);
  const nombreSala = sala ? String((lang === 'es' ? sala.nombre_oficial : sala[`nombre_oficial_${lang}`]) || '').trim() : '';
  const gancho = aDigitos(String(loc(pieza, 'frase_gancho') || '').trim(), lang);
  const texto = aDigitos(stripLinks(textoPieza(pieza, lang)), lang);
  const precio = moneda(lang, sitio, manifiesto);
  const abrir = enApp(sitio.id, lang, pieza.piece_id);

  const sitioCorto = String(nombre).replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  const titulo = elegirCompleta([t.piezaTitulo(nombrePieza, nombre), t.piezaTitulo(nombrePieza, sitioCorto), `${nombrePieza} | ${nombre}`, `${nombrePieza} | ${sitioCorto}`, t.piezaTituloCorto(nombrePieza), nombrePieza], 60);
  const descripcion = elegirCompleta([gancho ? `${gancho} ${t.piezaDesc(nombrePieza, nombre)}` : '', t.piezaDesc(nombrePieza, nombre)]);

  const alt = idiomas.map((l) => ({ l, href: `${DOMINIO}${direccionPieza(cfg, pieza, l)}` }));
  const hreflang = [...alt.map((a) => `<link rel="alternate" hreflang="${a.l}" href="${a.href}">`), `<link rel="alternate" hreflang="x-default" href="${alt.find((a) => a.l === 'es')?.href || url}">`].join('\n');
  const selector = idiomas.length > 1 ? `<nav class="idiomas" data-nosnippet aria-label="Idioma">${alt.map((a) => (a.l === lang ? `<span aria-current="true">${a.l.toUpperCase()}</span>` : `<a href="${a.href}" hreflang="${a.l}" lang="${a.l}">${a.l.toUpperCase()}</a>`)).join(' ')}</nav>` : '';

  const grafo = [
    {
      '@type': 'WebPage',
      '@id': url,
      url,
      name: titulo,
      description: descripcion,
      inLanguage: lang,
      ...(portada ? { primaryImageOfPage: { '@type': 'ImageObject', url: `${DOMINIO}${portada}` } } : {}),
      isPartOf: { '@type': 'WebSite', name: 'Xolotli', url: `${DOMINIO}/` },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Xolotli', item: `${DOMINIO}/` },
        { '@type': 'ListItem', position: 2, name: nombre, item: urlSitio },
        { '@type': 'ListItem', position: 3, name: nombrePieza, item: url },
      ],
    },
  ];
  const jsonld = JSON.stringify({ '@context': 'https://schema.org', '@graph': grafo }).replace(/</g, '\\u003c');

  const cta = `<p class="cta"><a class="boton" href="${esc(abrir)}">${esc(t.piezaCta(nombre))}</a></p>
<p class="nota">${precio ? esc(t.precio(precio)) : ''}</p>`;

  const otrasParadas = hermanas.length ? `<ul>${hermanas.map((h) => `<li><a href="${esc(h.url)}">${esc(h.titulo)}</a></li>`).join('')}</ul>` : '';

  const cuerpo = `<p class="dato"><a href="${urlSitio}">${esc(nombre)}</a></p>
<h1>${esc(nombrePieza)}</h1>
${gancho ? `<p class="lead">${esc(gancho)}</p>` : ''}
${botonMuestra(lang, muestra, { sitio: sitio.id, pieza: pieza.piece_id })}
${portada ? `<img class="portada" src="${esc(portada)}"${portadaSrcset ? ` srcset="${esc(portadaSrcset)}" sizes="(min-width: 42rem) 632px, calc(100vw - 2.5rem)"` : ''} alt="${esc(nombrePieza)}" width="1200" height="800" fetchpriority="high">` : ''}
<p class="cta"><a class="boton" href="${esc(abrir)}">${esc(t.piezaCta(nombre))}</a></p>
<h2>${esc(t.pzUbic)}</h2>
<p class="dato">${esc(`${nombreSala ? `${nombreSala}, ` : ''}${nombre}.`)}</p>
<h2>${esc(t.pzTexto)}</h2>
${textoEnHtml(texto)}
${cta}
${otrasParadas ? `<h2>${esc(t.pzMas(nombre))}</h2>\n${otrasParadas}` : ''}
<p><a href="${urlSitio}">${esc(t.volver(nombre))}</a></p>`;

  const html = plantilla({ lang, titulo, descripcion, url, hreflang, portada, jsonld, selector, cuerpo, pie: t.pie, muestra: !!muestra });
  return { html, url, titulo, descripcion };
}


// ───────────────────────── Para asistentes de IA y para la canónica de /sitio/ ─────────────────────────

/**
 * llms.txt: un resumen del sitio para asistentes de IA (formato llmstxt.org). Solo lo que ya es público: nunca texto de pago.
 * sitios: [{ nombre, resumen, precio, paginas: { es: url, en: url… }, gratis: [{ titulo, url }] }]
 */
export function armarLlms(sitios) {
  const linea = (x) => {
    const otros = Object.entries(x.paginas).filter(([l]) => l !== 'es').map(([l, u]) => `[${l}](${u})`);
    const gratis = (x.gratis || []).map((g) => `[${g.titulo}](${g.url})`);
    return [
      `- [${x.nombre}](${x.paginas.es || Object.values(x.paginas)[0]})${x.resumen ? `: ${x.resumen}` : ''}${x.precio ? ` Acceso completo de 30 días: ${x.precio}.` : ''}`,
      otros.length ? `  - Otros idiomas: ${otros.join(' · ')}` : '',
      gratis.length ? `  - Texto gratuito de estas paradas: ${gratis.join(' · ')}` : '',
    ].filter(Boolean).join('\n');
  };
  return `# Xolotli

> Audioguías en el celular para museos y zonas arqueológicas de México (Ciudad de México, Teotihuacán, Chichén Itzá, Cuernavaca, Xochicalco, Chalcatzingo y más). Se escuchan frente a la obra, sin grupo, y funcionan sin internet una vez descargadas. Disponibles en español, inglés, francés, polaco, alemán, portugués e italiano. La marca de la app es Xolo; el sitio es xolotli.com.

Cada guía tiene una página pública con su descripción, recorridos, salas o zonas y las paradas que se pueden probar gratis. El texto completo de las demás paradas es de pago y no se publica en estas páginas.

## Guías por sitio

${sitios.map(linea).join('\n')}

## Cómo funciona

- Cada sitio se vende como acceso completo de 30 días, sin suscripción (la entrada al recinto no está incluida); también hay pases que juntan varios sitios.
- Cada sitio incluye paradas gratuitas para probar, sin registro.
- Los recorridos sugeridos (de menos de una hora a varias horas) llevan al visitante parada por parada.
- Sitemap: https://xolotli.com/sitemap.xml
`;
}

/** Mapa para la app: qué página de /guias/ es la oficial (canónica) de cada sitio y de cada parada gratis. Solo español. */
export function armarMapaGuias(hechas) {
  const sitios = {};
  const paradas = {};
  for (const h of hechas) {
    const id = String(h.id).toLowerCase();
    if (h.urlSitio) sitios[id] = h.urlSitio;
    for (const [pieceId, url] of Object.entries(h.paradas || {})) paradas[`${id}/${pieceId}`] = url;
  }
  return { v: 1, sitios, paradas };
}

// ───────────── Páginas agrupadas (hubs): «Zonas arqueológicas de México», «Qué ver en la Ciudad de México», «Qué ver en Morelos» ─────────────
// Reúnen los sitios que ya tienen página y llevan a cada uno. Solo salen los sitios disponibles en ese idioma.
const L = ['es', 'en', 'fr', 'pl', 'de', 'pt', 'it'];
const por = (o) => Object.fromEntries(L.map((l, i) => [l, o[i]]));

export const HUBS = {
  zonas: {
    sitios: ['TEOTIHUACAN', 'CHICHEN_ITZA', 'XOCHICALCO', 'CHALCATZINGO'],
    slugs: por(['zonas-arqueologicas-de-mexico', 'archaeological-sites-in-mexico', 'sites-archeologiques-du-mexique', 'stanowiska-archeologiczne-w-meksyku', 'archaeologische-staetten-in-mexiko', 'sitios-arqueologicos-do-mexico', 'siti-archeologici-del-messico']),
    h1: por(['Zonas arqueológicas de México', 'Archaeological sites in Mexico', 'Sites archéologiques du Mexique', 'Stanowiska archeologiczne w Meksyku', 'Archäologische Stätten in Mexiko', 'Sítios arqueológicos do México', 'Siti archeologici del Messico']),
    titulo: por(['Zonas arqueológicas de México: qué ver y audioguías', 'Archaeological sites in Mexico: what to see and audio guides', 'Sites archéologiques du Mexique : que voir et audioguides', 'Stanowiska archeologiczne w Meksyku: co zobaczyć', 'Archäologische Stätten in Mexiko: Tipps und Audioguides', 'Sítios arqueológicos do México: o que ver e audioguias', 'Siti archeologici del Messico: cosa vedere e audioguide']),
    lead: por([
      'Teotihuacán, Chichén Itzá, Xochicalco y Chalcatzingo: audioguías en tu celular, parada por parada y con uso sin internet.',
      'Teotihuacan, Chichén Itzá, Xochicalco and Chalcatzingo: audio guides on your phone, stop by stop and usable offline.',
      'Teotihuacan, Chichén Itzá, Xochicalco et Chalcatzingo : audioguides sur votre téléphone, étape par étape et utilisables hors ligne.',
      'Teotihuacán, Chichén Itzá, Xochicalco i Chalcatzingo: audioprzewodniki w telefonie, przystanek po przystanku, działające bez internetu.',
      'Teotihuacán, Chichén Itzá, Xochicalco und Chalcatzingo: Audioguides auf dem Handy, Station für Station und offline nutzbar.',
      'Teotihuacán, Chichén Itzá, Xochicalco e Chalcatzingo: audioguias no celular, parada por parada e com uso sem internet.',
      'Teotihuacán, Chichén Itzá, Xochicalco e Chalcatzingo: audioguide sul tuo cellulare, tappa per tappa e utilizzabili offline.',
    ]),
    intro: por([
      'Cada guía te lleva por la zona en el orden en que se camina, con recorridos de distinta duración para que elijas según tu tiempo. Cada página reúne además cómo llegar, horarios y consejos para tu visita.',
      'Each guide walks you through the site in the order you walk it, with tours of different lengths so you can choose by the time you have. Each page also gathers how to get there, opening hours and tips for your visit.',
      'Chaque guide vous accompagne sur le site dans l’ordre de la visite, avec des parcours de durées différentes pour choisir selon votre temps. Chaque page réunit aussi comment s’y rendre, les horaires et des conseils pour votre visite.',
      'Każdy przewodnik prowadzi po stanowisku w kolejności zwiedzania, a trasy o różnej długości pozwalają wybrać według czasu, którym dysponujesz. Na każdej stronie znajdziesz też, jak dojechać, godziny otwarcia i wskazówki.',
      'Jeder Guide führt dich in der Reihenfolge des Rundgangs über die Stätte, mit Touren unterschiedlicher Länge, damit du nach deiner Zeit wählen kannst. Auf jeder Seite findest du außerdem Anreise, Öffnungszeiten und Tipps für deinen Besuch.',
      'Cada guia leva você pelo sítio na ordem em que se caminha, com roteiros de durações diferentes para escolher conforme o seu tempo. Cada página também reúne como chegar, horários e dicas para a sua visita.',
      'Ogni guida ti accompagna nel sito nell’ordine in cui si cammina, con percorsi di durata diversa per scegliere in base al tempo che hai. Ogni pagina riunisce anche come arrivare, orari e consigli per la visita.',
    ]),
    editorial: por([
      "Las cuatro zonas son al aire libre, con poca sombra, y conviene llegar a la apertura: el aire es más fresco, hay menos gente y los tours llegan más tarde. Lleva agua, gorra y calzado cómodo.\n\nTeotihuacán está a unos 50 kilómetros de la Ciudad de México, entre una hora y hora y media de viaje. Su eje es la Calzada de los Muertos, con las pirámides del Sol y de la Luna y la Ciudadela, y la guía ofrece una ruta exprés y otra completa, de la Puerta 1 a la salida. Xochicalco y Chalcatzingo están en Morelos: la primera, una ciudad fortificada con la Pirámide de las Serpientes Emplumadas; la segunda, con las esculturas de piedra más antiguas que se conocen en el Altiplano Central. Chichén Itzá está en Yucatán, a unos 120 kilómetros de Mérida y entre dos horas y media y tres de Cancún, así que es un viaje aparte del centro del país; si puedes, duerme en Valladolid o en Pisté.\n\nLos domingos la entrada suele ser gratuita para personas mexicanas y extranjeras con residencia, pero las zonas se llenan. Los horarios y los precios cambian: confírmalos en la página oficial del INAH.",
      "All four sites are outdoors with little shade, and it pays to arrive at opening time: the air is cooler, there are fewer people and the tour groups arrive later. Bring water, a hat and comfortable shoes.\n\nTeotihuacan is about 50 kilometres from Mexico City, an hour to an hour and a half away. Its axis is the Avenue of the Dead, with the Pyramids of the Sun and the Moon and the Citadel, and the guide offers an express route and a complete one from Gate 1 to the exit. Xochicalco and Chalcatzingo are in Morelos: the first is a fortified city with the Pyramid of the Feathered Serpents; the second has the oldest stone sculptures known in the Central Highlands. Chichén Itzá is in Yucatán, about 120 kilometres from Mérida and two and a half to three hours from Cancún, so it is a trip of its own, separate from central Mexico; if you can, sleep in Valladolid or Pisté.\n\nOn Sundays admission is usually free for Mexican nationals and foreign residents, but the sites fill up. Opening hours and prices change: check them on the official INAH website.",
      "Les quatre sites sont en plein air, avec peu d’ombre, et il vaut mieux arriver à l’ouverture : l’air est plus frais, il y a moins de monde et les groupes arrivent plus tard. Prévoyez de l’eau, un chapeau et de bonnes chaussures.\n\nTeotihuacan se trouve à environ 50 kilomètres de Mexico, à une heure ou une heure et demie de trajet. Son axe est la Chaussée des Morts, avec les pyramides du Soleil et de la Lune et la Citadelle, et le guide propose un parcours express et un parcours complet de la Porte 1 à la sortie. Xochicalco et Chalcatzingo sont au Morelos : la première est une ville fortifiée avec la Pyramide des Serpents à plumes ; la seconde abrite les plus anciennes sculptures sur pierre connues du Haut Plateau central. Chichén Itzá est au Yucatán, à environ 120 kilomètres de Mérida et à deux heures et demie à trois heures de Cancún : c’est un voyage à part, distinct du centre du pays ; si vous le pouvez, dormez à Valladolid ou à Pisté.\n\nLe dimanche, l’entrée est généralement gratuite pour les Mexicains et les étrangers résidents, mais les sites se remplissent. Les horaires et les tarifs changent : vérifiez-les sur le site officiel de l’INAH.",
      "Wszystkie cztery stanowiska znajdują się pod gołym niebem i dają mało cienia, dlatego warto przyjść na otwarcie: powietrze jest chłodniejsze, ludzi mniej, a wycieczki przyjeżdżają później. Zabierz wodę, czapkę i wygodne buty.\n\nTeotihuacán leży około 50 kilometrów od miasta Meksyk, godzinę do półtorej godziny drogi. Jego osią jest Aleja Zmarłych z piramidami Słońca i Księżyca oraz Ciudadelą, a przewodnik oferuje trasę ekspresową i pełną, od Bramy 1 do wyjścia. Xochicalco i Chalcatzingo leżą w stanie Morelos: pierwsze to ufortyfikowane miasto z Piramidą Pierzastych Węży, drugie skrywa najstarsze znane rzeźby w kamieniu na Wyżynie Centralnej. Chichén Itzá znajduje się w Jukatanie, około 120 kilometrów od Méridy i dwie i pół do trzech godzin od Cancún, więc to osobna wyprawa, oddzielna od środkowego Meksyku; jeśli możesz, przenocuj w Valladolid lub Pisté.\n\nW niedziele wstęp jest zwykle bezpłatny dla Meksykanów i cudzoziemców z prawem pobytu, ale stanowiska się zapełniają. Godziny otwarcia i ceny się zmieniają: sprawdź je na oficjalnej stronie INAH.",
      "Alle vier Stätten liegen unter freiem Himmel mit wenig Schatten, und es lohnt sich, zur Öffnung zu kommen: Die Luft ist kühler, es sind weniger Menschen da und die Reisegruppen kommen später. Nimm Wasser, eine Kappe und bequeme Schuhe mit.\n\nTeotihuacán liegt etwa 50 Kilometer von Mexiko-Stadt entfernt, eine bis anderthalb Stunden Fahrt. Seine Achse ist die Straße der Toten mit den Pyramiden der Sonne und des Mondes und der Ciudadela, und der Guide bietet eine Express-Route und eine vollständige von Tor 1 bis zum Ausgang. Xochicalco und Chalcatzingo liegen in Morelos: Erstere ist eine befestigte Stadt mit der Pyramide der Gefiederten Schlangen, letztere birgt die ältesten bekannten Steinskulpturen des zentralen Hochlands. Chichén Itzá liegt in Yucatán, etwa 120 Kilometer von Mérida und zweieinhalb bis drei Stunden von Cancún entfernt, ist also eine eigene Reise abseits von Zentralmexiko; wenn möglich, übernachte in Valladolid oder Pisté.\n\nSonntags ist der Eintritt für Mexikaner und ansässige Ausländer meist frei, aber die Stätten füllen sich. Öffnungszeiten und Preise ändern sich: Prüfe sie auf der offiziellen Website des INAH.",
      "Os quatro sítios são ao ar livre, com pouca sombra, e vale chegar na abertura: o ar é mais fresco, há menos gente e os tours chegam mais tarde. Leve água, boné e calçado confortável.\n\nTeotihuacán fica a cerca de 50 quilômetros da Cidade do México, entre uma hora e uma hora e meia de viagem. Seu eixo é a Calçada dos Mortos, com as pirâmides do Sol e da Lua e a Cidadela, e o guia oferece um roteiro expresso e outro completo, da Porta 1 até a saída. Xochicalco e Chalcatzingo ficam em Morelos: a primeira, uma cidade fortificada com a Pirâmide das Serpentes Emplumadas; a segunda, com as esculturas de pedra mais antigas que se conhecem no Altiplano Central. Chichén Itzá fica em Yucatán, a cerca de 120 quilômetros de Mérida e entre duas horas e meia e três horas de Cancún, então é uma viagem à parte, separada do centro do país; se puder, durma em Valladolid ou em Pisté.\n\nAos domingos a entrada costuma ser gratuita para mexicanos e estrangeiros residentes, mas os sítios lotam. Horários e preços mudam: confirme-os na página oficial do INAH.",
      "Tutti e quattro i siti sono all’aperto, con poca ombra, ed è meglio arrivare all’apertura: l’aria è più fresca, c’è meno gente e i gruppi arrivano più tardi. Porta acqua, cappello e scarpe comode.\n\nTeotihuacán si trova a circa 50 chilometri da Città del Messico, a un’ora o un’ora e mezza di viaggio. Il suo asse è il Viale dei Morti, con le piramidi del Sole e della Luna e la Ciudadela, e la guida offre un percorso express e uno completo dalla Porta 1 all’uscita. Xochicalco e Chalcatzingo sono nel Morelos: la prima è una città fortificata con la Piramide dei Serpenti Piumati, la seconda custodisce le più antiche sculture in pietra note dell’Altopiano Centrale. Chichén Itzá si trova nello Yucatán, a circa 120 chilometri da Mérida e a due ore e mezza o tre da Cancún, quindi è un viaggio a parte, separato dal Messico centrale; se puoi, dormi a Valladolid o a Pisté.\n\nLa domenica l’ingresso è di solito gratuito per i messicani e gli stranieri residenti, ma i siti si riempiono. Orari e prezzi cambiano: controllali sul sito ufficiale dell’INAH.",
    ]),
  },
  cdmx: {
    sitios: ['MNA', 'CHAPULTEPEC', 'CENTRO_HISTORICO', 'TEMPLO_MAYOR_CATEDRAL', 'MUSEO_FRIDA_KAHLO', 'COYOACAN', 'BASILICA_GUADALUPE'],
    slugs: por(['que-ver-en-la-ciudad-de-mexico', 'what-to-see-in-mexico-city', 'que-voir-a-mexico', 'co-zobaczyc-w-miescie-meksyk', 'sehenswuerdigkeiten-mexiko-stadt', 'o-que-ver-na-cidade-do-mexico', 'cosa-vedere-a-citta-del-messico']),
    h1: por(['Qué ver en la Ciudad de México: museos y lugares con audioguía', 'What to see in Mexico City: museums and sites with audio guides', 'Que voir à Mexico : musées et lieux avec audioguide', 'Co zobaczyć w Mieście Meksyk: muzea i miejsca z audioprzewodnikiem', 'Sehenswürdigkeiten in Mexiko-Stadt: Museen und Orte mit Audioguide', 'O que ver na Cidade do México: museus e lugares com audioguia', 'Cosa vedere a Città del Messico: musei e luoghi con audioguida']),
    titulo: por(['Qué ver en la Ciudad de México: museos y centro histórico', 'What to see in Mexico City: museums and historic centre', 'Que voir à Mexico : musées, centre historique et plus', 'Co zobaczyć w Mieście Meksyk: muzea i centrum historyczne', 'Sehenswürdigkeiten in Mexiko-Stadt: Museen und Altstadt', 'O que ver na Cidade do México: museus e centro histórico', 'Cosa vedere a Città del Messico: musei e centro storico']),
    lead: por([
      'Museos, zonas históricas y lugares emblemáticos de la capital, con audioguías en tu celular, parada por parada y con uso sin internet.',
      'Museums, historic areas and emblematic places in the capital, with audio guides on your phone, stop by stop and usable offline.',
      'Musées, quartiers historiques et lieux emblématiques de la capitale, avec des audioguides sur votre téléphone, étape par étape et hors ligne.',
      'Muzea, historyczne dzielnice i symboliczne miejsca stolicy, z audioprzewodnikami w telefonie, przystanek po przystanku, bez internetu.',
      'Museen, historische Viertel und Wahrzeichen der Hauptstadt, mit Audioguides auf dem Handy, Station für Station und offline nutzbar.',
      'Museus, zonas históricas e lugares emblemáticos da capital, com audioguias no celular, parada por parada e com uso sem internet.',
      'Musei, zone storiche e luoghi simbolo della capitale, con audioguide sul tuo cellulare, tappa per tappa e utilizzabili offline.',
    ]),
    intro: por([
      'La Ciudad de México tiene muchos lugares que vale la pena escuchar con calma. Elige uno y la audioguía te lleva por él en el orden en que se camina; cada página reúne además cómo llegar, horarios y consejos.',
      'Mexico City has many places worth taking your time with. Pick one and the audio guide takes you through it in the order you walk it; each page also gathers how to get there, opening hours and tips.',
      'Mexico compte de nombreux lieux qui méritent qu’on prenne son temps. Choisissez-en un et l’audioguide vous y accompagne dans l’ordre de la visite ; chaque page réunit aussi comment s’y rendre, les horaires et des conseils.',
      'Miasto Meksyk ma wiele miejsc, które warto poznawać bez pośpiechu. Wybierz jedno, a audioprzewodnik poprowadzi cię po nim w kolejności zwiedzania; na każdej stronie znajdziesz też, jak dojechać, godziny otwarcia i wskazówki.',
      'Mexiko-Stadt hat viele Orte, die man in Ruhe erleben sollte. Such dir einen aus, und der Audioguide führt dich in der Reihenfolge des Rundgangs hindurch; auf jeder Seite findest du außerdem Anreise, Öffnungszeiten und Tipps.',
      'A Cidade do México tem muitos lugares que merecem ser vistos com calma. Escolha um e o audioguia leva você por ele na ordem em que se caminha; cada página também reúne como chegar, horários e dicas.',
      'Città del Messico ha molti luoghi che meritano di essere vissuti con calma. Scegline uno e l’audioguida ti accompagna nell’ordine in cui si cammina; ogni pagina riunisce anche come arrivare, orari e consigli.',
    ]),
    editorial: por([
      "Una forma sencilla de ordenar la ciudad es por zonas. El Museo Nacional de Antropología y el Castillo de Chapultepec están los dos en el Bosque de Chapultepec: el museo pide medio día para verlo bien y el castillo, entre una hora y media y tres horas. El Centro Histórico y el Templo Mayor con la Catedral son vecinos en el Zócalo; el Centro se camina en unos 11 kilómetros, desde menos de dos horas hasta dos días. En Coyoacán están el centro del barrio y la Casa Azul de Frida Kahlo, que solo vende boletos en línea y con hora de entrada. La Basílica de Guadalupe queda al norte; se llega en Metro por La Villa-Basílica (Línea 6).\n\nMuchos museos cierran los lunes: el Museo Nacional de Antropología, el Castillo de Chapultepec, el Museo del Templo Mayor y la Casa Azul. Ese día funcionan mejor la Basílica, que abre todos los días, y los recorridos por las calles del Centro Histórico y de Coyoacán.\n\nPara evitar filas, ve entre semana a la apertura; los domingos la entrada a varios museos es gratuita para personas mexicanas y extranjeras con residencia, pero se llenan, y el Castillo cierra al alcanzar su cupo. El 12 de diciembre la Basílica recibe a millones de peregrinos. Confirma horarios y precios antes de salir.",
      "A simple way to organise the city is by area. The National Museum of Anthropology and Chapultepec Castle are both in Chapultepec Park: the museum needs half a day to do well, and the castle between an hour and a half and three hours. The Historic Centre and the Templo Mayor with the Cathedral are neighbours around the Zócalo; the Centre is a walk of about 11 kilometres, anywhere from under two hours to two days. In Coyoacán you will find the heart of the neighbourhood and Frida Kahlo’s Casa Azul, which sells tickets online only, with an entry time. The Basilica of Guadalupe lies to the north; you get there by Metro to La Villa-Basílica (Line 6).\n\nMany museums close on Mondays: the National Museum of Anthropology, Chapultepec Castle, the Templo Mayor Museum and the Casa Azul. On that day the Basilica, which opens every day, and the street walks through the Historic Centre and Coyoacán work better.\n\nTo avoid queues, go on a weekday at opening time; on Sundays admission to several museums is free for Mexican nationals and foreign residents, but they fill up, and the Castle closes once it reaches its daily limit. On 12 December the Basilica receives millions of pilgrims. Check opening hours and prices before you set out.",
      "Une façon simple d’organiser la ville est de la prendre par quartiers. Le Musée national d’anthropologie et le château de Chapultepec se trouvent tous deux dans le bois de Chapultepec : le musée demande une demi-journée pour être bien vu, le château entre une heure et demie et trois heures. Le centre historique et le Templo Mayor avec la cathédrale sont voisins autour du Zócalo ; le centre se parcourt à pied sur environ 11 kilomètres, de moins de deux heures à deux jours. À Coyoacán se trouvent le cœur du quartier et la Casa Azul de Frida Kahlo, qui ne vend ses billets qu’en ligne, avec une heure d’entrée. La basilique de Guadalupe est au nord ; on s’y rend en métro jusqu’à La Villa-Basílica (ligne 6).\n\nBeaucoup de musées sont fermés le lundi : le Musée national d’anthropologie, le château de Chapultepec, le musée du Templo Mayor et la Casa Azul. Ce jour-là, la basilique, ouverte tous les jours, et les promenades dans les rues du centre historique et de Coyoacán conviennent mieux.\n\nPour éviter les files, venez en semaine à l’ouverture ; le dimanche, l’entrée de plusieurs musées est gratuite pour les Mexicains et les étrangers résidents, mais ils se remplissent, et le château ferme dès que sa jauge est atteinte. Le 12 décembre, la basilique accueille des millions de pèlerins. Vérifiez les horaires et les tarifs avant de partir.",
      "Prostym sposobem na uporządkowanie miasta jest podział na dzielnice. Narodowe Muzeum Antropologii i Zamek Chapultepec leżą oba w Lesie Chapultepec: muzeum wymaga pół dnia, by zobaczyć je dobrze, a zamek od półtorej do trzech godzin. Centrum Historyczne oraz Templo Mayor z Katedrą sąsiadują wokół Zócalo; Centrum to spacer na około 11 kilometrów, od niespełna dwóch godzin do dwóch dni. W Coyoacán znajdziesz serce dzielnicy oraz Casa Azul Fridy Kahlo, która sprzedaje bilety wyłącznie online, z godziną wejścia. Bazylika Guadalupe leży na północy; dojedziesz tam metrem do stacji La Villa-Basílica (linia 6).\n\nWiele muzeów jest w poniedziałki zamkniętych: Narodowe Muzeum Antropologii, Zamek Chapultepec, Muzeum Templo Mayor i Casa Azul. Tego dnia lepiej sprawdzą się Bazylika, otwarta codziennie, oraz spacery po ulicach Centrum Historycznego i Coyoacán.\n\nAby uniknąć kolejek, przyjdź w dzień powszedni na otwarcie; w niedziele wstęp do kilku muzeów jest bezpłatny dla Meksykanów i cudzoziemców z prawem pobytu, ale robi się tłoczno, a Zamek zamyka się po osiągnięciu limitu. 12 grudnia Bazylika przyjmuje miliony pielgrzymów. Sprawdź godziny otwarcia i ceny przed wyjściem.",
      "Eine einfache Art, die Stadt zu ordnen, ist die Einteilung nach Vierteln. Das Nationale Anthropologiemuseum und das Schloss Chapultepec liegen beide im Wald von Chapultepec: Das Museum braucht einen halben Tag, um es gut zu sehen, das Schloss eineinhalb bis drei Stunden. Das historische Zentrum und der Templo Mayor mit der Kathedrale sind Nachbarn am Zócalo; das Zentrum ist ein Spaziergang von rund 11 Kilometern, von unter zwei Stunden bis zu zwei Tagen. In Coyoacán findest du den Kern des Viertels und die Casa Azul von Frida Kahlo, die Tickets nur online und mit Einlasszeit verkauft. Die Basilika von Guadalupe liegt im Norden; du erreichst sie mit der Metro bis La Villa-Basílica (Linie 6).\n\nViele Museen sind montags geschlossen: das Nationale Anthropologiemuseum, das Schloss Chapultepec, das Museum des Templo Mayor und die Casa Azul. An diesem Tag eignen sich die Basilika, die täglich geöffnet ist, und Spaziergänge durch die Straßen des historischen Zentrums und von Coyoacán besser.\n\nUm Warteschlangen zu vermeiden, komm unter der Woche zur Öffnung; sonntags ist der Eintritt in mehrere Museen für Mexikaner und ansässige Ausländer frei, aber sie füllen sich, und das Schloss schließt, sobald seine Besucherobergrenze erreicht ist. Am 12. Dezember empfängt die Basilika Millionen von Pilgern. Prüfe Öffnungszeiten und Preise, bevor du losgehst.",
      "Uma forma simples de organizar a cidade é por regiões. O Museu Nacional de Antropologia e o Castelo de Chapultepec ficam os dois no Bosque de Chapultepec: o museu pede meio dia para ser visto direito e o castelo, entre uma hora e meia e três horas. O Centro Histórico e o Templo Mayor com a Catedral são vizinhos no Zócalo; o Centro se percorre em cerca de 11 quilômetros, de menos de duas horas a dois dias. Em Coyoacán estão o coração do bairro e a Casa Azul de Frida Kahlo, que vende ingressos somente on-line e com horário de entrada. A Basílica de Guadalupe fica ao norte; chega-se de metrô até La Villa-Basílica (Linha 6).\n\nMuitos museus fecham às segundas: o Museu Nacional de Antropologia, o Castelo de Chapultepec, o Museu do Templo Mayor e a Casa Azul. Nesse dia funcionam melhor a Basílica, que abre todos os dias, e os passeios pelas ruas do Centro Histórico e de Coyoacán.\n\nPara evitar filas, vá em dia de semana, na abertura; aos domingos a entrada em vários museus é gratuita para mexicanos e estrangeiros residentes, mas eles lotam, e o Castelo fecha ao atingir o limite diário. Em 12 de dezembro a Basílica recebe milhões de peregrinos. Confirme horários e preços antes de sair.",
      "Un modo semplice per organizzare la città è dividerla per zone. Il Museo Nazionale di Antropologia e il Castello di Chapultepec si trovano entrambi nel Bosco di Chapultepec: il museo richiede mezza giornata per essere visto bene, il castello da un’ora e mezza a tre ore. Il Centro Storico e il Templo Mayor con la Cattedrale sono vicini intorno allo Zócalo; il Centro si percorre a piedi per circa 11 chilometri, da meno di due ore a due giorni. A Coyoacán ci sono il cuore del quartiere e la Casa Azul di Frida Kahlo, che vende i biglietti solo online e con orario di ingresso. La Basilica di Guadalupe è a nord; ci si arriva in metro fino a La Villa-Basílica (linea 6).\n\nMolti musei chiudono il lunedì: il Museo Nazionale di Antropologia, il Castello di Chapultepec, il Museo del Templo Mayor e la Casa Azul. In quel giorno funzionano meglio la Basilica, aperta tutti i giorni, e le passeggiate per le strade del Centro Storico e di Coyoacán.\n\nPer evitare le code, vai in settimana all’apertura; la domenica l’ingresso a diversi musei è gratuito per i messicani e gli stranieri residenti, ma si riempiono, e il Castello chiude quando raggiunge il limite giornaliero. Il 12 dicembre la Basilica accoglie milioni di pellegrini. Controlla orari e prezzi prima di partire.",
    ]),
  },
  morelos: {
    sitios: ['CUERNAVACA_HISTORICA', 'XOCHICALCO', 'CHALCATZINGO'],
    slugs: por(['que-ver-en-morelos', 'what-to-see-in-morelos', 'que-voir-au-morelos', 'co-zobaczyc-w-morelos', 'sehenswuerdigkeiten-in-morelos', 'o-que-ver-em-morelos', 'cosa-vedere-a-morelos']),
    h1: por(['Qué ver en Morelos', 'What to see in Morelos', 'Que voir au Morelos', 'Co zobaczyć w Morelos', 'Sehenswürdigkeiten in Morelos', 'O que ver em Morelos', 'Cosa vedere a Morelos']),
    titulo: por(['Qué ver en Morelos: Cuernavaca, Xochicalco y Chalcatzingo', 'What to see in Morelos: Cuernavaca, Xochicalco, Chalcatzingo', 'Que voir au Morelos : Cuernavaca, Xochicalco et Chalcatzingo', 'Co zobaczyć w Morelos: Cuernavaca, Xochicalco i Chalcatzingo', 'Sehenswürdigkeiten in Morelos: Cuernavaca, Xochicalco', 'O que ver em Morelos: Cuernavaca, Xochicalco e Chalcatzingo', 'Cosa vedere a Morelos: Cuernavaca, Xochicalco e Chalcatzingo']),
    lead: por([
      'Cuernavaca histórica, Xochicalco y Chalcatzingo: audioguías en tu celular para recorrer Morelos a pie, parada por parada y sin internet.',
      'Historic Cuernavaca, Xochicalco and Chalcatzingo: audio guides on your phone to explore Morelos on foot, stop by stop and offline.',
      'Cuernavaca historique, Xochicalco et Chalcatzingo : audioguides sur votre téléphone pour parcourir le Morelos à pied, étape par étape et hors ligne.',
      'Historyczna Cuernavaca, Xochicalco i Chalcatzingo: audioprzewodniki w telefonie do zwiedzania Morelos pieszo, przystanek po przystanku i bez internetu.',
      'Das historische Cuernavaca, Xochicalco und Chalcatzingo: Audioguides auf dem Handy, um Morelos zu Fuß zu erkunden, Station für Station und offline.',
      'Cuernavaca histórica, Xochicalco e Chalcatzingo: audioguias no celular para percorrer Morelos a pé, parada por parada e sem internet.',
      'Cuernavaca storica, Xochicalco e Chalcatzingo: audioguide sul cellulare per esplorare il Morelos a piedi, tappa per tappa e offline.',
    ]),
    intro: por([
      'Morelos reúne una ciudad histórica y dos zonas arqueológicas que se pueden recorrer con calma. Cada guía te lleva en el orden en que se camina, y cada página reúne cómo llegar, horarios y consejos.',
      'Morelos brings together a historic city and two archaeological sites you can explore at your own pace. Each guide takes you in the order you walk, and each page gathers how to get there, opening hours and tips.',
      'Le Morelos réunit une ville historique et deux sites archéologiques à parcourir sans se presser. Chaque guide vous accompagne dans l’ordre de la visite, et chaque page réunit comment s’y rendre, les horaires et des conseils.',
      'Morelos łączy historyczne miasto i dwa stanowiska archeologiczne, które można zwiedzać bez pośpiechu. Każdy przewodnik prowadzi w kolejności zwiedzania, a na każdej stronie znajdziesz, jak dojechać, godziny otwarcia i wskazówki.',
      'Morelos vereint eine historische Stadt und zwei archäologische Stätten, die du in Ruhe erkunden kannst. Jeder Guide führt dich in der Reihenfolge des Rundgangs, und auf jeder Seite findest du Anreise, Öffnungszeiten und Tipps.',
      'Morelos reúne uma cidade histórica e dois sítios arqueológicos que dá para percorrer com calma. Cada guia leva você na ordem em que se caminha, e cada página reúne como chegar, horários e dicas.',
      'Il Morelos riunisce una città storica e due siti archeologici da visitare con calma. Ogni guida ti accompagna nell’ordine in cui si cammina, e ogni pagina riunisce come arrivare, orari e consigli.',
    ]),
    editorial: por([
      "Morelos se recorre mejor en dos jornadas distintas: una a pie por la ciudad y otra al aire libre en las zonas arqueológicas.\n\nCuernavaca se hace caminando por el centro, con la Plaza de Armas, el Palacio de Cortés, la Catedral y el Jardín Borda a poca distancia unos de otros; la guía propone rutas desde una hora hasta cuatro horas y cuarenta minutos, así que puedes ajustarla al tiempo que tengas. Xochicalco, una ciudad fortificada que creció sobre los cerros hacia el año 650, queda a poco más de una hora y media de la Ciudad de México por carretera, y desde Cuernavaca lo más cómodo es ir en auto o en taxi. Chalcatzingo está en el oriente del estado y guarda las esculturas de piedra más antiguas que se conocen en el Altiplano Central, talladas sobre todo entre los años 700 y 500 antes de Cristo; conviene darle su propio tiempo.\n\nEn las dos zonas arqueológicas casi todo es al aire libre, con subidas y poca sombra: lleva agua, gorra y calzado cómodo, y descarga la audioguía antes de salir, porque durante el recorrido no hace falta conexión. Los horarios y las entradas cambian, así que confírmalos antes de ir.",
      "Morelos works best as two different kinds of day: one on foot in the city, and one outdoors at the archaeological sites.\n\nCuernavaca is explored on foot through its centre, with the Plaza de Armas, the Palace of Cortés, the Cathedral and the Borda Garden all close together; the guide offers routes from one hour to four hours and forty minutes, so you can fit it to the time you have. Xochicalco, a fortified city that grew on the hills around the year 650, is a little over an hour and a half from Mexico City by road, and from Cuernavaca the easiest way there is by car or taxi. Chalcatzingo lies in the east of the state and holds the oldest stone sculptures known in the Central Highlands, carved mostly between 700 and 500 BC; it deserves its own time.\n\nAt both archaeological sites almost everything is outdoors, with climbs and little shade: bring water, a hat and comfortable shoes, and download the audio guide before you leave, since you don’t need a connection during the tour. Opening hours and admission change, so check them before you go.",
      "Le Morelos se découvre mieux en deux types de journée : l’une à pied dans la ville, l’autre en plein air sur les sites archéologiques.\n\nCuernavaca se parcourt à pied dans son centre, où la Plaza de Armas, le Palais de Cortés, la cathédrale et le jardin Borda sont proches les uns des autres ; le guide propose des parcours d’une heure à quatre heures quarante, pour s’adapter à votre temps. Xochicalco, ville fortifiée qui s’est développée sur les collines vers l’an 650, se trouve à un peu plus d’une heure et demie de Mexico par la route, et depuis Cuernavaca le plus simple est d’y aller en voiture ou en taxi. Chalcatzingo se situe dans l’est de l’État et abrite les plus anciennes sculptures sur pierre connues du Haut Plateau central, taillées surtout entre 700 et 500 av. J.-C. ; mieux vaut lui consacrer son propre temps.\n\nSur les deux sites archéologiques, presque tout se fait en plein air, avec des montées et peu d’ombre : prévoyez de l’eau, un chapeau et de bonnes chaussures, et téléchargez l’audioguide avant de partir, car aucune connexion n’est nécessaire pendant la visite. Les horaires et les tarifs changent, vérifiez-les avant d’y aller.",
      "Morelos najlepiej zwiedzać w dwóch różnych dniach: jednym pieszo po mieście i drugim na świeżym powietrzu, na stanowiskach archeologicznych.\n\nCuernavaca zwiedza się pieszo po centrum, gdzie Plaza de Armas, Pałac Cortésa, katedra i ogród Borda leżą blisko siebie; przewodnik proponuje trasy od godziny do czterech godzin i czterdziestu minut, więc dopasujesz go do swojego czasu. Xochicalco, ufortyfikowane miasto, które rozwinęło się na wzgórzach około roku 650, leży nieco ponad półtorej godziny drogi od miasta Meksyk, a z Cuernavaki najwygodniej dojechać tam samochodem lub taksówką. Chalcatzingo znajduje się we wschodniej części stanu i skrywa najstarsze znane rzeźby w kamieniu na Wyżynie Centralnej, wykute głównie między 700 a 500 rokiem p.n.e.; warto poświęcić mu osobny czas.\n\nNa obu stanowiskach archeologicznych prawie wszystko odbywa się pod gołym niebem, z podejściami i małą ilością cienia: zabierz wodę, czapkę i wygodne buty, a audioprzewodnik pobierz przed wyjściem, bo w trakcie zwiedzania nie potrzebujesz połączenia. Godziny otwarcia i ceny biletów się zmieniają, więc sprawdź je przed wyjazdem.",
      "Morelos lässt sich am besten an zwei unterschiedlichen Tagen erkunden: einem zu Fuß in der Stadt und einem unter freiem Himmel an den archäologischen Stätten.\n\nCuernavaca erkundest du zu Fuß durch das Zentrum, wo Plaza de Armas, Cortés-Palast, Kathedrale und Borda-Garten nah beieinander liegen; der Guide bietet Routen von einer Stunde bis zu vier Stunden und vierzig Minuten, sodass du ihn an deine Zeit anpassen kannst. Xochicalco, eine befestigte Stadt, die um das Jahr 650 auf den Hügeln entstand, liegt etwas mehr als anderthalb Stunden von Mexiko-Stadt entfernt an der Straße, und von Cuernavaca aus kommst du am bequemsten mit dem Auto oder Taxi hin. Chalcatzingo liegt im Osten des Bundesstaates und birgt die ältesten bekannten Steinskulpturen des zentralen Hochlands, überwiegend zwischen 700 und 500 v. Chr. gemeißelt; dafür solltest du dir eigene Zeit nehmen.\n\nAn beiden archäologischen Stätten findet fast alles im Freien statt, mit Anstiegen und wenig Schatten: Nimm Wasser, eine Kappe und bequeme Schuhe mit und lade den Audioguide vor dem Aufbruch herunter, denn während des Rundgangs brauchst du keine Verbindung. Öffnungszeiten und Eintrittspreise ändern sich, prüfe sie also vor dem Besuch.",
      "Morelos se aproveita melhor em dois tipos de dia: um a pé pela cidade e outro ao ar livre nos sítios arqueológicos.\n\nCuernavaca se percorre a pé pelo centro, com a Plaza de Armas, o Palácio de Cortés, a Catedral e o Jardim Borda a poucos passos uns dos outros; o guia propõe roteiros de uma hora a quatro horas e quarenta minutos, para você ajustar ao tempo que tiver. Xochicalco, uma cidade fortificada que cresceu sobre as colinas por volta do ano 650, fica a pouco mais de uma hora e meia da Cidade do México por estrada, e de Cuernavaca o mais cômodo é ir de carro ou de táxi. Chalcatzingo fica no leste do estado e guarda as esculturas de pedra mais antigas que se conhecem no Altiplano Central, entalhadas sobretudo entre os anos 700 e 500 antes de Cristo; vale reservar um tempo só para ela.\n\nNos dois sítios arqueológicos quase tudo é ao ar livre, com subidas e pouca sombra: leve água, boné e calçado confortável, e baixe o audioguia antes de sair, porque durante o percurso não é preciso conexão. Horários e ingressos mudam, então confirme-os antes de ir.",
      "Il Morelos si visita meglio in due giornate diverse: una a piedi in città e una all’aperto nei siti archeologici.\n\nCuernavaca si percorre a piedi nel centro, dove la Plaza de Armas, il Palazzo di Cortés, la Cattedrale e il Giardino Borda sono vicini tra loro; la guida propone percorsi da un’ora a quattro ore e quaranta minuti, così puoi adattarla al tempo che hai. Xochicalco, una città fortificata cresciuta sulle colline intorno all’anno 650, si trova a poco più di un’ora e mezza da Città del Messico in auto, e da Cuernavaca il modo più comodo per arrivarci è l’auto o il taxi. Chalcatzingo si trova nell’est dello stato e custodisce le più antiche sculture in pietra note dell’Altopiano Centrale, scolpite soprattutto tra il 700 e il 500 a.C.; merita il suo tempo.\n\nNei due siti archeologici quasi tutto è all’aperto, con salite e poca ombra: porta acqua, cappello e scarpe comode, e scarica l’audioguida prima di partire, perché durante il percorso non serve la connessione. Orari e biglietti cambiano, quindi controllali prima di andare.",
    ]),
  },
};

const HUB_ETIQUETAS = {
  guias: por(['Las guías', 'The guides', 'Les guides', 'Przewodniki', 'Die Guides', 'Os guias', 'Le guide']),
  planear: por(['Cómo planear tu visita', 'How to plan your visit', 'Comment organiser votre visite', 'Jak zaplanować wizytę', 'So planst du deinen Besuch', 'Como planejar sua visita', 'Come pianificare la visita']),
  faq: por(['Preguntas frecuentes', 'Frequently asked questions', 'Questions fréquentes', 'Najczęściej zadawane pytania', 'Häufige Fragen', 'Perguntas frequentes', 'Domande frequenti']),
  todas: por(['Ver todas las audioguías', 'See all audio guides', 'Voir tous les audioguides', 'Zobacz wszystkie audioprzewodniki', 'Alle Audioguides ansehen', 'Ver todos os audioguias', 'Vedi tutte le audioguide']),
};

/** Dirección de una página agrupada en un idioma. */
export const direccionHub = (hub, lang) => `${RUTA[lang]}${hub.slugs[lang]}/`;

/**
 * Datos de un sitio para su ficha dentro de una página agrupada. Todo sale de las mismas hojas que la guía del sitio (nada inventado):
 * resumen de «Sobre el lugar», recorridos con duración y número de paradas, precio del pase y piezas gratis con página.
 * Solo incluye lo que existe en ese idioma.
 */
export function detalleDeSitio({ sitio, manifiesto = {}, piezas = [], cfg, lang = 'es' }) {
  const t = T[lang];
  const aireLibre = manifiesto.layout === 'zones';
  const loc = (obj, campo) => (lang === 'es' ? obj[campo] : obj[`${campo}_${lang}`]);
  const rutas = (manifiesto.routes || [])
    .filter((r) => r.stops?.length && (lang === 'es' || lleno(r[`name_${lang}`])))
    .map((r) => ({ nombre: loc(r, 'name'), d: lang === 'es' && r.duration ? r.duration : duracion(minutosDe(r)), n: contar(lang, r.stops.length, aireLibre) }))
    .filter((r) => lleno(r.nombre));
  const intro = String(loc(sitio, 'intro') || '').trim();
  const precio = cfg.proximamente ? '' : moneda(lang, sitio, manifiesto);
  const vistos = new Set();
  const gratis = cfg.proximamente
    ? []
    : piezas
        .filter((p) => piezaPublicable(p, lang))
        .map((p) => ({ titulo: tituloDePieza(p, lang), url: direccionPieza(cfg, p, lang) }))
        .filter((g) => (vistos.has(g.url) ? false : (vistos.add(g.url), true)));
  return {
    intro: lleno(intro) ? recortar(intro.replace(/\s+/g, ' '), 420) : '',
    rutas,
    precio: precio ? t.precio(precio).trim() : '',
    gratisTitulo: gratis.length ? t.gratisTitulo(aireLibre) : '',
    gratis: gratis.slice(0, 6),
    recorridosTitulo: t.recorridos,
  };
}

/**
 * Página agrupada. entradas = [{ nombre, url, lead, detalle? }] de los sitios disponibles en ese idioma (en el orden del grupo).
 * detalle = lo que devuelve detalleDeSitio (si falta, la entrada sale solo con nombre y resumen, como antes).
 * idiomas = idiomas en que sale esta página (para hreflang). Si hay menos de 2 entradas no se arma (devuelve null).
 */
export function armarHub({ hub, lang, idiomas = [lang], entradas = [] }) {
  if (entradas.length < 2) return null;
  const url = `${DOMINIO}${direccionHub(hub, lang)}`;
  const titulo = hub.titulo[lang];
  const descripcion = elegirCompleta([hub.lead[lang]]);
  const alternativas = idiomas.map((l) => ({ l, href: `${DOMINIO}${direccionHub(hub, l)}` }));
  const hreflang = [...alternativas.map((a) => `<link rel="alternate" hreflang="${a.l}" href="${a.href}">`), `<link rel="alternate" hreflang="x-default" href="${alternativas.find((a) => a.l === 'es')?.href || url}">`].join('\n');
  const selector = idiomas.length > 1 ? `<nav class="idiomas" data-nosnippet aria-label="Idioma">${alternativas.map((a) => (a.l === lang ? `<span aria-current="true">${a.l.toUpperCase()}</span>` : `<a href="${a.href}" hreflang="${a.l}" lang="${a.l}">${a.l.toUpperCase()}</a>`)).join(' ')}</nav>` : '';
  // Preguntas comunes a todos los sitios (sin la primera, que nombra un sitio concreto)
  const preguntas = faqDeGuia({ lang, nombre: hub.h1[lang], idiomas: [lang, ...idiomas.filter((l) => l !== lang)] }).slice(1);
  const jsonld = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': url,
        url,
        name: titulo,
        description: descripcion,
        inLanguage: lang,
        isPartOf: { '@type': 'WebSite', name: 'Xolotli', url: `${DOMINIO}/` },
        mainEntity: { '@type': 'ItemList', itemListElement: entradas.map((e, i) => ({ '@type': 'ListItem', position: i + 1, name: e.nombre, url: `${DOMINIO}${e.url}` })) },
      },
      ...(preguntas.length ? [{ '@type': 'FAQPage', '@id': `${url}#preguntas`, inLanguage: lang, mainEntity: preguntas.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] : []),
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Xolotli', item: `${DOMINIO}/` },
          { '@type': 'ListItem', position: 2, name: hub.h1[lang], item: url },
        ],
      },
    ],
  }).replace(/</g, '\\u003c');
  const ficha = (e) => {
    const d = e.detalle;
    const partes = [`<h3><a href="${esc(e.url)}">${esc(e.nombre)}</a></h3>`];
    if (lleno(e.lead)) partes.push(`<p>${esc(e.lead)}</p>`);
    if (d?.intro) partes.push(`<p>${esc(d.intro)}</p>`);
    if (d?.rutas?.length) partes.push(`<p><strong>${esc(d.recorridosTitulo)}:</strong> ${d.rutas.map((r) => `${esc(r.nombre)} (${esc(r.d)} · ${esc(r.n)})`).join(' · ')}</p>`);
    if (d?.gratis?.length) partes.push(`<p><strong>${esc(d.gratisTitulo)}:</strong> ${d.gratis.map((g) => `<a href="${esc(g.url)}">${esc(g.titulo)}</a>`).join(' · ')}</p>`);
    if (d?.precio) partes.push(`<p class="nota">${esc(d.precio)}</p>`);
    return `<section>\n${partes.join('\n')}\n</section>`;
  };
  const cuerpo = `<h1>${esc(hub.h1[lang])}</h1>
<p class="lead">${esc(hub.lead[lang])}</p>
<p>${esc(hub.intro[lang])}</p>
<h2>${esc(HUB_ETIQUETAS.guias[lang])}</h2>
${entradas.map(ficha).join('\n')}
${hub.editorial?.[lang] ? `<h2>${esc(HUB_ETIQUETAS.planear[lang])}</h2>\n${textoEnHtml(hub.editorial[lang])}\n` : ''}${preguntas.length ? `<h2>${esc(HUB_ETIQUETAS.faq[lang])}</h2>\n<dl class="faq">${preguntas.map(([q, a]) => `<dt><strong>${esc(q)}</strong></dt><dd>${esc(a)}</dd>`).join('')}</dl>` : ''}
<p class="cta"><a class="boton" href="/">${esc(HUB_ETIQUETAS.todas[lang])}</a></p>`;
  const html = plantilla({ lang, titulo, descripcion, url, hreflang, portada: '', jsonld, selector, cuerpo, pie: T[lang].pie });
  return { html, url, titulo, descripcion };
}

// ───────────── Oferta del pase (producto digital) ─────────────
// Política de devolución = la de los Términos (reembolso completo en 30 días si no se ha usado) y envío = ninguno (acceso inmediato en línea).
const PAISES_OFERTA = ['MX', 'US', 'CA', 'ES', 'FR', 'DE', 'IT', 'PT', 'PL', 'BR', 'GB', 'AR', 'CO', 'CL', 'PE'];
const cero = { '@type': 'QuantitativeValue', minValue: 0, maxValue: 0, unitCode: 'DAY' };
export function ofertaDigital(price, priceCurrency, url, lang = 'es') {
  return {
    '@type': 'Offer',
    price,
    priceCurrency,
    availability: 'https://schema.org/InStock',
    url,
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: PAISES_OFERTA,
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 30,
      returnFees: 'https://schema.org/FreeReturn',
      merchantReturnLink: `${DOMINIO}/terminos/${lang}/`,
    },
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: priceCurrency },
      shippingDestination: PAISES_OFERTA.map((c) => ({ '@type': 'DefinedRegion', addressCountry: c })),
      deliveryTime: { '@type': 'ShippingDeliveryTime', handlingTime: cero, transitTime: cero },
    },
  };
}

// ───────────── Portadas (/ y /en/, /fr/…) con texto en el HTML ─────────────
// La portada es la app (React): sin JavaScript llegaba con el cuerpo vacío, y los buscadores y los asistentes de IA que
// leen la dirección sin ejecutar JavaScript no veían nada ni encontraban los enlaces a las guías. «/» lleva este texto dentro
// de <div id="root"> (React lo reemplaza al arrancar, así que a la persona no le cambia nada). Los otros idiomas son páginas
// estáticas propias (/en/, /fr/, /pl/, /de/, /pt/, /it/) con su título, descripción y lista de guías, enlazadas entre sí con hreflang.

/** Un solo interruptor: mientras todo sea gratis por tiempo limitado, las portadas lo dicen. Ponlo en false al empezar a cobrar. */
export const PROMO_GRATIS = true;

const PORTADA = {
  es: {
    titulo: 'Xolotli: audioguías de museos y zonas arqueológicas de México',
    desc: 'Audioguías en 7 idiomas para el Museo de Antropología, Teotihuacán, Chichén Itzá y más. Elige tu recorrido y escucha las historias, incluso sin internet.',
    lead: "Descubre museos, ciudades y zonas arqueológicas con audioguías que te cuentan lo que estás viendo, a tu ritmo y sin depender de un grupo.",
    ben: [["Más de 400 paradas cuidadosamente documentadas", "Desde la Piedra del Sol hasta las pirámides de Teotihuacán y Chichén Itzá."], ["Tú decides el recorrido", "Elige una sala o una zona, o sigue una ruta ya armada. Pausa, salta o repite cuando quieras."], ["Funciona sin internet", "Descarga la guía antes de entrar y escúchala aunque no haya señal."], ["En 7 idiomas", "Español, inglés, francés, alemán, italiano, portugués y polaco."]],
    gratis: 'Por tiempo limitado, todos los recorridos son gratis.',
    guias: 'Guías por sitio', temas: 'Guías por tema', otros: 'Otros idiomas', como: 'Cómo funciona',
    pasos: ['Entra al museo o al sitio y elige una sala o una zona, o sigue un recorrido ya armado.', 'En cada parada, escucha su historia.', 'Con el acceso completo de 30 días escuchas todo el sitio que elijas, en hasta 2 teléfonos.'],
    cta: 'Abrir la app', acceso: (p) => `Acceso completo de 30 días: ${p}`, nota: 'La entrada al recinto no está incluida.',
    terminos: 'Términos y reembolsos', privacidad: 'Privacidad',
  },
  en: {
    titulo: 'Xolotli: audio guides for museums and ruins in Mexico',
    desc: 'Audio guides in 7 languages for the Anthropology Museum, Teotihuacan, Chichen Itza and more. Pick your route and hear the stories, even offline.',
    lead: "Discover museums, cities and archaeological sites with audio guides that tell you about what you are looking at, at your own pace and without depending on a group.",
    ben: [["More than 400 carefully researched stops", "From the Sun Stone to the pyramids of Teotihuacan and Chichen Itza."], ["You choose the route", "Pick a room or a zone, or follow a ready-made tour. Pause, skip or replay whenever you like."], ["Works without internet", "Download the guide before you go in and listen even with no signal."], ["In 7 languages", "Spanish, English, French, German, Italian, Portuguese and Polish."]],
    gratis: 'For a limited time, all tours are free.',
    guias: 'Guides by site', temas: 'Guides by theme', otros: 'Other languages', como: 'How it works',
    pasos: ['Enter the museum or site and pick a room or zone, or follow a ready-made tour.', 'At each stop, listen to its story.', 'With the 30-day full access you listen to the whole site you choose, on up to 2 phones.'],
    cta: 'Open the app', acceso: (p) => `30-day full access: ${p}`, nota: 'Admission to the site is not included.',
    terminos: 'Terms and refunds', privacidad: 'Privacy',
  },
  fr: {
    titulo: 'Xolotli : audioguides pour musées et sites du Mexique',
    desc: 'Audioguides en 7 langues pour le Musée d’anthropologie, Teotihuacan, Chichén Itzá et plus. Choisissez votre parcours et écoutez les histoires, même hors ligne.',
    lead: "Découvrez musées, villes et sites archéologiques avec des audioguides qui vous racontent ce que vous voyez, à votre rythme, sans dépendre d’un groupe.",
    ben: [["Plus de 400 étapes soigneusement documentées", "De la Pierre du Soleil aux pyramides de Teotihuacan et de Chichén Itzá."], ["Vous choisissez le parcours", "Choisissez une salle ou une zone, ou suivez un parcours tout prêt. Pause, saut ou répétition à volonté."], ["Fonctionne sans internet", "Téléchargez le guide avant d’entrer et écoutez-le même sans réseau."], ["En 7 langues", "Espagnol, anglais, français, allemand, italien, portugais et polonais."]],
    gratis: 'Pour une durée limitée, tous les parcours sont gratuits.',
    guias: 'Guides par site', temas: 'Guides par thème', otros: 'Autres langues', como: 'Comment ça marche',
    pasos: ['Entrez dans le musée ou sur le site et choisissez une salle ou une zone, ou suivez un parcours tout prêt.', 'À chaque étape, écoutez son histoire.', 'Avec l’accès complet de 30 jours, vous écoutez tout le site de votre choix, sur 2 téléphones maximum.'],
    cta: 'Ouvrir l’application', acceso: (p) => `Accès complet de 30 jours : ${p}`, nota: 'Le billet d’entrée du site n’est pas inclus.',
    terminos: 'Conditions et remboursements', privacidad: 'Confidentialité',
  },
  pl: {
    titulo: 'Xolotli: audioprzewodniki po muzeach i stanowiskach Meksyku',
    desc: 'Audioprzewodniki w 7 językach: Muzeum Antropologii, Teotihuacan, Chichén Itzá i więcej. Wybierz trasę i słuchaj historii, także offline.',
    lead: "Odkrywaj muzea, miasta i stanowiska archeologiczne z audioprzewodnikami, które opowiadają o tym, co widzisz – w twoim tempie i bez grupy.",
    ben: [["Ponad 400 starannie opracowanych przystanków", "Od Kamienia Słońca po piramidy Teotihuacan i Chichén Itzá."], ["Ty wybierasz trasę", "Wybierz salę lub strefę albo gotową trasę. Zatrzymaj, pomiń lub powtórz, kiedy chcesz."], ["Działa bez internetu", "Pobierz przewodnik przed wejściem i słuchaj nawet bez zasięgu."], ["W 7 językach", "Hiszpański, angielski, francuski, niemiecki, włoski, portugalski i polski."]],
    gratis: 'Przez ograniczony czas wszystkie trasy są bezpłatne.',
    guias: 'Przewodniki według miejsc', temas: 'Przewodniki tematyczne', otros: 'Inne języki', como: 'Jak to działa',
    pasos: ['Wejdź do muzeum lub na stanowisko i wybierz salę lub strefę albo gotową trasę.', 'Przy każdym przystanku posłuchaj jego historii.', 'Z pełnym dostępem na 30 dni słuchasz całego wybranego miejsca na maksymalnie 2 telefonach.'],
    cta: 'Otwórz aplikację', acceso: (p) => `Pełny dostęp na 30 dni: ${p}`, nota: 'Bilet wstępu na miejsce nie jest wliczony.',
    terminos: 'Regulamin i zwroty', privacidad: 'Prywatność',
  },
  de: {
    titulo: 'Xolotli: Audioguides für Museen und Ruinen in Mexiko',
    desc: 'Audioguides in 7 Sprachen für das Anthropologiemuseum, Teotihuacan, Chichén Itzá und mehr. Route wählen und Geschichten hören, auch offline.',
    lead: "Entdecke Museen, Städte und archäologische Stätten mit Audioguides, die dir erzählen, was du gerade siehst – in deinem Tempo und ohne Gruppe.",
    ben: [["Mehr als 400 sorgfältig recherchierte Stationen", "Vom Sonnenstein bis zu den Pyramiden von Teotihuacan und Chichén Itzá."], ["Du bestimmst die Route", "Wähle einen Raum oder Bereich oder folge einer fertigen Tour. Pausieren, überspringen oder wiederholen, wann du willst."], ["Funktioniert ohne Internet", "Lade den Guide vor dem Eintritt herunter und hör ihn auch ohne Empfang."], ["In 7 Sprachen", "Spanisch, Englisch, Französisch, Deutsch, Italienisch, Portugiesisch und Polnisch."]],
    gratis: 'Für begrenzte Zeit sind alle Touren kostenlos.',
    guias: 'Guides nach Ort', temas: 'Guides nach Thema', otros: 'Andere Sprachen', como: 'So funktioniert es',
    pasos: ['Betritt das Museum oder die Stätte und wähle einen Raum oder Bereich oder folge einer fertigen Tour.', 'Hör dir an jeder Station ihre Geschichte an.', 'Mit dem 30-Tage-Vollzugang hörst du die gesamte gewählte Stätte, auf bis zu 2 Handys.'],
    cta: 'App öffnen', acceso: (p) => `30 Tage Vollzugang: ${p}`, nota: 'Der Eintritt zur Stätte ist nicht enthalten.',
    terminos: 'Bedingungen und Erstattungen', privacidad: 'Datenschutz',
  },
  pt: {
    titulo: 'Xolotli: audioguias de museus e sítios do México',
    desc: 'Audioguias em 7 idiomas para o Museu de Antropologia, Teotihuacán, Chichén Itzá e mais. Escolha seu roteiro e ouça as histórias, mesmo sem internet.',
    lead: "Descubra museus, cidades e sítios arqueológicos com audioguias que contam o que você está vendo, no seu ritmo e sem depender de um grupo.",
    ben: [["Mais de 400 paradas cuidadosamente documentadas", "Da Pedra do Sol às pirâmides de Teotihuacán e Chichén Itzá."], ["Você escolhe o roteiro", "Escolha uma sala ou uma zona, ou siga um roteiro pronto. Pause, pule ou repita quando quiser."], ["Funciona sem internet", "Baixe o guia antes de entrar e ouça mesmo sem sinal."], ["Em 7 idiomas", "Espanhol, inglês, francês, alemão, italiano, português e polonês."]],
    gratis: 'Por tempo limitado, todos os roteiros são gratuitos.',
    guias: 'Guias por local', temas: 'Guias por tema', otros: 'Outros idiomas', como: 'Como funciona',
    pasos: ['Entre no museu ou no sítio e escolha uma sala ou uma zona, ou siga um roteiro pronto.', 'Em cada parada, ouça a sua história.', 'Com o acesso completo de 30 dias você ouve todo o local que escolher, em até 2 celulares.'],
    cta: 'Abrir o aplicativo', acceso: (p) => `Acesso completo por 30 dias: ${p}`, nota: 'O ingresso do local não está incluído.',
    terminos: 'Termos e reembolsos', privacidad: 'Privacidade',
  },
  it: {
    titulo: 'Xolotli: audioguide per musei e siti archeologici del Messico',
    desc: 'Audioguide in 7 lingue per il Museo di Antropologia, Teotihuacan, Chichén Itzá e altro. Scegli il percorso e ascolta le storie, anche offline.',
    lead: "Scopri musei, città e siti archeologici con audioguide che ti raccontano ciò che stai guardando, con i tuoi tempi e senza dipendere da un gruppo.",
    ben: [["Oltre 400 tappe accuratamente documentate", "Dalla Pietra del Sole alle piramidi di Teotihuacan e Chichén Itzá."], ["Scegli tu il percorso", "Scegli una sala o una zona, o segui un percorso già pronto. Pausa, salta o ripeti quando vuoi."], ["Funziona senza internet", "Scarica la guida prima di entrare e ascoltala anche senza rete."], ["In 7 lingue", "Spagnolo, inglese, francese, tedesco, italiano, portoghese e polacco."]],
    gratis: 'Per un periodo limitato, tutti i percorsi sono gratuiti.',
    guias: 'Guide per luogo', temas: 'Guide per tema', otros: 'Altre lingue', como: 'Come funziona',
    pasos: ['Entra nel museo o nel sito e scegli una sala o una zona, oppure segui un percorso già pronto.', 'A ogni tappa, ascolta la sua storia.', 'Con l’accesso completo di 30 giorni ascolti tutto il sito che scegli, su 2 telefoni al massimo.'],
    cta: 'Apri l’app', acceso: (p) => `Accesso completo di 30 giorni: ${p}`, nota: 'Il biglietto d’ingresso al sito non è incluso.',
    terminos: 'Termini e rimborsi', privacidad: 'Privacy',
  },
};

const ETIQUETAS_IDIOMA = { es: 'Español', en: 'English', fr: 'Français', pl: 'Polski', de: 'Deutsch', pt: 'Português', it: 'Italiano' };

/** Dirección de la portada de un idioma: «/» para español y «/en/», «/fr/»… para los demás. */
export const direccionPortada = (lang) => (lang === 'es' ? '/' : `/${lang}/`);

const precioDe = (s, lang) => {
  const usd = Number(s.usd) || 0;
  const mxn = Number(s.mxn) || 0;
  if (lang !== 'es' && usd) return `US$${usd}`;
  return mxn ? `MX$${mxn}` : '';
};

/**
 * Lo que va dentro de la portada de un idioma (sin estilos). sitios: [{ nombre, nombres, lugar, lead, leads, mxn, usd, urls }]
 * hubs: [{ nombre, url }] (páginas agrupadas en ESE idioma).
 */
function contenidoPortada({ lang, sitios, hubs, idiomas }) {
  const t = PORTADA[lang];
  const nombreDe = (s) => (lang === 'es' ? s.nombre : s.nombres?.[lang] || s.nombre);
  const leadDe = (s) => (lang === 'es' ? s.lead : s.leads?.[lang] || '');
  const visibles = sitios.filter((s) => s.urls?.[lang]);
  const lista = visibles
    .map((s) => {
      const precio = precioDe(s, lang);
      return `<li><strong><a href="${esc(s.urls[lang])}">${esc(nombreDe(s))}</a></strong>${lang === 'es' && lleno(s.lugar) ? ` <span>${esc(s.lugar)}</span>` : ''}${lleno(leadDe(s)) ? `<br>${esc(recortar(leadDe(s), 170))}` : ''}${precio ? `<br><small>${esc(t.acceso(precio))}</small>` : ''}</li>`;
    })
    .join('\n');
  const temas = hubs.length ? `<h2>${esc(t.temas)}</h2>\n<ul>\n${hubs.map((h) => `<li><a href="${esc(h.url)}">${esc(h.nombre)}</a></li>`).join('\n')}\n</ul>\n` : '';
  const otros =
    lang === 'es'
      ? idiomas
          .filter((l) => l !== 'es')
          .map((l) => {
            const enlaces = sitios.filter((s) => s.urls?.[l]).map((s) => `<a href="${esc(s.urls[l])}" hreflang="${l}" lang="${l}">${esc(s.nombres?.[l] || s.nombre)}</a>`);
            return enlaces.length ? `<li><strong><a href="${direccionPortada(l)}" hreflang="${l}" lang="${l}">${esc(ETIQUETAS_IDIOMA[l] || l)}</a>:</strong> ${enlaces.join(' · ')}</li>` : '';
          })
          .filter(Boolean)
          .join('\n')
      : '';
  return `<h1>${esc(t.titulo)}</h1>
<p>${esc(t.lead)}</p>
<ul>
${t.ben.map(([a, b]) => `<li><strong>${esc(a)}.</strong> ${esc(b)}</li>`).join('\n')}
</ul>
${PROMO_GRATIS ? `<p>${esc(t.gratis)}</p>\n` : ''}<p><a href="/?idioma=${lang}">${esc(t.cta)}</a></p>
<h2>${esc(t.guias)}</h2>
<ul>
${lista}
</ul>
${temas}<h2>${esc(t.como)}</h2>
<ol>
${t.pasos.map((x) => `<li>${esc(x)}</li>`).join('\n')}
</ol>
<p>${esc(t.nota)}</p>
${otros ? `<h2>${esc(t.otros)}</h2>\n<ul>\n${otros}\n</ul>\n` : ''}<p><a href="/terminos/${lang}/">${esc(t.terminos)}</a> · <a href="/privacidad/${lang}/">${esc(t.privacidad)}</a>${lang === 'es' ? ' · <a href="/llms.txt">llms.txt</a>' : ''}</p>`;
}

const itemListDe = (lang, sitios) => ({
  '@type': 'ItemList',
  '@id': `${DOMINIO}${direccionPortada(lang)}#guias`,
  name: PORTADA[lang].guias,
  itemListElement: sitios.filter((s) => s.urls?.[lang]).map((s, i) => ({ '@type': 'ListItem', position: i + 1, name: lang === 'es' ? s.nombre : s.nombres?.[lang] || s.nombre, url: `${DOMINIO}${s.urls[lang]}` })),
});

/** Enlaces hreflang de las portadas (con x-default hacia «/»). */
export const hreflangPortadas = (idiomas = IDIOMAS) =>
  [...idiomas.map((l) => `<link rel="alternate" hreflang="${l}" href="${DOMINIO}${direccionPortada(l)}">`), `<link rel="alternate" hreflang="x-default" href="${DOMINIO}/">`].join('\n');

/**
 * Portada en español para meter dentro de <div id="root"> (la app la reemplaza al arrancar).
 * sitios: [{ nombre, nombres, lugar, lead, leads, mxn, usd, urls: { es: '/guias/…/', en: '/en/guides/…/' } }]
 */
export function armarPortadaEstatica({ sitios = [], hubs = [], idiomas = IDIOMAS } = {}) {
  const cuerpo = `<style>.portada-estatica{font:17px/1.6 system-ui,sans-serif;max-width:46rem;margin:0 auto;padding:1.5rem;color:#1c1917}.portada-estatica h1{font-size:1.8rem;line-height:1.2}.portada-estatica h2{font-size:1.2rem;margin:1.8rem 0 .4rem}.portada-estatica li{margin:.5rem 0}.portada-estatica a{color:#9d174d}.portada-estatica small,.portada-estatica span{color:#57534e}</style>
<main class="portada-estatica">
${contenidoPortada({ lang: 'es', sitios, hubs, idiomas })}
</main>`;
  return { cuerpo, itemList: itemListDe('es', sitios) };
}

/**
 * Mete la portada con texto dentro de <div id="root"> del index.html compilado, añade la lista de guías al JSON-LD y,
 * si se dan, los hreflang de las portadas por idioma. Si no encuentra el <div id="root"> vacío devuelve null.
 */
export function inyectarPortada(indexHtml, { cuerpo, itemList }, hreflang = '') {
  const raiz = /(<div id="root"[^>]*>)\s*(<\/div>)/;
  if (!raiz.test(indexHtml)) return null;
  let html = indexHtml.replace(raiz, (_, a, b) => `${a}\n${cuerpo}\n${b}`);
  html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/, (todo, json) => {
    try {
      const datos = JSON.parse(json);
      const grafo = Array.isArray(datos['@graph']) ? datos['@graph'] : [datos];
      if (!grafo.some((x) => x['@type'] === 'ItemList')) grafo.push(itemList);
      return `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': grafo }).replace(/</g, '\\u003c')}</script>`;
    } catch {
      return todo;
    }
  });
  // OJO: se revisa solo el <head> (el cuerpo ya trae enlaces con hreflang y no cuentan como etiquetas del encabezado)
  const cabeza = html.slice(0, html.indexOf('</head>'));
  if (hreflang && !/<link rel="alternate" hreflang=/.test(cabeza)) html = html.replace('</head>', `${hreflang}\n</head>`);
  // Las demás páginas traen esta etiqueta; la portada también, para que todas digan lo mismo (incluye max-image-preview).
  if (!/<meta\s+name="robots"/i.test(cabeza)) html = html.replace('</head>', '<meta name="robots" content="index, follow, max-image-preview:large">\n</head>');
  html = html.replace(/(<meta (?:property="og:image"|name="twitter:image") content=")[^"]*(")/g, `$1${DOMINIO}/og/${ogNombre('/')}$2`);
  return html;
}

/** Página estática de la portada de un idioma que no es español (/en/, /fr/, /pl/, /de/, /pt/, /it/). */
export function armarPortadaIdioma({ lang, sitios = [], hubs = [], idiomas = IDIOMAS, portada = '/pwa-512x512.png' }) {
  const t = PORTADA[lang];
  const url = `${DOMINIO}${direccionPortada(lang)}`;
  const selector = `<nav class="idiomas" data-nosnippet aria-label="Language">${idiomas.map((l) => (l === lang ? `<span aria-current="true">${l.toUpperCase()}</span>` : `<a href="${DOMINIO}${direccionPortada(l)}" hreflang="${l}" lang="${l}">${l.toUpperCase()}</a>`)).join(' ')}</nav>`;
  const jsonld = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${DOMINIO}/#sitio`, name: 'Xolotli', url: `${DOMINIO}/`, inLanguage: idiomas },
      { '@type': 'Organization', '@id': `${DOMINIO}/#organizacion`, name: 'Xolotli', alternateName: 'Xolo', url: `${DOMINIO}/`, logo: `${DOMINIO}/pwa-512x512.png` },
      { '@type': 'WebPage', '@id': url, url, name: t.titulo, description: t.desc, inLanguage: lang, isPartOf: { '@id': `${DOMINIO}/#sitio` } },
      itemListDe(lang, sitios),
    ],
  }).replace(/</g, '\\u003c');
  const html = plantilla({ lang, titulo: t.titulo, descripcion: t.desc, url, hreflang: hreflangPortadas(idiomas), portada, jsonld, selector, cuerpo: contenidoPortada({ lang, sitios, hubs, idiomas }), pie: T[lang].pie });
  return { html, url, titulo: t.titulo, descripcion: t.desc };
}
