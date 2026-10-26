// Precios por sitio, pase combinado, alcance por sitio y códigos de acceso.  Correr:  node --test pagos/test/precios.test.mjs
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { parsePrecios, resetPreciosCache, siteForPiece } from '../src/precios.js';
import { signToken } from '../src/token.js';

const ORIGIN = 'https://xolotli.com';
const API = 'https://pagos.example.workers.dev';
const SECRET = 'secreto-de-prueba-muy-largo-1234567890';
const PRECIOS_URL = 'https://xolotli.com/data/precios.json';
const CODES_KEY = 'clave-de-codigos-de-prueba';

class FakeKV {
  constructor() { this.m = new Map(); }
  async get(k) { return this.m.has(k) ? this.m.get(k) : null; }
  async put(k, v) { this.m.set(k, v); }
  async delete(k) { this.m.delete(k); }
}
class FakeR2 {
  constructor(files) { this.files = files; }
  async head(key) { const b = this.files[key]; return b ? { size: b.length, httpEtag: '"e1"' } : null; }
  async get(key) {
    const b = this.files[key];
    if (!b) return null;
    return { size: b.length, httpEtag: '"e1"', body: new ReadableStream({ start(c) { c.enqueue(b); c.close(); } }), text: async () => b.toString() };
  }
}

const TABLA = {
  sites: {
    mna: { prefijo: 'mna_', nombre: 'Museo Nacional de Antropología', acceso: 'pago', mxn: 99, usd: 6 },
    teotihuacan: { prefijo: 'teo_', nombre: 'Teotihuacán', acceso: 'pago', mxn: 149 },
    chapultepec: { prefijo: 'chap_', nombre: 'Castillo de Chapultepec', acceso: 'pago' },
    muestra: { prefijo: 'mue_', nombre: 'Sitio de muestra', acceso: 'gratis' },
    hotel: { prefijo: 'hot_', nombre: 'Solo por código', acceso: 'codigo', mxn: 50 },
    templo_mayor_catedral: { prefijo: 'tmc_', nombre: 'Templo Mayor y Catedral', acceso: 'pago', mxn: 120, usd: 7.5 },
  },
  combos: {
    todos: { nombre: { es: 'Todos los sitios', en: 'All sites' }, sitios: 'todos', mxn: 249, usd: 14 },
    centro: { nombre: { es: 'Centro Histórico completo', en: 'Historic Centre' }, sitios: ['teotihuacan', 'templo_mayor_catedral', 'noexiste'], mxn: 139, usd: 8 },
  },
};

const TEXTOS = JSON.stringify({ lang: 'es', pieces: { mna_p1: { x: 1 }, teo_p1: { x: 2 }, mue_p1: { x: 3 }, tmc_p1: { x: 4 } } });

let env, stripeCalls, stripeSessions, tabla, realFetch;

