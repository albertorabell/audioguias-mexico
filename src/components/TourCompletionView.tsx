import React from 'react';
import { Flag, RotateCcw } from 'lucide-react';
import { RouteStop } from '../types';
import { formatRouteDuration } from '../utils/routeOptimizer';
import { useStrings } from '../utils/LanguageContext';

interface TourCompletionViewProps {
  routeName: string;
  totalStops: number;
  estimatedMinutes: number;
  stops?: RouteStop[];
  onExploreRooms: () => void;
  onChooseRoute: () => void;
  onGoHome: () => void;
  onRepeatTour?: () => void;
  onOpenMap?: () => void;
}

/** Fin de un recorrido: lo que se vio y qué hacer después. */
export const TourCompletionView: React.FC<TourCompletionViewProps> = ({
  routeName,
  totalStops,
  estimatedMinutes,
  stops = [],
  onExploreRooms,
  onChooseRoute,
  onGoHome,
  onRepeatTour,
}) => {
  const strings = useStrings();
  const t = strings.tour;
  const u = strings.ui;
  const rooms = new Set(stops.map((s) => s.room_id || s.room_zone).filter(Boolean)).size || 1;

  const stats = [
    { n: String(totalStops), label: u.worksCount(totalStops).replace(/^\d+\s*/, '') },
    { n: String(rooms), label: u.roomsCount(rooms).replace(/^\d+\s*/, '') },
    { n: formatRouteDuration(estimatedMinutes), label: t.timeSub },
  ];

  return (
    <div id="tour-completion-screen" className="min-h-dvh bg-bg text-ink pt-safe flex flex-col">
      <main className="flex-1 px-5 pt-16 pb-10">
        <span className="w-16 h-16 rounded-full bg-jade/15 text-jade flex items-center justify-center">
          <Flag className="w-8 h-8" strokeWidth={1.8} />
        </span>
        <h1 className="mt-6 font-serif text-h1 font-medium tracking-[-0.02em]">{t.completedTitle}</h1>
        <p className="mt-3 text-[1.0625rem] leading-relaxed text-ink-2">{t.completedDesc(routeName)}</p>

        <dl className="mt-8 grid grid-cols-3 border-y border-line divide-x divide-line">
          {stats.map((s) => (
            <div key={s.label} className="py-4 px-2 text-center">
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-serif text-[1.75rem] leading-none tabular-nums">{s.n}</dd>
              <dd className="mt-1.5 text-cap text-ink-3">{s.label}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 flex flex-col gap-2.5">
          <button type="button" onClick={onExploreRooms} className="btn-primary w-full">
            {t.backToExplorer}
          </button>
          <button type="button" onClick={onChooseRoute} className="btn-secondary w-full">
            {t.designAnother}
          </button>
          {onRepeatTour && (
            <button type="button" onClick={onRepeatTour} className="h-12 inline-flex items-center justify-center gap-2 text-ui font-semibold text-ink-2 cursor-pointer rounded-full active:bg-raised">
              <RotateCcw className="w-4 h-4" />
              {t.repeat}
            </button>
          )}
          <button type="button" onClick={onGoHome} className="h-12 text-ui font-semibold text-ink-3 cursor-pointer rounded-full active:bg-raised">
            {t.goHome}
          </button>
        </div>
      </main>
    </div>
  );
};

export default TourCompletionView;
