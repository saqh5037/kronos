# PRD: Coach Virtual + Skill Progression + Tips de Movimientos

**Status:** Draft
**Owner:** Samuel Quiroz
**Última edición:** 2026-05-09
**Origen:** Feedback en vivo desde iPad probando PR #14 (atleta self-serve frictionless flow)

## Contexto

Kronos hoy tiene 50+ movimientos seedeados con `name + slug + category + equipment` básicos. Los campos ricos del schema (`cues`, `commonMistakes`, `progressions`, `videoUrl`, `musclesWorked`, `difficulty`) están **vacíos en la mayoría**. El atleta busca un movimiento y solo ve el nombre — sin tips de técnica, sin "qué NO hacer", sin video, sin progresión.

Para atletas con coach humano (Box real) eso se compensa con la guía del coach. Para atletas en **Box Personal** (signup independiente, slug `me-*`, ~50% del growth proyectado), no hay nadie que guíe — y la app actual no llena ese vacío.

Samuel detectó esto probando la app en iPad y propuso 3 ideas que resuelven el mismo problema desde ángulos complementarios: información curada + sistema de progresión + análisis personalizado AI.

**El problema concreto:**

- Atleta busca "pull-ups" → ve solo el nombre. No sabe qué tiene que hacer/no hacer.
- Atleta no sabe qué movements puede ejecutar (¿pull-up con banda? ¿strict? ¿muscle-up?). No tiene un mapa de progresión.
- Atleta no recibe feedback proactivo: "estás estancado en X, probá esto".

## Objetivo

Convertir la pantalla de movimiento de un lookup vacío en un **coach virtual asincrónico** que combina contenido AI rico, progresiones desbloqueables tipo skill tree, y cards de análisis personalizado en el home — sin requerir coach humano.

## User Stories

### US-1: Búsqueda rica de movimientos con AI

**Como** atleta (Box Personal o real)
**Quiero** buscar "pull-ups" y obtener inmediatamente cues de técnica + qué NO hacer + video preciso
**Para** entender cómo ejecutar el movimiento sin necesidad de coach humano

**Criterios de aceptación:**

- [ ] En `/atleta/movimientos` hay un input de búsqueda con autocomplete (filtra por nombre)
- [ ] Click en movement → página `/atleta/movimientos/[slug]` con: nombre, categoría, músculos, dificultad, **cues** (lista bullets), **errores comunes** (lista bullets), **video YouTube embebido**
- [ ] Si el movement NO tiene contenido AI generado todavía → AI lo genera on-demand (Gemini) en <5s y guarda en BD para próximas consultas (cache permanente)
- [ ] El video se embed via iframe YouTube (no descarga). Para movements sin video curado, AI sugiere ID YouTube via búsqueda
- [ ] Si AI falla, fallback a placeholder + mensaje "Información en preparación, intentá más tarde"
- [ ] Cost gate: max 50 generaciones/día por tenant (cache permanente hace que el costo se amortice)

### US-2: Skill progressions como árbol desbloqueable

**Como** atleta
**Quiero** ver un árbol visual de progresiones de cada movement y marcar cuál puedo hacer
**Para** saber qué practicar y medir mi avance hacia versiones más avanzadas

**Criterios de aceptación:**

- [ ] Cada movement tiene un campo `progressions: Json` con un array ordenado de nodos: `{slug, name, description, prerequisites: string[]}`
- [ ] Para los 30 top movements (Fran movements + barbell big lifts + gimnásticos), las progresiones se pre-curan manualmente en seed
- [ ] Para el resto, AI genera el árbol on-demand (mismo flow que US-1)
- [ ] Nuevo modelo `AthleteSkillLevel { athleteId, movementSlug, currentNodeSlug, achievedAt, notes? }` para trackear nivel del atleta
- [ ] UI en `/atleta/movimientos/[slug]`: árbol visual donde cada nodo tiene 3 estados: `bloqueado` (gris), `actual` (lima glow), `dominado` (lima sólido check)
- [ ] Tap en un nodo → "¿Ya te sale este?" → marca como dominado o actual
- [ ] Sistema valida prerequisitos: no podés marcar "muscle-up" como actual si no marcaste "strict pull-up" como dominado

