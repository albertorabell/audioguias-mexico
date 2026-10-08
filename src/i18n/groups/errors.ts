import { defineGroup } from '../define';

/** Avisos de error de la voz sintética y de la pantalla de error general. */
export const errors = defineGroup(
  {
    noSpeech: 'La síntesis de voz no está disponible en este dispositivo.',
    noVoice: (languageName: string) =>
      `Tu teléfono no tiene voz en ${languageName}. Puedes leer el texto o instalar una voz en Ajustes.`,
    speechFailed: 'Hubo un inconveniente al reproducir la voz en este dispositivo.',
    audioFailed: 'No se pudo reproducir el archivo de audio. Se usará la voz del teléfono.',
    boundaryTitle: 'Ha ocurrido un detalle inesperado',
    boundaryDesc: 'No te preocupes, tus datos y recorrido están a salvo. Puedes regresar al inicio.',
    boundaryButton: 'Volver al inicio',
  },
  {
    noSpeech: 'Speech synthesis is not available on this device.',
    noVoice: (languageName: string) =>
      `Your phone has no ${languageName} voice. You can read the text or install a voice in Settings.`,
    speechFailed: 'Something went wrong playing the voice on this device.',
    audioFailed: 'The audio file could not be played. The phone voice will be used instead.',
    boundaryTitle: 'Something unexpected happened',
    boundaryDesc: 'Don’t worry, your data and tour are safe. You can go back to the start.',
    boundaryButton: 'Back to start',
  },
  {
    noSpeech: 'La synthèse vocale n’est pas disponible sur cet appareil.',
    noVoice: (languageName: string) =>
      `Votre téléphone n’a pas de voix en ${languageName}. Vous pouvez lire le texte ou installer une voix dans les Réglages.`,
    speechFailed: 'Un problème est survenu lors de la lecture de la voix sur cet appareil.',
    audioFailed: 'Impossible de lire le fichier audio. La voix du téléphone sera utilisée.',
    boundaryTitle: 'Un imprévu est survenu',
    boundaryDesc: 'Pas d’inquiétude, vos données et votre parcours sont sauvegardés. Vous pouvez revenir à l’accueil.',
    boundaryButton: 'Retour à l’accueil',
  }
);
