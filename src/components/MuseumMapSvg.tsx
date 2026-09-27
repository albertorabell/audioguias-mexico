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
  isMonumental?: boolean;
  wing: 'poniente' | 'norte' | 'oriente' | 'sur';
}

// ================= Planta Baja: Arqueología (Salas 00 a 11) =================
// Geometría en U de Pedro Ramírez Vázquez (viewBox: 0 0 900 650)
const PB_ROOMS: MapRoomDef[] = [
  // --- Ala Poniente (Oeste / Izquierda: x=35, w=215) ---
  {
    numStr: '01',
    id: 'sala-01-introduccion-antropologia',
    aliases: ['sala-1', 'sala-01', 'introduccion_antropologia', 'intro-antropologia'],
    name: 'Introducción a la Antropología',
    shortName: '01. Intro Antropología',
    sub: 'Evolución y hominización',
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
    aliases: ['sala-2', 'sala-02', 'poblamiento', 'poblamiento_de_america'],
    name: 'Poblamiento de América',
    shortName: '02. Poblamiento América',
    sub: 'Estrecho de Bering · Fósiles',
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
    aliases: ['sala-3', 'sala-03', 'preclasico', 'altiplano'],
    name: 'Preclásico en el Altiplano Central',
    shortName: '03. Preclásico Altiplano',
    sub: 'Tlatilco · Cuicuilco',
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
    aliases: ['sala-4', 'sala-04', 'teotihuacan', 'chalchiuhtlicue'],
    name: 'Teotihuacán',
    shortName: '04. Teotihuacán',
    sub: 'Ciudad de los Dioses · Pirámides',
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
    aliases: ['sala-5', 'sala-05', 'tolteca', 'toltecas', 'epiclasico'],
    name: 'Los Toltecas y su época',
    shortName: '05. Tolteca y Epiclásico',
    sub: 'Atlantes de Tula · Xochicalco',
    piso: 'PB',
    x: 35,
    y: 145,
    w: 215,
    h: 70,
    rx: 6,
    wing: 'poniente',
  },

  // --- Cabecera Norte (Fondo al Centro: x=265, y=35, w=370, h=100) ---
  {
    numStr: '06',
    id: 'sala-06-mexica',
    aliases: ['sala-6', 'sala-06', 'mexica', 'azteca', 'tenochtitlan'],
    name: 'Mexica',
    shortName: '06. Mexica (Altar Central)',
    sub: 'Piedra del Sol · Coatlicue · Templo Mayor',
    piso: 'PB',
    x: 265,
    y: 35,
    w: 370,
    h: 100,
    rx: 6,
    isMonumental: true,
    wing: 'norte',
  },

  // --- Ala Oriente (Este / Derecha: x=650, w=215) ---
  {
    numStr: '07',
    id: 'sala-07-oaxaca',
    aliases: ['sala-7', 'sala-07', 'oaxaca', 'zapoteca', 'mixteca'],
    name: 'Oaxaca',
    shortName: '07. Oaxaca (Zapotecos)',
    sub: 'Monte Albán · Tumba 7 · Mixtecos',
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
    aliases: ['sala-8', 'sala-08', 'costa-del-golfo', 'golfo', 'olmeca', 'huasteca'],
    name: 'Culturas de la Costa del Golfo',
    shortName: '08. Costa del Golfo',
    sub: 'Cabezas Colosales Olmecas · Tajín',
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
    aliases: ['sala-9', 'sala-09', 'maya', 'palenque', 'chichen'],
    name: 'Maya',
    shortName: '09. Maya',
    sub: 'Pakal · Dintel de Yaxchilán · Estelas',
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
    aliases: ['sala-10', 'occidente', 'tarascos', 'tzintzuntzan'],
    name: 'Culturas del Occidente',
    shortName: '10. Occidente de México',
    sub: 'Tumbas de Tiro · Colima · Tarascos',
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
    aliases: ['sala-11', 'norte', 'paquime', 'casas-grandes'],
    name: 'Culturas del Norte',
    shortName: '11. Norte de México',
    sub: 'Paquimé · Casas Grandes · Aridoamérica',
    piso: 'PB',
    x: 650,
    y: 470,
    w: 215,
    h: 60,
    rx: 6,
    wing: 'oriente',
  },

  // --- Cabecera Sur (Vestíbulo y Acceso: x=265, y=550, w=370, h=65) ---
  {
    numStr: '00',
    id: 'sala-00-exteriores',
    aliases: ['sala-0', 'sala-00', 'vestibulo', 'orientacion', 'exteriores', 'patio'],
    name: 'Arquitectura y Patio Central',
    shortName: '00. Vestíbulo y Acceso',
    sub: 'El Paraguas · Pedro Ramírez Vázquez',
    piso: 'PB',
    x: 265,
    y: 550,
    w: 370,
    h: 65,
    rx: 6,
    wing: 'sur',
  },
];

