import React, { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useStrings } from '../../utils/LanguageContext';

interface TopBarProps {
  /** Si existe, se muestra la flecha para regresar. */
  onBack?: () => void;
  /** Texto del botón de regresar (por ejemplo "Museo"). Si falta solo se ve la flecha. */
  backLabel?: string;
  /** Línea pequeña de arriba: dónde estás. */
  eyebrow?: React.ReactNode;
  /** Línea principal. */
  title?: React.ReactNode;
  /** Botones de la derecha. */
  right?: React.ReactNode;
  /** Se toca el bloque del título (por ejemplo para abrir la sala). */
  onTitleClick?: () => void;
  id?: string;
  /** El título aparece solo después de bajar esta cantidad de píxeles (cuando la página ya lo muestra en grande). */
  revealAfter?: number;
}

/** true cuando la página bajó más de `px` píxeles. */
export function useScrolledPast(px: number): boolean {
  const [past, setPast] = useState(() => (typeof window !== 'undefined' ? window.scrollY > px : false));
  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > px);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [px]);
  return past;
}

/**
 * Barra superior fija. Respeta la muesca del iPhone (pt-safe) y deja el título siempre a la vista
 * para que la persona sepa dónde está.
 */
export const TopBar: React.FC<TopBarProps> = ({ onBack, backLabel, eyebrow, title, right, onTitleClick, id, revealAfter }) => {
  const t = useStrings().chrome.nav;
  const scrolled = useScrolledPast(4);
  const scrolledPast = useScrolledPast(revealAfter ?? 0);
  const revealed = revealAfter === undefined || scrolledPast;
  const titleBlock = (eyebrow || title) && (
    <div className={`min-w-0 flex-1 leading-tight transition-opacity duration-200 ${revealed ? 'opacity-100' : 'opacity-0'}`} aria-hidden={revealed ? undefined : true}>
      {eyebrow && <div className="text-cap text-ink-3 truncate">{eyebrow}</div>}
      {title && <div className="text-ui font-bold text-ink truncate">{title}</div>}
    </div>
  );
  return (
    <header
      id={id}
      className={`sticky top-0 z-30 pt-safe backdrop-blur-xl border-b transition-colors duration-200 ${
        scrolled ? 'bg-bg/92 border-line' : 'bg-bg border-transparent'
      }`}
    >
      <div className="flex items-center gap-1 h-14 px-2">
        {onBack && (
          <button
            id="btn-nav-back"
            type="button"
            onClick={onBack}
            aria-label={t.back}
            className={`${backLabel ? 'pl-1 pr-2.5 rounded-full' : 'btn-icon'} h-11 inline-flex items-center gap-0.5 text-ink shrink-0 cursor-pointer active:bg-raised`}
          >
            <ChevronLeft className="w-6 h-6 text-jade" strokeWidth={2.25} />
            {backLabel && <span className="text-ui font-semibold max-w-[7.5rem] truncate">{backLabel}</span>}
          </button>
        )}
        {onTitleClick && titleBlock ? (
          <button type="button" onClick={onTitleClick} className="min-w-0 flex-1 text-left px-1 py-1 rounded-lg cursor-pointer active:bg-raised">
            {titleBlock}
          </button>
        ) : (
          titleBlock && <div className="min-w-0 flex-1 px-1">{titleBlock}</div>
        )}
        {!titleBlock && <div className="flex-1" />}
        {right && <div className="flex items-center gap-1 shrink-0 pr-1">{right}</div>}
      </div>
    </header>
  );
};

export default TopBar;
