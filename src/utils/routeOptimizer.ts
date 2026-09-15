import { SiteManifest, SiteRoute, RouteStop, Room } from '../types';

export interface RoutePreferences {
  timeLimitMinutes: number; // 30, 60, 90, 120, or 999
  selectedInterestKeys: string[];
  pace: 'highlights' | 'expert';
}

const INTEREST_KEYWORDS: Record<string, string[]> = {
  // MNA
  'cosmogonia-mexica': ['mexica', 'sol', 'tenochtitlan', 'monolito', 'coatlicue', 'coyolxauhqui', 'azteca', 'teotihuacan', 'tolteca', 'calendario'],
  'mundo-maya': ['maya', 'calakmul', 'jade', 'mascara', 'funeraria', 'palenque', 'pakal', 'chichen', 'yaxchilan'],
  'arte-monumental': ['monumental', 'colosal', 'cabeza', 'olmeca', 'golfo', 'escultura', 'atlante', 'antropologia'],
  'vida-cotidiana-tumbas': ['tumbas', 'oaxaca', 'funeraria', 'monte alban', 'zapoteca', 'mixteca', 'occidente', 'preclasico'],
  // Teotihuacán
  'eje-piramides': ['piramides', 'sol', 'luna', 'calzada', 'astronomia'],
  'pintura-palacios': ['murales', 'palacios', 'quetzalpapalotl', 'quetzal', 'patio'],
  'mitologia-dioses': ['sacerdotes', 'serpiente', 'dioses', 'ciudadela', 'misticismo', 'quetzalcoatl', 'tlaloc'],
  // Chapultepec
  'epoca-imperial': ['imperial', 'maximiliano', 'carlota', 'alcazar', 'habitacion'],
  'independencia-revolucion': ['republica', 'juarez', 'batallas', 'historia', 'muralismo', 'revolucion', 'siqueiros'],
  'miradores-alcazar': ['miradores', 'alcazar', 'jardin', 'torre', 'terraza', 'paisaje'],
};

