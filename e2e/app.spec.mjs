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
  await expect(page.locator('#btn-language-selector')).toContainText('ES');

  await elegirIdioma(page, 'English');
  await expect(page.getByText('Your personal pocket curator')).toBeVisible();
  await expect(page.locator('#btn-language-selector')).toContainText('EN');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  // El nombre del museo también cambia de idioma
  await expect(page.getByText('National Museum of Anthropology').first()).toBeVisible();

  await page.reload();
  await expect(page.getByText('Your personal pocket curator')).toBeVisible();

  await elegirIdioma(page, 'Español');
  await expect(page.getByText('Tu curador personal de bolsillo')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
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

test('MP3 gratis: se reproduce el archivo de la pieza (no la voz del teléfono)', async ({ page }) => {
  await simularAudio(page);
  await sinVoces(page);
  await page.goto('/');
  await abrirPieza(page, FREE.title);
  await page.locator('#btn-master-play-piece').click();
  await expect.poll(() => page.evaluate(() => window.__plays.length)).toBeGreaterThan(0);
  const plays = await page.evaluate(() => window.__plays);
  expect(plays[0]).toBe(`http://localhost:4173/audio/es/${FREE.id}_corto.mp3`);
});

test('MP3 de pago: sin pase la pieza está bloqueada y abre la ventana de pago', async ({ page }) => {
  await simularCobro(page);
  await simularAudio(page);
  await page.goto('/');
  await abrirPieza(page, PREMIUM.title);
  await expect(page.locator('#btn-master-play-piece')).toContainText('Desbloquear audioguía premium');
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
  expect(plays[0]).toBe(`https://pagos.test/audio/es/${PREMIUM.id}_corto.mp3?t=${TOKEN}`);
});

test('regreso de Stripe cuando Stripe aún no confirma: el pago queda pendiente y se avisa', async ({ page }) => {
  await simularCobro(page, { redeem: 'not_paid' });
  await page.goto(`/?pago=ok&session_id=${SESSION}`);
  await expect(page.getByTestId('payment-notice')).toContainText('Stripe todavía no confirma');
  // Se conserva para reintentar al volver a abrir la app
  expect(await page.evaluate(() => localStorage.getItem('audioguias_pending_session'))).toBe(SESSION);
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
