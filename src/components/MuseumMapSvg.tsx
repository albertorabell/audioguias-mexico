import React, { useState, useEffect, useMemo } from 'react';
import { Room, RouteStop } from '../types';
import { getRoomLabel, getRoomShortLabel, getUnitWord } from '../utils/roomLabel';
import { useStrings } from '../utils/LanguageContext';

export interface MuseumMapSvgProps {
  rooms?: Room[];
  selectedRoomId?: string | null;
  onSelectRoom?: (roomId: string) => void;
  stops?: RouteStop[];
  currentStopIndex?: number;
  onSelectStop?: (stopIndex: number) => void;
  activeFloor?: 'PB' | 'PA';
  onFloorChange?: (floor: 'PB' | 'PA') => void;
  showFloorSelector?: boolean;
}

export interface MapRoomDef {
  numStr: string;
  /** Texto completo para lectores de pantalla, p. ej. "Eje 1" o "Sala 06". Si falta se usa "Sala <numStr>". */
  labelFull?: string;
  id: string;
  svg_id: string;
  aliases: string[];
  fallbackName: string;
  piso: 'PB' | 'PA';
  x: number;
  y: number;
  w: number;
  h: number;
  rx?: number;
  isMonumental?: boolean;
  wing: 'poniente' | 'norte' | 'oriente' | 'sur';
}

// ================= Planta Baja: Arqueología (Salas 00 a 11) =================
const PB_ROOMS: MapRoomDef[] = [
  // --- Ala Poniente (x=35, w=215) ---
  {
    numStr: '01',
    id: 'sala-01-introduccion-antropologia',
    svg_id: 'room_01',
    aliases: ['sala-1', 'sala-01', 'introduccion_antropologia', 'intro-antropologia'],
    fallbackName: 'Introducción a la Antropología',
    piso: 'PB',
    x: 35,
    y: 470,
    w: 215,
    h: 60,
    rx: 6,
    wing: 'poniente',
  },
  {
    numStr: '02',
    id: 'sala-02-poblamiento-de-america',
    svg_id: 'room_02',
    aliases: ['sala-2', 'sala-02', 'poblamiento', 'poblamiento_de_america'],
    fallbackName: 'Poblamiento de América',
    piso: 'PB',
    x: 35,
    y: 395,
    w: 215,
    h: 60,
    rx: 6,
    wing: 'poniente',
  },
  {
    numStr: '03',
    id: 'sala-03-preclasico-altiplano-central',
    svg_id: 'room_03',
    aliases: ['sala-3', 'sala-03', 'preclasico', 'altiplano'],
    fallbackName: 'Preclásico en el Altiplano Central',
    piso: 'PB',
    x: 35,
    y: 320,
    w: 215,
    h: 60,
    rx: 6,
    wing: 'poniente',
  },
  {
    numStr: '04',
    id: 'sala-04-teotihuacan',
    svg_id: 'room_04',
    aliases: ['sala-4', 'sala-04', 'teotihuacan', 'chalchiuhtlicue'],
    fallbackName: 'Teotihuacán',
    piso: 'PB',
    x: 35,
    y: 230,
    w: 215,
    h: 75,
    rx: 6,
    wing: 'poniente',
  },
  {
    numStr: '05',
    id: 'sala-05-los-toltecas-y-su-epoca',
    svg_id: 'room_05',
    aliases: ['sala-5', 'sala-05', 'tolteca', 'toltecas', 'epiclasico', 'sala-05-los-toltecas-y-el-epoclasico'],
    fallbackName: 'Los Toltecas y su época',
    piso: 'PB',
    x: 35,
    y: 145,
    w: 215,
    h: 70,
    rx: 6,
    wing: 'poniente',
  },

  // --- Cabecera Norte (x=265, y=35, w=370, h=100) ---
  {
    numStr: '06',
    id: 'sala-06-mexica',
    svg_id: 'room_06',
    aliases: ['sala-6', 'sala-06', 'mexica', 'azteca', 'piedra-del-sol', 'tenochtitlan'],
    fallbackName: 'Mexica',
    piso: 'PB',
    x: 265,
    y: 35,
    w: 370,
    h: 100,
    rx: 6,
    isMonumental: true,
    wing: 'norte',
  },

  // --- Ala Oriente (x=650, w=215) ---
  {
    numStr: '07',
    id: 'sala-07-oaxaca',
    svg_id: 'room_07',
    aliases: ['sala-7', 'sala-07', 'oaxaca', 'zapoteca', 'mixteca'],
    fallbackName: 'Oaxaca',
    piso: 'PB',
    x: 650,
    y: 145,
    w: 215,
    h: 70,
    rx: 6,
    wing: 'oriente',
  },
  {
    numStr: '08',
    id: 'sala-08-costa-del-golfo',
    svg_id: 'room_08',
    aliases: ['sala-8', 'sala-08', 'costa-del-golfo', 'golfo', 'olmeca', 'huasteca'],
    fallbackName: 'Culturas de la Costa del Golfo',
    piso: 'PB',
    x: 650,
    y: 230,
    w: 215,
    h: 75,
    rx: 6,
    wing: 'oriente',
  },
  {
    numStr: '09',
    id: 'sala-09-maya',
    svg_id: 'room_09',
    aliases: ['sala-9', 'sala-09', 'maya', 'palenque', 'chichen'],
    fallbackName: 'Maya',
    piso: 'PB',
    x: 650,
    y: 320,
    w: 215,
    h: 60,
    rx: 6,
    wing: 'oriente',
  },
  {
    numStr: '10',
    id: 'sala-10-occidente',
    svg_id: 'room_10',
    aliases: ['sala-10', 'occidente', 'tarascos', 'tzintzuntzan', 'sala-10-occidente-de-mexico'],
    fallbackName: 'Culturas del Occidente',
    piso: 'PB',
    x: 650,
    y: 395,
    w: 215,
    h: 60,
    rx: 6,
    wing: 'oriente',
  },
  {
    numStr: '11',
    id: 'sala-11-norte',
    svg_id: 'room_11',
    aliases: ['sala-11', 'norte', 'paquime', 'casas-grandes', 'sala-11-culturas-del-norte'],
    fallbackName: 'Culturas del Norte',
    piso: 'PB',
    x: 650,
    y: 470,
    w: 215,
    h: 60,
    rx: 6,
    wing: 'oriente',
  },

  // --- Cabecera Sur (x=265, y=550, w=370, h=65) ---
  {
    numStr: '00',
    id: 'sala-00-exteriores',
    svg_id: 'room_00',
    aliases: ['sala-0', 'sala-00', 'vestibulo', 'orientacion', 'exteriores', 'patio'],
    fallbackName: 'Arquitectura y Patio Central',
    piso: 'PB',
    x: 265,
    y: 550,
    w: 370,
    h: 65,
    rx: 6,
    wing: 'sur',
  },
];

