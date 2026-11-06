import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Lock, Pause, Play, Flag, RotateCcw, RotateCw } from 'lucide-react';
import { useLanguage, useStrings } from '../utils/LanguageContext';
import { reproductorText } from '../i18n/reproductor';
import { PLAYBACK_RATES } from '../utils/ttsPlayer';

/** 0.75 → "0.75×", 1 → "1×" */
const rateLabel = (r: number) => `${r}×`;

interface PieceDockProps {
  /** El audio de esta pieza está sonando. */
  isPlaying: boolean;
  /** Avance del audio de 0 a 1 (0 si no ha empezado). */
  progress: number;
  /** Texto del tiempo: "0:12 / 0:46" al sonar, o la duración ("46 s") antes de empezar. */
  timeLabel: string;
  started: boolean;
  locked: boolean;
  onTogglePlay: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  prevDisabled?: boolean;
  /** La siguiente acción termina el recorrido (bandera en vez de flecha). */
  nextIsFinish?: boolean;
  /** El audio de esta pieza ya terminó: "siguiente" pasa a ser el botón principal. */
  nextHighlighted?: boolean;
  prevLabel: string;
  nextLabel: string;
  /** Velocidad actual de la voz (0.75, 1, 1.5 o 2) y cómo cambiarla. Sin esto la fila no aparece (se ve también con la obra bloqueada, para poder elegirla de antemano). */
  speed?: number;
  onSpeed?: (rate: number) => void;
  /** Barra para moverse dentro del audio (solo con el MP3; la voz del teléfono no permite saltar). Sin esto no aparece. */
  seek?: {
    current: number;
    duration: number;
    onSeek: (seconds: number) => void;
    onSkip: (delta: number) => void;
  };
}

/**
 * Barra fija de abajo en la ficha de una pieza: anterior · escuchar · siguiente.
 * El botón de en medio es también la barra de avance del audio.
 */
