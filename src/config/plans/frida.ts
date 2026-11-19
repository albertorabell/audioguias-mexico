import { PlanPin, SitePlan, planImg, registerSitePlan } from '../sitePlan';
import { registerBuildings } from '../buildings';
import { OUTLINES } from './outlines';

/**
 * Museo Frida Kahlo (Casa Azul). Plano esquemático estilo Xolo (borrador generado con Gemini, 19-nov-2026):
 * public/plano/casa-azul-pb.svg y casa-azul-pa.svg, lienzo 1000x700. No es a escala ni está verificado contra un plano oficial
 * (el museo no publica uno): todas las posiciones van como aproximadas hasta confirmarlas en sitio.
 */
const T = (es: string, en: string, fr: string, pl: string, de: string, pt: string, it: string) => ({ es, en, fr, pl, de, pt, it });
const A = true;
const at = (x: number, y: number): [number, number] => [x * 10, y * 7];

const pins: Record<string, PlanPin> = {
  fri_01_primeras_salas_retratos: { floor: 'PB', at: at(15, 64), approx: A },
  fri_02_viva_la_vida: { floor: 'PB', at: at(16.2, 47.5), approx: A },
  fri_03_marxismo_muletas: { floor: 'PB', at: at(16.2, 31), approx: A },
  fri_07_escalera_exvotos: { floor: 'PB', at: at(16.2, 16.5), approx: A },
  fri_04_comedor_mexicano: { floor: 'PB', at: at(40.4, 75.5), approx: A },
  fri_05_cocina_barro: { floor: 'PB', at: at(54.1, 75.5), approx: A },
  fri_06_recamara_diego: { floor: 'PB', at: at(69.8, 75.5), approx: A },
  fri_11_jardin_flora_animales: { floor: 'PB', at: at(39, 49), approx: A },
  fri_12_piramide_jardin: { floor: 'PB', at: at(54.2, 34.5), approx: A },
  fri_16_trajes_tehuana: { floor: 'PB', at: at(82, 30), approx: A },
  fri_14_corses_pintados: { floor: 'PB', at: at(82, 50), approx: A },
  fri_15_protesis_bota_roja: { floor: 'PB', at: at(82, 60), approx: A },
  fri_17_cierre_legado: { floor: 'PB', at: at(30, 79), approx: A },
  fri_08_estudio_caballete: { floor: 'PA', at: at(32, 50), approx: A },
  fri_09_recamara_dia_espejo: { floor: 'PA', at: at(63.2, 54), approx: A },
  fri_10_recamara_noche_cenizas: { floor: 'PA', at: at(81.5, 62), approx: A },
  fri_13_secreto_banos_2004: { floor: 'PA', at: at(81.5, 42), approx: A },
};

export const FRIDA_PLAN: SitePlan = {
  siteId: 'museo_frida_kahlo',
  aria: T('Plano de la Casa Azul', 'Plan of the Blue House', 'Plan de la Maison bleue', 'Plan Niebieskiego Domu', 'Plan des Blauen Hauses', 'Planta da Casa Azul', 'Pianta della Casa Azul'),
  floors: {
    PB: { img: planImg('casa-azul-pb.svg'), size: [1000, 700], view: [0, 0, 1000, 700], name: T('Planta baja y jardín', 'Ground floor and garden', 'Rez-de-chaussée et jardin', 'Parter i ogród', 'Erdgeschoss und Garten', 'Térreo e jardim', 'Piano terra e giardino') },
    PA: { img: planImg('casa-azul-pa.svg'), size: [1000, 700], view: [0, 0, 1000, 700], name: T('Planta alta', 'Upper floor', 'Étage', 'Piętro', 'Obergeschoss', 'Andar superior', 'Piano superiore') },
  },
  pins,
  areas: [],
  source: T('Esquema de Xolo, aproximado', 'Xolo schematic, approximate', 'Schéma Xolo, approximatif', 'Schemat Xolo, orientacyjny', 'Xolo-Schema, ungefähr', 'Esquema Xolo, aproximado', 'Schema Xolo, approssimativo'),
};
registerSitePlan(FRIDA_PLAN);

registerBuildings('museo_frida_kahlo', [
  { id: 'casa-azul', name: T('Casa Azul', 'Blue House', 'Maison bleue', 'Niebieski Dom', 'Blaues Haus', 'Casa Azul', 'Casa Azul'), outline: OUTLINES.casa_azul, pieces: Object.keys(pins) },
]);
