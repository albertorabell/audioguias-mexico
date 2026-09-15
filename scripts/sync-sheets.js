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
 * Desglosa retos de observación a partir de reto_observacion_es separado por pleca (|)
 * Formato esperado en hoja: "Titulo: Descripcion | Titulo 2: Descripcion 2"
 */
function parseObservationChallenges(raw, defaultTitle = 'Reto de observación') {
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split('|')
    .map((item, idx) => {
      const trimmed = item.trim();
      if (!trimmed) return null;
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx !== -1) {
        return {
          titulo: trimmed.substring(0, colonIdx).trim(),
          descripcion: trimmed.substring(colonIdx + 1).trim()
        };
      }
      return {
        titulo: `${defaultTitle} ${idx + 1}`,
        descripcion: trimmed
      };
    })
    .filter(Boolean);
}

/**
 * Desglosa curiosidades a partir de sabias_que_es separado por pleca (|)
 */
function parseDidYouKnow(raw) {
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split('|')
    .map(s => s.trim().replace(/^\d+[\.\)]\s*/, '')) // Remueve prefijos numerados como "1. "
    .filter(Boolean);
}

/**
 * Desglosa FAQ a partir de faq_pregunta_es y faq_respuesta_es
 */
function parseFaq(qRaw, aRaw) {
  if (!qRaw || !qRaw.trim()) return [];
  const qList = qRaw.split('|').map(q => q.trim()).filter(Boolean);
  const aList = (aRaw || '').split('|').map(a => a.trim()).filter(Boolean);

  return qList.map((question, i) => ({
    question,
    answer: aList[i] || 'Información en consulta con el acervo arqueológico.'
  }));
}

/**
 * Coordenadas de mapa predefinidas para la arquitectura del MNA (Piso 1 y Piso 2)
 */
const ROOM_MAP_COORDS = {
  // Arqueología (Planta Baja / Piso 1)
  'sala-introduccion_antropologia': { x: 22, y: 88 },
  'sala-poblamiento': { x: 22, y: 76 },
  'sala-preclasico': { x: 22, y: 64 },
  'sala-teotihuacan': { x: 22, y: 50 },
  'sala-tolteca': { x: 22, y: 36 },
  'sala-mexica': { x: 50, y: 18 },
  'sala-oaxaca': { x: 78, y: 36 },
  'sala-costa_del_golfo': { x: 78, y: 50 },
  'sala-maya': { x: 78, y: 64 },
  'sala-occidente': { x: 78, y: 76 },
  'sala-norte': { x: 78, y: 88 },

  // Etnografía (Planta Alta / Piso 2)
  'sala-gran_nayar': { x: 25, y: 30 },
  'sala-etno_purepecha': { x: 25, y: 45 },
  'sala-etno_otopames': { x: 25, y: 60 },
  'sala-etno_sierra_puebla': { x: 25, y: 75 },
  'sala-etno_nahuas': { x: 50, y: 25 },
  'sala-etno_oaxaca': { x: 75, y: 30 },
  'sala-etno_golfo_huasteca': { x: 75, y: 45 },
  'sala-etno_maya': { x: 75, y: 60 },
  'sala-etno_noroeste': { x: 75, y: 75 }
};

