import { PlanPin, SitePlan, planImg, registerSitePlan } from '../sitePlan';

/**
 * Museo de sitio de Chalcatzingo (Monumento 9): esquema estilo Xolo (borrador generado con Gemini, 19-nov-2026),
 * public/plano/chalcatzingo-museo.svg, lienzo 1000x700 (se dibuja a 400x280). Sin plano oficial publicado: posición aproximada.
 */
const T = (es: string, en: string, fr: string, pl: string, de: string, pt: string, it: string) => ({ es, en, fr, pl, de, pt, it });

const pins: Record<string, PlanPin> = {
  chz_02_museo_portal_inframundo: { floor: 'museo', at: [146.0, 120.4], approx: true },
};

export const CHALCATZINGO_PLAN: SitePlan = {
  siteId: 'chalcatzingo',
  aria: T('Plano del museo de sitio de Chalcatzingo', 'Plan of the Chalcatzingo site museum', 'Plan du musée du site de Chalcatzingo', 'Plan muzeum w Chalcatzingo', 'Plan des Museums von Chalcatzingo', 'Planta do museu de Chalcatzingo', 'Pianta del museo di Chalcatzingo'),
  floors: {
    museo: { img: planImg('chalcatzingo-museo.svg'), size: [400, 280], view: [0, 0, 400, 280], name: T('Museo de sitio', 'Site museum', 'Musée du site', 'Muzeum', 'Museum', 'Museu de sítio', 'Museo del sito') },
  },
  pins,
  areas: [],
  source: T('Esquema de Xolo, aproximado', 'Xolo schematic, approximate', 'Schéma Xolo, approximatif', 'Schemat Xolo, orientacyjny', 'Xolo-Schema, ungefähr', 'Esquema Xolo, aproximado', 'Schema Xolo, approssimativo'),
};
registerSitePlan(CHALCATZINGO_PLAN);
