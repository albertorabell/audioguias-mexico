// scripts/sync-sheets.js
// -----------------------------------------------------------------------------
// Lee tu Google Sheets (público) y genera los archivos que usa la app:
//   public/data/rooms.json  y  public/data/pieces.json   (con copia en public/data/mna/)
//   rutas sugeridas en public/data/mna/site.json y mna.json
//
// REGLA DE ORO: lo que dice el Sheets es la verdad.
// Este script NO corrige, NO adivina y NO tiene salas escritas a mano.
// Si algo está mal en el Sheets, lo avisa en el registro de la compilación
// (GitHub > Actions > la ejecución > "build" > "Compilar proyecto con Vite")
// y lo corriges en el Sheets.
//
// Seguridad: si el Sheets no se puede leer o viene incompleto, el script se
// detiene ANTES de escribir nada. La compilación falla (X roja) y la app
// publicada se queda como estaba. Nunca se publican datos a medias.
// -----------------------------------------------------------------------------
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { MODES, AUDIO_LANGS, scriptFor, textHash } from './audio-lib.mjs';
import { applyStoredTranslations } from './traducir-lib.mjs';
import { splitPiece, writePrivate } from './privado-lib.mjs';
import { linkIds, hasBrokenLink } from '../src/utils/pieceLinks.js';
import { hayClave, leerPestana } from './google-sheets-lib.mjs';
import { cargarSitios, estaPublicado } from './sitios-lib.mjs';
import { aplicarDefiniciones, partirRutas, leerDefinicionesRutas, construirRutasSitio, manifiestoSitio, entradaSitio, mezclarSites, leerAntesDeIr } from './sitios-extra-lib.mjs';

// ===== CONFIGURACIÓN (lo único que normalmente se toca) =====================
const SPREADSHEET_ID = '1D6Tu8qLVchpsKqFLDF1poEvxOOJO600DLHv05-weOcY';

// FUENTE DE DATOS: los Sheets de cada sitio viven en la carpeta "Audioguías México" de Drive y se leen en privado
// con el robot de Google. La lista de sitios sale de la hoja CONTROL. SYNC_FUENTE=vieja vuelve al Sheet de antes (solo para comparar).
const FUENTE_NUEVA = process.env.SYNC_FUENTE !== 'vieja' && !process.env.SYNC_LOCAL_DIR; // las pruebas locales leen CSV
const KIND_SITE = { salas: ['mna', 'SALAS'], piezas: ['mna', 'PIEZAS'], teo_salas: ['teotihuacan', 'SALAS'], teo_piezas: ['teotihuacan', 'PIEZAS'] };

/** Lee SALAS o PIEZAS de un sitio (según CONTROL) y deja solo las filas con publicar = SI (si la columna existe). */
async function leerPestanaNueva(siteId, tab, kind) {
  if (!hayClave()) throw new Error('Falta el secreto GOOGLE_SERVICE_ACCOUNT_JSON (GitHub > Settings > Secrets and variables > Actions) para leer los Sheets privados.');
  const sitio = (await cargarSitios({ estricto: true })).find((x) => x.site_id === siteId);
  if (!sitio || !sitio.sheet_id) throw new Error(`El sitio "${siteId}" no está en la hoja CONTROL (pestaña SITIOS) o no tiene sheet_id.`);
  const parsed = toObjects(await leerPestana(sitio.sheet_id, tab));
  if (parsed.headers.includes('publicar')) {
    const antes = parsed.items.length;
    parsed.items = parsed.items.filter((it) => String(it.publicar || '').trim().toUpperCase() === 'SI');
    if (antes !== parsed.items.length) console.log(`   (${siteId}/${tab}: ${antes - parsed.items.length} fila(s) ocultas por publicar distinto de SI)`);
  }
  return checkColumns(kind, `${siteId}/${tab}`, parsed);
}

// Nombres de las pestañas. Se prueba en orden hasta encontrar la que tiene las columnas correctas.
const TAB_NAMES = {
  salas: ['📝 TRABAJO_SALAS', 'TRABAJO_SALAS'],
  piezas: ['📝 TRABAJO_PIEZAS', 'TRABAJO_PIEZAS'],
  // Teotihuacán (misma estructura que el museo; sus "salas" son zonas del sitio)
  teo_salas: ['📝 TEO_SALAS', 'TEO_SALAS'],
  teo_piezas: ['📝 TEO_PIEZAS', 'TEO_PIEZAS'],
};

// Columnas que DEBEN existir (por nombre; el orden de las columnas no importa).
const REQUIRED = {
  salas: ['room_id', 'numero_oficial', 'nombre_oficial'],
  piezas: ['piece_id', 'room_id', 'titulo', 'guion_corto', 'guion_largo'],
  teo_salas: ['room_id', 'numero_oficial', 'nombre_oficial'],
  teo_piezas: ['piece_id', 'room_id', 'titulo', 'guion_corto', 'guion_largo'],
};

// Teotihuacán: solo dos rutas. Qué piezas lleva cada una lo decide la columna `rutas` de TEO_PIEZAS
// (valores separados por "|": express|completa). El orden es el del recorrido: zona y luego orden_sugerido.
// Las duraciones son estimaciones (audio + caminata + tiempo en cada parada); conviene cronometrarlas una vez en el sitio.
const TEO_ROUTES = [
  {
    id: 'ruta-express',
    key: 'express',
    name: 'Ruta Exprés',
    name_en: 'Express Route',
    name_fr: 'Parcours express',
    name_pl: 'Trasa ekspresowa',
    duration: '2.5–3 h',
    estimated_minutes: 165,
    description: 'Los doce lugares imprescindibles de Teotihuacán, para quien tiene unas tres horas o menos.',
    description_en: 'The twelve essential places in Teotihuacán, for visitors with about three hours or less.',
    description_fr: 'Les douze lieux incontournables de Teotihuacán, pour qui dispose d’environ trois heures ou moins.',
    description_pl: 'Dwanaście najważniejszych miejsc w Teotihuacán, dla osób, które mają około trzech godzin lub mniej.',
  },
  {
    id: 'ruta-completa',
    key: 'completa',
    name: 'Ruta Completa',
    name_en: 'Complete Route',
    name_fr: 'Parcours complet',
    name_pl: 'Trasa pełna',
    duration: '5–6 h',
    estimated_minutes: 330,
    description: 'Todas las paradas: la Calzada de los Muertos, las pirámides, los palacios, los murales y los barrios. De la Puerta 1 a la salida.',
    description_en: 'Every stop: the Avenue of the Dead, the pyramids, the palaces, the murals and the neighbourhoods. From Gate 1 to the exit.',
    description_fr: 'Toutes les étapes : l’Avenue des Morts, les pyramides, les palais, les peintures murales et les quartiers. De la porte 1 à la sortie.',
    description_pl: 'Wszystkie przystanki: Aleja Zmarłych, piramidy, pałace, malowidła i dzielnice. Od bramy 1 do wyjścia.',
  },
];

