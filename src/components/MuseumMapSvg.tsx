import React, { useMemo } from 'react';
import { Room, RouteStop } from '../types';
import { useTheme } from '../utils/ThemeContext';

export interface MuseumMapSvgProps {
  rooms?: Room[];
  selectedRoomId?: string | null;
  onSelectRoom?: (roomId: string) => void;
  stops?: RouteStop[];
  currentStopIndex?: number;
  onSelectStop?: (stopIndex: number) => void;
}

interface RoomDefinition {
  num: number;
  id: string;
  aliases: string[];
  name: string;
  shortName: string;
  sub: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rx?: number;
  center: { x: number; y: number };
  wing: 'norte' | 'cabecera' | 'sur';
  gardenExit?: { x: number; y: number; dir: 'left' | 'right' | 'top' };
}

// 11 Salas Oficiales del Museo Nacional de Antropología (INAH - Planta Baja)
const OFFICIAL_ROOMS: RoomDefinition[] = [
  // --- Ala Derecha (Ala Norte) ---
  {
    num: 1,
    id: 'sala-introduccion_antropologia',
    aliases: ['sala-1', 'sala-introduccion', 'introduccion'],
    name: 'Introducción a la Antropología',
    shortName: '1. Intro',
    sub: 'Evolución humana',
    x: 675,
    y: 575,
    w: 200,
    h: 75,
    rx: 6,
    center: { x: 775, y: 612.5 },
    wing: 'norte',
    gardenExit: { x: 875, y: 612.5, dir: 'right' },
  },
  {
    num: 2,
    id: 'sala-poblamiento',
    aliases: ['sala-2', 'poblamiento', 'poblamiento_de_america'],
    name: 'Poblamiento de América',
    shortName: '2. Poblamiento',
    sub: 'Glaciaciones · Bering',
    x: 675,
    y: 490,
    w: 200,
    h: 75,
    rx: 6,
    center: { x: 775, y: 527.5 },
    wing: 'norte',
    gardenExit: { x: 875, y: 527.5, dir: 'right' },
  },
  {
    num: 3,
    id: 'sala-preclasico',
    aliases: ['sala-3', 'preclasico', 'altiplano'],
    name: 'Preclásico en el Altiplano Central',
    shortName: '3. Preclásico',
    sub: 'Tlatilco · Aldeas',
    x: 675,
    y: 405,
    w: 200,
    h: 75,
    rx: 6,
    center: { x: 775, y: 442.5 },
    wing: 'norte',
    gardenExit: { x: 875, y: 442.5, dir: 'right' },
  },
  {
    num: 4,
    id: 'sala-teotihuacan',
    aliases: ['sala-4', 'teotihuacan'],
    name: 'Teotihuacán',
    shortName: '4. Teotihuacán',
    sub: 'Ciudad de los Dioses',
    x: 675,
    y: 275,
    w: 200,
    h: 120,
    rx: 6,
    center: { x: 775, y: 335 },
    wing: 'norte',
    gardenExit: { x: 875, y: 335, dir: 'right' },
  },
  {
    num: 5,
    id: 'sala-tolteca',
    aliases: ['sala-5', 'tolteca', 'toltecas', 'epiclasico'],
    name: 'Los Toltecas y el Epiclásico',
    shortName: '5. Tolteca',
    sub: 'Tula · Xochicalco',
    x: 675,
    y: 185,
    w: 200,
    h: 80,
    rx: 6,
    center: { x: 775, y: 225 },
    wing: 'norte',
    gardenExit: { x: 875, y: 225, dir: 'right' },
  },

  // --- Cabecera (Fondo Central) ---
  {
    num: 6,
    id: 'sala-mexica',
    aliases: ['sala-6', 'mexica', 'azteca', 'tenochtitlan'],
    name: 'Mexica',
    shortName: '6. Mexica',
    sub: 'Piedra del Sol · Tenochtitlan',
    x: 330,
    y: 45,
    w: 340,
    h: 180,
    rx: 8,
    center: { x: 500, y: 135 },
    wing: 'cabecera',
    gardenExit: { x: 500, y: 45, dir: 'top' },
  },

  // --- Ala Izquierda (Ala Sur) ---
  {
    num: 7,
    id: 'sala-oaxaca',
    aliases: ['sala-7', 'oaxaca', 'monte_alban'],
    name: 'Culturas de Oaxaca',
    shortName: '7. Oaxaca',
    sub: 'Monte Albán · Mixtecos',
    x: 125,
    y: 75,
    w: 195,
    h: 105,
    rx: 6,
    center: { x: 222.5, y: 127.5 },
    wing: 'sur',
    gardenExit: { x: 125, y: 127.5, dir: 'left' },
  },
  {
    num: 8,
    id: 'sala-costa_del_golfo',
    aliases: ['sala-8', 'costa_del_golfo', 'golfo', 'olmeca'],
    name: 'Culturas de la Costa del Golfo',
    shortName: '8. Costa del Golfo',
    sub: 'Olmecas · Huastecos',
    x: 125,
    y: 190,
    w: 195,
    h: 115,
    rx: 6,
    center: { x: 222.5, y: 247.5 },
    wing: 'sur',
    gardenExit: { x: 125, y: 247.5, dir: 'left' },
  },
  {
    num: 9,
    id: 'sala-maya',
    aliases: ['sala-9', 'maya', 'palenque'],
    name: 'Maya',
    shortName: '9. Maya',
    sub: 'Palenque · Calakmul',
    x: 105,
    y: 315,
    w: 215,
    h: 165,
    rx: 6,
    center: { x: 212.5, y: 397.5 },
    wing: 'sur',
    gardenExit: { x: 105, y: 397.5, dir: 'left' },
  },
  {
    num: 10,
    id: 'sala-occidente',
    aliases: ['sala-10', 'occidente', 'tarascos', 'purepecha'],
    name: 'Culturas de Occidente',
    shortName: '10. Occidente',
    sub: 'Tumbas de tiro · Colima',
    x: 125,
    y: 490,
    w: 195,
    h: 75,
    rx: 6,
    center: { x: 222.5, y: 527.5 },
    wing: 'sur',
    gardenExit: { x: 125, y: 527.5, dir: 'left' },
  },
  {
    num: 11,
    id: 'sala-norte',
    aliases: ['sala-11', 'norte', 'paquime'],
    name: 'Culturas del Norte',
    shortName: '11. Norte',
    sub: 'Paquimé · Casas Grandes',
    x: 125,
    y: 575,
    w: 195,
    h: 75,
    rx: 6,
    center: { x: 222.5, y: 612.5 },
    wing: 'sur',
    gardenExit: { x: 125, y: 612.5, dir: 'left' },
  },
];

