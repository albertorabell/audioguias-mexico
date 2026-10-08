import React, { useMemo } from 'react';
import { Check, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { SiteRoute, PieceData, Room } from '../types';
import { useLanguage } from '../utils/LanguageContext';
import { calculateRouteTimeMinutes, formatRouteDuration } from '../utils/routeOptimizer';
import { getRoomLabel } from '../utils/roomLabel';
import { TopBar } from './ui/TopBar';
import { PassButton } from './ui/HeaderControls';
import { PieceImage } from './PieceImage';

export interface ActiveTour {
  route: SiteRoute;
  index: number;
}

interface RoutesScreenProps {
  routes: SiteRoute[];
  tour: ActiveTour | null;
  pieces: PieceData[];
  rooms: Room[];
  hasPass: boolean;
  onOpenPaywall: () => void;
  onContinueTour: () => void;
  onOpenStop: (index: number) => void;
  onStartRoute: (route: SiteRoute) => void;
  onEndTour: () => void;
  onOpenWizard: () => void;
}

const stopId = (s: { piece_id?: string; id?: string; poi_id?: string }) => s.piece_id || s.id || s.poi_id || '';

/** Pestaña "Recorridos": el recorrido en curso (si hay) y los recorridos armados para empezar. */
export const RoutesScreen: React.FC<RoutesScreenProps> = ({
  routes,
  tour,
  pieces,
  rooms,
  hasPass,
  onOpenPaywall,
  onContinueTour,
  onOpenStop,
  onStartRoute,
  onEndTour,
  onOpenWizard,
}) => {
  const { strings } = useLanguage();
  const u = strings.ui;

  const pieceById = useMemo(() => new Map(pieces.map((p) => [p.piece_id, p])), [pieces]);
  const roomById = useMemo(() => new Map(rooms.map((r) => [r.room_id, r])), [rooms]);
  const roomLine = (pieceId: string) => {
    const p = pieceById.get(pieceId);
    const r = p ? roomById.get(p.room_id) : undefined;
    return r ? `${getRoomLabel(r)} · ${r.nombre_oficial}` : '';
  };

  const sorted = useMemo(
    () => [...routes].filter((r) => r.stops?.length && r.id !== tour?.route.id).sort((a, b) => a.stops.length - b.stops.length),
    [routes, tour?.route.id]
  );

  return (
    <div className="min-h-dvh bg-bg text-ink pb-tabbar">
      <TopBar title={tour ? tour.route.name : u.tabs.routes} revealAfter={90} right={<PassButton hasPass={hasPass} onClick={onOpenPaywall} />} />

      <main className="pt-5">
        {tour ? (
          <section className="px-5" aria-labelledby="tour-title" id="active-tour">
            <p className="text-cap font-semibold text-jade">{u.routes.current}</p>
            <h1 id="tour-title" className="mt-1 font-serif text-h2 font-medium tracking-[-0.015em] text-balance">
              {tour.route.name}
            </h1>
            <p className="mt-2 text-ui text-ink-2">{u.routes.progress(tour.index + 1, tour.route.stops.length)}</p>
            <div className="mt-3 h-1.5 rounded-full bg-raised overflow-hidden" aria-hidden="true">
              <div className="h-full bg-jade rounded-full" style={{ width: `${((tour.index + 1) / tour.route.stops.length) * 100}%` }} />
            </div>
            <div className="mt-4 flex gap-2.5">
              <button type="button" id="btn-continue-tour" onClick={onContinueTour} className="btn-primary flex-1">
                {u.routes.continue}
              </button>
              <button type="button" id="btn-end-tour" onClick={onEndTour} className="btn-secondary">
                {u.routes.end}
              </button>
            </div>

            <ol className="mt-6 relative">
              {tour.route.stops.map((s, i) => {
                const id = stopId(s);
                const p = pieceById.get(id);
                const done = i < tour.index;
                const here = i === tour.index;
                return (
                  <li key={`${id}-${i}`} className="relative">
                    {i < tour.route.stops.length - 1 && (
                      <span className={`absolute left-[0.9375rem] top-10 bottom-0 w-0.5 ${done ? 'bg-jade/60' : 'bg-line'}`} aria-hidden="true" />
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenStop(i)}
                      aria-current={here ? 'step' : undefined}
                      className="w-full flex items-start gap-3.5 py-2.5 text-left cursor-pointer rounded-xl"
                    >
                      <span
                        className={`relative z-10 w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-cap font-bold tabular-nums ${
                          here ? 'bg-jade text-on-jade' : done ? 'bg-jade/20 text-jade' : 'bg-bg border-2 border-line-strong text-ink-3'
                        }`}
                      >
                        {done ? <Check className="w-4 h-4" strokeWidth={3} /> : i + 1}
                      </span>
                      <span className="min-w-0 flex-1 pt-0.5">
                        <span className={`block text-[1rem] leading-snug ${here ? 'font-bold text-ink' : done ? 'text-ink-3' : 'font-semibold text-ink'}`}>
                          {p?.titulo || s.title}
                        </span>
                        <span className="block text-cap text-ink-3 truncate">{roomLine(id) || s.room_zone}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        ) : (
          <section className="px-5">
            <h1 className="font-serif text-h1 font-medium tracking-[-0.02em]">{u.routes.title}</h1>
            <p className="mt-2 text-[1.0625rem] leading-relaxed text-ink-2">{u.routes.intro}</p>
          </section>
        )}

        <section className="mt-10" aria-labelledby="suggested-title">
          <h2 id="suggested-title" className="px-5 font-serif text-h3 font-medium">
            {tour ? u.routes.others : u.routes.suggested}
          </h2>
          <div className="mt-3 px-5 space-y-3">
            {sorted.map((route) => {
              const minutes = route.estimated_minutes || calculateRouteTimeMinutes(route.stops);
              const running = tour?.route.id === route.id;
              return (
                <div key={route.id} className="rounded-2xl bg-surface border border-line overflow-hidden">
                  <div className="grid grid-cols-4 gap-px bg-line h-24">
                    {route.stops.slice(0, 4).map((s) => {
                      const p = pieceById.get(stopId(s));
                      return (
                        <span key={stopId(s)} className="bg-raised overflow-hidden">
                          <PieceImage filename={p?.image_filename || s.thumbnail} pieceId={stopId(s)} alt="" className="w-full h-full object-cover" />
                        </span>
                      );
                    })}
                  </div>
                  <div className="p-4">
                    <h3 className="text-[1.125rem] font-bold leading-snug">{route.name}</h3>
                    <p className="mt-1 text-cap text-ink-3">{u.routeMeta(formatRouteDuration(minutes), route.stops.length)}</p>
                    {route.description && <p className="mt-2 text-ui leading-relaxed text-ink-2 line-clamp-2">{route.description}</p>}
                    <button
                      type="button"
                      onClick={() => (running ? onContinueTour() : onStartRoute(route))}
                      className={`${running ? 'btn-secondary' : 'btn-primary'} w-full mt-4`}
                    >
                      {running ? u.routes.continue : u.routes.start}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="px-5 mt-6">
          <button
            type="button"
            onClick={onOpenWizard}
            className="w-full rounded-2xl border border-dashed border-line-strong p-4 flex items-center gap-3.5 text-left cursor-pointer active:bg-raised"
          >
            <span className="w-11 h-11 rounded-full bg-raised flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-5 h-5 text-jade" strokeWidth={1.8} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[1.0625rem] font-bold">{u.museum.buildRoute}</span>
              <span className="block text-cap text-ink-3 mt-0.5">{u.museum.buildRouteSub}</span>
            </span>
            <ChevronRight className="w-5 h-5 text-ink-3 shrink-0" />
          </button>
        </section>
      </main>
    </div>
  );
};

export default RoutesScreen;
