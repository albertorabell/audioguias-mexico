import { PlanPin, SitePlan, planImg, registerSitePlan } from '../sitePlan';
import { registerBuildings } from '../buildings';

/**
 * Museo de sitio de Xochicalco: plano estilo Xolo redibujado siguiendo la distribución del plano del INAH
 * (156_msitio_xochicalco.pdf): dos grupos de tres salas hexagonales, octágono de enlace, Pasillo de las Joyas y sala de
 * introducción junto al vestíbulo. public/plano/xochicalco-museo.svg, lienzo 1000x700. Es un dibujo propio y simplificado.
 */
const T = (es: string, en: string, fr: string, pl: string, de: string, pt: string, it: string) => ({ es, en, fr, pl, de, pt, it });

const pins: Record<string, PlanPin> = {
  xoc_30_museo_estela_original: { floor: 'museo', at: [362, 150], approx: true },
  xoc_32_museo_arquitectura_vasijas: { floor: 'museo', at: [306, 325], approx: true },
  xoc_31_museo_marcadores_pelota: { floor: 'museo', at: [206, 376], approx: true },
};

export const XOCHICALCO_PLAN: SitePlan = {
  siteId: 'xochicalco',
  aria: T('Plano del museo de sitio de Xochicalco', 'Plan of the Xochicalco site museum', 'Plan du musée du site de Xochicalco', 'Plan muzeum w Xochicalco', 'Plan des Museums von Xochicalco', 'Planta do museu de Xochicalco', 'Pianta del museo di Xochicalco'),
  floors: {
    museo: { img: planImg('xochicalco-museo.svg'), size: [1000, 700], view: [0, 0, 1000, 700], name: T('Museo de sitio', 'Site museum', 'Musée du site', 'Muzeum', 'Museum', 'Museu de sítio', 'Museo del sito') },
  },
  pins,
  areas: [],
  source: T('Dibujo de Xolo según el plano del INAH', 'Xolo drawing based on the INAH plan', 'Dessin Xolo d’après le plan de l’INAH', 'Rysunek Xolo według planu INAH', 'Xolo-Zeichnung nach dem INAH-Plan', 'Desenho Xolo segundo a planta do INAH', 'Disegno Xolo secondo la pianta dell’INAH'),
};
registerSitePlan(XOCHICALCO_PLAN);

registerBuildings('xochicalco', [
  { id: 'museo-sitio', name: T('Museo de sitio', 'Site museum', 'Musée du site', 'Muzeum na miejscu', 'Museum vor Ort', 'Museu de sítio', 'Museo del sito'), center: [-99.290992, 18.802158], pieces: Object.keys(pins) },
]);
