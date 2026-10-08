/**
 * Utility for downloading and caching full tour assets (JSONs & Images)
 * into CacheStorage for guaranteed offline navigation inside the museum.
 */

import { getStrings } from '../i18n';
import { getCurrentLanguage } from '../i18n/runtime';

export interface OfflineProgress {
  status: 'idle' | 'downloading' | 'completed' | 'error';
  progressPercent: number;
  cachedCount: number;
  totalCount: number;
  currentLabel: string;
  errorMessage?: string;
}

// OJO: el mismo nombre se usa en vite.config.ts (ruta de los MP3). Si lo cambias aquí, cámbialo allá.
export const CACHE_NAME = 'mna-offline-tour-v1';
const LOCAL_STORAGE_OFFLINE_KEY = 'mna_tour_offline_ready';

/** Huella corta de una lista de direcciones (para saber si lo guardado sigue completo). */
export function offlineSignature(urls: string[]): string {
  let h = 5381;
  for (const u of [...urls].sort()) for (let i = 0; i < u.length; i++) h = ((h << 5) + h + u.charCodeAt(i)) | 0;
  return `${urls.length}-${(h >>> 0).toString(36)}`;
}

/** true si ya se guardó esta misma lista (misma huella). Sin huella basta con que haya algo guardado. */
export async function checkIsTourCached(signature?: string): Promise<boolean> {
  try {
    const flag = localStorage.getItem(LOCAL_STORAGE_OFFLINE_KEY);
    if (!flag) return false;
    if (signature && flag !== signature) return false;
    if (!('caches' in window)) return false;
    return await caches.has(CACHE_NAME);
  } catch {
    return false;
  }
}

export async function clearOfflineTourCache(): Promise<void> {
  try {
    if ('caches' in window) {
      await caches.delete(CACHE_NAME);
    }
    localStorage.removeItem(LOCAL_STORAGE_OFFLINE_KEY);
  } catch (err) {
    console.warn('[OfflineTour] Error clearing cache:', err);
  }
}

export async function downloadTourOffline(
  urlsToCache: string[],
  onProgress?: (p: OfflineProgress) => void,
  signature = 'true'
): Promise<boolean> {
  const t = getStrings(getCurrentLanguage()).offline;
  if (!('caches' in window)) {
    onProgress?.({
      status: 'error',
      progressPercent: 0,
      cachedCount: 0,
      totalCount: urlsToCache.length,
      currentLabel: t.unsupportedLabel,
      errorMessage: t.unsupportedMessage,
    });
    return false;
  }

  const uniqueUrls = Array.from(new Set(urlsToCache.filter(Boolean)));
  const total = uniqueUrls.length;
  let cached = 0;

  onProgress?.({
    status: 'downloading',
    progressPercent: 0,
    cachedCount: 0,
    totalCount: total,
    currentLabel: t.starting,
  });

  try {
    const cache = await caches.open(CACHE_NAME);

    for (let i = 0; i < total; i++) {
      const url = uniqueUrls[i];
      const filename = url.split('/').pop()?.split('?')[0] || `item-${i}`;

      onProgress?.({
        status: 'downloading',
        progressPercent: Math.round(((i + 1) / total) * 100),
        cachedCount: i + 1,
        totalCount: total,
        currentLabel: t.downloadingFile(filename),
      });

      try {
        // Use no-cors fallback if cors fails for external image CDNs
        let response = await fetch(url, { mode: 'cors' }).catch(async () => {
          return await fetch(url, { mode: 'no-cors' });
        });

        if (response && (response.ok || response.type === 'opaque')) {
          await cache.put(url, response);
          cached++;
        }
      } catch (e) {
        console.warn(`[OfflineTour] Could not cache asset ${url}:`, e);
      }
    }

    localStorage.setItem(LOCAL_STORAGE_OFFLINE_KEY, signature);

    onProgress?.({
      status: 'completed',
      progressPercent: 100,
      cachedCount: cached,
      totalCount: total,
      currentLabel: t.done,
    });

    return true;
  } catch (error: any) {
    console.error('[OfflineTour] Download failed:', error);
    onProgress?.({
      status: 'error',
      progressPercent: 0,
      cachedCount: cached,
      totalCount: total,
      currentLabel: t.errorLabel,
      errorMessage: error?.message || t.networkError,
    });
    return false;
  }
}
