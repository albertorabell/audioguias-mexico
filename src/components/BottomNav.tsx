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
      className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 p-3 shadow-2xl backdrop-blur-md border-t transition-colors duration-200 ${
        isSunMode
          ? 'bg-white/95 border-stone-300 text-stone-900'
          : 'bg-stone-950/95 border-stone-800 text-stone-100'
      }`}
    >
      {isLastStop ? (
        // Ruta completada state
        <div className="flex items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5 truncate">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isSunMode
                  ? 'bg-amber-100 border border-amber-300 text-amber-800'
                  : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
              }`}
            >
              <PartyPopper className="w-5 h-5" />
            </div>
            <div className="truncate">
              <p
                className={`text-xs font-extrabold truncate ${
                  isSunMode ? 'text-amber-800' : 'text-amber-400'
                }`}
              >
                ¡Ruta completada! 🎉
              </p>
              <p className={`text-[10px] font-medium ${isSunMode ? 'text-stone-600' : 'text-stone-400'}`}>
                Has visitado todos los puntos del recorrido
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenMapModal && (
              <button
                id="btn-open-map-bottom-completed"
                onClick={onOpenMapModal}
                className={`min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl border transition active:scale-95 ${
                  isSunMode
                    ? 'bg-amber-50 border-stone-300 text-amber-900 hover:bg-amber-100'
                    : 'bg-stone-900 border-stone-700 text-amber-400 hover:bg-stone-800'
                }`}
                title="Ver plano del recinto"
              >
                <Map className="w-4 h-4" />
              </button>
            )}
            <button
              id="btn-restart-route"
              onClick={onRestartRoute}
              className={`min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl border transition active:scale-95 ${
                isSunMode
                  ? 'bg-stone-100 border-stone-300 text-stone-800 hover:bg-stone-200'
                  : 'bg-stone-900 border-stone-700 text-stone-300 hover:text-white'
              }`}
              title="Reiniciar ruta"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              id="btn-change-route-completed"
              onClick={onOpenRouteModal}
              className={`min-h-[48px] flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition active:scale-95 shadow-md ${
                isSunMode
                  ? 'bg-amber-700 hover:bg-amber-800 text-white shadow-amber-800/20'
                  : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20'
              }`}
            >
              <Route className="w-4 h-4" />
              <span>Cambiar ruta</span>
            </button>
          </div>
        </div>
      ) : (
        // Standard Next Stop navigation (ampliado a mínimo 48px de altura táctil)
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 truncate">
            <p
              className={`text-[10px] uppercase font-extrabold tracking-wider ${
                isSunMode ? 'text-stone-600' : 'text-stone-400'
              }`}
            >
              Siguiente parada ({currentStopIndex + 2}/{totalStops})
            </p>
            <p
              className={`text-xs font-extrabold truncate mt-0.5 ${
                isSunMode ? 'text-stone-950' : 'text-stone-100'
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
                className={`min-h-[48px] px-3 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition active:scale-95 ${
                  isSunMode
                    ? 'bg-amber-50 border-stone-300 text-amber-900 hover:bg-amber-100 hover:border-amber-600'
                    : 'bg-stone-900 border-stone-700 text-amber-400 hover:bg-stone-800 hover:border-amber-500'
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
              className={`min-h-[48px] flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold transition active:scale-95 shadow-md ${
                isSunMode
                  ? 'bg-amber-700 hover:bg-amber-800 text-white shadow-amber-800/20'
                  : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20'
              }`}
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
