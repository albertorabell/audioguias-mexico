import React from 'react';
import { ChevronLeft, Search, ShieldCheck, Lock } from 'lucide-react';
import { SiteRoute } from '../types';

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
  titleOverride?: string;
  showBackButton?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onBack,
  activeRoute,
  currentStopIndex,
  totalStops,
  hasPass,
  onOpenPaywallModal,
  onOpenSearchModal,
  titleOverride,
  showBackButton = true,
}) => {
  return (
    <header
      id="museum-top-header"
      className="sticky top-0 z-30 w-full backdrop-blur-xl bg-[#0B0B0E]/90 border-b border-white/10 text-[#F3F4F6] transition-colors duration-200"
    >
      <div className="flex items-center justify-between gap-3 px-4 h-14 max-w-screen-md mx-auto">
        {/* Lado izquierdo: Botón regresar limpio o Wordmark editorial */}
        <div className="flex items-center gap-2 min-w-0">
          {showBackButton ? (
            <button
              id="btn-nav-back"
              onClick={onBack}
              className="min-h-[44px] min-w-[44px] -ml-2 flex items-center justify-center rounded-xl text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/5 transition active:scale-95 cursor-pointer"
              aria-label="Regresar"
            >
              <ChevronLeft className="w-5 h-5 text-[#F59E0B]" />
            </button>
          ) : null}

          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#F59E0B] block truncate">
              {activeRoute ? 'EN RECORRIDO OFICIAL' : 'MUSEO NACIONAL DE ANTROPOLOGÍA'}
            </span>
            <p className="text-xs font-bold text-[#F3F4F6] truncate">
              {titleOverride || (activeRoute ? activeRoute.name : 'INAH • México')}
            </p>
          </div>
        </div>

        {/* Lado derecho: Acciones discretas mínimas (Búsqueda rápida y estado de pase) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Botón discreto de Búsqueda rápida / Teclado */}
          {onOpenSearchModal && (
            <button
              id="btn-nav-quick-search"
              onClick={onOpenSearchModal}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/5 transition active:scale-95 cursor-pointer"
              title="Buscar por vitrina o nombre"
              aria-label="Buscar pieza"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* Indicador de Pase Activo / Desbloqueo */}
          {hasPass ? (
            <button
              id="btn-pass-indicator"
              onClick={onOpenPaywallModal}
              className="min-h-[44px] px-2.5 flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase text-[#10B981] bg-[#10B981]/15 border border-[#10B981]/30 rounded-xl transition active:scale-95 cursor-pointer"
              title="Pase Completo Activo"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Activo</span>
            </button>
          ) : (
            <button
              id="btn-unlock-pass-nav"
              onClick={onOpenPaywallModal}
              className="min-h-[44px] px-3 flex items-center gap-1 text-[10px] font-extrabold tracking-wide uppercase text-black bg-[#F59E0B] hover:bg-amber-400 rounded-xl transition active:scale-95 shadow-sm cursor-pointer"
            >
              <Lock className="w-3 h-3 fill-current" />
              <span>Pase</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
