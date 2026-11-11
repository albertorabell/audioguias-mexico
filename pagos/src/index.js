// Servidor de pagos y de audios de pago de Audioguías México (Cloudflare Worker).
//
//   POST /checkout   crea una sesión de pago de Stripe y devuelve la dirección a donde mandar al visitante
//   POST /promo      revisa un código de descuento (porcentaje) para un sitio, sin cobrar nada
//   POST /redeem     el visitante regresó de pagar: se confirma con Stripe y se le da una clave de acceso
//   POST /code       un segundo dispositivo entra con el código corto del pase
//   POST /status     revisa si una clave sigue vigente
//   POST /stripe-webhook  Stripe avisa de reembolsos y disputas: el pase se cancela solo
//   POST /evento      la app cuenta (sin datos personales) qué se usa: obra vista, audio, pantalla del pase...
//   POST /recorrido    al cerrar la app, el resumen anónimo de la visita (pantallas, audios, duración); sin identificador
//   GET  /recorridos   resumen de esas visitas (solo con la clave STATS_KEY); se borran a los 60 días
//   POST /contacto     mensaje o reporte de error del formulario de la app; se guarda 90 días y avisa por correo
//   GET  /mensajes     esos mensajes (solo con la clave STATS_KEY)
//   GET  /estadisticas  resumen de esos conteos (solo con la clave STATS_KEY)
//   GET  /config     precios y forma de acceso (del sitio pedido con ?site=, o los de Stripe si no hay tabla) y reglas del pase
//   POST /admin/codigos  el robot de GitHub publica los códigos de acceso (hoja CODIGOS); solo con la clave CODES_KEY
//   GET  /audio/libre/<idioma>/<pieza>_<modo>.mp3          audios de piezas gratis (públicos, sin clave)
//   GET  /audio/pago/<idioma>/<pieza>_<modo>.mp3?t=<clave> audios de piezas de pago (solo con clave vigente)
//   (en el bucket R2 están en las carpetas libre/ y pago/ con el mismo nombre)
//   GET  /texto/<idioma>.json?t=<clave>   textos de pago (guiones, retos, mito, ficha técnica): solo con clave vigente
//
// Nada del dinero pasa por aquí: el pago ocurre en la página de Stripe. Este servidor solo pregunta a Stripe
// "¿esta sesión está pagada?" con la clave secreta, y entrega una clave firmada que dura lo que dura el pase.

import { signToken, verifyToken } from './token.js';
import { COMBO, coverageOf, coversSite, getPrecios, siteForPiece } from './precios.js';

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sin 0, O, 1, I, L para que no se confundan al dictarlo
const SESSION_RE = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/;
const DEVICE_RE = /^[A-Za-z0-9_-]{6,64}$/;
const AUDIO_RE = /^\/audio\/(libre|pago)\/(es|en|fr|pl|de|pt|it|ru|ja)\/([A-Za-z0-9_-]+)_(corto|largo)\.mp3$/;
const TEXT_RE = /^\/texto\/(es|en|fr|pl|de|pt|it|ru|ja)\.json$/;
const STRIPE_LOCALES = { es: 'es-419', en: 'en', fr: 'fr', pl: 'pl', ru: 'ru', ja: 'ja' };

/** "ES", "es-MX" o "en-US" → "es" / "en". Cualquier otra cosa (incluido "constructor") → "es". */
function normalizeLang(v) {
  const l = typeof v === 'string' ? v.toLowerCase().slice(0, 2) : '';
  return Object.hasOwn(STRIPE_LOCALES, l) ? l : 'es';
}

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------
function settings(env) {
  const list = (v, d) => String(v ?? d).split(',').map((s) => s.trim()).filter(Boolean);
  const num = (v, d) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : d;
  };
  return {
    origins: list(env.ALLOWED_ORIGINS, ''),
    sites: list(env.SITE_IDS, 'mna').map((x) => x.toLowerCase()),
    hours: num(env.PASS_HOURS, 72),
    maxDevices: num(env.MAX_DEVICES, 2),
    // Cuántos días después de pagar se puede canjear por primera vez (el pase empieza a contar al canjear)
    sessionDays: num(env.SESSION_MAX_DAYS, 30),
    // Modo de pruebas: con "1" todo el contenido de pago se entrega sin pase (no se necesita Stripe)
    free: String(env.ACCESO_LIBRE ?? '0').trim() === '1',
  };
}

/**
 * Qué sitios existen y cuánto cuestan. Con tabla de precios (PRECIOS_URL) manda la tabla; sin ella, la lista fija SITE_IDS.
 * `ids` incluye "todos" cuando hay pase combinado.
 */
async function loadBook(env, cfg) {
  const table = await getPrecios(env);
  const ids = new Set(table ? [...Object.keys(table.sites), ...Object.keys(table.combos)] : cfg.sites);
  return { table, ids, first: table ? Object.keys(table.sites)[0] : cfg.sites[0] };
}

/** ¿Este sitio es gratis para todos? (columna `acceso` = gratis) */
const isFreeSite = (book, site) => book.table?.sites[site]?.acceso === 'gratis';

/** ¿El pase de este «sitio» (un sitio o un pase combinado) abre ese sitio? Sin tabla de precios solo cuenta el mismo sitio, y "todos". */
const covers = (book, passSite, site) => coversSite(book.table, passSite, site);

/**
 * ¿La clave sirve para esta pieza? El sitio de la clave debe ser el de la pieza, o un pase combinado que lo incluya.
 * Sin tabla de precios no se puede saber a qué sitio pertenece la pieza, y vale lo de siempre: que el sitio de la clave exista.
 */
function tokenAllowsPiece(book, payload, pieceId) {
  if (!payload) return false;
  if (!book.table) return book.ids.has(payload.site);
  const site = siteForPiece(book.table, pieceId);
  return Boolean(site) && covers(book, payload.site, site);
}

function corsHeaders(request, cfg) {
  const origin = request.headers.get('Origin');
  const h = { Vary: 'Origin' };
  if (origin && cfg.origins.includes(origin)) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Access-Control-Allow-Methods'] = 'GET, POST, HEAD, OPTIONS';
    h['Access-Control-Allow-Headers'] = 'Content-Type, Range, Authorization';
    h['Access-Control-Expose-Headers'] = 'Content-Range, Accept-Ranges, Content-Length';
    h['Access-Control-Max-Age'] = '86400';
  }
  return h;
}

const json = (data, status, extra = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra } });

// ---------------------------------------------------------------------------
// Stripe (llamadas REST directas, sin librerías)
// ---------------------------------------------------------------------------
async function stripeCall(env, method, path, params) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, ...(params ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
    body: params ? params.toString() : undefined,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body?.error?.message || `Stripe respondió ${res.status}`);
    err.status = res.status;
    err.stripe = body?.error;
    throw err;
  }
  return body;
}

