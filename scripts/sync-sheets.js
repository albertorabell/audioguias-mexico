import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SHEET_ID = '1KFDO8EpkuU7FEa4qs05APvr7HHqLmqOPejBJcM__9tg';
const SALAS_TAB = '📝 TRABAJO_SALAS';
const PIEZAS_TAB = '📝 TRABAJO_PIEZAS';

const urlSalas = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SALAS_TAB)}`;
const urlPiezas = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(PIEZAS_TAB)}`;

/**
 * Robust RFC-4180 compliant CSV parser
 * Handles quotes, commas inside quotes, multi-line quoted fields, and escaped quotes ("")
 */
function parseCSV(text) {
  const lines = [];
  let row = [];
  let inQuotes = false;
  let curVal = '';

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"' && inQuotes && next === '"') {
      curVal += '"';
      i++; // Skip escaped quote
    } else if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      row.push(curVal);
      curVal = '';
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') {
        i++;
      }
      row.push(curVal);
      lines.push(row);
      row = [];
      curVal = '';
    } else {
      curVal += c;
    }
  }

  if (curVal || row.length > 0) {
    row.push(curVal);
    lines.push(row);
  }

  // Filter out completely empty trailing lines
  return lines.filter(r => r.some(cell => cell.trim() !== ''));
}

/**
 * Helper para obtener valor de celda buscando múltiples nombres de cabecera en minúsculas
 */
function getCell(row, headerMap, ...candidateKeys) {
  for (const k of candidateKeys) {
    const lowerKey = k.toLowerCase().trim();
    const idx = headerMap[lowerKey];
    if (idx !== undefined && row[idx] !== undefined) {
      return row[idx].trim();
    }
  }
  return '';
}

/**
 * Parsea retos de observación separados por ' | '
 */
function parseRetosObservacion(raw) {
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split('|')
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * Parsea especificaciones de 'Clave: Valor | Clave: Valor' a un objeto Record<string, string>
 */
function parseEspecificaciones(raw) {
  if (!raw || typeof raw !== 'string') return {};
  const result = {};
  raw.split('|').forEach(part => {
    const trimmed = part.trim();
    if (!trimmed) return;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx !== -1) {
      const key = trimmed.substring(0, colonIdx).trim();
      const val = trimmed.substring(colonIdx + 1).trim();
      if (key) result[key] = val;
    }
  });
  return result;
}

/**
 * Parsea faq_mito de '¿Pregunta? | Respuesta'
 */
function parseFaqMito(raw) {
  if (!raw || typeof raw !== 'string') return undefined;
  const parts = raw.split('|').map(s => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return {
      pregunta: parts[0],
      respuesta: parts.slice(1).join(' | ')
    };
  } else if (parts.length === 1) {
    return {
      pregunta: '¿Mito o realidad arqueológica?',
      respuesta: parts[0]
    };
  }
  return undefined;
}

/**
 * Coordenadas de mapa predefinidas para la arquitectura del MNA (Piso PB y PA)
 */
const ROOM_MAP_COORDS = {
  // Arqueología (Planta Baja / PB)
  'sala-vestibulo': { x: 80, y: 88 },
  'sala-introduccion_antropologia': { x: 80, y: 78 },
  'sala-poblamiento': { x: 80, y: 68 },
  'sala-preclasico': { x: 80, y: 58 },
  'sala-teotihuacan': { x: 80, y: 44 },
  'sala-tolteca': { x: 80, y: 30 },
  'sala-mexica': { x: 50, y: 15 },
  'sala-oaxaca': { x: 20, y: 30 },
  'sala-costa_del_golfo': { x: 20, y: 44 },
  'sala-maya': { x: 20, y: 58 },
  'sala-occidente': { x: 20, y: 72 },
  'sala-norte': { x: 20, y: 86 },

  // Etnografía (Planta Alta / PA)
  'sala-etno_pueblos_indigenas': { x: 80, y: 75 },
  'sala-origenes': { x: 80, y: 75 },
  'sala-gran_nayar': { x: 80, y: 62 },
  'sala-etno_purepecha': { x: 80, y: 48 },
  'sala-etno_otopames': { x: 80, y: 36 },
  'sala-etno_sierra_puebla': { x: 80, y: 24 },
  'sala-etno_nahuas': { x: 50, y: 15 },
  'sala-etno_oaxaca': { x: 20, y: 25 },
  'sala-etno_golfo_huasteca': { x: 20, y: 42 },
  'sala-etno_maya': { x: 20, y: 60 },
  'sala-etno_noroeste': { x: 20, y: 80 }
};

