import React from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, PartyPopper, Route, Map, CheckCircle } from 'lucide-react';
import { RouteStop } from '../types';
import { useTheme } from '../utils/ThemeContext';

interface BottomNavProps {
  currentStopIndex: number;
  totalStops: number;
  nextStop: RouteStop | null;
  onNextStop: () => void;
  onPreviousStop?: () => void;
  onRestartRoute: () => void;
  onOpenRouteModal: () => void;
  onOpenMapModal?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentStopIndex,
  totalStops,
  nextStop,
  onNextStop,
  onPreviousStop,
  onRestartRoute,
  onOpenRouteModal,
  onOpenMapModal,
}) => {
  const isFirstStop = currentStopIndex <= 0;
  const isLastStop = currentStopIndex >= totalStops - 1;
  const { isSunMode } = useTheme();

  return (
    <nav
      aria-label="Navegación de paradas del recorrido"
      className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[520px] z-40 px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-2xl backdrop-blur-md border-t transition-colors duration-200 ${
        isSunMode
          ? 'bg-[#FAF8F5]/94 border-stone-200/90 text-stone-900'
          : 'bg-[#141414]/94 border-stone-800/90 text-stone-100'
      }`}
    >
      <div className="flex items-center justify-between gap-2.5">
        {/* Botón Anterior */}
        <button
          id="btn-prev-stop"
          type="button"
          onClick={onPreviousStop}
          disabled={isFirstStop}
          aria-label="Ir a la parada anterior"
          className={`min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-all active:scale-95 shrink-0 ${
              isFirstStop
              ? 'opacity-40 cursor-not-allowed border-stone-300 dark:border-stone-800 text-stone-400 dark:text-stone-600 bg-stone-100 dark:bg-stone-900'
              : isSunMode
              ? 'bg-white border-stone-200 hover:bg-stone-100 text-[#111827] shadow-xs'
              : 'bg-stone-900 border-stone-800 hover:bg-stone-800 text-stone-200 shadow-xs'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden xs:inline">Anterior</span>
        </button>

        {/* Info central de la parada y acceso a Mapa */}
        <div className="flex-1 min-w-0 text-center px-1">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C05638] dark:text-[#D96B47]">
              Parada {Math.min(currentStopIndex + 1, totalStops)} de {totalStops}
            </span>
            {onOpenMapModal && (
              <button
                id="btn-open-map-bottom"
                type="button"
                onClick={onOpenMapModal}
                className={`p-1 rounded-lg border text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition ${
                  isSunMode ? 'border-stone-200 bg-stone-100/80' : 'border-stone-800 bg-stone-900/80'
                }`}
                title="Abrir mapa con guía a la siguiente vitrina"
                aria-label="Abrir mapa con guía a la siguiente vitrina"
              >
                <Map className="w-3 h-3" />
              </button>
            )}
          </div>
          {isLastStop ? (
            <p
              className={`text-xs font-semibold truncate mt-0.5 ${
                isSunMode ? 'text-[#111827]' : 'text-stone-100'
              }`}
            >
              🏁 Última parada de la ruta
            </p>
          ) : nextStop ? (
            <p
              id="micro-indicator-bottom-nav"
              className={`text-xs font-medium truncate mt-0.5 ${
                isSunMode ? 'text-[#111827]' : 'text-stone-200'
              }`}
              title={`Siguiente parada: ${nextStop.title} · ${nextStop.room_zone || 'Sala'}`}
            >
              <span className="font-bold text-[#C05638] dark:text-[#D96B47]">Siguiente parada:</span>{' '}
              <span className="font-semibold">{nextStop.title}</span>{' '}
              <span className="text-[#4B5563] dark:text-stone-400 text-[11px] font-medium">· {nextStop.room_zone || 'Sala'}</span>
            </p>
          ) : (
            <p
              className={`text-xs font-semibold truncate mt-0.5 ${
                isSunMode ? 'text-[#111827]' : 'text-stone-100'
              }`}
            >
              Siguiente pieza
            </p>
          )}
        </div>

        {/* Botón Avanzar / Finalizar Recorrido */}
        <button
          id="btn-next-stop"
          type="button"
          onClick={onNextStop}
          aria-label={isLastStop ? 'Finalizar recorrido' : 'Avanzar a la siguiente parada'}
          className={`min-h-[44px] flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition active:scale-95 shadow-sm shrink-0 ${
            isLastStop
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20'
              : 'bg-[#C05638] hover:bg-[#A9482E] dark:bg-[#D96B47] dark:hover:bg-[#C05638] text-white shadow-[#C05638]/20'
          }`}
        >
          {isLastStop ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Finalizar Recorrido</span>
            </>
          ) : (
            <>
              <span>Avanzar</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </nav>
  );
};
