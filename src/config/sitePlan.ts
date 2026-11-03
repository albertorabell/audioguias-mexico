import { getAssetUrl } from '../utils/urlHelper';

/**
 * Plano de un sitio con planos propios (un SVG limpio por planta) y paradas con posición exacta.
 * Es el estándar para todos los sitios: cada uno aporta SOLO datos (src/config/plans/<sitio>.ts), sin código.
 * - Los SVG llevan únicamente los muros del edificio (sin rótulos, iconos ni pines de nadie).
 * - Las posiciones (at) están en unidades del dibujo del SVG de su planta.
 * - approx = posición por confirmar en sitio (se dibuja con borde punteado).
 */
export type PlanLang = 'es' | 'en' | 'fr' | 'pl' | 'de' | 'pt' | 'it';
export type PlanFloor = 'PB' | 'PA';
export type Pt = [number, number];
export type Rect = [number, number, number, number];
export type PlanText = Record<PlanLang, string>;

export interface PlanPin { floor: PlanFloor; at: Pt; approx?: boolean }
export interface PlanArea { id: string; floor: PlanFloor; view: Rect; name: PlanText }
export interface PlanFloorDef { img: string; size: Pt; view: Rect; name: PlanText }
export interface SitePlan {
  siteId: string;
  aria: PlanText;
  floors: Partial<Record<PlanFloor, PlanFloorDef>>;
  pins: Record<string, PlanPin>;
  areas: PlanArea[];
}

export const planImg = (file: string) => getAssetUrl(`plano/${file}`);

const registry = new Map<string, SitePlan>();
export const registerSitePlan = (p: SitePlan) => { registry.set(p.siteId.toLowerCase(), p); };
export const getSitePlan = (siteId?: string): SitePlan | undefined => (siteId ? registry.get(siteId.toLowerCase()) : undefined);

/** Textos comunes a todos los planos (botones y avisos). Los nombres de lugares van en la configuración de cada sitio. */
export const PLAN_UI: Record<PlanLang, Record<string, string>> = {
  es: { all: 'Ver todo', center: 'Centrar en mí', zin: 'Acercar', zout: 'Alejar', next: 'Siguiente parada', arrived: 'Llegué', hint: 'Toca un punto para ver la parada. Pellizca para acercar y arrastra para mover.', here: 'Estás aquí', approx: 'Aproximado: la posición exacta se confirma en sitio.', locked: 'Parada con el pase', unlock: 'Desbloquear con el pase', open: 'Abrir parada', areas: 'Zonas', goUp: 'Sube a la planta alta', goDown: 'Baja a la planta baja', otherFloor: 'Esta parada está en la otra planta.', stopWord: 'Parada' },
  en: { all: 'Show all', center: 'Center on me', zin: 'Zoom in', zout: 'Zoom out', next: 'Next stop', arrived: "I'm here", hint: 'Tap a dot to see the stop. Pinch to zoom and drag to move.', here: 'You are here', approx: 'Approximate: the exact position is confirmed on site.', locked: 'Stop with the pass', unlock: 'Unlock with the pass', open: 'Open stop', areas: 'Areas', goUp: 'Go up to the upper floor', goDown: 'Go down to the ground floor', otherFloor: 'This stop is on the other floor.', stopWord: 'Stop' },
  fr: { all: 'Tout voir', center: 'Me centrer', zin: 'Zoomer', zout: 'Dézoomer', next: 'Prochain arrêt', arrived: 'Je suis arrivé', hint: 'Touchez un point pour voir l’arrêt. Pincez pour zoomer, glissez pour déplacer.', here: 'Vous êtes ici', approx: 'Approximatif : la position exacte est confirmée sur place.', locked: 'Arrêt avec le pass', unlock: 'Débloquer avec le pass', open: 'Ouvrir l’arrêt', areas: 'Zones', goUp: 'Montez à l’étage', goDown: 'Descendez au rez-de-chaussée', otherFloor: 'Cet arrêt est à l’autre niveau.', stopWord: 'Arrêt' },
  pl: { all: 'Pokaż całość', center: 'Wyśrodkuj', zin: 'Przybliż', zout: 'Oddal', next: 'Następny przystanek', arrived: 'Jestem na miejscu', hint: 'Dotknij punktu, aby zobaczyć przystanek. Szczypnij, aby przybliżyć, i przeciągnij, aby przesunąć.', here: 'Jesteś tutaj', approx: 'Orientacyjnie: dokładne położenie potwierdzamy na miejscu.', locked: 'Przystanek z karnetem', unlock: 'Odblokuj karnetem', open: 'Otwórz przystanek', areas: 'Strefy', goUp: 'Idź na piętro', goDown: 'Zejdź na parter', otherFloor: 'Ten przystanek jest na drugim poziomie.', stopWord: 'Przystanek' },
  de: { all: 'Alles zeigen', center: 'Auf mich zentrieren', zin: 'Vergrößern', zout: 'Verkleinern', next: 'Nächste Station', arrived: 'Ich bin da', hint: 'Tippe auf einen Punkt, um die Station zu sehen. Zum Zoomen zusammenziehen, zum Verschieben ziehen.', here: 'Du bist hier', approx: 'Ungefähr: Die genaue Position bestätigen wir vor Ort.', locked: 'Station mit Pass', unlock: 'Mit Pass freischalten', open: 'Station öffnen', areas: 'Bereiche', goUp: 'Geh ins Obergeschoss', goDown: 'Geh ins Erdgeschoss', otherFloor: 'Diese Station liegt auf der anderen Ebene.', stopWord: 'Station' },
  pt: { all: 'Ver tudo', center: 'Centralizar em mim', zin: 'Aproximar', zout: 'Afastar', next: 'Próxima parada', arrived: 'Cheguei', hint: 'Toque em um ponto para ver a parada. Use dois dedos para dar zoom e arraste para mover.', here: 'Você está aqui', approx: 'Aproximado: a posição exata é confirmada no local.', locked: 'Parada com passe', unlock: 'Desbloquear com passe', open: 'Abrir parada', areas: 'Áreas', goUp: 'Suba ao andar superior', goDown: 'Desça ao térreo', otherFloor: 'Esta parada está no outro andar.', stopWord: 'Parada' },
  it: { all: 'Mostra tutto', center: 'Centra su di me', zin: 'Avvicina', zout: 'Allontana', next: 'Prossima tappa', arrived: 'Sono arrivato', hint: 'Tocca un punto per vedere la tappa. Pizzica per ingrandire e trascina per spostare.', here: 'Sei qui', approx: 'Approssimativo: la posizione esatta viene confermata sul posto.', locked: 'Tappa con il pass', unlock: 'Sblocca con il pass', open: 'Apri la tappa', areas: 'Zone', goUp: 'Sali al piano superiore', goDown: 'Scendi al piano terra', otherFloor: 'Questa tappa è all’altro piano.', stopWord: 'Tappa' },
};
