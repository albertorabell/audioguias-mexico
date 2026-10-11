import React from 'react';
import { useStrings } from '../utils/LanguageContext';
import { CoachTour, CoachStep } from './CoachTour';

export const PIECE_TOUR_KEY = 'audioguias_tour_pieza';

export function pieceTourSeen(): boolean {
  try {
    return localStorage.getItem(PIECE_TOUR_KEY) === '1';
  } catch {
    return false;
  }
}

function markPieceTourSeen(): void {
  try {
    localStorage.setItem(PIECE_TOUR_KEY, '1');
  } catch {
    /* sin almacenamiento: se vuelve a mostrar en la próxima visita, no pasa nada */
  }
}

/** Qué botón señala cada paso de `intro.piece` (mismo orden). */
const PIECE_TARGETS = ['#btn-master-play-piece', '#version-switch', '#piece-text', '#btn-piece-next-stop, #btn-piece-finish-stop', '#btn-nav-back', '#btn-nav-quick-search'];

/** Guía de la ficha de una obra: escuchar, versión corta/completa, leer, siguiente, regresar y buscar. */
export const PieceTour: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const t = useStrings().intro;
  const steps: CoachStep[] = t.piece.map((s, i) => ({ ...s, target: PIECE_TARGETS[i] }));
  return (
    <CoachTour
      open={open}
      steps={steps}
      id="modal-piece-tour"
      onClose={() => {
        markPieceTourSeen();
        onClose();
      }}
    />
  );
};

export default PieceTour;
