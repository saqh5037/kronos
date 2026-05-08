# CLAUDE.md — Kronos

Proyecto: `/Users/samuelquiroz/Documents/proyectos/kronos`

SaaS multi-tenant para boxes de CrossFit. Next.js 15 + Prisma + NextAuth.

## Estado actual

**V3 Sweep Total cerrado** (2026-05-07, último commit `4da235b`): 16 commits desde `e64495b`. Brand consistency end-to-end — producto + charts + skeletons + toasts + emails todos en lima neon `#C8FF2D` monocromático.

**Fase 1 al 100%** (2026-05-04): 7 vertical slices end-to-end con TDD + cierre.

Módulos admin con datos reales:

- Dashboard — KPIs día (clases/asistencia/ingreso), próximas clases, alertas, quick links
- Atletas (Fase 0)
- Programación — CRUD clases con recurrencia + grid semanal
- WODs — biblioteca + builder + biblioteca de movimientos
- Reservas — roster con waitlist + check-in + no-show
- Asistencia — vista del día con stats + check-in inline
- PRs — agrupados por movimiento, top 1 highlighted
- Leaderboards — ranking por WOD + asistencia semanal
- Pagos · Comunicaciones · Reportes (Fase 1 hardening)
- Ajustes — config del Box (name, brandColor, logoUrl, locale, currency, timezone, capacity)

App atleta:

- Home — hero stats (HaloRing semana/racha/PRs), próxima clase, último score, accesos rápidos
- WOD del día — vista del WOD + ScoreForm con auto-detect PR
- Reservar — calendario 7 días + estado mis reservas
- Perfil — PRs + historial scores

Auth:

- Magic link email (NextAuth EmailProvider)
- Google OAuth (opcional, gateado por env)
- **Dev login** — CredentialsProvider solo en NODE_ENV=development. UI bajo `NEXT_PUBLIC_DEV_LOGIN=1`.
  Seed crea `owner@iron-hands.demo`, `coach@iron-hands.demo`, `atleta@iron-hands.demo` (password "dev").
- **Role guard middleware**: ATHLETE solo /atleta/_, OWNER/COACH/STAFF solo /admin/_. Cross-access redirige al surface correcto.

Operativa (Fase 2 hardening):

- **Email**: Resend cuando `RESEND_API_KEY` está cableada, fallback a console.log mock para dev local.
- **Cron** `/api/cron/dispatch-announcements` (GET, Bearer `CRON_SECRET`): dispara anuncios SCHEDULED con `scheduledAt <= now`.
  Vercel Cron friendly — agendar `*/5 * * * *` en `vercel.json`.
- **Sidebar admin responsive**: drawer + hamburger en `<lg`, fijo en `lg+`.

Lógica de dominio (pure helpers + tests):

- `decideBooking` — capacity check, waitlist, idempotencia
- `nextWaitlistPromotion` — promoción FIFO
- `computeAttendanceStreak` — UTC, 1-day grace
- `detectPR / isBetterScore / formatScore` — TIME asc, demás desc
- `expandRecurrence / recurrenceToRRule` — RRULE simple

Stats:

- Branch: `main`
- Dev server: `:3000` (local) o `:3007 HOSTNAME=0.0.0.0` (acceso externo via port forwarding "hitazo" del router)
- BD: PostgreSQL en `:5434` (docker compose)
- Tests unit: 669/669 (`pnpm test`) — 54 archivos
- Tests E2E: 11 fallos preexistentes con strict-mode violations (`getByText` ambiguo entre toast + `<p>`) — NO son regresión del sweep V3, queda como deuda separada
- Build: `pnpm build` ✅
- Typecheck + Lint: ✅
- Commits sweep V3: `4908109`..`4da235b` (16 commits del sistema visual completo)

## Comandos

