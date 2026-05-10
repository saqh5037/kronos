# Issues — PRD Atleta V4

**Generado:** 2026-05-10
**PRD:** `specs/PRD-atleta-v4.md`
**Milestone:** V4 Atleta
**Total slices:** 11 | Estimación total: ~3-4 semanas

---

## Mapa de dependencias

```
Slice 1 (Skills catalog) ─────────────────────────────────── TRACER BULLET
  ├── bloquea → Slice 3 (Home hero)
  │               └── bloquea → Slice 5 (Home completo)
  └── bloquea → Slice 6 (Toggle progresión)
                  └── bloquea → Slice 10 (Plan IA en Skills)

Slice 2 (BadgeTier migration) ─── PARALELO a Slice 1
  ├── bloquea → Slice 7 (TrophyStrip V4)
  └── bloquea → Slice 8 (Compartir Instagram)

Slice 4 (READINESS chip) ────────── INDEPENDIENTE
Slice 9 (Perfil V4) ─────────────── INDEPENDIENTE
Slice 11 (AthleteProgram) ───────── INDEPENDIENTE (después de Slice 5)
```

### Orden de ejecución óptimo

```
Wave 1 (paralelo):   Slice 1 + Slice 2 + Slice 4 + Slice 9
Wave 2 (bloqueados): Slice 3 + Slice 6 + Slice 7 + Slice 8
Wave 3 (bloqueados): Slice 5 + Slice 10
Wave 4 (opcional):   Slice 11
```

---

## Issue 1 — [TRACER BULLET] Skills catalog + pantalla base

**Parent PRD:** specs/PRD-atleta-v4.md
**Tipo:** Story
**Estimación:** M (1 día)
**Bloqueado por:** Ninguno
**Bloquea a:** Issue 3, Issue 6
**Labels:** `vertical-slice`, `skills`

### Descripción

Crear el catálogo JSON estático de 10 skills (`src/lib/skills/catalog.ts`) con
sus tipos, progresiones y slugs. Implementar `computeSkillProgress()` que lee
`AthleteSkillLevel` y calcula el % de avance del atleta en un skill. Crear la
pantalla `/atleta/skills` con el skill activo como hero y el catálogo debajo.

Este slice descubre si `AthleteSkillLevel.progressionSlug` encaja con los slugs
del JSON sin necesitar migración de schema — es el unknown unknown más crítico.

### Capas que toca

- [ ] **Lib:** `src/lib/skills/catalog.ts` — JSON de 10 skills con tipos y progresiones
- [ ] **Lib:** `src/lib/skills/types.ts` — interfaces `Skill`, `SkillProgression`, `ProgressionStatus`
- [ ] **Lib:** `src/lib/skills/progress.ts` — `computeSkillProgress()`, `getProgressionStatus()`
- [ ] **Server:** `src/server/actions/skills.ts` — `getAthleteSkillProgress()`, `getActiveSkill()`
- [ ] **Frontend:** `src/app/atleta/skills/page.tsx` — pantalla con skill hero (% grande) + catálogo
- [ ] **Frontend:** `src/app/atleta/skills/[id]/page.tsx` — detalle de skill con lista de progresiones
- [ ] **Tests:** `src/lib/skills/progress.test.ts` — `computeSkillProgress` con fixtures

### Criterios de aceptación

- [ ] `/atleta/skills` accesible (aunque aún no esté en el nav — se agrega en Issue 5)
- [ ] El hero muestra: nombre del skill activo + % de progreso + progresiones (✓ lograda / → actual / ○ pendiente)
- [ ] El catálogo lista los 10 skills con su estado: Completado / En progreso / Disponible / Requiere X
- [ ] Si el atleta no tiene `AthleteSkillLevel` registrado → todos los skills en "Disponible"
- [ ] `computeSkillProgress` tiene tests que cubren: 0 progresiones, mitad, todas

### User Stories cubiertas

- US-5 (Skills pantalla top-level — parcial, sin nav)
- US-6 (Progresión de skill — parcial, solo lectura)

---

## Issue 2 — BadgeTier migration + Logros hero XP

