# Idioma, MP3 y cobro — guía paso a paso

Esta guía es para ti, Alberto. Cada paso es corto. Haz uno, revisa que salió bien y sigue con el siguiente.

> **Importante:** todo lo nuevo está en la rama de prueba `feature/idioma-mp3-cobro`.
> **El sitio publicado no ha cambiado.** Nada se publica hasta que tú decidas (Parte D).

---

## 0. Qué quedó hecho (ya está programado y probado)

| Tema | Qué hace ahora |
|---|---|
| **Idioma** | Toda la app (botones, avisos, errores) existe en **español e inglés**, con selector en la pantalla de inicio. Se acuerda del idioma elegido. Los nombres y descripciones de museos y rutas ya tienen inglés. |
| **Textos de piezas y salas** | La app lee las traducciones de columnas nuevas del Sheets (Parte A). Si una pieza no tiene traducción, se muestra y se lee **en español** y la app avisa: «Esta pieza todavía no tiene texto en este idioma». Nunca inventa texto. |
| **MP3** | Si una pieza tiene archivo MP3, la app lo reproduce. Si no tiene, usa la voz del teléfono, como hasta ahora. Los MP3 se pueden guardar para escuchar **sin internet**. |
| **Cobro con Stripe** | Botón «Pagar con tarjeta» → página segura de Stripe → regreso a la app con el pase activo. El pase dura 72 horas (cuenta desde que se activa), funciona hasta en 2 dispositivos con un **código corto** (por ejemplo `ABCD-1234`). |
| **Pruebas** | GitHub revisa solo: tipos, compilación, pruebas del servidor de cobro, del generador de MP3 y **14 pruebas en un navegador de verdad** (cambio de idioma, MP3 gratis y de pago, pago con Stripe simulado, código de pase, cobro apagado). Todo salió en verde. |

**Mientras no hagas la Parte C, el cobro queda apagado**: la ventana del pase dice «El pago en línea estará disponible muy pronto» y las piezas gratis se escuchan normal.

---

## Lo que tienes que hacer tú (resumen)

1. **Parte A (Sheets):** pegar traducciones al inglés en columnas nuevas. *(Opcional por ahora; sin esto la app funciona en español con aviso.)*
2. **Parte B (MP3):** crear una cuenta de voz (Azure u OpenAI), decidir el costo, y apretar un botón en GitHub.
3. **Parte C (cobro):** crear cuentas de **Stripe** y **Cloudflare**, y apretar un botón en GitHub.
4. **Parte D:** revisar y publicar la rama.

Todo lo que apretarás está en la pestaña **Actions** de https://github.com/albertorabell/audioguias-mexico

---

## PARTE A — Traducciones de las piezas y salas (Google Sheets)

La interfaz ya está traducida. Lo que falta traducir son los **textos del museo** (títulos, guiones). Eso vive en tu Sheets.

### Paso A1 — Agrega columnas nuevas (no cambies ni borres las que ya existen)

En la pestaña **`📝 TRABAJO_PIEZAS`**, al final, agrega estas columnas con **exactamente** estos encabezados:

| Encabezado | Qué lleva |
|---|---|
| `titulo_en` | Título de la pieza en inglés |
| `frase_gancho_en` | Frase gancho |
| `puente_narrativo_en` | Puente narrativo |
| `guion_corto_en` | Guion corto (Exprés) |
| `guion_largo_en` | Guion largo (Inmersión) |
| `retos_observacion_en` | Retos de observación, separados con `|` igual que en español |
| `especificaciones_en` | Especificaciones con el mismo formato `Clave: valor | Clave: valor` |
| `faq_mito_en` | `Pregunta | Respuesta` |

En la pestaña **`📝 TRABAJO_SALAS`**:

| Encabezado | Qué lleva |
|---|---|
| `nombre_oficial_en` | Nombre de la sala |
| `frase_gancho_en` | Frase gancho |
| `introduccion_narrativa_en` | Introducción |
| `etiqueta_en` | Etiqueta |

### Paso A2 — Llena las celdas

- Una celda **vacía** significa «sin traducción»: la app muestra el español y avisa.
- **Traduce ambos guiones (corto y largo) o ninguno.** Si solo está uno, la app sigue leyendo la pieza en español para no mezclar idiomas.
- Revisa los nombres propios y los datos (fechas, medidas) contra el español. **Una traducción automática debe revisarla una persona** antes de publicarse.
- Los datos duros (medidas, fechas, culturas) no se traducen «a ojo»: cópialos igual que en español.

