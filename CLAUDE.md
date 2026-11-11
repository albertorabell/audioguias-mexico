# Instrucciones para Claude en este repositorio (Xolotli)

## Regla permanente: documentar
- Cada vez que se haga algo nuevo (función, pantalla, script, automatización, idioma, sitio), **documentarlo bien** en el mismo Pull Request.
- Si el cambio afecta cómo se usa o se entiende el proyecto, **actualizar `README.md`** y el documento que corresponda:
  - `docs/ARQUITECTURA.md` → código, datos, idiomas.
  - `docs/AUTOMATIZACIONES.md` → workflows y scripts (cuándo corren, secretos).
  - `docs/NUEVO_SITIO.md` → alta de sitios.
- Todo archivo nuevo lleva un comentario de encabezado en español sencillo: qué hace y cómo se usa.

## Contexto
- Alberto no es programador: explicar en español, con pasos simples.
- Los textos viven en Google Sheets; nunca guardar textos de pago ni secretos en el repositorio.
- No inventar información; lo no verificado se marca como duda.
- Cambios de código por Pull Request; `main` se publica solo en xolotli.com. No mezclar temas en un mismo PR.
- Antes de borrar algo: reportar y esperar aprobación.
- Pruebas: `npm test` y `npm run lint`.
