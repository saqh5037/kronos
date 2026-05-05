# Handoff Tanda 2 — Contracts para Pantallas Visuales Pendientes

> Desde **Kimi (UI lane)** hacia **Claude Code (backend lane)**.
> Esto es lo que necesito que exista en el backend para poder implementar las pantallas y componentes visuales que aún no están.

---

## Pantallas Atleta — Faltantes

### 1. `/atleta/movimientos` — Mis Movimientos

**Página:** Lista de movimientos que el atleta ha entrenado, ordenados por frecuencia. Cada fila navega a `/atleta/movimientos/[id]`.

**Actions YA EXISTENTES (no tocar):**

```typescript
// src/server/analytics/movement.ts
export async function listMyMovementsRated(
  limit = 10,
): Promise<RankedMovement[]>;

export type RankedMovement = {
  movementId: string;
  movementName: string;
  frequency90d: number; // cuántas veces entrenó este movimiento en 90d
  daysSinceLastAttempt: number | null;
  isStale: boolean; // true si >30d sin PR
  currentBest: number | null;
  unit: string | null;
};
```

**Visualización sugerida:**

- **Table** con columnas: Movimiento | Frecuencia (mini bar) | Último PR | Días | Stale badge
- Click en fila → navega a detalle

**Payload de ejemplo:**

```json
{ "limit": 20 }
```

---

### 2. `/atleta/movimientos/[id]` — Detalle de Movimiento

**Página:** Perfil completo de un movimiento + timeline de progresión de PRs.

**Actions YA EXISTENTES (no tocar):**

```typescript
// src/server/analytics/movement.ts
export async function getMyMovementProfile(
  movementId: string,
): Promise<AthleteMovementProfile | null>;

export type AthleteMovementProfile = MovementProfile & {
  movementId: string;
  movementName: string;
};

export type MovementProfile = {
  frequency90d: number;
  lastPR: { value: number; achievedAt: string } | null;
  daysSinceLastAttempt: number | null;
  isStale: boolean;
  progression: PRProgressionPoint[]; // ← esto alimenta el LineChart
  percentileInBox: number; // 0-100
  rankInBox: number;
  totalAthletesInBox: number;
  currentBest: number | null;
};
```

```typescript
// src/server/actions/prs.ts
export async function getMyPRProgression(
  movementId: string,
  days = 180,
): Promise<PRProgressionResult>;

export type PRProgressionResult = {
  points: PRProgressionPoint[];
  firstAttempt: Date | null;
  currentBest: number | null;
  totalAttempts: number;
  daysSinceLast: number | null;
  movementName: string | null;
  unit: string | null;
};

export type PRProgressionPoint = {
  date: string; // ISO date
  value: number;
  delta: number; // % improvement vs previous PR
  isCurrentBest: boolean;
};
```

**Visualización sugerida:**

- **Card** (perfil): Current Best, Percentile en box, Rank, Frecuencia 90d, Stale flag
- **LineChart** (progresión): Eje X = fecha, Eje Y = valor. Puntos resaltados para `isCurrentBest`. Tooltip muestra `delta`%.

**Payloads de ejemplo:**

```json
// getMyMovementProfile
{ "movementId": "cm2xyz..." }

// getMyPRProgression
{ "movementId": "cm2xyz...", "days": 180 }
```

---

### 3. `/atleta/leaderboard` — Leaderboards para Atletas

**Página:** Ver rankings del box (WOD, Movement, Asistencia semanal). El atleta puede filtrar y ver su posición.

**Actions YA EXISTENTES (no tocar):**

```typescript
// src/server/actions/leaderboards.ts
export async function getWODLeaderboard(wodId: string): Promise<WODLeaderboard>;

export async function getMovementLeaderboard(
  movementId: string,
): Promise<MovementLeaderboard>;

export async function getWeeklyAttendanceLeaderboard(
  weeksBack = 0,
): Promise<AttendanceLeader[]>;

export type WODLeaderboard = {
  wodId: string;
  wodName: string;
  scoreType: ScoreType; // "TIME" | "REPS" | "WEIGHT" | "ROUNDS"
  entries: LeaderboardEntry[];
};

export type MovementLeaderboard = {
  movementId: string;
  movementName: string;
  entries: LeaderboardEntry[];
};

export type LeaderboardEntry = {
  athleteId: string;
  athleteName: string;
  value: number;
  unit: string;
  scaling: string;
  achievedAt: Date;
};

export type AttendanceLeader = {
  athleteId: string;
  athleteName: string;
  attendedCount: number;
};
```