// ================= Planta Alta: se dibuja a partir de los datos (rooms.json) =================
// La planta alta del MNA se renovó en enero de 2025 y pasó de 11 salas por región a 5 ejes temáticos.
// Para que el mapa no dependa de un número fijo de salas, aquí NO hay salas escritas a mano:
// las cajas se reparten solas, en orden de recorrido, a lo largo de la herradura del edificio
// (ala poniente de sur a norte → cabecera norte de izquierda a derecha → ala oriente de norte a sur).
// Si se cambia el orden (numero_oficial) o los nombres en el Sheets, el mapa se ajusta solo.
// Es un ESQUEMA orientativo del recorrido, no el plano exacto de la planta alta.
const PA_WING_TOP = 150;
const PA_WING_BOTTOM = 525;
const PA_GAP = 12;

const numeroDe = (r: Room) => parseInt(String(r.numero_oficial || r.room_id.match(/\d+/)?.[0] || '0'), 10) || 0;

export function buildPaLayout(paRooms: Room[]): MapRoomDef[] {
  const sorted = [...paRooms].sort((a, b) => numeroDe(a) - numeroDe(b));
  const n = sorted.length;
  if (n === 0) return [];

  // Cuántas cajas van en la cabecera norte y cuántas en cada ala
  const northCount = n >= 6 ? 2 : n >= 3 ? 1 : 0;
  const rest = n - northCount;
  const westCount = Math.ceil(rest / 2);
  const eastCount = rest - westCount;

  const defs: MapRoomDef[] = [];
  const makeDef = (room: Room, idx: number, geo: Pick<MapRoomDef, 'x' | 'y' | 'w' | 'h' | 'wing'>): MapRoomDef => ({
    numStr: getRoomShortLabel(room),
    labelFull: getRoomLabel(room),
    id: room.room_id,
    svg_id: room.svg_id || `room_pa_${idx + 1}`,
    aliases: room.aliases && room.aliases.length > 0 ? room.aliases : [room.room_id],
    fallbackName: room.nombre_oficial || room.room_id,
    piso: 'PA',
    rx: 6,
    ...geo,
  });

  const wingCell = (k: number, count: number) => {
    const h = (PA_WING_BOTTOM - PA_WING_TOP - PA_GAP * (count - 1)) / count;
    return { h, y: PA_WING_BOTTOM - h - k * (h + PA_GAP) };
  };

  let i = 0;
  // Ala poniente: de abajo (sur) hacia arriba (norte)
  for (let k = 0; k < westCount; k++, i++) {
    const { h, y } = wingCell(k, westCount);
    defs.push(makeDef(sorted[i], i, { x: 35, y, w: 215, h, wing: 'poniente' }));
  }
  // Cabecera norte: de izquierda a derecha
  if (northCount > 0) {
    const totalW = 370;
    const w = (totalW - PA_GAP * (northCount - 1)) / northCount;
    for (let k = 0; k < northCount; k++, i++) {
      defs.push(makeDef(sorted[i], i, { x: 265 + k * (w + PA_GAP), y: 35, w, h: 100, wing: 'norte' }));
    }
  }
  // Ala oriente: de arriba (norte) hacia abajo (sur)
  for (let k = 0; k < eastCount; k++, i++) {
    const { h, y } = wingCell(eastCount - 1 - k, eastCount);
    defs.push(makeDef(sorted[i], i, { x: 650, y, w: 215, h, wing: 'oriente' }));
  }
  return defs;
}

