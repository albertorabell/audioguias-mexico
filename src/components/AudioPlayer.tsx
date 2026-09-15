import React from 'react';
import { Play, Pause, RotateCcw, Lock, Sparkles, Headphones } from 'lucide-react';
import { useAudioGuide } from '../utils/useAudioGuide';
import { useTheme } from '../utils/ThemeContext';

interface AudioPlayerProps {
  script: string;
  audioFileUrl?: string;
  isPremium: boolean;
  hasPass: boolean;
  passPriceMxn: number;
  onUnlockClick: () => void;
  title: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  script,
  audioFileUrl,
  isPremium,
  hasPass,
  passPriceMxn,
  onUnlockClick,
  title,
}) => {
  const isLocked = isPremium && !hasPass;
  const { isSunMode } = useTheme();

  const {
    isPlaying,
    playbackRate,
    progress,
    currentTime,
    duration,
    togglePlay,
    stop,
    setRate,
    voiceName,
  } = useAudioGuide(script, audioFileUrl, 'es-MX');

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const rates = [1, 1.25, 1.5];

  if (isLocked) {
    return (
      <div
        id="audioguide-locked-card"
        className={`rounded-2xl p-5 border transition-all ${
          isSunMode
            ? 'bg-[#FAF8F5] border-stone-200 text-stone-900'
            : 'bg-[#1A1816] border-stone-800 text-stone-100'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isSunMode
                ? 'bg-[#C05638]/10 text-[#C05638]'
                : 'bg-[#D96B47]/20 text-[#D96B47]'
            }`}
          >
            <Lock className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span
              className={`inline-block text-[10px] font-bold tracking-wider uppercase mb-1 ${
                isSunMode ? 'text-[#C05638]' : 'text-[#D96B47]'
              }`}
            >
              Audioguía Exclusiva
            </span>
            <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-1">
              Contenido para Visitantes con Pase
            </h4>
            <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400 mb-4 font-normal">
              Accede a la narración de sala en alta definición, análisis arqueológico detallado y contexto curatorial completo.
            </p>
            <button
              id="btn-unlock-audio-card"
              onClick={onUnlockClick}
              className="w-full min-h-[46px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all bg-[#C05638] hover:bg-[#A9482E] dark:bg-[#D96B47] dark:hover:bg-[#C05638] text-white active:scale-98 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Desbloquear Pase Completo (${passPriceMxn} MXN)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="audioguide-active-player"
      className={`rounded-2xl p-4 sm:p-5 border transition-all ${
        isSunMode
          ? 'bg-[#FAF8F5] border-stone-200/90 text-stone-900'
          : 'bg-[#181614] border-stone-800 text-stone-100'
      }`}
    >
      {/* Top info bar: Voice metadata & Equalizer */}
      <div className="flex items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-2 min-w-0">
          <Headphones
            className={`w-4 h-4 shrink-0 ${
              isSunMode ? 'text-[#C05638]' : 'text-[#D96B47]'
            }`}
          />
          <div className="min-w-0">
            <span className="text-[11px] font-semibold tracking-wide uppercase block truncate text-stone-800 dark:text-stone-200">
              Audioguía de Sala
            </span>
            <span className="text-[10px] text-stone-500 dark:text-stone-400 block truncate">
              {audioFileUrl ? 'Audio de estudio' : voiceName ? `Voz: ${voiceName}` : 'Locución asistida'}
            </span>
          </div>
        </div>

        {/* Minimal sound wave pulse */}
        <div className="flex items-end gap-1 h-5 px-2 py-1 rounded-full bg-stone-200/50 dark:bg-stone-800/60">
          <span
            className={`w-1 rounded-full transition-all duration-300 ${
              isSunMode ? 'bg-[#C05638]' : 'bg-[#D96B47]'
            } ${isPlaying ? 'h-3.5 animate-pulse' : 'h-1.5 opacity-40'}`}
          />
          <span
            className={`w-1 rounded-full transition-all duration-200 ${
              isSunMode ? 'bg-[#C05638]' : 'bg-[#D96B47]'
            } ${isPlaying ? 'h-4 animate-bounce' : 'h-2 opacity-40'}`}
          />
          <span
            className={`w-1 rounded-full transition-all duration-250 ${
              isSunMode ? 'bg-[#C05638]' : 'bg-[#D96B47]'
            } ${isPlaying ? 'h-3 animate-pulse' : 'h-1.5 opacity-40'}`}
          />
        </div>
      </div>

      {/* Thin elegant Progress Bar */}
      <div className="mb-4">
        <div
          className={`w-full h-1.5 rounded-full overflow-hidden relative ${
            isSunMode ? 'bg-stone-200' : 'bg-stone-800'
          }`}
        >
          <div
            className={`h-full rounded-full transition-all duration-200 ${
              isSunMode ? 'bg-[#C05638]' : 'bg-[#D96B47]'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] font-mono font-medium mt-1.5 text-stone-500 dark:text-stone-400">
          <span>{formatSeconds(currentTime)}</span>
          <span>{formatSeconds(duration)}</span>
        </div>
      </div>

      {/* Ergonomic thumb controls: Big circular Play button, Speed pill, Reset */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {/* Speed toggle pills */}
        <div
          className={`flex items-center p-0.5 rounded-full border ${
            isSunMode
              ? 'bg-white/80 border-stone-200 text-stone-600'
              : 'bg-stone-900 border-stone-800 text-stone-400'
          }`}
        >
          {rates.map((r) => (
            <button
              key={r}
              id={`btn-speed-${r}x`}
              type="button"
              onClick={() => setRate(r)}
              className={`min-h-[32px] px-2.5 rounded-full text-[11px] font-semibold transition-all ${
                playbackRate === r
                  ? isSunMode
                    ? 'bg-[#C05638] text-white shadow-xs'
                    : 'bg-[#D96B47] text-white shadow-xs'
                  : 'hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              {r}x
            </button>
          ))}
        </div>

        {/* Primary controls: Restart + Large Thumb-Friendly Circular Play Button */}
        <div className="flex items-center gap-3">
          <button
            id="btn-audio-reset"
            type="button"
            onClick={stop}
            title="Reiniciar reproducción"
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95 border ${
              isSunMode
                ? 'border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                : 'border-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            id="btn-audio-toggle-play"
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pausar audio' : 'Reproducir audio'}
            className="w-13 h-13 sm:w-14 sm:h-14 flex items-center justify-center rounded-full transition-all active:scale-95 shadow-md bg-[#C05638] hover:bg-[#A9482E] dark:bg-[#D96B47] dark:hover:bg-[#C05638] text-white"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
