import React, { useMemo } from 'react';
import { Check, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { SiteRoute, PieceData, Room } from '../types';
import { useLanguage } from '../utils/LanguageContext';
import { calculateRouteTimeMinutes, formatRouteDurationShort } from '../utils/routeOptimizer';
import { getRoomLabel } from '../utils/roomLabel';
import { TopBar } from './ui/TopBar';
import { PassButton } from './ui/HeaderControls';

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
  /** Sin esta función no se ofrece "arma tu ruta". */
  onOpenWizard?: () => void;
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

  const minutesOf = (r: SiteRoute) => r.estimated_minutes || calculateRouteTimeMinutes(r.stops);

  /** Recorridos en secciones: según tu tiempo, por tema y para verlo todo (o una sola lista si el sitio no los agrupa). */
  const sections = useMemo(() => {
    const list = [...routes].filter((r) => r.stops?.length && r.id !== tour?.route.id).sort((a, b) => minutesOf(a) - minutesOf(b));
    if (!list.some((r) => r.group)) return [{ key: 'all', title: tour ? u.routes.others : u.routes.suggested, routes: list }];
    const defs: { key: string; title: string; test: (r: SiteRoute) => boolean }[] = [
      { key: 'tiempo', title: u.routes.groupTiempo, test: (r) => !r.group || r.group === 'tiempo' },
      { key: 'tema', title: u.routes.groupTema, test: (r) => r.group === 'tema' },
      { key: 'completo', title: u.routes.groupCompleto, test: (r) => r.group === 'completo' },
    ];
    return defs.map((d) => ({ key: d.key, title: d.title, routes: list.filter(d.test) })).filter((x) => x.routes.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routes, tour?.route.id, u]);

  return (
    <div className="min-h-dvh bg-bg text-ink pb-tabbar">
      <TopBar title={tour ? tour.route.name : u.tabs.routes} revealAfter={90} right={<PassButton hasPass={hasPass} onClick={onOpenPaywall} />} />

      <main className="pt-5">
        {tour ? (
          <section className="px-5" aria-labelledby="tour-title" id="active-tour">
            <p className="text-cap font-semibold text-jade-ink">{u.routes.current}</p>
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
                          here ? 'bg-jade text-on-jade' : done ? 'bg-jade/20 text-jade-ink' : 'bg-bg border-2 border-line-strong text-ink-3'
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
            <p className="mt-2 text-[1.0625rem] leading-relaxed text-ink-2">{onOpenWizard ? u.routes.intro : u.routes.introFixed}</p>
          </section>
        )}

        {sections.map((section, idx) => (
          <section key={section.key} className="mt-10" aria-labelledby={`routes-${section.key}`}>
            <h2 id={`routes-${section.key}`} className="px-5 font-serif text-h3 font-medium">
              {section.title}
            </h2>
            {idx === 0 && <p className="mt-1 px-5 text-cap text-ink-3">{u.routes.timeNote}</p>}
            <ul className="mt-4 mx-5 border-t border-line md:grid md:grid-cols-2 md:gap-x-6">
              {section.routes.map((route) => {
                const running = tour?.route.id === route.id;
                return (
                  <li key={route.id} className="border-b border-line py-4 flex items-start gap-4">
                    <span className="w-[4.75rem] shrink-0 pt-0.5">
                      <span className="block font-serif text-[1.375rem] leading-none tabular-nums text-ink whitespace-nowrap">
                        {formatRouteDurationShort(minutesOf(route))}
                      </span>
                      <span className="block mt-1.5 text-cap text-ink-3">{u.worksCount(route.stops.length)}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[1.0625rem] font-bold leading-snug">{route.name}</h3>
                      {route.description && <p className="mt-1 text-cap leading-[1.5] text-ink-2 text-pretty">{route.description}</p>}
                      <button
                        type="button"
                        onClick={() => (running ? onContinueTour() : onStartRoute(route))}
                        className={`${running ? 'btn-secondary' : 'btn-primary'} mt-3 min-h-10 px-4 text-ui`}
                      >
                        {running ? u.routes.continue : u.routes.start}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {onOpenWizard && (
        <section className="px-5 mt-6">
          <button
            type="button"
            onClick={onOpenWizard}
            className="w-full rounded-2xl border border-dashed border-line-strong p-4 flex items-center gap-3.5 text-left cursor-pointer active:bg-raised"
          >
            <span className="w-11 h-11 rounded-full bg-raised flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-5 h-5 text-jade-ink" strokeWidth={1.8} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[1.0625rem] font-bold">{u.museum.buildRoute}</span>
              <span className="block text-cap text-ink-3 mt-0.5">{u.museum.buildRouteSub}</span>
            </span>
            <ChevronRight className="w-5 h-5 text-ink-3 shrink-0" />
          </button>
        </section>
        )}
      </main>
    </div>
  );
};

export default RoutesScreen;
