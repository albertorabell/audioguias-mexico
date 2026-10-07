#!/usr/bin/env node
// scripts/generar-audio.mjs
//
// Genera los MP3 de las audioguías a partir de los textos de public/data/pieces.json.
//
//   node scripts/generar-audio.mjs                       → solo MUESTRA el plan y el costo aproximado (no genera nada)
//   node scripts/generar-audio.mjs --generar             → genera de verdad (necesita la clave del proveedor)
//   node scripts/generar-audio.mjs --proveedor prueba --generar   → genera MP3 de prueba en silencio, gratis
//
// Opciones:
//   --lang es,en            idiomas (por defecto es)
//   --modo corto,largo      corto = Exprés, largo = Inmersión (por defecto los dos)
//   --solo gratis|premium   solo piezas gratis o solo de pago (por defecto todas)
//   --piezas id1,id2        solo esas piezas
//   --limite N              genera como máximo N audios en esta corrida
//   --forzar                regenera aunque el texto no haya cambiado
//   --proveedor azure|openai|prueba   (por defecto azure)
//   --reubicar              solo mueve archivos de lugar si una pieza pasó de gratis a pago (o al revés); no genera
//
// Dónde quedan los archivos:
//   TODOS los MP3 se generan en audio-generado/<idioma>/<pieza>_<modo>.mp3 (carpeta que NO se guarda en git ni se publica)
//   y luego scripts/subir-audio.mjs los sube a Cloudflare R2: libre/ (piezas gratis) o pago/ (piezas de pago).
// public/audio/manifest.json guarda la huella de cada texto y si la pieza es gratis o de pago: si el texto cambia en el Sheets,
// el MP3 viejo deja de usarse (la app vuelve a la voz del teléfono) hasta que lo regeneres.
// --reubicar mueve en R2 (libre/ ↔ pago/) los audios de piezas que cambiaron de tipo; no genera nada ni cuesta voz.

import fs from 'node:fs';
import path from 'node:path';
import { MODES, AUDIO_LANGS, planAudio, splitText, mp3Duration, silentMp3, REFERENCE_PRICE_USD_PER_MILLION_CHARS } from './audio-lib.mjs';
import { GENERATED_DIR, relocateInR2, wranglerR2, r2Key } from './r2-lib.mjs';
import { loadPronunciations, toSsmlInner, PRONUNCIATION_FILE } from './pronunciacion-lib.mjs';

const ROOT = process.cwd();
const PIECES_FILE = path.join(ROOT, 'public/data/pieces.json');
const PUBLIC_AUDIO = path.join(ROOT, 'public/audio'); // aquí solo vive el manifiesto; los MP3 están en R2
const GENERATED_AUDIO = path.join(ROOT, GENERATED_DIR);
const MANIFEST_FILE = path.join(PUBLIC_AUDIO, 'manifest.json');

// ---------------------------------------------------------------------------
// Argumentos
// ---------------------------------------------------------------------------
export function parseArgs(argv) {
  const out = { lang: ['es'], modo: [...MODES], solo: 'todas', piezas: null, limite: null, forzar: false, generar: false, reubicar: false, proveedor: 'azure' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--lang') out.lang = next().split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--modo') out.modo = next().split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--solo') out.solo = next();
    else if (a === '--piezas') out.piezas = next().split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--limite') out.limite = parseInt(next(), 10);
    else if (a === '--proveedor') out.proveedor = next();
    else if (a === '--forzar') out.forzar = true;
    else if (a === '--generar') out.generar = true;
    else if (a === '--reubicar') out.reubicar = true;
    else throw new Error(`Opción desconocida: ${a}`);
  }
  for (const l of out.lang) if (!AUDIO_LANGS.includes(l)) throw new Error(`Idioma no válido: ${l}. Usa: ${AUDIO_LANGS.join(', ')}`);
  for (const m of out.modo) if (!MODES.includes(m)) throw new Error(`Modo no válido: ${m}. Usa: ${MODES.join(', ')}`);
  if (!['todas', 'gratis', 'premium'].includes(out.solo)) throw new Error('--solo debe ser gratis o premium');
  if (!['azure', 'openai', 'prueba'].includes(out.proveedor)) throw new Error('--proveedor debe ser azure, openai o prueba');
  if (out.limite !== null && (!Number.isFinite(out.limite) || out.limite < 1)) throw new Error('--limite debe ser un número mayor que 0');
  return out;
}

