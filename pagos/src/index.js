// Servidor de pagos y de audios de pago de Audioguías México (Cloudflare Worker).
//
//   POST /checkout   crea una sesión de pago de Stripe y devuelve la dirección a donde mandar al visitante
//   POST /redeem     el visitante regresó de pagar: se confirma con Stripe y se le da una clave de acceso
//   POST /code       un segundo dispositivo entra con el código corto del pase
//   POST /status     revisa si una clave sigue vigente
//   GET  /config     precios reales (los lee de Stripe) y reglas del pase
//   GET  /audio/<idioma>/<pieza>_<modo>.mp3?t=<clave>   audios de pago (solo con clave vigente)
//
// Nada del dinero pasa por aquí: el pago ocurre en la página de Stripe. Este servidor solo pregunta a Stripe
// "¿esta sesión está pagada?" con la clave secreta, y entrega una clave firmada que dura lo que dura el pase.

import { signToken, verifyToken } from './token.js';

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sin 0, O, 1, I, L para que no se confundan al dictarlo
const SESSION_RE = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/;
const DEVICE_RE = /^[A-Za-z0-9_-]{6,64}$/;
const AUDIO_RE = /^\/audio\/(es|en|fr|pl|ru|ja)\/([A-Za-z0-9_-]+)_(corto|largo)\.mp3$/;
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
  };
}

function corsHeaders(request, cfg) {
  const origin = request.headers.get('Origin');
  const h = { Vary: 'Origin' };
  if (origin && cfg.origins.includes(origin)) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Access-Control-Allow-Methods'] = 'GET, POST, HEAD, OPTIONS';
    h['Access-Control-Allow-Headers'] = 'Content-Type, Range';
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
  const ttl = cfg.sessionDays * 86400 + cfg.hours * 3600 + 86400;
  await env.PASES.put(`s:${sessionId}`, JSON.stringify(pass), { expirationTtl: ttl });
}

