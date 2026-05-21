# Brief visual para Kimi — Wearables (Whoop) UI

**Branch base**: `feat/wearables-whoop` (backend listo, A→E commiteado)
**Tu branch sugerida**: `feat/wearables-whoop-ui` (desde la base mía)
**Lane**: solo `src/app/atleta/**`, `src/app/admin/atletas/**` y `src/components/**`.

Yo (Claude) NO toco CSS ni JSX visual. Tú (Kimi) NO tocás server actions ni schema.

## 1. Server actions ya disponibles

Todas en `@/server/actions/wearables`. Tipados estrictos.

```ts
// Lista de wearables conectados del atleta logueado
getMyWearableConnections(): Promise<WearableSummary[]>

// Recovery del día más reciente (para card en /atleta home)
getMyLatestRecovery(): Promise<RecoverySnapshot | null>

// Sync manual desde la UI (botón "Sincronizar ahora")
triggerManualSync(provider: WearableProvider): Promise<SyncTrigger>

// Desconectar (botón "Desconectar Whoop")
disconnectWearable(provider: WearableProvider): Promise<{ ok: true }>

// Toggle opt-in compartir con coach
toggleShareWithCoach(value: boolean): Promise<void>

// Admin/coach view (solo si athlete optó in)
getAthleteWhoopOverview(athleteId, range: { from, to }):
  Promise<WhoopOverview | WhoopOverviewBlocked | null>
```

### Tipos exportados

```ts
type WearableSummary = {
  id: string;
  provider: "WHOOP" | "GARMIN" | "APPLE_HEALTH" | "OURA";
  status: "CONNECTED" | "REVOKED" | "ERROR" | "RECONNECT_REQUIRED";
  scopes: string[];
  externalUserId: string;
  expiresAt: Date;
  lastSyncedAt: Date | null;
  lastErrorAt: Date | null;
  lastErrorMessage: string | null;
  createdAt: Date;
};

type RecoverySnapshot = {
  recoveredAt: Date;
  score: number | null; // 0–100
  hrvRmssd: number | null; // ms
  restingHr: number | null; // bpm
  spo2: number | null; // %
  band: "GREEN" | "YELLOW" | "RED" | "UNSCORED";
};

type SyncTrigger = {
  ok: boolean;
  message: string;
  counts?: { cycles; recoveries; sleeps; workouts; linkedScores: number };
};
```

## 2. Pantallas a construir

### 2.1. `/atleta/dispositivos` — NUEVA ruta

Container: `src/app/atleta/dispositivos/page.tsx` (Server Component).
Data: `const conns = await getMyWearableConnections()`.

**3 estados por cada provider (por ahora solo WHOOP):**

| Estado         | Cuándo                                        | UX                                                                                                                                                                                                                                |
| -------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `disconnected` | No hay row en `WearableConnection`            | Card con logo Whoop, copy "Conectá tu Whoop para ver recovery/sleep en Kronos", CTA → `<a href="/api/wearables/whoop/connect">` (es un GET, así arranca OAuth server-side)                                                        |
| `connected`    | `status === "CONNECTED"`                      | Card con badge verde "Conectado", `externalUserId`, `lastSyncedAt` formateado "hace X", botones "Sincronizar ahora" (calls `triggerManualSync`) y "Desconectar" (calls `disconnectWearable`, requiere confirm con `useConfirm()`) |
| `error`        | `status === "RECONNECT_REQUIRED"` o `"ERROR"` | Card con banner lima neon `#C8FF2D` "Reconectá tu Whoop", CTA reconnect → mismo endpoint de connect                                                                                                                               |

Layout: lista vertical de cards (un solo provider por ahora, pero diseñar para N). Anchor en `?connected=whoop` para mostrar toast "Whoop conectado ✓" después del OAuth redirect.

### 2.2. `<RecoveryCard>` en `/atleta` home

Componente client (`"use client"`) o server. Server preferido — `await getMyLatestRecovery()`.

**Reglas:**

