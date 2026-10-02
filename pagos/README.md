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
| `GET /audio/<idioma>/<pieza>_<corto\|largo>.mp3?t=<token>` | Entrega el MP3 de pago desde R2 si el token es válido (soporta `Range`) |
| `GET /health` | Comprobación de vida |

## Reglas

- El pase **empieza en el primer canje** y dura `PASS_HOURS` (72). Máximo `MAX_DEVICES` (2) dispositivos por pase.
- El id del sitio no distingue mayúsculas (`MNA` = `mna`).
- Token: `payload.firma`, HMAC-SHA256 con `TOKEN_SECRET`. Lleva sitio, dispositivo y vencimiento.
- CORS: solo `ALLOWED_ORIGINS`. La dirección de regreso (`returnUrl`) debe pertenecer a un origen permitido.
- Sin `STRIPE_SECRET_KEY` o `TOKEN_SECRET`, todo responde 503 (no rompe nada).

## Configuración (`wrangler.toml`)

Variables: `ALLOWED_ORIGINS`, `SITE_IDS`, `PASS_HOURS`, `MAX_DEVICES`, `STRIPE_PRICE_ID_MXN`, `STRIPE_PRICE_ID_USD` (opcional).
Enlaces: KV `PASES` (pases y códigos), R2 `AUDIO` (MP3 de pago, bucket `audioguias-audio`).
Secretos (nunca en archivos): `STRIPE_SECRET_KEY`, `TOKEN_SECRET`.

## Pruebas

```
node --test pagos/test/worker.test.mjs
```

Prueban con Stripe, KV y R2 simulados: checkout, canje, límite de dispositivos, códigos, vencimiento, firmas manipuladas, `Range`, orígenes no permitidos y sitios en mayúsculas. GitHub las corre en cada subida a una rama `feature/**` y antes de publicar el Worker.

## Limitaciones conocidas

- Los reembolsos en Stripe **no** revocan el pase (se puede agregar con un webhook de `charge.refunded`).
- KV es eventualmente consistente (un código nuevo puede tardar hasta ~1 min en verse en otra región).
- El candado protege los **MP3** de pago. Los **textos** de las piezas de pago siguen en el JSON público del sitio.