let priceCache = { at: 0, data: null, key: '' };
async function getPrices(env) {
  // La caché se descarta si cambian los identificadores de precio (por ejemplo, de modo de prueba a modo real)
  const key = `${env.STRIPE_PRICE_ID_MXN}|${env.STRIPE_PRICE_ID_USD}`;
  if (priceCache.data && priceCache.key === key && Date.now() - priceCache.at < 3600_000) return priceCache.data;
  const out = {};
  for (const [key, id] of [['mxn', env.STRIPE_PRICE_ID_MXN], ['usd', env.STRIPE_PRICE_ID_USD]]) {
    if (!id || id.startsWith('REEMPLAZA')) continue;
    const p = await stripeCall(env, 'GET', `prices/${encodeURIComponent(id)}`);
    if (typeof p.unit_amount === 'number') out[key] = { amount: p.unit_amount / 100, currency: p.currency };
  }
  priceCache = { at: Date.now(), data: out, key };
  return out;
}

// ---------------------------------------------------------------------------
// Pases (se guardan en KV)
// ---------------------------------------------------------------------------
function makeCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const chars = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
  return `${chars.slice(0, 4)}-${chars.slice(4)}`;
}
const normalizeCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const codeKey = (c) => `c:${normalizeCode(c)}`;

async function loadPass(env, sessionId) {
  const raw = await env.PASES.get(`s:${sessionId}`);
  return raw ? JSON.parse(raw) : null;
}

// El registro del pase debe vivir MÁS que la ventana en que una sesión pagada todavía se puede canjear
// (sessionDays) más lo que dura el pase. Si se borrara antes, la misma sesión pagada daría otro pase nuevo.
async function savePass(env, cfg, sessionId, pass) {
  // Lo que falte para que venza este pase (puede ser más que PASS_HOURS si viene de un código con más horas)
  const left = Math.max(Math.ceil((pass.expiresAt - Date.now()) / 1000), cfg.hours * 3600);
  const ttl = cfg.sessionDays * 86400 + left + 86400;
  await env.PASES.put(`s:${sessionId}`, JSON.stringify(pass), { expirationTtl: ttl });
}

/** Agrega el dispositivo al pase (si cabe) y devuelve la respuesta con la clave. */
async function grantAccess(env, cfg, book, sessionId, pass, deviceId) {
  const now = Date.now();
  if (pass.revoked || (await isRevoked(env, sid12(sessionId)))) return { error: 'revoked', status: 403 };
  if (pass.expiresAt <= now) return { error: 'expired', status: 410 };
  if (!pass.devices.includes(deviceId)) {
    if (pass.devices.length >= cfg.maxDevices) return { error: 'device_limit', status: 403 };
    pass.devices.push(deviceId);
    await savePass(env, cfg, sessionId, pass);
  }
  const token = await signToken({ sid: sessionId.slice(-12), site: pass.site, dev: deviceId, exp: pass.expiresAt }, env.TOKEN_SECRET);
  return {
    status: 200,
    body: { token, site: pass.site, covers: coverageOf(book.table, pass.site), expiresAt: pass.expiresAt, code: pass.code, devices: pass.devices.length, maxDevices: cfg.maxDevices },
  };
}


// ---------------------------------------------------------------------------
// Pases cancelados (reembolso o disputa en Stripe)
// ---------------------------------------------------------------------------
const sid12 = (sessionId) => String(sessionId).slice(-12);
const revokedKey = (id12) => `r:${id12}`;

async function isRevoked(env, id12) {
  return Boolean(id12) && (await env.PASES.get(revokedKey(id12))) !== null;
}

/** Cancela el pase de una sesión pagada: deja de abrir audios y textos, y su código deja de funcionar. */
async function revokeSession(env, cfg, sessionId) {
  const ttl = cfg.sessionDays * 86400 + cfg.hours * 3600 + 86400;
  await env.PASES.put(revokedKey(sid12(sessionId)), '1', { expirationTtl: ttl });
  const pass = await loadPass(env, sessionId);
  if (pass) {
    pass.expiresAt = Date.now();
    pass.revoked = true;
    await savePass(env, cfg, sessionId, pass);
  }
}

