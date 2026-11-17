#!/usr/bin/env node
// Busca textos en español que se colaron en los otros idiomas (T3 del plan de cambios del 16-nov-2026).
//
// Revisa dos fuentes:
//   1. Las traducciones del repositorio: traducciones/<idioma>/pieza_*.json (incluye los textos de pago).
//   2. Los datos publicados de la app: sites.json y, por sitio, su manifiesto (rutas, «Antes de ir»), salas y piezas.
//      Por omisión se leen de https://xolotli.com; con --dir=public se leen de una carpeta local ya sincronizada.
//
// Solo lee: no cambia nada. Escribe un informe en Markdown (por omisión revision-idiomas.md) y termina con código 1
// si encontró algo, para que se pueda usar en GitHub Actions.
//
// Uso:  node scripts/revisar-idiomas.mjs [--dir=public] [--base=https://xolotli.com] [--salida=revision-idiomas.md]

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

export const IDIOMAS = ['en', 'fr', 'pl', 'de', 'pt', 'it'];

// Palabras que delatan español y que no existen (o casi no se usan) en el idioma de destino.
const ESPANOL = ['el', 'los', 'las', 'del', 'y', 'está', 'están', 'también', 'puedes', 'muy', 'pero', 'hay', 'donde', 'cuando', 'años', 'siglo', 'aquí', 'paradas', 'parada', 'ruta', 'rutas', 'esta', 'este', 'fue', 'como', 'más', 'sus', 'gratis', 'recorrido'];
// Las que sí son normales en cada idioma (para no marcarlas)
const PROPIAS = {
  pt: ['como', 'este', 'esta', 'mais', 'parada', 'paradas'],
  it: ['del', 'come', 'este', 'più'],
  fr: ['est', 'y'],
  en: [],
  de: [],
  pl: [],
};

const palabras = (t) => String(t).toLowerCase().normalize('NFC').match(/[\p{L}]+/gu) || [];

/** Qué tan «español» se ve un texto escrito supuestamente en `lang`: devuelve las palabras sospechosas encontradas. */
export function pistasDeEspanol(texto, lang) {
  const propias = new Set(PROPIAS[lang] || []);
  const set = new Set(ESPANOL.filter((w) => !propias.has(w)));
  const ws = palabras(texto);
  const hallazgos = ws.filter((w) => set.has(w));
  return { total: ws.length, hallazgos };
}

/** ¿Parece español? Textos cortos (nombres propios) no se juzgan; en los largos basta una proporción baja de pistas. */
export function pareceEspanol(texto, lang, original = '') {
  const t = String(texto || '').trim();
  if (!t) return false;
  // Igual al original en español y lo bastante largo como para no ser un nombre propio
  if (original && t === String(original).trim() && palabras(t).length >= 4) return true;
  const { total, hallazgos } = pistasDeEspanol(t, lang);
  if (total < 6) return false;
  return hallazgos.length >= 3 && hallazgos.length / total >= 0.08;
}

/**
 * Recorre un objeto de datos y revisa cada campo con sufijo de idioma (name_en, description_fr, intro_pt…),
 * comparándolo con su campo sin sufijo (el español). Devuelve [{ donde, campo, lang, texto }].
 */
export function revisarObjeto(obj, donde, salida = []) {
  if (Array.isArray(obj)) {
    obj.forEach((x, i) => revisarObjeto(x, `${donde}[${x && typeof x === 'object' && (x.id || x.piece_id || x.room_id) ? x.id || x.piece_id || x.room_id : i}]`, salida));
    return salida;
  }
  if (!obj || typeof obj !== 'object') return salida;
  // Campos traducibles (los que ya tienen al menos una versión _xx) a los que les falta algún idioma: la app muestra el español
  const base = new Set(Object.keys(obj).map((k) => k.match(/^(.*)_([a-z]{2})$/)).filter((m) => m && IDIOMAS.includes(m[2])).map((m) => m[1]));
  for (const b of base) {
    if (typeof obj[b] !== 'string' || palabras(obj[b]).length < 2) continue;
    for (const l of IDIOMAS) if (!String(obj[`${b}_${l}`] || '').trim()) salida.push({ donde, campo: `${b}_${l}`, lang: l, texto: `(falta; se muestra en español: «${obj[b]}»)` });
  }
  for (const [k, v] of Object.entries(obj)) {
    const m = k.match(/^(.*)_([a-z]{2})$/);
    if (m && IDIOMAS.includes(m[2]) && typeof v === 'string') {
      if (pareceEspanol(v, m[2], obj[m[1]])) salida.push({ donde, campo: k, lang: m[2], texto: v });
    } else if (v && typeof v === 'object') {
      revisarObjeto(v, `${donde}.${k}`, salida);
    }
  }
  return salida;
}

