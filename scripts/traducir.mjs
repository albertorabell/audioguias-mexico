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
//   --lang en             idioma (en, fr)
//   --solo piezas|salas|todo   (por defecto todo)
//   --piezas id1,id2      solo esas piezas
//   --limite N            traduce como máximo N piezas/salas en esta corrida (por defecto 5)
//   --max-usd N           se detiene si el gasto de esta corrida llegaría a N dólares (por defecto 2)
//   --forzar              vuelve a traducir aunque el texto en español no haya cambiado
//   --proveedor claude|prueba
//   --modelo NOMBRE       por defecto claude-sonnet-5-5 (o la variable TRADUCIR_MODELO)
//   --lote enviar|recoger modo por lotes (Batch API): cuesta la MITAD, pero la respuesta tarda de minutos a unas horas.
//                         "enviar" manda todo de una vez y anota el lote en traducciones/<idioma>/_lote.json;
//                         "recoger" revisa si ya terminó y, si sí, guarda las traducciones.
//   --esperar MIN         con --lote recoger: espera hasta MIN minutos a que termine el lote (por defecto 0 = solo revisa)
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
  alignKeys,
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
  const out = { lang: 'en', solo: 'todo', piezas: null, limite: 5, maxUsd: 2, forzar: false, generar: false, proveedor: 'claude', modelo: null, lote: null, esperarMin: 0 };
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
    else if (a === '--lote') out.lote = next();
    else if (a === '--esperar') out.esperarMin = parseInt(next(), 10);
    else if (a === '--forzar') out.forzar = true;
    else if (a === '--generar') out.generar = true;
    else throw new Error(`Opción desconocida: ${a}`);
  }
  if (!LANG_NAMES[out.lang]) throw new Error(`Idioma no válido: ${out.lang}. Por ahora solo: ${Object.keys(LANG_NAMES).join(', ')}`);
  if (!['piezas', 'salas', 'todo'].includes(out.solo)) throw new Error('--solo debe ser piezas, salas o todo');
  if (!['claude', 'prueba'].includes(out.proveedor)) throw new Error('--proveedor debe ser claude o prueba');
  if (!Number.isFinite(out.limite) || out.limite < 1) throw new Error('--limite debe ser un número mayor que 0');
  if (!Number.isFinite(out.maxUsd) || out.maxUsd <= 0) throw new Error('--max-usd debe ser un número mayor que 0');
  if (out.lote !== null && !['enviar', 'recoger'].includes(out.lote)) throw new Error('--lote debe ser enviar o recoger');
  if (out.lote !== null && out.proveedor !== 'claude') throw new Error('--lote solo funciona con el proveedor claude');
  if (!Number.isFinite(out.esperarMin) || out.esperarMin < 0 || out.esperarMin > 1440) throw new Error('--esperar debe estar entre 0 y 1440 minutos');
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
      L.push(`### ${f}`, '', `**ES:** ${flatText(it.es[f]).replace(/\n/g, ' / ')}`, '', `**${lang.toUpperCase()}:** ${flatText(it.en[f]).replace(/\n/g, ' / ')}`, '');
      for (const w of it.avisos[f] || []) L.push(`> Aviso: ${w}`, '');
    }
  }
  return L.join('\n');
}

// ---------------------------------------------------------------------------
// Modo por lotes (Batch API de Anthropic): mitad de precio, respuesta en minutos u horas (máximo 24 h).
// ---------------------------------------------------------------------------
const BATCH_URL = 'https://api.anthropic.com/v1/messages/batches';
export const BATCH_DISCOUNT = 0.5; // "All usage is charged at 50% of the standard API prices" (documentación de Anthropic)
const batchHeaders = (env) => ({ 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' });
const loteFile = (root, lang) => path.join(root, 'traducciones', lang, '_lote.json');
const customId = (kind, id) => `${kind}_${id}`.replace(/[^a-zA-Z0-9_-]/g, '_');

async function batchCall(fetchImpl, env, url, opts = {}) {
  const res = await fetchImpl(url, { ...opts, headers: batchHeaders(env) });
  if (!res.ok) throw new Error(`Anthropic respondió ${res.status} ${(await res.text().catch(() => '')).slice(0, 300)}`);
  return res;
}

function writeUnit(root, args, u, out, warnings, model) {
  const campos = { ...(u.stored?.campos || {}) };
  const avisos = { ...(u.stored?.avisos || {}) };
  for (const f of Object.keys(u.todoFields)) {
    campos[f] = { hash: fieldHash(u.todoFields[f]), texto: out[f] };
    if (warnings[f]) avisos[f] = warnings[f];
    else delete avisos[f];
  }
  const file = translationFile(root, args.lang, u.kind, u.id);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ id: u.id, tipo: u.kind, idioma: args.lang, modelo: model, fecha: new Date().toISOString().slice(0, 10), avisos, campos }, null, 2) + '\n', 'utf-8');
}

