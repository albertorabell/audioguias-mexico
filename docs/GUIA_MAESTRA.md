# Guía maestra del proyecto «Audioguía Xolo»

**Para qué sirve este archivo:** es la memoria completa del proyecto. Quien abra una conversación nueva (Alberto o Claude) debe leerlo ENTERO antes de hacer nada. No contiene secretos (claves, tokens): esos solo viven en los «Secrets» de GitHub.

Última actualización: 29 de octubre de 2026. Si algo de aquí contradice el código, manda el código; avisa y corrige este archivo.

> Hay documentos más cortos que complementan este: `docs/GUIA_DE_ESTILO_guiones.md` (estilo de redacción), `docs/NUEVO_SITIO.md` (pasos para un sitio nuevo), `docs/IDIOMA_MP3_COBRO.md` (idioma, MP3, Stripe, Cloudflare paso a paso) y `pagos/README.md` (servidor de cobro). Este archivo los junta y agrega todo lo aprendido.

---

## 0. Índice

1. Qué es el proyecto y qué queremos
2. Reglas de oro de Alberto (cómo trabajar con él)
3. Mapa de recursos: dónde está cada cosa
4. Estado actual de cada sitio
5. Google Sheets: estructura, columnas y cómo editarlos
6. Reglas de los textos (guion corto, largo, puentes, retos, FAQ…)
7. Cómo funcionan las rutas
8. Modelos de datos y JSONs que genera la app
9. GitHub: repositorio, ramas, workflows, secretos y trucos
10. Traducciones (cómo hacerlas, costos, errores típicos)
11. Audios con Azure (cómo hacerlos, dónde quedan, errores típicos)
12. Fotos (licencias, descarga, créditos)
13. Mapas y coordenadas
14. Cloudflare (Pages, Workers, R2, KV, DNS)
15. Stripe, pases, códigos y precios
16. SEO (qué ya existe y cómo se mantiene)
17. La app (React/Vite/PWA): carpetas y piezas clave
18. Cómo agregar un sitio o museo nuevo (receta completa)
19. Flujo estándar de una auditoría de textos
20. Respaldos, pruebas y monitoreo
21. Pendientes y puntos abiertos (lista honesta)
22. Errores que ya cometimos (para no repetirlos)
23. Glosario rápido

---

## 1. Qué es el proyecto y qué queremos

**Audioguía Xolo** es una app web instalable (PWA) en **xolotli.com** con audioguías de pago de museos y zonas arqueológicas de México. Cada sitio tiene salas o zonas, paradas (piezas), rutas sugeridas, texto en 4 idiomas (español, inglés, francés y polaco) y audio MP3 con una sola voz.

- **Nombre público:** «Audioguía Xolo». Dominio: `xolotli.com` (y `www.xolotli.com` redirige con 301 a la versión sin www; ver `public/_redirects`).
- **Qué queremos lograr:** una audioguía confiable, cálida y sin errores históricos, que se pueda usar sin internet, que cobre un pase de 72 horas por sitio (o combos), y que se posicione bien en Google.
- **Usuario final:** turista o visitante que camina el sitio con celular y audífonos. Cada parada ofrece dos modos: **Exprés** (guion corto, ~1 minuto) e **Inmersión** (guion largo, ~3–5 minutos).
- **Cómo se ganan datos:** nada se inventa. Todo dato duro (fecha, medida, nombre) debe tener fuente. Lo dudoso se anota como duda y no se afirma.
- **Contenido vive en Google Sheets** (privados), no en el repositorio. La app se reconstruye leyendo los Sheets.

## 2. Reglas de oro de Alberto (cómo trabajar con él)

Alberto Rabell **no es programador**. Habla español (Ciudad de México). Reglas fijas:

1. **Explicar en español claro y con pasos simples** («con palitos»). Nada de jerga sin explicar.
2. **Cada parada necesita su propia foto con licencia abierta** (dominio público, CC0, CC BY, CC BY-SA), con autor y licencia anotados. **Nunca reutilizar una foto** de otra parada. (Excepción temporal vigente en Chichén: 4 paradas usan copias de paradas vecinas hasta conseguir foto propia; ver §21.)
3. **Trailers de commit**: todo commit termina con:
   ```
   Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
   Claude-Session: https://claude.ai/code/session_018SmFSXr9wF4kNx264L5qiY
   ```
   (La URL de sesión cambia en cada conversación: usar la que indique el sistema.)