### Paso A3 — Comprueba

Espera la actualización automática (cada 6 horas) o corre a mano **Actions → Compilar y desplegar → Run workflow** (solo cuando ya hayas publicado la rama, Parte D). En la app, cambia a English y abre una pieza traducida: ya no debe salir el aviso.

### Otros idiomas (francés, polaco, ruso, japonés)

Ya aparecen en el selector como «Pronto». Para activarlos hace falta que **yo** agregue sus textos de interfaz. Las columnas del Sheets serían `titulo_fr`, `guion_corto_fr`, etc. (mismo patrón con `_fr`, `_pl`, `_ru`, `_ja`).

---

## PARTE B — Audios MP3

### Cómo funciona (en corto)

- **Piezas gratis:** su MP3 se publica junto con el sitio (carpeta `public/audio`).
- **Piezas de pago:** su MP3 **no** se publica con el sitio. Vive en **Cloudflare R2** y solo se entrega a quien tiene un pase vigente.
- Si el texto de una pieza cambia en el Sheets, su MP3 viejo **deja de usarse** (la app vuelve a la voz del teléfono) hasta que lo generes de nuevo. Así nunca se oye un audio que no coincide con el texto.
- Si una pieza pasa de gratis a pago, el generador se niega a publicar su MP3 gratis (protección contra fugas).

### Paso B1 — Decide la voz (cuesta dinero, **tú decides**)

Calcula de antemano con el botón de GitHub (Paso B4, con la casilla «generar» **sin marcar**): muestra cuántos caracteres son y el costo aproximado, **sin gastar nada**.

Referencia que usé (precios aproximados; **confírmalos en la página del proveedor antes de pagar**):

- **Azure (voces neuronales):** unos USD 16 por millón de caracteres. Voces naturales en español de México.
- **OpenAI `tts-1`:** unos USD 15 por millón de caracteres (`tts-1-hd`: unos USD 30).
- Todo el catálogo en español (133 piezas, corto + largo) son unos **555 mil caracteres** → del orden de **USD 8 a 9** por idioma, una sola vez. Solo cambia cuando cambias los textos.
- Las 23 piezas gratis son una parte pequeña de ese total.

### Paso B2 — Crea la cuenta de voz y la clave

**Si eliges Azure:**
1. Crea una cuenta en https://portal.azure.com
2. Busca **«Speech»** y crea un recurso (región recomendada: la más cercana, por ejemplo *West US* o *South Central US*).
3. Entra al recurso → **Keys and Endpoint**. Copia **KEY 1** y la **Región** (por ejemplo `westus`).

**Si eliges OpenAI:**
1. Entra a https://platform.openai.com → **API keys** → crea una clave y copia el texto que empieza con `sk-`.
2. Agrega saldo (el cobro es por uso).

### Paso B3 — Guarda la clave en GitHub (no se escribe en ningún archivo)

1. En el repositorio: **Settings → Secrets and variables → Actions → New repository secret**.
2. Para Azure crea dos secretos: `AZURE_SPEECH_KEY` y `AZURE_SPEECH_REGION`.
   Para OpenAI crea uno: `OPENAI_API_KEY`.

> Nunca me mandes las claves por el chat ni las pegues en un archivo del repositorio. Solo van en **Secrets**.

### Paso B4 — Corre el botón (de menos a más)

1. **Actions → «Generar audios MP3 (botón manual)» → Run workflow.**
2. **Primera vez, solo ver el plan:** deja «generar» **sin marcar**. Mira en el registro cuántos audios y cuánto costaría.
3. **Segunda vez, prueba chiquita:** proveedor `azure` (u `openai`), piezas `gratis`, límite `3`, **marca «generar»**. Se generan 3 MP3.
4. Descarga uno desde `public/audio/es/` en GitHub y escúchalo. Si no te gusta la voz, cambia la voz (te digo cómo) antes de gastar más.
5. **Tercera vez, todo lo gratis:** límite vacío, piezas `gratis`.
6. **Después, las de pago:** requiere la Parte C (Cloudflare) hecha, porque esos MP3 se suben a R2. El botón se niega a empezar si faltan las claves de Cloudflare, para no gastar en audios que luego no se puedan guardar.

Para ensayar **sin gastar nada**, usa el proveedor `prueba`: genera MP3 en silencio y sirve para comprobar que todo el camino funciona.

