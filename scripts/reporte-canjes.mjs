// Pide al servidor de pagos cuántas veces se usó cada código de acceso. Variables: PAGOS_API_URL y CODES_KEY.
import { reporteATexto } from './codigos-lote-lib.mjs';

const base = (process.env.PAGOS_API_URL || '').replace(/\/$/, '');
if (!base || !process.env.CODES_KEY) {
  console.error('❌ Faltan PAGOS_API_URL y CODES_KEY.');
  process.exit(1);
}
const res = await fetch(`${base}/admin/canjes`, { headers: { Authorization: `Bearer ${process.env.CODES_KEY}` } });
if (!res.ok) {
  console.error(`❌ El servidor respondió ${res.status}.`);
  process.exit(1);
}
console.log(reporteATexto(await res.json()));
