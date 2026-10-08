import React, { useMemo, useState } from 'react';
import { ChevronRight, SlidersHorizontal, Map as MapIcon } from 'lucide-react';
import { SiteSummary, SiteManifest, SiteRoute, Room, PieceData } from '../types';
import { useLanguage } from '../utils/LanguageContext';
import { getRoomShortLabel } from '../utils/roomLabel';
import { calculateRouteTimeMinutes, formatRouteDuration } from '../utils/routeOptimizer';
import { TopBar } from './ui/TopBar';
import { LanguageMenu, PassButton } from './ui/HeaderControls';
import { PieceImage } from './PieceImage';
import { OfflineTourBanner } from './OfflineTourBanner';

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
  onOpenWizard: () => void;
  onOpenMap: () => void;
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
}) => {
  const { strings } = useLanguage();
  const u = strings.ui;

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

  const floorRooms = useMemo(
    () =>
      rooms
        .filter((r) => r.piso === floor)
        .sort((a, b) => (parseInt(String(a.numero_oficial), 10) || 0) - (parseInt(String(b.numero_oficial), 10) || 0)),
    [rooms, floor]
  );
  const countPB = rooms.filter((r) => r.piso === 'PB').length;
  const countPA = rooms.filter((r) => r.piso === 'PA').length;

  const routes = useMemo(
    () =>
      [...(manifest?.routes || [])]
        .filter((r) => r.stops?.length)
        .sort((a, b) => a.stops.length - b.stops.length),
    [manifest]
  );

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
          <h1 className="font-serif text-h1 font-medium tracking-[-0.02em] text-balance">{site.name}</h1>
          <p className="mt-2 text-ui text-ink-3">{site.location}</p>
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

        {routes.length > 0 && (
          <section className="pb-10" aria-labelledby="start-title">
            <div className="px-5 flex items-baseline justify-between">
              <h2 id="start-title" className="font-serif text-h3 font-medium">
                {u.museum.startHere}
              </h2>
            </div>
            <p className="px-5 mt-1 text-ui text-ink-3">{u.museum.startHereSub}</p>
            <div className="mt-4 flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none px-5 pb-1">
              {routes.map((route) => {
                const minutes = route.estimated_minutes || calculateRouteTimeMinutes(route.stops);
                return (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => onStartRoute(route)}
                    className="snap-start shrink-0 w-[78%] max-w-[320px] text-left rounded-2xl bg-surface border border-line overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
                  >
                    <span className="grid grid-cols-4 gap-px bg-line h-20">
                      {route.stops.slice(0, 4).map((s) => {
                        const p = pieceById.get(s.piece_id || s.id || s.poi_id);
                        return (
                          <span key={s.piece_id || s.id} className="bg-raised overflow-hidden">
                            <PieceImage filename={p?.image_filename || s.thumbnail} pieceId={p?.piece_id} alt="" className="w-full h-full object-cover" />
                          </span>
                        );
                      })}
                    </span>
                    <span className="block p-4">
                      <span className="block text-[1.0625rem] font-bold leading-snug">{route.name}</span>
                      <span className="block mt-1 text-cap text-ink-3">
                        {u.routeMeta(formatRouteDuration(minutes), route.stops.length)}
                      </span>
                      <span className="mt-3 inline-flex items-center gap-1 text-ui font-bold text-jade">
                        {u.museum.startRoute}
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="px-5 mt-3">
              <button
                type="button"
                id="btn-open-wizard"
                onClick={onOpenWizard}
                className="w-full flex items-center gap-3 py-3.5 text-left cursor-pointer row-press rounded-xl -mx-2 px-2"
              >
                <span className="w-10 h-10 rounded-full bg-raised flex items-center justify-center shrink-0">
                  <SlidersHorizontal className="w-5 h-5 text-jade" strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-ui font-bold">{u.museum.buildRoute}</span>
                  <span className="block text-cap text-ink-3">{u.museum.buildRouteSub}</span>
                </span>
                <ChevronRight className="w-5 h-5 text-ink-3 shrink-0" />
              </button>
            </div>
          </section>
        )}

        <section aria-labelledby="rooms-title">
          <div className="px-5 flex items-end justify-between gap-3">
            <h2 id="rooms-title" className="font-serif text-h3 font-medium">
              {u.museum.rooms}
            </h2>
            <button
              type="button"
              onClick={onOpenMap}
              className="h-10 -mr-2 px-2 inline-flex items-center gap-1.5 text-ui font-semibold text-jade cursor-pointer rounded-full active:bg-raised"
            >
              <MapIcon className="w-4 h-4" strokeWidth={2} />
              {u.museum.seeMap}
            </button>
          </div>

          <div className="px-5 mt-3">
            <FloorSwitch floor={floor} onChange={onFloorChange} countPB={countPB} countPA={countPA} />
          </div>

          <ul className="mt-2" id="rooms-list">
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
    <div role="tablist" aria-label={u.floors.aria} className="grid grid-cols-2 p-1 rounded-2xl bg-surface border border-line">
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
