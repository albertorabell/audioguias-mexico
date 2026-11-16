// Abre el sitio publicado con un navegador real, entra a cada sitio en cada idioma y guarda capturas y un reporte.
// Sirve para ver lo que ve un visitante (errores de carga, textos que quedaron en español, precios).
// Se corre en GitHub con el workflow "Revisar el sitio publicado". Uso: node scripts/revisar-sitio-vivo.mjs <carpeta-de-salida> [direccion]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const out = path.resolve(process.argv[2] || 'revision-viva');
const base = (process.argv[3] || 'https://xolotli.com').replace(/\/$/, '');
const SITIOS = ['MNA', 'TEOTIHUACAN', 'CHAPULTEPEC', 'CENTRO_HISTORICO', 'CHICHEN_ITZA', 'TEMPLO_MAYOR_CATEDRAL', 'MUSEO_FRIDA_KAHLO', 'CUERNAVACA_HISTORICA', 'XOCHICALCO', 'CHALCATZINGO', 'COYOACAN', 'BASILICA_GUADALUPE'];
const IDIOMAS = (process.env.IDIOMAS || 'es,en,fr,pl,de,pt,it').split(',');
const SOLO = (process.env.SITIOS_SOLO || '').split(',').filter(Boolean);
fs.mkdirSync(path.join(out, 'capturas'), { recursive: true });
fs.mkdirSync(path.join(out, 'textos'), { recursive: true });

const ERRORES = /No se pudo cargar|Could not load|Impossible de charger|Nie udało się|konnte nicht geladen|Não foi possível carregar|Impossibile caricare/i;
// Palabras que casi solo existen en español: si salen en otro idioma, hay texto sin traducir
const ESPANOL = /\b(Recorrido|paradas|Veintiuna|Diecinueve|visita completa|zona arqueológica|Desbloquear|Empezar|Confirma|antes de ir)\b/gi;

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const filas = [];
for (const sitio of SITIOS.filter((s) => !SOLO.length || SOLO.includes(s))) {
  for (const idioma of IDIOMAS) {
    const url = `${base}/?sitio=${sitio}&idioma=${idioma}`;
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, locale: idioma === 'es' ? 'es-MX' : idioma, serviceWorkers: 'block', isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.addInitScript(() => { try { localStorage.setItem('audioguias_tour_museo', '1'); localStorage.setItem('audioguias_tour_pieza', '1'); } catch { /* sin almacenamiento */ } });
    const consola = [];
    page.on('console', (m) => { if (m.type() === 'error') consola.push(m.text().slice(0, 160)); });
    page.on('pageerror', (e) => consola.push(`pageerror: ${String(e).slice(0, 160)}`));
    let estado = 'ok';
    let texto = '';
    try {
      const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
      if (!res || res.status() >= 400) estado = `HTTP ${res ? res.status() : '?'}`;
      await page.waitForTimeout(1500);
      texto = await page.evaluate(() => document.body.innerText || '');
      const nombre = `${sitio}-${idioma}`;
      await page.screenshot({ path: path.join(out, 'capturas', `${nombre}.png`), fullPage: false });
      fs.writeFileSync(path.join(out, 'textos', `${nombre}.txt`), texto);
    } catch (e) {
      estado = `fallo: ${String(e).slice(0, 120)}`;
    }
    const error = ERRORES.test(texto);
    const espanol = idioma === 'es' ? 0 : (texto.match(ESPANOL) || []).length;
    const precio = (texto.match(/(US\$\s?\d+|MX\$\s?\d+|\d+\s?MXN|\$\s?\d+\s?MXN|€\s?\d+)/g) || []).slice(0, 3).join(' | ');
    filas.push({ sitio, idioma, estado, error, espanol, precio, consola: consola.length, vacia: texto.trim().length < 80 });
    await ctx.close();
    console.log(`${sitio} ${idioma}: ${estado}${error ? ' ERROR-EN-PANTALLA' : ''} espanol=${espanol} precio=${precio}`);
  }
}
await browser.close();

const malas = filas.filter((f) => f.estado !== 'ok' || f.error || f.vacia);
const md = [
  `# Revisión del sitio publicado (${base})`,
  '',
  `Páginas revisadas: ${filas.length}. Con error o vacías: ${malas.length}.`,
  '',
  '| Sitio | Idioma | Estado | Error en pantalla | Palabras en español | Precio | Errores de consola |',
  '|---|---|---|---|---|---|---|',
  ...filas.map((f) => `| ${f.sitio} | ${f.idioma} | ${f.estado}${f.vacia ? ' (vacía)' : ''} | ${f.error ? 'SÍ' : 'no'} | ${f.espanol} | ${f.precio} | ${f.consola} |`),
  '',
].join('\n');
fs.writeFileSync(path.join(out, 'REPORTE.md'), md);
fs.writeFileSync(path.join(out, 'reporte.json'), JSON.stringify(filas, null, 1));
