// El panel de uso (panel.html) con un servidor de estadísticas simulado: carga, dibuja las gráficas y compara con el periodo anterior.
import { test, expect } from '@playwright/test';
import { aislar, sinAvisosCsp } from './ayudas.mjs';

test.afterEach(async ({ page }) => {
  await sinAvisosCsp(page);
});

function conteos(dias) {
  const out = {};
  for (let i = 0; i < dias; i++) {
    const d = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
    out[d] = { 'app_open|mna||es||directo': 30 + (dias - i), 'visitor_new|mna||||': 10 + Math.floor((dias - i) / 3), 'paywall_open|mna|||||': 5, 'purchase|mna||||mxn': i % 5 === 0 ? 1 : 0 };
  }
  return out;
}

test('panel: entra con la clave, dibuja las gráficas de visitantes, compara con el periodo anterior y cambia de agrupación', async ({ page }) => {
  await aislar(page);
  const pedidos = [];
  await page.route('https://pagos.test/**', async (route) => {
    const h = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };
    const url = route.request().url();
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: h });
    pedidos.push(url);
    if (url.includes('/estadisticas')) return route.fulfill({ headers: h, json: { dias: 60, exacto: true, conteos: conteos(60) } });
    return route.fulfill({ headers: h, json: { conteos: {}, mensajes: [] } });
  });
  await page.goto('/panel.html');
  await page.fill('#api', 'https://pagos.test');
  await page.fill('#key', 'clave');
  await page.click('#loginForm button[type=submit]');
  await expect(page.locator('#chVisitas svg.chart')).toBeVisible();
  // Pide el doble de días para poder comparar con el periodo anterior
  expect(pedidos.some((u) => /estadisticas\?dias=60/.test(u))).toBe(true);
  await expect(page.locator('#tiles .tile', { hasText: 'Visitantes nuevos' })).toBeVisible();
  await expect(page.locator('#tiles .tile small').first()).toContainText('vs periodo anterior');
  await expect(page.locator('#exactNote')).toContainText('exactos');
  expect(await page.locator('svg.chart').count()).toBe(4);
  // Cambiar a semanas redibuja con menos puntos
  const puntosDia = await page.locator('#chVisitas circle').count();
  await page.selectOption('#gran', 'week');
  const puntosSemana = await page.locator('#chVisitas circle').count();
  expect(puntosSemana).toBeLessThan(puntosDia);
  // Al pasar a 7 días, vuelve a pedir datos
  await page.selectOption('#days', '7');
  await expect(page.locator('#chVisitas svg.chart')).toBeVisible();
});

test('panel: una clave incorrecta avisa y no muestra nada', async ({ page }) => {
  await aislar(page);
  await page.route('https://pagos.test/**', (route) => route.fulfill({ status: 401, headers: { 'access-control-allow-origin': '*' }, json: { error: 'unauthorized' } }));
  await page.goto('/panel.html');
  await page.fill('#api', 'https://pagos.test');
  await page.fill('#key', 'mala');
  await page.click('#loginForm button[type=submit]');
  await expect(page.locator('#loginErr')).toContainText('clave');
  await expect(page.locator('#view')).toBeHidden();
});
