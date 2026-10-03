import React, { useEffect, useRef, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { useTheme } from '../utils/ThemeContext';
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
  const { isSunMode } = useTheme();
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
        className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 ${
          isSunMode ? 'bg-amber-50 border-amber-200 text-stone-900' : 'bg-amber-500/10 border-amber-500/30 text-stone-100'
        }`}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Smartphone className="w-5 h-5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold">{t.cardTitle}</h2>
            <p className={`text-xs sm:text-sm mt-0.5 leading-relaxed ${isSunMode ? 'text-stone-700' : 'text-stone-300'}`}>
              {t.cardBody}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            id="btn-install-guide"
            onClick={() => setOpen(true)}
            className={`min-h-[44px] px-4 rounded-xl text-xs font-extrabold shadow-md transition active:scale-95 ${
              isSunMode ? 'bg-amber-700 hover:bg-amber-800 text-white' : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
            }`}
          >
            {t.cardButton}
          </button>
          <button
            type="button"
            id="btn-install-card-dismiss"
            onClick={dismiss}
            className={`min-h-[44px] px-3 rounded-xl text-xs font-semibold underline-offset-2 hover:underline ${
              isSunMode ? 'text-stone-600' : 'text-stone-400'
            }`}
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
  const { isSunMode } = useTheme();
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        id="modal-install-guide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-guide-title"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl border ${
          isSunMode ? 'bg-white border-stone-300 text-stone-900' : 'bg-stone-900 border-stone-800 text-stone-100'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 id="install-guide-title" className={`text-base font-extrabold ${isSunMode ? 'text-stone-950' : 'text-amber-400'}`}>
            {t.guideTitle}
          </h3>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition ${
              isSunMode ? 'hover:bg-stone-100 text-stone-600' : 'hover:bg-stone-800 text-stone-400'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className={`text-sm leading-relaxed mb-4 ${isSunMode ? 'text-stone-700' : 'text-stone-300'}`}>{t.guideIntro}</p>

        {isInstallable && (
          <button
            type="button"
            id="btn-install-now"
            onClick={handleInstall}
            className={`w-full min-h-[48px] mb-4 inline-flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-extrabold shadow-md transition active:scale-95 ${
              isSunMode ? 'bg-amber-700 hover:bg-amber-800 text-white' : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
            }`}
          >
            <Download className="w-4 h-4" />
            {t.installNow}
          </button>
        )}

        <div className="space-y-4">
          {sections.map((sec) => (
            <div
              key={sec.key}
              data-testid={`install-${sec.key}`}
              className={`rounded-xl border p-3 ${
                sec.current
                  ? isSunMode
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-amber-500/50 bg-amber-500/10'
                  : isSunMode
                  ? 'border-stone-200'
                  : 'border-white/10'
              }`}
            >
              <h4 className="text-xs font-extrabold uppercase tracking-wide mb-1.5">
                {sec.title}
                {sec.current && <span className="ml-2 normal-case text-amber-700 dark:text-amber-400">· {t.yourDevice}</span>}
              </h4>
              <ol className={`list-decimal pl-5 space-y-1 text-sm leading-relaxed ${isSunMode ? 'text-stone-700' : 'text-stone-300'}`}>
                {sec.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        <p className={`text-sm leading-relaxed mt-4 font-medium ${isSunMode ? 'text-stone-700' : 'text-stone-300'}`}>{t.afterInstall}</p>

        <button
          type="button"
          onClick={onClose}
          className={`w-full min-h-[48px] mt-5 rounded-xl py-3 text-xs font-extrabold transition shadow-md ${
            isSunMode ? 'bg-stone-900 hover:bg-stone-800 text-white' : 'bg-stone-800 hover:bg-stone-700 text-stone-100'
          }`}
        >
          {t.understood}
        </button>
      </div>
    </div>
  );
};
