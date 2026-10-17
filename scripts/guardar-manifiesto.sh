#!/usr/bin/env bash
# Guarda public/audio/manifest.json en el repositorio aunque otra corrida lo haya cambiado mientras tanto:
# en vez de "rebase" (que se atoraba), baja la versión más nueva, le junta lo mío y vuelve a intentar si alguien se adelantó.
# Uso: bash scripts/guardar-manifiesto.sh "mensaje del commit" [archivo_quitar.json]
set -euo pipefail
MSG="$1"; QUITAR="${2:-}"
RAMA="${GITHUB_REF_NAME:-main}"
MIO="$(mktemp)"
cp public/audio/manifest.json "$MIO"
git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
for intento in 1 2 3 4 5; do
  git fetch origin "$RAMA"
  git reset --hard "origin/$RAMA"
  if [ "${SOLO_MIO:-}" = "1" ]; then cp "$MIO" public/audio/manifest.json; else node scripts/unir-manifiesto.mjs "$MIO" "$QUITAR"; fi
  git add public/audio/manifest.json
  if git diff --cached --quiet; then echo "No hay nada nuevo que guardar."; exit 0; fi
  git commit -m "$MSG"
  if git push origin "HEAD:$RAMA"; then echo "Lista guardada (intento $intento)."; exit 0; fi
  echo "Alguien se adelantó; reintento ($intento)…"; sleep $((intento * 4))
done
echo "::error::No se pudo guardar la lista de audios después de 5 intentos."; exit 1