// ================= Planta Alta: 11 Salas de Etnografía (Salas 12 a 22) =================
// Distribución en herradura espejo sobre la planta alta
const PA_ROOMS: MapRoomDef[] = [
  // --- Ala Poniente (Salas 12 a 16: x=35, w=215) ---
  {
    numStr: '12',
    id: 'sala-12-introduccion-etnografia',
    aliases: ['sala-12', 'etnografia', 'intro-etnografia', 'pueblos-indios'],
    name: 'Introducción a la Etnografía',
    shortName: '12. Intro Etnografía',
    sub: 'Diversidad lingüística y cosmovisión',
    piso: 'PA',
    x: 35,
    y: 470,
    w: 215,
    h: 60,
    rx: 6,
    wing: 'poniente',
  },
  {
    numStr: '13',
    id: 'sala-13-otopames',
    aliases: ['sala-13', 'otopames', 'otomi', 'mazahua'],
    name: 'Otopames',
    shortName: '13. Otopames',
    sub: 'Otomíes, Mazahuas y Matlatzincas',
    piso: 'PA',
    x: 35,
    y: 395,
    w: 215,
    h: 60,
    rx: 6,
    wing: 'poniente',
  },
  {
    numStr: '14',
    id: 'sala-14-sierra-de-puebla',
    aliases: ['sala-14', 'sierra-de-puebla', 'puebla', 'totonacos-sierra'],
    name: 'Sierra de Puebla',
    shortName: '14. Sierra de Puebla',
    sub: 'Nahuas y Totonacos de la Sierra',
    piso: 'PA',
    x: 35,
    y: 320,
    w: 215,
    h: 60,
    rx: 6,
    wing: 'poniente',
  },
  {
    numStr: '15',
    id: 'sala-15-costa-del-golfo-huasteca',
    aliases: ['sala-15', 'costa-del-golfo-huasteca', 'huasteca', 'totonacapan'],
    name: 'Costa del Golfo: Huasteca y Totonacapan',
    shortName: '15. Golfo: Huasteca',
    sub: 'Tradición ritual, textiles y danzas',
    piso: 'PA',
    x: 35,
    y: 230,
    w: 215,
    h: 75,
    rx: 6,
    wing: 'poniente',
  },
  {
    numStr: '16',
    id: 'sala-16-mayas-de-la-selva-montana',
    aliases: ['sala-16', 'mayas-selva-montana', 'mayas-selva', 'tzeltal', 'tzotzil'],
    name: 'Pueblos Mayas de la Selva y Montaña',
    shortName: '16. Mayas Selva/Montaña',
    sub: 'Tzotziles, Tzeltales y Tojolabales',
    piso: 'PA',
    x: 35,
    y: 145,
    w: 215,
    h: 70,
    rx: 6,
    wing: 'poniente',
  },

  // --- Cabecera Norte (Fondo al Centro: x=265, y=35, w=370, h=100) ---
  {
    numStr: '17',
    id: 'sala-17-mayas-de-tierras-bajas',
    aliases: ['sala-17', 'mayas-tierras-bajas', 'mayas-peninsula', 'yucateco'],
    name: 'Pueblos Mayas de las Tierras Bajas',
    shortName: '17. Mayas Tierras Bajas',
    sub: 'Península de Yucatán y Chontal de Tabasco',
    piso: 'PA',
    x: 265,
    y: 35,
    w: 370,
    h: 100,
    rx: 6,
    isMonumental: true,
    wing: 'norte',
  },

  // --- Ala Oriente (Salas 18 a 22: x=650, w=215) ---
  {
    numStr: '18',
    id: 'sala-18-oaxaca-pueblos-indios-del-sur',
    aliases: ['sala-18', 'oaxaca-pueblos-indios', 'oaxaca-sur', 'zapotecos-sur'],
    name: 'Oaxaca: Pueblos Indios del Sur',
    shortName: '18. Oaxaca: Pueblos Sur',
    sub: 'Zapotecos, Mixtecos y Chatinos',
    piso: 'PA',
    x: 650,
    y: 145,
    w: 215,
    h: 70,
    rx: 6,
    wing: 'oriente',
  },
  {
    numStr: '19',
    id: 'sala-19-costa-del-pacifico-nahuas-mixtecos',
    aliases: ['sala-19', 'costa-del-pacifico', 'pacifico', 'nahuas-guerrero'],
    name: 'Costa del Pacífico: Nahuas y Mixtecos',
    shortName: '19. Costa del Pacífico',
    sub: 'Guerrero, Michoacán y Costa Chica',
    piso: 'PA',
    x: 650,
    y: 230,
    w: 215,
    h: 75,
    rx: 6,
    wing: 'oriente',
  },
  {
    numStr: '20',
    id: 'sala-20-pureecherio-tarascos',
    aliases: ['sala-20', 'pureecherio', 'purepecha', 'tarascos'],
    name: 'Puréecherio (Tarascos)',
    shortName: '20. Puréecherio (Purépechas)',
    sub: 'Meseta, Lago y Cañada de Michoacán',
    piso: 'PA',
    x: 650,
    y: 320,
    w: 215,
    h: 60,
    rx: 6,
    wing: 'oriente',
  },
  {
    numStr: '21',
    id: 'sala-21-el-gran-nayar-coras-huicholes',
    aliases: ['sala-21', 'el-gran-nayar', 'gran-nayar', 'wixarika', 'huichol'],
    name: 'El Gran Nayar: Coras y Huicholes',
    shortName: '21. El Gran Nayar',
    sub: 'Wixáritari, Na’ayeri, O’dam y Mexicaneros',
    piso: 'PA',
    x: 650,
    y: 395,
    w: 215,
    h: 60,
    rx: 6,
    wing: 'oriente',
  },
  {
    numStr: '22',
    id: 'sala-22-pueblos-del-norte-y-noroeste',
    aliases: ['sala-22', 'pueblos-del-norte', 'norte-noroeste', 'raramuri', 'yaqui'],
    name: 'Pueblos del Norte y Noroeste',
    shortName: '22. Pueblos del Norte',
    sub: 'Rarámuri, Yaqui, Mayo, Seri y Tepehuanos',
    piso: 'PA',
    x: 650,
    y: 470,
    w: 215,
    h: 60,
    rx: 6,
    wing: 'oriente',
  },

  // --- Cabecera Sur (Mirador Superior: x=265, y=550, w=370, h=65) ---
  {
    numStr: 'PA',
    id: 'sala-pa-mirador-acceso',
    aliases: ['mirador', 'terraza-pa', 'acceso-pa'],
    name: 'Mirador y Balcón Etnográfico',
    shortName: 'Mirador de Planta Alta',
    sub: 'Vista cenital a El Paraguas y Patio Central',
    piso: 'PA',
    x: 265,
    y: 550,
    w: 370,
    h: 65,
    rx: 6,
    wing: 'sur',
  },
];

