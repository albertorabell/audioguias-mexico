import { PLAN_UI, PlanLang, PlanText } from './sitePlan';

/**
 * Edificios con plano interior dentro del mapa real de un sitio («entrar al edificio»).
 * El contorno sale de OpenStreetMap (© colaboradores de OpenStreetMap, ODbL): [longitud, latitud].
 * Las paradas de un edificio no se dibujan una por una en el mapa real (su punto exacto está en el plano):
 * el mapa muestra el edificio con cuántas paradas tiene adentro y un botón para entrar al plano.
 * Cada sitio aporta solo datos (src/config/plans/<sitio>.ts), sin código.
 */
export interface Building {
  id: string;
  name: PlanText;
  /** Contorno del edificio, [lng, lat], cerrado o abierto. Si OSM no lo tiene, va vacío y se usa `center`. */
  outline?: [number, number][];
  /** Punto del edificio [lng, lat] cuando no hay contorno. */
  center?: [number, number];
  /** Paradas que están adentro. «plan» = todas las que tienen punto en el plano del sitio. */
  pieces: 'plan' | string[];
  /** Zona del plano que se abre al entrar (id de PlanArea). Vacío = el plano completo. */
  area?: string;
}

const registry = new Map<string, Building[]>();
export const registerBuildings = (siteId: string, list: Building[]) => { registry.set(siteId.toLowerCase(), list.filter((b) => (Array.isArray(b.outline) && b.outline.length >= 3) || Array.isArray(b.center))); };
export const getBuildings = (siteId?: string): Building[] => (siteId ? registry.get(siteId.toLowerCase()) || [] : []);

/** Centro aproximado de un contorno (promedio de vértices; basta para poner la etiqueta). */
export function outlineCenter(o: [number, number][]): [number, number] {
  const pts = o.length > 1 && o[0][0] === o[o.length - 1][0] && o[0][1] === o[o.length - 1][1] ? o.slice(0, -1) : o;
  const s = pts.reduce((a, p) => [a[0] + p[0], a[1] + p[1]], [0, 0]);
  return [s[0] / pts.length, s[1] / pts.length];
}

/** ¿El punto (lng, lat) está dentro del contorno? (rayo par-impar). */
export function insideOutline(lng: number, lat: number, o: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = o.length - 1; i < o.length; j = i++) {
    const [xi, yi] = o[i], [xj, yj] = o[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Textos del mapa real para los edificios, en los 7 idiomas. */
export const BUILDING_UI: Record<PlanLang, { enter: string; inside: (n: number) => string; youAreIn: (b: string) => string; seePlan: string; nextInside: (n: number) => string }> = {
  es: { enter: 'Entrar', inside: (n) => (n === 1 ? '1 parada adentro' : `${n} paradas adentro`), youAreIn: (b) => `Estás en ${b}`, seePlan: 'Ver el plano', nextInside: (n) => `Tu siguiente parada (${n}) está adentro` },
  en: { enter: 'Go inside', inside: (n) => (n === 1 ? '1 stop inside' : `${n} stops inside`), youAreIn: (b) => `You are at ${b}`, seePlan: 'See the floor plan', nextInside: (n) => `Your next stop (${n}) is inside` },
  fr: { enter: 'Entrer', inside: (n) => (n === 1 ? '1 arrêt à l’intérieur' : `${n} arrêts à l’intérieur`), youAreIn: (b) => `Vous êtes à ${b}`, seePlan: 'Voir le plan', nextInside: (n) => `Votre prochain arrêt (${n}) est à l’intérieur` },
  pl: { enter: 'Wejdź', inside: (n) => (n === 1 ? '1 przystanek w środku' : `Przystanki w środku: ${n}`), youAreIn: (b) => `Jesteś tutaj: ${b}`, seePlan: 'Zobacz plan', nextInside: (n) => `Twój następny przystanek (${n}) jest w środku` },
  de: { enter: 'Hineingehen', inside: (n) => (n === 1 ? '1 Station innen' : `${n} Stationen innen`), youAreIn: (b) => `Du bist hier: ${b}`, seePlan: 'Grundriss ansehen', nextInside: (n) => `Deine nächste Station (${n}) ist drinnen` },
  pt: { enter: 'Entrar', inside: (n) => (n === 1 ? '1 parada lá dentro' : `${n} paradas lá dentro`), youAreIn: (b) => `Você está em ${b}`, seePlan: 'Ver a planta', nextInside: (n) => `Sua próxima parada (${n}) fica lá dentro` },
  it: { enter: 'Entra', inside: (n) => (n === 1 ? '1 tappa all’interno' : `${n} tappe all’interno`), youAreIn: (b) => `Sei a ${b}`, seePlan: 'Vedi la pianta', nextInside: (n) => `La tua prossima tappa (${n}) è all’interno` },
};

export const planLang = (l: string): PlanLang => ((Object.keys(PLAN_UI) as PlanLang[]).includes(l as PlanLang) ? (l as PlanLang) : 'es');
