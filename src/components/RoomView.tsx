import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Volume2,
  Play,
  Square,
  Sparkles,
  Layers,
  Rocket,
  ChevronRight,
  Headphones,
  Compass,
} from 'lucide-react';
import { Room, PieceData } from '../types';
import { ttsPlayer } from '../utils/ttsPlayer';
import { PieceImage } from './PieceImage';
import { calculateRouteTimeMinutes, formatRouteDuration } from '../utils/routeOptimizer';
import { getRoomLabel } from '../utils/roomLabel';
import { useLanguage } from '../utils/LanguageContext';
import { roomScriptLanguage } from '../i18n/content';

interface RoomViewProps {
  room: Room;
  pieces: PieceData[];
  onBack: () => void;
  onSelectPiece: (pieceId: string) => void;
  onStartRoomTour: (room: Room, startPieceId?: string) => void;
}

export const RoomView: React.FC<RoomViewProps> = ({
  room,
  pieces,
  onBack,
  onSelectPiece,
  onStartRoomTour,
}) => {
  const { strings: t, currentLanguage } = useLanguage();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playingPieceId, setPlayingPieceId] = useState<string | null>(null);

  const isPA = room.piso === 'PA';
  const pisoText = isPA ? t.room.floorPA : t.room.floorPB;

  const salaLabel = getRoomLabel(room);

  const nombreOficial = room.nombre_oficial || room.name || room.room_id || t.room.defaultName;

  const introduccionNarrativa =
    room.introduccion_narrativa ||
    room.short_description ||
    room.frase_gancho ||
    t.room.defaultIntro;

  // Piezas de la sala ordenadas estrictamente por orden_sugerido (sin forzar Piedra del Sol)
  const sortedPieces = useMemo(() => {
    return [...pieces].sort((a, b) => (a.orden_sugerido || 99) - (b.orden_sugerido || 99));
  }, [pieces]);

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

  // Suscribirse a ttsPlayer
  useEffect(() => {
    const unsubscribe = ttsPlayer.subscribe((playing) => {
      setIsPlayingAudio(playing);
      if (!playing) {
        setPlayingPieceId(null);
      }
    });
    return () => {
      ttsPlayer.stop();
      unsubscribe();
    };
  }, [room.room_id]);

  const handleToggleNarrativeAudio = () => {
    if (isPlayingAudio && playingPieceId === null) {
      ttsPlayer.stop();
      setIsPlayingAudio(false);
    } else {
      setPlayingPieceId(null);
      ttsPlayer.play(
        introduccionNarrativa,
        `${salaLabel}: ${nombreOficial}`,
        () => {
          setIsPlayingAudio(false);
          setPlayingPieceId(null);
        },
        {
          roomName: `${salaLabel} • ${nombreOficial}`,
          mode: 'inmersion',
          lang: roomScriptLanguage(room, currentLanguage),
        }
      );
      setIsPlayingAudio(true);
    }
  };

  const handleStartContinuousTour = () => {
    ttsPlayer.stop();
    setIsPlayingAudio(false);
    onStartRoomTour(room);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0E] text-[#F3F4F6] flex flex-col pb-36 select-none animate-fadeIn">
      {/* Top Header */}
      <header className="sticky top-0 z-30 px-4 py-3 bg-[#0B0B0E]/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-stone-200 transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#F59E0B]" />
          <span>{t.room.backToExplorer}</span>
        </button>

        <span className="text-[11px] font-mono text-[#F59E0B] font-bold tracking-widest uppercase">
          {salaLabel.toUpperCase()}
        </span>
      </header>

      {/* Portada Editorial */}
      <section className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40">
            {salaLabel.toUpperCase()} • {room.piso}
          </span>
          <span className="text-xs font-semibold text-[#9CA3AF]">
            {pisoText}
          </span>
          {room.ala && (
            <span className="text-[10px] text-[#6B7280]">
              • {t.room.wing(t.room.wings[room.ala] || room.ala)}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
          {nombreOficial}
        </h1>

        {room.frase_gancho && (
          <p className="mt-2 text-xs sm:text-sm font-serif italic text-amber-300/90 leading-relaxed border-l-2 border-[#F59E0B] pl-3 py-0.5">
            «{room.frase_gancho}»
          </p>
        )}
      </section>

      {/* ================= BOTÓN PRINCIPAL DESTACADO: RECORRER ESTA SALA ================= */}
      {sortedPieces.length > 0 && (
        <section className="px-4 py-2">
          <button
            type="button"
            onClick={handleStartContinuousTour}
            className="w-full py-4 px-5 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-xl shadow-amber-500/25 active:scale-[0.98] transition-all flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-black/20 flex items-center justify-center text-black">
                <Rocket className="w-5 h-5 fill-current" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-black">
                  {t.room.startTour}
                </span>
                <span className="text-[11px] font-medium text-black/80">
                  {t.room.startTourSub(sortedPieces.length, totalMinutosEstimados)}
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </section>
      )}

      {/* Introducción de la sala con Audio */}
      <section className="px-4 py-2">
        <div className="p-4 rounded-2xl bg-[#141419] border border-white/10 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#F59E0B]">
              <Volume2 className="w-4 h-4" />
              <span className="text-xs font-extrabold uppercase tracking-wider">
                {t.room.introTitle}
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#9CA3AF]">
              {t.room.audioLabel}
            </span>
          </div>

          <p className="text-xs leading-relaxed text-[#9CA3AF]">
            {introduccionNarrativa}
          </p>

          <button
            type="button"
            onClick={handleToggleNarrativeAudio}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 transition-all active:scale-98 shadow-md cursor-pointer ${
              isPlayingAudio && playingPieceId === null
                ? 'bg-red-500/20 border border-red-500/50 text-red-300'
                : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
            }`}
          >
            {isPlayingAudio && playingPieceId === null ? (
              <>
                <Square className="w-4 h-4 fill-current animate-pulse text-red-400" />
                <span>{t.room.stopRoomAudio}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current text-amber-400" />
                <span>{t.room.listenRoomIntro}</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Lista de Piezas de la Sala */}
      <section className="px-4 pt-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.room.worksInRoom(sortedPieces.length)}</span>
          </h3>
          <span className="text-[10px] text-stone-400">
            {t.room.suggestedOrder}
          </span>
        </div>

        <div className="space-y-2">
          {sortedPieces.map((piece, idx) => {
            const pieceId = piece.piece_id || piece.id;
            return (
              <div
                key={pieceId || idx}
                onClick={() => onSelectPiece(pieceId)}
                role="button"
                tabIndex={0}
                className="p-3 rounded-2xl bg-[#141419] border border-white/10 hover:border-amber-500/40 hover:bg-[#1a1a24] transition-all flex items-center justify-between gap-3 cursor-pointer group active:scale-[0.99]"
              >
                {/* Thumbnail */}
                <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-black/60 border border-white/10">
                  <PieceImage
                    filename={piece.image_filename}
                    alt={piece.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-black/80 text-[9px] font-bold text-amber-400 border border-white/10">
                    #{piece.orden_sugerido || idx + 1}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                    {piece.titulo}
                  </h4>
                  <p className="text-[10px] text-stone-400 truncate mt-0.5">
                    {piece.frase_gancho || piece.guion_corto?.slice(0, 50)}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default RoomView;
