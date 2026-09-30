import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Play,
  Square,
  Volume2,
  Rocket,
  Sparkles,
  ChevronRight,
  Headphones,
} from 'lucide-react';
import { Room, PieceData } from '../types';
import { ttsPlayer } from '../utils/ttsPlayer';
import { PieceImage } from './PieceImage';
import { calculateRouteTimeMinutes, formatRouteDuration } from '../utils/routeOptimizer';

interface RoomDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  pieces: PieceData[];
  onStartRoomTour: (room: Room, startPieceId?: string) => void;
  onSelectPiece?: (pieceId: string) => void;
}

export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({
  isOpen,
  onClose,
  room,
  pieces,
  onStartRoomTour,
  onSelectPiece,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Subscribe to audio state
  useEffect(() => {
    const unsubscribe = ttsPlayer.subscribe((playing) => {
      setIsPlayingAudio(playing);
    });
    return () => {
      ttsPlayer.stop();
      unsubscribe();
    };
  }, [room?.room_id]);

  useEffect(() => {
    if (!isOpen) {
      ttsPlayer.stop();
      setIsPlayingAudio(false);
    }
  }, [isOpen, room?.room_id]);

  const sortedPieces = useMemo(() => {
    return [...pieces].sort((a, b) => (a.orden_sugerido || 99) - (b.orden_sugerido || 99));
  }, [pieces]);

  if (!isOpen || !room) return null;

  const pisoText = room.piso === 'PA' ? 'Planta Alta · Etnografía' : 'Planta Baja · Arqueología';
  const numeroOficial = room.numero_oficial ? String(room.numero_oficial).padStart(2, '0') : '';
  const nombreOficial = room.nombre_oficial || room.name || room.room_id || 'Sala';
  const totalMinutosEstimados = useMemo(() => {
    const stops = sortedPieces.map((p, idx) => ({
      poi_id: p.piece_id || p.id,
      piece_id: p.piece_id || p.id,
      id: p.piece_id || p.id,
      title: p.titulo,
      room_zone: nombreOficial,
      file: p.image_filename || '',
      map_coords: { x: p.map_x || 50, y: p.map_y || 50 },
      estimated_minutes: 5.0,
      room_id: room.room_id,
      ranking: idx + 1,
      piso: room.piso,
    }));
    return formatRouteDuration(calculateRouteTimeMinutes(stops));
  }, [sortedPieces, nombreOficial, room]);

  const handleToggleNarrativeAudio = () => {
    if (isPlayingAudio) {
      ttsPlayer.stop();
      setIsPlayingAudio(false);
    } else {
      ttsPlayer.play(
        room.introduccion_narrativa || room.frase_gancho || nombreOficial,
        `Sala ${numeroOficial}: ${nombreOficial}`,
        () => setIsPlayingAudio(false),
        {
          roomName: `Sala ${numeroOficial} • ${nombreOficial}`,
          mode: 'inmersion',
        }
      );
      setIsPlayingAudio(true);
    }
  };

  const handleStartTour = () => {
    ttsPlayer.stop();
    onClose();
    onStartRoomTour(room);
  };

  return (
    <div
      id="modal-room-detail"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl max-h-[92vh] sm:rounded-3xl rounded-t-3xl bg-[#0B0B0E] border border-white/10 text-[#F3F4F6] flex flex-col overflow-hidden shadow-2xl animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="p-4 sm:p-5 border-b border-white/10 bg-[#141419] flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40">
                SALA {numeroOficial} • {room.piso}
              </span>
              <span className="text-[11px] font-semibold text-[#9CA3AF]">
                {pisoText}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white truncate">
              {nombreOficial}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/5 transition active:scale-95 cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Frase Gancho */}
          {room.frase_gancho && (
            <p className="text-xs sm:text-sm font-serif italic text-amber-300/90 leading-relaxed border-l-2 border-[#F59E0B] pl-3 py-0.5">
              «{room.frase_gancho}»
            </p>
          )}

          {/* ================= BOTÓN PRINCIPAL DESTACADO ================= */}
          {sortedPieces.length > 0 && (
            <button
              type="button"
              onClick={handleStartTour}
              className="w-full py-3.5 px-5 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-xl shadow-amber-500/25 active:scale-[0.98] transition flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-black/20 flex items-center justify-center">
                  <Rocket className="w-4 h-4 fill-current text-black" />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-black">
                    Iniciar recorrido de esta sala
                  </span>
                  <span className="text-[11px] font-medium text-black/80">
                    {sortedPieces.length} piezas por orden de vitrina · ~{totalMinutosEstimados}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}

          {/* Audio Overview */}
          <div className="p-4 rounded-2xl bg-[#141419] border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4" />
                <span>Introducción Curatorial</span>
              </span>
              <span className="text-[10px] text-stone-400 font-mono">
                Audioguías México
              </span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              {room.introduccion_narrativa || room.frase_gancho}
            </p>
            <button
              type="button"
              onClick={handleToggleNarrativeAudio}
              className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {isPlayingAudio ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current text-red-400" />
                  <span>Detener Introducción</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
                  <span>Escuchar Introducción</span>
                </>
              )}
            </button>
          </div>

          {/* Real Pieces List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Obras en esta sala ({sortedPieces.length})</span>
              </h3>
            </div>

            {sortedPieces.length > 0 ? (
              sortedPieces.map((piece, idx) => {
                const pieceId = piece.piece_id || piece.id;
                return (
                  <div
                    key={pieceId || idx}
                    onClick={() => {
                      if (onSelectPiece) {
                        onClose();
                        onSelectPiece(pieceId);
                      }
                    }}
                    className="p-2.5 rounded-xl bg-[#141419] border border-white/5 hover:border-amber-500/30 flex items-center gap-3 cursor-pointer transition active:scale-[0.99]"
                  >
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-black/60 border border-white/10">
                      <PieceImage
                        filename={piece.image_filename}
                        alt={piece.titulo}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-0.5 left-0.5 px-1 py-0.2 rounded bg-black/80 text-[8px] font-bold text-amber-400">
                        #{piece.orden_sugerido || idx + 1}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">
                        {piece.titulo}
                      </h4>
                      <p className="text-[10px] text-stone-400 truncate">
                        {piece.frase_gancho || piece.guion_corto?.slice(0, 40)}
                      </p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-stone-500 shrink-0" />
                  </div>
                );
              })
            ) : (
              <p className="text-xs p-4 rounded-xl border border-white/10 text-center bg-[#141419] text-stone-400">
                Esta sala no tiene piezas individuales catalogadas aún.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailModal;
