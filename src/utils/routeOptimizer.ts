import { SiteRoute, RouteStop, Room, PieceData } from '../types';
import { getAssetUrl, normalizePiece } from './urlHelper';
import { stripLinks } from './pieceLinks';
import { getStrings } from '../i18n';
import { getCurrentLanguage } from '../i18n/runtime';

export interface RoutePreferences {
  timeLimitMinutes: number; // 30, 60, 120, or 999
  selectedInterestKeys: string[];
  pace: 'highlights' | 'expert';
}

export const MANDATORY_MNA_PIECE_ID = 'mna_s06_piedra_sol';

// Minúsculas y sin acentos, para que "máscara" coincida con la palabra clave "mascara".
const fold = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const INTEREST_KEYWORDS: Record<string, string[]> = {
  // MNA
  'cosmogonia-mexica': [
    'mexica', 'sol', 'tenochtitlan', 'monolito', 'coatlicue', 'coyolxauhqui',
    'azteca', 'teotihuacan', 'tolteca', 'calendario', 'tonatiuh', 'tlatilco'
  ],
  'mundo-maya': [
    'maya', 'calakmul', 'jade', 'mascara', 'funeraria', 'palenque', 'pakal',
    'chichen', 'yaxchilan', 'dintel', 'estela', 'selva', 'tierras bajas'
  ],
  'arte-monumental': [
    'monumental', 'colosal', 'cabeza', 'olmeca', 'golfo', 'escultura',
    'atlante', 'antropologia', 'basalto', 'jadeita', 'luchador'
  ],
  'vida-cotidiana-tumbas': [
    'tumbas', 'oaxaca', 'funeraria', 'monte alban', 'zapoteca', 'mixteca',
    'occidente', 'preclasico', 'urna', 'ofrenda', 'etnografia', 'huasteco',
    'tarascos', 'purepecha', 'nahuas', 'otopames', 'sierra',
    // Planta alta renovada en 2025 (ejes temáticos)
    'textil', 'huipil', 'milpa', 'maiz', 'fiesta', 'ritual', 'lengua', 'pueblos',
    'identidad', 'resistencia', 'comunidad', 'tradicion'
  ],
  // Teotihuacán
  'eje-piramides': ['piramides', 'sol', 'luna', 'calzada', 'astronomia'],
  'pintura-palacios': ['murales', 'palacios', 'quetzalpapalotl', 'quetzal', 'patio'],
  'mitologia-dioses': ['sacerdotes', 'serpiente', 'dioses', 'ciudadela', 'misticismo', 'quetzalcoatl', 'tlaloc'],
  // Chapultepec
  'epoca-imperial': ['imperial', 'maximiliano', 'carlota', 'alcazar', 'habitacion'],
  'independencia-revolucion': ['republica', 'juarez', 'batallas', 'historia', 'muralismo', 'revolucion', 'siqueiros'],
  'miradores-alcazar': ['miradores', 'alcazar', 'jardin', 'torre', 'terraza', 'paisaje'],
};

/**
 * Formats duration in minutes to human-readable string:
 * - "X min" if < 60
 * - "X h Y min" if >= 60 (or "X h" if Y is 0)
 */