### US-3: Cards de coach virtual en home atleta

**Como** atleta
**Quiero** ver cards proactivas en mi home con análisis personalizado y sugerencias
**Para** sentir que tengo un coach que me observa aunque entrene solo

**Criterios de aceptación:**

- [ ] En `/atleta` (PersonalHomeView + Box real home), nueva sección "Tu coach esta semana" con 1-3 cards
- [ ] Tipos de cards (priorizadas por relevancia, máx 3 visibles):
  - **Estancamiento detectado**: "Tu PR de back squat lleva 30 días sin moverse. Probá esto: [sugerencia AI]"
  - **Próximo desbloqueo**: "Estás cerca de strict pull-up. Te faltan estas 2 progresiones."
  - **Patrón de evitación**: "Este mes loggeaste 0 movements de hombro. ¿Probamos shoulder press?"
  - **Celebración**: "PR nuevo en deadlift: +15kg. Top 25% del box." (Box real) / "+15kg en 2 meses, gran progresión." (Personal)
- [ ] Cards se generan con job async cada lunes 6am (cron) y se cachean por atleta para la semana
- [ ] AI input: scores últimos 90 días + PR progressions + skill levels + ranking del Box
- [ ] Cada card tiene CTA: link a movement detail, a `/atleta/wod/nuevo` con WOD pre-llenado, etc.
- [ ] Card dismissable (no vuelve a aparecer esa semana)

### US-4: Achievements de skill desbloqueado

**Como** atleta
**Quiero** desbloquear un badge cuando subo de nivel en un movement
**Para** sentir el avance y motivarme a seguir

**Criterios de aceptación:**

- [ ] Extender `Badge.criteria: Json` para soportar `{type: "SKILL_LEVEL_REACHED", movementSlug, nodeSlug}`
- [ ] Cuando el atleta marca un nodo como "dominado", evalúa si dispara badge correspondiente
- [ ] Seed inicial: badges para hitos clásicos — "Primer pull-up strict", "Primer muscle-up", "Primer handstand push-up", "300 lbs deadlift", etc.
- [ ] Toast lima al desbloquear + entrada en `/atleta/logros` con timestamp + (opcional) badge AI-generated copy

### US-5: Override manual de contenido AI (admin)

**Como** owner/coach de un Box real
**Quiero** poder editar el contenido AI generado de un movement (cues/video/progressions)
**Para** corregir alucinaciones o adaptar al estilo de mi box

**Criterios de aceptación:**

- [ ] En `/admin/movimientos/[id]`, vista del contenido actual (AI o manual) con botón "Editar"
- [ ] Form para editar: cues, commonMistakes, videoUrl, progressions JSON
- [ ] Campo `Movement.contentSource: enum { AI_GENERATED, MANUAL_OVERRIDE }` para no re-generar contenido editado
- [ ] Audit log al editar: quién, cuándo, snapshot anterior

## Scope

### DO (qué SÍ incluye)

- Página `/atleta/movimientos/[slug]` con contenido rico (cues + mistakes + video + progressions)
- AI generator on-demand para movements sin contenido curado, con cache permanente en BD
- 30 movements top pre-curados manualmente (no AI) en seed para máxima calidad
- YouTube embed de videos via iframe + AI search para sugerir ID cuando no hay curado
- Modelo `AthleteSkillLevel` + UI de árbol de progresiones interactivo
- Cards async de coach virtual en home atleta, generadas con cron semanal
- Badges nuevos por skill desbloqueado, integrados al sistema existente de `/atleta/logros`
- Override manual admin para corregir contenido AI

### DON'T (qué NO incluye, explícito)

