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
    backToExplorer: 'Volver al explorador (ver más piezas)',
    designAnother: 'Diseñar otra ruta',
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
    backToExplorer: 'Back to explorer (see more pieces)',
    designAnother: 'Design another route',
    goHome: 'Go to start',
    repeat: 'Repeat this tour',
  }
);
