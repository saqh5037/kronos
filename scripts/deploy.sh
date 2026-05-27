#!/usr/bin/env bash
#
# deploy.sh — deploy manual seguro de Kronos a producción (EC2 + PM2).
# Codifica la secuencia SSH del runbook con guardas + smoke + auto-rollback.
#
# Kronos NO tiene CD: este script corre desde tu máquina y hace SSH a prod.
# El host comparte PM2 con otras apps → siempre se hace `pm2 reload` NOMBRADO.
#
# Config (env vars, con defaults reales de prod):
#   KRONOS_SSH_HOST   (default dynamtek@3.239.101.100)
#   KRONOS_SSH_KEY    (default ~/Desktop/certificados/labsisapp.pem)
#   KRONOS_REMOTE_DIR (default /home/dynamtek/kronos)
#   KRONOS_PM2_APP    (default kronos)
#   KRONOS_URL        (default https://www.kronos-fit.com)
#   KRONOS_BRANCH     (default main)
#   MIGRATE=1         aplica `prisma migrate deploy` (solo si el schema cambió;
#                     por defecto el script ABORTA ante cambios de schema)
#
# Uso:  scripts/deploy.sh
#
set -euo pipefail

HOST="${KRONOS_SSH_HOST:-dynamtek@3.239.101.100}"
KEY="${KRONOS_SSH_KEY:-$HOME/Desktop/certificados/labsisapp.pem}"
DIR="${KRONOS_REMOTE_DIR:-/home/dynamtek/kronos}"
APP="${KRONOS_PM2_APP:-kronos}"
URL="${KRONOS_URL:-https://www.kronos-fit.com}"
BRANCH="${KRONOS_BRANCH:-main}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SSH=(ssh -i "${KEY}" -o ConnectTimeout=15 "${HOST}")

echo "▶ Deploy → ${HOST}:${DIR}  (pm2: ${APP}, branch: ${BRANCH})"

# 1. Preflight: SHA actual = punto de rollback + fetch del target
PREV_SHA="$("${SSH[@]}" "cd ${DIR} && git rev-parse HEAD")"
"${SSH[@]}" "cd ${DIR} && git fetch origin ${BRANCH} -q"
TARGET_SHA="$("${SSH[@]}" "cd ${DIR} && git rev-parse origin/${BRANCH}")"
echo "  rollback point: ${PREV_SHA}"

if [ "${PREV_SHA}" = "${TARGET_SHA}" ]; then
  echo "  prod ya está en ${TARGET_SHA}, nada que desplegar."
  exit 0
fi
echo "  desplegando ${PREV_SHA} → ${TARGET_SHA}"

# 2. Guarda de schema: NO migrar prod automáticamente
if "${SSH[@]}" "cd ${DIR} && git diff --name-only ${PREV_SHA} ${TARGET_SHA} | grep -q '^prisma/schema.prisma$'"; then
  if [ "${MIGRATE:-0}" != "1" ]; then
    echo "🛑 prisma/schema.prisma cambió entre ${PREV_SHA} y ${TARGET_SHA}."
    echo "   Este script NO migra prod por sí solo. Revisa la migración, haz backup,"
    echo "   y re-corre con MIGRATE=1 si estás seguro."
    exit 2
  fi
  echo "  ⚠ MIGRATE=1 — se correrá 'prisma migrate deploy' tras el build."
fi

MIGRATE_CMD=""
[ "${MIGRATE:-0}" = "1" ] && MIGRATE_CMD="pnpm prisma migrate deploy && "

# 3. Deploy (aborta si el build falla → prod sigue con el build viejo en memoria)
"${SSH[@]}" "set -e; cd ${DIR} && git merge --ff-only origin/${BRANCH} && pnpm install --frozen-lockfile && pnpm build && ${MIGRATE_CMD}pm2 reload ${APP}"
echo "  build + reload OK"

# 4. Smoke post-deploy → auto-rollback si falla
echo "▶ Smoke post-deploy contra ${URL}"
if bash "${SCRIPT_DIR}/smoke.sh" "${URL}"; then
  echo "✅ Deploy OK → ${TARGET_SHA}"
else
  echo "🛑 Smoke FALLÓ — auto-rollback a ${PREV_SHA}"
  "${SSH[@]}" "set -e; cd ${DIR} && git reset --hard ${PREV_SHA} && pnpm install --frozen-lockfile && pnpm build && pm2 reload ${APP}"
  echo "↩ Rollback aplicado. Re-smoke:"
  bash "${SCRIPT_DIR}/smoke.sh" "${URL}" || echo "⚠ smoke sigue fallando tras rollback — revisar manualmente en el host."
  exit 1
fi
