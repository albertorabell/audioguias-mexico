import React, { useState, useEffect, useMemo } from 'react';
import { Room, RouteStop } from '../types';

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

// ================= 12 Espacios en Planta Baja (Arqueología: Salas 00 a 11) =================
const PB_ROOMS: MapRoomDef[] = [
  // --- Ala Derecha (Ala Norte) ---
  {
    numStr: '00',
    id: 'sala-00-exteriores',
    aliases: ['sala-0', 'sala-00', 'vestibulo', 'orientacion', 'exteriores', 'patio'],
    name: 'Arquitectura y Patio Central',
    shortName: '00. Patio y Paraguas',
    sub: 'El Paraguas · Pedro Ramírez Vázquez',
    piso: 'PB',
    x: 690,
    y: 615,
    w: 240,
    h: 70,
    rx: 6,
    wing: 'norte',
  },
  {
    numStr: '01',
    id: 'sala-01-introduccion-antropologia',
    aliases: ['sala-1', 'sala-01', 'introduccion_antropologia', 'intro-antropologia'],
    name: 'Introducción a la Antropología',
    shortName: '01. Introducción',
    sub: 'Evolución humana · Hominización',
    piso: 'PB',
    x: 690,
    y: 535,
    w: 240,
    h: 70,
    rx: 6,
    wing: 'norte',
  },
  {
    numStr: '02',
    id: 'sala-02-poblamiento-de-america',
    aliases: ['sala-2', 'sala-02', 'poblamiento', 'poblamiento_de_america'],
    name: 'Poblamiento de América',
    shortName: '02. Poblamiento',
    sub: 'Estrecho de Bering · Fósiles',
    piso: 'PB',
    x: 690,
    y: 455,
    w: 240,
    h: 70,
    rx: 6,
    wing: 'norte',
  },
  {
    numStr: '03',
    id: 'sala-03-preclasico-altiplano-central',
    aliases: ['sala-3', 'sala-03', 'preclasico', 'altiplano'],
    name: 'Preclásico en el Altiplano Central',
    shortName: '03. Preclásico',
    sub: 'Tlatilco · Cuicuilco',
    piso: 'PB',
    x: 690,
    y: 375,
    w: 240,
    h: 70,
    rx: 6,
    wing: 'norte',
  },
  {
    numStr: '04',
    id: 'sala-04-teotihuacan',
    aliases: ['sala-4', 'sala-04', 'teotihuacan', 'chalchiuhtlicue'],
    name: 'Teotihuacán',
    shortName: '04. Teotihuacán',
    sub: 'Ciudad de los Dioses · Pirámides',
    piso: 'PB',
    x: 690,
    y: 275,
    w: 240,
    h: 90,
    rx: 6,
    wing: 'norte',
  },
  {
    numStr: '05',
    id: 'sala-05-los-toltecas-y-su-epoca',
    aliases: ['sala-5', 'sala-05', 'tolteca', 'toltecas', 'epiclasico'],
    name: 'Los Toltecas y su época',
    shortName: '05. Tolteca',
    sub: 'Atlantes de Tula · Xochicalco',
    piso: 'PB',
    x: 690,
    y: 185,
    w: 240,
    h: 80,
    rx: 6,
    wing: 'norte',
  },

  // --- Cabecera Monumental (Fondo Oeste / Centro) ---
  {
    numStr: '06',
    id: 'sala-06-mexica',
    aliases: ['sala-6', 'sala-06', 'mexica', 'azteca', 'tenochtitlan'],
    name: 'Mexica (Altar Central)',
    shortName: '06. Mexica',
    sub: 'Piedra del Sol · Coatlicue · Templo Mayor',
    piso: 'PB',
    x: 320,
    y: 45,
    w: 360,
    h: 155,
    rx: 8,
    wing: 'cabecera',
  },

  // --- Ala Izquierda (Ala Sur) ---
  {
    numStr: '07',
    id: 'sala-07-oaxaca',
    aliases: ['sala-7', 'sala-07', 'oaxaca', 'monte_alban'],
    name: 'Culturas de Oaxaca',
    shortName: '07. Oaxaca',
    sub: 'Monte Albán · Urnas Funerarias',
    piso: 'PB',
    x: 70,
    y: 185,
    w: 240,
    h: 80,
    rx: 6,
    wing: 'sur',
  },
  {
    numStr: '08',
    id: 'sala-08-costa-del-golfo',
    aliases: ['sala-8', 'sala-08', 'costa_del_golfo', 'golfo', 'olmeca', 'costa-del-golfo'],
    name: 'Culturas de la Costa del Golfo',
    shortName: '08. Costa del Golfo',
    sub: 'Cabezas Colosales Olmecas · Tajín',
    piso: 'PB',
    x: 70,
    y: 275,
    w: 240,
    h: 90,
    rx: 6,
    wing: 'sur',
  },
  {
    numStr: '09',
    id: 'sala-09-maya',
    aliases: ['sala-9', 'sala-09', 'maya', 'palenque', 'calakmul'],
    name: 'Maya',
    shortName: '09. Maya',
    sub: 'Tumba de Pakal · Máscara de Calakmul',
    piso: 'PB',
    x: 70,
    y: 375,
    w: 240,
    h: 110,
    rx: 6,
    wing: 'sur',
  },
  {
    numStr: '10',
    id: 'sala-10-occidente',
    aliases: ['sala-10', 'occidente', 'tarascos', 'purepecha'],
    name: 'Culturas de Occidente',
    shortName: '10. Occidente',
    sub: 'Tumbas de Tiro · Colima · Chupícuaro',
    piso: 'PB',
    x: 70,
    y: 495,
    w: 240,
    h: 95,
    rx: 6,
    wing: 'sur',
  },
  {
    numStr: '11',
    id: 'sala-11-norte',
    aliases: ['sala-11', 'norte', 'paquime'],
    name: 'Culturas del Norte',
    shortName: '11. Norte',
    sub: 'Paquimé · Cueva de la Candelaria',
    piso: 'PB',
    x: 70,
    y: 600,
    w: 240,
    h: 85,
    rx: 6,
    wing: 'sur',
  },
];

