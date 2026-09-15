# Kronos — El sistema operativo del box

SaaS multi-tenant para boxes de CrossFit (México). Panel del Box, app PWA del
atleta, landing pública, modo TV y super-admin de plataforma: atletas, clases,
WODs, reservas, pagos, gamificación, wearables y IA.

---

## Quick start

### Prerrequisitos

- Node.js 22+ (nvm recomendado)
- pnpm 9+
- Docker Desktop / OrbStack

### Setup

```bash
# 1. Clonar
git clone <repo> kronos && cd kronos

# 2. Variables de entorno
cp .env.example .env.local
# Edita .env.local:
#   - NEXTAUTH_SECRET  → openssl rand -base64 32
#   - NEXT_PUBLIC_DEV_LOGIN=1  → habilita el login de desarrollo
#   - DEV_PASSWORD             → opcional; default "dev"

# 3. Postgres en :5434  (NO :5432)
docker compose up -d db

# 4. Dependencias
pnpm install

# 5. Schema + seeds
pnpm db:push
pnpm db:seed          # box "Iron Hands CrossFit · Polanco", atletas, WODs, clases
pnpm db:seed:ops      # capa operativa: pagos, membresías, anuncios
pnpm db:seed:story    # historia de un atleta: scores, PRs, racha

# 6. Dev server
pnpm dev
```

Abre http://localhost:3000 — es la **landing pública**, no el panel. Para entrar
al producto usa el login de desarrollo (solo con `NODE_ENV=development` **y**
`NEXT_PUBLIC_DEV_LOGIN=1`) en http://localhost:3000/login con estas cuentas que
crea el seed, password `dev`:

| Cuenta                   | Rol     | Aterriza en |
| ------------------------ | ------- | ----------- |
| `owner@iron-hands.demo`  | OWNER   | `/admin`    |
| `coach@iron-hands.demo`  | COACH   | `/admin`    |
| `atleta@iron-hands.demo` | ATHLETE | `/atleta`   |

El middleware separa las superficies: un ATHLETE solo ve `/atleta/*` y
OWNER/COACH/STAFF solo `/admin/*`; el cruce redirige a la superficie correcta.

---

## Estado del repo — ramas del rediseño

El producto quedó en pausa en junio de 2026 y se retomó con una auditoría
completa de producto y UI el 2026-09-15, cuya evidencia vive en
[`docs/audit/2026-09-15-kronos-producto/`](./docs/audit/2026-09-15-kronos-producto/)
(inventario de código, 264 capturas de pantalla, benchmark competitivo,
posicionamiento y roadmap por fases). El veredicto: la ingeniería está verde —
typecheck, lint, 1402 tests y build pasan — y lo que falla es producto y diseño.
De ahí sale el rediseño en curso: `rebuild/base` concentra lo compartido
(`lucide-react`, `src/lib/labels.ts`, `src/lib/format.ts`) y de ella salen nueve
worktrees `rebuild/w0-*` que trabajan en paralelo sobre conjuntos de archivos
disjuntos, cada uno con ownership explícito de rutas. El inventario de todas las
ramas remotas, con ahead/behind y qué hacer con cada una, está en
[`docs/branches-2026-09-15.md`](./docs/branches-2026-09-15.md); el backlog
vigente es [`07-roadmap.md`](./docs/audit/2026-09-15-kronos-producto/07-roadmap.md).

---

## Estructura del proyecto

```
kronos/
├── prisma/
│   ├── schema.prisma          # 53 modelos, multi-tenant
│   ├── seed.ts                # box demo, atletas, WODs, clases, badges
│   ├── seed-operations.ts     # pagos, membresías, anuncios
│   └── seed-athlete-story.ts  # scores, PRs, racha de un atleta
├── src/
│   ├── app/
│   │   ├── (landing)/         # landing pública + router split
│   │   ├── (auth)/login/      # magic link, OTP, password, Google, dev-login
│   │   ├── (public)/          # signup de box y de atleta independiente
│   │   ├── admin/             # panel del Box (+ admin/super para plataforma)
│   │   ├── atleta/            # app PWA del atleta
│   │   ├── tv/                # pantalla del box
│   │   ├── api/               # webhooks (MP, Whoop), crons, push
│   │   └── dev/               # playgrounds — 404 en producción
│   ├── components/            # kronos/, atleta/, charts/, data/, tour/, admin/
│   ├── server/
│   │   ├── db.ts              # Prisma + withTenant()
│   │   ├── auth.ts            # NextAuth (JWT)
│   │   ├── permissions.ts     # can(action, session)
│   │   ├── actions/           # server actions por dominio
│   │   ├── ocr/               # whiteboard + foto-WOD (Gemini Vision)
│   │   └── analytics/         # rankings, tonelaje, churn, insights
│   ├── lib/
│   │   ├── labels.ts          # enum Prisma → etiqueta es-MX
│   │   ├── format.ts          # dinero, fechas y horas es-MX
│   │   ├── ai/                # cliente Gemini + prompts con fallback
│   │   └── validations/       # schemas Zod
│   └── middleware.ts          # role routing, trial gating, rate limit
├── scripts/
│   ├── guards/                # reglas + ratchet de los guards de higiene
│   └── archive/               # scripts one-off retirados
├── tests/                     # unit/, lib/, disciplines/, integration/, fixtures/
├── e2e/                       # 26 specs Playwright (no corren en CI)
├── _design-source/            # mockups de referencia (no se compila)
└── docker-compose.yml         # Postgres :5434
```

