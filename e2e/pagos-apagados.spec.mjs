// Pruebas de la app con el cobro APAGADO (no existe la dirección del servidor de cobro): nada debe romperse.
import { test, expect } from '@playwright/test';
import { FREE, aislar, abrirPieza } from './ayudas.mjs';

test.use({ baseURL: 'http://localhost:4174' });

test('cobro apagado: la ventana dice que estará disponible pronto, sin botón de pagar ni llamadas', async ({ page }) => {
  const llamadas = [];
  page.on('request', (r) => {
    if (/pagos\.test|stripe/.test(r.url())) llamadas.push(r.url());
  });
  await aislar(page);
  await page.goto('/');
  await abrirPieza(page, FREE.title);
  await page.locator('#btn-unlock-pass-nav').click();
  await expect(page.locator('#modal-paywall')).toBeVisible();
  await expect(page.getByTestId('payments-unavailable')).toContainText('estará disponible muy pronto');
  await expect(page.locator('#btn-stripe-checkout')).toHaveCount(0);
  expect(llamadas).toEqual([]);
});

test('cobro apagado: un enlace de regreso de Stripe no rompe la app', async ({ page }) => {
  await aislar(page);
  await page.goto('/?pago=ok&session_id=cs_test_a1b2c3d4e5f6g7h8i9');
  await expect(page.getByText('Tu curador personal de bolsillo')).toBeVisible();
});

// La versión pública (sin VITE_PUBLISHED_LANGUAGES) solo tiene español: no se publica nada a medias.
test('versión pública: no aparece el selector de idioma y la app está en español', async ({ page }) => {
  await aislar(page);
  await page.goto('/');
  await expect(page.getByText('Tu curador personal de bolsillo')).toBeVisible();
  await expect(page.locator('#btn-language-selector')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});

test('versión pública: un idioma guardado en una visita anterior (inglés) se ignora', async ({ page }) => {
  await aislar(page);
  await page.addInitScript(() => localStorage.setItem('audioguias_lang', 'en'));
  await page.goto('/');
  await expect(page.getByText('Tu curador personal de bolsillo')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});

// ---- Cómo instalar la app (versión pública) ----
const UA_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const UA_ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';

test('instalar: la tarjeta de la pantalla de inicio abre los pasos y se puede cerrar', async ({ page }) => {
  await aislar(page);
  await page.goto('/');
  await expect(page.locator('#install-card')).toBeVisible();
  await page.locator('#btn-install-guide').click();
  const dialogo = page.locator('#modal-install-guide');
  await expect(dialogo).toBeVisible();
  await expect(dialogo).toContainText('Instalar la app');
  await expect(dialogo).toContainText('Descargar recorrido');
  await page.keyboard.press('Escape');
  await expect(dialogo).toHaveCount(0);
  await expect(page.locator('#install-card')).toBeVisible();
});

test('instalar: «No mostrar más» oculta la tarjeta y se acuerda al recargar', async ({ page }) => {
  await aislar(page);
  await page.goto('/');
  await page.locator('#btn-install-card-dismiss').click();
  await expect(page.locator('#install-card')).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('Tu curador personal de bolsillo')).toBeVisible();
  await expect(page.locator('#install-card')).toHaveCount(0);
});

test('instalar: si la app ya está instalada no se muestra la tarjeta', async ({ page }) => {
  await aislar(page);
  await page.addInitScript(() => {
    const original = window.matchMedia.bind(window);
    window.matchMedia = (q) => (String(q).includes('display-mode: standalone') ? { ...original(q), matches: true } : original(q));
  });
  await page.goto('/');
  await expect(page.getByText('Tu curador personal de bolsillo')).toBeVisible();
  await expect(page.locator('#install-card')).toHaveCount(0);
});

test('instalar: si el navegador avisa que se puede instalar, aparece «Instalar ahora» y usa el aviso del navegador', async ({ page }) => {
  await aislar(page);
  await page.goto('/');
  await page.evaluate(() => {
    const ev = new Event('beforeinstallprompt', { cancelable: true });
    ev.prompt = async () => {
      window.__instalacionPedida = true;
    };
    ev.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });
    window.dispatchEvent(ev);
  });
  await page.locator('#btn-install-guide').click();
  await page.locator('#btn-install-now').click();
  await expect.poll(() => page.evaluate(() => window.__instalacionPedida === true)).toBe(true);
  await expect(page.locator('#modal-install-guide')).toHaveCount(0);
});

test.describe('instalar: pasos según el dispositivo', () => {
  test.describe('iPhone', () => {
    test.use({ userAgent: UA_IPHONE });
    test('muestra primero los pasos de iPhone', async ({ page }) => {
      await aislar(page);
      await page.goto('/');
      await page.locator('#btn-install-guide').click();
      const primero = page.locator('[data-testid^="install-"]').first();
      await expect(primero).toHaveAttribute('data-testid', 'install-ios');
      await expect(primero).toContainText('Safari');
      await expect(primero).toContainText('Tu dispositivo');
    });
  });
  test.describe('Android', () => {
    test.use({ userAgent: UA_ANDROID });
    test('muestra primero los pasos de Android', async ({ page }) => {
      await aislar(page);
      await page.goto('/');
      await page.locator('#btn-install-guide').click();
      const primero = page.locator('[data-testid^="install-"]').first();
      await expect(primero).toHaveAttribute('data-testid', 'install-android');
      await expect(primero).toContainText('Instalar app');
    });
  });
});
