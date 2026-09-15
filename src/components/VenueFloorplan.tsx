import React from 'react';
import { useTheme } from '../utils/ThemeContext';

interface VenueFloorplanProps {
  siteId: string;
}

export const VenueFloorplan: React.FC<VenueFloorplanProps> = ({ siteId }) => {
  const { isSunMode } = useTheme();

  // Schematic architectural palette adapted to Sol/Museo theme
  const colors = isSunMode
    ? {
        bg: '#F5EFEB',
        wall: '#E3DAC9',
        wallStroke: '#A89F91',
        courtyard: '#FAF7F2',
        courtyardStroke: '#D1C7B7',
        highlightRoom: '#FEF3C7',
        highlightStroke: '#B45309',
        room: '#EDE4D8',
        roomStroke: '#C4B9A8',
        textMain: '#1C1917',
        textMuted: '#78716C',
        accent: '#92400E',
        accentLight: '#FDE68A',
        water: '#0284C7',
        garden: '#D1FAE5',
        gardenStroke: '#059669',
        trail: '#D97706',
        grid: '#E7DFD5',
      }
    : {
        bg: '#0C0A09',
        wall: '#1C1917',
        wallStroke: '#44403C',
        courtyard: '#141210',
        courtyardStroke: '#292524',
        highlightRoom: '#451A03',
        highlightStroke: '#F59E0B',
        room: '#171412',
        roomStroke: '#292524',
        textMain: '#F5F5F4',
        textMuted: '#A8A29E',
        accent: '#FBBF24',
        accentLight: '#78350F',
        water: '#38BDF8',
        garden: '#064E3B',
        gardenStroke: '#10B981',
        trail: '#F59E0B',
        grid: '#292524',
      };

  if (siteId === 'MNA') {
    return (
      <svg viewBox="0 0 800 600" className="w-full h-full select-none" preserveAspectRatio="xMidYMid meet">
        {/* Canvas Background */}
        <rect width="800" height="600" fill={colors.bg} rx="16" />

        {/* Subtle architectural grid */}
        <defs>
          <pattern id="mna-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="40" y2="0" stroke={colors.grid} strokeWidth="0.5" opacity="0.4" />
            <line x1="0" y1="0" x2="0" y2="40" stroke={colors.grid} strokeWidth="0.5" opacity="0.4" />
          </pattern>
        </defs>
        <rect width="800" height="600" fill="url(#mna-grid)" />

        {/* Museum Main Outer Boundary */}
        <rect x="110" y="35" width="580" height="530" rx="14" fill={colors.wall} stroke={colors.wallStroke} strokeWidth="2.5" />

        {/* Central Courtyard (Patio Central) */}
        <rect x="220" y="180" width="360" height="260" rx="8" fill={colors.courtyard} stroke={colors.courtyardStroke} strokeWidth="1.5" />

        {/* Sala Mexica (North Main Hall) - Stop location area */}
        <path d="M220,45 L580,45 L580,170 L220,170 Z" fill={colors.highlightRoom} stroke={colors.highlightStroke} strokeWidth="2.5" />
        <text x="400" y="80" fill={colors.accent} fontSize="14" fontWeight="900" textAnchor="middle" letterSpacing="1">
          SALA MEXICA (PRINCIPAL)
        </text>
        <text x="400" y="102" fill={colors.textMuted} fontSize="11" fontWeight="600" textAnchor="middle">
          Piedra del Sol • Coatlicue • Coyolxauhqui
        </text>

        {/* Specific zone markings in Sala Mexica */}
        {/* Piedra del Sol dais (50%, 24%) -> cx: 400, cy: 144 */}
        <circle cx="400" cy="144" r="32" fill={colors.accent} fillOpacity="0.15" stroke={colors.accent} strokeWidth="1.5" strokeDasharray="3 3" />
        <text x="400" y="148" fill={colors.accent} fontSize="9" fontWeight="800" textAnchor="middle">
          Ábside Altar Sol
        </text>

        {/* Coatlicue alcove (38%, 38%) -> cx: 304, cy: 228 */}
        <rect x="270" y="195" width="70" height="45" rx="6" fill={colors.accent} fillOpacity="0.12" stroke={colors.accent} strokeWidth="1.5" strokeDasharray="3 3" />
        <text x="305" y="222" fill={colors.accent} fontSize="9" fontWeight="800" textAnchor="middle">
          Coatlicue
        </text>

        {/* El Paraguas (Fountain) in Patio */}
        <circle cx="400" cy="310" r="48" fill={colors.water} opacity="0.35" />
        <circle cx="400" cy="310" r="26" fill={colors.accent} opacity="0.3" stroke={colors.accent} strokeWidth="2" />
        <circle cx="400" cy="310" r="7" fill={colors.accent} />
        <text x="400" y="348" fill={colors.textMain} fontSize="11" fontWeight="700" textAnchor="middle">
          Fuente El Paraguas
        </text>

        {/* Lateral Rooms West */}
        <rect x="120" y="180" width="90" height="120" rx="6" fill={colors.room} stroke={colors.roomStroke} strokeWidth="1.5" />
        <text x="165" y="245" fill={colors.textMain} fontSize="11" fontWeight="700" textAnchor="middle">Teotihuacán</text>

        <rect x="120" y="310" width="90" height="130" rx="6" fill={colors.room} stroke={colors.roomStroke} strokeWidth="1.5" />
        <text x="165" y="380" fill={colors.textMain} fontSize="11" fontWeight="700" textAnchor="middle">Tolteca</text>

        {/* Lateral Rooms East */}
        <rect x="590" y="180" width="90" height="120" rx="6" fill={colors.room} stroke={colors.roomStroke} strokeWidth="1.5" />
        <text x="635" y="245" fill={colors.textMain} fontSize="11" fontWeight="700" textAnchor="middle">Oaxaca</text>

        <rect x="590" y="310" width="90" height="130" rx="6" fill={colors.room} stroke={colors.roomStroke} strokeWidth="1.5" />
        <text x="635" y="380" fill={colors.textMain} fontSize="11" fontWeight="700" textAnchor="middle">Maya</text>

        {/* South Vestibule (Entrance) */}
        <rect x="220" y="450" width="360" height="100" rx="8" fill={colors.room} stroke={colors.roomStroke} strokeWidth="2" />
        <text x="400" y="495" fill={colors.textMain} fontSize="13" fontWeight="900" textAnchor="middle">
          ACCESO PRINCIPAL • VESTÍBULO
        </text>
        <text x="400" y="515" fill={colors.textMuted} fontSize="10" fontWeight="600" textAnchor="middle">
          Paseo de la Reforma • Taquilla y Guardarropa
        </text>

        {/* Walking Trail suggestion */}
        <path d="M400,450 L400,370 L305,310 L305,228 L400,144" fill="none" stroke={colors.trail} strokeWidth="2" strokeDasharray="5 4" opacity="0.6" />

        {/* Compass */}
        <g transform="translate(730, 75)">
          <circle cx="0" cy="0" r="20" fill={colors.wall} stroke={colors.wallStroke} strokeWidth="1.5" />
          <polygon points="0,-16 4,-3 0,0 -4,-3" fill="#EF4444" />
          <polygon points="0,16 4,3 0,0 -4,3" fill={colors.textMuted} />
          <text x="0" y="-19" fill="#EF4444" fontSize="10" fontWeight="900" textAnchor="middle">N</text>
        </g>
      </svg>
    );
  }

  if (siteId === 'TEOTIHUACAN') {
    return (
      <svg viewBox="0 0 800 600" className="w-full h-full select-none" preserveAspectRatio="xMidYMid meet">
        {/* Canvas Background */}
        <rect width="800" height="600" fill={colors.bg} rx="16" />

        {/* Calzada de los Muertos Axis (Runs North to South) */}
        <rect x="350" y="40" width="100" height="520" rx="6" fill={colors.courtyard} stroke={colors.courtyardStroke} strokeWidth="2" />
        <text x="400" y="300" fill={colors.textMuted} fontSize="11" fontWeight="800" transform="rotate(-90 400 300)" letterSpacing="5">
          CALZADA DE LOS MUERTOS
        </text>

        {/* Pirámide de la Luna (North) */}
        <rect x="325" y="45" width="150" height="75" rx="8" fill={colors.wall} stroke={colors.wallStroke} strokeWidth="2" />
        <rect x="355" y="55" width="90" height="55" fill={colors.room} stroke={colors.roomStroke} strokeWidth="1.5" />
        <text x="400" y="86" fill={colors.textMain} fontSize="12" fontWeight="800" textAnchor="middle">
          Pirámide de la Luna
        </text>

        {/* Pirámide del Sol */}
        <g transform="translate(470, 190)">
          <rect x="0" y="0" width="160" height="150" rx="10" fill={colors.highlightRoom} stroke={colors.highlightStroke} strokeWidth="2.5" />
          <rect x="20" y="20" width="120" height="110" fill={colors.wall} stroke={colors.highlightStroke} strokeWidth="1.5" />
          <rect x="42" y="40" width="76" height="70" fill={colors.accentLight} opacity="0.4" stroke={colors.accent} strokeWidth="1.5" />
          <rect x="62" y="58" width="36" height="34" fill={colors.accent} opacity="0.3" stroke={colors.accent} strokeWidth="2" />
          <text x="80" y="79" fill={colors.accent} fontSize="11" fontWeight="900" textAnchor="middle">SOL</text>
          <text x="80" y="172" fill={colors.accent} fontSize="13" fontWeight="900" textAnchor="middle">
            PIRÁMIDE DEL SOL
          </text>
          <text x="80" y="188" fill={colors.textMuted} fontSize="10" fontWeight="600" textAnchor="middle">
            Base: 225m • Altura: 65m
          </text>
        </g>
        {/* Plataforma adosada */}
        <rect x="445" y="235" width="30" height="60" rx="3" fill={colors.wall} stroke={colors.wallStroke} strokeWidth="1" />

        {/* Río San Juan */}
        <line x1="80" y1="410" x2="720" y2="410" stroke="#0284C7" strokeWidth="3" strokeDasharray="8 5" opacity="0.45" />
        <text x="670" y="402" fill="#0284C7" fontSize="10" fontWeight="700">Río San Juan</text>

        {/* La Ciudadela & Templo de la Serpiente */}
        <g transform="translate(280, 435)">
          <rect x="0" y="0" width="240" height="140" rx="10" fill={colors.wall} stroke={colors.highlightStroke} strokeWidth="2" />
          <rect x="20" y="15" width="200" height="110" fill={colors.courtyard} stroke={colors.courtyardStroke} strokeWidth="1" />
          {/* Templo Quetzalcóatl */}
          <rect x="75" y="40" width="90" height="60" rx="6" fill={colors.highlightRoom} stroke={colors.highlightStroke} strokeWidth="2" />
          <text x="120" y="65" fill={colors.accent} fontSize="11" fontWeight="900" textAnchor="middle">
            SERPIENTE EMPLUMADA
          </text>
          <text x="120" y="80" fill={colors.textMuted} fontSize="9" fontWeight="700" textAnchor="middle">
            Templo de Quetzalcóatl
          </text>
          <text x="120" y="142" fill={colors.accent} fontSize="11" fontWeight="800" textAnchor="middle">
            RECINTO LA CIUDADELA
          </text>
        </g>

        {/* Walking trail */}
        <path d="M544,270 L400,270 L400,504" fill="none" stroke={colors.trail} strokeWidth="2.5" strokeDasharray="6 4" opacity="0.6" />

        {/* Compass */}
        <g transform="translate(730, 75)">
          <circle cx="0" cy="0" r="20" fill={colors.wall} stroke={colors.wallStroke} strokeWidth="1.5" />
          <polygon points="0,-16 4,-3 0,0 -4,-3" fill="#EF4444" />
          <polygon points="0,16 4,3 0,0 -4,3" fill={colors.textMuted} />
          <text x="0" y="-19" fill="#EF4444" fontSize="10" fontWeight="900" textAnchor="middle">N</text>
        </g>
      </svg>
    );
  }

  // Chapultepec default
  return (
    <svg viewBox="0 0 800 600" className="w-full h-full select-none" preserveAspectRatio="xMidYMid meet">
      {/* Canvas Background */}
      <rect width="800" height="600" fill={colors.bg} rx="16" />

      {/* Cerro del Chapulín topography outline */}
      <ellipse cx="400" cy="300" rx="360" ry="260" fill={colors.courtyard} stroke={colors.courtyardStroke} strokeWidth="2" />

      {/* Castle Main Outer Fortification */}
      <rect x="140" y="100" width="520" height="400" rx="16" fill={colors.wall} stroke={colors.wallStroke} strokeWidth="2.5" />

      {/* Jardín del Alcázar (Nivel Terraza Superior) */}
      <rect x="320" y="140" width="310" height="150" rx="8" fill={colors.garden} stroke={colors.gardenStroke} strokeWidth="1.5" />
      <circle cx="475" cy="215" r="26" fill={colors.water} opacity="0.4" stroke={colors.water} strokeWidth="1.5" />
      <text x="475" y="220" fill={colors.accent} fontSize="11" fontWeight="800" textAnchor="middle">
        Jardín de la Emperatriz
      </text>

      {/* Torre del Caballero Alto */}
      <circle cx="400" cy="132" r="34" fill={colors.wall} stroke={colors.highlightStroke} strokeWidth="2" />
      <circle cx="400" cy="132" r="18" fill={colors.courtyard} stroke={colors.highlightStroke} strokeWidth="1.5" />
      <text x="400" y="85" fill={colors.accent} fontSize="12" fontWeight="900" textAnchor="middle">
        TORRE DEL CABALLERO ALTO
      </text>

      {/* Patio de Armas / Explanada Central */}
      <rect x="270" y="310" width="260" height="160" rx="8" fill={colors.courtyard} stroke={colors.courtyardStroke} strokeWidth="1.5" />
      <text x="400" y="395" fill={colors.textMain} fontSize="13" fontWeight="800" textAnchor="middle">
        Patio de Armas del Alcázar
      </text>

      {/* Salas del Carruaje */}
      <g transform="translate(160, 350)">
        <rect x="0" y="0" width="130" height="125" rx="8" fill={colors.highlightRoom} stroke={colors.highlightStroke} strokeWidth="2" />
        <text x="65" y="45" fill={colors.accent} fontSize="11" fontWeight="900" textAnchor="middle">
          SALAS DEL CARRUAJE
        </text>
        <text x="65" y="65" fill={colors.textMain} fontSize="10" fontWeight="700" textAnchor="middle">
          Carruaje de Benito Juárez
        </text>
        <text x="65" y="85" fill={colors.textMuted} fontSize="9" fontWeight="600" textAnchor="middle">
          Planta Baja • Acceso Rampa
        </text>
      </g>

      {/* Habitación de Carlota */}
      <g transform="translate(510, 155)">
        <rect x="0" y="0" width="135" height="115" rx="8" fill={colors.highlightRoom} stroke={colors.highlightStroke} strokeWidth="2" />
        <text x="67" y="45" fill={colors.accent} fontSize="11" fontWeight="900" textAnchor="middle">
          ALCÁZAR IMPERIAL
        </text>
        <text x="67" y="65" fill={colors.textMain} fontSize="10" fontWeight="700" textAnchor="middle">
          Habitación de Carlota
        </text>
        <text x="67" y="85" fill={colors.textMuted} fontSize="9" fontWeight="600" textAnchor="middle">
          Planta Alta • Vista a Reforma
        </text>
      </g>

      {/* Terraza Balcón Mirador con vista a Paseo de la Reforma */}
      <line x1="645" y1="120" x2="645" y2="480" stroke={colors.accent} strokeWidth="2.5" strokeDasharray="6 4" opacity="0.5" />
      <text x="655" y="300" fill={colors.accent} fontSize="10" fontWeight="800" transform="rotate(90 655 300)">
        MIRADOR PASEO DE LA REFORMA
      </text>

      {/* Walking trail */}
      <path d="M224,408 L400,390 L475,215 L576,216" fill="none" stroke={colors.trail} strokeWidth="2" strokeDasharray="5 4" opacity="0.6" />

      {/* Compass */}
      <g transform="translate(730, 75)">
        <circle cx="0" cy="0" r="20" fill={colors.wall} stroke={colors.wallStroke} strokeWidth="1.5" />
        <polygon points="0,-16 4,-3 0,0 -4,-3" fill="#EF4444" />
        <polygon points="0,16 4,3 0,0 -4,3" fill={colors.textMuted} />
        <text x="0" y="-19" fill="#EF4444" fontSize="10" fontWeight="900" textAnchor="middle">N</text>
      </g>
    </svg>
  );
};