/** Comprueba la firma de Stripe ("Stripe-Signature: t=...,v1=...") sobre el cuerpo tal cual llegó. */
export async function verifyStripeSignature(rawBody, header, secret, nowMs = Date.now(), toleranceSec = 300) {
  if (!secret || typeof header !== 'string') return false;
  const parts = header.split(',').map((x) => x.trim().split('='));
  const t = parts.find(([k]) => k === 't')?.[1];
  const sigs = parts.filter(([k]) => k === 'v1').map(([, v]) => v);
  if (!t || !sigs.length || !/^\d+$/.test(t)) return false;
  if (Math.abs(nowMs / 1000 - Number(t)) > toleranceSec) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${rawBody}`)));
  const expected = Array.from(mac, (b) => b.toString(16).padStart(2, '0')).join('');
  return sigs.some((sig) => timingSafeEqual(sig, expected));
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function handleStripeWebhook(request, env, cfg, cors) {
  const book = await loadBook(env, cfg);
  if (!env.STRIPE_WEBHOOK_SECRET) return json({ error: 'not_configured' }, 503, cors);
  const raw = await request.text();
  if (raw.length > 200_000) return json({ error: 'bad_request' }, 400, cors);
  if (!(await verifyStripeSignature(raw, request.headers.get('Stripe-Signature'), env.STRIPE_WEBHOOK_SECRET))) {
    return json({ error: 'bad_signature' }, 400, cors);
  }
  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ error: 'bad_request' }, 400, cors);
  }
  const obj = event?.data?.object || {};
  // Reembolso total o disputa (contracargo): el pase se cancela. Un reembolso parcial no lo cancela.
  const cancels = (event.type === 'charge.refunded' && obj.refunded === true) || event.type === 'charge.dispute.created';
  if (!cancels) return json({ received: true, ignored: true }, 200, cors);
  const paymentIntent = obj.payment_intent;
  if (typeof paymentIntent !== 'string' || !/^pi_[A-Za-z0-9]+$/.test(paymentIntent)) return json({ received: true, ignored: true }, 200, cors);
  let list;
  try {
    list = await stripeCall(env, 'GET', `checkout/sessions?payment_intent=${encodeURIComponent(paymentIntent)}&limit=1`);
  } catch (e) {
    console.error('webhook', e.message);
    return json({ error: 'stripe_error' }, 502, cors); // Stripe lo reintenta
  }
  const session = list?.data?.[0];
  if (!session || !book.ids.has(session.metadata?.site_id)) return json({ received: true, ignored: true }, 200, cors);
  await revokeSession(env, cfg, session.id);
  await countEvent(env, 'refund', { s: session.metadata.site_id, k: event.type === 'charge.dispute.created' ? 'disputa' : 'reembolso' });
  return json({ received: true, revoked: true }, 200, cors);
}

// ---------------------------------------------------------------------------
// Conteo anónimo de uso. No se guarda IP, ni identificador de dispositivo, ni nada que identifique a una persona:
// solo contadores por día ("obra vista: Piedra del Sol, 12 veces").
// ---------------------------------------------------------------------------
const EVENTS = new Set([
  'app_open', 'piece_view', 'audio_play', 'audio_end', 'paywall_open', 'checkout_start', 'lang_change',
  'route_start', 'tour_done', 'install', 'offline_download', 'search', 'purchase', 'refund', 'code_redeem',
  'screen_view', 'visit_country', 'audio_stop', 'util_si', 'util_no',
  'pass_code_shared', 'sample_play', 'app_error', 'visitor_new',
]);
const PIECE_RE = /^[a-z0-9_]{3,60}$/;
const DAILY_KEY_LIMIT = 3000;


/**
 * Suma 1 a un contador del día.
 * Con el Durable Object CONTADOR el conteo es EXACTO: todas las sumas pasan una por una por el mismo objeto, así que no se pierde ninguna en un pico de visitas.
 * Sin ese objeto (o si falla) se usa el respaldo en KV, que es aproximado: dos sumas exactamente simultáneas pueden contarse como una.
 */
async function countEvent(env, name, f = {}) {
  if (!EVENTS.has(name)) return;
  const field = (v, re) => (typeof v === 'string' && re.test(v) ? v : '');
  const key = [name, field(f.s, /^[a-z0-9_-]{1,40}$/i).toLowerCase(), field(f.p, PIECE_RE), field(f.l, /^[a-z]{2}$/), field(f.m, /^(corto|largo)$/), field(f.k, /^[a-z0-9_-]{1,20}$/i)].join('|');
  const day = new Date().toISOString().slice(0, 10);
  if (env.CONTADOR) {
    try {
      const res = await contador(env).fetch('https://contador/sumar', { method: 'POST', body: JSON.stringify({ day, key }) });
      if (res.ok) return;
    } catch (e) {
      console.error('contador', e && e.message);
    }
  }
  try {
    const dk = `ev:${day}`;
    const raw = await env.PASES.get(dk);
    const doc = raw ? JSON.parse(raw) : { c: {} };
    sumarEnDia(doc, key);
    await env.PASES.put(dk, JSON.stringify(doc), { expirationTtl: 400 * 86400 });
  } catch (e) {
    console.error('evento', e && e.message);
  }
}

const contador = (env) => env.CONTADOR.get(env.CONTADOR.idFromName('global'));

/** Suma 1 a una clave del documento de un día; pasado el límite de claves distintas, cuenta en «_descartados». */
function sumarEnDia(doc, key) {
  if (!(key in doc.c) && Object.keys(doc.c).length >= DAILY_KEY_LIMIT) doc.c['_descartados'] = (doc.c['_descartados'] || 0) + 1;
  else doc.c[key] = (doc.c[key] || 0) + 1;
}

/**
 * Durable Object con los contadores por día (clave "d:AAAA-MM-DD"). Un solo objeto atiende las sumas de una en una
 * (Cloudflare no deja entrar otra petición mientras lee y escribe), por eso no se pierde ningún conteo.
 */
export class Contador {
  constructor(state) {
    this.state = state;
  }
  async fetch(request) {
    const url = new URL(request.url);
    const body = request.method === 'POST' ? await request.json().catch(() => null) : null;
    if (url.pathname === '/sumar' && body && /^\d{4}-\d{2}-\d{2}$/.test(body.day) && typeof body.key === 'string' && body.key.length < 200) {
      const k = `d:${body.day}`;
      const doc = (await this.state.storage.get(k)) || { c: {} };
      sumarEnDia(doc, body.key);
      await this.state.storage.put(k, doc);
      return new Response('ok');
    }
    if (url.pathname === '/leer' && body && /^\d{4}-\d{2}-\d{2}$/.test(body.desde) && /^\d{4}-\d{2}-\d{2}$/.test(body.hasta)) {
      const out = {};
      const todos = await this.state.storage.list({ prefix: 'd:' });
      for (const [k, v] of todos) {
        const day = k.slice(2);
        if (day >= body.desde && day <= body.hasta) out[day] = v.c;
      }
      return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response('not_found', { status: 404 });
  }
}

async function handleEvent(request, env, cfg, cors) {
  // Solo desde la app (sitio permitido): evita que cualquiera infle los números con un script suelto
  if (!cors['Access-Control-Allow-Origin']) return json({ error: 'origin_not_allowed' }, 403);
  const body = await readJson(request);
  if (!body || typeof body.e !== 'string' || !EVENTS.has(body.e) || body.e === 'purchase' || body.e === 'refund' || body.e === 'visit_country') return json({ error: 'bad_request' }, 400, cors);
  const book = await loadBook(env, cfg);
  // Sin sitio (por ejemplo, la pantalla de inicio) el evento se cuenta sin sitio, no en el primero de la lista
  const site = siteKey(body.s);
  if (site && !book.ids.has(site)) return json({ error: 'bad_request' }, 400, cors);
  await countEvent(env, body.e, { s: site, p: body.p, l: body.l, m: body.m, k: body.k });
  // País de la visita: lo da Cloudflare en la petición (dos letras). No se guarda la IP ni nada más, solo el contador del país.
  if (body.e === 'app_open') {
    const country = String(request.cf?.country || request.headers.get('CF-IPCountry') || '').toUpperCase();
    if (/^[A-Z]{2}$/.test(country)) await countEvent(env, 'visit_country', { k: country });
  }
  return new Response(null, { status: 204, headers: cors });
}

// ---------------------------------------------------------------------------
// Recorridos anónimos. La app manda UN resumen al cerrarse ("inicio > sala > ficha, 3 audios, 6 minutos").
// No lleva ningún identificador, y aquí tampoco se guarda uno ni la IP: solo se suman contadores por día,
// así que no se puede reconstruir la visita de una persona. Esos contadores se borran solos a los 60 días.
// ---------------------------------------------------------------------------
const SCREENS = new Set(['inicio', 'salas', 'recorridos', 'mapa', 'buscar', 'sala', 'ficha', 'asistente', 'fin_recorrido', 'pase']);
const VISIT_TTL = 60 * 86400;
const visitDayKey = (d = new Date()) => `rc:${d.toISOString().slice(0, 10)}`;
const bucket = (n, cuts) => { for (const c of cuts) if (n <= c) return String(c); return `${cuts[cuts.length - 1]}+`; };

async function handleVisit(request, env, cfg, cors) {
  if (!cors['Access-Control-Allow-Origin']) return json({ error: 'origin_not_allowed' }, 403);
  const b = await readJson(request);
  if (!b || !Array.isArray(b.p) || b.p.length < 1 || b.p.length > 8 || !b.p.every((x) => SCREENS.has(x))) return json({ error: 'bad_request' }, 400, cors);
  const num = (v, max) => (Number.isInteger(v) && v >= 0 ? Math.min(v, max) : 0);
  const book = await loadBook(env, cfg);
  const sites = [...new Set((Array.isArray(b.s) ? b.s : []).map(siteKey).filter((x) => x && book.ids.has(x)))].slice(0, 4);
  const keys = [
    `ruta|${b.p.join('>')}`,
    `entrada|${b.p[0]}`,
    `salida|${b.p[b.p.length - 1]}`,
    `pantallas|${bucket(num(b.n, 99), [1, 2, 3, 5, 8, 12, 20])}`,
    `audios|${bucket(num(b.a, 99), [0, 1, 2, 3, 5, 10])}`,
    `minutos|${bucket(Math.round(num(b.d, 100000) / 60), [1, 3, 5, 10, 20, 40])}`,
    ...sites.map((x) => `sitio|${x}`),
    ...(num(b.a, 99) > 0 ? [`escucha|${bucket(num(b.c, 100), [25, 50, 75, 100])}`] : []),
    ...(b.w === true ? ['vio_pase'] : []),
  ];
  try {
    const dk = visitDayKey();
    const raw = await env.PASES.get(dk);
    const day = raw ? JSON.parse(raw) : { c: {} };
    day.c.visitas = (day.c.visitas || 0) + 1;
    for (const k of keys) {
      if (!(k in day.c) && Object.keys(day.c).length >= DAILY_KEY_LIMIT) day.c._descartados = (day.c._descartados || 0) + 1;
      else day.c[k] = (day.c[k] || 0) + 1;
    }
    await env.PASES.put(dk, JSON.stringify(day), { expirationTtl: VISIT_TTL });
  } catch (e) {
    console.error('recorrido', e && e.message);
  }
  return new Response(null, { status: 204, headers: cors });
}

async function handleVisits(request, env, url, cors) {
  const auth = request.headers.get('Authorization') || '';
  if (!env.STATS_KEY || !timingSafeEqual(auth, `Bearer ${env.STATS_KEY}`)) return json({ error: 'unauthorized' }, 401, cors);
  const days = Math.min(Math.max(parseInt(url.searchParams.get('dias') || '30', 10) || 30, 1), 60);
  const total = {};
  for (let i = 0; i < days; i++) {
    const raw = await env.PASES.get(visitDayKey(new Date(Date.now() - i * 86400_000)));
    if (!raw) continue;
    for (const [k, n] of Object.entries(JSON.parse(raw).c)) total[k] = (total[k] || 0) + n;
  }
  return json({ dias: days, zona: 'UTC', conteos: total }, 200, cors);
}


// ---------------------------------------------------------------------------
// Formulario de contacto y reporte de errores. Guarda el mensaje 90 días (para leerlo en el panel) y, si está
// configurado el envío de correo de Cloudflare, avisa a la dirección de CONTACT_TO. Si el correo falla, el mensaje
// queda guardado igual. Sin cuenta, sin IP: el límite es por día y total (no por persona).
// ---------------------------------------------------------------------------
const CONTACT_TTL = 90 * 86400;
const CONTACT_DAILY_MAX = 60;
const EMAIL_RE = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,200}\.[^\s@<>"]{2,20}$/;

function b64Utf8(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

async function sendContactMail(env, subject, text, replyTo) {
  if (!env.CONTACTO_MAIL || !env.CONTACT_TO) return;
  const { EmailMessage } = await import('cloudflare:email');
  const from = env.CONTACT_FROM || 'formulario@xolotli.com';
  const body = b64Utf8(text).replace(/.{1,76}/g, '$&\r\n').trimEnd();
  const raw = [
    `From: Xolotli <${from}>`,
    `To: ${env.CONTACT_TO}`,
    ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
    `Subject: =?UTF-8?B?${b64Utf8(subject)}?=`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@xolotli.com>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    body,
  ].join('\r\n');
  await env.CONTACTO_MAIL.send(new EmailMessage(from, env.CONTACT_TO, raw));
}

async function handleContact(request, env, cfg, cors) {
  if (!cors['Access-Control-Allow-Origin']) return json({ error: 'origin_not_allowed' }, 403);
  const b = await readJson(request);
  if (!b || typeof b !== 'object') return json({ error: 'bad_request' }, 400, cors);
  // Campo trampa: las personas no lo ven ni lo llenan; si trae algo, es un programa. Se responde "bien" sin guardar.
  if (typeof b.web === 'string' && b.web.trim()) return new Response(null, { status: 204, headers: cors });
  const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
  const message = clean(b.m, 2000);
  if (message.length < 3) return json({ error: 'bad_request' }, 400, cors);
  const reply = clean(b.c, 120);
  if (reply && !EMAIL_RE.test(reply)) return json({ error: 'bad_email' }, 400, cors);
  const kind = b.t === 'error' ? 'error' : 'mensaje';
  const piece = clean(b.p, 80);
  const site = siteKey(b.s);
  const lang = /^[a-z]{2}$/.test(String(b.l || '')) ? b.l : '';
  const day = new Date().toISOString().slice(0, 10);
  try {
    const capKey = `ct:cap:${day}`;
    const n = parseInt((await env.PASES.get(capKey)) || '0', 10) || 0;
    if (n >= CONTACT_DAILY_MAX) return json({ error: 'busy' }, 429, cors);
    await env.PASES.put(capKey, String(n + 1), { expirationTtl: 2 * 86400 });
    const rec = { t: kind, m: message, ...(reply ? { c: reply } : {}), ...(piece ? { p: piece } : {}), ...(site ? { s: site } : {}), ...(lang ? { l: lang } : {}), at: new Date().toISOString() };
    await env.PASES.put(`ct:m:${Date.now()}-${crypto.randomUUID().slice(0, 8)}`, JSON.stringify(rec), { expirationTtl: CONTACT_TTL });
    try {
      const where = [site && `sitio: ${site}`, piece && `parada: ${piece}`, lang && `idioma: ${lang}`].filter(Boolean).join(' · ');
      await sendContactMail(env, `[Xolotli] ${kind === 'error' ? 'Reporte de error' : 'Mensaje'}${piece ? ` (${piece})` : ''}`, `${message}\n\n---\n${where || 'sin detalles'}\n${reply ? `Responder a: ${reply}` : 'Sin correo de respuesta'}\n`, reply);
    } catch (e) {
      console.error('contacto_correo', e && e.message);
    }
  } catch (e) {
    console.error('contacto', e && e.message);
    return json({ error: 'server' }, 500, cors);
  }
  return new Response(null, { status: 204, headers: cors });
}

async function handleMessages(request, env, url, cors) {
  const auth = request.headers.get('Authorization') || '';
  if (!env.STATS_KEY || !timingSafeEqual(auth, `Bearer ${env.STATS_KEY}`)) return json({ error: 'unauthorized' }, 401, cors);
  const out = [];
  let cursor;
  do {
    const page = await env.PASES.list({ prefix: 'ct:m:', cursor, limit: 200 });
    for (const k of page.keys) {
      const raw = await env.PASES.get(k.name);
      if (raw) out.push({ id: k.name.slice(5), ...JSON.parse(raw) });
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor && out.length < 300);
  out.sort((a, b) => (a.at < b.at ? 1 : -1));
  return json({ total: out.length, mensajes: out }, 200, cors);
}

async function handleStats(request, env, url, cors) {
  const auth = request.headers.get('Authorization') || '';
  if (!env.STATS_KEY || !timingSafeEqual(auth, `Bearer ${env.STATS_KEY}`)) return json({ error: 'unauthorized' }, 401, cors);
  const days = Math.min(Math.max(parseInt(url.searchParams.get('dias') || '30', 10) || 30, 1), 400);
  const fechas = [];
  for (let i = 0; i < days; i++) fechas.push(new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10));
  const out = {};
  // Lo contado con el Durable Object (exacto): todos los días de una sola vez
  let exactos = {};
  if (env.CONTADOR) {
    try {
      const res = await contador(env).fetch('https://contador/leer', { method: 'POST', body: JSON.stringify({ desde: fechas[fechas.length - 1], hasta: fechas[0] }) });
      if (res.ok) exactos = await res.json();
    } catch (e) {
      console.error('contador', e && e.message);
    }
  }
  const dias = Object.keys(exactos).sort();
  const primerExacto = dias[0] || '';
  for (const [d, c] of Object.entries(exactos)) out[d] = { ...c };
  // Lo contado antes con KV (aproximado): los días anteriores al Durable Object y el día del cambio, que tiene de los dos
  const pendientes = fechas.filter((d) => !(d in exactos) || d === primerExacto);
  for (let i = 0; i < pendientes.length; i += 25) {
    const lote = await Promise.all(pendientes.slice(i, i + 25).map(async (d) => [d, await env.PASES.get(`ev:${d}`)]));
    for (const [d, raw] of lote) {
      if (!raw) continue;
      const c = JSON.parse(raw).c;
      const destino = out[d] || (out[d] = {});
      for (const [k, n] of Object.entries(c)) destino[k] = (destino[k] || 0) + n;
    }
  }
  return json({ dias: days, zona: 'UTC', exacto: !!env.CONTADOR, conteos: out }, 200, cors);
}

// ---------------------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------------------
async function readJson(request) {
  try {
    const text = await request.text();
    if (text.length > 4000) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// La app manda el id del sitio como viene de sites.json ("MNA"); aquí siempre se compara en minúsculas.
const siteKey = (v) => String(v || '').trim().toLowerCase();

const PROMO_RE = /^[A-Za-z0-9-]{2,40}$/;

/**
 * Busca un código de descuento en Stripe (Promotion Code) y revisa que sirva para este sitio.
 * Los códigos y cupones se crean en el panel de Stripe. Para limitarlo a ciertos museos o sitios se agrega
 * al CÓDIGO el dato (metadata) "sitios" con los ids separados por comas (por ejemplo: mna,otro). Sin ese dato, sirve en cualquier sitio.
 * Solo se aceptan cupones de porcentaje. Devuelve { id, code, percentOff } o { error }.
 */
async function lookupPromo(env, rawCode, siteId) {
  const code = String(rawCode || '').trim();
  if (!PROMO_RE.test(code)) return { error: 'promo_invalid' };
  let list;
  try {
    list = await stripeCall(env, 'GET', `promotion_codes?code=${encodeURIComponent(code)}&active=true&limit=1`);
  } catch (e) {
    console.error('promo', e.message);
    return { error: 'stripe_error' };
  }
  const promo = list?.data?.[0];
  const coupon = promo?.coupon;
  if (!promo || !promo.active || !coupon || coupon.valid === false || typeof coupon.percent_off !== 'number') return { error: 'promo_invalid' };
  const sitios = String(promo.metadata?.sitios || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
  if (sitios.length && !sitios.includes('todos') && !sitios.includes(siteId)) return { error: 'promo_not_for_site' };
  return { id: promo.id, code: String(promo.code || code).toUpperCase(), percentOff: coupon.percent_off };
}

async function handlePromo(request, env, cfg, cors) {
  const body = await readJson(request);
  if (!body) return json({ error: 'bad_request' }, 400, cors);
  const siteId = siteKey(body.siteId);
  if (!(await loadBook(env, cfg)).ids.has(siteId)) return json({ error: 'bad_request' }, 400, cors);
  const r = await lookupPromo(env, body.code, siteId);
  if (r.error) return json({ error: r.error }, r.error === 'stripe_error' ? 502 : 404, cors);
  return json({ code: r.code, percentOff: r.percentOff }, 200, cors);
}

const PASS_NAME = { es: 'Pase de visitante', en: 'Visitor pass', fr: 'Pass visiteur', pl: 'Karnet zwiedzającego', ru: 'Пропуск посетителя', ja: '訪問者パス' };

const usable = (id) => Boolean(id) && !String(id).startsWith('REEMPLAZA');

/**
 * Qué se cobra por el pase de un sitio (o del combo) en ese idioma.
 *  - { inline: { currency, cents, name } }  precio propio del sitio, tomado de la tabla (Stripe lo recibe como precio en línea)
 *  - { priceId }                            el precio general de Stripe (sitio sin precio propio, o sin tabla)
 *  - { error }                              el sitio no se vende (gratis o solo por código) o falta configurar
 * Español cobra en pesos; los demás idiomas en dólares si hay precio en dólares y, si no, en pesos.
 */
function quote(env, book, siteId, lang) {
  const combo = book.table?.combos[siteId];
  const entry = combo || book.table?.sites[siteId];
  if (book.table && entry && (entry.acceso ?? 'pago') !== 'pago') return { error: 'not_for_sale' };
  if (entry && (entry.mxn || entry.usd)) {
    const usd = lang !== 'es' && entry.usd ? entry.usd : null;
    const amount = usd ?? entry.mxn;
    if (amount) {
      const label = combo ? combo.nombre[lang] || combo.nombre.es : entry.nombre;
      return { inline: { currency: usd ? 'usd' : 'mxn', cents: Math.round(amount * 100), name: `${PASS_NAME[lang]} · ${label}` } };
    }
  }
  if (combo || siteId === COMBO) return { error: 'bad_request' };
  const useUsd = lang !== 'es' && usable(env.STRIPE_PRICE_ID_USD);
  const priceId = useUsd ? env.STRIPE_PRICE_ID_USD : env.STRIPE_PRICE_ID_MXN;
  return usable(priceId) ? { priceId } : { error: 'not_configured' };
}

async function handleCheckout(request, env, cfg, cors) {
  const body = await readJson(request);
  if (!body) return json({ error: 'bad_request' }, 400, cors);
  const { deviceId, returnUrl } = body;
  const lang = normalizeLang(body.lang);
  const siteId = siteKey(body.siteId);
  const book = await loadBook(env, cfg);
  if (!book.ids.has(siteId) || !DEVICE_RE.test(String(deviceId || ''))) return json({ error: 'bad_request' }, 400, cors);

  let ret;
  try {
    ret = new URL(String(returnUrl));
  } catch {
    return json({ error: 'bad_return_url' }, 400, cors);
  }
  if (!cfg.origins.includes(ret.origin)) return json({ error: 'bad_return_url' }, 400, cors);
  const base = `${ret.origin}${ret.pathname}`;

  const q = quote(env, book, siteId, lang);
  if (q.error) return json({ error: q.error }, q.error === 'not_configured' ? 503 : 400, cors);

  // Código de descuento (opcional). Si viene y no sirve, se avisa en lugar de cobrar el precio completo sin que la persona lo note.
  let promo = null;
  if (body.promo) {
    promo = await lookupPromo(env, body.promo, siteId);
    if (promo.error) return json({ error: promo.error }, promo.error === 'stripe_error' ? 502 : 404, cors);
  }

  const params = new URLSearchParams();
  params.set('mode', 'payment');
  if (q.inline) {
    params.set('line_items[0][price_data][currency]', q.inline.currency);
    params.set('line_items[0][price_data][unit_amount]', String(q.inline.cents));
    params.set('line_items[0][price_data][product_data][name]', q.inline.name);
  } else {
    params.set('line_items[0][price]', q.priceId);
  }
  params.set('line_items[0][quantity]', '1');
  params.set('success_url', `${base}?pago=ok&session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${base}?pago=cancelado`);
  params.set('locale', STRIPE_LOCALES[lang]);
  params.set('client_reference_id', deviceId);
  params.set('metadata[site_id]', siteId);
  params.set('metadata[device_id]', deviceId);
  if (promo) {
    params.set('discounts[0][promotion_code]', promo.id);
    params.set('metadata[promo]', promo.code);
  }

  try {
    const session = await stripeCall(env, 'POST', 'checkout/sessions', params);
    return json({ url: session.url, sessionId: session.id }, 200, cors);
  } catch (e) {
    console.error('checkout', e.message);
    // Un código que se agotó o venció entre la revisión y el cobro
    if (promo && /promotion|coupon|redeem/i.test(e.message)) return json({ error: 'promo_invalid' }, 404, cors);
    return json({ error: 'stripe_error' }, 502, cors);
  }
}

async function handleRedeem(request, env, cfg, cors) {
  const body = await readJson(request);
  if (!body) return json({ error: 'bad_request' }, 400, cors);
  const { sessionId, deviceId } = body;
  const siteId = siteKey(body.siteId);
  if (!SESSION_RE.test(String(sessionId || '')) || !DEVICE_RE.test(String(deviceId || ''))) return json({ error: 'bad_request' }, 400, cors);

  let session;
  try {
    session = await stripeCall(env, 'GET', `checkout/sessions/${sessionId}`);
  } catch (e) {
    if (e.status === 404 || e.stripe?.code === 'resource_missing') return json({ error: 'session_not_found' }, 404, cors);
    console.error('redeem', e.message);
    return json({ error: 'stripe_error' }, 502, cors);
  }
  if (session.payment_status !== 'paid') return json({ error: 'not_paid' }, 402, cors);
  const site = session.metadata?.site_id;
  const book = await loadBook(env, cfg);
  if (!book.ids.has(site) || (siteId && !covers(book, site, siteId))) return json({ error: 'bad_session' }, 403, cors);

  if (await isRevoked(env, sid12(sessionId))) return json({ error: 'revoked' }, 403, cors);
  let pass = await loadPass(env, sessionId);
  if (!pass) {
    // Una sesión pagada solo se puede canjear por primera vez dentro de sessionDays. Sin este límite, quien conserve el
    // enlace de regreso (historial, captura de pantalla) podría canjearlo otra vez cuando el registro del pase ya no exista.
    const ageSeconds = Date.now() / 1000 - Number(session.created);
    if (!Number.isFinite(ageSeconds) || ageSeconds > cfg.sessionDays * 86400) return json({ error: 'expired' }, 410, cors);
    // Primera vez que se canjea: el pase empieza a contar ahora
    pass = { site, devices: [], createdAt: Date.now(), expiresAt: Date.now() + cfg.hours * 3600_000, code: makeCode() };
    await env.PASES.put(codeKey(pass.code), sessionId, { expirationTtl: cfg.hours * 3600 + 7 * 86400 });
    await savePass(env, cfg, sessionId, pass);
    await countEvent(env, 'purchase', { s: site, k: String(session.currency || '').toLowerCase() });
  }
  const r = await grantAccess(env, cfg, book, sessionId, pass, deviceId);
  return r.error ? json({ error: r.error }, r.status, cors) : json(r.body, 200, cors);
}

// ---------------------------------------------------------------------------
// Códigos de acceso (convenios, hoteles, taquilla, cortesías). Los define Alberto en la hoja CODIGOS de CONTROL;
// el robot de GitHub los publica aquí. Cada uso crea un pase propio (con su código para el segundo dispositivo).
// ---------------------------------------------------------------------------
const ACCESS_CODE_RE = /^[A-Z0-9]{4,24}$/;
const accessKey = (c) => `a:${normalizeCode(c)}`;

/** Canjea un código de acceso. Devuelve { error, status } o { pass, sessionId }. */
async function redeemAccessCode(env, cfg, book, rawCode, siteId, deviceId) {
  const norm = normalizeCode(rawCode);
  if (!ACCESS_CODE_RE.test(norm)) return null;
  const raw = await env.PASES.get(accessKey(norm));
  if (!raw) return null;
  const acc = JSON.parse(raw);
  if (siteId && !covers(book, acc.site, siteId)) return { error: 'code_not_found', status: 404 };
  if (acc.expiresAt && acc.expiresAt <= Date.now()) return { error: 'code_expired', status: 410 };

  // El mismo dispositivo que vuelve a escribir el código recupera su pase (no gasta otro uso)
  const again = await env.PASES.get(`ad:${norm}:${deviceId}`);
  const known = again ? await loadPass(env, again) : null;
  if (known) return { pass: known, sessionId: again };

  if (acc.maxUses && (acc.uses || 0) >= acc.maxUses) return { error: 'code_exhausted', status: 410 };
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const sessionId = `acc_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
  const hours = acc.hours || cfg.hours;
  const pass = { site: acc.site, devices: [], createdAt: Date.now(), expiresAt: Date.now() + hours * 3600_000, code: makeCode(), via: 'codigo' };
  await env.PASES.put(codeKey(pass.code), sessionId, { expirationTtl: hours * 3600 + 7 * 86400 });
  await savePass(env, cfg, sessionId, pass);
  await env.PASES.put(`ad:${norm}:${deviceId}`, sessionId, { expirationTtl: hours * 3600 + 7 * 86400 });
  acc.uses = (acc.uses || 0) + 1;
  await env.PASES.put(accessKey(norm), JSON.stringify(acc));
  await countEvent(env, 'code_redeem', { s: acc.site });
  return { pass, sessionId };
}