- Si retorna `null` → **NO renderizar nada** (no banner pidiendo conectar, evitar nag).
- Si `band === "GREEN"` → card lima `#C8FF2D` con score grande, copy "Recovery sólido — listo para sesión exigente".
- Si `band === "YELLOW"` → mismo card con opacidad reducida (no cambiar color, monocromático V3), copy "Dosificá — recovery moderado".
- Si `band === "RED"` → border lima sutil, score en lima opacidad 0.4, copy "Sesión ligera o recovery hoy".
- Si `band === "UNSCORED"` → skeleton hasta que llegue el score.

Mostrar también: HRV, RHR, SpO2 en sub-línea pequeña con tokens `--k-t2`. Timestamp "recovered: hace Xh" usar `formatDistanceToNow` de `date-fns`.

**Regla hydration** (ver `CLAUDE.md` proyecto): si el card calcula "hace X" en cliente, hacelo via `useEffect` + `useState`, NO en render directo del component. Pasar `recoveredAt: Date` desde server, calcular distancia en cliente.

### 2.3. Pre-WOD nudge en `/atleta/wod/[id]`

Mini banner sobre el WOD detail si `band === "RED"`. Copy: "Tu cuerpo te pide intensidad moderada hoy". Color: lima `#C8FF2D` opacidad 0.3, border `var(--k-accent-line)`. NO dismissable (apenas referencia, no bloquea).

### 2.4. `/atleta/ajustes` — toggle opt-in

Toggle "Compartir mis datos de Whoop con mis coaches". Estado inicial del atleta: `Athlete.shareWearableWithCoach`. Acción: `await toggleShareWithCoach(true|false)`. Copy debajo: "Tus coaches solo verán strain/recovery/sleep si activás esto. Por defecto está apagado."

### 2.5. `/admin/atletas/[id]` — tab "Wearables"

Solo visible para roles OWNER, COACH, STAFF (el server action ya filtra).

Container: `src/app/admin/atletas/[id]/wearables/page.tsx` o tab dentro del detail.

Data: `const overview = await getAthleteWhoopOverview(athleteId, { from, to })` con range default últimos 30 días.

**3 estados:**

| Estado                                     | Condición                            | UX                                                                                                                                                                                       |
| ------------------------------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `null`                                     | rol no autorizado o atleta no existe | 404 / hidden                                                                                                                                                                             |
| `{ shared: false }`                        | atleta no optó in                    | Empty state "Esta atleta no está compartiendo sus datos de wearable. Pedile que active el toggle en sus ajustes."                                                                        |
| `{ shared: true, points, latestRecovery }` | datos disponibles                    | Sparkline 30d de `recovery` (lima monocromático con opacidad por intensidad — ver `CLAUDE.md` pattern V3), card actual con `latestRecovery`, chips con avg de strain y sleep performance |

## 3. Reglas duras de Kronos (recordatorio)

- **NO `window.confirm()` ni `window.alert()`** — usar `useConfirm()` de `@/lib/use-confirm`.
- **NO hex hardcoded `#19f08b`, `#3aa3ff`, `#1a3457`** — solo `--k-*` y `#c8ff2d`.
- **NO calcular `new Date()` en client render** — `useEffect` + `useState`.
- **NO mezclar mockup data — todo desde server actions.**
- **`/visual-iterate` al cerrar** (gate del harness).

## 4. Lo que YA está cableado (no construir)

- Backend OAuth, callback, webhook, cron, sync, refresh ✓
- Tokens cifrados AES-256-GCM ✓
- Auditoría + analytics ✓
- Tests unit cubriendo crypto, state, client, sync mapping, paginate, webhook (66+ specs)

## 5. Lo que NO está en este sprint

- Garmin nativo (próximo)
- Apple Watch (requiere app móvil)
- Visualizaciones avanzadas (HRV trends, comparativas) — primer pass solo recovery + strain + sleep daily

## 6. Para arrancar (Kimi)

```bash
git fetch
git checkout feat/wearables-whoop
git checkout -b feat/wearables-whoop-ui
# Ya tenés todo el backend listo. Empezar por /atleta/dispositivos.
# Si algo del server action no aporta lo que necesitás (ej falta un dato),
# pingueame en el branch — extiendo el action sin pisarte la UI.
```

Cualquier duda de los tipos o estados, este archivo es la fuente. Si encontrás
inconsistencias, ABRÍ un issue/comentario antes de improvisar.
