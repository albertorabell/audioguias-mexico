import React from 'react';
import { ChevronLeft, ChevronDown, Lock, ShieldCheck, Map } from 'lucide-react';
import { SiteRoute } from '../types';
import { formatRemainingHours } from '../utils/license';
import { useTheme } from '../utils/ThemeContext';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  onBack: () => void;
  activeRoute: SiteRoute | null;
  currentStopIndex: number;
  totalStops: number;
  hasPass: boolean;
  passExpiresAt?: number;
  onOpenRouteModal: () => void;
  onOpenPaywallModal: () => void;
  onOpenMapModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onBack,
  activeRoute,
  currentStopIndex,
  totalStops,
  hasPass,
  passExpiresAt,
  onOpenRouteModal,
  onOpenPaywallModal,
  onOpenMapModal,
}) => {
  const { isSunMode } = useTheme();

  return (
    <header
      className={`sticky top-0 z-30 px-3 py-2 flex items-center justify-between gap-1.5 backdrop-blur-md transition-colors duration-200 border-b ${
        isSunMode
          ? 'bg-white/95 border-stone-300 shadow-xs text-stone-900'
          : 'bg-stone-950/95 border-stone-800/80 text-stone-100'
      }`}
    >
      {/* Botón Atrás (mínimo 48px de altura táctil) */}
      <button
        id="btn-nav-back"
        onClick={onBack}
        className={`min-h-[48px] min-w-[48px] flex items-center justify-center gap-1 px-2.5 rounded-xl transition active:scale-95 ${
          isSunMode
            ? 'text-stone-800 hover:bg-stone-100 border border-stone-200'
            : 'text-stone-300 hover:text-white hover:bg-stone-800/60 border border-transparent'
        }`}
        aria-label="Regresar al catálogo de sitios"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="text-xs font-semibold hidden xs:inline">Sitios</span>
      </button>

      {/* Selector de Itinerario (mínimo 48px de altura táctil) */}
      <button
        id="btn-route-selector"
        onClick={onOpenRouteModal}
        className={`flex-1 min-h-[48px] mx-0.5 flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl border text-left group active:scale-98 transition ${
          isSunMode
            ? 'bg-stone-50 border-stone-300 hover:border-amber-600 shadow-xs'
            : 'bg-stone-900 border-stone-700/80 hover:border-amber-500/60'
        }`}
      >
        <div className="truncate">
          <p
            className={`text-[10px] uppercase font-extrabold tracking-wider truncate ${
              isSunMode ? 'text-amber-800' : 'text-amber-400'
            }`}
          >
            {activeRoute ? activeRoute.name : 'Itinerario'}
          </p>
          <p
            className={`text-xs font-bold truncate ${
              isSunMode ? 'text-stone-900' : 'text-stone-200'
            }`}
          >
            Parada {currentStopIndex + 1} de {totalStops}
          </p>
        </div>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition ${
            isSunMode ? 'text-stone-600 group-hover:text-amber-800' : 'text-stone-400 group-hover:text-amber-400'
          }`}
        />
      </button>

      {/* Botón Ver Mapa Interactivo (mínimo 48px de altura táctil) */}
      <button
        id="btn-open-map-nav"
        onClick={onOpenMapModal}
        className={`min-h-[48px] px-2.5 flex items-center justify-center gap-1 rounded-xl border text-xs font-bold transition active:scale-95 ${
          isSunMode
            ? 'bg-amber-50 border-stone-300 text-amber-900 hover:bg-amber-100 hover:border-amber-600'
            : 'bg-stone-900 border-stone-700/80 text-amber-400 hover:bg-stone-800 hover:border-amber-500'
        }`}
        title="Ver plano y mapa interactivo de paradas"
      >
        <Map className="w-4 h-4" />
        <span className="hidden xs:inline">Mapa</span>
      </button>

      {/* Switch de Tema Adaptativo (☀️ / 🌙) */}
      <ThemeToggle />

      {/* Indicador de Pase (mínimo 48px de altura táctil) */}
      {hasPass ? (
        <button
          id="btn-pass-active-status"
          onClick={onOpenPaywallModal}
          className={`min-h-[48px] flex items-center gap-1.5 px-3 rounded-xl text-xs font-bold shadow-xs transition active:scale-95 border ${
            isSunMode
              ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
              : 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80 hover:bg-emerald-900/80'
          }`}
          title={passExpiresAt ? `Válido por ${formatRemainingHours(passExpiresAt)}` : 'Pase Activo'}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-[11px] whitespace-nowrap">PASE ACTIVO</span>
        </button>
      ) : (
        <button
          id="btn-unlock-pass-nav"
          onClick={onOpenPaywallModal}
          className={`min-h-[48px] flex items-center gap-1.5 px-3 rounded-xl text-xs font-bold shadow-xs transition active:scale-95 ${
            isSunMode
              ? 'bg-amber-700 hover:bg-amber-800 text-white shadow-amber-800/20'
              : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span className="text-[11px] whitespace-nowrap">Desbloquear</span>
        </button>
      )}
    </header>
  );
};