---

## Comandos principales

| Comando                 | Descripción                                 |
| ----------------------- | ------------------------------------------- |
| `pnpm dev`              | Dev server en :3000                         |
| `pnpm build`            | Build de producción                         |
| `pnpm typecheck`        | `tsc --noEmit`                              |
| `pnpm lint`             | ESLint                                      |
| `pnpm test`             | Vitest unit — 117 archivos, 1402 tests      |
| `pnpm test:integration` | Vitest integration — requiere Postgres real |
| `pnpm test:e2e`         | Playwright (requiere `pnpm db:seed` previo) |
| `pnpm db:push`          | Push del schema a BD (dev, sin migraciones) |
| `pnpm db:seed`          | Seed base                                   |
| `pnpm db:studio`        | Prisma Studio GUI                           |

---

## Stack técnico

| Capa           | Tecnología                                                   |
| -------------- | ------------------------------------------------------------ |
| Framework      | Next.js 15 (App Router, `typedRoutes`)                       |
| Lenguaje       | TypeScript strict                                            |
| Estilos        | Tailwind CSS 3 + tokens `--k-*` en `globals.css`             |
| Iconos         | `lucide-react`                                               |
| Animaciones    | Framer Motion 11 vía `LazyMotion`                            |
| Gráficas       | Recharts 3 detrás de `next/dynamic` + SVG propio             |
| Auth           | NextAuth.js 4 — magic link, OTP, password, Google, dev-login |
| ORM            | Prisma 6 + PostgreSQL :5434                                  |
| Pagos          | Mercado Pago + efectivo (no hay Stripe)                      |
| IA             | Google Gemini — OCR, planes, predicciones, con fallback      |
| Validación     | Zod                                                          |
| Tests          | Vitest (unit + integration) · Playwright (e2e)               |
| Observabilidad | Sentry + PostHog — **activos**, 12 eventos tipados           |
| CI             | GitHub Actions: typecheck, lint, unit tests + Lighthouse CI  |

---

## Diseño visual — V3 "Cuarto Oscuro"

Paleta lima neon monocromática, dark-only forzado:

`--k-bg #08080a` · `--k-surface #0f1014` · `--k-line #1c1c24` ·
`--k-t1 #f5f5f7` · `--k-t2 #8a8a94` · `--k-t3 #7a7a84` ·
`--k-accent #c8ff2d` (único color de marca) · `--k-warning #ffb020` y
`--k-danger #ff5a5a` **solo para warning y error de verdad**.

Fuentes: **IBM Plex Mono** (display, números) · **Inter** (body).

Reglas de casa: iconos con `lucide-react` (nunca emoji), enums siempre por
`src/lib/labels.ts` (nunca `PAID` crudo en la UI), dinero y fechas por
`src/lib/format.ts`, y color para cosas distintas / opacidad para intensidad.
El detalle completo está en [`CLAUDE.md`](./CLAUDE.md).

---

## Multi-tenancy

Toda query de datos va envuelta en `withTenant(tenantId)`:

```typescript
// Correcto
const db = withTenant(session.user.tenantId);
const athletes = await db.athlete.findMany();

// Prohibido — expone datos de todos los tenants
const athletes = await prisma.athlete.findMany();
```

El `tenantId` viene del JWT (`session.user.tenantId`). Única excepción: buscar
un Box por slug durante el auth.

---

## Contributing

1. Branch desde `rebuild/base` mientras dure el rediseño (`main` después):
   `git checkout -b feat/<nombre> rebuild/base`
2. Para trabajo en paralelo, worktree propio con ownership explícito de rutas:
   `git worktree add ../kronos-<feature> -b feat/<nombre>`. Un solo escritor por
   archivo; lo que esté fuera de tu ownership se reporta, no se toca.
3. `pnpm typecheck && pnpm lint && pnpm test` en verde antes del PR. Los guards
   de higiene (`tests/unit/dialect-guard.test.ts`, `tests/unit/ui-guards.test.ts`)
   corren dentro de `pnpm test` y son ratchets: los conteos solo bajan.
4. Conventional commits: `feat(scope): …` / `fix(scope): …` / `chore(scope): …`