/** Revisa traducciones/<idioma>/*.json del repositorio. */
export function revisarTraducciones(dirTraducciones, salida = []) {
  for (const lang of IDIOMAS) {
    const dir = path.join(dirTraducciones, lang);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
      let d;
      try { d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')); } catch { salida.push({ donde: `traducciones/${lang}/${f}`, campo: '(archivo)', lang, texto: 'No se pudo leer el JSON' }); continue; }
      const campos = d.campos && typeof d.campos === 'object' ? d.campos : {};
      for (const [campo, c] of Object.entries(campos)) {
        const texto = c && typeof c === 'object' ? c.texto : c;
        if (typeof texto === 'string' && pareceEspanol(texto, lang)) salida.push({ donde: `traducciones/${lang}/${f}`, campo, lang, texto });
      }
    }
  }
  return salida;
}

async function leerJson(fuente, rel) {
  if (fuente.dir) {
    const p = path.join(fuente.dir, rel);
    return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : null;
  }
  let r;
  try { r = await fetch(`${fuente.base.replace(/\/$/, '')}/${rel}`, { cache: 'no-store' }); } catch { return null; }
  if (!r.ok) return null;
  try { return await r.json(); } catch { return null; }
}

/** Revisa los datos publicados (sites.json y cada sitio activo). */
export async function revisarPublicado(fuente, salida = []) {
  const sites = await leerJson(fuente, 'data/sites.json');
  if (!Array.isArray(sites)) { salida.push({ donde: 'data/sites.json', campo: '(archivo)', lang: '-', texto: 'No se pudo leer' }); return salida; }
  revisarObjeto(sites, 'sites.json', salida);
  for (const s of sites.filter((x) => x.path && x.status !== 'coming_soon')) {
    const manifiesto = await leerJson(fuente, s.path);
    if (manifiesto) {
      // Las piezas que vienen dentro de las rutas se revisan en pieces.json; aquí basta lo del manifiesto
      revisarObjeto({ ...manifiesto, routes: (manifiesto.routes || []).map(({ stops, ...r }) => r) }, s.path, salida);
      for (const rel of [manifiesto.rooms_path, manifiesto.pieces_path].filter(Boolean)) {
        const datos = await leerJson(fuente, rel);
        if (datos) revisarObjeto(datos, rel, salida);
      }
    }
  }
  return salida;
}

export function informe(hallazgos) {
  const lineas = ['# Revisión de idiomas', '', `Fecha: ${new Date().toISOString().slice(0, 10)}`, ''];
  if (!hallazgos.length) return [...lineas, 'No encontré textos en español dentro de otros idiomas.', ''].join('\n');
  lineas.push(`Encontré ${hallazgos.length} textos que parecen estar en español dentro de otro idioma.`, '');
  lineas.push('| Idioma | Dónde | Campo | Texto |', '| --- | --- | --- | --- |');
  const celda = (t) => String(t).replace(/\|/g, '\\|').replace(/\s+/g, ' ').slice(0, 140);
  for (const h of [...hallazgos].sort((a, b) => a.lang.localeCompare(b.lang) || a.donde.localeCompare(b.donde))) {
    lineas.push(`| ${h.lang} | ${celda(h.donde)} | ${celda(h.campo)} | ${celda(h.texto)} |`);
  }
  return [...lineas, ''].join('\n');
}

async function main() {
  const arg = (n, d) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || '').split('=').slice(1).join('=') || d;
  const fuente = arg('dir') ? { dir: arg('dir') } : { base: arg('base', 'https://xolotli.com') };
  const salidaArchivo = arg('salida', 'revision-idiomas.md');
  const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
  const hallazgos = [];
  revisarTraducciones(path.join(raiz, 'traducciones'), hallazgos);
  await revisarPublicado(fuente, hallazgos);
  fs.writeFileSync(salidaArchivo, informe(hallazgos));
  console.log(`${hallazgos.length ? '⚠️' : '✅'} ${hallazgos.length} textos sospechosos. Informe: ${salidaArchivo}`);
  process.exitCode = hallazgos.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
