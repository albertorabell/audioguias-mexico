import React, { useState, useMemo, useEffect } from 'react';
import { Check, Play, X } from 'lucide-react';
import { SiteManifest, SiteRoute, Room, PieceData } from '../types';
import { generateOptimizedRoute, calculateRouteTimeMinutes, formatRouteDuration } from '../utils/routeOptimizer';
import { useStrings } from '../utils/LanguageContext';
import { TopBar } from './ui/TopBar';

interface RouteWizardProps {
  manifest: SiteManifest;
  rooms?: Room[];
  pieces?: PieceData[];
  onBack: () => void;
  onStartRoute: (route: SiteRoute) => void;
}

/**
 * «Armar a tu medida»: tres preguntas (tiempo, temas, tipo de audio) y un recorrido que se puede ajustar quitando obras.
 * Elige primero las obras imprescindibles de las salas escogidas y las ordena como se camina el museo.
 */
export const RouteWizard: React.FC<RouteWizardProps> = ({ manifest, rooms = [], pieces = [], onBack, onStartRoute }) => {
  const strings = useStrings();
  const t = strings.wizard;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  const [timeMinutes, setTimeMinutes] = useState<number>(120);
  const [themeIds, setThemeIds] = useState<string[]>([]);
  const [pace, setPace] = useState<'highlights' | 'expert'>('highlights');
  const [removed, setRemoved] = useState<string[]>([]);

  const themes = (manifest?.themes || []).filter((th) => t.themes[th.id]);
  const roomIds = useMemo(() => {
    const picked = new Set<string>();
    for (const th of themes) if (themeIds.includes(th.id)) th.room_ids.forEach((r) => picked.add(r));
    return [...picked];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeIds, manifest]);

  const toggleTheme = (id: string) => setThemeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // Al cambiar las opciones se vuelve a armar el recorrido y se olvidan las obras quitadas
  useEffect(() => setRemoved([]), [timeMinutes, themeIds, pace]);

  const build = (mins: number) => generateOptimizedRoute(pieces, { timeLimitMinutes: mins, roomIds, pace }, rooms);
  const projected = useMemo(() => build(timeMinutes), [pieces, rooms, timeMinutes, roomIds, pace]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cuántas obras alcanzan en cada opción de tiempo (para que se vea qué significa «2 horas»)
  const counts = useMemo(() => {
    const out: Record<number, number> = {};
    for (const opt of t.timeOptions) out[opt.mins] = build(opt.mins).stops.length;
    return out;
  }, [pieces, rooms, roomIds, pace, t.timeOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  const stops = useMemo(() => projected.stops.filter((s) => !removed.includes(s.poi_id || s.id)), [projected, removed]);
  const routeMinutes = useMemo(() => calculateRouteTimeMinutes(stops, pace === 'expert', rooms), [stops, pace, rooms]);
  const roomCount = useMemo(() => new Set(stops.map((s) => s.room_id || s.room_zone)).size, [stops]);

  const handleStart = () => {
    if (stops.length === 0) return;
    onStartRoute({
      ...projected,
      stops: stops.map((s, i) => ({ ...s, ranking: i + 1 })),
      estimated_minutes: routeMinutes,
      duration: formatRouteDuration(routeMinutes),
    });
  };

  // Obras agrupadas por sala, en el orden del recorrido
  const groups = useMemo(() => {
    const list: { room: string; stops: typeof stops }[] = [];
    for (const s of stops) {
      const last = list[list.length - 1];
      if (last && last.room === s.room_zone) last.stops.push(s);
      else list.push({ room: s.room_zone, stops: [s] });
    }
    return list;
  }, [stops]);

  const chip = (on: boolean) =>
    `min-h-[3.25rem] px-3 rounded-2xl border text-left cursor-pointer transition-colors ${on ? 'bg-jade/12 border-jade' : 'bg-surface border-line active:bg-raised'}`;

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <TopBar onBack={onBack} title={strings.ui.museum.buildRoute} revealAfter={70} />

      <main className="px-5 pt-4 pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
        <h1 className="font-serif text-h1 font-medium tracking-[-0.02em]">{strings.ui.museum.buildRoute}</h1>
        <p className="mt-3 text-[1.0625rem] leading-relaxed text-ink-2">{t.intro}</p>

        <section className="mt-9" aria-labelledby="q1-title">
          <h2 id="q1-title" className="font-serif text-h3 font-medium">
            {t.q1}
          </h2>
          <div role="radiogroup" aria-labelledby="q1-title" className="mt-3 grid grid-cols-3 gap-2.5">
            {t.timeOptions.map((opt) => {
              const on = timeMinutes === opt.mins;
              return (
                <button key={opt.mins} type="button" role="radio" aria-checked={on} onClick={() => setTimeMinutes(opt.mins)} className={`${chip(on)} py-2.5`}>
                  <span className={`block text-[1.0625rem] font-bold leading-tight ${on ? 'text-jade-ink' : 'text-ink'}`}>{opt.label}</span>
                  <span className="block mt-0.5 text-[12px] leading-tight text-ink-3">{t.worksApprox(counts[opt.mins] ?? 0)}</span>
                </button>
              );
            })}
          </div>
        </section>

        {themes.length > 0 && (
          <section className="mt-9" aria-labelledby="q2-title">
            <h2 id="q2-title" className="font-serif text-h3 font-medium">
              {t.q2}
            </h2>
            <p className="mt-1 text-cap text-ink-3">{t.q2Hint}</p>
            <ul className="mt-3 space-y-2.5">
              {themes.map((th) => {
                const on = themeIds.includes(th.id);
                const label = t.themes[th.id];
                return (
                  <li key={th.id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => toggleTheme(th.id)}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 cursor-pointer transition-colors ${on ? 'bg-jade/10 border-jade/60' : 'bg-surface border-line active:bg-raised'}`}
                    >
                      <span className={`mt-0.5 w-6 h-6 rounded-lg shrink-0 flex items-center justify-center ${on ? 'bg-jade text-on-jade' : 'border-2 border-line-strong'}`}>
                        {on && <Check className="w-4 h-4" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-ui font-bold">{label.label}</span>
                        <span className="block mt-0.5 text-cap leading-snug text-ink-3">{label.sub}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section className="mt-9" aria-labelledby="q3-title">
          <h2 id="q3-title" className="font-serif text-h3 font-medium">
            {t.q3}
          </h2>
          <div role="radiogroup" aria-labelledby="q3-title" className="mt-3 grid grid-cols-1 gap-2.5">
            {([['highlights', t.paceShort], ['expert', t.paceFull]] as const).map(([id, text]) => {
              const on = pace === id;
              return (
                <button key={id} type="button" role="radio" aria-checked={on} onClick={() => setPace(id)} className={`${chip(on)} py-3`}>
                  <span className={`block text-ui font-bold ${on ? 'text-jade-ink' : 'text-ink'}`}>{text.label}</span>
                  <span className="block mt-0.5 text-cap leading-snug text-ink-3">{text.desc}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-10" aria-labelledby="preview-title">
          <h2 id="preview-title" className="font-serif text-h3 font-medium">
            {t.readyTitle}
          </h2>
          {stops.length > 0 ? (
            <>
              <p className="mt-1 text-ui text-ink-2">{t.readySummary(stops.length, roomCount, formatRouteDuration(routeMinutes))}</p>
              <p className="mt-1 text-cap text-ink-3">{t.tuneHint}</p>
              <div className="mt-4 border-t border-line">
                {groups.map((g) => (
                  <div key={g.room}>
                    <p className="pt-4 pb-1 text-cap font-semibold text-jade-ink">{g.room}</p>
                    <ol>
                      {g.stops.map((stop) => (
                        <li key={stop.poi_id || stop.id} className="flex items-center gap-2 py-1.5 border-b border-line">
                          <span className="min-w-0 flex-1 text-ui font-semibold leading-snug">{stop.title}</span>
                          <button
                            type="button"
                            aria-label={t.remove(stop.title)}
                            onClick={() => setRemoved((prev) => [...prev, stop.poi_id || stop.id])}
                            className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-ink-3 cursor-pointer active:bg-raised"
                          >
                            <X className="w-4 h-4" strokeWidth={2} />
                          </button>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-2 text-ui text-ink-3">{projected.stops.length === 0 ? t.empty : t.pickOne}</p>
          )}
        </section>
      </main>

      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[var(--app-w)] z-40 pb-safe bg-bg/94 backdrop-blur-xl border-t border-line">
        <div className="max-w-[var(--app-w)] mx-auto px-4 py-3">
          <button
            id="btn-start-route-fixed"
            type="button"
            disabled={stops.length === 0}
            onClick={handleStart}
            className="btn-primary w-full min-h-[3.25rem] disabled:opacity-40 disabled:pointer-events-none"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{stops.length > 0 ? t.startTour(stops.length, formatRouteDuration(routeMinutes)) : t.pickOne}</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default RouteWizard;