**Parent PRD:** specs/PRD-atleta-v4.md
**Tipo:** Story
**Estimación:** M (1 día)
**Bloqueado por:** Ninguno
**Bloquea a:** Issue 7, Issue 8
**Labels:** `vertical-slice`, `logros`, `schema`

### Descripción

Agregar `tier` (BadgeTier enum) y `xpReward` a `Badge`. Actualizar
`listBadgesWithProgress` para filtrar y ordenar por tier del atleta. Rediseñar
`/atleta/logros` con hero XP + nivel + tier-gating. XP total = SUM(xpLedger).

### Capas que toca

- [ ] **BD:** `prisma/schema.prisma` — enum `BadgeTier { PRINCIPIANTE ESCALADO RX }`, campos `Badge.tier BadgeTier?` y `Badge.xpReward Int @default(50)`
- [ ] **BD:** `prisma/seed.ts` — agregar `xpReward` a todos los badges existentes (default 50)
- [ ] **Server:** `src/server/actions/badges.ts` — `listBadgesWithProgress` filtra por tier del atleta; helper `getAthleteXP()` suma `XPLedger`
- [ ] **Server:** helper `getAthleteLevel(xp: number): number` con umbrales 0/300/800/1800/3500
- [ ] **Frontend:** `src/app/atleta/logros/page.tsx` — hero "Tu colección · Nivel N · XP total" + barra progreso al siguiente nivel + grid tier-gated
- [ ] **Frontend:** `src/components/atleta/XPHero.tsx` — componente reutilizable
- [ ] **Tests:** test de `getAthleteLevel()` con todos los umbrales

### Criterios de aceptación

- [ ] Hero `/atleta/logros` muestra: "Tu colección · Nivel [N] · [XP] XP" con barra de progreso
- [ ] Badges del tier actual aparecen primero; badges de tiers superiores al final con label "Desbloqueas en Escalado/RX"
- [ ] Badges sin tier (null) aparecen en todas las vistas
- [ ] Contador "X/Y desbloqueados" solo cuenta badges del tier actual + generales
- [ ] `pnpm db:push` pasa sin errores; `pnpm test` verde

### User Stories cubiertas

- US-12 (Logros narrativa con XP y tier)
- US-14 (XP por badge y nivel atleta — lectura)

---

## Issue 3 — Home hero "Tu próxima victoria"

**Parent PRD:** specs/PRD-atleta-v4.md
**Tipo:** Story
**Estimación:** S (0.5 día)
**Bloqueado por:** Issue 1
**Bloquea a:** Issue 5
**Labels:** `vertical-slice`, `home`

### Descripción

Crear el componente `VictoryHero` con el headline tipográfico estilo Whoop y
cablearlo en `/atleta/page.tsx`. El hero lee el skill activo del atleta
(usando `getActiveSkill()` de Issue 1) y muestra % de progreso + skill name +
lo que falta hoy. Si no hay skill activo → CTA "Elige tu objetivo".

### Capas que toca

- [ ] **Frontend:** `src/components/atleta/VictoryHero.tsx` — número grande (≥76px), skill name, acciones faltantes, CTA si sin skill
- [ ] **Frontend:** `/atleta/page.tsx` — importar `VictoryHero`, pasarle datos del skill activo
- [ ] **Server:** reutiliza `getActiveSkill()` de Issue 1

### Criterios de aceptación

- [ ] Primer elemento visible en `/atleta` es `VictoryHero` con el % en `var(--k-accent)`, `var(--k-font-display)`
- [ ] Si skill activo existe: muestra nombre + % + acciones faltantes (texto pequeño)
- [ ] Si no existe skill activo: muestra "Elige tu primer objetivo" → `/atleta/skills`
- [ ] Texto adapta por tier: "Aprende / Perfecciona / Domina [skill]"
- [ ] No rompe el layout existente de Home (secciones que siguen se mantienen intactas)

### User Stories cubiertas

- US-1 (Home hero "Tu próxima victoria")
- US-15 (Voz adaptativa por tier — parcial)

---

## Issue 4 — READINESS chip no-bloqueante

**Parent PRD:** specs/PRD-atleta-v4.md
**Tipo:** Story
**Estimación:** S (0.5 día)
**Bloqueado por:** Ninguno
**Bloquea a:** Ninguno
**Labels:** `vertical-slice`, `home`

