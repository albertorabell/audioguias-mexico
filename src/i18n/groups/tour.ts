import { defineGroup } from '../define';

/** Pantalla de recorrido completado. */
export const tour = defineGroup(
  {
    completedBadge: 'RECORRIDO CONCLUIDO',
    completedTitle: '¡Recorrido completado!',
    completedDesc: (routeName: string) =>
      `Has recorrido con éxito la ruta «${routeName}» en el Museo Nacional de Antropología.`,
    rooms: 'Salas',
    roomsSub: 'exploradas',
    pieces: 'Piezas',
    piecesSub: 'obras vistas',
    time: 'Tiempo',
    timeSub: 'estimado',
    backToExplorer: 'Ver las salas del museo',
    designAnother: 'Elegir otro recorrido',
    goHome: 'Ir al inicio',
    repeat: 'Repetir este recorrido',
  },
  {
    completedBadge: 'TOUR COMPLETED',
    completedTitle: 'Tour completed!',
    completedDesc: (routeName: string) =>
      `You have successfully completed the “${routeName}” route at the National Museum of Anthropology.`,
    rooms: 'Rooms',
    roomsSub: 'explored',
    pieces: 'Pieces',
    piecesSub: 'works seen',
    time: 'Time',
    timeSub: 'estimated',
    backToExplorer: 'See the museum rooms',
    designAnother: 'Choose another tour',
    goHome: 'Go to start',
    repeat: 'Repeat this tour',
  },
  {
    completedBadge: 'VISITE TERMINÉE',
    completedTitle: 'Visite terminée !',
    completedDesc: (routeName: string) =>
      `Vous avez parcouru avec succès le parcours « ${routeName} » au Musée national d’anthropologie.`,
    rooms: 'Salles',
    roomsSub: 'explorées',
    pieces: 'Pièces',
    piecesSub: 'œuvres vues',
    time: 'Durée',
    timeSub: 'estimée',
    backToExplorer: 'Voir les salles du musée',
    designAnother: 'Choisir un autre parcours',
    goHome: 'Aller à l’accueil',
    repeat: 'Refaire cette visite',
  }
);