```bash
pnpm dev              # Dev server
pnpm build            # Build producción
pnpm typecheck        # TypeScript check
pnpm lint             # ESLint
pnpm test             # Vitest unit tests
pnpm test:e2e         # Playwright E2E (requiere pnpm db:seed previo)
pnpm db:push          # Push schema (dev — sin migraciones)
pnpm db:seed          # Seed: 2 boxes, 5 atletas, WODs, clases, badges
pnpm db:studio        # Prisma Studio GUI

docker compose up -d db     # Levantar Postgres :5434
```

## Stack

- **Next.js 15** App Router + TypeScript strict
- **Prisma 6** + PostgreSQL `:5434` (NO :5432)
- **NextAuth.js 4** — magic link email + Google OAuth
- **Tailwind CSS 3** + tokens custom en `globals.css`
- **Framer Motion 11** (disponible, usar en Fase 1)
- **Zod** — validación en `src/lib/validations/`
- **Vitest** unit / **Playwright** e2e
- **Sentry + PostHog** — cableados, sin eventos activos aún

## Lane discipline (IMPORTANTE)

| Lane                 | Scope                                                            | Quién       |
| -------------------- | ---------------------------------------------------------------- | ----------- |
| Backend / data       | `src/server/**`, `prisma/**`, `src/lib/**`, tests, CI            | Claude Code |
| UI / diseño          | `src/app/**`, `src/components/**`, `*.css`, `tailwind.config.ts` | Kimi        |
| Pages con datos + UI | `src/app/.../page.tsx` mixtos                                    | Coordinar   |

Kimi porta los mockups de `_design-source/` al código real.
Claude Code nunca toca CSS decorativo ni composición visual sin coordinación.

## Regla cardinal: Multi-tenancy

**SIEMPRE** usar `withTenant(tenantId)` para queries. NUNCA `db.athlete.findMany()` directo.

```typescript
// Patron correcto
const db = withTenant(session.user.tenantId);
const athletes = await db.athlete.findMany();

// Unica excepcion — lookup de Box durante auth
const box = await db.box.findUnique({ where: { slug } });
```

El tenant context viene de `session.user.tenantId` (JWT guardado en auth callback).

## Arquitectura de archivos clave

```
src/server/
  tenant.ts       — AsyncLocalStorage para tenant context
  db.ts           — prismaBase + withTenant() extension
  auth.ts         — NextAuth config (JWT strategy)
  actions/
    athletes.ts   — listAthletes(), createAthlete()

src/lib/
  utils.ts        — cn() (clsx + tailwind-merge)
  validations/
    athlete.ts    — Zod schema AthleteInput

src/middleware.ts — Protege /admin/* y /atleta/*
src/types/next-auth.d.ts — Session con id, role, tenantId

prisma/
  schema.prisma   — Schema completo multi-tenant
  seed.ts         — 2 boxes, 5 atletas, WODs, clases, badges
```

## Tokens visuales (V3 "Cuarto Oscuro")

Sistema actual — paleta lima neon monocromática, dark-only forzado. Variables canónicas en `src/app/globals.css:1612-1675`:

**Backgrounds & text:**

- `--k-bg #08080a`, `--k-surface #0f1014`, `--k-elevated #14141a`
- `--k-line #1c1c24`, `--k-line-2 #26262e`
- `--k-t1 #f5f5f7` (primary), `--k-t2 #8a8a94`, `--k-t3 #54545c`

**Acento (lima neon):**

- `--k-accent #c8ff2d` (lima — color brand único)
- `--k-accent-press #a8d726` (estado pressed)
- `--k-accent-on #08080a` (texto sobre acento)
- `--k-accent-soft rgba(200, 255, 45, 0.1)`
- `--k-accent-line rgba(200, 255, 45, 0.3)`
- `--k-accent-glow 0 0 16px rgba(200, 255, 45, 0.18)`

**Semánticos:**

- `--k-warning #ffb020` (naranja, solo para warnings reales)
- `--k-danger #ff5a5a` (rojo, solo para errores)

**Tipografía:**

- `--k-font-display` IBM Plex Mono (headings, números, monospace)
- `--k-font-body` Inter (body copy)

