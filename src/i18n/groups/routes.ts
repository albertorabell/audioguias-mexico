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
  }
);
