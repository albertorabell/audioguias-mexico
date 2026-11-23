// Iluminar el texto mientras suena el audio, SIN marcas de tiempo del audio: se reparte la duración entre las frases
// según su longitud (más una pausa pequeña por frase). Es una estimación: puede ir desfasada unos segundos.

/** Peso extra (en «caracteres») que se le da a la pausa de cada frase y de cada salto de párrafo. */
const PAUSA_FRASE = 14;
const PAUSA_PARRAFO = 18;

/**
 * Parte un texto en frases, conservando TODO el texto (al juntarlas se obtiene el original). Un enlace «[texto](id)»
 * nunca se parte. Devuelve [{ texto, peso }].
 */
export function dividirFrases(texto) {
  const origen = String(texto || '');
  if (!origen.trim()) return [];
  // Trozos que terminan en . ! ? … (con comillas o paréntesis de cierre) más el espacio, o en salto de línea
  const trozos = origen.match(/[^.!?…\n]+(?:[.!?…]+["”»')\]]*\s*|\n+|$)|\n+/g) || [origen];
  const frases = [];
  let acumulado = '';
  for (const t of trozos) {
    acumulado += t;
    const abiertos = (acumulado.match(/\[/g) || []).length - (acumulado.match(/\]/g) || []).length;
    if (abiertos > 0) continue; // dentro de un enlace: se sigue juntando
    frases.push(acumulado);
    acumulado = '';
  }
  if (acumulado) frases.push(acumulado);
  return frases
    .filter((f) => f.length > 0)
    .map((f) => ({ texto: f, peso: Math.max(1, f.trim().length) + PAUSA_FRASE + (/\n\s*$/.test(f) ? PAUSA_PARRAFO : 0) }));
}

/** Índice de la frase que corresponde a este avance (0 a 1), o -1 si todavía no empieza. */
export function fraseActiva(frases, avance) {
  if (!frases.length || !(avance > 0)) return -1;
  const total = frases.reduce((n, f) => n + f.peso, 0);
  const objetivo = Math.min(1, avance) * total;
  let suma = 0;
  for (let i = 0; i < frases.length; i++) {
    suma += frases[i].peso;
    if (objetivo < suma) return i;
  }
  return frases.length - 1;
}
