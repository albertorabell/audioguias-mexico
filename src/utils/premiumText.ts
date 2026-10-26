import { PAYMENTS_API_URL } from '../config/payments';

/**
 * Textos de pago (guiones, retos, mito y ficha técnica). No viajan con el sitio: el servidor de cobro los entrega
 * solo con un pase vigente, un archivo por idioma. Se guardan en el teléfono para poder usarlos sin internet.
 */
export type PremiumTextMap = Record<string, Record<string, unknown>>;

export type PremiumTextResult =
  | { status: 'ok'; map: PremiumTextMap; lang: string; fromCache: boolean }
  | { status: 'denied' } // el servidor dice que esa clave ya no vale (venció o se canceló)
  | { status: 'error' }; // sin internet y sin copia guardada, o el servidor falló

const CACHE_NAME = 'audioguias-texto-v2';
const OLD_CACHE_NAME = 'audioguias-texto-v1'; // guardaba una sola copia para todos los sitios
// Una copia por idioma y por sitio: así los textos de un sitio ya visitado siguen disponibles sin internet
const cacheRequest = (lang: string, siteId: string) => new Request(`${location.origin}/__texto/${lang}/${siteId.toLowerCase()}.json`);

async function openCache(): Promise<Cache | null> {
  try {
    if (typeof caches === 'undefined') return null;
    void caches.delete(OLD_CACHE_NAME);
    return await caches.open(CACHE_NAME);
  } catch {
    return null;
  }
}

async function readCache(lang: string, siteId: string): Promise<PremiumTextMap | null> {
  try {
    const cache = await openCache();
    const hit = cache ? await cache.match(cacheRequest(lang, siteId)) : null;
    if (!hit) return null;
    const data = await hit.json();
    return data?.pieces || null;
  } catch {
    return null;
  }
}

/** Borra los textos guardados de un sitio (el pase venció o se canceló). Sin sitio, borra los de todos. */
export async function clearPremiumText(siteId?: string): Promise<void> {
  try {
    if (typeof caches === 'undefined') return;
    if (!siteId) {
      await caches.delete(CACHE_NAME);
      return;
    }
    const cache = await caches.open(CACHE_NAME);
    const suffix = `/${siteId.toLowerCase()}.json`;
    for (const req of await cache.keys()) if (new URL(req.url).pathname.endsWith(suffix)) await cache.delete(req);
  } catch {
    /* nada que borrar */
  }
}

/** Solo lo que ya está guardado en el teléfono (para mostrar algo al instante mientras llega lo nuevo). */
export async function cachedPremiumText(lang: string, siteId: string): Promise<PremiumTextMap | null> {
  return (await readCache(lang, siteId)) ?? (lang !== 'es' ? await readCache('es', siteId) : null);
}

async function fetchOne(lang: string, token: string, siteId: string): Promise<{ kind: 'ok'; map: PremiumTextMap } | { kind: 'missing' } | { kind: 'denied' } | { kind: 'error' }> {
  try {
    // `site` sirve para dos cosas: pedir solo los textos de este sitio y, si es gratis, entrar sin clave
    const res = await fetch(`${PAYMENTS_API_URL}/texto/${lang}.json?t=${encodeURIComponent(token)}&site=${encodeURIComponent(siteId.toLowerCase())}`);
    if (res.status === 401) return { kind: 'denied' };
    if (res.status === 404) return { kind: 'missing' };
    if (!res.ok) return { kind: 'error' };
    const raw = await res.clone().text();
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || !data.pieces) return { kind: 'error' };
    const cache = await openCache();
    if (cache) {
      try {
        await cache.put(cacheRequest(lang, siteId), new Response(raw, { headers: { 'Content-Type': 'application/json' } }));
      } catch {
        /* sin espacio: se usa sin guardar */
      }
    }
    return { kind: 'ok', map: data.pieces as PremiumTextMap };
  } catch {
    return { kind: 'error' };
  }
}

/**
 * Pide al servidor los textos del idioma (si ese idioma no tiene archivo, los de español).
 * Sin internet usa la copia guardada.
 */
export async function loadPremiumText(lang: string, token: string, siteId: string): Promise<PremiumTextResult> {
  if (!PAYMENTS_API_URL || !token) return { status: 'error' };
  for (const l of lang === 'es' ? ['es'] : [lang, 'es']) {
    const r = await fetchOne(l, token, siteId);
    if (r.kind === 'ok') return { status: 'ok', map: r.map, lang: l, fromCache: false };
    if (r.kind === 'denied') {
      await clearPremiumText(siteId);
      return { status: 'denied' };
    }
    if (r.kind === 'error') {
      // Sin internet o el servidor falló: se usa lo guardado en el teléfono
      for (const c of l === 'es' ? ['es'] : [l, 'es']) {
        const cached = await readCache(c, siteId);
        if (cached) return { status: 'ok', map: cached, lang: c, fromCache: true };
      }
      return { status: 'error' };
    }
    // missing: se prueba con español
  }
  return { status: 'error' };
}

/** Une los textos de pago con las piezas públicas. */
export function mergePremiumText<T extends { piece_id?: string }>(pieces: T[], map: PremiumTextMap | null): T[] {
  if (!map) return pieces;
  return pieces.map((p) => {
    const extra = p.piece_id ? map[p.piece_id] : undefined;
    return extra ? ({ ...p, ...extra } as T) : p;
  });
}
