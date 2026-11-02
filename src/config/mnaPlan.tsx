import React from 'react';

/**
 * Plano de la planta baja y alta del Museo Nacional de Antropología.
 * Dibujo propio (no es una imagen de nadie) hecho a partir de la distribución real del museo:
 * Mexica arriba, salas 1 a 5 en el ala derecha, 7 a 11 en la izquierda, patio central con estanque,
 * Paraguas, vestíbulo con Media Luna y la entrada principal abajo.
 * Las coordenadas son del dibujo (no son metros). Las posiciones de las piezas dentro de cada sala
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

export const PB_VIEW: [number, number, number, number] = [20, 190, 930, 1720];

export const PB_ROOMS: PlanRoom[] = [
  { num: 6, rect: [305, 290, 567, 555], flow: 'left', hue: 20, side: 'inside' },
  { num: 5, rect: [600, 500, 760, 720], flow: 'up', hue: 45, side: 'east' },
  { num: 4, rect: [600, 720, 760, 890], flow: 'up', hue: 160, side: 'east' },
  { num: 3, rect: [600, 890, 760, 1030], flow: 'up', hue: 200, side: 'east' },
  { num: 2, rect: [600, 1030, 760, 1105], flow: 'up', hue: 280, side: 'east' },
  { num: 1, rect: [600, 1105, 760, 1220], flow: 'up', hue: 330, side: 'east' },
  { num: 7, rect: [118, 335, 272, 560], flow: 'down', hue: 20, side: 'west' },
  { num: 8, rect: [118, 560, 272, 775], flow: 'down', hue: 150, side: 'west' },
  { num: 9, rect: [118, 775, 272, 1010], flow: 'down', hue: 95, side: 'west' },
  { num: 10, rect: [118, 1107, 272, 1220], flow: 'right', hue: 260, side: 'west' },
  { num: 11, rect: [118, 1220, 272, 1330], flow: 'right', hue: 210, side: 'west' },
];

/** Piezas que no están dentro de una sala numerada: zona y punto en el plano. */
export const FIXED: Record<string, { zone: number; at: [number, number] }> = {
  mna_s00_monolito_tlaloc: { zone: 0, at: [350, 1800] },
  mna_s00_fachada_celosia: { zone: 0, at: [435, 1735] },
  mna_s00_mural_tamayo: { zone: 0.5, at: [675, 1688] },
  mna_s00_el_paraguas: { zone: 0.7, at: [435, 1228] },
  mna_s00_espejo_caracol: { zone: 0.7, at: [435, 830] },
};

