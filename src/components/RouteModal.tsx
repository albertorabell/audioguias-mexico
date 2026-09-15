import React from 'react';
import { X, Clock, Check, Route } from 'lucide-react';
import { SiteRoute } from '../types';
import { useTheme } from '../utils/ThemeContext';

interface RouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  routes: SiteRoute[];
  activeRouteId: string;
  onSelectRoute: (routeId: string) => void;
  onSelectStop?: (stopIndex: number) => void;
  currentStopIndex: number;
}

export const RouteModal: React.FC<RouteModalProps> = ({
  isOpen,
  onClose,
  routes,
  activeRouteId,
  onSelectRoute,
  onSelectStop,
  currentStopIndex,
}) => {
  const { isSunMode } = useTheme();

  if (!isOpen) return null;

  return (
    <div
      id="modal-route-selector"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        className={`w-full max-w-[480px] border-t sm:border rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] flex flex-col shadow-2xl transition-colors duration-200 ${
          isSunMode
            ? 'bg-white border-stone-300 text-stone-900'
            : 'bg-stone-900 border-stone-800 text-stone-100'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between pb-3 border-b ${
            isSunMode ? 'border-stone-200' : 'border-stone-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isSunMode
                  ? 'bg-amber-100 border border-amber-300 text-amber-800'
                  : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
              }`}
            >
              <Route className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-sm font-extrabold ${isSunMode ? 'text-stone-950' : 'text-white'}`}>
                Seleccionar Itinerario
              </h3>
              <p className={`text-[11px] font-medium ${isSunMode ? 'text-stone-600' : 'text-stone-400'}`}>
                Elige la ruta que mejor se adapte a tu visita
              </p>
            </div>
          </div>
          <button
            id="btn-close-route-modal"
            onClick={onClose}
            className={`min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl transition ${
              isSunMode ? 'hover:bg-stone-100 text-stone-600' : 'hover:bg-stone-800 text-stone-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Routes List */}
        <div className="overflow-y-auto py-4 space-y-4 flex-1">
          {routes.map((route) => {
            const isActive = route.id === activeRouteId;
            return (
              <div
                key={route.id}
                className={`rounded-2xl border transition p-4 ${
                  isActive
                    ? isSunMode
                      ? 'bg-amber-50/70 border-amber-500 shadow-sm ring-1 ring-amber-500/40'
                      : 'bg-stone-950 border-amber-500/60 ring-1 ring-amber-500/30'
                    : isSunMode
                    ? 'bg-stone-50 border-stone-300 hover:border-amber-600'
                    : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        isSunMode
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-stone-800 text-amber-400 border-stone-700'
                      }`}
                    >
                      {route.stops.length} paradas
                    </span>
                    <h4
                      className={`text-sm font-extrabold mt-1.5 ${
                        isSunMode ? 'text-stone-950' : 'text-white'
                      }`}
                    >
                      {route.name}
                    </h4>
                  </div>
                  <div
                    className={`flex items-center gap-1 text-xs shrink-0 font-bold ${
                      isSunMode ? 'text-stone-700' : 'text-stone-400'
                    }`}
                  >
                    <Clock className={`w-3.5 h-3.5 ${isSunMode ? 'text-amber-800' : 'text-amber-400'}`} />
                    <span>{route.duration}</span>
                  </div>
                </div>

                <p
                  className={`text-xs leading-relaxed mb-3 font-medium ${
                    isSunMode ? 'text-stone-700' : 'text-stone-300'
                  }`}
                >
                  {route.description}
                </p>

                {/* Stops in this route */}
                <div
                  className={`space-y-1.5 pt-2 border-t mb-3.5 ${
                    isSunMode ? 'border-stone-200' : 'border-stone-800/80'
                  }`}
                >
                  {route.stops.map((stop, idx) => {
                    const isCurrentStop = isActive && idx === currentStopIndex;
                    return (
                      <button
                        key={stop.poi_id}
                        onClick={() => {
                          if (isActive && onSelectStop) {
                            onSelectStop(idx);
                            onClose();
                          }
                        }}
                        className={`w-full min-h-[44px] text-left flex items-center justify-between p-2 rounded-xl text-xs transition active:scale-98 ${
                          isCurrentStop
                            ? isSunMode
                              ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300'
                              : 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                            : isSunMode
                            ? 'text-stone-800 hover:bg-stone-100'
                            : 'text-stone-300 hover:bg-stone-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                              isSunMode ? 'bg-stone-200 text-stone-800' : 'bg-stone-800 text-stone-300'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="truncate">{stop.title}</span>
                        </div>
                        <span
                          className={`text-[10px] shrink-0 ml-2 font-semibold ${
                            isSunMode ? 'text-stone-600' : 'text-stone-400'
                          }`}
                        >
                          {stop.room_zone}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Activate Route Button (min 48px de altura táctil) */}
                {!isActive ? (
                  <button
                    onClick={() => {
                      onSelectRoute(route.id);
                      onClose();
                    }}
                    className={`w-full min-h-[48px] py-2.5 rounded-xl text-xs font-extrabold transition active:scale-98 ${
                      isSunMode
                        ? 'bg-stone-800 hover:bg-stone-900 text-white'
                        : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                    }`}
                  >
                    Activar esta ruta
                  </button>
                ) : (
                  <div
                    className={`w-full min-h-[48px] py-2 flex items-center justify-center gap-1.5 text-xs font-extrabold rounded-xl border ${
                      isSunMode
                        ? 'text-amber-900 bg-amber-100 border-amber-300'
                        : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Ruta Activa</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
