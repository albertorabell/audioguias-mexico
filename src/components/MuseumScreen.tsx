import React, { useMemo, useState } from 'react';
import { ChevronRight, SlidersHorizontal, Map as MapIcon, CircleHelp } from 'lucide-react';
import { SiteSummary, SiteManifest, SiteRoute, Room, PieceData } from '../types';
import { useLanguage } from '../utils/LanguageContext';
import { getRoomShortLabel } from '../utils/roomLabel';
import { calculateRouteTimeMinutes, formatRouteDuration } from '../utils/routeOptimizer';
import { TopBar } from './ui/TopBar';
import { LanguageMenu, PassButton } from './ui/HeaderControls';
import { PieceImage } from './PieceImage';
import { OfflineTourBanner } from './OfflineTourBanner';
import { IntroTour } from './IntroTour';

export interface ContinueInfo {
  eyebrow: string;
  title: string;
  detail: string;
  imageFilename?: string;
  pieceId?: string;
  onContinue: () => void;
}

interface MuseumScreenProps {
  site: SiteSummary;
  manifest: SiteManifest | null;
  rooms: Room[];
  pieces: PieceData[];
  hasPass: boolean;
  floor: 'PB' | 'PA';
  onFloorChange: (f: 'PB' | 'PA') => void;
  continueInfo?: ContinueInfo | null;
  audioPieces: PieceData[];
  onBack: () => void;
  onOpenPaywall: () => void;
  onSelectRoom: (room: Room) => void;
  onStartRoute: (route: SiteRoute) => void;
  /** Sin esta función no se ofrece "arma tu ruta" (Teotihuacán solo tiene sus dos rutas). */
  onOpenWizard?: () => void;
  /** Sin plano (sitios nuevos sin mapa) no hay botón "ver plano". */
  onOpenMap?: () => void;
  /** Sitio al aire libre: sin selector de pisos. */
  zones?: boolean;
}

/** Ordena las piezas de una sala como se recorren. */
export const byOrder = (a: PieceData, b: PieceData) => (a.orden_sugerido || 99) - (b.orden_sugerido || 99);

/**
 * Pestaña "Museo": dónde estás, por dónde empezar (recorridos armados) y todas las salas por piso.
 */
