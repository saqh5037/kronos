# CLAUDE.md — Kronos

Proyecto: `/Users/samuelquiroz/Documents/proyectos/kronos`

SaaS multi-tenant para boxes de CrossFit (México). Next.js 15 App Router +
Prisma 6 + NextAuth 4 + PostgreSQL. Dos productos en un repo: el panel del Box
(`/admin`) y la app del atleta (`/atleta`, PWA), más landing pública, modo TV y
super-admin de plataforma.

Fuente de verdad de este documento: `docs/audit/2026-09-15-kronos-producto/`
(inventario de código, auditoría de 264 pantallas, benchmark y roadmap).

## Estado actual — 2026-09-15

| Rama                        | Qué es                                                                                        |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| `main`                      | `808fbac` (2026-06-10). Producto en pausa desde junio; salud de build verde.                  |
| `audit/2026-09-15-producto` | Evidencia de la auditoría. **PR #48 → `main`, abierto.**                                      |
| `rebuild/base`              | `d8be40f`. Base común de la fase 0: `lucide-react`, `src/lib/labels.ts`, `src/lib/format.ts`. |
| `rebuild/w0-*`              | Nueve worktrees paralelos del rediseño (ver "Modelo de trabajo").                             |

Salud verificada en `rebuild/base` + este worktree:

- `pnpm typecheck` ✅ · `pnpm lint` ✅ (3 warnings preexistentes de `<img>` en
  `atleta/ayuda` y `atleta/wod/foto`) · `pnpm test` ✅
- **117 archivos vitest / 1402 tests.** Los 4 de `tests/integration/` quedan
  fuera del run default (necesitan Postgres real → `pnpm test:integration`).
- 26 specs Playwright en `e2e/` — **no corren en CI**, son manuales.
- `src/` ≈ 765 archivos TS/TSX · 53 modelos Prisma · `globals.css` 2,074 líneas
  - `landing.css` 1,982.

El diagnóstico de la auditoría: **la ingeniería está verde, el problema es
producto y diseño.** El plan por fases vive en
`docs/audit/2026-09-15-kronos-producto/07-roadmap.md` y es el único backlog
vigente.

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
   se instaló ahí antes de abrir los nueve.
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
pnpm test                # Vitest unit (117 archivos)
pnpm test:integration    # Vitest integration — requiere Postgres real
pnpm test:e2e            # Playwright (requiere pnpm db:seed previo)

pnpm db:push             # Push schema (dev — sin migraciones)
pnpm db:seed             # Box "Iron Hands", atletas, WODs, clases, badges
pnpm db:seed:ops         # Capa operativa (pagos, membresías, anuncios)
pnpm db:seed:story       # Historia de un atleta (scores, PRs, racha)
pnpm db:studio           # Prisma Studio

docker compose up -d db  # Postgres :5434  (NO :5432)

