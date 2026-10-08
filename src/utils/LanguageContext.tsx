import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  SupportedLanguage,
  LanguageOption,
  availableLanguages,
  LANG_STORAGE_KEY,
  SPEECH_LOCALE,
  detectInitialLanguage,
  isActiveLanguage,
} from '../i18n/languages';
import { setCurrentLanguage } from '../i18n/runtime';
import { getStrings, Strings } from '../i18n';
import { localizePiece, localizeRoom } from '../i18n/content';
import { track } from './analytics';

export type { SupportedLanguage, LanguageOption };
export { availableLanguages };

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  availableLanguages: LanguageOption[];
  /** Textos de la interfaz en el idioma actual. */
  strings: Strings;
  /** Busca un campo traducido (p. ej. guion_corto_en) y si no existe usa el español. No inventa traducciones. */
  getLocalizedField: (obj: any, fieldPrefix: string) => string;
  localizePiece: <T extends Record<string, any>>(piece: T) => T;
  localizeRoom: <T extends Record<string, any>>(room: T) => T;
}

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: 'es',
  setLanguage: () => {},
  availableLanguages,
  strings: getStrings('es'),
  getLocalizedField: () => '',
  localizePiece: (p) => p,
  localizeRoom: (r) => r,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<SupportedLanguage>(() => detectInitialLanguage());

  // Mantiene al día el idioma para el código que no es de React y para el atributo lang de la página.
  useEffect(() => {
    setCurrentLanguage(currentLanguage);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = SPEECH_LOCALE[currentLanguage].slice(0, 2);
    }
  }, [currentLanguage]);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    // Solo se pueden elegir los idiomas activos; los demás siguen como "próximamente".
    if (!isActiveLanguage(lang)) return;
    setCurrentLanguageState(lang);
    setCurrentLanguage(lang);
    track('lang_change', { l: lang });
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      /* sin almacenamiento: el idioma vale solo para esta visita */
    }
  }, []);

  const value = useMemo<LanguageContextType>(() => {
    const getLocalizedField = (obj: any, fieldPrefix: string): string => {
      if (!obj || typeof obj !== 'object') return '';
      if (currentLanguage !== 'es') {
        const v = obj[`${fieldPrefix}_${currentLanguage}`];
        if (typeof v === 'string' && v.trim()) return v;
      }
      return obj[fieldPrefix] || '';
    };
    return {
      currentLanguage,
      setLanguage,
      availableLanguages,
      strings: getStrings(currentLanguage),
      getLocalizedField,
      localizePiece: (p) => localizePiece(p, currentLanguage),
      localizeRoom: (r) => localizeRoom(r, currentLanguage),
    };
  }, [currentLanguage, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);

/** Atajo: los textos de la interfaz en el idioma actual. Uso: const t = useStrings(); t.back */
export const useStrings = (): Strings => useContext(LanguageContext).strings;

export default LanguageContext;
