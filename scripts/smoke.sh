#!/usr/bin/env bash
#
# smoke.sh — verificación post-deploy de Kronos.
# Chequea que /api/health responda 200 + status:"ok" y que las rutas públicas
# clave devuelvan 200. Exit ≠ 0 si algo falla (lo usa deploy.sh para gatear
# el rollback automático).
#
# Uso:
#   scripts/smoke.sh [BASE_URL]
#   KRONOS_URL=https://www.kronos-fit.com scripts/smoke.sh
#   scripts/smoke.sh http://localhost:3000
#
set -euo pipefail

BASE_URL="${1:-${KRONOS_URL:-https://www.kronos-fit.com}}"
TIMEOUT="${SMOKE_TIMEOUT:-15}"
fail=0

echo "▶ Smoke: ${BASE_URL}"

# Health: exige 200 + body con "status":"ok"
hcode="$(curl -s -o /dev/null -w '%{http_code}' -m "${TIMEOUT}" "${BASE_URL}/api/health" || echo 000)"
hbody="$(curl -s -m "${TIMEOUT}" "${BASE_URL}/api/health" || echo '')"
if [ "${hcode}" = "200" ] && printf '%s' "${hbody}" | grep -q '"status":"ok"'; then
  echo "  OK   200  /api/health (status:ok)"
else
  echo "  FAIL ${hcode}  /api/health → ${hbody}"
  fail=1
fi

# Rutas públicas: solo código HTTP
check() {
  local path="$1" expected="${2:-200}" code
  code="$(curl -s -o /dev/null -w '%{http_code}' -m "${TIMEOUT}" "${BASE_URL}${path}" || echo 000)"
  if [ "${code}" = "${expected}" ]; then
    echo "  OK   ${code}  ${path}"
  else
    echo "  FAIL ${code} (esperaba ${expected})  ${path}"
    fail=1
  fi
}

check "/"
check "/atletas"
check "/login"

if [ "${fail}" -ne 0 ]; then
  echo "❌ smoke FAILED"
  exit 1
fi
echo "✅ smoke OK"
