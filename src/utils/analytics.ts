import { PAYMENTS_API_URL } from '../config/payments';

/**
 * Conteo anónimo de uso. Solo se manda el nombre del evento y, si aplica, la obra, el idioma y el tipo de audio.
 * NO se manda ningún identificador de dispositivo ni de persona, y no se guardan cookies.
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
  | 'screen_view';

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