- **NO chat conversacional** con AI ("preguntá al coach"). Solo cards async pre-generadas. (Razón: costo variable, hallucinations, UX mobile compleja).
- **NO video propio** (hosting Vimeo/CDN). Solo YouTube embed. (Razón: costo y mantenimiento).
- **NO coaching nutricional / recetas** ("recetas keto"). Scope estrictamente movimientos + entrenamiento.
- **NO recomendación de pesos específicos** ("hacé deadlift con 120kg"). Solo progresiones y técnica. (Razón: liability, requiere assessment físico real).
- **NO detection de form via foto/video del atleta**. Solo contenido informativo. (Razón: scope masivo, requiere pose detection).
- **NO planes de competencia** (preparación CrossFit Open, etc). Eso es V2.
- **NO leaderboards de skill levels entre atletas del Box**. Skill level es privado del atleta. (Razón: gamification negativa puede desalentar principiantes).

## Diseño de módulos

### Módulo: MovementContent (AI-generated content layer)

- **Responsabilidad:** Generar y cachear contenido rico de cada movement (cues, mistakes, video YouTube, progressions). Reusar contenido cacheado en BD.
- **Interfaz:**
  - `getMovementContent(movementSlug): Promise<MovementContent>` — lookup en BD; si vacío, dispara generación AI + guarda + retorna
  - `regenerateMovementContent(movementSlug): Promise<MovementContent>` — fuerza regeneración (admin only)
  - `searchYoutubeForMovement(movementName): Promise<YoutubeVideoId>` — AI helper que busca video preciso
- **Dependencias:** Gemini 2.0 Flash (`GEMINI_API_KEY`), modelo `Movement`, rate-limit (`/lib/rate-limit.ts`)
- **Archivos nuevos:**
  - `src/server/ai/movement-content.ts`
  - `src/server/actions/movement-content.ts`

### Módulo: SkillProgressions (skill tree)

- **Responsabilidad:** Modelar y trackear el progreso del atleta en sub-progresiones de cada movement. Validar prerequisites.
- **Interfaz:**
  - `getMovementProgressions(movementSlug): ProgressionNode[]` — lee del JSON del movement
  - `getMyLevelInMovement(movementSlug): AthleteSkillLevel | null`
  - `markNodeAchieved(movementSlug, nodeSlug): Promise<{ok, badgeUnlocked?}>`
  - `getRecommendedNextProgressions(athleteId): ProgressionNode[]` — para el coach virtual
- **Dependencias:** Modelo `AthleteSkillLevel` (nuevo), `Movement.progressions`, `Achievement` (existente)
- **Archivos nuevos:**
  - `src/server/actions/skill-levels.ts`
  - `src/lib/skill-tree.ts` (helpers puros)

### Módulo: CoachCards (análisis async semanal)

- **Responsabilidad:** Generar cards de insights personalizados para cada atleta una vez por semana. Cache hasta el próximo lunes.
- **Interfaz:**
  - `getMyCoachCards(): CoachCard[]` — lookup cacheadas o trigger generation
  - `generateCoachCardsForAthlete(athleteId): Promise<CoachCard[]>` — pipeline AI con context completo del atleta
  - `dismissCard(cardId): Promise<void>`
- **Tipos de cards:** `STAGNATION | NEXT_UNLOCK | AVOIDANCE_PATTERN | CELEBRATION`
- **Dependencias:** `MovementProfile` analytics (existente), `AthleteSkillLevel`, Gemini, modelo `CoachCard` (nuevo)
- **Archivos nuevos:**
  - `src/server/actions/coach-cards.ts`
  - `src/server/ai/coach-cards-prompt.ts`
  - `src/components/atleta/CoachCardsSection.tsx`
  - `src/app/api/cron/generate-coach-cards/route.ts` (cron Vercel friendly)

### Módulo: MovementSearch (UI atleta)

- **Responsabilidad:** Página de catálogo y detalle de movements para el atleta.
- **Interfaz:** Pages Next.js
  - `/atleta/movimientos` (lista + búsqueda)
  - `/atleta/movimientos/[slug]` (detalle con MovementContent + SkillTree + AchievementsRelated)
- **Dependencias:** `MovementContent`, `SkillProgressions`, `listMovements()` (existente)
- **Archivos nuevos/modificados:**
  - `src/app/atleta/movimientos/[slug]/page.tsx` (nuevo, hoy redirect)
  - `src/app/atleta/movimientos/page.tsx` (modificar: agregar search input)
  - `src/components/atleta/MovementContentCard.tsx`
  - `src/components/atleta/SkillTree.tsx`