/** Puntos por donde se camina al pasar de una zona a la siguiente. */
export const WAYPOINTS: Record<string, [number, number][]> = {
  '0-0.5': [[435, 1712], [435, 1650]],
  '0.5-0.7': [[435, 1480], [435, 1330]],
  '0.7-1': [[560, 1160], [600, 1160]],
  '1-2': [[680, 1105]],
  '2-3': [[680, 1030]],
  '3-4': [[680, 890]],
  '4-5': [[680, 720]],
  '5-6': [[650, 505], [585, 515], [567, 522]],
  '6-7': [[305, 540], [288, 572], [272, 548]],
  '7-8': [[195, 560]],
  '8-9': [[195, 775]],
  '9-10': [[195, 1010], [195, 1107]],
  '10-11': [[195, 1220]],
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

/** Bloques de la planta alta según el plano del museo. Nuestras salas 12 a 21 se acomodan aquí cuando se recorran en sitio. */
export interface UpperBlock {
  id: string;
  rect: [number, number, number, number];
  hue: number;
  title: Record<'es' | 'en' | 'fr' | 'pl', string>;
}
export const PA_BLOCKS: UpperBlock[] = [
  { id: 'identidades', rect: [68, 335, 263, 640], hue: 20, title: { es: 'Identidades, historias…', en: 'Identities, histories…', fr: 'Identités, histoires…', pl: 'Tożsamości, historie…' } },
  { id: 'fiestas', rect: [68, 640, 263, 1000], hue: 320, title: { es: 'Fiestas y rituales', en: 'Festivals and rituals', fr: 'Fêtes et rituels', pl: 'Święta i rytuały' } },
  { id: 'textiles', rect: [68, 1000, 263, 1330], hue: 260, title: { es: 'Textiles', en: 'Textiles', fr: 'Textiles', pl: 'Tekstylia' } },
  { id: 'comidas', rect: [523, 500, 718, 1000], hue: 45, title: { es: 'Comidas, producción y consumo', en: 'Food, production and consumption', fr: 'Alimentation, production et consommation', pl: 'Żywność, produkcja i konsumpcja' } },
  { id: 'pueblos', rect: [523, 1000, 718, 1330], hue: 160, title: { es: 'Pueblos, lenguas y territorios', en: 'Peoples, languages and territories', fr: 'Peuples, langues et territoires', pl: 'Ludy, języki i terytoria' } },
];

const tone = (h: number, pct = 20) => `color-mix(in oklab, hsl(${h} 60% 50%) ${pct}%, var(--c-surface))`;
export const roomFill = (h: number, here: boolean) => tone(h, here ? 48 : 20);

const W = 'var(--c-ink-2)';
const T = { fill: 'var(--c-ink-3)', fontWeight: 600 } as const;

/** Fondo de la planta baja: plaza, vestíbulo, patio, estanque, Paraguas, servicios. Se dibuja una sola vez. */
export const PbBase: React.FC = React.memo(() => (
  <g>
    <rect x={303} y={1712} width={267} height={190} rx={6} fill="var(--c-raised)" opacity={0.7} />
    <text x={436} y={1865} textAnchor="middle" fontSize={17} {...T}>Reforma</text>
    <rect x={112} y={1437} width={788} height={275} rx={10} fill="var(--c-surface)" stroke={W} strokeWidth={4} />
    <rect x={278} y={556} width={318} height={882} fill="var(--c-raised)" opacity={0.6} />
    <rect x={373} y={688} width={125} height={255} rx={6} fill="color-mix(in oklab, #3b82f6 28%, var(--c-surface))" stroke="#3b82f6" strokeWidth={2.5} />
    <rect x={415} y={500} width={46} height={265} fill="var(--c-surface)" stroke={W} strokeWidth={3} />
    <circle cx={435} cy={1228} r={34} fill="var(--c-surface)" stroke={W} strokeWidth={4} />
    <circle cx={435} cy={1228} r={48} fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 5" />
    <path d="M375 1500 A62 62 0 0 0 500 1500" fill="none" stroke={W} strokeWidth={3} strokeDasharray="2 5" />
    {[[600, 1220, 760, 1330], [600, 340, 683, 480], [570, 1600, 898, 1712], [180, 1500, 303, 1548], [180, 1575, 303, 1648]].map(([x0, y0, x1, y1]) => (
      <rect key={`${x0}-${y0}`} x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={6} fill="var(--c-bg)" stroke={W} strokeWidth={2.5} />
    ))}
    {[[257, 1045], [290, 1175], [580, 1175]].map(([x, y]) => (
      <g key={`s${x}`}>
        <rect x={x - 15} y={y - 12} width={30} height={24} rx={6} fill="var(--c-surface)" stroke={W} strokeWidth={1.5} />
        <text x={x} y={y + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--c-ink)">↕</text>
      </g>
    ))}
    {[[270, 1698], [695, 1640]].map(([x, y]) => (
      <g key={`w${x}`}>
        <rect x={x - 15} y={y - 12} width={30} height={24} rx={6} fill="var(--c-surface)" stroke={W} strokeWidth={1.5} />
        <text x={x} y={y + 5} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--c-ink)">WC</text>
      </g>
    ))}
    {[418, 436, 454].map((x) => <rect key={x} x={x - 8} y={1706} width={16} height={8} fill="var(--c-jade)" />)}
  </g>
));

/** Rótulos del fondo (se traducen aparte). */
export const baseLabels = (t: Record<string, string>) => [
  { x: 436, y: 1000, s: t.courtyard, size: 21, bold: true },
  { x: 436, y: 830, s: t.pond, size: 19 },
  { x: 435, y: 1290, s: t.umbrella, size: 19 },
  { x: 436, y: 1595, s: t.lobby, size: 16 },
  { x: 436, y: 1675, s: t.entrance, size: 18, bold: true },
  { x: 700, y: 1285, s: t.temporary, size: 14 },
  { x: 641, y: 415, s: t.ballgame, size: 13 },
  { x: 735, y: 1664, s: t.auditorium, size: 14 },
  { x: 241, y: 1530, s: t.cloakroom, size: 13 },
  { x: 241, y: 1616, s: t.shop, size: 13 },
];
