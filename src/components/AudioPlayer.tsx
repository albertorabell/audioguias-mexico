import React from 'react';
import { Play, Pause, RotateCcw, Lock, Sparkles, Volume2 } from 'lucide-react';
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
        className={`rounded-2xl p-4.5 shadow-md relative overflow-hidden border transition ${
          isSunMode
            ? 'bg-white border-amber-600/50 shadow-md text-stone-900'
            : 'bg-gradient-to-br from-amber-950/40 via-stone-900 to-stone-950 border-amber-500/30 text-stone-100'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              isSunMode
                ? 'bg-amber-100 border border-amber-300 text-amber-800'
                : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
            }`}
          >
            <Lock className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  isSunMode
                    ? 'bg-amber-700 text-white'
                    : 'bg-amber-500 text-stone-950'
                }`}
              >
                Contenido Premium
              </span>
            </div>
            <h4 className={`text-sm font-extrabold mb-1 ${isSunMode ? 'text-stone-950' : 'text-white'}`}>
              Audioguía de Sala Bloqueada
            </h4>
            <p className={`text-xs leading-relaxed mb-4 font-medium ${isSunMode ? 'text-stone-700' : 'text-stone-300'}`}>
              Esta parada incluye el análisis arqueológico extendido con locución natural y secretos de salón. Desbloquea el pase de 72 horas para disfrutar todo el sitio sin restricciones.
            </p>
            <button
              id="btn-unlock-audio-card"
              onClick={onUnlockClick}
              className={`w-full min-h-[48px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-extrabold transition active:scale-98 shadow-md ${
                isSunMode
                  ? 'bg-amber-700 hover:bg-amber-800 text-white shadow-amber-800/20'
                  : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Desbloquear recorrido completo (${passPriceMxn} MXN)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="audioguide-active-player"
      className={`rounded-2xl p-4.5 shadow-md relative overflow-hidden border transition ${
        isSunMode
          ? 'bg-white border-stone-300 shadow-md text-stone-900'
          : 'bg-stone-900/95 border-amber-500/30 shadow-xl text-stone-100'
      }`}
    >
      {/* Top row: Label & Equalizer */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isSunMode
                ? 'bg-amber-100 border border-amber-300 text-amber-800'
                : 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
            }`}
          >
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h4
              className={`text-xs font-extrabold uppercase tracking-wider ${
                isSunMode ? 'text-stone-950' : 'text-stone-200'
              }`}
            >
              Audioguía Oficial
            </h4>
            <p className={`text-[11px] font-semibold truncate max-w-[200px] ${isSunMode ? 'text-stone-600' : 'text-stone-400'}`}>
              {audioFileUrl ? 'Audio de estudio' : `Voz natural: ${voiceName}`}
            </p>
          </div>
        </div>

        {/* Animated Sound Waves Equalizer */}
        <div
          className={`flex items-end gap-1 h-6 px-2.5 py-1 rounded-lg border ${
            isSunMode
              ? 'bg-amber-50 border-amber-200'
              : 'bg-stone-950/80 border-stone-800'
          }`}
        >
          <span
            className={`w-1.5 rounded-full transition-all duration-300 ${
              isSunMode ? 'bg-amber-700' : 'bg-amber-400'
            } ${isPlaying ? 'animate-[bounce_0.8s_infinite] h-4' : 'h-1.5 opacity-40'}`}
          />
          <span
            className={`w-1.5 rounded-full transition-all duration-200 ${
              isSunMode ? 'bg-amber-800' : 'bg-amber-500'
            } ${isPlaying ? 'animate-[bounce_0.6s_infinite_0.2s] h-3.5' : 'h-2 opacity-40'}`}
          />
          <span
            className={`w-1.5 rounded-full transition-all duration-250 ${
              isSunMode ? 'bg-amber-600' : 'bg-amber-300'
            } ${isPlaying ? 'animate-[bounce_0.9s_infinite_0.4s] h-5' : 'h-1 opacity-40'}`}
          />
          <span
            className={`w-1.5 rounded-full transition-all duration-300 ${
              isSunMode ? 'bg-amber-700' : 'bg-amber-400'
            } ${isPlaying ? 'animate-[bounce_0.7s_infinite_0.1s] h-3' : 'h-2 opacity-40'}`}
          />
        </div>
      </div>

      {/* Narrative script preview quote */}
      <div
        className={`p-3.5 rounded-xl border mb-3.5 ${
          isSunMode
            ? 'bg-[#F9F6F0] border-stone-200 text-stone-800'
            : 'bg-stone-950/60 border-stone-800/80 text-stone-300'
        }`}
      >
        <p className="text-xs italic line-clamp-2 leading-relaxed font-medium">
          "{script}"
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-3.5">
        <div
          className={`w-full h-2 rounded-full overflow-hidden relative ${
            isSunMode ? 'bg-stone-200' : 'bg-stone-800'
          }`}
        >
          <div
            className={`h-full rounded-full transition-all duration-200 ${
              isSunMode
                ? 'bg-amber-700'
                : 'bg-gradient-to-r from-amber-500 to-amber-300'
            }`}
            style={{ width: `${Math.min(100, progress * 100)}%` }}
          />
        </div>
        <div
          className={`flex justify-between items-center text-[10px] font-mono font-bold mt-1.5 ${
            isSunMode ? 'text-stone-700' : 'text-stone-400'
          }`}
        >
          <span>{formatSeconds(currentTime)}</span>
          <span>{formatSeconds(duration)}</span>
        </div>
      </div>

      {/* Player Controls (min-h-[48px] ergonomía) */}
      <div
        className={`flex items-center justify-between gap-2 pt-2 border-t ${
          isSunMode ? 'border-stone-200' : 'border-stone-800/80'
        }`}
      >
        {/* Speed Toggles */}
        <div
          className={`flex items-center gap-1 p-1 rounded-xl border ${
            isSunMode
              ? 'bg-stone-100 border-stone-300'
              : 'bg-stone-950 border-stone-800'
          }`}
        >
          {rates.map((r) => (
            <button
              key={r}
              id={`btn-speed-${r}x`}
              onClick={() => setRate(r)}
              className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-bold transition active:scale-95 ${
                playbackRate === r
                  ? isSunMode
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'bg-amber-500 text-stone-950 shadow-xs'
                  : isSunMode
                  ? 'text-stone-700 hover:text-stone-950'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {r}x
            </button>
          ))}
        </div>

        {/* Play/Pause & Reset Controls (min-h-[48px] tactile targets) */}
        <div className="flex items-center gap-2">
          <button
            id="btn-audio-reset"
            onClick={stop}
            title="Reiniciar audio"
            className={`min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl transition active:scale-95 border ${
              isSunMode
                ? 'text-stone-700 hover:text-stone-950 hover:bg-stone-100 border-stone-300 bg-white'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800 border-stone-800 bg-stone-900'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            id="btn-audio-toggle-play"
            onClick={togglePlay}
            className={`min-h-[48px] flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition active:scale-95 shadow-md ${
              isSunMode
                ? 'bg-amber-700 hover:bg-amber-800 text-white shadow-amber-800/20'
                : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Escuchar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
