import React, { createContext, useContext, useState } from 'react';

export type SupportedLanguage = 'es' | 'en' | 'fr' | 'pl' | 'ru' | 'ja';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  flag: string;
  isActive: boolean;
  comingSoon?: boolean;
}

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  availableLanguages: LanguageOption[];
  getLocalizedField: (obj: any, fieldPrefix: string) => string;
}

export const availableLanguages: LanguageOption[] = [
  { code: 'es', label: 'Español', flag: '🇲🇽', isActive: true },
  { code: 'en', label: 'English', flag: '🇺🇸', isActive: false, comingSoon: true },
  { code: 'fr', label: 'Français', flag: '🇫🇷', isActive: false, comingSoon: true },
  { code: 'pl', label: 'Polski', flag: '🇵🇱', isActive: false, comingSoon: true },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', isActive: false, comingSoon: true },
  { code: 'ja', label: '日本語', flag: '🇯🇵', isActive: false, comingSoon: true },
];

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: 'es',
  setLanguage: () => {},
  availableLanguages,
  getLocalizedField: () => '',
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always default to 'es' as the active content language
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('es');

  const setLanguage = (lang: SupportedLanguage) => {
    // Only 'es' is active for now; other languages are preserved as coming soon
    if (lang === 'es') {
      setCurrentLanguage('es');
      if (typeof window !== 'undefined') {
        localStorage.setItem('audioguias_lang', 'es');
      }
    }
  };

  /**
   * Helper that checks for localized fields (e.g. guion_corto_en) with fallback to Spanish (guion_corto).
   * Does NOT invent translations.
   */
  const getLocalizedField = (obj: any, fieldPrefix: string): string => {
    if (!obj || typeof obj !== 'object') return '';
    if (currentLanguage !== 'es') {
      const localizedKey = `${fieldPrefix}_${currentLanguage}`;
      if (obj[localizedKey] && typeof obj[localizedKey] === 'string' && obj[localizedKey].trim()) {
        return obj[localizedKey];
      }
    }
    return obj[fieldPrefix] || '';
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        availableLanguages,
        getLocalizedField,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
export default LanguageContext;