export const MuseumMapSvg: React.FC<MuseumMapSvgProps> = ({
  rooms = [],
  selectedRoomId = null,
  onSelectRoom,
  stops = [],
  currentStopIndex = 0,
  onSelectStop,
}) => {
  const { isSunMode } = useTheme();

  // Empareja un ID de sala con su definición oficial
  const matchOfficialRoom = (idOrName?: string): RoomDefinition | undefined => {
    if (!idOrName) return undefined;
    const clean = idOrName.toLowerCase().replace(/_/g, '-').trim();
    return OFFICIAL_ROOMS.find(
      (r) =>
        r.id === clean ||
        r.aliases.includes(clean) ||
        clean.includes(r.id.replace('sala-', '')) ||
        r.aliases.some((a) => clean.includes(a))
    );
  };

  // Identifica cuál es la sala de la parada actual
  const activeStop = stops[currentStopIndex] || null;
  const activeStopRoomDef = useMemo(() => {
    if (!activeStop) return null;
    return matchOfficialRoom(activeStop.room_id || activeStop.room_zone);
  }, [activeStop]);

  // Identifica la sala seleccionada actualmente para inspección
  const selectedRoomDef = useMemo(() => {
    if (!selectedRoomId) return null;
    return matchOfficialRoom(selectedRoomId);
  }, [selectedRoomId]);

  // Mapea paradas del tour a sus coordenadas visuales
  const stopPoints = useMemo(() => {
    return stops.map((stop, idx) => {
      const roomDef = matchOfficialRoom(stop.room_id || stop.room_zone);
      const center = roomDef ? roomDef.center : { x: 500, y: 400 };
      // Pequeño desplazamiento si hay múltiples paradas en la misma sala
      const offsetIndex = stops
        .slice(0, idx)
        .filter((s) => (s.room_id || s.room_zone) === (stop.room_id || stop.room_zone)).length;
      const offsetX = offsetIndex ? (offsetIndex % 2 === 0 ? 14 : -14) * offsetIndex : 0;
      const offsetY = offsetIndex ? (offsetIndex % 2 === 0 ? 10 : -10) * offsetIndex : 0;
      return {
        stop,
        index: idx,
        x: center.x + offsetX,
        y: center.y + offsetY,
        roomDef,
        isCurrent: idx === currentStopIndex,
      };
    });
  }, [stops, currentStopIndex]);

  // Genera el camino de trayectoria entre paradas
  const trajectoryPath = useMemo(() => {
    if (stopPoints.length < 2) return '';
    return stopPoints.reduce((acc, pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      const prev = stopPoints[i - 1];
      const midX = (prev.x + pt.x) / 2;
      const midY = (prev.y + pt.y) / 2;
      return `${acc} Q ${prev.x} ${midY} ${midX} ${midY} T ${pt.x} ${pt.y}`;
    }, '');
  }, [stopPoints]);

  // Colores arquitectónicos del plano adaptativos
  const themeColors = isSunMode
    ? {
        canvasBg: '#FAF8F5',
        patioBg: '#EDE8DF',
        patioGrid: '#DED7CA',
        roomDefaultBg: '#FFFFFF',
        roomDefaultBorder: '#CBD5E1',
        roomHoverBorder: '#C05638',
        roomTextPrimary: '#111827',
        roomTextSecondary: '#4B5563',
        roomSubBadge: '#F3EFEA',
        espejoWater: '#38BDF8',
        espejoWaterBg: '#E0F2FE',
        paraguasCanopy: '#D97706',
        paraguasPillar: '#B45309',
        paraguasRing: '#FDE68A',
        servicesBg: '#F1EFEA',
        servicesBorder: '#D8D3C8',
        servicesText: '#6B7280',
        activeRoomFill: '#FEF3C7',
        activeRoomBorder: '#C05638',
        selectedRoomFill: '#FFEDD5',
        selectedRoomBorder: '#EA580C',
        gardenText: '#047857',
        gardenExitBg: '#D1FAE5',
        gardenExitBorder: '#6EE7B7',
      }
    : {
        canvasBg: '#121212',
        patioBg: '#1A1A1A',
        patioGrid: '#262626',
        roomDefaultBg: '#1E1E1E',
        roomDefaultBorder: '#333333',
        roomHoverBorder: '#D96B47',
        roomTextPrimary: '#F5F5F4',
        roomTextSecondary: '#A8A29E',
        roomSubBadge: '#262626',
        espejoWater: '#0284C7',
        espejoWaterBg: '#082F49',
        paraguasCanopy: '#D97706',
        paraguasPillar: '#92400E',
        paraguasRing: '#78350F',
        servicesBg: '#171717',
        servicesBorder: '#2B2B2B',
        servicesText: '#737373',
        activeRoomFill: '#451A03',
        activeRoomBorder: '#F59E0B',
        selectedRoomFill: '#431407',
        selectedRoomBorder: '#EA580C',
        gardenText: '#10B981',
        gardenExitBg: '#064E3B',
        gardenExitBorder: '#059669',
      };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <svg
        id="mna-architectural-map-svg"
        viewBox="0 0 1000 800"
        className="w-full h-full max-h-[85vh] select-none touch-none"
        preserveAspectRatio="xMidYMid meet"
        role="region"
        aria-label="Plano arquitectónico oficial del Museo Nacional de Antropología"
      >
        <defs>
          {/* Sombra suave para salas activas */}
          <filter id="mna-room-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity={isSunMode ? '0.15' : '0.4'} />
          </filter>

          {/* Sombra de relieve para El Paraguas */}
          <filter id="paraguas-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#B45309" floodOpacity="0.3" />
          </filter>

          {/* Degradado para el Espejo de Agua */}
          <linearGradient id="espejo-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={themeColors.espejoWater} stopOpacity={isSunMode ? '0.35' : '0.5'} />
            <stop offset="100%" stopColor={themeColors.espejoWater} stopOpacity={isSunMode ? '0.15' : '0.2'} />
          </linearGradient>

          {/* Patrón de losetas del patio */}
          <pattern id="patio-grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke={themeColors.patioGrid}
              strokeWidth="0.75"
              strokeDasharray="2,2"
            />
          </pattern>
        </defs>

        {/* Fondo general del recinto */}
        <rect width="1000" height="800" fill={themeColors.canvasBg} />

        {/* Rotulación de Jardines Exteriores (Bosque de Chapultepec) */}
        <g id="jardines-exteriores" opacity="0.6">
          <text
            x="45"
            y="400"
            textAnchor="middle"
            transform="rotate(-90 45 400)"
            className="text-[11px] font-bold uppercase tracking-widest"
            fill={themeColors.gardenText}
          >
            🌿 Jardines del Museo (Sur)
          </text>
          <text
            x="955"
            y="400"
            textAnchor="middle"
            transform="rotate(90 955 400)"
            className="text-[11px] font-bold uppercase tracking-widest"
            fill={themeColors.gardenText}
          >
            🌿 Jardines del Museo (Norte)
          </text>
          <text
            x="500"
            y="25"
            textAnchor="middle"
            className="text-[11px] font-bold uppercase tracking-widest"
            fill={themeColors.gardenText}
          >
            🌲 Bosque de Chapultepec (Fondo)
          </text>
        </g>

        {/* ================= PATIO CENTRAL ================= */}
        <g id="patio-central">
          {/* Losa principal del patio */}
          <rect
            x="330"
            y="235"
            width="340"
            height="415"
            rx="4"
            fill={themeColors.patioBg}
            stroke={themeColors.patioGrid}
            strokeWidth="1.5"
          />
          {/* Cuadrícula sutil de losas */}
          <rect x="330" y="235" width="340" height="415" rx="4" fill="url(#patio-grid-pattern)" />

          {/* Rótulo de Patio Central */}
          <text
            x="500"
            y="470"
            textAnchor="middle"
            className="text-[11px] font-extrabold uppercase tracking-widest pointer-events-none"
            fill={themeColors.roomTextSecondary}
            opacity="0.65"
          >
            Patio Central
          </text>
          <text
            x="500"
            y="486"
            textAnchor="middle"
            className="text-[9px] font-medium pointer-events-none"
            fill={themeColors.roomTextSecondary}
            opacity="0.5"
          >
            Arq. Pedro Ramírez Vázquez
          </text>

          {/* --- ESPEJO DE AGUA (Al fondo del patio, frente a Sala Mexica) --- */}
          <g id="espejo-de-agua">
            <rect
              x="430"
              y="255"
              width="140"
              height="165"
              rx="6"
              fill="url(#espejo-grad)"
              stroke={themeColors.espejoWater}
              strokeWidth="1.5"
              strokeDasharray="4,2"
            />
            {/* Ondas sutiles del estanque */}
            <path
              d="M 450 300 Q 500 295 550 300"
              fill="none"
              stroke={themeColors.espejoWater}
              strokeWidth="1"
              opacity="0.4"
            />
            <path
              d="M 450 335 Q 500 340 550 335"
              fill="none"
              stroke={themeColors.espejoWater}
              strokeWidth="1"
              opacity="0.4"
            />
            <path
              d="M 450 370 Q 500 365 550 370"
              fill="none"
              stroke={themeColors.espejoWater}
              strokeWidth="1"
              opacity="0.4"
            />
            {/* Lirio / Escultura acuática */}
            <circle cx="500" cy="335" r="5" fill={themeColors.espejoWater} opacity="0.6" />
            <text
              x="500"
              y="280"
              textAnchor="middle"
              className="text-[10px] font-bold uppercase tracking-wider pointer-events-none"
              fill={themeColors.espejoWater}
            >
              Espejo de Agua
            </text>
            <text
              x="500"
              y="293"
              textAnchor="middle"
              className="text-[8px] italic pointer-events-none"
              fill={themeColors.roomTextSecondary}
            >
              (Estanque con vegetación)
            </text>
          </g>

          {/* Pasillo central de conexión peatonal */}
          <line
            x1="500"
            y1="420"
            x2="500"
            y2="475"
            stroke={themeColors.patioGrid}
            strokeWidth="2"
            strokeDasharray="3,3"
          />

          {/* --- EL PARAGUAS MONUMENTAL (Al frente del patio) --- */}
          <g id="el-paraguas" filter="url(#paraguas-shadow)">
            {/* Halo de brisa / caída de agua circular */}
            <circle
              cx="500"
              cy="555"
              r="52"
              fill="none"
              stroke={themeColors.paraguasCanopy}
              strokeWidth="1"
              strokeDasharray="4,4"
              opacity="0.4"
            />
            {/* Cubierta del Paraguas */}
            <circle
              cx="500"
              cy="555"
              r="44"
              fill={isSunMode ? '#FFFBEB' : '#2D1F0A'}
              stroke={themeColors.paraguasCanopy}
              strokeWidth="2.5"
            />
            {/* Estrías radiales (24 radios que representan la techumbre de Ramírez Vázquez) */}
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 15 * Math.PI) / 180;
              const x2 = 500 + Math.cos(angle) * 44;
              const y2 = 555 + Math.sin(angle) * 44;
              return (
                <line
                  key={i}
                  x1="500"
                  y1="555"
                  x2={x2}
                  y2={y2}
                  stroke={themeColors.paraguasCanopy}
                  strokeWidth="0.8"
                  opacity="0.5"
                />
              );
            })}
            {/* Anillo de descarga pluvial */}
            <circle
              cx="500"
              cy="555"
              r="22"
              fill="none"
              stroke={themeColors.paraguasRing}
              strokeWidth="1.5"
            />
            {/* Columna central de bronce esculpida por José Chávez Morado */}
            <circle
              cx="500"
              cy="555"
              r="9"
              fill={themeColors.paraguasPillar}
              stroke="#F59E0B"
              strokeWidth="1.5"
            />
            <circle cx="500" cy="555" r="3" fill="#FDE68A" />
            <text
              x="500"
              y="616"
              textAnchor="middle"
              className="text-[10px] font-black uppercase tracking-wider pointer-events-none"
              fill={themeColors.paraguasCanopy}
            >
              El Paraguas
            </text>
            <text
              x="500"
              y="628"
              textAnchor="middle"
              className="text-[8px] pointer-events-none"
              fill={themeColors.roomTextSecondary}
            >
              Columna escultórica monumental
            </text>
          </g>
        </g>

        {/* ================= ÁREAS DE ACCESO Y SERVICIOS (BASE) ================= */}
        <g id="areas-servicios">
          {/* Vestíbulo y Entrada General */}
          <rect
            x="330"
            y="660"
            width="340"
            height="85"
            rx="6"
            fill={themeColors.servicesBg}
            stroke={themeColors.servicesBorder}
            strokeWidth="1.5"
          />
          {/* Sala de Orientación */}
          <rect
            x="440"
            y="670"
            width="120"
            height="32"
            rx="4"
            fill={isSunMode ? '#E7E5E4' : '#262626'}
            stroke={themeColors.servicesBorder}
            strokeWidth="1"
          />
          <text
            x="500"
            y="688"
            textAnchor="middle"
            className="text-[9px] font-bold uppercase pointer-events-none"
            fill={themeColors.roomTextSecondary}
          >
            Sala de Orientación
          </text>
          <text
            x="500"
            y="722"
            textAnchor="middle"
            className="text-[11px] font-black uppercase tracking-wider pointer-events-none"
            fill={themeColors.roomTextPrimary}
          >
            Vestíbulo · Taquilla · Acceso
          </text>
          {/* Flecha de Acceso Principal */}
          <g transform="translate(500, 755)">
            <path d="M 0 -8 L 6 0 L -6 0 Z" fill="#C05638" />
            <text
              x="0"
              y="16"
              textAnchor="middle"
              className="text-[9px] font-black uppercase tracking-widest"
              fill="#C05638"
            >
              Entrada General (Paseo de la Reforma)
            </text>
          </g>

          {/* Auditorio Jaime Torres Bodet */}
          <rect
            x="675"
            y="660"
            width="200"
            height="85"
            rx="6"
            fill={themeColors.servicesBg}
            stroke={themeColors.servicesBorder}
            strokeWidth="1.5"
          />
          <text
            x="775"
            y="695"
            textAnchor="middle"
            className="text-[10px] font-bold uppercase pointer-events-none"
            fill={themeColors.servicesText}
          >
            Auditorio
          </text>
          <text
            x="775"
            y="712"
            textAnchor="middle"
            className="text-[9px] pointer-events-none"
            fill={themeColors.servicesText}
          >
            Jaime Torres Bodet
          </text>
          <text
            x="775"
            y="728"
            textAnchor="middle"
            className="text-[8px] pointer-events-none"
            fill={themeColors.servicesText}
          >
            Exposiciones Temporales
          </text>

          {/* Servicios Educativos / Restaurante / Tienda */}
          <rect
            x="125"
            y="660"
            width="195"
            height="85"
            rx="6"
            fill={themeColors.servicesBg}
            stroke={themeColors.servicesBorder}
            strokeWidth="1.5"
          />
          <text
            x="222.5"
            y="695"
            textAnchor="middle"
            className="text-[10px] font-bold uppercase pointer-events-none"
            fill={themeColors.servicesText}
          >
            Servicios al Visitante
          </text>
          <text
            x="222.5"
            y="712"
            textAnchor="middle"
            className="text-[9px] pointer-events-none"
            fill={themeColors.servicesText}
          >
            Comunicación Educativa
          </text>
          <text
            x="222.5"
            y="728"
            textAnchor="middle"
            className="text-[8px] pointer-events-none"
            fill={themeColors.servicesText}
          >
            Restaurante · Librería
          </text>
        </g>

        {/* ================= TRAYECTORIA DE LA RUTA ACTIVA ================= */}
        {trajectoryPath && (
          <g id="ruta-trayectoria">
            <path
              d={trajectoryPath}
              fill="none"
              stroke="#EA580C"
              strokeWidth="3.5"
              strokeDasharray="8,6"
              strokeLinecap="round"
              opacity="0.8"
            />
          </g>
        )}

        {/* ================= LAS 11 SALAS OFICIALES INTERACTIVAS ================= */}
        <g id="salas-oficiales">
          {OFFICIAL_ROOMS.map((room) => {
            const isSelected = selectedRoomDef?.id === room.id;
            const isCurrentStop = activeStopRoomDef?.id === room.id;

            // Determinar los colores de fondo y borde según el estado
            let fill = themeColors.roomDefaultBg;
            let stroke = themeColors.roomDefaultBorder;
            let strokeWidth = 1.5;

            if (isSelected) {
              fill = themeColors.selectedRoomFill;
              stroke = themeColors.selectedRoomBorder;
              strokeWidth = 3;
            } else if (isCurrentStop) {
              fill = themeColors.activeRoomFill;
              stroke = themeColors.activeRoomBorder;
              strokeWidth = 2.5;
            }

            // Buscar si esta sala tiene paradas del tour
            const stopsInRoom = stopPoints.filter((pt) => pt.roomDef?.id === room.id);

            return (
              <g
                key={room.id}
                id={`map-room-${room.id}`}
                className="cursor-pointer transition-all duration-200 group"
                onClick={() => onSelectRoom && onSelectRoom(room.id)}
              >
                {/* Rectángulo de la sala con esquinas arquitectónicas sobrias */}
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.w}
                  height={room.h}
                  rx={room.rx || 6}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  className="transition-all duration-150 group-hover:brightness-95 group-active:scale-[0.995]"
                  filter={isSelected || isCurrentStop ? 'url(#mna-room-shadow)' : undefined}
                />

                {/* Pulso animado para la sala de la parada actual */}
                {isCurrentStop && (
                  <rect
                    x={room.x - 2}
                    y={room.y - 2}
                    width={room.w + 4}
                    height={room.h + 4}
                    rx={(room.rx || 6) + 2}
                    fill="none"
                    stroke="#EA580C"
                    strokeWidth="2"
                    strokeDasharray="6,4"
                    className="animate-pulse"
                  />
                )}

                {/* Salida a Jardines (Indicador exterior INAH) */}
                {room.gardenExit && (
                  <g
                    transform={`translate(${room.gardenExit.x}, ${room.gardenExit.y})`}
                    opacity="0.85"
                  >
                    <circle
                      cx="0"
                      cy="0"
                      r="4"
                      fill={themeColors.gardenExitBg}
                      stroke={themeColors.gardenExitBorder}
                      strokeWidth="1"
                    />
                  </g>
                )}

                {/* Número de Sala (Insignia circular de estilo arquitectónico) */}
                <circle
                  cx={room.x + 20}
                  cy={room.y + 20}
                  r="11"
                  fill={
                    isSelected || isCurrentStop
                      ? '#EA580C'
                      : isSunMode
                      ? '#F1EFEA'
                      : '#2E2E2E'
                  }
                  stroke={
                    isSelected || isCurrentStop
                      ? '#EA580C'
                      : isSunMode
                      ? '#CBD5E1'
                      : '#404040'
                  }
                  strokeWidth="1"
                />
                <text
                  x={room.x + 20}
                  y={room.y + 24}
                  textAnchor="middle"
                  className="text-[10px] font-black pointer-events-none"
                  fill={isSelected || isCurrentStop ? '#FFFFFF' : themeColors.roomTextPrimary}
                >
                  {room.num}
                </text>

                {/* Nombre de la Sala (Abreviado oficial) */}
                <text
                  x={room.x + 36}
                  y={room.y + 23}
                  className="text-[12px] font-black tracking-tight pointer-events-none select-none"
                  fill={themeColors.roomTextPrimary}
                >
                  {room.name.length > 24 ? room.shortName : room.name}
                </text>

                {/* Subtítulo / Piezas clave */}
                <text
                  x={room.x + 16}
                  y={room.y + 44}
                  className="text-[9.5px] font-medium pointer-events-none select-none"
                  fill={themeColors.roomTextSecondary}
                >
                  {room.sub}
                </text>

                {/* Detalles especiales en Sala Mexica */}
                {room.num === 6 && (
                  <g transform="translate(500, 140)" opacity="0.85" className="pointer-events-none">
                    <circle
                      cx="0"
                      cy="0"
                      r="22"
                      fill={isSunMode ? '#FEF3C7' : '#451A03'}
                      stroke="#D97706"
                      strokeWidth="1.5"
                      strokeDasharray="4,2"
                    />
                    <text
                      x="0"
                      y="-4"
                      textAnchor="middle"
                      className="text-[8.5px] font-black uppercase tracking-wider"
                      fill="#D97706"
                    >
                      Piedra del Sol
                    </text>
                    <text
                      x="0"
                      y="7"
                      textAnchor="middle"
                      className="text-[7.5px] font-bold"
                      fill={themeColors.roomTextSecondary}
                    >
                      Altar Mayor Mexica
                    </text>
                  </g>
                )}

                {/* Detalles especiales en Sala Maya */}
                {room.num === 9 && (
                  <g transform="translate(212.5, 420)" opacity="0.8" className="pointer-events-none">
                    <rect
                      x="-45"
                      y="-12"
                      width="90"
                      height="24"
                      rx="4"
                      fill={isSunMode ? '#ECFDF5' : '#064E3B'}
                      stroke="#059669"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      className="text-[8.5px] font-bold"
                      fill={isSunMode ? '#047857' : '#34D399'}
                    >
                      Tumba de Pakal
                    </text>
                  </g>
                )}

                {/* Detalles especiales en Sala Teotihuacán */}
                {room.num === 4 && (
                  <g transform="translate(775, 360)" opacity="0.8" className="pointer-events-none">
                    <text
                      x="0"
                      y="0"
                      textAnchor="middle"
                      className="text-[8.5px] font-bold italic"
                      fill={themeColors.roomTextSecondary}
                    >
                      Diosa del Agua · Pirámides
                    </text>
                  </g>
                )}

                {/* Badge con la cantidad de paradas de esta sala si las hay */}
                {stopsInRoom.length > 0 && (
                  <g
                    transform={`translate(${room.x + room.w - 18}, ${room.y + 18})`}
                    className="pointer-events-none"
                  >
                    <circle cx="0" cy="0" r="9" fill="#EA580C" />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      className="text-[9px] font-black"
                      fill="#FFFFFF"
                    >
                      {stopsInRoom.length}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* ================= PINES INTERACTIVOS DE PARADAS ================= */}
        <g id="pines-de-parada">
          {stopPoints.map((pt) => {
            const isCurrent = pt.isCurrent;
            return (
              <g
                key={`stop-pin-${pt.index}`}
                id={`pin-stop-${pt.index + 1}`}
                transform={`translate(${pt.x}, ${pt.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectStop && onSelectStop(pt.index);
                  if (pt.roomDef && onSelectRoom) onSelectRoom(pt.roomDef.id);
                }}
                className="cursor-pointer group"
              >
                {/* Halo de pulsación para parada actual */}
                {isCurrent && (
                  <circle
                    cx="0"
                    cy="0"
                    r="18"
                    fill="#EA580C"
                    opacity="0.3"
                    className="animate-ping"
                  />
                )}

                {/* Pin Badge circular */}
                <circle
                  cx="0"
                  cy="0"
                  r={isCurrent ? '13' : '10'}
                  fill={isCurrent ? '#EA580C' : '#1C1917'}
                  stroke={isCurrent ? '#FDBA74' : '#F59E0B'}
                  strokeWidth="2"
                  filter="url(#mna-room-shadow)"
                  className="transition-all duration-150 group-hover:scale-125"
                />

                {/* Número de parada */}
                <text
                  x="0"
                  y={isCurrent ? '4' : '3.5'}
                  textAnchor="middle"
                  className={`${
                    isCurrent ? 'text-[11px]' : 'text-[9.5px]'
                  } font-black pointer-events-none`}
                  fill="#FFFFFF"
                >
                  {pt.index + 1}
                </text>
              </g>
            );
          })}
        </g>

        {/* ================= ROSA DE LOS VIENTOS / ORIENTACIÓN ================= */}
        <g id="rosa-de-los-vientos" transform="translate(945, 65)">
          <circle
            cx="0"
            cy="0"
            r="18"
            fill={isSunMode ? '#FFFFFF' : '#1C1917'}
            stroke={themeColors.roomDefaultBorder}
            strokeWidth="1"
          />
          <path d="M 0 -13 L 4 -2 L 0 0 L -4 -2 Z" fill="#EA580C" />
          <path d="M 0 13 L 4 2 L 0 0 L -4 2 Z" fill={themeColors.servicesText} />
          <text
            x="0"
            y="-16"
            textAnchor="middle"
            className="text-[8.5px] font-black"
            fill="#EA580C"
          >
            N
          </text>
        </g>

        {/* ================= LEYENDA ARQUITECTÓNICA INFERIOR ================= */}
        <g id="leyenda-mapa" transform="translate(30, 770)" opacity="0.9">
          <text
            x="0"
            y="0"
            className="text-[9.5px] font-bold"
            fill={themeColors.roomTextSecondary}
          >
            🏛️ Planta Baja: Salas 1-5 (Ala Norte) · Sala 6 Mexica (Fondo) · Salas 7-11 (Ala Sur)
          </text>
        </g>
      </svg>
    </div>
  );
};
