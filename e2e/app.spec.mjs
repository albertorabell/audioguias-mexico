// Pruebas de la app con el cobro ENCENDIDO (servidor de cobro simulado en https://pagos.test).
import { test, expect } from '@playwright/test';
import { FREE, PREMIUM, SESSION, TOKEN, FRASE_SECRETA, ENLACE_A, ENLACE_ROTO, aislar, simularCobro, simularAudio, sinVoces, conVozFalsa, conEnlaces, elegirIdioma, abrirPieza } from './ayudas.mjs';

test.beforeEach(async ({ page }) => {
  await aislar(page);
});

// ───────────────────────── Guías con flechas ─────────────────────────

/** Entra al museo como si fuera la primera vez (sin la marca de «guía vista»). */
async function entrarComoNuevo(page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.removeItem('audioguias_tour_museo');
    localStorage.removeItem('audioguias_tour_pieza');
  });
  await page.locator('#sites-grid-section [role=button]').first().click();
}

/** Posición en pantalla de un elemento. */
async function caja(page, selector) {
  return page.locator(selector).first().boundingBox();
}

test('guía del museo: se abre con «¿Cómo se usa?», señala los botones reales y el último paso lleva a armar la ruta', async ({ page }) => {
  await entrarComoNuevo(page);
  // Ya no se abre sola: la bienvenida de la pantalla orienta y la guía queda en «¿Cómo se usa?»
  await expect(page.locator('#modal-intro')).toHaveCount(0);
  await page.locator('#btn-open-intro').click();
  const intro = page.locator('#modal-intro');
  await expect(intro).toBeVisible();
  await expect(page.getByTestId('intro-step-label')).toHaveText(/^1 de \d+$/);
  await expect(page.getByTestId('intro-title')).toHaveText('Bienvenido a tu guía');
  // El segundo paso señala el primer recorrido: el resaltado cae sobre esa tarjeta
  await page.locator('#btn-intro-next').click();
  await expect(page.getByTestId('intro-title')).toHaveText('Recorridos ya armados');
  await expect(async () => {
    const spot = await page.getByTestId('coach-spot').boundingBox();
    const card = await caja(page, '#first-route-card');
    expect(Math.abs(spot.y - (card.y - 6))).toBeLessThan(4);
    expect(Math.abs(spot.x - (card.x - 6))).toBeLessThan(4);
  }).toPass();
  // Tercer paso: el botón de armar ruta
  await page.locator('#btn-intro-next').click();
  await expect(page.getByTestId('intro-title')).toHaveText('Arma tu propia ruta');
  await expect(async () => {
    const spot = await page.getByTestId('coach-spot').boundingBox();
    const btn = await caja(page, '#btn-open-wizard');
    expect(Math.abs(spot.y - (btn.y - 6))).toBeLessThan(4);
  }).toPass();
  // «Anterior» regresa un paso
  await page.locator('#btn-intro-back').click();
  await expect(page.getByTestId('intro-title')).toHaveText('Recorridos ya armados');
  // Hasta el último paso
  while ((await page.locator('#btn-intro-next').count()) > 0) await page.locator('#btn-intro-next').click();
  await expect(page.getByTestId('intro-title')).toHaveText('¡Listo!');
  await page.locator('#btn-intro-configure').click();
  await expect(intro).toHaveCount(0);
  await expect(page.locator('#q1-title')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('audioguias_tour_museo'))).toBe('1');
  // «Atrás» desde el asistente regresa al museo y la guía no vuelve a abrirse sola
  await page.goBack();
  await expect(page.locator('#btn-open-wizard')).toBeVisible();
  await expect(intro).toHaveCount(0);
});

test('guía del museo: «Omitir» la cierra y se marca como vista; «¿Cómo se usa?» la vuelve a abrir desde el paso 1', async ({ page }) => {
  await entrarComoNuevo(page);
  await page.locator('#btn-open-intro').click();
  await expect(page.locator('#modal-intro')).toBeVisible();
  await page.locator('#btn-intro-skip').click();
  await expect(page.locator('#modal-intro')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('audioguias_tour_museo'))).toBe('1');
  await page.locator('#btn-open-intro').click();
  await expect(page.getByTestId('intro-step-label')).toHaveText(/^1 de \d+$/);
  await page.locator('#btn-intro-next').click();
  await expect(page.getByTestId('intro-step-label')).toHaveText(/^2 de \d+$/);
  // El botón «atrás» del teléfono la cierra sin salir del museo
  await page.goBack();
  await expect(page.locator('#modal-intro')).toHaveCount(0);
  await expect(page.locator('#btn-open-wizard')).toBeVisible();
});