// ---------------------------------------------------------------------------
// Proveedores de voz. Cada uno devuelve un Buffer con un MP3.
// ---------------------------------------------------------------------------
const AZURE_DEFAULT_VOICES = {
  es: 'es-MX-JorgeMultilingualNeural', // elegida por Alberto tras probar las muestras
  en: 'en-US-JennyNeural',
  fr: 'fr-FR-DeniseNeural',
  pl: 'pl-PL-ZofiaNeural',
  ru: 'ru-RU-SvetlanaNeural',
  ja: 'ja-JP-NanamiNeural',
};
const AZURE_LOCALES = { es: 'es-MX', en: 'en-US', fr: 'fr-FR', pl: 'pl-PL', ru: 'ru-RU', ja: 'ja-JP' };

const xmlEscape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

async function withRetry(fn, what) {
  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (e.fatal) break;
      const wait = 1500 * attempt * attempt;
      console.warn(`   ↻ ${what}: ${e.message}. Reintento ${attempt}/4 en ${Math.round(wait / 1000)} s…`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

async function httpAudio(url, init, label) {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = (await res.text().catch(() => '')).slice(0, 300);
    const err = new Error(`${label}: respuesta ${res.status} ${body}`);
    // 400/401/403/404 no se arreglan reintentando
    err.fatal = [400, 401, 403, 404].includes(res.status);
    throw err;
  }
  return Buffer.from(await res.arrayBuffer());
}

export const PROVIDERS = {
  prueba: {
    label: 'Prueba (silencio, gratis)',
    maxChars: 100000,
    async synth(text) {
      // ~14 caracteres por segundo, para que las duraciones se parezcan a las reales
      return silentMp3(Math.max(1, text.length / 14));
    },
  },

  azure: {
    label: 'Azure AI Speech (voces neuronales)',
    maxChars: 3000,
    check() {
      if (!process.env.AZURE_SPEECH_KEY || !process.env.AZURE_SPEECH_REGION) {
        throw new Error('Faltan las claves de Azure. Define AZURE_SPEECH_KEY y AZURE_SPEECH_REGION (ver docs/IDIOMA_MP3_COBRO.md).');
      }
    },
    voiceFor(lang) {
      return process.env[`AZURE_VOICE_${lang.toUpperCase()}`] || AZURE_DEFAULT_VOICES[lang];
    },
    async synth(text, { lang }) {
      const region = process.env.AZURE_SPEECH_REGION;
      const voice = this.voiceFor(lang);
      const rate = process.env.AZURE_RATE; // por ejemplo "-5%"
      // Lista de pronunciaciones (glosario/pronunciacion.csv): arregla palabras que la voz lee mal sin cambiar el texto
      const spoken = toSsmlInner(text, loadPronunciations(path.resolve(PRONUNCIATION_FILE), lang), voice);
      const inner = rate ? `<prosody rate="${xmlEscape(rate)}">${spoken}</prosody>` : spoken;
      const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${AZURE_LOCALES[lang]}"><voice name="${voice}">${inner}</voice></speak>`;
      return httpAudio(
        `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY,
            'Content-Type': 'application/ssml+xml',
            // 24 kHz, 48 kbps, mono: calidad de voz buena y archivos pequeños (unos 360 KB por minuto)
            'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
            'User-Agent': 'audioguias-mexico',
          },
          body: ssml,
        },
        'Azure'
      );
    },
  },

  openai: {
    label: 'OpenAI (texto a voz)',
    maxChars: 3800,
    check() {
      if (!process.env.OPENAI_API_KEY) throw new Error('Falta la clave de OpenAI. Define OPENAI_API_KEY (ver docs/IDIOMA_MP3_COBRO.md).');
    },
    voiceFor(lang) {
      return process.env[`OPENAI_VOICE_${lang.toUpperCase()}`] || process.env.OPENAI_VOICE || 'nova';
    },
    async synth(text, { lang }) {
      return httpAudio(
        'https://api.openai.com/v1/audio/speech',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: process.env.OPENAI_TTS_MODEL || 'tts-1',
            voice: this.voiceFor(lang),
            input: text,
            response_format: 'mp3',
          }),
        },
        'OpenAI'
      );
    },
  },
};

/** Convierte un guion completo en un MP3 (parte el texto si es largo y une los pedazos). */
export async function synthesize(provider, text, ctx) {
  const parts = splitText(text, provider.maxChars);
  const buffers = [];
  for (const [i, part] of parts.entries()) {
    buffers.push(await withRetry(() => provider.synth(part, ctx), `trozo ${i + 1}/${parts.length}`));
  }
  return Buffer.concat(buffers);
}

// ---------------------------------------------------------------------------
// Manifiesto
// ---------------------------------------------------------------------------
function readManifest() {
  if (!fs.existsSync(MANIFEST_FILE)) return { version: 1, items: {} };
  const m = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf-8'));
  m.items ||= {};
  return m;
}

function writeManifest(m) {
  fs.mkdirSync(PUBLIC_AUDIO, { recursive: true });
  // Orden estable para que los cambios en git sean legibles
  const sorted = { version: 1, items: {} };
  for (const lang of Object.keys(m.items).sort()) {
    sorted.items[lang] = {};
    for (const id of Object.keys(m.items[lang]).sort()) sorted.items[lang][id] = m.items[lang][id];
  }
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
}

const relName = (lang, id, mode) => `${lang}/${id}_${mode}.mp3`;

function needCloudflare() {
  if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID) {
    throw new Error('Para mover audios de carpeta en R2 faltan CLOUDFLARE_API_TOKEN y CLOUDFLARE_ACCOUNT_ID (ver docs/IDIOMA_MP3_COBRO.md).');
  }
}

// ---------------------------------------------------------------------------
// Programa principal
// ---------------------------------------------------------------------------
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(PIECES_FILE)) throw new Error('No existe public/data/pieces.json. Corre antes: npm run sync-data');
  const pieces = JSON.parse(fs.readFileSync(PIECES_FILE, 'utf-8'));
  const manifest = readManifest();

  const plan = planAudio(pieces, manifest, {
    langs: args.lang,
    modes: args.modo,
    only: args.solo,
    ids: args.piezas,
    limit: args.limite,
    force: args.forzar,
  });

  // 1) Mover de carpeta en R2 (libre/ ↔ pago/) los audios cuyo tipo (gratis / de pago) cambió. No cuesta nada de voz.
  //    Solo se hace al generar o con --reubicar; la vista previa nunca toca nada.
  const doMoves = args.generar || args.reubicar;
  if (!doMoves && plan.move.length) {
    console.log(`ℹ️  ${plan.move.length} audio(s) cambiaron de tipo (gratis ↔ de pago) y hay que cambiarlos de carpeta en R2. Corre con --reubicar (no cuesta nada).`);
  }
  if (doMoves && plan.move.length) {
    needCloudflare();
    const { moved, failed } = relocateInR2(plan.move, manifest, wranglerR2());
    if (moved) writeManifest(manifest);
    if (failed.length) process.exitCode = 1;
  }
  if (args.reubicar) {
    console.log(`Listo: ${plan.move.length} archivo(s) revisado(s) para reubicar.`);
    return;
  }

  // 2) Plan y costo
  const price = REFERENCE_PRICE_USD_PER_MILLION_CHARS[args.proveedor] ?? 0;
  const est = (plan.chars / 1_000_000) * price;
  const free = plan.todo.filter((i) => !i.remote).length;
  console.log('— Plan de audios —');
  console.log(`  Idiomas: ${args.lang.join(', ')} · Modos: ${args.modo.join(', ')} · Piezas: ${args.piezas ? args.piezas.length : 'todas'} · Tipo: ${args.solo}`);
  console.log(`  Ya están al día (se omiten): ${plan.keep.length}`);
  if (plan.skipped.length) console.log(`  Sin texto en ese idioma (se omiten): ${plan.skipped.length}`);
  console.log(`  Por generar: ${plan.todo.length}${plan.pending > plan.todo.length ? ` (de ${plan.pending}; límite ${args.limite})` : ''}  → ${free} libres y ${plan.todo.length - free} de pago`);
  console.log(`  Caracteres a leer: ${plan.chars.toLocaleString('es-MX')}`);
  console.log(`  Proveedor: ${PROVIDERS[args.proveedor].label} · costo aproximado ≈ US$ ${est.toFixed(2)} (precio de referencia US$ ${price} por millón de caracteres; confirma el precio vigente en la página del proveedor)`);

  if (!args.generar) {
    console.log('\nNo se generó nada (esto fue solo la vista previa). Para generar de verdad agrega --generar');
    return;
  }
  if (plan.todo.length === 0) {
    console.log('Nada que generar.');
    return;
  }

  const provider = PROVIDERS[args.proveedor];
  provider.check?.();

  // 3) Generar uno por uno; el manifiesto se guarda después de cada MP3 para poder retomar si se corta
  let done = 0;
  let failed = 0;
  for (const item of plan.todo) {
    const rel = relName(item.lang, item.pieceId, item.mode);
    process.stdout.write(`  [${done + failed + 1}/${plan.todo.length}] ${rel} (${item.script.length} car.) … `);
    try {
      const mp3 = await synthesize(provider, item.script, { lang: item.lang });
      const seconds = mp3Duration(mp3);
      if (!seconds) throw new Error('el proveedor devolvió algo que no es un MP3');
      const dest = path.join(GENERATED_AUDIO, rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, mp3);
      // Si la pieza cambió de tipo, la copia vieja de la otra carpeta de R2 se borra al subir (así no queda una copia de pago a la vista)
      if (item.from && Boolean(item.from.remote) !== item.remote) {
        const f = path.join(GENERATED_AUDIO, '_borrar.json');
        const list = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf-8')) : [];
        list.push(r2Key(Boolean(item.from.remote), rel));
        fs.writeFileSync(f, JSON.stringify(list));
      }
      manifest.items[item.lang] ||= {};
      manifest.items[item.lang][item.pieceId] ||= {};
      manifest.items[item.lang][item.pieceId][item.mode] = {
        hash: item.hash,
        file: rel,
        remote: item.remote,
        seconds: Math.round(seconds),
        bytes: mp3.length,
        provider: args.proveedor,
      };
      writeManifest(manifest);
      done++;
      console.log(`ok (${Math.round(seconds)} s, ${Math.round(mp3.length / 1024)} KB)`);
    } catch (e) {
      failed++;
      console.log(`ERROR: ${e.message}`);
      if (e.fatal) {
        console.error('Se detuvo: es un error de clave o de permisos, reintentar no ayuda.');
        break;
      }
    }
  }
  console.log(`\nListo: ${done} generados, ${failed} con error.`);
  if (done) {
    console.log('Siguientes pasos:');
    console.log('  1) npm run sync-data   (une los MP3 con las piezas)');
    console.log('  2) node scripts/subir-audio.mjs   (sube los MP3 a R2; el botón de GitHub lo hace solo)');
  }
  if (failed) process.exitCode = 1;
}

import { pathToFileURL } from 'node:url';
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error('❌ ' + (e && e.message ? e.message : e));
    process.exit(1);
  });
}
