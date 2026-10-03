import type { Room } from '../types';
import { getStrings } from '../i18n';
import { getCurrentLanguage } from '../i18n/runtime';

/**
 * Cómo se nombra el "número" de una sala en pantalla.
 *
 * - Si la fila del Sheets trae la columna `etiqueta` (p. ej. "Eje 1"), se usa tal cual.
 *   En inglés, "Eje N" se muestra como "Axis N" salvo que exista la columna etiqueta_en.
 * - Si no, se usa "Sala NN" (en inglés "Room NN") con el número oficial.
 *
 * Así la planta alta puede mostrarse como "Eje 1 … Eje 5" sin tocar código:
 * solo se llena la columna `etiqueta` en TRABAJO_SALAS.
 */
export function getRoomLabel(room: Partial<Room> | null | undefined): string {
  const lang = getCurrentLanguage();
  const word = getStrings(lang).common.roomWord;
  if (!room) return word;
  const etiqueta = (room.etiqueta || '').trim();
  if (etiqueta) {
    const m = lang === 'en' ? etiqueta.match(/^eje\s+(\d+)$/i) : null;
    return m ? `Axis ${m[1]}` : etiqueta;
  }
  const raw = room.numero_oficial;
  const hasNumber = raw !== undefined && raw !== null && String(raw).trim() !== '';
  const n = hasNumber ? String(raw) : room.room_id?.match(/\d+/)?.[0] || '';
  return n ? `${word} ${n.padStart(2, '0')}` : word;
}

/** Versión corta para la pastilla del mapa: "Eje 1" → "1", "Sala 06" → "06". */
export function getRoomShortLabel(room: Partial<Room> | null | undefined): string {
  const label = getRoomLabel(room);
  const m = label.match(/(\d+)\s*$/);
  return m ? m[1] : label.slice(0, 3);
}

/** Palabra para contar los espacios de la planta alta: "ejes" si se llaman "Eje N", si no "salas". */
export function getUnitWord(rooms: Partial<Room>[]): string {
  const o = getStrings(getCurrentLanguage()).overview;
  return rooms.length > 0 && rooms.every((r) => /^eje\b/i.test((r.etiqueta || '').trim())) ? o.unitAxes : o.unitRooms;
}
