/**
 * Dirección del servidor de pagos (carpeta pagos/, un Cloudflare Worker).
 * Si está vacía, los pagos están APAGADOS: la app funciona como hasta ahora y el pase se puede probar en modo demo.
 * Se llena con la variable de GitHub VITE_PAYMENTS_API_URL al compilar (ver docs/IDIOMA_MP3_COBRO.md).
 */
export const PAYMENTS_API_URL: string = String(import.meta.env.VITE_PAYMENTS_API_URL || '').replace(/\/+$/, '');

export const PAYMENTS_ENABLED: boolean = PAYMENTS_API_URL.length > 0;