> Los MP3 de pago quedan **solo en R2** (no se guardan en GitHub porque el repositorio es público). Si algún día se pierden, se regeneran con «Regenerar aunque el texto no haya cambiado».

### Paso B5 — Se ven en la app

Los MP3 gratis se guardan en la rama; después de publicarla (Parte D) la app los usa sola. Si lo corres sobre `main`, el botón también republica el sitio.

---

## PARTE C — Cobro con Stripe (y Cloudflare)

El cobro necesita un **servidor pequeño** (en Cloudflare, gratis para tu volumen) porque la clave secreta de Stripe **no puede vivir en la app**. Ese servidor está en la carpeta `pagos/`.

### Qué cuesta (aproximado — confirma en las páginas oficiales)

- **Cloudflare Workers, KV y R2:** hay plan gratuito amplio. Cloudflare puede pedirte una tarjeta para activar R2, aunque no cobra mientras no pases el límite gratuito.
- **Stripe México:** cobra una comisión por pago (unos 3.6 % + MXN 3 + IVA con tarjeta nacional, según lo que sé; **confirma en stripe.com/mx/pricing**). No hay mensualidad.

### Paso C1 — Cuenta de Stripe

1. Crea tu cuenta en https://stripe.com/mx
2. **Empieza en «Modo de prueba»** (el interruptor arriba a la derecha). Nada de lo que hagas ahí cobra dinero real.
3. Para cobrar de verdad más adelante, Stripe te pedirá datos de tu negocio y tu cuenta bancaria.

### Paso C2 — Crea el producto y el precio

1. **Catálogo de productos → Agregar producto.**
2. Nombre: `Pase MNA 72 horas`. Pago **único** (no recurrente). Precio: **79 MXN**.
3. Guarda y copia el **ID del precio** (empieza con `price_`).
4. *(Opcional, para quien use la app en inglés)* Crea otro precio en **USD 4.99** para el mismo producto y copia su `price_`. Si no lo creas, el inglés también cobra en pesos.

### Paso C3 — Clave secreta de Stripe

**Desarrolladores → Claves de API → Clave secreta** (`sk_test_...`). Cópiala. En GitHub, crea el secreto **`STRIPE_SECRET_KEY`** (como en el Paso B3).

### Paso C4 — Cuenta de Cloudflare

1. Crea tu cuenta gratuita en https://dash.cloudflare.com
2. **ID de la cuenta:** en el panel, a la derecha (o en la dirección del navegador). Guárdalo en GitHub como secreto **`CLOUDFLARE_ACCOUNT_ID`**.
3. **Token de API:** *My Profile → API Tokens → Create Token → plantilla «Edit Cloudflare Workers»*. Agrega también permiso de **Workers R2 Storage: Edit** y **Workers KV Storage: Edit**. Guárdalo como secreto **`CLOUDFLARE_API_TOKEN`**.
4. Crea el **KV** (donde se guardan los pases): *Storage & databases → KV → Create namespace* con nombre `PASES`. Copia su **ID**.
5. Crea el **R2** (donde viven los MP3 de pago): *R2 → Create bucket* con nombre exacto `audioguias-audio`.

> Los nombres de los botones de Cloudflare cambian de vez en cuando. Si no encuentras uno, mándame una captura.

### Paso C5 — Una clave inventada para firmar los pases

Crea el secreto **`TOKEN_SECRET`** en GitHub con **al menos 32 caracteres al azar** (usa el generador de contraseñas de tu celular o de tu navegador). No la reutilices en otro lado.

### Paso C6 — Llena `pagos/wrangler.toml`

En GitHub abre el archivo `pagos/wrangler.toml` y con el lápiz (✏️) cambia:

- `STRIPE_PRICE_ID_MXN` → el `price_` en pesos (Paso C2).
- `STRIPE_PRICE_ID_USD` → el `price_` en dólares, o déjalo vacío `""` si no lo creaste.
- `id` del KV → el ID del Paso C4.

No toques `ALLOWED_ORIGINS` (ya dice `https://albertorabell.github.io`). Si algún día usas dominio propio, aquí se agrega.

### Paso C7 — Publica el servidor

**Actions → «Publicar el servidor de cobro (Cloudflare)» → Run workflow.**
Si falta algún dato, se detiene y dice cuál. Si sale bien, en el registro aparece la dirección del servidor: algo como `https://audioguias-pagos.TU-NOMBRE.workers.dev`.

Comprueba abriendo esa dirección + `/health` en el navegador: debe responder que está bien.