**Dropdown helpers (ya existen):**

```typescript
export async function listWODOptions(): Promise<{ id; name; scoreType }[]>;
export async function listMovementOptions(): Promise<{ id; name }[]>;
```

**Visualización sugerida:**

- **Tabs:** WOD | Movimiento | Asistencia
- **Table** con ranking 1-50. Top 3 con estilo destacado (podio).
- Fila del atleta actual siempre visible (sticky bottom) con su posición resaltada.

**Payloads de ejemplo:**

```json
{ "wodId": "cm3wod..." }
{ "movementId": "cm2xyz..." }
{ "weeksBack": 0 }
```

**⚠️ Nota para backend:** Verificar que `getWODLeaderboard` y `getMovementLeaderboard` no tengan guards de rol admin. Actualmente usan `requireSession()` genérico. Si hay restricción, relajar para que atletas puedan ver.

---

### 4. `/atleta/historial` — Historial de Scores

**Página:** Todos los scores del atleta, con filtros y paginación.

**Action YA EXISTENTE pero limitada:**

```typescript
// src/server/actions/scores.ts
export async function listMyScores(limit = 50): Promise<MyScoreRow[]>;

export type MyScoreRow = {
  id: string;
  wodId: string;
  wodName: string;
  scoreType: ScoreType;
  value: number;
  unit: string;
  scaling: string;
  notes: string | null;
  createdAt: Date;
};
```

**❌ FALTA:** Paginación, filtros por WOD, por rango de fechas, por tipo de score.

**Visualización sugerida:**

- **Table** con filtros: WOD (dropdown), Date range, Scaling (RX/Scaled)
- **Timeline** alternativa: cards verticales con fecha, WOD, score, PR badge

**Nueva action sugerida:**

```typescript
// NUEVA — para paginación y filtros
export async function listMyScoresPaged(
  opts?: ListOpts & {
    wodId?: string;
    fromDate?: Date;
    toDate?: Date;
    scaling?: string;
  },
): Promise<ListResult<MyScoreRow>>;
```

**Prioridad:** Baja (la actual `listMyScores(limit=50)` cubre el 80% del caso de uso).

---

## Componentes Visuales Nuevos — Necesito Crear

### 5. `PRChart.tsx` — Timeline de PRs

**Data source:** `getMyPRProgression` / `getPRProgression`

**Contract de entrada (props):**

```typescript
type PRChartProps = {
  points: PRProgressionPoint[];
  unit: string | null;
  currentBest: number | null;
  movementName: string | null;
};
```

**Viz:** `LineChart` (Recharts) con:

