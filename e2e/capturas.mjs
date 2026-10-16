// Capturas de pantalla de Teotihuacán (solo para revisar a ojo; no forma parte de las pruebas).
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const out = 'capturas-teo';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, locale: 'es-MX', serviceWorkers: 'block' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const shot = async (name) => { await page.waitForTimeout(600); await page.screenshot({ path: `${out}/${name}.png`, fullPage: true }); };

await page.goto('http://localhost:4175/');
await page.waitForSelector('#sites-grid-section [role=button]');
await shot('01-inicio');
await page.locator('#sites-grid-section [role=button]').nth(1).click();
await page.waitForSelector('#rooms-list');
await shot('02-teotihuacan');
await page.getByRole('button', { name: 'Mapa' }).first().click().catch(() => {});
await shot('03-mapa');
await page.getByRole('button', { name: /Recorridos/ }).first().click().catch(() => {});
await shot('04-rutas');
await page.getByRole('button', { name: /Museo/ }).first().click().catch(() => {});
await page.locator('#rooms-list button').nth(2).click().catch(() => {});
await shot('05-zona');
fs.writeFileSync(`${out}/errores.txt`, errors.join('\n') || 'sin errores');
await browser.close();
