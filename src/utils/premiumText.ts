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

const CACHE_NAME = 'audioguias-texto-v1';
const cacheRequest = (lang: string) => new Request(`${location.origin}/__texto/${lang}.json`);

async function openCache(): Promise<Cache | null> {
  try {
    return typeof caches !== 'undefined' ? await caches.open(CACHE_NAME) : null;
  } catch {
    return null;
  }
}

async function readCache(lang: string): Promise<PremiumTextMap | null> {
  try {
    const cache = await openCache();
    const hit = cache ? await cache.match(cacheRequest(lang)) : null;
    if (!hit) return null;
    const data = await hit.json();
    return data?.pieces || null;
  } catch {
    return null;
  }
}

/** Borra los textos guardados (el pase venció o se canceló). */
export async function clearPremiumText(): Promise<void> {
  try {
    if (typeof caches !== 'undefined') await caches.delete(CACHE_NAME);
  } catch {
    /* nada que borrar */
  }
}

/** Solo lo que ya está guardado en el teléfono (para mostrar algo al instante mientras llega lo nuevo). */
export async function cachedPremiumText(lang: string): Promise<PremiumTextMap | null> {
  return (await readCache(lang)) ?? (lang !== 'es' ? await readCache('es') : null);
}

async function fetchOne(lang: string, token: string): Promise<{ kind: 'ok'; map: PremiumTextMap } | { kind: 'missing' } | { kind: 'denied' } | { kind: 'error' }> {
  try {
    const res = await fetch(`${PAYMENTS_API_URL}/texto/${lang}.json?t=${encodeURIComponent(token)}`);
    if (res.status === 401) return { kind: 'denied' };
    if (res.status === 404) return { kind: 'missing' };
    if (!res.ok) return { kind: 'error' };
    const raw = await res.clone().text();
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || !data.pieces) return { kind: 'error' };
    const cache = await openCache();
    if (cache) {
      try {
        await cache.put(cacheRequest(lang), new Response(raw, { headers: { 'Content-Type': 'application/json' } }));
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
export async function loadPremiumText(lang: string, token: string): Promise<PremiumTextResult> {
  if (!PAYMENTS_API_URL || !token) return { status: 'error' };
  for (const l of lang === 'es' ? ['es'] : [lang, 'es']) {
    const r = await fetchOne(l, token);
    if (r.kind === 'ok') return { status: 'ok', map: r.map, lang: l, fromCache: false };
    if (r.kind === 'denied') {
      await clearPremiumText();
      return { status: 'denied' };
    }
    if (r.kind === 'error') {
      // Sin internet o el servidor falló: se usa lo guardado en el teléfono
      for (const c of l === 'es' ? ['es'] : [l, 'es']) {
        const cached = await readCache(c);
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
