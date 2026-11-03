import { FIXED, PB_ROOMS, PHYS, WAYPOINTS, ZONES } from './mnaPlan';

type Pt = [number, number];
interface PlanPiece { piece_id: string; room_id: string; piso?: string; orden_sugerido?: number }

/** Punto donde se entra al museo (entrada principal), de donde parte la primera parada de un recorrido. */
export const ENTRANCE: Pt = [460, 1640];
export const ENTRANCE_ZONE = 0;

/** Posición de cada pieza de planta baja en el plano y zona a la que pertenece. Las salas se recorren en el orden físico (PHYS). */
export function computePlan<T extends PlanPiece>(pieces: T[], zoneOfRoom: Map<string, number>) {
  const pos = new Map<string, Pt>();
  const zoneOf = new Map<string, number>();
  const byZone = new Map<number, T[]>();
  const groups = new Map<number, { p: T; k: string }[]>();
  for (const p of pieces) {
    if (p.piso !== 'PB') continue;
    const f = FIXED[p.piece_id];
    const z = f ? f.zone : zoneOfRoom.get(p.room_id);
    if (z === undefined || z < 0 || z > 11) continue;
    zoneOf.set(p.piece_id, z);
    if (f) {
      pos.set(p.piece_id, f.at);
      byZone.set(z, [...(byZone.get(z) || []), p]);
    } else {
      const g = groups.get(z) || [];
      g.push({ p, k: p.piece_id.replace(/^mna_s\d+_/, '') });
      groups.set(z, g);
    }
  }
  for (const [z, list] of groups) {
    const room = PB_ROOMS.find((r) => r.num === z);
    if (!room) continue;
    const order = PHYS[z] || [];
    list.sort((a, b) => {
      const ia = order.indexOf(a.k), ib = order.indexOf(b.k);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || (a.p.orden_sugerido || 0) - (b.p.orden_sugerido || 0);
    });
    const [x0, y0, x1, y1] = room.rect;
    const iw = x1 - x0 - 40, ih = y1 - y0 - 40, n = list.length;
    const vert = room.flow === 'up' || room.flow === 'down';
    const along = vert ? ih : iw, across = vert ? iw : ih;
    const perp = Math.max(1, Math.min(n, Math.round(Math.sqrt((n * across) / along))));
    const lines = Math.ceil(n / perp);
    list.forEach((q, i) => {
      const ln = Math.floor(i / perp);
      let k = i % perp;
      const inLine = Math.min(perp, n - ln * perp);
      if (ln % 2) k = inLine - 1 - k;
      const a = lines > 1 ? ln / (lines - 1) : 0.5;
      const b = inLine > 1 ? k / (inLine - 1) : 0.5;
      let fx: number, fy: number;
      if (room.flow === 'up') { fy = 1 - a; fx = b; }
      else if (room.flow === 'down') { fy = a; fx = b; }
      else if (room.flow === 'left') { fx = 1 - a; fy = b; }
      else { fx = a; fy = b; }
      pos.set(q.p.piece_id, [x0 + 20 + iw * fx, y0 + 20 + ih * fy]);
      byZone.set(z, [...(byZone.get(z) || []), q.p]);
    });
  }
  return { pos, zoneOf, byZone };
}

/** Puntos por donde se camina de un punto a otro, pasando por las puertas entre zonas. */
export function legPoints(a: Pt, za: number, b: Pt, zb: number): Pt[] {
  const pts: Pt[] = [a];
  if (za !== zb) {
    const ia = ZONES.indexOf(za), ib = ZONES.indexOf(zb);
    const step = ib > ia ? 1 : -1;
    for (let k = ia; k !== ib; k += step) {
      const key = step > 0 ? `${ZONES[k]}-${ZONES[k + 1]}` : `${ZONES[k - 1]}-${ZONES[k]}`;
      const w = WAYPOINTS[key] || [];
      pts.push(...(step > 0 ? w : [...w].reverse()));
    }
  }
  pts.push(b);
  return pts;
}

export const pathLength = (pts: Pt[]) => pts.reduce((s, p, i, a) => (i ? s + Math.hypot(p[0] - a[i - 1][0], p[1] - a[i - 1][1]) : 0), 0);
/** Pasos aproximados (0.09 m por unidad del dibujo, 0.7 m por paso; mínimo 3). */
export const stepsOf = (pts: Pt[]) => Math.max(3, Math.round((pathLength(pts) * 0.09) / 0.7));