**Compat layer** (`globals.css:1740+`): tokens legacy `--moss/--fire/--blue/--cyan/--strain/--red/--grad/--text-2/etc` están aliased a tokens V3 como red de seguridad. Pero el sweep V3 dejó cero referencias legacy en `src/{app,components}` — el compat solo cubre código futuro accidental.

**Clases utilitarias:**

- Cards: `k-card`, `k-card-featured`, `k-card-ghost`, `k-card-flat`
- Botones: `k-btn-grad` (lima sólido), `k-btn-ghost`
- Chips: `k-chip`, `k-chip-recovery`, `k-chip-strain`, `k-chip-pr`, `k-chip-ghost`
- Eyebrow: `k-eyebrow`, `k-eyebrow-bar`
- Headings: `k-h-italic`, `k-mono`, `k-body`
- Animation: `k-tap`, `k-pulse-glow`, `k-grain`, `k-skeleton`

## Diseño source

`_design-source/` — mockups JSX de referencia, NO se compilan. Ver `_design-source/README.md` para mapa de qué está portado dónde.

## Engram topic keys

- `proj.kronos.dev_port` — 3000 (local) / 3007 (acceso externo)
- `proj.kronos.db_port` — 5434
- `proj.kronos.phase` — Fase 1 cerrada, V3 sweep total cerrado
- `proj.kronos.stack` — Next.js 15 + Prisma 6 + NextAuth 4 + Tailwind 3
- `decision.kronos.v3_sweep_total` — sweep V3 cerrado completo (16 commits)
- `bug.kronos.charts_navy_residual` — culprit del azul-marino en charts (cinematic bg + skeleton)
- `bug.kronos.sprint_role_aware_regression` — Sprint role-aware perdido en sweeps visuales
- `pattern.kronos.opacity_for_intensity` — opacidad variable para mantener monocromático
- `pattern.kronos.perl_bulk_sweep` — perl bulk para sweeps masivos de tokens

## Anti-patterns

- NO queries sin `withTenant()` excepto Box lookup
- NO `prisma db migrate` en dev — usar `pnpm db:push`
- NO tocar `_design-source/` — es solo referencia
- NO `npm run dev` — usar `pnpm dev`
- NO mezclar lanes sin coordinación (Claude toca CSS decorativo = problema)
- NO instalar shadcn sin correr el CLI correcto: `pnpm dlx shadcn@latest add <component>`
- NO `window.confirm()` ni `window.alert()` — usar `useConfirm()` de `@/lib/use-confirm` (modal real, brand consistente, accesible). Si falta el provider en el árbol, agregar `<ConfirmProvider>` al layout correspondiente.
- NO usar `var(--moss/--fire/--blue/--cyan/--strain/--red/--grad/--text-2/--card-2/--bg-soft/--line-strong)` legacy — usar `--k-*` directamente. El compat layer es solo red de seguridad.
- NO usar hex hardcoded `#19f08b` (verde teal), `#3aa3ff` (cyan), `#1a3457/#0d1b2e/#07101e` (navy) — son colores legacy. Solo OK los V3: `#c8ff2d` (lima), `#a8d726` (lima press), `#ff5a5a` (danger), `#ffb020` (warning).
- NO escribir branches role-aware sin e2e que los proteja — el branch puede perderse en sweeps visuales (lección Sprint 3.12 commit `b116a0f`).
- NO usar `font-script` class — eliminada en sweep V3, usar `font-display` (Plex Mono).

## Hydration patterns (regla dura)

Aprendido del bug de mobile 2026-05-06: `Hydration failed because the server rendered HTML didn't match the client.`

### Causa raíz típica

Cualquier valor que difiera entre el render del server y el primer render del cliente rompe la rehidratación. Los más comunes:

1. **`new Date()`, `Date.now()`, `Math.random()`** en el render de un client component (`"use client"`)
2. **`toLocaleString()` / `toLocaleDateString()`** sin pasar `locale` explícito (puede diferir entre runtime del server y del browser)
3. **`window.matchMedia`, `localStorage`, `sessionStorage`, `navigator.*`** leídos en render
4. **Branches `typeof window !== 'undefined'`** que producen markup distinto

