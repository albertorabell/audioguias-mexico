import { SupportedLanguage, detectInitialLanguage } from './languages';

/**
 * Idioma actual para código que no es un componente de React (por ejemplo la voz sintética).
 * LanguageProvider lo mantiene al día.
 */
let current: SupportedLanguage = detectInitialLanguage();

export function getCurrentLanguage(): SupportedLanguage {
  return current;
}

export function setCurrentLanguage(lang: SupportedLanguage): void {
  current = lang;
}
