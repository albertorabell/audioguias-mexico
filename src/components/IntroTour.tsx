import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useStrings } from '../utils/LanguageContext';
import { CoachTour, CoachStep } from './CoachTour';

export const INTRO_SEEN_KEY = 'audioguias_tour_museo';

function markIntroSeen(): void {
  try {
    localStorage.setItem(INTRO_SEEN_KEY, '1');
  } catch {
    /* sin almacenamiento: se vuelve a mostrar en la próxima visita, no pasa nada */
  }
}

/** Qué botón señala cada paso de `intro.museum` (mismo orden). null = paso al centro. */
const MUSEUM_TARGETS: (string | undefined)[] = [
  undefined,
  '#first-route-card',
  '#btn-open-wizard',
  '#floor-switch',
  '#rooms-list li:first-child button',
  '#museum-dock-bar',
  '#offline-tour-banner',
  undefined,
];

interface IntroTourProps {
  open: boolean;
  onClose: () => void;
  /** Último paso: abre el asistente para armar la ruta. */
  onConfigureRoute: () => void;
}

/**
 * Guía de la pantalla del museo. Se abre sola la primera vez y se puede volver a abrir con «¿Cómo se usa?».
 * Va señalando los botones reales; el último paso ofrece armar la ruta.
 */
export const IntroTour: React.FC<IntroTourProps> = ({ open, onClose, onConfigureRoute }) => {
  const t = useStrings().intro;
  const steps: CoachStep[] = t.museum.map((s, i) => ({ ...s, target: MUSEUM_TARGETS[i] }));

  const close = () => {
    markIntroSeen();
    onClose();
  };
  const configure = () => {
    // Primero se abre el asistente y después se cierra la guía (así el historial no se desfasa)
    onConfigureRoute();
    close();
  };

  return (
    <CoachTour
      open={open}
      steps={steps}
      onClose={close}
      lastActions={
        <>
          <button type="button" id="btn-intro-configure" onClick={configure} className="btn-primary w-full h-14 text-[1.0625rem]">
            <SlidersHorizontal className="w-5 h-5" />
            {t.configureRoute}
          </button>
          <button type="button" id="btn-intro-explore" onClick={close} className="btn-secondary w-full h-14 text-[1.0625rem]">
            {t.explore}
          </button>
        </>
      }
    />
  );
};

export default IntroTour;
