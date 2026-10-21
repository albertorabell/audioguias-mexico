/**
 * Dificulta que una persona común copie los textos de la app (seleccionar, copiar, clic derecho, arrastrar, imprimir).
 * Es una barrera para el público en general: no detiene a quien sepa abrir las herramientas del navegador.
 * Los campos donde se escribe (buscador, códigos) siguen funcionando normal.
 * Para desactivarlo al revisar contenido, abre la app con ?copiar al final de la dirección.
 */
export function activarAntiCopia(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (new URLSearchParams(window.location.search).has('copiar')) return;

  document.documentElement.classList.add('sin-copia');

  const esCampo = (t: EventTarget | null) => t instanceof Element && !!t.closest('input, textarea, [contenteditable="true"]');
  const bloquear = (e: Event) => {
    if (!esCampo(e.target)) e.preventDefault();
  };
  for (const tipo of ['copy', 'cut', 'contextmenu', 'dragstart', 'selectstart'] as const) {
    document.addEventListener(tipo, bloquear);
  }
}
