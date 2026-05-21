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

## Deuda post-merge (tickets pendientes)

Items detectados en review pre-merge (security-guard + code-reviewer 2026-05-20).
Aceptados como deuda acotada porque hoy solo existe el proveedor `WHOOP`
en producción y los riesgos solo materializan cuando se agreguen más
proveedores o cuando los volúmenes superen los umbrales actuales.

1. **Unique constraint multi-provider en tablas Whoop.** `WhoopCycle/Recovery/Sleep/Workout.externalId` es `@unique` global. Si entra Garmin/Oura/AppleHealth con IDs numéricos colisionables, los upserts pisan data cross-provider. Acción: migrar a `@@unique([provider, externalId])` con columna `provider` agregada. Requiere migración Prisma + backfill.
2. **Unique constraint por athlete en tablas Whoop.** Caso edge: atleta cambia de Box manteniendo el mismo Whoop account. El `externalId` global hace que el row quede con `tenantId/athleteId` del primer Box. Acción: incluir en la migración del punto 1 → `@@unique([athleteId, externalId])`.
3. **Idempotencia por `event.id` en webhook.** Whoop puede reentregar eventos. Hoy se procesa 2× (fetch upstream duplicado, audit log duplicado). Upserts son idempotentes por record, así que no hay corrupción, solo ruido + rate. Acción: pre-check `WebhookEvent` por `(source, externalId)` o catch P2002 con unique parcial.
4. **Concurrencia + timeout per-connection en cron.** `maxDuration=300s` con loop secuencial. Si una connection cuelga, mata el batch. Acción: `Promise.allSettled` con concurrency 5–10 + `AbortSignal.timeout(30_000)` en `whoop-client.getJson`.
5. **Rate limit en backfill inicial.** `runInitialBackfill` dispara 4 paginaciones en paralelo (`Promise.all`). Documentar límites de Whoop o secuenciar.
6. **Timezone en `getAthleteWhoopOverview` buckets diarios.** Hoy bucketea en UTC con `toISOString().slice(0,10)`. Para Boxes en zonas !=UTC los buckets cortan a destiempo. Acción: usar `box.timezone` para el slice.
7. **Retención de `WebhookEvent.rawPayload`.** Guarda el JSON crudo de Whoop indefinidamente (contiene `user_id` upstream). Acción: job de purge a 90 días.
8. **Rotación de `WEARABLES_TOKEN_ENCRYPTION_KEY`.** No hay path para re-cifrar tokens con key nueva. Documentar el procedimiento (probable: forzar `RECONNECT_REQUIRED` masivo + key bump).
9. **Tests faltantes.** OAuth flow integration (connect → callback → backfill), `ensureFreshToken` reconnect branch, `syncConnection` orquestador, cron endpoint, webhook route handler completo. Los tests puros (token-vault, state, mapping, HMAC, paginate) están sólidos.
