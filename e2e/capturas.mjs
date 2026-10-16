// Capturas de pantalla de Teotihuacán (solo para revisar a ojo; no forma parte de las pruebas).
// Cada captura se reduce y se guarda como texto base64 para poder leerla desde el registro de GitHub.
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const out = 'capturas-teo';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, locale: 'es-MX', serviceWorkers: 'block' });
const page = await ctx.newPage();
const tools = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

const shot = async (name) => {
  await page.waitForTimeout(700);
  const png = (await page.screenshot()).toString('base64');
  const jpg = await tools.evaluate(async (b64) => {
    const img = new Image();
    await new Promise((r) => { img.onload = r; img.src = 'data:image/png;base64,' + b64; });
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * 0.55);
    c.height = Math.round(img.height * 0.55);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.4).split(',')[1];
  }, png);
  fs.writeFileSync(`${out}/${name}.b64`, jpg);
  console.log(name, jpg.length);
};
await tools.goto('about:blank');

await page.goto('http://localhost:4175/');
await page.waitForSelector('#sites-grid-section [role=button]');
await shot('01-inicio');
await page.locator('#sites-grid-section [role=button]').nth(1).click();
await page.waitForSelector('#rooms-list');
await shot('02-teotihuacan');
await page.getByRole('button', { name: 'Mapa' }).first().click().catch((e) => errors.push('mapa ' + e.message));
await shot('03-mapa');
await page.getByRole('button', { name: /Recorridos/ }).first().click().catch((e) => errors.push('rutas ' + e.message));
await shot('04-rutas');
console.log('ERRORES:', errors.join(' | ') || 'ninguno');
await browser.close();
