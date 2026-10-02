import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    base: './', // <-- Resuelve las rutas en GitHub Pages
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'apple-touch-icon.png',
          'icon.svg',
          'data/**/*.json',
        ],
        manifest: {
          id: '/',
          name: 'Audioguías México',
          short_name: 'Audioguías',
          description: 'PWA de audioguías para museos y sitios arqueológicos de México con modo offline.',
          theme_color: '#0B0B0E',
          background_color: '#0B0B0E',
          display: 'standalone',
          start_url: './',
          scope: './',
          orientation: 'portrait',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/upload\.wikimedia\.org\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'wikimedia-images-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // Audios MP3: se sirven desde el caché del modo sin conexión (el mismo que llena "Descargar recorrido",
              // ver CACHE_NAME en src/utils/offlineTourManager.ts). rangeRequests permite adelantar/retroceder sin internet.
              // ignoreSearch: la clave del pase va en la dirección (?t=...) y cambia, el archivo es el mismo.
              urlPattern: /\/audio\/.*\.mp3(\?.*)?$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'mna-offline-tour-v1',
                rangeRequests: true,
                matchOptions: { ignoreSearch: true },
                cacheableResponse: {
                  statuses: [200],
                },
              },
            },
            {
              urlPattern: /\/data\/.*\.json$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'museum-data-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 14,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