async function syncSheets() {
  console.log('🏛️ Iniciando sincronización con Google Sheets (Fase 2 - 16 Columnas)...');
  console.log(`📡 URL Salas: ${urlSalas}`);
  console.log(`📡 URL Piezas: ${urlPiezas}`);

  const [salasRes, piezasRes] = await Promise.all([
    fetch(urlSalas),
    fetch(urlPiezas)
  ]);

  if (!salasRes.ok) {
    throw new Error(`Error ${salasRes.status} al descargar pestaña de salas`);
  }
  if (!piezasRes.ok) {
    throw new Error(`Error ${piezasRes.status} al descargar pestaña de piezas`);
  }

  const salasCSV = await salasRes.text();
  const piezasCSV = await piezasRes.text();

  console.log('✅ Hojas CSV descargadas con éxito. Procesando registros...');

  const salasRows = parseCSV(salasCSV);
  const piezasRows = parseCSV(piezasCSV);

  const salasHeaders = salasRows[0];
  const salasHeaderMap = {};
  salasHeaders.forEach((h, i) => { salasHeaderMap[h.trim().toLowerCase()] = i; });

  const piezasHeaders = piezasRows[0];
  const piezasHeaderMap = {};
  piezasHeaders.forEach((h, i) => { piezasHeaderMap[h.trim().toLowerCase()] = i; });

  // 1. Procesar Salas con la interfaz Room de Fase 2
  const roomsMap = new Map();
  for (let i = 1; i < salasRows.length; i++) {
    const row = salasRows[i];
    const roomId = getCell(row, salasHeaderMap, 'room_id', 'id');
    if (!roomId) continue;

    const numeroOficial = getCell(row, salasHeaderMap, 'numero_oficial', 'num', 'numero') || `${i}`;
    const nombreOficial = getCell(row, salasHeaderMap, 'nombre_oficial', 'nombre_es', 'name') || roomId;

    let pisoRaw = getCell(row, salasHeaderMap, 'piso', 'floor').toUpperCase();
    const piso = (pisoRaw === 'PA' || pisoRaw === '2' || pisoRaw.includes('ALTA')) ? 'PA' : 'PB';

    const ala = getCell(row, salasHeaderMap, 'ala', 'wing') || (roomId.includes('mexica') ? 'cabecera' : 'norte');
    const fraseGancho = getCell(row, salasHeaderMap, 'frase_gancho', 'frase_gancho_es') || '';
    const introduccionNarrativa = getCell(row, salasHeaderMap, 'introduccion_narrativa', 'descripcion_corta_es', 'descripcion') || '';
    const svgId = getCell(row, salasHeaderMap, 'svg_id', 'map_svg_id') || roomId;

    const tagsRaw = getCell(row, salasHeaderMap, 'tags');
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : ['arqueologia', 'mna'];

    const roomObj = {
      room_id: roomId,
      numero_oficial: numeroOficial,
      nombre_oficial: nombreOficial,
      piso: piso,
      ala: ala,
      frase_gancho: fraseGancho,
      introduccion_narrativa: introduccionNarrativa,
      svg_id: svgId,

      // Campos de compatibilidad
      id: roomId,
      name: nombreOficial,
      culture: 'Mesoamérica',
      tags: tags,
      short_description: introduccionNarrativa || fraseGancho,
      floor: piso === 'PA' ? 2 : 1,
      featured_pieces: [],
      coords: ROOM_MAP_COORDS[roomId] || { x: 50, y: 50 },
      pieces_info: []
    };

    roomsMap.set(roomId, roomObj);
  }

  console.log(`📊 Salas procesadas: ${roomsMap.size}`);

  // 2. Procesar Piezas con la interfaz Piece de Fase 2 (Esquema de 16 Columnas)
  const totalPiecesList = [];
  const publicDataDir = path.join(rootDir, 'public', 'data');
  const mnaDir = path.join(publicDataDir, 'mna');

  for (let i = 1; i < piezasRows.length; i++) {
    const row = piezasRows[i];
    const pieceId = getCell(row, piezasHeaderMap, 'piece_id', 'id');
    const roomId = getCell(row, piezasHeaderMap, 'room_id');
    if (!pieceId || !roomId) continue;

    // Columna 3: piso ('PB' | 'PA')
    let pisoRaw = getCell(row, piezasHeaderMap, 'piso').toUpperCase();
    if (!pisoRaw) {
      const room = roomsMap.get(roomId);
      pisoRaw = room ? room.piso : 'PB';
    }
    const piso = (pisoRaw === 'PA' || pisoRaw === '2' || pisoRaw.includes('ALTA')) ? 'PA' : 'PB';

    // Columna 4: orden_sugerido (Number, fallback 0)
    const ordenSugerido = Number(getCell(row, piezasHeaderMap, 'orden_sugerido', 'orden_sala')) || 0;

    // Columna 5: titulo
    const titulo = getCell(row, piezasHeaderMap, 'titulo', 'titulo_es') || pieceId;

    // Columna 6: frase_gancho
    const fraseGancho = getCell(row, piezasHeaderMap, 'frase_gancho', 'frase_gancho_es').replace(/^"+|"+$/g, '').trim();

    // Columna 7: puente_narrativo
    const puenteNarrativo = getCell(row, piezasHeaderMap, 'puente_narrativo', 'puente_narrativo_es').trim();

    // Columna 8: guion_corto
    const guionCorto = getCell(row, piezasHeaderMap, 'guion_corto', 'resumen_30s_es', 'guion_corto_es') || fraseGancho;

    // Columna 9: guion_largo
    const guionLargo = getCell(row, piezasHeaderMap, 'guion_largo', 'guion_audioguia_es', 'guion_largo_es') || guionCorto;

    // Columna 10: retos_observacion (separado por ' | ')
    const retosRaw = getCell(row, piezasHeaderMap, 'retos_observacion', 'reto_observacion_es');
    const retosObservacion = parseRetosObservacion(retosRaw);

    // Columna 11: especificaciones ('Clave: Valor | Clave: Valor')
    let specsRaw = getCell(row, piezasHeaderMap, 'especificaciones', 'ficha_tecnica');
    let especificaciones = parseEspecificaciones(specsRaw);

    // Respaldo para fichas individuales si no venía en especificaciones agrupadas
    if (Object.keys(especificaciones).length === 0) {
      const mat = getCell(row, piezasHeaderMap, 'ficha_material_es');
      const proc = getCell(row, piezasHeaderMap, 'ficha_procedencia_es');
      const peso = getCell(row, piezasHeaderMap, 'ficha_peso_es');
      const ant = getCell(row, piezasHeaderMap, 'ficha_antiguedad_es', 'periodo_cultura_es');
      if (mat) especificaciones['Material'] = mat;
      if (proc) especificaciones['Procedencia'] = proc;
      if (peso) especificaciones['Dimensiones'] = peso;
      if (ant) especificaciones['Periodo'] = ant;
    }

    // Columna 12: faq_mito ('¿Pregunta? | Respuesta')
    const mitoRaw = getCell(row, piezasHeaderMap, 'faq_mito', 'faq_mito_es');
    let faqMito = parseFaqMito(mitoRaw);
    if (!faqMito) {
      const faqP = getCell(row, piezasHeaderMap, 'faq_pregunta_es');
      const faqR = getCell(row, piezasHeaderMap, 'faq_respuesta_es');
      if (faqP) {
        faqMito = {
          pregunta: faqP,
          respuesta: faqR || 'Información en consulta con el acervo arqueológico.'
        };
      }
    }

    // Columna 13 & 14: map_x, map_y (Number con valor de respaldo en 0)
    const mapX = Number(getCell(row, piezasHeaderMap, 'map_x')) || 0;
    const mapY = Number(getCell(row, piezasHeaderMap, 'map_y')) || 0;

    // Columna 15: image_filename
    const imageFilename = getCell(row, piezasHeaderMap, 'image_filename', 'imagen_url', 'filename');

    // Columna 16: is_free (boolean: fila.is_free?.trim().toUpperCase() === 'TRUE')
    const isFreeStr = getCell(row, piezasHeaderMap, 'is_free');
    let isFree = false;
    if (isFreeStr) {
      isFree = isFreeStr.toUpperCase() === 'TRUE';
    } else {
      // Compatibilidad con columna inversa previa es_premium
      const esPremiumStr = getCell(row, piezasHeaderMap, 'es_premium');
      isFree = esPremiumStr.toUpperCase() !== 'TRUE';
    }

    const room = roomsMap.get(roomId);
    const roomName = room ? room.nombre_oficial : roomId;
    const tags = [piso === 'PB' ? 'arqueologia' : 'etnografia', 'mna'];

    // Objeto Piece conforme a la especificación estricta de Fase 2
    const pieceData = {
      piece_id: pieceId,
      room_id: roomId,
      piso: piso,
      orden_sugerido: ordenSugerido,
      titulo: titulo,
      frase_gancho: fraseGancho,
      puente_narrativo: puenteNarrativo,
      guion_corto: guionCorto,
      guion_largo: guionLargo,
      retos_observacion: retosObservacion,
      especificaciones: especificaciones,
      faq_mito: faqMito,
      map_x: mapX,
      map_y: mapY,
      image_filename: imageFilename,
      is_free: isFree,

      // Retrocompatibilidad con componentes existentes
      id: pieceId,
      poi_id: pieceId,
      is_premium: !isFree,
      estimated_minutes: 5,
      tags: tags,
      location: {
        room_id: roomId,
        room_name: roomName,
        case_number: ''
      },
      case_number: '',
      map_coords: { x: mapX, y: mapY },
      summary_30s: guionCorto,
      observation_challenges: retosObservacion.map((item, idx) => ({
        titulo: `Detalle ${idx + 1}`,
        descripcion: item
      })),
      did_you_know: [],
      specs: especificaciones,
      faq: faqMito ? [{ question: faqMito.pregunta, answer: faqMito.respuesta }] : [],
      identification: {
        title: titulo,
        culture_period: especificaciones['Periodo'] || especificaciones['Cultura'] || (room ? room.culture : 'Mesoamérica'),
        room_zone: `${roomName}, Museo Nacional de Antropología`,
        tags: tags,
        hero_image: imageFilename
      },
      narrative: {
        one_liner: fraseGancho || guionCorto,
        short_desc: guionCorto,
        deep_desc: guionLargo
      },
      audioguide: {
        audio_script: guionLargo,
        audio_file_url: ''
      }
    };

    // Guardar archivo individual de la pieza
    const pieceRoomDir = path.join(mnaDir, roomId);
    if (!fs.existsSync(pieceRoomDir)) {
      fs.mkdirSync(pieceRoomDir, { recursive: true });
    }

    const pieceFilePath = path.join(pieceRoomDir, `${pieceId}.json`);
    fs.writeFileSync(pieceFilePath, JSON.stringify(pieceData, null, 2), 'utf-8');

    // Registrar en la sala
    const pieceSummary = {
      poi_id: pieceId,
      title: titulo,
      is_premium: !isFree,
      estimated_minutes: 5,
      thumbnail: imageFilename,
      file: `data/mna/${roomId}/${pieceId}.json`,
      ranking: isFree ? 1 : 2
    };

    if (room) {
      room.pieces_info.push(pieceSummary);
      if (ordenSugerido <= 2) {
        room.featured_pieces.push(pieceId);
      }
    }

    totalPiecesList.push({
      ...pieceSummary,
      room_zone: roomName,
      room_id: roomId,
      map_coords: { x: mapX, y: mapY },
      tags: tags
    });
  }

  console.log(`💾 Generados ${totalPiecesList.length} archivos de piezas en public/data/mna/`);

  // 3. Generar Manifiesto de Rutas
  const masterRouteStops = [
    totalPiecesList.find(p => p.poi_id === 'piedra-del-sol'),
    totalPiecesList.find(p => p.poi_id === 'coatlicue'),
    totalPiecesList.find(p => p.poi_id === 'diosa-del-agua-chalchiuhtlicue'),
    totalPiecesList.find(p => p.poi_id === 'disco-de-la-muerte-mictlantecuhtli'),
    totalPiecesList.find(p => p.poi_id === 'mascara-de-calakmul'),
    totalPiecesList.find(p => p.poi_id.includes('cabeza') || p.poi_id.includes('olmeca')) || totalPiecesList[0]
  ].filter(Boolean);

  const expressRouteStops = [
    totalPiecesList.find(p => p.poi_id === 'piedra-del-sol'),
    totalPiecesList.find(p => p.poi_id === 'coatlicue'),
    totalPiecesList.find(p => p.poi_id === 'disco-de-la-muerte-mictlantecuhtli')
  ].filter(Boolean);

  const mnaSiteManifest = {
    site_id: 'MNA',
    name: 'Museo Nacional de Antropología',
    pass_price_mxn: 79,
    pass_price_usd: 4.99,
    floorplan_url: 'data/mna/mna-map.svg',
    rooms: Array.from(roomsMap.values()),
    routes: [
      {
        id: 'ruta-monumental',
        name: 'Obras Maestras del MNA',
        duration: '45 min',
        description: 'Recorrido curado por los grandes monolitos e iconos de la cosmovisión mesoamericana.',
        stops: masterRouteStops
      },
      {
        id: 'visita-relampago',
        name: 'Visita Relámpago (Top Highlights)',
        duration: '25 min',
        description: 'Itinerario exprés con los tesoros indispensables que todo visitante debe contemplar.',
        stops: expressRouteStops
      }
    ]
  };

  const siteJsonPath = path.join(mnaDir, 'site.json');
  const mnaJsonPath = path.join(mnaDir, 'mna.json');
  fs.writeFileSync(siteJsonPath, JSON.stringify(mnaSiteManifest, null, 2), 'utf-8');
  fs.writeFileSync(mnaJsonPath, JSON.stringify(mnaSiteManifest, null, 2), 'utf-8');
  console.log(`💾 Generado public/data/mna/site.json y public/data/mna/mna.json`);

  // 4. Actualizar public/data/sites.json
  const sitesJsonPath = path.join(publicDataDir, 'sites.json');
  let currentSites = [];
  if (fs.existsSync(sitesJsonPath)) {
    try {
      currentSites = JSON.parse(fs.readFileSync(sitesJsonPath, 'utf-8'));
    } catch (e) {
      currentSites = [];
    }
  }

  const mnaEntry = {
    id: 'MNA',
    name: 'Museo Nacional de Antropología',
    short_name: 'MNA',
    location: 'Bosque de Chapultepec, Ciudad de México',
    thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Museo_Nacional_de_Antropolog%C3%ADa_-_MNA_01.jpg/1200px-Museo_Nacional_de_Antropolog%C3%ADa_-_MNA_01.jpg',
    badge: 'Top 10 Museos del Mundo',
    path: 'data/mna/site.json',
    stripe_link: 'https://buy.stripe.com/demo_mna',
    description: 'El recinto arqueológico y etnográfico más importante de México y América Latina, con 20 salas y 200 piezas catalogadas.',
    highlights_count: masterRouteStops.length,
    total_stops: totalPiecesList.length
  };

  const otherSites = currentSites.filter(s => s.id !== 'MNA');
  const updatedSites = [mnaEntry, ...otherSites];
  fs.writeFileSync(sitesJsonPath, JSON.stringify(updatedSites, null, 2), 'utf-8');
  console.log(`💾 Generado y actualizado public/data/sites.json`);
  console.log(`✨ Sincronización exitosa de Fase 2: ${roomsMap.size} salas, ${totalPiecesList.length} piezas.`);
}

try {
  await syncSheets();
  process.exit(0);
} catch (err) {
  console.error('❌ Error durante la sincronización:', err);
  process.exit(1);
}
