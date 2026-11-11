/** Final de cada parada: «¿Te gustó?» (conteo anónimo) y «Reportar un error» (abre el formulario de contacto). */
import React, { useEffect, useRef, useState } from 'react';
import { ThumbsDown, ThumbsUp, Flag, X } from 'lucide-react';
import { useLanguage } from '../utils/LanguageContext';
import { contactoText } from '../i18n/contacto';
import { avisoText } from '../i18n/aviso';
import { track } from '../utils/analytics';
import { ContactForm } from './ContactForm';

interface Props {
  pieceId: string;
  pieceTitle: string;
}

/**
 * Al final de cada parada: «¿Te gustó esta parada?» (un conteo anónimo por parada) y «Reportar un error».
 * La respuesta no se guarda en el teléfono: si vuelves a la parada puedes contestar otra vez.
 */
export const PieceFeedback: React.FC<Props> = ({ pieceId, pieceTitle }) => {
  const { currentLanguage } = useLanguage();
  const t = contactoText(currentLanguage);
  const closeLabel = avisoText(currentLanguage).close;
  const [answer, setAnswer] = useState<'si' | 'no' | null>(null);
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Al cambiar de parada se vuelve a preguntar
  useEffect(() => {
    setAnswer(null);
    setOpen(false);
  }, [pieceId]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const answerWith = (a: 'si' | 'no') => {
    if (answer) return;
    setAnswer(a);
    track(a === 'si' ? 'util_si' : 'util_no', { p: pieceId, l: currentLanguage });
  };

  const choice = 'min-h-11 flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface px-4 text-ui font-semibold text-ink cursor-pointer active:scale-[0.98] transition-transform';

  return (
    <section className="px-5 mt-12" aria-label={t.likeAsk}>
      <div className="rounded-2xl bg-surface border border-line p-4">
        {!answer ? (
          <>
            <p className="text-ui font-semibold text-ink">{t.likeAsk}</p>
            <div className="mt-3 flex gap-3">
              <button type="button" className={choice} onClick={() => answerWith('si')}><ThumbsUp className="w-5 h-5" aria-hidden="true" />{t.likeYes}</button>
              <button type="button" className={choice} onClick={() => answerWith('no')}><ThumbsDown className="w-5 h-5" aria-hidden="true" />{t.likeNo}</button>
            </div>
          </>
        ) : (
          <>
            <p role="status" className="text-ui font-semibold text-ink">{t.likeThanks}</p>
            {answer === 'no' && (
              <button type="button" className="mt-2 text-ui font-semibold text-jade-ink underline underline-offset-4 cursor-pointer" onClick={() => setOpen(true)}>{t.likeNoMore}</button>
            )}
          </>
        )}
        <button type="button" onClick={() => setOpen(true)} className="mt-3 inline-flex min-h-11 items-center gap-2 text-ui font-semibold text-ink-2 underline underline-offset-4 decoration-line-strong cursor-pointer">
          <Flag className="w-4 h-4" aria-hidden="true" />{t.reportBtn}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-scrim backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-t-[24px] sm:rounded-[24px] bg-surface text-ink border border-line px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] shadow-2xl animate-sheet"
          >
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-line-strong sm:hidden" aria-hidden="true" />
            <div className="flex items-center justify-between">
              <h3 id="report-title" className="font-serif text-h3 font-medium">{t.reportTitle}</h3>
              <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label={closeLabel} className="btn-icon -mr-2 text-ink-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ContactForm kind="error" pieceId={pieceId} pieceTitle={pieceTitle} placeholder={t.reportPlaceholder} />
          </div>
        </div>
      )}
    </section>
  );
};

export default PieceFeedback;
