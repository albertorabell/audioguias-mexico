# Automatizaciones (GitHub Actions)

Hay 15 workflows en `.github/workflows/`. Casi todos son **botones manuales**: GitHub → pestaña **Actions** → elegir el workflow → **Run workflow**. Las claves viven en *Settings → Secrets and variables → Actions*.

Regla general de seguridad: los que gastan dinero (voz, traducción) **solo muestran el plan y el costo** a menos que se marque la casilla «generar».

## Resumen

| Workflow | Cuándo corre | Qué hace | Gasta |
|---|---|---|---|
| Publicar la app en Cloudflare Pages (`desplegar-cloudflare`) | Al entrar a `main`; en `feature/**` (prueba); manual | Compila la app leyendo los Sheets y la sube a Pages | No |
| Verificar rama (`verificar-rama`) | Al subir ramas; manual | Revisa que compile y pasen las pruebas. No publica | No |
| Respaldo semanal (`respaldo-semanal`) | Domingos 10:00 UTC (4:00 CDMX); manual | Copias de seguridad a Drive y R2 | No |
| Publicar el servidor de cobro (`desplegar-pagos`) | Manual | Sube `pagos/` a Cloudflare y guarda sus claves | No |
| Publicar códigos de acceso (`publicar-codigos`) | Manual | Manda la hoja CODIGOS al servidor de cobro | No |
| Traducir textos (`traducir`) | Manual | Traduce piezas y salas con la API de Claude | Sí |
| Generar audios MP3 (`generar-audio`) | Manual | Crea MP3 y los sube a R2 | Sí |
| Muestras de voz (`muestras-voz`) | Manual | MP3 cortos con varias voces para elegir | Poco |
| Revisar audios en R2 (`revisar-audio-r2`) | Manual | Compara el manifiesto contra lo que hay en R2 | No |
| Descargar audios (`descargar-audios`) | Manual | Baja los MP3 de un idioma como zip (dura 1 día) | No |
| Descargar fotos de un sitio (`descargar-fotos`) | Manual | Revisa licencias en Wikimedia y baja fotos `.webp` | No |
| Datos del mapa (`datos-mapa`) | Manual | Coordenadas candidatas (OSM/Wikipedia) y recorte de mapa | No |
| Capturas de la app (`capturas`) | Manual | Capturas de pantalla (teléfono y escritorio) | No |
| Resumen de uso de la app (`resumen-uso`) | Manual | Resumen anónimo de uso | No |
| Revisar permisos de Cloudflare (`cloudflare-revisar`) | Manual | Solo lee: dice qué puede hacer la llave de Cloudflare | No |

## Detalle

### Publicar la app en Cloudflare Pages
- **Entradas:** push a `main` (producción: xolotli.com), push a `feature/**` (dirección de prueba con `noindex`), o botón.
- **Pasos:** `npm run build` (sincroniza Sheets → JSON, compila TypeScript y Vite, genera páginas SEO y sitemap) → sube `dist/` al proyecto `audioguias`; con la opción `conectar_dominio = sí` también conecta xolotli.com y su DNS (`scripts/cloudflare-dominio.py`). Los textos de pago se suben a R2 con `scripts/subir-textos.mjs` (no está en ningún workflow: se corre a mano con `--simular` primero).
- **Secretos:** `GOOGLE_SERVICE_ACCOUNT_JSON`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN_DNS`.
- **Si falla:** abrir la corrida; los pasos que usan `scripts/ci-run.mjs` dejan el error como anotación visible.

### Verificar rama
Corre pruebas de scripts y del Worker de cobro, `tsc`, `vite build`, pruebas de navegador (Playwright), un ensayo de audios con voz de prueba (sin gastar) y la sincronización de Sheets. No publica. Secreto: `GOOGLE_SERVICE_ACCOUNT_JSON`.

### Respaldo semanal
- **Script:** `scripts/respaldo.mjs` con tres modos: `--textos` (todos los textos de todos los idiomas al Sheet «RESPALDO - Textos todos los idiomas» en Drive), `--archivo` (`.tar.gz` con textos, traducciones, imágenes y datos en el bucket R2 `audioguias-respaldo`, se conservan los últimos 8) y `--audio` (copia a R2 los MP3 nuevos o cambiados).
- Nunca borra ni modifica el bucket principal ni los Sheets de trabajo.
- **Secretos:** `GOOGLE_SERVICE_ACCOUNT_JSON`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`.
- Además hay una tarea programada en Claude que deja un resumen de estado en el proyecto «Xolotli» (carpeta `respaldos`).

