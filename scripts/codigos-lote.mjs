// Genera un lote de códigos de acceso de un solo uso y lo deja en codigos-lote.tsv (pégalo en la pestaña CODIGOS).
// Ejemplo: node scripts/codigos-lote.mjs --prefijo VIATOR --cantidad 50 --sitio todos --dias 30 --vence 2027-12-31 --nota "Viator, lote 1"
import { writeFileSync } from 'node:fs';
import { filasATexto, generarLote } from './codigos-lote-lib.mjs';

const arg = (n, d = '') => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d;
};
try {
  const filas = generarLote({ prefijo: arg('prefijo'), cantidad: arg('cantidad', '10'), sitio: arg('sitio', 'todos'), dias: arg('dias', '30'), usos: arg('usos', '1'), vence: arg('vence'), nota: arg('nota') });
  writeFileSync('codigos-lote.tsv', filasATexto(filas) + '\n');
  console.log(`✅ ${filas.length} códigos en codigos-lote.tsv. Pégalos en CODIGOS (columnas codigo, sitio, horas, usos, vence, activo, nota) y corre «Publicar códigos de acceso».`);
} catch (e) {
  console.error('❌', e.message);
  process.exit(1);
}
