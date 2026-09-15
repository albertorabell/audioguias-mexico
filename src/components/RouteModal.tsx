import React from 'react';
import { X, Clock, MapPin, Check, Route } from 'lucide-react';
import { SiteRoute } from '../types';

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
  if (!isOpen) return null;

  return (
    <div
      id="modal-route-selector"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-[480px] bg-stone-900 border-t sm:border border-stone-800 rounded-t-3xl sm:rounded-3xl p-5 text-stone-100 max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Route className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Seleccionar Itinerario</h3>
              <p className="text-[11px] text-stone-400">Elige la ruta que mejor se adapte a tu visita</p>
            </div>
          </div>
          <button
            id="btn-close-route-modal"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-white transition"
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
                    ? 'bg-stone-950 border-amber-500/60 ring-1 ring-amber-500/30'
                    : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-800 text-amber-400">
                      {route.stops.length} paradas
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1.5">
                      {route.name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-stone-400 shrink-0 font-medium">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{route.duration}</span>
                  </div>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed mb-3">
                  {route.description}
                </p>

                {/* Stops in this route */}
                <div className="space-y-1.5 pt-2 border-t border-stone-800/80 mb-3">
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
                        className={`w-full text-left flex items-center justify-between p-2 rounded-xl text-xs transition ${
                          isCurrentStop
                            ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                            : 'text-stone-300 hover:bg-stone-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-5 h-5 rounded-full bg-stone-800 flex items-center justify-center text-[10px] font-mono shrink-0">
                            {idx + 1}
                          </span>
                          <span className="truncate">{stop.title}</span>
                        </div>
                        <span className="text-[10px] text-stone-400 shrink-0 ml-2">
                          {stop.room_zone}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Activate Route Button */}
                {!isActive ? (
                  <button
                    onClick={() => {
                      onSelectRoute(route.id);
                      onClose();
                    }}
                    className="w-full py-2 rounded-xl text-xs font-bold bg-stone-800 hover:bg-stone-700 text-stone-200 transition"
                  >
                    Activar esta ruta
                  </button>
                ) : (
                  <div className="w-full py-1.5 flex items-center justify-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 rounded-xl border border-amber-500/20">
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
