// Publica los códigos de acceso de la hoja CODIGOS (CONTROL) en el servidor de pagos.
// Uso:  PAGOS_API_URL=... CODES_KEY=... GOOGLE_SERVICE_ACCOUNT_JSON=... node scripts/publicar-codigos.mjs
// Columnas de CODIGOS: codigo, sitio (id del sitio, o «todos»), horas (vacío = las del pase), usos (vacío = sin límite),
// vence (AAAA-MM-DD, vacío = no vence), activo (NO apaga el código), nota (solo para ti).
import { leerPestana } from './google-sheets-lib.mjs';
import { CONTROL_ID } from './sitios-lib.mjs';

/** Filas de la hoja → códigos listos para enviar. Ignora filas vacías y las que no tienen código o sitio. */
export function leerCodigos(filas) {
  if (!Array.isArray(filas) || filas.length < 2) return { codes: [], avisos: [] };
  const cab = filas[0].map((x) => String(x).trim().toLowerCase());
  const codes = [];
  const avisos = [];
  const vistos = new Set();
  filas.slice(1).forEach((fila, i) => {
    const o = Object.fromEntries(cab.map((k, j) => [k, String(fila[j] ?? '').trim()]));
    if (!o.codigo && !o.sitio) return;
    const code = o.codigo.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!/^[A-Z0-9]{4,24}$/.test(code)) { avisos.push(`Fila ${i + 2}: el código «${o.codigo}» debe tener de 4 a 24 letras o números.`); return; }
    if (!o.sitio) { avisos.push(`Fila ${i + 2}: el código ${code} no dice a qué sitio da acceso (o «todos»).`); return; }
    if (vistos.has(code)) { avisos.push(`Fila ${i + 2}: el código ${code} está repetido; se usa la primera fila.`); return; }
    vistos.add(code);
    if (o.vence && !/^\d{4}-\d{2}-\d{2}$/.test(o.vence)) avisos.push(`Fila ${i + 2}: «vence» debe escribirse AAAA-MM-DD (ejemplo 2026-12-31); se ignoró.`);
    codes.push({
      code,
      site: o.sitio.toLowerCase(),
      ...(o.horas ? { hours: Number(o.horas.replace(',', '.')) } : {}),
      ...(o.usos ? { uses: Number(o.usos) } : {}),
      ...(/^\d{4}-\d{2}-\d{2}$/.test(o.vence) ? { expires: o.vence } : {}),
      ...(/^(no|n)$/i.test(o.activo) ? { active: false } : {}),
    });
  });
  return { codes, avisos };
}

async function main() {
  const base = String(process.env.PAGOS_API_URL || '').replace(/\/+$/, '');
  const key = process.env.CODES_KEY;
  if (!base || !key) {
    console.error('Faltan PAGOS_API_URL (variable) o CODES_KEY (secreto) en GitHub.');
    process.exit(1);
  }
  const { codes, avisos } = leerCodigos(await leerPestana(CONTROL_ID, 'CODIGOS'));
  for (const a of avisos) console.warn(`::warning title=CODIGOS::${a}`);
  if (!codes.length) {
    console.log('La hoja CODIGOS no tiene códigos que publicar.');
    return;
  }
  const res = await fetch(`${base}/admin/codigos`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ codes }) });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`El servidor respondió ${res.status} (${out.error || 'sin detalle'}). ¿Está bien CODES_KEY y ya publicaste el servidor?`);
    process.exit(1);
  }
  console.log(`Códigos publicados: ${out.saved} · apagados: ${out.removed}${out.rejected?.length ? ` · rechazados (sitio que no existe o código mal escrito): ${out.rejected.join(', ')}` : ''}.`);
  if (out.rejected?.length) process.exitCode = 1;
}

import { pathToFileURL } from 'node:url';
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e && e.message ? e.message : e);
    process.exit(1);
  });
}
