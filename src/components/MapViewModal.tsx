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
  onSelectRoom?: (room: Room) => void;
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
  onSelectRoom,
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
      (s: any) =>
        s.room_id === roomId ||
        s.roomId === roomId ||
        (s.room_zone && s.room_zone.toLowerCase().includes(roomId.replace('sala-', '')))
    );
    if (matchingStopIdx !== -1) {
      setSelectedPinIndex(matchingStopIdx);
    }
  };

  // Pin click handler
  const handleSelectPin = (stopIndex: number) => {
    setSelectedPinIndex(stopIndex);
    const stop = stops[stopIndex];
    const roomId = (stop as any)?.room_id || (stop as any)?.roomId;
    if (roomId) {
      setSelectedRoomId(roomId);
      setIsDrawerOpen(true);
    }
  };

  // Get inspected room details with full compatibility
  const inspectedRoom = rooms.find((r: any) => r.room_id === selectedRoomId || r.id === selectedRoomId);
  const selectedStop = stops[selectedPinIndex] || stops[currentStopIndex] || null;

  // Handle adding piece to route
  const handleAddPiece = (piece: RoomPieceSummary, room: Room) => {
    if (onAddStopToRoute) {
      const pieceId = (piece as any).piece_id || (piece as any).id || piece.poi_id;
      const roomId = room.room_id || room.id;
      const newStop: RouteStop = {
        poi_id: pieceId,
        title: piece.title,
        room_zone: room.nombre_oficial || room.name || roomId,
        file: piece.file,
        map_coords: room.coords || { x: 50, y: 50 },
        estimated_minutes: piece.estimated_minutes || 8,
        room_id: roomId,
        ranking: piece.is_premium ? 2 : 1,
      };
      onAddStopToRoute(newStop);
      setAddedPoiMap((prev) => ({ ...prev, [pieceId]: true }));
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
      <header className="px-4 py-3 border-b border-white/10 bg-[#0B0B0E]/95 backdrop-blur-xl flex items-center justify-between gap-3 z-30 text-[#F3F4F6]">
        <div className="flex items-center gap-2.5 truncate">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-[#F59E0B]">
            <Navigation className="w-5 h-5" />
          </div>
          <div className="truncate">
            <h3 className="text-sm font-extrabold truncate text-white">
              Plano Arquitectónico • {siteName}
            </h3>
            <p className="text-[11px] font-medium truncate text-[#9CA3AF]">
              {routeName} • {stops.length} paradas • Toca cualquier sala para inspeccionar
            </p>
          </div>
        </div>

        <button
          id="btn-close-map-modal"
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition active:scale-95 text-[#9CA3AF] hover:text-white hover:bg-white/10 cursor-pointer"
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
        className="flex-1 relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing bg-[#0B0B0E]"
      >
        {/* Floating Zoom Controls Top-Right */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          <div className="flex flex-col rounded-2xl border border-white/10 shadow-xl p-1 backdrop-blur-xl bg-[#141419]/90 text-stone-200">
            <button
              id="btn-map-zoom-in"
              onClick={handleZoomIn}
              disabled={scale >= 2.5}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition disabled:opacity-30 hover:bg-white/10 text-stone-200 cursor-pointer"
              title="Acercar mapa"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <div className="h-px w-6 self-center my-0.5 bg-white/10" />
            <button
              id="btn-map-zoom-out"
              onClick={handleZoomOut}
              disabled={scale <= 0.9}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition disabled:opacity-30 hover:bg-white/10 text-stone-200 cursor-pointer"
              title="Alejar mapa"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <div className="h-px w-6 self-center my-0.5 bg-white/10" />
            <button
              id="btn-map-zoom-reset"
              onClick={handleReset}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition hover:bg-white/10 text-stone-200 cursor-pointer"
              title="Restablecer vista"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Map Legend Top-Left */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-xl text-[11px] font-bold border shadow-md bg-[#141419]/90 text-stone-200 border-white/10">
          <span className="flex items-center gap-1.5 text-[#F59E0B]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] animate-pulse" />
            Paradas de ruta
          </span>
          <span className="text-stone-600">•</span>
          <span className="text-[#9CA3AF]">
            Plano Oficial INAH
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
          className="border-t border-white/10 z-30 transition-all duration-300 max-h-[55vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom bg-[#141419] text-[#F3F4F6]"
        >
          {/* Drawer Handle & Header */}
          <div className="px-4 pt-3 pb-2 border-b border-white/10 flex items-start justify-between bg-[#0B0B0E]">
            <div className="flex-1 pr-3">
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-2.5" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30">
                  {inspectedRoom.culture} • {inspectedRoom.period}
                </span>
              </div>
              <h4 className="text-base font-black mt-1 leading-snug text-white">{inspectedRoom.name}</h4>
              <p className="text-xs mt-0.5 leading-relaxed line-clamp-2 text-[#9CA3AF]">
                {inspectedRoom.short_description}
              </p>

              {onSelectRoom && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onClose();
                    onSelectRoom(inspectedRoom);
                  }}
                  className="mt-2.5 px-3 py-1.5 rounded-xl bg-[#F59E0B] hover:bg-amber-400 text-black text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-[#F59E0B]/20 active:scale-95 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Explorar Sala e Iniciar Recorrido 🚀</span>
                </button>
              )}
            </div>

            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1 rounded-lg text-[#9CA3AF] hover:text-white"
              aria-label="Cerrar cajón"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Featured Pieces in this Room */}
          <div className="p-4 overflow-y-auto space-y-2.5 flex-1 bg-[#141419]">
            <h5 className="text-[11px] font-black uppercase tracking-wider text-[#F59E0B] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Obras destacadas en esta sala ({inspectedRoom.pieces_info?.length || 0})</span>
            </h5>

            {inspectedRoom.pieces_info && inspectedRoom.pieces_info.length > 0 ? (
              <div className="space-y-2">
                {inspectedRoom.pieces_info.map((piece: any) => {
                  const pieceId = piece.piece_id || piece.id || piece.poi_id;
                  const isAlreadyInRoute = stops.some((s: any) => s.piece_id === pieceId || s.id === pieceId || s.poi_id === pieceId);
                  const isAdded = addedPoiMap[pieceId] || isAlreadyInRoute;

                  return (
                    <div
                      key={pieceId}
                      className="p-2.5 rounded-2xl border border-white/10 bg-[#0B0B0E] hover:border-[#F59E0B]/50 flex items-center justify-between gap-3 transition-colors"
                    >
                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-xs bg-[#141419]">
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
                                ? 'bg-amber-500/20 text-[#F59E0B]'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {piece.is_premium ? 'Premium' : 'Gratis'}
                          </span>
                          <span className="text-[10px] font-medium flex items-center gap-1 text-[#9CA3AF]">
                            <Clock className="w-3 h-3" />
                            {piece.estimated_minutes || 8} min
                          </span>
                        </div>
                        <h6 className="text-xs font-bold truncate mt-0.5 text-white">{piece.title}</h6>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Play piece audio */}
                        <button
                          type="button"
                          onClick={() => handleStartPieceAudio(piece.file)}
                          className="px-2.5 py-1.5 rounded-xl bg-[#F59E0B] hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1 transition active:scale-95 shadow-xs cursor-pointer"
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
                            className="p-2 rounded-xl border border-white/10 bg-[#141419] hover:bg-white/10 text-stone-200 transition active:scale-95 cursor-pointer"
                            title="Agregar a mi ruta"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        ) : (
                          <span
                            className="p-2 rounded-xl text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
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
              <p className="text-xs p-3 rounded-xl border border-white/10 text-center bg-[#0B0B0E] text-[#9CA3AF]">
                No hay piezas individuales registradas para esta sala.
              </p>
            )}
          </div>
        </section>
      ) : (
        /* Fallback: Default Active Stop Preview Footer if no room is inspected */
        selectedStop && (
          <footer className="p-3.5 border-t border-white/10 z-30 bg-[#141419] text-[#F3F4F6] shadow-2xl">
            <div className="flex items-center justify-between gap-3 max-w-[600px] mx-auto">
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-md border border-white/10 bg-[#0B0B0E]">
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
                        ? 'bg-amber-500/20 text-[#F59E0B] border-[#F59E0B]/40'
                        : selectedPinIndex < currentStopIndex
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-white/5 text-[#9CA3AF] border-white/10'
                    }`}
                  >
                    {selectedPinIndex === currentStopIndex
                      ? 'Parada Actual'
                      : selectedPinIndex < currentStopIndex
                      ? 'Completada ✓'
                      : `Parada ${selectedPinIndex + 1}`}
                  </span>
                  <span className="text-[10px] truncate font-semibold text-[#9CA3AF]">
                    {selectedStop.room_zone}
                  </span>
                </div>

                <h4 className="text-xs font-extrabold truncate text-white">
                  {selectedStop.title}
                </h4>
              </div>

              <button
                id={`btn-go-to-stop-${selectedStop.poi_id}`}
                onClick={() => {
                  onSelectStop(selectedPinIndex);
                  onClose();
                }}
                className={`min-h-[48px] px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition active:scale-95 shadow-md shrink-0 cursor-pointer ${
                  selectedPinIndex === currentStopIndex
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-[#F59E0B] hover:bg-amber-400 text-black shadow-[#F59E0B]/20'
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
