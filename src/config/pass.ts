/**
 * Reglas del Pase de Visitante. Estos números también los usa el servidor de pagos
 * (carpeta pagos/), así que si los cambias aquí cámbialos allá (variables PASS_DAYS y MAX_DEVICES).
 */
/** Duración del pase: 30 días, que empiezan con el primer audio de pago (los cuenta el servidor). */
export const PASS_DAYS = 30;
/** Respaldo local de la duración en horas (pases de prueba). */
export const PASS_HOURS = PASS_DAYS * 24;
export const PASS_MAX_DEVICES = 2;