### Descripción

Crear el componente `ReadinessChip` que aparece bajo el hero si el atleta no
respondió el survey READINESS hoy. Usa `getActiveSurvey` y `hasRespondedToday`
existentes. Al tocar abre un bottom sheet con las 3 preguntas. Una vez
respondido, el chip se contrae mostrando el score del día.

### Capas que toca

- [ ] **Frontend:** `src/components/atleta/ReadinessChip.tsx` — chip + bottom sheet con 3 sliders (energía/sueño/dolores 1-5)
- [ ] **Frontend:** `/atleta/page.tsx` — integrar chip bajo el hero (antes o después de `VictoryHero` según layout)
- [ ] **Server:** reutiliza `getActiveSurvey("READINESS")` y `hasRespondedToday("READINESS")` existentes
- [ ] **Server:** reutiliza la acción de responder survey existente (ya cableada en `QuickSurvey`)

### Criterios de aceptación

- [ ] Chip "¿Cómo amaneciste?" visible si no respondió hoy
- [ ] Bottom sheet se abre al tocar; tiene 3 preguntas con escala 1-5; botón "Listo"
- [ ] Al responder: chip se contrae a indicador de color (verde ≥12/15, amarillo 8-11, naranja ≤7)
- [ ] Si score ≤ 6/15 → texto suave "Hoy considera Scaled"
- [ ] Chip no aparece si `hasRespondedToday("READINESS")` = true

### User Stories cubiertas

- US-2 (READINESS check-in diario)

---

## Issue 5 — Home bifurcación completa con-box / sin-box + nav V4

**Parent PRD:** specs/PRD-atleta-v4.md
**Tipo:** Story
**Estimación:** M (1 día)
**Bloqueado por:** Issue 3
**Bloquea a:** Issue 11
**Labels:** `vertical-slice`, `home`

### Descripción

Refactor completo de `/atleta/page.tsx` aplicando el nuevo orden con-box vs
sin-box, eliminando las secciones que se van (AnimatedStats, duplicados,
CoachCards → Skills), y actualizando el bottom nav para añadir Skills como 4ta tab
reemplazando la que corresponda. Poda final: Home queda con ≤7 secciones.

### Capas que toca

- [ ] **Frontend:** `/atleta/page.tsx` — refactor con bifurcación explícita con-box/sin-box
  - Con-box: NextBooking → VictoryHero → ReadinessChip → WeekStrip → WOD del día → TrophyStrip → LastScore+PR
  - Sin-box: VictoryHero → ReadinessChip → Skills focus → WOD sugerido/programa CTA → WeekStrip → TrophyStrip
- [ ] **Frontend:** Layout/nav atleta — agregar "Skills" tab, quitar "Reservar" del nav (acceso desde Home)
- [ ] **Frontend:** Eliminar `AnimatedStats` de Home (se queda solo en Perfil)
- [ ] **Frontend:** Mover `CoachCardsSection` de Home → `/atleta/skills` (Issue 1 ya preparó la página)
- [ ] **Frontend:** `PersonalHomeView` reemplazado por la nueva vista sin-box

### Criterios de aceptación

- [ ] Con-box: NextBooking es el primer elemento antes del hero
- [ ] Sin-box: VictoryHero es el primer elemento
- [ ] Bottom nav tiene 4 tabs: Inicio / Skills / WOD / Perfil
- [ ] Leaderboard WOD del día ya NO aparece en Home (se accede desde `/atleta/wod`)
- [ ] `AnimatedStats` grid 2×2 ya NO aparece en Home
- [ ] `CoachCardsSection` ya NO aparece en Home (ver `/atleta/skills`)
- [ ] `pnpm typecheck && pnpm test` verde

### User Stories cubiertas

- US-3 (Home con-box vs sin-box)
- US-5 (Skills en bottom nav)

---

## Issue 6 — Skills toggle progresión + XP reward

**Parent PRD:** specs/PRD-atleta-v4.md
**Tipo:** Story
**Estimación:** M (1 día)
**Bloqueado por:** Issue 1
**Bloquea a:** Issue 10
**Labels:** `vertical-slice`, `skills`

### Descripción

