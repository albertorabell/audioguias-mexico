/** Una caminata es un tramo entre paradas (no una parada con historia propia): su id lleva «_caminata». */
export const esCaminata = (p: { piece_id?: string } | null | undefined): boolean => /_caminata(_|$)/.test(p?.piece_id || '');
