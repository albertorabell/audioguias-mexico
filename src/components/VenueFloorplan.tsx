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

  // Helper to render dynamic route connecting polyline
  const renderRouteTrail = () => {
    if (!stops || stops.length < 2) return null;
    const pointsStr = stops
      .map((s) => {
        const coords = s.map_coords || { x: 50, y: 50 };
        return `${coords.x * 8},${coords.y * 6}`;
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
      const coords = stop.map_coords || { x: 50, y: 50 };
      const cx = coords.x * 8;
      const cy = coords.y * 6;
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
          {/* Main Museum Outer Perimeter Wall */}
          <rect
            x="90"
            y="30"
            width="620"
            height="540"
            rx="14"
            fill={theme.wallFill}
            stroke={theme.wallStroke}
            strokeWidth="3"
          />

          {/* Patio Central (Open Courtyard) */}
          <rect
            x="220"
            y="170"
            width="360"
            height="270"
            rx="8"
            fill={theme.courtyard}
            stroke={theme.courtyardStroke}
            strokeWidth="1.5"
            onClick={() => onSelectRoom && onSelectRoom('patio-central')}
            className="cursor-pointer"
          />

          {/* El Paraguas (Iconic Bronze Column & Fountain in Central Patio) */}
          <g
            id="patio-central"
            onClick={() => onSelectRoom && onSelectRoom('patio-central')}
            className="cursor-pointer group"
          >
            <circle
              cx="400"
              cy="305"
              r="48"
              fill={theme.water}
              fillOpacity="0.25"
              stroke={theme.waterBorder}
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            <circle
              cx="400"
              cy="305"
              r="24"
              fill={theme.accent}
              fillOpacity="0.3"
              stroke={theme.accent}
              strokeWidth="1.5"
            />
            <circle cx="400" cy="305" r="7" fill={theme.accentLight} />
            <text
              x="400"
              y="326"
              fill={theme.textMain}
              fontSize="10"
              fontWeight="800"
              textAnchor="middle"
              className="pointer-events-none tracking-wide"
            >
              EL PARAGUAS
            </text>
            <text
              x="400"
              y="338"
              fill={theme.textMuted}
              fontSize="8"
              fontWeight="600"
              textAnchor="middle"
              className="pointer-events-none"
            >
              Fuente Monumental
            </text>
          </g>

          {/* SALA MEXICA (North Monumental Wing - Focal Room) */}
          <g
            id="sala-mexica"
            onClick={() => onSelectRoom && onSelectRoom('sala-mexica')}
            className="cursor-pointer group"
          >
            <path
              d="M210,40 L590,40 L590,165 L210,165 Z"
              fill={selectedRoomId === 'sala-mexica' ? theme.selectedFill : theme.roomDefault}
              stroke={selectedRoomId === 'sala-mexica' ? theme.selectedStroke : theme.roomStroke}
              strokeWidth={selectedRoomId === 'sala-mexica' ? '3.5' : '1.5'}
              filter={selectedRoomId === 'sala-mexica' ? 'url(#room-glow)' : undefined}
              className="transition-all duration-200"
            />
            {/* Piedra del Sol Dais Altar */}
            <circle
              cx="400"
              cy="100"
              r="24"
              fill={theme.accent}
              fillOpacity="0.2"
              stroke={theme.accent}
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
            <text
              x="400"
              y="74"
              fill={selectedRoomId === 'sala-mexica' ? theme.selectedStroke : theme.textMain}
              fontSize="14"
              fontWeight="900"
              textAnchor="middle"
              letterSpacing="1"
            >
              SALA MEXICA
            </text>
            <text
              x="400"
              y="104"
              fill={theme.accentLight}
              fontSize="9"
              fontWeight="800"
              textAnchor="middle"
            >
              Piedra del Sol
            </text>
            <text
              x="400"
              y="136"
              fill={theme.textMuted}
              fontSize="9"
              fontWeight="600"
              textAnchor="middle"
            >
              Coatlicue • Coyolxauhqui • Tenochtitlan
            </text>
          </g>

          {/* SALA MAYA (East Wing - Lower Right) */}
          <g
            id="sala-maya"
            onClick={() => onSelectRoom && onSelectRoom('sala-maya')}
            className="cursor-pointer group"
          >
            <rect
              x="595"
              y="280"
              width="105"
              height="180"
              rx="6"
              fill={selectedRoomId === 'sala-maya' ? theme.selectedFill : theme.roomDefault}
              stroke={selectedRoomId === 'sala-maya' ? theme.selectedStroke : theme.roomStroke}
              strokeWidth={selectedRoomId === 'sala-maya' ? '3.5' : '1.5'}
              filter={selectedRoomId === 'sala-maya' ? 'url(#room-glow)' : undefined}
              className="transition-all duration-200"
            />
            <text
              x="647"
              y="340"
              fill={selectedRoomId === 'sala-maya' ? theme.selectedStroke : theme.textMain}
              fontSize="12"
              fontWeight="900"
              textAnchor="middle"
            >
              SALA MAYA
            </text>
            <text
              x="647"
              y="358"
              fill={theme.textMuted}
              fontSize="8"
              fontWeight="600"
              textAnchor="middle"
            >
              Calakmul • Pakal
            </text>
          </g>

          {/* SALA OAXACA (East Wing - Upper Right) */}
          <g
            id="sala-oaxaca"
            onClick={() => onSelectRoom && onSelectRoom('sala-oaxaca')}
            className="cursor-pointer group"
          >
            <rect
              x="595"
              y="120"
              width="105"
              height="150"
              rx="6"
              fill={selectedRoomId === 'sala-oaxaca' ? theme.selectedFill : theme.roomDefault}
              stroke={selectedRoomId === 'sala-oaxaca' ? theme.selectedStroke : theme.roomStroke}
              strokeWidth={selectedRoomId === 'sala-oaxaca' ? '3.5' : '1.5'}
              filter={selectedRoomId === 'sala-oaxaca' ? 'url(#room-glow)' : undefined}
              className="transition-all duration-200"
            />
            <text
              x="647"
              y="190"
              fill={selectedRoomId === 'sala-oaxaca' ? theme.selectedStroke : theme.textMain}
              fontSize="12"
              fontWeight="900"
              textAnchor="middle"
            >
              SALA OAXACA
            </text>
            <text
              x="647"
              y="208"
              fill={theme.textMuted}
              fontSize="8"
              fontWeight="600"
              textAnchor="middle"
            >
              Monte Albán • Tumba 7
            </text>
          </g>

          {/* SALA INTRODUCCIÓN Y ORÍGENES / OLMECA (West Wing - Lower Left) */}
          <g
            id="sala-origenes"
            onClick={() => onSelectRoom && onSelectRoom('sala-origenes')}
            className="cursor-pointer group"
          >
            <rect
              x="100"
              y="280"
              width="110"
              height="180"
              rx="6"
              fill={selectedRoomId === 'sala-origenes' ? theme.selectedFill : theme.roomDefault}
              stroke={selectedRoomId === 'sala-origenes' ? theme.selectedStroke : theme.roomStroke}
              strokeWidth={selectedRoomId === 'sala-origenes' ? '3.5' : '1.5'}
              filter={selectedRoomId === 'sala-origenes' ? 'url(#room-glow)' : undefined}
              className="transition-all duration-200"
            />
            <text
              x="155"
              y="340"
              fill={selectedRoomId === 'sala-origenes' ? theme.selectedStroke : theme.textMain}
              fontSize="11"
              fontWeight="900"
              textAnchor="middle"
            >
              ORÍGENES & OLMECA
            </text>
            <text
              x="155"
              y="358"
              fill={theme.textMuted}
              fontSize="8"
              fontWeight="600"
              textAnchor="middle"
            >
              Cabeza Colosal
            </text>
          </g>

          {/* SALA TOLTECA (West Wing - Upper Left) */}
          <g
            id="sala-tolteca"
            onClick={() => onSelectRoom && onSelectRoom('sala-tolteca')}
            className="cursor-pointer group"
          >
            <rect
              x="100"
              y="120"
              width="110"
              height="150"
              rx="6"
              fill={selectedRoomId === 'sala-tolteca' ? theme.selectedFill : theme.roomDefault}
              stroke={selectedRoomId === 'sala-tolteca' ? theme.selectedStroke : theme.roomStroke}
              strokeWidth={selectedRoomId === 'sala-tolteca' ? '3.5' : '1.5'}
              filter={selectedRoomId === 'sala-tolteca' ? 'url(#room-glow)' : undefined}
              className="transition-all duration-200"
            />
            <text
              x="155"
              y="190"
              fill={selectedRoomId === 'sala-tolteca' ? theme.selectedStroke : theme.textMain}
              fontSize="12"
              fontWeight="900"
              textAnchor="middle"
            >
              SALA TOLTECA
            </text>
            <text
              x="155"
              y="208"
              fill={theme.textMuted}
              fontSize="8"
              fontWeight="600"
              textAnchor="middle"
            >
              Atlantes de Tula
            </text>
          </g>

          {/* VESTÍBULO Y ENTRADA PRINCIPAL (South Wing) */}
          <rect
            x="220"
            y="450"
            width="360"
            height="110"
            rx="6"
            fill={theme.roomDefault}
            stroke={theme.roomStroke}
            strokeWidth="1.5"
          />
          <text
            x="400"
            y="500"
            fill={theme.textMain}
            fontSize="12"
            fontWeight="900"
            textAnchor="middle"
            letterSpacing="1"
          >
            VESTÍBULO PRINCIPAL & ACCESO
          </text>
          <text
            x="400"
            y="520"
            fill={theme.textMuted}
            fontSize="9"
            fontWeight="600"
            textAnchor="middle"
          >
            Mural Rufino Tamayo • Taquillas • Salida
          </text>
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
