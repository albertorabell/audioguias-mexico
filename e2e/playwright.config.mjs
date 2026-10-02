// Pruebas en un navegador de verdad (Chromium). Se ejecutan en GitHub (rama de prueba), no en el sitio publicado.
// Dos versiones de la app: una con el cobro ENCENDIDO (puerto 4173, servidor de cobro simulado)
// y otra con el cobro APAGADO (puerto 4174), tal como queda si todavía no existe PAGOS_API_URL.
import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export default defineConfig({
  testDir: '.',
  testMatch: /.*\.spec\.mjs$/,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    serviceWorkers: 'block',
    viewport: { width: 420, height: 900 },
    locale: 'es-MX',
    screenshot: 'off',
  },
  webServer: [
    {
      command: 'npx vite preview --outDir dist-e2e --port 4173 --strictPort',
      url: 'http://localhost:4173',
      cwd: root,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: 'npx vite preview --outDir dist-e2e-off --port 4174 --strictPort',
      url: 'http://localhost:4174',
      cwd: root,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
