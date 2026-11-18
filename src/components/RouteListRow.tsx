import React, { useId, useState } from 'react';
import { ChevronDown, Play } from 'lucide-react';
import { PieceData, SiteRoute } from '../types';
import { PieceImage } from './PieceImage';
import { esCaminata } from '../utils/caminata';

interface RouteListRowProps {
  route: SiteRoute;
  /** «1 h 10 min», «45 min»: ya con el formato corto. */
  duration: string;
  /** «12 paradas». */
  stopsText: string;
  /** Parada cuya foto representa el recorrido (puede faltar). */
  cover?: PieceData;
  pieceById: Map<string, PieceData>;
  startLabel: string;
  seeLabel: string;
  hideLabel: string;
  onStart: (route: SiteRoute) => void;
  id?: string;
}

const stopId = (s: { piece_id?: string; id?: string; poi_id?: string }) => String(s.piece_id || s.id || s.poi_id || '');

/**
 * Un recorrido en la portada del sitio, como una fila de la lista de sitios: foto a la izquierda, nombre, duración y paradas,
 * y dos botones: iniciar y «Ver paradas» (despliega la lista de paradas hacia abajo).
 */
export const RouteListRow: React.FC<RouteListRowProps> = ({ route, duration, stopsText, cover, pieceById, startLabel, seeLabel, hideLabel, onStart, id }) => {
  const [open, setOpen] = useState(false);
  const listId = useId();
  // Las caminatas (tramos entre paradas) no cuentan como parada: no se numeran
  let n = 0;
  return (
    <li id={id} className="rounded-2xl border border-line bg-surface overflow-hidden">
      <div className="flex items-stretch">
        <div className="relative w-16 sm:w-28 shrink-0 bg-raised">
          {cover && <PieceImage filename={cover.image_filename} pieceId={cover.piece_id} alt="" thumb className="absolute inset-0 w-full h-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1 px-2.5 sm:px-3 py-2.5 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-[1rem] leading-snug font-medium tracking-[-0.01em] text-balance">{route.name}</h3>
            <p className="mt-0.5 text-cap text-ink-2 tabular-nums">
              {duration} · {stopsText}
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-1.5 shrink-0 w-[7.25rem] sm:w-auto sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => onStart(route)}
              aria-label={startLabel}
              title={startLabel}
              className="btn-primary min-h-9 px-1.5 sm:min-h-10 sm:px-3.5 !text-[0.6875rem] sm:!text-ui leading-tight whitespace-nowrap inline-flex items-center justify-center gap-1"
            >
              <Play className="w-3 h-3 sm:w-4 sm:h-4 fill-current" aria-hidden="true" />
              <span>{startLabel}</span>
            </button>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls={listId}
              aria-label={open ? hideLabel : seeLabel}
              title={open ? hideLabel : seeLabel}
              className="btn-secondary min-h-9 px-1.5 sm:min-h-10 sm:px-3 !text-[0.6875rem] sm:!text-ui leading-tight whitespace-nowrap inline-flex items-center justify-center gap-0.5"
            >
              <span>{open ? hideLabel : seeLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      {open && (
        <ol id={listId} className="border-t border-line px-3.5 py-2">
          {route.stops.map((s, i) => {
            const sid = stopId(s);
            const p = pieceById.get(sid);
            const walk = esCaminata({ piece_id: sid });
            if (!walk) n += 1;
            return (
              <li key={`${sid}-${i}`} className="flex items-start gap-3 py-2">
                <span className={`mt-0.5 w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-cap font-bold tabular-nums ${walk ? 'text-ink-3' : 'bg-raised text-ink-2'}`}>
                  {walk ? '·' : n}
                </span>
                <span className={`min-w-0 flex-1 text-ui leading-snug ${walk ? 'text-ink-3' : 'text-ink'}`}>{p?.titulo || s.title}</span>
              </li>
            );
          })}
        </ol>
      )}
    </li>
  );
};

/** La foto que representa a cada recorrido: una parada con foto, la más importante (prioridad 1) y que no repita la de otro recorrido de la lista. */
export function routeCovers(routes: SiteRoute[], pieceById: Map<string, PieceData>): Map<string, PieceData> {
  const used = new Set<string>();
  const out = new Map<string, PieceData>();
  for (const r of routes) {
    const cands = r.stops
      .map((s) => pieceById.get(stopId(s)))
      .filter((p): p is PieceData => !!p && !!p.image_filename && !esCaminata(p));
    if (!cands.length) continue;
    const fresh = cands.filter((p) => !used.has(p.image_filename));
    const pool = fresh.length ? fresh : cands;
    const best = [...pool].sort((a, b) => (a.prioridad || 9) - (b.prioridad || 9))[0];
    used.add(best.image_filename);
    out.set(r.id, best);
  }
  return out;
}