export function formatRouteDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes} min`;
}

/**
 * Calculates total route time based on:
 * - 1.5 minutes per piece
 * - 3.0 minutes for each room transfer (physical walking time between distinct rooms)
 */
export function calculateRouteTimeMinutes(stops: RouteStop[]): number {
  if (stops.length === 0) return 0;
  
  const pieceTime = stops.length * 1.5;
  let roomTransfers = 0;
  let prevRoom = stops[0].room_id || stops[0].room_zone;

  for (let i = 1; i < stops.length; i++) {
    const currentRoom = stops[i].room_id || stops[i].room_zone;
    if (currentRoom !== prevRoom) {
      roomTransfers++;
      prevRoom = currentRoom;
    }
  }

  const transferTime = roomTransfers * 3.0;
  return Math.round(pieceTime + transferTime);
}

/**
 * Optimizes an itinerary based on user's available time, cultural interests, and pace.
 * 
 * Rules:
 * 1. Mandatory Stop: In MNA ('mna' or 'MNA'), 'piedra-del-sol' (and 'sala-mexica') MUST be included in 100% of routes.
 * 2. Density & Continuity: Group 3-5 contiguous pieces per room; avoid single-piece jumps between rooms.
 * 3. Physical Sequence: Sort stops within rooms according to 'orden_sala' (or catalog index order).
 * 4. Recalibrated Times: 1.5 min/piece + 3 min per room transition.
 *    - Rápida (30 min): 8-10 pieces, 2 rooms (~4-5 pieces/room).
 *    - Estándar (60 min): 15-18 pieces, 3-4 rooms (~4-5 pieces/room).
 *    - Completa (90-120 min): 25-35 pieces.
 */
export function generateOptimizedRoute(
  manifest: SiteManifest,
  preferences: RoutePreferences
): SiteRoute {
  const { timeLimitMinutes, selectedInterestKeys, pace } = preferences;
  const isMNA = manifest.site_id.toUpperCase() === 'MNA';

  // 1. Build a lookup map of all available pieces grouped by room
  interface RoomCandidate {
    room: Room;
    stops: RouteStop[];
    score: number;
  }

  const roomMap = new Map<string, RoomCandidate>();

  if (manifest.rooms && manifest.rooms.length > 0) {
    manifest.rooms.forEach((room: Room) => {
      const roomStops: RouteStop[] = [];
      if (room.pieces_info && room.pieces_info.length > 0) {
        room.pieces_info.forEach((piece, index) => {
          roomStops.push({
            poi_id: piece.poi_id,
            title: piece.title,
            room_zone: room.name,
            file: piece.file,
            map_coords: room.coords || { x: 50, y: 50 },
            estimated_minutes: 1.5,
            room_id: room.id,
            ranking: piece.ranking || (piece.is_premium ? 2 : 1),
            tags: room.tags || [],
            orden_sala: index + 1,
          });
        });
      }
      roomMap.set(room.id, {
        room,
        stops: roomStops,
        score: 0,
      });
    });
  }

  // Integrate any pieces found exclusively in manifest.routes
  if (manifest.routes) {
    manifest.routes.forEach((route) => {
      route.stops.forEach((stop, index) => {
        const roomId = stop.room_id || 'default-room';
        let candidate = roomMap.get(roomId);
        if (!candidate) {
          candidate = {
            room: {
              id: roomId,
              name: stop.room_zone || 'Sala de Exhibición',
              culture: 'Cultura',
              tags: stop.tags || [],
              short_description: stop.room_zone,
              floor: 1,
              featured_pieces: [stop.poi_id],
            },
            stops: [],
            score: 0,
          };
          roomMap.set(roomId, candidate);
        }
        if (!candidate.stops.some((s) => s.poi_id === stop.poi_id)) {
          candidate.stops.push({
            ...stop,
            orden_sala: stop.orden_sala || index + 1,
            ranking: stop.ranking || 1,
            estimated_minutes: 1.5,
          });
        }
      });
    });
  }

  // 2. Score rooms and their pieces based on user's interests, ranking, and pace
  const roomCandidates = Array.from(roomMap.values());

  roomCandidates.forEach((cand) => {
    let rScore = 10;
    const roomTags = (cand.room.tags || []).map((t) => t.toLowerCase());
    const roomNameLower = cand.room.name.toLowerCase();
    const roomIdLower = cand.room.id.toLowerCase();

    // Mandatory rule: In MNA, Sala Mexica is always given top baseline priority
    if (isMNA && (cand.room.id === 'sala-mexica' || roomNameLower.includes('mexica'))) {
      rScore += 5000;
    }

    // Prioritize archaeological ground floor galleries in MNA for general highlights
    if (isMNA && !roomIdLower.includes('etno')) {
      rScore += 40;
    }

    selectedInterestKeys.forEach((key) => {
      const lowerKey = key.toLowerCase();
      const synonyms = INTEREST_KEYWORDS[lowerKey] || [lowerKey];

      const matches = synonyms.some((syn) => {
        const s = syn.toLowerCase();
        return (
          roomTags.some((t) => t.includes(s) || s.includes(t)) ||
          roomNameLower.includes(s) ||
          roomIdLower.includes(s)
        );
      });

      if (matches) {
        rScore += 100;
      }
    });

    // Score pieces inside the room
    cand.stops.forEach((stop) => {
      let pScore = 10;
      if (stop.poi_id === 'piedra-del-sol') {
        pScore += 2000; // Guaranteed top priority in Mexica
      }
      if (pace === 'highlights') {
        if (stop.ranking === 1) pScore += 40;
      } else {
        pScore += 20;
        if (stop.ranking === 2) pScore += 20;
      }
      (stop as any)._score = pScore;
    });

    const avgPieceScore = cand.stops.reduce((sum, s) => sum + ((s as any)._score || 0), 0) / (cand.stops.length || 1);
    cand.score = rScore + avgPieceScore;
  });

  // Sort rooms by calculated score descending
  roomCandidates.sort((a, b) => b.score - a.score);

  // 3. Determine target pieces & rooms based on timeLimitMinutes
  // Calibrated targets:
  // - Rápida (30 min): 8-10 pieces, 2 rooms (~4-5 pieces/room)
  // - Estándar (60 min): 15-18 pieces, 3-4 rooms (~4-5 pieces/room)
  // - Completa (90-120 min): 25-35 pieces, 6-8 rooms
  let targetRoomCount = 3;
  let piecesPerRoomTarget = 5;

  if (timeLimitMinutes <= 35) {
    targetRoomCount = 2;
    piecesPerRoomTarget = 5; // 2 * 5 = 10 pieces (or 2 * 4 = 8-10 pieces)
  } else if (timeLimitMinutes <= 75) {
    targetRoomCount = 4;
    piecesPerRoomTarget = 4; // 4 * 4 = 16 pieces (or 3 * 5 = 15-18 pieces)
  } else if (timeLimitMinutes <= 130) {
    targetRoomCount = 6;
    piecesPerRoomTarget = 5; // 6 * 5 = 30 pieces (25-35 pieces)
  } else {
    // 180 min or unlimited (999)
    targetRoomCount = Math.min(roomCandidates.length, 8);
    piecesPerRoomTarget = 5; // ~35 pieces
  }

  // Ensure Sala Mexica is selected in MNA
  const selectedRooms: RoomCandidate[] = [];
  if (isMNA) {
    const mexicaIndex = roomCandidates.findIndex(
      (c) => c.room.id === 'sala-mexica' || c.room.name.toLowerCase().includes('mexica')
    );
    if (mexicaIndex !== -1) {
      selectedRooms.push(roomCandidates[mexicaIndex]);
    }
  }

  for (const cand of roomCandidates) {
    if (selectedRooms.some((r) => r.room.id === cand.room.id)) continue;
    if (selectedRooms.length < targetRoomCount) {
      selectedRooms.push(cand);
    }
  }

  if (selectedRooms.length === 0 && roomCandidates.length > 0) {
    selectedRooms.push(roomCandidates[0]);
  }

  // 4. Select 3-5 pieces per selected room ensuring:
  // - 'piedra-del-sol' is ALWAYS included in sala-mexica
  // - Contiguous grouping within the room (no single-piece jumps)
  // - Internal sorting by orden_sala
  const selectedStops: RouteStop[] = [];

  selectedRooms.forEach((cand) => {
    if (cand.stops.length === 0) return;

    const roomStops = [...cand.stops];
    let chosenForRoom: RouteStop[] = [];

    const hasPiedra = roomStops.find((s) => s.poi_id === 'piedra-del-sol');

    if (pace === 'highlights') {
      const rank1 = roomStops.filter((s) => s.ranking === 1);
      const rank2 = roomStops.filter((s) => s.ranking !== 1);

      chosenForRoom = [...rank1];
      if (chosenForRoom.length < piecesPerRoomTarget) {
        chosenForRoom.push(...rank2.slice(0, piecesPerRoomTarget - chosenForRoom.length));
      } else if (chosenForRoom.length > 5) {
        chosenForRoom = chosenForRoom.slice(0, 5);
      }
    } else {
      chosenForRoom = roomStops.slice(0, Math.min(roomStops.length, piecesPerRoomTarget));
    }

    // Ensure Piedra del Sol is present in Mexica
    if (hasPiedra && !chosenForRoom.some((s) => s.poi_id === 'piedra-del-sol')) {
      chosenForRoom.unshift(hasPiedra);
      if (chosenForRoom.length > 5) {
        chosenForRoom.pop();
      }
    }

    // Enforce Density rule: Minimum 3 pieces per room if available
    if (chosenForRoom.length < 3 && roomStops.length >= 3) {
      for (const s of roomStops) {
        if (!chosenForRoom.some((c) => c.poi_id === s.poi_id)) {
          chosenForRoom.push(s);
          if (chosenForRoom.length >= 3) break;
        }
      }
    }

    // Cap at maximum 5 pieces per room
    if (chosenForRoom.length > 5) {
      chosenForRoom = chosenForRoom.slice(0, 5);
    }

    // Sort pieces within room strictly by orden_sala
    chosenForRoom.sort((a, b) => (a.orden_sala || 99) - (b.orden_sala || 99));

    selectedStops.push(...chosenForRoom);
  });

  // Ensure 'piedra-del-sol' was definitely included if MNA
  if (isMNA && !selectedStops.some((s) => s.poi_id === 'piedra-del-sol')) {
    const mexicaCand = roomMap.get('sala-mexica');
    const piedraStop = mexicaCand?.stops.find((s) => s.poi_id === 'piedra-del-sol');
    if (piedraStop) {
      selectedStops.unshift(piedraStop);
    }
  }

  // 5. Sequence rooms logically (architectural sequence) while keeping pieces grouped inside their rooms
  const orderedStops = sortStopsByAdjacency(manifest.site_id, selectedStops);

  // 6. Calculate realistic duration: 1.5 min per piece + 3 min per room transition
  const calculatedMinutes = calculateRouteTimeMinutes(orderedStops);
  const durationStr = formatRouteDuration(calculatedMinutes);

  return {
    id: `custom-route-${Date.now()}`,
    name: 'Mi Recorrido Personalizado',
    duration: durationStr,
    description: `Itinerario optimizado de ${orderedStops.length} paradas agrupadas por sala (~1.5 min por obra + 3 min por cambio de sala).`,
    stops: orderedStops,
    is_custom: true,
  };
}

/**
 * Sorts stops according to logical physical walking sequence in the venue,
 * while strictly preserving room clustering (3-5 contiguous pieces per room)
 * and ordering pieces inside each room by orden_sala.
 */
export function sortStopsByAdjacency(siteId: string, stops: RouteStop[]): RouteStop[] {
  if (stops.length <= 1) return stops;

  // Group stops by room
  const roomGroups = new Map<string, RouteStop[]>();
  stops.forEach((stop) => {
    const roomId = stop.room_id || stop.room_zone || 'default';
    if (!roomGroups.has(roomId)) {
      roomGroups.set(roomId, []);
    }
    roomGroups.get(roomId)!.push(stop);
  });

  // Sort pieces within each room strictly by orden_sala
  roomGroups.forEach((pieces) => {
    pieces.sort((a, b) => {
      const orderA = a.orden_sala ?? 999;
      const orderB = b.orden_sala ?? 999;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return (a.ranking || 1) - (b.ranking || 1);
    });
  });

  // Architectural room order priority
  const getRoomPriority = (roomId: string, sampleStop: RouteStop): number => {
    const rId = roomId.toLowerCase();
    const rZone = (sampleStop.room_zone || '').toLowerCase();

    if (siteId.toUpperCase() === 'MNA') {
      // Ground floor archaeological sequence:
      // Introducción -> Poblamiento -> Preclásico -> Teotihuacán -> Tolteca -> Mexica -> Oaxaca -> Costa Golfo -> Maya -> Occidente -> Norte
      if (rId.includes('introduccion') || rZone.includes('introducción')) return 1;
      if (rId.includes('poblamiento') || rZone.includes('poblamiento')) return 2;
      if (rId.includes('preclasico') || rZone.includes('preclásico')) return 3;
      if (rId.includes('teotihuacan') || rZone.includes('teotihuacán')) return 4;
      if (rId.includes('tolteca') || rZone.includes('tolteca')) return 5;
      // Central highlight: Sala Mexica
      if (rId.includes('mexica') || rZone.includes('mexica')) return 6;
      if (rId.includes('oaxaca') || rZone.includes('oaxaca')) return 7;
      if (rId.includes('golfo') || rZone.includes('golfo')) return 8;
      if (rId.includes('maya') || rZone.includes('maya')) return 9;
      if (rId.includes('occidente') || rZone.includes('occidente')) return 10;
      if (rId.includes('norte') || rZone.includes('norte')) return 11;
      // Upper floor ethnography
      if (rId.includes('etno') || rZone.includes('pueblos') || rZone.includes('etnografía')) return 20;
      return 15;
    }

    if (siteId.toUpperCase() === 'TEOTIHUACAN') {
      if (rId.includes('luna') || rZone.includes('luna')) return 1;
      if (rId.includes('quetzal') || rZone.includes('quetzal')) return 2;
      if (rId.includes('sol') || rZone.includes('sol')) return 3;
      if (rId.includes('ciudadela') || rZone.includes('ciudadela') || rId.includes('serpiente')) return 4;
      return 10;
    }

    if (siteId.toUpperCase() === 'CHAPULTEPEC') {
      if (rId.includes('carruaje') || rZone.includes('carruaje')) return 1;
      if (rId.includes('mural') || rZone.includes('mural') || rZone.includes('historia')) return 2;
      if (rId.includes('alcazar') || rZone.includes('alcázar') || rZone.includes('carlota')) return 3;
      if (rId.includes('jardin') || rId.includes('torre') || rZone.includes('jardín')) return 4;
      return 10;
    }

    return (sampleStop.map_coords?.y || 50) + (sampleStop.map_coords?.x || 50) * 0.1;
  };

  const sortedRoomEntries = Array.from(roomGroups.entries()).sort(([rIdA, piecesA], [rIdB, piecesB]) => {
    const prioA = getRoomPriority(rIdA, piecesA[0]);
    const prioB = getRoomPriority(rIdB, piecesB[0]);
    return prioA - prioB;
  });

  const finalStops: RouteStop[] = [];
  sortedRoomEntries.forEach(([, pieces]) => {
    finalStops.push(...pieces);
  });

  return finalStops;
}