Añadir interactividad a la pantalla Skills: cada progresión tiene un toggle
que actualiza `AthleteSkillLevel` entre CURRENT/ACHIEVED y escribe en
`XPLedger` (100 XP por progresión completada). Al completar el skill completo
se genera un Achievement + Badge correspondiente.

### Capas que toca

- [ ] **Server:** `src/server/actions/skills.ts` — `toggleSkillProgression(athleteId, skillId, progressionSlug)`: upsert `AthleteSkillLevel` + append `XPLedger` (100 XP, reason="skill_progression")
- [ ] **Server:** `checkSkillCompletion()` — si todas progresiones ACHIEVED → crear `Achievement` + badge si corresponde
- [ ] **Frontend:** Items de progresión en `/atleta/skills/[id]/page.tsx` con toggle interactivo
- [ ] **Frontend:** Animación de celebración al marcar ACHIEVED (usa `k-pulse-glow` + confetti leve)
- [ ] **Tests:** test de `toggleSkillProgression` (antes/después de estado, idempotente)

### Criterios de aceptación

- [ ] Cada progresión tiene toggle tapeable; cambia entre ○ → ✓ y viceversa
- [ ] Al marcar ACHIEVED: animación de celebración, XP +100 visible (toast o chip)
- [ ] El % del hero se recalcula inmediatamente (optimistic update)
- [ ] Si todas las progresiones del skill están ACHIEVED → skill pasa a "Completado" + se genera Achievement
- [ ] `XPLedger` tiene la entrada con `sourceType: "skill_progression"`, `sourceId: "${skillId}:${progressionSlug}"`
- [ ] Toggle es idempotente (re-tap ACHIEVED → CURRENT no genera XP duplicado por `@@unique`)

### User Stories cubiertas

- US-6 (Progresión de skill y registro)

---

## Issue 7 — TrophyStrip V4 rediseñado

**Parent PRD:** specs/PRD-atleta-v4.md
**Tipo:** Story
**Estimación:** S (0.5 día)
**Bloqueado por:** Issue 2
**Bloquea a:** Ninguno
**Labels:** `vertical-slice`, `logros`, `home`

### Descripción

Rediseñar el `TrophyStrip` de Home para mostrar el logro más reciente del mes
corriente como "logro hero" curado. Reemplaza el strip horizontal actual
(últimos 3 badges) por un diseño más prominente con 1 badge featured + fecha.

### Capas que toca

- [ ] **Server:** `src/server/actions/athlete-home.ts` — `getMonthlyFeaturedTrophy()` — Achievement con earnedAt más reciente del mes actual, incluyendo Badge completo
- [ ] **Frontend:** `src/components/atleta/TrophyStripV4.tsx` — badge hero con nombre + fecha + CTA "Ver todos"
- [ ] **Frontend:** `/atleta/page.tsx` — reemplaza `<TrophyStrip>` por `<TrophyStripV4>`

### Criterios de aceptación

- [ ] TrophyStrip muestra 1 badge featured del mes corriente con nombre + fecha + descripción corta
- [ ] Si no hay badge este mes → muestra el más reciente + texto "Tu último logro · [fecha relativa]"
- [ ] Tocar el strip navega a `/atleta/logros`
- [ ] Respeta tokens V3 (`--k-accent-soft`, `--k-accent-line`, `--k-accent-glow`)

### User Stories cubiertas

- US-4 (TrophyStrip rediseñado)

---

## Issue 8 — Logros compartibles Instagram

**Parent PRD:** specs/PRD-atleta-v4.md
**Tipo:** Story
**Estimación:** M (1 día)
**Bloqueado por:** Issue 2
**Bloquea a:** Ninguno
**Labels:** `vertical-slice`, `logros`

### Descripción

En la pantalla de detalle de badge (`/atleta/logros/[code]`), agregar CTA
"Compartir logro" que genera un asset visual usando Canvas HTML5: story
1080×1920 y feed 1080×1080, descargable al carrete. Incluye logo Kronos,
badge icon, nombre del atleta, estadística y hashtag `#KronosFit`.

### Capas que toca

