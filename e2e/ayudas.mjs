// Ayudas compartidas por las pruebas: servidor de cobro simulado, MP3 de mentira y navegación básica.
import { silentMp3 } from '../scripts/audio-lib.mjs';
import { expect } from '@playwright/test';

export const FREE = { id: 'mna_s06_piedra_sol', title: 'Piedra del Sol' };
export const PREMIUM = { id: 'mna_s06_coatlicue', title: 'Coatlicue' };
export const SESSION = 'cs_test_a1b2c3d4e5f6g7h8i9';
export const TOKEN = 'tok_PRUEBA.firma';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
};

/** Bloquea todo internet menos la app local, el servidor de cobro simulado y la página de Stripe simulada. */
export async function aislar(page) {
  await page.route((url) => !['localhost', 'pagos.test', 'checkout.stripe.com'].includes(url.hostname), (route) => route.abort());
  await page.route('https://checkout.stripe.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>Stripe simulado</h1>' })
  );
}

/** Servidor de cobro simulado: guarda cada llamada en api.calls y responde según api.redeem / api.code. */
export async function simularCobro(page, opciones = {}) {
  const api = { calls: [], redeem: 'ok', code: 'ok', ...opciones };
  const grant = () => ({ token: TOKEN, site: 'mna', expiresAt: Date.now() + 72 * 3600_000, code: 'ABCD-1234', devices: 1, maxDevices: 2 });
  const STATUS = { not_paid: 402, device_limit: 403, code_not_found: 404, expired: 410, server_error: 500 };

  await page.route('https://pagos.test/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const body = req.postData() ? JSON.parse(req.postData()) : null;
    api.calls.push({ path: url.pathname, search: url.search, body });
    const json = (status, data) =>
      route.fulfill({ status, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(data) });

    switch (url.pathname) {
      case '/config':
        return json(200, {
          prices: { mxn: { amount: 79, currency: 'mxn' }, usd: { amount: 4.99, currency: 'usd' } },
          passHours: 72,
          maxDevices: 2,
        });
      case '/checkout':
        return json(200, { url: 'https://checkout.stripe.com/c/pay/cs_test_mock' });
      case '/redeem':
        if (api.redeem === 'html502') {
          return route.fulfill({ status: 502, headers: { ...CORS, 'content-type': 'text/html' }, body: '<html><body>Bad gateway</body></html>' });
        }
        return api.redeem === 'ok' ? json(200, grant()) : json(STATUS[api.redeem] || 400, { error: api.redeem });
      case '/code':
        return api.code === 'ok' ? json(200, grant()) : json(STATUS[api.code] || 400, { error: api.code });
      default:
        if (url.pathname.startsWith('/audio/')) {
          return route.fulfill({ status: 200, headers: { ...CORS, 'content-type': 'audio/mpeg' }, body: silentMp3(2) });
        }
        return json(404, { error: 'not_found' });
    }
  });
  return api;
}

/**
 * Agrega MP3 de mentira a dos piezas (una gratis y una de pago) sin tocar los archivos del proyecto,
 * y registra cada archivo que la app intenta reproducir en window.__plays.
 */
export async function simularAudio(page) {
  await page.addInitScript(() => {
    window.__plays = [];
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...args) {
      window.__plays.push(this.currentSrc || this.src);
      return original.apply(this, args);
    };
  });
  await page.route(/\/data\/(mna\/)?pieces\.json$/, async (route) => {
    const response = await route.fetch();
    const pieces = await response.json();
    for (const p of pieces) {
      if (p.piece_id === FREE.id) {
        p.audio = { es: { corto: { path: `audio/es/${FREE.id}_corto.mp3`, remote: false, seconds: 2 }, largo: { path: `audio/es/${FREE.id}_largo.mp3`, remote: false, seconds: 2 } } };
      }
      if (p.piece_id === PREMIUM.id) {
        p.audio = { es: { corto: { path: `es/${PREMIUM.id}_corto.mp3`, remote: true, seconds: 2 }, largo: { path: `es/${PREMIUM.id}_largo.mp3`, remote: true, seconds: 2 } } };
      }
    }
    await route.fulfill({ response, json: pieces });
  });
  await page.route(`**/audio/es/${FREE.id}_*.mp3`, (route) =>
    route.fulfill({ status: 200, headers: { 'content-type': 'audio/mpeg' }, body: silentMp3(2) })
  );
}

/** Simula que el teléfono no tiene ninguna voz instalada (así el resultado no depende de la máquina). */
export async function sinVoces(page) {
  await page.addInitScript(() => {
    if (window.speechSynthesis) window.speechSynthesis.getVoices = () => [];
  });
}

export async function elegirIdioma(page, nombre) {
  await page.locator('#btn-language-selector').click();
  await page.getByRole('button', { name: new RegExp(nombre) }).click();
}

/** Home → museo → buscar la pieza → abrir su ficha. */
export async function abrirPieza(page, titulo) {
  await page.locator('#sites-grid-section [role=button]').first().click();
  await page.locator('#dock-tab-teclado').click();
  await page.locator('#input-search-pieces').fill(titulo);
  await page.locator('[role=button]', { has: page.getByText(titulo, { exact: true }) }).first().click();
  await expect(page.locator('#btn-master-play-piece')).toBeVisible();
}
