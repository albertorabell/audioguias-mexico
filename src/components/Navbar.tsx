import React from 'react';
import { ChevronLeft, ChevronDown, Lock, ShieldCheck } from 'lucide-react';
import { SiteRoute } from '../types';
import { formatRemainingHours } from '../utils/license';

interface NavbarProps {
  onBack: () => void;
  activeRoute: SiteRoute | null;
  currentStopIndex: number;
  totalStops: number;
  hasPass: boolean;
  passExpiresAt?: number;
  onOpenRouteModal: () => void;
  onOpenPaywallModal: () => void;
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
}) => {
  return (
    <header className="sticky top-0 z-30 bg-stone-950/90 backdrop-blur-md border-b border-stone-800/80 px-3.5 py-2.5 flex items-center justify-between gap-2">
      {/* Botón Atrás */}
      <button
        id="btn-nav-back"
        onClick={onBack}
        className="flex items-center gap-1 text-stone-300 hover:text-white p-1.5 -ml-1 rounded-xl hover:bg-stone-800/60 transition active:scale-95"
        aria-label="Regresar al catálogo de sitios"
      >
        <ChevronLeft className="w-5 h-5 text-stone-300" />
        <span className="text-xs font-medium hidden xs:inline">Sitios</span>
      </button>

      {/* Selector de Itinerario */}
      <button
        id="btn-route-selector"
        onClick={onOpenRouteModal}
        className="flex-1 max-w-[210px] mx-1 flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-full bg-stone-900 border border-stone-700/80 hover:border-amber-500/60 transition text-left group active:scale-98"
      >
        <div className="truncate">
          <p className="text-[10px] uppercase font-bold tracking-wider text-amber-400 truncate">
            {activeRoute ? activeRoute.name : 'Itinerario'}
          </p>
          <p className="text-xs font-medium text-stone-200 truncate">
            Parada {currentStopIndex + 1} de {totalStops}
          </p>
        </div>
        <ChevronDown className="w-4 h-4 text-stone-400 group-hover:text-amber-400 shrink-0 transition" />
      </button>

      {/* Indicador de Pase */}
      {hasPass ? (
        <button
          id="btn-pass-active-status"
          onClick={onOpenPaywallModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-950/90 text-emerald-400 border border-emerald-700/80 text-xs font-semibold shadow-xs hover:bg-emerald-900/80 transition active:scale-95"
          title={passExpiresAt ? `Válido por ${formatRemainingHours(passExpiresAt)}` : 'Pase Activo'}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] whitespace-nowrap">PASE ACTIVO ✓</span>
        </button>
      ) : (
        <button
          id="btn-unlock-pass-nav"
          onClick={onOpenPaywallModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shadow-sm transition active:scale-95"
        >
          <Lock className="w-3.5 h-3.5 text-stone-950" />
          <span className="text-[11px] whitespace-nowrap">Desbloquear</span>
        </button>
      )}
    </header>
  );
};
