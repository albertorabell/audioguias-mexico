import { PlanPin, SitePlan, planImg, registerSitePlan } from '../sitePlan';
import { registerBuildings } from '../buildings';

/**
 * Cuernavaca: Palacio de Cortés con plano esquemático estilo Xolo (borrador generado con Gemini, 19-nov-2026),
 * public/plano/palacio-cortes-pb.svg y palacio-cortes-pa.svg, lienzo 1000x700. Por verificar contra la planta del INAH
 * (Catálogo Nacional de Monumentos Históricos, ficha 38734). La Catedral sigue sin plano: al tocarla se ve la lista.
 */
const T = (es: string, en: string, fr: string, pl: string, de: string, pt: string, it: string) => ({ es, en, fr, pl, de, pt, it });
const A = true;
const at = (x: number, y: number): [number, number] => [x * 10, y * 7];

const pins: Record<string, PlanPin> = {
  cue_02_fortaleza_cortes: { floor: 'PB', at: at(16.5, 49), approx: A },
  cue_03_palacio_que_fue_de_todo: { floor: 'PB', at: at(46.8, 46.8), approx: A },
  cue_04_ventanas_arqueologicas: { floor: 'PB', at: at(33.5, 70), approx: A },
  cue_06_maiz_piedra_olmeca: { floor: 'PB', at: at(33, 24), approx: A },
  cue_05_sala_paisaje: { floor: 'PB', at: at(66.5, 24), approx: A },
  cue_08_cuexcomate: { floor: 'PB', at: at(83.5, 48.5), approx: A },
  cue_09_rivera_conquista: { floor: 'PA', at: at(79.5, 24), approx: A },
  cue_11_galeria_oriente_torreon: { floor: 'PA', at: at(79.5, 48), approx: A },
  cue_10_rivera_zapata: { floor: 'PA', at: at(79.5, 72), approx: A },
};

export const CUERNAVACA_PLAN: SitePlan = {
  siteId: 'cuernavaca_historica',
  aria: T('Plano del Palacio de Cortés', 'Plan of the Palace of Cortés', 'Plan du palais de Cortés', 'Plan Pałacu Cortésa', 'Plan des Cortés-Palastes', 'Planta do Palácio de Cortés', 'Pianta del Palazzo di Cortés'),
  floors: {
    PB: { img: planImg('palacio-cortes-pb.svg'), size: [1000, 700], view: [0, 0, 1000, 700], name: T('Planta baja', 'Ground floor', 'Rez-de-chaussée', 'Parter', 'Erdgeschoss', 'Térreo', 'Piano terra') },
    PA: { img: planImg('palacio-cortes-pa.svg'), size: [1000, 700], view: [0, 0, 1000, 700], name: T('Planta alta', 'Upper floor', 'Étage', 'Piętro', 'Obergeschoss', 'Andar superior', 'Piano superiore') },
  },
  pins,
  areas: [],
  source: T('Esquema de Xolo, aproximado', 'Xolo schematic, approximate', 'Schéma Xolo, approximatif', 'Schemat Xolo, orientacyjny', 'Xolo-Schema, ungefähr', 'Esquema Xolo, aproximado', 'Schema Xolo, approssimativo'),
};
registerSitePlan(CUERNAVACA_PLAN);

registerBuildings('cuernavaca_historica', [
  { id: 'palacio-cortes', name: T('Palacio de Cortés', 'Palace of Cortés', 'Palais de Cortés', 'Pałac Cortésa', 'Cortés-Palast', 'Palácio de Cortés', 'Palazzo di Cortés'), center: [-99.233335, 18.921251], pieces: Object.keys(pins) },
  { id: 'catedral-cuernavaca', name: T('Catedral de Cuernavaca', 'Cuernavaca Cathedral', 'Cathédrale de Cuernavaca', 'Katedra w Cuernavace', 'Kathedrale von Cuernavaca', 'Catedral de Cuernavaca', 'Cattedrale di Cuernavaca'), center: [-99.236824, 18.920233], pieces: ['cue_14_capilla_abierta', 'cue_15_nave_sotocoro', 'cue_16_martires_hallazgo', 'cue_17_martires_lectura', 'cue_18_claustro'] },
]);
