import React, { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { Room, ZoneMap } from '../types';
import { getRoomShortLabel, getRoomLabel } from '../utils/roomLabel';
import { useLanguage } from '../utils/LanguageContext';

interface FloorPlanProps {
  rooms: Room[];
  floor: 'PB' | 'PA';
  /** Sala donde está la persona (la de la última pieza abierta). */
  hereRoomId?: string | null;
  /** Número de la siguiente parada del recorrido en cada sala (1, 2…). */
  stopsByRoom?: Map<string, number[]>;
  worksByRoom?: Map<string, number>;
  onSelectRoom: (room: Room) => void;
  /** Sitio al aire libre: las zonas se acomodan según este mapa (columna central, lados y fila de abajo). */
  zoneMap?: ZoneMap;
}

const num = (r: Room) => parseInt(String(r.numero_oficial ?? r.room_id.match(/\d+/)?.[0] ?? '0'), 10) || 0;

interface Layout {
  north: Room[];
  west: Room[]; // de arriba hacia abajo
  east: Room[]; // de arriba hacia abajo
  south: Room[];
}

/**
 * Acomoda las salas alrededor del patio como en el museo: cabecera arriba, dos alas a los lados y la entrada abajo.
 * Planta baja (salas 0 a 11): ala izquierda 5→1, cabecera 6, ala derecha 7→11 y abajo la sala 0 junto a la entrada.
 * Otras plantas: mismo reparto automático que el plano anterior (cabecera de 1 o 2 salas y el resto en las alas).
 */
function layoutFor(rooms: Room[], floor: 'PB' | 'PA'): Layout {
  const sorted = [...rooms].sort((a, b) => num(a) - num(b));
  if (floor === 'PB' && sorted.some((r) => num(r) === 6)) {
    const by = (n: number) => sorted.filter((r) => num(r) === n);
    return {
      north: by(6),
      west: [5, 4, 3, 2, 1].flatMap(by),
      east: [7, 8, 9, 10, 11].flatMap(by),
      south: [
        ...by(0),
        ...sorted.filter((r) => num(r) > 11),
      ],
    };
  }
  const n = sorted.length;
  const northCount = n >= 6 ? 2 : n >= 3 ? 1 : 0;
  const rest = n - northCount;
  const westCount = Math.ceil(rest / 2);
  const west = sorted.slice(0, westCount).reverse();
  const north = sorted.slice(westCount, westCount + northCount);
  const east = sorted.slice(westCount + northCount);
  return { north, west, east, south: [] };
}

export const FloorPlan: React.FC<FloorPlanProps> = ({ rooms, floor, hereRoomId, stopsByRoom, worksByRoom, onSelectRoom, zoneMap }) => {
  const { strings, currentLanguage } = useLanguage();
  const u = strings.ui.map;
  const L = useMemo(() => layoutFor(rooms.filter((r) => r.piso === floor), floor), [rooms, floor]);
  const sideRows = Math.max(L.west.length, L.east.length, 1);
  const first = L.north.length ? 2 : 1;

  const tile = (room: Room, wide?: boolean) => {
    const here = hereRoomId === room.room_id;
    const stops = stopsByRoom?.get(room.room_id) || [];
    const works = worksByRoom?.get(room.room_id) || 0;
    return (
      <button
        key={room.room_id}
        type="button"
        id={`plan-room-${room.room_id}`}
        onClick={() => onSelectRoom(room)}
        aria-label={`${getRoomLabel(room)}, ${room.nombre_oficial}${works ? `, ${strings.ui.worksCount(works)}` : ''}${here ? `, ${u.youAreHere}` : ''}`}
        className={`relative w-full h-full min-h-[4.25rem] rounded-xl border text-left px-2.5 py-2 cursor-pointer transition-colors active:scale-[0.98] ${
          here ? 'bg-jade/15 border-jade' : 'bg-surface border-line active:bg-raised'
        } ${wide ? 'flex items-center gap-3' : 'flex flex-col justify-between'}`}
      >
        <span className={`font-serif text-[1.375rem] leading-none tabular-nums ${here ? 'text-jade' : 'text-ink-3'}`}>
          {getRoomShortLabel(room)}
        </span>
        <span className={`block text-[12.5px] font-semibold leading-tight text-ink ${wide ? 'text-[14px]' : 'line-clamp-2 mt-1'}`}>
          {room.nombre_oficial}
        </span>
        {here && (
          <span className="absolute -top-2 -right-1.5 w-6 h-6 rounded-full bg-jade text-on-jade flex items-center justify-center shadow-md" aria-hidden="true">
            <MapPin className="w-3.5 h-3.5" strokeWidth={2.5} />
          </span>
        )}
        {!here && stops.length > 0 && (
          <span className="absolute -top-2 -right-1.5 min-w-6 h-6 px-1.5 rounded-full bg-bg border-2 border-jade text-jade text-[11px] font-bold flex items-center justify-center tabular-nums" aria-hidden="true">
            {stops.slice(0, 2).join('·')}
            {stops.length > 2 ? '…' : ''}
          </span>
        )}
      </button>
    );
  };

  if (zoneMap) {
    const byId = new Map(rooms.map((r) => [r.room_id, r]));
    const pick = (ids: string[]) => ids.map((id) => byId.get(id)).filter((r): r is Room => !!r);
    const center = pick(zoneMap.center);
    const west = pick(zoneMap.west);
    const east = pick(zoneMap.east);
    const south = pick(zoneMap.south);
    const rows = Math.max(center.length, 1);
    const label = (l?: ZoneMap['top_label']) => (l ? l[currentLanguage as 'es' | 'en' | 'fr' | 'pl'] || l.es || '' : '');
    // Cada lado reparte las filas de la columna central entre sus zonas
    const side = (list: Room[], col: number) =>
      list.map((r, i) => {
        const start = Math.floor((i * rows) / list.length) + 1;
        const end = Math.floor(((i + 1) * rows) / list.length) + 1;
        return (
          <div key={r.room_id} style={{ gridColumn: col, gridRow: `${start} / ${end}` }}>
            {tile(r)}
          </div>
        );
      });
    return (
      <div className="rounded-[20px] bg-raised/50 border border-line p-2.5" id="floor-plan">
        <p className="mb-2 text-center text-[12px] font-semibold text-ink-3">{label(zoneMap.top_label)}</p>
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: '1fr 1.2fr 1fr', gridTemplateRows: `repeat(${rows}, minmax(4.25rem, auto))${south.length ? ' minmax(3.5rem, auto)' : ''}` }}
        >
          {center.map((r, i) => (
            <div key={r.room_id} style={{ gridColumn: 2, gridRow: i + 1 }}>
              {tile(r)}
            </div>
          ))}
          {side(west, 1)}
          {side(east, 3)}
          {south.length > 0 && (
            <div className="col-span-3 grid gap-2" style={{ gridRow: rows + 1, gridTemplateColumns: `repeat(${south.length}, 1fr)` }}>
              {south.map((r) => tile(r, true))}
            </div>
          )}
        </div>
        <p className="mt-2 text-center text-[12px] font-semibold text-ink-3">{label(zoneMap.bottom_label)}</p>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] bg-raised/50 border border-line p-2.5" id="floor-plan">
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: '1fr 0.78fr 1fr',
          gridTemplateRows: `${L.north.length ? 'minmax(4.25rem,auto) ' : ''}repeat(${sideRows}, minmax(4.25rem, auto))${L.south.length ? ' minmax(3.5rem,auto)' : ''}`,
        }}
      >
        {L.north.length > 0 && (
          <div className="col-span-3 grid gap-2" style={{ gridRow: 1, gridTemplateColumns: `repeat(${L.north.length}, 1fr)` }}>
            {L.north.map((r) => (
              tile(r, L.north.length === 1)
            ))}
          </div>
        )}
        {Array.from({ length: sideRows }).map((_, i) => (
          <React.Fragment key={i}>
            <div style={{ gridColumn: 1, gridRow: first + i }}>{L.west[i] && tile(L.west[i])}</div>
            {i === 0 && (
              <div
                className="rounded-xl border border-dashed border-line-strong flex flex-col items-center justify-center text-center px-1"
                style={{ gridColumn: 2, gridRow: `${first} / span ${sideRows}` }}
                aria-hidden="true"
              >
                <span className="text-cap font-semibold text-ink-3">{floor === 'PB' ? u.patio : u.patioBelow}</span>
                {floor === 'PB' && <span className="mt-1 text-[11px] text-ink-3/80">{u.umbrella}</span>}
              </div>
            )}
            <div style={{ gridColumn: 3, gridRow: first + i }}>{L.east[i] && tile(L.east[i])}</div>
          </React.Fragment>
        ))}
        {L.south.length > 0 && (
          <div className="col-span-3 grid gap-2" style={{ gridRow: first + sideRows, gridTemplateColumns: `repeat(${L.south.length}, 1fr)` }}>
            {L.south.map((r) => (
              tile(r, true)
            ))}
          </div>
        )}
      </div>
      <p className="mt-2 text-center text-[12px] font-semibold text-ink-3">{floor === 'PB' ? u.entrance : u.stairs}</p>
    </div>
  );
};

export default FloorPlan;