test('guía del museo: ya vista, no se abre sola al volver a entrar; en inglés sale en inglés', async ({ page }) => {
  await page.goto('/');
  await page.locator('#sites-grid-section [role=button]').first().click();
  await expect(page.locator('#btn-open-wizard')).toBeVisible();
  await expect(page.locator('#modal-intro')).toHaveCount(0);
  await page.goBack();
  await elegirIdioma(page, 'English');
  await page.locator('#sites-grid-section [role=button]').first().click();
  await page.locator('#btn-open-intro').click();
  await expect(page.getByTestId('intro-step-label')).toHaveText(/^1 of \d+$/);
  await expect(page.getByTestId('intro-title')).toHaveText('Welcome to your guide');
});

test('guía de la obra: la primera vez señala escuchar, versión corta/completa, texto, siguiente, regresar y buscar', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('audioguias_tour_pieza'));
  await abrirPieza(page, FREE.title);
  const tour = page.locator('#modal-piece-tour');
  await expect(tour).toBeVisible();
  await expect(page.getByTestId('intro-title')).toHaveText('Toca aquí para escuchar');
  // El resaltado cae sobre el botón de escuchar
  await expect(async () => {
    const spot = await page.getByTestId('coach-spot').boundingBox();
    const btn = await caja(page, '#btn-master-play-piece');
    expect(Math.abs(spot.y - (btn.y - 6))).toBeLessThan(4);
    expect(Math.abs(spot.x - (btn.x - 6))).toBeLessThan(4);
  }).toPass();
  // El globo no se sale de la pantalla
  const globo = await tour.locator('[aria-live=polite]').boundingBox();
  const vp = page.viewportSize();
  expect(globo.x).toBeGreaterThanOrEqual(0);
  expect(globo.x + globo.width).toBeLessThanOrEqual(vp.width);
  expect(globo.y).toBeGreaterThanOrEqual(0);
  expect(globo.y + globo.height).toBeLessThanOrEqual(vp.height);
  // Segundo paso: versión corta/completa (si la obra tiene las dos)
  await page.locator('#btn-intro-next').click();
  const titulos = [];
  titulos.push(await page.getByTestId('intro-title').innerText());
  while ((await page.locator('#btn-intro-next').count()) > 0) {
    await page.locator('#btn-intro-next').click();
    titulos.push(await page.getByTestId('intro-title').innerText());
  }
  expect(titulos).toContain('Aquí puedes leer');
  expect(titulos).toContain('Siguiente obra');
  expect(titulos).toContain('Buscar');
  await page.locator('#btn-intro-done').click();
  await expect(tour).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('audioguias_tour_pieza'))).toBe('1');
  // No vuelve a abrirse sola, pero el botón de ayuda de arriba la abre otra vez
  await expect(page.locator('#btn-piece-help')).toBeVisible();
  await page.locator('#btn-piece-help').click();
  await expect(tour).toBeVisible();
  await expect(page.getByTestId('intro-title')).toHaveText('Toca aquí para escuchar');
  await page.locator('#btn-intro-skip').click();
  await expect(tour).toHaveCount(0);
});

// ───────────────────────── Idioma ─────────────────────────

test('idioma: pasa a inglés, se queda al recargar y vuelve a español', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Tu curador personal de bolsillo')).toBeVisible();
  await expect(page.locator('#btn-language-selector')).toHaveText(/^\s*es\s*$/i);

  await elegirIdioma(page, 'English');
  await expect(page.getByText('Your personal pocket curator')).toBeVisible();
  await expect(page.locator('#btn-language-selector')).toHaveText(/^\s*en\s*$/i);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  // El nombre del museo también cambia de idioma
  await expect(page.getByText('National Museum of Anthropology').first()).toBeVisible();

  await page.reload();
  await expect(page.getByText('Your personal pocket curator')).toBeVisible();

  await elegirIdioma(page, 'Español');
  await expect(page.getByText('Tu curador personal de bolsillo')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});

test('idioma: pasa a francés (interfaz completa en francés), se queda al recargar y vuelve a español', async ({ page }) => {
  await page.goto('/');
  await elegirIdioma(page, 'Français');
  await expect(page.getByText('Votre conservateur personnel de poche')).toBeVisible();
  await expect(page.locator('#btn-language-selector')).toHaveText(/^\s*fr\s*$/i);
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await page.reload();
  await expect(page.getByText('Votre conservateur personnel de poche')).toBeVisible();
  await elegirIdioma(page, 'Español');
  await expect(page.getByText('Tu curador personal de bolsillo')).toBeVisible();
});

