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

/** Tipo de sitio abierto: «museum» (el MNA) o «site» (zona arqueológica al aire libre, con otras palabras). */
let currentKind: 'museum' | 'site' = 'museum';

export function getCurrentSiteKind(): 'museum' | 'site' {
  return currentKind;
}

export function setCurrentSiteKind(kind: 'museum' | 'site'): void {
  currentKind = kind;
}

/** Nombre del sitio abierto cuando no es el MNA ni Teotihuacán (que traen el suyo en los textos): sale de la lista de sitios. */
let currentSiteName: string | null = null;

export function getCurrentSiteName(): string | null {
  return currentSiteName;
}

export function setCurrentSiteName(name: string | null): void {
  currentSiteName = name && name.trim() ? name.trim() : null;
}
