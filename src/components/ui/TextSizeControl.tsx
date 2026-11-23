import React from 'react';
import { useLanguage } from '../../utils/LanguageContext';
import { setTextScale, stepTextScale, TEXT_STEPS, useTextScale } from '../../utils/textSize';

const ETIQUETAS: Record<string, { menos: string; mas: string; tamano: string; normal: string }> = {
  es: { menos: 'Texto más pequeño', mas: 'Texto más grande', tamano: 'Tamaño del texto', normal: 'Tamaño normal' },
  en: { menos: 'Smaller text', mas: 'Larger text', tamano: 'Text size', normal: 'Normal size' },
  fr: { menos: 'Texte plus petit', mas: 'Texte plus grand', tamano: 'Taille du texte', normal: 'Taille normale' },
  pl: { menos: 'Mniejszy tekst', mas: 'Większy tekst', tamano: 'Rozmiar tekstu', normal: 'Normalny rozmiar' },
  de: { menos: 'Kleinerer Text', mas: 'Größerer Text', tamano: 'Textgröße', normal: 'Normale Größe' },
  pt: { menos: 'Texto menor', mas: 'Texto maior', tamano: 'Tamanho do texto', normal: 'Tamanho normal' },
  it: { menos: 'Testo più piccolo', mas: 'Testo più grande', tamano: 'Dimensione del testo', normal: 'Dimensione normale' },
};

/** Dos botones: texto más pequeño (A−) y más grande (A+). Se recuerda la elección. */
export const TextSizeControl: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { currentLanguage } = useLanguage();
  const t = ETIQUETAS[currentLanguage] || ETIQUETAS.es;
  const pct = useTextScale();
  const min = pct === TEXT_STEPS[0];
  const max = pct === TEXT_STEPS[TEXT_STEPS.length - 1];
  const base = 'min-h-11 min-w-11 px-2 rounded-full border border-line text-ink font-bold cursor-pointer active:bg-raised disabled:opacity-40 disabled:cursor-default';
  return (
    <div role="group" aria-label={t.tamano} className={`inline-flex items-center gap-1.5 ${className}`}>
      <button type="button" id="btn-text-smaller" aria-label={t.menos} disabled={min} onClick={() => setTextScale(stepTextScale(pct, -1))} className={`${base} text-[0.8125rem]`}>
        A<span aria-hidden="true">−</span>
      </button>
      <button type="button" id="btn-text-larger" aria-label={t.mas} disabled={max} onClick={() => setTextScale(stepTextScale(pct, 1))} className={`${base} text-[1.0625rem]`}>
        A<span aria-hidden="true">+</span>
      </button>
      {pct >= 150 && (
        <button type="button" id="btn-text-reset" aria-label={t.normal} title={t.normal} onClick={() => setTextScale(100)} className={`${base} text-[0.75rem]`}>
          <span aria-hidden="true">↺</span>
        </button>
      )}
    </div>
  );
};
