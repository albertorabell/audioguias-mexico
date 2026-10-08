import React, { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { Room, PieceData } from '../types';
import { useLanguage } from '../utils/LanguageContext';
import { TopBar } from './ui/TopBar';
import { PassButton } from './ui/HeaderControls';
import { FloorPlan } from './FloorPlan';
import { FloorSwitch } from './MuseumScreen';
import { ActiveTour } from './RoutesScreen';

interface MapScreenProps {
  rooms: Room[];
  pieces: PieceData[];
  floor: 'PB' | 'PA';
  onFloorChange: (f: 'PB' | 'PA') => void;
  hereRoomId?: string | null;
  tour: ActiveTour | null;
  hasPass: boolean;
  onOpenPaywall: () => void;
  onSelectRoom: (room: Room) => void;
}

/** Pestaña "Mapa": plano esquemático con salas grandes y legibles, "estás aquí" y las paradas del recorrido. */
export const MapScreen: React.FC<MapScreenProps> = ({ rooms, pieces, floor, onFloorChange, hereRoomId, tour, hasPass, onOpenPaywall, onSelectRoom }) => {
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

  const hereRoom = rooms.find((r) => r.room_id === hereRoomId);
  const countPB = rooms.filter((r) => r.piso === 'PB').length;
  const countPA = rooms.filter((r) => r.piso === 'PA').length;

  return (
    <div className="min-h-dvh bg-bg text-ink pb-tabbar">
      <TopBar title={u.map.title} right={<PassButton hasPass={hasPass} onClick={onOpenPaywall} />} />
      <main className="px-4 pt-4">
        <FloorSwitch floor={floor} onChange={onFloorChange} countPB={countPB} countPA={countPA} />
        {hereRoom && hereRoom.piso !== floor && (
          <button
            type="button"
            onClick={() => onFloorChange(hereRoom.piso)}
            className="mt-3 w-full h-11 rounded-full border border-jade/40 text-ui font-semibold text-jade inline-flex items-center justify-center gap-2 cursor-pointer active:bg-raised"
          >
            <MapPin className="w-4 h-4" />
            {u.map.youAreOn(hereRoom.piso)}
          </button>
        )}
        <div className="mt-4">
          <FloorPlan
            rooms={rooms}
            floor={floor}
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
      </main>
    </div>
  );
};

export default MapScreen;
