import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  Sparkles,
  Zap,
  BookOpen,
  Award,
  Landmark,
  Compass,
  History,
  Sun,
  Palette,
  Check,
  ChevronRight,
  Play,
  Layers,
  Star,
} from 'lucide-react';
import { SiteManifest, SiteRoute, SiteSummary, RouteStop, Room, PieceData } from '../types';
import { generateOptimizedRoute, calculateRouteTimeMinutes, formatRouteDuration, MANDATORY_MNA_PIECE_ID } from '../utils/routeOptimizer';
import { useStrings } from '../utils/LanguageContext';
import { TopBar } from './ui/TopBar';

interface RouteWizardProps {
  site: SiteSummary;
  manifest: SiteManifest;
  rooms?: Room[];
  pieces?: PieceData[];
  onBack: () => void;
  onStartRoute: (route: SiteRoute) => void;
}

interface InterestTag {
  key: string;
  label: string;
  icon: React.ReactNode;
  subtitle: string;
}

export const RouteWizard: React.FC<RouteWizardProps> = ({
  site,
  manifest,
  rooms = [],
  pieces = [],
  onBack,
  onStartRoute,
}) => {
  const strings = useStrings();
  const t = strings.wizard;
  // Reset scroll to top
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // Question 1: Time Available (30, 60, 120, 999)
  const [timeMinutes, setTimeMinutes] = useState<number>(60);

  // Question 2: Thematic Interests
  const getSiteTags = (): InterestTag[] => {
    return [
      {
        key: 'cosmogonia-mexica',
        label: t.tags['cosmogonia-mexica'].label,
        icon: <Landmark className="w-4 h-4" />,
        subtitle: t.tags['cosmogonia-mexica'].subtitle,
      },
      {
        key: 'mundo-maya',
        label: t.tags['mundo-maya'].label,
        icon: <Sparkles className="w-4 h-4" />,
        subtitle: t.tags['mundo-maya'].subtitle,
      },
      {
        key: 'arte-monumental',
        label: t.tags['arte-monumental'].label,
        icon: <Award className="w-4 h-4" />,
        subtitle: t.tags['arte-monumental'].subtitle,
      },
      {
        key: 'vida-cotidiana-tumbas',
        label: t.tags['vida-cotidiana-tumbas'].label,
        icon: <History className="w-4 h-4" />,
        subtitle: t.tags['vida-cotidiana-tumbas'].subtitle,
      },
    ];
  };

  const availableTags = getSiteTags();

  // Default selection: first two tags
  const [selectedTags, setSelectedTags] = useState<string[]>(
    availableTags.slice(0, 2).map((t) => t.key)
  );

  // Question 3: Pace
  const [pace, setPace] = useState<'highlights' | 'expert'>('highlights');


  // Toggle interest
  const handleToggleTag = (tagKey: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagKey)) {
        if (prev.length <= 1) return prev;
        return prev.filter((k) => k !== tagKey);
      } else {
        return [...prev, tagKey];
      }
    });
  };

  // Real-time calculation of optimized route using pieces.json and rooms.json
  const projectedRoute = useMemo(() => {
    const piecesPool = pieces && pieces.length > 0 ? pieces : (manifest?.rooms ? manifest : []);
    return generateOptimizedRoute(
      piecesPool,
      {
        timeLimitMinutes: timeMinutes,
        selectedInterestKeys: selectedTags,
        pace,
      },
      rooms
    );
  }, [pieces, rooms, manifest, timeMinutes, selectedTags, pace]);

  // Unique rooms count in route
  const uniqueRoomsCount = useMemo(() => {
    const rSet = new Set(projectedRoute.stops.map((s) => s.room_id || s.room_zone));
    return rSet.size;
  }, [projectedRoute]);

  // Unified route duration
  const routeMinutes = useMemo(() => {
    return calculateRouteTimeMinutes(projectedRoute.stops, pace === 'expert');
  }, [projectedRoute.stops, pace]);

  const hasStops = projectedRoute.stops.length > 0;

  const handleConfirmStart = () => {
    if (hasStops) {
      onStartRoute(projectedRoute);
    }
  };

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <TopBar onBack={onBack} title={strings.ui.museum.buildRoute} revealAfter={70} />

      <main className="px-5 pt-4 pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
        <h1 className="font-serif text-h1 font-medium tracking-[-0.02em]">{strings.ui.museum.buildRoute}</h1>
        <p className="mt-3 text-[1.0625rem] leading-relaxed text-ink-2">{t.intro}</p>

        <section className="mt-10" aria-labelledby="q1-title">
          <h2 id="q1-title" className="font-serif text-h3 font-medium">
            {t.q1}
          </h2>
          <div role="radiogroup" aria-labelledby="q1-title" className="mt-4 grid grid-cols-2 gap-2.5">
            {t.timeOptions.map((opt) => {
              const on = timeMinutes === opt.mins;
              return (
                <button
                  key={opt.mins}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setTimeMinutes(opt.mins)}
                  className={`min-h-[4.5rem] p-3.5 rounded-2xl border text-left cursor-pointer transition-colors ${
                    on ? 'bg-jade/12 border-jade' : 'bg-surface border-line active:bg-raised'
                  }`}
                >
                  <span className={`block text-[1.0625rem] font-bold ${on ? 'text-jade' : 'text-ink'}`}>{opt.label}</span>
                  <span className="block mt-1 text-cap leading-snug text-ink-3">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-10" aria-labelledby="q2-title">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="q2-title" className="font-serif text-h3 font-medium">
              {t.q2}
            </h2>
          </div>
          <p className="mt-1 text-cap text-ink-3">{t.selected(selectedTags.length)}</p>
          <ul className="mt-4 space-y-2.5">
            {availableTags.map((tag) => {
              const on = selectedTags.includes(tag.key);
              return (
                <li key={tag.key}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => handleToggleTag(tag.key)}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 cursor-pointer transition-colors ${
                      on ? 'bg-jade/10 border-jade/60' : 'bg-surface border-line active:bg-raised'
                    }`}
                  >
                    <span
                      className={`mt-0.5 w-6 h-6 rounded-lg shrink-0 flex items-center justify-center ${
                        on ? 'bg-jade text-on-jade' : 'border-2 border-line-strong'
                      }`}
                    >
                      {on && <Check className="w-4 h-4" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-ui font-bold">{tag.label}</span>
                      <span className="block mt-0.5 text-cap leading-snug text-ink-3">{tag.subtitle}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-10" aria-labelledby="preview-title">
          <h2 id="preview-title" className="font-serif text-h3 font-medium">
            {t.readyTitle}
          </h2>
          <p className="mt-1 text-ui text-ink-2">{t.readySummary(projectedRoute.stops.length, uniqueRoomsCount, formatRouteDuration(routeMinutes))}</p>
          <p className="mt-1 text-cap text-ink-3">{t.sunStoneDesc}</p>
          <ol className="mt-4 border-t border-line">
            {projectedRoute.stops.map((stop, idx) => (
              <li key={stop.poi_id || idx} className="flex items-center gap-3 py-2.5 border-b border-line">
                <span className="w-7 text-right font-serif text-[1.0625rem] text-ink-3 tabular-nums shrink-0">{idx + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-ui font-semibold leading-snug">{stop.title}</span>
                  <span className="block text-cap text-ink-3 truncate">{stop.room_zone}</span>
                </span>
                {stop.poi_id === MANDATORY_MNA_PIECE_ID && <Star className="w-4 h-4 text-oro shrink-0" aria-label={t.mustSee} />}
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 pb-safe bg-bg/94 backdrop-blur-xl border-t border-line">
        <div className="max-w-[480px] mx-auto px-4 py-3">
          <button
            id="btn-start-route-fixed"
            type="button"
            disabled={!hasStops}
            onClick={handleConfirmStart}
            className="btn-primary w-full min-h-[3.25rem] disabled:opacity-40 disabled:pointer-events-none"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{hasStops ? t.startTour(projectedRoute.stops.length, formatRouteDuration(routeMinutes)) : t.pickOne}</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default RouteWizard;
