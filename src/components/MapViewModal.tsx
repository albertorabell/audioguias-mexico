import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Navigation,
  Sparkles,
  ChevronRight,
  Headphones,
  Plus,
  Check,
  Clock,
  Layers,
} from 'lucide-react';
import { RouteStop, Room, RoomPieceSummary } from '../types';
import { VenueFloorplan } from './VenueFloorplan';
import { MuseumMapSvg } from './MuseumMapSvg';
import { SafeImage } from './SafeImage';
import { useTheme } from '../utils/ThemeContext';

interface MapViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  siteName: string;
  routeName: string;
  stops: RouteStop[];
  currentStopIndex: number;
  onSelectStop: (stopIndex: number) => void;
  rooms?: Room[];
  onOpenPieceFile?: (filePath: string) => void;
  onAddStopToRoute?: (stop: RouteStop) => void;
}

export const MapViewModal: React.FC<MapViewModalProps> = ({
  isOpen,
  onClose,
  siteId,
  siteName,
  routeName,
  stops,
  currentStopIndex,
  onSelectStop,
  rooms = [],
  onOpenPieceFile,
  onAddStopToRoute,
}) => {
  const { isSunMode } = useTheme();

  // Zoom and Pan State
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedPinIndex, setSelectedPinIndex] = useState<number>(currentStopIndex);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Room Inspection Bottom Sheet Drawer State
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [addedPoiMap, setAddedPoiMap] = useState<Record<string, boolean>>({});

  // When modal opens, match selected pin and room to active stop
  useEffect(() => {
    if (isOpen) {
      setSelectedPinIndex(currentStopIndex);
      setScale(1);
      setPan({ x: 0, y: 0 });
      const activeStop = stops[currentStopIndex];
      if (activeStop?.room_id) {
        setSelectedRoomId(activeStop.room_id);
      }
    }
  }, [isOpen, currentStopIndex, stops]);

  if (!isOpen) return null;

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.3, 2.5));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.3, 0.9));
  const handleReset = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, .group, input')) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button, .group, input')) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStartRef.current.x,
      y: e.touches[0].clientY - dragStartRef.current.y,
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  // Room selection handler (Click to Inspect)
  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    setIsDrawerOpen(true);

    // Also see if any stop in route is in this room
    const matchingStopIdx = stops.findIndex(
      (s) => s.room_id === roomId || s.room_zone.toLowerCase().includes(roomId.replace('sala-', ''))
    );
    if (matchingStopIdx !== -1) {
      setSelectedPinIndex(matchingStopIdx);
    }
  };

  // Pin click handler
  const handleSelectPin = (stopIndex: number) => {
    setSelectedPinIndex(stopIndex);
    const stop = stops[stopIndex];
    if (stop?.room_id) {
      setSelectedRoomId(stop.room_id);
      setIsDrawerOpen(true);
    }
  };

  // Get inspected room details
  const inspectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const selectedStop = stops[selectedPinIndex] || stops[currentStopIndex] || null;

  // Handle adding piece to route
  const handleAddPiece = (piece: RoomPieceSummary, room: Room) => {
    if (onAddStopToRoute) {
      const newStop: RouteStop = {
        poi_id: piece.poi_id,
        title: piece.title,
        room_zone: room.name,
        file: piece.file,
        map_coords: room.coords || { x: 50, y: 50 },
        estimated_minutes: piece.estimated_minutes || 8,
        room_id: room.id,
        ranking: piece.is_premium ? 2 : 1,
      };
      onAddStopToRoute(newStop);
      setAddedPoiMap((prev) => ({ ...prev, [piece.poi_id]: true }));
    }
  };

  // Handle opening a piece in tour
  const handleStartPieceAudio = (pieceFile: string) => {
    if (onOpenPieceFile) {
      onOpenPieceFile(pieceFile);
      onClose();
    }
  };

  return (
    <div
      id="modal-interactive-map"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between select-none overflow-hidden"
    >
      {/* Top Bar */}
      <header
        className={`px-4 py-3 border-b flex items-center justify-between gap-3 z-30 transition-colors duration-200 ${
          isSunMode
            ? 'bg-white/95 border-stone-300 text-stone-900 shadow-sm'
            : 'bg-stone-950/95 border-stone-800 text-stone-100'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isSunMode
                ? 'bg-amber-100 border border-amber-300 text-amber-800'
                : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
            }`}
          >
            <Navigation className="w-5 h-5" />
          </div>
          <div className="truncate">
            <h3 className={`text-sm font-extrabold truncate ${isSunMode ? 'text-stone-950' : 'text-white'}`}>
              Plano Arquitectónico • {siteName}
            </h3>
            <p className={`text-[11px] font-medium truncate ${isSunMode ? 'text-stone-600' : 'text-stone-400'}`}>
              {routeName} • {stops.length} paradas • Toca cualquier sala para inspeccionar
            </p>
          </div>
        </div>

        <button
          id="btn-close-map-modal"
          onClick={onClose}
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition active:scale-95 ${
            isSunMode ? 'hover:bg-stone-100 text-stone-600' : 'hover:bg-stone-800 text-stone-400 hover:text-white'
          }`}
          aria-label="Cerrar mapa"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Center Interactive Map Canvas with Pan & Zoom */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`flex-1 relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing ${
          isSunMode ? 'bg-[#ECE5DB]' : 'bg-[#0B0D12]'
        }`}
      >
        {/* Floating Zoom Controls Top-Right */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          <div
            className={`flex flex-col rounded-2xl border shadow-xl p-1 backdrop-blur-md ${
              isSunMode
                ? 'bg-white/90 border-stone-300 text-stone-800'
                : 'bg-stone-900/90 border-stone-800 text-stone-200'
            }`}
          >
            <button
              id="btn-map-zoom-in"
              onClick={handleZoomIn}
              disabled={scale >= 2.5}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition disabled:opacity-30 ${
                isSunMode ? 'hover:bg-stone-100 text-stone-900' : 'hover:bg-stone-800 text-stone-200'
              }`}
              title="Acercar mapa"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <div className={`h-px w-6 self-center my-0.5 ${isSunMode ? 'bg-stone-200' : 'bg-stone-800'}`} />
            <button
              id="btn-map-zoom-out"
              onClick={handleZoomOut}
              disabled={scale <= 0.9}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition disabled:opacity-30 ${
                isSunMode ? 'hover:bg-stone-100 text-stone-900' : 'hover:bg-stone-800 text-stone-200'
              }`}
              title="Alejar mapa"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <div className={`h-px w-6 self-center my-0.5 ${isSunMode ? 'bg-stone-200' : 'bg-stone-800'}`} />
            <button
              id="btn-map-zoom-reset"
              onClick={handleReset}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition ${
                isSunMode ? 'hover:bg-stone-100 text-stone-900' : 'hover:bg-stone-800 text-stone-200'
              }`}
              title="Restablecer vista"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Map Legend Top-Left */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md text-[11px] font-bold border shadow-md bg-stone-900/85 text-stone-200 border-stone-800">
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            Paradas de ruta
          </span>
          <span className="text-stone-500">•</span>
          <span className="text-stone-300">
            {isSunMode ? 'Modo Cantera' : 'Modo Blueprint'}
          </span>
        </div>

        {/* Interactive Floorplan Container */}
        <div
          className="relative max-w-[900px] w-[95vw] aspect-[5/4] max-h-[72vh] transition-transform duration-150 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          {siteId === 'MNA' ? (
            <MuseumMapSvg
              rooms={rooms}
              selectedRoomId={selectedRoomId}
              onSelectRoom={handleSelectRoom}
              stops={stops}
              currentStopIndex={selectedPinIndex}
              onSelectStop={handleSelectPin}
            />
          ) : (
            <VenueFloorplan
              siteId={siteId}
              rooms={rooms}
              selectedRoomId={selectedRoomId}
              onSelectRoom={handleSelectRoom}
              stops={stops}
              currentStopIndex={selectedPinIndex}
              onSelectStop={handleSelectPin}
            />
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* BOTTOM SHEET / DRAWER: INSPECCIÓN DE SALA (CLICK TO INSPECT) */}
      {/* ============================================================ */}
      {isDrawerOpen && inspectedRoom ? (
        <section
          id="drawer-room-inspection"
          className={`border-t z-30 transition-all duration-300 max-h-[55vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom ${
            isSunMode
              ? 'bg-[#FAF8F5] border-stone-300 text-[#111827]'
              : 'bg-stone-950 border-stone-800 text-stone-100'
          }`}
        >
          {/* Drawer Handle & Header */}
          <div className="px-4 pt-3 pb-2 border-b flex items-start justify-between">
            <div className="flex-1 pr-3">
              <div className="w-10 h-1 rounded-full bg-stone-400/40 mx-auto mb-2.5" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  {inspectedRoom.culture} • {inspectedRoom.period}
                </span>
              </div>
              <h4 className="text-base font-black mt-1 leading-snug text-[#111827] dark:text-stone-100">{inspectedRoom.name}</h4>
              <p
                className={`text-xs mt-0.5 leading-relaxed line-clamp-2 ${
                  isSunMode ? 'text-[#4B5563]' : 'text-stone-400'
                }`}
              >
                {inspectedRoom.short_description}
              </p>
            </div>

            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-200"
              aria-label="Cerrar cajón"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Featured Pieces in this Room */}
          <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
            <h5 className="text-[11px] font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Obras destacadas en esta sala ({inspectedRoom.pieces_info?.length || 0})</span>
            </h5>

            {inspectedRoom.pieces_info && inspectedRoom.pieces_info.length > 0 ? (
              <div className="space-y-2">
                {inspectedRoom.pieces_info.map((piece) => {
                  const isAlreadyInRoute = stops.some((s) => s.poi_id === piece.poi_id);
                  const isAdded = addedPoiMap[piece.poi_id] || isAlreadyInRoute;

                  return (
                    <div
                      key={piece.poi_id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                        isSunMode
                          ? 'bg-stone-50 border-stone-200/90 hover:border-amber-400'
                          : 'bg-stone-900/70 border-stone-800/90 hover:border-amber-500/60'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-stone-700/20 shadow-xs">
                        <SafeImage
                          src={piece.thumbnail}
                          alt={piece.title}
                          fallbackTitle={piece.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                              piece.is_premium
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {piece.is_premium ? 'Premium' : 'Gratis'}
                          </span>
                          <span
                            className={`text-[10px] font-medium flex items-center gap-1 ${
                              isSunMode ? 'text-stone-500' : 'text-stone-400'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {piece.estimated_minutes || 8} min
                          </span>
                        </div>
                        <h6 className="text-xs font-bold truncate mt-0.5">{piece.title}</h6>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Play piece audio */}
                        <button
                          type="button"
                          onClick={() => handleStartPieceAudio(piece.file)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1 transition active:scale-95 shadow-xs"
                          title="Escuchar audio de esta obra"
                        >
                          <Headphones className="w-3.5 h-3.5" />
                          <span>Escuchar</span>
                        </button>

                        {/* Add to route */}
                        {!isAdded ? (
                          <button
                            type="button"
                            onClick={() => handleAddPiece(piece, inspectedRoom)}
                            className={`p-1.5 rounded-lg border text-xs font-semibold transition active:scale-95 ${
                              isSunMode
                                ? 'bg-white border-stone-300 text-stone-800 hover:bg-stone-100'
                                : 'bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700'
                            }`}
                            title="Agregar a mi ruta"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        ) : (
                          <span
                            className="p-1.5 rounded-lg text-emerald-500 bg-emerald-500/10"
                            title="En tu ruta"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p
                className={`text-xs p-3 rounded-xl border text-center ${
                  isSunMode
                    ? 'bg-stone-100 border-stone-200 text-stone-600'
                    : 'bg-stone-900 border-stone-800 text-stone-400'
                }`}
              >
                No hay piezas individuales registradas para esta sala.
              </p>
            )}
          </div>
        </section>
      ) : (
        /* Fallback: Default Active Stop Preview Footer if no room is inspected */
        selectedStop && (
          <footer
            className={`p-3.5 border-t z-30 transition-colors duration-200 ${
              isSunMode
                ? 'bg-white border-stone-300 text-stone-900 shadow-2xl'
                : 'bg-stone-950 border-stone-800 text-stone-100 shadow-2xl'
            }`}
          >
            <div className="flex items-center justify-between gap-3 max-w-[600px] mx-auto">
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-md">
                <SafeImage
                  src={`data/${siteId.toLowerCase()}/${selectedStop.file.split('/').slice(-2).join('/')}`.replace(
                    '.json',
                    '.jpg'
                  )}
                  alt={selectedStop.title}
                  fallbackTitle={selectedStop.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 truncate">
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      selectedPinIndex === currentStopIndex
                        ? isSunMode
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : selectedPinIndex < currentStopIndex
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : isSunMode
                        ? 'bg-stone-100 text-stone-700 border-stone-300'
                        : 'bg-stone-900 text-stone-400 border-stone-800'
                    }`}
                  >
                    {selectedPinIndex === currentStopIndex
                      ? 'Parada Actual'
                      : selectedPinIndex < currentStopIndex
                      ? 'Completada ✓'
                      : `Parada ${selectedPinIndex + 1}`}
                  </span>
                  <span
                    className={`text-[10px] truncate font-semibold ${
                      isSunMode ? 'text-stone-600' : 'text-stone-400'
                    }`}
                  >
                    {selectedStop.room_zone}
                  </span>
                </div>

                <h4 className={`text-xs font-extrabold truncate ${isSunMode ? 'text-stone-950' : 'text-white'}`}>
                  {selectedStop.title}
                </h4>
              </div>

              <button
                id={`btn-go-to-stop-${selectedStop.poi_id}`}
                onClick={() => {
                  onSelectStop(selectedPinIndex);
                  onClose();
                }}
                className={`min-h-[48px] px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition active:scale-95 shadow-md shrink-0 ${
                  selectedPinIndex === currentStopIndex
                    ? isSunMode
                      ? 'bg-stone-800 hover:bg-stone-900 text-white'
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                    : isSunMode
                    ? 'bg-amber-700 hover:bg-amber-800 text-white shadow-amber-800/20'
                    : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20'
                }`}
              >
                <span>{selectedPinIndex === currentStopIndex ? 'Ver detalles' : 'Ir a esta parada'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </footer>
        )
      )}
    </div>
  );
};
