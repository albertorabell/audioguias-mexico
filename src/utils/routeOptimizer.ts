import { SiteManifest, SiteRoute, RouteStop, Room } from '../types';

export interface RoutePreferences {
  timeLimitMinutes: number; // 45, 90, 180, or 999 (sin límite)
  selectedInterestKeys: string[];
  pace: 'highlights' | 'expert';
}

const INTEREST_KEYWORDS: Record<string, string[]> = {
  // MNA
  'cosmogonia-mexica': ['mexica', 'sol', 'tenochtitlan', 'monolito', 'coatlicue', 'coyolxauhqui', 'azteca'],
  'mundo-maya': ['maya', 'calakmul', 'jade', 'mascara', 'funeraria'],
  'arte-monumental': ['monumental', 'colosal', 'cabeza', 'olmeca', 'origenes', 'escultura'],
  'vida-cotidiana-tumbas': ['tumbas', 'misticismo', 'oaxaca', 'funeraria', 'ajuar', 'calakmul', 'dioses'],
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
 * Optimizes an itinerary based on user's available time, cultural interests, and pace.
 * Returns an ordered SiteRoute with logically sequenced stops.
 */
export function generateOptimizedRoute(
  manifest: SiteManifest,
  preferences: RoutePreferences
): SiteRoute {
  const { timeLimitMinutes, selectedInterestKeys, pace } = preferences;

  // 1. Gather all candidate stops from all routes in manifest + rooms
  const stopMap = new Map<string, RouteStop>();

  // Collect from manifest routes
  if (manifest.routes) {
    manifest.routes.forEach((route) => {
      route.stops.forEach((stop) => {
        if (!stopMap.has(stop.poi_id)) {
          stopMap.set(stop.poi_id, {
            ...stop,
            estimated_minutes: stop.estimated_minutes || 8,
            ranking: stop.ranking || 2,
            tags: stop.tags || [],
          });
        }
      });
    });
  }

  // Also supplement with pieces from rooms if not already present
  if (manifest.rooms) {
    manifest.rooms.forEach((room: Room) => {
      if (room.pieces_info) {
        room.pieces_info.forEach((piece) => {
          if (!stopMap.has(piece.poi_id)) {
            stopMap.set(piece.poi_id, {
              poi_id: piece.poi_id,
              title: piece.title,
              room_zone: room.name,
              file: piece.file,
              map_coords: room.coords || { x: 50, y: 50 },
              estimated_minutes: piece.estimated_minutes || 8,
              room_id: room.id,
              ranking: piece.is_premium ? 2 : 1,
              tags: room.tags || [],
            });
          }
        });
      }
    });
  }

  const allStops = Array.from(stopMap.values());
  if (allStops.length === 0) {
    return {
      id: 'custom-empty-route',
      name: 'Mi Recorrido Personalizado',
      duration: '0 min',
      description: 'No se encontraron paradas para los criterios seleccionados.',
      stops: [],
      is_custom: true,
    };
  }

  // 2. Score each stop based on interest match, pace, and ranking
  const scoredStops = allStops.map((stop) => {
    let score = 10;
    const stopTags = (stop.tags || []).map((t) => t.toLowerCase());
    const stopTitleLower = stop.title.toLowerCase();
    const stopZoneLower = stop.room_zone.toLowerCase();

    // Check overlap with selected interests using both key and synonym keywords
    let matchCount = 0;
    selectedInterestKeys.forEach((key) => {
      const lowerKey = key.toLowerCase();
      const synonyms = INTEREST_KEYWORDS[lowerKey] || [lowerKey];

      const matches = synonyms.some((syn) => {
        const s = syn.toLowerCase();
        return (
          stopTags.some((t) => t.includes(s) || s.includes(t)) ||
          stopTitleLower.includes(s) ||
          stopZoneLower.includes(s)
        );
      });

      if (matches) {
        matchCount++;
      }
    });

    score += matchCount * 30;

    // Pace weight
    if (pace === 'highlights') {
      if (stop.ranking === 1) score += 35;
      else if (stop.ranking === 2) score += 10;
      else score -= 15;
    } else {
      // Expert: values deep dives and variety across rooms
      score += 20;
      if (stop.ranking === 2) score += 20;
    }

    return { stop, score };
  });

  // Sort descending by score
  scoredStops.sort((a, b) => b.score - a.score);

  // 3. Greedily accumulate pieces up to time limit
  const chosenStops: RouteStop[] = [];
  let accumulatedMinutes = 0;

  for (const item of scoredStops) {
    const est = item.stop.estimated_minutes || 8;
    // Always include at least 2 stops if available, otherwise check time limit
    if (
      chosenStops.length < 2 ||
      accumulatedMinutes + est <= timeLimitMinutes ||
      timeLimitMinutes >= 900
    ) {
      chosenStops.push(item.stop);
      accumulatedMinutes += est;
    }
  }

  // If somehow empty, take first 2
  if (chosenStops.length === 0 && allStops.length > 0) {
    chosenStops.push(allStops[0]);
    if (allStops.length > 1) chosenStops.push(allStops[1]);
    accumulatedMinutes = chosenStops.reduce((sum, s) => sum + (s.estimated_minutes || 8), 0);
  }

  // 4. Order stops by logical spatial room adjacency (architectural walkthrough flow)
  const orderedStops = sortStopsByAdjacency(manifest.site_id, chosenStops);
  const durationStr = formatRouteDuration(accumulatedMinutes);

  return {
    id: `custom-route-${Date.now()}`,
    name: 'Mi Recorrido Personalizado',
    duration: durationStr,
    description: `Itinerario optimizado de ${orderedStops.length} paradas generado a tu medida según tus preferencias (${preferences.pace === 'highlights' ? 'Solo lo imperdible' : 'Detallado para expertos'}).`,
    stops: orderedStops,
    is_custom: true,
  };
}

/**
 * Sorts stops according to logical physical walking sequence in the venue
 */
function sortStopsByAdjacency(siteId: string, stops: RouteStop[]): RouteStop[] {
  if (stops.length <= 1) return stops;

  const getPriority = (stop: RouteStop): number => {
    const rZone = (stop.room_zone || '').toLowerCase();
    const rId = (stop.room_id || '').toLowerCase();

    if (siteId === 'MNA') {
      if (rId.includes('origenes') || rZone.includes('orígenes') || rZone.includes('introducción')) return 1;
      if (rId.includes('tolteca') || rZone.includes('tolteca')) return 2;
      if (rId.includes('mexica') || rZone.includes('mexica')) {
        // Within Mexica, Piedra del Sol before Coatlicue / Coyolxauhqui
        if (stop.poi_id === 'piedra-del-sol') return 3;
        if (stop.poi_id === 'coatlicue') return 4;
        return 5;
      }
      if (rId.includes('oaxaca') || rZone.includes('oaxaca')) return 6;
      if (rId.includes('maya') || rZone.includes('maya')) return 7;
      return 10;
    }

    if (siteId === 'TEOTIHUACAN') {
      // Flow from Plaza de la Luna downward or along the Calzada
      if (rId.includes('luna') || rZone.includes('luna')) return 1;
      if (rId.includes('quetzal') || rZone.includes('quetzal')) return 2;
      if (rId.includes('sol') || rZone.includes('sol')) return 3;
      if (rId.includes('ciudadela') || rZone.includes('ciudadela') || rId.includes('serpiente')) return 4;
      return 10;
    }

    if (siteId === 'CHAPULTEPEC') {
      // Flow from ground entrance (Carruajes) -> History & Murals -> Imperial Alcázar -> Terrace
      if (rId.includes('carruaje') || rZone.includes('carruaje')) {
        if (stop.poi_id === 'carruaje-juarez') return 1;
        return 2;
      }
      if (rId.includes('mural') || rZone.includes('mural') || rZone.includes('historia')) return 3;
      if (rId.includes('alcazar') || rZone.includes('alcázar') || rZone.includes('carlota')) return 4;
      if (rId.includes('jardin') || rId.includes('torre') || rZone.includes('jardín')) return 5;
      return 10;
    }

    // Default: by map_coords y if available
    return (stop.map_coords?.y || 50) + (stop.map_coords?.x || 50) * 0.1;
  };

  return [...stops].sort((a, b) => getPriority(a) - getPriority(b));
}
