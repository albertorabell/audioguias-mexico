/**
 * «Continuar donde te quedaste»: guarda en el teléfono (solo ahí) en qué parada y recorrido iba la persona y en qué segundo
 * del audio, por si el navegador recarga la página (en iPhone pasa al abrir la cámara u otra app). Caduca a las 12 horas.
 */
const KEY = 'xolo_reanudar';
const VIGENCIA_MS = 12 * 60 * 60 * 1000;

/**
 * @typedef {{ s: string, r: string, p: string, m: 'expres' | 'inmersion', t: number, at: number }} RegistroReanudar
 * s = sitio, r = recorrido ('' si no iba en uno), p = parada, m = versión del audio, t = segundo del audio, at = cuándo
 */
/** @returns {RegistroReanudar | null} */
export function leerRegistro(ahora = Date.now()) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const r = JSON.parse(raw);
    if (!r || typeof r.p !== 'string' || typeof r.at !== 'number' || ahora - r.at > VIGENCIA_MS) return null;
    return r;
  } catch {
    return null;
  }
}

function escribir(r) {
  try {
    localStorage.setItem(KEY, JSON.stringify(r));
  } catch {
    // sin almacenamiento: no pasa nada
  }
}

/** La persona abrió esta parada. Si es otra que la guardada, se empieza el audio de cero. */
export function guardarParada(siteId, routeId, pieceId) {
  const prev = leerRegistro();
  const misma = prev && prev.p === pieceId;
  escribir({ s: siteId, r: routeId, p: pieceId, m: misma ? prev.m : 'expres', t: misma ? prev.t : 0, at: Date.now() });
}

/** Posición del audio de la parada guardada. */
export function guardarPosicion(pieceId, modo, segundos) {
  const prev = leerRegistro();
  if (!prev || prev.p !== pieceId) return;
  escribir({ ...prev, m: modo, t: Math.max(0, Math.floor(segundos)), at: Date.now() });
}

/** Segundo desde el que ofrecer continuar (0 si no hay nada que ofrecer: muy al principio o ya casi al final). */
export function posicionPara(pieceId, modo, duracion = 0) {
  const r = leerRegistro();
  if (!r || r.p !== pieceId || r.m !== modo || r.t < 8) return 0;
  if (duracion > 0 && r.t > duracion - 8) return 0;
  return r.t;
}

/** Se terminó la parada: ya no hay nada que continuar en su audio. */
export function olvidarPosicion(pieceId) {
  const prev = leerRegistro();
  if (prev && prev.p === pieceId) escribir({ ...prev, t: 0 });
}