test('idioma: pasa a polaco (interfaz en polaco) y vuelve a español', async ({ page }) => {
  await page.goto('/');
  await elegirIdioma(page, 'Polski');
  await expect(page.getByText('Posłuchaj historii każdego dzieła')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
  await elegirIdioma(page, 'Español');
  await expect(page.getByText('Tu curador personal de bolsillo')).toBeVisible();
});

test('idioma: una pieza sin traducción se muestra y se lee en español, y avisa', async ({ page }) => {
  await sinVoces(page);
  await page.goto('/');
  await elegirIdioma(page, 'English');
  await abrirPieza(page, FREE.title);
  await expect(page.getByTestId('script-lang-note')).toContainText('does not have text in this language yet');
  // Sin voz en español instalada: el aviso sale en inglés y nombra el idioma que se iba a leer
  await page.locator('#btn-master-play-piece').click();
  await expect(page.getByText(/Your phone has no Spanish voice/)).toBeVisible();
});

test('idioma: en español no aparece el aviso de traducción', async ({ page }) => {
  await sinVoces(page);
  await page.goto('/');
  await abrirPieza(page, FREE.title);
  await expect(page.getByTestId('script-lang-note')).toHaveCount(0);
  await page.locator('#btn-master-play-piece').click();
  await expect(page.getByText(/no tiene voz en español/)).toBeVisible();
});

// ───────────────────────── MP3 ─────────────────────────

test('MP3 gratis: se reproduce el archivo de la pieza desde la carpeta libre/ del servidor de audio, sin clave (no la voz del teléfono)', async ({ page }) => {
  await simularCobro(page);
  await simularAudio(page);
  await sinVoces(page);
  await page.goto('/');
  await abrirPieza(page, FREE.title);
  await page.locator('#btn-master-play-piece').click();
  await expect.poll(() => page.evaluate(() => window.__plays.length)).toBeGreaterThan(0);
  const plays = await page.evaluate(() => window.__plays);
  expect(plays[0]).toBe(`https://pagos.test/audio/libre/es/${FREE.id}_corto.mp3`);
});

test('MP3 de pago: sin pase la pieza está bloqueada y abre la ventana de pago', async ({ page }) => {
  await simularCobro(page);
  await simularAudio(page);
  await page.goto('/');
  await abrirPieza(page, PREMIUM.title);
  await expect(page.locator('#btn-master-play-piece')).toContainText('Desbloquear audio');
  await page.locator('#btn-master-play-piece').click();
  await expect(page.locator('#modal-paywall')).toBeVisible();
  expect(await page.evaluate(() => window.__plays.length)).toBe(0);
});

test('acceso libre (pruebas): si el servidor lo avisa, la pieza de pago se abre sin pase y se muestra "Acceso libre"', async ({ page }) => {
  await simularCobro(page, { libre: true });
  await simularAudio(page, { privado: true });
  await page.goto('/');
  await abrirPieza(page, PREMIUM.title);
  await expect(page.locator('#free-access-indicator').first()).toBeVisible();
  await expect(page.locator('#btn-unlock-pass-nav')).toHaveCount(0);
  await expect(page.locator('#btn-master-play-piece')).not.toContainText('Desbloquear audio');
  await page.locator('#btn-master-play-piece').click();
  await expect.poll(() => page.evaluate(() => window.__plays.length)).toBeGreaterThan(0);
  await expect(page.locator('#modal-paywall')).toHaveCount(0);
});

// ───────────────────────── Cobro ─────────────────────────

test('cobro: la ventana muestra el precio real, y "Pagar" manda a Stripe con los datos correctos', async ({ page }) => {
  const api = await simularCobro(page);
  await page.goto('/');
  await abrirPieza(page, FREE.title);
  await page.locator('#btn-unlock-pass-nav').click();
  await expect(page.locator('#modal-paywall')).toBeVisible();
  await expect(page.getByTestId('pass-price')).toContainText('79');
  await expect(page.getByTestId('payments-unavailable')).toHaveCount(0);

  await Promise.all([page.waitForURL(/checkout\.stripe\.com/), page.locator('#btn-stripe-checkout').click()]);
  const checkout = api.calls.find((c) => c.path === '/checkout');
  expect(checkout.body.siteId).toBe('mna');
  expect(checkout.body.lang).toBe('es');
  expect(checkout.body.returnUrl).toMatch(/^http:\/\/localhost:4173\//);
  expect(checkout.body.deviceId).toMatch(/^[A-Za-z0-9_-]{8,}$/);
});

test('pase combinado: se ofrece con su precio y se compra con el sitio "todos"', async ({ page }) => {
  const api = await simularCobro(page, { combo: true });
  await page.goto('/');
  await abrirPieza(page, FREE.title);
  await page.locator('#btn-unlock-pass-nav').click();
  await expect(page.getByTestId('combo-offer')).toContainText('199');
  await Promise.all([page.waitForURL(/checkout\.stripe\.com/), page.locator('#btn-stripe-checkout-combo').click()]);
  const checkout = api.calls.find((c) => c.path === '/checkout');
  expect(checkout.body.siteId).toBe('todos');
  expect(checkout.body.promo).toBeUndefined();
  // El servidor recibió el precio del sitio pidiendo la configuración de ese sitio
  expect(api.calls.some((c) => c.path === '/config' && c.search.includes('site=mna'))).toBe(true);
});

test('sin pase combinado en el servidor, no aparece la oferta', async ({ page }) => {
  await simularCobro(page);
  await page.goto('/');
  await abrirPieza(page, FREE.title);
  await page.locator('#btn-unlock-pass-nav').click();
  await expect(page.getByTestId('pass-price')).toContainText('79');
  await expect(page.getByTestId('combo-offer')).toHaveCount(0);
});

test('sitio solo por código: no se ofrece pagar, se muestra el campo del código y se activa', async ({ page }) => {
  const api = await simularCobro(page, { acceso: 'codigo' });
  await page.goto('/');
  await abrirPieza(page, FREE.title);
  await page.locator('#btn-unlock-pass-nav').click();
  await expect(page.getByTestId('code-only')).toBeVisible();
  await expect(page.locator('#btn-stripe-checkout')).toHaveCount(0);
  await expect(page.getByTestId('pass-price')).toHaveCount(0);
  await page.locator('#input-pass-code').fill('hotel-mx1');
  await page.locator('#btn-redeem-code').click();
  await expect(page.getByTestId('pass-active')).toBeVisible();
  expect(api.calls.find((c) => c.path === '/code').body.code).toBe('HOTEL-MX1');
});

test('código de descuento: un QR con ?c= lo deja puesto, muestra el precio rebajado y se manda a Stripe', async ({ page }) => {
  const api = await simularCobro(page);
  await page.goto('/?c=hotel10');
  // La dirección queda limpia
  await expect.poll(() => new URL(page.url()).search).toBe('');
  await abrirPieza(page, FREE.title);
  await page.locator('#btn-unlock-pass-nav').click();
  await expect(page.getByTestId('promo-applied')).toContainText('HOTEL10');
  await expect(page.getByTestId('promo-applied')).toContainText('10 %');
  await expect(page.getByTestId('pass-price')).toContainText('71.1');
  await expect(page.getByTestId('pass-price-original')).toContainText('79');
  await Promise.all([page.waitForURL(/checkout\.stripe\.com/), page.locator('#btn-stripe-checkout').click()]);
  expect(api.calls.find((c) => c.path === '/checkout').body.promo).toBe('HOTEL10');
});

test('código de descuento: se escribe a mano; uno que no existe avisa y no cambia el precio', async ({ page }) => {
  const api = await simularCobro(page);
  await page.goto('/');
  await abrirPieza(page, FREE.title);
  await page.locator('#btn-unlock-pass-nav').click();
  await page.locator('#btn-have-promo').click();
  await page.locator('#input-promo-code').fill('malo');
  await page.locator('#btn-apply-promo').click();
  await expect(page.getByTestId('promo-error')).toContainText('no existe');
  await expect(page.getByTestId('pass-price')).toContainText('79');
  await page.locator('#input-promo-code').fill('hotel10');
  await page.locator('#btn-apply-promo').click();
  await expect(page.getByTestId('promo-applied')).toContainText('10 %');
  await expect(page.getByTestId('promo-error')).toHaveCount(0);
  expect(api.calls.filter((c) => c.path === '/promo').length).toBe(2);
});

test('cobro en inglés: precio en dólares y lang=en hacia Stripe', async ({ page }) => {
  const api = await simularCobro(page);
  await page.goto('/');
  await elegirIdioma(page, 'English');
  await abrirPieza(page, FREE.title);
  await page.locator('#btn-unlock-pass-nav').click();
  await expect(page.getByTestId('pass-price')).toContainText('4.99');
  await Promise.all([page.waitForURL(/checkout\.stripe\.com/), page.locator('#btn-stripe-checkout').click()]);
  expect(api.calls.find((c) => c.path === '/checkout').body.lang).toBe('en');
});

test('regreso de Stripe: confirma el pago, guarda el pase, limpia la dirección y abre el MP3 de pago con la clave', async ({ page }) => {
  const api = await simularCobro(page);
  await simularAudio(page);
  await sinVoces(page);
  await page.goto(`/?pago=ok&session_id=${SESSION}`);

  await expect(page.getByTestId('payment-notice')).toContainText('Pago confirmado');
  expect(api.calls.find((c) => c.path === '/redeem').body.sessionId).toBe(SESSION);
  expect(new URL(page.url()).search).toBe('');
  expect(await page.evaluate(() => localStorage.getItem('audioguias_pending_session'))).toBeNull();
  const license = JSON.parse(await page.evaluate(() => localStorage.getItem('audioguias_pass_mna')));
  expect(license.token).toBe(TOKEN);
  expect(license.code).toBe('ABCD-1234');

  await abrirPieza(page, PREMIUM.title);
  await expect(page.locator('#btn-pass-indicator')).toBeVisible();
  await page.locator('#btn-master-play-piece').click();
  await expect.poll(() => page.evaluate(() => window.__plays.length)).toBeGreaterThan(0);
  const plays = await page.evaluate(() => window.__plays);
  expect(plays[0]).toBe(`https://pagos.test/audio/pago/es/${PREMIUM.id}_corto.mp3?t=${TOKEN}`);
});

test('regreso de Stripe cuando Stripe aún no confirma: el pago queda pendiente y se avisa', async ({ page }) => {
  await simularCobro(page, { redeem: 'not_paid' });
  await page.goto(`/?pago=ok&session_id=${SESSION}`);
  await expect(page.getByTestId('payment-notice')).toContainText('Stripe todavía no confirma');
  // Se conserva para reintentar al volver a abrir la app
  expect(await page.evaluate(() => localStorage.getItem('audioguias_pending_session'))).toBe(SESSION);
});

test('regreso de Stripe con una página de error de Cloudflare (502 en HTML): el pago se conserva y se puede reintentar al abrir la app', async ({ page }) => {
  const api = await simularCobro(page, { redeem: 'html502' });
  await page.goto(`/?pago=ok&session_id=${SESSION}`);
  await expect(page.getByTestId('payment-notice')).toContainText('Algo falló en el servidor');
  expect(await page.evaluate(() => localStorage.getItem('audioguias_pending_session'))).toBe(SESSION);

  // Al volver a abrir la app (ya sin ?pago=ok), el pago pendiente se canjea solo y el aviso es de éxito
  api.redeem = 'ok';
  await page.goto('/');
  await expect(page.getByTestId('payment-notice')).toContainText('Pago confirmado');
  expect(await page.evaluate(() => localStorage.getItem('audioguias_pending_session'))).toBeNull();
});

test('pago cancelado en Stripe: se avisa y no se activa nada', async ({ page }) => {
  await simularCobro(page);
  await page.goto('/?pago=cancelado');
  await expect(page.getByTestId('payment-notice')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('audioguias_pass_mna'))).toBeNull();
  expect(new URL(page.url()).search).toBe('');
});

test('código del pase: límite de dispositivos, luego código bueno y se muestra el pase activo', async ({ page }) => {
  const api = await simularCobro(page, { code: 'device_limit' });
  await page.goto('/');
  await abrirPieza(page, FREE.title);
  await page.locator('#btn-unlock-pass-nav').click();
  await page.locator('#btn-have-code').click();
  await page.locator('#input-pass-code').fill('abcd1234');
  await page.locator('#btn-redeem-code').click();
  await expect(page.getByTestId('paywall-error')).toContainText('máximo de dispositivos');
  expect(api.calls.find((c) => c.path === '/code').body.siteId).toBe('mna');

  api.code = 'ok';
  await page.locator('#btn-redeem-code').click();
  await expect(page.getByTestId('pass-active')).toBeVisible();
  await expect(page.getByTestId('pass-code')).toContainText('ABCD-1234');
});

test('código del pase en inglés: el error sale en inglés', async ({ page }) => {
  await simularCobro(page, { code: 'code_not_found' });
  await page.goto('/');
  await elegirIdioma(page, 'English');
  await abrirPieza(page, FREE.title);
  await page.locator('#btn-unlock-pass-nav').click();
  await page.locator('#btn-have-code').click();
  await page.locator('#input-pass-code').fill('ZZZZ-9999');
  await page.locator('#btn-redeem-code').click();
  await expect(page.getByTestId('paywall-error')).toContainText('code does not exist');
});

// ───────────────────────── Navegación ─────────────────────────

test('navegación: una sala abre sus obras con anterior/siguiente, dice dónde estás y "atrás" vuelve a la sala', async ({ page }) => {
  await page.goto('/');
  await page.locator('#sites-grid-section [role=button]').first().click();
  await page.locator('#rooms-list button', { hasText: 'Mexica' }).click();
  await expect(page.locator('#btn-start-room')).toBeVisible();
  await page.locator('#btn-start-room').click();
  // Arriba: la sala y la posición
  await expect(page.locator('#museum-top-header')).toContainText('Mexica');
  await expect(page.locator('#museum-top-header')).toContainText(/^\s*1 de \d+/);
  const primero = await page.locator('#piece-detail-container h1').innerText();
  await page.locator('#btn-piece-next-stop').click();
  await expect(page.locator('#museum-top-header')).toContainText(/2 de \d+/);
  await expect(page.locator('#piece-detail-container h1')).not.toHaveText(primero);
  await page.locator('#btn-piece-prev-stop').click();
  await expect(page.locator('#piece-detail-container h1')).toHaveText(primero);
  // El botón atrás del teléfono regresa a la sala
  await page.goBack();
  await expect(page.locator('#btn-start-room')).toBeVisible();
});

test('navegación: una obra encontrada en Buscar se abre dentro de su sala (hay siguiente)', async ({ page }) => {
  await page.goto('/');
  await abrirPieza(page, FREE.title);
  await expect(page.locator('#museum-top-header')).toContainText('Mexica');
  await expect(page.locator('#btn-piece-next-stop')).toBeEnabled();
});

test('recorrido: al empezar uno sugerido se ve "Parada 1 de N", avanza y aparece en la pestaña Recorridos', async ({ page }) => {
  await page.goto('/');
  await page.locator('#sites-grid-section [role=button]').first().click();
  await page.locator('#dock-tab-recorridos').click();
  await page.getByRole('button', { name: 'Empezar recorrido' }).first().click();
  await expect(page.locator('#museum-top-header')).toContainText(/Parada 1 de \d+/);
  await page.locator('#btn-piece-next-stop').click();
  await expect(page.locator('#museum-top-header')).toContainText(/Parada 2 de \d+/);
  await page.goBack();
  await expect(page.locator('#active-tour')).toContainText(/Parada 2 de \d+/);
});

test('mapa: muestra las salas del piso y al tocar una se abre la sala', async ({ page }) => {
  await page.goto('/');
  await page.locator('#sites-grid-section [role=button]').first().click();
  await page.locator('#dock-tab-mapa').click();
  await page.locator('#map-view-scheme').click();
  await expect(page.locator('#floor-plan')).toBeVisible();
  await page.locator('#floor-plan button', { hasText: 'Mexica' }).click();
  await expect(page.locator('#btn-start-room')).toBeVisible();
});

test('atrás: después de cambiar de pestaña desde una pieza, un solo "atrás" lleva al inicio (sin toques muertos)', async ({ page }) => {
  await page.goto('/');
  await page.locator('#sites-grid-section [role=button]').first().click();
  await page.locator('#rooms-list button', { hasText: 'Mexica' }).click();
  await page.locator('#btn-start-room').click();
  await page.locator('#btn-nav-quick-search').click();
  await expect(page.locator('#input-search-pieces')).toBeVisible();
  await page.goBack();
  await expect(page.getByText('Tu curador personal de bolsillo')).toBeVisible();
});

test('atrás: cierra la ventana del pase y la foto ampliada sin salir de la pieza', async ({ page }) => {
  await simularCobro(page);
  await page.goto('/');
  await abrirPieza(page, FREE.title);
  await page.locator('#btn-unlock-pass-nav').click();
  await expect(page.locator('#modal-paywall')).toBeVisible();
  await page.goBack();
  await expect(page.locator('#modal-paywall')).toHaveCount(0);
  await expect(page.locator('#btn-master-play-piece')).toBeVisible();
  // Cerrar con su botón tampoco saca de la pieza
  await page.locator('#btn-unlock-pass-nav').click();
  await page.locator('#btn-close-paywall-modal').click();
  await expect(page.locator('#modal-paywall')).toHaveCount(0);
  await expect(page.locator('#btn-master-play-piece')).toBeVisible();
  // Foto ampliada: "atrás" la cierra
  await page.locator('#piece-detail-container figure button[aria-label]').last().click();
  await expect(page.locator('#modal-image-zoom')).toBeVisible();
  await page.goBack();
  await expect(page.locator('#modal-image-zoom')).toHaveCount(0);
  await expect(page.locator('#btn-master-play-piece')).toBeVisible();
  // Y un "atrás" más sí sale de la pieza
  await page.goBack();
  await expect(page.locator('#input-search-pieces')).toBeVisible();
});

test('buscar: lo escrito sigue ahí al regresar de una obra', async ({ page }) => {
  await page.goto('/');
  await abrirPieza(page, FREE.title);
  await page.goBack();
  await expect(page.locator('#input-search-pieces')).toHaveValue(FREE.title);
});

// ───────────────────────── Textos de pago ─────────────────────────

test('textos de pago: sin pase la ficha solo muestra el adelanto y el candado, y el texto completo no está en la página', async ({ page }) => {
  const api = await simularCobro(page);
  await simularAudio(page, { privado: true });
  await sinVoces(page);
  await page.goto('/');
  await abrirPieza(page, FREE.title);
  await expect(page.locator('#texto-con-pase')).toBeVisible();
  expect(await page.content()).not.toContain(FRASE_SECRETA);
  expect(api.calls.some((c) => c.path.startsWith('/texto/'))).toBe(false);
  // el botón abre la ventana del pase
  await page.locator('#btn-unlock-text').click();
  await expect(page.locator('#modal-paywall')).toBeVisible();
});

test('textos de pago: con pase se piden al servidor con la clave y aparece la explicación completa', async ({ page }) => {
  const api = await simularCobro(page);
  await simularAudio(page, { privado: true });
  await sinVoces(page);
  await page.goto(`/?pago=ok&session_id=${SESSION}`);
  await expect(page.getByTestId('payment-notice')).toContainText('Pago confirmado');
  await abrirPieza(page, FREE.title);
  await expect(page.locator('#texto-con-pase')).toHaveCount(0);
  await expect(page.getByText(FRASE_SECRETA, { exact: false })).toHaveCount(0); // en la versión corta aún no está esta frase
  await page.locator('#btn-mode-full').click();
  await expect(page.getByText(FRASE_SECRETA, { exact: false })).toBeVisible();
  const pedido = api.calls.find((c) => c.path === '/texto/es.json');
  expect(pedido.search).toBe(`?t=${TOKEN}`);
});

test('textos de pago: si el servidor ya no reconoce la clave (reembolso), el pase se quita y vuelve el candado', async ({ page }) => {
  const api = await simularCobro(page, { texto: 'denegado' });
  await simularAudio(page, { privado: true });
  await page.goto(`/?pago=ok&session_id=${SESSION}`);
  await expect(page.getByTestId('payment-notice')).toContainText('Pago confirmado');
  await abrirPieza(page, FREE.title);
  await expect(page.locator('#texto-con-pase')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('audioguias_pass_mna'))).toBeNull();
  expect(api.calls.some((c) => c.path === '/texto/es.json')).toBe(true);
});

