import React from 'react';
import { ChevronRight, RotateCcw, PartyPopper, Route, Map } from 'lucide-react';
import { RouteStop } from '../types';
import { useTheme } from '../utils/ThemeContext';

interface BottomNavProps {
  currentStopIndex: number;
  totalStops: number;
  nextStop: RouteStop | null;
  onNextStop: () => void;
  onRestartRoute: () => void;
  onOpenRouteModal: () => void;
  onOpenMapModal?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentStopIndex,
  totalStops,
  nextStop,
  onNextStop,
  onRestartRoute,
  onOpenRouteModal,
  onOpenMapModal,
}) => {
  const isLastStop = currentStopIndex >= totalStops - 1;
  const { isSunMode } = useTheme();

  return (
    <nav
      className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 px-4 py-3 shadow-xl backdrop-blur-md border-t transition-colors duration-200 ${
        isSunMode
          ? 'bg-[#FAF8F5]/92 border-stone-200/90 text-stone-900'
          : 'bg-[#141414]/92 border-stone-800/90 text-stone-100'
      }`}
    >
      {isLastStop ? (
        // Ruta completada state
        <div className="flex items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5 truncate">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isSunMode
                  ? 'bg-[#C05638]/10 text-[#C05638]'
                  : 'bg-[#D96B47]/20 text-[#D96B47]'
              }`}
            >
              <PartyPopper className="w-5 h-5" />
            </div>
            <div className="truncate">
              <p
                className={`text-xs font-semibold truncate ${
                  isSunMode ? 'text-[#C05638]' : 'text-[#D96B47]'
                }`}
              >
                ¡Ruta completada!
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-normal">
                Has visitado todos los puntos del recorrido
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenMapModal && (
              <button
                id="btn-open-map-bottom-completed"
                onClick={onOpenMapModal}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border transition active:scale-95 ${
                  isSunMode
                    ? 'bg-white border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-50'
                    : 'bg-stone-900 border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
                title="Ver plano del recinto"
              >
                <Map className="w-4 h-4" />
              </button>
            )}
            <button
              id="btn-restart-route"
              onClick={onRestartRoute}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border transition active:scale-95 ${
                isSunMode
                  ? 'bg-white border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-50'
                  : 'bg-stone-900 border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
              title="Reiniciar ruta"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              id="btn-change-route-completed"
              onClick={onOpenRouteModal}
              className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition active:scale-95 shadow-sm bg-[#C05638] hover:bg-[#A9482E] dark:bg-[#D96B47] dark:hover:bg-[#C05638] text-white"
            >
              <Route className="w-4 h-4" />
              <span>Cambiar ruta</span>
            </button>
          </div>
        </div>
      ) : (
        // Standard Next Stop navigation
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0 pr-1">
            <p className="text-[10px] uppercase font-semibold tracking-wider text-stone-500 dark:text-stone-400">
              Siguiente parada ({currentStopIndex + 2}/{totalStops})
            </p>
            <p
              className={`text-xs font-semibold truncate mt-0.5 ${
                isSunMode ? 'text-stone-900' : 'text-stone-100'
              }`}
            >
              {nextStop ? nextStop.title : 'Siguiente pieza'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenMapModal && (
              <button
                id="btn-open-map-bottom"
                onClick={onOpenMapModal}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition active:scale-95 ${
                  isSunMode
                    ? 'bg-white border-stone-200 text-stone-700 hover:text-stone-900 hover:bg-stone-50'
                    : 'bg-stone-900 border-stone-800 text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
                title="Ver plano interactivo"
              >
                <Map className="w-4 h-4" />
                <span>Mapa</span>
              </button>
            )}

            <button
              id="btn-next-stop"
              onClick={onNextStop}
              className="min-h-[44px] flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition active:scale-95 shadow-sm bg-[#C05638] hover:bg-[#A9482E] dark:bg-[#D96B47] dark:hover:bg-[#C05638] text-white"
            >
              <span>Avanzar</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
