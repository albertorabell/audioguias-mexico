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
  Search,
} from 'lucide-react';
import { SiteManifest, SiteRoute, RouteStop, Room, PieceData } from '../types';
import { useTheme } from '../utils/ThemeContext';
import { calculateRouteTimeMinutes, formatRouteDuration } from '../utils/routeOptimizer';
import { SafeImage } from './SafeImage';
import { getAssetUrl } from '../utils/urlHelper';
import { useStrings } from '../utils/LanguageContext';

interface LiveRouteManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRoute: SiteRoute;
  currentStopIndex: number;
  manifest?: SiteManifest | null;
  rooms?: Room[];
  pieces?: PieceData[];
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
  rooms = [],
  pieces = [],
  onSelectStop,
  onUpdateRoute,
  onStartSpontaneousDetour,
}) => {
  const { isSunMode } = useTheme();
  const t = useStrings().liveRoute;
  const [showCatalogBrowser, setShowCatalogBrowser] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');

  // ALL HOOKS CALLED UNCONDITIONALLY BEFORE ANY CONDITIONAL RETURN:

  // 1. Calculate dynamic remaining time using single unified calculation
  const remainingMinutes = useMemo(() => {
    if (!activeRoute?.stops) return 0;
    const remainingStops = activeRoute.stops.slice(currentStopIndex);
    return calculateRouteTimeMinutes(remainingStops);
  }, [activeRoute?.stops, currentStopIndex]);

  const completedCount = Math.min(currentStopIndex, activeRoute?.stops?.length || 0);
  const pendingCount = Math.max(0, (activeRoute?.stops?.length || 0) - currentStopIndex - 1);

  // 2. All pieces available for catalog browser (using pieces.json + rooms.json)
  const allCatalogPieces = useMemo(() => {
    const list: RouteStop[] = [];
    const seen = new Set<string>();

    // From pieces.json prop
    if (pieces && pieces.length > 0) {
      pieces.forEach((piece, idx) => {
        const pId = piece.piece_id || piece.id || (piece as any).poi_id;
        if (pId && !seen.has(pId)) {
          seen.add(pId);
          const roomObj = rooms.find((r) => r.room_id === piece.room_id);
          const roomName = roomObj?.nombre_oficial || piece.room_id || t.defaultRoom;
          list.push({
            poi_id: pId,
            piece_id: pId,
            id: pId,
            title: piece.titulo || piece.title || pId,
            room_zone: roomName,
            file: piece.image_filename || '',
            map_coords: { x: piece.map_x || 50, y: piece.map_y || 50 },
            estimated_minutes: 2.0,
            room_id: piece.room_id,
            ranking: idx + 1,
            thumbnail: piece.image_filename ? getAssetUrl(`images/pieces/${piece.image_filename}`) : '',
            is_premium: !piece.is_free,
            tags: [roomName, piece.piso || 'PB'],
          });
        }
      });
    }

    // Fallback: Manifest rooms pieces if pieces list is empty
    if (list.length === 0 && manifest?.rooms) {
      manifest.rooms.forEach((room: any) => {
        const roomId = room.room_id || room.id;
        const roomName = room.nombre_oficial || room.name || roomId;
        if (room.pieces_info) {
          room.pieces_info.forEach((p: any) => {
            const pId = p.piece_id || p.id || p.poi_id;
            if (pId && !seen.has(pId)) {
              seen.add(pId);
              list.push({
                poi_id: pId,
                piece_id: pId,
                id: pId,
                title: p.title || p.titulo || pId,
                room_zone: roomName,
                file: p.file || '',
                map_coords: room.coords || { x: 50, y: 50 },
                estimated_minutes: 2.0,
                room_id: roomId,
                ranking: p.is_premium ? 2 : 1,
                tags: room.tags || [],
              });
            }
          });
        }
      });
    }

    return list;
  }, [pieces, rooms, manifest]);

  // 3. Filtered catalog pieces based on search
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

  // Reorder pending stop (move up)
  const handleMoveUp = (index: number) => {
    if (index <= currentStopIndex + 1 || !activeRoute?.stops) return;
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
    if (!activeRoute?.stops || index < currentStopIndex + 1 || index >= activeRoute.stops.length - 1) return;
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
    if (!activeRoute?.stops || activeRoute.stops.length <= 1) return;
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
    if (!activeRoute?.stops) return;
    const stopId = (stopToAdd as any).piece_id || (stopToAdd as any).id || stopToAdd.poi_id;
    if (activeRoute.stops.some((s: any) => s.piece_id === stopId || s.id === stopId || s.poi_id === stopId)) return;
    const newStops = [...activeRoute.stops, stopToAdd];
    onUpdateRoute({
      ...activeRoute,
      stops: newStops,
    });
  };

  // Insert piece right after current stop
  const handleInsertPieceNext = (stopToAdd: RouteStop) => {
    if (!activeRoute?.stops) return;
    const stopId = (stopToAdd as any).piece_id || (stopToAdd as any).id || stopToAdd.poi_id;
    if (activeRoute.stops.some((s: any) => s.piece_id === stopId || s.id === stopId || s.poi_id === stopId)) return;
    const newStops = [...activeRoute.stops];
    newStops.splice(currentStopIndex + 1, 0, stopToAdd);
    onUpdateRoute({
      ...activeRoute,
      stops: newStops,
    });
  };

  // CONDITIONAL RETURN MOVED STRICTLY AFTER ALL HOOKS:
  if (!isOpen || !activeRoute) return null;

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
                <h2 className="text-sm sm:text-base font-black tracking-tight text-white">
                  {t.title}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  {activeRoute.name}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                {t.summary(activeRoute.stops.length, completedCount, formatRouteDuration(remainingMinutes))}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/5 transition active:scale-95 cursor-pointer"
            aria-label={t.closeAria}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Action Bar */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-400">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>{t.remainingLabel} <strong className="text-amber-400">~{formatRouteDuration(remainingMinutes)}</strong></span>
            </div>

            <button
              onClick={() => setShowCatalogBrowser(!showCatalogBrowser)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showCatalogBrowser ? t.showList : t.addWork}</span>
            </button>
          </div>

          {/* Catalog Browser Drawer */}
          {showCatalogBrowser ? (
            <div className="space-y-3 p-4 rounded-2xl bg-[#141419] border border-white/10 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.browseTitle}</span>
                </h3>
                <span className="text-[10px] text-stone-400">
                  {t.worksCount(filteredCatalogPieces.length)}
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredCatalogPieces.slice(0, 30).map((piece) => {
                  const pieceId = piece.poi_id || (piece as any).piece_id || piece.id;
                  const isAlreadyIn = activeRoute.stops.some(
                    (s: any) => s.piece_id === pieceId || s.id === pieceId || s.poi_id === pieceId
                  );

                  return (
                    <div
                      key={pieceId}
                      className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-white block truncate">{piece.title}</span>
                        <span className="text-[10px] text-stone-400 block truncate">
                          {piece.room_zone}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isAlreadyIn ? (
                          <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/10">
                            {t.alreadyIn}
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleInsertPieceNext(piece)}
                              className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-[10px] font-bold cursor-pointer"
                              title={t.insertNextTitle}
                            >
                              {t.insertNext}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddPieceToEnd(piece)}
                              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 cursor-pointer"
                              title={t.addToEndTitle}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Active Route Stop Sequence */
            <div className="space-y-2">
              {activeRoute.stops.map((stop, idx) => {
                const isCompleted = idx < currentStopIndex;
                const isCurrent = idx === currentStopIndex;
                const isPending = idx > currentStopIndex;
                const stopId = stop.poi_id || (stop as any).piece_id || stop.id;

                return (
                  <div
                    key={stopId || idx}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-amber-500/10 border-amber-500 shadow-md ring-1 ring-amber-500'
                        : isCompleted
                        ? 'bg-emerald-500/5 border-emerald-500/20 opacity-75'
                        : 'bg-black/40 border-white/10'
                    }`}
                  >
                    {/* Position Number */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        isCurrent
                          ? 'bg-amber-500 text-black'
                          : isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-white/5 text-stone-400 border border-white/10'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    {/* Info */}
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => {
                        onSelectStop(idx);
                        onClose();
                      }}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {isCurrent && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500 text-black">
                            {t.currentStop}
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-[9px] font-bold text-emerald-400">
                            {t.visited}
                          </span>
                        )}
                        <span className="text-[10px] text-stone-400 truncate">
                          {stop.room_zone}
                        </span>
                      </div>
                      <h4
                        className={`text-xs font-bold truncate ${
                          isCurrent ? 'text-amber-400' : 'text-white'
                        }`}
                      >
                        {stop.title}
                      </h4>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleMoveUp(idx)}
                            disabled={idx <= currentStopIndex + 1}
                            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-20 text-stone-300 cursor-pointer"
                            title={t.moveUp}
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDown(idx)}
                            disabled={idx >= activeRoute.stops.length - 1}
                            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-20 text-stone-300 cursor-pointer"
                            title={t.moveDown}
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveStop(idx)}
                            className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                            title={t.remove}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {isCurrent && (
                        <span className="text-[10px] font-mono font-bold text-amber-400 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          {t.inProgress}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-black/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition active:scale-95 cursor-pointer shadow-md"
          >
            {t.continueTour}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveRouteManagerModal;
