import { SiteRoute, RouteStop, Room, PieceData } from '../types';
import { getAssetUrl, normalizePiece } from './urlHelper';
import { getStrings } from '../i18n';
import { getCurrentLanguage } from '../i18n/runtime';

export interface RoutePreferences {
  /** Minutos disponibles. 900 o más = sin límite. */
  timeLimitMinutes: number;
  /** Salas elegidas (vacío = todo el museo). */
  roomIds?: string[];
  /** highlights = audio corto; expert = audio completo. */
  pace: 'highlights' | 'expert';
}

/**
 * Tiempos de una visita real (medidos sobre los textos del MNA: el audio corto dura ~1.3 min y el completo ~3.1 min;
 * a eso se suma mirar la pieza y acercarse a ella).
 */
export const MINUTES_PER_STOP_SHORT = 3;
export const MINUTES_PER_STOP_FULL = 5;
/** Pasar de una sala a otra (las salas son grandes). */
export const MINUTES_PER_ROOM_CHANGE = 2;
/** Subir o bajar de piso, una sola vez por recorrido. */
export const MINUTES_PER_FLOOR_CHANGE = 4;

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

/** Duración corta para listas de recorridos: «40 min», «3 h», «1 h 10». */
export function formatRouteDurationShort(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${String(rest).padStart(2, '0')}` : `${hours} h`;
}

/** Piso de una parada: el que trae, el de su sala en el catálogo o, por el número de sala, 12 en adelante = planta alta. */
function floorOfStop(stop: RouteStop, roomsCatalog?: Room[]): 'PB' | 'PA' {
  if (stop.piso) return stop.piso === 'PA' ? 'PA' : 'PB';
  const id = (stop.room_id || '').toLowerCase();
  const found = roomsCatalog?.find((r) => r.room_id.toLowerCase() === id);
  if (found?.piso) return found.piso === 'PA' ? 'PA' : 'PB';
  const num = id.match(/\d+/);
  return num && parseInt(num[0], 10) >= 12 ? 'PA' : 'PB';
}

/**
 * Duración de un recorrido, la misma en toda la app:
 * - 3 min por obra con audio corto (5 min con el completo), contando escuchar, mirar y acercarse.
 * - + 2 min cada vez que se cambia de sala.
 * - + 4 min una sola vez si el recorrido sube o baja de piso.
 */
export function calculateRouteTimeMinutes(
  stops: RouteStop[],
  isLongAudio: boolean = false,
  roomsCatalog?: Room[]
): number {
  if (!stops || stops.length === 0) return 0;
  let total = stops.length * (isLongAudio ? MINUTES_PER_STOP_FULL : MINUTES_PER_STOP_SHORT);
  let prevRoom: string | null = null;
  const floors = new Set<'PB' | 'PA'>();
  for (const stop of stops) {
    const room = (stop.room_id || stop.room_zone || '').toLowerCase();
    floors.add(floorOfStop(stop, roomsCatalog));
    if (prevRoom !== null && room && room !== prevRoom) total += MINUTES_PER_ROOM_CHANGE;
    if (room) prevRoom = room;
  }
  if (floors.size > 1) total += MINUTES_PER_FLOOR_CHANGE;
  return total;
}

/**
 * Arma un recorrido a la medida con el tiempo y las salas que elige la persona.
 * Primero entran las obras imprescindibles (prioridad 1), luego las muy recomendables (2) y al final las complementarias (3),
 * repartidas entre las salas elegidas, hasta llenar el tiempo. Al final se ordenan como se camina el museo:
 * planta baja y luego alta, sala por sala, y dentro de cada sala en su orden sugerido.
 */
export function generateOptimizedRoute(
  manifestOrPieces: any,
  preferences: RoutePreferences,
  roomsCatalog?: Room[]
): SiteRoute {
  const { timeLimitMinutes, roomIds = [], pace } = preferences;
  const isExpert = pace === 'expert';
  const allRooms: Room[] = roomsCatalog ? [...roomsCatalog] : Array.isArray(manifestOrPieces?.rooms) ? manifestOrPieces.rooms : [];
  const allPieces: PieceData[] = (Array.isArray(manifestOrPieces) ? manifestOrPieces : []).map((p: PieceData) => normalizePiece({ ...p }));

  const roomById = new Map(allRooms.map((r) => [r.room_id, r]));
  const roomNumber = (id: string) => {
    const r = roomById.get(id);
    return parseInt(String(r?.numero_oficial ?? id.match(/\d+/)?.[0] ?? '0'), 10) || 0;
  };
  const floorOf = (p: PieceData) => ((p.piso || roomById.get(p.room_id)?.piso) === 'PA' ? 1 : 0);
  const walkOrder = (a: PieceData, b: PieceData) =>
    floorOf(a) - floorOf(b) || roomNumber(a.room_id) - roomNumber(b.room_id) || (a.orden_sugerido || 99) - (b.orden_sugerido || 99);

  const chosenRooms = new Set(roomIds);
  const pool = allPieces.filter((p) => chosenRooms.size === 0 || chosenRooms.has(p.room_id));
  const stopOf = (p: PieceData) => createRouteStop(p, roomById.get(p.room_id) || ({ room_id: p.room_id, nombre_oficial: p.room_id } as Room), 0);
  const minutesOf = (list: PieceData[]) => calculateRouteTimeMinutes(list.map(stopOf), isExpert, allRooms);

  let picked: PieceData[];
  if (timeLimitMinutes >= 900) {
    picked = [...pool];
  } else {
    // Orden de entrada: prioridad, y a igual prioridad se reparte entre salas (la 1.ª de cada sala, luego la 2.ª…)
    const seen = new Map<string, number>();
    const ranked = [...pool]
      .sort((a, b) => (a.prioridad || 3) - (b.prioridad || 3) || (a.orden_sugerido || 99) - (b.orden_sugerido || 99))
      .map((p) => {
        const key = `${p.room_id}|${p.prioridad || 3}`;
        const n = seen.get(key) || 0;
        seen.set(key, n + 1);
        return { p, tier: p.prioridad || 3, n };
      })
      .sort((a, b) => a.tier - b.tier || a.n - b.n || roomNumber(a.p.room_id) - roomNumber(b.p.room_id));
    picked = [];
    for (const { p } of ranked) {
      const next = [...picked, p].sort(walkOrder);
      if (minutesOf(next) <= timeLimitMinutes) picked = next;
    }
    if (picked.length === 0 && ranked.length > 0) picked = [ranked[0].p];
  }

  picked.sort(walkOrder);
  const finalStops = picked.map((p, i) => ({ ...stopOf(p), ranking: i + 1 }));
  const finalMinutes = calculateRouteTimeMinutes(finalStops, isExpert, allRooms);
  const routeStrings = getStrings(getCurrentLanguage()).routes;
  const roomCount = new Set(picked.map((p) => p.room_id)).size;

  return {
    id: `custom-route-${timeLimitMinutes}m-${Date.now()}`,
    route_id: `custom-route-${timeLimitMinutes}m`,
    name: routeStrings.curatedName(formatRouteDuration(finalMinutes)),
    title: routeStrings.curatedName(formatRouteDuration(finalMinutes)),
    duration: formatRouteDuration(finalMinutes),
    estimated_minutes: finalMinutes,
    description: routeStrings.curatedDescription(roomCount),
    stops: finalStops,
  };
}

function createRouteStop(piece: PieceData, room: Room, ranking: number): RouteStop {
  const pId = piece.piece_id || piece.id || (piece as any).poi_id;
  const roomName = room.nombre_oficial || room.name || room.room_id;
  const piso = piece.piso || room.piso || 'PB';

  return {
    poi_id: pId,
    piece_id: pId,
    id: pId,
    title: piece.titulo || piece.title || pId,
    room_zone: roomName,
    file: piece.image_filename || '',
    map_coords: { x: piece.map_x || 50, y: piece.map_y || 50 },
    estimated_minutes: MINUTES_PER_STOP_SHORT,
    room_id: room.room_id,
    ranking,
    thumbnail: piece.image_filename ? getAssetUrl(`images/pieces/${piece.image_filename}`) : '',
    is_premium: !piece.is_free,
    piso,
    tags: [roomName, piso],
  };
}
