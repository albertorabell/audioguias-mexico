/**
 * Utility for downloading and caching full tour assets (JSONs & Images)
 * into CacheStorage for guaranteed offline navigation inside the museum.
 */

export interface OfflineProgress {
  status: 'idle' | 'downloading' | 'completed' | 'error';
  progressPercent: number;
  cachedCount: number;
  totalCount: number;
  currentLabel: string;
  errorMessage?: string;
}

const CACHE_NAME = 'mna-offline-tour-v1';
const LOCAL_STORAGE_OFFLINE_KEY = 'mna_tour_offline_ready';

export async function checkIsTourCached(): Promise<boolean> {
  try {
    const flag = localStorage.getItem(LOCAL_STORAGE_OFFLINE_KEY);
    if (!flag) return false;
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
  onProgress?: (p: OfflineProgress) => void
): Promise<boolean> {
  if (!('caches' in window)) {
    onProgress?.({
      status: 'error',
      progressPercent: 0,
      cachedCount: 0,
      totalCount: urlsToCache.length,
      currentLabel: 'CacheStorage no soportado en este navegador',
      errorMessage: 'Tu navegador no permite almacenamiento offline.',
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
    currentLabel: 'Iniciando descarga de recorrido...',
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
        currentLabel: `Descargando: ${filename}`,
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

    localStorage.setItem(LOCAL_STORAGE_OFFLINE_KEY, 'true');

    onProgress?.({
      status: 'completed',
      progressPercent: 100,
      cachedCount: cached,
      totalCount: total,
      currentLabel: '¡Recorrido descargado y listo para usar sin señal!',
    });

    return true;
  } catch (error: any) {
    console.error('[OfflineTour] Download failed:', error);
    onProgress?.({
      status: 'error',
      progressPercent: 0,
      cachedCount: cached,
      totalCount: total,
      currentLabel: 'Error al descargar datos offline',
      errorMessage: error?.message || 'Error de red durante la descarga.',
    });
    return false;
  }
}
