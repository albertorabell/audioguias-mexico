import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  ChevronDown,
  Volume2,
  Headphones,
  Zap,
  Sparkles,
  Maximize2,
  FileText,
} from 'lucide-react';
import { PieceData } from '../types';
import { ttsPlayer, TTSState } from '../utils/ttsPlayer';
import { PieceImage } from './PieceImage';
import { getAssetUrl } from '../utils/urlHelper';
import { useLanguage } from '../utils/LanguageContext';
import { scriptLanguage } from '../i18n/content';
import { resolvePieceAudio } from '../utils/audioSource';

interface FloatingAudioPlayerProps {
  currentPiece: PieceData | null;
  roomName?: string;
  onOpenPieceDetail?: () => void;
}

export const FloatingAudioPlayer: React.FC<FloatingAudioPlayerProps> = ({
  currentPiece,
  roomName,
  onOpenPieceDetail,
}) => {
  const { strings: t, currentLanguage } = useLanguage();
  const [ttsState, setTtsState] = useState<TTSState>(ttsPlayer.getState());
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedMode, setSelectedMode] = useState<'expres' | 'inmersion'>('expres');

  // Suscribirse a cambios del motor de audio
  useEffect(() => {
    const unsubscribe = ttsPlayer.subscribe((_, state) => {
      setTtsState(state);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Mantener modo sincronizado
  useEffect(() => {
    if (ttsState.audioMode) {
      setSelectedMode(ttsState.audioMode);
    }
  }, [ttsState.audioMode]);

  // Si no hay pieza activa ni audio reproduciendo, no mostrar nada
  if (!currentPiece && !ttsState.script && !ttsState.isPlaying) {
    return null;
  }

  // Si el motor de audio quedó con otra pieza (en pausa o detenido), se muestra la pieza actual y no la vieja.
  const currentId = currentPiece?.piece_id || currentPiece?.id;
  const engineIsOtherPiece = !!currentId && !!ttsState.pieceId && ttsState.pieceId !== currentId && !ttsState.isPlaying;
  const engineTitle = engineIsOtherPiece ? '' : ttsState.title;

  const pieceTitle =
    engineTitle ||
    currentPiece?.titulo ||
    currentPiece?.title ||
    (currentPiece as any)?.identification?.title ||
    t.player.defaultPieceTitle;

  const pieceRoom =
    (engineIsOtherPiece ? '' : ttsState.roomName) ||
    roomName ||
    currentPiece?.location?.room_name ||
    currentPiece?.room_id ||
    t.common.museumName;

  const imageFilename =
    currentPiece?.image_filename ||
    (currentPiece as any)?.identification?.hero_image ||
    '';

  const guionCorto =
    currentPiece?.guion_corto ||
    currentPiece?.summary_30s ||
    (currentPiece as any)?.narrative?.short_desc ||
    currentPiece?.frase_gancho ||
    ttsState.script ||
    t.player.defaultPieceSummary;

  const guionLargo =
    currentPiece?.guion_largo ||
    (currentPiece as any)?.audioguide?.audio_script ||
    (currentPiece as any)?.narrative?.deep_desc ||
    guionCorto;

  const currentScript = selectedMode === 'expres' ? guionCorto : guionLargo;
  // La voz depende del idioma del texto que se lee: si la pieza no está traducida se lee en español.
  const readLang = currentPiece ? scriptLanguage(currentPiece, currentLanguage) : currentLanguage;

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleTogglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (ttsState.isPlaying) {
      ttsPlayer.pause();
    } else if (ttsState.isPaused && !engineIsOtherPiece) {
      ttsPlayer.resume();
    } else {
      ttsPlayer.play(
        currentScript,
        pieceTitle,
        undefined,
        {
          roomName: pieceRoom,
          artworkUrl: imageFilename ? getAssetUrl(`images/pieces/${imageFilename}`) : undefined,
          pieceId: currentPiece?.piece_id || currentPiece?.id,
          mode: selectedMode,
          audioUrl: currentPiece ? resolvePieceAudio(currentPiece as any, currentLanguage, selectedMode)?.url : undefined,
          lang: readLang,
        }
      );
    }
  };

  const handleSkip = (seconds: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    ttsPlayer.skip(seconds);
  };

  const handleChangeMode = (mode: 'expres' | 'inmersion') => {
    setSelectedMode(mode);
    const targetScript = mode === 'expres' ? guionCorto : guionLargo;
    if (ttsState.isPlaying) {
      ttsPlayer.play(
        targetScript,
        pieceTitle,
        undefined,
        {
          roomName: pieceRoom,
          artworkUrl: imageFilename ? getAssetUrl(`images/pieces/${imageFilename}`) : undefined,
          pieceId: currentPiece?.piece_id || currentPiece?.id,
          mode,
          audioUrl: currentPiece ? resolvePieceAudio(currentPiece as any, currentLanguage, mode)?.url : undefined,
          lang: readLang,
        }
      );
    }
  };

  const speeds = [1, 1.25, 1.5];

  return (
    <>
      {/* ================= 1. MINI REPRODUCTOR FLOTANTE (ESTILO SPOTIFY) ================= */}
      <div
        id="floating-mini-player"
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-[70px] left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-[460px] z-30 backdrop-blur-xl bg-[#141419]/95 border border-white/10 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] overflow-hidden cursor-pointer transition-all duration-300 active:scale-[0.99] group select-none"
      >
        {/* Barra de progreso de audio animada en tono dorado (#F59E0B) */}
        <div className="w-full h-1 bg-white/10 relative overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#F59E0B] to-yellow-300 transition-all duration-200"
            style={{ width: `${Math.min(100, Math.max(0, ttsState.progress * 100))}%` }}
          />
        </div>

        <div className="p-2.5 flex items-center justify-between gap-3">
          {/* Miniatura de la pieza con esquinas redondeadas */}
          <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-black/60 shrink-0 border border-white/10 shadow-md">
            <PieceImage
              filename={imageFilename}
              alt={pieceTitle}
              className="w-full h-full object-cover"
            />
            {ttsState.isPlaying && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-ping" />
              </div>
            )}
          </div>

          {/* Título de la pieza y sala actual */}
          <div className="flex-1 min-w-0 pr-1">
            <h4 className="text-xs font-bold text-[#F3F4F6] truncate tracking-tight group-hover:text-[#F59E0B] transition-colors">
              {pieceTitle}
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] text-[#9CA3AF] truncate mt-0.5">
              <span className="text-[#F59E0B] font-semibold">
                {selectedMode === 'expres' ? t.player.modeExpress : t.player.modeImmersion}
              </span>
              <span>•</span>
              <span className="truncate">{pieceRoom}</span>
            </div>
          </div>

          {/* Botones de acción táctiles: -15s, Play/Pause, +15s */}
          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              id="btn-mini-skip-back"
              type="button"
              onClick={(e) => handleSkip(-15, e)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/5 active:scale-90 transition cursor-pointer"
              title={t.player.skipBackTitle}
              aria-label={t.player.skipBackTitle}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              id="btn-mini-toggle-play"
              type="button"
              onClick={handleTogglePlay}
              aria-label={ttsState.isPlaying ? t.player.pauseAudio : t.player.playAudio}
              className="w-10 h-10 rounded-full bg-[#F59E0B] hover:bg-amber-400 text-black flex items-center justify-center shadow-lg shadow-[#F59E0B]/25 active:scale-95 transition cursor-pointer"
            >
              {ttsState.isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              id="btn-mini-skip-forward"
              type="button"
              onClick={(e) => handleSkip(15, e)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/5 active:scale-90 transition cursor-pointer"
              title={t.player.skipForwardTitle}
              aria-label={t.player.skipForwardTitle}
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= 2. REPRODUCTOR EXTENDIDO (BOTTOM SHEET / FULL SCREEN) ================= */}
      {isExpanded && (
        <div
          id="extended-bottom-sheet-player"
          className="fixed inset-0 z-50 bg-[#0B0B0E]/98 backdrop-blur-2xl flex flex-col justify-between overflow-y-auto animate-fadeIn select-none"
        >
          {/* Barra Superior con botón para colapsar */}
          <div className="sticky top-0 z-10 px-5 pt-4 pb-2 flex items-center justify-between border-b border-white/5 bg-[#0B0B0E]/90 backdrop-blur-md">
            <button
              id="btn-collapse-player"
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-2 -ml-2 rounded-full hover:bg-white/10 text-[#9CA3AF] hover:text-white transition active:scale-95"
              aria-label={t.player.collapseAria}
            >
              <ChevronDown className="w-6 h-6" />
            </button>

            <div className="text-center min-w-0 px-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F59E0B] block">
                {t.player.nowPlaying}
              </span>
              <p className="text-xs font-semibold text-[#9CA3AF] truncate max-w-[220px]">
                {pieceRoom}
              </p>
            </div>

            <div className="w-8" />
          </div>

          {/* Contenido Central: Carátula Cinematográfica + Metadata */}
          <div className="flex-1 max-w-md mx-auto w-full px-6 py-4 flex flex-col items-center justify-center">
            {/* Foto de la pieza en gran formato con esquinas redondeadas y resplandor */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl overflow-hidden bg-black/60 shadow-[0_20px_60px_rgba(0,0,0,0.9)] border border-white/10 mb-6 group">
              <PieceImage
                filename={imageFilename}
                alt={pieceTitle}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Título de la pieza y sala */}
            <div className="text-center w-full mb-5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F59E0B]">
                {pieceRoom}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F3F4F6] mt-1 leading-snug line-clamp-2">
                {pieceTitle}
              </h2>
              {currentPiece?.frase_gancho && (
                <p className="text-xs font-serif italic text-[#9CA3AF] mt-1 line-clamp-2">
                  «{currentPiece.frase_gancho}»
                </p>
              )}
            </div>

            {/* Selector de modo de audio ("🎙️ Visita Rápida 2 min" vs "🎧 Inmersiva 5 min") */}
            <div className="w-full grid grid-cols-2 p-1 rounded-2xl bg-[#141419] border border-white/10 mb-6">
              <button
                type="button"
                onClick={() => handleChangeMode('expres')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedMode === 'expres'
                    ? 'bg-[#F59E0B] text-black shadow-md'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{t.player.modeQuick}</span>
              </button>

              <button
                type="button"
                onClick={() => handleChangeMode('inmersion')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedMode === 'inmersion'
                    ? 'bg-[#F59E0B] text-black shadow-md'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>{t.player.modeImmersive}</span>
              </button>
            </div>

            {/* Barra de progreso de audio interactiva */}
            <div className="w-full mb-6">
              <div
                className="w-full h-2 rounded-full bg-white/10 relative overflow-hidden cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                  ttsPlayer.skip((ratio - ttsState.progress) * ttsState.duration);
                }}
              >
                <div
                  className="h-full bg-[#F59E0B] rounded-full transition-all duration-150"
                  style={{ width: `${Math.min(100, Math.max(0, ttsState.progress * 100))}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[11px] font-mono text-[#9CA3AF] mt-2">
                <span>{formatSeconds(ttsState.currentTime)}</span>
                <span>{formatSeconds(ttsState.duration)}</span>
              </div>
            </div>

            {/* Controles Maestros de Reproducción */}
            <div className="w-full flex items-center justify-between gap-4 mb-6">
              {/* Selector de velocidad */}
              <div className="flex items-center p-0.5 rounded-full bg-[#141419] border border-white/10">
                {speeds.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => ttsPlayer.setRate(s)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                      ttsState.playbackRate === s
                        ? 'bg-[#F59E0B] text-black'
                        : 'text-[#9CA3AF] hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              {/* Botón -15s */}
              <button
                type="button"
                onClick={(e) => handleSkip(-15, e)}
                className="w-12 h-12 rounded-full bg-[#141419] border border-white/10 text-[#F3F4F6] hover:bg-white/10 active:scale-95 transition flex items-center justify-center cursor-pointer shadow-md"
                title={t.player.skipBackShort}
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* Botón Play / Pause Grande */}
              <button
                type="button"
                onClick={handleTogglePlay}
                className="w-16 h-16 rounded-full bg-[#F59E0B] hover:bg-amber-400 text-black flex items-center justify-center shadow-xl shadow-[#F59E0B]/30 active:scale-95 transition cursor-pointer"
                aria-label={ttsState.isPlaying ? t.player.pauseNarration : t.player.startNarration}
              >
                {ttsState.isPlaying ? (
                  <Pause className="w-7 h-7 fill-current" />
                ) : (
                  <Play className="w-7 h-7 fill-current ml-1" />
                )}
              </button>

              {/* Botón +15s */}
              <button
                type="button"
                onClick={(e) => handleSkip(15, e)}
                className="w-12 h-12 rounded-full bg-[#141419] border border-white/10 text-[#F3F4F6] hover:bg-white/10 active:scale-95 transition flex items-center justify-center cursor-pointer shadow-md"
                title={t.player.skipForwardShort}
              >
                <RotateCw className="w-5 h-5" />
              </button>

              <div className="w-10" />
            </div>

            {/* Transcripción Narrativa Editorial */}
            <div className="w-full pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-[#F59E0B]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF]">
                  {t.player.transcript}
                </h3>
              </div>
              {readLang !== currentLanguage && (
                <p className="text-[11px] text-amber-300/90 mb-2" data-testid="script-lang-note">
                  {t.player.scriptOnlySpanish}
                </p>
              )}
              <div className="p-4 rounded-2xl bg-[#141419] border border-white/10 text-[#F3F4F6]">
                <p className="font-serif text-sm sm:text-base leading-relaxed text-[#F3F4F6]/95 first-letter:text-3xl first-letter:font-bold first-letter:text-[#F59E0B] first-letter:mr-1">
                  {currentScript}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAudioPlayer;
