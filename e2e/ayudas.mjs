// Ayudas compartidas por las pruebas: servidor de cobro simulado, MP3 de mentira y navegación básica.
import fs from 'node:fs';
import { silentMp3 } from '../scripts/audio-lib.mjs';
import { buildBundles, splitPiece } from '../scripts/privado-lib.mjs';
import { expect } from '@playwright/test';

export const FREE = { id: 'mna_s06_piedra_sol', title: 'Piedra del Sol' };
export const PREMIUM = { id: 'mna_s06_coatlicue', title: 'Coatlicue' };
// Los textos reales de pago NO están en el repositorio (es público). Las pruebas usan textos inventados sobre las piezas reales.
export const FRASE_SECRETA = 'frase secreta que solo ven quienes pagan';
export function conTextoDePrueba(p) {
  const largo = `Texto largo de prueba de ${p.titulo}. Aquí va el desarrollo completo de la pieza, con varias frases para poder leerlo. ${
    p.piece_id === 'mna_s06_piedra_sol' ? FRASE_SECRETA + '. ' : ''
  }Fin del texto largo.`;
  return {
    ...p,
    guion_corto: `Texto corto de prueba de ${p.titulo}. Es una introducción breve para escuchar en un minuto.`,
    guion_largo: largo,
    retos_observacion: [`Primer reto de prueba de ${p.titulo}`, 'Segundo reto de prueba', 'Tercer reto de prueba'],
    especificaciones: { Cultura: 'Mexica', Periodo: 'Periodo de prueba', Material: 'Material de prueba' },
    faq_mito: { pregunta: `Mito: pregunta de prueba de ${p.titulo}.`, respuesta: 'Realidad: respuesta de prueba.' },
  };
}
const COMPLETAS = JSON.parse(fs.readFileSync(new URL('../public/data/pieces.json', import.meta.url), 'utf-8')).map(conTextoDePrueba);
export const TEXTOS = buildBundles(COMPLETAS, ['es', 'en']);
export const SESSION = 'cs_test_a1b2c3d4e5f6g7h8i9';
export const TOKEN = 'tok_PRUEBA.firma';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
};

/** Bloquea todo internet menos la app local, el servidor de cobro simulado y la página de Stripe simulada. */
export async function aislar(page) {
  // Las guías de la app se abren solas la primera vez; las pruebas las dan por vistas (salvo las que la prueban a ella)
  await page.addInitScript(() => {
    try {
      localStorage.setItem('audioguias_tour_museo', '1');
      localStorage.setItem('audioguias_tour_pieza', '1');
    } catch {
      /* sin almacenamiento */
    }
  });
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
        if (api.libre) return json(200, { free: true, prices: {}, passHours: 72, maxDevices: 2 });
        return json(200, {
          prices: { mxn: { amount: 79, currency: 'mxn' }, usd: { amount: 4.99, currency: 'usd' } },
          ...(api.acceso ? { access: api.acceso } : {}),
          ...(api.combo
            ? {
                combos: [
                  { id: 'todos', name: { es: 'Todos los sitios' }, sites: 'todos', prices: { mxn: { amount: 199, currency: 'mxn' }, usd: { amount: 11.5, currency: 'usd' } } },
                  { id: 'dupla', name: { es: 'MNA + Teotihuacán' }, sites: ['mna', 'teotihuacan'], prices: { mxn: { amount: 149, currency: 'mxn' } } },
                ],
              }
            : {}),
          passHours: 72,
          maxDevices: 2,
        });
      case '/promo':
        return String(body?.code || '').toUpperCase() === 'HOTEL10'
          ? json(200, { code: 'HOTEL10', percentOff: 10 })
          : json(404, { error: 'promo_invalid' });
      case '/checkout':
        if (body?.promo && String(body.promo).toUpperCase() !== 'HOTEL10') return json(404, { error: 'promo_invalid' });
        return json(200, { url: 'https://checkout.stripe.com/c/pay/cs_test_mock' });
      case '/redeem':
        if (api.redeem === 'html502') {
          return route.fulfill({ status: 502, headers: { ...CORS, 'content-type': 'text/html' }, body: '<html><body>Bad gateway</body></html>' });
        }
        return api.redeem === 'ok' ? json(200, grant()) : json(STATUS[api.redeem] || 400, { error: api.redeem });
      case '/code':
        return api.code === 'ok' ? json(200, grant()) : json(STATUS[api.code] || 400, { error: api.code });
      default:
        if (url.pathname.startsWith('/texto/')) {
          const lang = url.pathname.replace('/texto/', '').replace('.json', '');
          if (api.texto === 'denegado' || (!api.libre && url.searchParams.get('t') !== TOKEN)) return route.fulfill({ status: 401, headers: CORS, body: 'Sin acceso' });
          if (!TEXTOS[lang]) return json(404, { error: 'not_found' });
          return json(200, TEXTOS[lang]);
        }
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
export async function simularAudio(page, { privado = false, mp3 = true } = {}) {
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
    let pieces = (await response.json()).map(conTextoDePrueba);
    // privado = como en el sitio real: los datos públicos NO traen guiones, retos, mito ni ficha
    if (privado) pieces = pieces.map((p) => splitPiece(p).pub);
    for (const p of mp3 ? pieces : []) {
      if (p.piece_id === FREE.id) {
        p.audio = { es: { corto: { path: `libre/es/${FREE.id}_corto.mp3`, premium: false, seconds: 2 }, largo: { path: `libre/es/${FREE.id}_largo.mp3`, premium: false, seconds: 2 } } };
      }
      if (p.piece_id === PREMIUM.id) {
        p.audio = { es: { corto: { path: `pago/es/${PREMIUM.id}_corto.mp3`, premium: true, seconds: 2 }, largo: { path: `pago/es/${PREMIUM.id}_largo.mp3`, premium: true, seconds: 2 } } };
      }
    }
    await route.fulfill({ response, json: pieces });
  });
}