/** Agrega el dispositivo al pase (si cabe) y devuelve la respuesta con la clave. */
async function grantAccess(env, cfg, sessionId, pass, deviceId) {
  const now = Date.now();
  if (pass.expiresAt <= now) return { error: 'expired', status: 410 };
  if (!pass.devices.includes(deviceId)) {
    if (pass.devices.length >= cfg.maxDevices) return { error: 'device_limit', status: 403 };
    pass.devices.push(deviceId);
    await savePass(env, cfg, sessionId, pass);
  }
  const token = await signToken({ sid: sessionId.slice(-12), site: pass.site, dev: deviceId, exp: pass.expiresAt }, env.TOKEN_SECRET);
  return {
    status: 200,
    body: { token, site: pass.site, expiresAt: pass.expiresAt, code: pass.code, devices: pass.devices.length, maxDevices: cfg.maxDevices },
  };
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

async function handleCheckout(request, env, cfg, cors) {
  const body = await readJson(request);
  if (!body) return json({ error: 'bad_request' }, 400, cors);
  const { deviceId, returnUrl } = body;
  const lang = normalizeLang(body.lang);
  const siteId = siteKey(body.siteId);
  if (!cfg.sites.includes(siteId) || !DEVICE_RE.test(String(deviceId || ''))) return json({ error: 'bad_request' }, 400, cors);

  let ret;
  try {
    ret = new URL(String(returnUrl));
  } catch {
    return json({ error: 'bad_return_url' }, 400, cors);
  }
  if (!cfg.origins.includes(ret.origin)) return json({ error: 'bad_return_url' }, 400, cors);
  const base = `${ret.origin}${ret.pathname}`;

  // Español: precio en pesos. Otros idiomas: en dólares si hay precio en dólares; si no, el de pesos.
  const useUsd = lang !== 'es' && env.STRIPE_PRICE_ID_USD && !env.STRIPE_PRICE_ID_USD.startsWith('REEMPLAZA');
  const priceId = useUsd ? env.STRIPE_PRICE_ID_USD : env.STRIPE_PRICE_ID_MXN;
  if (!priceId || priceId.startsWith('REEMPLAZA')) return json({ error: 'not_configured' }, 503, cors);

  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('line_items[0][price]', priceId);
  params.set('line_items[0][quantity]', '1');
  params.set('success_url', `${base}?pago=ok&session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${base}?pago=cancelado`);
  params.set('locale', STRIPE_LOCALES[lang]);
  params.set('client_reference_id', deviceId);
  params.set('metadata[site_id]', siteId);
  params.set('metadata[device_id]', deviceId);

  try {
    const session = await stripeCall(env, 'POST', 'checkout/sessions', params);
    return json({ url: session.url, sessionId: session.id }, 200, cors);
  } catch (e) {
    console.error('checkout', e.message);
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
  if (!cfg.sites.includes(site) || (siteId && siteId !== site)) return json({ error: 'bad_session' }, 403, cors);

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
  }
  const r = await grantAccess(env, cfg, sessionId, pass, deviceId);
  return r.error ? json({ error: r.error }, r.status, cors) : json(r.body, 200, cors);
}

async function handleCode(request, env, cfg, cors) {
  const body = await readJson(request);
  if (!body) return json({ error: 'bad_request' }, 400, cors);
  const { code, deviceId } = body;
  const siteId = siteKey(body.siteId);
  if (normalizeCode(code).length !== 8 || !DEVICE_RE.test(String(deviceId || ''))) return json({ error: 'bad_request' }, 400, cors);
  const sessionId = await env.PASES.get(codeKey(code));
  const pass = sessionId ? await loadPass(env, sessionId) : null;
  if (!pass || (siteId && siteId !== pass.site)) return json({ error: 'code_not_found' }, 404, cors);
  const r = await grantAccess(env, cfg, sessionId, pass, deviceId);
  return r.error ? json({ error: r.error }, r.status, cors) : json(r.body, 200, cors);
}

async function handleStatus(request, env, cors) {
  const body = await readJson(request);
  const payload = body ? await verifyToken(body.token, env.TOKEN_SECRET) : null;
  return payload ? json({ valid: true, expiresAt: payload.exp, site: payload.site }, 200, cors) : json({ valid: false }, 200, cors);
}

async function handleConfig(env, cfg, cors) {
  let prices = {};
  try {
    prices = await getPrices(env);
  } catch (e) {
    console.error('config', e.message);
    return json({ error: 'stripe_error' }, 502, cors);
  }
  return json({ prices, passHours: cfg.hours, maxDevices: cfg.maxDevices }, 200, { ...cors, 'Cache-Control': 'public, max-age=300' });
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
  const payload = await verifyToken(url.searchParams.get('t'), env.TOKEN_SECRET);
  if (!payload || !cfg.sites.includes(payload.site)) return new Response('Sin acceso', { status: 401, headers: cors });

  const key = `${m[1]}/${m[2]}_${m[3]}.mp3`;
  // Primero se pide solo la ficha del archivo (tamaño): así el tramo pedido se calcula aquí y no depende de cómo lo interprete R2
  const info = await env.AUDIO.head(key);
  if (!info) return new Response('No encontrado', { status: 404, headers: cors });

  const headers = new Headers(cors);
  headers.set('Content-Type', 'audio/mpeg');
  headers.set('Accept-Ranges', 'bytes');
  // El navegador puede guardarlo para el modo sin conexión, pero ningún intermediario debe compartirlo
  headers.set('Cache-Control', 'private, max-age=3600');
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

      if (url.pathname === '/health') return json({ ok: true }, 200, cors);
      if (url.pathname === '/config' && request.method === 'GET') return handleConfig(env, cfg, cors);
      if (url.pathname.startsWith('/audio/') && (request.method === 'GET' || request.method === 'HEAD')) return handleAudio(request, env, cfg, cors, url);
      if (request.method === 'POST') {
        if (!env.TOKEN_SECRET || !env.STRIPE_SECRET_KEY) return json({ error: 'not_configured' }, 503, cors);
        if (url.pathname === '/checkout') return handleCheckout(request, env, cfg, cors);
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