// Freno a quien prueba códigos al azar: máximo 15 intentos fallidos por hora desde la misma conexión
const CODE_FAIL_LIMIT = 15;
const failKey = (request) => `rl:${request.headers.get('CF-Connecting-IP') || 'x'}:${Math.floor(Date.now() / 3600000)}`;
async function codeFails(env, request) {
  return Number((await env.PASES.get(failKey(request))) || 0);
}
async function noteCodeFail(env, request) {
  try {
    await env.PASES.put(failKey(request), String((await codeFails(env, request)) + 1), { expirationTtl: 3700 });
  } catch {
    /* sin contador: no se bloquea a nadie por un fallo del almacén */
  }
}

async function handleCode(request, env, cfg, cors) {
  const body = await readJson(request);
  if (!body) return json({ error: 'bad_request' }, 400, cors);
  if ((await codeFails(env, request)) >= CODE_FAIL_LIMIT) return json({ error: 'too_many_attempts' }, 429, cors);
  const { code, deviceId } = body;
  const siteId = siteKey(body.siteId);
  if (!DEVICE_RE.test(String(deviceId || ''))) return json({ error: 'bad_request' }, 400, cors);
  const norm = normalizeCode(code);
  if (norm.length < 4 || norm.length > 24) return json({ error: 'bad_request' }, 400, cors);

  const book = await loadBook(env, cfg);
  let sessionId = norm.length === 8 ? await env.PASES.get(codeKey(code)) : null;
  let pass = sessionId ? await loadPass(env, sessionId) : null;
  if (pass && siteId && !covers(book, pass.site, siteId)) {
    await noteCodeFail(env, request);
    return json({ error: 'code_not_found' }, 404, cors);
  }
  if (!pass) {
    // No es el código de un pase comprado: puede ser un código de acceso
    const r = await redeemAccessCode(env, cfg, book, code, siteId, deviceId);
    if (!r) {
      await noteCodeFail(env, request);
      return json({ error: 'code_not_found' }, 404, cors);
    }
    if (r.error) {
      if (r.status === 404) await noteCodeFail(env, request);
      return json({ error: r.error }, r.status, cors);
    }
    ({ pass, sessionId } = r);
  }
  const r = await grantAccess(env, cfg, book, sessionId, pass, deviceId);
  return r.error ? json({ error: r.error }, r.status, cors) : json(r.body, 200, cors);
}

