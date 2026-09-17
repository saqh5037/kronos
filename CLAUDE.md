# CLAUDE.md — Kronos

Proyecto: `/Users/samuelquiroz/Documents/proyectos/kronos`

SaaS multi-tenant para boxes de CrossFit (México). Next.js 15 App Router +
Prisma 6 + NextAuth 4 + PostgreSQL. Dos productos en un repo: el panel del Box
(`/admin`) y la app del atleta (`/atleta`, PWA), más landing pública, modo TV y
super-admin de plataforma.

Fuente de verdad de este documento: `docs/audit/2026-09-15-kronos-producto/`
(inventario de código, auditoría de 264 pantallas, benchmark, roadmap y
`08-fase0-audit.md`, la auditoría de entrega de la fase 0 con su ola de fixes).

## Estado actual — 2026-09-16

| Rama                        | Qué es                                                                                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main`                      | `808fbac` (2026-06-10). Producto en pausa desde junio; salud de build verde.                                                                                        |
| `rebuild/base`              | `1f63ead` (2026-09-16). Rama de integración de la fase 0. **PR #49 → `main`, abierto.** 7 commits por delante de `origin/rebuild/base` (`f372561`) — falta el push. |
| `audit/2026-09-15-producto` | `9932b09`. Solo evidencia de la auditoría. **PR #48 → `main`, abierto**; queda vacío cuando #49 aterrice.                                                           |
| `rebuild/w0-*`              | Ya no existen. Los once worktrees de la ola 0 se mergearon a `rebuild/base` y sus ramas se borraron local y en `origin` el 2026-09-16.                              |

Salud verificada en `rebuild/base @ 1f63ead` (2026-09-16):

- `pnpm typecheck` ✅ · `pnpm lint` ✅ (2 warnings de `no-img-element`, ambos en
  `src/app/atleta/wod/foto/PhotoWodFlow.tsx`) · `pnpm test` ✅
- **171 archivos vitest / 2378 tests**, verde con la `TZ` por defecto y con
  `TZ=America/Mexico_City`. Los 5 de `tests/integration/` (27 tests) quedan
  fuera del run default: necesitan Postgres real → `pnpm test:integration`.
- 28 specs Playwright en `e2e/`, incluido `e2e/axe.spec.ts`. **Ya corren en CI**,
  pero no en cada push (ver "Comandos").
- `pnpm build`: 114 rutas.
- `src/` 813 archivos TS/TSX · 53 modelos Prisma · `src/app/globals.css` 2,167
  líneas · `src/app/(landing)/landing.css` 2,080.
- Ratchet de axe sobre las 14 pantallas auditadas: **0 nodos de violación,
  0 de contraste** (`e2e/fixtures/axe-baseline.json`).

El diagnóstico de la auditoría de septiembre sigue de pie: **la ingeniería está
verde, el problema es producto y diseño.** El plan por fases vive en
`docs/audit/2026-09-15-kronos-producto/07-roadmap.md` y es el único backlog
vigente; lo que la ola de fixes cerró y lo que quedó pendiente está en
`08-fase0-audit.md` §8.

## Modelo de trabajo: worktrees con ownership (reemplaza "Lane discipline")

La vieja tabla de lanes ("backend = Claude, UI = Kimi") ya no describe nada:
`src/app/**` y `src/server/**` se co-editan en el mismo cambio. El modelo nuevo
es aislamiento por **worktree + ownership de rutas**.

```bash
git worktree add ../kronos-<feature> -b <rama>
```

Reglas duras:

1. **Cada agente edita solo sus rutas.** Si necesitas un cambio fuera de tu
   ownership, lo **describes en el reporte final**; no lo tocas.
2. **Un solo escritor por archivo.** Nada de dos agentes sobre el mismo `.tsx`.
   Lectores read-only sí van en paralelo.
3. `package.json`, `pnpm-lock.yaml` y `prisma/schema.prisma` son de la rama base
   (`rebuild/base`). Ningún worktree de fase los toca — por eso `lucide-react`
   se instaló ahí antes de abrir los once de la ola 0.
4. **Foreground siempre para escritores.** Nunca `run_in_background` en un
   agente que escribe: el padre no puede razonar sobre un árbol que cambia
   debajo. Background solo para lectura/exploración.
5. Al cerrar: `pnpm typecheck && pnpm lint && pnpm test` verde antes de push.

## Comandos

```bash
pnpm dev                 # Dev server :3000
pnpm build               # Build producción
pnpm typecheck           # tsc --noEmit
pnpm lint                # ESLint (next/core-web-vitals + next/typescript)
pnpm test                # Vitest unit (171 archivos / 2378 tests)
pnpm test:integration    # Vitest integration (5 archivos) — requiere Postgres real
pnpm test:e2e            # Playwright, 28 specs (requiere pnpm db:seed previo)
pnpm test:e2e:axe        # Solo el ratchet de accesibilidad (e2e/axe.spec.ts)
pnpm test:e2e:axe:update # Reescribe e2e/fixtures/axe-baseline.json con lo medido

pnpm db:push             # Push schema (dev — sin migraciones)
pnpm db:seed             # Box "Iron Hands", atletas, WODs, clases, badges
pnpm db:seed:ops         # Capa operativa (pagos, membresías, anuncios)
pnpm db:seed:story       # Historia de un atleta (scores, PRs, racha)
pnpm db:studio           # Prisma Studio

docker compose up -d db  # Postgres :5434  (NO :5432)

pnpm exec tsx scripts/guards/update-baseline.ts   # ratchet de los guards
```

CI (`.github/workflows/ci.yml`), dos jobs:

- **`quality`** — en cada push y PR a `main` / `rebuild/base`: `typecheck`,
  `lint`, `pnpm test` (los guards viajan adentro, son vitest normales) y
  `pnpm build`. El build está ahí porque `tsc --noEmit` no ve lo que sí ve
  `next build`: firmas de ruta, `typedRoutes`, frontera server/client y la
  metadata API.
- **`e2e`** — integration (Postgres 16 de servicio en `:5434`, tres seeds) +
  Playwright. **No corre en cada push**: nightly a las 08:00 UTC (02:00 CDMX),
  `workflow_dispatch` manual, o un PR con la etiqueta **`run-e2e`** — así se
  pide en un cambio que toca reservas, auth o tenancy.

Hay además un workflow `lighthouse.yml`, pero hoy no cierra nada:
`lighthouserc.json` tiene todas sus aserciones en `warn`.

## Stack

Next.js 15 (App Router, `typedRoutes`) · TypeScript strict · Prisma 6 +
PostgreSQL `:5434` · NextAuth 4 (JWT, sesión 90 días) · Tailwind 3 + tokens
`--k-*` en `globals.css` · framer-motion 11 vía `LazyMotion` (61 archivos, todos
importan `m`, ninguno usa `motion.*`) · Recharts 3 detrás de `next/dynamic` ·
`lucide-react` (sistema de iconos oficial) · Zod en `src/lib/validations/` ·
Vitest + Playwright · **Sentry y PostHog activos** (no "cableados sin eventos":
`src/lib/analytics.ts` emite 12 eventos tipados y `reportError` corre en
webhooks y actions).

Sin shadcn/ui: `src/components/ui/` tiene un solo archivo (`ConfirmDialog.tsx`).
No hay capa de primitivos — es deuda conocida, no una decisión.

## Dominio: qué está construido de verdad

| Área                                  | Estado         | Nota que importa                                                                                                                                                                                                                                                                                |
| ------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth & onboarding                     | BUILT          | Magic link, **OTP de 6 dígitos**, Google (env-gated), password, dev-login. Gate de onboarding del atleta en **DB**, no en el JWT.                                                                                                                                                               |
| Multi-tenancy + RBAC                  | BUILT          | `withTenant(` aparece 156 veces en `src/`, y desde `5d1d06f` intercepta 17 métodos de delegate. `PermissionGrantRequest` se escribe pero **no tiene UI de aprobación** (STUB).                                                                                                                  |
| **SaaS billing** (el Box paga)        | BUILT, parcial | Solo Mercado Pago; `confirmCheckoutMock` es el camino en uso. El cargo recurrente real (preapproval) **no está cableado**. **Stripe no existe** — solo el valor de enum.                                                                                                                        |
| Pagos de atletas                      | BUILT          | **Mercado Pago + efectivo, nada más.** Sin OXXO, SPEI ni CFDI.                                                                                                                                                                                                                                  |
| Clases, reservas, waitlist, check-in  | BUILT          | `decideBooking`, promoción FIFO de waitlist, no-show, bulk check-in.                                                                                                                                                                                                                            |
| WODs, movimientos, whiteboard         | BUILT          | OCR de pizarra con Gemini Vision + cruce con roster. **Editor Hyrox = STUB** declarado.                                                                                                                                                                                                         |
| Scores, PRs, leaderboards, BodyMetric | BUILT          | `detectPR`, percentiles, tonelaje, radar de capacidades.                                                                                                                                                                                                                                        |
| Gamificación + skills                 | BUILT          | Badges, XPLedger, rachas, skill tree, plan IA por objetivo. `DailyMission` sigue siendo **schema sin código** (solo aparece en `prisma/`). `AchievementToastHost` ya está montado en `src/app/layout.tsx:103`.                                                                                  |
| **Wearables (Whoop)**                 | PARTIAL        | OAuth, vault de tokens cifrados, webhook HMAC y cron siguen ahí. La UI ya existe: `DevicesCard` (conectar/reconectar, estado, última sincronización) en `/atleta/salud` y `/atleta/ajustes`. Lo que **sigue sin consumidor** son las muestras: nada renderiza sueño ni recuperación.            |
| IA (Gemini)                           | BUILT          | 7 flujos: OCR pizarra, foto-WOD, saludo del día, predicción de PR, plan de entrenamiento, análisis de forma, CoachCards. Todos con fallback determinista.                                                                                                                                       |
| Comunicaciones + PWA push             | BUILT          | Anuncios con cron, notificaciones in-app, web-push (VAPID), encuestas, 7 templates de email, digest semanal del owner.                                                                                                                                                                          |
| Eventos / competencias                | PARTIAL        | Lectura e inscripción sí; **no existe create/update de `SportEvent` en el código** — se insertan a mano en BD.                                                                                                                                                                                  |
| TV mode, reportes, auditoría, alertas | BUILT          | `/tv/[slug]`, churn risk, timeline de auditoría, reglas de alerta.                                                                                                                                                                                                                              |
| Landing / legal                       | BUILT          | El truth gap P0 se cerró en `b579f1d`: `src/lib/branding` y los legales ya no mencionan Stripe, OXXO, SPEI, CFDI ni LATAM, la promesa de subdominio/dominio propio se movió al bloque de roadmap y el FAQ de Hyrox dice lo que el stub entrega. Lo defiende `tests/unit/landing-truth.test.ts`. |
| i18n                                  | MISSING        | Todo el copy es español hardcodeado. `Box.locale`/`currency` solo alimentan `Intl`.                                                                                                                                                                                                             |
| Personal-box / atleta independiente   | BUILT          | `/atleta-signup` crea un box personal (slug `me-*`) y cambia el modo de la UI. Línea de producto B2C completa.                                                                                                                                                                                  |
| Super-admin de plataforma             | BUILT          | Allowlist `SUPER_ADMIN_EMAILS` + gate de render y de RPC. Provisión de pilotos.                                                                                                                                                                                                                 |

## Regla cardinal: multi-tenancy

**SIEMPRE** `withTenant(tenantId)`. NUNCA `db.athlete.findMany()` directo.

```typescript
const db = withTenant(session.user.tenantId);
const athletes = await db.athlete.findMany();

// Única excepción — lookup de Box durante auth
const box = await db.box.findUnique({ where: { slug } });
```

El tenant viene de `session.user.tenantId` (JWT, callback de auth). El
`AsyncLocalStorage` de `src/server/tenant.ts` es vestigial: los call sites pasan
el `tenantId` explícito.

Qué cubre `withTenant()` (desde `5d1d06f`, `src/server/db.ts`):

- La extensión se **genera** desde `TENANT_SCOPED_METHODS`, un mapa de **17
  métodos** de delegate → dónde se inyecta el `tenantId`: `where` para
  `findMany`, `findFirst`, `findFirstOrThrow`, `findUnique`,
  `findUniqueOrThrow`, `count`, `aggregate`, `groupBy`, `update`, `updateMany`,
  `updateManyAndReturn`, `delete`, `deleteMany`; `data` para `create`;
  `dataList` para `createMany` y `createManyAndReturn`; y ambos para `upsert`.
  Antes eran 7, y por eso `/admin/reportes` agregaba con `groupBy` sobre toda la
  base: "Top WODs" y "Top atletas por asistencia" leían todos los boxes.
- Los modelos que **no tienen** `tenantId` se saltan a propósito; agregar el
  campo a uno nuevo lo mete al alcance solo.
- `tests/unit/with-tenant-coverage.test.ts` enumera los métodos del delegate y
  falla si aparece uno sin interceptar, y trae un ratchet que prohíbe usar el
  cliente crudo (`prismaBase.`) fuera de `db.ts` y del lookup de Box en auth.

Invariante que no se negocia: `public/sw.js` (`kronos-shell-v4`) fuerza
network-only en `/api/*`, `/admin*`, `/atleta*`, `/uploads*`, `/invitacion*`,
`/invitacion-staff*`, `/eventos*` y `/tv*`. El fix original es la fuga de caché
cross-tenant del 2026-05-17; `/eventos` y `/tv` se sumaron en la ola del
2026-09-16 (caían a `networkFirst`, que guardaba la inscripción del atleta y el
roster/leaderboard del box en el caché del shell). No lo relajes:
`tests/unit/sw-network-only.test.ts` verifica la lista y que `CACHE_VERSION`
suba cuando cambia.

## Zona horaria (regla dura)

El día civil del box no es el día civil del servidor. `src/lib/tz.ts` es el
único lugar que hace esa cuenta (`DEFAULT_BOX_TIMEZONE = "America/Mexico_City"`)
y `src/lib/dates.ts` y `src/lib/format.ts` se apoyan en él. Todo lo que el
producto muestre —fechas, horas, ventanas de periodo, deadlines, anclas de
semana— pasa por ahí.

- **NUNCA** `toLocaleDateString()` / `toLocaleTimeString()` / `toLocaleString()`
  pelones. El guard `to-locale-string` los caza en `src/app/**`,
  `src/components/**` y `src/server/email-templates/**`, y está en cero.
  `src/lib` queda fuera del escaneo a propósito: ahí viven los formateadores.
- **NUNCA** `new Intl.DateTimeFormat(...)` sin `timeZone` explícito. Esa forma
  es **invisible** para el guard, así que es disciplina, no ratchet.
- Los tests corren con `process.env.TZ ??= "UTC"` desde
  `tests/setup/timezone.ts`. Una suite que solo pasa en `America/Mexico_City`
  está mintiendo: `pnpm test` tiene que ser verde en UTC y en CDMX.

## Archivos clave

```
src/server/
  db.ts              — prismaBase + extensión withTenant()
  auth.ts            — NextAuth (JWT); auth-dev.ts, auth-password.ts, otp.ts
  permissions.ts     — can(action, session)
  actions/           — server actions por dominio
  ocr/               — whiteboard.ts, photo-wod.ts (Gemini Vision)
  analytics/         — rankings, tonnage, churn, coach-insights
src/lib/
  labels.ts          — enum Prisma → etiqueta es-MX  (frontera de presentación)
  format.ts          — formatMoney/formatMXN, formatDateFull/MonthYear/Decimal,
                       deltas con signo, fechas/horas es-MX 24h
  tz.ts              — día civil en la zona del box; DEFAULT_BOX_TIMEZONE
  dates.ts           — ventanas de periodo y deadlines, montadas sobre tz.ts
  week.ts            — ancla de semana zone-safe
  ai/gemini-client.ts— cliente único de IA con cache + retries
  features.ts        — feature flags por Box
src/middleware.ts    — role routing + redirect de trial/expirado + rate limit
prisma/schema.prisma — 53 modelos
```

## Design system — la verdad, no el ideal

Paleta lima neon monocromática, dark-only forzado (`forcedTheme="dark"`).
Tokens canónicos en `src/app/globals.css`:

- `--k-bg #08080a` · `--k-surface #0f1014` · `--k-elevated #14141a`
- `--k-line #1c1c24` · `--k-line-2 #26262e`
- `--k-t1 #f5f5f7` · `--k-t2 #8a8a94` · **`--k-t3 #7d7d87`** — el valor más
  oscuro de la rampa que pasa AA en las **tres** superficies: 4.91:1 sobre
  `--k-bg`, 4.67:1 sobre `--k-surface`, 4.50:1 sobre `--k-elevated`. Salió de
  `#54545c` (2.67:1, reprobaba hasta el piso de texto grande) y pasó por
  `#7a7a84`, que solo pasaba sobre el fondo y fallaba justo adentro de las
  `.k-card`, que es donde vive casi toda su ocupación. La matriz completa la
  enforza `tests/unit/atleta-infra-contrast.test.ts`.
- **`--k-t4 #36363c` es decoración, nunca texto**: mide 1.63:1 sobre `--k-bg`.
  Se usaba como encabezado de sección del sidebar de admin y axe lo marcaba en
  todas las pantallas del owner. El texto se detiene en `--k-t3`.
- `--k-accent #c8ff2d` (único color de marca) · `--k-accent-press #a8d726` ·
  `--k-accent-on #08080a` · `--k-accent-soft` · `--k-accent-line` · `--k-accent-glow`
- `--k-warning #ffb020` y `--k-danger #ff5a5a` — **solo semánticos reales**
- `--k-font-display` IBM Plex Mono · `--k-font-body` Inter

Clases utilitarias: `k-card`(`-featured`/`-ghost`/`-flat`), `k-btn-grad`,
`k-btn-ghost`, `k-chip*`, `k-eyebrow`, `k-mono`, `k-tap`, `k-skeleton`.

Cuatro reglas de casa:

1. **Iconos: `lucide-react`.** Nunca emoji, nunca flechas unicode como
   affordance, nunca códigos de dos letras como glifo. La auditoría encontró
   emoji-como-icono en 71 archivos (S7); hoy `emoji-in-jsx` está en cero y
   `unicode-glyph` conserva 6 puntos justificados (la máscara del `OtpInput`).
2. **Enums nunca crudos en la UI.** Todo chip, celda u opción que muestre un
   valor de enum pasa por `label(...)` o un mapa tipado de `src/lib/labels.ts`.
   `tests/unit/labels-format.test.ts` verifica que cada enum de Prisma tenga
   etiqueta, así que un valor nuevo rompe el build hasta que lo etiquetes.
3. **Dinero, fechas y horas por `src/lib/format.ts`.** Un solo estilo de moneda,
   `es-MX`, 24h en todo el admin.
4. **Color = cosa distinta; opacidad = intensidad.** Para low/mid/high usa
   opacidad del acento, no naranja/rojo — con datos reales medio dataset cae en
   rango "warning" y el monocromático se rompe:

   ```tsx
   style={{ background: "var(--k-accent)", opacity: score >= 70 ? 1 : score >= 40 ? 0.7 : 0.4 }}
   ```

   Naranja y rojo se reservan para warning y error de verdad.

Deuda viva del sistema, medida el 2026-09-16:

- El bloque `COMPATIBILIDAD V3` **sigue al final de `globals.css`**
  (línea 2062) mapeando los nombres legacy (`--text`, `--card`, `--line`,
  `--bg`, `--red`, `--blue`…) a los `--k-*`. Lo que cambió es quién lo consume:
  de los 813 archivos TS/TSX de `src/`, **ninguno** usa ya
  `var(--text|--card|--line|--bg|--grad|--moss|--fire|--text-2)`; el único
  archivo que los menciona es el propio `globals.css`. Los alias de Tailwind
  (`text-text`, `text-text-2`, `text-text-3`) también salieron de
  `tailwind.config.ts`. El bloque es hoy una red de seguridad sin clientes:
  borrarlo es un paso de limpieza, no una migración.
- **2,906 objetos `style={{}}` inline** conviviendo con Tailwind. Ese es el
  número que no baja.
- `ThemeToggle` **ya no existe** (borrado en la ola 0; el tema sigue forzado a
  dark).
- Navegación del atleta: quedan **dos**, no tres — el `TabBar`
  (`src/components/kronos/TabBar.tsx`, ya en lucide) y el drawer que solo se
  monta debajo de `lg`. En admin, `SidebarGate` monta el `AdminSidebar`
  responsive solo debajo de `lg`, porque `/admin` dibuja su propio sidebar
  adentro de `AdminDashboardV3`.
- `AdminDashboardV3` sigue siendo un rediseño de fase 1 apoyado en el layout
  viejo. No es el estado deseado.

## Dialecto (regla dura)

**Español mexicano neutro.** Cero voseo rioplatense: nada de `tenés`, `querés`,
`podés`, `mantené`, `recibís`, `Subí`, `cancelás`, `pedile`, `acá`, `dale`,
`fijate`, `acordate`.

Reemplazos: `tenés → tienes` · `podés → puedes` · `acá → aquí` ·
`mantené → mantén` · `Subí → Sube` · `pedile → pídele` · `dale → va / sale`.

Aplica también a comentarios de código y **a los prompts de IA**: un prompt
escrito en voseo le enseña al modelo a contestarle al atleta en voseo (fue el
caso de `src/server/ai/coach-cards-prompt.ts`).

Y nunca notas de desarrollo en rutas de producto: "proveedor mockeado en Fase 1"
o "configura la variable MERCADOPAGO_ACCESS_TOKEN" no se le muestran a un owner.
Si el estado es demo, es un banner dev-only, no copy.

## Guards (ratchets) — `pnpm test`

Todos son archivos vitest normales, así que viajan en el job `quality` de CI sin
configuración extra.

### El ratchet de patrones

Las siete reglas de `scripts/guards/rules.ts` se corren desde dos tests:

| Archivo                            | Reglas                                                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| `tests/unit/dialect-guard.test.ts` | `voseo` — todo `src/**`                                                                            |
| `tests/unit/ui-guards.test.ts`     | `emoji-in-jsx`, `unicode-glyph`, `legacy-tokens`, `banned-hex`, `to-locale-string`, `raw-enum-jsx` |

Qué caza cada una y dónde:

| Regla              | Qué                                                                                                               | Raíces                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `voseo`            | Formas rioplatenses con frontera Unicode (`(?!\p{L})`, no `\b`: `acá\b` nunca casaba)                             | `src/**`                                                             |
| `emoji-in-jsx`     | Emoji como iconografía; el rango incluye flechas, formas geométricas, indicadores regionales y el selector `FE0F` | `src/app`, `src/components`, `src/lib`, `src/server/email-templates` |
| `unicode-glyph`    | Glifo tipográfico haciendo de icono o affordance (`→ ✓ ★ • …`)                                                    | idem                                                                 |
| `legacy-tokens`    | Tokens legacy de la capa de compat, escritos como `var(--token)` **o** como la utilidad Tailwind equivalente      | idem                                                                 |
| `banned-hex`       | Hex pre-V3 hardcoded (`#19f08b`, `#3aa3ff`, `#1a3457`, `#0d1b2e`, `#07101e`)                                      | idem                                                                 |
| `to-locale-string` | `toLocale*String()` pelón — lee la zona del host, no la del box                                                   | `src/app`, `src/components`, `src/server/email-templates`            |
| `raw-enum-jsx`     | Enum de Prisma renderizado como texto: el literal `>PAID<` **y** el hijo por expresión `{x.status}`               | `src/app`, `src/components`, `src/lib`, `src/server/email-templates` |

Los dos tests leen `tests/fixtures/guard-baseline.json`
(`{ "<regla>": { "<archivo>": <conteo> } }`) y **fallan solo si un archivo sube
su conteo o si aparece un archivo nuevo con violaciones**. Bajar siempre está
permitido: por eso se pudieron encender con la deuda todavía adentro.

Baseline hoy (`pnpm exec tsx scripts/guards/update-baseline.ts --check`,
2026-09-16), contra el arranque de la fase 0 (`voseo` 36/28 · `emoji-in-jsx`
128/71 · `legacy-tokens` 213/59):

| Regla              | Violaciones | Archivos | Estado                                                          |
| ------------------ | ----------: | -------: | --------------------------------------------------------------- |
| `voseo`            |           9 |        7 | ratchet                                                         |
| `emoji-in-jsx`     |           0 |        0 | **tolerancia cero**                                             |
| `unicode-glyph`    |           6 |        1 | ratchet — los puntos de la máscara del `OtpInput`, justificados |
| `legacy-tokens`    |           0 |        0 | **tolerancia cero**                                             |
| `banned-hex`       |           0 |        0 | **tolerancia cero**                                             |
| `to-locale-string` |           0 |        0 | **tolerancia cero**                                             |
| `raw-enum-jsx`     |           0 |        0 | **tolerancia cero**                                             |

Cinco reglas ya están en `{}`: ahí el ratchet dejó de ser ratchet y es gate. Los
9 hits de `voseo` viven en `src/middleware.ts` (2), `src/server/auth.ts` (2),
`src/lib/features.ts`, `src/lib/pwa-detect.ts`,
`src/lib/disciplines/{registry,types}.ts` y
`src/components/auth/MagicLinkWaiting.tsx`.

```bash
pnpm exec tsx scripts/guards/update-baseline.ts   # --check para solo reportar
```

El script avisa con WARNING por cada entrada que **empeoró** — esa advertencia
es la señal de review, no la ignores. Nunca lo corras para silenciar algo que
acabas de escribir. Definiciones y scanner: `scripts/guards/rules.ts`.

### Los otros guards deterministas

No usan el baseline: o pasan o truenan.

| Archivo                                                               | Qué defiende                                                                                                                                                                                         |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/unit/with-tenant-coverage.test.ts`                             | Que `withTenant()` intercepte todos los métodos del delegate; ratchet de cliente crudo                                                                                                               |
| `tests/unit/tenant-guard.test.ts`                                     | Aislamiento por tenant, incluida la forma de integración                                                                                                                                             |
| `tests/unit/atleta-infra-contrast.test.ts`                            | Matriz WCAG de `--k-t1/2/3` contra `--k-bg/--k-surface/--k-elevated`                                                                                                                                 |
| `tests/unit/atleta-dimmed-state-guard.test.ts`                        | Que ningún contenedor con texto se atenúe por debajo del piso                                                                                                                                        |
| `tests/unit/landing-truth.test.ts`                                    | Que la superficie pública no prometa lo que no existe; escanea `src/lib/branding` y `src/lib/contact.ts`                                                                                             |
| `tests/unit/sw-network-only.test.ts`                                  | Lista network-only de `public/sw.js` + bump de `CACHE_VERSION`                                                                                                                                       |
| `tests/unit/k-class-hooks.test.ts`                                    | Que las clases `k-*` usadas existan declaradas                                                                                                                                                       |
| `tests/unit/components-guard.test.ts`                                 | Higiene del árbol de `src/components`                                                                                                                                                                |
| `tests/unit/labels-format.test.ts`                                    | Que cada enum de Prisma tenga etiqueta en `src/lib/labels.ts`                                                                                                                                        |
| `tests/unit/*-copy-guard.test.ts` (4)                                 | Copy por dominio: `admin-mgmt`, `admin-ops`, `atleta-core`, `atleta-secondary`                                                                                                                       |
| `tests/unit/wiring-*.test.ts` (5) + `admin-mgmt-wiring-guard.test.ts` | Que la pantalla haga una sola pregunta y el número esté etiquetado: audit subject, dominio de charts, resumen del dashboard, rutas públicas, correo de soporte, `/admin/reportes` y `/admin/atletas` |
| `tests/unit/atleta-infra-scan.test.ts`                                | Set de archivos propios del atleta y sus patrones prohibidos                                                                                                                                         |
| `e2e/axe.spec.ts` + `e2e/fixtures/axe-baseline.json`                  | Ratchet de accesibilidad sobre las 14 pantallas auditadas, hoy en 0/0                                                                                                                                |

## Hydration patterns (regla dura)

Del bug de mobile del 2026-05-06: `Hydration failed because the server rendered
HTML didn't match the client.`

Causas típicas en un client component (`"use client"`):

1. `new Date()`, `Date.now()`, `Math.random()` en el render
2. `toLocaleString()` / `toLocaleDateString()` sin `locale` explícito
3. `window.matchMedia`, `localStorage`, `sessionStorage`, `navigator.*` leídos en render
4. Branches `typeof window !== "undefined"` que producen markup distinto
5. **Zona horaria**: formatear una fecha que vino del server sin `timeZone`
   explícito. El SSR la pinta en la zona del servidor y el teléfono en la suya,
   así que además de la mismatch el atleta ve por un instante la hora
   equivocada de su clase. Fue el P0-4 de la auditoría, justo en
   `/atleta/reservar`. Todo por `src/lib/format.ts`; la regla completa está en
   "Zona horaria".
6. `Notification.permission` (y cualquier lectura de la Notifications API) en el
   render: el server no la tiene y el cliente sí

Patrón correcto:

```tsx
"use client";
import { useState, useEffect } from "react";

export function MyComponent({ items }: Props) {
  // ❌ NO en render: const now = Date.now();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);

  const past = now !== null && itemDate.getTime() < now; // null = "antes de hidratar"
}
```

Si el dato viene del server, pásalo como prop inmutable y **no lo recalcules en
el cliente** sobre el mismo concepto.

Cómo detectar regresiones: probar desde otro device/timezone/locale; buscar
`new Date()` o `Date.now()` en `src/components/**` y `src/app/**/_components/**`;
leer el overlay de error de Next en dev.

## Anti-patterns

- **NO** queries sin `withTenant()` (excepto el lookup de Box en auth).
- **NO** renderizar enums crudos (`PAID`, `ATTENDED`, `ROUNDS_REPS`) en JSX —
  van por `src/lib/labels.ts`.
- **NO** voseo, en ninguna parte: copy, comentarios o prompts de IA.
- **NO** notas de dev, nombres de proveedor ("Gemini Vision", "OCR Gemini") ni
  etiquetas "(DEMO)" en rutas de owner o atleta.
- **NO** emoji como iconografía — `lucide-react`.
- **NO** `var(--text|--card|--line|--bg|--accent|--moss|--fire|--grad|--text-2)`:
  son legacy que solo vive por la capa de compat. Usa `--k-*`.
- **NO** hex hardcoded `#19f08b`, `#3aa3ff`, `#1a3457`, `#0d1b2e`, `#07101e`.
- **NO** color semántico (naranja/rojo) para intensidad de una misma cosa.
- **NO** atenuar un contenedor que lleva texto con `opacity` por debajo de 0.9.
  Para "pasado", "bloqueado" o "pendiente" se cambia el **chrome** —superficie,
  borde, acento, icono `Lock`, etiqueta—, no la opacidad del contenedor: la
  opacidad se multiplica contra el contraste del texto y tumba AA en cadena.
  Lo defiende `tests/unit/atleta-dimmed-state-guard.test.ts`.
- **NO** `new Intl.DateTimeFormat(...)` sin `timeZone`: ningún guard lo ve.
- **NO** leer `Notification.permission` (ni `navigator.*`) durante el render.
- **NO** `run_in_background` en un agente que escribe archivos.
- **NO** editar fuera del ownership de tu worktree — se reporta, no se toca.
- **NO** `window.confirm()` ni `window.alert()` — `useConfirm()` de
  `@/lib/use-confirm`. Si falta el provider, agrega `<ConfirmProvider>` al layout.
- **NO** `prisma migrate` en dev — `pnpm db:push`.
- **NO** `npm run dev` — `pnpm dev`.
- **NO** tocar `_design-source/` — es referencia, no se compila.
- **NO** instalar shadcn a mano: `pnpm dlx shadcn@latest add <component>`.
- **NO** escribir branches role-aware sin e2e que los proteja: se pierden en
  sweeps visuales (lección del commit `b116a0f`).
- **NO** dejar rutas `/dev/*` accesibles en producción — `src/app/dev/layout.tsx`
  las cierra con `notFound()` cuando `NODE_ENV === "production"`.
- **NO** commitear imágenes en la raíz del repo: `.gitignore` las ignora por
  ancla-raíz; los assets van en `public/`, `docs/` o `_design-source/`.

## Sweeps masivos de tokens

Para cambiar muchos tokens CSS en muchos archivos, `perl -i -pe` en bloque sobre
una lista de archivos gana por mucho a editar uno por uno. Dos reglas: los
patrones **específicos van antes que los generales** (`--grad-soft` antes de
`--grad`) y los hex hardcoded necesitan su propio regex (no los captura
`var\(--…\)`). Después de cada bulk: `pnpm typecheck && pnpm test`, y los
guards te dicen si algo subió de conteo.

## Engram topic keys

- `proj.kronos.dev_port` — 3000 · `proj.kronos.db_port` — 5434
- `proj.kronos.phase` — auditoría 2026-09-15 cerrada; rebuild fase 0 en curso
- `proj.kronos.stack` — Next.js 15 + Prisma 6 + NextAuth 4 + Tailwind 3
- `proj.kronos.rebuild.wave0-audit` — auditoría de entrega de la fase 0
- `proj.kronos.rebuild.wave0-fixes` — la ola de 7 commits que la cerró
- `proj.kronos.rebuild.wave0-fixes-state` — qué quedó abierto tras la ola
- `decision.kronos.rebuild_worktree_model` — ownership por worktree
- `decision.kronos.guard_ratchets` — baseline como ratchet, no gate
- `pattern.kronos.opacity_for_intensity` · `pattern.kronos.perl_bulk_sweep`
- `bug.kronos.sw_cross_tenant_cache` — fuga de caché del service worker
- `bug.kronos.withtenant_groupby_gap` — `groupBy`/`aggregate` fuera del alcance
  de `withTenant()`: `/admin/reportes` agregaba todos los boxes
- `bug.kronos.period_window_host_tz` — ventanas de periodo calculadas en la zona
  del host en vez de la del box

## Para retomar

"Retomo kronos, [fase/feature/bug]" — lee este archivo, el estado de git y
`docs/audit/2026-09-15-kronos-producto/08-fase0-audit.md` **§8**, que es el
corte más reciente: qué cerró la ola de fixes del 2026-09-16, qué quedó como
follow-up y qué falta para Gate 0. De ahí el roadmap por fases sigue en
`07-roadmap.md`. Para el detalle de una pantalla, `02-screen-audit.md`; para lo
que existe en código, `01-code-inventory.md`; para el inventario de ramas y qué
hacer con cada una, `docs/branches-2026-09-15.md`.
