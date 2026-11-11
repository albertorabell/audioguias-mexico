// Presupuesto de rendimiento: revisa el peso de lo que se publica (dist/) contra los topes de presupuesto.json.
// Uso: node scripts/presupuesto.mjs [carpeta-dist]   (por defecto: dist). Sale con error si algo se pasa del tope.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const KB = 1024;
const AQUI = path.dirname(fileURLToPath(import.meta.url));

function archivos(dir, base = dir) {
  const salida = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) salida.push(...archivos(p, base));
    else salida.push({ ruta: path.relative(base, p).split(path.sep).join('/'), bytes: fs.statSync(p).size, abs: p });
  }
  return salida;
}

const gzipKb = (abs) => zlib.gzipSync(fs.readFileSync(abs)).length / KB;

/** Devuelve { filas, fallos }: cada fila es [descripción, valor, tope, unidad]. */
export function medir(dist, topes) {
  const todos = archivos(dist);
  const filas = [];
  const fallos = [];
  const revisar = (nombre, valor, tope, unidad) => {
    if (tope == null) return;
    filas.push([nombre, Number(valor.toFixed(1)), tope, unidad]);
    if (valor > tope) fallos.push(`${nombre}: ${valor.toFixed(1)} ${unidad} (tope ${tope} ${unidad})`);
  };

  const js = todos.filter((f) => /^assets\/.*\.js$/.test(f.ruta)).map((f) => ({ ...f, gz: gzipKb(f.abs) }));
  const css = todos.filter((f) => /^assets\/.*\.css$/.test(f.ruta)).map((f) => ({ ...f, gz: gzipKb(f.abs) }));
  const mapa = js.filter((f) => /LiveMap|maplibre/i.test(f.ruta));
  const principal = js.filter((f) => !mapa.includes(f));
  const mayor = (lista) => lista.reduce((m, f) => Math.max(m, f.gz), 0);

  revisar('JavaScript principal (gzip, el más grande)', mayor(principal), topes.js_principal_gzip_kb, 'KB');
  revisar('JavaScript del mapa (gzip, el más grande)', mayor(mapa), topes.js_mapa_gzip_kb, 'KB');
  revisar('Cualquier archivo JavaScript (gzip)', mayor(js), topes.cualquier_js_gzip_kb, 'KB');
  revisar('CSS (gzip, suma)', css.reduce((n, f) => n + f.gz, 0), topes.css_gzip_kb, 'KB');

  const datos = todos.filter((f) => /^data\/.*\.json$/.test(f.ruta));
  const datoMayor = datos.reduce((m, f) => (f.bytes > (m?.bytes || 0) ? f : m), null);
  if (datoMayor) revisar(`Archivo de datos más grande (${datoMayor.ruta})`, datoMayor.bytes / KB, topes.archivo_de_datos_kb, 'KB');

  const fotos = todos.filter((f) => /^images\/.*\.(webp|png|jpe?g|avif)$/i.test(f.ruta));
  const fotoMayor = fotos.reduce((m, f) => (f.bytes > (m?.bytes || 0) ? f : m), null);
  if (fotoMayor) revisar(`Foto más pesada (${fotoMayor.ruta})`, fotoMayor.bytes / KB, topes.foto_kb, 'KB');

  // Lo que el teléfono guarda al instalar la app (mismas extensiones que el service worker; ver vite.config.ts)
  const guardado = todos.filter((f) => /\.(js|css|html|ico|png|svg|json|woff2?|pmtiles|pbf)$/.test(f.ruta) && !['panel.html', 'data/pieces.json', 'data/rooms.json'].includes(f.ruta));
  revisar('Lo que se guarda para usar sin internet', guardado.reduce((n, f) => n + f.bytes, 0) / KB / KB, topes.guardado_sin_internet_mb, 'MB');

  return { filas, fallos };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dist = path.resolve(process.argv[2] || 'dist');
  const topes = JSON.parse(fs.readFileSync(path.join(AQUI, '..', 'presupuesto.json'), 'utf-8'));
  const { filas, fallos } = medir(dist, topes);
  const ancho = Math.max(...filas.map((f) => f[0].length));
  for (const [n, v, t, u] of filas) console.log(`${v > t ? '✗' : '✓'} ${n.padEnd(ancho)}  ${String(v).padStart(8)} / ${t} ${u}`);
  if (fallos.length) {
    console.error(`\nPresupuesto de rendimiento superado:\n- ${fallos.join('\n- ')}\nSi es a propósito, sube el tope en presupuesto.json (en el mismo PR).`);
    process.exit(1);
  }
  console.log('\nPresupuesto de rendimiento: todo dentro de los topes.');
}