/** El robot de GitHub publica aquí los códigos de la hoja CODIGOS. Solo con la clave CODES_KEY. */
async function handleAdminCodes(request, env, cors) {
  const auth = request.headers.get('Authorization') || '';
  if (!env.CODES_KEY) return json({ error: 'not_configured' }, 503, cors);
  if (!timingSafeEqual(auth, `Bearer ${env.CODES_KEY}`)) return json({ error: 'unauthorized' }, 401, cors);
  let body;
  try {
    const text = await request.text();
    if (text.length > 200_000) return json({ error: 'bad_request' }, 400, cors);
    body = JSON.parse(text);
  } catch {
    return json({ error: 'bad_request' }, 400, cors);
  }
  const book = await loadBook(env, settings(env));
  const result = { saved: 0, removed: 0, rejected: [] };
  for (const c of Array.isArray(body?.codes) ? body.codes.slice(0, 500) : []) {
    const norm = normalizeCode(c?.code);
    const site = siteKey(c?.site);
    if (!ACCESS_CODE_RE.test(norm) || !book.ids.has(site)) {
      result.rejected.push(String(c?.code || '').slice(0, 24));
      continue;
    }
    const key = accessKey(norm);
    if (c.active === false) {
      await env.PASES.delete?.(key);
      result.removed++;
      continue;
    }
    const prev = JSON.parse((await env.PASES.get(key)) || 'null');
    const num = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Math.floor(Number(v)) : 0);
    const expiresAt = c.expires ? Date.parse(`${String(c.expires).slice(0, 10)}T23:59:59-06:00`) : 0;
    const vence = Number.isFinite(expiresAt) ? expiresAt : 0;
    // Un código con fecha de vencimiento se borra solo del almacén una semana después de vencer (KV pide al menos 60 s)
    const ttl = vence ? Math.max(60, Math.ceil((vence - Date.now()) / 1000) + 7 * 86400) : 0;
    await env.PASES.put(key, JSON.stringify({ site, hours: Math.min(num(c.hours), 24 * 30) || 0, maxUses: num(c.uses), expiresAt: vence, uses: prev?.uses || 0 }), ttl ? { expirationTtl: ttl } : undefined);
    result.saved++;
  }
  return json(result, 200, cors);
}

