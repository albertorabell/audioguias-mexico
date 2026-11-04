import { useEffect } from 'react';

/**
 * Mantiene la pantalla encendida mientras `active` sea verdadero (por ejemplo, con el mapa abierto bajo el sol).
 * Se libera al cerrar la pantalla o al desactivarlo. Si el navegador no lo permite, no pasa nada.
 * El sistema lo suelta solo cuando la app pasa a segundo plano; aquí se vuelve a pedir al regresar.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        const s = await navigator.wakeLock.request('screen');
        if (cancelled) {
          void s.release().catch(() => {});
          return;
        }
        sentinel = s;
        s.addEventListener('release', () => {
          if (sentinel === s) sentinel = null;
        });
      } catch {
        // Sin permiso o con batería baja: la pantalla se apaga como siempre.
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !sentinel) void request();
    };

    void request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void sentinel?.release().catch(() => {});
      sentinel = null;
    };
  }, [active]);
}
