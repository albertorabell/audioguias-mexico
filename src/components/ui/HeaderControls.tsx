import React, { useEffect, useRef, useState } from 'react';
import { Check, Globe, Lock, Moon, ShieldCheck, Sun } from 'lucide-react';
import { useLanguage } from '../../utils/LanguageContext';
import { useTheme } from '../../utils/ThemeContext';

/** Botón de idioma con su menú. Con un solo idioma publicado no se muestra. */
export const LanguageMenu: React.FC = () => {
  const { currentLanguage, setLanguage, availableLanguages, strings } = useLanguage();
  const t = strings.home;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  if (availableLanguages.length <= 1) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        id="btn-language-selector"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={t.langSelectAria}
        className="h-11 px-3 rounded-full inline-flex items-center gap-1.5 text-ink cursor-pointer active:bg-raised"
      >
        <Globe className="w-5 h-5 text-ink-2" strokeWidth={1.8} />
        <span className="text-ui font-bold uppercase">{currentLanguage}</span>
      </button>
      {open && (
        <div
          className="absolute right-0 mt-1 w-52 rounded-2xl bg-surface border border-line shadow-2xl shadow-black/30 p-1.5 z-50 animate-fadeIn"
        >
          {availableLanguages.map((lang) => {
            const active = currentLanguage === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setLanguage(lang.code);
                  setOpen(false);
                }}
                className={`w-full h-11 px-3 rounded-xl text-ui flex items-center justify-between cursor-pointer ${
                  active ? 'bg-raised text-ink font-bold' : 'text-ink-2 active:bg-raised'
                }`}
              >
                <span>{lang.label}</span>
                {active && <Check className="w-4 h-4 text-jade" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/** Cambia entre modo museo (oscuro) y modo sol (claro). */
export const ThemeButton: React.FC = () => {
  const { isSunMode, toggleTheme } = useTheme();
  const t = useLanguage().strings.home;
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isSunMode ? t.themeToMuseumTitle : t.themeToSunTitle}
      title={isSunMode ? t.themeToMuseumTitle : t.themeToSunTitle}
      className="btn-icon text-ink-2"
    >
      {isSunMode ? <Moon className="w-5 h-5" strokeWidth={1.8} /> : <Sun className="w-5 h-5" strokeWidth={1.8} />}
    </button>
  );
};

/** Estado del pase: "Pase" (comprar) o "Pase activo". Los ids los usan las pruebas. */
export const PassButton: React.FC<{ hasPass: boolean; onClick: () => void }> = ({ hasPass, onClick }) => {
  const t = useLanguage().strings.ui.pass;
  return hasPass ? (
    <button id="btn-pass-indicator" type="button" onClick={onClick} title={t.activeTitle} className="h-11 px-0.5 inline-flex items-center cursor-pointer group">
      <span className="h-9 px-3 rounded-full inline-flex items-center gap-1.5 text-cap font-bold text-jade border border-jade/40 group-active:bg-raised">
        <ShieldCheck className="w-4 h-4" strokeWidth={2} />
        <span>{t.active}</span>
      </span>
    </button>
  ) : (
    <button id="btn-unlock-pass-nav" type="button" onClick={onClick} className="h-11 px-0.5 inline-flex items-center cursor-pointer group">
      <span className="h-9 px-3.5 rounded-full inline-flex items-center gap-1.5 text-cap font-bold bg-oro text-on-oro group-active:scale-[0.97] transition-transform">
        <Lock className="w-3.5 h-3.5" strokeWidth={2.5} />
        <span>{t.buy}</span>
      </span>
    </button>
  );
};
