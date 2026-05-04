# CLAUDE.md — Kronos

Proyecto: `/Users/samuelquiroz/Documents/proyectos/kronos`

SaaS multi-tenant para boxes de CrossFit. Next.js 15 + Prisma + NextAuth.

## Estado actual

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
- Dev server: `:3000`
- BD: PostgreSQL en `:5434` (docker compose)
- Tests unit: 150/150 (`pnpm test`) — 13 archivos
- Tests E2E: 21/21 (`pnpm test:e2e`) — 4 specs (auth, reservar, score-pr, leaderboard)
- Build: `pnpm build` ✅
- Commits Fase 1 + cierre: `48fd157`..`<HEAD>` (10+ commits)

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

## Tokens visuales

Variables CSS en `src/app/globals.css`:

- `--bg #1a1d20`, `--bg-soft #23272b`, `--card #2a2f33`, `--card-2 #34393e`
- `--recovery #19f08b` (verde), `--strain #3aa3ff` (azul), `--pr #ff5e5e` (rojo)
- `--grad` (gradiente azul→verde), `--grad-soft` (versión transparente)

Clases Tailwind custom: `k-card`, `k-eyebrow`, `k-btn-grad`, `k-btn-ghost`, `k-chip`, `k-chip-recovery`, `k-chip-strain`, `k-chip-pr`, `k-chip-ghost`

Fuentes: `font-sans` (Inter), `font-display` (Space Grotesk), `font-mono` (JetBrains Mono)

## Diseño source

`_design-source/` — mockups JSX de referencia, NO se compilan. Ver `_design-source/README.md` para mapa de qué está portado dónde.

## Engram topic keys

- `proj.kronos.dev_port` — 3000
- `proj.kronos.db_port` — 5434
- `proj.kronos.phase` — Fase 0 completa, Fase 1 pendiente
- `proj.kronos.stack` — Next.js 15 + Prisma 6 + NextAuth 4 + Tailwind 3

## Anti-patterns

- NO queries sin `withTenant()` excepto Box lookup
- NO `prisma db migrate` en dev — usar `pnpm db:push`
- NO tocar `_design-source/` — es solo referencia
- NO `npm run dev` — usar `pnpm dev`
- NO mezclar lanes sin coordinación (Claude toca CSS decorativo = problema)
- NO instalar shadcn sin correr el CLI correcto: `pnpm dlx shadcn@latest add <component>`

## Para retomar

"Retomo kronos, [fase/feature/bug]" — leer este CLAUDE.md y el estado de git.
