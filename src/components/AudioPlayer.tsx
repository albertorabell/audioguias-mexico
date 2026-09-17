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
  album?: string;
  artworkUrl?: string;
  onNextTrack?: () => void;
  onPreviousTrack?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  script,
  audioFileUrl,
  isPremium,
  hasPass,
  passPriceMxn,
  onUnlockClick,
  title,
  album,
  artworkUrl,
  onNextTrack,
  onPreviousTrack,
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
  } = useAudioGuide(script, audioFileUrl, 'es-MX', {
    title,
    artist: 'Museo Nacional de Antropología',
    album: album || 'Museo Nacional de Antropología · CDMX',
    artworkUrl,
    onNextTrack,
    onPreviousTrack,
    maxDurationSeconds: isLocked ? 15 : undefined,
    onDurationLimitReached: isLocked ? onUnlockClick : undefined,
  });

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const rates = [1, 1.25, 1.5];
  const effectiveDuration = isLocked ? Math.min(15, duration) : duration;
  const effectiveProgress = isLocked ? Math.min(1, currentTime / 15) : progress;
  const isTeaserFinished = isLocked && currentTime >= 15;

  return (
    <div
      id="audioguide-active-player"
      className={`rounded-2xl p-4 sm:p-5 border transition-all ${
        isSunMode
          ? 'bg-[#FAF8F5] border-stone-200/90 text-stone-900'
          : 'bg-[#181614] border-stone-800 text-stone-100'
      }`}
    >
      {/* Freemium Teaser Indicator if Premium & No Pass */}
      {isLocked && (
        <div
          className={`mb-3.5 p-3 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
            isSunMode
              ? 'bg-amber-50/90 border-amber-300 text-amber-950'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-[11px] font-bold block truncate">
                {isTeaserFinished
                  ? 'Muestra de 15s finalizada'
                  : 'Muestra gratuita de 15 segundos'}
              </span>
              <span className="text-[10px] opacity-80 block truncate">
                Obra Premium • Desbloquea para escuchar completo
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onUnlockClick}
            className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide bg-amber-500 text-stone-950 hover:bg-amber-400 active:scale-95 transition shrink-0"
          >
            Pase 72h
          </button>
        </div>
      )}

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
              {isLocked ? 'Muestra de Audio (Teaser)' : 'Audioguía de Sala'}
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
            style={{ width: `${Math.min(100, Math.max(0, effectiveProgress * 100))}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] font-mono font-medium mt-1.5 text-stone-500 dark:text-stone-400">
          <span>{formatSeconds(currentTime)}</span>
          <span>{formatSeconds(effectiveDuration)}</span>
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
            onClick={isTeaserFinished ? onUnlockClick : togglePlay}
            aria-label={isPlaying ? 'Pausar audio' : 'Reproducir audio'}
            className="w-13 h-13 sm:w-14 sm:h-14 flex items-center justify-center rounded-full transition-all active:scale-95 shadow-md bg-[#C05638] hover:bg-[#A9482E] dark:bg-[#D96B47] dark:hover:bg-[#C05638] text-white"
          >
            {isTeaserFinished ? (
              <Lock className="w-5 h-5 fill-current" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Finished Teaser Call-To-Action */}
      {isTeaserFinished && (
        <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-800 text-center animate-fadeIn">
          <button
            id="btn-unlock-audio-card"
            onClick={onUnlockClick}
            className="w-full min-h-[46px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all bg-[#C05638] hover:bg-[#A9482E] dark:bg-[#D96B47] dark:hover:bg-[#C05638] text-white active:scale-98 shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>👑 Desbloquear por $49 MXN / $2.99 USD</span>
          </button>
        </div>
      )}
    </div>
  );
};
