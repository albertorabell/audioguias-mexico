#!/usr/bin/env node
// scripts/muestras-voz.mjs
//
// Genera MUESTRAS cortas de una pieza con varias voces de Azure para elegir cuál usar.
//
//   node scripts/muestras-voz.mjs                       → solo muestra el plan (no llama a Azure, no gasta)
//   node scripts/muestras-voz.mjs --generar             → genera las muestras (necesita AZURE_SPEECH_KEY y AZURE_SPEECH_REGION)
//   node scripts/muestras-voz.mjs --proveedor prueba --generar   → ensayo sin red (MP3 en silencio)
//
// Opciones:
//   --lang es|en         idioma (por defecto es)
//   --pieza ID           pieza que se lee (por defecto mna_s06_piedra_sol)
//   --modo corto|largo   qué guion (por defecto corto)
//   --voces A,B          nombres exactos de voces (por defecto: las primeras de Azure para ese idioma, alternando mujer y hombre)
//   --max-voces N        cuántas voces probar (por defecto 6)
//   --max-caracteres N   cuántos caracteres se leen como máximo, cortando al final de una frase (por defecto 1200)
//   --pronunciar PALABRA --variantes "alias:meshicas,ipa:meˈʃikas"
//                        prueba cómo suena una palabra: genera una frase corta con la palabra tal cual y con cada variante,
//                        para elegir de oído la que suena bien (después se anota en glosario/pronunciacion.csv)
//
// Las muestras normales ya usan la lista de pronunciaciones (glosario/pronunciacion.csv).
//
// Las muestras quedan en muestras-voz/<idioma>/<voz>.mp3 con un índice. No se publican ni se guardan en el repositorio.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { fixVoiceName, splitText, silentMp3, REFERENCE_PRICE_USD_PER_MILLION_CHARS } from './audio-lib.mjs';
import { loadPronunciations, toSsmlInner, pronunciationElement, xmlEscape, KINDS, PRONUNCIATION_FILE } from './pronunciacion-lib.mjs';

const LOCALES = { es: 'es-MX', en: 'en-US' };
const FORMAT = 'audio-24khz-48kbitrate-mono-mp3'; // el mismo que usan los audios reales

/**
 * Variantes automáticas para una palabra con "x" (la letra que más confunde a las voces): x como "sh", x como "s"
 * y una transcripción fonética aproximada (sin acento marcado). Es solo para probar de oído; la buena se anota después en el CSV.
 */
export function defaultVariants(word) {
  const w = word.toLowerCase();
  if (!/x/.test(w)) throw new Error('Con --pronunciar hay que dar --variantes, por ejemplo "alias:meshicas,ipa:meˈʃikas" (solo sé inventar variantes para palabras con x)');
  const ipa = w
    .replace(/x/g, 'ʃ').replace(/ch/g, 'tʃ').replace(/qu/g, 'k').replace(/c(?=[ei])/g, 's').replace(/c/g, 'k')
    .replace(/ll/g, 'ʝ').replace(/ñ/g, 'ɲ').replace(/h/g, '').replace(/j/g, 'x').replace(/g(?=[ei])/g, 'x')
    .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u');
  return [
    { kind: 'alias', value: w.replace(/x/g, 'sh') },
    { kind: 'alias', value: w.replace(/x/g, 's') },
    { kind: 'ipa', value: ipa },
  ];
}