### Módulo: AdminMovementOverride

- **Responsabilidad:** UI admin para curar/corregir contenido de movements. Acepta override manual de contenido AI.
- **Interfaz:** Pages Next.js
  - `/admin/movimientos/[id]/contenido` (nueva pestaña en movement detail)
- **Dependencias:** `MovementContent.regenerateMovementContent`, `Movement.contentSource`
- **Archivos nuevos:**
  - `src/app/admin/movimientos/[id]/contenido/page.tsx`
  - `src/server/actions/admin-movement-content.ts`

## Decisiones de implementación

| Decisión                   | Opción elegida                                                           | Razón                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Curación de contenido      | 100% AI on-demand con cache permanente                                   | Cobertura total + costo amortizado. Una sola generación por movement por tenant.                                  |
| Source de videos           | YouTube embed (manual + AI search fallback)                              | Gratis, calidad alta de canales serios. Iframe simple, cero hosting.                                              |
| Taxonomía skill levels     | Sub-progresiones por movement (árbol)                                    | Más accionable: enseña el camino concreto, no solo etiqueta. Más motivacional ("desbloqueé X").                   |
| Forma del coach virtual    | Cards async pre-generadas semanalmente                                   | Costo predecible (~\$0.05/atleta/semana). Sin risk de hallucinations en chat. UX mobile simple.                   |
| AI provider                | Gemini 2.0 Flash (`gemini-2.0-flash`)                                    | Ya cabledo en el proyecto (whiteboard OCR + getDailyGreeting). Multimodal si después agregamos análisis de fotos. |
| Storage progressions       | `Movement.progressions: Json` (campo ya existe)                          | Schema-light. No requiere tabla nueva. Validación con Zod en runtime.                                             |
| Storage skill level atleta | Tabla nueva `AthleteSkillLevel`                                          | Permite query eficiente "qué movements tiene el atleta en X estado".                                              |
| Cache cards coach          | Tabla `CoachCard` con `validUntil: Date`                                 | Persistente entre requests. Permite dismiss + regenerate manual.                                                  |
| Cron de cards              | `/api/cron/generate-coach-cards` con Vercel Cron `0 6 * * 1` (lunes 6am) | Mismo patrón que `/api/cron/dispatch-announcements` existente.                                                    |
| Rate limit AI generation   | 50 movements/día/tenant + 5 cards-regen/día/atleta                       | Cap diario para evitar abuso. Cache hace que en práctica se llegue raras veces.                                   |
| Cost gate global           | Tracking de tokens en metadata audit                                     | Si tenant excede, mostrar mensaje "Información en preparación".                                                   |
| Multi-tenancy              | `MovementContent` por `(tenantId, movementSlug)`                         | Permite override per-box (mismo movement, contenido diferente por box).                                           |

## Riesgos

| Riesgo                                                                | Probabilidad | Impacto              | Mitigación                                                                                                                                                                                                                         |
| --------------------------------------------------------------------- | ------------ | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AI hallucinations en cues técnicos (info incorrecta peligrosa)        | Media        | **Alto** (liability) | Disclaimer visible en footer "Información generada con IA, consultá un coach certificado para casos específicos". Override admin para corregir. Pre-curar top 30 movements críticos manualmente — los AI solo cubren el long tail. |
| Video YouTube embebido eliminado por el dueño del canal               | Media        | Medio                | Detectar broken embed con health check periódico. Fallback a placeholder + trigger AI search nuevo video.                                                                                                                          |
| Cost overrun de Gemini si abuso de generación                         | Baja         | Medio                | Rate limit 50/día/tenant. Audit de tokens. Alarma si tenant >$5/mes (no debería pasar con cache).                                                                                                                                  |
| Cards de coach se sienten genéricas/repetitivas                       | Media        | Medio                | Variedad de tipos (4+). Prompt con contexto rico (PRs, skill levels, frecuencia). Iterar con feedback de usuarios. Dismissable para no molestar.                                                                                   |
| Atletas se desmotivan al ver árbol con muchas progresiones bloqueadas | Baja         | Medio                | Highlight la progresión "siguiente alcanzable" con CTA accionable. Esconder progresiones >2 niveles arriba del actual.                                                                                                             |
| Migration de `AthleteSkillLevel` falla en prod con datos              | Baja         | Bajo                 | Tabla nueva, sin foreign keys hacia tablas grandes. `pnpm db:push` standard.                                                                                                                                                       |
| Skill levels se pierden si admin re-genera contenido AI               | Media        | Bajo                 | `AthleteSkillLevel.currentNodeSlug` apunta a slug, no a ID. Si admin renombra slugs en progressions, validamos antes y migramos.                                                                                                   |
| Coach cards generados los lunes no llegan si Vercel Cron falla        | Baja         | Bajo                 | Trigger manual `getMyCoachCards()` también dispara generation si no hay cache. Self-healing.                                                                                                                                       |