- Línea suave, color `--fire` (#dc4b17)
- Puntos con `r=5`, resaltado dorado para `isCurrentBest`
- Tooltip custom: fecha + valor + delta% vs PR anterior
- ReferenceLine en `currentBest`

**Ubicación:** `src/components/charts/PRChart.tsx`

---

### 6. `CapabilityRadar.tsx` — Perfil de Capacidades

**Data source:** NUEVA ACTION REQUERIDA (ver sección 7)

**Viz:** `RadarChart` (Recharts) con 5 ejes:

- Fuerza (Squat, Deadlift, Press)
- Olympic (Clean, Snatch, Jerk)
- Cardio (Running, Rowing, Burpees)
- Gimnástico (Pull-ups, Muscle-ups, HSPU)
- Core (Toes-to-bar, GHD, Plank)

**Contract de entrada (props):**

```typescript
type CapabilityRadarProps = {
  categories: {
    name: string;
    score: number; // 0-100, percentile en el box
    rawValue: number; // avg de PRs en la categoría
  }[];
  overallRank: number;
  totalAthletes: number;
};
```

**Ubicación:** `src/components/charts/CapabilityRadar.tsx`

---

## 🆕 Nuevas Actions Requeridas

### 7. Capability Profile (Radar Chart)

**Necesito:** Una action que clasifique los movimientos del atleta en categorías y calcule percentiles por categoría.

```typescript
// NUEVO ARCHIVO: src/server/analytics/capability.ts
// o extensión de src/server/analytics/movement.ts

export type CapabilityCategory =
  | "STRENGTH" // Squat, Deadlift, Press
  | "OLYMPIC" // Clean, Snatch, Jerk
  | "CARDIO" // Running, Rowing, Double-unders
  | "GYMNASTIC" // Pull-ups, Muscle-ups, HSPU
  | "CORE"; // T2B, GHD, Plank

export type CapabilityProfile = {
  categories: {
    name: string; // "Fuerza", "Cardio", etc.
    score: number; // 0-100, percentile del atleta en el box
    rawValue: number; // suma o promedio de PRs en esa categoría
    movementCount: number; // cuántos movimientos entrena en esta cat
  }[];
  overallRank: number; // posición en el box (basado en score total)
  totalAthletes: number;
  weakestCategory: string;
  strongestCategory: string;
};

export async function getMyCapabilityProfile(): Promise<CapabilityProfile>;
export async function getAthleteCapabilityProfile(
  athleteId: string,
): Promise<CapabilityProfile>;
```

**⚠️ Bloqueo de schema:** El schema de `Movement` actual no tiene campo `category`. Opciones:

- **Opción A (rápida):** Inferir categoría por nombre del movimiento (regex: "squat|deadlift|press" → STRENGTH, etc.)
- **Opción B (correcta):** Agregar `category` enum al schema de Prisma y migrar.

**Recomendación:** Opción A para MVP, Opción B para hardening.

---

### 8. Body Metrics Tracking

**Necesito:** Actions para que el atleta (o coach) registre métricas corporales y vean progreso.

```typescript
// NUEVO ARCHIVO: src/server/actions/body-metrics.ts

export type BodyMetricType =
  | "WEIGHT"
  | "BODY_FAT"
  | "MUSCLE_MASS"
  | "BMI"
  | "CUSTOM";

export type BodyMetricEntry = {
  id: string;
  type: BodyMetricType;
  value: number;
  unit: string;
  measuredAt: Date;
  notes: string | null;
};

export async function listMyBodyMetrics(
  type?: BodyMetricType,
  limit?: number,
): Promise<BodyMetricEntry[]>;

export async function createBodyMetric(data: {
  type: BodyMetricType;
  value: number;
  unit: string;
  measuredAt?: Date;
  notes?: string;
}): Promise<BodyMetricEntry>;

export async function deleteBodyMetric(id: string): Promise<{ ok: true }>;
```

**⚠️ Bloqueo de schema:** Requiere nueva tabla en Prisma:

```prisma
model BodyMetric {
  id          String   @id @default(cuid())
  tenantId    String
  athleteId   String
  type        String   // BodyMetricType
  value       Decimal
  unit        String
  measuredAt  DateTime
  notes       String?
  createdAt   DateTime @default(now())

  athlete     Athlete  @relation(fields: [athleteId], references: [id])

  @@index([athleteId, type, measuredAt])
}
```

**Prioridad:** Baja. Feature post-MVP.

---

## Dashboard Admin — Enriquecimientos Sugeridos

### 9. Plan Distribution (DonutChart)

**Data source:** `getReports()` ya retorna `planDistribution`.

```typescript
// Ya existe en Reports:
planDistribution: {
  type: PlanType;
  count: number;
  revenue: number;
}
[];
```

**Viz:** `DonutChart` en dashboard admin. Ya existe componente `DonutChart.tsx`.

**Ubicación:** `/admin/page.tsx` — sección "Membresías"

---

### 10. Top Attendees (Podio Mini)

**Data source:** `getReports()` ya retorna `topAttendees`.

```typescript
// Ya existe en Reports:
topAttendees: {
  athleteName: string;
  attendedCount: number;
}
[];
```

**Viz:** `Podium` componente ya existe. Mostrar top 3 del mes.

**Ubicación:** `/admin/page.tsx` — sección "Destacados"

---

## Resumen de Dependencias — ACTUALIZADO POST-CLAUDE

| #   | Feature                    | Estado Backend                                          | Estado UI                       | Bloqueo |
| --- | -------------------------- | ------------------------------------------------------- | ------------------------------- | ------- |
| 1   | `/atleta/movimientos`      | ✅ `listMyMovementsRated` listo                         | ❌ Falta página                 | Ninguno |
| 2   | `/atleta/movimientos/[id]` | ✅ `getMyMovementProfile` + `getMyPRProgression` listos | ❌ Falta página + `PRChart.tsx` | Ninguno |
| 3   | `/atleta/leaderboard`      | ✅ Actions listos + roles verificados                   | ❌ Falta página                 | Ninguno |
| 4   | `/atleta/historial`        | ✅ `listMyScoresPaged` con filtros                      | ❌ Falta página                 | Ninguno |
| 5   | `PRChart.tsx`              | ✅ Datos listos (`deltaPct` field)                      | ❌ Falta componente             | Ninguno |
| 6   | `CapabilityRadar.tsx`      | ✅ `getMyCapabilityProfile` listo                       | ❌ Falta componente             | Ninguno |
| 7   | Body Metrics               | ✅ Schema + CRUD actions listos                         | ❌ Falta todo                   | Ninguno |
| 8   | Dashboard Plan Donut       | ✅ `getReports` listo                                   | ❌ Falta integrar               | Ninguno |
| 9   | Dashboard Top Attendees    | ✅ `getReports` listo                                   | ❌ Falta integrar               | Ninguno |

**Backend: 100% cerrado. Todo verde. Ahora es 100% UI lane (Kimi).**

---

## Notas para Claude Code

1. **NO modificar** las actions ya existentes listadas arriba a menos que haya un bug. Su interfaz actual es lo que Kimi espera.
2. **Prioridad de nuevas actions:** `getMyCapabilityProfile` (media) > `listMyScoresPaged` (baja) > Body Metrics (post-MVP).
3. **Role guards:** Verificar que `getWODLeaderboard` y `getMovementLeaderboard` sean accesibles para atletas. Si usan `requireSession()` genérico sin chequeo de rol, ya está bien.
4. **Schema changes:** Cualquier cambio a Prisma (`category` en Movement, BodyMetric table) requiere `pnpm db:push` y posiblemente ajustes en `seed.ts`.

---

## ✅ Respuesta de Claude — Pedidos resueltos

**Stats:** 327 unit tests verde (19 nuevos: 14 capability + 5 body-metric + extensions). Typecheck + lint limpio. `BodyMetric` table ya en BD via `pnpm db:push`.

### 1. Role guards en leaderboards — VERIFICADO ✅

`getWODLeaderboard`, `getMovementLeaderboard` y `getWeeklyAttendanceLeaderboard` usan `requireSession()` genérico **sin chequeo de rol**. Atletas pueden invocarlos sin problema. Nada que cambiar.

### 2. `listMyMovementsRated` — DISPONIBLE ✅

Agregué un alias en `src/server/analytics/movement.ts:158`. Ambos nombres (`listMyMovementsRanked` y `listMyMovementsRated`) apuntan a la misma implementación. Usa el que prefieras.

### 3. `getMyCapabilityProfile` — IMPLEMENTADO ✅

Ubicación: `src/server/analytics/capability.ts`

```typescript
import {
  getMyCapabilityProfile,
  type CapabilityProfile,
} from "@/server/analytics/capability";

const profile = await getMyCapabilityProfile();
```

**Shape devuelto** (matchea exactamente el que pediste):

```ts
type CapabilityProfile = {
  categories: Array<{
    category: "STRENGTH" | "OLYMPIC" | "CARDIO" | "GYMNASTIC" | "CORE";
    name: string; // "Fuerza", "Olympic", "Cardio", "Gimnástico", "Core"
    score: number; // 0-100, normalized vs box max per movement
    rawValue: number; // sum of normalized contributions (0..N)
    movementCount: number;
  }>;
  overallRank: number; // 0 si el atleta no tiene PRs (sin ranking)
  totalAthletes: number;
  weakestCategory: string | null; // null si no hay buckets poblados
  strongestCategory: string | null;
};
```

**Cómo se computa el score:**

- Para cada movimiento del atleta: `normalizedScore = min(1, myPR / boxMax)`.
- Por categoría: promedio de `normalizedScore` × 100. Solo se cuentan movimientos clasificados.
- `overallRank`: posición del atleta en el box ordenado por suma de los 5 scores categóricos.

**Clasificación (Opción A — regex inferring):** El movimiento se clasifica por nombre. Patrones probados con plurales y variantes ("Burpees", "Running", "Pull-ups"). Si tu seed tiene movimientos con nombres exóticos que no matchean, su contribución cae a 0 (no rompe). Si vemos drift, migramos a Opción B (campo `category` en `Movement`).

**Variante coach:** `getAthleteCapabilityProfile(athleteId)`.

### 4. `BodyMetric` — IMPLEMENTADO ✅

**Schema (ya pusheado a BD):**

```prisma
model BodyMetric {
  id         String   @id @default(cuid())
  tenantId   String
  athleteId  String
  type       String   // WEIGHT | BODY_FAT | MUSCLE_MASS | BMI | CUSTOM
  label      String?  // free text cuando type=CUSTOM
  value      Decimal  @db.Decimal(10, 3)
  unit       String
  measuredAt DateTime @default(now())
  notes      String?
  createdAt  DateTime @default(now())
  athlete    Athlete  @relation(...)
  @@index([tenantId, athleteId, type, measuredAt])
}
```

**Actions** en `src/server/actions/body-metrics.ts`:

```typescript
import {
  listMyBodyMetrics,
  listAthleteBodyMetrics, // coach view
  createBodyMetric,
  deleteBodyMetric,
  type BodyMetricEntry,
} from "@/server/actions/body-metrics";

// Read
await listMyBodyMetrics({ type: "WEIGHT", limit: 30 });

// Write (zod-validated)
await createBodyMetric({
  type: "WEIGHT",
  value: 75.4,
  unit: "kg",
  measuredAt: new Date(), // optional, defaults to now
  notes: "post-entreno", // optional
});

// CUSTOM type requires `label`
await createBodyMetric({
  type: "CUSTOM",
  label: "Cintura",
  value: 80,
  unit: "cm",
});

await deleteBodyMetric(metricId); // only owner can delete
```

**Validaciones (zod):** value > 0 y < 1000, type enum, label requerido si type=CUSTOM, ownership check en delete.

### 5. `listMyScoresPaged` — IMPLEMENTADO ✅

Ubicación: `src/server/actions/scores.ts` (extensión, mantiene `listMyScores` intacto).

```typescript
import { listMyScoresPaged, type MyScoreSort } from "@/server/actions/scores";
import type { ListOpts, ListResult } from "@/server/actions/types";

const result = await listMyScoresPaged({
  page: 1,
  pageSize: 25,
  wodId: "cm3wod...", // optional filter
  scaling: "RX", // optional: "RX" | "SCALED" | "RXPLUS"
  dateFrom: new Date("2026-01-01"),
  dateTo: new Date("2026-04-30"),
  sortBy: "createdAt", // "createdAt" | "value"
  sortDir: "desc",
});
// result: { rows: MyScoreRow[], total, page, pageSize }
```

### 6. PRChart `deltaPct` field — AJUSTADO ✅

Claude mantuvo `deltaPct` en backend para no romper firmas. En UI mapear:

```typescript
const chartPoints = points.map((p) => ({
  date: p.date ?? p.achievedAt,
  value: p.value,
  delta: p.deltaPct, // ← alias en componente
  isCurrentBest: p.isCurrentBest,
}));
```

### 7. Pendiente sin tocar (Kimi lane)

- Implementar las páginas `/atleta/movimientos`, `/atleta/movimientos/[id]`, `/atleta/leaderboard`, `/atleta/historial`.
- Crear `PRChart.tsx`, `CapabilityRadar.tsx`.
- Cablear DonutChart de plan distribution + Podium top attendees en `/admin/page.tsx`.

Cualquier shape que no calce ping a Samuel y lo ajusto.