export const MuseumMapSvg: React.FC<MuseumMapSvgProps> = ({
  rooms = [],
  selectedRoomId = null,
  onSelectRoom,
  stops = [],
  currentStopIndex,
  onSelectStop,
  activeFloor = 'PB',
  onFloorChange,
  showFloorSelector = true,
}) => {
  const [internalFloor, setInternalFloor] = useState<'PB' | 'PA'>(activeFloor);
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);

  useEffect(() => {
    if (activeFloor) {
      setInternalFloor(activeFloor);
    }
  }, [activeFloor]);

  const selectedFloor = onFloorChange ? activeFloor : internalFloor;

  const handleFloorSwitch = (floor: 'PB' | 'PA') => {
    setInternalFloor(floor);
    if (onFloorChange) {
      onFloorChange(floor);
    }
  };

  // Salas activas según el piso seleccionado
  const currentFloorRooms = useMemo(() => {
    return selectedFloor === 'PB' ? PB_ROOMS : PA_ROOMS;
  }, [selectedFloor]);

  // Contenedor de piezas registradas por sala en catálogo
  const piecesCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (rooms && rooms.length > 0) {
      rooms.forEach((r) => {
        const count = r.pieces_info?.length || r.featured_pieces?.length || 0;
        if (r.room_id) map[r.room_id.toLowerCase()] = count;
        if (r.id) map[r.id.toLowerCase()] = count;
        if ((r as any).aliases) {
          (r as any).aliases.forEach((al: string) => {
            map[al.toLowerCase()] = count;
          });
        }
        if (r.numero_oficial) {
          map[String(r.numero_oficial)] = count;
          map[`sala-${String(r.numero_oficial).padStart(2, '0')}`] = count;
        }
      });
    }
    return map;
  }, [rooms]);

  // Resolver roomId contra la definición SVG
  const isRoomActive = (roomDef: MapRoomDef) => {
    if (!selectedRoomId) return false;
    const target = selectedRoomId.toLowerCase().trim();
    if (roomDef.id.toLowerCase() === target) return true;
    if (roomDef.aliases.some((a) => a.toLowerCase() === target)) return true;
    const numMatch = target.match(/\d+/)?.[0];
    if (numMatch && parseInt(roomDef.numStr, 10) === parseInt(numMatch, 10)) return true;
    return false;
  };

  const handleRoomClick = (roomDef: MapRoomDef) => {
    if (onSelectRoom) {
      onSelectRoom(roomDef.id);
    }
  };

  // Paradas de ruta que caen en este piso
  const visibleStops = useMemo(() => {
    if (!stops || stops.length === 0) return [];
    return stops
      .map((stop, index) => {
        const stopRoomId = (stop.room_id || stop.room_zone || '').toLowerCase();
        const foundDef = currentFloorRooms.find(
          (def) =>
            def.id.toLowerCase() === stopRoomId ||
            def.aliases.some((a) => stopRoomId.includes(a.toLowerCase())) ||
            (def.numStr && stopRoomId.includes(def.numStr))
        );
        if (foundDef) {
          // Posición centrada en la sala
          return {
            ...stop,
            index,
            isCurrent: currentStopIndex === index,
            cx: foundDef.x + foundDef.w / 2,
            cy: foundDef.y + foundDef.h / 2,
          };
        }
        return null;
      })
      .filter(Boolean) as (RouteStop & { index: number; isCurrent: boolean; cx: number; cy: number })[];
  }, [stops, currentFloorRooms, currentStopIndex]);

  return (
    <div className="w-full flex flex-col items-center select-none font-sans">
      {/* 1. Selector de piso superior opcional */}
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
            <span>Planta Baja (Arqueología)</span>
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
            <span>Planta Alta (Etnografía)</span>
          </button>
        </div>
      )}

      {/* 2. RENDERIZADO DEL PLANO ARQUITECTÓNICO VECTORIAL:
             ViewBox optimizado: 0 0 900 650
             Fondo grafito profundo: #0A0C10
             Patio Central: #121721 con borde #1E293B
             El Paraguas estilizado al centro exacto (450, 342.5)
      */}
      <div className="w-full max-w-4xl aspect-[900/650] relative rounded-2xl overflow-hidden border border-[#2D3748]/70 bg-[#0A0C10] shadow-2xl">
        <svg
          viewBox="0 0 900 650"
          className="w-full h-full"
          role="img"
          aria-label={`Plano arquitectónico del Museo Nacional de Antropología - ${
            selectedFloor === 'PB' ? 'Planta Baja' : 'Planta Alta'
          }`}
        >
          <defs>
            {/* Cuadrícula arquitectónica milimétrica */}
            <pattern id="cadGrid" width="25" height="25" patternUnits="userSpaceOnUse">
              <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#161B24" strokeWidth="0.5" />
            </pattern>

            {/* Gradiente sutil para el Patio Central */}
            <linearGradient id="patioWaterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#141A26" stopOpacity="1" />
              <stop offset="100%" stopColor="#10151F" stopOpacity="1" />
            </linearGradient>

            {/* Textura sutil del Estanque de Lirios */}
            <linearGradient id="lilyWaterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0E2338" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#13334E" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0E2338" stopOpacity="0.9" />
            </linearGradient>

            {/* Cascada de El Paraguas */}
            <radialGradient id="umbrellaCascade" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.5" />
              <stop offset="30%" stopColor="#0284C7" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#0369A1" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#121721" stopOpacity="0" />
            </radialGradient>

            {/* Brillo solar dorado #F59E0B para hover / active */}
            <filter id="solarGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#F59E0B" floodOpacity="0.9" />
            </filter>

            {/* Sombra sutil de elevación de sala */}
            <filter id="softCardShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* 1. Base del Lienzo Arquitectónico: Fondo Grafito Profundo (#0A0C10) */}
          <rect x="0" y="0" width="900" height="650" fill="#0A0C10" />
          <rect x="0" y="0" width="900" height="650" fill="url(#cadGrid)" />

          {/* 2. PATIO CENTRAL MONUMENTAL (Proporción fiel en U)
                 x=265, y=150, w=370, h=385
                 Fondo #121721 con borde #1E293B
          */}
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

          {/* Textura sutil del Estanque de Lirios acuático en el tercio norte del patio */}
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
            {/* Lirios estilizados */}
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
              ESTANQUE DE LIRIOS
            </text>
          </g>

          {/* 3. ICONO / GLIFO ESTILIZADO DE "EL PARAGUAS" AL CENTRO EXACTO (cx=450, cy=342.5) */}
          <g transform="translate(450, 342.5)">
            {/* Anillos de ondas de agua concéntricas en el piso de piedra */}
            <circle cx="0" cy="0" r="68" fill="none" stroke="#38BDF8" strokeWidth="0.7" strokeDasharray="3 3" opacity="0.25" />
            <circle cx="0" cy="0" r="54" fill="none" stroke="#38BDF8" strokeWidth="0.8" opacity="0.35" />

            {/* Manto de caída de agua radial */}
            <circle cx="0" cy="0" r="44" fill="url(#umbrellaCascade)" />

            {/* Techumbre volada de concreto con costillas radiales (cantiléver) */}
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

            {/* Cortina circular de caída de agua con reflejos */}
            <circle cx="0" cy="0" r="28" fill="none" stroke="#38BDF8" strokeWidth="2" strokeDasharray="5 2.5" opacity="0.85" />
            <circle cx="0" cy="0" r="18" fill="none" stroke="#67E8F9" strokeWidth="1.2" opacity="0.7" />

            {/* Columna Monolítica Central de Bronce Esculpido */}
            <circle cx="0" cy="0" r="9" fill="#B45309" stroke="#F59E0B" strokeWidth="2" />
            <circle cx="0" cy="0" r="4" fill="#FDE68A" />

            {/* Rótulo tipográfico arquitectónico */}
            <text
              x="0"
              y="58"
              textAnchor="middle"
              fill="#F59E0B"
              fontSize="9"
              fontWeight="800"
              letterSpacing="1.5"
            >
              EL PARAGUAS
            </text>
            <text
              x="0"
              y="69"
              textAnchor="middle"
              fill="#9CA3AF"
              fontSize="7.5"
              fontFamily="sans-serif"
            >
              Pedro Ramírez Vázquez · 1964
            </text>
          </g>

          {/* 4. RENDERIZADO DE LAS SALAS EN HERRADURA (U) */}
          {currentFloorRooms.map((room) => {
            const isActive = isRoomActive(room);
            const isHovered = hoveredRoomId === room.id;
            const piecesCount = piecesCountMap[room.id.toLowerCase()] || (room.isMonumental ? 10 : 6);

            // Estilo según requerimiento:
            // Relleno neutro oscuro (#161A22), bordes precisos (#2D3748), esquinas rx="6"
            // Hover/active: iluminación en Oro Solar (#F59E0B)
            const roomFill = isActive || isHovered ? '#1E232F' : '#161A22';
            const roomStroke = isActive || isHovered ? '#F59E0B' : room.isMonumental ? '#4A5568' : '#2D3748';
            const strokeWidth = isActive || isHovered ? 2 : room.isMonumental ? 1.5 : 1.2;

            return (
              <g
                key={room.id}
                onClick={() => handleRoomClick(room)}
                onMouseEnter={() => setHoveredRoomId(room.id)}
                onMouseLeave={() => setHoveredRoomId(null)}
                className="cursor-pointer transition-all duration-150"
                role="button"
                tabIndex={0}
                aria-label={`${room.name} (${room.sub})`}
              >
                {/* Rectángulo Arquitectónico de la Sala */}
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.w}
                  height={room.h}
                  rx={room.rx || 6}
                  fill={roomFill}
                  stroke={roomStroke}
                  strokeWidth={strokeWidth}
                  filter={isActive || isHovered ? 'url(#solarGlow)' : 'url(#softCardShadow)'}
                />

                {/* Insignia Monumental para Sala Mexica (06) o Mayas (17) */}
                {room.isMonumental && (
                  <path
                    d={`M ${room.x + 8} ${room.y + 6} L ${room.x + room.w - 8} ${room.y + 6}`}
                    stroke="#F59E0B"
                    strokeWidth="2"
                    strokeDasharray="8 4"
                    opacity="0.8"
                  />
                )}

                {/* Pastilla Circular Discreta con Número de Sala */}
                <g transform={`translate(${room.x + 18}, ${room.y + (room.h > 70 ? 24 : room.h / 2)})`}>
                  <circle
                    cx="0"
                    cy="0"
                    r={room.numStr.length > 2 ? 14 : 11}
                    fill={isActive || isHovered ? '#F59E0B' : '#232936'}
                    stroke={isActive || isHovered ? '#FFFFFF' : '#3B4252'}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="3.5"
                    textAnchor="middle"
                    fill={isActive || isHovered ? '#000000' : '#E5E7EB'}
                    fontSize={room.numStr.length > 2 ? '8' : '10'}
                    fontWeight="800"
                    fontFamily="monospace"
                  >
                    {room.numStr}
                  </text>
                </g>

                {/* Título y Subtítulo de la Sala */}
                {room.isMonumental ? (
                  // Disposición monumental para cabecera central
                  <g>
                    <text
                      x={room.x + 42}
                      y={room.y + 30}
                      fill={isActive || isHovered ? '#F59E0B' : '#FFFFFF'}
                      fontSize="14"
                      fontWeight="800"
                      letterSpacing="0.5"
                    >
                      {room.shortName}
                    </text>
                    <text
                      x={room.x + 42}
                      y={room.y + 48}
                      fill="#9CA3AF"
                      fontSize="10"
                      fontWeight="500"
                    >
                      {room.sub}
                    </text>
                    {/* Badge de obras */}
                    <g transform={`translate(${room.x + room.w - 75}, ${room.y + 22})`}>
                      <rect x="0" y="0" width="65" height="18" rx="9" fill="#0B0E14" stroke="#F59E0B" strokeWidth="0.8" />
                      <text x="32.5" y="12.5" textAnchor="middle" fill="#F59E0B" fontSize="9" fontWeight="700">
                        ⭐ Monumental
                      </text>
                    </g>
                  </g>
                ) : (
                  // Disposición estándar en alas Poniente y Oriente
                  <g>
                    <text
                      x={room.x + 36}
                      y={room.y + (room.h > 65 ? 26 : 24)}
                      fill={isActive || isHovered ? '#F59E0B' : '#F3F4F6'}
                      fontSize={room.h > 65 ? '11.5' : '11'}
                      fontWeight="700"
                    >
                      {room.shortName}
                    </text>
                    <text
                      x={room.x + 36}
                      y={room.y + (room.h > 65 ? 42 : 40)}
                      fill="#8F96A3"
                      fontSize="9"
                      fontWeight="400"
                    >
                      {room.sub.length > 30 ? room.sub.slice(0, 28) + '...' : room.sub}
                    </text>
                    {/* Micro badge de obras */}
                    <text
                      x={room.x + room.w - 12}
                      y={room.y + 16}
                      textAnchor="end"
                      fill="#64748B"
                      fontSize="8"
                      fontFamily="monospace"
                    >
                      {piecesCount} obras
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* 5. PARADAS DE RECORRIDO (Pins flotantes dorados si hay ruta activa) */}
          {visibleStops.map((stop) => (
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
                r={stop.isCurrent ? 14 : 10}
                fill={stop.isCurrent ? '#F59E0B' : '#141419'}
                stroke={stop.isCurrent ? '#FFFFFF' : '#F59E0B'}
                strokeWidth={stop.isCurrent ? 2.5 : 1.8}
                filter="url(#solarGlow)"
              />
              <text
                x={stop.cx}
                y={stop.cy + 3.5}
                textAnchor="middle"
                fill={stop.isCurrent ? '#000000' : '#F59E0B'}
                fontSize={stop.isCurrent ? '10' : '8.5'}
                fontWeight="900"
                fontFamily="monospace"
              >
                {stop.index + 1}
              </text>
            </g>
          ))}

          {/* 6. BRÚJULA ARQUITECTÓNICA VECTORIAL (Discreta, esquina superior derecha: 840, 50) */}
          <g transform="translate(845, 55)">
            <circle cx="0" cy="0" r="16" fill="#141822" stroke="#2D3748" strokeWidth="1" />
            {/* Flecha Norte */}
            <polygon points="0,-12 4,0 -4,0" fill="#EF4444" />
            {/* Flecha Sur */}
            <polygon points="0,12 4,0 -4,0" fill="#6B7280" />
            <text x="0" y="-14" textAnchor="middle" fill="#EF4444" fontSize="8" fontWeight="800">
              N
            </text>
            <text x="0" y="21" textAnchor="middle" fill="#9CA3AF" fontSize="7" fontWeight="600">
              S
            </text>
          </g>

          {/* 7. LEYENDA TÉCNICA DISCRETA (Esquina inferior izquierda: 35, 620) */}
          <g transform="translate(35, 625)">
            <text fill="#64748B" fontSize="9" fontFamily="sans-serif">
              🏛️ Museo Nacional de Antropología • Distribución en Herradura (U)
            </text>
          </g>

          {/* 8. LEYENDA DEL PISO ACTIVO (Esquina inferior derecha) */}
          <g transform="translate(865, 625)">
            <text textAnchor="end" fill="#F59E0B" fontSize="9" fontWeight="700" fontFamily="sans-serif">
              {selectedFloor === 'PB' ? 'Nivel PB • Arqueología (12 Salas)' : 'Nivel PA • Etnografía (11 Salas)'}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default MuseumMapSvg;
