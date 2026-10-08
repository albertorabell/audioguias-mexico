import { defineGroup } from '../define';

/** Rutas generadas por la app (asistente de ruta). */
export const routes = defineGroup(
  {
    curatedName: (duration: string) => `Ruta curada · ${duration}`,
    curatedDescription: (rooms: number) =>
      `Recorrido ordenado de planta baja a planta alta a través de ${rooms} ${rooms === 1 ? 'sala' : 'salas'}. Incluye la Piedra del Sol.`,
  },
  {
    curatedName: (duration: string) => `Curated route · ${duration}`,
    curatedDescription: (rooms: number) =>
      `A tour ordered from the ground floor to the upper floor through ${rooms} ${rooms === 1 ? 'room' : 'rooms'}. Includes the Sun Stone.`,
  },
  {
    curatedName: (duration: string) => `Parcours sélectionné · ${duration}`,
    curatedDescription: (rooms: number) =>
      `Parcours ordonné du rez-de-chaussée à l’étage à travers ${rooms} ${rooms === 1 ? 'salle' : 'salles'}. Comprend la Pierre du Soleil.`,
  }
);
