import React from 'react';
import { ChevronLeft, ChevronRight, Lock, Pause, Play, Flag } from 'lucide-react';
import { useStrings } from '../utils/LanguageContext';

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
  /** Resalta "siguiente" cuando el audio ya terminó. */
  nextHighlighted?: boolean;
  prevLabel: string;
  nextLabel: string;
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
}) => {
  const u = useStrings().ui.piece;
  const pct = Math.max(0, Math.min(100, progress * 100));

  return (
    <div
      id="piece-dock"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 pb-safe bg-bg/94 backdrop-blur-xl border-t border-line"
    >
      <div className="max-w-[480px] mx-auto h-[4.5rem] px-3 flex items-center gap-2">
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
            locked ? 'bg-oro text-on-oro' : started ? 'bg-raised text-ink' : 'bg-jade text-on-jade'
          }`}
        >
          {!locked && started && (
            <span
              className="absolute inset-y-0 left-0 bg-jade/35 transition-[width] duration-300 ease-linear"
              style={{ width: `${pct}%` }}
              aria-hidden="true"
            />
          )}
          <span className="relative flex items-center justify-center gap-2 px-4 h-full">
            {locked ? (
              <>
                <Lock className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                <span className="text-ui font-bold truncate">{u.unlock}</span>
              </>
            ) : (
              <>
                {isPlaying ? (
                  <Pause className="w-5 h-5 shrink-0 fill-current" />
                ) : (
                  <Play className="w-5 h-5 shrink-0 fill-current" />
                )}
                <span className="text-ui font-bold truncate">
                  {started ? (isPlaying ? u.pause : u.resume) : u.listen}
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