export function parseArgs(argv) {
  const out = { lang: 'es', pieza: 'mna_s06_piedra_sol', modo: 'corto', voces: null, maxVoces: 6, maxCaracteres: 1200, generar: false, proveedor: 'azure', pronunciar: null, variantes: [], listar: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) throw new Error(`Falta el valor de ${a}`);
      return argv[++i];
    };
    if (a === '--lang') out.lang = next();
    else if (a === '--pieza') out.pieza = next();
    else if (a === '--modo') out.modo = next();
    else if (a === '--voces') out.voces = next().split(',').map((s) => fixVoiceName(s)).filter(Boolean);
    else if (a === '--max-voces') out.maxVoces = parseInt(next(), 10);
    else if (a === '--max-caracteres') out.maxCaracteres = parseInt(next(), 10);
    else if (a === '--proveedor') out.proveedor = next();
    else if (a === '--pronunciar') out.pronunciar = next().trim();
    else if (a === '--variantes') out.variantes = next().split(',').map((v) => v.trim()).filter(Boolean);
    else if (a === '--generar') out.generar = true;
    else if (a === '--listar') out.listar = true;
    else throw new Error(`Opción desconocida: ${a}`);
  }
  if (!LOCALES[out.lang]) throw new Error(`Idioma no válido: ${out.lang}. Usa: ${Object.keys(LOCALES).join(', ')}`);
  if (!['corto', 'largo'].includes(out.modo)) throw new Error('--modo debe ser corto o largo');
  if (!['azure', 'prueba'].includes(out.proveedor)) throw new Error('--proveedor debe ser azure o prueba');
  if (!Number.isFinite(out.maxVoces) || out.maxVoces < 1 || out.maxVoces > 12) throw new Error('--max-voces debe ser un número entre 1 y 12');
  if (!Number.isFinite(out.maxCaracteres) || out.maxCaracteres < 200 || out.maxCaracteres > 3000) throw new Error('--max-caracteres debe estar entre 200 y 3000');
  if (out.pronunciar) {
    if (!out.variantes.length) out.variantes = defaultVariants(out.pronunciar).map((v) => `${v.kind}:${v.value}`);
    out.variantes = out.variantes.map((v) => {
      const i = v.indexOf(':');
      const kind = v.slice(0, i);
      const value = v.slice(i + 1).trim();
      if (i < 0 || !KINDS.includes(kind) || !value) throw new Error(`Variante no válida: "${v}". Usa alias:texto, ipa:símbolos, lang:en-US=texto o voz:NombreDeVoz=texto`);
      return { kind, value };
    });
  }
  return out;
}

/** Escoge hasta n voces neuronales del idioma, alternando mujer y hombre. */
export function pickVoices(list, locale, n) {
  const ok = list.filter((v) => v.Locale === locale && /Neural$/i.test(v.ShortName || '') && (!v.Status || v.Status === 'GA'));
  const women = ok.filter((v) => /female/i.test(v.Gender));
  const men = ok.filter((v) => /^male/i.test(v.Gender));
  const out = [];
  for (let i = 0; out.length < n && (i < women.length || i < men.length); i++) {
    if (women[i] && out.length < n) out.push(women[i]);
    if (men[i] && out.length < n) out.push(men[i]);
  }
  return out;
}

/** Texto con todas las voces de un idioma (nombre, género, si es multilingüe o HD). Sirve para elegir a ojo sin escuchar todo. */
export function describeVoices(list, locale) {
  const all = list.filter((v) => v.Locale === locale).sort((a, b) => a.ShortName.localeCompare(b.ShortName));
  const rows = all.map((v) => {
    const multi = /Multilingual/i.test(v.ShortName) || (Array.isArray(v.SecondaryLocaleList) && v.SecondaryLocaleList.length > 0);
    const hd = /HD/i.test(v.ShortName);
    const tags = [multi ? 'MULTILINGÜE' : '', hd ? 'HD (otro precio)' : '', v.Status && v.Status !== 'GA' ? v.Status : ''].filter(Boolean).join(' · ');
    return `  ${v.ShortName} · ${v.Gender || '?'}${tags ? ` · ${tags}` : ''}`;
  });
  return { total: all.length, multi: all.filter((v) => /Multilingual/i.test(v.ShortName) || v.SecondaryLocaleList?.length).length, text: rows.join('\n') };
}

