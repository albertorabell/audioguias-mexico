import React, { useState, useEffect, useMemo } from 'react';
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

export interface MapRoomDef {
  numStr: string;
  id: string;
  aliases: string[];
  name: string;
  shortName: string;
  sub: string;
  piso: 'PB' | 'PA';
  x: number;
  y: number;
  w: number;
  h: number;
  rx?: number;
  wing: 'norte' | 'cabecera' | 'sur';
}

// 12 Espacios en Planta Baja (Arqueología: Salas 00 a 11)
const PB_ROOMS: MapRoomDef[] = [
  // --- Ala Derecha (Ala Norte) ---
  {
    numStr: '00',
    id: 'sala-vestibulo',
    aliases: ['sala-0', 'sala-00', 'vestibulo', 'orientacion'],
    name: 'Vestíbulo y Orientación',
    shortName: '00. Vestíbulo',
    sub: 'Acceso · Servicios',
    piso: 'PB',
    x: 680,
    y: 630,
    w: 220,
    h: 65,
    rx: 6,
    wing: 'norte',
  },
  {
    numStr: '01',
    id: 'sala-introduccion_antropologia',
    aliases: ['sala-1', 'sala-01', 'introduccion_antropologia', 'introduccion'],
    name: 'Introducción a la Antropología',
    shortName: '01. Introducción',
    sub: 'Evolución humana',
    piso: 'PB',
    x: 680,
    y: 550,
    w: 220,
    h: 68,
    rx: 6,
    wing: 'norte',
  },
  {
    numStr: '02',
    id: 'sala-poblamiento',
    aliases: ['sala-2', 'sala-02', 'poblamiento', 'poblamiento_de_america'],
    name: 'Poblamiento de América',
    shortName: '02. Poblamiento',
    sub: 'Estrecho de Bering · Fósiles',
    piso: 'PB',
    x: 680,
    y: 470,
    w: 220,
    h: 68,
    rx: 6,
    wing: 'norte',
  },
  {
    numStr: '03',
    id: 'sala-preclasico',
    aliases: ['sala-3', 'sala-03', 'preclasico', 'altiplano'],
    name: 'Preclásico en el Altiplano Central',
    shortName: '03. Preclásico',
    sub: 'Tlatilco · Cuicuilco',
    piso: 'PB',
    x: 680,
    y: 390,
    w: 220,
    h: 68,
    rx: 6,
    wing: 'norte',
  },
  {
    numStr: '04',
    id: 'sala-teotihuacan',
    aliases: ['sala-4', 'sala-04', 'teotihuacan', 'chalchiuhtlicue'],
    name: 'Teotihuacán',
    shortName: '04. Teotihuacán',
    sub: 'Ciudad de los Dioses',
    piso: 'PB',
    x: 680,
    y: 270,
    w: 220,
    h: 108,
    rx: 6,
    wing: 'norte',
  },
  {
    numStr: '05',
    id: 'sala-tolteca',
    aliases: ['sala-5', 'sala-05', 'tolteca', 'toltecas', 'epiclasico'],
    name: 'Los Toltecas y el Epiclásico',
    shortName: '05. Tolteca',
    sub: 'Atlantes de Tula · Xochicalco',
    piso: 'PB',
    x: 680,
    y: 175,
    w: 220,
    h: 82,
    rx: 6,
    wing: 'norte',
  },

  // --- Cabecera Monumental (Fondo Oeste) ---
  {
    numStr: '06',
    id: 'sala-mexica',
    aliases: ['sala-6', 'sala-06', 'mexica', 'azteca', 'tenochtitlan'],
    name: 'Mexica',
    shortName: '06. Mexica',
    sub: 'Piedra del Sol · Coatlicue · Templo Mayor',
    piso: 'PB',
    x: 320,
    y: 40,
    w: 360,
    h: 185,
    rx: 8,
    wing: 'cabecera',
  },

  // --- Ala Izquierda (Ala Sur) ---
  {
    numStr: '07',
    id: 'sala-oaxaca',
    aliases: ['sala-7', 'sala-07', 'oaxaca', 'monte_alban'],
    name: 'Culturas de Oaxaca',
    shortName: '07. Oaxaca',
    sub: 'Monte Albán · Tumba 7',
    piso: 'PB',
    x: 100,
    y: 175,
    w: 210,
    h: 82,
    rx: 6,
    wing: 'sur',
  },
  {
    numStr: '08',
    id: 'sala-costa_del_golfo',
    aliases: ['sala-8', 'sala-08', 'costa_del_golfo', 'golfo', 'olmeca'],
    name: 'Culturas de la Costa del Golfo',
    shortName: '08. Costa del Golfo',
    sub: 'Cabezas Colosales Olmecas',
    piso: 'PB',
    x: 100,
    y: 270,
    w: 210,
    h: 90,
    rx: 6,
    wing: 'sur',
  },
  {
    numStr: '09',
    id: 'sala-maya',
    aliases: ['sala-9', 'sala-09', 'maya', 'palenque', 'calakmul'],
    name: 'Maya',
    shortName: '09. Maya',
    sub: 'Tumba de Pakal · Máscara de Calakmul',
    piso: 'PB',
    x: 100,
    y: 372,
    w: 210,
    h: 140,
    rx: 6,
    wing: 'sur',
  },
  {
    numStr: '10',
    id: 'sala-occidente',
    aliases: ['sala-10', 'occidente', 'tarascos', 'purepecha'],
    name: 'Culturas de Occidente',
    shortName: '10. Occidente',
    sub: 'Tumbas de Tiro · Colima',
    piso: 'PB',
    x: 100,
    y: 524,
    w: 210,
    h: 80,
    rx: 6,
    wing: 'sur',
  },
  {
    numStr: '11',
    id: 'sala-norte',
    aliases: ['sala-11', 'norte', 'paquime'],
    name: 'Culturas del Norte',
    shortName: '11. Norte',
    sub: 'Paquimé · Casas Grandes',
    piso: 'PB',
    x: 100,
    y: 616,
    w: 210,
    h: 79,
    rx: 6,
    wing: 'sur',
  },
];

