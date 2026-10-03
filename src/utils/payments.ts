import { PAYMENTS_API_URL, PAYMENTS_ENABLED } from '../config/payments';
import { SupportedLanguage } from '../i18n/languages';
import { PASS_HOURS } from '../config/pass';
import { activatePass, getOrCreateDeviceId } from './license';
import type { SiteLicense } from '../types';

/** Códigos de error que puede devolver el servidor de pagos (o la conexión). */
export type PaymentErrorCode =
  | 'network'
  | 'not_paid'
  | 'session_not_found'
  | 'device_limit'
  | 'expired'
  | 'code_not_found'
  | 'bad_request'
  | 'bad_session'
  | 'bad_return_url'
  | 'not_configured'
  | 'stripe_error'
  | 'origin_not_allowed'
  | 'server_error'
  | 'unknown';

// Sin "strict" en tsconfig, TypeScript no distingue uniones por `ok`; por eso es un solo tipo con campos opcionales.
export type PaymentResult<T> = { ok: boolean; data?: T; error?: PaymentErrorCode };

const KNOWN: PaymentErrorCode[] = [
  'not_paid', 'session_not_found', 'device_limit', 'expired', 'code_not_found', 'bad_request', 'bad_session',
  'bad_return_url', 'not_configured', 'stripe_error', 'origin_not_allowed', 'server_error',
];