async function handleStatus(request, env, cors) {
  const body = await readJson(request);
  const payload = body ? await verifyToken(body.token, env.TOKEN_SECRET) : null;
  if (payload && (await isRevoked(env, payload.sid))) return json({ valid: false, revoked: true }, 200, cors);
  return payload ? json({ valid: true, expiresAt: payload.exp, site: payload.site }, 200, cors) : json({ valid: false }, 200, cors);
}

const toPrices = (e) => ({
  ...(e?.mxn ? { mxn: { amount: e.mxn, currency: 'mxn' } } : {}),
  ...(e?.usd ? { usd: { amount: e.usd, currency: 'usd' } } : {}),
});

async function handleConfig(env, cfg, cors, url) {
  if (cfg.free) return json({ free: true, prices: {}, passHours: cfg.hours, maxDevices: cfg.maxDevices }, 200, { ...cors, 'Cache-Control': 'no-store' });
  const book = await loadBook(env, cfg);
  const siteId = siteKey(url.searchParams.get('site'));
  const site = book.table ? book.table.sites[siteId] : null;
  // Pases combinados que abren este sitio (todos, si no se pidió uno)
  const combos = Object.entries(book.table?.combos || {})
    .filter(([id]) => !siteId || coversSite(book.table, id, siteId))
    .map(([id, c]) => ({ id, name: c.nombre, sites: c.sitios, prices: toPrices(c) }));
  let prices = toPrices(site);
  // Sitio sin precio propio (o sin tabla): el precio general de Stripe
  if (!prices.mxn) {
    try {
      prices = await getPrices(env);
    } catch (e) {
      console.error('config', e.message);
      return json({ error: 'stripe_error' }, 502, cors);
    }
  }
  return json({ prices, access: site?.acceso || 'pago', ...(combos.length ? { combos } : {}), passHours: cfg.hours, maxDevices: cfg.maxDevices }, 200, { ...cors, 'Cache-Control': 'public, max-age=300' });
}

