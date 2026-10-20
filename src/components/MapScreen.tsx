import React, { Suspense, lazy, useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Room, PieceData, ZoneMap, LiveMapConfig } from '../types';
import { useLanguage } from '../utils/LanguageContext';
import { TopBar } from './ui/TopBar';
import { PassButton } from './ui/HeaderControls';
import { FloorPlan } from './FloorPlan';
import { FloorSwitch } from './MuseumScreen';
import { ActiveTour } from './RoutesScreen';
import { ErrorBoundary } from './ErrorBoundary';
import type { LiveStop } from './LiveMap';

// MapLibre pesa bastante: solo se descarga cuando alguien abre el mapa real.
const LiveMap = lazy(() => import('./LiveMap'));

interface MapScreenProps {
  rooms: Room[];
  pieces: PieceData[];
  floor: 'PB' | 'PA';
  onFloorChange: (f: 'PB' | 'PA') => void;
  /** Sitio al aire libre: el plano se arma con las zonas de este mapa y no hay pisos. */
  zoneMap?: ZoneMap;
  hereRoomId?: string | null;
  tour: ActiveTour | null;
  hasPass: boolean;
  onOpenPaywall: () => void;
  onSelectRoom: (room: Room) => void;
  /** Mapa real con la posición de la persona (solo sitios al aire libre que lo tienen). */
  liveMap?: LiveMapConfig;
  onOpenPiece?: (pieceId: string) => void;
}

/** Pestaña "Mapa": plano esquemático con salas grandes y legibles, "estás aquí" y las paradas del recorrido. */
export const MapScreen: React.FC<MapScreenProps> = ({ rooms, pieces, floor, onFloorChange, zoneMap, hereRoomId, tour, hasPass, onOpenPaywall, onSelectRoom, liveMap, onOpenPiece }) => {
  const { strings } = useLanguage();
  const u = strings.ui;

  const roomOfPiece = useMemo(() => new Map(pieces.map((p) => [p.piece_id, p.room_id])), [pieces]);
  const worksByRoom = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of pieces) m.set(p.room_id, (m.get(p.room_id) || 0) + 1);
    return m;
  }, [pieces]);
  const stopsByRoom = useMemo(() => {
    const m = new Map<string, number[]>();
    tour?.route.stops.forEach((s, i) => {
      if (i < tour.index) return;
      const rid = s.room_id || roomOfPiece.get(s.piece_id || s.id || '') || '';
      if (!rid) return;
      m.set(rid, [...(m.get(rid) || []), i + 1]);
    });
    return m;
  }, [tour, roomOfPiece]);

  const [view, setView] = useState<'live' | 'scheme'>('live');
  const showLive = !!liveMap && view === 'live';
  const stopId = (s: { piece_id?: string; id?: string; poi_id?: string }) => s.piece_id || s.id || s.poi_id || '';
  const routeIds = useMemo(() => (tour ? tour.route.stops.map(stopId) : []), [tour]);
  const liveStops = useMemo<LiveStop[]>(() => {
    const idx = new Map<string, number>(routeIds.map((id, i): [string, number] => [id, i]));
    return pieces
      .filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number')
      .map((p) => {
        const i = idx.get(p.piece_id);
        return { id: p.piece_id, title: p.titulo, lat: p.lat as number, lng: p.lng as number, tourNum: i === undefined ? undefined : i + 1, done: tour && i !== undefined ? i < tour.index : false };
      });
  }, [pieces, routeIds, tour]);
  const missingCoords = useMemo(() => pieces.some((p) => typeof p.lat !== 'number' || typeof p.lng !== 'number'), [pieces]);
  const currentId = tour ? routeIds[tour.index] : undefined;

  const hereRoom = rooms.find((r) => r.room_id === hereRoomId);
  const countPB = rooms.filter((r) => r.piso === 'PB').length;
  const countPA = rooms.filter((r) => r.piso === 'PA').length;

  return (
    <div className="min-h-dvh bg-bg text-ink pb-tabbar">
      <TopBar title={u.map.title} right={<PassButton hasPass={hasPass} onClick={onOpenPaywall} />} />
      <main className="px-4 pt-4">
        {liveMap && (
          <div role="tablist" className="grid grid-cols-2 p-1 rounded-2xl bg-surface border border-line mb-4">
            {([['live', u.map.liveTab], ['scheme', u.map.schemeTab]] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`map-view-${id}`}
                aria-selected={view === id}
                onClick={() => setView(id)}
                className={`min-h-11 rounded-xl text-ui font-bold cursor-pointer transition-colors ${view === id ? 'bg-raised text-ink shadow-sm' : 'text-ink-3'}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {showLive && liveMap && (
          <ErrorBoundary fallback={<p className="text-ui text-ink-2 px-1">{u.map.hint}</p>}>
            <Suspense fallback={<div className="h-[62vh] min-h-[360px] rounded-2xl bg-surface border border-line" />}>
              <LiveMap config={liveMap} stops={liveStops} routeIds={routeIds} currentId={currentId} onOpenStop={(id) => onOpenPiece?.(id)} />
            </Suspense>
            {missingCoords && <p className="mt-3 px-1 text-cap text-ink-3">{u.map.noCoords}</p>}
          </ErrorBoundary>
        )}
        {!showLive && !zoneMap && countPB > 0 && countPA > 0 && <FloorSwitch floor={floor} onChange={onFloorChange} countPB={countPB} countPA={countPA} />}
        {!zoneMap && hereRoom && hereRoom.piso !== floor && (
          <button
            type="button"
            onClick={() => onFloorChange(hereRoom.piso)}
            className="mt-3 w-full h-11 rounded-full border border-jade/40 text-ui font-semibold text-jade inline-flex items-center justify-center gap-2 cursor-pointer active:bg-raised"
          >
            <MapPin className="w-4 h-4" />
            {u.map.youAreOn(hereRoom.piso)}
          </button>
        )}
        {!showLive && (<>
        <div className="mt-4">
          <FloorPlan
            rooms={rooms}
            floor={floor}
            zoneMap={zoneMap}
            hereRoomId={hereRoomId}
            stopsByRoom={stopsByRoom}
            worksByRoom={worksByRoom}
            onSelectRoom={onSelectRoom}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-cap text-ink-3">
          <span className="inline-flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-jade text-on-jade flex items-center justify-center">
              <MapPin className="w-3 h-3" strokeWidth={2.5} />
            </span>
            {u.map.youAreHere}
          </span>
          {tour && (
            <span className="inline-flex items-center gap-2">
              <span className="w-5 h-5 rounded-full border-2 border-jade text-jade text-[10px] font-bold flex items-center justify-center">1</span>
              {u.map.tourStop}
            </span>
          )}
        </div>
        <p className="mt-3 px-1 text-cap text-ink-3">{u.map.hint}</p>
        </>)}
      </main>
    </div>
  );
};

export default MapScreen;
