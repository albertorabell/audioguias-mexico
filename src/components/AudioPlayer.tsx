import React from 'react';
import { Play, Pause, RotateCcw, Lock, Sparkles, Volume2 } from 'lucide-react';
import { useAudioGuide } from '../utils/useAudioGuide';

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
  } = useAudioGuide(script, audioFileUrl);

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
        className="rounded-2xl bg-gradient-to-br from-amber-950/40 via-stone-900 to-stone-950 border border-amber-500/30 p-4.5 shadow-xl relative overflow-hidden"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-stone-950 uppercase tracking-wider">
                Contenido Premium
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Audioguía de Sala Bloqueada</h4>
            <p className="text-xs text-stone-300 leading-relaxed mb-3.5">
              Esta parada incluye el análisis arqueológico extendido, locución inmersiva y secretos de salón. Desbloquea el pase de 72 horas para disfrutar todo el sitio sin restricciones.
            </p>
            <button
              id="btn-unlock-audio-card"
              onClick={onUnlockClick}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition active:scale-98 shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
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
      className="rounded-2xl bg-stone-900/95 border border-amber-500/30 p-4 shadow-xl relative overflow-hidden"
    >
      {/* Top row: Label & Equalizer */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Volume2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wider">
              Audioguía Oficial
            </h4>
            <p className="text-[10px] text-stone-400 truncate max-w-[190px]">
              {audioFileUrl ? 'Audio de estudio' : `Voz guiada: ${voiceName}`}
            </p>
          </div>
        </div>

        {/* Animated Sound Waves Equalizer */}
        <div className="flex items-end gap-1 h-5 px-2 py-0.5 rounded-lg bg-stone-950/80 border border-stone-800">
          <span
            className={`w-1 rounded-full bg-amber-400 transition-all duration-300 ${
              isPlaying ? 'animate-[bounce_0.8s_infinite] h-4' : 'h-1.5 opacity-40'
            }`}
          />
          <span
            className={`w-1 rounded-full bg-amber-500 transition-all duration-200 ${
              isPlaying ? 'animate-[bounce_0.6s_infinite_0.2s] h-3.5' : 'h-2 opacity-40'
            }`}
          />
          <span
            className={`w-1 rounded-full bg-amber-300 transition-all duration-250 ${
              isPlaying ? 'animate-[bounce_0.9s_infinite_0.4s] h-4.5' : 'h-1 opacity-40'
            }`}
          />
          <span
            className={`w-1 rounded-full bg-amber-400 transition-all duration-300 ${
              isPlaying ? 'animate-[bounce_0.7s_infinite_0.1s] h-3' : 'h-2 opacity-40'
            }`}
          />
        </div>
      </div>

      {/* Narrative script preview quote */}
      <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800/80 mb-3.5">
        <p className="text-xs text-stone-300 italic line-clamp-2 leading-relaxed">
          "{script}"
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full h-1.5 rounded-full bg-stone-800 overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-200"
            style={{ width: `${Math.min(100, progress * 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-stone-400 font-mono mt-1">
          <span>{formatSeconds(currentTime)}</span>
          <span>{formatSeconds(duration)}</span>
        </div>
      </div>

      {/* Player Controls */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-800/80">
        {/* Speed Toggles */}
        <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
          {rates.map((r) => (
            <button
              key={r}
              id={`btn-speed-${r}x`}
              onClick={() => setRate(r)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                playbackRate === r
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {r}x
            </button>
          ))}
        </div>

        {/* Play/Pause & Reset Controls */}
        <div className="flex items-center gap-2">
          <button
            id="btn-audio-reset"
            onClick={stop}
            title="Reiniciar audio"
            className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            id="btn-audio-toggle-play"
            onClick={togglePlay}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition active:scale-95 shadow-md shadow-amber-500/20"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-stone-950" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-stone-950" />
                <span>Escuchar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