beforeEach(() => {
  resetPreciosCache();
  tabla = TABLA;
  env = {
    ALLOWED_ORIGINS: ORIGIN,
    SITE_IDS: 'mna',
    PASS_HOURS: '72',
    MAX_DEVICES: '2',
    PRECIOS_URL,
    STRIPE_PRICE_ID_MXN: 'price_mxn_general',
    STRIPE_PRICE_ID_USD: '',
    STRIPE_SECRET_KEY: 'sk_test_x',
    TOKEN_SECRET: SECRET,
    CODES_KEY,
    PASES: new FakeKV(),
    AUDIO: new FakeR2({
      'pago/es/mna_p1_corto.mp3': Buffer.from('MNA-AUDIO'),
      'pago/es/teo_p1_corto.mp3': Buffer.from('TEO-AUDIO'),
      'pago/es/mue_p1_corto.mp3': Buffer.from('MUESTRA-AUDIO'),
      'pago/es/zzz_p1_corto.mp3': Buffer.from('SIN-SITIO'),
      'texto/es.json': Buffer.from(TEXTOS),
    }),
  };
  stripeCalls = [];
  const now = Math.floor(Date.now() / 1000);
  stripeSessions = {
    cs_test_COMBOPAGADO12: { id: 'cs_test_COMBOPAGADO12', payment_status: 'paid', created: now, metadata: { site_id: 'todos' } },
    cs_test_MNAPAGADO1234: { id: 'cs_test_MNAPAGADO1234', payment_status: 'paid', created: now, metadata: { site_id: 'mna' } },
  };
  realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const u = String(url);
    if (u === PRECIOS_URL) return tabla ? new Response(JSON.stringify(tabla), { status: 200 }) : new Response('no', { status: 500 });
    stripeCalls.push({ url: u, method: init.method || 'GET', body: init.body ? String(init.body) : '' });
    const ok = (b) => new Response(JSON.stringify(b), { status: 200 });
    if (u.endsWith('/v1/checkout/sessions') && init.method === 'POST') return ok({ id: 'cs_test_NUEVA1234567', url: 'https://checkout.stripe.com/c/pay/cs_test_NUEVA1234567' });
    const m = u.match(/\/v1\/checkout\/sessions\/(.+)$/);
    if (m) return stripeSessions[m[1]] ? ok(stripeSessions[m[1]]) : new Response('{}', { status: 404 });
    if (u.includes('/v1/promotion_codes?')) return ok({ data: [{ id: 'promo_1', code: 'TODOS10', active: true, metadata: { sitios: 'todos' }, coupon: { valid: true, percent_off: 10 } }] });
    if (u.includes('/v1/prices/')) return ok({ unit_amount: 7900, currency: 'mxn' });
    throw new Error('llamada inesperada: ' + u);
  };
});

import { afterEach } from 'node:test';
afterEach(() => { globalThis.fetch = realFetch; });

