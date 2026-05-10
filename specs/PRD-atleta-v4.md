# PRD: Atleta V4 — Rediseño narrativo + Skills

**Fecha:** 2026-05-10
**Autor:** Samuel Quiroz + Claude Code
**Estado:** Borrador — pendiente aprobación
**Versión:** 1.0

---

## Contexto

La app atleta de Kronos creció iterativamente (Fases 1-3, PRs #1-22) y acumuló
deuda narrativa: Home tiene 12 secciones apiladas sin jerarquía, Perfil tiene 11
secciones que mezclan identidad con estado del día, y Logros es un catálogo
plano sin progresión.

Post auditoría UX/UI (PR #22), el diagnóstico es: no hacen falta más fixes —
hace falta **rediseño narrativo**. El usuario abre la app y no sabe qué está
mirando ni por qué le debería importar.

Referencia de tono y posicionamiento: **Whoop / Oura** en densidad de datos y
vínculo emocional, pero con ángulo diferente. Kronos no es wearable de recovery
— es **journal de progreso deportivo + guía de skills, vertical CrossFit**.

---

## Objetivo

Rediseñar las 3 pantallas principales del atleta (Home, Perfil, Logros) y añadir
una 4ta pantalla top-level (Skills) de forma que cada pantalla cuente una historia
clara, el atleta entienda su camino de mejora desde el primer día, y la app
soporte 3 tiers de experiencia (Principiante / Escalado / RX).

---

## User Stories

### US-1: Home — Hero "Tu próxima victoria" (tipográfico)

**Como** atleta (cualquier tier)
**Quiero** ver al abrir la app cuál es mi próximo logro de habilidad y qué tan
cerca estoy de alcanzarlo
**Para** saber si hoy tiene sentido enfocarse en algo concreto

**Criterios de aceptación:**

- [ ] El primer elemento visible en `/atleta` es el hero "Tu próxima victoria"
      con el nombre del skill activo (ej. "HANDSTAND WALK"), el % de progreso
      como número grande (≥76px), y la/las acciones faltantes en texto pequeño
- [ ] Si el atleta no tiene skill activo configurado, el hero muestra un CTA
      "Elige tu primer objetivo" → enlaza a `/atleta/skills`
- [ ] El hero es tipográfico (sin imagen/ilustración) con tokens V3:
      `--k-accent` en el porcentaje, `--k-font-display` en el número
- [ ] El hero se adapta al tier del atleta: Principiante ve "Aprende X",
      Escalado ve "Perfecciona X", RX ve "Domina X"

---

### US-2: Home — READINESS check-in diario

**Como** atleta
**Quiero** reportar cómo me siento hoy en ≤10 segundos
**Para** que Kronos adapte sus sugerencias de escala (RX / Scaled) al estado real
de mi cuerpo

**Criterios de aceptación:**

- [ ] Chip "¿Cómo amaneciste?" visible bajo el hero si el atleta no respondió hoy
- [ ] Al tocar el chip se abre un bottom sheet con 3 preguntas: energía (1-5),
      calidad de sueño (1-5), dolores/molestias (1-5)
- [ ] Una vez respondido, el chip se contrae a un indicador de estado (color
      acorde al score: verde/amarillo/naranja)
- [ ] Si el score READINESS ≤ 6/15, la Home muestra un aviso suave: "Hoy
      considera Scaled"
- [ ] El chip no aparece si ya respondió `Survey READINESS` hoy (usa
      `hasRespondedToday("READINESS")` existente)

---

### US-3: Home — Vista con-box vs sin-box

**Como** atleta **con box asociado**
**Quiero** ver mi próxima clase como el primer elemento de acción
**Para** no perder tiempo buscando horario y poder cancelar/confirmar de un vistazo

**Como** atleta **sin box** (Box Personal)
**Quiero** ver mi foco de skills y WOD personal como primer elemento
**Para** no ver pantalla vacía ni secciones de box que no aplican para mí

**Criterios de aceptación (con-box):**

- [ ] La card "Próxima clase" aparece **encima** del hero READINESS
- [ ] Muestra: hora, nombre del coach, occupancy (ej. `● 8/10`), CTA cancelar
- [ ] WeekStrip muestra clases del box reservadas por el atleta

**Criterios de aceptación (sin-box):**

- [ ] `PersonalHomeView` es reemplazada por la nueva Home con las secciones
      aplicables: Hero victoria + READINESS + Skills focus + WOD sugerido/
      programa + WeekStrip (entrenos auto-loggeados) + TrophyStrip
- [ ] En lugar de "Próxima clase" aparece CTA "Crea tu próximo WOD" → `/atleta/wod/nuevo`
- [ ] En lugar de Leaderboard del box aparece ausencia (sección omitida)

---

### US-4: Home — TrophyStrip rediseñado

**Como** atleta
**Quiero** ver mi logro más destacado del mes en Home
**Para** tener motivación visible y compartirlo sin tener que buscar en otra pantalla

**Criterios de aceptación:**

- [ ] TrophyStrip muestra 1 hero badge (logro más reciente del mes corriente)
- [ ] Si no hay logro del mes, muestra el logro más reciente + CTA "¿Cuándo
      fue tu último logro?" con fecha relativa
- [ ] Tocar el strip lleva a `/atleta/logros`

---

### US-5: Skills — Nueva pantalla top-level

**Como** atleta
**Quiero** ver un catálogo de skills de CrossFit con mi estado actual en cada uno
**Para** entender qué habilidades tengo que trabajar para llegar a mi meta

**Criterios de aceptación:**

- [ ] `/atleta/skills` es accesible desde el bottom nav (4to tab)
- [ ] La pantalla muestra el **skill activo** como hero con: nombre, % progreso
      global, lista de progresiones (desbloqueadas ✓ / actual → / pendientes ○)
- [ ] Debajo del skill activo aparece el catálogo de 10 skills con su estado:
      `Completado`, `En progreso`, `Disponible`, `Requiere X primero`
- [ ] Los 10 skills V4 son: Handstand Walk, Muscle-Up (anillas), Muscle-Up
      (barra), Toes-to-Bar, Double-Under, HSPU (parado de manos), Pistol Squat,
      Ring Dip, Clean & Jerk técnico, Snatch técnico
- [ ] Las progresiones de cada skill muestran movimientos pre-requisito con
      enlace a `/atleta/movimientos/[id]` para ver técnica
- [ ] El Coach Virtual (CoachCards tipo `NEXT_UNLOCK`) se muestra dentro de
      Skills, no en Home
- [ ] Un atleta Principiante ve primero skills básicos (Double-Under, Toes-to-Bar,
      Ring Dip); un atleta RX ve todos con contexto de performance

---

### US-6: Skills — Progresión de skill y registro de estado

**Como** atleta
**Quiero** marcar una progresión de skill como "lograda"
**Para** que el sistema sepa que avancé y me sugiera el siguiente paso

**Criterios de aceptación:**

- [ ] Cada progresión tiene un toggle (tap) que alterna entre `CURRENT` /
      `ACHIEVED` (usa `AthleteSkillLevel` existente)
- [ ] Al marcar `ACHIEVED`, se muestra una animación de celebración y se
      otorgan XP (100 XP por progresión, registrado en `XPLedger`)
- [ ] El % de progreso del hero se recalcula inmediatamente
- [ ] Si la progresión completada desbloquea el skill final, se genera un
      `Achievement` + Badge correspondiente y aparece opción de compartir

---

### US-7: Skills — Plan IA integrado

**Como** atleta con un skill activo
**Quiero** ver qué PRs necesito mejorar para acelerar mi progreso al skill
**Para** saber en qué enfocarme cuando voy al box

**Criterios de aceptación:**

- [ ] La sección "Tu plan" dentro de Skills muestra las predicciones de PR de
      Gemini (existente en `getTop3PRPredictions`) contextualizadas al skill activo
- [ ] El texto dice: "Para [skill], necesitas mejorar [movimiento]: tu proyección
      es [X] en [N] semanas" — integra datos del skill con la predicción
- [ ] `/atleta/plan` redirige a `/atleta/skills` (o muestra el mismo contenido)
- [ ] La sección Plan IA no aparece si el atleta tiene <5 scores registrados
      (no hay datos suficientes para predicción)

---

### US-8: Skills — Programación personal (atleta sin box)

**Como** atleta sin box
**Quiero** cargar mi programa de entrenamiento (imagen, PDF, o texto)
**Para** tener mi WOD diario en la app como si tuviera un box

**Criterios de aceptación:**

- [ ] En `/atleta/skills` (o Home sin-box), aparece CTA "Carga tu programa"
- [ ] El atleta puede: (a) subir imagen/PDF → OCR parsea y extrae WODs
      (extiende `/atleta/wod/foto` existente), o (b) ingresar manualmente
      un WOD por día (form estructurado)
- [ ] Scope V4: programa de **1 semana** (7 días). Programa-mes en V5.
- [ ] Los WODs cargados aparecen en Home sin-box como "Tu WOD de hoy"
- [ ] El atleta puede editar o eliminar WODs del programa cargado

---

### US-9: Perfil — Adelgazado a 5 secciones

**Como** atleta
**Quiero** ir a Perfil y ver quién soy como atleta (identidad, capacidades, historial)
sin que la pantalla me tire 11 secciones de datos mezclados
**Para** entender mi identidad atlética de un vistazo

**Criterios de aceptación:**

- [ ] `/atleta/perfil` tiene exactamente 5 secciones en este orden:
      HERO · CAPABILITY RADAR · PRs TOP-6 · HISTÓRICO · CUERPO
- [ ] Las secciones eliminadas (Stats grid, Hub Explorar, Push, Config, Plan IA,
      Próximos PRs, Activity sparkline como sección independiente) no aparecen
- [ ] Push notifications y Config se encuentran en `/atleta/ajustes` (ya existe)
- [ ] El Capability Radar permanece en Perfil (no se mueve a Skills)

---

### US-10: Perfil — Hero con tier visible

**Como** atleta
**Quiero** que mi perfil muestre mi nivel actual (Principiante / Escalado / RX)
de forma prominente
**Para** tener identidad atlética clara y sentir que hay niveles que conquistar

**Criterios de aceptación:**

- [ ] El hero de Perfil muestra: foto + nombre + badge de tier + "activo desde
      [fecha]"
- [ ] El badge de tier lee de `Athlete.tags` (`level:rx`, `level:scaled`,
      `level:beginner`) y lo muestra con label: "RX" / "Escalado" / "Principiante"
- [ ] Si el atleta tiene wearable conectado (V4: placeholder), aparece chip
      "Apple Health · conectado" o "Google Fit · conectado" bajo el nombre
- [ ] ⚠️ ASUNCIÓN: nivel del atleta se deriva de tag `level:*` en
      `Athlete.tags`. Si no tiene tag, muestra "Explorando" como default

---

### US-11: Perfil — Sección Cuerpo activa

**Como** atleta
**Quiero** registrar mis métricas corporales (peso, % grasa) y ver su evolución
**Para** correlacionar composición corporal con mi rendimiento deportivo

**Criterios de aceptación:**

- [ ] La sección "CUERPO" en Perfil muestra las últimas métricas de `BodyMetric`
      (ya existe en schema)
- [ ] El atleta puede registrar: peso (kg/lb según prefs), % grasa corporal,
      masa muscular
- [ ] Se muestra tendencia (↑↓→) vs la medición anterior del mismo tipo
- [ ] Si no hay métricas registradas, muestra CTA "Registra tu primera medición"
- [ ] El atleta puede borrar mediciones erróneas

---

### US-12: Logros — Narrativa con XP y tier

**Como** atleta
**Quiero** ver mis logros organizados por mi nivel actual (Principiante/Escalado/RX)
con un sistema de XP visible
**Para** entender qué conquistas son relevantes para mí y sentir progresión

**Criterios de aceptación:**

- [ ] El hero de `/atleta/logros` muestra: "Tu colección · Nivel [N] · [XP total] XP" + barra de progreso al siguiente nivel
- [ ] Los badges se muestran priorizados por `Badge.tier` del atleta actual;
      badges de tiers superiores se muestran al final como "teaser" (bloqueados
      con label "Desbloqueas en Escalado")
- [ ] `Badge.tier` es un nuevo campo en el schema (enum `BadgeTier`:
      PRINCIPIANTE, ESCALADO, RX). Badges sin tier aplican a todos.
- [ ] El contador "X/Y desbloqueados" filtra solo por badges del tier actual +
      generales
- [ ] Los badges próximos a desbloquear (progress.ratio > 0.6) aparecen primero
      dentro de su sección

---

### US-13: Logros — Compartir en Instagram

**Como** atleta
**Quiero** generar un asset visual de mi logro para compartirlo en Instagram
**Para** celebrar con mi comunidad y hacer crecer el alcance de Kronos

**Criterios de aceptación:**

- [ ] Cada badge desbloqueado tiene un CTA "Compartir logro"
- [ ] Al tocar, se genera un asset 1080×1920 (story) con: badge icon, nombre del
      atleta, nombre del logro, estadística relevante, logo Kronos + hashtag
      `#KronosFit`
- [ ] El asset se puede descargar directamente al carrete del teléfono
- [ ] También se genera variante 1080×1080 (feed)
- [ ] ⚠️ ASUNCIÓN: el asset se genera en canvas HTML5 en el cliente
      (no requiere servidor de imágenes). Si el resultado no es de calidad
      suficiente, evaluar server-side con Puppeteer.

---

### US-14: Logros — XP por badge y nivel atleta

**Como** atleta
**Quiero** que cada badge que desbloqueo me dé XP y suba mi nivel
**Para** sentir que cada conquista contribuye a algo mayor

**Criterios de aceptación:**

- [ ] Cada `Badge` tiene campo `xpReward` (Int, default 50)
- [ ] Al desbloquear un badge, se crea entrada en `XPLedger` con
      `reason: "badge_unlock"` y `sourceId: badgeId`
- [ ] El XP total del atleta es `SUM(xpLedger.amount)` donde `athleteId` coincide
- [ ] Niveles: 1 (0-299 XP), 2 (300-799 XP), 3 (800-1799 XP), 4 (1800-3499 XP),
      5 (3500+ XP). Las progresiones de skill también otorgan XP (100 XP c/u).
- [ ] El nivel se muestra en el hero de Logros y en el hero de Perfil

---

### US-15: Voz y tono adaptativo por tier

**Como** atleta de cualquier nivel
**Quiero** que la app me hable en un tono apropiado a mi experiencia
**Para** no sentirme ni intimidado (si soy principiante) ni subestimado (si soy RX)

**Criterios de aceptación:**

- [ ] Los textos de la app que varían por tier son: headline "Tu próxima victoria",
      mensajes READINESS, sugerencias de escala, insights del coach
- [ ] Principiante: "Vas muy bien — enfócate en [X] hoy" (motivacional, sin jerga)
- [ ] Escalado: "Tu [movimiento] tiene margen — considera subir el peso esta semana"
      (analítico, técnico pero accesible)
- [ ] RX: "Tu Fran está a [N] seg del top del box — este es el momento" (exigente,
      basado en datos reales del box)
- [ ] Los insights diarios usan templates por tier como baseline; si hay contexto
      suficiente (≥10 scores, skill activo, racha), Gemini enriquece el template
      con datos reales. Si Gemini falla → fallback automático al template

---

## Scope

### DO — V4 incluye

- Rediseño completo de `/atleta` (Home) con hero tipográfico + bifurcación con/sin-box
- Nueva pantalla `/atleta/skills` en bottom nav (4to tab, reemplaza uno existente)
- Refactor de `/atleta/perfil` a 5 secciones (adelgazar 11→5)
- Activación de `BodyMetric` en Perfil (UI + CRUD básico)
- Rediseño de `/atleta/logros` con XP hero + tier-gating + compartir Instagram
- Schema: `Badge.tier` (BadgeTier enum), `Badge.xpReward` (Int)
- Schema: `SkillCatalog` como constante JSON en `src/lib/skills/catalog.ts` (no BD)
- READINESS chip no-bloqueante en Home (usa Survey existente)
- TrophyStrip rediseñado (logro del mes curado)
- Plan IA integrado dentro de Skills (no pantalla separada)
- Programación personal básica: OCR de imagen/foto + entrada manual, scope 1 semana
- Logros compartibles: asset canvas cliente (story + feed)
- Voz y tono adaptativo por tier (templates + Gemini fallback)
- Placeholder visual de wearables en hero de Perfil (UI sin integración real)

### DON'T — V4 NO incluye

- Integración real con Apple Health / Google Fit / Whoop / Oura / Garmin (V5)
- Skill tree completo en BD con grafo real (V5 — V4 usa JSON estático)
- Programa de mes completo (V4 = 1 semana; V5 = mes con sync diario automático)
- Coach del box asignando skill goal al atleta (V4 = atleta lo elige solo)
- Retos sociales / challenges entre atletas (V5)
- Leaderboard de skills cross-box (V5)
- Nivel badge tier de badges en seed viejo — se mantienen como `tier: null` (todos los tiers)

---

## Diseño de módulos

### Módulo: SkillCatalog

- **Responsabilidad:** Catálogo estático de 10 skills con sus progresiones
- **Interfaz:**
  ```ts
  getSkillCatalog(): Skill[]
  getSkillById(id: string): Skill | undefined
  getProgressionStatus(athleteSkillLevels: AthleteSkillLevel[], skill: Skill): ProgressionStatus
  computeSkillProgress(athleteSkillLevels: AthleteSkillLevel[], skill: Skill): number // 0-100
  ```
- **Dependencias:** `AthleteSkillLevel` (schema existente), sin BD
- **Archivos:** `src/lib/skills/catalog.ts`, `src/lib/skills/types.ts`

---

### Módulo: SkillsPage

- **Responsabilidad:** 4ta pantalla atleta — skill activo + catálogo + plan IA
- **Interfaz:** `/atleta/skills` (GET), `/atleta/skills/[id]` (detail), `/atleta/skills/[id]/toggle` (POST — marcar progresión)
- **Dependencias:** SkillCatalog, `AthleteSkillLevel`, `getTop3PRPredictions` (AI existente), `getMyCoachCards` (existente)
- **Archivos:** `src/app/atleta/skills/page.tsx`, `src/app/atleta/skills/[id]/page.tsx`, `src/server/actions/skills.ts`

---

### Módulo: HomeRedesignV4

- **Responsabilidad:** Home bifurcado con-box/sin-box + hero tipográfico + READINESS chip
- **Interfaz:** `/atleta` (ya existe, se refactoriza)
- **Dependencias:** SkillCatalog, `getAthleteHome`, `hasRespondedToday`, `getActiveSurvey`, `listBadgesWithProgress` (para logro del mes)
- **Archivos:** `src/app/atleta/page.tsx` (refactor), `src/components/atleta/VictoryHero.tsx` (nuevo), `src/components/atleta/ReadinessChip.tsx` (nuevo), `src/components/atleta/TrophyStripV4.tsx` (nuevo)

---

### Módulo: PerfilV4

- **Responsabilidad:** Perfil atleta con 5 secciones, BodyMetric activo
- **Interfaz:** `/atleta/perfil` (refactor), `/api/atleta/body-metric` (nuevo CRUD)
- **Dependencias:** `getAthleteHome`, `listMyPRs`, `getMyCapabilityProfile`, `BodyMetric` (schema existente), `AthleteSkillLevel` (para tier badge)
- **Archivos:** `src/app/atleta/perfil/page.tsx` (refactor), `src/components/atleta/BodyMetricSection.tsx` (nuevo), `src/server/actions/body-metrics.ts` (nuevo)

---

### Módulo: LogrosV4

- **Responsabilidad:** Trophy room con XP hero, tier-gating, share Instagram
- **Interfaz:** `/atleta/logros` (refactor), `/atleta/logros/[code]` (detail + share)
- **Dependencias:** `listBadgesWithProgress` (existente), `XPLedger` (schema), `Badge.tier` (campo nuevo)
- **Archivos:** `src/app/atleta/logros/page.tsx` (refactor), `src/app/atleta/logros/[code]/page.tsx` (refactor + share), `src/components/atleta/XPHero.tsx` (nuevo), `src/components/atleta/BadgeShareCanvas.tsx` (nuevo)

---

### Módulo: BadgeTierMigration

- **Responsabilidad:** Añadir tier + xpReward a Badge + re-seed con tier
- **Interfaz:** Migración Prisma + seed actualizado
- **Dependencias:** `prisma/schema.prisma`, `prisma/seed.ts`
- **Archivos:** `prisma/migrations/YYYYMMDD_badge_tier/`, `prisma/seed.ts`

---

### Módulo: AthleteProgram (MVP)

- **Responsabilidad:** Carga y parsing de programa personal (1 semana) para atletas sin box
- **Interfaz:** `/atleta/programa` (nuevo), extiende `/atleta/wod/foto` OCR existente
- **Dependencias:** OCR existente (`wod/foto`), `WOD` model
- **Archivos:** `src/app/atleta/programa/page.tsx`, `src/server/actions/athlete-program.ts`

---

## Decisiones de implementación

| Decisión                               | Opción elegida                 | Razón                                                                                                                                                     |
| -------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Skill tree en BD vs JSON estático      | **JSON estático V4**           | Entrega la promesa visual sin migración pesada. Los 10 skills del JSON son el seed de BD en V5.                                                           |
| Tier del atleta                        | **`Athlete.tags` → `level:*`** | Ya existe en prefs. Se lee con `readPrefs()`. No requiere nuevo campo.                                                                                    |
| BadgeTier enum nuevo vs reusar Scaling | **Nuevo enum `BadgeTier`**     | `Scaling` es para scores (RX/SCALED/RXPLUS). Logros tienen su propio vocabulario.                                                                         |
| Wearables V4                           | **Placeholder UI**             | HealthKit/Google Fit requieren SDK nativo (React Native o Expo). Kronos V4 es Next.js PWA. Decisión real de arquitectura para V5 si se evalúa app nativa. |
| Asset de Instagram                     | **Canvas HTML5 cliente**       | Evita servidor de renders. Si calidad insuficiente → server-side con Puppeteer en V5.                                                                     |
| READINESS survey                       | **Chip no bloqueante**         | Survey bloqueante en apertura de app mata retención. Chip disponible todo el día.                                                                         |
| Plan IA                                | **Fusionado en Skills**        | La predicción de PR está directamente vinculada a qué skill estás trabajando. Sin skill contexto = dato huérfano.                                         |
| Voz y tono                             | **Mix IA + templates**         | Templates garantizan fallback. Gemini enriquece cuando hay contexto (≥10 scores).                                                                         |
| Idioma                                 | **Español mexicano (tú)**      | Audiencia primaria = México. Tratamiento `tú`, no `vos`.                                                                                                  |

---

## Cambios de schema requeridos

```prisma
// 1. Nuevo enum para tier de logros
enum BadgeTier {
  PRINCIPIANTE
  ESCALADO
  RX
}

// 2. Campos nuevos en Badge
model Badge {
  // ...campos existentes...
  tier      BadgeTier? // null = aplica a todos
  xpReward  Int        @default(50)
}

// 3. BodyMetric — ya existe, solo activar UI
// 4. AthleteSkillLevel — ya existe, usar para skill progress
// 5. XPLedger — ya existe, sumar para XP total
// 6. DailyMission — ya existe, considerar para V4 Skills tab
```

**Migración:** `pnpm db:push` en dev · generar migración formal para prod.

**Seed:** Actualizar `prisma/seed.ts` para incluir `xpReward` en todos los badges existentes. Los badges actuales quedan con `tier: null` (todos los tiers).

---

## Riesgos

| Riesgo                                                                                                                    | Probabilidad | Impacto | Mitigación                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------- | ------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `AthleteSkillLevel` estructura no cubre skills famosos (usa `movementSlug` + `progressionSlug` pero no hay catálogo base) | Media        | Alto    | JSON estático en `catalog.ts` define los slugs canónicos. `AthleteSkillLevel` los referencia. No requiere cambio de schema.             |
| Asset Instagram con Canvas HTML5 tiene calidad baja en móvil                                                              | Media        | Medio   | Probar en iOS Safari + Android Chrome antes de cerrar. Fallback: Puppeteer server-side.                                                 |
| Home rediseñada con hero tipográfico empuja NextBooking "abajo del fold" en pantallas pequeñas (375px)                    | Alta         | Medio   | Con-box: NextBooking SUBE por encima del hero (es lo más urgente para ese user). Sin-box: no hay NextBooking, hero ocupa primer tercio. |
| READINESS chip ignorado por atletas (baja tasa de respuesta)                                                              | Alta         | Bajo    | El chip es solo informacional — no bloquea. Si en 2 semanas <10% responde, evaluar incentivo XP.                                        |
| Programación personal OCR parsea mal formatos exóticos                                                                    | Alta         | Bajo    | Siempre disponible la opción manual como fallback. OCR es mejora, no requisito.                                                         |
| Wearables placeholder genera expectativas que V4 no cumple                                                                | Media        | Medio   | El chip dice "Conectar próximamente" — no "Conectado". Copy explícito de roadmap.                                                       |

---

## ⚠️ Asunciones — validar antes de cerrar

1. **Tier del atleta desde tags:** nivel del atleta se deriva de `Athlete.tags` con `readPrefs()` que retorna `level: "rx" | "scaled" | "beginner" | null`. Si null → muestra "Explorando". Este mapeo es el mismo de `ProfileConfigBlock` actual.

2. **"Logro del mes":** se define como el `Achievement` con `earnedAt` más reciente en el mes y año en curso. Si hay múltiples, el más reciente.

3. **XP por skill progression:** 100 XP por `AthleteSkillLevel` marcada como `ACHIEVED`. Primeras 10 progresiones = 1000 XP total, suficiente para Nivel 4. Escala razonable sin inflar.

4. **Skill JSON V4 lista de 10:** Handstand Walk, Muscle-Up Anillas, Muscle-Up Barra, Toes-to-Bar, Double-Under, HSPU, Pistol Squat, Ring Dip, Clean & Jerk técnico, Snatch técnico. ¿Falta alguno o hay que reordenar por dificultad?

5. **Bottom nav rediseñado:** la 4ta tab "Skills" reemplaza una existente. ¿Cuál sale? El nav actual (inferido del layout) parece ser Home / WOD / Reservar / Perfil. Propongo: **Home / Skills / WOD / Perfil** — Reservar pasa a estar dentro de Home (ya está con WeekStrip + NextBooking) y en `/atleta/reservar` directo.

6. **Asset Instagram client-side:** asume que el canvas puede generar imágenes de calidad suficiente sin servidor. Requiere prueba real en dispositivo antes de cerrarlo.

---

## Ramas abiertas — roadmap V5+

- Integración real Apple Health / Google Fit / Whoop / Oura / Garmin
- Skill tree completo en BD (grafo programático, no JSON hardcodeado)
- Programa de mes completo + sync WOD diario automático
- Coach del box asigna skill goal al atleta
- Retos sociales y challenges cross-atleta
- Leaderboard de skills global (cross-box)
- App nativa (Expo / React Native) para acceso a HealthKit real

---

## Siguiente paso

- [ ] **Samuel valida las 6 asunciones** (especialmente 4 y 5)
- [ ] `/prd-to-issues` para descomponer en vertical slices ejecutables
- [ ] Orden de mockups sugerido: **Skills** (nueva, define el norte) → **Home** (más visto) → **Logros** (cambio narrativo) → **Perfil** (poda de riesgo bajo)
