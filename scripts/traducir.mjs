#!/usr/bin/env node
// scripts/traducir.mjs
//
// Traduce los textos de las piezas y salas (public/data/pieces.json y rooms.json) con la API de Claude,
// usando el glosario de nombres propios (glosario/glosario.csv).
//
//   node scripts/traducir.mjs                          → solo MUESTRA el plan y el costo aproximado (no llama a la API)
//   node scripts/traducir.mjs --generar                → traduce de verdad (necesita ANTHROPIC_API_KEY)
//   node scripts/traducir.mjs --proveedor prueba --generar   → ensayo sin red y gratis (textos de mentiras)
//
// Opciones:
//   --lang en             idioma (por ahora solo en)
//   --solo piezas|salas|todo   (por defecto todo)
//   --piezas id1,id2      solo esas piezas
//   --limite N            traduce como máximo N piezas/salas en esta corrida (por defecto 5)
//   --max-usd N           se detiene si el gasto de esta corrida llegaría a N dólares (por defecto 2)
//   --forzar              vuelve a traducir aunque el texto en español no haya cambiado
//   --proveedor claude|prueba
//   --modelo NOMBRE       por defecto claude-sonnet-5-5 (o la variable TRADUCIR_MODELO)
//
// Dónde quedan las traducciones: traducciones/<idioma>/pieza_<id>.json y sala_<id>.json.
// Cada campo guarda la huella del texto en español: si el español cambia, esa traducción deja de usarse
// (la app vuelve al español) hasta que se vuelva a traducir. Nada se publica por sí solo: el idioma sigue
// oculto hasta que se agregue a PUBLISHED_LANGUAGES.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  LANG_NAMES,
  GLOSSARY_FILE,
  DEFAULT_PRICES,
  buildSystemPrompt,
  buildUserPrompt,
  estimateUnit,
  fieldHash,
  glossaryFor,
  flatText,
  loadGlossary,
  parseJsonReply,
  pendingFields,
  readStored,
  sourceFields,
  translationFile,
  unitId,
  usdFromUsage,
  validateTranslation,
} from './traducir-lib.mjs';

export const DEFAULT_MODEL = 'claude-sonnet-5-5';
const MAX_OUTPUT_TOKENS = 16000;

export function parseArgs(argv) {
  const out = { lang: 'en', solo: 'todo', piezas: null, limite: 5, maxUsd: 2, forzar: false, generar: false, proveedor: 'claude', modelo: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) throw new Error(`Falta el valor de ${a}`);
      return argv[++i];
    };
    if (a === '--lang') out.lang = next().trim();
    else if (a === '--solo') out.solo = next();
    else if (a === '--piezas') out.piezas = next().split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--limite') out.limite = parseInt(next(), 10);
    else if (a === '--max-usd') out.maxUsd = parseFloat(next());
    else if (a === '--proveedor') out.proveedor = next();
    else if (a === '--modelo') out.modelo = next();
    else if (a === '--forzar') out.forzar = true;
    else if (a === '--generar') out.generar = true;
    else throw new Error(`Opción desconocida: ${a}`);
  }
  if (!LANG_NAMES[out.lang]) throw new Error(`Idioma no válido: ${out.lang}. Por ahora solo: ${Object.keys(LANG_NAMES).join(', ')}`);
  if (!['piezas', 'salas', 'todo'].includes(out.solo)) throw new Error('--solo debe ser piezas, salas o todo');
  if (!['claude', 'prueba'].includes(out.proveedor)) throw new Error('--proveedor debe ser claude o prueba');
  if (!Number.isFinite(out.limite) || out.limite < 1) throw new Error('--limite debe ser un número mayor que 0');
  if (!Number.isFinite(out.maxUsd) || out.maxUsd <= 0) throw new Error('--max-usd debe ser un número mayor que 0');
  return out;
}