/** Simula que el teléfono no tiene ninguna voz instalada (así el resultado no depende de la máquina). */
export async function sinVoces(page) {
  await page.addInitScript(() => {
    if (window.speechSynthesis) window.speechSynthesis.getVoices = () => [];
  });
  // Los datos públicos ya no traen el texto de pago: se le agrega el de prueba para que haya algo que leer en voz alta
  await page.route(/\/data\/(mna\/)?pieces\.json$/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, json: (await response.json()).map(conTextoDePrueba) });
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

/**
 * Voz de mentira en español: guarda en window.__spoken cada frase que la app manda a leer (así se puede comprobar qué se dice)
 * y termina cada frase enseguida.
 */
export async function conVozFalsa(page) {
  await page.addInitScript(() => {
    window.__spoken = [];
    const voz = { name: 'Voz de prueba', lang: 'es-MX', localService: true, default: true, voiceURI: 'prueba' };
    window.SpeechSynthesisUtterance = class {
      constructor(text) {
        this.text = text;
      }
    };
    const falsa = {
      speaking: false,
      paused: false,
      pending: false,
      onvoiceschanged: null,
      getVoices: () => [voz],
      addEventListener: () => {},
      removeEventListener: () => {},
      cancel: () => {},
      pause: () => {},
      resume: () => {},
      speak: (u) => {
        window.__spoken.push(u.text);
        setTimeout(() => u.onend && u.onend({}), 5);
      },
    };
    Object.defineProperty(window, 'speechSynthesis', { value: falsa, configurable: true });
  });
}

/** Ids que usan las pruebas de enlaces entre piezas. */
export const ENLACE_A = PREMIUM; // Coatlicue
export const ENLACE_ROTO = 'mna_s99_no_existe';

/**
 * Cambia lo que entrega el servidor de textos: al final del texto corto y del largo de la pieza FREE agrega dos enlaces,
 * uno a una pieza que existe y otro a una que no. Se llama DESPUÉS de simularCobro (la última ruta registrada manda).
 */
export async function conEnlaces(page) {
  await page.route('https://pagos.test/texto/es.json**', async (route) => {
    const data = JSON.parse(JSON.stringify(TEXTOS.es));
    const p = data.pieces[FREE.id];
    const extra = `\n\nMira también a [la Coatlicue](${ENLACE_A.id}) y a [una pieza que no existe](${ENLACE_ROTO}).`;
    p.guion_corto += extra;
    p.guion_largo += extra;
    await route.fulfill({ status: 200, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(data) });
  });
}
