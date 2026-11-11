import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { medir } from '../presupuesto.mjs';

function dist(archivos) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'presupuesto-'));
  for (const [ruta, contenido] of Object.entries(archivos)) {
    fs.mkdirSync(path.dirname(path.join(d, ruta)), { recursive: true });
    fs.writeFileSync(path.join(d, ruta), contenido);
  }
  return d;
}
const aleatorio = (n) => Buffer.from(Array.from({ length: n }, () => Math.floor(Math.random() * 256))); // no comprime
const TOPES = { js_principal_gzip_kb: 10, js_mapa_gzip_kb: 10, css_gzip_kb: 5, cualquier_js_gzip_kb: 12, archivo_de_datos_kb: 20, foto_kb: 30, guardado_sin_internet_mb: 1 };

test('presupuesto: una app liviana pasa', () => {
  const d = dist({ 'assets/index-a.js': 'x'.repeat(2000), 'assets/LiveMap-b.js': 'y'.repeat(2000), 'assets/index-a.css': 'a{}', 'data/pieces.json': '[]', 'images/f.webp': aleatorio(1000) });
  assert.deepEqual(medir(d, TOPES).fallos, []);
});

test('presupuesto: un JavaScript, un dato o una foto pesados fallan y dicen cuál', () => {
  const d = dist({ 'assets/index-a.js': aleatorio(40 * 1024), 'data/mna/pieces.json': aleatorio(25 * 1024), 'images/enorme.webp': aleatorio(40 * 1024) });
  const f = medir(d, TOPES).fallos.join('\n');
  assert.match(f, /JavaScript principal/);
  assert.match(f, /data\/mna\/pieces\.json/);
  assert.match(f, /images\/enorme\.webp/);
});

test('presupuesto: el JavaScript del mapa se mide aparte del principal', () => {
  const d = dist({ 'assets/index-a.js': 'x'.repeat(100), 'assets/LiveMap-b.js': aleatorio(40 * 1024) });
  const f = medir(d, TOPES).fallos.join('\n');
  assert.match(f, /del mapa/);
  assert.doesNotMatch(f, /JavaScript principal/);
});

test('presupuesto: las copias de la raíz (data/pieces.json) no cuentan para lo guardado sin internet', () => {
  const d = dist({ 'data/pieces.json': aleatorio(1.5 * 1024 * 1024), 'index.html': '<html></html>' });
  assert.ok(!medir(d, { ...TOPES, archivo_de_datos_kb: 99999 }).fallos.some((x) => /sin internet/.test(x)));
});
