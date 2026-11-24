// Uso: node scripts/indexnow.mjs [--dry] [--todas]
//  Lee dist/sitemap.xml, compara el HTML de cada página con .indexnow/huellas.json (la publicación anterior; el flujo de GitHub
//  lo guarda en la caché) y envía a IndexNow solo las nuevas o cambiadas. --todas las envía todas. --dry no envía nada.
import fs from 'node:fs';
import path from 'node:path';
import { urlsDelSitemap, archivoDeUrl, huella, cambiadas, lotes, ENDPOINT } from './indexnow-lib.mjs';

const DIST = 'dist';
const HUELLAS = '.indexnow/huellas.json';
const dry = process.argv.includes('--dry');
const todas = process.argv.includes('--todas');

const claveArchivo = fs.readdirSync('public').find((f) => /^[a-f0-9]{32}\.txt$/.test(f));
if (!claveArchivo) throw new Error('No hay archivo de clave IndexNow (public/<32 hex>.txt)');
const key = claveArchivo.replace('.txt', '');

const urls = urlsDelSitemap(fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8'));
const nuevas = {};
for (const u of urls) {
  const f = path.join(DIST, archivoDeUrl(u));
  if (fs.existsSync(f)) nuevas[u] = huella(fs.readFileSync(f, 'utf8'));
}
let anteriores = {};
try { anteriores = JSON.parse(fs.readFileSync(HUELLAS, 'utf8')); } catch { /* primera vez */ }
const aEnviar = todas ? Object.keys(nuevas) : cambiadas(nuevas, anteriores);
console.log(`IndexNow: ${urls.length} URLs en el sitemap, ${aEnviar.length} nuevas o cambiadas${dry ? ' (dry-run, no se envía)' : ''}.`);

let ok = true;
if (!dry) {
  for (const cuerpo of lotes(aEnviar, { key })) {
    const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(cuerpo) });
    console.log(`IndexNow: ${cuerpo.urlList.length} URLs → HTTP ${r.status}`);
    if (r.status !== 200 && r.status !== 202) { ok = false; console.log(await r.text().catch(() => '')); }
  }
}
// Las huellas solo se guardan si el envío salió bien; si no, la próxima vez se reintentan.
if (ok && !dry) {
  fs.mkdirSync(path.dirname(HUELLAS), { recursive: true });
  fs.writeFileSync(HUELLAS, JSON.stringify(nuevas));
}
if (!ok) process.exitCode = 1;