test('textos de pago: sin internet, con pase, se usa la copia guardada en el teléfono', async ({ page }) => {
  const api = await simularCobro(page);
  await simularAudio(page, { privado: true });
  await page.goto(`/?pago=ok&session_id=${SESSION}`);
  await expect(page.getByTestId('payment-notice')).toContainText('Pago confirmado');
  await abrirPieza(page, FREE.title);
  await page.locator('#btn-mode-full').click();
  await expect(page.getByText(FRASE_SECRETA, { exact: false })).toBeVisible();
  // se corta el servidor de textos y se vuelve a abrir la app
  api.texto = 'caido';
  await page.route('https://pagos.test/texto/**', (route) => route.abort());
  await page.reload();
  await abrirPieza(page, FREE.title);
  await page.locator('#btn-mode-full').click();
  await expect(page.getByText(FRASE_SECRETA, { exact: false })).toBeVisible();
});

// ───────────────────────── Enlaces entre piezas ─────────────────────────

/** Con pase, abre la ficha de la pieza FREE con dos enlaces al final del texto (uno válido y uno a una pieza que no existe). */
async function abrirPiezaConEnlaces(page, { mp3 = true } = {}) {
  await simularCobro(page);
  await simularAudio(page, { privado: true, mp3 });
  await conVozFalsa(page);
  await conEnlaces(page);
  await page.goto(`/?pago=ok&session_id=${SESSION}`);
  await expect(page.getByTestId('payment-notice')).toContainText('Pago confirmado');
  await abrirPieza(page, FREE.title);
  const enlace = page.locator('button.piece-link');
  await expect(enlace).toHaveCount(1);
  return enlace;
}

