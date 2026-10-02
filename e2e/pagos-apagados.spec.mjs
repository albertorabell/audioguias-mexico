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
