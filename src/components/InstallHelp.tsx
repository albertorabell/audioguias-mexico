import React, { useEffect, useRef, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { useStrings } from '../utils/LanguageContext';

const HIDDEN_KEY = 'audioguias_install_card_hidden';

function readHidden(): boolean {
  try {
    return localStorage.getItem(HIDDEN_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Tarjeta de la pantalla de inicio que explica cómo instalar la app.
 * No aparece si la app ya está instalada ni si la persona pidió no verla más.
 */
export const InstallCard: React.FC = () => {
  // El aviso de «se puede instalar» del navegador llega una sola vez, al abrir la página: este componente lo recibe
  // desde el principio y se lo pasa a la ventana de pasos, que se monta después.
  const pwa = usePWAInstall();
  const { isInstalled } = pwa;
  const t = useStrings().chrome.pwa;
  const [hidden, setHidden] = useState<boolean>(() => readHidden());
  const [open, setOpen] = useState(false);

  if (isInstalled || hidden) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(HIDDEN_KEY, '1');
    } catch {
      /* sin almacenamiento: solo se oculta en esta visita */
    }
  };

  return (
    <>
      <section
        id="install-card"
        aria-label={t.cardTitle}
        className="rounded-2xl bg-surface border border-line p-4"
      >
        <div className="flex items-start gap-3">
          <Smartphone className="w-5 h-5 mt-0.5 shrink-0 text-jade" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="text-ui font-bold text-ink">{t.cardTitle}</h2>
            <p className="text-cap mt-1 leading-relaxed text-ink-2">{t.cardBody}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 pl-8">
          <button type="button" id="btn-install-guide" onClick={() => setOpen(true)} className="btn-secondary min-h-11 text-cap">
            {t.cardButton}
          </button>
          <button
            type="button"
            id="btn-install-card-dismiss"
            onClick={dismiss}
            className="min-h-11 px-3 rounded-full text-cap font-semibold text-ink-3 cursor-pointer active:bg-raised"
          >
            {t.cardDismiss}
          </button>
        </div>
      </section>
      {open && <InstallGuide pwa={pwa} onClose={() => setOpen(false)} />}
    </>
  );
};

/** Ventana con los pasos para instalar, en el orden que corresponde al dispositivo de la persona. */
const InstallGuide: React.FC<{ pwa: ReturnType<typeof usePWAInstall>; onClose: () => void }> = ({ pwa, onClose }) => {
  const { isInstallable, isIOS, isAndroid, install } = pwa;
  const t = useStrings().chrome.pwa;
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const sections = [
    { key: 'android', current: isAndroid, title: t.androidTitle, steps: [t.androidStep1, t.androidStep2, t.androidStep3] },
    { key: 'ios', current: isIOS, title: t.iosGuideTitle, steps: [t.iosGuideStep1, t.iosGuideStep2, t.iosGuideStep3] },
    { key: 'desktop', current: !isAndroid && !isIOS, title: t.desktopTitle, steps: [t.desktopStep1] },
  ].sort((a, b) => Number(b.current) - Number(a.current));

  const handleInstall = async () => {
    const ok = await install();
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-scrim backdrop-blur-sm" onClick={onClose}>
      <div
        id="modal-install-guide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-guide-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-t-[24px] sm:rounded-[24px] bg-surface text-ink border border-line px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] shadow-2xl animate-sheet"
      >
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-line-strong sm:hidden" aria-hidden="true" />
        <div className="flex items-center justify-between">
          <h3 id="install-guide-title" className="font-serif text-h3 font-medium">
            {t.guideTitle}
          </h3>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={t.close} className="btn-icon -mr-2 text-ink-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-ui leading-relaxed mt-1 mb-4 text-ink-2">{t.guideIntro}</p>

        {isInstallable && (
          <button type="button" id="btn-install-now" onClick={handleInstall} className="btn-primary w-full mb-4">
            <Download className="w-4 h-4" />
            {t.installNow}
          </button>
        )}

        <div className="space-y-3">
          {sections.map((sec) => (
            <div
              key={sec.key}
              data-testid={`install-${sec.key}`}
              className={`rounded-2xl p-4 ${sec.current ? 'bg-raised border border-jade/40' : 'border border-line'}`}
            >
              <h4 className="text-ui font-bold mb-1.5">
                {sec.title}
                {sec.current && <span className="ml-2 font-semibold text-jade">· {t.yourDevice}</span>}
              </h4>
              <ol className="list-decimal pl-5 space-y-1 text-ui leading-relaxed text-ink-2">
                {sec.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        <p className="text-ui leading-relaxed mt-4 text-ink-2">{t.afterInstall}</p>

        <button type="button" onClick={onClose} className="btn-secondary w-full mt-5">
          {t.understood}
        </button>
      </div>
    </div>
  );
};
