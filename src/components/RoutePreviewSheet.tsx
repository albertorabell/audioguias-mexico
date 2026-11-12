import React, { useEffect } from 'react';
import { Clock, X } from 'lucide-react';
import { SiteRoute } from '../types';
import { useLanguage } from '../utils/LanguageContext';
import { calculateRouteTimeMinutes, formatRouteDuration } from '../utils/routeOptimizer';

interface RoutePreviewSheetProps {
  route: SiteRoute;
  /** Hora de cierre del sitio, «HH:MM». Sin ella no hay aviso de tiempo. */
  closingTime?: string;
  onStart: (route: SiteRoute) => void;
  onSeeStops?: () => void;
  onClose: () => void;
}

const minutesOf = (r: SiteRoute) => r.estimated_minutes || calculateRouteTimeMinutes(r.stops);

/** Minutos que faltan para la hora de cierre («17:00»), o null si no se puede calcular. */
export const minutesUntil = (closing: string | undefined, now: Date = new Date()): number | null => {
  const match = closing?.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const end = new Date(now);
  end.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return Math.round((end.getTime() - now.getTime()) / 60000);
};

/** La hoja que se abre al primer toque en una ruta: qué verás y cuánto dura. Solo «Empezar ruta» arranca. */
export const RoutePreviewSheet: React.FC<RoutePreviewSheetProps> = ({ route, closingTime, onStart, onSeeStops, onClose }) => {
  const { strings } = useLanguage();
  const u = strings.ui;
  const m = u.museum;
  const minutes = minutesOf(route);
  const highlights = route.stops.slice(0, 3);
  const left = minutesUntil(closingTime);
  const warning =
    left === null || !closingTime || left > 120 ? null : left < minutes ? m.previewNoFit(closingTime) : left < minutes + 30 ? m.previewLate(closingTime) : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="route-preview-title">
      <button type="button" aria-label={m.previewClose} className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div id="route-preview" className="relative w-full max-w-xl rounded-t-3xl bg-paper px-5 pb-6 pt-5 shadow-xl max-h-[85vh] overflow-y-auto">
        <button type="button" onClick={onClose} aria-label={m.previewClose} className="absolute right-3 top-3 h-11 w-11 inline-flex items-center justify-center rounded-full active:bg-raised cursor-pointer">
          <X className="w-5 h-5" />
        </button>
        <h3 id="route-preview-title" className="pr-10 font-serif text-[1.5rem] leading-tight font-medium text-ink text-balance">
          {route.name}
        </h3>
        <p className="mt-2 inline-flex items-center gap-1.5 text-ui font-semibold text-ink-2">
          <Clock className="w-4 h-4" aria-hidden="true" />
          {m.previewMeta(u.worksCount(route.stops.length), formatRouteDuration(minutes))}
        </p>
        {route.description && <p className="mt-3 text-ui leading-[1.5] text-ink-2 text-pretty">{route.description}</p>}
        {highlights.length > 0 && (
          <div className="mt-4">
            <p className="text-cap font-semibold uppercase tracking-wide text-ink-3">{m.previewSeen}</p>
            <ul className="mt-1.5 space-y-1">
              {highlights.map((s, i) => (
                <li key={`${s.poi_id}-${i}`} className="text-ui text-ink">
                  {i + 1}. {s.title}
                </li>
              ))}
            </ul>
          </div>
        )}
        {warning && (
          <p id="route-preview-warning" role="status" className="mt-4 rounded-xl bg-raised px-3 py-2.5 text-cap leading-[1.45] text-ink-2 text-pretty">
            {warning}
          </p>
        )}
        <button type="button" id="btn-preview-start" onClick={() => onStart(route)} className="btn-primary w-full mt-5">
          {m.previewStart}
        </button>
        {onSeeStops && (
          <button type="button" id="btn-preview-stops" onClick={onSeeStops} className="mt-1 w-full min-h-11 inline-flex items-center justify-center text-ui font-semibold text-jade-ink cursor-pointer rounded-full active:bg-raised">
            {m.previewStops}
          </button>
        )}
      </div>
    </div>
  );
};