/** Cómo se llama cada zona de Teotihuacán en el selector (si el Sheets no trae la columna `etiqueta`). */
const TEO_ZONE_LABEL = { es: 'Zona', en: 'Zone', fr: 'Zone', pl: 'Strefa' };

// Si el Sheets trae menos piezas que esto, se considera una lectura incompleta y se aborta.
const MIN_PIEZAS = 20;

/** false = todo el audio requiere pase, aunque el Sheets marque piezas como gratis. Para volver a regalar piezas: true. */
const PIEZAS_GRATIS = process.env.SYNC_PIEZAS_GRATIS === 'true';

// Rutas sugeridas del MNA. Solo se usan piezas que existan en el Sheets (no se inventa nada).
// Las paradas van ordenadas por ala del museo (Exteriores, Norte, Centro, Sur) para no regresar sobre los pasos.
const ROUTES = [
  {
    id: 'ruta-monumental',
    name: 'Obras Maestras del MNA',
    name_en: 'Masterpieces of the MNA',
    name_fr: 'Chefs-d’œuvre du MNA',
    name_pl: 'Arcydzieła MNA',
    duration: '45 min',
    description: 'Las piezas más famosas del museo, ordenadas para recorrer la planta baja de norte a sur sin regresar.',
    description_en: "The museum's most famous pieces, ordered so you can walk the ground floor from north to south without backtracking.",
    description_fr: 'Les pièces les plus célèbres du musée, dans un ordre qui permet de parcourir le rez-de-chaussée du nord au sud sans revenir sur ses pas.',
    description_pl: 'Najsłynniejsze dzieła muzeum, ułożone tak, by przejść parter z północy na południe bez wracania.',
    stop_ids: [
      'mna_s04_chalchiuhtlicue',
      'mna_s04_disco_muerte',
      'mna_s05_atlante_tula',
      'mna_s06_piedra_sol',
      'mna_s06_coatlicue',
      'mna_s06_coyolxauhqui',
      'mna_s08_cabeza_colosal_6',
      'mna_s09_mascara_pakal',
    ],
  },
  {
    id: 'visita-relampago',
    name: 'Visita relámpago',
    name_en: 'Lightning visit',
    name_fr: 'Visite éclair',
    name_pl: 'Błyskawiczna wizyta',
    duration: '25 min',
    description: 'Si tienes poco tiempo: cuatro piezas que no te puedes perder.',
    description_en: 'Short on time? Four pieces you cannot miss.',
    description_fr: 'Peu de temps ? Quatre pièces à ne pas manquer.',
    description_pl: 'Mało czasu? Cztery dzieła, których nie możesz ominąć.',
    stop_ids: [
      'mna_s04_disco_muerte',
      'mna_s06_piedra_sol',
      'mna_s06_coatlicue',
      'mna_s09_mascara_pakal',
    ],
  },
  {
    id: 'ruta-familiar',
    name: 'Para ir con niños',
    name_en: 'For visiting with kids',
    name_fr: 'En famille avec des enfants',
    name_pl: 'Z dziećmi',
    duration: '35 min',
    description: 'Un mamut, una acróbata de barro, caritas que se ríen y perros de tumba: piezas para mirar y preguntar en familia.',
    description_en: 'A mammoth, a clay acrobat, smiling little faces and tomb dogs: pieces to look at and ask questions about as a family.',
    description_fr: 'Un mammouth, une acrobate en terre cuite, des petits visages souriants et des chiens funéraires : des pièces à regarder et à commenter en famille.',
    description_pl: 'Mamut, gliniany akrobata, uśmiechnięte buźki i grobowe psy: dzieła do oglądania i wspólnego zadawania pytań.',
    stop_ids: [
      'mna_s00_el_paraguas',
      'mna_s01_lucy_afarensis',
      'mna_s02_mamut_iztapan',
      'mna_s03_acrobata_tlatilco',
      'mna_s08_carita_sonriente',
      'mna_s10_perros_colima',
    ],
  },
  {
    id: 'ruta-tumbas',
    name: 'Tumbas y tesoros',
    name_en: 'Tombs and treasures',
    name_fr: 'Tombes et trésors',
    name_pl: 'Groby i skarby',
    duration: '40 min',
    description: 'Cómo despedían a sus muertos los zapotecos, los mixtecos, los mayas y los pueblos del Occidente.',
    description_en: 'How the Zapotecs, the Mixtecs, the Maya and the peoples of West Mexico said goodbye to their dead.',
    description_fr: 'Comment les Zapotèques, les Mixtèques, les Mayas et les peuples de l’Occident disaient adieu à leurs morts.',
    description_pl: 'Jak Zapotekowie, Mikstekowie, Majowie i ludy Zachodu żegnali swoich zmarłych.',
    stop_ids: [
      'mna_s07_tumba_104',
      'mna_s07_pectoral_oro_tumba7',
      'mna_s07_craneo_turquesa',
      'mna_s07_copa_cristal_roca',
      'mna_s09_mascara_pakal',
      'mna_s09_cripta_pakal',
      'mna_s10_tumba_tiro',
    ],
  },
  {
    id: 'ruta-mexica',
    name: 'La Sala Mexica a fondo',
    name_en: 'The Mexica Hall in depth',
    name_fr: 'La salle Mexica en détail',
    name_pl: 'Sala Mexików w szczegółach',
    duration: '40 min',
    description: 'Siete monumentos para entender cómo veían los mexicas el Sol, la tierra y la guerra.',
    description_en: 'Seven monuments to understand how the Mexica saw the Sun, the earth and war.',
    description_fr: 'Sept monuments pour comprendre comment les Mexicas voyaient le Soleil, la terre et la guerre.',
    description_pl: 'Siedem monumentów, które pokazują, jak Mexikowie widzieli Słońce, ziemię i wojnę.',
    stop_ids: [
      'mna_s06_piedra_sol',
      'mna_s06_coatlicue',
      'mna_s06_tizoc',
      'mna_s06_piedra_arzobispado',
      'mna_s06_coyolxauhqui',
      'mna_s06_teocalli_guerra_sagrada',
      'mna_s06_ocelotl_cuauhxicalli',
    ],
  },
];
// ============================================================================

