/** Distancia en metros entre dos puntos (fórmula de haversine). */
export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Redondea una distancia para leerla fácil: de 5 en 5 hasta 100 m, de 10 en 10 hasta 1 km y después de 50 en 50. */
export function roundMeters(m: number): number {
  if (m < 100) return Math.max(5, Math.round(m / 5) * 5);
  if (m < 1000) return Math.round(m / 10) * 10;
  return Math.round(m / 50) * 50;
}

/** Círculo (polígono de 48 lados) alrededor de un punto, para dibujar la precisión del GPS. */
export function circlePolygon(lat: number, lng: number, radiusM: number, steps = 48): number[][] {
  const out: number[][] = [];
  const dLat = radiusM / 111320;
  const dLng = radiusM / (111320 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * 2 * Math.PI;
    out.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)]);
  }
  return out;
}
