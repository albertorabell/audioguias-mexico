import type { SupportedLanguage } from './languages';

/** Textos de la barra de avance del audio (para lectores de pantalla). */
interface ReproductorText {
  seek: string;
  back: string;
  forward: string;
}

const TEXTS: Partial<Record<SupportedLanguage, ReproductorText>> = {
  es: { seek: 'Avance del audio', back: 'Retroceder 10 segundos', forward: 'Adelantar 10 segundos' },
  en: { seek: 'Audio position', back: 'Back 10 seconds', forward: 'Forward 10 seconds' },
  fr: { seek: 'Position de l’audio', back: 'Reculer de 10 secondes', forward: 'Avancer de 10 secondes' },
  pl: { seek: 'Pozycja nagrania', back: 'Cofnij o 10 sekund', forward: 'Do przodu o 10 sekund' },
  de: { seek: 'Audioposition', back: '10 Sekunden zurück', forward: '10 Sekunden vor' },
  pt: { seek: 'Posição do áudio', back: 'Voltar 10 segundos', forward: 'Avançar 10 segundos' },
  it: { seek: 'Posizione dell’audio', back: 'Indietro di 10 secondi', forward: 'Avanti di 10 secondi' },
};

export const reproductorText = (lang: SupportedLanguage): ReproductorText => TEXTS[lang] ?? (TEXTS.en as ReproductorText);
