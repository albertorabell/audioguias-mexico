import type { SupportedLanguage } from './languages';

/**
 * Un grupo de textos. `es` es el idioma base y define la forma; `en` debe tener exactamente las mismas claves
 * (el compilador avisa si falta alguna). Los demás idiomas son opcionales: lo que no esté se muestra en español.
 */
export type Group<T> = { es: T; en: T } & Partial<Record<Exclude<SupportedLanguage, 'es' | 'en'>, Partial<T>>>;

export function defineGroup<T>(es: T, en: T, fr?: Partial<T>): Group<T> {
  return fr ? { es, en, fr } : { es, en };
}