const call = (path, { method = 'POST', body, origin = ORIGIN, headers = {} } = {}) =>
  worker.fetch(new Request(API + path, { method, headers: { ...(origin ? { Origin: origin } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined }), env);

const DEV1 = 'dev_aaaaaa111';
const DEV2 = 'dev_bbbbbb222';
const DEV3 = 'dev_cccccc333';
const token = (site) => signToken({ sid: 'abc123abc123', site, dev: DEV1, exp: Date.now() + 3600_000 }, SECRET);
const checkout = (siteId, lang = 'es', extra = {}) => call('/checkout', { body: { siteId, lang, deviceId: DEV1, returnUrl: `${ORIGIN}/`, ...extra } });
const lastCheckout = () => new URLSearchParams(stripeCalls.filter((c) => c.url.endsWith('/v1/checkout/sessions')).at(-1).body);

// ---------------------------------------------------------------------------
test('parsePrecios: acepta lo válido y descarta lo dudoso', () => {
  const t = parsePrecios({
    sites: {
      MNA: { prefijo: 'MNA_', nombre: 'Museo', acceso: 'pago', mxn: '99', usd: 'abc' },
      'raro/../id': { prefijo: 'x_', mxn: 10 },
      dos: { prefijo: 'mna_', mxn: 10 }, // prefijo repetido
      sinprefijo: { mxn: 10 },
      gratis: { prefijo: 'gra_', acceso: 'otra-cosa', mxn: -5 },
      todos: { prefijo: 'tod_', mxn: 5 }, // "todos" está reservado
    },
    combos: { todos: { nombre: 'Todos', sitios: 'todos', mxn: 200 }, falso: { sitios: ['mna'], mxn: 0 }, vacio: { sitios: ['nada'], mxn: 50 }, mna: { sitios: 'todos', mxn: 5 }, todos2: { sitios: ['gratis', 'mna', 'mna'], mxn: 90, usd: 6, nombre: { es: 'Duo', en: 'Duo', ru: 'x' } } },
  });
  assert.deepEqual(Object.keys(t.sites).sort(), ['gratis', 'mna']);
  assert.equal(t.sites.mna.mxn, 99);
  assert.equal(t.sites.mna.usd, null);
  assert.equal(t.sites.gratis.acceso, 'pago');
  assert.equal(t.sites.gratis.mxn, null);
  assert.deepEqual(Object.keys(t.combos).sort(), ['todos', 'todos2']); // sin precio, sin sitios válidos o con el id de un sitio: se descartan
  assert.equal(t.combos.todos.mxn, 200);
  assert.deepEqual(t.combos.todos2.sitios, ['gratis', 'mna']);
  assert.deepEqual(t.combos.todos2.nombre, { es: 'Duo', en: 'Duo' });
  assert.equal(parsePrecios(null), null);
  assert.equal(parsePrecios({ sites: {} }), null);
  assert.deepEqual(parsePrecios({ sites: { aa: { prefijo: 'a_' } }, combos: { x1: { sitios: 'todos', mxn: 0 } } }).combos, {});
  assert.equal(parsePrecios({ sites: { aa: { prefijo: 'a_' } }, combos: { todos: { sitios: ['aa'], mxn: 9 } } }).combos.todos, undefined); // «todos» siempre abre todo
});

test('siteForPiece: gana el prefijo más largo', () => {
  const t = parsePrecios({ sites: { aa: { prefijo: 'ch_' }, bb: { prefijo: 'chi_' } } });
  assert.equal(siteForPiece(t, 'chi_01_castillo'), 'bb');
  assert.equal(siteForPiece(t, 'ch_01'), 'aa');
  assert.equal(siteForPiece(t, 'otro_01'), null);
  assert.equal(siteForPiece(null, 'ch_01'), null);
});

// ---------------------------------------------------------------------------
test('/checkout cobra el precio propio de cada sitio (pesos en español, dólares si hay)', async () => {
  let r = await checkout('teotihuacan');
  assert.equal(r.status, 200);
  let p = lastCheckout();
  assert.equal(p.get('line_items[0][price_data][currency]'), 'mxn');
  assert.equal(p.get('line_items[0][price_data][unit_amount]'), '14900');
  assert.match(p.get('line_items[0][price_data][product_data][name]'), /Pase de visitante · Teotihuacán/);
  assert.equal(p.get('line_items[0][price]'), null);
  assert.equal(p.get('metadata[site_id]'), 'teotihuacan');

  await checkout('mna', 'en');
  p = lastCheckout();
  assert.equal(p.get('line_items[0][price_data][currency]'), 'usd');
  assert.equal(p.get('line_items[0][price_data][unit_amount]'), '600');
  assert.match(p.get('line_items[0][price_data][product_data][name]'), /^Visitor pass/);

  await checkout('templo_mayor_catedral', 'en'); // 7.50 USD → 750 centavos, y el id largo del sitio es válido
  assert.equal(lastCheckout().get('line_items[0][price_data][unit_amount]'), '750');

  await checkout('teotihuacan', 'fr'); // sin precio en dólares → pesos
  p = lastCheckout();
  assert.equal(p.get('line_items[0][price_data][currency]'), 'mxn');
  assert.equal(p.get('locale'), 'fr');
});

test('/checkout: un sitio sin precio propio usa el precio general de Stripe', async () => {
  const r = await checkout('chapultepec');
  assert.equal(r.status, 200);
  const p = lastCheckout();
  assert.equal(p.get('line_items[0][price]'), 'price_mxn_general');
  assert.equal(p.get('line_items[0][price_data][unit_amount]'), null);
});

test('/checkout: sitios gratis o solo por código no se venden; los desconocidos tampoco', async () => {
  for (const site of ['muestra', 'hotel']) {
    const r = await checkout(site);
    assert.equal(r.status, 400);
    assert.equal((await r.json()).error, 'not_for_sale');
  }
  assert.equal((await checkout('no_existe')).status, 400);
  assert.equal(stripeCalls.filter((c) => c.url.endsWith('/v1/checkout/sessions')).length, 0);
});

test('/checkout del pase combinado cobra su precio y admite códigos de descuento para "todos"', async () => {
  let r = await checkout('todos', 'es');
  assert.equal(r.status, 200);
  let p = lastCheckout();
  assert.equal(p.get('line_items[0][price_data][unit_amount]'), '24900');
  assert.equal(p.get('metadata[site_id]'), 'todos');
  r = await checkout('todos', 'en', { promo: 'TODOS10' });
  assert.equal(r.status, 200);
  p = lastCheckout();
  assert.equal(p.get('line_items[0][price_data][unit_amount]'), '1400');
  assert.equal(p.get('discounts[0][promotion_code]'), 'promo_1');
});

test('sin pase combinado en la tabla, "todos" no existe', async () => {
  tabla = { sites: TABLA.sites };
  assert.equal((await checkout('todos')).status, 400);
  assert.equal((await checkout('centro')).status, 400);
});

// ---------------------------------------------------------------------------
test('/config?site= devuelve el precio y el acceso de ese sitio, y el del combo', async () => {
  const r = await call('/config?site=mna', { method: 'GET' });
  const d = await r.json();
  assert.deepEqual(d.prices, { mxn: { amount: 99, currency: 'mxn' }, usd: { amount: 6, currency: 'usd' } });
  assert.equal(d.access, 'pago');
  // Del sitio MNA solo abre el combo "todos"; Teotihuacán también está en "centro"
  assert.deepEqual(d.combos.map((c) => c.id), ['todos']);
  assert.deepEqual(d.combos[0].prices, { mxn: { amount: 249, currency: 'mxn' }, usd: { amount: 14, currency: 'usd' } });
  const teo = await (await call('/config?site=teotihuacan', { method: 'GET' })).json();
  assert.deepEqual(teo.combos.map((c) => c.id), ['todos', 'centro']);
  assert.deepEqual(teo.combos[1].sites, ['teotihuacan', 'templo_mayor_catedral']); // el sitio que no existe se descartó
  assert.equal(teo.combos[1].name.en, 'Historic Centre');

  const h = await (await call('/config?site=hotel', { method: 'GET' })).json();
  assert.equal(h.access, 'codigo');

  const c = await (await call('/config?site=chapultepec', { method: 'GET' })).json(); // sin precio propio → Stripe
  assert.equal(c.prices.mxn.amount, 79);
});

test('si la tabla no se puede leer, se sigue con la configuración fija', async () => {
  tabla = null;
  const r = await call('/checkout', { body: { siteId: 'mna', lang: 'es', deviceId: DEV1, returnUrl: `${ORIGIN}/` } });
  assert.equal(r.status, 200);
  assert.equal(lastCheckout().get('line_items[0][price]'), 'price_mxn_general');
  assert.equal((await checkout('teotihuacan')).status, 400); // fuera de SITE_IDS
});

test('si la tabla falla un momento, se usa la última copia buena', async () => {
  assert.equal((await checkout('teotihuacan')).status, 200);
  tabla = null;
  // dentro de la ventana de caché ni siquiera se vuelve a pedir; forzamos el vencimiento
  const realNow = Date.now;
  Date.now = () => realNow() + 10 * 60_000;
  try {
    assert.equal((await checkout('teotihuacan')).status, 200);
  } finally {
    Date.now = realNow;
  }
});

// ---------------------------------------------------------------------------
test('un pase de un sitio no abre los audios de otro; el combo abre todos', async () => {
  const audio = (id, t) => call(`/audio/pago/es/${id}_corto.mp3${t ? `?t=${encodeURIComponent(t)}` : ''}`, { method: 'GET', origin: null });
  const mna = await token('mna');
  assert.equal((await audio('mna_p1', mna)).status, 200);
  assert.equal((await audio('teo_p1', mna)).status, 401);
  assert.equal((await audio('zzz_p1', mna)).status, 401); // pieza que no es de ningún sitio
  assert.equal((await audio('mna_p1', null)).status, 401);
  const todos = await token('todos');
  assert.equal((await audio('mna_p1', todos)).status, 200);
  assert.equal((await audio('teo_p1', todos)).status, 200);
});

test('un sitio gratis entrega sus audios de pago sin clave, pero no los de otros', async () => {
  const audio = (id) => call(`/audio/pago/es/${id}_corto.mp3`, { method: 'GET', origin: null });
  assert.equal((await audio('mue_p1')).status, 200);
  assert.equal((await audio('mna_p1')).status, 401);
});

test('los textos de pago salen solo del sitio del pase', async () => {
  const get = (q) => call(`/texto/es.json?${q}`, { method: 'GET', origin: null });
  let d = await (await get(`t=${encodeURIComponent(await token('mna'))}`)).json();
  assert.deepEqual(Object.keys(d.pieces), ['mna_p1']);
  d = await (await get(`t=${encodeURIComponent(await token('todos'))}`)).json();
  assert.deepEqual(Object.keys(d.pieces).sort(), ['mna_p1', 'mue_p1', 'teo_p1', 'tmc_p1'].sort());
  // El combo puede pedir solo un sitio
  d = await (await get(`t=${encodeURIComponent(await token('todos'))}&site=teotihuacan`)).json();
  assert.deepEqual(Object.keys(d.pieces), ['teo_p1']);
  // Con pase de un sitio, pedir otro no amplía el alcance
  d = await (await get(`t=${encodeURIComponent(await token('mna'))}&site=teotihuacan`)).json();
  assert.deepEqual(Object.keys(d.pieces), ['mna_p1']);
  // Sitio gratis: sin clave, solo sus textos
  d = await (await get('site=muestra')).json();
  assert.deepEqual(Object.keys(d.pieces), ['mue_p1']);
  // Pedir un sitio de pago sin clave no sirve
  assert.equal((await get('site=mna')).status, 401);
  assert.equal((await get('')).status, 401);
  // Una clave inventada tampoco, aunque se pida un sitio gratis de otro
  assert.equal((await get('t=basura&site=mna')).status, 401);
});

test('los textos con ETag distinto por sitio devuelven 304 solo para el mismo alcance', async () => {
  const t = encodeURIComponent(await token('mna'));
  const first = await call(`/texto/es.json?t=${t}`, { method: 'GET', origin: null });
  const etag = first.headers.get('ETag');
  assert.ok(etag.includes('mna'));
  const again = await call(`/texto/es.json?t=${t}`, { method: 'GET', origin: null, headers: { 'If-None-Match': etag } });
  assert.equal(again.status, 304);
  const other = await call(`/texto/es.json?t=${encodeURIComponent(await token('todos'))}`, { method: 'GET', origin: null, headers: { 'If-None-Match': etag } });
  assert.equal(other.status, 200);
});

// ---------------------------------------------------------------------------
test('canjear el pago del combo da una clave "todos" que se puede canjear estando en cualquier sitio', async () => {
  const r = await call('/redeem', { body: { sessionId: 'cs_test_COMBOPAGADO12', deviceId: DEV1, siteId: 'mna' } });
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(d.site, 'todos');
  // El segundo dispositivo la activa con el código corto desde otro sitio
  const c = await call('/code', { body: { code: d.code, siteId: 'teotihuacan', deviceId: DEV2 } });
  assert.equal(c.status, 200);
  assert.equal((await c.json()).site, 'todos');
  // Y una compra de un solo sitio no se puede canjear en otro
  const bad = await call('/redeem', { body: { sessionId: 'cs_test_MNAPAGADO1234', deviceId: DEV1, siteId: 'teotihuacan' } });
  assert.equal(bad.status, 403);
});

test('/evento acepta ids de sitio largos', async () => {
  const r = await call('/evento', { body: { e: 'app_open', s: 'templo_mayor_catedral', l: 'es' } });
  assert.equal(r.status, 204);
  const stats = await call('/estadisticas', { method: 'GET', origin: null, headers: { Authorization: 'Bearer nada' } });
  assert.equal(stats.status, 401);
  const day = [...env.PASES.m.entries()].find(([k]) => k.startsWith('ev:'));
  assert.ok(Object.keys(JSON.parse(day[1]).c).some((k) => k.includes('templo_mayor_catedral')));
});

// ---------------------------------------------------------------------------
const publish = (codes, key = CODES_KEY) => call('/admin/codigos', { origin: null, headers: { Authorization: `Bearer ${key}` }, body: { codes } });
const useCode = (code, device = DEV1, siteId = 'hotel') => call('/code', { body: { code, siteId, deviceId: device } });

test('/admin/codigos exige la clave y solo acepta códigos de sitios que existen', async () => {
  assert.equal((await publish([], 'otra')).status, 401);
  env.CODES_KEY = '';
  assert.equal((await publish([])).status, 503);
  env.CODES_KEY = CODES_KEY;
  const r = await (await publish([{ code: 'HOTEL-MX1', site: 'hotel' }, { code: 'MAL', site: 'hotel' }, { code: 'ABCD1234', site: 'noexiste' }])).json();
  assert.equal(r.saved, 1);
  assert.equal(r.rejected.length, 2);
});

test('código de acceso: da un pase del sitio, el mismo dispositivo no gasta otro uso y el segundo dispositivo usa el código del pase', async () => {
  await publish([{ code: 'hotel-mx1', site: 'hotel', hours: 24, uses: 2 }]);
  const a = await useCode('HOTEL-MX1', DEV1);
  assert.equal(a.status, 200);
  const da = await a.json();
  assert.equal(da.site, 'hotel');
  assert.ok(da.expiresAt - Date.now() < 24 * 3600_000 + 5000);
  assert.match(da.code, /^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  // El mismo dispositivo lo repite: mismo pase, sin gastar otro uso
  const again = await (await useCode('hotelmx1', DEV1)).json();
  assert.equal(again.code, da.code);
  // Otra persona: segundo uso
  assert.equal((await useCode('HOTEL-MX1', DEV2)).status, 200);
  // Tercera persona: agotado
  const third = await useCode('HOTEL-MX1', DEV3);
  assert.equal(third.status, 410);
  assert.equal((await third.json()).error, 'code_exhausted');
  // El segundo dispositivo de la primera persona entra con el código corto del pase
  const second = await call('/code', { body: { code: da.code, siteId: 'hotel', deviceId: DEV3 } });
  assert.equal(second.status, 200);
});

test('código de acceso: vencido, de otro sitio, o inexistente', async () => {
  await publish([
    { code: 'VENCIDO1', site: 'hotel', expires: '2020-01-01' },
    { code: 'SOLOMNA1', site: 'mna' },
    { code: 'COMBO123', site: 'todos', hours: 1 },
    { code: 'APAGADO1', site: 'hotel' },
  ]);
  assert.equal((await useCode('VENCIDO1')).status, 410);
  assert.equal((await useCode('SOLOMNA1', DEV1, 'teotihuacan')).status, 404);
  assert.equal((await useCode('NOEXISTE9')).status, 404);
  const c = await useCode('COMBO123', DEV1, 'teotihuacan'); // el combo sirve en cualquier sitio
  assert.equal(c.status, 200);
  assert.equal((await c.json()).site, 'todos');
  // Se apaga desde la hoja
  await publish([{ code: 'APAGADO1', site: 'hotel', active: false }]);
  assert.equal((await useCode('APAGADO1')).status, 404);
});

test('republicar un código conserva cuántas veces se ha usado', async () => {
  await publish([{ code: 'CUPO0001', site: 'hotel', uses: 1 }]);
  assert.equal((await useCode('CUPO0001', DEV1)).status, 200);
  await publish([{ code: 'CUPO0001', site: 'hotel', uses: 1 }]);
  assert.equal((await useCode('CUPO0001', DEV2)).status, 410);
});

test('la clave de un código de acceso abre audios y textos del sitio, y no los de otro', async () => {
  await publish([{ code: 'TMC00001', site: 'templo_mayor_catedral' }]);
  const d = await (await useCode('TMC00001', DEV1, 'templo_mayor_catedral')).json();
  const t = encodeURIComponent(d.token);
  const texts = await (await call(`/texto/es.json?t=${t}`, { method: 'GET', origin: null })).json();
  assert.deepEqual(Object.keys(texts.pieces), ['tmc_p1']);
  assert.equal((await call(`/audio/pago/es/mna_p1_corto.mp3?t=${t}`, { method: 'GET', origin: null })).status, 401);
});

// ---------------------------------------------------------------------------
test('pase combinado por sitios: el checkout cobra su precio con su nombre en el idioma', async () => {
  let r = await checkout('centro', 'en');
  assert.equal(r.status, 200);
  let p = lastCheckout();
  assert.equal(p.get('line_items[0][price_data][unit_amount]'), '800');
  assert.equal(p.get('line_items[0][price_data][currency]'), 'usd');
  assert.match(p.get('line_items[0][price_data][product_data][name]'), /Visitor pass · Historic Centre/);
  assert.equal(p.get('metadata[site_id]'), 'centro');
  await checkout('centro', 'fr'); // sin nombre en francés → español
  assert.match(lastCheckout().get('line_items[0][price_data][product_data][name]'), /Pass visiteur · Centro Histórico completo/);
});

test('un pase "centro" abre los audios y textos de sus sitios y de ningún otro', async () => {
  const t = await token('centro');
  const audio = (id) => call(`/audio/pago/es/${id}_corto.mp3?t=${encodeURIComponent(t)}`, { method: 'GET', origin: null });
  assert.equal((await audio('teo_p1')).status, 200);
  assert.equal((await audio('mna_p1')).status, 401);
  const texts = await (await call(`/texto/es.json?t=${encodeURIComponent(t)}`, { method: 'GET', origin: null })).json();
  assert.deepEqual(Object.keys(texts.pieces).sort(), ['teo_p1', 'tmc_p1']);
  const one = await (await call(`/texto/es.json?t=${encodeURIComponent(t)}&site=templo_mayor_catedral`, { method: 'GET', origin: null })).json();
  assert.deepEqual(Object.keys(one.pieces), ['tmc_p1']);
  const other = await (await call(`/texto/es.json?t=${encodeURIComponent(t)}&site=mna`, { method: 'GET', origin: null })).json(); // pedir otro sitio no amplía
  assert.deepEqual(Object.keys(other.pieces).sort(), ['teo_p1', 'tmc_p1']);
});

test('canjear el pago de un combo por sitios dice qué sitios abre y sirve en cualquiera de ellos', async () => {
  stripeSessions.cs_test_CENTROPAGADO1 = { id: 'cs_test_CENTROPAGADO1', payment_status: 'paid', created: Math.floor(Date.now() / 1000), metadata: { site_id: 'centro' } };
  const bad = await call('/redeem', { body: { sessionId: 'cs_test_CENTROPAGADO1', deviceId: DEV1, siteId: 'mna' } }); // MNA no está en el combo
  assert.equal(bad.status, 403);
  const ok = await call('/redeem', { body: { sessionId: 'cs_test_CENTROPAGADO1', deviceId: DEV1, siteId: 'templo_mayor_catedral' } });
  assert.equal(ok.status, 200);
  const d = await ok.json();
  assert.equal(d.site, 'centro');
  assert.deepEqual(d.covers, ['teotihuacan', 'templo_mayor_catedral']);
  const code = await call('/code', { body: { code: d.code, siteId: 'teotihuacan', deviceId: DEV2 } });
  assert.equal(code.status, 200);
  assert.equal((await call('/code', { body: { code: d.code, siteId: 'mna', deviceId: DEV3 } })).status, 404);
});

test('un código de acceso puede dar un combo por sitios', async () => {
  await publish([{ code: 'CENTRO01', site: 'centro', hours: 48 }]);
  assert.equal((await useCode('CENTRO01', DEV1, 'mna')).status, 404);
  const r = await useCode('CENTRO01', DEV1, 'teotihuacan');
  assert.equal(r.status, 200);
  assert.deepEqual((await r.json()).covers, ['teotihuacan', 'templo_mayor_catedral']);
});

test('si un combo sale de la tabla, su pase deja de abrir sitios (el de "todos" no)', async () => {
  tabla = { ...TABLA, combos: { todos: TABLA.combos.todos } };
  resetPreciosCache();
  const audio = (id, t) => call(`/audio/pago/es/${id}_corto.mp3?t=${encodeURIComponent(t)}`, { method: 'GET', origin: null });
  assert.equal((await audio('teo_p1', await token('centro'))).status, 401);
  assert.equal((await audio('teo_p1', await token('todos'))).status, 200);
});
