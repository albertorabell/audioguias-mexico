import { registerBuildings } from '../buildings';
import { OUTLINES } from './outlines';

const T = (es: string, en: string, fr: string, pl: string, de: string, pt: string, it: string) => ({ es, en, fr, pl, de, pt, it });

// El MNA usa su propio plano (src/config/mnaPlan.tsx): en el mapa real se ve el edificio y se entra a ese plano.
registerBuildings('mna', [
  { id: 'museo', name: T('Museo Nacional de Antropología', 'National Museum of Anthropology', 'Musée national d’anthropologie', 'Narodowe Muzeum Antropologii', 'Nationalmuseum für Anthropologie', 'Museu Nacional de Antropologia', 'Museo Nazionale di Antropologia'), outline: OUTLINES.mna, pieces: 'plan' },
]);
