# Wearables — Whoop integration

Branch: `feat/wearables-whoop`
Status: Fase A → G (en curso)

## Env vars nuevas (agregar a `.env.example`, `.env.local`, y al `.env` de QA/prod)

```bash
# ─── Wearables: Whoop integration ────────────────────────────────────────────
WHOOP_CLIENT_ID=
WHOOP_CLIENT_SECRET=
WHOOP_REDIRECT_URI=http://localhost:3000/api/wearables/whoop/callback
WHOOP_WEBHOOK_SECRET=
WHOOP_STATE_SECRET=                  # 32 bytes hex. Genera: openssl rand -hex 32
WEARABLES_TOKEN_ENCRYPTION_KEY=      # 32 bytes base64. Genera: openssl rand -base64 32
```

En prod (`kronos-fit.com`):

```bash
WHOOP_REDIRECT_URI=https://kronos-fit.com/api/wearables/whoop/callback
```

## Registro de app en Whoop Developer Dashboard

Samuel (humano blocker):

1. Crear cuenta en https://developer-dashboard.whoop.com
2. New App con:
   - Name: `Kronos`
   - Description: `SaaS multi-tenant para CrossFit. Integra recovery/strain/sleep del atleta para dosificación y monitoreo coach-atleta opt-in.`
   - Redirect URIs: agregar las dos (localhost dev + kronos-fit.com prod)
   - Scopes:
     - `offline` — para refresh tokens
     - `read:recovery`
     - `read:cycles`
     - `read:sleep`
     - `read:workout`
     - `read:profile`
     - `read:body_measurement`
   - Webhook URL (prod): `https://kronos-fit.com/api/webhooks/whoop`
   - Privacy URL: `https://kronos-fit.com/legal/privacidad` (actualizar copy antes de aprobar)
3. Aprobación: 1–3 días hábiles.
4. Copiar `client_id` + `client_secret` al `.env.local` (dev) y al `.env` de prod.

## Arquitectura local

- `src/lib/crypto/token-vault.ts` — encrypt/decrypt AES-256-GCM (tokens at-rest)
- `src/lib/wearables/whoop-client.ts` — fetcher tipado contra Whoop API v2
- `src/lib/wearables/whoop-sync.ts` — initial backfill 30d + linking Score↔WhoopWorkout
- `src/server/actions/wearables.ts` — server actions del atleta y coach
- `src/app/api/wearables/whoop/connect/route.ts` — GET: redirect a Whoop OAuth
- `src/app/api/wearables/whoop/callback/route.ts` — GET: intercambia code, upsert WearableConnection
- `src/app/api/webhooks/whoop/route.ts` — POST: handler con signature HMAC
- `src/app/api/cron/wearables-sync/route.ts` — backstop hourly

## Modelos Prisma (ya aplicados en BD dev — `pnpm db:push` corrido OK)

- `WearableConnection` — tokens cifrados, status, scopes, lastSyncedAt
- `WhoopCycle` — strain diario, kJ, avg/max HR
- `WhoopRecovery` — score 0–100, HRV, RHR, SpO2
- `WhoopSleep` — duration, performance, efficiency
- `WhoopWorkout` — strain, HR zones, link opcional a `Score` por overlap temporal
- Campo `Athlete.shareWearableWithCoach Boolean @default(false)` — opt-in privacy
- Enum `WearableProvider { WHOOP GARMIN APPLE_HEALTH OURA }`
- Enum `WearableStatus { CONNECTED REVOKED ERROR RECONNECT_REQUIRED }`

## Lane discipline

- Claude Code: schema, server actions, OAuth handlers, webhook, cron, libs, tests.
- Kimi: UI de `/atleta/dispositivos`, `<RecoveryCard>` en home, sparkline en `/admin/atletas/[id]/wearables`. Brief: `KIMI_VISUAL_BRIEF_WEARABLES.md` al cerrar Fase E.
