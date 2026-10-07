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

- Los reembolsos en Stripe **no** revocan el pase (se puede agregar con un webhook de `charge.refunded`).
- KV es eventualmente consistente (un código nuevo puede tardar hasta ~1 min en verse en otra región).
- El límite de 2 dispositivos es de cortesía: KV no es atómico, así que quien lance muchas solicitudes **al mismo tiempo** con identificadores distintos podría activar más. Para blindarlo haría falta un Durable Object por pase.
- No hay límite de solicitudes por IP. Si algún día hay abuso, se agrega una regla de *Rate limiting* en Cloudflare para `POST /redeem`, `/code` y `/checkout`.
- Los MP3 se guardan en R2 como `libre/<idioma>/<pieza>_<modo>.mp3` o `pago/<idioma>/<pieza>_<modo>.mp3` (sin el sitio). Antes de agregar un **segundo museo** con audios de pago hay que incluir el sitio en la ruta y comprobar que el `site` del token coincida.
- El candado protege los **MP3** de pago. Los **textos** de las piezas de pago siguen en el JSON público del sitio.
