import { defineGroup } from '../define';

/** Pantalla de recorrido completado. */
export const tour = defineGroup(
  {
    completedTitle: '¡Recorrido completado!',
    completedDesc: (routeName: string) =>
      `Has recorrido con éxito la ruta «${routeName}» en el Museo Nacional de Antropología.`,
    rooms: 'Salas',
    pieces: 'Piezas',
    time: 'Tiempo',
    timeSub: 'estimado',
    backToExplorer: 'Ver las salas del museo',
    designAnother: 'Elegir otro recorrido',
    goHome: 'Ir al inicio',
    repeat: 'Repetir este recorrido',
  },
  {
    completedTitle: 'Tour completed!',
    completedDesc: (routeName: string) =>
      `You have successfully completed the “${routeName}” route at the National Museum of Anthropology.`,
    rooms: 'Rooms',
    pieces: 'Pieces',
    time: 'Time',
    timeSub: 'estimated',
    backToExplorer: 'See the museum rooms',
    designAnother: 'Choose another tour',
    goHome: 'Go to start',
    repeat: 'Repeat this tour',
  },
  {
    completedTitle: 'Visite terminée !',
    completedDesc: (routeName: string) =>
      `Vous avez parcouru avec succès le parcours « ${routeName} » au Musée national d’anthropologie.`,
    rooms: 'Salles',
    pieces: 'Pièces',
    time: 'Durée',
    timeSub: 'estimée',
    backToExplorer: 'Voir les salles du musée',
    designAnother: 'Choisir un autre parcours',
    goHome: 'Aller à l’accueil',
    repeat: 'Refaire cette visite',
  }
);
