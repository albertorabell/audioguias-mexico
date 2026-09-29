import React, { createContext, useContext, useState, useEffect } from 'react';

export type SupportedLanguage = 'es' | 'en' | 'fr';

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  availableLanguages: { code: SupportedLanguage; label: string; flag: string }[];
}

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: 'es',
  setLanguage: () => {},
  availableLanguages: [],
});

export const availableLanguages: { code: SupportedLanguage; label: string; flag: string }[] = [
  { code: 'es', label: 'Español', flag: '🇲🇽' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('audioguias_lang') as SupportedLanguage;
      if (saved && (saved === 'es' || saved === 'en' || saved === 'fr')) {
        return saved;
      }
    }
    return 'es';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setCurrentLanguage(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('audioguias_lang', lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, availableLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
export default LanguageContext;
