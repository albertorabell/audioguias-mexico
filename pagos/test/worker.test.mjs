// Pruebas del servidor de pagos con Stripe, KV y R2 simulados.  Correr:  node --test test/worker.test.mjs
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { signToken, verifyToken } from '../src/token.js';

const ORIGIN = 'https://albertorabell.github.io';
const API = 'https://pagos.example.workers.dev';
const SECRET = 'secreto-de-prueba-muy-largo-1234567890';

// ---- KV simulado ----
class FakeKV {
  constructor() { this.m = new Map(); }
  async get(k) { return this.m.has(k) ? this.m.get(k) : null; }
  async put(k, v, opts) { this.m.set(k, v); this.lastTtl = opts?.expirationTtl; }
}

// ---- R2 simulado (con soporte de Range) ----
class FakeR2 {
  constructor(files) { this.files = files; }
  async head(key) { const b = this.files[key]; return b ? { size: b.length, httpEtag: '"e1"' } : null; }
  async get(key, opts) {
    const b = this.files[key];
    if (!b) return null;
    let offset = 0, length = b.length;
    if (opts?.range) {
      if (!Number.isInteger(opts.range.offset) || !Number.isInteger(opts.range.length)) throw new Error('R2 simulado: el tramo debe ser { offset, length }');
      offset = opts.range.offset;
      length = opts.range.length;
      if (offset < 0 || length < 1 || offset + length > b.length) throw new Error('R2 simulado: tramo fuera del archivo');
    }
    const slice = b.subarray(offset, offset + length);
    return { size: b.length, httpEtag: '"e1"', body: new ReadableStream({ start(c) { c.enqueue(slice); c.close(); } }) };
  }
}

let env, stripeCalls, stripeSessions, realFetch;

beforeEach(() => {
  env = {
    ALLOWED_ORIGINS: ORIGIN,
    SITE_IDS: 'mna',
    PASS_HOURS: '72',
    MAX_DEVICES: '2',
    STRIPE_PRICE_ID_MXN: 'price_mxn_1',
    STRIPE_PRICE_ID_USD: 'price_usd_1',
    STRIPE_SECRET_KEY: 'sk_test_x',
    TOKEN_SECRET: SECRET,
    PASES: new FakeKV(),
    AUDIO: new FakeR2({ 'es/p01_corto.mp3': Buffer.from('0123456789ABCDEFGHIJ') }),
  };
  stripeCalls = [];
  const now = Math.floor(Date.now() / 1000);
  stripeSessions = {
    cs_test_PAGADA123456: { id: 'cs_test_PAGADA123456', payment_status: 'paid', created: now, metadata: { site_id: 'mna' } },
    cs_test_SINPAGAR12345: { id: 'cs_test_SINPAGAR12345', payment_status: 'unpaid', created: now, metadata: { site_id: 'mna' } },
    cs_test_OTROSITIO1234: { id: 'cs_test_OTROSITIO1234', payment_status: 'paid', created: now, metadata: { site_id: 'otro' } },
    cs_test_VIEJA12345678: { id: 'cs_test_VIEJA12345678', payment_status: 'paid', created: now - 40 * 86400, metadata: { site_id: 'mna' } },
  };
  realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const u = String(url);
    stripeCalls.push({ url: u, method: init.method || 'GET', body: init.body ? String(init.body) : '', auth: init.headers?.Authorization });
    const ok = (b) => new Response(JSON.stringify(b), { status: 200 });
    if (u.endsWith('/v1/checkout/sessions') && init.method === 'POST') return ok({ id: 'cs_test_NUEVA1234567', url: 'https://checkout.stripe.com/c/pay/cs_test_NUEVA1234567' });
    const m = u.match(/\/v1\/checkout\/sessions\/(.+)$/);
    if (m) return stripeSessions[m[1]] ? ok(stripeSessions[m[1]]) : new Response(JSON.stringify({ error: { code: 'resource_missing', message: 'No such session' } }), { status: 404 });
    const p = u.match(/\/v1\/prices\/(.+)$/);
    if (p) return ok(p[1] === 'price_mxn_1' ? { unit_amount: 7900, currency: 'mxn' } : { unit_amount: 499, currency: 'usd' });
    throw new Error('llamada inesperada: ' + u);
  };
});

