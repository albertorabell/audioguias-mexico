// Descarga las fotos de un sitio desde Wikimedia Commons, según las columnas foto_url / image_filename
// de la pestaña PIEZAS del Google Sheet. Revisa la licencia en Commons ANTES de bajar nada.
// Uso: node scripts/descargar-fotos.mjs --sitio centro_historico [--plan] [--forzar]
// Solo se aceptan: dominio público, CC0, CC BY y CC BY-SA (nunca NC ni ND).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { cargarSitios } from './sitios-lib.mjs';
import { leerPestana } from './google-sheets-lib.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = path.join(RAIZ, 'public', 'images', 'pieces');
const UA = 'AudioguiasMexico/1.0 (https://github.com/albertorabell/audioguias-mexico; albertorabell@gmail.com)';
const ANCHO_MAX = 1280;

/** Título "File:..." a partir de la URL de la página del archivo en Commons. */
export function tituloDeUrl(url) {
  const m = String(url || '').trim().match(/commons\.wikimedia\.org\/wiki\/(File:[^?#]+)/i);
  if (!m) return null;
  try { return decodeURIComponent(m[1]).replace(/_/g, ' '); } catch { return null; }
}

/** true si la licencia (nombre corto de Commons) es una de las permitidas. */
export function licenciaPermitida(nombre) {
  const s = String(nombre || '').trim();
  if (!s) return false;
  if (/\b(NC|ND)\b/i.test(s)) return false;
  return /^(CC0|Public domain|PD\b|CC BY(-SA)?\b)/i.test(s) || /^(Dominio p)/i.test(s);
}

async function pedir(url, opciones = {}) {
  let ultimo;
  for (let i = 1; i <= 5; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60000), ...opciones });
      if (r.status === 429 || r.status >= 500) throw new Error(`HTTP ${r.status}`);
      return r;
    } catch (e) {
      ultimo = e;
      await new Promise((ok) => setTimeout(ok, 2000 * i));
    }
  }
  throw ultimo;
}

async function infoCommons(titulo) {
  const u = new URL('https://commons.wikimedia.org/w/api.php');
  u.search = new URLSearchParams({
    action: 'query', format: 'json', titles: titulo, prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata', iiurlwidth: String(ANCHO_MAX), redirects: '1',
  }).toString();
  const r = await pedir(u);
  const j = await r.json();
  const pagina = Object.values(j?.query?.pages || {})[0];
  const ii = pagina?.imageinfo?.[0];
  if (!ii) return null;
  const meta = ii.extmetadata || {};
  const limpio = (x) => String(x?.value || '').replace(/<[^>]+>/g, '').trim();
  return {
    url: ii.url, miniatura: ii.thumburl || ii.url, ancho: ii.width, alto: ii.height, mime: ii.mime,
    licencia: limpio(meta.LicenseShortName), autor: limpio(meta.Artist),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const i = args.indexOf('--sitio');
  const sitioId = i >= 0 ? args[i + 1] : '';
  const plan = args.includes('--plan');
  const forzar = args.includes('--forzar');
  if (!sitioId) throw new Error('Falta --sitio <id> (el de la hoja CONTROL).');
  const sitio = (await cargarSitios({ estricto: true })).find((s) => s.site_id === sitioId);
  if (!sitio?.sheet_id) throw new Error(`El sitio "${sitioId}" no existe en CONTROL o no tiene hoja.`);
  const filas = await leerPestana(sitio.sheet_id, 'PIEZAS');
  const [cab, ...datos] = filas;
  const col = (n) => cab.indexOf(n);
  const c = { id: col('piece_id'), img: col('image_filename'), url: col('foto_url'), lic: col('foto_licencia'), aut: col('foto_autor') };
  if (Object.values(c).some((x) => x < 0)) throw new Error('Faltan columnas en PIEZAS (piece_id, image_filename, foto_url, foto_licencia, foto_autor).');

  fs.mkdirSync(DESTINO, { recursive: true });
  const sharp = plan ? null : (await import('sharp')).default;
  let ok = 0, saltadas = 0, mal = 0, sinFoto = 0;
  for (const f of datos) {
    const id = (f[c.id] || '').trim();
    if (!id) continue;
    const img = (f[c.img] || '').trim();
    const titulo = tituloDeUrl(f[c.url]);
    if (!img && !f[c.url]) { sinFoto++; console.log(`::notice::${id}: sin foto asignada`); continue; }
    if (!img || !titulo) { mal++; console.log(`::warning::${id}: foto_url no es una página de archivo de Commons (${f[c.url] || 'vacía'})`); continue; }
    const destino = path.join(DESTINO, path.basename(img));
    if (fs.existsSync(destino) && !forzar) { saltadas++; continue; }
    try {
      const info = await infoCommons(titulo);
      if (!info) { mal++; console.log(`::warning::${id}: Commons no encontró ${titulo}`); continue; }
      if (!licenciaPermitida(info.licencia)) { mal++; console.log(`::error::${id}: licencia NO permitida en Commons: "${info.licencia}" (${titulo}). No se descarga.`); continue; }
      if (!/^image\/(jpeg|png|webp|tiff)/.test(info.mime || '')) { mal++; console.log(`::warning::${id}: tipo de archivo raro (${info.mime})`); continue; }
      if (info.ancho < 800) console.log(`::warning::${id}: la foto es chica (${info.ancho}x${info.alto})`);
      const hoja = String(f[c.lic] || '').trim();
      if (hoja && hoja.replace(/\s+/g, '').toLowerCase() !== info.licencia.replace(/\s+/g, '').toLowerCase()) {
        console.log(`::warning::${id}: la hoja dice licencia "${hoja}" pero Commons dice "${info.licencia}". Corrige la hoja.`);
      }
      if (plan) { ok++; console.log(`${id}: OK ${info.licencia} ${info.ancho}x${info.alto} ← ${titulo}`); continue; }
      const r = await pedir(info.miniatura);
      if (!r.ok) { mal++; console.log(`::warning::${id}: no se pudo bajar (HTTP ${r.status})`); continue; }
      const buf = Buffer.from(await r.arrayBuffer());
      await sharp(buf).rotate().resize({ width: ANCHO_MAX, height: 2300, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(destino);
      ok++;
      console.log(`${id}: guardada ${path.basename(destino)} (${info.licencia})`);
      await new Promise((r2) => setTimeout(r2, 400));
    } catch (e) {
      mal++; console.log(`::warning::${id}: error ${e.message}`);
    }
  }
  console.log(`::notice::Fotos de ${sitioId}: ${ok} ${plan ? 'revisadas' : 'descargadas'}, ${saltadas} ya existían, ${sinFoto} sin foto, ${mal} con problema.`);
  if (mal) process.exitCode = 0; // los problemas se leen en las anotaciones; no frenan el resto
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((e) => { console.error(`::error::${e.message}`); process.exit(1); });
}
