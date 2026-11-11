# Xolotli · audioguías de México

Xolotli (**xolotli.com**) es una audioguía en el teléfono para museos y zonas arqueológicas de México. Se abre desde el navegador (sin tienda de apps), se puede instalar en la pantalla de inicio y funciona sin internet una vez descargado el recorrido.

Idiomas publicados: **es, en, fr, pl, de, pt, it**. Japonés, chino y coreano se traducen poco a poco y aún no están activos.

> Este archivo es la puerta de entrada. El detalle está en:
> - [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md): cómo está armado el código y por dónde viajan los datos.
> - [`docs/AUTOMATIZACIONES.md`](docs/AUTOMATIZACIONES.md): los 15 botones y tareas automáticas de GitHub.
> - [`docs/NUEVO_SITIO.md`](docs/NUEVO_SITIO.md): cómo se agrega un sitio nuevo.
> - [`docs/GUIA_DE_ESTILO_guiones.md`](docs/GUIA_DE_ESTILO_guiones.md): cómo se escriben los guiones.
> - [`docs/IDIOMA_MP3_COBRO.md`](docs/IDIOMA_MP3_COBRO.md): idiomas, MP3 y servidor de cobro.
> - [`pagos/README.md`](pagos/README.md): el servidor de cobro.

## Cómo funciona, en cinco líneas

1. **Los textos viven en Google Sheets** (hoja CONTROL y una hoja por sitio). Ahí se edita; el Sheets es la verdad.
2. Al publicar, `npm run build` lee los Sheets y genera los archivos de datos (`public/data/…`).
3. La app (React + Vite) se compila y se sube a **Cloudflare Pages** (proyecto `audioguias`).
4. Los **audios MP3** se generan con voz sintética y viven en **Cloudflare R2** (carpetas `libre/` y `pago/`).
5. Los **pagos y pases** los maneja un Cloudflare Worker aparte (carpeta `pagos/`, con Stripe).

## Cómo se publica

- Todo cambio que entra a la rama `main` se publica solo en xolotli.com (workflow «Publicar la app en Cloudflare Pages»).
- Una rama `feature/**` genera una dirección de prueba (`https://<rama>.audioguias.pages.dev`) que no toca el sitio real.
- Cambios de código se hacen con Pull Request. Los textos se cambian en el Sheets y se publican corriendo el workflow de publicar sobre `main`.

## Correr en tu computadora (opcional)

Necesitas Node 20 o más nuevo.

```bash
npm install
npm run dev        # abre la app en http://localhost:3000
npm test           # pruebas de scripts y del servidor de cobro
npm run lint       # revisa tipos (TypeScript)
npm run build      # build completo (necesita credenciales de Google para leer los Sheets)
```

Los secretos (claves de Google, Cloudflare, Stripe, voces) **nunca** van en el repositorio: viven en *Settings → Secrets* de GitHub y en Cloudflare.

## Mapa de carpetas

| Carpeta | Qué hay |
|---|---|
| `src/` | La app (React): pantallas, textos de interfaz por idioma, utilidades. |
| `public/` | Archivos que se publican tal cual: datos, imágenes, planos, íconos, mapas, manifiesto de audios. |
| `scripts/` | Programas de Node/Python que usan las automatizaciones (sincronizar, traducir, audios, respaldo…). |
| `scripts/tests/` | Pruebas de esos programas. |
| `pagos/` | Cloudflare Worker de cobro (Stripe, pases, códigos). |
| `e2e/` | Pruebas de navegador (Playwright). |
| `traducciones/` | Traducciones generadas por idioma. |
| `glosario/` | Nombres propios y pronunciaciones para traducción y voz. |
| `datos-fotos/` | Listas de fotos (con licencia y crédito) por sitio. |
| `docs/` | Documentación. |
| `.github/workflows/` | Las 15 automatizaciones. |

## Reglas del proyecto

- **Cada vez que se haga algo nuevo se documenta**, y si hace falta se actualiza este README (ver `CLAUDE.md`).
- No se inventa información: lo no verificado se marca como duda.
- Fotos solo con licencia abierta (dominio público, CC0, CC BY, CC BY-SA) y con crédito.
- Los textos de pago no se guardan en el repositorio público.
- El uso de Claude se reinicia los domingos a las 5:00 (hora de CDMX); el trabajo largo programado se hace antes de esa hora.