const DATA_DIR = path.resolve(process.cwd(), 'public/data');
const IMG_DIR = path.resolve(process.cwd(), 'public/images/pieces');
const AUDIO_DIR = path.resolve(process.cwd(), 'public/audio');
const AUDIO_MANIFEST = path.join(AUDIO_DIR, 'manifest.json');

// Idiomas con columnas opcionales de traducción (p. ej. guion_corto_en). Si la columna no existe o la celda va vacía,
// la app muestra el texto en español. No se inventa ninguna traducción.
const TRANSLATION_LANGS = ['en', 'fr', 'pl', 'ru', 'ja'];
const PIECE_TEXT_FIELDS = ['titulo', 'frase_gancho', 'puente_narrativo', 'como_llegar', 'guion_corto', 'guion_largo'];
const ROOM_TEXT_FIELDS = ['nombre_oficial', 'frase_gancho', 'introduccion_narrativa', 'etiqueta'];

/** Lee un CSV completo (respeta comillas, comas y saltos de línea dentro de una celda). */
export function parseCsv(input) {
  const text = String(input).replace(/^﻿/, '');
  const rows = [];
  let row = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = false; }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(cur); cur = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); cur = '';
      rows.push(row); row = [];
    } else {
      cur += c;
    }
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

/** Convierte filas de CSV en objetos usando la primera fila como nombres de columna. */
export function toObjects(rows) {
  if (!rows.length) return { headers: [], items: [] };
  const headers = rows[0].map((h) => h.trim());
  const items = [];
  for (let r = 1; r < rows.length; r++) {
    const values = rows[r];
    if (values.every((v) => !String(v).trim())) continue; // fila vacía
    const obj = {};
    headers.forEach((h, idx) => { if (h) obj[h] = String(values[idx] ?? '').trim(); });
    items.push(obj);
  }
  return { headers, items };
}

async function getText(url) {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      lastErr = e;
      if (attempt < 3) await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
  throw lastErr;
}