const call = (path, { method = 'POST', body, origin = ORIGIN, headers = {} } = {}) =>
  worker.fetch(
    new Request(API + path, { method, headers: { ...(origin ? { Origin: origin } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined }),
    env
  );

const DEV1 = 'dev_aaaaaa111';
const DEV2 = 'dev_bbbbbb222';
const DEV3 = 'dev_cccccc333';

test('token: firma válida, manipulada y vencida', async () => {
  const t = await signToken({ site: 'mna', dev: 'x', exp: Date.now() + 1000 }, SECRET);
  assert.equal((await verifyToken(t, SECRET)).site, 'mna');
  assert.equal(await verifyToken(t, 'otro-secreto'), null);
  const [body, sig] = t.split('.');
  const forged = Buffer.from(JSON.stringify({ site: 'mna', dev: 'x', exp: Date.now() + 9e9 })).toString('base64url');
  assert.equal(await verifyToken(`${forged}.${sig}`, SECRET), null);
  assert.equal(await verifyToken(`${body}.`, SECRET), null);
  const old = await signToken({ site: 'mna', dev: 'x', exp: Date.now() - 1 }, SECRET);
  assert.equal(await verifyToken(old, SECRET), null);
  assert.equal(await verifyToken('basura', SECRET), null);
});

test('/checkout crea la sesión de Stripe con los datos correctos (español → pesos)', async () => {
  const r = await call('/checkout', { body: { siteId: 'mna', lang: 'es', deviceId: DEV1, returnUrl: `${ORIGIN}/audioguias-mexico/#/algo` } });
  assert.equal(r.status, 200);
  const data = await r.json();
  assert.match(data.url, /^https:\/\/checkout\.stripe\.com\//);
  const call0 = stripeCalls[0];
  assert.equal(call0.auth, 'Bearer sk_test_x');
  const p = new URLSearchParams(call0.body);
  assert.equal(p.get('mode'), 'payment');
  assert.equal(p.get('line_items[0][price]'), 'price_mxn_1');
  assert.equal(p.get('success_url'), `${ORIGIN}/audioguias-mexico/?pago=ok&session_id={CHECKOUT_SESSION_ID}`);
  assert.equal(p.get('cancel_url'), `${ORIGIN}/audioguias-mexico/?pago=cancelado`);
  assert.equal(p.get('locale'), 'es-419');
  assert.equal(p.get('metadata[site_id]'), 'mna');
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), ORIGIN);
});

test('/checkout: inglés usa el precio en dólares; sin precio en dólares usa pesos', async () => {
  await call('/checkout', { body: { siteId: 'mna', lang: 'en', deviceId: DEV1, returnUrl: `${ORIGIN}/audioguias-mexico/` } });
  assert.equal(new URLSearchParams(stripeCalls[0].body).get('line_items[0][price]'), 'price_usd_1');
  assert.equal(new URLSearchParams(stripeCalls[0].body).get('locale'), 'en');
  env.STRIPE_PRICE_ID_USD = '';
  stripeCalls.length = 0;
  await call('/checkout', { body: { siteId: 'mna', lang: 'en', deviceId: DEV1, returnUrl: `${ORIGIN}/audioguias-mexico/` } });
  assert.equal(new URLSearchParams(stripeCalls[0].body).get('line_items[0][price]'), 'price_mxn_1');
});

test('el id del sitio llega como en sites.json ("MNA") y se acepta igual que "mna"', async () => {
  const r = await call('/checkout', { body: { siteId: 'MNA', lang: 'es', deviceId: DEV1, returnUrl: `${ORIGIN}/audioguias-mexico/` } });
  assert.equal(r.status, 200);
  assert.equal(new URLSearchParams(stripeCalls[stripeCalls.length - 1].body).get('metadata[site_id]'), 'mna');
  const red = await call('/redeem', { body: { sessionId: 'cs_test_PAGADA123456', deviceId: DEV1, siteId: 'MNA' } });
  assert.equal(red.status, 200);
  const a = await red.json();
  assert.equal(a.site, 'mna');
  assert.equal((await call('/code', { body: { code: a.code, deviceId: DEV2, siteId: 'MNA' } })).status, 200);
});

test('/checkout rechaza datos inválidos, sitios desconocidos y direcciones de regreso ajenas', async () => {
  const good = { siteId: 'mna', lang: 'es', deviceId: DEV1, returnUrl: `${ORIGIN}/x/` };
  assert.equal((await call('/checkout', { body: { ...good, siteId: 'otro' } })).status, 400);
  assert.equal((await call('/checkout', { body: { ...good, deviceId: 'a b' } })).status, 400);
  assert.equal((await call('/checkout', { body: { ...good, returnUrl: 'https://malo.example/x' } })).status, 400);
  assert.equal((await call('/checkout', { body: { ...good, returnUrl: 'no es url' } })).status, 400);
  assert.equal(stripeCalls.length, 0, 'no debe llamar a Stripe con datos inválidos');
});

test('/checkout sin precio configurado responde 503', async () => {
  env.STRIPE_PRICE_ID_MXN = 'REEMPLAZA_CON_TU_PRICE_ID_EN_PESOS';
  const r = await call('/checkout', { body: { siteId: 'mna', lang: 'es', deviceId: DEV1, returnUrl: `${ORIGIN}/x/` } });
  assert.equal(r.status, 503);
});

test('origen no permitido: POST bloqueado y preflight rechazado', async () => {
  const r = await call('/checkout', { origin: 'https://malo.example', body: { siteId: 'mna', deviceId: DEV1, returnUrl: `${ORIGIN}/x/` } });
  assert.equal(r.status, 403);
  const pre = await call('/redeem', { method: 'OPTIONS', origin: 'https://malo.example' });
  assert.equal(pre.status, 403);
  const ok = await call('/redeem', { method: 'OPTIONS' });
  assert.equal(ok.status, 204);
  assert.equal(ok.headers.get('Access-Control-Allow-Origin'), ORIGIN);
});

test('/redeem: pago confirmado entrega clave, código y vencimiento a 72 horas', async () => {
  const before = Date.now();
  const r = await call('/redeem', { body: { sessionId: 'cs_test_PAGADA123456', deviceId: DEV1 } });
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.match(d.code, /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  assert.ok(Math.abs(d.expiresAt - (before + 72 * 3600_000)) < 5000);
  assert.equal(d.devices, 1);
  assert.equal(d.maxDevices, 2);
  assert.equal(d.site, 'mna');
  const payload = await verifyToken(d.token, SECRET);
  assert.equal(payload.site, 'mna');
  assert.equal(payload.dev, DEV1);
  assert.equal(payload.exp, d.expiresAt);
});

test('/redeem: no pagado, sesión inexistente, otro sitio o formato inválido', async () => {
  assert.equal((await call('/redeem', { body: { sessionId: 'cs_test_SINPAGAR12345', deviceId: DEV1 } })).status, 402);
  assert.equal((await call('/redeem', { body: { sessionId: 'cs_test_NOEXISTE12345', deviceId: DEV1 } })).status, 404);
  assert.equal((await call('/redeem', { body: { sessionId: 'cs_test_OTROSITIO1234', deviceId: DEV1 } })).status, 403);
  assert.equal((await call('/redeem', { body: { sessionId: '../../etc', deviceId: DEV1 } })).status, 400);
});

test('/redeem: canjear de nuevo en el mismo dispositivo no cambia el vencimiento ni gasta un lugar', async () => {
  const a = await (await call('/redeem', { body: { sessionId: 'cs_test_PAGADA123456', deviceId: DEV1 } })).json();
  const b = await (await call('/redeem', { body: { sessionId: 'cs_test_PAGADA123456', deviceId: DEV1 } })).json();
  assert.equal(a.expiresAt, b.expiresAt);
  assert.equal(a.code, b.code);
  assert.equal(b.devices, 1);
});

test('límite de 2 dispositivos: el segundo entra con el código, el tercero no', async () => {
  const a = await (await call('/redeem', { body: { sessionId: 'cs_test_PAGADA123456', deviceId: DEV1 } })).json();
  const second = await call('/code', { body: { code: a.code.toLowerCase().replace('-', ' '), deviceId: DEV2 } });
  assert.equal(second.status, 200);
  const s = await second.json();
  assert.equal(s.devices, 2);
  assert.equal(s.expiresAt, a.expiresAt);
  const third = await call('/code', { body: { code: a.code, deviceId: DEV3 } });
  assert.equal(third.status, 403);
  assert.equal((await third.json()).error, 'device_limit');
  // y el tercero tampoco puede canjear el id de sesión
  assert.equal((await call('/redeem', { body: { sessionId: 'cs_test_PAGADA123456', deviceId: DEV3 } })).status, 403);
  // pero el segundo dispositivo puede volver a entrar
  assert.equal((await call('/code', { body: { code: a.code, deviceId: DEV2 } })).status, 200);
});

test('si el cliente pide un sitio distinto al del pago, se rechaza', async () => {
  env.SITE_IDS = 'mna,otro';
  assert.equal((await call('/redeem', { body: { sessionId: 'cs_test_PAGADA123456', deviceId: DEV1, siteId: 'otro' } })).status, 403);
  const a = await (await call('/redeem', { body: { sessionId: 'cs_test_PAGADA123456', deviceId: DEV1, siteId: 'mna' } })).json();
  assert.equal((await call('/code', { body: { code: a.code, deviceId: DEV2, siteId: 'otro' } })).status, 404);
  assert.equal((await call('/code', { body: { code: a.code, deviceId: DEV2, siteId: 'mna' } })).status, 200);
});

test('/code: código inexistente o mal formado', async () => {
  assert.equal((await call('/code', { body: { code: 'AAAA-BBBB', deviceId: DEV1 } })).status, 404);
  assert.equal((await call('/code', { body: { code: '123', deviceId: DEV1 } })).status, 400);
});

test('pase vencido: no se puede entrar con el código', async () => {
  const a = await (await call('/redeem', { body: { sessionId: 'cs_test_PAGADA123456', deviceId: DEV1 } })).json();
  const key = 's:cs_test_PAGADA123456';
  const pass = JSON.parse(await env.PASES.get(key));
  pass.expiresAt = Date.now() - 1000;
  await env.PASES.put(key, JSON.stringify(pass));
  const r = await call('/code', { body: { code: a.code, deviceId: DEV2 } });
  assert.equal(r.status, 410);
});

test('/status confirma claves vigentes y rechaza falsas', async () => {
  const a = await (await call('/redeem', { body: { sessionId: 'cs_test_PAGADA123456', deviceId: DEV1 } })).json();
  assert.equal((await (await call('/status', { body: { token: a.token } })).json()).valid, true);
  assert.equal((await (await call('/status', { body: { token: a.token + 'x' } })).json()).valid, false);
});

test('/config lee los precios reales de Stripe', async () => {
  const r = await call('/config', { method: 'GET' });
  const d = await r.json();
  assert.deepEqual(d.prices.mxn, { amount: 79, currency: 'mxn' });
  assert.deepEqual(d.prices.usd, { amount: 4.99, currency: 'usd' });
  assert.equal(d.passHours, 72);
  assert.equal(d.maxDevices, 2);
});

test('/audio: sin clave o con clave falsa → 401; con clave → MP3', async () => {
  const none = await call('/audio/es/p01_corto.mp3', { method: 'GET', origin: null });
  assert.equal(none.status, 401);
  const fake = await call('/audio/es/p01_corto.mp3?t=basura', { method: 'GET', origin: null });
  assert.equal(fake.status, 401);

  const a = await (await call('/redeem', { body: { sessionId: 'cs_test_PAGADA123456', deviceId: DEV1 } })).json();
  const ok = await call(`/audio/es/p01_corto.mp3?t=${encodeURIComponent(a.token)}`, { method: 'GET', origin: null });
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get('Content-Type'), 'audio/mpeg');
  assert.equal(ok.headers.get('Accept-Ranges'), 'bytes');
  assert.equal(Buffer.from(await ok.arrayBuffer()).toString(), '0123456789ABCDEFGHIJ');
});

test('/audio: soporta Range (adelantar/retroceder) y archivos que no existen', async () => {
  const a = await (await call('/redeem', { body: { sessionId: 'cs_test_PAGADA123456', deviceId: DEV1 } })).json();
  const t = encodeURIComponent(a.token);
  const part = await call(`/audio/es/p01_corto.mp3?t=${t}`, { method: 'GET', origin: ORIGIN, headers: { Range: 'bytes=5-9' } });
  assert.equal(part.status, 206);
  assert.equal(part.headers.get('Content-Range'), 'bytes 5-9/20');
  assert.equal(Buffer.from(await part.arrayBuffer()).toString(), '56789');
  assert.equal(part.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  const missing = await call(`/audio/es/p99_corto.mp3?t=${t}`, { method: 'GET', origin: null });
  assert.equal(missing.status, 404);
  const traversal = await call(`/audio/es/..%2Fx_corto.mp3?t=${t}`, { method: 'GET', origin: null });
  assert.equal(traversal.status, 404);
});

test('/audio: una clave vencida no sirve', async () => {
  const old = await signToken({ site: 'mna', dev: DEV1, exp: Date.now() - 1000 }, SECRET);
  assert.equal((await call(`/audio/es/p01_corto.mp3?t=${encodeURIComponent(old)}`, { method: 'GET', origin: null })).status, 401);
});

test('sin secretos configurados, los pagos responden 503 (no se rompe nada)', async () => {
  delete env.STRIPE_SECRET_KEY;
  assert.equal((await call('/redeem', { body: { sessionId: 'cs_test_PAGADA123456', deviceId: DEV1 } })).status, 503);
});


test('una sesión pagada hace más de 30 días ya no se puede canjear por primera vez', async () => {
  const r = await call('/redeem', { body: { sessionId: 'cs_test_VIEJA12345678', deviceId: DEV1 } });
  assert.equal(r.status, 410);
  assert.equal((await r.json()).error, 'expired');
});

test('el registro del pase vive más que la ventana de canje (no se puede repetir el canje con el mismo enlace)', async () => {
  const r = await call('/redeem', { body: { sessionId: 'cs_test_PAGADA123456', deviceId: DEV1 } });
  assert.equal(r.status, 200);
  const minimo = 30 * 86400 + 72 * 3600; // ventana de canje + duración del pase
  assert.ok(env.PASES.lastTtl >= minimo, `TTL ${env.PASES.lastTtl} < ${minimo}`);
  // Un segundo dispositivo al agregarse vuelve a guardar el registro con la misma vida larga
  const code = (await r.json()).code;
  await call('/code', { body: { code, deviceId: DEV2 } });
  assert.ok(env.PASES.lastTtl >= minimo);
});

test('un pase ya canjeado sigue sirviendo a otro dispositivo aunque la sesión sea vieja (la edad solo limita el primer canje)', async () => {
  const first = await call('/redeem', { body: { sessionId: 'cs_test_PAGADA123456', deviceId: DEV1 } });
  stripeSessions.cs_test_PAGADA123456.created -= 40 * 86400;
  const again = await call('/redeem', { body: { sessionId: 'cs_test_PAGADA123456', deviceId: DEV2 } });
  assert.equal(first.status, 200);
  assert.equal(again.status, 200);
});

test('/checkout: el idioma se normaliza (ES, es-MX, valores raros → pesos; EN → dólares)', async () => {
  const price = async (lang) => {
    stripeCalls.length = 0;
    const r = await call('/checkout', { body: { siteId: 'mna', lang, deviceId: DEV1, returnUrl: `${ORIGIN}/x/` } });
    assert.equal(r.status, 200, `lang=${lang}`);
    return new URLSearchParams(stripeCalls[0].body).get('line_items[0][price]');
  };
  for (const l of ['ES', 'es-MX', 'constructor', '__proto__', null, 42, '']) assert.equal(await price(l), 'price_mxn_1', String(l));
  for (const l of ['en', 'EN', 'en-US']) assert.equal(await price(l), 'price_usd_1', String(l));
});

test('SITE_IDS acepta mayúsculas en la configuración', async () => {
  env.SITE_IDS = 'MNA';
  const r = await call('/checkout', { body: { siteId: 'mna', lang: 'es', deviceId: DEV1, returnUrl: `${ORIGIN}/x/` } });
  assert.equal(r.status, 200);
});

test('/config: si Stripe falla responde 502 sin guardar en caché', async () => {
  const bueno = globalThis.fetch;
  env.STRIPE_PRICE_ID_MXN = 'price_nuevo_sin_cache'; // otro identificador → no hay precio en caché
  globalThis.fetch = async () => new Response(JSON.stringify({ error: { message: 'boom' } }), { status: 500 });
  const r = await call('/config', { method: 'GET' });
  globalThis.fetch = bueno;
  assert.equal(r.status, 502);
  assert.equal(r.headers.get('Cache-Control'), 'no-store');
});

test('/audio: todos los tipos de Range (final abierto, últimos N bytes, recortado, inválido, fuera del archivo, HEAD)', async () => {
  const a = await (await call('/redeem', { body: { sessionId: 'cs_test_PAGADA123456', deviceId: DEV1 } })).json();
  const url = `/audio/es/p01_corto.mp3?t=${encodeURIComponent(a.token)}`;
  const get = (range, method = 'GET') => call(url, { method, origin: null, headers: range ? { Range: range } : {} });
  const body = async (r) => Buffer.from(await r.arrayBuffer()).toString();

  let r = await get('bytes=15-');
  assert.equal(r.status, 206);
  assert.equal(r.headers.get('Content-Range'), 'bytes 15-19/20');
  assert.equal(r.headers.get('Content-Length'), '5');
  assert.equal(await body(r), 'FGHIJ');

  r = await get('bytes=-5');
  assert.equal(r.status, 206);
  assert.equal(r.headers.get('Content-Range'), 'bytes 15-19/20');
  assert.equal(await body(r), 'FGHIJ');

  r = await get('bytes=15-999');
  assert.equal(r.headers.get('Content-Range'), 'bytes 15-19/20');

  r = await get('bytes=0-0');
  assert.equal(r.headers.get('Content-Range'), 'bytes 0-0/20');
  assert.equal(await body(r), '0');

  for (const bad of ['bytes=100-', 'bytes=25-30', 'bytes=-0', 'bytes=9-3']) {
    r = await get(bad);
    assert.equal(r.status, 416, bad);
    assert.equal(r.headers.get('Content-Range'), 'bytes */20');
  }
  for (const ignorado of ['bytes=0-1,5-6', 'items=1-2', 'basura', 'bytes=-']) {
    r = await get(ignorado);
    assert.equal(r.status, 200, ignorado);
    assert.equal(await body(r), '0123456789ABCDEFGHIJ');
  }

  r = await get(null, 'HEAD');
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('Content-Length'), '20');
  assert.equal(r.headers.get('Accept-Ranges'), 'bytes');
});

test.after(() => { if (realFetch) globalThis.fetch = realFetch; });
