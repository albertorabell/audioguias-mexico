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
  | 'offline_download';

export interface AnalyticsFields {
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
      body: JSON.stringify({ e, ...fields }),
    }).catch(() => undefined);
  } catch {
    /* sin red o sin fetch: no pasa nada */
  }
}
