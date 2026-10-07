#!/usr/bin/env bash
# Arma las opciones de scripts/generar-audio.mjs a partir de variables de entorno.
# Lo usa el botón de GitHub "Generar audios MP3" y también la revisión automática (con la voz de prueba).
# Variables: IDIOMAS (es,en) · PIEZAS (gratis|premium|todas) · PROVEEDOR (azure|openai|prueba)
#            LIMITE (número o vacío) · GENERAR (true = generar de verdad) · FORZAR (true = regenerar todo)
#            REUBICAR (true = solo mover en R2 entre libre/ y pago/ lo que cambió de tipo)
set -euo pipefail
args=(--lang "${IDIOMAS:-es}" --solo "${PIEZAS:-gratis}" --proveedor "${PROVEEDOR:-azure}")
if [ -n "${LIMITE:-}" ]; then args+=(--limite "$LIMITE"); fi
if [ "${FORZAR:-false}" = "true" ]; then args+=(--forzar); fi
if [ "${GENERAR:-false}" = "true" ]; then args+=(--generar); fi
if [ "${REUBICAR:-false}" = "true" ]; then args+=(--reubicar); fi
exec node scripts/generar-audio.mjs "${args[@]}"
