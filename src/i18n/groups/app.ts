import { defineGroup } from '../define';

/** Mensajes de la pantalla principal de la app (recorrido activo, errores de carga). */
export const app = defineGroup(
  {
    sitesLoadError: 'No se pudieron cargar los sitios. Verifica tu conexión.',
    siteLoadError: 'No se pudo cargar el recorrido de este sitio.',
    defaultRouteName: 'Recorrido por el museo',
    dismissAria: 'Cerrar mensaje',
    backToRooms: 'Volver a salas',
    pieceNotFound: 'No se encontró información para esta pieza.',
  },
  {
    sitesLoadError: 'The sites could not be loaded. Check your connection.',
    siteLoadError: 'This site’s tour could not be loaded.',
    defaultRouteName: 'Museum tour',
    dismissAria: 'Dismiss message',
    backToRooms: 'Back to rooms',
    pieceNotFound: 'No information was found for this piece.',
  },
  {
    sitesLoadError: 'Impossible de charger les sites. Vérifiez votre connexion.',
    siteLoadError: 'Impossible de charger le parcours de ce site.',
    defaultRouteName: 'Visite du musée',
    dismissAria: 'Fermer le message',
    backToRooms: 'Retour aux salles',
    pieceNotFound: 'Aucune information n’a été trouvée pour cette pièce.',
  }
);
