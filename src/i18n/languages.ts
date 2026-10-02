export type SupportedLanguage = 'es' | 'en' | 'fr' | 'pl' | 'ru' | 'ja';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  flag: string;
  /** true = se puede elegir en el selector */
  isActive: boolean;
  comingSoon?: boolean;
}

export const LANG_STORAGE_KEY = 'audioguias_lang';

/**
 * Si es true, la primera visita usa el idioma del navegador cuando está activo.
 * Se deja apagado hasta que los textos de las piezas estén traducidos: así nadie ve
 * la interfaz en inglés con las piezas en español sin haberlo elegido.
 */
export const AUTO_DETECT_LANGUAGE = false;

export const availableLanguages: LanguageOption[] = [
  { code: 'es', label: 'Español', flag: '🇲🇽', isActive: true },
  { code: 'en', label: 'English', flag: '🇺🇸', isActive: true },
  { code: 'fr', label: 'Français', flag: '🇫🇷', isActive: false, comingSoon: true },
  { code: 'pl', label: 'Polski', flag: '🇵🇱', isActive: false, comingSoon: true },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', isActive: false, comingSoon: true },
  { code: 'ja', label: '日本語', flag: '🇯🇵', isActive: false, comingSoon: true },
];

export function isActiveLanguage(code: unknown): code is SupportedLanguage {
  return availableLanguages.some((l) => l.code === code && l.isActive);
}

/** Código BCP 47 para la voz sintética y el atributo lang de la página. */
export const SPEECH_LOCALE: Record<SupportedLanguage, string> = {
  es: 'es-MX',
  en: 'en-US',
  fr: 'fr-FR',
  pl: 'pl-PL',
  ru: 'ru-RU',
  ja: 'ja-JP',
};

export function detectInitialLanguage(): SupportedLanguage {
  try {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(LANG_STORAGE_KEY) : null;
    if (isActiveLanguage(saved)) return saved;
    if (AUTO_DETECT_LANGUAGE && typeof navigator !== 'undefined') {
      for (const raw of navigator.languages || [navigator.language]) {
        const code = String(raw || '').slice(0, 2).toLowerCase();
        if (isActiveLanguage(code)) return code;
      }
    }
  } catch {
    /* sin almacenamiento: se usa español */
  }
  return 'es';
}