async function enviarLote({ root, env, fetchImpl, log, args, model, prices, todo, est }) {
  const file = loteFile(root, args.lang);
  if (fs.existsSync(file)) {
    const prev = readJson(file);
    throw new Error(`Ya hay un lote en curso (${prev.id}, enviado ${prev.creado}). Primero recógelo con el modo "lote-recoger" para no pagar dos veces.`);
  }
  // Tope: se recorta la lista para que el costo estimado (con el descuento) no pase de --max-usd
  const sendUnits = [];
  let estUsd = 0;
  for (const [i, u] of todo.entries()) {
    const cost = est[i].usd * BATCH_DISCOUNT;
    if (estUsd + cost > args.maxUsd) break;
    estUsd += cost;
    sendUnits.push({ u, chars: est[i].chars });
  }
  if (!sendUnits.length) throw new Error(`Ni la primera unidad cabe en el tope de ${usd(args.maxUsd)}. Sube el tope.`);
  log(`  Modo por lotes: ${sendUnits.length} unidades, costo aproximado con el 50 % de descuento: ${usd(estUsd)} (tope ${usd(args.maxUsd)}).`);
  if (sendUnits.length < todo.length) log(`  ⚠️  ${todo.length - sendUnits.length} unidades se quedan fuera para respetar el tope; se mandan en otro lote.`);

  const system = buildSystemPrompt(args.lang);
  const ids = new Set();
  const requests = sendUnits.map(({ u, chars }) => {
    const cid = customId(u.kind, u.id);
    if (cid.length > 64 || ids.has(cid)) throw new Error(`No puedo armar un identificador único para ${u.kind} ${u.id}`);
    ids.add(cid);
    // En un lote no hay reintento si la respuesta se corta: se da bastante espacio (solo se cobra lo que se escribe)
    const maxTokens = Math.min(MAX_OUTPUT_TOKENS, Math.max(4000, Math.round(chars * 1.3) + 1000));
    return {
      custom_id: cid,
      params: {
        model,
        max_tokens: maxTokens,
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: buildUserPrompt(u.todoFields, u.entries) }],
      },
    };
  });
  const res = await batchCall(fetchImpl, env, BATCH_URL, { method: 'POST', body: JSON.stringify({ requests }) });
  const data = await res.json();
  if (!data.id) throw new Error('Anthropic no devolvió el número del lote.');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        id: data.id,
        idioma: args.lang,
        modelo: model,
        creado: new Date().toISOString(),
        estimado_usd: Math.round(estUsd * 1000) / 1000,
        unidades: sendUnits.map(({ u }) => ({ custom_id: customId(u.kind, u.id), tipo: u.kind, id: u.id, huellas: Object.fromEntries(Object.entries(u.todoFields).map(([f, v]) => [f, fieldHash(v)])) })),
      },
      null,
      2
    ) + '\n',
    'utf-8'
  );
  log(`\n✅ Lote enviado: ${data.id}. Anthropic lo procesa solo (casi siempre en menos de 1 hora; máximo 24 h).`);
  log('Siguiente paso: correr "lote-recoger" para guardar las traducciones cuando termine.');
  return 0;
}

