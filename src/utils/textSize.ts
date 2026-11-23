import { useEffect, useState } from 'react';

/**
 * Tamaño del texto de la app (independiente del tamaño de letra del teléfono; se suma a él en Android).
 * Se guarda en el teléfono y se aplica al tamaño base de la página (html), así todo lo que está en rem crece junto.
 */
export const TEXT_STEPS = [100, 115, 130, 150] as const;
const KEY = 'xolo_text_scale';
const EVENT = 'xolo-text-scale';

export function getTextScale(): number {
  try {
    const n = Number(localStorage.getItem(KEY));
    return (TEXT_STEPS as readonly number[]).includes(n) ? n : 100;
  } catch {
    return 100;
  }
}

export function applyTextScale(pct: number = getTextScale()): void {
  if (typeof document === 'undefined') return;
  document.documentElement.style.fontSize = pct === 100 ? '' : `${pct}%`;
}

export function setTextScale(pct: number): void {
  const valor = (TEXT_STEPS as readonly number[]).includes(pct) ? pct : 100;
  try {
    localStorage.setItem(KEY, String(valor));
  } catch {
    // sin almacenamiento: el cambio vale mientras la página siga abierta
  }
  applyTextScale(valor);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: valor }));
}

/** Siguiente nivel (o el anterior); no pasa de los extremos. */
export function stepTextScale(actual: number, dir: 1 | -1): number {
  const i = (TEXT_STEPS as readonly number[]).indexOf(actual);
  const j = Math.min(TEXT_STEPS.length - 1, Math.max(0, (i < 0 ? 0 : i) + dir));
  return TEXT_STEPS[j];
}

export function useTextScale(): number {
  const [pct, setPct] = useState(getTextScale);
  useEffect(() => {
    const on = (e: Event) => setPct((e as CustomEvent<number>).detail);
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return pct;
}