async function syncSheets() {
  console.log('🏛️ Iniciando sincronización con Google Sheets...');
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

  console.log('✅ Hojas descargadas correctamente. Parseando datos...');

  const salasRows = parseCSV(salasCSV);
  const piezasRows = parseCSV(piezasCSV);

  const salasHeaders = salasRows[0];
  const salasHeaderMap = {};
  salasHeaders.forEach((h, i) => { salasHeaderMap[h.trim()] = i; });

  const piezasHeaders = piezasRows[0];
  const piezasHeaderMap = {};
  piezasHeaders.forEach((h, i) => { piezasHeaderMap[h.trim()] = i; });

  // 1. Procesar Salas
  const roomsMap = new Map();
  for (let i = 1; i < salasRows.length; i++) {
    const row = salasRows[i];
    const roomId = row[salasHeaderMap['room_id']]?.trim();
    if (!roomId) continue;

    const nombreEs = row[salasHeaderMap['nombre_es']]?.trim() || roomId;
    const culturaEs = row[salasHeaderMap['cultura_es']]?.trim() || 'Mesoamérica';
    const descripcionEs = row[salasHeaderMap['descripcion_corta_es']]?.trim() || '';
    const piso = parseInt(row[salasHeaderMap['piso']], 10) || 1;
    const mapSvgId = row[salasHeaderMap['map_svg_id']]?.trim() || roomId;
    const tagsRaw = row[salasHeaderMap['tags']] || '';
    const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);

    roomsMap.set(roomId, {
      id: roomId,
      name: nombreEs,
      culture: culturaEs,
      tags: tags.length > 0 ? tags : ['arqueologia', 'mna'],
      short_description: descripcionEs,
      floor: piso,
      map_svg_id: mapSvgId,
      featured_pieces: [],
      coords: ROOM_MAP_COORDS[roomId] || { x: 50, y: 50 },
      pieces_info: []
    });
  }

  console.log(`📊 Salas procesadas: ${roomsMap.size}`);

  // 2. Procesar Piezas
  const totalPiecesList = [];
  const publicDataDir = path.join(rootDir, 'public', 'data');
  const mnaDir = path.join(publicDataDir, 'mna');

  for (let i = 1; i < piezasRows.length; i++) {
    const row = piezasRows[i];
    const pieceId = row[piezasHeaderMap['piece_id']]?.trim();
    const roomId = row[piezasHeaderMap['room_id']]?.trim();
    if (!pieceId || !roomId) continue;

    const siteId = row[piezasHeaderMap['site_id']]?.trim() || 'mna';
    const ordenSala = parseInt(row[piezasHeaderMap['orden_sala']], 10) || i;
    const duracionMin = parseInt(row[piezasHeaderMap['duracion_min']], 10) || 5;
    const esPremium = (row[piezasHeaderMap['es_premium']] || '').trim().toUpperCase() === 'TRUE';
    const imagenUrl = row[piezasHeaderMap['imagen_url']]?.trim() || '';
    const tagsRaw = row[piezasHeaderMap['tags']] || '';
    const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
    const mapX = parseFloat(row[piezasHeaderMap['map_x']]) || 50;
    const mapY = parseFloat(row[piezasHeaderMap['map_y']]) || 50;

    const tituloEs = row[piezasHeaderMap['titulo_es']]?.trim() || pieceId;
    const periodoCulturaEs = row[piezasHeaderMap['periodo_cultura_es']]?.trim() || '';
    const fraseGanchoEs = (row[piezasHeaderMap['frase_gancho_es']] || '').replace(/^"+|"+$/g, '').trim();
    const guionAudioguiaEs = row[piezasHeaderMap['guion_audioguia_es']]?.trim() || '';
    const resumen30sEs = row[piezasHeaderMap['resumen_30s_es']]?.trim() || '';
    const retoObservacionEs = row[piezasHeaderMap['reto_observacion_es']]?.trim() || '';
    const sabiasQueEs = row[piezasHeaderMap['sabias_que_es']]?.trim() || '';

    const fichaMaterialEs = row[piezasHeaderMap['ficha_material_es']]?.trim() || '';
    const fichaProcedenciaEs = row[piezasHeaderMap['ficha_procedencia_es']]?.trim() || '';
    const fichaPesoEs = row[piezasHeaderMap['ficha_peso_es']]?.trim() || '';
    const fichaAntiguedadEs = row[piezasHeaderMap['ficha_antiguedad_es']]?.trim() || '';

    const faqPreguntaEs = row[piezasHeaderMap['faq_pregunta_es']]?.trim() || '';
    const faqRespuestaEs = row[piezasHeaderMap['faq_respuesta_es']]?.trim() || '';

    // Desglose de campos estructurados (Requisito 3)
    const summary30s = resumen30sEs || (guionAudioguiaEs ? guionAudioguiaEs.split('.')[0] + '.' : fraseGanchoEs);
    const observationChallenges = parseObservationChallenges(retoObservacionEs, 'Detalle');
    const didYouKnow = parseDidYouKnow(sabiasQueEs);
    const specs = {
      material: fichaMaterialEs,
      provenance: fichaProcedenciaEs,
      weight: fichaPesoEs,
      age: fichaAntiguedadEs || periodoCulturaEs
    };
    const faq = parseFaq(faqPreguntaEs, faqRespuestaEs);

    // Obtener información de la sala asignada
    const room = roomsMap.get(roomId);
    const roomName = room ? room.name : roomId;

    // Crear objeto completo de la pieza
    const pieceData = {
      poi_id: pieceId,
      room_id: roomId,
      site_id: siteId.toUpperCase(),
      orden_sala: ordenSala,
      is_premium: esPremium,
      estimated_minutes: duracionMin,
      tags: tags.length > 0 ? tags : ['arqueologia'],
      map_coords: { x: mapX, y: mapY },

      identification: {
        title: tituloEs,
        culture_period: periodoCulturaEs || (room ? room.culture : 'Mesoamérica'),
        room_zone: `${roomName}, Museo Nacional de Antropología`,
        tags: tags,
        hero_image: imagenUrl
      },

      narrative: {
        one_liner: fraseGanchoEs || summary30s,
        short_desc: summary30s,
        deep_desc: guionAudioguiaEs || summary30s
      },

      audioguide: {
        audio_script: guionAudioguiaEs || summary30s,
        audio_file_url: ''
      },

      // Campos estructurados específicos requeridos
      summary_30s: summary30s,
      observation_challenges: observationChallenges,
      did_you_know: didYouKnow,
      specs: specs,
      faq: faq,

      // Retrocompatibilidad con componentes existentes
      visual_challenge: observationChallenges.map((c, idx) => ({
        id: `ch-${idx + 1}`,
        title: c.titulo,
        clue: c.descripcion
      })),
      curiosities: didYouKnow.map((fact, idx) => ({
        id: `cur-${idx + 1}`,
        fact: fact
      })),
      faqs: faq
    };

    // Guardar archivo individual de la pieza en public/data/mna/[room_id]/[piece_id].json
    const pieceRoomDir = path.join(mnaDir, roomId);
    if (!fs.existsSync(pieceRoomDir)) {
      fs.mkdirSync(pieceRoomDir, { recursive: true });
    }

    const pieceFilePath = path.join(pieceRoomDir, `${pieceId}.json`);
    fs.writeFileSync(pieceFilePath, JSON.stringify(pieceData, null, 2), 'utf-8');

    // Registrar pieza en la sala correspondiente
    const pieceSummary = {
      poi_id: pieceId,
      title: tituloEs,
      is_premium: esPremium,
      estimated_minutes: duracionMin,
      thumbnail: imagenUrl,
      file: `data/mna/${roomId}/${pieceId}.json`,
      ranking: esPremium ? 2 : 1
    };

    if (room) {
      room.pieces_info.push(pieceSummary);
      if (ordenSala <= 2) {
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

  console.log(`💾 Generados ${totalPiecesList.length} archivos de piezas individuales en public/data/mna/`);

  // 3. Generar Rutas predeterminadas para MNA
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

  // Guardar public/data/mna/site.json y sincronizar mna.json
  const siteJsonPath = path.join(mnaDir, 'site.json');
  const mnaJsonPath = path.join(mnaDir, 'mna.json');
  fs.writeFileSync(siteJsonPath, JSON.stringify(mnaSiteManifest, null, 2), 'utf-8');
  fs.writeFileSync(mnaJsonPath, JSON.stringify(mnaSiteManifest, null, 2), 'utf-8');
  console.log(`💾 Generado public/data/mna/site.json y sincronizado con mna.json`);

  // 4. Actualizar public/data/sites.json (Catálogo maestro del sitio MNA)
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

  // Preservar Teotihuacán y Chapultepec si existen, o actualizar la entrada de MNA
  const otherSites = currentSites.filter(s => s.id !== 'MNA');
  const updatedSites = [mnaEntry, ...otherSites];

  fs.writeFileSync(sitesJsonPath, JSON.stringify(updatedSites, null, 2), 'utf-8');
  console.log(`💾 Generado y actualizado public/data/sites.json`);
  console.log(`✨ Sincronización exitosa: ${roomsMap.size} salas, ${totalPiecesList.length} piezas.`);
}

try {
  await syncSheets();
  process.exit(0);
} catch (err) {
  console.error('❌ Error durante la sincronización:', err);
  process.exit(1);
}

