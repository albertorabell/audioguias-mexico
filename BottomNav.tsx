import React from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Map } from 'lucide-react';
import { RouteStop } from '../types';

interface BottomNavProps {
  currentStopIndex: number;
  totalStops: number;
  nextStop: RouteStop | null;
  onNextStop: () => void;
  onPreviousStop?: () => void;
  onRestartRoute?: () => void;
  onOpenRouteModal?: () => void;
  onOpenMapModal?: () => void;
  className?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentStopIndex,
  totalStops,
  nextStop,
  onNextStop,
  onPreviousStop,
  onOpenMapModal,
  className = '',
}) => {
  const isFirstStop = currentStopIndex <= 0;
  const isLastStop = currentStopIndex >= totalStops - 1;

  return (
    <div
      id="tour-stop-nav-bar"
      aria-label="Controles de avance de parada"
      className={`px-3 py-2 bg-[#141419]/90 backdrop-blur-md border-b border-white/10 text-[#F3F4F6] ${className}`}
    >
      <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
        {/* Botón Parada Anterior */}
        <button
          id="btn-prev-stop"
          type="button"
          onClick={onPreviousStop}
          disabled={isFirstStop}
          aria-label="Ir a la parada anterior"
          className={`min-h-[40px] px-3 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all active:scale-95 shrink-0 cursor-pointer ${
            isFirstStop
              ? 'opacity-30 cursor-not-allowed border-white/5 text-[#6B7280] bg-transparent'
              : 'bg-[#0B0B0E] border-white/10 hover:border-white/20 text-[#9CA3AF] hover:text-white'
          }`}
        >
          <ChevronLeft className="w-4 h-4 text-[#F59E0B]" />
          <span className="hidden xs:inline">Anterior</span>
        </button>

        {/* Indicador Central de Parada */}
        <div className="flex-1 min-w-0 text-center px-1">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#F59E0B]">
              PARADA {Math.min(currentStopIndex + 1, totalStops)} DE {totalStops}
            </span>
            {onOpenMapModal && (
              <button
                type="button"
                onClick={onOpenMapModal}
                className="p-1 rounded-md text-[#9CA3AF] hover:text-white hover:bg-white/5 transition"
                title="Ver vitrina en el plano"
                aria-label="Ver vitrina en mapa"
              >
                <Map className="w-3 h-3 text-[#F59E0B]" />
              </button>
            )}
          </div>
          <p className="text-[11px] font-semibold text-stone-200 truncate mt-0.5">
            {isLastStop
              ? '🏁 Última parada del recorrido'
              : nextStop
              ? `Sig: ${nextStop.title}`
              : 'Siguiente obra'}
          </p>
        </div>

        {/* Botón Avanzar / Finalizar */}
        <button
          id="btn-next-stop"
          type="button"
          onClick={onNextStop}
          aria-label={isLastStop ? 'Finalizar recorrido' : 'Avanzar a la siguiente parada'}
          className={`min-h-[40px] flex items-center gap-1.5 px-3.5 rounded-xl text-xs font-bold tracking-wide transition-all active:scale-95 shadow-md shrink-0 cursor-pointer ${
            isLastStop
              ? 'bg-[#10B981] hover:bg-emerald-400 text-black shadow-[#10B981]/25'
              : 'bg-[#F59E0B] hover:bg-amber-400 text-black shadow-[#F59E0B]/25'
          }`}
        >
          {isLastStop ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Finalizar</span>
            </>
          ) : (
            <>
              <span>Avanzar</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BottomNav;