### Paso C8 — Conecta la app con el servidor

1. En GitHub: **Settings → Secrets and variables → Actions → pestaña Variables → New repository variable**.
2. Nombre: `PAGOS_API_URL`. Valor: la dirección del servidor (sin diagonal al final).
3. Vuelve a publicar el sitio: **Actions → Compilar y desplegar → Run workflow** (después de la Parte D).

### Paso C9 — Prueba con dinero de mentira

Con Stripe en **modo de prueba**:

1. Abre la app → un museo → una pieza de pago → **Desbloquear**.
2. **Pagar con tarjeta**. En Stripe usa la tarjeta de prueba `4242 4242 4242 4242`, cualquier fecha futura y cualquier CVC.
3. Al volver a la app debe decir **«¡Pago confirmado!»** y las piezas de pago se abren.
4. Abre la ventana del pase: aparece tu **código** (`XXXX-XXXX`). En un segundo celular usa **«Ya tengo un código»**. Un tercer dispositivo debe recibir «máximo de dispositivos».

### Paso C10 — Pasar a cobro real

1. Activa tu cuenta de Stripe (sus datos de negocio y banco).
2. Crea el **producto y precio en modo real** (los de prueba no pasan) y copia los nuevos `price_`.
3. Cambia `STRIPE_SECRET_KEY` por la clave real (`sk_live_...`) y los `price_` en `pagos/wrangler.toml`.
4. Vuelve a correr «Publicar el servidor de cobro».
5. **Antes de cobrar a otras personas** necesitas: **Términos y condiciones**, **Aviso de privacidad** y política de reembolsos visibles en la app. Si necesitas emitir facturas (CFDI), consúltalo con tu contador. Esto es tarea de negocio/legal: yo no soy abogado ni contador.

### Cosas que debes saber (honestas)

1. **El candado de las piezas de pago es «suave» para el texto.** Los **MP3 de pago sí están protegidos** (solo salen con un pase válido). Pero los **textos (guiones) de las piezas de pago** viajan en los archivos públicos del sitio, así que una persona con conocimientos técnicos podría leerlos. Si eso te preocupa, el siguiente paso es mover también esos textos detrás del servidor; avísame y lo hago.
2. **Reembolsos:** si devuelves un pago en Stripe, **el pase no se cancela solo** todavía. Tendría que agregarse.
3. **Pase por dispositivo:** si alguien borra los datos del navegador o usa modo privado, pierde el pase en ese aparato. Puede recuperarlo con su **código** (hasta 2 dispositivos).
4. **Cloudflare KV** puede tardar hasta un minuto en reflejar cambios en otras regiones del mundo. Rara vez se nota.
5. El pase empieza a contar **cuando se activa por primera vez** (no cuando se paga), dura **72 horas**.
6. El precio que se **cobra** es el de Stripe (Paso C2); la ventana del pase lo lee de ahí. Pero la pantalla de inicio dice «solo $79 por sitio» y eso sale de un texto fijo: si cambias el precio en Stripe, avísame para actualizar también `public/data/sites.json` y `public/data/mna/site.json` (campos `pass_price_mxn` y `pass_price_usd`).
7. Textos como «Top 10 Museos del Mundo» o «Único Castillo Real en América» (en `public/data/sites.json`) son tuyos y no los verifiqué; confirma que se puedan afirmar antes de promocionar esos sitios.

---

## PARTE D — Revisar y publicar

1. Entra a https://github.com/albertorabell/audioguias-mexico/pulls → **New pull request**.
2. **base:** `main`. **compare:** `feature/idioma-mp3-cobro`. Mira que la revisión automática esté en **verde ✅**.
3. **Create pull request** → **Merge pull request** → **Confirm merge**.
4. El sitio se republica solo en unos minutos. Con la Parte C sin hacer, **el cobro seguirá apagado** y todo lo demás se verá igual que antes, más el selector de idioma funcionando en inglés.

**Una decisión tuya antes de publicar:** si todavía no hay traducciones al inglés de las piezas, quien elija English verá la interfaz en inglés y las piezas en español con un aviso. Si prefieres que **no aparezca inglés hasta tener las piezas traducidas**, dime y lo dejo oculto (es un cambio de una línea y se puede volver a mostrar).

### Volver atrás

Si algo no te gusta después de publicar: en GitHub abre el *pull request* ya mezclado y aprieta **Revert**. Vuelve todo como estaba.
