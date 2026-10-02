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

// ===== CONFIGURACIÓN (lo único que normalmente se toca) =====================
const SPREADSHEET_ID = '1D6Tu8qLVchpsKqFLDF1poEvxOOJO600DLHv05-weOcY';

// Nombres de las pestañas. Se prueba en orden hasta encontrar la que tiene las columnas correctas.
const TAB_NAMES = {
  salas: ['📝 TRABAJO_SALAS', 'TRABAJO_SALAS'],
  piezas: ['📝 TRABAJO_PIEZAS', 'TRABAJO_PIEZAS'],
};

// Columnas que DEBEN existir (por nombre; el orden de las columnas no importa).
const REQUIRED = {
  salas: ['room_id', 'numero_oficial', 'nombre_oficial'],
  piezas: ['piece_id', 'room_id', 'titulo', 'guion_corto', 'guion_largo'],
};

// Si el Sheets trae menos piezas que esto, se considera una lectura incompleta y se aborta.
const MIN_PIEZAS = 20;

// Rutas sugeridas del MNA. Solo se usan piezas que existan en el Sheets (no se inventa nada).
// Las paradas van ordenadas por ala del museo (Exteriores, Norte, Centro, Sur) para no regresar sobre los pasos.
const ROUTES = [
  {
    id: 'ruta-monumental',
    name: 'Obras Maestras del MNA',
    duration: '45 min',
    description: 'Las piezas más famosas del museo, ordenadas para recorrer la planta baja de norte a sur sin regresar.',
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
    name: 'Visita Relámpago (Top Highlights)',
    duration: '25 min',
    description: 'Si tienes poco tiempo: cuatro piezas que no te puedes perder.',
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
    duration: '35 min',
    description: 'Un mamut, una acróbata de barro, caritas que se ríen y perros de tumba: piezas para mirar y preguntar en familia.',
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
    duration: '40 min',
    description: 'Cómo despedían a sus muertos los zapotecos, los mixtecos, los mayas y los pueblos del Occidente.',
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
    duration: '40 min',
    description: 'Siete monumentos para entender cómo veían los mexicas el Sol, la tierra y la guerra.',
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
const PIECE_TEXT_FIELDS = ['titulo', 'frase_gancho', 'puente_narrativo', 'guion_corto', 'guion_largo'];
const ROOM_TEXT_FIELDS = ['nombre_oficial', 'frase_gancho', 'introduccion_narrativa'];

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
    // Solo para pruebas: lee un CSV local en lugar de Google.
    const file = path.join(process.env.SYNC_LOCAL_DIR, `${kind}.csv`);
    const parsed = toObjects(parseCsv(fs.readFileSync(file, 'utf-8')));
    return checkColumns(kind, file, parsed);
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

function buildRooms(items) {
  const rooms = items
    .filter((r) => r.room_id)
    .map((r) => {
      const n = parseInt(r.numero_oficial, 10);
      const piso = r.piso || (Number.isFinite(n) ? pisoDeNumero(n) : 'PB');
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
        etiqueta: r.etiqueta || '',
        aliases: [r.room_id, `sala-${String(r.numero_oficial).padStart(2, '0')}`],
        ...translatedFields(r, ROOM_TEXT_FIELDS),
      };
    });
  rooms.sort((a, b) => (parseInt(a.numero_oficial, 10) || 0) - (parseInt(b.numero_oficial, 10) || 0));
  return rooms;
}

function buildPieces(items) {
  return items
    .filter((p) => p.piece_id)
    .map((p) => {
      const retos = parseRetos(p.retos_observacion);
      const especificaciones = parseEspecificaciones(p.especificaciones);
      const faq = parseFaq(p.faq_mito);

      const isFree = String(p.is_free || '').trim().toUpperCase() === 'TRUE';
      const image = p.image_filename ? p.image_filename.trim().replace(/^.*[\\/]/, '') : '';

      return {
        id: p.piece_id,
        piece_id: p.piece_id,
        poi_id: p.piece_id,
        room_id: p.room_id,
        roomId: p.room_id,
        piso: p.piso || '',
        orden_sugerido: num(p.orden_sugerido, 1),
        titulo: p.titulo,
        title: p.titulo,
        frase_gancho: p.frase_gancho || '',
        puente_narrativo: p.puente_narrativo || '',
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
 * Une los MP3 generados (public/audio/manifest.json) con las piezas.
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
        if (!e.remote && !fs.existsSync(path.join(AUDIO_DIR, e.file))) {
          warn('Audios en el manifiesto que no están en public/audio', e.file);
          continue;
        }
        if (Boolean(e.remote) === Boolean(piece.is_free)) {
          warn('Audios cuyo tipo (gratis / de pago) ya no coincide con la pieza: vuelve a generarlos', `${lang}/${pieceId} ${mode}`);
          continue;
        }
        piece.audio ||= {};
        piece.audio[lang] ||= {};
        piece.audio[lang][mode] = {
          path: e.remote ? e.file : `audio/${e.file}`,
          remote: Boolean(e.remote),
          ...(e.seconds ? { seconds: e.seconds } : {}),
        };
        attached++;
      }
    }
  }
  return attached;
}

/** Revisa los datos. Los errores DETIENEN la publicación; los avisos solo se muestran. */
function validate(rooms, pieces) {
  const errors = [];
  const warnings = {};
  const warn = (kind, msg) => { (warnings[kind] ||= []).push(msg); };

  if (pieces.length < MIN_PIEZAS) {
    errors.push(`Solo se leyeron ${pieces.length} piezas (mínimo esperado: ${MIN_PIEZAS}). Parece una lectura incompleta.`);
  }
  if (!rooms.length) errors.push('No se leyó ninguna sala.');

  const seen = new Map();
  for (const p of pieces) {
    seen.set(p.piece_id, (seen.get(p.piece_id) || 0) + 1);
  }
  for (const [id, n] of seen) if (n > 1) errors.push(`piece_id repetido (${n} veces): ${id}`);

  const roomIds = new Set(rooms.map((r) => r.room_id));
  const hasImgDir = fs.existsSync(IMG_DIR);
  for (const p of pieces) {
    if (!roomIds.has(p.room_id)) warn('Piezas cuya sala NO existe en TRABAJO_SALAS (no se verán en ninguna sala)', `${p.piece_id} → "${p.room_id}"`);
    if (!p.guion_corto) warn('Piezas sin guion_corto', p.piece_id);
    if (!p.guion_largo) warn('Piezas sin guion_largo', p.piece_id);
    if (/\.pdf\]|<br|\*\*/i.test(`${p.guion_corto} ${p.guion_largo} ${p.frase_gancho}`)) warn('Textos con restos de formato (marcas [n.pdf], <br>, **)', p.piece_id);
    if (p.map_x === 50 && p.map_y === 50) warn('Piezas con coordenadas 50/50 (posición sin definir en el mapa)', p.piece_id);
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
    duration: route.duration,
    description: route.description,
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

export async function sync() {
  console.log('🔄 Leyendo TRABAJO_SALAS…');
  const salas = await loadTab('salas');
  console.log('🔄 Leyendo TRABAJO_PIEZAS…');
  const piezas = await loadTab('piezas');

  const rooms = buildRooms(salas.items);
  const pieces = buildPieces(piezas.items);

  const { errors, warnings, sinFoto } = validate(rooms, pieces);
  const audiosUnidos = attachAudio(pieces, (kind, msg) => { (warnings[kind] ||= []).push(msg); });

  for (const [kind, list] of Object.entries(warnings)) {
    console.warn(`⚠️  ${kind}: ${list.length}`);
    list.slice(0, 8).forEach((m) => console.warn(`     - ${m}`));
    if (list.length > 8) console.warn(`     … y ${list.length - 8} más`);
  }
  if (errors.length) {
    throw new Error(`Se encontraron errores en el Sheets. No se publicó nada.\n  - ${errors.join('\n  - ')}`);
  }

  const routes = buildRoutes(pieces, rooms);
  routes.forEach((r) => {
    if (r.missing_ids.length) console.warn(`⚠️  Ruta "${r.name}": no existen en el Sheets estas piezas: ${r.missing_ids.join(', ')}`);
  });

  // ---- Todo validado: ahora sí se escribe ----
  const mnaDir = path.join(DATA_DIR, 'mna');
  fs.mkdirSync(mnaDir, { recursive: true });
  const write = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');

  write(path.join(DATA_DIR, 'rooms.json'), rooms);
  write(path.join(DATA_DIR, 'pieces.json'), pieces);
  write(path.join(mnaDir, 'rooms.json'), rooms);
  write(path.join(mnaDir, 'pieces.json'), pieces);

  const siteJsonPath = path.join(mnaDir, 'site.json');
  const mnaJsonPath = path.join(mnaDir, 'mna.json');
  if (fs.existsSync(siteJsonPath)) {
    const manifest = JSON.parse(fs.readFileSync(siteJsonPath, 'utf-8'));
    manifest.routes = routes.map(({ missing_ids, ...route }) => route);
    write(siteJsonPath, manifest);
    write(mnaJsonPath, manifest);
    console.log('✅ Rutas sugeridas actualizadas en site.json y mna.json.');
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