test('enlaces: en el texto se ve solo la palabra (sin la marca) y un enlace a una pieza que no existe queda como texto normal', async ({ page }) => {
  const enlace = await abrirPiezaConEnlaces(page);
  await expect(enlace).toHaveText('la Coatlicue');
  await expect(page.getByText('una pieza que no existe', { exact: false })).toBeVisible();
  const texto = page.locator('#piece-detail-container');
  await expect(texto).not.toContainText('](');
  await expect(texto).not.toContainText('mna_s');
});

test('enlaces: tocar el enlace abre la ventanita; al cerrarla se vuelve al mismo lugar de la lectura', async ({ page }) => {
  const enlace = await abrirPiezaConEnlaces(page);
  await enlace.scrollIntoViewIfNeeded();
  const antes = await page.evaluate(() => Math.round(window.scrollY));
  await enlace.click();
  const ventana = page.locator('#modal-piece-peek');
  await expect(ventana).toBeVisible();
  await expect(ventana.getByRole('heading', { name: ENLACE_A.title })).toBeVisible();
  await expect(ventana.getByTestId('peek-open')).toBeVisible();
  await ventana.getByTestId('peek-close').click();
  await expect(ventana).toHaveCount(0);
  await expect(page.locator('h1')).toHaveText(FREE.title);
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - antes)).toBeLessThan(4);
});

