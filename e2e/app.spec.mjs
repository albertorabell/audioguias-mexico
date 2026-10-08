// Pruebas de la app con el cobro ENCENDIDO (servidor de cobro simulado en https://pagos.test).
import { test, expect } from '@playwright/test';
import { FREE, PREMIUM, SESSION, TOKEN, aislar, simularCobro, simularAudio, sinVoces, elegirIdioma, abrirPieza } from './ayudas.mjs';

test.beforeEach(async ({ page }) => {
  await aislar(page);
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