### Patrón correcto

Si el componente es client-only (`"use client"`) y necesita "ahora", `localStorage`, etc:

```tsx
"use client";
import { useState, useEffect } from "react";

export function MyComponent({ items }: Props) {
  // ❌ NO HAGAS ESTO en render: const now = Date.now();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
  }, []);

  // En render: tratar `now === null` como "antes de hidratar"
  const past = now !== null && itemDate.getTime() < now;
  // ...
}
```

Misma idea con preferencias de tema (`localStorage`), media queries, etc. Server renderiza una versión "neutra", `useEffect` enriquece después del mount.

### Si el dato viene del server (server component)

Pasarlo como prop inmutable. Server calcula `new Date()` una vez, lo serializa, el cliente lo recibe como `Date` reconstruido. **No volver a calcular `new Date()` en el cliente** sobre el mismo concepto.

### Cómo detectar regresiones

- Test manual desde otro device (mobile, otra timezone, otro locale)
- Buscar `new Date()` o `Date.now()` en `src/components/**` y `src/app/**/_components/**` (client components) — cualquier resultado es candidato a bug
- Console error en navegador: `Hydration failed because...` → leer el stack para encontrar el componente
- En dev mode Next muestra el error overlay con el componente exacto

## Sweeps masivos — patrones aprendidos

### Perl bulk para tokens CSS

Cuando hay que cambiar muchos tokens CSS en muchos archivos (típico de sweeps visuales tipo V3), usar `perl -i -pe` con regex en bloque sobre lista de archivos. Mucho más rápido que Edit individual.

```bash
FILES=(src/path/a.tsx src/path/b.tsx ...)
for f in "${FILES[@]}"; do
  perl -i -pe '
    s/var\(--grad-soft\)/var(--k-accent-soft)/g;  # ESPECÍFICO antes que general
    s/var\(--grad\)/var(--k-accent)/g;            # general DESPUÉS
    s/var\(--moss\)/var(--k-accent)/g;
    s/var\(--text-2\)/var(--k-t2)/g;
    s/#1c1917/var(--k-accent-on)/g;
    # ...
  ' "$f"
done
```

**Reglas:**

- **Orden importa**: específicos antes que generales (`--grad-soft` antes que `--grad`).
- **Tokens hardcoded NO captura**: agregar regex separados para `rgba\(58.*163.*255` (cyan), `#3aa3ff` (cyan), `#19f08b` (verde teal), `#1a3457|#0d1b2e|#07101e` (navy).
- **Verificación post-sweep**: `grep -rE "<patterns_legacy>" src/` debe dar 0 residuos.
- **Tests obligatorios**: `pnpm typecheck && pnpm test` después de cada bulk.
- **Excluir** `_design-source/`, `src/app/dev/**` (demos), y `src/server/email-templates/**` (emails Resend usan hex literales no CSS vars — sweep separado).

### Opacidad variable para data viz monocromática

Cuando una visualización necesita "intensidad" (low/mid/high) en V3 monocromático, usar opacidad del color base en vez de cambiar de color:

```tsx
style={{
  background: "var(--k-accent)",
  opacity: score >= 70 ? 1 : score >= 40 ? 0.7 : 0.4,
}}
```

**No hacer**: `score >= 70 ? lima : warning` — rompe monocromático cuando datasets reales tienen muchos valores en rango "warning".

**Sí hacer** semántica con color cuando es **distinta cosa** (success vs error) — no para intensidades de la misma cosa.

## Para retomar

"Retomo kronos, [fase/feature/bug]" — leer este CLAUDE.md y el estado de git. Los topic keys de Engram (`decision.kronos.v3_sweep_total`, `bug.kronos.*`, `pattern.kronos.*`) tienen contexto detallado de las decisiones del sweep.