pnpm exec tsx scripts/guards/update-baseline.ts   # ratchet de los guards
```

## Stack

Next.js 15 (App Router, `typedRoutes`) · TypeScript strict · Prisma 6 +
PostgreSQL `:5434` · NextAuth 4 (JWT, sesión 90 días) · Tailwind 3 + tokens
`--k-*` en `globals.css` · framer-motion 11 vía `LazyMotion` (74 archivos, todos
importan `m`, ninguno `motion`) · Recharts 3 detrás de `next/dynamic` ·
`lucide-react` (sistema de iconos oficial) · Zod en `src/lib/validations/` ·
Vitest + Playwright · **Sentry y PostHog activos** (no "cableados sin eventos":
`src/lib/analytics.ts` emite 12 eventos tipados y `reportError` corre en
webhooks y actions).

Sin shadcn/ui: `src/components/ui/` tiene un solo archivo (`ConfirmDialog.tsx`).
No hay capa de primitivos — es deuda conocida, no una decisión.

## Dominio: qué está construido de verdad

| Área                                  | Estado           | Nota que importa                                                                                                                                                         |
| ------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Auth & onboarding                     | BUILT            | Magic link, **OTP de 6 dígitos**, Google (env-gated), password, dev-login. Gate de onboarding del atleta en **DB**, no en el JWT.                                        |
| Multi-tenancy + RBAC                  | BUILT            | `withTenant()` en 203 llamadas. `PermissionGrantRequest` se escribe pero **no tiene UI de aprobación** (STUB).                                                           |
| **SaaS billing** (el Box paga)        | BUILT, parcial   | Solo Mercado Pago; `confirmCheckoutMock` es el camino en uso. El cargo recurrente real (preapproval) **no está cableado**. **Stripe no existe** — solo el valor de enum. |
| Pagos de atletas                      | BUILT            | **Mercado Pago + efectivo, nada más.** Sin OXXO, SPEI ni CFDI.                                                                                                           |
| Clases, reservas, waitlist, check-in  | BUILT            | `decideBooking`, promoción FIFO de waitlist, no-show, bulk check-in.                                                                                                     |
| WODs, movimientos, whiteboard         | BUILT            | OCR de pizarra con Gemini Vision + cruce con roster. **Editor Hyrox = STUB** declarado.                                                                                  |
| Scores, PRs, leaderboards, BodyMetric | BUILT            | `detectPR`, percentiles, tonelaje, radar de capacidades.                                                                                                                 |
| Gamificación + skills                 | BUILT            | Badges, XPLedger, rachas, skill tree, plan IA por objetivo. `DailyMission` es **schema sin código**; `AchievementToast` está **comentado** en el layout.                 |
| **Wearables (Whoop)**                 | BACKEND / sin UI | OAuth, vault de tokens cifrados, webhook HMAC, cron, 6 archivos de test — **cero consumidores en UI**. El hueco "backend construido, producto invisible" más grande.     |
| IA (Gemini)                           | BUILT            | 7 flujos: OCR pizarra, foto-WOD, saludo del día, predicción de PR, plan de entrenamiento, análisis de forma, CoachCards. Todos con fallback determinista.                |
| Comunicaciones + PWA push             | BUILT            | Anuncios con cron, notificaciones in-app, web-push (VAPID), encuestas, 7 templates de email, digest semanal del owner.                                                   |
| Eventos / competencias                | PARTIAL          | Lectura e inscripción sí; **no existe create/update de `SportEvent` en el código** — se insertan a mano en BD.                                                           |
| TV mode, reportes, auditoría, alertas | BUILT            | `/tv/[slug]`, churn risk, timeline de auditoría, reglas de alerta.                                                                                                       |
| Landing / legal                       | BUILT, con deuda | **Truth gap P0**: `/box` y Términos §5 prometen Stripe, OXXO, SPEI, CFDI 4.0, apps nativas, API, SSO y SLA que el código no implementa.                                  |
| i18n                                  | MISSING          | Todo el copy es español hardcodeado. `Box.locale`/`currency` solo alimentan `Intl`.                                                                                      |
| Personal-box / atleta independiente   | BUILT            | `/atleta-signup` crea un box personal (slug `me-*`) y cambia el modo de la UI. Línea de producto B2C completa.                                                           |
| Super-admin de plataforma             | BUILT            | Allowlist `SUPER_ADMIN_EMAILS` + gate de render y de RPC. Provisión de pilotos.                                                                                          |

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

Invariante que no se negocia: `public/sw.js` fuerza network-only en
`/api/*`, `/admin*` y `/atleta*` desde el fix de fuga de caché cross-tenant del
2026-05-17. No lo relajes.

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
  format.ts          — formatMXN, deltas con signo, fechas/horas es-MX 24h
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
- `--k-t1 #f5f5f7` · `--k-t2 #8a8a94` · **`--k-t3 #7a7a84`** (subió desde
  `#54545c`, que medía 2.67:1 contra el fondo y reprobaba WCAG AA en las 534
  etiquetas que lo usan)
- `--k-accent #c8ff2d` (único color de marca) · `--k-accent-press #a8d726` ·
  `--k-accent-on #08080a` · `--k-accent-soft` · `--k-accent-line` · `--k-accent-glow`
- `--k-warning #ffb020` y `--k-danger #ff5a5a` — **solo semánticos reales**
- `--k-font-display` IBM Plex Mono · `--k-font-body` Inter

Clases utilitarias: `k-card`(`-featured`/`-ghost`/`-flat`), `k-btn-grad`,
`k-btn-ghost`, `k-chip*`, `k-eyebrow`, `k-mono`, `k-tap`, `k-skeleton`.

Cuatro reglas de casa:

1. **Iconos: `lucide-react`.** Nunca emoji, nunca flechas unicode como
   affordance, nunca códigos de dos letras como glifo. La auditoría encontró
   emoji-como-icono en 71 archivos (S7).
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

Deuda viva del sistema: capa de compat al final de `globals.css` que mantiene
nombres legacy (`--text`, `--card`, `--line`, `--bg`) para **59 archivos**;
2,676 objetos `style={{}}` inline conviviendo con Tailwind; tres shells de admin
y tres navegaciones de atleta duplicadas; `ThemeToggle` sigue montado bajo tema
forzado. Todo eso es el trabajo de los worktrees, no el estado deseado.

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

Dos tests de vitest defienden las reglas de arriba de forma determinista, y
corren en CI porque son archivos vitest normales:

| Archivo                            | Reglas                                                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `tests/unit/dialect-guard.test.ts` | `voseo` — todo `src/**`                                                                                |
| `tests/unit/ui-guards.test.ts`     | `emoji-in-jsx`, `legacy-tokens`, `banned-hex`, `raw-enum-jsx` sobre `src/app/**` y `src/components/**` |

Ambos leen `tests/fixtures/guard-baseline.json`
(`{ "<regla>": { "<archivo>": <conteo> } }`) y **fallan solo si un archivo sube
su conteo o si aparece un archivo nuevo con violaciones**. Bajar siempre está
permitido: por eso se pueden encender con la deuda todavía adentro.

Baseline del punto de arranque: `voseo` 36 en 28 archivos · `emoji-in-jsx` 128
en 71 · `legacy-tokens` 213 en 59 · `banned-hex` 0 · `raw-enum-jsx` 0.

Para apretar el ratchet después de mergear los worktrees:

```bash
pnpm exec tsx scripts/guards/update-baseline.ts   # --check para solo reportar
```

El destino es `{}` en cada regla; ahí los guards se vuelven gates de tolerancia
cero y el fixture deja de moverse. El script avisa con WARNING por cada entrada
que **empeoró** — esa advertencia es la señal de review, no la ignores. Nunca lo
corras para silenciar algo que acabas de escribir. Definiciones y scanner:
`scripts/guards/rules.ts`.

## Hydration patterns (regla dura)

Del bug de mobile del 2026-05-06: `Hydration failed because the server rendered
HTML didn't match the client.`

Causas típicas en un client component (`"use client"`):

1. `new Date()`, `Date.now()`, `Math.random()` en el render
2. `toLocaleString()` / `toLocaleDateString()` sin `locale` explícito
3. `window.matchMedia`, `localStorage`, `sessionStorage`, `navigator.*` leídos en render
4. Branches `typeof window !== "undefined"` que producen markup distinto

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
- `decision.kronos.rebuild_worktree_model` — ownership por worktree
- `decision.kronos.guard_ratchets` — baseline como ratchet, no gate
- `pattern.kronos.opacity_for_intensity` · `pattern.kronos.perl_bulk_sweep`
- `bug.kronos.sw_cross_tenant_cache` — fuga de caché del service worker

## Para retomar

"Retomo kronos, [fase/feature/bug]" — lee este archivo, el estado de git y
`docs/audit/2026-09-15-kronos-producto/07-roadmap.md`. Para el detalle de una
pantalla, `02-screen-audit.md`; para lo que existe en código,
`01-code-inventory.md`; para el inventario de ramas y qué hacer con cada una,
`docs/branches-2026-09-15.md`.
