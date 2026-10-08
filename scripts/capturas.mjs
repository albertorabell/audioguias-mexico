// Saca capturas de pantalla de la app (tamaño teléfono) para revisar el diseño.
// Se corre en GitHub con el workflow "Capturas de la app". Uso: node scripts/capturas.mjs <carpeta-de-salida> [direccion-de-la-app]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { FREE, PREMIUM, simularCobro, elegirIdioma, abrirPieza } from '../e2e/ayudas.mjs';

const out = path.resolve(process.argv[2] || 'capturas');
const base = process.argv[3] || 'http://localhost:4173';
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const resultados = [];

async function sesion({ nombre, ancho, alto, idioma, pasos }) {
  const ctx = await browser.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 2, locale: 'es-MX', serviceWorkers: 'block', isMobile: ancho < 700, hasTouch: ancho < 700 });
  const page = await ctx.newPage();
  await simularCobro(page);
  const shot = async (id, { full = false } = {}) => {
    const file = `${nombre}-${id}.png`;
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(out, file), fullPage: full });
    resultados.push(`OK    ${file}`);
  };
  const paso = async (id, fn) => {
    try { await fn(); } catch (e) { resultados.push(`FALLÓ ${nombre}-${id}: ${String(e.message).split('\n')[0]}`); }
  };
  try {
    await page.goto(base + '/');
    await page.waitForLoadState('networkidle').catch(() => {});
    if (idioma) await paso('idioma', () => elegirIdioma(page, idioma));
    await pasos({ page, shot, paso });
  } finally {
    await ctx.close();
  }
}

const flujoCompleto = async ({ page, shot, paso }) => {
  await paso('01-inicio', () => shot('01-inicio'));
  await paso('02-inicio-completo', () => shot('02-inicio-completo', { full: true }));
  await paso('03-selector-idioma', async () => {
    await page.locator('#btn-language-selector').click();
    await shot('03-selector-idioma');
    await page.keyboard.press('Escape');
    await page.mouse.click(5, 300);
  });
  await paso('04-museo', async () => {
    await page.locator('#sites-grid-section [role=button]').first().click();
    await shot('04-museo');
    await shot('05-museo-completo', { full: true });
  });
  for (const tab of ['recorridos', 'mapa', 'teclado']) {
    await paso(`06-${tab}`, async () => {
      await page.locator(`#dock-tab-${tab}`).click();
      await shot(`06-${tab}`);
    });
  }
  await paso('07-pieza', async () => {
    await page.goto(base + '/');
    await abrirPieza(page, FREE.title);
    await shot('07-pieza');
    await shot('08-pieza-completa', { full: true });
  });
  await paso('09-pieza-pago', async () => {
    await page.goto(base + '/');
    await abrirPieza(page, PREMIUM.title);
    await page.locator('#btn-master-play-piece').click();
    await shot('09-pieza-pago-ventana');
  });
};

await sesion({ nombre: 'movil-es', ancho: 390, alto: 844, pasos: flujoCompleto });
await sesion({ nombre: 'movil-pequeno-es', ancho: 360, alto: 640, pasos: async ({ page, shot, paso }) => {
  await paso('01-inicio', () => shot('01-inicio'));
  await paso('07-pieza', async () => { await abrirPieza(page, FREE.title); await shot('07-pieza'); });
} });
await sesion({ nombre: 'movil-fr', ancho: 390, alto: 844, idioma: 'Français', pasos: async ({ page, shot, paso }) => {
  await paso('01-inicio', () => shot('01-inicio'));
  await paso('07-pieza', async () => { await abrirPieza(page, FREE.title); await shot('07-pieza'); });
} });
await sesion({ nombre: 'escritorio-es', ancho: 1280, alto: 800, pasos: async ({ page, shot, paso }) => {
  await paso('01-inicio', () => shot('01-inicio'));
  await paso('04-museo', async () => { await page.locator('#sites-grid-section [role=button]').first().click(); await shot('04-museo'); });
} });

await browser.close();
fs.writeFileSync(path.join(out, 'RESULTADO.txt'), resultados.join('\n') + '\n');
console.log(resultados.join('\n'));
