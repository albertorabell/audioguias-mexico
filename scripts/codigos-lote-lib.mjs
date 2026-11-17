// Lotes de códigos de un solo uso (Viator, agencias, hoteles). Cada código sirve para UN visitante y vence en la fecha que se diga.
// Se pegan en la pestaña CODIGOS de CONTROL (columnas: codigo, sitio, horas, usos, vence, activo, nota) y se publican con «Publicar códigos de acceso».

import { randomInt } from 'node:crypto';

const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sin 0, O, 1, I, L: no se confunden al dictarlos

/** Un código al azar de `largo` caracteres. */
export function codigoAzar(largo = 8) {
  let out = '';
  for (let i = 0; i < largo; i++) out += ALFABETO[randomInt(ALFABETO.length)];
  return out;
}

/**
 * Genera `cantidad` códigos distintos con el prefijo dado (letras y números, hasta 8). Cada uno: ${prefijo}${8 al azar}, mostrado como PREFIJO-XXXX-XXXX.
 * Devuelve filas listas para pegar en CODIGOS: [codigo, sitio, horas, usos, vence, activo, nota].
 */
export function generarLote({ prefijo, cantidad, sitio = 'todos', dias = 30, usos = 1, vence = '', nota = '' }, azar = codigoAzar) {
  const pref = String(prefijo || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!pref || pref.length > 8) throw new Error('El prefijo debe tener de 1 a 8 letras o números (ejemplo: VIATOR).');
  const n = Math.floor(Number(cantidad));
  if (!(n >= 1 && n <= 500)) throw new Error('La cantidad debe ser de 1 a 500 códigos por lote.');
  const d = Math.floor(Number(dias));
  if (!(d >= 1 && d <= 400)) throw new Error('Los días del pase deben ser de 1 a 400.');
  if (vence && !/^\d{4}-\d{2}-\d{2}$/.test(vence)) throw new Error('La fecha de vencimiento va como AAAA-MM-DD (ejemplo: 2027-12-31).');
  const vistos = new Set();
  const filas = [];
  while (filas.length < n) {
    const sufijo = azar(8);
    const codigo = `${pref}-${sufijo.slice(0, 4)}-${sufijo.slice(4)}`;
    if (vistos.has(codigo)) continue;
    vistos.add(codigo);
    filas.push([codigo, sitio, String(d * 24), String(Math.max(1, Math.floor(Number(usos)))), vence, 'SI', nota]);
  }
  return filas;
}

/** Texto para pegar en la hoja (columnas separadas por tabulador). */
export const filasATexto = (filas) => filas.map((f) => f.join('\t')).join('\n');

/** Tabla legible del reporte de /admin/canjes. */
export function reporteATexto(r) {
  const fecha = (ms) => (ms ? new Date(ms).toISOString().slice(0, 10) : '—');
  const lineas = [`Códigos: ${r.total} · usados: ${r.used} · canjes: ${r.redemptions}`, '', 'codigo\tsitio\tusos\tmáximo\tvence'];
  for (const c of r.codes || []) lineas.push(`${c.code}\t${c.site}\t${c.uses}\t${c.maxUses || '∞'}\t${fecha(c.expiresAt)}`);
  return lineas.join('\n');
}
