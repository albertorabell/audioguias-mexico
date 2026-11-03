import React from 'react';
import { getAssetUrl } from '../utils/urlHelper';

/**
 * Plano de la planta baja y alta del Museo Nacional de Antropología.
 * Los muros salen de dos planos vectoriales (public/plano/mna-pb.svg y mna-pa.svg): son el edificio real, sin rótulos,
 * iconos ni pines de nadie. Encima van nuestras salas tocables, las piezas y la ruta.
 * Las coordenadas son las de esos dibujos (960 de ancho). Las posiciones de las piezas dentro de cada sala
 * son aproximadas: siguen el orden en que se ven al caminar y se corrigen sala por sala en sitio.
 */

export type Flow = 'up' | 'down' | 'left' | 'right';
export interface PlanRoom {
  num: number;
  rect: [number, number, number, number];
  flow: Flow;
  hue: number;
  side: 'east' | 'west' | 'inside';
}

/** Zonas que se recorren en orden: 0 exteriores, 0.5 vestíbulo, 0.7 patio central y luego las salas 1 a 11. */
export const ZONES = [0, 0.5, 0.7, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

/** Dibujo de planta baja: 960 x 1770. Planta alta: 960 x 1739. */
export const PB_SIZE: [number, number] = [960, 1770];
export const PA_SIZE: [number, number] = [960, 1739];
export const PB_VIEW: [number, number, number, number] = [50, 100, 870, 1670];
export const PA_VIEW: [number, number, number, number] = [60, 240, 900, 1500];
export const PB_IMG = getAssetUrl('plano/mna-pb.svg');
export const PA_IMG = getAssetUrl('plano/mna-pa.svg');

export const PB_ROOMS: PlanRoom[] = [
  { num: 6, rect: [335, 190, 583, 452], flow: 'left', hue: 20, side: 'inside' },
  { num: 5, rect: [615, 400, 768, 555], flow: 'up', hue: 45, side: 'east' },
  { num: 4, rect: [615, 555, 768, 768], flow: 'up', hue: 160, side: 'east' },
  { num: 3, rect: [615, 768, 768, 875], flow: 'up', hue: 200, side: 'east' },
  { num: 2, rect: [615, 875, 768, 975], flow: 'up', hue: 280, side: 'east' },
  { num: 1, rect: [585, 975, 768, 1080], flow: 'up', hue: 330, side: 'east' },
  { num: 7, rect: [150, 240, 305, 400], flow: 'down', hue: 20, side: 'west' },
  { num: 8, rect: [150, 400, 305, 610], flow: 'down', hue: 150, side: 'west' },
  { num: 9, rect: [150, 660, 305, 885], flow: 'down', hue: 95, side: 'west' },
  { num: 10, rect: [150, 975, 335, 1080], flow: 'right', hue: 260, side: 'west' },
  { num: 11, rect: [150, 1080, 335, 1187], flow: 'right', hue: 210, side: 'west' },
];

/** Piezas que no están dentro de una sala numerada: zona y punto en el plano. */
export const FIXED: Record<string, { zone: number; at: [number, number] }> = {
  mna_s00_monolito_tlaloc: { zone: 0, at: [375, 1690] },
  mna_s00_fachada_celosia: { zone: 0, at: [460, 1525] },
  mna_s00_mural_tamayo: { zone: 0.5, at: [545, 1440] },
  mna_s00_el_paraguas: { zone: 0.7, at: [460, 1095] },
  mna_s00_espejo_caracol: { zone: 0.7, at: [460, 740] },
};

/** Puntos por donde se camina al pasar de una zona a la siguiente. */
export const WAYPOINTS: Record<string, [number, number][]> = {
  '0-0.5': [[460, 1650], [460, 1560]],
  '0.5-0.7': [[460, 1380], [460, 1230]],
  '0.7-1': [[540, 1075], [600, 1030]],
  '1-2': [[650, 975]],
  '2-3': [[650, 875]],
  '3-4': [[650, 768]],
  '4-5': [[650, 555]],
  '5-6': [[650, 430], [583, 425]],
  '6-7': [[345, 440], [320, 420], [300, 360]],
  '7-8': [[230, 400]],
  '8-9': [[230, 610], [230, 660]],
  '9-10': [[230, 885], [230, 975]],
  '10-11': [[230, 1080]],
};

/** Orden en que se ven las piezas al caminar cada sala (de las fotos del 31 de octubre; salas 10 y 11 por confirmar). */
export const PHYS: Record<number, string[]> = {
  1: ['lucy_afarensis', 'mural_tzompantli'],
  2: ['mamut_iztapan', 'sacro_tequixquiac', 'puntas_clovis'],
  3: ['acrobata_tlatilco', 'mascara_dualidad', 'mujeres_bonitas', 'pato_tlatilco', 'baby_face_tlapacoya', 'vasija_pez_tlapacoya', 'bailarina_cascabeles', 'huehueteotl_cuicuilco', 'piramide_cuicuilco', 'sacerdote_atlihuayan'],
  4: ['disco_muerte', 'templo_quetzalcoatl', 'mural_tepantitla', 'huehueteotl', 'marcador_ventilla', 'brasero_teatro', 'animales_mitologicos', 'caracoles_emplumados', 'mascara_serpentina', 'chalchiuhtlicue'],
  5: ['chacmool_tolteca', 'atlante_tula', 'coraza_concha_tula', 'lapida_venus', 'friso_jaguares_coyotes', 'vasija_plumbate', 'guerrero_coyote', 'coatepantli', 'disco_tezcacuitlapilli', 'brasero_tolteca'],
  6: ['ocelotl_cuauhxicalli', 'teocalli_guerra_sagrada', 'mono_obsidiana', 'guerrero_aguila', 'tizoc', 'tlaltecuhtli', 'piedra_sol', 'coyolxauhqui', 'coatlicue', 'xochipilli', 'penacho_moctezuma'],
  7: ['danzante_montealban', 'mascara_murcielago', 'tumba_104', 'urna_cocijo', 'lapida_bazan', 'grecas_mitla', 'pectoral_oro_tumba7', 'craneo_turquesa', 'copa_cristal_roca', 'vaso_tecali_mono'],
  8: ['cabeza_colosal_6', 'luchador_olmeca', 'senor_las_limas', 'ofrenda4_laventa', 'hacha_votiva_jade', 'carita_sonriente', 'yugo_sapo', 'palma_sacrificio', 'adolescente_huasteco', 'cihuateteo_zapotal'],
  9: ['dintel26_yaxchilan', 'friso_placeres', 'reina_uxmal', 'disco_chinkultic', 'mascaron_chaac', 'estela51_calakmul', 'halach_uinic_jaina', 'chacmool_maya', 'cabeza_pakal', 'mascara_pakal'],
};

export const SHORT_ES: Record<number, string> = {
  0: 'Exteriores', 0.5: 'Vestíbulo', 0.7: 'Patio central', 1: 'Introducción', 2: 'Poblamiento', 3: 'Preclásico', 4: 'Teotihuacán', 5: 'Toltecas',
  6: 'Mexica', 7: 'Oaxaca', 8: 'Costa del Golfo', 9: 'Maya', 10: 'Occidente', 11: 'Norte',
};

/** Bloques de la planta alta según los cinco temas de la guía del museo. */
export interface UpperBlock {
  id: string;
  rect: [number, number, number, number];
  poly?: string;
  hue: number;
  title: Record<'es' | 'en' | 'fr' | 'pl' | 'de' | 'pt', string>;
}
export const PA_BLOCKS: UpperBlock[] = [
  { id: 'identidades', rect: [100, 272, 303, 543], hue: 20, title: { es: 'Identidades, historias y resistencias', en: 'Identities, histories and resistance', fr: 'Identités, histoires et résistances', pl: 'Tożsamości, historie i opór', de: 'Identitäten, Geschichten und Widerstand', pt: 'Identidades, histórias e resistências' } },
  { id: 'fiestas', rect: [100, 543, 303, 864], hue: 320, title: { es: 'Fiestas y rituales', en: 'Festivals and rituals', fr: 'Fêtes et rituels', pl: 'Święta i rytuały', de: 'Feste und Rituale', pt: 'Festas e rituais' } },
  { id: 'textiles', rect: [100, 864, 303, 1310], poly: '100,864 303,864 303,1310 184,1310 184,1080 100,1080', hue: 260, title: { es: 'Textiles', en: 'Textiles', fr: 'Textiles', pl: 'Tekstylia', de: 'Textilien', pt: 'Têxteis' } },
  { id: 'comidas', rect: [575, 445, 776, 999], hue: 45, title: { es: 'Comidas, producción y consumo', en: 'Food, production and consumption', fr: 'Alimentation, production et consommation', pl: 'Żywność, produkcja i konsumpcja', de: 'Ernährung, Produktion und Konsum', pt: 'Comidas, produção e consumo' } },
  { id: 'pueblos', rect: [575, 999, 776, 1310], hue: 160, title: { es: 'Pueblos, lenguas y territorios', en: 'Peoples, languages and territories', fr: 'Peuples, langues et territoires', pl: 'Ludy, języki i terytoria', de: 'Völker, Sprachen und Territorien', pt: 'Povos, línguas e territórios' } },
];

const tone = (h: number, pct = 20) => `color-mix(in oklab, hsl(${h} 60% 50%) ${pct}%, transparent)`;
export const roomFill = (h: number, here: boolean) => tone(h, here ? 48 : 22);

/** Fondo de la planta baja: el plano vectorial de muros. Se dibuja una sola vez. En modo oscuro se invierte. */
export const PbBase: React.FC = React.memo(() => (
  <image href={PB_IMG} x={0} y={0} width={PB_SIZE[0]} height={PB_SIZE[1]} className="dark:[filter:invert(0.9)_hue-rotate(180deg)]" pointerEvents="none" />
));
export const PaBase: React.FC = React.memo(() => (
  <image href={PA_IMG} x={0} y={0} width={PA_SIZE[0]} height={PA_SIZE[1]} className="dark:[filter:invert(0.9)_hue-rotate(180deg)]" pointerEvents="none" />
));

/** Rótulos del fondo (se traducen aparte). */
export const baseLabels = (t: Record<string, string>) => [
  { x: 460, y: 940, s: t.courtyard, size: 21, bold: true },
  { x: 460, y: 690, s: t.pond, size: 17 },
  { x: 460, y: 1172, s: t.umbrella, size: 18 },
  { x: 460, y: 1462, s: t.lobby, size: 15 },
  { x: 460, y: 1700, s: t.entrance, size: 19, bold: true },
  { x: 676, y: 1138, s: t.temporary, size: 14 },
  { x: 654, y: 318, s: t.ballgame, size: 13 },
  { x: 790, y: 1420, s: t.auditorium, size: 15 },
  { x: 242, y: 1340, s: t.cloakroom, size: 13 },
  { x: 242, y: 1475, s: t.shop, size: 13 },
];