// ---------------------------------------------------------------------------
// Proveedores. translate() devuelve { text, usage }.
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function makeProvider(name, { env = process.env, fetchImpl = fetch, retryBaseMs = 1500 } = {}) {
  if (name === 'prueba') {
    return {
      label: 'Prueba (sin red, gratis; textos de mentiras)',
      fake: true,
      check() {},
      async translate({ user }) {
        const json = JSON.parse(user.slice(user.indexOf('{'), user.lastIndexOf('}') + 1));
        const fake = (v, key) =>
          typeof v === 'string' ? `[EN] ${v}` : Array.isArray(v) ? v.map((x) => fake(x)) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [key === 'faq_mito' ? k : `[EN] ${k}`, fake(x)])) : v;
        const out = Object.fromEntries(Object.entries(json).map(([k, v]) => [k, fake(v, k)]));
        return { text: JSON.stringify(out), usage: { input_tokens: 0, output_tokens: 0 } };
      },
    };
  }
  return {
    label: 'Claude (API de Anthropic)',
    fake: false,
    check() {
      if (!env.ANTHROPIC_API_KEY) {
        throw new Error('Falta la clave de Anthropic. Guárdala en GitHub como secreto con el nombre ANTHROPIC_API_KEY (ver la Guía paso a paso).');
      }
    },
    async translate({ system, user, model, maxTokens }) {
      let lastErr;
      let limit = maxTokens;
      const billed = {}; // todo lo que se cobró en esta traducción, incluidos los intentos cortados
      const addUsage = (u = {}) => { for (const [k, v] of Object.entries(u)) if (typeof v === 'number') billed[k] = (billed[k] || 0) + v; };
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
          const res = await fetchImpl('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({
              model,
              max_tokens: limit,
              system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
              messages: [{ role: 'user', content: user }],
            }),
          });
          if (!res.ok) {
            const body = (await res.text().catch(() => '')).slice(0, 300);
            const err = new Error(`Anthropic respondió ${res.status} ${body}`);
            err.fatal = [400, 401, 403, 404].includes(res.status);
            throw err;
          }
          const data = await res.json();
          if (data.stop_reason === 'max_tokens') {
            // La respuesta se cortó: se reintenta con el doble de espacio (hasta el máximo). Lo cortado también se cobra, por eso el tope.
            const err = new Error(`la respuesta se cortó por llegar al límite de largo (${limit} tokens)`);
            if (limit >= MAX_OUTPUT_TOKENS) err.fatal = true;
            else limit = Math.min(MAX_OUTPUT_TOKENS, limit * 2);
            err.truncated = true;
            addUsage(data.usage);
            throw err;
          }
          const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
          addUsage(data.usage);
          return { text, usage: billed };
        } catch (e) {
          lastErr = e;
          if (e.fatal) break;
          if (attempt < 4 && !e.truncated) await sleep(retryBaseMs * attempt * attempt);
        }
      }
      lastErr.usage = billed;
      throw lastErr;
    },
  };
}

// ---------------------------------------------------------------------------
// Corrida
// ---------------------------------------------------------------------------
function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (e) {
    throw new Error(`No pude leer ${file}: ${e.message}`);
  }
}

const usd = (n) => `US$ ${n.toFixed(n < 0.1 ? 3 : 2)}`;

function reviewMarkdown(lang, items) {
  const L = [`# Traducciones de la última corrida (${LANG_NAMES[lang]})`, '', 'Español arriba, traducción abajo. Los avisos son revisiones automáticas, no errores.', ''];
  for (const it of items) {
    L.push(`## ${it.kind === 'pieza' ? 'Pieza' : 'Sala'}: ${it.id}`, '');
    for (const f of Object.keys(it.es)) {
      L.push(`### ${f}`, '', `**ES:** ${flatText(it.es[f]).replace(/\n/g, ' / ')}`, '', `**EN:** ${flatText(it.en[f]).replace(/\n/g, ' / ')}`, '');
      for (const w of it.avisos[f] || []) L.push(`> Aviso: ${w}`, '');
    }
  }
  return L.join('\n');
}