async function recogerLote({ root, env, fetchImpl, log, warn, args, prices, all, glossary, pollMs = 60000 }) {
  const file = loteFile(root, args.lang);
  if (!fs.existsSync(file)) {
    log('No hay ningún lote en curso para este idioma (no existe traducciones/' + args.lang + '/_lote.json).');
    return 0;
  }
  if (!env.ANTHROPIC_API_KEY) throw new Error('Falta la clave de Anthropic (secreto ANTHROPIC_API_KEY).');
  const lote = readJson(file);
  const getInfo = async () => (await batchCall(fetchImpl, env, `${BATCH_URL}/${lote.id}`)).json();
  let info = await getInfo();
  const counts = (i) => Object.entries(i.request_counts || {}).map(([k, v]) => `${k}: ${v}`).join(', ');
  const deadline = Date.now() + args.esperarMin * 60000;
  log(`Lote ${lote.id} (enviado ${lote.creado}): ${info.processing_status} (${counts(info)})`);
  while (info.processing_status !== 'ended' && Date.now() < deadline) {
    await sleep(pollMs);
    info = await getInfo();
    log(`  … ${info.processing_status} (${counts(info)})`);
  }
  if (info.processing_status !== 'ended') {
    log('\nTodavía no termina. Vuelve a correr "lote-recoger" en un rato (el lote sigue en Anthropic hasta 24 h).');
    return 0;
  }

  const res = await batchCall(fetchImpl, env, `${BATCH_URL}/${lote.id}/results`);
  const lines = (await res.text()).split('\n').filter((l) => l.trim());
  const results = new Map();
  for (const l of lines) {
    try {
      const r = JSON.parse(l);
      results.set(r.custom_id, r.result);
    } catch {
      /* línea dañada: esa unidad quedará como pendiente */
    }
  }

  let spent = 0;
  let saved = 0;
  let failed = 0;
  const review = [];
  for (const [i, lu] of lote.unidades.entries()) {
    const tag = `[${i + 1}/${lote.unidades.length}] ${lu.tipo} ${lu.id}`;
    const r = results.get(lu.custom_id);
    if (!r) { failed++; warn(`  ${tag} … ERROR: no vino en los resultados`); continue; }
    if (r.type !== 'succeeded') {
      failed++;
      warn(`  ${tag} … ERROR: ${r.type}${r.error?.error?.message || r.error?.message ? ': ' + (r.error?.error?.message || r.error.message) : ''} (no se cobra)`);
      continue;
    }
    spent += usdFromUsage(r.message?.usage, prices) * BATCH_DISCOUNT;
    const u = all.find((x) => x.kind === lu.tipo && x.id === lu.id);
    if (!u) { failed++; warn(`  ${tag} … ERROR: no está en los datos de ahora (¿se sincronizó el Sheets antes de recoger?)`); continue; }
    const names = Object.keys(lu.huellas);
    const todoFields = Object.fromEntries(names.filter((f) => u.fields[f] !== undefined).map((f) => [f, u.fields[f]]));
    if (names.some((f) => !todoFields[f] || fieldHash(todoFields[f]) !== lu.huellas[f])) {
      failed++;
      warn(`  ${tag} … ERROR: el texto en español de ahora no es el que se mandó (cambió el Sheets o no se sincronizó); se descarta (vuelve a enviarlo)`);
      continue;
    }
    try {
      if (r.message.stop_reason === 'max_tokens') throw new Error('la respuesta se cortó por llegar al límite de largo');
      const text = (r.message.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
      const out = alignKeys(todoFields, parseJsonReply(text));
      const entries = glossaryFor(glossary, Object.values(todoFields).map(flatText));
      const { errors, warnings } = validateTranslation(todoFields, out, entries, { lang: args.lang });
      if (errors.length) throw new Error(`no pasó las revisiones: ${errors.join('; ')}`);
      writeUnit(root, args, { ...u, todoFields }, out, warnings, lote.modelo);
      saved++;
      review.push({ kind: u.kind, id: u.id, es: todoFields, en: out, avisos: warnings });
      const nw = Object.values(warnings).reduce((n, l) => n + l.length, 0);
      log(`  ${tag} … ok${nw ? ` (${nw} aviso${nw > 1 ? 's' : ''})` : ''}`);
    } catch (e) {
      failed++;
      warn(`  ${tag} … ERROR: ${e.message}`);
    }
  }
  if (review.length) {
    const dir = path.join(root, 'traducciones', args.lang);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, '_ultima_corrida.md'), reviewMarkdown(args.lang, review), 'utf-8');
  }
  fs.rmSync(file);
  log(`\nListo: ${saved} traducidas, ${failed} con error (esas siguen pendientes). Gasto real aproximado del lote (con el 50 % de descuento): ${usd(spent)}.`);
  if (saved) log('Siguiente paso: revisar traducciones/' + args.lang + '/_ultima_corrida.md. El idioma sigue oculto en el sitio hasta que se publique.');
  if (failed) log('Las unidades con error se vuelven a pedir corriendo otro lote (solo manda las que faltan).');
  return saved > 0 || failed === 0 ? 0 : 1;
}

export async function main(argv, { root = process.cwd(), env = process.env, fetchImpl = fetch, log = console.log, warn = console.warn, retryBaseMs, pollMs } = {}) {
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
  const glossary = loadGlossary(path.join(root, GLOSSARY_FILE), args.lang);
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
  if (args.lote === 'recoger') return recogerLote({ root, env, fetchImpl, log, warn, args, prices, all, glossary, pollMs });
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
  if (args.lote === 'enviar') log(`  Con el modo por lotes (50 % de descuento): ${usd(estUsd * BATCH_DISCOUNT)}`);
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
  if (args.lote === 'enviar') return enviarLote({ root, env, fetchImpl, log, args, model, prices, todo, est });

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
      const out = alignKeys(u.todoFields, parseJsonReply(text));
      const { errors, warnings } = validateTranslation(u.todoFields, out, u.entries, { fake: provider.fake, lang: args.lang });
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
