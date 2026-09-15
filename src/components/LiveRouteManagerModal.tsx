import React, { useState, useMemo } from 'react';
import {
  X,
  Compass,
  Clock,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  ChevronRight,
  RotateCcw,
  Navigation2,
  Radio,
} from 'lucide-react';
import { SiteManifest, SiteRoute, RouteStop, Room, RoomPieceSummary } from '../types';
import { useTheme } from '../utils/ThemeContext';
import { formatRouteDuration } from '../utils/routeOptimizer';
import { SafeImage } from './SafeImage';

interface LiveRouteManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRoute: SiteRoute;
  currentStopIndex: number;
  manifest: SiteManifest;
  onSelectStop: (stopIndex: number) => void;
  onUpdateRoute: (updatedRoute: SiteRoute, newCurrentIndex?: number) => void;
  onStartSpontaneousDetour: (pieceFile: string, pieceTitle: string) => void;
}

export const LiveRouteManagerModal: React.FC<LiveRouteManagerModalProps> = ({
  isOpen,
  onClose,
  activeRoute,
  currentStopIndex,
  manifest,
  onSelectStop,
  onUpdateRoute,
  onStartSpontaneousDetour,
}) => {
  const { isSunMode } = useTheme();
  const [showCatalogBrowser, setShowCatalogBrowser] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');

  if (!isOpen) return null;

  // Calculate dynamic remaining time
  const remainingMinutes = useMemo(() => {
    if (!activeRoute.stops) return 0;
    let total = 0;
    for (let i = currentStopIndex; i < activeRoute.stops.length; i++) {
      total += activeRoute.stops[i].estimated_minutes || 8;
    }
    return total;
  }, [activeRoute.stops, currentStopIndex]);

  const completedCount = Math.min(currentStopIndex, activeRoute.stops.length);
  const pendingCount = Math.max(0, activeRoute.stops.length - currentStopIndex - 1);

  // Reorder pending stop (move up)
  const handleMoveUp = (index: number) => {
    if (index <= currentStopIndex + 1) return; // Can only reorder strictly among pending
    const newStops = [...activeRoute.stops];
    const temp = newStops[index];
    newStops[index] = newStops[index - 1];
    newStops[index - 1] = temp;

    onUpdateRoute({
      ...activeRoute,
      stops: newStops,
    });
  };

  // Reorder pending stop (move down)
  const handleMoveDown = (index: number) => {
    if (index < currentStopIndex + 1 || index >= activeRoute.stops.length - 1) return;
    const newStops = [...activeRoute.stops];
    const temp = newStops[index];
    newStops[index] = newStops[index + 1];
    newStops[index + 1] = temp;

    onUpdateRoute({
      ...activeRoute,
      stops: newStops,
    });
  };

  // Remove stop from route
  const handleRemoveStop = (index: number) => {
    if (activeRoute.stops.length <= 1) return; // Keep at least 1 stop
    const newStops = activeRoute.stops.filter((_, idx) => idx !== index);

    let newCurrentIdx = currentStopIndex;
    if (index < currentStopIndex) {
      newCurrentIdx = currentStopIndex - 1;
    } else if (index === currentStopIndex && newCurrentIdx >= newStops.length) {
      newCurrentIdx = newStops.length - 1;
    }

    onUpdateRoute(
      {
        ...activeRoute,
        stops: newStops,
      },
      newCurrentIdx
    );
  };

  // Add piece to end of route
  const handleAddPieceToEnd = (stopToAdd: RouteStop) => {
    if (activeRoute.stops.some((s) => s.poi_id === stopToAdd.poi_id)) return;
    const newStops = [...activeRoute.stops, stopToAdd];
    onUpdateRoute({
      ...activeRoute,
      stops: newStops,
    });
  };

  // Insert piece right after current stop
  const handleInsertPieceNext = (stopToAdd: RouteStop) => {
    if (activeRoute.stops.some((s) => s.poi_id === stopToAdd.poi_id)) return;
    const newStops = [...activeRoute.stops];
    newStops.splice(currentStopIndex + 1, 0, stopToAdd);
    onUpdateRoute({
      ...activeRoute,
      stops: newStops,
    });
  };

  // All pieces available from manifest for the catalog browser
  const allCatalogPieces = useMemo(() => {
    const list: RouteStop[] = [];
    const seen = new Set<string>();

    if (manifest.rooms) {
      manifest.rooms.forEach((room) => {
        if (room.pieces_info) {
          room.pieces_info.forEach((piece) => {
            if (!seen.has(piece.poi_id)) {
              seen.add(piece.poi_id);
              list.push({
                poi_id: piece.poi_id,
                title: piece.title,
                room_zone: room.name,
                file: piece.file,
                map_coords: room.coords || { x: 50, y: 50 },
                estimated_minutes: piece.estimated_minutes || 8,
                room_id: room.id,
                ranking: piece.is_premium ? 2 : 1,
                tags: room.tags || [],
              });
            }
          });
        }
      });
    }

    // Also check any route stops not yet added
    if (manifest.routes) {
      manifest.routes.forEach((r) => {
        r.stops.forEach((s) => {
          if (!seen.has(s.poi_id)) {
            seen.add(s.poi_id);
            list.push(s);
          }
        });
      });
    }

    return list;
  }, [manifest]);

  const filteredCatalogPieces = useMemo(() => {
    if (!catalogSearch.trim()) return allCatalogPieces;
    const q = catalogSearch.toLowerCase();
    return allCatalogPieces.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.room_zone.toLowerCase().includes(q) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }, [allCatalogPieces, catalogSearch]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`w-full sm:max-w-2xl max-h-[90vh] sm:rounded-3xl rounded-t-3xl border flex flex-col overflow-hidden shadow-2xl transition-all ${
          isSunMode
            ? 'bg-[#F9F6F0] border-stone-300 text-stone-900'
            : 'bg-stone-950 border-stone-800 text-stone-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          className={`p-4 border-b flex items-center justify-between shrink-0 ${
            isSunMode ? 'bg-white/80 border-stone-200' : 'bg-stone-900/80 border-stone-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-black">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black tracking-tight">
                  Gestor de Ruta en Vivo
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  Parada {currentStopIndex + 1} de {activeRoute.stops.length}
                </span>
              </div>
              <p
                className={`text-xs ${
                  isSunMode ? 'text-stone-600' : 'text-stone-400'
                }`}
              >
                {activeRoute.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors ${
              isSunMode
                ? 'border-stone-300 text-stone-600 hover:bg-stone-100'
                : 'border-stone-800 text-stone-300 hover:bg-stone-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Recalculation Bar */}
        <div
          className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2 shrink-0 ${
            isSunMode
              ? 'bg-amber-50/70 border-amber-200 text-amber-950'
              : 'bg-amber-950/20 border-amber-900/40 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2 text-xs">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-extrabold">
              ~{formatRouteDuration(remainingMinutes)} restantes
            </span>
            <span className="opacity-70">•</span>
            <span className="opacity-90">{pendingCount} pendientes</span>
            <span className="opacity-70">•</span>
            <span className="opacity-90">{completedCount} completadas</span>
          </div>

          <button
            type="button"
            onClick={() => setShowCatalogBrowser(!showCatalogBrowser)}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all active:scale-95 ${
              showCatalogBrowser
                ? 'bg-amber-500 text-black border-amber-600'
                : isSunMode
                ? 'bg-white border-amber-300 text-amber-950 hover:bg-amber-100'
                : 'bg-stone-900 border-amber-500/40 text-amber-300 hover:bg-stone-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showCatalogBrowser ? 'Ver lista de ruta' : '+ Agregar otra sala o pieza'}</span>
          </button>
        </div>

        {/* Content Body: Stops List vs Catalog Browser */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {showCatalogBrowser ? (
            /* ================= CATALOG BROWSER ================= */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    <span>Catálogo Completo del Recinto</span>
                  </h3>
                  <p
                    className={`text-[11px] ${
                      isSunMode ? 'text-stone-600' : 'text-stone-400'
                    }`}
                  >
                    Suma obras a tu itinerario o inicia un desvío espontáneo sin perder tu progreso.
                  </p>
                </div>
              </div>

              {/* Search filter input */}
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Buscar por obra, sala o cultura..."
                className={`w-full px-3.5 py-2 text-xs rounded-xl border outline-none transition-all ${
                  isSunMode
                    ? 'bg-white border-stone-300 text-stone-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                    : 'bg-stone-900 border-stone-800 text-stone-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                }`}
              />

              {/* Pieces Grid */}
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {filteredCatalogPieces.map((piece) => {
                  const isAlreadyInRoute = activeRoute.stops.some(
                    (s) => s.poi_id === piece.poi_id
                  );

                  return (
                    <div
                      key={piece.poi_id}
                      className={`p-3 rounded-2xl border transition-all ${
                        isAlreadyInRoute
                          ? isSunMode
                            ? 'bg-stone-100/80 border-stone-200 opacity-70'
                            : 'bg-stone-900/40 border-stone-800/80 opacity-70'
                          : isSunMode
                          ? 'bg-white border-stone-200 hover:border-amber-400 shadow-sm'
                          : 'bg-stone-900/70 border-stone-800 hover:border-amber-500'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-xs font-bold block">{piece.title}</span>
                          <span
                            className={`text-[10px] block ${
                              isSunMode ? 'text-stone-500' : 'text-stone-400'
                            }`}
                          >
                            {piece.room_zone} • ~{piece.estimated_minutes || 8} min
                          </span>
                        </div>

                        {isAlreadyInRoute && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                            ✓ En tu ruta
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {!isAlreadyInRoute ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAddPieceToEnd(piece)}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-all active:scale-95 ${
                                isSunMode
                                  ? 'bg-stone-50 border-stone-300 hover:bg-stone-100 text-stone-800'
                                  : 'bg-stone-800 border-stone-700 hover:bg-stone-700 text-stone-200'
                              }`}
                            >
                              <Plus className="w-3 h-3 text-amber-500" />
                              <span>Agregar al final</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleInsertPieceNext(piece)}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-all active:scale-95 ${
                                isSunMode
                                  ? 'bg-amber-50 border-amber-300 hover:bg-amber-100 text-amber-950'
                                  : 'bg-amber-950/40 border-amber-500/40 hover:bg-amber-950/60 text-amber-300'
                              }`}
                            >
                              <Navigation2 className="w-3 h-3 text-amber-500" />
                              <span>Siguiente parada</span>
                            </button>
                          </>
                        ) : null}

                        {/* Spontaneous Detour Button */}
                        <button
                          type="button"
                          onClick={() => {
                            onStartSpontaneousDetour(piece.file, piece.title);
                            onClose();
                          }}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-all active:scale-95 ${
                            isSunMode
                              ? 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100 text-yellow-950'
                              : 'bg-yellow-950/40 border-yellow-500/40 hover:bg-yellow-950/60 text-yellow-300'
                          }`}
                        >
                          <Radio className="w-3 h-3 text-yellow-500 animate-pulse" />
                          <span>Desvío espontáneo 🟡</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ================= STOPS SEQUENCE LIST ================= */
            <div className="space-y-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Secuencia de tu recorrido ({activeRoute.stops.length} paradas)
                </span>
                <span
                  className={`text-[10px] ${
                    isSunMode ? 'text-stone-500' : 'text-stone-400'
                  }`}
                >
                  Puedes reordenar o quitar paradas pendientes
                </span>
              </div>

              {activeRoute.stops.map((stop, idx) => {
                const isCurrent = idx === currentStopIndex;
                const isCompleted = idx < currentStopIndex;
                const isPending = idx > currentStopIndex;
                const canMoveUp = idx > currentStopIndex + 1;
                const canMoveDown = isPending && idx < activeRoute.stops.length - 1;

                return (
                  <div
                    key={`${stop.poi_id}-${idx}`}
                    className={`p-3 rounded-2xl border transition-all ${
                      isCurrent
                        ? isSunMode
                          ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/50 shadow-md'
                          : 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/40 shadow-md'
                        : isCompleted
                        ? isSunMode
                          ? 'bg-stone-100/70 border-stone-200 opacity-75'
                          : 'bg-stone-900/40 border-stone-800/80 opacity-75'
                        : isSunMode
                        ? 'bg-white border-stone-200 shadow-sm'
                        : 'bg-stone-900/70 border-stone-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Number / Status Badge */}
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            isCurrent
                              ? 'bg-amber-500 text-black animate-pulse'
                              : isCompleted
                              ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                              : isSunMode
                              ? 'bg-stone-200 text-stone-700'
                              : 'bg-stone-800 text-stone-300'
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>

                        {/* Title & Info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs sm:text-sm block truncate">
                              {stop.title}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500 text-black shrink-0">
                                En curso
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] block truncate ${
                              isSunMode ? 'text-stone-500' : 'text-stone-400'
                            }`}
                          >
                            {stop.room_zone} • ~{stop.estimated_minutes || 8} min
                          </span>
                        </div>
                      </div>

                      {/* Action Controls for Stop */}
                      <div className="flex items-center gap-1 shrink-0">
                        {isPending && (
                          <>
                            {/* Move Up */}
                            <button
                              type="button"
                              disabled={!canMoveUp}
                              onClick={() => handleMoveUp(idx)}
                              title="Subir en el orden"
                              className={`p-1.5 rounded-lg border transition-colors ${
                                canMoveUp
                                  ? isSunMode
                                    ? 'border-stone-300 hover:bg-stone-100 text-stone-700'
                                    : 'border-stone-700 hover:bg-stone-800 text-stone-200'
                                  : 'opacity-30 cursor-not-allowed border-transparent'
                              }`}
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>

                            {/* Move Down */}
                            <button
                              type="button"
                              disabled={!canMoveDown}
                              onClick={() => handleMoveDown(idx)}
                              title="Bajar en el orden"
                              className={`p-1.5 rounded-lg border transition-colors ${
                                canMoveDown
                                  ? isSunMode
                                    ? 'border-stone-300 hover:bg-stone-100 text-stone-700'
                                    : 'border-stone-700 hover:bg-stone-800 text-stone-200'
                                  : 'opacity-30 cursor-not-allowed border-transparent'
                              }`}
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Stop */}
                            <button
                              type="button"
                              onClick={() => handleRemoveStop(idx)}
                              title="Quitar parada"
                              className="p-1.5 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {/* Go to stop directly if not current */}
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectStop(idx);
                              onClose();
                            }}
                            title="Reproducir esta parada ahora"
                            className="text-[11px] font-bold px-2 py-1 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-black border border-amber-500/30 transition-all flex items-center gap-1"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span className="hidden sm:inline">Ir ahora</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-3 border-t text-center shrink-0 ${
            isSunMode ? 'bg-stone-100 border-stone-200' : 'bg-stone-900 border-stone-800'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-black transition-transform active:scale-[0.99]"
          >
            Continuar Recorrido
          </button>
        </div>
      </div>
    </div>
  );
};
