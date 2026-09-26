import React, { useState, useEffect } from 'react';
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
import { getAssetUrl } from '../utils/urlHelper';

interface RoomDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  pieces: PieceData[];
  onStartRoomTour: (room: Room, startPieceId?: string) => void;
}

export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({
  isOpen,
  onClose,
  room,
  pieces,
  onStartRoomTour,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Normalizar piso y número
  const pisoText =
    room?.piso === 'PA' || (room as any)?.floor === 2
      ? 'Planta Alta · Etnografía'
      : 'Planta Baja · Arqueología';

  const numeroOficial =
    room?.numero_oficial !== undefined && room?.numero_oficial !== ''
      ? String(room.numero_oficial).padStart(2, '0')
      : room?.room_id?.match(/\d+/)?.[0]?.padStart(2, '0') || '00';

  const nombreOficial =
    room?.nombre_oficial || room?.name || room?.room_id || 'Sala del Museo';

  const introduccionNarrativa =
    room?.introduccion_narrativa ||
    room?.short_description ||
    room?.frase_gancho ||
    'Bienvenidos a esta emblemática sala del Museo Nacional de Antropología.';

  // Suscribirse al estado de audio
  useEffect(() => {
    const unsubscribe = ttsPlayer.subscribe((playing) => {
      setIsPlayingAudio(playing);
    });
    return () => {
      ttsPlayer.stop();
      unsubscribe();
    };
  }, [room?.room_id]);

  // Detener audio al cerrar o cambiar de sala
  useEffect(() => {
    if (!isOpen) {
      ttsPlayer.stop();
      setIsPlayingAudio(false);
    }
  }, [isOpen, room?.room_id]);

  if (!isOpen || !room) return null;

  // Piezas de la sala ordenadas por orden_sugerido
  const sortedPieces = [...pieces].sort(
    (a, b) => (a.orden_sugerido || 999) - (b.orden_sugerido || 999)
  );

  const totalMinutosEstimados = sortedPieces.reduce(
    (acc, p) => acc + (p.estimated_minutes || 6),
    0
  );

  const handleToggleNarrativeAudio = () => {
    if (isPlayingAudio) {
      ttsPlayer.stop();
      setIsPlayingAudio(false);
    } else {
      ttsPlayer.play(
        introduccionNarrativa,
        `Sala ${numeroOficial}: ${nombreOficial}`,
        () => {
          setIsPlayingAudio(false);
        },
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
    setIsPlayingAudio(false);
    onStartRoomTour(room);
  };

  const handleSelectPiece = (pieceId: string) => {
    ttsPlayer.stop();
    setIsPlayingAudio(false);
    onStartRoomTour(room, pieceId);
  };

  return (
    <div
      id="modal-room-detail"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl bg-[#0B0B0E] border border-white/10 text-[#F3F4F6] transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con portada distintiva de la Sala */}
        <header className="relative px-6 pt-6 pb-4 border-b border-white/10 bg-gradient-to-b from-[#141419] to-[#0B0B0E] flex items-start justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40">
                SALA {numeroOficial}
              </span>
              <span className="text-[11px] font-semibold text-[#9CA3AF]">
                {pisoText}
              </span>
              {room.ala && (
                <span className="text-[10px] text-[#6B7280]">
                  • {room.ala}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {nombreOficial}
            </h2>
          </div>

          <button
            id="btn-close-room-modal"
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-[#9CA3AF] hover:text-white transition active:scale-95 cursor-pointer"
            aria-label="Cerrar modal de sala"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Contenido desplazable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
          {/* Frase Gancho de la sala */}
          {room.frase_gancho && (
            <p className="text-xs sm:text-sm font-serif italic text-amber-300/90 leading-relaxed border-l-2 border-[#F59E0B] pl-3 py-0.5">
              «{room.frase_gancho}»
            </p>
          )}

          {/* Reproductor de Audio: Introducción Narrativa de la Sala */}
          <section className="p-4 rounded-2xl bg-[#141419] border border-white/10 shadow-lg">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-[#F59E0B]">
                <Volume2 className="w-4 h-4" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest">
                  Contexto Histórico de la Sala
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#6B7280]">
                Voz Neuronal IA
              </span>
            </div>

            <p className="text-xs leading-relaxed text-[#9CA3AF] line-clamp-3 mb-3">
              {introduccionNarrativa}
            </p>

            <button
              id="btn-play-room-narrative"
              type="button"
              onClick={handleToggleNarrativeAudio}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm cursor-pointer ${
                isPlayingAudio
                  ? 'bg-red-500/20 border border-red-500/50 text-red-300'
                  : 'bg-white/10 hover:bg-white/15 text-white border border-white/15'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current animate-pulse text-red-400" />
                  <span>Detener Introducción de Sala</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-[#F59E0B]" />
                  <span>Escuchar Introducción (~2 min)</span>
                </>
              )}
            </button>
          </section>

          {/* Botón Destacado: Iniciar Recorrido de esta Sala */}
          <section className="pt-1">
            <button
              id="btn-start-room-tour"
              type="button"
              onClick={handleStartTour}
              className="w-full py-4 px-5 rounded-2xl font-bold text-sm text-black bg-[#F59E0B] hover:bg-amber-400 shadow-xl shadow-[#F59E0B]/25 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Rocket className="w-4 h-4 fill-current" />
              <span>🚀 Recorrer esta sala en orden ({sortedPieces.length} piezas · ~{totalMinutosEstimados}m)</span>
            </button>
          </section>

          {/* Cuadrícula / Lista Visual de Piezas de la Sala */}
          <section className="pt-2 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Piezas Destacadas ({sortedPieces.length})</span>
              </h3>
              <span className="text-[10px] font-semibold text-[#6B7280]">Orden de vitrina</span>
            </div>

            {sortedPieces.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sortedPieces.map((piece, index) => {
                  const pieceId = piece.piece_id || piece.id || (piece as any).poi_id;
                  const titulo = piece.titulo || piece.title || 'Pieza';
                  const imagen = piece.image_filename || piece.identification?.hero_image || '';
                  const orden = piece.orden_sugerido || index + 1;

                  return (
                    <div
                      key={pieceId || index}
                      onClick={() => handleSelectPiece(pieceId)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectPiece(pieceId);
                        }
                      }}
                      className="p-3 rounded-2xl bg-[#141419] border border-white/10 hover:border-[#F59E0B]/60 hover:bg-[#181820] transition-all duration-200 cursor-pointer group active:scale-95 flex items-center gap-3 select-none"
                    >
                      {/* Thumbnail y Orden */}
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-black/60 border border-white/10">
                        <PieceImage
                          filename={imagen}
                          alt={titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-black/80 text-[9px] font-bold text-[#F59E0B] border border-white/10">
                          #{orden}
                        </div>
                      </div>

                      {/* Info de la pieza */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-[#F3F4F6] truncate group-hover:text-[#F59E0B] transition-colors">
                          {titulo}
                        </h4>
                        <p className="text-[10px] text-[#9CA3AF] truncate mt-0.5">
                          {piece.frase_gancho || `Parada ${orden} de la sala`}
                        </p>
                      </div>

                      <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#F59E0B] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs p-4 rounded-xl bg-[#141419] border border-white/10 text-center text-[#9CA3AF]">
                Esta sala no tiene piezas individuales catalogadas aún.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailModal;
