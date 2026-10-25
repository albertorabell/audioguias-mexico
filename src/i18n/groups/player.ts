import { defineGroup } from '../define';

/** Avisos de la voz sintética y reproductor de audio (mini y expandido). */
export const player = defineGroup(
  {
    mediaTitleFallback: 'Audioguía',
    defaultPieceSummary: 'Pieza fundamental del acervo nacional.',
    scriptOnlySpanish: 'Esta pieza todavía no tiene texto en este idioma. Se muestra y se lee en español.',
  },
  {
    mediaTitleFallback: 'Audio guide',
    defaultPieceSummary: 'A key piece of the national collection.',
    scriptOnlySpanish: 'This piece does not have text in this language yet. It is shown and read in Spanish.',
  },
  {
    mediaTitleFallback: 'Audioguide',
    defaultPieceSummary: 'Une pièce essentielle de la collection nationale.',
    scriptOnlySpanish: 'Cette pièce n’a pas encore de texte dans cette langue. Elle est affichée et lue en espagnol.',
  }
);