- [ ] **Frontend:** `src/components/atleta/BadgeShareCanvas.tsx` — canvas con layout story/feed, usa `drawImage` + texto
- [ ] **Frontend:** `/atleta/logros/[code]/page.tsx` — botón "Compartir" + modal de preview antes de descargar
- [ ] **Frontend:** helper `downloadCanvas(canvas, filename)` — trigger descarga PNG

### Criterios de aceptación

- [ ] Cada badge desbloqueado tiene CTA "Compartir logro" en su pantalla de detalle
- [ ] Al tocar se muestra preview del asset (story format) con: badge icon (o iniciales), nombre atleta, nombre logro, estadística relevante, logo Kronos, `#KronosFit`
- [ ] Botón "Descargar story" → PNG 1080×1920 al carrete
- [ ] Botón "Descargar feed" → PNG 1080×1080 al carrete
- [ ] Usa solo tokens V3 (fondo `#08080a`, acento `#C8FF2D`)
- [ ] En badges bloqueados el CTA no aparece

### User Stories cubiertas

- US-13 (Logros compartibles Instagram)

---

## Issue 9 — Perfil V4 — adelgazado 5 secciones + BodyMetric activo

**Parent PRD:** specs/PRD-atleta-v4.md
**Tipo:** Story
**Estimación:** M (1.5 días)
**Bloqueado por:** Ninguno
**Bloquea a:** Ninguno
**Labels:** `vertical-slice`, `perfil`

### Descripción

Refactor de `/atleta/perfil/page.tsx` de 11 a 5 secciones (HERO · CAPABILITY
RADAR · PRs TOP-6 · HISTÓRICO · CUERPO). Eliminar secciones que se van (Hub
Explorar, Stats grid, Plan IA, Próximos PRs, Push, Config). Activar UI de
`BodyMetric` con CRUD básico para la sección CUERPO. Agregar badge de tier al
hero del atleta.

### Capas que toca

- [ ] **Server:** `src/server/actions/body-metrics.ts` — `listMyBodyMetrics()`, `createBodyMetric()`, `deleteBodyMetric()`
- [ ] **Frontend:** `/atleta/perfil/page.tsx` — refactor a 5 secciones estrictas
- [ ] **Frontend:** `src/components/atleta/BodyMetricSection.tsx` — lista métricas + form de nueva entrada (peso/% grasa/masa muscular) + tendencia ↑↓→
- [ ] **Frontend:** Hero de Perfil — agregar badge "RX / Escalado / Principiante" + chip "Wearable: próximamente" (placeholder)
- [ ] **Tests:** `body-metrics.test.ts` — CRUD básico

### Criterios de aceptación

- [ ] `/atleta/perfil` tiene exactamente 5 secciones en orden: HERO → CAPABILITY RADAR → PRs TOP-6 → HISTÓRICO → CUERPO
- [ ] Hub Explorar, Stats grid 2×2, Plan IA, Próximos PRs, Activity sparkline como sección independiente, Push, Config block NO aparecen
- [ ] El hero muestra el tier del atleta (badge "RX" / "Escalado" / "Principiante" o "Explorando" si sin tag)
- [ ] Sección CUERPO: muestra últimas métricas + botón "Registrar medición" → form inline
- [ ] Al registrar medición → tendencia (↑↓→) vs medición anterior del mismo tipo
- [ ] PRs section: top-6 ordenados por relevancia (% sobre baseline del tier)
- [ ] `pnpm typecheck && pnpm test` verde

### User Stories cubiertas

- US-9 (Perfil adelgazado 5 secciones)
- US-10 (Hero con tier visible)
- US-11 (Sección Cuerpo activa)

---

## Issue 10 — Skills Plan IA integrado

**Parent PRD:** specs/PRD-atleta-v4.md
**Tipo:** Story
**Estimación:** S (0.5 día)
**Bloqueado por:** Issue 6
**Bloquea a:** Ninguno
**Labels:** `vertical-slice`, `skills`

### Descripción

Integrar las predicciones de PR de Gemini dentro de `/atleta/skills`, contextualizadas
al skill activo. En lugar de mostrar los 3 top PRs genéricos, filtrar y ordenar por
relevancia al skill que el atleta está trabajando. Redirigir `/atleta/plan` → `/atleta/skills`.

### Capas que toca

