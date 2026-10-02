import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  Rocket,
} from 'lucide-react';
import { RouteStop, Room, PieceData } from '../types';
import { MuseumMapSvg } from './MuseumMapSvg';
import { SafeImage } from './SafeImage';
import { useTheme } from '../utils/ThemeContext';
import { getAssetUrl } from '../utils/urlHelper';
import { getRoomLabel } from '../utils/roomLabel';
import { useStrings } from '../utils/LanguageContext';

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
  pieces?: PieceData[];
  onOpenPieceFile?: (filePath: string) => void;
  onAddStopToRoute?: (stop: RouteStop) => void;
  onSelectRoom?: (room: Room) => void;
  onStartRoomTour?: (room: Room) => void;
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
  pieces = [],
  onOpenPieceFile,
  onAddStopToRoute,
  onSelectRoom,
  onStartRoomTour,
}) => {
  const { isSunMode } = useTheme();
  const t = useStrings().map;

  // Zoom and Pan State
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedPinIndex, setSelectedPinIndex] = useState<number>(currentStopIndex);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Room Inspection Drawer State
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

  // Find inspected room by exact room_id, svg_id or aliases
  const inspectedRoom = useMemo(() => {
    if (!selectedRoomId) return null;
    return (
      rooms.find(
        (r) =>
          r.room_id === selectedRoomId ||
          r.svg_id === selectedRoomId ||
          (r.aliases && r.aliases.includes(selectedRoomId))
      ) || null
    );
  }, [rooms, selectedRoomId]);

  // Real pieces for this room from pieces.json
  const inspectedRoomPieces = useMemo(() => {
    if (!inspectedRoom) return [];
    return pieces
      .filter(
        (p) =>
          p.room_id === inspectedRoom.room_id ||
          (inspectedRoom.aliases && inspectedRoom.aliases.includes(p.room_id))
      )
      .sort((a, b) => (a.orden_sugerido || 99) - (b.orden_sugerido || 99));
  }, [pieces, inspectedRoom]);

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

  // Room selection handler (from touching a room in the SVG)
  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    setIsDrawerOpen(true);

    const matchingStopIdx = stops.findIndex(
      (s: any) => s.room_id === roomId || (s.room_zone && s.room_zone.toLowerCase().includes(roomId))
    );
    if (matchingStopIdx !== -1) {
      setSelectedPinIndex(matchingStopIdx);
    }
  };

  // Directly start continuous tour of this room
  const handleDirectRoomTour = () => {
    if (inspectedRoom && onStartRoomTour) {
      setIsDrawerOpen(false);
      onClose();
      onStartRoomTour(inspectedRoom);
    } else if (inspectedRoom && onSelectRoom) {
      setIsDrawerOpen(false);
      onClose();
      onSelectRoom(inspectedRoom);
    }
  };

  // Handle adding piece to route
  const handleAddPiece = (piece: PieceData) => {
    if (onAddStopToRoute && inspectedRoom) {
      const pId = piece.piece_id || piece.id;
      const newStop: RouteStop = {
        poi_id: pId,
        piece_id: pId,
        id: pId,
        title: piece.titulo,
        room_zone: inspectedRoom.nombre_oficial,
        file: piece.image_filename || '',
        map_coords: { x: piece.map_x || 50, y: piece.map_y || 50 },
        estimated_minutes: 2.0,
        room_id: inspectedRoom.room_id,
        ranking: stops.length + 1,
        thumbnail: piece.image_filename ? getAssetUrl(`images/pieces/${piece.image_filename}`) : '',
        is_premium: !piece.is_free,
      };
      onAddStopToRoute(newStop);
      setAddedPoiMap((prev) => ({ ...prev, [pId]: true }));
    }
  };

  // Handle opening a piece in tour
  const handleStartPieceAudio = (pieceId: string) => {
    if (onOpenPieceFile) {
      onOpenPieceFile(pieceId);
      onClose();
    }
  };

  const selectedStop = stops[selectedPinIndex] || stops[currentStopIndex] || null;

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
              {t.title(siteName)}
            </h3>
            <p className="text-[11px] font-medium truncate text-[#9CA3AF]">
              {t.subtitle(routeName)}
            </p>
          </div>
        </div>

        <button
          id="btn-close-map-modal"
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition active:scale-95 text-[#9CA3AF] hover:text-white hover:bg-white/10 cursor-pointer"
          aria-label={t.closeAria}
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
              title={t.zoomIn}
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <div className="h-px w-6 self-center my-0.5 bg-white/10" />
            <button
              id="btn-map-zoom-out"
              onClick={handleZoomOut}
              disabled={scale <= 0.9}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition disabled:opacity-30 hover:bg-white/10 text-stone-200 cursor-pointer"
              title={t.zoomOut}
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <div className="h-px w-6 self-center my-0.5 bg-white/10" />
            <button
              id="btn-map-reset"
              onClick={handleReset}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition hover:bg-white/10 text-stone-200 cursor-pointer"
              title={t.center}
            >
              <RotateCcw className="w-4 h-4 text-amber-500" />
            </button>
          </div>
        </div>

        {/* Scaled & Translated Map Container */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
          className="w-full h-full max-w-4xl p-4 flex items-center justify-center"
        >
          <MuseumMapSvg
            rooms={rooms}
            selectedRoomId={selectedRoomId}
            onSelectRoom={handleSelectRoom}
            stops={stops}
            currentStopIndex={currentStopIndex}
            onSelectStop={(stopIdx) => {
              setSelectedPinIndex(stopIdx);
              onSelectStop(stopIdx);
            }}
            showFloorSelector={true}
          />
        </div>
      </div>

      {/* ================= CAJÓN INFERIOR DE INSPECCIÓN DE SALA ================= */}
      {isDrawerOpen && inspectedRoom ? (
        <section
          id="drawer-room-inspection"
          className="max-h-[50vh] sm:max-h-[40vh] border-t border-white/10 z-30 flex flex-col bg-[#0B0B0E] text-[#F3F4F6] shadow-2xl animate-slideUp"
        >
          {/* Header del Cajón: nombre_oficial, frase_gancho y número real de piezas */}
          <div className="p-4 border-b border-white/10 flex items-start justify-between gap-3 bg-[#141419]">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-[#F59E0B] border border-[#F59E0B]/40">
                  {getRoomLabel(inspectedRoom).toUpperCase()} • {inspectedRoom.piso}
                </span>
                <span className="text-[11px] font-bold text-amber-400">
                  {t.registeredWorks(inspectedRoomPieces.length)}
                </span>
              </div>

              <h4 className="text-base sm:text-lg font-black text-white truncate">
                {inspectedRoom.nombre_oficial}
              </h4>

              {inspectedRoom.frase_gancho && (
                <p className="text-xs italic text-amber-300/80 mt-1 line-clamp-2">
                  «{inspectedRoom.frase_gancho}»
                </p>
              )}

              {/* Botón Principal: Explorar sala / Iniciar recorrido */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleDirectRoomTour}
                  className="px-4 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-amber-400 text-black text-xs font-black inline-flex items-center gap-2 shadow-lg shadow-[#F59E0B]/25 active:scale-95 transition cursor-pointer"
                >
                  <Rocket className="w-4 h-4 fill-current" />
                  <span>{t.exploreRoom}</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 rounded-xl text-[#9CA3AF] hover:text-white hover:bg-white/5 cursor-pointer"
              aria-label={t.closeDrawer}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lista REAL de Piezas de la Sala calculada de pieces.json */}
          <div className="p-4 overflow-y-auto space-y-2 flex-1 bg-[#0B0B0E]">
            {inspectedRoomPieces.length > 0 ? (
              inspectedRoomPieces.map((piece, idx) => {
                const pieceId = piece.piece_id || piece.id;
                const isAlreadyInRoute = stops.some(
                  (s: any) => s.piece_id === pieceId || s.id === pieceId || s.poi_id === pieceId
                );
                const isAdded = addedPoiMap[pieceId] || isAlreadyInRoute;

                return (
                  <div
                    key={pieceId}
                    className="p-3 rounded-2xl border border-white/10 bg-[#141419] hover:border-[#F59E0B]/40 flex items-center justify-between gap-3 transition-colors"
                  >
                    {/* Thumbnail con imagen real */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-black/60 relative">
                      <SafeImage
                        src={getAssetUrl(`images/pieces/${piece.image_filename}`)}
                        alt={piece.titulo}
                        fallbackTitle={piece.titulo}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0.5 right-0.5 text-[8px] font-mono px-1 rounded bg-black/80 text-amber-400">
                        #{idx + 1}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold truncate text-white">{piece.titulo}</h5>
                      <p className="text-[10px] text-stone-400 truncate mt-0.5">
                        {piece.frase_gancho || piece.guion_corto?.slice(0, 50)}
                      </p>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartPieceAudio(pieceId)}
                        className="px-2.5 py-1.5 rounded-xl bg-[#F59E0B] hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer"
                        title={t.viewAndListen}
                      >
                        <Headphones className="w-3.5 h-3.5" />
                        <span>{t.viewWork}</span>
                      </button>

                      {!isAdded ? (
                        <button
                          type="button"
                          onClick={() => handleAddPiece(piece)}
                          className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-stone-200 transition active:scale-95 cursor-pointer"
                          title={t.addToRoute}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      ) : (
                        <span
                          className="p-2 rounded-xl text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                          title={t.inYourRoute}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs p-4 rounded-xl border border-white/10 text-center bg-[#141419] text-[#9CA3AF]">
                {t.noPieces}
              </p>
            )}
          </div>
        </section>
      ) : (
        /* Footer fallback si no hay cajón de sala abierto */
        selectedStop && (
          <footer className="p-3.5 border-t border-white/10 z-30 bg-[#141419] text-[#F3F4F6] shadow-2xl">
            <div className="flex items-center justify-between gap-3 max-w-[600px] mx-auto">
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
                      ? t.currentStop
                      : selectedPinIndex < currentStopIndex
                      ? t.completed
                      : t.stopN(selectedPinIndex + 1)}
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
                className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition active:scale-95 shadow-md shrink-0 cursor-pointer ${
                  selectedPinIndex === currentStopIndex
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-[#F59E0B] hover:bg-amber-400 text-black shadow-[#F59E0B]/20'
                }`}
              >
                <span>{selectedPinIndex === currentStopIndex ? t.viewWork : t.goToStop}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </footer>
        )
      )}
    </div>
  );
};

export default MapViewModal;
