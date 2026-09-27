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
  CheckCircle,
} from 'lucide-react';
import { Room, PieceData } from '../types';
import { ttsPlayer } from '../utils/ttsPlayer';
import { PieceImage } from './PieceImage';

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
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeTab, setActiveTab] = useState<'destacadas' | 'todas'>('destacadas');
  const [playingPieceId, setPlayingPieceId] = useState<string | null>(null);

  // Normalizar piso y número
  const isPA =
    room.piso == 2 ||
    room.piso === '2' ||
    room.piso === 'PA' ||
    room.piso === 'pa' ||
    room.piso === 'planta_alta' ||
    room.piso === 'Planta Alta' ||
    (room as any).floor == 2 ||
    (room as any).floor === '2' ||
    String(room.piso || '').toLowerCase().includes('alta') ||
    parseInt(String(room.numero_oficial || room.room_id?.match(/\d+/)?.[0] || '0'), 10) >= 12;

  const pisoText = isPA ? 'Planta Alta · Etnografía' : 'Planta Baja · Arqueología';

  const numeroOficial =
    room.numero_oficial !== undefined && room.numero_oficial !== ''
      ? String(room.numero_oficial).padStart(2, '0')
      : room.room_id?.match(/\d+/)?.[0]?.padStart(2, '0') || '00';

  const nombreOficial =
    room.nombre_oficial || room.name || room.room_id || 'Sala del Museo';

  const introduccionNarrativa =
    room.introduccion_narrativa ||
    room.short_description ||
    room.frase_gancho ||
    'Bienvenidos a esta emblemática sala del Museo Nacional de Antropología.';

  // Piezas de la sala ordenadas por orden_sugerido
  const sortedPieces = useMemo(() => {
    return [...pieces].sort((a, b) => (a.orden_sugerido || 999) - (b.orden_sugerido || 999));
  }, [pieces]);

  // Segmented control: Destacadas vs Todas
  const displayedPieces = useMemo(() => {
    if (activeTab === 'destacadas') {
      // Si hay piezas destacadas marcadas o top 3
      const destacadas = sortedPieces.filter(
        (p) => (p as any).is_highlight || (p as any).ranking || p.is_free
      );
      if (destacadas.length >= 2) return destacadas;
      return sortedPieces.slice(0, Math.min(4, sortedPieces.length));
    }
    return sortedPieces;
  }, [sortedPieces, activeTab]);

  const totalMinutosEstimados = useMemo(() => {
    return sortedPieces.reduce((acc, p) => acc + (p.estimated_minutes || 6), 0);
  }, [sortedPieces]);

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

  // Reproducir introducción narrativa de la sala
  const handleToggleNarrativeAudio = () => {
    if (isPlayingAudio && playingPieceId === null) {
      ttsPlayer.stop();
      setIsPlayingAudio(false);
    } else {
      setPlayingPieceId(null);
      ttsPlayer.play(
        introduccionNarrativa,
        `Sala ${numeroOficial}: ${nombreOficial}`,
        () => {
          setIsPlayingAudio(false);
          setPlayingPieceId(null);
        },
        {
          roomName: `Sala ${numeroOficial} • ${nombreOficial}`,
          mode: 'inmersion',
        }
      );
      setIsPlayingAudio(true);
    }
  };

  // Reproducir audio rápido de una pieza directamente
  const handlePlayPieceAudio = (e: React.MouseEvent, piece: PieceData) => {
    e.stopPropagation();
    const pieceId = piece.piece_id || piece.id || (piece as any).poi_id;

    if (isPlayingAudio && playingPieceId === pieceId) {
      ttsPlayer.stop();
      setIsPlayingAudio(false);
      setPlayingPieceId(null);
    } else {
      setPlayingPieceId(pieceId);
      const textToPlay =
        piece.guion_corto ||
        piece.audioguide?.audio_script ||
        piece.summary_30s ||
        piece.frase_gancho ||
        piece.titulo;

      ttsPlayer.play(
        textToPlay,
        piece.titulo || piece.title || 'Pieza',
        () => {
          setIsPlayingAudio(false);
          setPlayingPieceId(null);
        },
        {
          roomName: `Sala ${numeroOficial} • ${nombreOficial}`,
          mode: 'expres',
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
      {/* ================= BARRA SUPERIOR DE RETORNO AL EXPLORADOR ================= */}
      <header className="sticky top-0 z-30 px-4 py-3 bg-[#0B0B0E]/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-stone-200 transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#F59E0B]" />
          <span>Explorador del Museo</span>
        </button>

        <span className="text-[11px] font-mono text-[#F59E0B] font-bold tracking-widest uppercase">
          SALA {numeroOficial}
        </span>
      </header>

      {/* ================= PORTADA EDITORIAL CON INFORMACIÓN DE LA SALA ================= */}
      <section className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40">
            SALA {numeroOficial} • {isPA ? 'PA' : 'PB'}
          </span>
          <span className="text-xs font-semibold text-[#9CA3AF]">
            {pisoText}
          </span>
          {room.ala && (
            <span className="text-[10px] text-[#6B7280]">
              • Ala {room.ala}
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

      {/* ================= TARJETA DE AUDIO DE BIENVENIDA A LA SALA ================= */}
      <section className="px-4 py-2">
        <div className="p-4 rounded-2xl bg-[#141419] border border-white/10 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#F59E0B]">
              <Volume2 className="w-4 h-4" />
              <span className="text-xs font-extrabold uppercase tracking-wider">
                Introducción a la Sala
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#9CA3AF]">
              Audio Oficial MNA
            </span>
          </div>

          <p className="text-xs leading-relaxed text-[#9CA3AF] line-clamp-3">
            {introduccionNarrativa}
          </p>

          <button
            type="button"
            onClick={handleToggleNarrativeAudio}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 transition-all active:scale-98 shadow-md cursor-pointer ${
              isPlayingAudio && playingPieceId === null
                ? 'bg-red-500/20 border border-red-500/50 text-red-300'
                : 'bg-[#F59E0B] hover:bg-amber-400 text-black shadow-lg shadow-[#F59E0B]/20'
            }`}
          >
            {isPlayingAudio && playingPieceId === null ? (
              <>
                <Square className="w-4 h-4 fill-current animate-pulse text-red-400" />
                <span>Detener Audio de la Sala</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>🎙️ Escuchar introducción a la sala (~2 min)</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* ================= BOTÓN OPCIONAL: INICIAR RECORRIDO CONTINUO ================= */}
      {sortedPieces.length > 0 && (
        <section className="px-4 pt-2">
          <button
            type="button"
            onClick={handleStartContinuousTour}
            className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs bg-[#141419] hover:bg-white/5 text-white border border-white/10 shadow-md active:scale-98 transition-all flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B]">
                <Rocket className="w-3.5 h-3.5 fill-current" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-white group-hover:text-[#F59E0B] transition-colors">
                  ▶️ Iniciar recorrido continuo de esta sala
                </span>
                <span className="text-[10px] text-[#9CA3AF]">
                  {sortedPieces.length} piezas en orden de vitrina · ~{totalMinutosEstimados} min
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-white transition-colors" />
          </button>
        </section>
      )}

      {/* ================= SEGMENTED CONTROL TÁCTIL DE DOS ESTADOS ================= */}
      <section className="px-4 pt-5 pb-2">
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#141419] border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('destacadas')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'destacadas'
                ? 'bg-[#F59E0B] text-black shadow-sm font-black'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>⭐ Piezas Destacadas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('todas')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'todas'
                ? 'bg-[#F59E0B] text-black shadow-sm font-black'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>🏛️ Todas las piezas ({sortedPieces.length})</span>
          </button>
        </div>
      </section>

      {/* ================= REJILLA / LISTA DE PIEZAS DE LA SALA ================= */}
      <section className="px-4 pt-2 space-y-3">
        {displayedPieces.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#141419] border border-white/10 text-[#9CA3AF] text-xs">
            No hay piezas registradas en este filtro.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayedPieces.map((piece, index) => {
              const pieceId = piece.piece_id || piece.id || (piece as any).poi_id;
              const titulo = piece.titulo || piece.title || 'Pieza Arqueológica';
              const orden = piece.orden_sugerido || index + 1;
              const isPlayingThis = isPlayingAudio && playingPieceId === pieceId;
              const tagline = piece.frase_gancho || piece.summary_30s || piece.puente_narrativo;

              return (
                <div
                  key={pieceId || index}
                  onClick={() => onSelectPiece(pieceId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectPiece(pieceId);
                    }
                  }}
                  className={`p-3 rounded-2xl bg-[#141419] border transition-all duration-200 cursor-pointer group active:scale-[0.98] flex gap-3.5 items-center ${
                    isPlayingThis
                      ? 'border-[#F59E0B] bg-[#1a160d] ring-1 ring-[#F59E0B]/50'
                      : 'border-white/10 hover:border-white/20 hover:bg-[#1a1a22]'
                  }`}
                >
                  {/* Miniatura WebP con Respaldo de Textura Pétrea */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10">
                    <PieceImage
                      imageFilename={piece.image_filename}
                      fallbackUrl={piece.identification?.hero_image}
                      alt={titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Badge de Orden */}
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[9px] font-mono font-bold text-[#F59E0B]">
                      #{orden}
                    </span>

                    {/* Indicador de audio activo */}
                    {isPlayingThis && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                        <div className="flex items-center gap-0.5 h-4">
                          <span className="w-1 bg-[#F59E0B] h-full animate-pulse rounded-full" />
                          <span className="w-1 bg-[#F59E0B] h-2/3 animate-pulse rounded-full delay-75" />
                          <span className="w-1 bg-[#F59E0B] h-4/5 animate-pulse rounded-full delay-150" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contenido de la Tarjeta */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 h-full">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#F59E0B] transition-colors line-clamp-1 leading-snug">
                        {titulo}
                      </h3>
                      {tagline && (
                        <p className="text-[10px] sm:text-[11px] text-[#9CA3AF] line-clamp-2 mt-0.5 leading-tight">
                          {tagline}
                        </p>
                      )}
                    </div>

                    {/* Botón de reproducción inmediata */}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => handlePlayPieceAudio(e, piece)}
                        className={`py-1 px-2.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isPlayingThis
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : 'bg-white/5 hover:bg-[#F59E0B] hover:text-black text-stone-300 border border-white/10'
                        }`}
                      >
                        {isPlayingThis ? (
                          <>
                            <Square className="w-3 h-3 fill-current text-red-400" />
                            <span>Pausar</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current text-[#F59E0B]" />
                            <span>Escuchar audio</span>
                          </>
                        )}
                      </button>

                      <span className="text-[10px] text-[#6B7280] flex items-center gap-0.5 group-hover:text-stone-300 transition-colors">
                        Ver ficha <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default RoomView;
