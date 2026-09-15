import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, MapPin, Check, Navigation, Sparkles, ChevronRight } from 'lucide-react';
import { RouteStop } from '../types';
import { VenueFloorplan } from './VenueFloorplan';
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
}) => {
  const { isSunMode } = useTheme();

  // Zoom and Pan State
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedPinIndex, setSelectedPinIndex] = useState<number>(currentStopIndex);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync selected pin with active stop when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPinIndex(currentStopIndex);
      setScale(1);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, currentStopIndex]);

  if (!isOpen) return null;

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.3, 2.5));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.3, 0.9));
  const handleReset = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag if not clicking a button/pin
    if ((e.target as HTMLElement).closest('button')) return;
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

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
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

  const selectedStop = stops[selectedPinIndex] || stops[currentStopIndex] || null;

  return (
    <div
      id="modal-interactive-map"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between animate-in fade-in duration-200 select-none overflow-hidden"
    >
      {/* Top Bar */}
      <header
        className={`px-4 py-3 border-b flex items-center justify-between gap-3 z-30 transition-colors duration-200 ${
          isSunMode
            ? 'bg-white/95 border-stone-300 text-stone-900 shadow-xs'
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
              Plano de {siteName}
            </h3>
            <p className={`text-[11px] font-medium truncate ${isSunMode ? 'text-stone-600' : 'text-stone-400'}`}>
              {routeName} • {stops.length} paradas en mapa
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
          isSunMode ? 'bg-[#ECE5DB]' : 'bg-[#0E0E10]'
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

        {/* Map Legend Floating Pill Top-Left */}
        <div className="absolute top-4 left-4 z-20 hidden xs:flex items-center gap-3 px-3 py-1.5 rounded-full backdrop-blur-md text-[11px] font-bold border shadow-md bg-stone-900/80 text-stone-200 border-stone-800">
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            Actual
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Completada
          </span>
          <span className="flex items-center gap-1 text-stone-400">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-600" />
            Pendiente
          </span>
        </div>

        {/* Zoomable / Pannable Floorplan Container */}
        <div
          className="relative max-w-[760px] w-[92vw] aspect-[4/3] max-h-[62vh] transition-transform duration-150 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Architectural Floorplan Vector */}
          <VenueFloorplan siteId={siteId} />

          {/* Interactive Route Stop Pins */}
          {stops.map((stop, idx) => {
            const coords = stop.map_coords || { x: 50, y: 50 };
            const isActive = idx === currentStopIndex;
            const isCompleted = idx < currentStopIndex;
            const isSelected = idx === selectedPinIndex;

            return (
              <div
                key={stop.poi_id}
                style={{
                  position: 'absolute',
                  left: `${coords.x}%`,
                  top: `${coords.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="z-20"
              >
                {/* Concentric Pulse Rings for Active Stop */}
                {isActive && (
                  <>
                    <span className="absolute -inset-2.5 rounded-full bg-amber-500 opacity-60 animate-ping pointer-events-none" />
                    <span className="absolute -inset-4 rounded-full bg-amber-500/25 animate-pulse pointer-events-none" />
                  </>
                )}

                {/* Pin Button (min 44px tap target) */}
                <button
                  id={`btn-pin-${stop.poi_id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPinIndex(idx);
                  }}
                  className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full shadow-2xl transition duration-200 active:scale-95 ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 ring-4 ring-amber-400/50 scale-110'
                      : isCompleted
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/40 hover:scale-105'
                      : 'bg-stone-800 text-stone-200 ring-2 ring-stone-600 hover:scale-105'
                  } ${isSelected ? 'ring-4 ring-white shadow-amber-500/50 scale-115 z-30' : ''}`}
                  title={`${idx + 1}. ${stop.title}`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[3]" />
                  ) : (
                    <span className="text-xs font-mono font-extrabold">{idx + 1}</span>
                  )}
                </button>

                {/* Inline mini badge showing title on desktop/tablet */}
                <div
                  className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 rounded-md text-[9px] font-bold whitespace-nowrap shadow-md pointer-events-none hidden sm:block ${
                    isActive
                      ? 'bg-amber-500 text-stone-950'
                      : 'bg-stone-900/90 text-stone-200 border border-stone-800'
                  }`}
                >
                  {stop.title.split('(')[0]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Tooltip / Stop Preview Card (Tap to Navigate) */}
      {selectedStop && (
        <footer
          className={`p-3.5 border-t z-30 transition-colors duration-200 ${
            isSunMode
              ? 'bg-white border-stone-300 text-stone-900 shadow-2xl'
              : 'bg-stone-950 border-stone-800 text-stone-100 shadow-2xl'
          }`}
        >
          <div className="flex items-center justify-between gap-3 max-w-[600px] mx-auto">
            {/* Thumbnail */}
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-md">
              <SafeImage
                src={`data/${siteId.toLowerCase()}/${selectedStop.file.split('/').slice(-2).join('/')}`.replace(
                  '.json',
                  '.jpg'
                )}
                alt={selectedStop.title}
                fallbackTitle={selectedStop.title}
                className="w-full h-full"
              />
            </div>

            {/* Info */}
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
                <span className={`text-[10px] truncate font-semibold ${isSunMode ? 'text-stone-600' : 'text-stone-400'}`}>
                  {selectedStop.room_zone}
                </span>
              </div>

              <h4 className={`text-xs font-extrabold truncate ${isSunMode ? 'text-stone-950' : 'text-white'}`}>
                {selectedStop.title}
              </h4>
            </div>

            {/* Action Button (min 48px de altura táctil) */}
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
      )}
    </div>
  );
};
