import React from 'react';
import { ChevronRight, RotateCcw, PartyPopper, Route, Check } from 'lucide-react';
import { RouteStop } from '../types';

interface BottomNavProps {
  currentStopIndex: number;
  totalStops: number;
  nextStop: RouteStop | null;
  onNextStop: () => void;
  onRestartRoute: () => void;
  onOpenRouteModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentStopIndex,
  totalStops,
  nextStop,
  onNextStop,
  onRestartRoute,
  onOpenRouteModal,
}) => {
  const isLastStop = currentStopIndex >= totalStops - 1;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 bg-stone-950/95 backdrop-blur-md border-t border-stone-800 p-3 shadow-2xl">
      {isLastStop ? (
        // Ruta completada state
        <div className="flex items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 truncate">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <PartyPopper className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-amber-400 truncate">
                ¡Ruta completada! 🎉
              </p>
              <p className="text-[10px] text-stone-400">
                Has visitado todos los puntos del recorrido
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="btn-restart-route"
              onClick={onRestartRoute}
              className="p-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-300 hover:text-white transition active:scale-95"
              title="Reiniciar ruta"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              id="btn-change-route-completed"
              onClick={onOpenRouteModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition active:scale-95 shadow-sm"
            >
              <Route className="w-3.5 h-3.5" />
              <span>Cambiar ruta</span>
            </button>
          </div>
        </div>
      ) : (
        // Standard Next Stop navigation
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 truncate">
            <p className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
              Siguiente parada ({currentStopIndex + 2}/{totalStops})
            </p>
            <p className="text-xs font-bold text-stone-200 truncate mt-0.5">
              {nextStop ? nextStop.title : 'Siguiente pieza'}
            </p>
          </div>

          <button
            id="btn-next-stop"
            onClick={onNextStop}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition active:scale-95 shadow-sm shrink-0"
          >
            <span>Avanzar</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </nav>
  );
};
