# Arquitectura y mapa del código

## 1. Vista general

```
Google Sheets (CONTROL + una hoja por sitio)   ← aquí se edita todo el contenido
        │  npm run sync-data  (scripts/sync-sheets.js)
        ▼
public/data/*.json  (textos gratis, salas, rutas, sitios)      datos-privados/ (textos de pago, NO van al repo)
        │                                                              │ scripts/subir-textos.mjs
        ▼                                                              ▼
Vite + React  →  dist/  →  Cloudflare Pages (xolotli.com)      Cloudflare R2 (texto/<idioma>.json)
                                   │                                   ▲
                                   │ pide audios, pases, pagos         │
                                   ▼                                   │
                        Worker de cobro (pagos/)  ──────────────  R2 audioguias-audio (libre/ y pago/)
                         Stripe · KV PASES · códigos
```

- **Fuente de verdad:** los Sheets. `sync-sheets.js` no corrige ni inventa: si algo está mal, falla y no publica nada.
- **Texto de pago:** separado de los datos públicos (`splitPiece` en la sincronización); el Worker lo entrega solo con un pase vigente.
- **Audios:** MP3 generados con `scripts/generar-audio.mjs`, listados en `public/audio/manifest.json` y guardados en R2. La app usa el MP3 si existe; si no, la voz sintética del teléfono (`src/utils/ttsPlayer.ts`).

## 2. La app (`src/`)

| Archivo / carpeta | Función |
|---|---|
| `main.tsx` | Arranque: monta `ThemeProvider` → `LanguageProvider` → `App` y activa la protección anti‑copia. |
| `App.tsx` | Cerebro de la navegación: elige sitio, pestaña (Museo, Recorridos, Mapa, Buscar), pieza abierta, pase de pago y recorrido en curso. |
| `types.ts` | Tipos de datos: sitios, salas, piezas, rutas, licencias. |
| `components/` | Pantallas y piezas de interfaz (ver tabla abajo). |
| `components/ui/` | Barra superior, pestañas, botones de idioma/tema/pase. |
| `config/` | Reglas y datos fijos: pase (`pass.ts`), URL de pagos (`payments.ts`), planos de sitios (`sitePlan.ts`, `plans/`, `mnaPlan.tsx`, `mnaGeo.ts`), contacto. |
| `i18n/` | Textos de interfaz y contenido por idioma (sección 3). |
| `utils/` | Lógica sin pantalla: pagos, licencias, audio, reproductor, offline, mapas, analítica. |

### Componentes principales
- **Entrada:** `Home` (lista de sitios), `FooterLinks`, `InstallHelp`, `IntroTour`/`CoachTour`/`PieceTour` (recorridos de bienvenida).
- **Museo:** `MuseumScreen` (salas por piso), `MuseumPlan` y `FloorPlan` (plano), `RoomView` (piezas de una sala), `SitePlanView` (plano de sitios con paradas exactas), `LiveMap`/`MapScreen` (mapa real con MapLibre, se carga solo al abrirlo).
- **Pieza:** `PieceDetail` (ficha y audio), `PieceDock` (reproductor), `PieceImage`, `ImageZoomModal`, `PiecePeek` (vista rápida), `LinkedText` (enlaces entre piezas), `PieceFeedback` y `ContactForm`.
- **Recorridos:** `RoutesScreen`, `RouteWizard` («Armar a tu medida»), `PlanGuide` (cómo llegar a la siguiente parada), `TourCompletionView`, `OfflineTourBanner`.
- **Cobro:** `PaywallModal`.
- **Otros:** `SearchScreen`, `ErrorBoundary`, `OfflineIndicator`.

### Utilidades clave
- `license.ts`: pase de visitante en el dispositivo (`PASS_HOURS`, `PASS_MAX_DEVICES` en `config/pass.ts`; deben coincidir con el Worker).
- `payments.ts` + `premiumText.ts`: hablar con el Worker (checkout, canjear código, pedir texto de pago).
- `audioSource.ts`: decide qué MP3 pedir (modo exprés = guion corto, inmersión = guion largo; libre vs. pago).
- `ttsPlayer.ts`: reproductor híbrido (MP3 con prioridad, voz del teléfono como respaldo, velocidad, avance).
- `offlineTourManager.ts`: descarga un recorrido a CacheStorage para usarlo sin internet; el service worker lo genera `vite-plugin-pwa`.
- `routeOptimizer.ts`: arma recorridos según tiempo y temas.
- `analytics.ts`: conteo anónimo (sin identificadores de dispositivo).
- `urlHelper.ts`: rutas de datos e imágenes, alias de piezas, normalización.

## 3. Idiomas (`src/i18n/`)