// ================= 11 Salas en Planta Alta (Etnografía: Salas 12 a 22) =================
const PA_ROOMS: MapRoomDef[] = [
  // --- Ala Derecha (Ala Norte) ---
  {
    numStr: '12',
    id: 'sala-12-introduccion-etnografia',
    aliases: ['sala-12', 'sala-12-pueblos-indios', 'pueblos-indios', 'etnografia-intro'],
    name: 'Introducción a la Etnografía',
    shortName: '12. Etnografía',
    sub: 'Diversidad lingüística y cultural viva',
    piso: 'PA',
    x: 690,
    y: 565,
    w: 240,
    h: 120,
    rx: 6,
    wing: 'norte',
  },
  {
    numStr: '13',
    id: 'sala-13-otopames',
    aliases: ['sala-13', 'sala-15-otopames', 'otopames', 'otomi'],
    name: 'Otopames',
    shortName: '13. Otopames',
    sub: 'Otomíes · Mazahuas · Fibras de maguey',
    piso: 'PA',
    x: 690,
    y: 445,
    w: 240,
    h: 110,
    rx: 6,
    wing: 'norte',
  },
  {
    numStr: '14',
    id: 'sala-14-sierra-de-puebla',
    aliases: ['sala-14', 'sala-16-sierra-de-puebla', 'sierra-puebla', 'totonacos'],
    name: 'Sierra de Puebla',
    shortName: '14. Sierra de Puebla',
    sub: 'Voladores · Danza de Quetzales · Amate',
    piso: 'PA',
    x: 690,
    y: 325,
    w: 240,
    h: 110,
    rx: 6,
    wing: 'norte',
  },
  {
    numStr: '15',
    id: 'sala-15-costa-del-golfo',
    aliases: ['sala-15', 'sala-18-huastecos-y-totonacos', 'huastecos-y-totonacos', 'golfo-etnografia'],
    name: 'Costa del Golfo: Huasteca y Totonacapan',
    shortName: '15. Costa del Golfo',
    sub: 'Huastecos · Totonacos · Altar Xantolo',
    piso: 'PA',
    x: 690,
    y: 205,
    w: 240,
    h: 110,
    rx: 6,
    wing: 'norte',
  },

  // --- Cabecera Monumental (Fondo Oeste / Mayas contemporáneos) ---
  {
    numStr: '16',
    id: 'sala-16-mayas-selva-montana',
    aliases: ['sala-16', 'sala-19-pueblos-mayas', 'mayas-selva', 'mayas-montana'],
    name: 'Pueblos Mayas de la Selva y Montaña',
    shortName: '16. Mayas Selva y Montaña',
    sub: 'Tsotsiles · Tseltales · Lacandones',
    piso: 'PA',
    x: 505,
    y: 45,
    w: 260,
    h: 150,
    rx: 8,
    wing: 'cabecera',
  },
  {
    numStr: '17',
    id: 'sala-17-mayas-tierras-bajas',
    aliases: ['sala-17', 'mayas-tierras-bajas', 'mayas-peninsula'],
    name: 'Pueblos Mayas de las Tierras Bajas',
    shortName: '17. Mayas Tierras Bajas',
    sub: 'Mayas peninsulares · Solar tradicional',
    piso: 'PA',
    x: 235,
    y: 45,
    w: 260,
    h: 150,
    rx: 8,
    wing: 'cabecera',
  },

  // --- Ala Izquierda (Ala Sur) ---
  {
    numStr: '18',
    id: 'sala-18-oaxaca-sur',
    aliases: ['sala-18', 'sala-17-oaxaca', 'oaxaca-etnografia'],
    name: 'Oaxaca: Pueblos Indios del Sur',
    shortName: '18. Pueblos de Oaxaca',
    sub: 'Tehuana · Zapotecos · Barro Negro',
    piso: 'PA',
    x: 70,
    y: 205,
    w: 240,
    h: 90,
    rx: 6,
    wing: 'sur',
  },
  {
    numStr: '19',
    id: 'sala-19-costa-pacifico-nahuas',
    aliases: ['sala-19', 'sala-21-nahuas', 'nahuas-pacifico'],
    name: 'Costa del Pacífico: Nahuas y Mixtecos',
    shortName: '19. Costa del Pacífico',
    sub: 'Papel amate Xalitla · Nahuas contemporáneos',
    piso: 'PA',
    x: 70,
    y: 305,
    w: 240,
    h: 90,
    rx: 6,
    wing: 'sur',
  },
  {
    numStr: '20',
    id: 'sala-20-purecherio',
    aliases: ['sala-20', 'sala-14-purecherio', 'purecherio', 'purepecha'],
    name: 'Puréecherio (Tarascos)',
    shortName: '20. Puréecherio',
    sub: 'Troje · Cobre martillado · Michoacán',
    piso: 'PA',
    x: 70,
    y: 405,
    w: 240,
    h: 90,
    rx: 6,
    wing: 'sur',
  },
  {
    numStr: '21',
    id: 'sala-21-gran-nayar',
    aliases: ['sala-21', 'sala-13-gran-nayar', 'gran-nayar', 'huichol', 'cora'],
    name: 'El Gran Nayar: Coras y Huicholes',
    shortName: '21. El Gran Nayar',
    sub: 'Wixárika · Nierika de estambre · Wirikuta',
    piso: 'PA',
    x: 70,
    y: 505,
    w: 240,
    h: 90,
    rx: 6,
    wing: 'sur',
  },
  {
    numStr: '22',
    id: 'sala-22-norte-noroeste',
    aliases: ['sala-22', 'sala-20-noroeste', 'noroeste', 'norte-etnografia'],
    name: 'Pueblos del Norte y Noroeste',
    shortName: '22. Norte y Noroeste',
    sub: 'Rarámuri · Danza del Venado Yaqui · Seris',
    piso: 'PA',
    x: 70,
    y: 605,
    w: 240,
    h: 80,
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
  activeFloor: controlledFloor,
  onFloorChange,
  showFloorSelector = true,
}) => {
  const [internalFloor, setInternalFloor] = useState<'PB' | 'PA'>('PB');
  const selectedFloor = controlledFloor !== undefined ? controlledFloor : internalFloor;
  const setFloor = (fl: 'PB' | 'PA') => {
    if (onFloorChange) onFloorChange(fl);
    else setInternalFloor(fl);
  };

  const [hoveredRoom, setHoveredRoom] = useState<MapRoomDef | null>(null);

  // Auto-seleccionar piso si el selectedRoomId pertenece a la Planta Alta
  useEffect(() => {
    if (!selectedRoomId) return;
    const isPA = PA_ROOMS.some(
      (r) => r.id === selectedRoomId || r.aliases.includes(selectedRoomId.toLowerCase())
    );
    if (isPA && selectedFloor !== 'PA') {
      setFloor('PA');
    } else {
      const isPB = PB_ROOMS.some(
        (r) => r.id === selectedRoomId || r.aliases.includes(selectedRoomId.toLowerCase())
      );
      if (isPB && selectedFloor !== 'PB') {
        setFloor('PB');
      }
    }
  }, [selectedRoomId]);

  // Lista de salas según el piso
  const activeRoomsList = useMemo(() => {
    return selectedFloor === 'PB' ? PB_ROOMS : PA_ROOMS;
  }, [selectedFloor]);

  // Chequeo si una sala está activa o seleccionada
  const isRoomActive = (roomDef: MapRoomDef) => {
    if (!selectedRoomId) return false;
    const target = selectedRoomId.toLowerCase().trim();
    if (roomDef.id === target) return true;
    if (roomDef.aliases.includes(target)) return true;
    const targetNum = target.match(/\d+/)?.[0];
    if (targetNum && parseInt(targetNum, 10) === parseInt(roomDef.numStr, 10)) return true;
    return false;
  };

  // Obtener conteo de piezas de la sala
  const getRoomPiecesCount = (roomDef: MapRoomDef) => {
    const foundRoom = rooms.find(
      (r) =>
        r.room_id === roomDef.id ||
        (r.numero_oficial && String(r.numero_oficial) === String(parseInt(roomDef.numStr, 10))) ||
        roomDef.aliases.includes((r.room_id || '').toLowerCase())
    );
    if (foundRoom) {
      if (foundRoom.pieces_info && foundRoom.pieces_info.length > 0) return foundRoom.pieces_info.length;
      if (foundRoom.featured_pieces && foundRoom.featured_pieces.length > 0) return foundRoom.featured_pieces.length;
    }
    return roomDef.piso === 'PB' ? (roomDef.numStr === '06' ? 10 : 6) : 4;
  };

  const handleRoomClick = (roomDef: MapRoomDef) => {
    if (onSelectRoom) {
      onSelectRoom(roomDef.id);
    }
  };

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* 1. SELECTOR DE PISOS ELEGANTE (SI ESTÁ HABILITADO) */}
      {showFloorSelector && (
        <div className="w-full max-w-xl px-2 pt-1 pb-3 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setFloor('PB')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold tracking-tight transition-all duration-200 border flex items-center justify-center gap-2 cursor-pointer ${
              selectedFloor === 'PB'
                ? 'bg-[#F59E0B] text-black border-[#F59E0B] shadow-md shadow-[#F59E0B]/20 font-black'
                : 'bg-[#141419] text-[#9CA3AF] border-white/10 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🏛️</span>
            <span className="truncate">Planta Baja (Arqueología)</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                selectedFloor === 'PB' ? 'bg-black/20 text-black font-bold' : 'bg-white/5 text-[#6B7280]'
              }`}
            >
              00–11
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFloor('PA')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold tracking-tight transition-all duration-200 border flex items-center justify-center gap-2 cursor-pointer ${
              selectedFloor === 'PA'
                ? 'bg-[#F59E0B] text-black border-[#F59E0B] shadow-md shadow-[#F59E0B]/20 font-black'
                : 'bg-[#141419] text-[#9CA3AF] border-white/10 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🧵</span>
            <span className="truncate">Planta Alta (Etnografía)</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                selectedFloor === 'PA' ? 'bg-black/20 text-black font-bold' : 'bg-white/5 text-[#6B7280]'
              }`}
            >
              12–22
            </span>
          </button>
        </div>
      )}

      {/* 2. RENDERIZADO DEL PLANO ARQUITECTÓNICO VECTORIAL EN GRAFITO PROFUNDO (#101216) */}
      <div className="w-full max-w-3xl aspect-[4/3.2] sm:aspect-[4/3] relative rounded-2xl overflow-hidden border border-[#2E3440]/60 bg-[#101216] shadow-2xl">
        <svg
          viewBox="0 0 1000 750"
          className="w-full h-full"
          role="img"
          aria-label={`Plano arquitectónico del Museo Nacional de Antropología - ${
            selectedFloor === 'PB' ? 'Planta Baja' : 'Planta Alta'
          }`}
        >
          <defs>
            {/* Patrón de cuadrícula arquitectónica sutil */}
            <pattern id="archGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1A1E27" strokeWidth="0.5" />
            </pattern>

            {/* Gradiente para el Patio Central */}
            <linearGradient id="patioGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#141720" stopOpacity="1" />
              <stop offset="100%" stopColor="#0E1017" stopOpacity="1" />
            </linearGradient>

            {/* Gradiente de agua para el Estanque de Lirios */}
            <linearGradient id="lilyPondGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0C253B" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#0E3857" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0C253B" stopOpacity="0.8" />
            </linearGradient>

            {/* Gradiente radial para la caída de agua de El Paraguas */}
            <radialGradient id="paraguasWater" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.6" />
              <stop offset="40%" stopColor="#0284C7" stopOpacity="0.3" />
              <stop offset="85%" stopColor="#0369A1" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#0B132B" stopOpacity="0" />
            </radialGradient>

            {/* Filtro de brillo ámbar solar para sala activa / hover */}
            <filter id="solarGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#F59E0B" floodOpacity="0.85" />
            </filter>

            {/* Filtro sutil para sala normal */}
            <filter id="roomShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Fondo Grafito Profundo con Malla Arquitectónica */}
          <rect x="0" y="0" width="1000" height="750" fill="#101216" />
          <rect x="0" y="0" width="1000" height="750" fill="url(#archGrid)" />

          {/* TRAZO ARQUITECTÓNICO DEL PATIO CENTRAL EN 'U' */}
          <rect
            x="320"
            y="215"
            width="360"
            height="470"
            rx="10"
            fill="url(#patioGrad)"
            stroke="#242B38"
            strokeWidth="1.5"
          />

          {/* ESTANQUE DE LIRIOS RECTANGULAR (Lado Poniente del Patio Central) */}
          <g>
            <rect
              x="380"
              y="235"
              width="240"
              height="45"
              rx="6"
              fill="url(#lilyPondGrad)"
              stroke="#0284C7"
              strokeWidth="1"
              strokeDasharray="4 2"
            />
            {/* Nenúfares / Lirios estilizados */}
            <circle cx="420" cy="257" r="4" fill="#10B981" opacity="0.7" />
            <circle cx="495" cy="254" r="5" fill="#10B981" opacity="0.6" />
            <circle cx="570" cy="260" r="4.5" fill="#10B981" opacity="0.7" />
            <text
              x="500"
              y="262"
              textAnchor="middle"
              fill="#7DD3FC"
              fontSize="9"
              fontWeight="700"
              fontFamily="sans-serif"
              letterSpacing="1.5"
            >
              ESTANQUE DE LIRIOS
            </text>
          </g>

          {/* ================= ICONO ESTILIZADO DE 'EL PARAGUAS' ================= */}
          {/* Monumental columna de concreto con cubierta de bronce y caída de agua */}
          <g transform="translate(500, 455)">
            {/* Espejo de agua circular con bruma */}
            <circle cx="0" cy="0" r="95" fill="url(#paraguasWater)" stroke="#0284C7" strokeWidth="1" opacity="0.8" />
            <circle cx="0" cy="0" r="75" fill="none" stroke="#38BDF8" strokeDasharray="3 3" strokeWidth="0.8" opacity="0.6" />
            <circle cx="0" cy="0" r="55" fill="none" stroke="#7DD3FC" strokeDasharray="2 4" strokeWidth="0.6" opacity="0.4" />

            {/* 16 Radios de la cubierta suspendida de bronce diseñada por Pedro Ramírez Vázquez */}
            {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5].map((deg) => (
              <line
                key={deg}
                x1="0"
                y1="0"
                x2={75 * Math.cos((deg * Math.PI) / 180)}
                y2={75 * Math.sin((deg * Math.PI) / 180)}
                stroke="#475569"
                strokeWidth="0.75"
                opacity="0.6"
              />
            ))}

            {/* Anillo de caída de agua */}
            <circle cx="0" cy="0" r="28" fill="none" stroke="#38BDF8" strokeWidth="1.5" opacity="0.9" />

            {/* Columna central monolítica de bronce */}
            <circle cx="0" cy="0" r="14" fill="#B45309" stroke="#FDE68A" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="5" fill="#F59E0B" />

            {/* Leyenda editorial bajo El Paraguas */}
            <text
              x="0"
              y="115"
              textAnchor="middle"
              fill="#E2E8F0"
              fontSize="12"
              fontWeight="bold"
              fontFamily="sans-serif"
              letterSpacing="0.5"
            >
              «El Paraguas»
            </text>
            <text
              x="0"
              y="130"
              textAnchor="middle"
              fill="#94A3B8"
              fontSize="9"
              fontWeight="500"
              fontFamily="sans-serif"
            >
              Columna Central Esculpida · Caída de Agua
            </text>
          </g>

          {/* ACCESO PRINCIPAL / VESTÍBULO MONUMENTAL (Sur / Entrada) */}
          <g transform="translate(500, 715)">
            <rect
              x="-110"
              y="-15"
              width="220"
              height="28"
              rx="6"
              fill="#181C26"
              stroke="#334155"
              strokeWidth="1.5"
            />
            {/* Glifo de flechas de entrada */}
            <path d="M -90 -2 L -84 2 L -90 6" fill="none" stroke="#F59E0B" strokeWidth="1.5" />
            <path d="M 90 -2 L 84 2 L 90 6" fill="none" stroke="#F59E0B" strokeWidth="1.5" />
            <text
              x="0"
              y="4"
              textAnchor="middle"
              fill="#CBD5E1"
              fontSize="11"
              fontWeight="bold"
              fontFamily="sans-serif"
              letterSpacing="2"
            >
              ENTRADA Y VESTÍBULO
            </text>
          </g>

          {/* ================= RENDERIZADO DE LAS SALAS PERIMETRALES ================= */}
          {activeRoomsList.map((room) => {
            const active = isRoomActive(room);
            const isHovered = hoveredRoom?.id === room.id;
            const piecesCount = getRoomPiecesCount(room);

            // Estilo arquitectónico:
            // Relleno neutro oscuro (#1B1E26), bordes sutiles en vidrio (#2E3440)
            // Activa o hovered: iluminación con destello ámbar solar (#F59E0B)
            let fillColor = '#1B1E26';
            let strokeColor = '#2E3440';
            let strokeWidth = 1.2;
            let textColor = '#E5E7EB';
            let badgeBg = '#222734';
            let badgeBorder = '#374151';
            let badgeText = '#9CA3AF';

            if (active || isHovered) {
              fillColor = '#2D2214';
              strokeColor = '#F59E0B';
              strokeWidth = 2.5;
              textColor = '#FEF3C7';
              badgeBg = '#F59E0B';
              badgeBorder = '#F59E0B';
              badgeText = '#000000';
            }

            return (
              <g
                key={room.id}
                onClick={() => handleRoomClick(room)}
                onMouseEnter={() => setHoveredRoom(room)}
                onMouseLeave={() => setHoveredRoom(null)}
                className="cursor-pointer transition-all duration-200"
                filter={active || isHovered ? 'url(#solarGlow)' : 'url(#roomShadow)'}
              >
                {/* Rectángulo arquitectónico con esquinas biseladas rx="6" */}
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.w}
                  height={room.h}
                  rx={room.rx || 6}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  className="transition-colors duration-150"
                />

                {/* Badge circular fino con el número oficial */}
                <circle
                  cx={room.x + 22}
                  cy={room.y + 22}
                  r="12"
                  fill={badgeBg}
                  stroke={badgeBorder}
                  strokeWidth="1"
                />
                <text
                  x={room.x + 22}
                  y={room.y + 26}
                  textAnchor="middle"
                  fill={badgeText}
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {room.numStr}
                </text>

                {/* Nombre de la sala en tipografía nítida */}
                <text
                  x={room.x + 42}
                  y={room.y + 25}
                  fill={textColor}
                  fontSize={room.wing === 'cabecera' ? 13 : 11.5}
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {room.shortName.replace(/^\d+\.\s*/, '')}
                </text>

                {/* Conteo discreto de piezas */}
                <text
                  x={room.x + room.w - 12}
                  y={room.y + 23}
                  textAnchor="end"
                  fill="#64748B"
                  fontSize="9.5"
                  fontWeight="600"
                  fontFamily="sans-serif"
                >
                  {piecesCount} {piecesCount === 1 ? 'obra' : 'obras'}
                </text>

                {/* Subtítulo / Obras icónicas */}
                <text
                  x={room.x + 14}
                  y={room.y + (room.h > 80 ? 46 : 42)}
                  fill={active || isHovered ? '#FDE68A' : '#94A3B8'}
                  fontSize={room.h > 85 ? 10 : 9}
                  fontWeight="400"
                  fontFamily="sans-serif"
                >
                  {room.sub}
                </text>

                {/* Línea decorativa inferior sutil en sala activa */}
                {(active || isHovered) && (
                  <line
                    x1={room.x + 10}
                    y1={room.y + room.h - 4}
                    x2={room.x + room.w - 10}
                    y2={room.y + room.h - 4}
                    stroke="#F59E0B"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )}
              </g>
            );
          })}

          {/* ================= BRÚJULA ARQUITECTÓNICA (Esquina Inferior Izquierda) ================= */}
          <g transform="translate(45, 710)">
            <circle cx="0" cy="0" r="18" fill="#141720" stroke="#2E3440" strokeWidth="1" />
            {/* Aguja Norte (Apuntando hacia Sala Mexica / Cabecera) */}
            <polygon points="0,-14 4,0 0,4" fill="#F59E0B" />
            <polygon points="0,14 4,0 0,-4" fill="#334155" />
            <polygon points="0,-14 -4,0 0,4" fill="#D97706" />
            <polygon points="0,14 -4,0 0,-4" fill="#1E293B" />
            <text x="0" y="-18" textAnchor="middle" fill="#F59E0B" fontSize="9" fontWeight="bold">
              N
            </text>
          </g>

          {/* ================= LEYENDA ARQUITECTÓNICA (Esquina Inferior Derecha) ================= */}
          <g transform="translate(955, 715)">
            <text x="0" y="-8" textAnchor="end" fill="#64748B" fontSize="9" fontWeight="bold" letterSpacing="0.5">
              ARQ. PEDRO RAMÍREZ VÁZQUEZ (1964)
            </text>
            <text x="0" y="6" textAnchor="end" fill="#475569" fontSize="8" fontWeight="500">
              Escala Arquitectónica 1:500 • Formato Herradura U
            </text>
          </g>
        </svg>

        {/* TARJETA FLOTANTE PRO (TOOLTIP AL PASAR EL DEDO / CURSOR) */}
        {hoveredRoom && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-4 py-2.5 rounded-xl bg-[#141419]/95 backdrop-blur-md border border-[#F59E0B]/60 shadow-xl text-center max-w-xs animate-fadeIn">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#F59E0B] block">
              SALA {hoveredRoom.numStr} • {hoveredRoom.piso === 'PB' ? 'PLANTA BAJA' : 'PLANTA ALTA'}
            </span>
            <p className="text-xs font-bold text-white leading-tight mt-0.5">{hoveredRoom.name}</p>
            <span className="text-[10px] text-stone-400 mt-1 inline-block">
              {getRoomPiecesCount(hoveredRoom)} obras maestras · Toca para abrir sala
            </span>
          </div>
        )}

        {/* PIE DE MAPA CON LEYENDA DISCRETA */}
        <div className="absolute bottom-2 left-3 right-3 px-3 py-1.5 rounded-xl flex items-center justify-between text-[11px] backdrop-blur-md bg-black/60 border border-white/10 text-stone-300">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-xs" />
            <span className="font-semibold text-white">
              {selectedFloor === 'PB'
                ? 'Planta Baja · 12 Salas de Arqueología'
                : 'Planta Alta · 11 Salas de Etnografía'}
            </span>
          </div>
          <span className="text-[10px] text-[#F59E0B] font-bold">Toca cualquier sala para explorar</span>
        </div>
      </div>
    </div>
  );
};

export default MuseumMapSvg;