// 10 Salas en Planta Alta (Etnografía: Salas 12 a 21)
const PA_ROOMS: MapRoomDef[] = [
  // --- Ala Derecha (Ala Norte) ---
  {
    numStr: '12',
    id: 'sala-etno_pueblos_indigenas',
    aliases: ['sala-12', 'pueblos_indigenas', 'origenes', 'sala-origenes'],
    name: 'Pueblos Indígenas de México',
    shortName: '12. Pueblos Indígenas',
    sub: 'Diversidad contemporánea',
    piso: 'PA',
    x: 680,
    y: 550,
    w: 220,
    h: 120,
    rx: 6,
    wing: 'norte',
  },
  {
    numStr: '13',
    id: 'sala-gran_nayar',
    aliases: ['sala-13', 'gran_nayar', 'huichol', 'cora'],
    name: 'Gran Nayar',
    shortName: '13. Gran Nayar',
    sub: 'Coras · Huicholes · Tepehuanes',
    piso: 'PA',
    x: 680,
    y: 450,
    w: 220,
    h: 88,
    rx: 6,
    wing: 'norte',
  },
  {
    numStr: '14',
    id: 'sala-etno_purepecha',
    aliases: ['sala-14', 'etno_purepecha', 'purepecha'],
    name: 'Purépechas',
    shortName: '14. Purépecha',
    sub: 'Michoacán lacustre y serrano',
    piso: 'PA',
    x: 680,
    y: 350,
    w: 220,
    h: 88,
    rx: 6,
    wing: 'norte',
  },
  {
    numStr: '15',
    id: 'sala-etno_otopames',
    aliases: ['sala-15', 'etno_otopames', 'otopames', 'otomi'],
    name: 'Otopames',
    shortName: '15. Otopames',
    sub: 'Otomíes · Mazahuas · Matlatzincas',
    piso: 'PA',
    x: 680,
    y: 250,
    w: 220,
    h: 88,
    rx: 6,
    wing: 'norte',
  },
  {
    numStr: '16',
    id: 'sala-etno_sierra_puebla',
    aliases: ['sala-16', 'etno_sierra_puebla', 'sierra_puebla', 'totonacos'],
    name: 'Sierra de Puebla',
    shortName: '16. Sierra de Puebla',
    sub: 'Nahuas y Totonacos',
    piso: 'PA',
    x: 680,
    y: 155,
    w: 220,
    h: 82,
    rx: 6,
    wing: 'norte',
  },

  // --- Cabecera Monumental (Fondo Oeste) ---
  {
    numStr: '17',
    id: 'sala-etno_nahuas',
    aliases: ['sala-17', 'etno_nahuas', 'nahuas'],
    name: 'Pueblos Nahuas',
    shortName: '17. Pueblos Nahuas',
    sub: 'Cosmovisión actual del pueblo nahuatl',
    piso: 'PA',
    x: 320,
    y: 40,
    w: 360,
    h: 185,
    rx: 8,
    wing: 'cabecera',
  },

  // --- Ala Izquierda (Ala Sur) ---
  {
    numStr: '18',
    id: 'sala-etno_oaxaca',
    aliases: ['sala-18', 'etno_oaxaca', 'oaxaca_etno'],
    name: 'Pueblos Indígenas de Oaxaca',
    shortName: '18. Oaxaca Etnográfico',
    sub: 'Mixtecos · Zapotecos · Mixes',
    piso: 'PA',
    x: 100,
    y: 155,
    w: 210,
    h: 100,
    rx: 6,
    wing: 'sur',
  },
  {
    numStr: '19',
    id: 'sala-etno_golfo_huasteca',
    aliases: ['sala-19', 'etno_golfo_huasteca', 'huasteca', 'golfo_etno'],
    name: 'Costa del Golfo y Huasteca',
    shortName: '19. Golfo y Huasteca',
    sub: 'Tepehuas · Teenek · Totonacos',
    piso: 'PA',
    x: 100,
    y: 270,
    w: 210,
    h: 100,
    rx: 6,
    wing: 'sur',
  },
  {
    numStr: '20',
    id: 'sala-etno_maya',
    aliases: ['sala-20', 'etno_maya', 'mayas_etno'],
    name: 'Pueblos Mayas',
    shortName: '20. Mayas Contemporáneos',
    sub: 'Tsotsiles · Tseltales · Mayas peninsulares',
    piso: 'PA',
    x: 100,
    y: 385,
    w: 210,
    h: 140,
    rx: 6,
    wing: 'sur',
  },
  {
    numStr: '21',
    id: 'sala-etno_noroeste',
    aliases: ['sala-21', 'etno_noroeste', 'noroeste', 'raramuri', 'yaquis'],
    name: 'Pueblos del Noroeste',
    shortName: '21. Noroeste',
    sub: 'Rarámuri · Yaquis · Mayos · Seris',
    piso: 'PA',
    x: 100,
    y: 540,
    w: 210,
    h: 130,
    rx: 6,
    wing: 'sur',
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
  const [selectedFloor, setSelectedFloor] = useState<'PB' | 'PA'>('PB');
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);

  // Auto-seleccionar piso si el selectedRoomId pertenece a la Planta Alta
  useEffect(() => {
    if (!selectedRoomId) return;
    const isPA = PA_ROOMS.some(
      (r) => r.id === selectedRoomId || r.aliases.includes(selectedRoomId.toLowerCase())
    );
    if (isPA) {
      setSelectedFloor('PA');
    } else {
      const isPB = PB_ROOMS.some(
        (r) => r.id === selectedRoomId || r.aliases.includes(selectedRoomId.toLowerCase())
      );
      if (isPB) {
        setSelectedFloor('PB');
      }
    }
  }, [selectedRoomId]);

  // Lista de salas a renderizar según el piso activo
  const activeRoomsList = useMemo(() => {
    return selectedFloor === 'PB' ? PB_ROOMS : PA_ROOMS;
  }, [selectedFloor]);

  // Chequeo si una sala está activa o seleccionada
  const isRoomActive = (roomDef: MapRoomDef) => {
    if (!selectedRoomId) return false;
    const target = selectedRoomId.toLowerCase();
    return roomDef.id === target || roomDef.aliases.includes(target);
  };

  const handleRoomClick = (roomDef: MapRoomDef) => {
    if (onSelectRoom) {
      onSelectRoom(roomDef.id);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* 1. SELECTOR DE PISOS CON BOTONES INTERACTIVOS */}
      <div className="w-full max-w-xl px-4 pt-2 pb-4 flex items-center justify-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setSelectedFloor('PB')}
          className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold tracking-tight transition-all duration-200 border flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
            selectedFloor === 'PB'
              ? isSunMode
                ? 'bg-[#C05638] text-white border-[#C05638] ring-2 ring-[#C05638]/20 shadow-sm'
                : 'bg-[#D96B47] text-white border-[#D96B47] ring-2 ring-[#D96B47]/30 shadow-sm'
              : isSunMode
              ? 'bg-white text-[#111827] border-stone-200 hover:border-stone-300 hover:bg-stone-50'
              : 'bg-stone-900 text-stone-300 border-stone-800 hover:border-stone-700 hover:bg-stone-800/80'
          }`}
        >
          <span className="text-base">🏛️</span>
          <span className="truncate">Planta Baja (Arqueología)</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
              selectedFloor === 'PB'
                ? 'bg-white/20 text-white'
                : isSunMode
                ? 'bg-stone-100 text-[#4B5563]'
                : 'bg-stone-800 text-stone-400'
            }`}
          >
            00–11
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFloor('PA')}
          className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold tracking-tight transition-all duration-200 border flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
            selectedFloor === 'PA'
              ? isSunMode
                ? 'bg-[#C05638] text-white border-[#C05638] ring-2 ring-[#C05638]/20 shadow-sm'
                : 'bg-[#D96B47] text-white border-[#D96B47] ring-2 ring-[#D96B47]/30 shadow-sm'
              : isSunMode
              ? 'bg-white text-[#111827] border-stone-200 hover:border-stone-300 hover:bg-stone-50'
              : 'bg-stone-900 text-stone-300 border-stone-800 hover:border-stone-700 hover:bg-stone-800/80'
          }`}
        >
          <span className="text-base">🧵</span>
          <span className="truncate">Planta Alta (Etnografía)</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
              selectedFloor === 'PA'
                ? 'bg-white/20 text-white'
                : isSunMode
                ? 'bg-stone-100 text-[#4B5563]'
                : 'bg-stone-800 text-stone-400'
            }`}
          >
            12–21
          </span>
        </button>
      </div>

      {/* 2. RENDERIZADO SVG EN DISPOSICIÓN 'U' CON PATIO CENTRAL Y EL PARAGUAS */}
      <div
        className={`w-full max-w-4xl aspect-[4/3] relative rounded-2xl overflow-hidden border transition-colors shadow-inner ${
          isSunMode
            ? 'bg-[#F2ECE4] border-stone-200/80 text-stone-800'
            : 'bg-[#151311] border-stone-800 text-stone-100'
        }`}
      >
        <svg
          viewBox="0 0 1000 750"
          className="w-full h-full select-none"
          role="img"
          aria-label={`Mapa del Museo Nacional de Antropología - ${
            selectedFloor === 'PB' ? 'Planta Baja (Arqueología)' : 'Planta Alta (Etnografía)'
          }`}
        >
          <defs>
            {/* Gradiente sutil para el Patio Central */}
            <linearGradient id="patioGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isSunMode ? '#EBE3D7' : '#1C1917'} stopOpacity="1" />
              <stop offset="100%" stopColor={isSunMode ? '#E5DDD1' : '#1A1715'} stopOpacity="1" />
            </linearGradient>

            {/* Gradiente para la Fuente de El Paraguas */}
            <radialGradient id="paraguasWater" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#0284C7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0369A1" stopOpacity="0.05" />
            </radialGradient>

            {/* Brillo para sala activa */}
            <filter id="activeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#F59E0B" floodOpacity="0.75" />
            </filter>
          </defs>

          {/* FONDO PATIO CENTRAL EN FORMA DE 'U' */}
          <rect x="0" y="0" width="1000" height="750" fill={isSunMode ? '#FAF8F5' : '#121110'} />

          {/* ÁREA DEL PATIO CENTRAL */}
          <rect
            x="320"
            y="235"
            width="350"
            height="465"
            rx="12"
            fill="url(#patioGradient)"
            stroke={isSunMode ? '#D6CCC0' : '#292524'}
            strokeWidth="1.5"
          />

          {/* ESTANQUE DE LIRIOS (Lado Poniente del Patio) */}
          <rect
            x="390"
            y="260"
            width="210"
            height="50"
            rx="8"
            fill={isSunMode ? '#BAE6FD' : '#075985'}
            fillOpacity={isSunMode ? '0.6' : '0.4'}
            stroke={isSunMode ? '#7DD3FC' : '#0369A1'}
            strokeWidth="1"
          />
          <text
            x="495"
            y="290"
            textAnchor="middle"
            fill={isSunMode ? '#0369A1' : '#E0F2FE'}
            fontSize="10"
            fontWeight="600"
            fontFamily="sans-serif"
            letterSpacing="1"
          >
            ESTANQUE DE LIRIOS
          </text>

          {/* FUENTE MONUMENTAL: 'EL PARAGUAS' DE PEDRO RAMÍREZ VÁZQUEZ */}
          <g transform="translate(495, 480)">
            {/* Espejo de agua circular de la fuente */}
            <circle cx="0" cy="0" r="90" fill="url(#paraguasWater)" stroke="#38BDF8" strokeWidth="1.5" />
            <circle
              cx="0"
              cy="0"
              r="70"
              fill="none"
              stroke="#38BDF8"
              strokeDasharray="4 3"
              strokeWidth="1"
              opacity="0.6"
            />
            {/* Radios de la cubierta invertida de bronce */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
              <line
                key={deg}
                x1="0"
                y1="0"
                x2={70 * Math.cos((deg * Math.PI) / 180)}
                y2={70 * Math.sin((deg * Math.PI) / 180)}
                stroke={isSunMode ? '#94A3B8' : '#64748B'}
                strokeWidth="0.75"
                opacity="0.5"
              />
            ))}
            {/* Columna central de bronce esculpida por los hermanos Chávez Morado */}
            <circle
              cx="0"
              cy="0"
              r="14"
              fill={isSunMode ? '#C05638' : '#D96B47'}
              stroke="#FFF"
              strokeWidth="2"
              className="shadow-sm"
            />
            <text
              x="0"
              y="110"
              textAnchor="middle"
              fill={isSunMode ? '#1F2937' : '#E5E7EB'}
              fontSize="12"
              fontWeight="700"
              fontFamily="serif"
              letterSpacing="0.5"
            >
              Fuente «El Paraguas»
            </text>
            <text
              x="0"
              y="125"
              textAnchor="middle"
              fill={isSunMode ? '#6B7280' : '#9CA3AF'}
              fontSize="9"
              fontWeight="500"
              fontFamily="sans-serif"
            >
              Monolito Central y Caída de Agua
            </text>
          </g>

          {/* ACCESO PRINCIPAL / VESTÍBULO (Parte Inferior) */}
          <g transform="translate(495, 715)">
            <rect
              x="-80"
              y="-12"
              width="160"
              height="24"
              rx="6"
              fill={isSunMode ? '#E7E5E4' : '#292524'}
              stroke={isSunMode ? '#D6D3D1' : '#44403C'}
              strokeWidth="1"
            />
            <text
              x="0"
              y="4"
              textAnchor="middle"
              fill={isSunMode ? '#44403C' : '#D6D3D1'}
              fontSize="10"
              fontWeight="600"
              fontFamily="sans-serif"
              letterSpacing="1"
            >
              ACCESO PRINCIPAL
            </text>
          </g>

          {/* RENDERIZADO DE TODAS LAS SALAS PERIMETRALES */}
          {activeRoomsList.map((room) => {
            const active = isRoomActive(room);
            const hovered = hoveredRoomId === room.id;

            // Colores según estado especificado:
            // Activa: naranja/ámbar con borde brillante
            // Normal: stone-800 con borde stone-600 (o stone-100/stone-300 en tema claro)
            let fillColor = isSunMode ? '#FFFFFF' : '#292524'; // stone-800 equiv
            let strokeColor = isSunMode ? '#D6D3D1' : '#57534E'; // stone-600 equiv
            let strokeWidth = 1.5;
            let textColor = isSunMode ? '#111827' : '#F5F5F4';
            let badgeBg = isSunMode ? '#E7E5E4' : '#44403C';
            let badgeText = isSunMode ? '#111827' : '#E7E5E4';

            if (active) {
              fillColor = isSunMode ? '#FEF3C7' : '#451A03'; // ámbar / naranja suave
              strokeColor = '#F59E0B'; // ámbar brillante
              strokeWidth = 3;
              textColor = isSunMode ? '#92400E' : '#FDE68A';
              badgeBg = '#F59E0B';
              badgeText = '#FFFFFF';
            } else if (hovered) {
              fillColor = isSunMode ? '#F5F5F4' : '#3C3836';
              strokeColor = isSunMode ? '#A8A29E' : '#78716C';
              strokeWidth = 2;
            }

            return (
              <g
                key={room.id}
                onClick={() => handleRoomClick(room)}
                onMouseEnter={() => setHoveredRoomId(room.id)}
                onMouseLeave={() => setHoveredRoomId(null)}
                className="cursor-pointer transition-all duration-150"
                filter={active ? 'url(#activeGlow)' : undefined}
              >
                {/* Caja de la Sala */}
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.w}
                  height={room.h}
                  rx={room.rx || 6}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  className="transition-colors"
                />

                {/* Badge con número oficial de la sala */}
                <rect
                  x={room.x + 8}
                  y={room.y + 8}
                  width={28}
                  height={20}
                  rx={4}
                  fill={badgeBg}
                />
                <text
                  x={room.x + 22}
                  y={room.y + 22}
                  textAnchor="middle"
                  fill={badgeText}
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {room.numStr}
                </text>

                {/* Título de la sala */}
                <text
                  x={room.x + 42}
                  y={room.y + 22}
                  fill={textColor}
                  fontSize={room.wing === 'cabecera' ? 14 : 12}
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {room.shortName.replace(/^\d+\.\s*/, '')}
                </text>

                {/* Subtítulo descriptivo de las piezas icónicas */}
                <text
                  x={room.x + 10}
                  y={room.y + (room.h > 80 ? 44 : 38)}
                  fill={active ? textColor : isSunMode ? '#4B5563' : '#A8A29E'}
                  fontSize={room.h > 80 ? 10.5 : 9.5}
                  fontWeight="400"
                  fontFamily="sans-serif"
                >
                  {room.sub}
                </text>
              </g>
            );
          })}
        </svg>

        {/* PIE DE MAPA CON LEYENDA Y CONTROLES */}
        <div
          className={`absolute bottom-2 left-3 right-3 px-3 py-1.5 rounded-lg flex items-center justify-between text-[11px] backdrop-blur-md border ${
            isSunMode
              ? 'bg-white/90 border-stone-200 text-[#4B5563]'
              : 'bg-stone-900/90 border-stone-800 text-stone-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-xs" />
            <span className="font-semibold text-[#111827] dark:text-stone-200">
              {selectedFloor === 'PB'
                ? 'Planta Baja · 12 Salas de Arqueología'
                : 'Planta Alta · 10 Salas de Etnografía'}
            </span>
          </div>
          <span className="text-[10px] text-[#4B5563] dark:text-stone-400 font-medium">Toca cualquier sala para explorar</span>
        </div>
      </div>
    </div>
  );
};

export default MuseumMapSvg;