- `languages.ts`: lista de idiomas conocidos y **`PUBLISHED_LANGUAGES`** (los que ve el público). Hoy: es, en, fr, pl, de, pt, it. `ru` y `ja` existen pero están apagados.
- `groups/*.ts`: textos de interfaz por grupo con `defineGroup({ es, en })`. `es` define la forma; `en` debe tener las mismas claves (el compilador avisa).
- `pl.ts`, `de.ts`, `pt.ts`, `it.ts`: grupos de cada idioma adicional. **Lo que falte cae en español en silencio** (`getStrings` en `index.ts`), por eso conviene revisar con una auditoría al agregar texto nuevo.
- `sitio.ts`: cambia el vocabulario para sitios al aire libre («zona», «parada»).
- `content.ts`: textos de piezas y salas por idioma, leídos de columnas `<campo>_<idioma>` del Sheet (`titulo_en`, `guion_corto_fr`…).
- `aviso.ts`, `contacto.ts`, `reproductor.ts`: textos legales, formulario y accesibilidad del reproductor.

### Cómo agregar un idioma
1. Traducir interfaz (`src/i18n/<idioma>.ts` + registrar en `index.ts` y `languages.ts`).
2. Traducir contenido: columnas `*_<idioma>` en los Sheets (a mano, con `scripts/traducir.mjs`, o la tarea semanal).
3. Voz y pronunciación (`glosario/`), generar audios.
4. SEO (`scripts/seo-lib.mjs`, `generar-paginas-seo.mjs`).
5. Revisión por persona nativa y entonces agregarlo a `PUBLISHED_LANGUAGES`.

## 4. Flujo de datos y publicación

1. **Sync** (`scripts/sync-sheets.js`): lee los Sheets, valida (por ejemplo, que ninguna ruta quede sin paradas), escribe `public/data/{rooms,pieces,sites}.json` y una carpeta por sitio (`mna/`, `teotihuacan/`, `chapultepec/`…), y separa los textos de pago a `datos-privados/`.
2. **Compilar:** `tsc` + `vite build` (PWA incluida).
3. **SEO:** `generar-paginas-seo.mjs` escribe páginas públicas por sitio e idioma y `sitemap.xml` en `dist/`.
4. **Subir** a Cloudflare Pages (`desplegar-cloudflare.yml`).
5. **Audio y texto de pago:** se generan/suben aparte (ver `AUTOMATIZACIONES.md`).

## 5. Servidor de cobro (`pagos/`)

Worker de Cloudflare (`pagos/src`, `wrangler.toml`): rutas `/config`, `/checkout`, `/promo`, `/redeem`, `/code`, `/status`, `/audio/libre|pago`, `/health`. El pase empieza al canjearlo; dura `PASS_HOURS` (72), máximo `MAX_DEVICES` (2) dispositivos y sesión de hasta `SESSION_MAX_DAYS` (30). CORS por `ALLOWED_ORIGINS`. Sin `STRIPE_SECRET_KEY` o `TOKEN_SECRET` responde 503. Almacenamiento: KV `PASES`, R2 `audioguias-audio`. Detalle y pruebas: `pagos/README.md`.

## 6. Scripts (`scripts/`)

Agrupados por tema; cada archivo trae su explicación y modo de uso en el encabezado.

- **Datos:** `sync-sheets.js`, `sitios-lib.mjs`, `sitios-extra-lib.mjs`, `privado-lib.mjs`, `google-sheets-lib.mjs`.
- **Traducción:** `traducir.mjs`, `traducir-lib.mjs`.
- **Audio:** `generar-audio.mjs`, `audio-lib.mjs`, `correr-generar-audio.sh`, `subir-audio.mjs`, `unir-manifiesto.mjs`, `guardar-manifiesto.sh`, `borrar-audios.mjs`, `revisar-audio-r2.mjs`, `descargar-audios.mjs`, `muestras-voz.mjs`, `pronunciacion-lib.mjs`, `google-ipa-lib.mjs`, `generar-glosario-google.mjs`, `r2-lib.mjs`.
- **Fotos y mapas:** `descargar-fotos.mjs`, `buscar-fotos.mjs`, `fotos/*.json`, `mapa/obtener-coordenadas.mjs`, `mapas-en-vivo.json`.
- **SEO:** `generar-paginas-seo.mjs`, `seo-lib.mjs`.
- **Operación:** `respaldo.mjs`, `resumen-uso.mjs`, `capturas.mjs`, `ci-run.mjs`, `cloudflare-dominio.py`, `cloudflare-revisar.py`, `crear-datos-de-ensayo.mjs`.

## 7. Pruebas

- `npm test` → `scripts/tests/*.test.mjs` y `pagos/test/*.test.mjs` (Node test runner).
- `e2e/` → Playwright (navegador), se corre en el workflow «Verificar rama».
- `npm run lint` → `tsc --noEmit`.
- Prueba útil para idiomas: `scripts/tests/enlaces.test.mjs` (enlaces entre piezas por idioma).

## 8. Convenciones

- Código y comentarios en español sencillo; lo que ve el público nunca debe exponer rutas internas ni claves.
- Un cambio = una rama + un Pull Request; `main` se publica solo.
- Al agregar texto de interfaz, agregarlo en **todos** los idiomas publicados (o aceptar conscientemente el respaldo en español).
- Documentar siempre lo nuevo (`CLAUDE.md`).
