# MOCKUP MANIFEST: Skills

**Proyecto:** kronos | **Stack:** Next.js 15.5.18 + Prisma 6 + Tailwind 3 (V3 Cuarto Oscuro)
**Issue:** [#23 (Slice 1 Tracer)](https://github.com/saqh5037/kronos/issues/23)
**PRD:** `specs/PRD-atleta-v4.md`
**Estado:** Pendiente aprobación Samuel

## Componentes

### `SkillsPage` — `src/app/atleta/skills/page.tsx`

- **Server Component** (Next.js App Router)
- **Hook mockup:** `searchParams.__mockState` → constantes `MOCK_POSITIVE | MOCK_NEGATIVE | MOCK_NEUTRAL`
- **Hook producción:** `getActiveSkill(tenantId, athleteId)` + `getSkillCatalog()` + `getTop3PRPredictions()` (existente) [A CONSTRUIR los dos primeros]
- **Fixture positivo:** atleta RX, Handstand Walk al 60%, 6/10 progresiones, Plan IA con 2 preds
- **Fixture negativo:** sin skill activo, primera vez en pantalla, 10 skills disponibles
- **Fixture neutro:** Principiante, Ring Dip 0%, locks por tier
- **Fuente real:** `Movement.progressions` (Json) + `AthleteSkillLevel` (existente) + catálogo en `src/lib/skills/catalog.ts` [A CONSTRUIR]

### `MockStateToggle` — `src/app/atleta/skills/_components/MockStateToggle.tsx`

- **Client Component** (`"use client"`)
- **Solo dev:** retorna `null` si `process.env.NODE_ENV !== "development"`
- **Función:** Cambia `?__mockState=positive|negative|neutral` via `router.push`
- **Producción:** se elimina al cerrar `/build`

### Componentes inline (subordinados):

- `ActiveSkillView` — vista positivo + neutral con skill activo
- `EmptySkillView` — vista negativo (sin skill)
- `ProgressionRow` — fila de progresión read-only (achieved ✓ / current → / locked 🔒)
- `SkillCatalogCard` — card del catálogo con estado (active/available/completed/locked)

## Contratos API (extraídos de `@mock`)

### `getActiveSkill(tenantId, athleteId)` — A CONSTRUIR

- **Returns:** `{ skill: Skill | null, progressPercent: number, achievedCount: number, totalCount: number, progressions: ProgressionNode[] } | null`
- **Positivo:** retorna skill con datos completos
- **Negativo:** retorna `null` (atleta sin skill seleccionado)
- **Neutro:** retorna skill con `progressPercent: 0`, `achievedCount: 0`, primera progresión `status: "current"`

### `getSkillCatalog(athleteTier, athleteSkillLevels)` — A CONSTRUIR

- **Returns:** `CatalogSkill[]` con shape `{ id, name, status: "active"|"available"|"completed"|"locked", progressPercent?, lockReason? }`
- **Lógica:** Lee JSON `src/lib/skills/catalog.ts`, cruza con `AthleteSkillLevel` para calcular status por skill
- **Tier gating:** Si `athleteTier === "principiante"`, skills marcados `tier: "escalado"|"rx"` → `status: "locked"` con `lockReason: "Nivel Escalado"|"Nivel RX"`

### `getTop3PRPredictions()` — EXISTE

- Reutilizada del Plan IA actual. En `/atleta/skills` se filtra por movimientos del skill activo (Issue #32).

## Schema y data

**Sin cambios de schema en este slice.** Todo se construye sobre infra existente:

- `Movement.progressions` (Json) — progresiones del skill
- `AthleteSkillLevel` (movementSlug + progressionSlug + status) — estado del atleta
- `XPLedger` — para futura integración con XP por progresión (Issue #28)

**Catálogo nuevo:** `src/lib/skills/catalog.ts` (JSON estático, no BD)

- 10 skills: Handstand Walk, MU anillas, MU barra, T2B, Double-Under, HSPU, Pistol Squat, Ring Dip, Clean & Jerk, Snatch
- Cada skill: `{ id, name, tier, movementSlug, progressionSlugs[], prereqSkillIds[] }`

## Brand y tokens (V3 Cuarto Oscuro)

✓ Tokens usados:

- Backgrounds: `--k-bg`, `--k-surface`, `--k-elevated`, `--k-line`, `--k-line-2`
- Texto: `--k-t1` (primary), `--k-t2`, `--k-t3`
- Acento: `--k-accent` (lima neon `#C8FF2D`), `--k-accent-soft`, `--k-accent-line`, `--k-accent-on`, `--k-accent-glow`
- Fonts: `--k-font-display` (IBM Plex Mono) en headings/números, `--k-font-body` (Inter) en descripciones
- Componentes: `KCard`, `AnimatedSection`, `AnimatedItem`, `RevealOnScroll`, `k-tap`, `k-eyebrow`

✗ NO se usan tokens legacy (`--moss`, `--text-2`, etc.) ni hex hardcoded.

## Estado de mocks

- **Total anotaciones `@mock`:** 4 (page.tsx top + ProgressionRow + SkillCatalogCard + MockStateToggle component)
- **Archivos con mocks:** 1 (`src/app/atleta/skills/page.tsx`)
- **Archivos a producir en `/build`:**
  - `src/lib/skills/catalog.ts` (catálogo JSON)
  - `src/lib/skills/types.ts` (interfaces)
  - `src/lib/skills/progress.ts` (`computeSkillProgress`)
  - `src/server/actions/skills.ts` (`getActiveSkill`, `getSkillCatalog`)

## Issues identificados durante mockup

1. **Service Worker cache** (Kronos PWA): Los chunks viejos de `next@15.3.2` quedaban cacheados en el SW post-hardening. Fix: `pnpm prune` (eliminó `node_modules/.pnpm/next@15.3.2/`) + unregister SW + clear caches en browser. **Acción para producción:** considerar bumpear `sw.js` versión cuando hay cambio mayor de Next, o forzar `skipWaiting`.

2. **TabBar pendiente:** Skills no aparece en bottom nav. Es del Slice 5 (#31). Se accede directo por URL.

## Cómo verlo

```bash
# Server ya levantado en :3000
open "http://localhost:3000/atleta/skills?__mockState=positive"
open "http://localhost:3000/atleta/skills?__mockState=negative"
open "http://localhost:3000/atleta/skills?__mockState=neutral"
```

O usa el toggle flotante arriba-izquierda en cualquier estado.
