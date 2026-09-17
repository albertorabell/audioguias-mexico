import React from 'react';
import { ChevronLeft, ChevronDown, Lock, ShieldCheck, Map, Search } from 'lucide-react';
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
  onOpenSearchModal?: () => void;
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
  onOpenSearchModal,
}) => {
  const { isSunMode } = useTheme();

  return (
    <header
      className={`sticky top-0 z-30 w-full max-w-full overflow-x-hidden border-b transition-colors duration-200 backdrop-blur-md ${
        isSunMode
          ? 'bg-[#FAF8F5]/94 border-stone-200/90 text-[#111827]'
          : 'bg-[#141414]/94 border-stone-800/90 text-[#F5F5F4]'
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2 w-full max-w-screen-md mx-auto">
        {/* Botón Atrás (mínimo 48px de altura táctil) */}
        <button
          id="btn-nav-back"
          onClick={onBack}
          className={`min-h-[44px] min-w-[44px] shrink-0 flex items-center justify-center gap-1 px-2 rounded-xl transition active:scale-95 ${
            isSunMode
              ? 'text-[#111827] hover:bg-stone-100 border border-stone-300'
              : 'text-stone-300 hover:text-white hover:bg-stone-800/60 border border-transparent'
          }`}
          aria-label="Regresar al catálogo de sitios"
        >
          <ChevronLeft className="w-5 h-5 text-amber-600" />
          <span className="text-xs font-bold hidden xs:inline">Sitios</span>
        </button>

        {/* Selector de Itinerario (mínimo 48px de altura táctil, min-w-0 flex-1 truncate) */}
        <button
          id="btn-route-selector"
          onClick={onOpenRouteModal}
          className={`min-w-0 flex-1 min-h-[44px] flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-xl border text-left group active:scale-98 transition ${
            isSunMode
              ? 'bg-white border-stone-300 hover:border-amber-600 shadow-xs'
              : 'bg-stone-900 border-stone-700/80 hover:border-amber-500/60'
          }`}
        >
          <div className="min-w-0 flex-1 truncate">
            <p
              className={`text-[10px] uppercase font-extrabold tracking-wider truncate ${
                isSunMode ? 'text-amber-800' : 'text-amber-400'
              }`}
            >
              {activeRoute ? activeRoute.name : 'Itinerario'}
            </p>
            <p
              className={`text-xs font-bold truncate ${
                isSunMode ? 'text-[#111827]' : 'text-stone-200'
              }`}
            >
              Parada {currentStopIndex + 1} de {totalStops}
            </p>
          </div>
          <ChevronDown
            className={`w-4 h-4 shrink-0 transition ${
              isSunMode ? 'text-[#4B5563] group-hover:text-amber-800' : 'text-stone-400 group-hover:text-amber-400'
            }`}
          />
        </button>

        {/* Botones de acción derecha compactos y sin desborde */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Botón Buscador Directo (Teclado + Predictivo) */}
          {onOpenSearchModal && (
            <button
              id="btn-open-search-nav"
              onClick={onOpenSearchModal}
              className={`min-h-[44px] px-2 flex items-center justify-center gap-1 rounded-xl border text-xs font-bold transition active:scale-95 ${
                isSunMode
                  ? 'bg-white border-stone-300 text-[#111827] hover:bg-stone-100 hover:border-stone-400'
                  : 'bg-stone-900 border-stone-700/80 text-stone-300 hover:bg-stone-800 hover:border-stone-600'
              }`}
              title="Buscador por número de vitrina o nombre"
              aria-label="Buscar pieza por número o texto"
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline">Buscar</span>
            </button>
          )}

          {/* Botón Ver Mapa Interactivo */}
          <button
            id="btn-open-map-nav"
            onClick={onOpenMapModal}
            className={`min-h-[44px] px-2 flex items-center justify-center gap-1 rounded-xl border text-xs font-bold transition active:scale-95 ${
              isSunMode
                ? 'bg-amber-50 border-stone-300 text-amber-900 hover:bg-amber-100 hover:border-amber-600'
                : 'bg-stone-900 border-stone-700/80 text-amber-400 hover:bg-stone-800 hover:border-amber-500'
            }`}
            title="Ver plano y mapa interactivo de paradas"
          >
            <Map className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">Mapa</span>
          </button>

          {/* Switch de Tema Adaptativo (☀️ / 🌙) */}
          <ThemeToggle />

          {/* Indicador de Pase */}
          {hasPass ? (
            <button
              id="btn-pass-active-status"
              onClick={onOpenPaywallModal}
              className={`min-h-[44px] flex items-center gap-1 px-2.5 rounded-xl text-xs font-bold shadow-xs transition active:scale-95 border shrink-0 ${
                isSunMode
                  ? 'bg-emerald-100 text-emerald-950 border-emerald-400 hover:bg-emerald-200'
                  : 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80 hover:bg-emerald-900/80'
              }`}
              title={passExpiresAt ? `Válido por ${formatRemainingHours(passExpiresAt)}` : 'Pase Activo'}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-[10px] sm:text-[11px] whitespace-nowrap font-black">PASE ACTIVO</span>
            </button>
          ) : (
            <button
              id="btn-unlock-pass-nav"
              onClick={onOpenPaywallModal}
              className={`min-h-[44px] flex items-center gap-1 px-2.5 rounded-xl text-xs font-bold shadow-xs transition active:scale-95 shrink-0 ${
                isSunMode
                  ? 'bg-amber-700 hover:bg-amber-800 text-white shadow-amber-800/20'
                  : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20'
              }`}
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[10px] sm:text-[11px] whitespace-nowrap">Desbloquear</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