async function call(path: string, init?: RequestInit): Promise<PaymentResult<any>> {
  if (!PAYMENTS_ENABLED) return { ok: false, error: 'not_configured' };
  let res: Response;
  try {
    res = await fetch(`${PAYMENTS_API_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  } catch {
    return { ok: false, error: 'network' };
  }
  const data = await res.json().catch(() => ({}));
  if (res.ok) return { ok: true, data };
  const code = String(data?.error || '');
  if ((KNOWN as string[]).includes(code)) return { ok: false, error: code as PaymentErrorCode };
  // Una página de error de Cloudflare (5xx) o "demasiadas solicitudes" (429) no trae código nuestro: es un fallo pasajero, se puede reintentar
  return { ok: false, error: res.status >= 500 || res.status === 429 ? 'server_error' : 'unknown' };
}

const post = (path: string, body: unknown) => call(path, { method: 'POST', body: JSON.stringify(body) });

export interface PricingInfo {
  prices: { mxn?: { amount: number; currency: string }; usd?: { amount: number; currency: string } };
  passHours: number;
  maxDevices: number;
}

/** Precios reales (los lee el servidor de Stripe). null si no hay servidor o no responde: se usan los de la ficha del sitio. */
export async function fetchPricing(): Promise<PricingInfo | null> {
  const r = await call('/config');
  // Sin precio en pesos no hay nada confiable que mostrar: la ventana usa los precios de la ficha del sitio
  return r.ok && r.data?.prices?.mxn ? (r.data as PricingInfo) : null;
}

/** Pide la página de pago de Stripe. Si sale bien, hay que mandar al visitante a `url`. */
export async function startCheckout(siteId: string, lang: SupportedLanguage): Promise<PaymentResult<{ url: string }>> {
  const returnUrl = `${window.location.origin}${window.location.pathname}`;
  const r = await post('/checkout', { siteId: siteId.toLowerCase(), lang, deviceId: getOrCreateDeviceId(), returnUrl });
  if (!r.ok) return r;
  if (typeof r.data?.url !== 'string' || !/^https:\/\//.test(r.data.url)) return { ok: false, error: 'stripe_error' };
  return { ok: true, data: { url: r.data.url } };
}

function storeGrant(fallbackSite: string, d: any): SiteLicense {
  return activatePass(String(d.site || fallbackSite), PASS_HOURS, { token: d.token, expiresAt: d.expiresAt, code: d.code });
}

/** El visitante regresó de Stripe: se confirma el pago y el pase queda guardado en este dispositivo. */
export async function redeemSession(sessionId: string, siteId = ''): Promise<PaymentResult<SiteLicense>> {
  const r = await post('/redeem', { sessionId, deviceId: getOrCreateDeviceId(), ...(siteId ? { siteId: siteId.toLowerCase() } : {}) });
  return r.ok ? { ok: true, data: storeGrant(siteId || 'mna', r.data) } : r;
}

/** Activa el pase de otra persona/dispositivo con su código corto (máximo 2 dispositivos por pase). */
export async function redeemCode(code: string, siteId: string): Promise<PaymentResult<SiteLicense>> {
  const r = await post('/code', { code, siteId: siteId.toLowerCase(), deviceId: getOrCreateDeviceId() });
  return r.ok ? { ok: true, data: storeGrant(siteId, r.data) } : r;
}

export type PaymentReturn = { status: 'paid'; sessionId: string } | { status: 'cancelled' };

const PENDING_KEY = 'audioguias_pending_session';
const PENDING_SINCE_KEY = 'audioguias_pending_since';
// Un pago pendiente se sigue intentando canjear hasta por 7 días; después se olvida (el servidor tampoco lo aceptaría mucho más tiempo)
const PENDING_MAX_AGE_MS = 7 * 24 * 3600 * 1000;

/** Pago de regreso de Stripe que todavía no se pudo canjear (por ejemplo, no había internet). Se reintenta al abrir la app. */
export function getPendingSession(): string | null {
  try {
    const v = localStorage.getItem(PENDING_KEY);
    if (!v || !/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(v)) return null;
    const since = parseInt(localStorage.getItem(PENDING_SINCE_KEY) || '0', 10);
    if (since && Date.now() - since > PENDING_MAX_AGE_MS) {
      clearPendingSession();
      return null;
    }
    return v;
  } catch {
    return null;
  }
}

export function clearPendingSession(): void {
  try {
    localStorage.removeItem(PENDING_KEY);
    localStorage.removeItem(PENDING_SINCE_KEY);
  } catch {
    /* sin almacenamiento */
  }
}

/** Errores que se pueden arreglar reintentando más tarde: el pago pendiente se conserva. */
export const RETRYABLE_ERRORS: PaymentErrorCode[] = ['network', 'server_error', 'stripe_error', 'not_paid', 'not_configured'];

/** Canjea el pago pendiente (si hay). Si sale bien o el error ya no tiene remedio, lo olvida. */
export async function redeemPendingSession(fallbackSessionId?: string): Promise<PaymentResult<SiteLicense> | null> {
  // Si el navegador no deja guardar datos, se usa el pago que acaba de venir en la dirección (se intenta una vez)
  const id = getPendingSession() || fallbackSessionId || null;
  if (!id) return null;
  const r = await redeemSession(id);
  if (r.ok || !RETRYABLE_ERRORS.includes(r.error)) clearPendingSession();
  return r;
}

/**
 * Si la página se abrió al regresar de Stripe (?pago=ok&session_id=… o ?pago=cancelado), lo devuelve
 * y limpia la dirección para que un recargo no repita el canje.
 */
export function readPaymentReturn(): PaymentReturn | null {
  if (typeof window === 'undefined') return null;
  let result: PaymentReturn | null = null;
  try {
    const params = new URLSearchParams(window.location.search);
    const flag = params.get('pago');
    if (flag === 'ok') {
      const id = params.get('session_id') || '';
      if (/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(id)) {
        result = { status: 'paid', sessionId: id };
        try {
          localStorage.setItem(PENDING_KEY, id);
          localStorage.setItem(PENDING_SINCE_KEY, String(Date.now()));
        } catch {
          /* si no se puede guardar, el canje se intenta igual una vez */
        }
      }
    } else if (flag === 'cancelado') {
      result = { status: 'cancelled' };
    }
    if (flag) {
      params.delete('pago');
      params.delete('session_id');
      const qs = params.toString();
      window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);
    }
  } catch {
    /* sin acceso a la dirección: se ignora */
  }
  return result;
}