- [ ] **Server:** `src/server/actions/ai.ts` — `getSkillContextualPRPredictions(skillId)` — filtra `getTop3PRPredictions()` por movimientos del skill activo
- [ ] **Frontend:** sección "Tu plan" dentro de `/atleta/skills/page.tsx`
- [ ] **Frontend:** `/atleta/plan/page.tsx` → redirige a `/atleta/skills` con `redirect()`

### Criterios de aceptación

- [ ] Sección "Tu plan" aparece dentro de Skills debajo del catálogo
- [ ] Muestra predicciones de PR contextualizadas: "Para [skill], mejora [movimiento]: proyección [X] en [N] semanas"
- [ ] Si atleta tiene <5 scores → sección oculta con mensaje "Necesitas al menos 5 scores para ver tu plan"
- [ ] `/atleta/plan` redirige a `/atleta/skills` (301)
- [ ] `PRPredictionCard` existente se reutiliza con nuevo copy contextual

### User Stories cubiertas

- US-7 (Skills Plan IA integrado)

---

## Issue 11 — AthleteProgram MVP (carga de programa personal)

**Parent PRD:** specs/PRD-atleta-v4.md
**Tipo:** Story
**Estimación:** L (2 días)
**Bloqueado por:** Issue 5
**Bloquea a:** Ninguno
**Labels:** `vertical-slice`, `home`

### Descripción

Para atletas sin box: pantalla `/atleta/programa` donde pueden cargar su programa
de 1 semana vía imagen/foto (OCR, extiende `/atleta/wod/foto`) o manualmente
(form por día). Los WODs cargados aparecen en Home sin-box como "Tu WOD de hoy".

### Capas que toca

- [ ] **Server:** `src/server/actions/athlete-program.ts` — `createProgramWeek()`, `getProgramWeekWODs()`, `deleteProgramWOD()`
- [ ] **Frontend:** `src/app/atleta/programa/page.tsx` — UI con 2 paths: (a) "Sube foto/PDF" → OCR, (b) "Ingresar manualmente" → form 7 días
- [ ] **Frontend:** Extensión de OCR existente (`/atleta/wod/foto`) para parsear 7 WODs en vez de 1
- [ ] **Frontend:** Home sin-box — sección "Tu WOD de hoy" usando `getProgramWeekWODs()`

### Criterios de aceptación

- [ ] `/atleta/programa` accesible para atletas sin box (CTA desde Home sin-box)
- [ ] Path OCR: subir imagen → extraer hasta 7 WODs → preview editable → guardar
- [ ] Path manual: form con campo por día de la semana (lun-dom) → guardar
- [ ] Home sin-box muestra "Tu WOD de hoy" si hay programa cargado para la fecha actual
- [ ] El atleta puede editar o eliminar WODs individuales del programa
- [ ] Scope: 1 semana (7 días). No soporta programa de mes.

### User Stories cubiertas

- US-8 (Programación personal atleta sin box)

---

## Resumen ejecutivo

| #   | Slice                  | Est | Bloquea | Bloqueado por | Wave |
| --- | ---------------------- | --- | ------- | ------------- | ---- |
| 1   | Skills catalog + base  | M   | 3, 6    | —             | 1    |
| 2   | BadgeTier + Logros XP  | M   | 7, 8    | —             | 1    |
| 3   | Home hero victoria     | S   | 5       | 1             | 2    |
| 4   | READINESS chip         | S   | —       | —             | 1    |
| 5   | Home bifurcación + nav | M   | 11      | 3             | 3    |
| 6   | Skills toggle + XP     | M   | 10      | 1             | 2    |
| 7   | TrophyStrip V4         | S   | —       | 2             | 2    |
| 8   | Logros compartir IG    | M   | —       | 2             | 2    |
| 9   | Perfil V4 + BodyMetric | M   | —       | —             | 1    |
| 10  | Skills Plan IA         | S   | —       | 6             | 3    |
| 11  | AthleteProgram MVP     | L   | —       | 5             | 4    |

**Wave 1 (paralelo):** Slices 1 + 2 + 4 + 9
**Wave 2 (tras Wave 1):** Slices 3 + 6 + 7 + 8
**Wave 3 (tras Wave 2):** Slices 5 + 10
**Wave 4 (opcional):** Slice 11