test('enlaces: el botón "atrás" del teléfono cierra la ventanita y deja la pieza que se leía', async ({ page }) => {
  const enlace = await abrirPiezaConEnlaces(page);
  await enlace.click();
  await expect(page.locator('#modal-piece-peek')).toBeVisible();
  await page.goBack();
  await expect(page.locator('#modal-piece-peek')).toHaveCount(0);
  await expect(page.locator('h1')).toHaveText(FREE.title);
  // y otra vez "atrás" sí sale de la pieza (la ventana no dejó entradas de más en el historial)
  await page.goBack();
  await expect(page.locator('#input-search-pieces')).toBeVisible();
});

test('enlaces: "Ver la pieza completa" abre la otra pieza y con "atrás" se regresa a la que se leía', async ({ page }) => {
  const enlace = await abrirPiezaConEnlaces(page);
  await enlace.scrollIntoViewIfNeeded();
  const antes = await page.evaluate(() => Math.round(window.scrollY));
  await enlace.click();
  await page.locator('#modal-piece-peek').getByTestId('peek-open').click();
  await expect(page.locator('#modal-piece-peek')).toHaveCount(0);
  await expect(page.locator('h1')).toHaveText(ENLACE_A.title);
  await page.goBack();
  await expect(page.locator('h1')).toHaveText(FREE.title);
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - antes)).toBeLessThan(4);
  // una sola vez "atrás" bastó: otra más sale de la pieza
  await page.goBack();
  await expect(page.locator('#input-search-pieces')).toBeVisible();
});

