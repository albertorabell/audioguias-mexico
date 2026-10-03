import { defineGroup } from '../define';

/** Imágenes: ampliación y foto pendiente. */
export const media = defineGroup(
  {
    defaultAlt: 'Pieza del Museo Nacional de Antropología',
    fallbackAria: (title: string) => `Respaldo visual para ${title}`,
    glyphAria: 'Glifo arqueológico',
    photoSoon: 'Foto próximamente',
    zoomClose: 'Cerrar ampliación',
    zoomPending: 'Fotografía del acervo en resguardo (foto próximamente)',
    zoomOut: 'Reducir zoom',
    zoomIn: 'Aumentar zoom',
    zoomResetTitle: 'Restablecer tamaño original',
    zoomResetAria: 'Restablecer zoom',
  },
  {
    defaultAlt: 'Piece from the National Museum of Anthropology',
    fallbackAria: (title: string) => `Visual placeholder for ${title}`,
    glyphAria: 'Archaeological glyph',
    photoSoon: 'Photo coming soon',
    zoomClose: 'Close enlarged view',
    zoomPending: 'Photograph of the collection piece in storage (photo coming soon)',
    zoomOut: 'Zoom out',
    zoomIn: 'Zoom in',
    zoomResetTitle: 'Reset to original size',
    zoomResetAria: 'Reset zoom',
  }
);