/** Descarga una pestaña y comprueba que tenga las columnas obligatorias. */
async function loadTab(kind) {
  if (process.env.SYNC_LOCAL_DIR) {
    // Solo para pruebas: lee un CSV local en lugar de Google. Las pestañas de Teotihuacán son opcionales aquí.
    const file = path.join(process.env.SYNC_LOCAL_DIR, `${kind}.csv`);
    if (kind.startsWith('teo_') && !fs.existsSync(file)) return null;
    const parsed = toObjects(parseCsv(fs.readFileSync(file, 'utf-8')));
    return checkColumns(kind, file, parsed);
  }
  if (FUENTE_NUEVA) {
    const [siteId, tab] = KIND_SITE[kind];
    return leerPestanaNueva(siteId, tab, kind);
  }
  const problems = [];
  for (const name of TAB_NAMES[kind]) {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`;
    try {
      const parsed = toObjects(parseCsv(await getText(url)));
      const missing = REQUIRED[kind].filter((c) => !parsed.headers.includes(c));
      if (!missing.length) return parsed;
      problems.push(`pestaña "${name}": faltan las columnas ${missing.join(', ')}`);
    } catch (e) {
      problems.push(`pestaña "${name}": no se pudo leer (${e.message})`);
    }
  }
  throw new Error(
    `No pude leer la pestaña de ${kind}.\n  - ${problems.join('\n  - ')}\n` +
    `  Revisa: (1) que el Sheets siga compartido como "cualquiera con el enlace puede ver", ` +
    `(2) que no hayas cambiado el nombre de la pestaña ni los encabezados de las columnas.`
  );
}

function checkColumns(kind, label, parsed) {
  const missing = REQUIRED[kind].filter((c) => !parsed.headers.includes(c));
  if (missing.length) throw new Error(`En ${label} faltan las columnas: ${missing.join(', ')}`);
  return parsed;
}

const num = (v, fallback) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
};

const pisoDeNumero = (n) => (n >= 12 ? 'PA' : 'PB');

/** Copia las columnas de traducción que existan y no estén vacías: campo_en, campo_fr, etc. */
function translatedFields(row, fields) {
  const out = {};
  for (const lang of TRANSLATION_LANGS) {
    for (const f of fields) {
      const v = row[`${f}_${lang}`];
      if (v && String(v).trim()) out[`${f}_${lang}`] = String(v).trim();
    }
  }
  return out;
}

const parseRetos = (v) => (v ? v.split('|').map((x) => x.trim()).filter(Boolean) : []);

function parseEspecificaciones(v) {
  const out = {};
  if (v) {
    v.split('|').forEach((item) => {
      const [k, ...rest] = item.split(':');
      if (k && rest.length) out[k.trim()] = rest.join(':').trim();
    });
  }
  return out;
}

function parseFaq(v) {
  if (v && v.includes('|')) {
    const [pregunta, ...resto] = v.split('|');
    return { pregunta: pregunta.trim(), respuesta: resto.join('|').trim() };
  }
  return null;
}

/** Traducciones de piezas, incluidas las columnas con estructura (retos, especificaciones, faq). */
function translatedPieceFields(p) {
  const out = translatedFields(p, PIECE_TEXT_FIELDS);
  for (const lang of TRANSLATION_LANGS) {
    const retos = parseRetos(p[`retos_observacion_${lang}`]);
    if (retos.length) out[`retos_observacion_${lang}`] = retos;
    const esp = parseEspecificaciones(p[`especificaciones_${lang}`]);
    if (Object.keys(esp).length) out[`especificaciones_${lang}`] = esp;
    const faq = parseFaq(p[`faq_mito_${lang}`]);
    if (faq) out[`faq_mito_${lang}`] = faq;
  }
  return out;
}

/**
 * opts.zones = true (Teotihuacán): es un sitio al aire libre sin pisos. Todo va en "PB" y cada zona se
 * llama "Zona N" (o lo que diga la columna `etiqueta` del Sheets).
 */
function buildRooms(items, opts = {}) {
  const rooms = items
    .filter((r) => r.room_id)
    .map((r) => {
      const n = parseInt(r.numero_oficial, 10);
      const piso = opts.zones ? 'PB' : r.piso || (Number.isFinite(n) ? pisoDeNumero(n) : 'PB');
      const etiquetas = {};
      if (opts.zones && Number.isFinite(n)) {
        for (const [lang, word] of Object.entries(TEO_ZONE_LABEL)) etiquetas[lang === 'es' ? 'etiqueta' : `etiqueta_${lang}`] = `${word} ${n}`;
      }
      return {
        room_id: r.room_id,
        numero_oficial: r.numero_oficial,
        nombre_oficial: r.nombre_oficial,
        piso,
        ala: r.ala || '',
        frase_gancho: r.frase_gancho || '',
        introduccion_narrativa: r.introduccion_narrativa || '',
        svg_id: r.svg_id || '',
        // Opcional: texto corto para identificar la sala, p. ej. "Eje 1". Si va vacío, la app usa "Sala NN".
        ...etiquetas,
        ...(r.etiqueta ? { etiqueta: r.etiqueta } : {}),
        aliases: [r.room_id, `sala-${String(r.numero_oficial).padStart(2, '0')}`],
        ...translatedFields(r, ROOM_TEXT_FIELDS),
      };
    });
  rooms.sort((a, b) => (parseInt(a.numero_oficial, 10) || 0) - (parseInt(b.numero_oficial, 10) || 0));
  return rooms;
}

/** lat y lng de la pieza (columnas opcionales). Solo salen si son números dentro de México. */
/** Sitios con mapa real sin internet (scripts/mapas-en-vivo.json): se agrega live_map a su manifiesto. */
const MAPAS_EN_VIVO = (() => {
  try {
    return JSON.parse(fs.readFileSync(new URL('./mapas-en-vivo.json', import.meta.url), 'utf-8'));
  } catch {
    return {};
  }
})();

function coordenadas(p) {
  const lat = parseFloat(String(p.lat ?? '').replace(',', '.'));
  const lng = parseFloat(String(p.lng ?? '').replace(',', '.'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return {};
  if (lat < 14 || lat > 33 || lng < -119 || lng > -86) return {};
  return { lat, lng };
}

function buildPieces(items, opts = {}) {
  return items
    .filter((p) => p.piece_id)
    .map((p) => {
      const retos = parseRetos(p.retos_observacion);
      const especificaciones = parseEspecificaciones(p.especificaciones);
      const faq = parseFaq(p.faq_mito);

      // Decisión de producto: ninguna pieza es gratis (la columna is_free del Sheets se ignora mientras PIEZAS_GRATIS sea false)
      const isFree = PIEZAS_GRATIS && String(p.is_free || '').trim().toUpperCase() === 'TRUE';
      const image = p.image_filename ? p.image_filename.trim().replace(/^.*[\\/]/, '') : '';

      return {
        id: p.piece_id,
        piece_id: p.piece_id,
        poi_id: p.piece_id,
        room_id: p.room_id,
        roomId: p.room_id,
        piso: opts.zones ? 'PB' : p.piso || '',
        orden_sugerido: num(p.orden_sugerido, 1),
        // 1 = imprescindible, 2 = muy recomendable, 3 = complementaria. La usa «Armar a tu medida» para elegir qué entra primero.
        prioridad: Math.min(3, Math.max(1, Math.round(num(p.prioridad, 3)))),
        titulo: p.titulo,
        title: p.titulo,
        frase_gancho: p.frase_gancho || '',
        puente_narrativo: p.puente_narrativo || '',
        // Cómo llegar a esta parada: texto a pie, desde qué parada (vacío = desde la entrada o punto de inicio) y coordenadas para abrir el mapa
        como_llegar: (p.como_llegar || '').trim(),
        como_llegar_desde: (p.como_llegar_desde || '').trim(),
        lugar_mapa: (p.lugar_mapa || '').trim(),
        ...coordenadas(p),
        guion_corto: p.guion_corto,
        guion_largo: p.guion_largo,
        retos_observacion: retos,
        especificaciones,
        faq_mito: faq,
        map_x: num(p.map_x, 50),
        map_y: num(p.map_y, 50),
        image_filename: image,
        // Columnas opcionales de verificación (si no existen en el Sheets, quedan vacías)
        numero_catalogo: (p.numero_catalogo || '').trim(),
        fuente: (p.fuente || '').trim(),
        verificado: String(p.verificado || '').trim().toUpperCase() === 'TRUE',
        // Crédito de la foto (opcional). Las fotos con licencia CC BY / CC BY-SA exigen mostrar autor y licencia.
        foto_autor: (p.foto_autor || '').trim(),
        foto_licencia: (p.foto_licencia || '').trim(),
        foto_url: (p.foto_url || '').trim(),
        is_free: isFree,
        is_premium: !isFree,
        // Traducciones opcionales (columnas titulo_en, guion_corto_en, etc.). Solo aparecen si hay texto.
        ...translatedPieceFields(p),
      };
    });
}

/**
 * Une los MP3 generados (public/audio/manifest.json; los archivos están en R2) con las piezas.
 * Un MP3 solo se usa si su texto sigue siendo igual al del Sheets; si no, la app usa la voz del teléfono.
 */
function attachAudio(pieces, warn) {
  if (!fs.existsSync(AUDIO_MANIFEST)) return 0;
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(AUDIO_MANIFEST, 'utf-8'));
  } catch (e) {
    warn('El archivo public/audio/manifest.json no se pudo leer (no se usará ningún MP3)', e.message);
    return 0;
  }
  const byId = new Map(pieces.map((p) => [p.piece_id, p]));
  let attached = 0;
  for (const lang of AUDIO_LANGS) {
    for (const [pieceId, entry] of Object.entries(manifest.items?.[lang] || {})) {
      const piece = byId.get(pieceId);
      if (!piece) {
        warn('Audios de piezas que ya no existen en el Sheets', `${lang}/${pieceId}`);
        continue;
      }
      for (const mode of MODES) {
        const e = entry[mode];
        if (!e) continue;
        if (e.hash !== textHash(scriptFor(piece, lang, mode))) {
          warn('Audios desactualizados: el texto cambió y el MP3 ya no coincide (se usa la voz del teléfono hasta regenerarlo)', `${lang}/${pieceId} ${mode}`);
          continue;
        }
        if (Boolean(e.remote) === Boolean(piece.is_free)) {
          warn('Audios cuyo tipo (gratis / de pago) ya no coincide con la pieza: vuelve a generarlos', `${lang}/${pieceId} ${mode}`);
          continue;
        }
        piece.audio ||= {};
        piece.audio[lang] ||= {};
        piece.audio[lang][mode] = {
          // Todos los MP3 viven en R2: libre/<idioma>/... (piezas gratis, sin clave) o pago/<idioma>/... (con pase)
          path: `${e.remote ? 'pago' : 'libre'}/${e.file}`,
          premium: Boolean(e.remote),
          ...(e.seconds ? { seconds: e.seconds } : {}),
        };
        attached++;
      }
    }
  }
  return attached;
}

/**
 * Seguridad del contenido de pago: un MP3 de una pieza de pago NUNCA debe estar dentro de public/audio
 * (todo lo que está ahí se publica con el sitio y cualquiera podría bajarlo sin pagar).
 */
function findPremiumAudioLeaks(pieces) {
  if (!fs.existsSync(AUDIO_DIR)) return [];
  const premiumIds = new Set(pieces.filter((p) => !p.is_free).map((p) => p.piece_id));
  const leaks = [];
  // Se revisa TODO lo que hay dentro de public/audio (subcarpetas incluidas y cualquier extensión de audio),
  // no solo la ruta esperada <idioma>/<pieza>_<modo>.mp3.
  const walk = (dir, rel) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), relPath);
        continue;
      }
      const m = entry.name.match(/^(.+)\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|weba|webm)$/i);
      if (!m) continue;
      const stem = m[1];
      if (premiumIds.has(stem) || premiumIds.has(stem.replace(/_(corto|largo)$/, ''))) leaks.push(relPath);
    }
  };
  walk(AUDIO_DIR, '');
  return leaks;
}

/** Revisa los datos. Los errores DETIENEN la publicación; los avisos solo se muestran. */
function validate(rooms, pieces, opts = {}) {
  const errors = [];
  const warnings = {};
  const warn = (kind, msg) => { (warnings[kind] ||= []).push(msg); };

  const leaks = findPremiumAudioLeaks(pieces);
  if (leaks.length) {
    errors.push(
      `Hay audios de piezas DE PAGO dentro de public/audio (se publicarían gratis): ${leaks.slice(0, 5).join(', ')}${leaks.length > 5 ? ` y ${leaks.length - 5} más` : ''}. ` +
        'Corre: node scripts/generar-audio.mjs --reubicar'
    );
  }

  const sitio = opts.label ? ` (${opts.label})` : '';
  if (pieces.length < MIN_PIEZAS) {
    errors.push(`Solo se leyeron ${pieces.length} piezas${sitio} (mínimo esperado: ${MIN_PIEZAS}). Parece una lectura incompleta.`);
  }
  if (!rooms.length) errors.push(`No se leyó ninguna sala${sitio}.`);

  const seen = new Map();
  for (const p of pieces) {
    seen.set(p.piece_id, (seen.get(p.piece_id) || 0) + 1);
  }
  for (const [id, n] of seen) if (n > 1) errors.push(`piece_id repetido (${n} veces): ${id}`);

  const roomIds = new Set(rooms.map((r) => r.room_id));
  const pieceIds = new Set(pieces.map((p) => p.piece_id));
  const hasImgDir = fs.existsSync(IMG_DIR);
  for (const p of pieces) {
    // Enlaces entre piezas: [texto](piece_id) en los guiones (y sus traducciones)
    for (const key of ['guion_corto', 'guion_largo']) {
      for (const field of [key, ...TRANSLATION_LANGS.map((l) => `${key}_${l}`)]) {
        const text = p[field];
        if (!text) continue;
        for (const id of new Set(linkIds(text))) {
          if (id === p.piece_id) warn('Enlaces que apuntan a la propia pieza', `${p.piece_id} (${field})`);
          else if (!pieceIds.has(id)) warn('Enlaces a piezas que NO existen en el Sheets (se verán como texto normal)', `${p.piece_id} (${field}) → ${id}`);
        }
        if (hasBrokenLink(text)) warn('Enlaces mal escritos (debe ser [texto](piece_id), sin espacios)', `${p.piece_id} (${field})`);
      }
    }
    if (!roomIds.has(p.room_id)) warn(`Piezas cuya sala NO existe en ${opts.label === 'Teotihuacán' ? 'TEO_SALAS' : 'TRABAJO_SALAS'} (no se verán en ninguna sala)`, `${p.piece_id} → "${p.room_id}"`);
    if (!p.guion_corto) warn('Piezas sin guion_corto', p.piece_id);
    if (!p.guion_largo) warn('Piezas sin guion_largo', p.piece_id);
    if (/\.pdf\]|<br|\*\*/i.test(`${p.guion_corto} ${p.guion_largo} ${p.frase_gancho}`)) warn('Textos con restos de formato (marcas [n.pdf], <br>, **)', p.piece_id);
    if (!opts.sinCoordenadas && p.map_x === 50 && p.map_y === 50) warn('Piezas con coordenadas 50/50 (posición sin definir en el mapa)', p.piece_id);
    if (p.image_filename && hasImgDir) {
      const base = p.image_filename.replace(/\.\w+$/, '');
      const ok = [p.image_filename, `${base}.webp`, `${base}.png`].some((f) => fs.existsSync(path.join(IMG_DIR, f)));
      if (!ok) warn('Piezas cuya foto NO existe en public/images/pieces', `${p.piece_id} → ${p.image_filename}`);
    }
  }
  const sinFoto = pieces.filter((p) => !p.image_filename).length;
  return { errors, warnings, sinFoto };
}

function buildRoutes(pieces, rooms) {
  const byId = new Map(pieces.map((p) => [p.piece_id, p]));
  const roomName = new Map(rooms.map((r) => [r.room_id, r.nombre_oficial]));
  return ROUTES.map((route) => ({
    id: route.id,
    name: route.name,
    name_en: route.name_en,
    name_fr: route.name_fr,
    name_pl: route.name_pl,
    duration: route.duration,
    description: route.description,
    description_en: route.description_en,
    description_fr: route.description_fr,
    description_pl: route.description_pl,
    stops: route.stop_ids
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((p) => ({
        id: p.piece_id,
        piece_id: p.piece_id,
        poi_id: p.piece_id,
        title: p.titulo,
        is_premium: !p.is_free,
        estimated_minutes: 5,
        thumbnail: p.image_filename,
        file: 'data/pieces.json',
        ranking: p.is_free ? 1 : 2,
        room_zone: roomName.get(p.room_id) || '',
        room_id: p.room_id,
        map_coords: { x: p.map_x, y: p.map_y },
        tags: ['arqueologia', 'mna'],
      })),
    missing_ids: route.stop_ids.filter((id) => !byId.has(id)),
  }));
}

/**
 * Las dos rutas de Teotihuacán salen de la columna `rutas` de TEO_PIEZAS (express|completa).
 * Orden: zona (numero_oficial) y luego orden_sugerido; si empatan, el orden de las filas del Sheets.
 */
function buildTeoRoutes(pieces, rooms, rutasById, warn) {
  const roomNum = new Map(rooms.map((r) => [r.room_id, parseInt(r.numero_oficial, 10) || 0]));
  const roomName = new Map(rooms.map((r) => [r.room_id, r.nombre_oficial]));
  const known = new Set(TEO_ROUTES.map((r) => r.key));
  for (const [id, list] of rutasById) {
    for (const k of list) if (!known.has(k)) warn('Teotihuacán: valores desconocidos en la columna rutas (solo se usan express y completa)', `${id} → "${k}"`);
  }
  return TEO_ROUTES.map(({ key, ...route }) => {
    const stops = pieces
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => (rutasById.get(p.piece_id) || []).includes(key))
      .sort((a, b) =>
        (roomNum.get(a.p.room_id) || 0) - (roomNum.get(b.p.room_id) || 0) ||
        (a.p.orden_sugerido || 99) - (b.p.orden_sugerido || 99) ||
        a.i - b.i
      )
      .map(({ p }) => ({
        id: p.piece_id,
        piece_id: p.piece_id,
        poi_id: p.piece_id,
        title: p.titulo,
        is_premium: !p.is_free,
        estimated_minutes: 5,
        thumbnail: p.image_filename,
        file: 'data/teotihuacan/pieces.json',
        ranking: p.is_free ? 1 : 2,
        room_zone: roomName.get(p.room_id) || '',
        room_id: p.room_id,
        map_coords: { x: p.map_x, y: p.map_y },
        tags: ['arqueologia', 'teotihuacan'],
      }));
    return { ...route, stops };
  });
}

export async function sync() {
  console.log('🔄 Leyendo TRABAJO_SALAS…');
  const salas = await loadTab('salas');
  console.log('🔄 Leyendo TRABAJO_PIEZAS…');
  const piezas = await loadTab('piezas');

  // Lista de sitios de la hoja CONTROL (si se usa la fuente nueva). Un sitio con publicar distinto de SI no sale en la app.
  const sitiosCtl = FUENTE_NUEVA ? await cargarSitios({ estricto: true }) : [];
  const teoCtl = sitiosCtl.find((x) => x.site_id === 'teotihuacan');
  const teoActivo = !FUENTE_NUEVA || (teoCtl && estaPublicado(teoCtl));
  if (!teoActivo) console.log('ℹ️  Teotihuacán está en publicar=NO en CONTROL: no se publica.');
  console.log('🔄 Leyendo salas y piezas de Teotihuacán…');
  const teoSalas = teoActivo ? await loadTab('teo_salas') : null;
  const teoPiezas = teoActivo ? await loadTab('teo_piezas') : null;

  // Otros sitios de CONTROL (publicar = SI) que no tienen lógica propia: salen con sus zonas, piezas y recorridos (pestaña RUTAS).
  // Con SYNC_PREVIEW=1 también entran los que aún no están publicados (status "preview": solo se ven con ?preview en la app).
  const PREVIEW = process.env.SYNC_PREVIEW === '1';
  // «Antes de ir» (pestaña ANTES_DE_IR del Sheet de cada sitio). Si la pestaña no existe, el sitio sale sin esa sección.
  const antesDeIrDe = async (sitio) => {
    if (!sitio || !sitio.sheet_id) return [];
    try { return leerAntesDeIr(await leerPestana(sitio.sheet_id, 'ANTES_DE_IR')); } catch { return []; }
  };
  const extras = [];
  for (const s of sitiosCtl) {
    if (s.site_id === 'mna' || s.site_id === 'teotihuacan') continue;
    const publicado = estaPublicado(s);
    if (!publicado && !PREVIEW) continue;
    console.log(`🔄 Leyendo ${s.site_id}${publicado ? '' : ' (vista previa, sin publicar)'}…`);
    const sa = await leerPestanaNueva(s.site_id, 'SALAS', 'salas');
    const pi = await leerPestanaNueva(s.site_id, 'PIEZAS', 'piezas');
    let filasRutas = [];
    try { filasRutas = await leerPestana(s.sheet_id, 'RUTAS'); } catch { /* sin pestaña RUTAS: el sitio sale sin recorridos */ }
    const antesDeIr = await antesDeIrDe(s);
    extras.push({
      site: s,
      preview: !publicado,
      rooms: buildRooms(sa.items, { zones: true }),
      pieces: buildPieces(pi.items, { zones: true }),
      rutasDefs: leerDefinicionesRutas(filasRutas),
      rutasPorId: new Map(pi.items.filter((p) => p.piece_id).map((p) => [p.piece_id, partirRutas(p.rutas)])),
      antesDeIr,
    });
  }

  const rooms = buildRooms(salas.items);
  const pieces = buildPieces(piezas.items);
  const teo = teoSalas && teoPiezas
    ? {
        rooms: buildRooms(teoSalas.items, { zones: true }),
        pieces: buildPieces(teoPiezas.items, { zones: true }),
        rutas: new Map(
          teoPiezas.items.filter((p) => p.piece_id).map((p) => [p.piece_id, String(p.rutas || '').split('|').map((x) => x.trim().toLowerCase()).filter(Boolean)])
        ),
      }
    : null;
  const todasSalas = [...rooms, ...(teo?.rooms || []), ...extras.flatMap((e) => e.rooms)];
  const todasPiezas = [...pieces, ...(teo?.pieces || []), ...extras.flatMap((e) => e.pieces)];

  // Traducciones hechas con scripts/traducir.mjs: solo valen si el texto en español no cambió; una celda del Sheets manda sobre ellas.
  const guardadas = applyStoredTranslations(process.cwd(), todasPiezas, todasSalas);
  for (const [lang, r] of Object.entries(guardadas)) {
    console.log(`🌐 Traducciones guardadas (${lang}): ${r.applied} textos unidos${r.stale ? `, ${r.stale} ignorados porque el español cambió` : ''}.`);
  }

  const { errors, warnings, sinFoto } = validate(rooms, pieces, { label: 'MNA' });
  let teoSinFoto = 0;
  if (teo) {
    const v = validate(teo.rooms, teo.pieces, { label: 'Teotihuacán', sinCoordenadas: true });
    errors.push(...v.errors);
    teoSinFoto = v.sinFoto;
    for (const [kind, list] of Object.entries(v.warnings)) (warnings[kind] ||= []).push(...list.map((m) => `[Teotihuacán] ${m}`));
    // Ningún id puede repetirse entre sitios (los textos de pago se buscan por piece_id)
    const mnaIds = new Set(pieces.map((p) => p.piece_id));
    for (const p of teo.pieces) if (mnaIds.has(p.piece_id)) errors.push(`piece_id repetido entre MNA y Teotihuacán: ${p.piece_id}`);
    const mnaRooms = new Set(rooms.map((r) => r.room_id));
    for (const r of teo.rooms) if (mnaRooms.has(r.room_id)) errors.push(`room_id repetido entre MNA y Teotihuacán: ${r.room_id}`);
  }
  // Otros sitios: se validan igual y ningún id puede repetirse entre sitios
  const idsVistos = new Set([...pieces, ...(teo?.pieces || [])].map((p) => p.piece_id));
  const salasVistas = new Set([...rooms, ...(teo?.rooms || [])].map((r) => r.room_id));
  for (const e of extras) {
    const v = validate(e.rooms, e.pieces, { label: e.site.nombre || e.site.site_id, sinCoordenadas: true });
    errors.push(...v.errors);
    for (const [kind, list] of Object.entries(v.warnings)) (warnings[kind] ||= []).push(...list.map((m) => `[${e.site.site_id}] ${m}`));
    for (const p of e.pieces) { if (idsVistos.has(p.piece_id)) errors.push(`piece_id repetido entre sitios: ${p.piece_id}`); idsVistos.add(p.piece_id); }
    for (const r of e.rooms) { if (salasVistas.has(r.room_id)) errors.push(`room_id repetido entre sitios: ${r.room_id}`); salasVistas.add(r.room_id); }
    if (e.site.prefijo) for (const p of e.pieces) if (!String(p.piece_id).startsWith(e.site.prefijo)) errors.push(`[${e.site.site_id}] la pieza ${p.piece_id} no empieza con el prefijo ${e.site.prefijo}`);
  }
  const audiosUnidos = attachAudio(todasPiezas, (kind, msg) => { (warnings[kind] ||= []).push(msg); });

  for (const [kind, list] of Object.entries(warnings)) {
    console.warn(`⚠️  ${kind}: ${list.length}`);
    list.slice(0, 8).forEach((m) => console.warn(`     - ${m}`));
    if (list.length > 8) console.warn(`     … y ${list.length - 8} más`);
  }
  if (errors.length) {
    throw new Error(`Se encontraron errores en el Sheets. No se publicó nada.\n  - ${errors.join('\n  - ')}`);
  }

  // Nombre, duración y descripciones de los recorridos del MNA y de Teotihuacán: opcionales, de la pestaña RUTAS de su Sheet
  const defsRutasDe = async (siteId) => {
    const s = sitiosCtl.find((x) => x.site_id === siteId);
    if (!s || !s.sheet_id) return [];
    try { return leerDefinicionesRutas(await leerPestana(s.sheet_id, 'RUTAS')); } catch { return []; }
  };
  const aplicarRutas = (rutas, defs, siteId, claveDe) => {
    if (!defs.length) return rutas;
    const r = aplicarDefiniciones(rutas, defs, claveDe);
    if (r.sinUsar.length) console.warn(`⚠️  ${siteId}/RUTAS: estas rutas no existen en la app y se ignoran: ${r.sinUsar.join(', ')}`);
    return r.rutas;
  };
  // Recorridos del MNA: si el Sheet trae la columna `rutas` en PIEZAS y las definiciones en RUTAS, salen de ahí
  // (se editan sin tocar código). Si no, se usan los recorridos fijos de este archivo (ROUTES).
  const defsMna = await defsRutasDe('mna');
  const antesMna = await antesDeIrDe(sitiosCtl.find((x) => x.site_id === 'mna'));
  const antesTeo = teo ? await antesDeIrDe(sitiosCtl.find((x) => x.site_id === 'teotihuacan')) : [];
  const rutasMna = new Map(piezas.items.filter((p) => p.piece_id).map((p) => [p.piece_id, partirRutas(p.rutas)]));
  const clavesUsadasMna = new Set([...rutasMna.values()].flat());
  const defsMnaUsadas = defsMna.filter((d) => clavesUsadasMna.has(d.key));
  const mnaDesdeSheet = defsMnaUsadas.length > 0;
  const routes = mnaDesdeSheet
    ? construirRutasSitio('mna', pieces, rooms, defsMnaUsadas, rutasMna, (kind, msg) => console.warn(`⚠️  ${kind}: ${msg}`))
    : aplicarRutas(buildRoutes(pieces, rooms), defsMna, 'mna');
  if (mnaDesdeSheet) console.log(`✅ MNA: ${routes.length} recorridos desde el Sheet: ${routes.map((r) => `${r.name} (${r.stops.length})`).join(', ')}.`);
  routes.forEach((r) => {
    if (r.missing_ids?.length) console.warn(`⚠️  Ruta "${r.name}": no existen en el Sheets estas piezas: ${r.missing_ids.join(', ')}`);
  });
  const teoWarnings = {};
  const teoRoutes = teo ? aplicarRutas(buildTeoRoutes(teo.pieces, teo.rooms, teo.rutas, (kind, msg) => { (teoWarnings[kind] ||= []).push(msg); }), await defsRutasDe('teotihuacan'), 'teotihuacan', (r) => r.id.replace(/^ruta-/, '')) : [];
  for (const [kind, list] of Object.entries(teoWarnings)) {
    console.warn(`⚠️  ${kind}: ${list.length}`);
    list.slice(0, 8).forEach((m) => console.warn(`     - ${m}`));
  }
  for (const r of teoRoutes) {
    if (!r.stops.length) throw new Error(`La ruta "${r.name}" de Teotihuacán quedó sin paradas. Revisa la columna rutas de TEO_PIEZAS (debe decir express y/o completa). No se publicó nada.`);
  }

  // ---- Todo validado: ahora sí se escribe ----
  const mnaDir = path.join(DATA_DIR, 'mna');
  fs.mkdirSync(mnaDir, { recursive: true });
  const write = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');

  // Los textos de pago NO van en los datos públicos: se guardan aparte (datos-privados/) y se suben a R2
  const publicPieces = pieces.map((piece) => splitPiece(piece).pub);
  writePrivate(process.cwd(), todasPiezas, console.log);

  write(path.join(DATA_DIR, 'rooms.json'), rooms);
  write(path.join(DATA_DIR, 'pieces.json'), publicPieces);
  write(path.join(mnaDir, 'rooms.json'), rooms);
  write(path.join(mnaDir, 'pieces.json'), publicPieces);

  const siteJsonPath = path.join(mnaDir, 'site.json');
  const mnaJsonPath = path.join(mnaDir, 'mna.json');
  if (fs.existsSync(siteJsonPath)) {
    const manifest = JSON.parse(fs.readFileSync(siteJsonPath, 'utf-8'));
    manifest.routes = routes.map(({ missing_ids, ...route }) => route);
    if (antesMna.length) manifest.before_visit = antesMna;
    else delete manifest.before_visit;
    write(siteJsonPath, manifest);
    write(mnaJsonPath, manifest);
    console.log('✅ Rutas sugeridas actualizadas en site.json y mna.json.');
  }

  if (teo) {
    const teoDir = path.join(DATA_DIR, 'teotihuacan');
    fs.mkdirSync(teoDir, { recursive: true });
    write(path.join(teoDir, 'rooms.json'), teo.rooms);
    write(path.join(teoDir, 'pieces.json'), teo.pieces.map((piece) => splitPiece(piece).pub));
    const teoManifestPath = path.join(teoDir, 'teotihuacan.json');
    if (fs.existsSync(teoManifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(teoManifestPath, 'utf-8'));
      manifest.routes = teoRoutes;
      if (antesTeo.length) manifest.before_visit = antesTeo;
      else delete manifest.before_visit;
      write(teoManifestPath, manifest);
    }
    console.log(`✅ Teotihuacán: ${teo.rooms.length} zonas, ${teo.pieces.length} piezas (${teo.pieces.length - teoSinFoto} con foto) y rutas: ${teoRoutes.map((r) => `${r.name} (${r.stops.length})`).join(', ')}.`);
  }

  const entradasSites = [];
  for (const e of extras) {
    const dir = path.join(DATA_DIR, e.site.site_id);
    fs.mkdirSync(dir, { recursive: true });
    const avisosRutas = {};
    const rutasSitio = construirRutasSitio(e.site.site_id, e.pieces, e.rooms, e.rutasDefs, e.rutasPorId, (kind, msg) => { (avisosRutas[kind] ||= []).push(msg); });
    for (const [kind, list] of Object.entries(avisosRutas)) { console.warn(`⚠️  ${kind}: ${list.length}`); list.slice(0, 8).forEach((m) => console.warn(`     - ${m}`)); }
    write(path.join(dir, 'rooms.json'), e.rooms);
    write(path.join(dir, 'pieces.json'), e.pieces.map((piece) => splitPiece(piece).pub));
    write(path.join(dir, `${e.site.site_id}.json`), manifiestoSitio(e.site, rutasSitio, MAPAS_EN_VIVO[e.site.site_id], e.antesDeIr));
    entradasSites.push({ site: e.site, entry: e });
    console.log(`✅ ${e.site.site_id}${e.preview ? ' (vista previa)' : ''}: ${e.rooms.length} zonas, ${e.pieces.length} piezas y recorridos: ${rutasSitio.map((r) => `${r.name} (${r.stops.length})`).join(', ') || 'ninguno'}.`);
  }
  if (entradasSites.length) {
    const sitesPath = path.join(DATA_DIR, 'sites.json');
    const actual = fs.existsSync(sitesPath) ? JSON.parse(fs.readFileSync(sitesPath, 'utf-8')) : [];
    const nuevas = entradasSites.map(({ site, entry }) => {
      const previa = actual.find((s) => String(s.id).toUpperCase() === site.site_id.toUpperCase()) || {};
      return entradaSitio(site, entry.rooms, entry.pieces, previa, { preview: entry.preview });
    });
    write(sitesPath, mezclarSites(actual, nuevas));
    console.log(`✅ sites.json: ${nuevas.map((n) => `${n.id} (${n.status})`).join(', ')}.`);
  }

  console.log(`✅ Sincronización exitosa: ${rooms.length} salas y ${pieces.length} piezas (${pieces.length - sinFoto} con foto, ${sinFoto} sin foto).`);
  const conTraduccion = TRANSLATION_LANGS
    .map((l) => [l, pieces.filter((p) => p[`guion_corto_${l}`]).length])
    .filter(([, n]) => n > 0)
    .map(([l, n]) => `${l}: ${n}`);
  if (conTraduccion.length) console.log(`🌐 Piezas con texto traducido → ${conTraduccion.join(', ')}`);
  if (audiosUnidos) console.log(`🔊 Audios MP3 unidos a las piezas: ${audiosUnidos}`);
}

// Solo se ejecuta cuando se corre directamente (npm run sync-data / npm run build)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  sync().catch((err) => {
    console.error('❌ No se pudo sincronizar con Google Sheets.\n' + (err && err.message ? err.message : err));
    process.exit(1);
  });
}
