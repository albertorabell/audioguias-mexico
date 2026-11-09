# Probar el cobro de verdad sin tocar el sitio real

**Para qué sirve:** el servidor de cobro real (`audioguias-pagos`) está en **modo gratis** (`ACCESO_LIBRE = "1"`) porque hay personas probando la app. Para probar el cobro completo sin afectarlas, existe un **segundo servidor de pruebas** (`audioguias-pagos-pruebas`) que sí pide pase y cobra con **Stripe en modo de PRUEBA** (no se mueve dinero real).

```
xolotli.com                          → servidor real (gratis, sin cambios)
feature-pagos-prueba.audioguias.pages.dev → servidor de pruebas (pide pase, Stripe de prueba)
```

Cómo está armado:
- `pagos/wrangler.toml`, sección `[env.pruebas]`: el servidor de pruebas con su propio KV (pases separados de los reales).
- `.github/workflows/desplegar-pagos-pruebas.yml`: el botón que lo publica. **Se niega a trabajar si la clave de Stripe no empieza con `sk_test_`.**
- `.github/workflows/desplegar-cloudflare.yml`: la rama `feature/pagos-prueba` se compila apuntando al servidor de pruebas (variable `PAGOS_API_URL_PRUEBAS`). El resto de ramas y `main` no cambian.

## Pasos de una sola vez

1. **Stripe, modo de prueba.** En el panel de Stripe activa el **modo de prueba** (o un "sandbox") y copia la **clave secreta** (empieza con `sk_test_`). Los nombres de los menús cambian: si no la encuentras, pide ayuda con una captura. Revisa también que exista un producto con precio en modo de prueba (el `price_` de `wrangler.toml`).
2. **Secretos en GitHub** (*Settings → Secrets and variables → Actions → New repository secret*):
   - `STRIPE_SECRET_KEY_PRUEBAS`: la clave `sk_test_...`. **Opcional si `STRIPE_SECRET_KEY` ya es de pruebas:** el botón la usa en su lugar, pero se niega si no empieza con `sk_test_`. Cuando `STRIPE_SECRET_KEY` pase a ser la clave real (`sk_live_`), crea este secreto aparte.
   - `TOKEN_SECRET_PRUEBAS`: texto al azar de 32 o más caracteres. **Siempre distinto del `TOKEN_SECRET` real**: si fueran iguales, un pase de prueba abriría también el servidor real cuando empiece a cobrar.
   - Opcional, para probar reembolsos: `STRIPE_WEBHOOK_SECRET_PRUEBAS` (ver paso 6).
3. **Publicar el servidor de pruebas:** *Actions → Publicar el servidor de cobro de PRUEBAS → Run workflow*. Al terminar, el resumen de la corrida muestra su dirección (termina en `.workers.dev`).
4. **Guardar esa dirección** como *variable* (pestaña *Variables*, no *Secrets*): nombre `PAGOS_API_URL_PRUEBAS`, valor la dirección sin diagonal final.
5. **Publicar la app de prueba:** *Actions → Publicar la app en Cloudflare Pages → Run workflow*, eligiendo la rama `feature/pagos-prueba`. Quedará en `https://feature-pagos-prueba.audioguias.pages.dev` (Cloudflare cambia la diagonal de la rama por un guion; si la dirección sale distinta, hay que ajustar `ALLOWED_ORIGINS` en `[env.pruebas.vars]`).
6. **(Opcional) Reembolsos:** en Stripe, modo de prueba, crea un *webhook* hacia `<dirección del servidor de pruebas>/stripe-webhook` con los eventos `charge.refunded` y `charge.dispute.created`; copia su *signing secret* en `STRIPE_WEBHOOK_SECRET_PRUEBAS` y vuelve a correr el botón del paso 3.

## Qué probar (lista de verificación)

**Ya probado antes (solo con el MNA, cuando era el único sitio):** pagar con la tarjeta de prueba y entrar al sitio. Lo que sigue es repetirlo con lo que se agregó después: varios sitios con precios distintos, pases combinados, textos de pago desde el servidor, códigos, límite de dispositivos y reembolsos. Se marca con ★ lo más importante de repetir.

Tarjetas de prueba de Stripe (cualquier fecha futura y cualquier CVC):
- `4242 4242 4242 4242`: pago exitoso.
- `4000 0000 0000 0002`: tarjeta rechazada.
- `4000 0025 0000 3155`: pide autenticación 3D Secure.

| Prueba | Resultado esperado |
|---|---|
| Abrir un sitio de pago en la dirección de prueba | Se ve el candado y el botón de comprar (no entra gratis) |
| ★ Pagar un sitio que NO sea el MNA (por ejemplo Teotihuacán o Cuernavaca) | Cobra el precio de ese sitio y desbloquea solo ese sitio |
| ★ Pagar un pase combinado | Desbloquea todos los sitios incluidos y ninguno más |
| Pagar con la tarjeta exitosa | Regresa a la app, se desbloquea el sitio, aparece el código `XXXX-XXXX` |
| Cancelar en la página de Stripe | Regresa a la app sin pase y con aviso |
| Tarjeta rechazada | Stripe muestra el error; la app no desbloquea nada |
| ★ Usar el código en otro navegador | Se activa; un tercer dispositivo es rechazado (límite de 2) |
| ★ Textos de pago antes y después de pagar (guion largo, retos, ficha) | Antes solo el adelanto; después todo |
| Cambiar de idioma tras pagar | Textos y audios de pago siguen disponibles |
| Sin internet tras pagar y descargar el recorrido | Funciona sin conexión |
| ★ Reembolsar el pago en Stripe (si hay webhook) | El pase deja de servir |
| Código de acceso de la hoja CODIGOS | Entra sin pagar (publicar códigos antes) |

Registrar lo que falle en el documento del proyecto.

## Lo que NO hace este entorno
- No cambia el modo gratis del sitio real: **para cobrar de verdad** habrá que poner `ACCESO_LIBRE = "0"` en el servidor real, usar la clave `sk_live_...` y el `price_` real (ver `docs/IDIOMA_MP3_COBRO.md` y la guía maestra).
- No resuelve factura (CFDI), términos y condiciones ni política de reembolsos: eso se define antes de cobrar en serio.
- El servidor de pruebas comparte con el real el bucket de audios (solo lectura) y la tabla de precios pública.

## Quitarlo
Borrar el servidor `audioguias-pagos-pruebas` y el KV `audioguias-pases-pruebas` desde el panel de Cloudflare, y la variable y secretos `*_PRUEBAS` de GitHub.