### Publicar el servidor de cobro
Sube `pagos/` (Worker) y guarda sus secretos en Cloudflare. Pasos completos en `docs/IDIOMA_MP3_COBRO.md`. **Secretos:** `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `TOKEN_SECRET`, `STATS_KEY`, `CONTACT_TO`.

### Publicar códigos de acceso
Lee la hoja `CODIGOS` de CONTROL y la manda al Worker. Hacerlo cada vez que se agregue, cambie o apague un código. **Secretos:** `CODES_KEY`, `GOOGLE_SERVICE_ACCOUNT_JSON`.

### Traducir textos
- **Script:** `scripts/traducir.mjs` (+ `traducir-lib.mjs`), glosario en `glosario/glosario.csv`.
- Sin «generar» solo muestra plan y costo. Guarda en `traducciones/<idioma>/`. **El idioma sigue oculto** hasta agregarlo a `PUBLISHED_LANGUAGES` (`src/i18n/languages.ts`).
- **Secretos:** `ANTHROPIC_API_KEY`, `GOOGLE_SERVICE_ACCOUNT_JSON`.
- Nota: la traducción al japonés/chino/coreano se está haciendo directo en las columnas `*_ja` de los Sheets mediante una tarea programada semanal de Claude (domingos 1:00 CDMX).

### Generar audios MP3
- **Scripts:** `correr-generar-audio.sh` arma las opciones → `generar-audio.mjs` genera → `subir-audio.mjs` sube a R2 (`libre/` o `pago/`) → `guardar-manifiesto.sh` guarda `public/audio/manifest.json` (usa `unir-manifiesto.mjs` para no pelear con otras corridas).
- **Opciones:** idiomas, piezas (`gratis|premium|todas`), proveedor (`azure|google|openai|prueba`), límite, generar, forzar, sitio, reubicar.
- Voz única: `es-MX-JorgeMultilingualNeural`. Pronunciaciones: `glosario/pronunciacion*.csv`.
- **Secretos:** `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`, `GOOGLE_TTS_API_KEY`, `OPENAI_API_KEY`, `CLOUDFLARE_*`, `GOOGLE_SERVICE_ACCOUNT_JSON`.
- `scripts/borrar-audios.mjs` (borra todo lo del manifiesto en R2; irreversible) **no tiene botón**: se usa solo con intención explícita.

### Muestras de voz · Revisar audios en R2 · Descargar audios
- Muestras: MP3 cortos como artifact descargable; no se guardan ni se publican.
- Revisar: útil cuando una corrida de generar se cortó. No gasta voz.
- Descargar: zip por idioma (250–400 MB). Correr solo cuando el repo sea privado.

### Descargar fotos · Datos del mapa · Capturas
- Fotos: lee `foto_url` e `image_filename` del Sheet, valida licencia (dominio público, CC0, CC BY, CC BY-SA). Con «plan» solo revisa.
- Datos del mapa: `scripts/mapa/obtener-coordenadas.mjs`; mapas recortados con Protomaps.
- Capturas: se guardan en la rama `capturas`.

### Resumen de uso · Revisar permisos de Cloudflare
- Resumen de uso: `scripts/resumen-uso.mjs`, secreto `STATS_KEY`. Datos anónimos.
- Permisos: solo lectura; sirve para diagnosticar llaves.

## Scripts sin workflow propio
- `scripts/cloudflare-dominio.py`: conecta el dominio (y `www`) a Pages y crea DNS; repetible; lo llama el workflow de publicar con la opción `conectar_dominio`.
- `scripts/subir-textos.mjs`: sube los textos de pago a R2 (`--simular` para ver sin subir).
- `scripts/crear-datos-de-ensayo.mjs`: textos inventados para pruebas en CI.
- `scripts/generar-glosario-google.mjs`: genera `glosario/pronunciacion-google.csv`; no sobrescribe filas existentes.
- `scripts/buscar-fotos.mjs`: busca fotos candidatas y arma hojas de contacto.
- `scripts/ci-run.mjs`: envuelve un comando y deja su log como anotaciones.

## Tareas programadas en Claude (fuera de GitHub)
- Respaldo del estado del proyecto: domingos 5:00 CDMX.
- Traducción semanal a japonés → chino → coreano: domingos 1:00 CDMX.

## Cuando se agregue una automatización nueva
Documentarla aquí (cuándo corre, qué hace, secretos) y mencionarla en el README si es importante.
