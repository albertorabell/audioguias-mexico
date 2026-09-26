import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Square,
  Volume2,
  Rocket,
  Sparkles,
  Clock,
  Layers,
  MapPin,
  ChevronRight,
  Headphones,
  Compass,
} from 'lucide-react';
import { Room, PieceData } from '../types';
import { useTheme } from '../utils/ThemeContext';
import { ttsPlayer } from '../utils/ttsPlayer';
import { PieceImage } from './PieceImage';
import { SafeImage } from './SafeImage';
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
  const { isSunMode } = useTheme();
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

  // Suscribirse a estado de audio
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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl border transition-colors duration-200 ${
          isSunMode
            ? 'bg-[#FAF8F5] border-stone-300 text-[#111827]'
            : 'bg-[#141414] border-stone-800 text-[#F5F5F4]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header de la Sala */}
        <header
          className={`px-5 py-4 border-b flex items-start justify-between gap-3 shrink-0 backdrop-blur-md ${
            isSunMode ? 'bg-white/80 border-stone-200' : 'bg-stone-900/80 border-stone-800'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                Sala {numeroOficial}
              </span>
              <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400">
                {pisoText}
              </span>
              {room.ala && (
                <span className="text-[10px] font-medium text-stone-400 dark:text-stone-500">
                  · {room.ala}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-black tracking-tight text-[#111827] dark:text-stone-100">
              {nombreOficial}
            </h2>
          </div>

          <button
            id="btn-close-room-modal"
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition active:scale-95 text-stone-500 dark:text-stone-400"
            aria-label="Cerrar modal de sala"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Contenido desplazable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
          {/* Frase Gancho si existe */}
          {room.frase_gancho && (
            <p className="text-xs sm:text-sm font-serif italic text-amber-800 dark:text-amber-300/90 leading-relaxed border-l-2 border-amber-500 pl-3">
              «{room.frase_gancho}»
            </p>
          )}

          {/* Reproductor de Audio: Introducción Narrativa de la Sala */}
          <section
            className={`p-4 rounded-2xl border transition-all ${
              isSunMode
                ? 'bg-amber-50/80 border-amber-200/90 text-[#111827]'
                : 'bg-amber-950/20 border-amber-800/40 text-stone-100'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                  Introducción Narrativa de Sala
                </span>
              </div>
              <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400">
                Voz Neuronal IA
              </span>
            </div>

            <p className="text-xs sm:text-sm leading-relaxed mb-3 text-stone-700 dark:text-stone-300 line-clamp-4">
              {introduccionNarrativa}
            </p>

            <button
              id="btn-play-room-narrative"
              type="button"
              onClick={handleToggleNarrativeAudio}
              className={`w-full py-2.5 px-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-xs cursor-pointer ${
                isPlayingAudio
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 ring-2 ring-amber-500/40'
                  : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current animate-pulse text-red-500" />
                  <span>Detener Introducción de Sala</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Escuchar Introducción de Sala (~2 min)</span>
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
              className="w-full py-3.5 px-4 rounded-2xl font-black text-sm text-stone-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Rocket className="w-4 h-4 animate-bounce" />
              <span>🚀 Iniciar Recorrido de esta Sala ({sortedPieces.length} obras · ~{totalMinutosEstimados}m)</span>
            </button>
          </section>

          {/* Lista Visual de Piezas de la Sala */}
          <section className="pt-2 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Obras Catalogadas en esta Sala ({sortedPieces.length})</span>
              </h3>
              <span className="text-[10px] font-semibold text-stone-400">Orden sugerido</span>
            </div>

            {sortedPieces.length > 0 ? (
              <div className="space-y-2">
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
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer group active:scale-98 ${
                        isSunMode
                          ? 'bg-white border-stone-200/90 hover:border-amber-400 hover:bg-stone-50/70 shadow-xs'
                          : 'bg-stone-900/60 border-stone-800 hover:border-amber-600/80 hover:bg-stone-900/90'
                      }`}
                    >
                      {/* Thumbnail y Orden */}
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-stone-200 dark:bg-stone-800 border border-stone-300 dark:border-stone-700">
                        <PieceImage
                          filename={imagen}
                          alt={titulo}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-0.5 left-0.5 px-1 rounded bg-black/70 text-[9px] font-bold text-amber-400">
                          #{orden}
                        </div>
                      </div>

                      {/* Info de la pieza */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {titulo}
                        </h4>
                        {piece.frase_gancho ? (
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                            {piece.frase_gancho}
                          </p>
                        ) : (
                          <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
                            Parada {orden} · Vitrina destacada
                          </p>
                        )}
                      </div>

                      {/* Botón directo de acceso */}
                      <div className="flex items-center gap-1 shrink-0 text-amber-600 dark:text-amber-400">
                        <span className="text-[11px] font-bold hidden xs:inline">Explorar</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs p-4 rounded-xl border text-center text-stone-500 dark:text-stone-400">
                Esta sala no tiene piezas individuales asociadas actualmente.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