test('enlaces: la voz lee solo el texto visible (nunca la marca ni el identificador)', async ({ page }) => {
  await abrirPiezaConEnlaces(page, { mp3: false }); // sin MP3: lee la voz del teléfono
  await page.locator('#btn-master-play-piece').click();
  await expect.poll(() => page.evaluate(() => window.__spoken.join(' '))).toContain('la Coatlicue');
  const dicho = await page.evaluate(() => window.__spoken.join(' '));
  expect(dicho).toContain('una pieza que no existe');
  expect(dicho).not.toMatch(/mna_s|\]\(|\[/);
  expect(dicho).not.toContain(ENLACE_ROTO);
});

test('velocidad de la voz: 0.75×, 1×, 1.5× y 2×; se aplica al MP3, se marca la elegida y se recuerda al volver', async ({ page }) => {
  await simularCobro(page);
  await simularAudio(page);
  await sinVoces(page);
  await page.addInitScript(() => {
    window.__rates = [];
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...args) {
      window.__rates.push(this.playbackRate);
      return original.apply(this, args);
    };
  });
  await page.goto('/');
  await abrirPieza(page, FREE.title);
  const control = page.locator('#speed-control');
  await expect(control.getByRole('button')).toHaveText(['0.75×', '1×', '1.5×', '2×']);
  // Por defecto: 1×
  await expect(page.locator('#btn-speed-1')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#btn-speed-1_5').click();
  await expect(page.locator('#btn-speed-1_5')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#btn-speed-1')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#btn-master-play-piece').click();
  await expect.poll(() => page.evaluate(() => window.__rates.length)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__rates[0])).toBe(1.5);
  // Cambiarla con el audio sonando
  await page.locator('#btn-speed-2').click();
  await expect(page.locator('#btn-speed-2')).toHaveAttribute('aria-pressed', 'true');
  // Se recuerda al recargar
  await page.reload();
  await abrirPieza(page, FREE.title);
  await expect(page.locator('#btn-speed-2')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => localStorage.getItem('audioguias_velocidad'))).toBe('2');
});

test('inicio del sitio: presentación con «Seguir leyendo» y estante de recorridos con su duración', async ({ page }) => {
  await page.goto('/');
  await page.locator('#sites-grid-section [role=button]').first().click();
  await expect(page.locator('#site-intro p')).toHaveCount(1);
  await page.locator('#btn-intro-more').click();
  expect(await page.locator('#site-intro p').count()).toBeGreaterThan(1);
  await expect(page.locator('#first-route-card')).toContainText(/\d+ min|\d+ h/);
});

test('armar a tu medida: más tiempo, más obras; se puede quitar una obra y el recorrido arranca', async ({ page }) => {
  await page.goto('/');
  await page.locator('#sites-grid-section [role=button]').first().click();
  await page.locator('#btn-open-wizard').click();
  await page.getByRole('radio', { name: /^30 min/ }).click();
  const filas = page.locator('#preview-title ~ div ol li');
  const pocas = await filas.count();
  await page.getByRole('radio', { name: /^3 horas/ }).click();
  await expect.poll(async () => filas.count()).toBeGreaterThan(pocas);
  await filas.first().getByRole('button').click();
  await page.locator('#btn-start-route-fixed').click();
  await expect(page.locator('#museum-top-header')).toContainText(/Parada 1 de \d+/);
});
