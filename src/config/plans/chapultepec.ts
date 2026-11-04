import { PlanPin, SitePlan, planImg, registerSitePlan } from '../sitePlan';

/**
 * Castillo de Chapultepec. Muros: dos dibujos limpios (public/plano/chap-pb.svg 412x760 y chap-pa.svg 384x815).
 * Las posiciones salen de los pines de Bloomberg Connects (solo su ubicación) pasados a las unidades del dibujo;
 * las marcadas approx no tienen pin propio y se confirman en sitio.
 */
const pins: Record<string, PlanPin> = {
  chap_01_rampa: { floor: 'PB', at: [136.6, 229.4] },
  chap_02_fachada_puerta: { floor: 'PB', at: [159.1, 357.3] },
  chap_03_patio_canones: { floor: 'PB', at: [181.6, 284.3], approx: true },
  chap_04_encuentro_conquista: { floor: 'PB', at: [245.1, 421.8] },
  chap_31_fusion_dos_culturas: { floor: 'PB', at: [224.5, 382.1] },
  chap_05_nueva_espana_plata: { floor: 'PB', at: [276.2, 437.7], approx: true },
  chap_04_retablo_independencia: { floor: 'PB', at: [323.8, 367.2] },
  chap_27_estandarte_hidalgo: { floor: 'PB', at: [321.2, 351.0], approx: true },
  chap_06_morelos_iturbide: { floor: 'PB', at: [318.7, 316.4] },
  chap_08_intervencion_1847: { floor: 'PB', at: [308.6, 278.0], approx: true },
  chap_29_mural_ninos_heroes: { floor: 'PB', at: [220.0, 351.9] },
  chap_09_batalla_puebla_orozco: { floor: 'PB', at: [305.7, 224.3] },
  chap_07_carruaje_juarez: { floor: 'PB', at: [261.0, 468.4], approx: true },
  chap_09_mural_siqueiros: { floor: 'PB', at: [221.6, 300.2] },
  chap_10_mural_madero: { floor: 'PB', at: [205.1, 136.4] },
  chap_11_constitucion_1917: { floor: 'PB', at: [237.8, 244.0] },
  chap_12_sala_carruajes: { floor: 'PB', at: [246.7, 481.5] },
  chap_13_escalera_leones: { floor: 'PB', at: [152.4, 588.1] },
  chap_15_comedor_imperial: { floor: 'PB', at: [331.7, 649.4] },
  chap_16_sala_lectura_goces: { floor: 'PB', at: [336.5, 544.0] },
  chap_17_salon_embajadores: { floor: 'PB', at: [251.4, 614.5], approx: true },
  chap_28_salon_gobelinos: { floor: 'PB', at: [260.0, 679.5] },
  chap_14_vitrales_emplomados: { floor: 'PA', at: [179.0, 768.9] },
  chap_18_recamara_carlota: { floor: 'PA', at: [174.3, 717.8], approx: true },
  chap_19_bano_carlota: { floor: 'PA', at: [190.1, 724.1], approx: true },
  chap_20_recamara_maximiliano: { floor: 'PA', at: [182.2, 738.4], approx: true },
  chap_21_recamara_porfirio_carmen: { floor: 'PA', at: [202.8, 735.2], approx: true },
  chap_22_despacho_presidencial: { floor: 'PA', at: [206.0, 698.7], approx: true },
  chap_23_jardin_alcazar: { floor: 'PA', at: [180.0, 639.0] },
  chap_24_caballero_alto: { floor: 'PA', at: [193.3, 628.9] },
  chap_30_salon_malaquitas: { floor: 'PA', at: [196.8, 419.0] },
};

const T = (es: string, en: string, fr: string, pl: string, de: string, pt: string, it: string) => ({ es, en, fr, pl, de, pt, it });

export const CHAPULTEPEC_PLAN: SitePlan = {
  siteId: 'chapultepec',
  aria: T('Plano del Castillo de Chapultepec', 'Plan of Chapultepec Castle', 'Plan du château de Chapultepec', 'Plan Zamku Chapultepec', 'Plan des Schlosses Chapultepec', 'Planta do Castelo de Chapultepec', 'Pianta del Castello di Chapultepec'),
  floors: {
    PB: { img: planImg('chap-pb.svg'), size: [412, 760], view: [36, 100, 334, 630], name: T('Planta baja', 'Ground floor', 'Rez-de-chaussée', 'Parter', 'Erdgeschoss', 'Térreo', 'Piano terra') },
    PA: { img: planImg('chap-pa.svg'), size: [384, 815], view: [58, 70, 266, 720], name: T('Planta alta', 'Upper floor', 'Étage', 'Piętro', 'Obergeschoss', 'Andar superior', 'Piano superiore') },
  },
  pins,
  areas: [
    { id: 'museo-pb', floor: 'PB', view: [140, 105, 230, 400], name: T('Museo de Historia', 'History Museum', 'Musée d’histoire', 'Muzeum Historii', 'Geschichtsmuseum', 'Museu de História', 'Museo di Storia') },
    { id: 'alcazar-pb', floor: 'PB', view: [100, 460, 270, 280], name: T('El Alcázar', 'The Alcázar', 'L’Alcázar', 'Alcázar', 'Der Alcázar', 'O Alcázar', 'L’Alcázar') },
    { id: 'alcazar-pa', floor: 'PA', view: [90, 590, 260, 230], name: T('El Alcázar', 'The Alcázar', 'L’Alcázar', 'Alcázar', 'Der Alcázar', 'O Alcázar', 'L’Alcázar') },
    { id: 'museo-pa', floor: 'PA', view: [110, 80, 200, 420], name: T('Ala del museo', 'Museum wing', 'Aile du musée', 'Skrzydło muzeum', 'Museumsflügel', 'Ala do museu', 'Ala del museo') },
  ],
};
registerSitePlan(CHAPULTEPEC_PLAN);