export async function main(argv, { root = process.cwd(), env = process.env, fetchImpl = fetch, log = console.log, warn = console.warn, retryBaseMs } = {}) {
  const args = parseArgs(argv);
  const model = args.modelo || env.TRADUCIR_MODELO || DEFAULT_MODEL;
  const prices = {
    ...DEFAULT_PRICES,
    ...(env.TRADUCIR_USD_ENTRADA ? { input: parseFloat(env.TRADUCIR_USD_ENTRADA) } : {}),
    ...(env.TRADUCIR_USD_SALIDA ? { output: parseFloat(env.TRADUCIR_USD_SALIDA) } : {}),
  };
  const provider = makeProvider(args.proveedor, { env, fetchImpl, retryBaseMs });

  const pieces = readJson(path.join(root, 'public/data/pieces.json'));
  const rooms = readJson(path.join(root, 'public/data/rooms.json'));
  const glossary = loadGlossary(path.join(root, GLOSSARY_FILE));
  if (!glossary.length) warn('⚠️  No encontré el glosario (glosario/glosario.csv): se traducirá sin lista de nombres propios.');

  // ---- Qué hay por traducir ----
  let units = [];
  if (args.solo !== 'salas') for (const p of pieces) units.push({ kind: 'pieza', item: p });
  if (args.solo !== 'piezas' && !args.piezas) for (const r of rooms) units.push({ kind: 'sala', item: r });
  if (args.piezas) {
    const ids = new Set(args.piezas);
    const known = new Set(pieces.map((p) => p.piece_id));
    const unknown = args.piezas.filter((i) => !known.has(i));
    if (unknown.length) throw new Error(`No existen estas piezas: ${unknown.join(', ')}`);
    units = units.filter((u) => u.kind === 'pieza' && ids.has(u.item.piece_id));
  }

  const all = units.map((u) => {
    const id = unitId(u.kind, u.item);
    const fields = sourceFields(u.kind, u.item);
    const stored = readStored(root, args.lang, u.kind, id);
    const pend = args.forzar ? Object.keys(fields) : pendingFields(fields, stored);
    const todoFields = Object.fromEntries(pend.map((f) => [f, fields[f]]));
    const entries = glossaryFor(glossary, Object.values(todoFields).map(flatText));
    return { ...u, id, fields, stored, todoFields, entries };
  });
  const pending = all.filter((u) => Object.keys(u.todoFields).length > 0);
  const todo = pending.slice(0, args.limite);
  const est = todo.map((u) => estimateUnit(u.todoFields, u.entries, args.lang, prices));
  const estUsd = est.reduce((n, e) => n + e.usd, 0);
  const estChars = est.reduce((n, e) => n + e.chars, 0);

  log(`— Plan de traducción (${LANG_NAMES[args.lang]}) —`);
  log(`  Proveedor: ${provider.label} · modelo: ${model}`);
  log(`  Textos revisados: ${all.length} · ya al día: ${all.length - pending.length} · por traducir: ${pending.length} (esta corrida: ${todo.length}, límite ${args.limite})`);
  log(`  Caracteres a traducir en esta corrida: ${estChars.toLocaleString('es-MX')}`);
  log(`  Costo aproximado de esta corrida: ${provider.fake ? usd(0) : usd(estUsd)} (estimación; confirma los precios vigentes en la página de Anthropic) · tope: ${usd(args.maxUsd)}`);
  if (todo.length) log(`  Primeros: ${todo.slice(0, 10).map((u) => u.id).join(', ')}${todo.length > 10 ? '…' : ''}`);

  if (!args.generar) {
    log('\nSolo era el plan: no se llamó a ninguna API ni se guardó nada. Para traducir de verdad agrega --generar.');
    return 0;
  }
  if (!todo.length) {
    log('\nNada por traducir: todo está al día.');
    return 0;
  }
  provider.check();

  // ---- Traducir ----
  const system = buildSystemPrompt(args.lang);
  let spent = 0;
  let saved = 0;
  let failed = 0;
  let consecutive = 0;
  const review = [];
  for (const [i, u] of todo.entries()) {
    if (!provider.fake && spent + est[i].usd > args.maxUsd) {
      log(`\n⛔ Me detengo: seguir llevaría el gasto de esta corrida por encima del tope (${usd(args.maxUsd)}). Gastado hasta ahora: ${usd(spent)}.`);
      break;
    }
    // En la prueba real el inglés salió a ~0.5 tokens por carácter del español; se da casi el doble de espacio
    const maxTokens = Math.min(MAX_OUTPUT_TOKENS, Math.max(3000, Math.round(est[i].chars * 0.9) + 1000));
    try {
      const { text, usage } = await provider.translate({ system, user: buildUserPrompt(u.todoFields, u.entries), model, maxTokens });
      spent += usdFromUsage(usage, prices);
      const out = parseJsonReply(text);
      const { errors, warnings } = validateTranslation(u.todoFields, out, u.entries, { fake: provider.fake });
      if (errors.length) throw new Error(`no pasó las revisiones: ${errors.join('; ')}`);

      const campos = { ...(u.stored?.campos || {}) };
      const avisos = { ...(u.stored?.avisos || {}) };
      for (const f of Object.keys(u.todoFields)) {
        campos[f] = { hash: fieldHash(u.todoFields[f]), texto: out[f] };
        if (warnings[f]) avisos[f] = warnings[f];
        else delete avisos[f];
      }
      const file = translationFile(root, args.lang, u.kind, u.id);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(
        file,
        JSON.stringify({ id: u.id, tipo: u.kind, idioma: args.lang, modelo: provider.fake ? 'prueba' : model, fecha: new Date().toISOString().slice(0, 10), avisos, campos }, null, 2) + '\n',
        'utf-8'
      );
      saved++;
      consecutive = 0;
      review.push({ kind: u.kind, id: u.id, es: u.todoFields, en: out, avisos: warnings });
      const nw = Object.values(warnings).reduce((n, l) => n + l.length, 0);
      log(`  [${i + 1}/${todo.length}] ${u.kind} ${u.id} … ok${nw ? ` (${nw} aviso${nw > 1 ? 's' : ''})` : ''}`);
    } catch (e) {
      spent += usdFromUsage(e.usage, prices); // un intento cortado o rechazado también se cobra
      failed++;
      consecutive++;
      warn(`  [${i + 1}/${todo.length}] ${u.kind} ${u.id} … ERROR: ${e.message}`);
      if (e.fatal || consecutive >= 3) {
        warn('⛔ Me detengo para no gastar de más: el error se repite o no se arregla reintentando.');
        break;
      }
    }
  }

  if (review.length) {
    const dir = path.join(root, 'traducciones', args.lang);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, '_ultima_corrida.md'), reviewMarkdown(args.lang, review), 'utf-8');
  }
  log(`\nListo: ${saved} traducidas, ${failed} con error. Gasto real aproximado de esta corrida: ${provider.fake ? usd(0) : usd(spent)}.`);
  if (pending.length > saved) log(`Quedan ${pending.length - saved} por traducir.`);
  if (saved) log('Siguiente paso: revisar traducciones/' + args.lang + '/_ultima_corrida.md. El idioma sigue oculto en el sitio hasta que se publique.');
  return saved > 0 || failed === 0 ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((e) => {
      console.error('❌ ' + (e && e.message ? e.message : e));
      process.exit(1);
    });
}