/**
 * Interpreta "Range: bytes=a-b" / "bytes=a-" / "bytes=-n" para un archivo de `size` bytes.
 * Devuelve null si no hay Range válido de un solo tramo (se manda el archivo completo),
 * { unsatisfiable: true } si el tramo cae fuera del archivo, o { start, end } (ambos incluidos).
 */
export function parseRange(header, size) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(String(header || '').trim());
  if (!m || (m[1] === '' && m[2] === '')) return null;
  if (size <= 0) return { unsatisfiable: true };
  let start;
  let end;
  if (m[1] === '') {
    // bytes=-n → los últimos n bytes
    const n = parseInt(m[2], 10);
    if (n === 0) return { unsatisfiable: true };
    start = Math.max(0, size - n);
    end = size - 1;
  } else {
    start = parseInt(m[1], 10);
    end = m[2] === '' ? size - 1 : Math.min(parseInt(m[2], 10), size - 1);
    if (start >= size || end < start) return { unsatisfiable: true };
  }
  return { start, end };
}

async function handleAudio(request, env, cfg, cors, url) {
  const m = url.pathname.match(AUDIO_RE);
  if (!m) return new Response('No encontrado', { status: 404, headers: cors });
  const premium = m[1] === 'pago';
  if (premium && !cfg.free) {
    const book = await loadBook(env, cfg);
    // Un sitio marcado como gratis entrega también sus audios "de pago" sin clave
    if (!isFreeSite(book, siteForPiece(book.table, m[3]))) {
      const payload = await verifyToken(url.searchParams.get('t'), env.TOKEN_SECRET);
      if (!tokenAllowsPiece(book, payload, m[3]) || (await isRevoked(env, payload.sid))) return new Response('Sin acceso', { status: 401, headers: cors });
    }
  }

  const key = `${m[1]}/${m[2]}/${m[3]}_${m[4]}.mp3`;
  // Primero se pide solo la ficha del archivo (tamaño): así el tramo pedido se calcula aquí y no depende de cómo lo interprete R2
  const info = await env.AUDIO.head(key);
  if (!info) return new Response('No encontrado', { status: 404, headers: cors });

  const headers = new Headers(cors);
  headers.set('Content-Type', 'audio/mpeg');
  headers.set('Accept-Ranges', 'bytes');
  // Libres: cualquiera puede guardarlos (también las redes de entrega). De pago: solo el navegador, ningún intermediario debe compartirlos
  headers.set('Cache-Control', premium ? 'private, max-age=3600' : 'public, max-age=86400');
  if (info.httpEtag) headers.set('ETag', info.httpEtag);

  const range = parseRange(request.headers.get('Range'), info.size);
  if (range?.unsatisfiable) {
    headers.set('Content-Range', `bytes */${info.size}`);
    return new Response(null, { status: 416, headers });
  }
  if (request.method === 'HEAD') {
    headers.set('Content-Length', String(info.size));
    return new Response(null, { status: 200, headers });
  }

  const object = await env.AUDIO.get(key, range ? { range: { offset: range.start, length: range.end - range.start + 1 } } : undefined);
  if (!object) return new Response('No encontrado', { status: 404, headers: cors });
  if (range) {
    headers.set('Content-Range', `bytes ${range.start}-${range.end}/${info.size}`);
    headers.set('Content-Length', String(range.end - range.start + 1));
    return new Response(object.body, { status: 206, headers });
  }
  headers.set('Content-Length', String(info.size));
  return new Response(object.body, { status: 200, headers });
}


