import { PAYMENTS_API_URL } from '../config/payments';

/**
 * Conteo anónimo de uso. Solo se manda el nombre del evento y, si aplica, la obra, el idioma y el tipo de audio.
 * NO se manda ningún identificador de dispositivo ni de persona, y no se guardan cookies ni nada en el teléfono.
 * Además, al cerrar la app se manda UN resumen de la visita (pantallas por las que pasó, cuántos audios, cuánto tiempo);
 * ese resumen vive solo en memoria y tampoco lleva identificador. Ver el aviso de privacidad (src/i18n/aviso.ts).
 * Si no hay servidor de cobro configurado, no hace nada. Nunca debe romper la app: todo falla en silencio.
 */
export type AnalyticsEvent =
  | 'app_open'
  | 'piece_view'
  | 'audio_play'
  | 'audio_end'
  | 'paywall_open'
  | 'checkout_start'
  | 'lang_change'
  | 'route_start'
  | 'tour_done'
  | 'install'
  | 'offline_download'
  | 'screen_view'
  | 'audio_stop'
  | 'util_si'
  | 'util_no';

/**
 * De dónde llegó la persona, en una categoría muy general (nunca la dirección completa ni ningún código).
 * Se calcula al cargar el módulo, antes de que la app quite ?c= de la dirección.
 */
export type TrafficSource = 'app_instalada' | 'qr' | 'buscador' | 'redes' | 'otro_sitio' | 'directo';

export function classifySource(search: string, referrer: string, ownHost: string, standalone: boolean): TrafficSource {
  if (standalone) return 'app_instalada';
  const params = new URLSearchParams(search);
  if (params.has('c') || params.has('qr') || params.has('utm_source')) return 'qr';
  if (!referrer) return 'directo';
  let host = '';
  try {
    host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return 'directo';
  }
  if (!host || host === ownHost.toLowerCase().replace(/^www\./, '')) return 'directo';
  if (/(^|\.)(google|bing|duckduckgo|yahoo|ecosia|baidu|yandex)\./.test(host) || host === 'search.brave.com') return 'buscador';
  if (/(^|\.)(facebook|instagram|tiktok|twitter|x|t|reddit|linkedin|pinterest|youtube|whatsapp|wa)\.(com|co|me|net)$/.test(host) || host === 't.co' || host === 'l.facebook.com') return 'redes';
  return 'otro_sitio';
}

let SOURCE: TrafficSource = 'directo';
try {
  if (typeof window !== 'undefined') {
    const standalone = !!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (navigator as any).standalone === true;
    SOURCE = classifySource(window.location.search, document.referrer, window.location.hostname, standalone);
  }
} catch {
  /* sin acceso a la dirección: se queda en «directo» */
}

/** Origen de esta visita (solo se manda con la apertura de la app). */
export function trafficSource(): TrafficSource {
  return SOURCE;
}

let currentSite = '';

/** Sitio que se está viendo. Se agrega solo a cada evento para saber qué sitios se usan; no identifica a nadie. */
export function setAnalyticsSite(siteId: string | null | undefined): void {
  currentSite = siteId ? siteId.toLowerCase() : '';
}

/** Sitio que se está viendo (para el formulario de contacto). */
export function getAnalyticsSite(): string {
  return currentSite;
}

export interface AnalyticsFields {
  /** Sitio (si no se pone, el que se está viendo). Para el pase combinado: «todos». */
  s?: string;
  /** Identificador de la obra */
  p?: string;
  /** Idioma */
  l?: string;
  /** Versión: corto | largo */
  m?: 'corto' | 'largo';
  /** Tipo: mp3 (voz buena) | voz (voz del teléfono) */
  k?: string;
}

export function track(e: AnalyticsEvent, fields: AnalyticsFields = {}): void {
  if (!PAYMENTS_API_URL) return;
  try {
    if (typeof navigator !== 'undefined' && navigator.webdriver) return; // pruebas automáticas
    void fetch(`${PAYMENTS_API_URL}/evento`, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ e, ...(currentSite ? { s: currentSite } : {}), ...fields }),
    }).catch(() => undefined);
  } catch {
    /* sin red o sin fetch: no pasa nada */
  }
}

// ---------------------------------------------------------------------------
// Resumen anónimo de la visita. Vive solo en memoria (se pierde al cerrar la app, no se guarda en el teléfono) y se manda
// una vez, al cerrar o enviar la app al fondo. No lleva número de visitante: el servidor solo suma contadores.
// ---------------------------------------------------------------------------
const MAX_STEPS = 8;
interface Visit {
  path: string[];
  screens: number;
  audios: number;
  heard: number;
  sites: Set<string>;
  paywall: boolean;
  start: number;
}
const newVisit = (): Visit => ({ path: [], screens: 0, audios: 0, heard: 0, sites: new Set(), paywall: false, start: Date.now() });
let visit: Visit = newVisit();

/** Pantalla que se acaba de ver (se ignoran repeticiones seguidas). */
export function noteScreen(name: string): void {
  visit.screens += 1;
  if (currentSite) visit.sites.add(currentSite);
  if (visit.path[visit.path.length - 1] !== name && visit.path.length < MAX_STEPS) visit.path.push(name);
}

/** Un audio que se dejó de oír: qué fracción (0 a 1) alcanzó a sonar. */
export function noteAudio(fraction: number): void {
  if (!Number.isFinite(fraction)) return;
  visit.audios += 1;
  visit.heard += Math.min(1, Math.max(0, fraction));
  // El audio suele terminar con la pantalla apagada: la visita ya estaba «en espera» y se manda ahora
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') flushVisit();
}

let audioProbe: () => boolean = () => false;
/** Para no cortar la visita a la mitad cuando la pantalla se apaga con un audio sonando. */
export function setAudioProbe(fn: () => boolean): void {
  audioProbe = fn;
}

export function notePaywall(): void {
  visit.paywall = true;
  if (visit.path[visit.path.length - 1] !== 'pase' && visit.path.length < MAX_STEPS) visit.path.push('pase');
}

/** Manda el resumen (si hubo algo que contar) y empieza uno nuevo. */
export function flushVisit(): void {
  const v = visit;
  visit = newVisit();
  if (!PAYMENTS_API_URL || !v.path.length) return;
  try {
    if (typeof navigator !== 'undefined' && navigator.webdriver) return;
    void fetch(`${PAYMENTS_API_URL}/recorrido`, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        p: v.path,
        n: v.screens,
        a: v.audios,
        c: v.audios ? Math.round((v.heard / v.audios) * 100) : 0,
        d: Math.round((Date.now() - v.start) / 1000),
        s: [...v.sites],
        w: v.paywall,
      }),
    }).catch(() => undefined);
  } catch {
    /* sin red: no pasa nada */
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && !audioProbe()) flushVisit();
  });
  window.addEventListener('pagehide', flushVisit);
}
