/**
 * Precio con su moneda a la vista: «MX$99» (pesos) o «US$7» (dólares). El signo «$» solo es ambiguo entre las dos monedas,
 * por eso se usa el mismo formato en el botón, en la ventana del pase y en la ficha del sitio.
 */
export function formatPrice(amount: number, currency: string, locale = 'es-MX'): string {
  const cur = String(currency || '').toUpperCase();
  const prefix = cur === 'MXN' ? 'MX$' : cur === 'USD' ? 'US$' : '';
  const digits = Number.isInteger(amount) ? 0 : 2;
  let number: string;
  try {
    number = new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(amount);
  } catch {
    number = String(amount);
  }
  return prefix ? `${prefix}${number}` : `${number} ${cur}`;
}