/** Parte un texto en líneas por palabras (para nombres largos de ejes). */
function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    if (!current) current = w;
    else if ((current + ' ' + w).length <= maxChars) current += ' ' + w;
    else {
      lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    const last = kept[maxLines - 1];
    kept[maxLines - 1] = (last.length > maxChars - 1 ? last.slice(0, maxChars - 1) : last).replace(/[\s,.;:]+$/, '') + '…';
    return kept;
  }
  return lines;
}

export const MuseumMapSvg: React.FC<MuseumMapSvgProps> = ({
  rooms = [],
  selectedRoomId = null,
  onSelectRoom,
  stops = [],
  currentStopIndex = 0,
  onSelectStop,
  activeFloor = 'PB',
  onFloorChange,
  showFloorSelector = true,
}) => {
  const [internalFloor, setInternalFloor] = useState<'PB' | 'PA'>(activeFloor);
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
  const strings = useStrings();
  const t = strings.map;

  // Sync with activeFloor prop
  useEffect(() => {
    if (activeFloor) setInternalFloor(activeFloor);
  }, [activeFloor]);

  // Auto-switch floor based on active stop floor
  useEffect(() => {
    if (stops && stops.length > 0 && currentStopIndex !== undefined) {
      const activeStop = stops[currentStopIndex];
      if (activeStop) {
        const stopRoomId = (activeStop.room_id || (activeStop as any).roomId || '').toLowerCase();
        // ¿La sala de esta parada es de planta alta? Se busca en rooms.json; si no está, se usa el piso de la parada.
        const stopRoom = rooms.find(
          (r) =>
            r.room_id.toLowerCase() === stopRoomId ||
            (r.aliases || []).some((a) => a.toLowerCase() === stopRoomId) ||
            (r.svg_id || '').toLowerCase() === stopRoomId
        );
        const isPa = stopRoom ? stopRoom.piso === 'PA' : activeStop.piso === 'PA';
        const targetFloor = isPa ? 'PA' : 'PB';
        if (targetFloor !== internalFloor) {
          setInternalFloor(targetFloor);
          if (onFloorChange) onFloorChange(targetFloor);
        }
      }
    }
  }, [stops, currentStopIndex]);

  const selectedFloor = internalFloor;

  const handleFloorSwitch = (floor: 'PB' | 'PA') => {
    setInternalFloor(floor);
    if (onFloorChange) onFloorChange(floor);
  };

  // Las salas de planta alta se reparten a partir de rooms.json (ver buildPaLayout)
  const paRooms = useMemo(() => rooms.filter((r) => r.piso === 'PA'), [rooms]);
  const paDefs = useMemo(() => buildPaLayout(paRooms), [paRooms]);
  const paUnit = useMemo(() => getUnitWord(paRooms), [paRooms]);

  const currentFloorDefs = selectedFloor === 'PB' ? PB_ROOMS : paDefs;

  // Resolve room definitions with real names from rooms.json
  const enrichedFloorRooms = useMemo(() => {
    return currentFloorDefs.map((def) => {
      // Find room in rooms catalog by room_id, svg_id or aliases (EXACT equality)
      const officialRoom = rooms.find(
        (r) =>
          r.room_id === def.id ||
          r.svg_id === def.svg_id ||
          (r.aliases && r.aliases.includes(def.id)) ||
          (r.aliases && def.aliases.some((a) => r.aliases?.includes(a)))
      );

      const displayName = officialRoom?.nombre_oficial || def.fallbackName;
      const canonicalRoomId = officialRoom?.room_id || def.id;
      const fraseGancho = officialRoom?.frase_gancho || '';

      return {
        ...def,
        officialRoom,
        displayName,
        canonicalRoomId,
        fraseGancho,
      };
    });
  }, [currentFloorDefs, rooms]);

  // Check if room is active or in current route
  const activeRouteRoomIds = useMemo(() => {
    const set = new Set<string>();
    stops.forEach((s) => {
      if (s.room_id) set.add(s.room_id.toLowerCase());
    });
    return set;
  }, [stops]);

  const isRoomInRoute = (roomDef: (typeof enrichedFloorRooms)[0]) => {
    return (
      activeRouteRoomIds.has(roomDef.canonicalRoomId.toLowerCase()) ||
      activeRouteRoomIds.has(roomDef.id.toLowerCase()) ||
      activeRouteRoomIds.has(roomDef.svg_id.toLowerCase()) ||
      roomDef.aliases.some((a) => activeRouteRoomIds.has(a.toLowerCase()))
    );
  };

  const isRoomSelected = (roomDef: (typeof enrichedFloorRooms)[0]) => {
    if (!selectedRoomId) return false;
    const target = selectedRoomId.toLowerCase();
    return (
      roomDef.canonicalRoomId.toLowerCase() === target ||
      roomDef.id.toLowerCase() === target ||
      roomDef.svg_id.toLowerCase() === target ||
      roomDef.aliases.some((a) => a.toLowerCase() === target)
    );
  };

  const handleRoomClick = (roomDef: (typeof enrichedFloorRooms)[0]) => {
    if (onSelectRoom) {
      onSelectRoom(roomDef.canonicalRoomId);
    }
  };

  // Visible stops on current floor, distributed cleanly inside rooms without overlapping
  const visibleStopsWithPositions = useMemo(() => {
    const stopsOnFloor: (RouteStop & {
      index: number;
      isCurrent: boolean;
      isVisited: boolean;
      isPending: boolean;
      cx: number;
      cy: number;
    })[] = [];

    // Group stops on this floor by roomDef
    const stopsByRoom = new Map<string, { stop: RouteStop; index: number }[]>();

    stops.forEach((stop, index) => {
      const stopRoomId = (stop.room_id || (stop as any).roomId || '').toLowerCase();
      const foundDef = enrichedFloorRooms.find(
        (def) =>
          def.canonicalRoomId.toLowerCase() === stopRoomId ||
          def.id.toLowerCase() === stopRoomId ||
          def.svg_id.toLowerCase() === stopRoomId ||
          def.aliases.some((a) => a.toLowerCase() === stopRoomId)
      );

      if (foundDef) {
        if (!stopsByRoom.has(foundDef.id)) {
          stopsByRoom.set(foundDef.id, []);
        }
        stopsByRoom.get(foundDef.id)!.push({ stop, index });
      }
    });

    // Compute coordinates for each stop with gentle offset if multiple in same room
    stopsByRoom.forEach((items, defId) => {
      const def = enrichedFloorRooms.find((d) => d.id === defId)!;
      const count = items.length;
      const centerX = def.x + def.w / 2;
      const centerY = def.y + def.h / 2;

      items.forEach((item, k) => {
        // Offset stops horizontally or vertically depending on wing
        let offsetX = 0;
        let offsetY = 0;

        if (count > 1) {
          if (def.wing === 'norte' || def.wing === 'sur') {
            offsetX = (k - (count - 1) / 2) * 28;
          } else {
            offsetY = (k - (count - 1) / 2) * 16;
            offsetX = ((k % 2) - 0.5) * 16;
          }
        }

        const isCurrent = currentStopIndex === item.index;
        const isVisited = item.index < currentStopIndex;
        const isPending = item.index > currentStopIndex;

        stopsOnFloor.push({
          ...item.stop,
          index: item.index,
          isCurrent,
          isVisited,
          isPending,
          cx: centerX + offsetX,
          cy: centerY + offsetY,
        });
      });
    });

    // Sort by stop index for route lines
    stopsOnFloor.sort((a, b) => a.index - b.index);
    return stopsOnFloor;
  }, [stops, enrichedFloorRooms, currentStopIndex]);

  // Points for route connecting line
  const routePolylinePoints = useMemo(() => {
    if (visibleStopsWithPositions.length <= 1) return '';
    return visibleStopsWithPositions.map((s) => `${s.cx},${s.cy}`).join(' ');
  }, [visibleStopsWithPositions]);

  // Count of etnografía rooms from rooms prop
  const paCount = useMemo(() => {
    return rooms.filter((r) => r.piso === 'PA').length;
  }, [rooms]);

  const pbCount = useMemo(() => {
    const count = rooms.filter((r) => r.piso === 'PB').length;
    return count > 0 ? count : 12;
  }, [rooms]);

  return (
    <div className="w-full flex flex-col items-center select-none font-sans">
      {/* 1. Selector de piso superior */}
      {showFloorSelector && (
        <div className="w-full max-w-md grid grid-cols-2 p-1 rounded-2xl bg-[#141419] border border-white/10 shadow-lg mb-3">
          <button
            type="button"
            onClick={() => handleFloorSwitch('PB')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              selectedFloor === 'PB'
                ? 'bg-[#F59E0B] text-black shadow-md shadow-[#F59E0B]/20 font-black'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            <span>🏛️</span>
            <span>{t.floorPBButton(pbCount)}</span>
          </button>
          <button
            type="button"
            onClick={() => handleFloorSwitch('PA')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              selectedFloor === 'PA'
                ? 'bg-[#F59E0B] text-black shadow-md shadow-[#F59E0B]/20 font-black'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            <span>🧵</span>
            <span>{t.floorPAButton(paCount, paUnit)}</span>
          </button>
        </div>
      )}

      {/* 2. RENDERIZADO DEL PLANO ARQUITECTÓNICO VECTORIAL (ViewBox: 0 0 900 650) */}
      <div className="w-full max-w-4xl aspect-[900/650] relative rounded-2xl overflow-hidden border border-[#2D3748]/70 bg-[#0A0C10] shadow-2xl">
        <svg
          viewBox="0 0 900 650"
          className="w-full h-full"
          role="img"
          aria-label={t.svgAria(selectedFloor)}
        >
          <defs>
            <pattern id="cadGrid" width="25" height="25" patternUnits="userSpaceOnUse">
              <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#161B24" strokeWidth="0.5" />
            </pattern>

            <linearGradient id="patioWaterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#141A26" stopOpacity="1" />
              <stop offset="100%" stopColor="#10151F" stopOpacity="1" />
            </linearGradient>

            <linearGradient id="lilyWaterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0E2338" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#13334E" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0E2338" stopOpacity="0.9" />
            </linearGradient>

            <radialGradient id="umbrellaCascade" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.5" />
              <stop offset="30%" stopColor="#0284C7" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#0369A1" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#121721" stopOpacity="0" />
            </radialGradient>

            <filter id="solarGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#F59E0B" floodOpacity="0.9" />
            </filter>

            <filter id="greenGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#10B981" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Lienzo y Cuadrícula */}
          <rect x="0" y="0" width="900" height="650" fill="#0A0C10" />
          <rect x="0" y="0" width="900" height="650" fill="url(#cadGrid)" />

          {/* PATIO CENTRAL MONUMENTAL */}
          <rect
            x="265"
            y="150"
            width="370"
            height="385"
            rx="8"
            fill="url(#patioWaterGrad)"
            stroke="#1E293B"
            strokeWidth="1.5"
          />

          {/* Estanque de Lirios (en PB) */}
          <g>
            <rect
              x="305"
              y="165"
              width="290"
              height="38"
              rx="6"
              fill="url(#lilyWaterGrad)"
              stroke="#1E3A5F"
              strokeWidth="1"
            />
            <circle cx="335" cy="184" r="3.5" fill="#10B981" opacity="0.6" />
            <circle cx="450" cy="182" r="4.5" fill="#10B981" opacity="0.7" />
            <circle cx="560" cy="185" r="3.5" fill="#10B981" opacity="0.6" />
            <text
              x="450"
              y="188"
              textAnchor="middle"
              fill="#60A5FA"
              fontSize="9"
              fontFamily="monospace"
              letterSpacing="2"
              opacity="0.7"
            >
              {t.lilyPond}
            </text>
          </g>

          {/* GLIFO DE EL PARAGUAS (cx=450, cy=342.5) */}
          <g transform="translate(450, 342.5)">
            <circle cx="0" cy="0" r="68" fill="none" stroke="#38BDF8" strokeWidth="0.7" strokeDasharray="3 3" opacity="0.25" />
            <circle cx="0" cy="0" r="54" fill="none" stroke="#38BDF8" strokeWidth="0.8" opacity="0.35" />
            <circle cx="0" cy="0" r="44" fill="url(#umbrellaCascade)" />
            <circle cx="0" cy="0" r="42" fill="#181E29" stroke="#3B465C" strokeWidth="1.5" />
            {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5].map((deg) => (
              <line
                key={deg}
                x1="0"
                y1="0"
                x2={38 * Math.cos((deg * Math.PI) / 180)}
                y2={38 * Math.sin((deg * Math.PI) / 180)}
                stroke="#D97706"
                strokeWidth="0.8"
                opacity="0.6"
              />
            ))}
            <circle cx="0" cy="0" r="28" fill="none" stroke="#38BDF8" strokeWidth="2" strokeDasharray="5 2.5" opacity="0.85" />
            <circle cx="0" cy="0" r="18" fill="none" stroke="#67E8F9" strokeWidth="1.2" opacity="0.7" />
            <circle cx="0" cy="0" r="9" fill="#B45309" stroke="#F59E0B" strokeWidth="2" />
            <circle cx="0" cy="0" r="4" fill="#FDE68A" />

            <text
              x="0"
              y="58"
              textAnchor="middle"
              fill="#F59E0B"
              fontSize="9"
              fontWeight="800"
              letterSpacing="1.5"
            >
              {t.umbrella}
            </text>
            <text
              x="0"
              y="69"
              textAnchor="middle"
              fill="#9CA3AF"
              fontSize="7.5"
              fontFamily="sans-serif"
            >
              {t.architectCredit}
            </text>
          </g>

          {/* LÍNEA DE RUTA ENTRE PARADAS (Polyline de ruta activa) */}
          {routePolylinePoints && (
            <polyline
              points={routePolylinePoints}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2"
              strokeDasharray="6 4"
              opacity="0.65"
            />
          )}

          {/* RENDERIZADO DE LAS SALAS EN HERRADURA */}
          {enrichedFloorRooms.map((room) => {
            const isSelected = isRoomSelected(room);
            const inRoute = isRoomInRoute(room);
            const isHovered = hoveredRoomId === room.id;

            // Colors: in-route rooms are softly tinted
            let roomFill = '#161A22';
            let roomStroke = room.isMonumental ? '#4A5568' : '#2D3748';
            let strokeWidth = room.isMonumental ? 1.5 : 1.2;

            if (inRoute) {
              roomFill = '#1A2333';
              roomStroke = '#D97706';
              strokeWidth = 1.6;
            }

            if (isSelected || isHovered) {
              roomFill = '#222938';
              roomStroke = '#F59E0B';
              strokeWidth = 2.2;
            }

            return (
              <g
                key={room.svg_id}
                id={room.svg_id}
                onClick={() => handleRoomClick(room)}
                onMouseEnter={() => setHoveredRoomId(room.id)}
                onMouseLeave={() => setHoveredRoomId(null)}
                className="cursor-pointer transition-all duration-150"
                role="button"
                tabIndex={0}
                aria-label={t.roomAria(room.displayName, room.labelFull || `${strings.common.roomWord} ${room.numStr}`)}
              >
                {/* Rectángulo de Sala */}
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.w}
                  height={room.h}
                  rx={room.rx || 6}
                  fill={roomFill}
                  stroke={roomStroke}
                  strokeWidth={strokeWidth}
                  filter={isSelected || isHovered ? 'url(#solarGlow)' : undefined}
                />

                {/* Insignia Monumental (Mexica 06) */}
                {room.isMonumental && (
                  <path
                    d={`M ${room.x + 8} ${room.y + 6} L ${room.x + room.w - 8} ${room.y + 6}`}
                    stroke="#F59E0B"
                    strokeWidth="2"
                    strokeDasharray="8 4"
                    opacity="0.8"
                  />
                )}

                {/* Pastilla Circular con Número Oficial */}
                <g transform={`translate(${room.x + 18}, ${room.y + (room.h > 70 ? 24 : room.h / 2)})`}>
                  <circle
                    cx="0"
                    cy="0"
                    r={room.numStr.length > 2 ? 14 : 11}
                    fill={isSelected || isHovered ? '#F59E0B' : inRoute ? '#B45309' : '#232936'}
                    stroke={isSelected || isHovered ? '#FFFFFF' : '#3B4252'}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="3.5"
                    textAnchor="middle"
                    fill={isSelected || isHovered ? '#000000' : '#E5E7EB'}
                    fontSize={room.numStr.length > 2 ? '8' : '10'}
                    fontWeight="800"
                    fontFamily="monospace"
                  >
                    {room.numStr}
                  </text>
                </g>

                {/* Título de Sala leído de rooms.json */}
                {room.piso === 'PA' ? (
                  // Planta alta: nombres largos de ejes → se parten en varias líneas
                  (() => {
                    const maxChars = Math.max(10, Math.floor((room.w - 46) / 6.6));
                    const maxTitleLines = room.h > 120 ? 3 : room.h > 80 ? 2 : 1;
                    const titleLines = wrapText(room.displayName, maxChars, maxTitleLines);
                    const phraseStartY = room.y + 26 + titleLines.length * 14 + 4;
                    const phraseRoom = Math.floor((room.y + room.h - 8 - phraseStartY) / 11);
                    const phraseLines =
                      room.fraseGancho && phraseRoom > 0
                        ? wrapText(room.fraseGancho, Math.floor((room.w - 46) / 5.4), Math.min(phraseRoom, 4))
                        : [];
                    return (
                      <g>
                        <text
                          x={room.x + 36}
                          y={room.y + 26}
                          fill={isSelected || isHovered ? '#F59E0B' : '#F3F4F6'}
                          fontSize="11.5"
                          fontWeight="700"
                        >
                          {titleLines.map((line, li) => (
                            <tspan key={li} x={room.x + 36} dy={li === 0 ? 0 : 14}>
                              {line}
                            </tspan>
                          ))}
                        </text>
                        {phraseLines.length > 0 && (
                          <text x={room.x + 36} y={phraseStartY + 8} fill="#8F96A3" fontSize="8.5" fontWeight="400">
                            {phraseLines.map((line, li) => (
                              <tspan key={li} x={room.x + 36} dy={li === 0 ? 0 : 11}>
                                {line}
                              </tspan>
                            ))}
                          </text>
                        )}
                      </g>
                    );
                  })()
                ) : (
                  <g>
                    <text
                      x={room.x + 36}
                      y={room.y + (room.h > 65 ? 26 : 24)}
                      fill={isSelected || isHovered ? '#F59E0B' : '#F3F4F6'}
                      fontSize={room.h > 65 ? '11.5' : '11'}
                      fontWeight="700"
                    >
                      {room.displayName.length > 24 ? room.displayName.slice(0, 22) + '...' : room.displayName}
                    </text>

                    {/* Frase gancho sutil */}
                    {room.fraseGancho && (
                      <text
                        x={room.x + 36}
                        y={room.y + (room.h > 65 ? 42 : 40)}
                        fill="#8F96A3"
                        fontSize="8.5"
                        fontWeight="400"
                      >
                        {room.fraseGancho.length > 28 ? room.fraseGancho.slice(0, 26) + '...' : room.fraseGancho}
                      </text>
                    )}
                  </g>
                )}
              </g>
            );
          })}

          {/* PINES DE LA RUTA ACTIVA
              - Parada actual = ámbar (#F59E0B)
              - Ya visitada = verde (#10B981)
              - Pendiente = gris (#6B7280)
          */}
          {visibleStopsWithPositions.map((stop) => {
            const pinColor = stop.isCurrent ? '#F59E0B' : stop.isVisited ? '#10B981' : '#6B7280';
            const pinStroke = stop.isCurrent ? '#FFFFFF' : stop.isVisited ? '#065F46' : '#374151';
            const textColor = stop.isCurrent ? '#000000' : '#FFFFFF';

            return (
              <g
                key={stop.poi_id || stop.id || stop.index}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectStop) onSelectStop(stop.index);
                }}
                className="cursor-pointer transition-transform duration-200 hover:scale-125"
              >
                <circle
                  cx={stop.cx}
                  cy={stop.cy}
                  r={stop.isCurrent ? 13 : 9.5}
                  fill={pinColor}
                  stroke={pinStroke}
                  strokeWidth={stop.isCurrent ? 2.5 : 1.5}
                  filter={stop.isCurrent ? 'url(#solarGlow)' : stop.isVisited ? 'url(#greenGlow)' : undefined}
                />
                <text
                  x={stop.cx}
                  y={stop.cy + 3.5}
                  textAnchor="middle"
                  fill={textColor}
                  fontSize={stop.isCurrent ? '9.5' : '8'}
                  fontWeight="900"
                  fontFamily="monospace"
                >
                  {stop.index + 1}
                </text>
              </g>
            );
          })}

          {/* Brújula Vectorial Discreta */}
          <g transform="translate(845, 55)">
            <circle cx="0" cy="0" r="16" fill="#141822" stroke="#2D3748" strokeWidth="1" />
            <polygon points="0,-12 4,0 -4,0" fill="#EF4444" />
            <polygon points="0,12 4,0 -4,0" fill="#6B7280" />
            <text x="0" y="-14" textAnchor="middle" fill="#EF4444" fontSize="8" fontWeight="800">
              N
            </text>
            <text x="0" y="21" textAnchor="middle" fill="#9CA3AF" fontSize="7" fontWeight="600">
              S
            </text>
          </g>

          {/* Aviso: la planta alta es un esquema del recorrido, no el plano exacto */}
          {selectedFloor === 'PA' && (
            <text x="35" y="632" fill="#6B7280" fontSize="8.5" fontFamily="sans-serif">
              {t.schematicNote}
            </text>
          )}

          {/* Rótulo inferior del piso activo con cálculo real desde rooms.json */}
          <g transform="translate(865, 625)">
            <text textAnchor="end" fill="#F59E0B" fontSize="9" fontWeight="700" fontFamily="sans-serif">
              {selectedFloor === 'PB'
                ? t.levelPB(pbCount)
                : t.levelPA(paCount, paUnit.charAt(0).toUpperCase() + paUnit.slice(1))}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default MuseumMapSvg;
