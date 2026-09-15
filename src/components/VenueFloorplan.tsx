import React from 'react';
import { useTheme } from '../utils/ThemeContext';
import { RouteStop, Room } from '../types';

interface VenueFloorplanProps {
  siteId: string;
  rooms?: Room[];
  selectedRoomId?: string | null;
  onSelectRoom?: (roomId: string) => void;
  stops?: RouteStop[];
  currentStopIndex?: number;
  onSelectStop?: (stopIndex: number) => void;
}

export const VenueFloorplan: React.FC<VenueFloorplanProps> = ({
  siteId,
  rooms = [],
  selectedRoomId,
  onSelectRoom,
  stops = [],
  currentStopIndex = 0,
  onSelectStop,
}) => {
  const { isSunMode } = useTheme();

  // Architectural blueprint palette
  const theme = isSunMode
    ? {
        bg: '#F6F2EA',
        grid: '#E6DED1',
        wallFill: '#EDE5D8',
        wallStroke: '#292524',
        roomDefault: '#F9F6F0',
        roomStroke: '#78716C',
        roomHover: '#FEF9C3',
        selectedFill: '#FEF3C7',
        selectedStroke: '#B45309',
        selectedGlow: 'rgba(180, 83, 9, 0.4)',
        courtyard: '#FAF7F2',
        courtyardStroke: '#A8A29E',
        textMain: '#1C1917',
        textMuted: '#57534E',
        accent: '#92400E',
        accentLight: '#F59E0B',
        water: '#38BDF8',
        waterBorder: '#0284C7',
        pathStroke: '#B45309',
        pinBg: '#D97706',
        pinText: '#FFFFFF',
        activePinBg: '#B45309',
      }
    : {
        bg: '#0D0F14',
        grid: '#181E29',
        wallFill: '#141822',
        wallStroke: '#38BDF8',
        roomDefault: '#161B26',
        roomStroke: '#334155',
        roomHover: '#1E293B',
        selectedFill: '#2E1F0A',
        selectedStroke: '#F59E0B',
        selectedGlow: 'rgba(245, 158, 11, 0.55)',
        courtyard: '#10131A',
        courtyardStroke: '#1E293B',
        textMain: '#F8FAFC',
        textMuted: '#94A3B8',
        accent: '#F59E0B',
        accentLight: '#FDE68A',
        water: '#0284C7',
        waterBorder: '#38BDF8',
        pathStroke: '#F59E0B',
        pinBg: '#F59E0B',
        pinText: '#0F172A',
        activePinBg: '#FBBF24',
      };

  // Helper to count pieces in a given room
  const getRoomPieceCount = (roomId: string): number => {
    const room = rooms.find((r) => r.id === roomId);
    return room?.pieces_info?.length || 0;
  };

  // Coordenadas fijas de salas para el plano arquitectónico del MNA (viewBox 800 x 600)
  const MNA_ROOM_CENTERS: Record<string, { x: number; y: number }> = {
    // Ala derecha (recorrido cronológico)
    'sala-1': { x: 645, y: 417 },
    'sala-introduccion_antropologia': { x: 645, y: 417 },
    'sala-2': { x: 645, y: 357 },
    'sala-poblamiento': { x: 645, y: 357 },
    'sala-3': { x: 645, y: 297 },
    'sala-preclasico': { x: 645, y: 297 },
    'sala-4': { x: 645, y: 237 },
    'sala-teotihuacan': { x: 645, y: 237 },
    'sala-5': { x: 645, y: 177 },
    'sala-tolteca': { x: 645, y: 177 },

    // Cabecera monumental (Norte)
    'sala-6': { x: 400, y: 85 },
    'sala-mexica': { x: 400, y: 85 },

    // Ala izquierda (recorrido geográfico)
    'sala-7': { x: 155, y: 177 },
    'sala-oaxaca': { x: 155, y: 177 },
    'sala-8': { x: 155, y: 237 },
    'sala-costa_del_golfo': { x: 155, y: 237 },
    'sala-9': { x: 155, y: 297 },
    'sala-maya': { x: 155, y: 297 },
    'sala-10': { x: 155, y: 357 },
    'sala-occidente': { x: 155, y: 357 },
    'sala-11': { x: 155, y: 417 },
    'sala-norte': { x: 155, y: 417 },

    // Espacios comunes
    'patio-central': { x: 400, y: 245 },
    'vestibulo': { x: 400, y: 512 },
  };

  // Helper para resolver coordenadas SVG reales (cx, cy) para una parada o pieza
  const getStopSvgCoords = (stop: RouteStop): { x: number; y: number } => {
    // Si es el MNA, intentar ubicar por la sala correspondiente
    if (siteId === 'MNA') {
      const roomIdKey = stop.room_id ? stop.room_id.toLowerCase().trim() : '';
      if (roomIdKey && MNA_ROOM_CENTERS[roomIdKey]) {
        return MNA_ROOM_CENTERS[roomIdKey];
      }

      // Si room_zone tiene texto como "Mexica" o "Maya", resolver
      const zone = (stop.room_zone || '').toLowerCase();
      if (zone.includes('mexica')) return MNA_ROOM_CENTERS['sala-mexica'];
      if (zone.includes('maya')) return MNA_ROOM_CENTERS['sala-maya'];
      if (zone.includes('teotihuac')) return MNA_ROOM_CENTERS['sala-teotihuacan'];
      if (zone.includes('tolteca')) return MNA_ROOM_CENTERS['sala-tolteca'];
      if (zone.includes('oaxaca')) return MNA_ROOM_CENTERS['sala-oaxaca'];
      if (zone.includes('golfo') || zone.includes('costa')) return MNA_ROOM_CENTERS['sala-costa_del_golfo'];
      if (zone.includes('occidente')) return MNA_ROOM_CENTERS['sala-occidente'];
      if (zone.includes('norte')) return MNA_ROOM_CENTERS['sala-norte'];
      if (zone.includes('precl')) return MNA_ROOM_CENTERS['sala-preclasico'];
      if (zone.includes('pobla')) return MNA_ROOM_CENTERS['sala-poblamiento'];
      if (zone.includes('intro') || zone.includes('antrop')) return MNA_ROOM_CENTERS['sala-introduccion_antropologia'];
    }

    // Coordenadas directas (0 a 100 escaladas al viewBox 800 x 600)
    const coords = stop.map_coords || (stop as any).map || { x: 50, y: 50 };
    return {
      x: (coords.x ?? 50) * 8,
      y: (coords.y ?? 50) * 6,
    };
  };

  // Helper to render dynamic route connecting polyline
  const renderRouteTrail = () => {
    if (!stops || stops.length < 2) return null;
    const pointsStr = stops
      .map((s) => {
        const pt = getStopSvgCoords(s);
        return `${pt.x},${pt.y}`;
      })
      .join(' ');

    return (
      <g className="route-trail pointer-events-none">
        {/* Glow underlay */}
        <polyline
          points={pointsStr}
          fill="none"
          stroke={theme.pathStroke}
          strokeWidth="6"
          strokeOpacity="0.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Main dashed path */}
        <polyline
          points={pointsStr}
          fill="none"
          stroke={theme.pathStroke}
          strokeWidth="2.5"
          strokeDasharray="6 4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    );
  };

  // Helper to render dynamic numbered pins
  const renderPins = () => {
    if (!stops) return null;
    return stops.map((stop, idx) => {
      const pt = getStopSvgCoords(stop);
      const cx = pt.x;
      const cy = pt.y;
      const isActive = idx === currentStopIndex;

      return (
        <g
          key={`pin-${stop.poi_id}-${idx}`}
          className="cursor-pointer group"
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectStop) onSelectStop(idx);
            if (stop.room_id && onSelectRoom) onSelectRoom(stop.room_id);
          }}
        >
          {/* Active stop pulse wave */}
          {isActive && (
            <circle
              cx={cx}
              cy={cy}
              r="22"
              fill={theme.accentLight}
              fillOpacity="0.25"
              className="animate-ping origin-center"
            />
          )}

          {/* Pin Shadow */}
          <ellipse
            cx={cx}
            cy={cy + 13}
            rx="9"
            ry="4"
            fill="#000000"
            fillOpacity="0.35"
          />

          {/* Pin Body */}
          <circle
            cx={cx}
            cy={cy}
            r={isActive ? '14' : '11'}
            fill={isActive ? theme.activePinBg : theme.pinBg}
            stroke={isActive ? '#FFFFFF' : theme.wallStroke}
            strokeWidth={isActive ? '2.5' : '1.5'}
            className="transition-all duration-200 group-hover:scale-110 shadow-lg"
          />

          {/* Stop Number */}
          <text
            x={cx}
            y={cy + 4}
            fill={theme.pinText}
            fontSize={isActive ? '12' : '10'}
            fontWeight="900"
            textAnchor="middle"
            className="select-none pointer-events-none"
          >
            {idx + 1}
          </text>
        </g>
      );
    });
  };

  return (
    <svg
      viewBox="0 0 800 600"
      className="w-full h-full select-none"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Architectural Blueprint Grid Pattern */}
        <pattern id="arch-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="40" y2="0" stroke={theme.grid} strokeWidth="0.75" />
          <line x1="0" y1="0" x2="0" y2="40" stroke={theme.grid} strokeWidth="0.75" />
        </pattern>

        {/* Selected Room Glow Filter */}
        <filter id="room-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={theme.selectedStroke} floodOpacity="0.8" />
        </filter>
      </defs>

      {/* Canvas Base */}
      <rect width="800" height="600" fill={theme.bg} rx="16" />
      <rect width="800" height="600" fill="url(#arch-grid)" />

      {/* ============================================================ */}
      {/* 1. PLANO ARQUITECTÓNICO: MUSEO NACIONAL DE ANTROPOLOGÍA (MNA) */}
      {/* ============================================================ */}
      {siteId === 'MNA' && (
        <g id="mna-floorplan">
          {/* Main Museum Outer Perimeter Wall in classic U-shape */}
          <rect
            x="70"
            y="25"
            width="660"
            height="550"
            rx="14"
            fill={theme.wallFill}
            stroke={theme.wallStroke}
            strokeWidth="3"
          />

          {/* Gran Patio Central (Courtyard surrounded by the U-shaped wings) */}
          <rect
            x="240"
            y="170"
            width="320"
            height="275"
            rx="8"
            fill={theme.courtyard}
            stroke={theme.courtyardStroke}
            strokeWidth="1.5"
            onClick={() => onSelectRoom && onSelectRoom('patio-central')}
            className="cursor-pointer"
          />

          {/* Estanque Lirios y Espejo de Agua en el Patio Central */}
          <g
            id="estanque-central"
            onClick={() => onSelectRoom && onSelectRoom('patio-central')}
            className="cursor-pointer"
          >
            <rect
              x="260"
              y="320"
              width="280"
              height="105"
              rx="6"
              fill={theme.water}
              fillOpacity="0.22"
              stroke={theme.waterBorder}
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            <text
              x="400"
              y="380"
              fill={theme.waterBorder}
              fontSize="9"
              fontWeight="700"
              textAnchor="middle"
              className="pointer-events-none tracking-wider"
            >
              ESTANQUE Y ESPEJO DE AGUA
            </text>
          </g>

          {/* El Paraguas (Monumental Bronze Column & Waterfall by Pedro Ramírez Vázquez) */}
          <g
            id="patio-central"
            onClick={() => onSelectRoom && onSelectRoom('patio-central')}
            className="cursor-pointer group"
          >
            {/* Outer water fountain ripple */}
            <circle
              cx="400"
              cy="245"
              r="46"
              fill={theme.water}
              fillOpacity="0.3"
              stroke={theme.waterBorder}
              strokeWidth="1.5"
              strokeDasharray="5 3"
            />
            {/* Column umbrella canopy ring */}
            <circle
              cx="400"
              cy="245"
              r="24"
              fill={theme.accent}
              fillOpacity="0.3"
              stroke={theme.accent}
              strokeWidth="1.5"
            />
            {/* Monumental bronze central column */}
            <circle cx="400" cy="245" r="8" fill={theme.accentLight} />
            <text
              x="400"
              y="266"
              fill={theme.textMain}
              fontSize="10"
              fontWeight="900"
              textAnchor="middle"
              className="pointer-events-none tracking-wide"
            >
              EL PARAGUAS
            </text>
            <text
              x="400"
              y="278"
              fill={theme.textMuted}
              fontSize="8"
              fontWeight="600"
              textAnchor="middle"
              className="pointer-events-none"
            >
              Columna y Fuente Monumental
            </text>
          </g>

          {/* ============================================================ */}
          {/* ALA DERECHA (ESTE): RECORRIDO CRONOLÓGICO (SALAS 1 A 5)       */}
          {/* ============================================================ */}

          {/* SALA 1: Introducción a la Antropología */}
          <g
            id="sala-1"
            onClick={() => onSelectRoom && onSelectRoom('sala-1')}
            className="cursor-pointer group"
          >
            <rect
              x="570"
              y="390"
              width="150"
              height="55"
              rx="5"
              fill={selectedRoomId === 'sala-1' ? theme.selectedFill : theme.roomDefault}
              stroke={selectedRoomId === 'sala-1' ? theme.selectedStroke : theme.roomStroke}
              strokeWidth={selectedRoomId === 'sala-1' ? '3' : '1.5'}
              filter={selectedRoomId === 'sala-1' ? 'url(#room-glow)' : undefined}
              className="transition-all duration-200"
            />
            <text
              x="645"
              y="412"
              fill={selectedRoomId === 'sala-1' ? theme.selectedStroke : theme.textMain}
              fontSize="10"
              fontWeight="800"
              textAnchor="middle"
            >
              SALA 1: INTRODUCCIÓN
            </text>
            <text
              x="645"
              y="426"
              fill={theme.textMuted}
              fontSize="8"
              fontWeight="600"
              textAnchor="middle"
            >
              Antropología {getRoomPieceCount('sala-1') > 0 ? `• (${getRoomPieceCount('sala-1')} piezas)` : ''}
            </text>
          </g>

          {/* SALA 2: Poblamiento de América */}
          <g
            id="sala-2"
            onClick={() => onSelectRoom && onSelectRoom('sala-2')}
            className="cursor-pointer group"
          >
            <rect
              x="570"
              y="330"
              width="150"
              height="55"
              rx="5"
              fill={selectedRoomId === 'sala-2' ? theme.selectedFill : theme.roomDefault}
              stroke={selectedRoomId === 'sala-2' ? theme.selectedStroke : theme.roomStroke}
              strokeWidth={selectedRoomId === 'sala-2' ? '3' : '1.5'}
              filter={selectedRoomId === 'sala-2' ? 'url(#room-glow)' : undefined}
              className="transition-all duration-200"
            />
            <text
              x="645"
              y="352"
              fill={selectedRoomId === 'sala-2' ? theme.selectedStroke : theme.textMain}
              fontSize="10"
              fontWeight="800"
              textAnchor="middle"
            >
              SALA 2: POBLAMIENTO
            </text>
            <text
              x="645"
              y="366"
              fill={theme.textMuted}
              fontSize="8"
              fontWeight="600"
              textAnchor="middle"
            >
              América {getRoomPieceCount('sala-2') > 0 ? `• (${getRoomPieceCount('sala-2')} piezas)` : ''}
            </text>
          </g>

          {/* SALA 3: Preclásico en el Altiplano Central */}
          <g
            id="sala-3"
            onClick={() => onSelectRoom && onSelectRoom('sala-3')}
            className="cursor-pointer group"
          >
            <rect
              x="570"
              y="270"
              width="150"
              height="55"
              rx="5"
              fill={selectedRoomId === 'sala-3' ? theme.selectedFill : theme.roomDefault}
              stroke={selectedRoomId === 'sala-3' ? theme.selectedStroke : theme.roomStroke}
              strokeWidth={selectedRoomId === 'sala-3' ? '3' : '1.5'}
              filter={selectedRoomId === 'sala-3' ? 'url(#room-glow)' : undefined}
              className="transition-all duration-200"
            />
            <text
              x="645"
              y="292"
              fill={selectedRoomId === 'sala-3' ? theme.selectedStroke : theme.textMain}
              fontSize="10"
              fontWeight="800"
              textAnchor="middle"
            >
              SALA 3: PRECLÁSICO
            </text>
            <text
              x="645"
              y="306"
              fill={theme.textMuted}
              fontSize="8"
              fontWeight="600"
              textAnchor="middle"
            >
              Altiplano Central {getRoomPieceCount('sala-3') > 0 ? `• (${getRoomPieceCount('sala-3')} piezas)` : ''}
            </text>
          </g>

          {/* SALA 4: Teotihuacán */}
          <g
            id="sala-4"
            onClick={() => onSelectRoom && onSelectRoom('sala-4')}
            className="cursor-pointer group"
          >
            <rect
              x="570"
              y="210"
              width="150"
              height="55"
              rx="5"
              fill={selectedRoomId === 'sala-4' ? theme.selectedFill : theme.roomDefault}
              stroke={selectedRoomId === 'sala-4' ? theme.selectedStroke : theme.roomStroke}
              strokeWidth={selectedRoomId === 'sala-4' ? '3' : '1.5'}
              filter={selectedRoomId === 'sala-4' ? 'url(#room-glow)' : undefined}
              className="transition-all duration-200"
            />
            <text
              x="645"
              y="232"
              fill={selectedRoomId === 'sala-4' ? theme.selectedStroke : theme.textMain}
              fontSize="10"
              fontWeight="800"
              textAnchor="middle"
            >
              SALA 4: TEOTIHUACÁN
            </text>
            <text
              x="645"
              y="246"
              fill={theme.textMuted}
              fontSize="8"
              fontWeight="600"
              textAnchor="middle"
            >
              Chalchiuhtlicue {getRoomPieceCount('sala-4') > 0 ? `• (${getRoomPieceCount('sala-4')} piezas)` : ''}
            </text>
          </g>

          {/* SALA 5: Los Toltecas y el Epiclásico */}
          <g
            id="sala-5"
            onClick={() => onSelectRoom && onSelectRoom('sala-5')}
            className="cursor-pointer group"
          >
            <rect
              x="570"
              y="150"
              width="150"
              height="55"
              rx="5"
              fill={selectedRoomId === 'sala-5' ? theme.selectedFill : theme.roomDefault}
              stroke={selectedRoomId === 'sala-5' ? theme.selectedStroke : theme.roomStroke}
              strokeWidth={selectedRoomId === 'sala-5' ? '3' : '1.5'}
              filter={selectedRoomId === 'sala-5' ? 'url(#room-glow)' : undefined}
              className="transition-all duration-200"
            />
            <text
              x="645"
              y="172"
              fill={selectedRoomId === 'sala-5' ? theme.selectedStroke : theme.textMain}
              fontSize="10"
              fontWeight="800"
              textAnchor="middle"
            >
              SALA 5: TOLTECAS
            </text>
            <text
              x="645"
              y="186"
              fill={theme.textMuted}
              fontSize="8"
              fontWeight="600"
              textAnchor="middle"
            >
              Tula & Epiclásico {getRoomPieceCount('sala-5') > 0 ? `• (${getRoomPieceCount('sala-5')} piezas)` : ''}
            </text>
          </g>

          {/* ============================================================ */}
          {/* CABECERA MONUMENTAL (NORTE): SALA 6 MEXICA                  */}
          {/* ============================================================ */}
          <g
            id="sala-6"
            onClick={() => onSelectRoom && onSelectRoom('sala-6')}
            className="cursor-pointer group"
          >
            <path
              d="M80,35 L720,35 L720,140 L80,140 Z"
              fill={selectedRoomId === 'sala-6' ? theme.selectedFill : theme.roomDefault}
              stroke={selectedRoomId === 'sala-6' ? theme.selectedStroke : theme.roomStroke}
              strokeWidth={selectedRoomId === 'sala-6' ? '3.5' : '2'}
              filter={selectedRoomId === 'sala-6' ? 'url(#room-glow)' : undefined}
              className="transition-all duration-200"
            />
            {/* Altar central para la Piedra del Sol */}
            <circle
              cx="400"
              cy="85"
              r="25"
              fill={theme.accent}
              fillOpacity="0.25"
              stroke={theme.accent}
              strokeWidth="1.5"
              strokeDasharray="3 2"
            />
            <text
              x="400"
              y="62"
              fill={selectedRoomId === 'sala-6' ? theme.selectedStroke : theme.textMain}
              fontSize="14"
              fontWeight="900"
              textAnchor="middle"
              letterSpacing="1.5"
            >
              SALA 6: MEXICA
            </text>
            <text
              x="400"
              y="89"
              fill={theme.accentLight}
              fontSize="9"
              fontWeight="800"
              textAnchor="middle"
            >
              Piedra del Sol
            </text>
            <text
              x="400"
              y="120"
              fill={theme.textMuted}
              fontSize="9"
              fontWeight="600"
              textAnchor="middle"
            >
              Coatlicue • Coyolxauhqui • Monolito de Tlaltecuhtli {getRoomPieceCount('sala-6') > 0 ? `• (${getRoomPieceCount('sala-6')} piezas)` : ''}
            </text>
          </g>

          {/* ============================================================ */}
          {/* ALA IZQUIERDA (OESTE): RECORRIDO GEOGRÁFICO (SALAS 7 A 11)   */}
          {/* ============================================================ */}

          {/* SALA 7: Culturas de Oaxaca */}
          <g
            id="sala-7"
            onClick={() => onSelectRoom && onSelectRoom('sala-7')}
            className="cursor-pointer group"
          >
            <rect
              x="80"
              y="150"
              width="150"
              height="55"
              rx="5"
              fill={selectedRoomId === 'sala-7' ? theme.selectedFill : theme.roomDefault}
              stroke={selectedRoomId === 'sala-7' ? theme.selectedStroke : theme.roomStroke}
              strokeWidth={selectedRoomId === 'sala-7' ? '3' : '1.5'}
              filter={selectedRoomId === 'sala-7' ? 'url(#room-glow)' : undefined}
              className="transition-all duration-200"
            />
            <text
              x="155"
              y="172"
              fill={selectedRoomId === 'sala-7' ? theme.selectedStroke : theme.textMain}
              fontSize="10"
              fontWeight="800"
              textAnchor="middle"
            >
              SALA 7: OAXACA
            </text>
            <text
              x="155"
              y="186"
              fill={theme.textMuted}
              fontSize="8"
              fontWeight="600"
              textAnchor="middle"
            >
              Monte Albán {getRoomPieceCount('sala-7') > 0 ? `• (${getRoomPieceCount('sala-7')} piezas)` : ''}
            </text>
          </g>

          {/* SALA 8: Culturas de la Costa del Golfo */}
          <g
            id="sala-8"
            onClick={() => onSelectRoom && onSelectRoom('sala-8')}
            className="cursor-pointer group"
          >
            <rect
              x="80"
              y="210"
              width="150"
              height="55"
              rx="5"
              fill={selectedRoomId === 'sala-8' ? theme.selectedFill : theme.roomDefault}
              stroke={selectedRoomId === 'sala-8' ? theme.selectedStroke : theme.roomStroke}
              strokeWidth={selectedRoomId === 'sala-8' ? '3' : '1.5'}
              filter={selectedRoomId === 'sala-8' ? 'url(#room-glow)' : undefined}
              className="transition-all duration-200"
            />
            <text
              x="155"
              y="232"
              fill={selectedRoomId === 'sala-8' ? theme.selectedStroke : theme.textMain}
              fontSize="10"
              fontWeight="800"
              textAnchor="middle"
            >
              SALA 8: COSTA DEL GOLFO
            </text>
            <text
              x="155"
              y="246"
              fill={theme.textMuted}
              fontSize="8"
              fontWeight="600"
              textAnchor="middle"
            >
              Olmecas & Huastecos {getRoomPieceCount('sala-8') > 0 ? `• (${getRoomPieceCount('sala-8')} piezas)` : ''}
            </text>
          </g>

          {/* SALA 9: Maya */}
          <g
            id="sala-9"
            onClick={() => onSelectRoom && onSelectRoom('sala-9')}
            className="cursor-pointer group"
          >
            <rect
              x="80"
              y="270"
              width="150"
              height="55"
              rx="5"
              fill={selectedRoomId === 'sala-9' ? theme.selectedFill : theme.roomDefault}
              stroke={selectedRoomId === 'sala-9' ? theme.selectedStroke : theme.roomStroke}
              strokeWidth={selectedRoomId === 'sala-9' ? '3' : '1.5'}
              filter={selectedRoomId === 'sala-9' ? 'url(#room-glow)' : undefined}
              className="transition-all duration-200"
            />
            <text
              x="155"
              y="292"
              fill={selectedRoomId === 'sala-9' ? theme.selectedStroke : theme.textMain}
              fontSize="10"
              fontWeight="800"
              textAnchor="middle"
            >
              SALA 9: MAYA
            </text>
            <text
              x="155"
              y="306"
              fill={theme.textMuted}
              fontSize="8"
              fontWeight="600"
              textAnchor="middle"
            >
              Pakal & Calakmul {getRoomPieceCount('sala-9') > 0 ? `• (${getRoomPieceCount('sala-9')} piezas)` : ''}
            </text>
          </g>

          {/* SALA 10: Culturas del Occidente */}
          <g
            id="sala-10"
            onClick={() => onSelectRoom && onSelectRoom('sala-10')}
            className="cursor-pointer group"
          >
            <rect
              x="80"
              y="330"
              width="150"
              height="55"
              rx="5"
              fill={selectedRoomId === 'sala-10' ? theme.selectedFill : theme.roomDefault}
              stroke={selectedRoomId === 'sala-10' ? theme.selectedStroke : theme.roomStroke}
              strokeWidth={selectedRoomId === 'sala-10' ? '3' : '1.5'}
              filter={selectedRoomId === 'sala-10' ? 'url(#room-glow)' : undefined}
              className="transition-all duration-200"
            />
            <text
              x="155"
              y="352"
              fill={selectedRoomId === 'sala-10' ? theme.selectedStroke : theme.textMain}
              fontSize="10"
              fontWeight="800"
              textAnchor="middle"
            >
              SALA 10: OCCIDENTE
            </text>
            <text
              x="155"
              y="366"
              fill={theme.textMuted}
              fontSize="8"
              fontWeight="600"
              textAnchor="middle"
            >
              Tumbas de tiro {getRoomPieceCount('sala-10') > 0 ? `• (${getRoomPieceCount('sala-10')} piezas)` : ''}
            </text>
          </g>

          {/* SALA 11: Culturas del Norte */}
          <g
            id="sala-11"
            onClick={() => onSelectRoom && onSelectRoom('sala-11')}
            className="cursor-pointer group"
          >
            <rect
              x="80"
              y="390"
              width="150"
              height="55"
              rx="5"
              fill={selectedRoomId === 'sala-11' ? theme.selectedFill : theme.roomDefault}
              stroke={selectedRoomId === 'sala-11' ? theme.selectedStroke : theme.roomStroke}
              strokeWidth={selectedRoomId === 'sala-11' ? '3' : '1.5'}
              filter={selectedRoomId === 'sala-11' ? 'url(#room-glow)' : undefined}
              className="transition-all duration-200"
            />
            <text
              x="155"
              y="412"
              fill={selectedRoomId === 'sala-11' ? theme.selectedStroke : theme.textMain}
              fontSize="10"
              fontWeight="800"
              textAnchor="middle"
            >
              SALA 11: NORTE
            </text>
            <text
              x="155"
              y="426"
              fill={theme.textMuted}
              fontSize="8"
              fontWeight="600"
              textAnchor="middle"
            >
              Paquimé {getRoomPieceCount('sala-11') > 0 ? `• (${getRoomPieceCount('sala-11')} piezas)` : ''}
            </text>
          </g>

          {/* ============================================================ */}
          {/* CENTRO INFERIOR (SUR): ACCESO GENERAL Y VESTÍBULO            */}
          {/* ============================================================ */}
          <g id="vestibulo-acceso">
            <rect
              x="240"
              y="460"
              width="320"
              height="105"
              rx="8"
              fill={theme.roomDefault}
              stroke={theme.roomStroke}
              strokeWidth="2"
            />
            <text
              x="400"
              y="500"
              fill={theme.textMain}
              fontSize="13"
              fontWeight="900"
              textAnchor="middle"
              letterSpacing="1"
            >
              ACCESO GENERAL Y VESTÍBULO
            </text>
            <text
              x="400"
              y="522"
              fill={theme.textMuted}
              fontSize="9"
              fontWeight="600"
              textAnchor="middle"
            >
              Taquillas • Entrada Principal • Tienda • Salida
            </text>
            <text
              x="400"
              y="538"
              fill={theme.accentLight}
              fontSize="8"
              fontWeight="700"
              textAnchor="middle"
            >
              Mural Rufino Tamayo: El Día y la Noche
            </text>
          </g>
        </g>
      )}

      {/* ============================================================ */}
      {/* 2. PLANO ARQUITECTÓNICO: ZONA ARQUEOLÓGICA DE TEOTIHUACÁN    */}
      {/* ============================================================ */}
      {siteId === 'TEOTIHUACAN' && (
        <g id="teotihuacan-floorplan">
          {/* Calzada de los Muertos (Central Grand Avenue) */}
          <g
            id="calzada-muertos"
            onClick={() => onSelectRoom && onSelectRoom('calzada-muertos')}
            className="cursor-pointer group"
          >
            <rect
              x="365"
              y="40"
              width="70"
              height="520"
              rx="4"
              fill={selectedRoomId === 'calzada-muertos' ? theme.selectedFill : theme.courtyard}
              stroke={selectedRoomId === 'calzada-muertos' ? theme.selectedStroke : theme.courtyardStroke}
              strokeWidth={selectedRoomId === 'calzada-muertos' ? '3' : '1.5'}
              filter={selectedRoomId === 'calzada-muertos' ? 'url(#room-glow)' : undefined}
            />
            <text
              x="400"
              y="300"
              fill={theme.textMuted}
              fontSize="10"
              fontWeight="800"
              letterSpacing="2"
              textAnchor="middle"
              transform="rotate(-90 400 300)"
            >
              CALZADA DE LOS MUERTOS (4 KM)
            </text>
          </g>

          {/* Río San Juan Canal crossing */}
          <line
            x1="220"
            y1="420"
            x2="580"
            y2="420"
            stroke={theme.water}
            strokeWidth="8"
            strokeOpacity="0.6"
            strokeLinecap="round"
          />
          <text x="310" y="414" fill={theme.water} fontSize="8" fontWeight="700">
            Río San Juan (Canalizado)
          </text>

          {/* PIRÁMIDE DE LA LUNA & PLAZA (North Axis) */}
          <g
            id="piramide-luna"
            onClick={() => onSelectRoom && onSelectRoom('piramide-luna')}
            className="cursor-pointer group"
          >
            {/* Plaza de la Luna outline */}
            <rect
              x="300"
              y="45"
              width="200"
              height="105"
              rx="6"
              fill={selectedRoomId === 'piramide-luna' ? theme.selectedFill : theme.roomDefault}
              stroke={selectedRoomId === 'piramide-luna' ? theme.selectedStroke : theme.roomStroke}
              strokeWidth={selectedRoomId === 'piramide-luna' ? '3.5' : '1.5'}
              filter={selectedRoomId === 'piramide-luna' ? 'url(#room-glow)' : undefined}
              className="transition-all"
            />
            {/* Pyramid Base Stepped Shape */}
            <rect
              x="345"
              y="55"
              width="110"
              height="55"
              rx="4"
              fill={theme.accent}
              fillOpacity="0.25"
              stroke={theme.accent}
              strokeWidth="1.5"
            />
            <text
              x="400"
              y="85"
              fill={selectedRoomId === 'piramide-luna' ? theme.selectedStroke : theme.textMain}
              fontSize="12"
              fontWeight="900"
              textAnchor="middle"
            >
              PIRÁMIDE DE LA LUNA
            </text>
            <text
              x="400"
              y="125"
              fill={theme.textMuted}
              fontSize="8"
              fontWeight="700"
              textAnchor="middle"
            >
              Plaza Ceremonial • La Gran Diosa
            </text>
          </g>

          {/* PALACIO DE QUETZALPAPÁLOTL (Northwest of Plaza) */}
          <g
            id="palacio-quetzalpapalotl"
            onClick={() => onSelectRoom && onSelectRoom('palacio-quetzalpapalotl')}
            className="cursor-pointer group"
          >
            <rect
              x="200"
              y="90"
              width="90"
              height="85"
              rx="6"
              fill={selectedRoomId === 'palacio-quetzalpapalotl' ? theme.selectedFill : theme.roomDefault}
              stroke={selectedRoomId === 'palacio-quetzalpapalotl' ? theme.selectedStroke : theme.roomStroke}
              strokeWidth={selectedRoomId === 'palacio-quetzalpapalotl' ? '3.5' : '1.5'}
              filter={selectedRoomId === 'palacio-quetzalpapalotl' ? 'url(#room-glow)' : undefined}
              className="transition-all"
            />
            <text
              x="245"
              y="125"
              fill={selectedRoomId === 'palacio-quetzalpapalotl' ? theme.selectedStroke : theme.textMain}
              fontSize="10"
              fontWeight="900"
              textAnchor="middle"
            >
              QUETZALPAPÁLOTL
            </text>
            <text
              x="245"
              y="142"
              fill={theme.textMuted}
              fontSize="7"
              fontWeight="700"
              textAnchor="middle"
            >
              Palacio Sacerdotal
            </text>
          </g>

          {/* PIRÁMIDE DEL SOL (East Axis - Monumental Base) */}
          <g
            id="piramide-sol"
            onClick={() => onSelectRoom && onSelectRoom('piramide-sol')}
            className="cursor-pointer group"
          >
            <rect
              x="455"
              y="195"
              width="180"
              height="140"
              rx="8"
              fill={selectedRoomId === 'piramide-sol' ? theme.selectedFill : theme.roomDefault}
              stroke={selectedRoomId === 'piramide-sol' ? theme.selectedStroke : theme.roomStroke}
              strokeWidth={selectedRoomId === 'piramide-sol' ? '3.5' : '1.5'}
              filter={selectedRoomId === 'piramide-sol' ? 'url(#room-glow)' : undefined}
              className="transition-all"
            />
            {/* Inner concentric stepped terraces */}
            <rect
              x="480"
              y="215"
              width="130"
              height="100"
              rx="4"
              fill={theme.accent}
              fillOpacity="0.25"
              stroke={theme.accent}
              strokeWidth="1.5"
            />
            <rect
              x="510"
              y="235"
              width="70"
              height="60"
              rx="3"
              fill={theme.accentLight}
              fillOpacity="0.3"
              stroke={theme.accentLight}
              strokeWidth="1.5"
            />
            <text
              x="545"
              y="262"
              fill={selectedRoomId === 'piramide-sol' ? theme.selectedStroke : theme.textMain}
              fontSize="13"
              fontWeight="900"
              textAnchor="middle"
            >
              PIRÁMIDE DEL SOL
            </text>
            <text
              x="545"
              y="280"
              fill={theme.accentLight}
              fontSize="9"
              fontWeight="800"
              textAnchor="middle"
            >
              65 Metros • Axis Mundi
            </text>
          </g>

          {/* LA CIUDADELA & TEMPLO DE LA SERPIENTE EMPLUMADA (South Axis) */}
          <g
            id="la-ciudadela"
            onClick={() => onSelectRoom && onSelectRoom('la-ciudadela')}
            className="cursor-pointer group"
          >
            <rect
              x="300"
              y="445"
              width="200"
              height="120"
              rx="6"
              fill={selectedRoomId === 'la-ciudadela' ? theme.selectedFill : theme.roomDefault}
              stroke={selectedRoomId === 'la-ciudadela' ? theme.selectedStroke : theme.roomStroke}
              strokeWidth={selectedRoomId === 'la-ciudadela' ? '3.5' : '1.5'}
              filter={selectedRoomId === 'la-ciudadela' ? 'url(#room-glow)' : undefined}
              className="transition-all"
            />
            {/* Templo de Quetzalcóatl base */}
            <rect
              x="365"
              y="485"
              width="70"
              height="55"
              rx="4"
              fill={theme.accent}
              fillOpacity="0.3"
              stroke={theme.accent}
              strokeWidth="1.5"
            />
            <text
              x="400"
              y="472"
              fill={selectedRoomId === 'la-ciudadela' ? theme.selectedStroke : theme.textMain}
              fontSize="11"
              fontWeight="900"
              textAnchor="middle"
            >
              LA CIUDADELA
            </text>
            <text
              x="400"
              y="515"
              fill={theme.textMain}
              fontSize="9"
              fontWeight="800"
              textAnchor="middle"
            >
              Serpiente Emplumada
            </text>
          </g>
        </g>
      )}

      {/* ============================================================ */}
      {/* 3. PLANO ARQUITECTÓNICO: CASTILLO DE CHAPULTEPEC             */}
      {/* ============================================================ */}
      {siteId === 'CHAPULTEPEC' && (
        <g id="chapultepec-floorplan">
          {/* Cerro de Chapultepec & Fortress Perimeter Wall */}
          <polygon
            points="140,520 660,520 710,180 630,70 170,70 90,180"
            fill={theme.wallFill}
            stroke={theme.wallStroke}
            strokeWidth="3"
          />

          {/* Patio de Armas / Explanada Central */}
          <rect
            x="320"
            y="260"
            width="160"
            height="180"
            rx="6"
            fill={theme.courtyard}
            stroke={theme.courtyardStroke}
            strokeWidth="1.5"
          />
          <text
            x="400"
            y="355"
            fill={theme.textMuted}
            fontSize="9"
            fontWeight="800"
            textAnchor="middle"
          >
            PATIO DE ARMAS
          </text>

          {/* SALAS DEL CARRUAJE (Lower Ground Floor West) */}
          <g
            id="salas-carruaje"
            onClick={() => onSelectRoom && onSelectRoom('salas-carruaje')}
            className="cursor-pointer group"
          >
            <rect
              x="130"
              y="330"
              width="170"
              height="150"
              rx="6"
              fill={selectedRoomId === 'salas-carruaje' ? theme.selectedFill : theme.roomDefault}
              stroke={selectedRoomId === 'salas-carruaje' ? theme.selectedStroke : theme.roomStroke}
              strokeWidth={selectedRoomId === 'salas-carruaje' ? '3.5' : '1.5'}
              filter={selectedRoomId === 'salas-carruaje' ? 'url(#room-glow)' : undefined}
              className="transition-all"
            />
            <text
              x="215"
              y="395"
              fill={selectedRoomId === 'salas-carruaje' ? theme.selectedStroke : theme.textMain}
              fontSize="12"
              fontWeight="900"
              textAnchor="middle"
            >
              SALAS DEL CARRUAJE
            </text>
            <text
              x="215"
              y="418"
              fill={theme.textMuted}
              fontSize="9"
              fontWeight="600"
              textAnchor="middle"
            >
              Benito Juárez • Maximiliano
            </text>
          </g>

          {/* SALAS DE HISTORIA Y MURALISMO (Northwest Wing) */}
          <g
            id="salon-murales"
            onClick={() => onSelectRoom && onSelectRoom('salon-murales')}
            className="cursor-pointer group"
          >
            <rect
              x="150"
              y="150"
              width="170"
              height="150"
              rx="6"
              fill={selectedRoomId === 'salon-murales' ? theme.selectedFill : theme.roomDefault}
              stroke={selectedRoomId === 'salon-murales' ? theme.selectedStroke : theme.roomStroke}
              strokeWidth={selectedRoomId === 'salon-murales' ? '3.5' : '1.5'}
              filter={selectedRoomId === 'salon-murales' ? 'url(#room-glow)' : undefined}
              className="transition-all"
            />
            <text
              x="235"
              y="215"
              fill={selectedRoomId === 'salon-murales' ? theme.selectedStroke : theme.textMain}
              fontSize="11"
              fontWeight="900"
              textAnchor="middle"
            >
              SALAS DE MURALISMO
            </text>
            <text
              x="235"
              y="238"
              fill={theme.textMuted}
              fontSize="8"
              fontWeight="600"
              textAnchor="middle"
            >
              Siqueiros • O'Gorman • Orozco
            </text>
          </g>

          {/* TORRE DEL CABALLERO ALTO (North Axis Tower) */}
          <g
            id="torre-caballero-alto"
            onClick={() => onSelectRoom && onSelectRoom('torre-caballero-alto')}
            className="cursor-pointer group"
          >
            <circle
              cx="400"
              cy="120"
              r="34"
              fill={selectedRoomId === 'torre-caballero-alto' ? theme.selectedFill : theme.roomDefault}
              stroke={selectedRoomId === 'torre-caballero-alto' ? theme.selectedStroke : theme.roomStroke}
              strokeWidth={selectedRoomId === 'torre-caballero-alto' ? '3.5' : '1.5'}
              filter={selectedRoomId === 'torre-caballero-alto' ? 'url(#room-glow)' : undefined}
              className="transition-all"
            />
            <circle cx="400" cy="120" r="14" fill={theme.accent} fillOpacity="0.3" stroke={theme.accent} />
            <text
              x="400"
              y="172"
              fill={selectedRoomId === 'torre-caballero-alto' ? theme.selectedStroke : theme.textMain}
              fontSize="10"
              fontWeight="900"
              textAnchor="middle"
            >
              CABALLERO ALTO
            </text>
            <text
              x="400"
              y="186"
              fill={theme.textMuted}
              fontSize="8"
              fontWeight="600"
              textAnchor="middle"
            >
              Torreón y Mirador
            </text>
          </g>

          {/* JARDÍN DEL ALCÁZAR Y TERRAZA (Upper Garden) */}
          <g
            id="jardin-alcazar"
            onClick={() => onSelectRoom && onSelectRoom('jardin-alcazar')}
            className="cursor-pointer group"
          >
            <rect
              x="420"
              y="150"
              width="100"
              height="100"
              rx="6"
              fill={selectedRoomId === 'jardin-alcazar' ? theme.selectedFill : theme.courtyard}
              stroke={selectedRoomId === 'jardin-alcazar' ? theme.selectedStroke : theme.courtyardStroke}
              strokeWidth={selectedRoomId === 'jardin-alcazar' ? '3.5' : '1.5'}
              filter={selectedRoomId === 'jardin-alcazar' ? 'url(#room-glow)' : undefined}
              className="transition-all"
            />
            <circle
              cx="470"
              cy="200"
              r="18"
              fill={theme.water}
              fillOpacity="0.25"
              stroke={theme.waterBorder}
              strokeWidth="1.5"
            />
            <text
              x="470"
              y="175"
              fill={selectedRoomId === 'jardin-alcazar' ? theme.selectedStroke : theme.textMain}
              fontSize="9"
              fontWeight="900"
              textAnchor="middle"
            >
              JARDÍN ALCÁZAR
            </text>
          </g>

          {/* ALCÁZAR IMPERIAL (East Upper Wing - Rooms of Carlota & Maximiliano) */}
          <g
            id="alcazar-imperial"
            onClick={() => onSelectRoom && onSelectRoom('alcazar-imperial')}
            className="cursor-pointer group"
          >
            <rect
              x="530"
              y="150"
              width="140"
              height="260"
              rx="8"
              fill={selectedRoomId === 'alcazar-imperial' ? theme.selectedFill : theme.roomDefault}
              stroke={selectedRoomId === 'alcazar-imperial' ? theme.selectedStroke : theme.roomStroke}
              strokeWidth={selectedRoomId === 'alcazar-imperial' ? '3.5' : '1.5'}
              filter={selectedRoomId === 'alcazar-imperial' ? 'url(#room-glow)' : undefined}
              className="transition-all"
            />
            <text
              x="600"
              y="250"
              fill={selectedRoomId === 'alcazar-imperial' ? theme.selectedStroke : theme.textMain}
              fontSize="12"
              fontWeight="900"
              textAnchor="middle"
            >
              ALCÁZAR IMPERIAL
            </text>
            <text
              x="600"
              y="272"
              fill={theme.accentLight}
              fontSize="9"
              fontWeight="700"
              textAnchor="middle"
            >
              Habitación de Carlota
            </text>
            <text
              x="600"
              y="288"
              fill={theme.textMuted}
              fontSize="8"
              fontWeight="600"
              textAnchor="middle"
            >
              Salón de Acuerdos • Terrazas
            </text>
          </g>
        </g>
      )}

      {/* Dynamic Walking Route Trail Polyline */}
      {renderRouteTrail()}

      {/* Dynamic Numbered Route Pins */}
      {renderPins()}
    </svg>
  );
};
