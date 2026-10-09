import React, { useEffect, useRef, useState } from 'react';
import { Headphones, Route as RouteIcon, Play, Landmark, Map as MapIcon, Search, WifiOff, SlidersHorizontal, X, ChevronRight } from 'lucide-react';
import { useStrings } from '../utils/LanguageContext';
import { useBackClose } from '../utils/useBackClose';

export const INTRO_SEEN_KEY = 'audioguias_intro_seen';

export function introSeen(): boolean {
  try {
    return localStorage.getItem(INTRO_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function markIntroSeen(): void {
  try {
    localStorage.setItem(INTRO_SEEN_KEY, '1');
  } catch {
    /* sin almacenamiento: se vuelve a mostrar en la próxima visita, no pasa nada */
  }
}

const STEP_ICONS: React.ComponentType<{ className?: string; strokeWidth?: number }>[] = [Headphones, RouteIcon, Play, Landmark, WifiOff, SlidersHorizontal];
const TAB_ICONS: React.ComponentType<{ className?: string; strokeWidth?: number }>[] = [Landmark, RouteIcon, MapIcon, Search];

interface IntroTourProps {
  open: boolean;
  onClose: () => void;
  /** Último paso: abre el asistente para armar la ruta. */
  onConfigureRoute: () => void;
}

/**
 * Introducción de seis pasos para aprender a usar la guía. Se abre sola la primera vez que se entra a un museo
 * y se puede volver a abrir con «¿Cómo se usa?». El último paso lleva directo a armar la ruta.
 */
export const IntroTour: React.FC<IntroTourProps> = ({ open, onClose, onConfigureRoute }) => {
  const t = useStrings().intro;
  const tabs = useStrings().ui.tabs;
  const [step, setStep] = useState(0);
  const primaryRef = useRef<HTMLButtonElement>(null);

  const close = () => {
    markIntroSeen();
    onClose();
  };
  // El botón «atrás» del teléfono cierra la ventana en lugar de salir del museo
  useBackClose(open, close);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    primaryRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step]);

  if (!open) return null;

  const total = t.steps.length;
  const last = step === total - 1;
  const Icon = STEP_ICONS[step] || Headphones;
  const s = t.steps[step];

  const configure = () => {
    // Primero se abre el asistente y después se cierra la ventana (así el historial no se desfasa)
    onConfigureRoute();
    markIntroSeen();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-scrim backdrop-blur-sm" onClick={close}>
      <div
        id="modal-intro"
        role="dialog"
        aria-modal="true"
        aria-label={t.dialogAria}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-[24px] sm:rounded-[24px] bg-surface text-ink border border-line px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] shadow-2xl animate-sheet"
      >
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-line-strong sm:hidden" aria-hidden="true" />
        <div className="flex items-center justify-between">
          <span className="text-cap font-semibold text-ink-3" data-testid="intro-step-label">
            {t.stepOf(step + 1, total)}
          </span>
          <button type="button" onClick={close} aria-label={t.close} className="btn-icon -mr-2 text-ink-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-3 flex flex-col items-center text-center min-h-[15rem]">
          <span className="w-16 h-16 rounded-full bg-raised flex items-center justify-center">
            <Icon className="w-8 h-8 text-jade" strokeWidth={1.8} />
          </span>
          <h3 className="mt-4 font-serif text-h3 font-medium text-balance" data-testid="intro-title">
            {s.title}
          </h3>
          <p className="mt-2 text-ui leading-relaxed text-ink-2">{s.text}</p>
          {step === 3 && (
            <ul className="mt-4 grid grid-cols-4 gap-2 w-full" aria-hidden="true">
              {[tabs.museum, tabs.routes, tabs.map, tabs.search].map((label, i) => {
                const TabIcon = TAB_ICONS[i];
                return (
                  <li key={label} className="flex flex-col items-center gap-1.5 rounded-xl border border-line bg-raised py-2.5">
                    <TabIcon className="w-5 h-5 text-jade" strokeWidth={1.9} />
                    <span className="text-[12px] leading-none font-medium text-ink-2">{label}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex justify-center gap-1.5 my-4" aria-hidden="true">
          {t.steps.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-jade' : 'w-1.5 bg-line-strong'}`} />
          ))}
        </div>

        {last ? (
          <div className="flex flex-col gap-2">
            <button ref={primaryRef} type="button" id="btn-intro-configure" onClick={configure} className="btn-primary w-full">
              <SlidersHorizontal className="w-4 h-4" />
              {t.configureRoute}
            </button>
            <button type="button" id="btn-intro-explore" onClick={close} className="btn-secondary w-full">
              {t.explore}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button type="button" id="btn-intro-skip" onClick={close} className="btn-secondary px-5">
              {t.skip}
            </button>
            <button ref={primaryRef} type="button" id="btn-intro-next" onClick={() => setStep(step + 1)} className="btn-primary flex-1">
              {t.next}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntroTour;
