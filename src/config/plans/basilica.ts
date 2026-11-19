import { PlanPin, SitePlan, planImg, registerSitePlan } from '../sitePlan';
import { registerBuildings } from '../buildings';
import { OUTLINES } from './outlines';

/**
 * Nueva Basílica de Guadalupe: planta circular esquemática estilo Xolo (borrador generado con Gemini, 19-nov-2026),
 * public/plano/basilica-nueva-interior.svg, lienzo 1000x700 (se dibuja a 400x280). El contorno en el mapa real sale de OSM.
 * El Museo de la Basílica sigue sin plano: al tocarlo se ve la lista de sus paradas.
 */
const T = (es: string, en: string, fr: string, pl: string, de: string, pt: string, it: string) => ({ es, en, fr, pl, de, pt, it });
// Lienzo de 1000x700 dibujado a 400x280 para que los pines tengan el mismo tamaño que en los demás planos
const at = (x: number, y: number): [number, number] => [x * 4, y * 2.8];

const pins: Record<string, PlanPin> = {
  bas_12_cristo_atentado: { floor: 'nueva', at: at(32, 62), approx: true },
  bas_13_tilma_banda: { floor: 'nueva', at: at(50, 45), approx: true },
  bas_19_imagen_guadalupana: { floor: 'nueva', at: at(50, 29), approx: true },
};

export const BASILICA_PLAN: SitePlan = {
  siteId: 'basilica_guadalupe',
  aria: T('Plano de la Nueva Basílica', 'Plan of the New Basilica', 'Plan de la Nouvelle basilique', 'Plan Nowej Bazyliki', 'Plan der Neuen Basilika', 'Planta da Nova Basílica', 'Pianta della Nuova Basilica'),
  floors: {
    nueva: { img: planImg('basilica-nueva-interior.svg'), size: [400, 280], view: [0, 0, 400, 280], name: T('Nueva Basílica', 'New Basilica', 'Nouvelle basilique', 'Nowa Bazylika', 'Neue Basilika', 'Nova Basílica', 'Nuova Basilica') },
  },
  pins,
  areas: [],
  source: T('Esquema de Xolo, aproximado', 'Xolo schematic, approximate', 'Schéma Xolo, approximatif', 'Schemat Xolo, orientacyjny', 'Xolo-Schema, ungefähr', 'Esquema Xolo, aproximado', 'Schema Xolo, approssimativo'),
};
registerSitePlan(BASILICA_PLAN);

registerBuildings('basilica_guadalupe', [
  { id: 'nueva-basilica', name: T('Nueva Basílica', 'New Basilica', 'Nouvelle basilique', 'Nowa Bazylika', 'Neue Basilika', 'Nova Basílica', 'Nuova Basilica'), outline: OUTLINES.nueva_basilica, pieces: Object.keys(pins) },
  { id: 'museo-basilica', name: T('Museo de la Basílica', 'Basilica Museum', 'Musée de la basilique', 'Muzeum Bazyliki', 'Basilika-Museum', 'Museu da Basílica', 'Museo della Basilica'), outline: OUTLINES.museo_basilica, pieces: ['bas_09_museo_basilica', 'bas_10_exvotos'] },
]);
