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
  /** Abre la pestaña de recorridos (para "ver todos"). */
  onOpenRoutes?: () => void;
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
  onOpenRoutes,
  zones = false,
}) => {
  const { strings } = useLanguage();
  const u = strings.ui;
  // La bienvenida de arriba ya orienta; la guía paso a paso queda solo en «¿Cómo se usa?»
  const [introOpen, setIntroOpen] = useState<boolean>(false);
  // La presentación del sitio muestra el primer párrafo y el resto se abre con «Seguir leyendo» (así los recorridos quedan a la vista)
  const [introMore, setIntroMore] = useState<boolean>(false);

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

  /** Los recorridos que se ofrecen en el inicio: los de "según tu tiempo" (o todos si el sitio no los agrupa), del más corto al más largo. */
  const shelf = useMemo(() => {
    const byTime = routes.filter((r) => !r.group || r.group === 'tiempo');
    return (byTime.length ? byTime : routes)
      .map((r) => ({ r, m: r.estimated_minutes || calculateRouteTimeMinutes(r.stops) }))
      .sort((a, b) => a.m - b.m)
      .slice(0, 6)
      .map((x) => x.r);
  }, [routes]);

  /** Foto de un recorrido: la de su obra más importante que tenga imagen. */
  const routeCover = (route: SiteRoute): PieceData | undefined => {
    let best: PieceData | undefined;
    for (const s of route.stops) {
      const p = pieceById.get(s.piece_id || s.id || s.poi_id);
      if (!p?.image_filename) continue;
      if (!best || (p.prioridad || 3) < (best.prioridad || 3)) best = p;
    }
    return best;
  };

  /** Presentación del sitio: párrafos separados por una línea en blanco (si no hay, la descripción corta). */
  const introParagraphs = useMemo(() => {
    const text = (site.intro || site.description || '').trim();
    return text ? text.split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean) : [];
  }, [site.intro, site.description]);

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
        <section className="px-5 pt-5">
          <div className="rounded-3xl bg-surface border border-line overflow-hidden">
            {coverPiece && (
              <div className="relative h-36 bg-raised">
                <PieceImage filename={coverPiece.image_filename} pieceId={coverPiece.piece_id} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/10 to-transparent" aria-hidden="true" />
              </div>
            )}
            <div className="px-5 pb-6 pt-3">
              <h1 className="font-serif text-h1 font-medium tracking-[-0.02em] text-balance">{site.name}</h1>
              <p className="mt-1.5 text-ui text-ink-3">{site.location}</p>
              <p className="mt-3 text-cap font-semibold text-ink-3">
                {!zones && `${u.roomsCount(rooms.length)} · `}{u.worksCount(pieces.length)}
              </p>
              <div id="site-intro" className="mt-4 space-y-3.5">
                {(introMore ? introParagraphs : introParagraphs.slice(0, 1)).map((text, i) => (
                  <p key={i} className="text-[1.0625rem] leading-relaxed text-ink-2 text-pretty">
                    {text}
                  </p>
                ))}
              </div>
              {introParagraphs.length > 1 && (
                <button
                  type="button"
                  id="btn-intro-more"
                  aria-expanded={introMore}
                  onClick={() => setIntroMore((v) => !v)}
                  className="mt-2 -ml-1 h-10 px-1 text-ui font-semibold text-jade-ink cursor-pointer rounded-full"
                >
                  {introMore ? u.museum.readLess : u.museum.readMore}
                </button>
              )}
            </div>
          </div>
          {!zones && (
            <button
              type="button"
              id="btn-open-intro"
              onClick={() => setIntroOpen(true)}
              className="mt-2 -ml-2 h-10 px-2 inline-flex items-center gap-1.5 text-ui font-semibold text-jade-ink cursor-pointer rounded-full active:bg-raised"
            >
              <CircleHelp className="w-4 h-4" strokeWidth={2} />
              {strings.intro.openLabel}
            </button>
          )}
        </section>

        {shelf.length > 0 && (
          <section id="time-chooser" className="mt-6" aria-labelledby="routes-title">
            <div className="px-5">
              <h2 id="routes-title" className="font-serif text-h3 font-medium">
                {u.museum.routesTitle}
              </h2>
              <p className="mt-1 text-cap text-ink-3">{u.museum.routesSub}</p>
            </div>
            <div className="mt-3 flex gap-3 overflow-x-auto px-5 pb-2 snap-x snap-mandatory scrollbar-none scroll-px-5">
              {shelf.map((route, i) => {
                const minutes = route.estimated_minutes || calculateRouteTimeMinutes(route.stops);
                const cover = routeCover(route);
                return (
                  <button
                    key={route.id}
                    type="button"
                    id={i === 0 ? 'first-route-card' : undefined}
                    onClick={() => onStartRoute(route)}
                    className="snap-start shrink-0 w-[15.5rem] text-left rounded-2xl bg-surface border border-line overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
                  >
                    <span className="relative block h-28 bg-raised">
                      {cover && <PieceImage filename={cover.image_filename} pieceId={cover.piece_id} alt="" className="w-full h-full object-cover" />}
                      <span className="absolute left-2.5 top-2.5 rounded-full bg-bg/90 px-2.5 py-1 text-cap font-bold text-ink backdrop-blur">
                        {formatRouteDuration(minutes)}
                      </span>
                    </span>
                    <span className="block p-3.5">
                      <span className="block text-[1.0625rem] font-bold leading-snug">{route.name}</span>
                      <span className="mt-0.5 block text-cap text-ink-3">{u.worksCount(route.stops.length)}</span>
                    </span>
                  </button>
                );
              })}
              {onOpenWizard && (
                <button
                  type="button"
                  id="btn-open-wizard"
                  onClick={onOpenWizard}
                  className="snap-start shrink-0 w-[15.5rem] text-left rounded-2xl border border-dashed border-line-strong p-4 flex flex-col justify-between cursor-pointer active:bg-raised"
                >
                  <span className="w-10 h-10 rounded-full bg-raised flex items-center justify-center">
                    <SlidersHorizontal className="w-5 h-5 text-jade-ink" strokeWidth={1.8} />
                  </span>
                  <span className="block mt-6">
                    <span className="block text-[1.0625rem] font-bold leading-snug">{u.museum.buildOwn}</span>
                    <span className="mt-0.5 block text-cap text-ink-3">{u.museum.buildOwnSub}</span>
                  </span>
                </button>
              )}
            </div>
            {onOpenRoutes && routes.length > shelf.length && (
              <button
                type="button"
                id="btn-all-routes"
                onClick={onOpenRoutes}
                className="mt-1 mx-5 h-11 px-1 inline-flex items-center gap-1 text-ui font-semibold text-jade-ink cursor-pointer rounded-full"
              >
                {u.museum.seeAllRoutes}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </section>
        )}

        <div className="h-8" aria-hidden="true" />

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
                <span className="block text-cap font-semibold text-jade-ink">{continueInfo.eyebrow}</span>
                <span className="block text-[1.0625rem] font-bold text-ink truncate">{continueInfo.title}</span>
                <span className="block text-cap text-ink-3 truncate">{continueInfo.detail}</span>
              </span>
              <ChevronRight className="w-5 h-5 text-jade-ink shrink-0" />
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
                className="h-10 -mr-2 px-2 inline-flex items-center gap-1.5 text-ui font-semibold text-jade-ink cursor-pointer rounded-full active:bg-raised"
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