/** Textos de pago de un idioma (un solo archivo con todas las piezas). Solo con una clave vigente y no cancelada. */
async function handleText(request, env, cfg, cors, url) {
  const m = url.pathname.match(TEXT_RE);
  if (!m) return new Response('No encontrado', { status: 404, headers: cors });
  // Qué sitios puede leer quien pide: todos (modo de pruebas o pase combinado), uno solo (su pase) o el de un sitio gratis
  let scope = COMBO;
  const book = await loadBook(env, cfg);
  if (!cfg.free) {
    const payload = await verifyToken(url.searchParams.get('t'), env.TOKEN_SECRET);
    if (payload && (payload.site === COMBO || book.ids.has(payload.site)) && !(await isRevoked(env, payload.sid))) {
      scope = payload.site;
    } else {
      const free = siteKey(url.searchParams.get('site'));
      if (!isFreeSite(book, free)) return new Response('Sin acceso', { status: 401, headers: cors });
      scope = free;
    }
  }
  // Qué sitios entrega: los que abre el pase (todos, si es "todos" o el modo de pruebas). Con ?site= se pide solo uno de ellos, para no bajar de más
  const asked = siteKey(url.searchParams.get('site'));
  const opens = coverageOf(book.table, scope);
  const everything = opens[0] === COMBO;
  let only = everything ? null : opens;
  if (asked && book.table?.sites[asked] && (everything || opens.includes(asked))) only = [asked];
  const tag = only ? only.join('+') : '';
  const object = await env.AUDIO.get(`texto/${m[1]}.json`);
  if (!object) return new Response('No encontrado', { status: 404, headers: cors });
  const headers = new Headers(cors);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  // Solo el navegador de quien pagó lo guarda (para usarlo sin internet); ninguna red intermedia debe compartirlo
  headers.set('Cache-Control', 'private, max-age=300');
  const etag = object.httpEtag ? (!tag ? object.httpEtag : `${object.httpEtag.replace(/"$/, '')}-${tag}"`) : '';
  if (etag) headers.set('ETag', etag);
  if (etag && request.headers.get('If-None-Match') === etag) return new Response(null, { status: 304, headers });
  if (request.method === 'HEAD') return new Response(null, { status: 200, headers });
  // Con un pase que no abre todo, solo salen los textos de las piezas de sus sitios
  if (!only || !book.table) return new Response(object.body, { status: 200, headers });
  let data;
  try {
    data = JSON.parse(await object.text());
  } catch {
    return new Response('No encontrado', { status: 404, headers: cors });
  }
  const pieces = {};
  for (const [id, value] of Object.entries(data?.pieces || {})) if (only.includes(siteForPiece(book.table, id))) pieces[id] = value;
  return new Response(JSON.stringify({ ...data, pieces }), { status: 200, headers });
}

// ---------------------------------------------------------------------------
export default {
  async fetch(request, env) {
    const cfg = settings(env);
    const url = new URL(request.url);
    const cors = corsHeaders(request, cfg);
    const origin = request.headers.get('Origin');

    try {
      if (request.method === 'OPTIONS') {
        return origin && cors['Access-Control-Allow-Origin'] ? new Response(null, { status: 204, headers: cors }) : new Response(null, { status: 403 });
      }
      // Los navegadores de otros sitios no pueden usar este servidor (los audios con clave se piden sin Origin: la clave los protege)
      if (request.method === 'POST' && origin && !cors['Access-Control-Allow-Origin']) return json({ error: 'origin_not_allowed' }, 403);

      if (url.pathname === '/estadisticas' && request.method === 'GET') return handleStats(request, env, url, cors);
      if (url.pathname === '/mensajes' && request.method === 'GET') return handleMessages(request, env, url, cors);
      if (url.pathname === '/recorridos' && request.method === 'GET') return handleVisits(request, env, url, cors);
      if (url.pathname === '/health') return json({ ok: true }, 200, cors);
      if (url.pathname === '/config' && request.method === 'GET') return handleConfig(env, cfg, cors, url);
      if (url.pathname === '/admin/codigos' && request.method === 'POST') return handleAdminCodes(request, env, cors);
      if (url.pathname.startsWith('/texto/') && (request.method === 'GET' || request.method === 'HEAD')) return handleText(request, env, cfg, cors, url);
      if (url.pathname.startsWith('/audio/') && (request.method === 'GET' || request.method === 'HEAD')) return handleAudio(request, env, cfg, cors, url);
      if (request.method === 'POST' && url.pathname === '/stripe-webhook') return handleStripeWebhook(request, env, cfg, cors);
      if (request.method === 'POST' && url.pathname === '/evento') return handleEvent(request, env, cfg, cors);
      if (request.method === 'POST' && url.pathname === '/contacto') return handleContact(request, env, cfg, cors);
      if (request.method === 'POST' && url.pathname === '/recorrido') return handleVisit(request, env, cfg, cors);
      if (request.method === 'POST') {
        if (!env.TOKEN_SECRET || !env.STRIPE_SECRET_KEY) return json({ error: 'not_configured' }, 503, cors);
        if (url.pathname === '/checkout') return handleCheckout(request, env, cfg, cors);
        if (url.pathname === '/promo') return handlePromo(request, env, cfg, cors);
        if (url.pathname === '/redeem') return handleRedeem(request, env, cfg, cors);
        if (url.pathname === '/code') return handleCode(request, env, cfg, cors);
        if (url.pathname === '/status') return handleStatus(request, env, cors);
      }
      return json({ error: 'not_found' }, 404, cors);
    } catch (e) {
      console.error('error', e && e.message);
      return json({ error: 'server_error' }, 500, cors);
    }
  },
};