## Estimación

**Vertical slices (cada uno mergeable independiente):**

1. **Slice MOV-1**: MovementContent AI generator + página `/atleta/movimientos/[slug]` con cues/mistakes/video — ~12 archivos, 2-3 sesiones
2. **Slice MOV-2**: Curación manual top 30 movements (seed actualizado) — ~3 archivos, 1 sesión + tiempo de contenido
3. **Slice SKILL-1**: Schema `AthleteSkillLevel` + helpers + UI árbol básico (sin AI generation de progressions) — ~8 archivos, 2 sesiones
4. **Slice SKILL-2**: AI generation de progressions on-demand para movements sin curar — ~4 archivos, 1 sesión
5. **Slice COACH-1**: Modelo `CoachCard` + generador AI + cron + UI section en home — ~10 archivos, 2-3 sesiones
6. **Slice ACHIEVE-1**: Badges nuevos por skill unlock + integration con `/atleta/logros` — ~5 archivos, 1 sesión
7. **Slice ADMIN-1**: Override manual admin de contenido — ~4 archivos, 1 sesión

**Total estimado:** 7 slices, ~46 archivos, 10-12 sesiones de trabajo. Cada slice es PR independiente.

## Asunciones a validar con Samuel

⚠️ **ASUNCIÓN 1**: Top 30 movements pre-curados serán: Fran (pull-up, thruster), Murph (pull-up, push-up, squat, run), big lifts (back squat, front squat, deadlift, bench press, overhead press, snatch, clean, jerk), gimnásticos (handstand push-up, muscle-up, toes-to-bar, double under, rope climb), accesorios (kb swing, box jump, wall ball, burpee, lunge, row, ghd sit-up, pistol). ¿Validás esta lista o cambiamos el corte?

⚠️ **ASUNCIÓN 2**: Coach cards se generan los lunes a las 6am (cron). Si el atleta entra antes del cron del lunes, ve las cards de la semana pasada. ¿OK o querés generar también on-demand al primer view de la semana?

⚠️ **ASUNCIÓN 3**: Override manual admin solo es para Box reales (owner/coach). Box Personal NO puede editar contenido (es 1 atleta solo, no aporta). ¿OK?

⚠️ **ASUNCIÓN 4**: El árbol de progresiones se muestra como vista vertical mobile-first (no horizontal tipo skill tree de juego). En desktop, mismo layout vertical (consistente con el resto de la app atleta). ¿OK o vas por algo más rico?

⚠️ **ASUNCIÓN 5**: Disclaimer "información generada con IA" visible en cada movement detail page. Footer pequeño tipo "Generado con IA · consultá un coach para casos específicos". ¿Aprobás el copy o lo querés más fuerte/más suave?

## Siguiente paso

- [ ] Validar las 5 asunciones arriba con Samuel antes de descomponer en issues
- [ ] `/prd-to-issues` para descomponer las 7 vertical slices en issues GitHub ejecutables
- [ ] Considerar arrancar por **Slice MOV-1 + Slice MOV-2** primero como MVP atómico que ya entrega valor (atleta busca pull-up y obtiene info rica) — el resto se puede entregar en olas
