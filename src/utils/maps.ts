/** Enlace para abrir en el mapa del teléfono el camino a pie hasta una parada. Parte de donde esté la persona. */
export function walkingMapsUrl(p: { lat?: number; lng?: number } | null | undefined): string {
  if (!p || typeof p.lat !== 'number' || typeof p.lng !== 'number') return '';
  return `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=walking`;
}