4. **Cuerpo de los PR** termina con «🤖 Generated with [Claude Code](https://claude.com/claude-code)» y la URL de la sesión.
5. **Entre corridas largas, mandar un mensaje corto** diciendo qué se está haciendo (Alberto no ve el trabajo en vivo).
6. **Traducciones y audios cuestan dinero:** antes se corre **modo plan** (gratis) y se pide aprobación; después se corre con **tope de gasto**. Para esto se usa el modo planificación («plan mode») antes de gastar.
7. **Nunca publicar sin su visto bueno** cambios grandes. Los textos nuevos se marcan `verificado = FALSE` hasta que Alberto o un especialista los confirme.
8. **Preguntar solo lo necesario.** Si algo es claro, hacerlo y reportar.
9. **Cuando algo falla, decirlo claro** (qué falló, qué no se pudo ver, qué se hizo).
10. Los textos se escriben **con números en letras** (para que la voz los lea bien) y con tuteo, español de México (ver §6).

**Entregables hacia Alberto:** respuestas en español, breves, con lo que quedó hecho y lo que sigue pendiente. Cuando él pide «auditoría», se entrega informe → él aprueba cambios → se aplican → se reporta (ver §19).

## 3. Mapa de recursos: dónde está cada cosa

| Qué | Dónde |
|---|---|
| Repositorio | `github.com/albertorabell/audioguias-mexico` (hoy **público**; los textos de pago NO están en él) |
| Copia local de trabajo (en la nube de Claude) | `/home/claude/precios` (se pierde al cerrar la sesión; se vuelve a clonar) |
| Sitio publicado | `https://xolotli.com` (Cloudflare Pages, proyecto `audioguias`) |
| Pruebas de rama `feature/**` | `https://<rama>.audioguias.pages.dev` (con `noindex`) |
| Servidor de cobro y audios de pago | Cloudflare Worker `audioguias-pagos` (carpeta `pagos/`) |
| MP3 | Cloudflare R2, bucket `audioguias-audio` (carpetas `libre/` y `pago/`) |
| Respaldos | R2 bucket `audioguias-respaldo` + Sheet de Drive «RESPALDO - Textos todos los idiomas» (id `1Ddn0nZbpTDkXcr0s0__Q9KIDrYiRohHmXTcHH0jNxvE`) |
| Pases comprados | Cloudflare KV, namespace `PASES` |
| Pagos | Stripe (México); clave secreta en GitHub como `STRIPE_SECRET_KEY` |
| Voz | Azure AI Speech, voz `es-MX-JorgeMultilingualNeural` (secretos `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`) |
| Traductor | API de Anthropic (secreto `ANTHROPIC_API_KEY`), modelo por defecto `claude-sonnet-5-5` |
| Robot de Google | Cuenta de servicio, secreto `GOOGLE_SERVICE_ACCOUNT_JSON` (lee los Sheets privados) |
| Sheets de contenido | Carpeta «Audioguías México» en Drive de Alberto (ver §5 para los IDs) |
| Estilo de textos | `docs/GUIA_DE_ESTILO_guiones.md` |
| Glosario de nombres propios | `glosario/glosario.csv` (326 términos con columnas en/fr/pl) |
| Pronunciación para la voz | `glosario/pronunciacion.csv` (≈ 920 líneas) |
| Traducciones guardadas | `traducciones/{en,fr,pl}/pieza_<id>.json` y `sala_<id>.json` |
| Lista de audios (manifiesto) | `public/audio/manifest.json` |
| Fotos | `public/images/pieces/*.webp` (≈ 417) |
| Consultas de búsqueda de fotos | `scripts/fotos/consultas-*.json` |
| Pruebas automáticas | `scripts/tests/*.test.mjs`, `pagos/test/*.test.mjs`, `e2e/` (Playwright) |
| Correo de contacto del proyecto | el del User-Agent en `scripts/descargar-fotos.mjs` |

**Hoja maestra CONTROL** (la lista de sitios, combos y códigos): ID `1e4BQCAULQq6zABdMTD0trSpuzknPTV3ZS9gzp6Qx93Q`.

**Sheet «viejo» del MNA** (ya no se usa salvo `SYNC_FUENTE=vieja`): ID `1D6Tu8qLVchpsKqFLDF1poEvxOOJO600DLHv05-weOcY`.

## 4. Estado actual de cada sitio (29-oct-2026)

| site_id | prefijo | Sitio | Paradas | Precio MXN (CONTROL) | Traducciones en/fr/pl | Audios es/en/fr/pl |
|---|---|---|---|---|---|---|
| mna | `mna_` | Museo Nacional de Antropología | 178 | 99 | completas | completos en es y en; fr y pl con 177 de 178 (falta el audio de una pieza) |
| teotihuacan | `teo_` | Zona Arqueológica de Teotihuacán | 33 | 149 | completas | completos |
| chapultepec | `chap_` | Castillo de Chapultepec | 30 | 99 | completas | completos |
| centro_historico | `cdmx_` | Centro Histórico de la CDMX | 50 | 99 | completas | completos |
| chichen_itza | `chi_` | Zona Arqueológica de Chichén Itzá | 32 (10 zonas) | 199 | completas | completos |
| templo_mayor_catedral | `tmc_` | Templo Mayor y Catedral Metropolitana | 32 (5 zonas) | 79 | completas | completos |
| museo_frida_kahlo | `fri_` | Museo Frida Kahlo (La Casa Azul) | 18 (6 zonas) | 149 | completas | completos |

Notas por sitio:
- **Chichén Itzá:** auditado y corregido. Faltan 4 fotos propias (hay copias temporales), permiso INAH y verificación por especialistas. «Chichén Viejo» solo se visita con reservación y guía INAH (viernes y sábados): es un capítulo aparte.
- **Templo Mayor y Catedral (TMC):** auditado; 32 paradas tras fusionar «Templos Rojos» con «Casa de las Águilas». Puentes y cierres son neutrales respecto a la ruta. Profundiza las paradas 27, 28, 34 y 37 de la guía del Centro Histórico. Varias ubicaciones dentro de la Catedral y del museo son aproximadas (confirmar en campo). La rama `fotos-tmc-consultas` quedó sin fusionar.
- **Frida Kahlo:** auditado; edición aplicada el 29-oct-2026 (44 reemplazos de texto, 7 puentes neutrales, `ANTES_DE_IR` simplificado sin cifras fijas). Rutas: `esencial` (13 paradas, 1 h), `completa` (18, 1 h 30), `cuerpo-y-vestido` (13, 55 min). Hechos verificados con el PDF del museo: casa de 1904, ~800 m² construidos sobre 1,200 m²; Diego pagó las hipotecas a inicios de los treinta; jardín de 1,040 m² (1937); estudio de O'Gorman (1946); museo abierto en 1958; Pellicer (nov. 1955): «pintada de azul por fuera y por dentro… un poco de cielo»; fotos de Lenin y Mao al pie de la cama de día; el boleto puede incluir el Anahuacalli; Anahuacalli se empezó en 1942 (no 1941).
- **MNA, Teotihuacán, Chapultepec, Centro Histórico:** tienen lógica o datos propios más antiguos (MNA y Teotihuacán tienen rutas escritas en `scripts/sync-sheets.js`).

**Interruptor de modo de prueba:** en `pagos/wrangler.toml` está `ACCESO_LIBRE = "1"` → todos entran gratis (no se pide pase). Para cobrar de verdad: poner `"0"` y volver a publicar el Worker (workflow «Publicar el servidor de cobro»). Ver §15.

## 5. Google Sheets: estructura, columnas y cómo editarlos

### 5.1 Los Sheets
Cada sitio tiene su propio Sheet. Las pestañas estándar de un sitio (por ejemplo Frida): `SALAS`, `PIEZAS`, `RUTAS`, `ANTES_DE_IR` (y en TMC también `LEEME`).

| Sheet | ID | sheetId de pestañas |
|---|---|---|
| CONTROL | `1e4BQCAULQq6zABdMTD0trSpuzknPTV3ZS9gzp6Qx93Q` | SITIOS 0 · PASE_COMBINADO 874211810 · CODIGOS 87571306 |
| MNA | `1i6uUFWYQCdXo9Q8XFr27ctY-pEHlswP7DvrTAPLA8RY` | (copia nueva; pestañas con nombres SALAS/PIEZAS) |
| Teotihuacán | `18ehfL5Lz3oKM047qMO34F7tGQbtsSkCCsHSbbJEsIs4` | |
| Chapultepec | `1-Nbzx3LXUdfvDNy3VC7A1CT3mkHanv2COXbmp6pDgJY` | |
| Centro Histórico | `1-nmolJu7YLm85qqTrHoE1qFtlyCwJ513msA9oG1MEu4` | |
| Chichén Itzá | `1DpJ37GG0N5TSG37Aj6AG-tweEuUC6LULBhJcpVvf--Y` | RUTAS 1796107035 |
| Templo Mayor y Catedral | `1SFLz9GGzKRuEwbf2anHRis8L_PBydC2HdRIAOFlrc00` | SALAS 0 · PIEZAS 1 · LEEME 2 · RUTAS 1796107035 · ANTES_DE_IR 1496219462 |
| Frida Kahlo | `1Mz4h3gGvIaS5ho_PUaDkOVFxx36xNTUE2ViBLmpDRfs` | SALAS 0 · PIEZAS 1 · RUTAS 1796107035 · ANTES_DE_IR 1322034649 |

**CONTROL → pestaña SITIOS** (una fila por sitio; fila 1 = encabezados; el índice de fila cuenta desde 0 en las API de rango: mna=1, teotihuacan=2, chapultepec=3, centro_historico=4, chichen_itza=5, templo_mayor_catedral=6, museo_frida_kahlo=7). Columnas:
`site_id, prefijo, nombre, sheet_id, publicar, idiomas, precio_mxn, estado, notas, ubicacion, descripcion, insignia, introduccion, introduccion_en, introduccion_fr, introduccion_pl, portada, precio_usd, acceso`
- `publicar` = SI para que el sitio se publique.
- `idiomas` es **informativo** (no controla nada en el código).
- `portada` = piece_id cuya foto se usa de portada.
- `acceso` = `pago` / `libre` / `codigo`.
- `introduccion*`: varios párrafos separados por línea en blanco; los saltos de línea dentro de la celda son `\n`.
- `estado` y `notas` son notas internas (**hoy están desactualizadas** en Chichén, TMC y Frida: dicen «faltan audios, traducciones»; ya existen; actualizarlas).
- **site_id**: solo minúsculas, números y `_` (2–40 caracteres). Es nombre de carpeta y de archivo.

**PASE_COMBINADO:** `id, nombre, nombre_en, nombre_fr, nombre_pl, sitios, precio_mxn, precio_usd, activo, notas`. Combos actuales: `centro` (Centro Histórico + TMC: 139 MXN / 10 USD), `cdmx` (Centro + TMC + MNA + Chapultepec: 299 / 22), `arqueologia` (MNA + Teotihuacán: 199 / 14), `todos` (todos los sitios: 579 / 41). `sitios` separa con coma; «todos» abre todos, también los que se agreguen. Hay que revisar el precio de «todos» cada vez que se suma un sitio.

**CODIGOS:** `codigo, sitio, horas, usos, vence, activo, nota`. Ejemplos: `PRUEBAS` (todos los sitios, 720 h, ilimitado — apagar antes de abrir al público), `HOTELCENTRO` (convenio de hotel), `TAQUILLAMNA` (apagado). Para que un cambio llegue al Worker hay que correr el workflow **«Publicar códigos de acceso»**.

### 5.2 Pestaña PIEZAS (una fila = una parada)
Encabezados reales (Frida; los demás sitios son equivalentes), con la letra de columna y el índice base cero que usan las API:

| Col | Idx | Encabezado | Qué lleva |
|---|---|---|---|
| A | 0 | `piece_id` | Identificador único `<prefijo><nn>_<nombre>`, p. ej. `fri_09_recamara_dia_espejo`. Solo minúsculas, números y `_`. Nunca cambiarlo una vez creado (rompe traducciones, audios y enlaces). |
| B | 1 | `room_id` | Sala o zona a la que pertenece (debe existir en SALAS) |
| C | 2 | `piso` | `PB` o `PA` (planta baja/alta; en zonas abiertas se usa PB) |
| D | 3 | `orden_sugerido` | Número de orden del recorrido completo |
| E | 4 | `titulo` | Título de la parada |
| F | 5 | `frase_gancho` | Una frase que invita (aparece en la tarjeta) |
| G | 6 | `puente_narrativo` | 1–2 frases que llevan a la siguiente parada (ver §7: debe ser válido en todas las rutas) |
| H | 7 | `guion_corto` | Modo Exprés |
| I | 8 | `guion_largo` | Modo Inmersión |
| J | 9 | `retos_observacion` | Retos separados por `|` |
| K | 10 | `especificaciones` | `Clave: valor | Clave: valor` |
| L | 11 | `faq_mito` | `Mito: … | Realidad: …` o `¿Pregunta? | Respuesta` (la app lo parte por `|`) |
| M, N | 12–13 | `map_x`, `map_y` | Posición en el plano (0–100 %) cuando hay plano SVG |
| O | 14 | `image_filename` | Archivo de foto en `public/images/pieces/` |
| P | 15 | `is_free` | TRUE/FALSE; hoy ninguna pieza es gratis |
| Q | 16 | `numero_catalogo` | Dato de catálogo del museo si existe |
| R | 17 | `fuente` | Fuentes de los datos duros |
| S | 18 | `verificado` | TRUE solo cuando un especialista o Alberto en sitio lo confirmó (hoy todo FALSE) |
| T–V | 19–21 | `foto_autor`, `foto_licencia`, `foto_url` | Crédito de la foto y página de Wikimedia Commons |
| W | 22 | `rutas` | Rutas a las que pertenece la parada, separadas con `|` (p. ej. `esencial|completa`) |
| X | 23 | (columna sin nombre, usada como `notas_dudas`) | Notas y dudas internas |
| Y | 24 | `publicar` | `SI` para que aparezca. **Cualquier otro valor oculta la fila.** |
| Z, AA | 25–26 | `lat`, `lng` | Coordenadas (zonas abiertas) |
| AB | 27 | `coordenadas_nota` | Nota sobre la precisión de las coordenadas |
| AC | 28 | `prioridad` | 1 imprescindible, 2 muy recomendable, 3 complementaria |

Columnas opcionales que la app también lee: `como_llegar`, `como_llegar_desde`, `lugar_mapa` (nombre del lugar para abrir en un mapa cuando no hay coordenadas) y las traducciones manuales `<campo>_en/_fr/_pl`.

**Fila de la hoja = índice de la parada + 2** (la fila 1 son encabezados). Ejemplo: la parada con índice 9 está en la fila 11.

### 5.3 Pestaña SALAS
Encabezados (Frida): `room_id, numero_oficial, nombre_oficial, piso, ala, frase_gancho, introduccion_narrativa, svg_id, publicar`. Otras columnas posibles: `etiqueta` (cómo se llama la zona en el selector; si falta, «Sala NN» o «Zona N») y traducciones `<campo>_en/_fr/_pl`. Los `room_id` tienen forma `fri-01-salas-pintura`.

### 5.4 Pestaña RUTAS
Encabezados: `ruta, nombre, duracion, minutos, descripcion, descripcion_en, descripcion_fr, descripcion_pl, nombre_en, nombre_fr, nombre_pl, grupo, principal`.
- `ruta` = clave en minúsculas (`esencial`, `completa`, `cuerpo-y-vestido`); es la que se escribe en la columna `rutas` de PIEZAS.
- `grupo` = `tiempo` | `tema` | `completo` (cómo se agrupan en la app).
- `principal` = `SI` marca la ruta sugerida por defecto.
- `minutos` es número; `duracion` es el texto que se ve («1 h 30 min»).
- **Las traducciones de RUTAS no las hace el traductor automático:** se escriben a mano en el Sheet.

### 5.5 Pestaña ANTES_DE_IR
Encabezados: `orden, tema, titulo, texto, enlace, enlace_texto, publicar, notas, titulo_en, texto_en, enlace_texto_en, titulo_fr, texto_fr, enlace_texto_fr, titulo_pl, texto_pl, enlace_texto_pl`.
- Lista corta de consejos prácticos (cómo llegar, horarios, boletos, fotos, accesibilidad).
- **Regla:** sin precios, medidas ni minutos fijos; siempre «confirma en el sitio oficial». Eso es lo que evita que se vuelva falso.
- En el texto, líneas con `- ` forman listas; `\n\n` separa párrafos.
- La traducción tampoco es automática: se escribe a mano o se pide a Claude y se pega.

### 5.6 Cómo interactuar con los Sheets desde Claude (herramientas MCP «Google Sheets»)
Herramientas usadas: `get_values`, `update_values`, `append_values`, `batch_clear_values`, `get_spreadsheet`, `update_spreadsheet` (batchUpdate) e `insert_dimension`. Reglas aprendidas:

1. **Leer antes de escribir.** Las lecturas grandes se guardan en un archivo; se parsean con `python3 -I`.
2. **`update_values` reemplaza todo el rango/celda.** Úsalo para celdas cortas (puentes, títulos, `ANTES_DE_IR`). No lleva `valueInputOption` (con él dio HTTP 400; reintentar sin él).
3. **Para editar un párrafo dentro de una celda larga usa `update_spreadsheet` con `findReplace`:**
   ```json
   {"findReplace":{"find":"texto exacto","replacement":"texto nuevo","matchCase":true,
     "range":{"sheetId":1,"startRowIndex":R,"endRowIndex":R+1,"startColumnIndex":C,"endColumnIndex":C+1}}}
   ```
   `startRowIndex` es base cero; la fila de la parada con índice `i` usa `startRowIndex = i+1`. La respuesta trae `occurrencesChanged`: **debe ser 1**. Si la respuesta de ese elemento viene vacía, no coincidió (0 cambios). Antes de enviar, verifica que cada `find` ocurra exactamente una vez en la celda (se hizo con un script que lee el volcado).
4. **Para borrar un párrafo con `findReplace`, incluye el `\n\n` sobrante** en `find` para no dejar líneas vacías.
5. **Los saltos de línea de una celda** son `\n`. En JSON se escriben `\n`.
6. **El tamaño de lote:** 44 `findReplace` en una sola llamada funcionó bien. Los lotes son atómicos: si uno es inválido, ninguno se aplica.
7. **Siempre releer una muestra** después de editar.
8. **Si una celda empieza con `=`, `+`, `-` o parece fecha/número,** Google puede reinterpretarla. Los textos de PIEZAS no deberían empezar así.
9. **Índices de CONTROL:** una vez se modificó por error la fila de otro sitio (índice 5 = Chichén; TMC es 6). Verificar la fila por `site_id` antes de editar.
10. **Skill de Google Workspace** (`anthropic-skills:google-workspace`): léela antes de cambiar Docs/Sheets/Slides con conectores.

## 6. Reglas de los textos

Fuente de verdad del estilo: `docs/GUIA_DE_ESTILO_guiones.md`. **Metas vigentes** (mandan sobre la sección 2 de ese archivo):

- **Guion corto:** 105 a 150 palabras. Se entiende solo (no es el inicio del largo).
- **Guion largo:** 470 a 720 palabras, en párrafos separados por una línea en blanco. Sin repetir frases del corto. Estructura sugerida: descubrimiento → significado → dato curioso → conexión/mirada.
- **Puente narrativo:** una o dos frases hacia la siguiente pieza, con verbo de movimiento. **Debe valer para todas las rutas** (ver §7).
- **Voz:** tuteo, calidez de locutor, español de México. Sin exclamaciones.
- **Números en letras** («mil novecientos cuarenta y seis», «siglo veinte»), «antes de Cristo» completo, sin decimales con punto. Las cifras en `especificaciones` (ficha técnica) sí pueden ir en números.
- **Frases de máximo ~25 palabras**, una idea por frase. Sin paréntesis, rayas largas, comillas anidadas ni listas en el guion (la voz los lee mal).
- **Nombres mayas/náhuatl sin apóstrofos** (la pronunciación va en `glosario/pronunciacion.csv`).
- **Arranques variados** (8 tipos: dato sorprendente, pregunta, detalle pequeño, escena humana, contraste, mito, número, nombre original). No repetir el mismo tipo en dos paradas seguidas de una sala.
- **Palabras prohibidas:** «de inmediato», «sin duda», «fascinante», «impresionante», «único en su género». Máximo una vez por guion: «monumental», «cosmovisión», «testimonio», «poderoso», «se erige», «contempla», «observa». Nada de arranques tipo «Al situarse ante…».
- **No ordenar al visitante mover el cuerpo** en cada texto («gira la cabeza»), solo cuando ayuda de verdad.
- **Datos duros solo con fuente.** Distinguir siempre: lo que se sabe / lo que se supone / lo que cuenta la tradición. Si no hay dato verificado, se escribe general («hacia el Posclásico tardío»). No convertir unidades. No redondear «porque suena bien».
- **Enlaces entre piezas** dentro del texto: `[texto visible](piece_id)`. La voz y el hash de audio usan solo el texto visible. El id debe existir (hay prueba automática `enlaces.test.mjs` y `hasBrokenLink`).
- **Retos de observación:** 2–3 retos concretos, separados por ` | `. Deben ser algo que se vea en la parada.
- **Especificaciones:** `Clave: valor | Clave: valor`. No afirmar lo que no esté en la fuente.
- **Mito/Realidad:** `Mito: … | Realidad: …` (o pregunta/respuesta). El mito debe ser creencia real y la realidad, comprobable.
- **Estructura de la ficha de cada parada:** título, gancho, puente, corto, largo, retos, especificaciones, FAQ, fuente, foto con crédito, rutas, coordenadas.
- **Contenido religioso o delicado** (Catedral, cenizas de Frida, sacrificio): tono respetuoso, sin sensacionalismo. En Huei Tzompantli se suavizó el lenguaje.
- **Sin información que caduca** en los guiones (horarios, precios, reglas de fotos, medidas de bolsas): eso va a ANTES_DE_IR con «confirma en el sitio oficial».
- **Redundancias:** un mismo dato no debe repetirse en 4 paradas; recortar párrafos de relleno («Cada objeto tiene detrás a una persona…»).
- **Coherencia entre paradas:** fechas y cifras deben coincidir (ejemplo corregido: Anahuacalli 1942). Hacer una pasada de consistencia después de cada auditoría.

## 7. Cómo funcionan las rutas

- Cada pieza tiene una columna `rutas` con las claves de las rutas a las que pertenece, separadas por `|` (ej. `esencial|completa|cuerpo-y-vestido`).
- La definición de cada ruta (nombre, duración, descripción, grupo) está en la pestaña RUTAS del Sheet.
- El orden dentro de una ruta es el de la pieza en el recorrido (`orden_sugerido`, y zona).
- Rutas típicas: `esencial` (lo imprescindible), `completa` (todas las paradas) y rutas temáticas (`cuerpo-y-vestido`, astronomía, juego de pelota…).
- **REGLA CRÍTICA:** la app muestra el **puente narrativo** y el **final del guion largo** en **todas las rutas que contienen esa parada**. Por eso un puente que diga «ahora ve a la cocina» es un error si en una ruta la siguiente parada es otra. Solución: calcular para cada parada cuál es la «siguiente» en cada ruta (script Python sobre la columna `rutas`); si difiere, el puente se reescribe **neutral** («sigue con la siguiente parada de tu ruta») o se nombra solo lo que es verdad en todas.
- El mismo cuidado aplica al cierre (última parada) y a textos que mencionan «lo que viste en la primera sala»: esa mención es falsa si la ruta se la salta.
- Las descripciones de RUTAS cuentan paradas («trece paradas…»): **actualizar el número si se agregan o fusionan paradas**.
- Teotihuacán y MNA tienen sus rutas definidas en código (`scripts/sync-sheets.js`: `ROUTES`, `TEO_ROUTES`); los demás sitios las leen de RUTAS (`leerDefinicionesRutas`, `construirRutasSitio` en `scripts/sitios-extra-lib.mjs`).
- Parada con `publicar` distinto de `SI` no aparece en ninguna ruta.

## 8. Modelos de datos y JSONs

### 8.1 Qué genera la sincronización (`npm run sync-data` = `node scripts/sync-sheets.js`)
Lee CONTROL y los Sheets privados con el robot de Google y escribe:
- `public/data/sites.json` (lista de sitios con nombre, ubicación, precios, estado, `access`, portada…)
- `public/data/<sitio>/…` (ficha del sitio, salas, piezas públicas, rutas, `precios.json`)
- `public/data/pieces.json` y `rooms.json` (MNA, copia en `public/data/mna/`)
- `datos-privados/` (no se publica con el sitio; se sube a R2): guiones, retos, mito y ficha técnica de las piezas de pago por idioma (`texto/<idioma>.json`), más `piezas-completas.json`.
- Mezcla las traducciones guardadas de `traducciones/` (si el hash del español coincide).
- **Seguridad:** si un Sheet no se puede leer o viene incompleto (menos de 10 piezas), se detiene antes de escribir. Nunca se publican datos a medias.

### 8.2 Forma de una pieza (`src/types.ts → PieceBase`)
`piece_id, room_id, piso, orden_sugerido, prioridad(1–3), titulo, frase_gancho, puente_narrativo, como_llegar, como_llegar_desde, lat, lng, lugar_mapa, guion_corto, guion_largo, retos_observacion[], especificaciones{}, faq_mito{pregunta,respuesta}, map_x, map_y, image_filename, foto_autor, foto_licencia, foto_url, is_free, avance, cultura, indice, idiomas_texto[], audio{…}`, más campos traducidos `<campo>_en|fr|pl`.
- `avance` = primeras frases (≈220 caracteres) que ve quien no tiene pase; `indice` = palabras para la búsqueda.
- **Piezas de pago:** en el JSON público solo van título, gancho, foto, sala y adelanto; los textos largos van a R2 y el Worker los entrega con pase (`GET /texto/<idioma>.json?t=<clave>`).
- **Audio** por idioma y modo: `{ corto: {hash,file,remote,seconds,bytes,provider}, largo: {…} }`.

### 8.3 JSON de traducción (`traducciones/<idioma>/pieza_<id>.json`)
```json
{ "id": "chi_16_templo_guerreros", "tipo": "pieza", "idioma": "pl",
  "modelo": "claude-sonnet-5-5", "fecha": "2026-10-29",
  "avisos": { "campo": ["aviso automático"] },
  "campos": { "titulo": { "hash": "cd6f64b01a908be4", "texto": "…" }, "guion_corto": {…}, … } }
```
- `hash` = huella del **texto en español** de ese campo. Si el español cambia, la traducción se ignora (la app vuelve al español) hasta retraducir.
- Se puede editar `texto` a mano (por ejemplo corregir un título); el hash no cambia, así que no se pisa. El título de chi_16 en polaco se corrigió así.
- `sala_<room_id>.json` tiene la misma forma. `_ultima_corrida.md` guarda español arriba y traducción abajo de la última corrida (se sobrescribe cada vez).
- Una celda `<campo>_en` llena en el Sheet **gana** sobre la traducción guardada.

### 8.4 Manifiesto de audio (`public/audio/manifest.json`)
`{"version":1,"items":{ "<idioma>": { "<piece_id>": { "corto": {…}, "largo": {…} } } } }`. La lista vive en el repo; los MP3, en R2. Si el texto de una pieza cambia, el hash difiere y el MP3 viejo **deja de usarse** (la app vuelve a la voz del teléfono) hasta regenerar.

### 8.5 Sitio genérico (`public/data/sites.json` entrada)
Campos: `id, name, short_name, location, thumbnail, badge, path, description, intro, highlights_count, total_stops, status (active|coming_soon|preview), pass_price_mxn, pass_price_usd, access (paid|free|code), cover_image, cover_piece_id`, y `name_<idioma>`/`intro_<idioma>` cuando existen.

## 9. GitHub: repositorio, ramas, workflows, secretos y trucos

### 9.1 Ramas y publicación
- `main` = producción. Un push a `main` publica xolotli.com (workflow «Publicar la app en Cloudflare Pages»). Los workflows de traducir/audio hacen commit **directo a `main`**.
- Ramas `feature/**` generan una dirección de prueba con `noindex` y corren «Verificar rama» (compila y corre pruebas; no publica).
- Para cambios manuales: crear una rama, `git push -u origin <rama>`, abrir PR por **REST** (ver trucos) y fusionar.
- Ramas pendientes de decidir: `fotos-tmc-consultas` (sin fusionar), `capturas` (capturas de pantalla), y varias ramas viejas `feature/*`.

### 9.2 Workflows (pestaña Actions) y para qué sirve cada uno
| Workflow (nombre en pantalla) | Archivo | Qué hace |
|---|---|---|
| Publicar la app en Cloudflare Pages | `desplegar-cloudflare.yml` | Compila leyendo los Sheets y publica. **Ya no se reconstruye solo cada 6 h:** tras cambiar un Sheet hay que correrlo sobre `main` |
| Verificar rama (sin desplegar) | `verificar-rama.yml` | Revisa que compile y pase pruebas en ramas `feature/**` |
| Traducir textos (botón manual) | `traducir.yml` | Traducción con Claude (ver §10) |
| Generar audios MP3 (botón manual) | `generar-audio.yml` | Voz con Azure/OpenAI/prueba, sube a R2 (ver §11) |
| Muestras de voz | `muestras-voz.yml` | Genera muestras con varias voces o prueba pronunciaciones |
| Descargar fotos de un sitio | `descargar-fotos.yml` | Baja fotos de Commons con revisión de licencia; también `buscar` candidatas |
| Datos del mapa | `datos-mapa.yml` | Coordenadas candidatas (OSM/Wikipedia) y recorte del mapa |
| Publicar el servidor de cobro | `desplegar-pagos.yml` | Sube `pagos/` como Worker y guarda secretos allá |
| Publicar códigos de acceso | `publicar-codigos.yml` | Manda la hoja CODIGOS al Worker |
| Revisar permisos de Cloudflare | `cloudflare-revisar.yml` | Solo lee: dice qué puede hacer el token |
| Revisar audios en R2 | `revisar-audio-r2.yml` | Compara el manifiesto con lo que hay en R2 |
| Descargar audios (copia local) | `descargar-audios.yml` | Zip de un idioma desde R2 (dura 1 día; correr solo con el repo privado) |
| Respaldo semanal | `respaldo-semanal.yml` | Domingos 4 a.m. CDMX: textos a Drive, tar.gz a R2, copia de MP3 |
| Resumen de uso de la app | `resumen-uso.yml` | Estadísticas anónimas del Worker |
| Capturas de la app | `capturas.yml` | Capturas de pantalla en la rama `capturas` |

### 9.3 Secretos y variables (Settings → Secrets and variables → Actions)
Secretos: `ANTHROPIC_API_KEY`, `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`, `OPENAI_API_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_API_TOKEN_DNS`, `CODES_KEY`, `GOOGLE_SERVICE_ACCOUNT_JSON`, `STATS_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `TOKEN_SECRET`.
Variable: `PAGOS_API_URL` (dirección del Worker, sin diagonal final).
**Nunca** pegar claves en el chat ni en archivos.

### 9.4 Trucos de `gh` y del entorno de Claude (muy importante)
- En la nube de Claude el shell **no tiene** las claves de Anthropic, Azure ni Google: solo existen en GitHub. Todo lo que gasta o lee Sheets privados se corre con los workflows.
- `gh workflow run <archivo> --ref main -f campo=valor` lanza un workflow; `gh run list --workflow <archivo> --limit 1 --json databaseId,status,conclusion` consulta; `gh run view <id> --json jobs --jq '.jobs[].steps[]|[.name,.conclusion]|@tsv'` muestra qué paso falló.
- **Los registros (logs) de las corridas devuelven 403:** no se puede leer el detalle de un error. Se diagnostica con los pasos fallidos, con `_ultima_corrida.md`, con el manifiesto y razonando.
- **`gh pr create` falla** (usa GraphQL, bloqueado). Usar REST:
  `gh api repos/albertorabell/audioguias-mexico/pulls -f title=… -f head=<rama> -f base=main -f body=…`
  y fusionar con `gh api -X PUT repos/albertorabell/audioguias-mexico/pulls/<n>/merge -f merge_method=squash`.
- **Concurrencia:** `traducir.yml` y `generar-audio.yml` tienen grupos de concurrencia; si lanzas varias a la vez, GitHub **cancela** las pendientes. Lanzar **de una en una** esperando a que termine (script en bucle con `gh run view`).
- **Campos vacíos en `gh workflow run -f campo=`** hacen que se use el valor por defecto del workflow (p. ej. `limite` vacío = 3 en audio, 5 en traducción). Para «sin límite» poner un número grande (`99999`/`200`).
- **Dónde se vigilan las corridas largas:** con la herramienta Monitor sobre un archivo de registro propio; los monitores caducan a los 30 minutos y hay que volver a armarlos (los avisos repetidos son normales).
- El comando `sleep` largo en primer plano está bloqueado: usar Monitor o `run_in_background`.
- La sesión de Claude Code **no puede** fusionar con GraphQL ni leer hilos de revisión con `gh pr view`; usar las rutas REST.
- Los commits automáticos de los workflows se llaman «Traducciones (en): normal, límite N» y «Lista de audios MP3 actualizada (…)».

### 9.5 Pruebas automáticas
`npm test` corre `scripts/tests/*.test.mjs` y `pagos/test/*.test.mjs` (traducir, audio, sync, SEO, fotos, enlaces, precios, respaldo, etc.). `e2e/` tiene pruebas de navegador (Playwright). `npm run lint` = `tsc --noEmit`. `npm run build` = sincronizar + compilar + generar páginas SEO.

## 10. Traducciones

**Qué traduce el script (`scripts/traducir.mjs`, workflow «Traducir textos»):** SOLO las hojas PIEZAS y SALAS: `titulo, frase_gancho, puente_narrativo, guion_corto, guion_largo, retos_observacion, especificaciones, faq_mito` (y en SALAS `nombre_oficial, frase_gancho, introduccion_narrativa, etiqueta`). **No** traduce RUTAS, ANTES_DE_IR ni SITIOS: esas columnas se llenan a mano en el Sheet (se puede pedir a Claude que las redacte y pegarlas con `update_values`).

**Entradas del workflow:** `idioma` (en/fr/pl), `sitio` (site_id; por defecto `mna`), `piezas` (lista opcional separada por comas), `modo` (`normal` | `lote-enviar` | `lote-recoger`), `limite` (**por defecto 5**), `max_usd` (**por defecto 2**), `generar` (sin marcar = plan gratis), `forzar` (retraducir aunque no haya cambiado).

**Procedimiento estándar para un sitio nuevo o cambiado:**
1. Esperar a que los textos en español estén aprobados y publicados en el Sheet.
2. **Plan gratis** (sin `generar`) por idioma: ver cuántas unidades y costo. (No se puede leer el log; estimar por tamaño del texto: ≈ 170 mil caracteres por sitio grande.)
3. **Prueba pequeña** (`limite` 3, `max_usd` bajo) en inglés y revisar `traducciones/en/_ultima_corrida.md`.
4. **Corrida completa por idioma, una a la vez**: `generar` marcado, `limite=200`, `max_usd` suficiente (6 funcionó para los sitios de 30–50 paradas). `modo=lote-enviar` cuesta la mitad pero tarda y exige `lote-recoger`.
5. Revisar con el conteo: `ls traducciones/<lang> | grep -c pieza_<prefijo>` debe igualar el número de paradas publicadas.
6. Escribir a mano en el Sheet: `RUTAS` (`descripcion_en/fr/pl`, `nombre_en/fr/pl`), `ANTES_DE_IR` (`*_en/_fr/_pl`) y `SITIOS` (`introduccion_en/_fr/_pl`).
7. Revisar muestras (números en letras, nombres mayas iguales, enlaces `[texto](id)` intactos, sin español sobrante).

**Qué valida el script antes de guardar:** misma forma (listas/FAQ), sin texto en español sobrante, largo razonable, sin formato extra, enlaces válidos. Los avisos (nombre del glosario ausente, números que no aparecen) se guardan en el archivo `avisos`.

**Costos de referencia:** precios supuestos de entrada/salida por millón de tokens, configurables con `TRADUCIR_USD_ENTRADA` / `TRADUCIR_USD_SALIDA`. La corrida se detiene antes de pasarse de `max_usd`. Una corrida con 3 errores seguidos se detiene.

**Resultado de una corrida:** commit directo a `main` con los JSON. Si **ningún** elemento se guardó y hubo error, la corrida marca *failure*. Si no había nada pendiente, termina bien («todo está al día»). Que una corrida figure *failure* no siempre es grave (Chapultepec francés falló pero ya tenía sus 30 piezas).

**Nunca traducir «a ojo»** datos duros; se copian igual. **Todo texto en francés y polaco necesita revisión de persona nativa** antes de decir que está «verificado».

**Idioma publicado:** un idioma aparece en el selector si está en `DEFAULT_PUBLISHED_LANGUAGES` de `src/i18n/languages.ts` (hoy `es, en, fr, pl`); `ru` y `ja` están como «próximamente». El comentario del archivo habla de «modo de prueba»: mantener o quitar esa frase es decisión de Alberto. Las pruebas pueden fijar `VITE_PUBLISHED_LANGUAGES=es,en`.

**Glosario:** `glosario/glosario.csv` (categoría, tipo, español, inglés, francés, polaco, nota). Los nombres mayas/náhuatl se dejan igual (tipo `igual`). Agregar términos nuevos antes de traducir un sitio con nombres nuevos.

## 11. Audios con Azure

**Voz única para todos los idiomas:** `es-MX-JorgeMultilingualNeural` (constante `SINGLE_VOICE` en `scripts/generar-audio.mjs`). Es una voz multilingüe elegida por Alberto: suena como el mismo locutor en español, inglés, francés y polaco. En francés y polaco puede tener acento; se hizo una prueba de 3 audios y Alberto la aprobó.

**Workflow «Generar audios MP3»** — entradas: `proveedor` (`azure` | `openai` | `prueba` [MP3 en silencio, gratis, para ensayar]), `idiomas` (lista con comas: `es,en,fr,pl`), `sitio` (site_id o `todos`), `piezas` (`gratis` | `premium` | `todas`), `limite` (**por defecto 3**), `generar`, `forzar`, `reubicar`, `borrar_todo` (**peligro**: borra TODO en R2).

**Procedimiento:**
1. Plan gratis (sin `generar`): muestra cuántos audios, cuántos caracteres y costo aproximado (referencia US$ 15 por millón de caracteres con Azure; confirmar con Microsoft).
2. Prueba de 3 (`limite=3`, `generar`) en el idioma más dudoso y escuchar.
3. Corrida completa **por sitio, una a la vez**: `idiomas=es,en,fr,pl`, `piezas=todas`, `limite=99999`, `generar=true`. Tarda de 15 a 60 minutos por sitio.
4. Verificar contando el manifiesto: por idioma debe haber `paradas` entradas por sitio (cada una con `corto` y `largo`).

**Cómo se deciden los audios (`planAudio` en `scripts/audio-lib.mjs`):** para cada pieza × idioma × modo se calcula el guion (texto visible, sin marcas de enlace), su hash y se compara con el manifiesto. Solo se genera lo nuevo o cambiado (o todo con `forzar`). Sin texto en ese idioma = se omite (por eso hay que traducir antes de generar el audio de ese idioma).

**Dónde quedan:**
- Los MP3 viven en **Cloudflare R2**, bucket `audioguias-audio`: `libre/<idioma>/<pieza>_<corto|largo>.mp3` (gratis) o `pago/<idioma>/…` (de pago). **No se guardan en GitHub.** En el repositorio solo está `public/audio/manifest.json`.
- Se entregan por el Worker: `GET /audio/libre/…` (sin clave) y `GET /audio/pago/…?t=<token>` (pase vigente; admite `Range`).
- Copia de seguridad semanal en el bucket `audioguias-respaldo`. Para bajar uno a mano: workflow «Descargar audios» (solo con repo privado).
- Si cambias qué piezas son gratis: correr el botón con `reubicar` (mueve en R2, no gasta voz).

**Pronunciación:** `glosario/pronunciacion.csv` (`idioma, palabra, tipo, valor, nota`; tipos `alias`, `ipa`, `lang`, `voz`). Afecta solo al audio, no al texto en pantalla. Para probar una palabra: workflow «Muestras de voz» con `--pronunciar`. Ejemplo ya resuelto: «Mexica» sonaba «Mechica». El español de México no tiene sonido «sh».

**Después de editar un texto en español:** el MP3 viejo queda desactualizado automáticamente (hash). Para cambiar el audio: retraducir (si aplica) y regenerar solo ese sitio.

**Errores ya cometidos:** `limite` vacío (usa 3); lanzar varios sitios a la vez (se cancelan); olvidar que el idioma sin traducción no genera audio.

## 12. Fotos

- Una foto **propia por parada**, con licencia **dominio público, CC0, CC BY o CC BY-SA** (nunca NC ni ND), con autor, licencia y URL de la página del archivo en Wikimedia Commons anotados en `foto_autor`, `foto_licencia`, `foto_url`.
- Archivo final: `public/images/pieces/<nombre>.webp` (ancho máximo 1280). El nombre va en `image_filename`.
- **Buscar candidatas:** archivo de consultas `scripts/fotos/consultas-<sitio>[-N].json` + workflow «Descargar fotos de un sitio» con `buscar` marcado (deja hojas de contacto en la rama `fotos-candidatas`).
- **Descargar:** el mismo workflow con `plan` marcado (solo revisa licencias) y luego sin `plan`: baja y deja las fotos en una rama `fotos-<sitio>` para revisar y fusionar.
- Revisar la licencia **en Commons antes** de bajar (el script lo hace). Cuando una foto no tiene dato claro, no se usa.
- La portada del sitio se elige con `portada` en CONTROL (un `piece_id`).
- Las pruebas (`fotos.test.mjs`) validan créditos.
- Estado: Frida (18 paradas) y TMC con fotos descargadas y fusionadas; Chichén con 4 copias temporales; la rama `fotos-tmc-consultas` queda sin fusionar.

## 13. Mapas y coordenadas

- Zonas abiertas (Teotihuacán, Chichén, Chapultepec, Centro Histórico) usan **coordenadas** `lat`/`lng` por parada y mapa en vivo (MapLibre + PMTiles con datos de OpenStreetMap/Protomaps). Se recortan en el repo con el workflow «Datos del mapa» (`scripts/mapa/obtener-coordenadas.mjs`: trae candidatos de OSM y Wikipedia; **las coordenadas finales las confirma una persona**).
- Interiores (MNA, a veces Frida) usan **plano SVG** (`public/data/<sitio>/<sitio>-map.svg`) y `map_x`/`map_y` (0–100 %). La sala se enlaza con `svg_id`.
- `coordenadas_nota` registra qué tan segura es cada coordenada. Las ubicaciones dentro de la Catedral y del museo del Templo Mayor son aproximadas hasta confirmarlas en campo.
- `lugar_mapa` sirve para abrir una búsqueda en el mapa cuando faltan coordenadas.

## 14. Cloudflare

- **Pages** (proyecto `audioguias`): sirve xolotli.com. `public/_headers` pone cabeceras de seguridad (`nosniff`, `Referrer-Policy: no-referrer`, HSTS, `Permissions-Policy` limitada); `public/_redirects` redirige `www`→raíz.
- **Worker `audioguias-pagos`** (`pagos/`): rutas `/config`, `/checkout`, `/redeem`, `/code`, `/status`, `/audio/libre|pago/…`, `/texto/<idioma>.json`, `/estadisticas`, `/health`. Variables en `pagos/wrangler.toml`: `ALLOWED_ORIGINS` (solo `https://xolotli.com`; agregar la dirección de prueba si se prueban pagos ahí), `SITE_IDS`, `PRECIOS_URL` (`https://xolotli.com/data/precios.json`), `PASS_HOURS=72`, `MAX_DEVICES=2`, `ACCESO_LIBRE`, `STRIPE_PRICE_ID_MXN` (y USD vacío).
- **KV `PASES`:** pases y códigos. Es eventualmente consistente (hasta ~1 min en otras regiones).
- **R2:** `audioguias-audio` (MP3 y textos de pago), `audioguias-respaldo` (respaldos, últimos 8 .tar.gz + copia de MP3).
- **Token de API** (`CLOUDFLARE_API_TOKEN`): debe tener permisos de Workers, R2 y KV. `CLOUDFLARE_API_TOKEN_DNS` es otro token para el dominio. Si algo falla por permisos, correr «Revisar permisos de Cloudflare».
- **Dominio:** conectar con «Publicar la app en Cloudflare Pages» eligiendo `conectar_dominio = si`. Cloudflare cambia los nombres de botones: si no se encuentra uno, pedir captura.
- **Desplegar el Worker** otra vez cada vez que cambie `pagos/` o `wrangler.toml` (workflow «Publicar el servidor de cobro»). Los códigos nuevos requieren «Publicar códigos de acceso».
- **Límites conocidos del Worker:** sin límite de solicitudes por IP (se puede agregar *Rate limiting*); límite de 2 dispositivos «de cortesía» (KV no es atómico); reembolsos no revocan el pase; los MP3 de pago no incluyen el sitio en la ruta (necesario cuando haya un segundo sitio de pago con colisión de ids; hoy los ids llevan prefijo único).

## 15. Stripe, pases, códigos y precios

- **Pase de 72 horas por sitio**, empieza a contar en el **primer canje** (no al pagar); se puede canjear por primera vez hasta 30 días después de pagar; hasta 2 dispositivos con un código corto `XXXX-XXXX`.
- **Precios:** los reales salen de **Stripe** (`price_…` en `wrangler.toml`) y de `precio_mxn`/`precio_usd` en CONTROL (la sincronización genera `public/data/precios.json`; el Worker lo lee). Si cambias el precio, revisa también los textos fijos que lo mencionan.
- **Modo de pruebas hoy:** `ACCESO_LIBRE = "1"` en `pagos/wrangler.toml` → todos entran sin pagar. Para cobrar: cambiar a `"0"`, volver a publicar el Worker, cambiar `STRIPE_SECRET_KEY` por la clave real (`sk_live_…`) y los `price_` por los reales.
- **Stripe México:** comisión ≈ 3.6 % + MXN 3 por pago con tarjeta nacional (+0.5 % extranjera, +2 % conversión), sin mensualidad (revisado el 2-oct-2026; reconfirmar).
- **Tarjeta de prueba:** `4242 4242 4242 4242`, cualquier fecha futura y CVC.
- **Antes de cobrar en serio:** Términos y condiciones, Aviso de privacidad, política de reembolsos visibles; consultar CFDI con un contador; **salir de GitHub Pages** (no se permite para negocios) — ya se usa Cloudflare Pages.
- **Códigos** (hoja CODIGOS): para convenios (hoteles), taquilla/QR o pruebas; `activo = NO` apaga. Apagar `PRUEBAS` antes de abrir al público.
- **Pases combinados** (hoja PASE_COMBINADO): precios y sitios incluidos; se muestran como ahorro.
- Textos de pago: el Worker los entrega con pase desde R2; los textos de las piezas de pago **no** van en el JSON público (solo el adelanto). Aun así los de los sitios en modo gratis/`ACCESO_LIBRE` se ven.
- **Reembolsos:** no revocan el pase todavía (falta un webhook `charge.refunded`; existe el secreto `STRIPE_WEBHOOK_SECRET`).

## 16. SEO

**Ya implementado (comprobado en código y en el sitio publicado el 29-oct-2026):**
- `index.html`: título y descripción propios, `canonical`, `og:*` (título, descripción, tipo, URL, nombre del sitio, locale, imagen), `twitter:card`, JSON-LD (WebSite) y viewport/idioma.
- `public/robots.txt`: `Allow: /` y `Sitemap: https://xolotli.com/sitemap.xml`.
- **Páginas estáticas por sitio e idioma** generadas en el build (`scripts/generar-paginas-seo.mjs` + `scripts/seo-lib.mjs`): `es → /guias/<slug>/`, `en → /en/guides/<slug>/`, `fr → /fr/guides/<slug>/`, `pl → /pl/przewodniki/<slug>/`. Cada una tiene título, descripción, `canonical`, `hreflang` (es, en, fr, pl y `x-default`), `og:*`, `twitter:card`, JSON-LD y selector de idioma. **Nunca llevan texto de pago** (solo datos públicos: títulos, salas, rutas, «Antes de ir»).
- **Un idioma solo sale en una página si el sitio tiene textos traducidos** (jamás una página en inglés con texto en español).
- `sitemap.xml` (≈ 71 URLs al 29-oct) con `lastmod` y alternates `xhtml:link` por idioma.
- Páginas de prueba `*.audioguias.pages.dev` llevan `noindex`.

**Mantenimiento:**
- Para sumar un sitio a las páginas SEO: agregarlo en `PAGINAS` de `scripts/seo-lib.mjs` (clave = id del sitio en mayúsculas; slugs por idioma; nombres traducidos; artículo el/la). Hay prueba `seo.test.mjs`.
- `MUSEO_FRIDA_KAHLO` tiene `proximamente: true` en `PAGINAS`; si Frida ya está publicada en la app, **quitar esa marca** para que la página muestre el botón de entrada (revisar con Alberto).
- Tras traducir/publicar un sitio, correr el despliegue para que el sitemap incluya los idiomas nuevos.
- **Search Console:** (pendiente de Alberto) agregar la propiedad `xolotli.com`, mandar el sitemap y pedir indexación manual de 5–10 páginas clave; no pedir las 71 una por una. Esperar días o semanas.
- **Pendiente de medir:** PageSpeed/Lighthouse y Core Web Vitals.
- Una auditoría hecha con Copilot concluyó «riesgo crítico» porque solo miró resultados de búsqueda y no el código; la mayor parte de sus puntos ya estaba cubierta (sitemap, robots, canonical, OG/Twitter, hreflang, JSON-LD, páginas prerrenderizadas). Si se repite una auditoría, pedir que lea el repositorio o usar Search Console.
- Las herramientas de lectura de páginas de Claude muestran solo el texto, no el `<head>`; para validar etiquetas hay que mirar el código o usar Search Console.

## 17. La app (React + Vite + PWA)

- Stack: React 19, Vite 6, Tailwind 4, TypeScript 5.8, MapLibre/PMTiles, `vite-plugin-pwa`, lucide-react.
- Carpetas: `src/components` (Home, MuseumScreen, RoomView, PieceDetail, PieceDock, PieceTour, RoutesScreen, RouteWizard, SearchScreen, MapScreen, LiveMap, FloorPlan, PaywallModal, OfflineIndicator, OfflineTourBanner, InstallHelp, IntroTour, CoachTour…), `src/i18n` (textos de interfaz por idioma, `languages.ts`, `content.ts`, `runtime.ts`), `src/utils` (audioSource, ttsPlayer [voz del teléfono de respaldo], offlineTourManager, payments, license, routeOptimizer, antiCopia, analytics, geo, maps, pieceLinks), `src/config` (`pass.ts`, `payments.ts`).
- **Audio:** si la pieza tiene MP3 en el idioma, se reproduce; si no, usa la voz del teléfono (TTS). Los MP3 se pueden guardar para escuchar sin internet.
- **Sin traducción de una pieza:** muestra español y avisa. Traduce ambos guiones (corto y largo) o ninguno.
- **Interfaz** en español, inglés, francés y polaco (ruso y japonés: «Pronto»).
- **Autodetección de idioma** del navegador: apagada (`AUTO_DETECT_LANGUAGE = false`).
- **Anti-copia:** `src/utils/antiCopia.ts` (desalienta copiar texto de pago).
- **Estadísticas:** eventos anónimos al Worker (`/estadisticas`); resumen con el workflow «Resumen de uso».
- Comandos locales: `npm run dev` (puerto 3000), `npm run build`, `npm test`, `npm run lint`.
- Variables de compilación: `VITE_PUBLISHED_LANGUAGES`, `PAGOS_API_URL` (vía variable de GitHub), `SYNC_FUENTE`, `SYNC_PIEZAS_GRATIS`, `SYNC_LOCAL_DIR` (pruebas con CSV).

## 18. Cómo agregar un sitio o museo nuevo (receta completa)

(Ver también `docs/NUEVO_SITIO.md`.)
1. **Alcance con Alberto:** zonas/salas, número aproximado de paradas, rutas (esencial/completa/temáticas), idioma base.
2. **Investigar con fuentes citables** (INAH, publicaciones académicas, sitio oficial, Wikimedia para fotos). Anotar dudas aparte; nunca afirmarlas.
3. **Crear el Sheet** del sitio en la carpeta «Audioguías México» (copiar uno existente, p. ej. Frida): pestañas `SALAS`, `PIEZAS`, `RUTAS`, `ANTES_DE_IR`. Compartirlo con la cuenta de servicio del robot.
4. **Agregar la fila en CONTROL → SITIOS:** `site_id` (minúsculas/`_`), `prefijo` (p. ej. `xyz_`), `nombre`, `sheet_id`, `publicar` (empezar en NO), `precio_mxn`, `precio_usd`, `acceso`, `ubicacion`, `descripcion`, `insignia`, `introduccion` (+ `_en/_fr/_pl` a mano), `portada`.
5. **Redactar** SALAS, PIEZAS (ids con el prefijo, orden, puentes neutrales, `rutas`, `publicar = SI`), RUTAS y ANTES_DE_IR siguiendo §6 y §7.
6. **Fotos:** buscar candidatas, anotar crédito, descargar (§12).
7. **Coordenadas o plano** (§13).
8. **Auditoría de textos** (§19) y corrección. `verificado` queda FALSE hasta confirmar.
9. **Sincronizar y probar en una rama** (`feature/**`) para ver la dirección de prueba; la CI corre sola.
10. **Traducir** (§10) y escribir a mano rutas/«antes de ir»/introducción.
11. **Pronunciación** (nombres difíciles → `pronunciacion.csv`; probar con «Muestras de voz»).
12. **Generar audio** (§11): plan → prueba de 3 → completo.
13. **SEO:** agregar a `PAGINAS` en `scripts/seo-lib.mjs` (slugs y nombres por idioma) y a las listas del Worker (`SITE_IDS` en `pagos/wrangler.toml` como respaldo).
14. **Combos y precios:** agregar el sitio donde corresponda en PASE_COMBINADO; revisar el precio de «todos».
15. **Publicar:** `publicar = SI` en CONTROL, fusionar la rama a `main`, correr el despliegue, volver a publicar el Worker si cambió algo, y pedir indexación en Search Console.
16. **Actualizar este archivo** (§4 y §21).

## 19. Flujo estándar de una auditoría de textos

Lo que se hizo con Chichén, TMC y Frida:
1. **Leer** todo el sitio: SALAS, RUTAS, PIEZAS (corto, largo, retos, especificaciones, FAQ, puente, fuente), ANTES_DE_IR. Volcar a un archivo para citas exactas.
2. **Detectar:**
   - Errores de contenido y contradicciones internas (fechas, cifras, afirmaciones sin fuente).
   - **Puentes y cierres que fallan en rutas cortas** (analizar la columna `rutas` con un script: siguiente parada por ruta).
   - Textos que citan paradas que otra ruta se salta.
   - Redundancia entre paradas y párrafos de relleno.
   - Datos que caducan (precios, horarios, reglas de fotos) → mover a ANTES_DE_IR con «confirma».
   - Hechos por verificar contra una fuente (en Frida: el PDF oficial del museo).
3. **Entregar un informe** a Alberto en español, con propuestas numeradas.
4. **Esperar su aprobación** (él contesta p. ej. «1. Sí 2. Corrige 3. Recorta y agrega algo extra 4. Simplifica»).
5. **Aplicar:** escribir un script que genere los `findReplace` (verificando cada `find` único), enviarlos en un lote, y reescribir con `update_values` los puentes y `ANTES_DE_IR`. Revisar `occurrencesChanged = 1`.
6. **Releer una muestra**, actualizar descripciones de rutas si cambió el número de paradas, y reportar.
7. **Después**, traducir y generar audio (§10–11).
- «Algo extra» no inventa paradas nuevas: una parada nueva exige fuentes y foto de licencia abierta; se ofrece como siguiente paso.

## 20. Respaldos, pruebas y monitoreo

- **Respaldo semanal** (domingos 4 a.m. CDMX): textos de todos los idiomas al Sheet de respaldo en Drive; `.tar.gz` (textos, traducciones, imágenes, datos) a R2 `audioguias-respaldo` (últimos 8); copia de todos los MP3. No borra nada del bucket principal.
- **Revisar audios en R2:** workflow que compara manifiesto vs R2 (útil si una corrida se cortó).
- **Resumen de uso:** workflow con los eventos anónimos.
- **Verificación de cada entrega:** abrir/leer lo producido; comprobar conteos (traducciones y audios por sitio e idioma); mirar una muestra en el Sheet; revisar los pasos del workflow con `gh run view`.

## 21. Pendientes y puntos abiertos (lista honesta al 29-oct-2026)

**Contenido**
- Todos los textos siguen `verificado = FALSE`; falta revisión por especialistas o por Alberto en sitio (Chichén, TMC, Frida, otros).
- **Revisión de francés y polaco por personas nativas** (hoy son traducciones automáticas).
- Una pieza del MNA no tiene audio en francés y polaco (177 de 178 en el manifiesto, aunque su traducción existe): identificar cuál (probablemente el texto está vacío en esos idiomas o falló) y regenerar.
- **TMC:** `SITIOS.introduccion_en/_fr/_pl` están **vacías**; `RUTAS` (4 rutas: esencial, catedral, templo-mayor, completo) tiene `nombre_en` pero **vacías** `descripcion_en/_fr/_pl`, `nombre_fr` y `nombre_pl` (confirmado el 29-oct): escribirlas a mano. Faltan fotos propias y permiso INAH; confirmar en campo ubicaciones aproximadas.
- **Chichén:** 4 fotos propias (hoy copias temporales de paradas vecinas); permiso INAH; confirmaciones en sitio. Título polaco ya corregido («Północno-Zachodnia Kolumnada»).
- **Frida:** permiso del museo; reglas de fotos, tamaño de bolsas y entrada gratuita por discapacidad quedaron fuera por no verificarse; posible parada extra con fuentes y foto abierta (pendiente de decisión).
- **CONTROL → SITIOS `estado`/`notas`** de Chichén, TMC y Frida están desactualizadas (dicen que faltan audios/traducciones).
- Revisar la nota en CONTROL sobre la fila de Chapultepec (`prefijo chp_` vs ids `chap_`) y una fila suelta con `chap_`.
- Pasada de coherencia/redundancia entre sitios del Centro Histórico y TMC (TMC profundiza las paradas 27, 28, 34 y 37).

**Producto**
- Decidir cuándo apagar el modo de pruebas (`ACCESO_LIBRE = "0"`) y activar Stripe real; Términos, Privacidad, reembolsos y CFDI.
- `MUSEO_FRIDA_KAHLO` en `PAGINAS` sigue como `proximamente`; decidir.
- Textos de interfaz que prometen cosas ajenas a lo verificado («Top 10 Museos del Mundo», «Único Castillo Real en América»): Alberto debe confirmar que se puedan afirmar.
- Reembolsos que revoquen el pase (webhook) y límite de solicitudes por IP.
- La frase de «modo de prueba» en `src/i18n/languages.ts` (idiomas visibles pero sin revisión nativa).
- Rama `fotos-tmc-consultas` sin fusionar.

**SEO y medición**
- Search Console (propiedad, sitemap, indexación de páginas clave).
- Lighthouse / PageSpeed / Core Web Vitals.
- Verificar que el sitemap ya incluya fr y pl de TMC, Frida y Chichén tras el último despliegue.

**Costos**
- No se pudo leer el costo real de las corridas (logs bloqueados). Estimación de audio del 29-oct: ≈ 14 USD en total (Chichén, TMC, Frida × 4 idiomas); confirmar en Azure y Anthropic.

## 22. Errores que ya cometimos (para no repetirlos)

1. Dejar `limite` por defecto: la traducción tradujo solo 5 piezas y el audio solo 3. **Poner límite alto explícito.**
2. Lanzar varios workflows seguidos sin esperar: GitHub cancela los pendientes. **Una corrida a la vez.**
3. `findReplace` sobre la fila equivocada de CONTROL (índice de Chichén en vez de TMC). **Verificar `site_id` de la fila.**
4. Mojibake en polaco al pegar texto («caÅ\u0082y» en vez de «cały»). **Revisar acentos tras pegar.**
5. El francés de Chichén se quedó sin una pieza (`chi_39_final_memoria`) por un fallo silencioso. **Contar piezas por idioma tras cada corrida** y relanzar con `piezas=<id>`.
6. `update_values` con `valueInputOption` dio HTTP 400. **No usarlo.**
7. `gh pr create` falla por GraphQL. **Usar la API REST.**
8. Puentes que nombraban una parada que otra ruta se salta. **Redactar neutral y validar con un script sobre `rutas`.**
9. Datos que caducan dentro de los guiones. **Moverlos a ANTES_DE_IR.**
10. Fotos reutilizadas. **Una foto propia por parada.**
11. Creer que Copilot «veía» el sitio: solo miró buscadores. **Pedirle que lea el repo o usar Search Console.**
12. Un monitor que caduca (30 min) y se vuelve a avisar: es normal; volver a armarlo si aún se necesita.

## 23. Glosario rápido

- **Pieza / parada:** una entrada del recorrido (fila de PIEZAS). **Sala / zona:** agrupación (fila de SALAS).
- **Exprés / Inmersión:** guion corto / guion largo (los dos modos de audio).
- **Puente:** frase que conduce a la siguiente parada.
- **Ruta:** lista de paradas recomendada (clave en `rutas`).
- **Manifiesto:** `public/audio/manifest.json`, la lista de MP3 existentes.
- **Hash:** huella del texto; si cambia, la traducción o el audio dejan de corresponder.
- **R2 / KV / Worker / Pages:** almacenamiento de archivos / almacén clave-valor / programa pequeño de servidor / alojamiento del sitio (todos de Cloudflare).
- **Pase:** acceso temporal de 72 h a un sitio. **Código:** clave corta para activar un pase en otro dispositivo o por convenio.
- **CONTROL:** hoja maestra de sitios, combos y códigos.
- **Robot de Google:** cuenta de servicio que lee los Sheets privados desde GitHub.
- **PWA:** app web instalable que funciona sin internet.
- **TMC:** Templo Mayor y Catedral. **MNA:** Museo Nacional de Antropología. **INAH:** Instituto Nacional de Antropología e Historia.

---

### Cómo empezar una conversación nueva
Pega este mensaje: «Lee `docs/GUIA_MAESTRA.md` del repositorio `albertorabell/audioguias-mexico` (rama `main`) entero antes de empezar y respétala. Hoy quiero: …». Si el repositorio no está conectado, pide a Claude que lo agregue a la sesión. Recuerda: traducciones y audios se corren primero en modo plan, de uno en uno y con tope de gasto.
