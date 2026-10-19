/** Enlace para abrir en el mapa del teléfono el camino a pie hasta una parada. Parte de donde esté la persona.
 * Usa las coordenadas si la parada las tiene; si no, el nombre del lugar (columna lugar_mapa). Sin ninguno, no hay enlace. */
export function walkingMapsUrl(p: { lat?: number; lng?: number; lugar_mapa?: string } | null | undefined): string {
  if (!p) return '';
  const base = 'https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=';
  if (typeof p.lat === 'number' && typeof p.lng === 'number') return `${base}${p.lat},${p.lng}`;
  const lugar = (p.lugar_mapa || '').trim();
  return lugar ? `${base}${encodeURIComponent(lugar)}` : '';
}
