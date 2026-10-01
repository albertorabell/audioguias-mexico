import type { Room } from '../types';

/**
 * Cómo se nombra el "número" de una sala en pantalla.
 *
 * - Si la fila del Sheets trae la columna `etiqueta` (p. ej. "Eje 1"), se usa tal cual.
 * - Si no, se usa "Sala NN" con el número oficial (como siempre).
 *
 * Así la planta alta puede mostrarse como "Eje 1 … Eje 5" sin tocar código:
 * solo se llena la columna `etiqueta` en TRABAJO_SALAS.
 */
export function getRoomLabel(room: Partial<Room> | null | undefined): string {
  if (!room) return 'Sala';
  const etiqueta = (room.etiqueta || '').trim();
  if (etiqueta) return etiqueta;
  const raw = room.numero_oficial;
  const hasNumber = raw !== undefined && raw !== null && String(raw).trim() !== '';
  const n = hasNumber ? String(raw) : room.room_id?.match(/\d+/)?.[0] || '';
  return n ? `Sala ${n.padStart(2, '0')}` : 'Sala';
}

/** Versión corta para la pastilla del mapa: "Eje 1" → "1", "Sala 06" → "06". */
export function getRoomShortLabel(room: Partial<Room> | null | undefined): string {
  const label = getRoomLabel(room);
  const m = label.match(/(\d+)\s*$/);
  return m ? m[1] : label.slice(0, 3);
}

/** Palabra para contar los espacios de la planta alta: "ejes" si se llaman "Eje N", si no "salas". */
export function getUnitWord(rooms: Partial<Room>[]): 'ejes' | 'salas' {
  return rooms.length > 0 && rooms.every((r) => /^eje\b/i.test((r.etiqueta || '').trim())) ? 'ejes' : 'salas';
}