export async function main(argv, { root = process.cwd(), env = process.env, fetchImpl = fetch, log = console.log, warn = console.warn } = {}) {
  const args = parseArgs(argv);
  const locale = LOCALES[args.lang];
  if (args.listar) {
    const region = env.AZURE_SPEECH_REGION;
    if (!env.AZURE_SPEECH_KEY || !region) throw new Error('Faltan las claves de Azure (secretos AZURE_SPEECH_KEY y AZURE_SPEECH_REGION).');
    const res = await fetchImpl(`https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`, { headers: { 'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY } });
    if (!res.ok) throw new Error(`Azure no dio la lista de voces (respuesta ${res.status}). Revisa la clave y la región.`);
    const d = describeVoices(await res.json(), locale);
    log(`Voces de Azure para ${locale}: ${d.total} (${d.multi} multilingües). Copia el nombre exacto en "voces".`);
    log(d.text);
    return 0;
  }
  const key = args.modo === 'corto' ? 'guion_corto' : 'guion_largo';
  const dict = loadPronunciations(path.join(root, PRONUNCIATION_FILE), args.lang);
  let text;
  let variants; // [{ label, file, inner }] por voz
  if (args.pronunciar) {
    const w = args.pronunciar;
    // Una frase corta con la palabra dicha dos veces: sola y dentro de una oración
    // La frase va en el idioma de la prueba: una voz en inglés leyendo una frase en español confunde (no se sabe si la palabra suena bien o no)
    const phrase = (render) =>
      args.lang === 'en'
        ? `${render(w)}. People say that ${render(w)} watches over the whole valley, and the old stories about ${render(w)} are still told today.`
        : `${render(w)}. ${w === w.toLowerCase() ? 'Los ' : ''}${render(w)} fundaron una gran ciudad en medio del lago.`;
    text = phrase((x) => x);
    variants = [
      { label: 'sin_cambio', file: '0_sin_cambio', inner: () => xmlEscape(text) },
      ...args.variantes.map((v, i) => ({
        label: `${v.kind}:${v.value}`,
        file: `${i + 1}_${v.kind}_${v.value.replace(/[^\p{L}\p{N}]+/gu, '')}`,
        // la voz principal solo se sabe al sintetizar (las variantes "voz" cierran y reabren la etiqueta de voz)
        inner: (voice) => phrase((x) => pronunciationElement(v.kind, v.value, x, voice)),
      })),
    ];
  } else {
    const pieces = JSON.parse(fs.readFileSync(path.join(root, 'public/data/pieces.json'), 'utf-8'));
    const piece = pieces.find((p) => p.piece_id === args.pieza);
    if (!piece) throw new Error(`No existe la pieza ${args.pieza}`);
    const raw = args.lang === 'es' ? piece[key] : piece[`${key}_${args.lang}`];
    if (!String(raw || '').trim()) throw new Error(`La pieza ${args.pieza} no tiene ${key} en ${args.lang}. ${args.lang !== 'es' ? 'Falta traducirla.' : ''}`);
    text = splitText(String(raw).replace(/\s+/g, ' ').trim(), args.maxCaracteres)[0];
    variants = [{ label: dict.length ? 'con lista de pronunciaciones' : '', file: null, inner: (voice) => toSsmlInner(text, dict, voice) }];
  }

  const nVoces = args.voces ? args.voces.length : args.maxVoces;
  const chars = text.length * nVoces * variants.length;
  log('— Plan de muestras de voz —');
  log(args.pronunciar ? `  Prueba de pronunciación de "${args.pronunciar}" en ${args.lang} (${locale}): ${variants.length} variantes (${variants.map((v) => v.label).join(' · ')})` : `  Pieza: ${args.pieza} · ${key} en ${args.lang} (${locale}) · se leen ${text.length} caracteres${dict.length ? ` · ${dict.length} pronunciaciones aplicadas` : ''}`);
  log(`  Voces: ${args.voces ? args.voces.join(', ') : `hasta ${args.maxVoces} de Azure, alternando mujer y hombre`}`);
  const usd = (chars * REFERENCE_PRICE_USD_PER_MILLION_CHARS.azure) / 1e6;
  log(`  Caracteres en total: ${chars.toLocaleString('es-MX')} · costo de referencia ≈ US$ ${usd.toFixed(2)} (puede ser US$ 0 dentro de la cuota gratis de Azure; confirma en tu portal)`);
  if (!args.generar) {
    log('\nSolo era el plan: no se llamó a Azure ni se guardó nada. Para generar las muestras agrega --generar.');
    return 0;
  }

  // ---- Voces ----
  let voices;
  const region = env.AZURE_SPEECH_REGION;
  const azureHeaders = { 'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY };
  if (args.proveedor === 'prueba') {
    voices = (args.voces || ['prueba-A', 'prueba-B', 'prueba-C']).slice(0, nVoces).map((n) => ({ ShortName: n, Gender: 'Female' }));
  } else {
    if (!env.AZURE_SPEECH_KEY || !region) throw new Error('Faltan las claves de Azure (secretos AZURE_SPEECH_KEY y AZURE_SPEECH_REGION).');
    if (args.voces) {
      voices = args.voces.map((n) => ({ ShortName: n, Gender: '?' }));
    } else {
      const res = await fetchImpl(`https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`, { headers: azureHeaders });
      if (!res.ok) throw new Error(`Azure no dio la lista de voces (respuesta ${res.status}). Revisa la clave y la región.`);
      voices = pickVoices(await res.json(), locale, args.maxVoces);
      if (!voices.length) throw new Error(`Azure no devolvió voces neuronales para ${locale}.`);
    }
  }

  // ---- Muestras ----
  const dir = path.join(root, 'muestras-voz', args.lang);
  fs.mkdirSync(dir, { recursive: true });
  const done = []; // { v, file, label }
  const failed = [];
  let consecutive = 0;
  let stop = false;
  for (const [i, v] of voices.entries()) {
    for (const variant of variants) {
      if (stop) break;
      // Algunos nombres de voz traen ":" (por ejemplo en-US-Adam:DragonHDLatestNeural) y GitHub no deja subir archivos con ese carácter
      const file = `${v.ShortName.replace(/[^A-Za-z0-9_.-]+/g, '-')}${variant.file ? `__${variant.file}` : ''}.mp3`;
      const tag = `[${i + 1}/${voices.length}] ${v.ShortName}${variant.file ? ` (${variant.label})` : ''}`;
      try {
        let audio;
        if (args.proveedor === 'prueba') audio = silentMp3(Math.max(1, text.length / 14));
        else {
          const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${locale}"><voice name="${v.ShortName}">${variant.inner(v.ShortName)}</voice></speak>`;
          const res = await fetchImpl(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
            method: 'POST',
            headers: { ...azureHeaders, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': FORMAT, 'User-Agent': 'audioguias-mexico' },
            body: ssml,
          });
          if (!res.ok) {
            const err = new Error(`respuesta ${res.status} ${(await res.text().catch(() => '')).slice(0, 200)}`);
            err.fatal = res.status === 401 || res.status === 403;
            throw err;
          }
          audio = Buffer.from(await res.arrayBuffer());
        }
        fs.writeFileSync(path.join(dir, file), audio);
        done.push({ v, file, label: variant.label });
        consecutive = 0;
        log(`  ${tag} … ok (${Math.round(audio.length / 1024)} KB)`);
      } catch (e) {
        failed.push({ v, label: variant.label, why: e.message });
        consecutive++;
        warn(`  ${tag} … ERROR: ${e.message}`);
        if (e.fatal || consecutive >= 3) {
          warn('⛔ Me detengo: la clave no sirve o el error se repite.');
          stop = true;
        }
      }
    }
  }

  const L = [`# Muestras de voz (${args.lang}, ${locale})`, '', args.pronunciar ? `Palabra: ${args.pronunciar}` : `Pieza: ${args.pieza} · ${key}`, '', `Texto (${text.length} caracteres): ${text}`, '', '| Archivo | Voz | Género | Variante |', '| --- | --- | --- | --- |'];
  for (const d of done) L.push(`| ${d.file} | ${d.v.ShortName}${/HD/.test(d.v.ShortName) ? ' (HD: otro precio, confirmar antes de usarla)' : ''} | ${d.v.Gender || ''} | ${d.label} |`);
  if (failed.length) L.push('', 'No se pudieron generar:', ...failed.map((f) => `- ${f.v.ShortName} ${f.label}: ${f.why}`));
  fs.writeFileSync(path.join(dir, 'indice.md'), L.join('\n') + '\n', 'utf-8');
  log(`\nListo: ${done.length} muestras, ${failed.length} con error. Carpeta: muestras-voz/${args.lang}/ (con indice.md).`);
  return done.length ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((e) => {
      console.error('❌ ' + (e && e.message ? e.message : e));
      process.exit(1);
    });
}