export const MuseumScreen: React.FC<MuseumScreenProps> = ({
  site,
  manifest,
  rooms,
  pieces,
  hasPass,
  floor,
  onFloorChange,
  continueInfo,
  audioPieces,
  onBack,
  onOpenPaywall,
  onSelectRoom,
  onStartRoute,
  onOpenWizard,
  onOpenMap,
  zones = false,
}) => {
  const { strings } = useLanguage();
  const u = strings.ui;
  // La bienvenida de arriba ya orienta; la guía paso a paso queda solo en «¿Cómo se usa?»
  const [introOpen, setIntroOpen] = useState<boolean>(false);

  const pieceById = useMemo(() => new Map(pieces.map((p) => [p.piece_id, p])), [pieces]);
  const piecesByRoom = useMemo(() => {
    const map = new Map<string, PieceData[]>();
    for (const p of pieces) {
      const list = map.get(p.room_id) || [];
      list.push(p);
      map.set(p.room_id, list);
    }
    for (const list of map.values()) list.sort(byOrder);
    return map;
  }, [pieces]);

  const countPB = rooms.filter((r) => r.piso === 'PB').length;
  const countPA = rooms.filter((r) => r.piso === 'PA').length;
  const showFloors = !zones && countPB > 0 && countPA > 0;

  const floorRooms = useMemo(
    () =>
      rooms
        .filter((r) => !showFloors || r.piso === floor)
        .sort((a, b) => (parseInt(String(a.numero_oficial), 10) || 0) - (parseInt(String(b.numero_oficial), 10) || 0)),
    [rooms, floor, showFloors]
  );
  const routes = useMemo(
    () =>
      [...(manifest?.routes || [])]
        .filter((r) => r.stops?.length)
        .sort((a, b) => a.stops.length - b.stops.length),
    [manifest]
  );

  /** Foto de la portada: la del sitio, o la primera obra de un recorrido que tenga imagen. */
  const coverPiece = useMemo(() => {
    const byId = (id?: string) => (id ? pieceById.get(id) : undefined);
    const direct = byId(site.cover_piece_id) || pieces.find((p) => p.image_filename === site.cover_image);
    if (direct) return direct;
    for (const r of routes) for (const s of r.stops) {
      const p = byId(s.piece_id || s.id || s.poi_id);
      if (p?.image_filename) return p;
    }
    return undefined;
  }, [site, pieces, pieceById, routes]);

  /** Opciones de "¿cuánto tiempo tienes?": el recorrido más corto, uno intermedio y el más largo. */
  const timeOptions = useMemo(() => {
    const m = u.museum;
    if (routes.length === 0) return [];
    if (routes.length === 1) return [{ route: routes[0], label: m.timeLong }];
    if (routes.length === 2) return [{ route: routes[0], label: m.timeShort }, { route: routes[1], label: m.timeLong }];
    return [
      { route: routes[0], label: m.timeShort },
      { route: routes[Math.floor(routes.length / 2)], label: m.timeMid },
      { route: routes[routes.length - 1], label: m.timeLong },
    ];
  }, [routes, u]);

  return (
    <div className="min-h-dvh bg-bg text-ink pb-tabbar">
      <TopBar
        onBack={onBack}
        backLabel={u.homeLabel}
        title={site.name}
        revealAfter={110}
        right={
          <>
            <LanguageMenu />
            <PassButton hasPass={hasPass} onClick={onOpenPaywall} />
          </>
        }
      />

      <main>
        <section className="px-5 pt-5 pb-6">
          <div className="rounded-3xl bg-surface border border-line overflow-hidden">
            {coverPiece && (
              <div className="relative h-36 bg-raised">
                <PieceImage filename={coverPiece.image_filename} pieceId={coverPiece.piece_id} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/10 to-transparent" aria-hidden="true" />
              </div>
            )}
            <div className="px-5 pb-5 pt-3">
              <h1 className="font-serif text-h1 font-medium tracking-[-0.02em] text-balance">{site.name}</h1>
              <p className="mt-1.5 text-ui text-ink-3">{site.location}</p>
              {site.description && <p className="mt-3 text-ui text-ink-2 leading-relaxed line-clamp-3">{site.description}</p>}
              {routes.length > 0 && (
                <div id="time-chooser" className="mt-6 pt-5 border-t border-line">
                  <h2 className="font-serif text-h3 font-medium">{u.museum.timeTitle}</h2>
                  <div className="mt-3 flex flex-col gap-2.5">
                    {timeOptions.map(({ route, label }, i) => {
                      const minutes = route.estimated_minutes || calculateRouteTimeMinutes(route.stops);
                      return (
                        <button
                          key={route.id}
                          type="button"
                          id={i === 0 ? 'first-route-card' : undefined}
                          onClick={() => onStartRoute(route)}
                          className="w-full text-left rounded-2xl bg-raised border border-line px-4 py-3.5 flex items-center gap-3 cursor-pointer active:scale-[0.99] transition-transform"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block text-[1.0625rem] font-bold leading-snug">{label}</span>
                            <span className="block mt-0.5 text-cap text-ink-3">
                              {route.name} · {u.routeMeta(formatRouteDuration(minutes), route.stops.length)}
                            </span>
                          </span>
                          <ChevronRight className="w-5 h-5 text-jade shrink-0" />
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        document.getElementById('rooms-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className="w-full text-left rounded-2xl border border-line px-4 py-3.5 flex items-center gap-3 cursor-pointer active:scale-[0.99] transition-transform"
                    >
                      <span className="min-w-0 flex-1 text-[1.0625rem] font-bold leading-snug">{u.museum.exploreFree}</span>
                      <ChevronRight className="w-5 h-5 text-ink-3 shrink-0" />
                    </button>
                  </div>
                  {onOpenWizard && (
                    <button
                      type="button"
                      id="btn-open-wizard"
                      onClick={onOpenWizard}
                      className="mt-2 h-11 px-1 inline-flex items-center gap-2 text-ui font-semibold text-jade cursor-pointer rounded-full"
                    >
                      <SlidersHorizontal className="w-4 h-4" strokeWidth={2} />
                      {u.museum.buildOwn}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          {!zones && (
            <button
              type="button"
              id="btn-open-intro"
              onClick={() => setIntroOpen(true)}
              className="mt-2 -ml-2 h-10 px-2 inline-flex items-center gap-1.5 text-ui font-semibold text-jade cursor-pointer rounded-full active:bg-raised"
            >
              <CircleHelp className="w-4 h-4" strokeWidth={2} />
              {strings.intro.openLabel}
            </button>
          )}
        </section>

        {continueInfo && (
          <section className="px-5 pb-8">
            <button
              type="button"
              id="btn-continue"
              onClick={continueInfo.onContinue}
              className="w-full text-left rounded-2xl bg-surface border border-jade/35 p-3 pr-4 flex items-center gap-3.5 cursor-pointer active:scale-[0.99] transition-transform"
            >
              <span className="w-16 h-16 rounded-xl overflow-hidden bg-raised shrink-0">
                <PieceImage filename={continueInfo.imageFilename} pieceId={continueInfo.pieceId} alt="" className="w-full h-full object-cover" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-cap font-semibold text-jade">{continueInfo.eyebrow}</span>
                <span className="block text-[1.0625rem] font-bold text-ink truncate">{continueInfo.title}</span>
                <span className="block text-cap text-ink-3 truncate">{continueInfo.detail}</span>
              </span>
              <ChevronRight className="w-5 h-5 text-jade shrink-0" />
            </button>
          </section>
        )}

        <section aria-labelledby="rooms-title">
          <div className="px-5 flex items-end justify-between gap-3">
            <h2 id="rooms-title" className="font-serif text-h3 font-medium">
              {u.museum.rooms}
            </h2>
            {onOpenMap && (
              <button
                type="button"
                onClick={onOpenMap}
                className="h-10 -mr-2 px-2 inline-flex items-center gap-1.5 text-ui font-semibold text-jade cursor-pointer rounded-full active:bg-raised"
              >
                <MapIcon className="w-4 h-4" strokeWidth={2} />
                {u.museum.seeMap}
              </button>
            )}
          </div>

          {showFloors && (
            <div className="px-5 mt-3">
              <FloorSwitch floor={floor} onChange={onFloorChange} countPB={countPB} countPA={countPA} />
            </div>
          )}

          <ul className="mt-2 md:grid md:grid-cols-2 md:gap-x-2" id="rooms-list">
            {floorRooms.map((room) => {
              const list = piecesByRoom.get(room.room_id) || [];
              const cover = list[0];
              return (
                <li key={room.room_id} className="relative after:content-[''] after:absolute after:bottom-0 after:left-[4.75rem] after:right-5 after:h-px after:bg-line last:after:hidden">
                  <button
                    type="button"
                    onClick={() => onSelectRoom(room)}
                    className="w-full flex items-center gap-4 px-5 py-3.5 text-left cursor-pointer row-press"
                  >
                    <span className="font-serif text-[1.75rem] leading-none text-ink-3 w-10 shrink-0 tabular-nums">
                      {getRoomShortLabel(room)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[1.0625rem] font-bold leading-snug text-ink">{room.nombre_oficial}</span>
                      <span className="block text-cap text-ink-3 mt-0.5">{u.worksCount(list.length)}</span>
                    </span>
                    <span className="w-14 h-14 rounded-xl overflow-hidden bg-raised shrink-0">
                      {cover && <PieceImage filename={cover.image_filename} pieceId={cover.piece_id} alt="" className="w-full h-full object-cover" />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="px-5 mt-10">
          <OfflineTourBanner pieces={pieces} audioPieces={audioPieces} />
        </section>
      </main>

      {!zones && <IntroTour open={introOpen} onClose={() => setIntroOpen(false)} onConfigureRoute={onOpenWizard ?? (() => {})} />}
    </div>
  );
};

export const FloorSwitch: React.FC<{
  floor: 'PB' | 'PA';
  onChange: (f: 'PB' | 'PA') => void;
  countPB?: number;
  countPA?: number;
}> = ({ floor, onChange, countPB, countPA }) => {
  const u = useLanguage().strings.ui;
  const opts: { id: 'PB' | 'PA'; label: string; sub: string; n?: number }[] = [
    { id: 'PB', label: u.floors.PB, sub: u.floors.PBsub, n: countPB },
    { id: 'PA', label: u.floors.PA, sub: u.floors.PAsub, n: countPA },
  ];
  return (
    <div id="floor-switch" role="tablist" aria-label={u.floors.aria} className="grid grid-cols-2 p-1 rounded-2xl bg-surface border border-line">
      {opts.map((o) => {
        const on = floor === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={on}
            id={`floor-${o.id}`}
            onClick={() => onChange(o.id)}
            className={`min-h-12 px-3 rounded-xl text-left cursor-pointer transition-colors ${
              on ? 'bg-raised text-ink shadow-sm' : 'text-ink-3'
            }`}
          >
            <span className="block text-ui font-bold leading-tight">{o.label}</span>
            <span className="block text-[12px] leading-tight mt-0.5">
              {o.sub}
              {o.n ? ` · ${u.roomsCount(o.n)}` : ''}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default MuseumScreen;