export function formatRouteDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours} h`;
  return `${hours} h ${remainingMinutes} min`;
}

/**
 * Helper to determine floor ('PB' | 'PA') of a room ID or stop
 */
function getFloorForRoomId(roomId: string, roomsCatalog?: Room[]): 'PB' | 'PA' {
  const clean = (roomId || '').toLowerCase();
  if (clean.includes('pa') || clean.includes('etnografia')) return 'PA';
  
  if (roomsCatalog && roomsCatalog.length > 0) {
    const found = roomsCatalog.find(
      (r) =>
        r.room_id.toLowerCase() === clean ||
        r.svg_id?.toLowerCase() === clean ||
        (r.aliases && r.aliases.some((a) => a.toLowerCase() === clean))
    );
    if (found?.piso) return found.piso === 'PA' ? 'PA' : 'PB';
  }

  const numMatch = clean.match(/\d+/);
  if (numMatch) {
    const num = parseInt(numMatch[0], 10);
    if (num >= 12) return 'PA';
  }
  return 'PB';
}

/**
 * Unified Route Duration Calculator used across the ENTIRE application:
 * - 5 minutes per piece (includes audio script + observing the piece).
 * - + 2 minutes per room transfer (walking between rooms).
 * - + 3 minutes once if the route includes a floor change (PB to PA or vice versa).
 * - If user chose "guion largo" or expert mode: 9 minutes per piece instead of 5.
 */
export function calculateRouteTimeMinutes(
  stops: RouteStop[],
  isLongAudio: boolean = false,
  roomsCatalog?: Room[]
): number {
  if (!stops || stops.length === 0) return 0;

  const minutesPerPiece = isLongAudio ? 9 : 5;
  const totalPieceTime = stops.length * minutesPerPiece;

  let roomTransfers = 0;
  let prevRoomId: string | null = null;
  const visitedFloors = new Set<'PB' | 'PA'>();

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const rId = (stop.room_id || stop.room_zone || '').toLowerCase();

    // Determine floor
    let floor: 'PB' | 'PA' = 'PB';
    if (stop.piso) {
      floor = stop.piso === 'PA' ? 'PA' : 'PB';
    } else {
      floor = getFloorForRoomId(rId, roomsCatalog);
    }
    visitedFloors.add(floor);

    // Detect transfer between distinct rooms
    if (prevRoomId !== null && rId && rId !== prevRoomId) {
      roomTransfers++;
    }
    if (rId) {
      prevRoomId = rId;
    }
  }

  const transferTime = roomTransfers * 2;
  const floorChangeTime = visitedFloors.size > 1 ? 3 : 0;

  return totalPieceTime + transferTime + floorChangeTime;
}

/**
 * Generate an optimized route using pieces.json and rooms.json.
 * 
 * Rules (Rule D):
 * 1. Group by room: all pieces of room X together, ordered by orden_sugerido from pieces.json.
 * 2. Group by floor: first all PB rooms in numerical order (00 to 11), then PA rooms in numerical order (12 to 21).
 *    NEVER jump between floors.
 * 3. Selection prioritizes pieces with lowest orden_sugerido within available timeLimitMinutes,
 *    respecting the single unified time formula (Rule C).
 * 4. In MNA, Piedra del Sol (mna_s06_piedra_sol) is guaranteed.
 */
export function generateOptimizedRoute(
  manifestOrPieces: any,
  preferences: RoutePreferences,
  roomsCatalog?: Room[]
): SiteRoute {
  const { timeLimitMinutes, selectedInterestKeys, pace } = preferences;
  const isExpert = pace === 'expert';

  // 1. Resolve pieces pool and rooms pool
  let allPieces: PieceData[] = [];
  let allRooms: Room[] = roomsCatalog ? [...roomsCatalog] : [];

  if (Array.isArray(manifestOrPieces)) {
    allPieces = manifestOrPieces;
  } else if (manifestOrPieces?.rooms) {
    if (!roomsCatalog || roomsCatalog.length === 0) {
      allRooms = manifestOrPieces.rooms;
    }
  }

  // Normalizar ids de las piezas (los room_id vienen tal cual de pieces.json / Sheets)
  allPieces = allPieces.map((p) => normalizePiece({ ...p }));

  // 2. Group pieces by canonical room_id and sort by orden_sugerido ascending
  const piecesByRoom = new Map<string, PieceData[]>();
  allPieces.forEach((p) => {
    const rId = p.room_id || 'sala-06-mexica';
    if (!piecesByRoom.has(rId)) {
      piecesByRoom.set(rId, []);
    }
    piecesByRoom.get(rId)!.push(p);
  });

  piecesByRoom.forEach((pList) => {
    pList.sort((a, b) => (a.orden_sugerido || 99) - (b.orden_sugerido || 99));
  });

  // 3. Score rooms based on user interests
  const roomScores = new Map<string, number>();
  const activeKeywords: string[] = [];
  selectedInterestKeys.forEach((key) => {
    if (INTEREST_KEYWORDS[key]) {
      activeKeywords.push(...INTEREST_KEYWORDS[key]);
    }
  });

  allRooms.forEach((room) => {
    let score = 0;
    const rText = fold(`${room.room_id} ${room.nombre_oficial} ${room.nombre_oficial_es || ''} ${room.frase_gancho_es || room.frase_gancho || ''} ${room.introduccion_narrativa_es || room.introduccion_narrativa || ''}`);
    activeKeywords.forEach((kw) => {
      if (rText.includes(kw)) score += 4;
    });

    const roomPieces = piecesByRoom.get(room.room_id) || [];
    roomPieces.forEach((p) => {
      // Se busca en el texto original en español para que los intereses funcionen en cualquier idioma
      const pText = fold(`${p.titulo_es || p.titulo} ${p.frase_gancho_es || p.frase_gancho || ''} ${stripLinks(p.guion_corto_es || p.guion_corto || '')} ${p.indice || ''}`);
      activeKeywords.forEach((kw) => {
        if (pText.includes(kw)) score += 2;
      });
      if (p.is_free) score += 1;
    });

    // Sala Mexica is premier in MNA
    if (room.room_id === 'sala-06-mexica') score += 15;

    roomScores.set(room.room_id, score);
  });

  // 4. Sort rooms candidate pool strictly: PB (00 to 11), then PA (12 to 21)
  const sortedRooms = [...allRooms].sort((a, b) => {
    const isAPb = a.piso === 'PB' || !a.piso;
    const isBPb = b.piso === 'PB' || !b.piso;
    if (isAPb && !isBPb) return -1;
    if (!isAPb && isBPb) return 1;

    const numA = parseInt(String(a.numero_oficial || a.room_id.match(/\d+/)?.[0] || '0'), 10);
    const numB = parseInt(String(b.numero_oficial || b.room_id.match(/\d+/)?.[0] || '0'), 10);
    return numA - numB;
  });

  // Determine which rooms to include based on scores and available time
  // For 30m: 1-2 rooms (Mexica + top match)
  // For 60m: 3-4 rooms
  // For 120m: 6-8 rooms (including PB and PA)
  // For 999m: all rooms
  let maxRoomsToPick = 2;
  if (timeLimitMinutes <= 35) {
    maxRoomsToPick = 2;
  } else if (timeLimitMinutes <= 65) {
    maxRoomsToPick = 4;
  } else if (timeLimitMinutes <= 130) {
    maxRoomsToPick = 8;
  } else {
    maxRoomsToPick = 22;
  }

  // Pick top scored rooms
  const rankedRooms = [...allRooms].sort((a, b) => {
    const sA = roomScores.get(a.room_id) || 0;
    const sB = roomScores.get(b.room_id) || 0;
    return sB - sA;
  });

  const selectedRooms: Room[] = [];
  const mexicaRoom = allRooms.find((r) => r.room_id === 'sala-06-mexica');
  if (mexicaRoom) {
    selectedRooms.push(mexicaRoom);
  }

  for (const r of rankedRooms) {
    if (selectedRooms.length >= maxRoomsToPick) break;
    if (!selectedRooms.some((sr) => sr.room_id === r.room_id)) {
      selectedRooms.push(r);
    }
  }

  // Strictly re-sort chosen rooms by floor (PB 00->11, then PA 12->21)
  selectedRooms.sort((a, b) => {
    const isAPb = a.piso === 'PB' || !a.piso;
    const isBPb = b.piso === 'PB' || !b.piso;
    if (isAPb && !isBPb) return -1;
    if (!isAPb && isBPb) return 1;

    const numA = parseInt(String(a.numero_oficial || a.room_id.match(/\d+/)?.[0] || '0'), 10);
    const numB = parseInt(String(b.numero_oficial || b.room_id.match(/\d+/)?.[0] || '0'), 10);
    return numA - numB;
  });

  // 5. Greedily pick pieces by lowest orden_sugerido from selected rooms
  // Pieces of each room stay strictly contiguous
  const candidateStopsByRoom = new Map<string, RouteStop[]>();
  selectedRooms.forEach((room) => {
    const rPieces = piecesByRoom.get(room.room_id) || [];
    const stops = rPieces.map((p, idx) => createRouteStop(p, room, idx + 1));
    candidateStopsByRoom.set(room.room_id, stops);
  });

  // Find Piedra del Sol piece
  const piedraDelSolPiece = allPieces.find(
    (p) => p.piece_id === MANDATORY_MNA_PIECE_ID || p.id === MANDATORY_MNA_PIECE_ID
  );

  let finalStops: RouteStop[] = [];

  if (timeLimitMinutes >= 900) {
    // Unlimited tour: include all pieces in floor order
    sortedRooms.forEach((room) => {
      const rPieces = piecesByRoom.get(room.room_id) || [];
      rPieces.forEach((p) => {
        finalStops.push(createRouteStop(p, room, finalStops.length + 1));
      });
    });
  } else {
    // Finite tour: pick pieces prioritizing orden_sugerido = 1 first, then 2, etc.
    // while keeping pieces of the same room contiguous in the final list.
    const piecesIncludedPerRoom = new Map<string, number>();
    selectedRooms.forEach((r) => piecesIncludedPerRoom.set(r.room_id, 1)); // At least 1 piece per chosen room

    // Function to assemble route from piecesIncludedPerRoom and calculate time
    const assembleRoute = (counts: Map<string, number>): RouteStop[] => {
      const res: RouteStop[] = [];
      selectedRooms.forEach((room) => {
        const available = candidateStopsByRoom.get(room.room_id) || [];
        const count = counts.get(room.room_id) || 0;
        for (let i = 0; i < Math.min(count, available.length); i++) {
          res.push(available[i]);
        }
      });
      return res;
    };

    // Incremental expansion of pieces
    let currentAssembled = assembleRoute(piecesIncludedPerRoom);
    let maxPasses = 10;
    let pass = 0;

    while (pass < maxPasses) {
      pass++;
      let anyAdded = false;
      for (const room of selectedRooms) {
        const currentCount = piecesIncludedPerRoom.get(room.room_id) || 0;
        const available = candidateStopsByRoom.get(room.room_id) || [];
        if (currentCount < available.length) {
          // Test adding one more piece to this room
          piecesIncludedPerRoom.set(room.room_id, currentCount + 1);
          const testRoute = assembleRoute(piecesIncludedPerRoom);
          const testMinutes = calculateRouteTimeMinutes(testRoute, isExpert, allRooms);
          if (testMinutes <= timeLimitMinutes) {
            anyAdded = true;
          } else {
            // Revert if it strictly exceeds limit
            piecesIncludedPerRoom.set(room.room_id, currentCount);
          }
        }
      }
      if (!anyAdded) break;
    }

    finalStops = assembleRoute(piecesIncludedPerRoom);
  }

  // Ensure Piedra del Sol is present in MNA routes
  const hasPiedra = finalStops.some(
    (s) => s.piece_id === MANDATORY_MNA_PIECE_ID || s.id === MANDATORY_MNA_PIECE_ID || s.poi_id === MANDATORY_MNA_PIECE_ID
  );
  if (!hasPiedra && piedraDelSolPiece) {
    const mexicaRoomObj = mexicaRoom || {
      room_id: 'sala-06-mexica',
      nombre_oficial: 'Mexica',
      piso: 'PB',
      svg_id: 'room_06',
    };
    const pStop = createRouteStop(piedraDelSolPiece, mexicaRoomObj as Room, 1);
    const mexicaIdx = finalStops.findIndex((s) => s.room_id === 'sala-06-mexica');
    if (mexicaIdx !== -1) {
      finalStops.splice(mexicaIdx, 0, pStop);
    } else {
      finalStops.unshift(pStop);
    }
  }

  // Re-index rankings sequentially
  finalStops.forEach((s, idx) => {
    s.ranking = idx + 1;
  });

  const finalMinutes = calculateRouteTimeMinutes(finalStops, isExpert, allRooms);
  const routeStrings = getStrings(getCurrentLanguage()).routes;

  return {
    id: `custom-route-${timeLimitMinutes}m-${Date.now()}`,
    route_id: `custom-route-${timeLimitMinutes}m`,
    name: routeStrings.curatedName(formatRouteDuration(finalMinutes)),
    title: routeStrings.curatedName(formatRouteDuration(finalMinutes)),
    duration: formatRouteDuration(finalMinutes),
    estimated_minutes: finalMinutes,
    description: routeStrings.curatedDescription(selectedRooms.length),
    stops: finalStops,
  };
}

function createRouteStop(piece: PieceData, room: Room, ranking: number): RouteStop {
  const pId = piece.piece_id || piece.id || (piece as any).poi_id;
  const roomName = room.nombre_oficial || room.name || room.room_id;
  const piso = piece.piso || room.piso || (getFloorForRoomId(room.room_id) === 'PA' ? 'PA' : 'PB');

  return {
    poi_id: pId,
    piece_id: pId,
    id: pId,
    title: piece.titulo || piece.title || pId,
    room_zone: roomName,
    file: piece.image_filename || '',
    map_coords: { x: piece.map_x || 50, y: piece.map_y || 50 },
    estimated_minutes: 5.0,
    room_id: room.room_id,
    ranking,
    thumbnail: piece.image_filename ? getAssetUrl(`images/pieces/${piece.image_filename}`) : '',
    is_premium: !piece.is_free,
    piso,
    tags: [roomName, piso],
  };
}