export const PieceDock: React.FC<PieceDockProps> = ({
  isPlaying,
  progress,
  timeLabel,
  started,
  locked,
  onTogglePlay,
  onPrev,
  onNext,
  prevDisabled,
  nextIsFinish,
  nextHighlighted,
  prevLabel,
  nextLabel,
  speed = 1,
  onSpeed,
  seek,
}) => {
  const u = useStrings().ui.piece;
  const { currentLanguage } = useLanguage();
  const rt = reproductorText(currentLanguage);
  // Mientras el dedo arrastra la barra se muestra ese valor; el audio salta al soltar
  const [drag, setDrag] = useState<number | null>(null);
  const fmt = (n: number) => `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, '0')}`;
  const showSeek = !locked && started && !!seek && seek.duration > 0;
  const pct = Math.max(0, Math.min(100, progress * 100));

  return (
    <div
      id="piece-dock"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[var(--app-w)] z-40 pb-safe bg-bg/94 backdrop-blur-xl border-t border-line"
    >
      {onSpeed && (
        <div
          id="speed-control"
          role="group"
          aria-label={u.speedAria}
          className="max-w-[var(--app-w)] mx-auto px-3 pt-2 flex items-center justify-center gap-1.5"
        >
          {PLAYBACK_RATES.map((r) => {
            const on = Math.abs(speed - r) < 0.001;
            return (
              <button
                key={r}
                id={`btn-speed-${String(r).replace('.', '_')}`}
                type="button"
                onClick={() => onSpeed(r)}
                aria-pressed={on}
                aria-label={`${u.speedAria}: ${rateLabel(r)}`}
                className={`h-7 min-w-[3.25rem] px-2 rounded-full text-cap font-bold tabular-nums transition-colors ${
                  on ? 'bg-jade text-on-jade' : 'bg-raised text-ink-2 border border-line'
                }`}
              >
                {rateLabel(r)}
              </button>
            );
          })}
        </div>
      )}
      {showSeek && seek && (
        <div id="seek-control" className="max-w-[var(--app-w)] mx-auto px-3 pt-1.5 flex items-center gap-2">
          <button
            type="button"
            id="btn-seek-back"
            onClick={() => seek.onSkip(-10)}
            aria-label={rt.back}
            className="btn-icon w-10 h-10 shrink-0 text-ink-2 relative"
          >
            <RotateCcw className="w-5 h-5" aria-hidden="true" />
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-[0.55rem] font-bold pt-px">10</span>
          </button>
          <span className="text-cap tabular-nums text-ink-3 w-9 text-right shrink-0">{fmt(drag ?? seek.current)}</span>
          <input
            id="seek-range"
            type="range"
            min={0}
            max={Math.max(1, Math.round(seek.duration))}
            step={1}
            value={Math.min(drag ?? seek.current, Math.max(1, Math.round(seek.duration)))}
            aria-label={rt.seek}
            aria-valuetext={`${fmt(drag ?? seek.current)} / ${fmt(seek.duration)}`}
            onChange={(e) => setDrag(Number(e.target.value))}
            onPointerUp={() => { if (drag !== null) { seek.onSeek(drag); setDrag(null); } }}
            onTouchEnd={() => { if (drag !== null) { seek.onSeek(drag); setDrag(null); } }}
            onKeyUp={() => { if (drag !== null) { seek.onSeek(drag); setDrag(null); } }}
            onBlur={() => { if (drag !== null) { seek.onSeek(drag); setDrag(null); } }}
            className="flex-1 min-w-0 h-8 accent-[var(--color-jade,#2f9e7e)] cursor-pointer touch-none"
          />
          <span className="text-cap tabular-nums text-ink-3 w-9 shrink-0">{fmt(seek.duration)}</span>
          <button
            type="button"
            id="btn-seek-forward"
            onClick={() => seek.onSkip(10)}
            aria-label={rt.forward}
            className="btn-icon w-10 h-10 shrink-0 text-ink-2 relative"
          >
            <RotateCw className="w-5 h-5" aria-hidden="true" />
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-[0.55rem] font-bold pt-px">10</span>
          </button>
        </div>
      )}
      <div className="max-w-[var(--app-w)] mx-auto h-[4.5rem] px-3 flex items-center gap-2">
        <button
          id="btn-piece-prev-stop"
          type="button"
          onClick={onPrev}
          disabled={prevDisabled || !onPrev}
          aria-label={prevLabel}
          className="btn-icon w-12 h-12 shrink-0 border border-line disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          id="btn-master-play-piece"
          type="button"
          onClick={onTogglePlay}
          aria-label={locked ? u.unlock : isPlaying ? u.pause : u.listen}
          className={`relative flex-1 min-w-0 h-12 rounded-full overflow-hidden cursor-pointer active:scale-[0.98] transition-transform ${
            locked ? 'bg-oro text-on-oro' : started || nextHighlighted ? 'bg-raised text-ink' : 'bg-jade text-on-jade'
          }`}
        >
          {!locked && started && (
            <span
              className="absolute inset-y-0 left-0 bg-jade/35 transition-[width] duration-300 ease-linear"
              style={{ width: `${pct}%` }}
              aria-hidden="true"
            />
          )}
          <span className="relative flex items-center justify-center gap-2 px-2 min-[360px]:px-4 h-full">
            {locked ? (
              <>
                <Lock className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                <span className="text-ui font-bold truncate">{u.unlock}</span>
              </>
            ) : (
              <>
                {isPlaying ? (
                  <Pause className="w-5 h-5 shrink-0 fill-current" />
                ) : nextHighlighted && !started ? (
                  <RotateCcw className="w-5 h-5 shrink-0" />
                ) : (
                  <Play className="w-5 h-5 shrink-0 fill-current" />
                )}
                <span className="text-ui font-bold truncate">
                  {started ? (isPlaying ? u.pause : u.resume) : nextHighlighted ? u.again : u.listen}
                </span>
                <span className={`text-cap tabular-nums shrink-0 ${started ? 'text-ink-2' : 'opacity-80'}`}>{timeLabel}</span>
              </>
            )}
          </span>
        </button>

        <button
          id={nextIsFinish ? 'btn-piece-finish-stop' : 'btn-piece-next-stop'}
          type="button"
          onClick={onNext}
          disabled={!onNext}
          aria-label={nextLabel}
          className={`btn-icon w-12 h-12 shrink-0 disabled:opacity-30 disabled:pointer-events-none transition-colors ${
            nextHighlighted ? 'bg-jade text-on-jade' : 'border border-line'
          }`}
        >
          {nextIsFinish ? <Flag className="w-5 h-5" /> : <ChevronRight className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
};

export default PieceDock;
