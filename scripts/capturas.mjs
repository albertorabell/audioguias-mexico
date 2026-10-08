// Saca capturas de pantalla de la app (tamaño teléfono) para revisar el diseño.
// Se corre en GitHub con el workflow "Capturas de la app". Uso: node scripts/capturas.mjs <carpeta-de-salida> [direccion-de-la-app]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { simularCobro } from '../e2e/ayudas.mjs';

const out = path.resolve(process.argv[2] || 'capturas');
const base = process.argv[3] || 'http://localhost:4173';
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const resultados = [];

async function sesion({ nombre, ancho = 390, alto = 844, init, pasos }) {
  const movil = ancho < 700;
  const ctx = await browser.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 2, locale: 'es-MX', serviceWorkers: 'block', isMobile: movil, hasTouch: movil });
  const page = await ctx.newPage();
  await simularCobro(page);
  if (init) await page.addInitScript(init);
  const shot = async (id, { full = false } = {}) => {
    const file = `${nombre}-${id}.png`;
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(out, file), fullPage: full });
    resultados.push(`OK    ${file}`);
  };
  const paso = async (id, fn) => {
    try {
      await fn();
    } catch (e) {
      resultados.push(`FALLÓ ${nombre}-${id}: ${String(e.message).split('\n')[0]}`);
    }
  };
  const entrar = async () => {
    await page.goto(base + '/');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.locator('#sites-grid-section [role=button]').first().click();
    await page.waitForTimeout(500);
  };
  try {
    await page.goto(base + '/');
    await page.waitForLoadState('networkidle').catch(() => {});
    await pasos({ page, shot, paso, entrar });
  } finally {
    await ctx.close();
  }
}

const abrirSala = async (page, nombre) => {
  await page.locator('#rooms-list button', { hasText: nombre }).first().click();
  await page.waitForTimeout(400);
};

await sesion({
  nombre: 'a-movil',
  pasos: async ({ page, shot, paso, entrar }) => {
    await paso('01-inicio', () => shot('01-inicio'));
    await paso('02-inicio-completo', () => shot('02-inicio-completo', { full: true }));
    await paso('03-idioma', async () => {
      await page.locator('#btn-language-selector').click();
      await shot('03-idioma');
      await page.keyboard.press('Escape');
    });
    await paso('04-museo', async () => {
      await entrar();
      await shot('04-museo');
      await shot('05-museo-completo', { full: true });
    });
    await paso('06-sala', async () => {
      await abrirSala(page, 'Mexica');
      await shot('06-sala');
      await shot('07-sala-completa', { full: true });
    });
    await paso('08-pieza', async () => {
      await page.locator('#btn-start-room').click();
      await shot('08-pieza');
      await shot('09-pieza-completa', { full: true });
    });
    await paso('10-pieza-completa-version', async () => {
      await page.locator('#btn-mode-full').click();
      await shot('10-pieza-version-completa');
    });
    await paso('11-pieza-siguiente', async () => {
      await page.locator('#btn-piece-next-stop').click();
      await shot('11-pieza-siguiente-bloqueada');
    });
    await paso('12-pase', async () => {
      await page.locator('#btn-master-play-piece').click();
      await shot('12-ventana-pase');
      await page.goBack();
    });
    await paso('13-recorridos', async () => {
      await page.goBack();
      await page.waitForTimeout(300);
      await page.locator('#dock-tab-recorridos').click();
      await shot('13-recorridos');
      await page.getByRole('button', { name: 'Empezar recorrido' }).first().click();
      await shot('14-recorrido-pieza');
      await page.locator('#btn-piece-next-stop').click();
      await page.goBack();
      await shot('15-recorrido-en-curso');
    });
    await paso('16-mapa', async () => {
      await page.locator('#dock-tab-mapa').click();
      await shot('16-mapa');
      await page.locator('#floor-PA').click();
      await shot('17-mapa-planta-alta');
    });
    await paso('18-buscar', async () => {
      await page.locator('#dock-tab-teclado').click();
      await shot('18-buscar');
      await page.locator('#input-search-pieces').fill('maya');
      await shot('19-buscar-maya');
    });
    await paso('20-asistente', async () => {
      await page.locator('#dock-tab-recorridos').click();
      await page.getByRole('button', { name: 'Arma tu recorrido' }).first().click();
      await shot('20-asistente');
    });
  },
});

await sesion({
  nombre: 'b-claro',
  init: () => localStorage.setItem('audioguias_theme', 'sun'),
  pasos: async ({ page, shot, paso, entrar }) => {
    await paso('01-inicio', () => shot('01-inicio'));
    await paso('02-museo', async () => {
      await entrar();
      await shot('02-museo');
      await abrirSala(page, 'Mexica');
      await page.locator('#btn-start-room').click();
      await shot('03-pieza');
      await page.mouse.wheel(0, 1500);
      await shot('04-pieza-abajo');
    });
  },
});

await sesion({
  nombre: 'c-frances',
  init: () => localStorage.setItem('audioguias_lang', 'fr'),
  pasos: async ({ page, shot, paso, entrar }) => {
    await paso('01-inicio', () => shot('01-inicio'));
    await paso('02-pieza', async () => {
      await entrar();
      await shot('02-museo');
      await abrirSala(page, 'Mexica');
      await page.locator('#btn-start-room').click();
      await shot('03-pieza');
    });
  },
});

await sesion({
  nombre: 'd-chico',
  ancho: 360,
  alto: 640,
  pasos: async ({ page, shot, paso, entrar }) => {
    await paso('01-inicio', () => shot('01-inicio'));
    await paso('02-pieza', async () => {
      await entrar();
      await shot('02-museo');
      await abrirSala(page, 'Mexica');
      await page.locator('#btn-start-room').click();
      await shot('03-pieza');
    });
  },
});

await sesion({
  nombre: 'e-escritorio',
  ancho: 1280,
  alto: 800,
  pasos: async ({ shot, paso, entrar }) => {
    await paso('01-inicio', () => shot('01-inicio'));
    await paso('02-museo', async () => {
      await entrar();
      await shot('02-museo');
    });
  },
});

await browser.close();
fs.writeFileSync(path.join(out, 'RESULTADO.txt'), resultados.join('\n') + '\n');
console.log(resultados.join('\n'));
