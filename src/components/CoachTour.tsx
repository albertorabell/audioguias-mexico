import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useStrings } from '../utils/LanguageContext';
import { useBackClose } from '../utils/useBackClose';

export interface CoachStep {
  /** Selector CSS del botón o zona que se señala. Sin selector, el paso va al centro de la pantalla. */
  target?: string;
  title: string;
  text: string;
}

interface CoachTourProps {
  open: boolean;
  /** Pasos con su texto. Los que señalan algo que no está en pantalla se saltan solos. */
  steps: CoachStep[];
  /** Se llama al terminar o al cerrar (omitir, X, Esc, «atrás» del teléfono). */
  onClose: () => void;
  /** Botones extra en el último paso (por ejemplo, «Armar mi ruta ahora»). Reemplazan a «Entendido». */
  lastActions?: React.ReactNode;
  /** Identificador del cuadro (lo usan las pruebas). */
  id?: string;
}

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 6;
const MAX_HIGHLIGHT = 0.38; // una zona muy alta (un texto largo) se resalta solo en su parte de arriba

function measure(el: Element): Box {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const top = Math.max(r.top, 0);
  const bottom = Math.min(r.bottom, vh);
  const height = Math.min(Math.max(bottom - top, 0), vh * MAX_HIGHLIGHT);
  return { top: top - PAD, left: Math.max(r.left, 0) - PAD, width: Math.min(r.width, window.innerWidth - Math.max(r.left, 0)) + PAD * 2, height: height + PAD * 2 };
}

/**
 * Guía con flechas: oscurece la pantalla, resalta un botón real y explica qué hace.
 * Letras grandes y botones grandes a propósito (para que sirva igual a los 10 que a los 95 años).
 */
export const CoachTour: React.FC<CoachTourProps> = ({ open, steps, onClose, lastActions, id = 'modal-intro' }) => {
  const t = useStrings().intro;
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [live, setLive] = useState<CoachStep[]>(steps);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardH, setCardH] = useState(200);

  useBackClose(open, onClose);

  // Al abrir se deja solo lo que de verdad está en pantalla
  useEffect(() => {
    if (!open) return;
    setLive(steps.filter((s) => !s.target || document.querySelector(s.target)));
    setIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const step = live[index];
  const total = live.length;
  const last = index === total - 1;

  const place = useCallback(() => {
    if (!step?.target) return setBox(null);
    const el = document.querySelector(step.target);
    if (!el) return setBox(null);
    setBox(measure(el));
  }, [step]);

  // Lleva el botón señalado a la vista y mide dónde quedó (otra vez un momento después, por si la pantalla seguía moviéndose)
  useLayoutEffect(() => {
    if (!open || !step) return;
    if (step.target) {
      const el = document.querySelector(step.target);
      el?.scrollIntoView({ block: 'center', inline: 'nearest' });
    }
    place();
    const t1 = window.setTimeout(place, 120);
    const t2 = window.setTimeout(place, 400);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [open, step, place]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    primaryRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && !last) setIndex((i) => i + 1);
      else if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index, last]);

  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight);
  }, [index, open, live]);

  if (!open || !step) return null;

  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 400;
  const GAP = 16;
  const MARGIN = 12;
  let side: 'center' | 'below' | 'above' | 'bottom' = 'center';
  if (box) {
    const roomBelow = vh - (box.top + box.height) - GAP - MARGIN;
    const roomAbove = box.top - GAP - MARGIN;
    if (roomBelow >= cardH) side = 'below';
    else if (roomAbove >= cardH) side = 'above';
    else side = 'bottom';
  }
  const cardWidth = Math.min(440, vw - MARGIN * 2);
  const cardLeft = (vw - cardWidth) / 2;
  const cardStyle: React.CSSProperties = { width: cardWidth, left: cardLeft };
  if (side === 'below' && box) cardStyle.top = box.top + box.height + GAP;
  else if (side === 'above' && box) cardStyle.bottom = vh - box.top + GAP;
  else if (side === 'bottom') cardStyle.bottom = MARGIN + 8;
  else cardStyle.top = Math.max(MARGIN, (vh - cardH) / 2);
  // La flecha del globo apunta al centro del botón señalado
  const arrowX = box ? Math.max(24, Math.min(cardWidth - 24, box.left + box.width / 2 - cardLeft)) : 0;
  const showArrow = !!box && (side === 'below' || side === 'above');

  const next = () => setIndex((i) => Math.min(total - 1, i + 1));

  return (
    <div className="fixed inset-0 z-[60]" id={id} role="dialog" aria-modal="true" aria-label={t.dialogAria}>
      {/* Capa que bloquea toques a lo de atrás; oscurece solo cuando no hay nada resaltado */}
      <div className={`absolute inset-0 ${box ? '' : 'bg-scrim backdrop-blur-sm'}`} />
      {box && (
        <>
          <div
            aria-hidden="true"
            data-testid="coach-spot"
            className="absolute rounded-2xl pointer-events-none transition-all duration-200"
            style={{ top: box.top, left: box.left, width: box.width, height: box.height, boxShadow: '0 0 0 100vmax rgba(0,0,0,0.72)', outline: '3px solid var(--coach-ring, #f2c14e)', outlineOffset: 0 }}
          />
          <div
            aria-hidden="true"
            className="absolute rounded-2xl pointer-events-none motion-safe:animate-ping"
            style={{ top: box.top, left: box.left, width: box.width, height: box.height, border: '3px solid #f2c14e', opacity: 0.55 }}
          />
        </>
      )}

      <div
        ref={cardRef}
        className="absolute rounded-3xl bg-surface text-ink border border-line shadow-2xl p-5 animate-fadeIn"
        style={cardStyle}
        aria-live="polite"
      >
        {showArrow && (
          <span
            aria-hidden="true"
            className="absolute w-4 h-4 rotate-45 bg-surface border-line"
            style={{ left: arrowX - 8, ...(side === 'below' ? { top: -8, borderLeftWidth: 1, borderTopWidth: 1 } : { bottom: -8, borderRightWidth: 1, borderBottomWidth: 1 }) }}
          />
        )}
        <div className="flex items-center justify-between -mt-1">
          <span className="text-cap font-semibold text-ink-3" data-testid="intro-step-label">
            {t.stepOf(index + 1, total)}
          </span>
          <button type="button" id="btn-intro-skip" onClick={onClose} className="h-11 -mr-2 px-3 inline-flex items-center gap-1.5 text-ui font-semibold text-ink-2 rounded-full active:bg-raised cursor-pointer">
            {t.skip}
            <X className="w-4 h-4" />
          </button>
        </div>
        <h3 className="mt-1 font-serif text-h3 font-medium text-balance" data-testid="intro-title">
          {step.title}
        </h3>
        <p className="mt-2 text-[1.125rem] leading-relaxed text-ink-2">{step.text}</p>

        <div className="mt-4">
          {last && lastActions ? (
            <div className="flex flex-col gap-2">{lastActions}</div>
          ) : (
            <div className="flex items-center gap-2">
              {index > 0 && (
                <button type="button" id="btn-intro-back" onClick={() => setIndex(index - 1)} aria-label={t.back} className="btn-secondary h-14 px-4">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {last ? (
                <button ref={primaryRef} type="button" id="btn-intro-done" onClick={onClose} className="btn-primary flex-1 h-14 text-[1.0625rem]">
                  {t.done}
                </button>
              ) : (
                <button ref={primaryRef} type="button" id="btn-intro-next" onClick={next} className="btn-primary flex-1 h-14 text-[1.0625rem]">
                  {t.next}
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoachTour;
