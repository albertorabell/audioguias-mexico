# Servidor de cobro y de audios de pago (Cloudflare Worker)

Los pasos para ponerlo en marcha están en **`docs/IDIOMA_MP3_COBRO.md`, Parte C** (sin terminal: se publica con el botón de GitHub *Actions → Publicar el servidor de cobro*).
Este archivo es la referencia técnica.

## Qué hace

| Ruta | Para qué |
|---|---|
| `GET /config` | Precios reales leídos de Stripe, horas del pase y máximo de dispositivos |
| `POST /checkout` | Crea la sesión de pago de Stripe (`siteId`, `lang`, `deviceId`, `returnUrl`). MXN para español; USD para otros idiomas si hay precio en dólares |
| `POST /redeem` | Al volver de Stripe: confirma el pago y entrega **token** + **código** + vencimiento |
| `POST /code` | Activa el pase en otro dispositivo con el código corto (`XXXX-XXXX`) |
| `POST /status` | Comprueba si un token sigue vigente |
| `GET /audio/libre/<idioma>/<pieza>_<corto\|largo>.mp3` | Entrega el MP3 de una pieza gratis desde R2, sin clave (soporta `Range`) |
| `GET /audio/pago/<idioma>/<pieza>_<corto\|largo>.mp3?t=<token>` | Entrega el MP3 de pago desde R2 si el token es válido (soporta `Range`) |
| `GET /health` | Comprobación de vida |

## Reglas

- El pase **empieza en el primer canje** y dura `PASS_HOURS` (72). Máximo `MAX_DEVICES` (2) dispositivos por pase.
- Una sesión pagada solo se puede canjear **por primera vez** hasta `SESSION_MAX_DAYS` (30) días después de pagar; el registro del pase vive más que esa ventana, así que el mismo enlace de pago no da pases nuevos.
- El id del sitio no distingue mayúsculas (`MNA` = `mna`).
- Token: `payload.firma`, HMAC-SHA256 con `TOKEN_SECRET`. Lleva sitio, dispositivo y vencimiento.
- CORS: solo `ALLOWED_ORIGINS`. La dirección de regreso (`returnUrl`) debe pertenecer a un origen permitido.
- Sin `STRIPE_SECRET_KEY` o `TOKEN_SECRET`, todo responde 503 (no rompe nada).

## Entorno de pruebas

Existe un segundo servidor, `audioguias-pagos-pruebas` (sección `[env.pruebas]` de `wrangler.toml`), que sí pide pase y usa Stripe en modo de prueba. Ver `docs/PRUEBAS_DE_COBRO.md`.

## Configuración (`wrangler.toml`)

Variables: `ALLOWED_ORIGINS`, `SITE_IDS`, `PASS_HOURS`, `MAX_DEVICES`, `SESSION_MAX_DAYS` (opcional, 30), `STRIPE_PRICE_ID_MXN`, `STRIPE_PRICE_ID_USD` (opcional).
Enlaces: KV `PASES` (pases y códigos), R2 `AUDIO` (todos los MP3, bucket `audioguias-audio`, carpetas `libre/` y `pago/`).
Secretos (nunca en archivos): `STRIPE_SECRET_KEY`, `TOKEN_SECRET`.

## Pruebas

```
node --test pagos/test/worker.test.mjs
```

Prueban con Stripe, KV y R2 simulados: checkout, canje, límite de dispositivos, códigos, vencimiento, firmas manipuladas, `Range`, orígenes no permitidos y sitios en mayúsculas. GitHub las corre en cada subida a una rama `feature/**` y antes de publicar el Worker.

## Limitaciones conocidas

- Los reembolsos totales y las disputas **sí** cancelan el pase, pero solo si existe el webhook `POST /stripe-webhook` configurado en Stripe y el secreto `STRIPE_WEBHOOK_SECRET`. Un reembolso parcial no lo cancela.
- KV es eventualmente consistente (un código nuevo puede tardar hasta ~1 min en verse en otra región).
- El límite de 2 dispositivos es de cortesía: KV no es atómico, así que quien lance muchas solicitudes **al mismo tiempo** con identificadores distintos podría activar más. Para blindarlo haría falta un Durable Object por pase.
- No hay límite de solicitudes por IP. Si algún día hay abuso, se agrega una regla de *Rate limiting* en Cloudflare para `POST /redeem`, `/code` y `/checkout`.
- Los MP3 se guardan en R2 como `libre/<idioma>/<pieza>_<modo>.mp3` o `pago/<idioma>/<pieza>_<modo>.mp3` (sin el sitio). Antes de agregar un **segundo museo** con audios de pago hay que incluir el sitio en la ruta y comprobar que el `site` del token coincida.
- El candado protege los **MP3** y los **textos** de pago (`GET /texto/<idioma>.json`, guardados en R2 y entregados solo con pase). El JSON público trae solo el adelanto.

## Analítica de Cloudflare en el panel (pestaña «Visitas web»)

`GET /analitica` (solo con `STATS_KEY`) le pide a Cloudflare Web Analytics las visitas a las páginas públicas de las guías, de dónde llegan (Google, otros sitios, directo), país, dispositivo, navegador y los Core Web Vitals reales. El panel lo dibuja en su pestaña «Visitas web (Cloudflare)». Cada bloque se pide por separado: si Cloudflare rechaza uno, los demás se muestran y arriba aparece un aviso con el motivo.

Para activarla hace falta un token de **solo lectura** (no el que usa GitHub para publicar):

1. Cloudflare > icono de perfil (arriba a la derecha) > **My Profile** > **API Tokens** > **Create Token** > **Create Custom Token** > **Get started**.
2. Nombre: `Panel Xolotli analitica (solo lectura)`.
3. Permissions: una sola fila: **Account** > **Account Analytics** > **Read**. Nada más.
4. Account Resources: **Include** > tu cuenta.
5. Create Token > copia el valor que empieza por letras y números largos (solo se muestra una vez).
6. GitHub > repositorio `audioguias-mexico` > **Settings** > **Secrets and variables** > **Actions** > **New repository secret**. Nombre: `CF_ANALYTICS_TOKEN`; valor: el token. Add secret.
7. GitHub > **Actions** > «Publicar el servidor de pagos» > **Run workflow**. Ese paso guarda el token en el servidor (junto con el ID de cuenta, que ya está en `CLOUDFLARE_ACCOUNT_ID`).
8. Abre `/panel.html`, entra con tu clave y pulsa la pestaña «Visitas web (Cloudflare)».

Opcional: si en Cloudflare tienes más de un sitio de Web Analytics y no quieres mezclarlos, guarda también el secreto `CF_SITE_TAG` (el «site tag» del sitio, en Cloudflare > Web Analytics).
