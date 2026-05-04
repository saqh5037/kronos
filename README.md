# Kronos — El sistema operativo del box

SaaS multi-tenant para boxes de CrossFit. Gestión completa: atletas, clases, WODs, reservas, pagos, gamificación y app móvil-web para atletas.

---

## Quick start

### Prerrequisitos

- Node.js 22+ (via nvm recomendado)
- pnpm 9+
- Docker Desktop

### Setup

```bash
# 1. Clonar
git clone <repo> kronos && cd kronos

# 2. Variables de entorno
cp .env.example .env.local
# Edita .env.local — cambia NEXTAUTH_SECRET con: openssl rand -base64 32

# 3. Levantar Postgres en puerto :5434
docker compose up -d db

# 4. Instalar dependencias
pnpm install

# 5. Push del schema y seed inicial
pnpm db:push
pnpm db:seed

# 6. Dev server
pnpm dev
```

Abre http://localhost:3000 — redirige a `/admin`.

---

## Estructura del proyecto

```
kronos/
├── prisma/
│   ├── schema.prisma          # Schema multi-tenant completo
│   └── seed.ts                # 2 boxes, 5 atletas, WODs, clases, badges
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/login/      # Magic link + Google OAuth
│   │   ├── admin/             # Panel del coach/owner
│   │   ├── atleta/            # App móvil-web del atleta
│   │   └── tv/                # Pantalla del box (Fase 2)
│   ├── components/
│   │   ├── kronos/            # Primitivos UI: HaloRing, TabBar
│   │   └── AdminSidebar.tsx
│   ├── server/
│   │   ├── auth.ts            # NextAuth config
│   │   ├── db.ts              # Prisma + withTenant()
│   │   ├── tenant.ts          # AsyncLocalStorage tenant context
│   │   └── actions/           # Server Actions (athletes, etc.)
│   ├── lib/
│   │   ├── utils.ts           # cn() helper
│   │   └── validations/       # Zod schemas
│   ├── middleware.ts          # Protección de rutas /admin y /atleta
│   └── types/
│       └── next-auth.d.ts     # Session types extendidos
├── _design-source/            # Mockups JSX de referencia (no se compila)
├── tests/unit/                # Vitest unit tests
├── e2e/                       # Playwright e2e
└── docker-compose.yml         # Postgres :5434
```

---

## Comandos principales

| Comando          | Descripción             |
| ---------------- | ----------------------- |
| `pnpm dev`       | Dev server en :3000     |
| `pnpm build`     | Build de producción     |
| `pnpm typecheck` | TypeScript sin emitir   |
| `pnpm lint`      | ESLint (Next.js strict) |
| `pnpm test`      | Vitest unit tests       |
| `pnpm test:e2e`  | Playwright e2e          |
| `pnpm db:push`   | Push schema a BD (dev)  |
| `pnpm db:seed`   | Seed con datos demo     |
| `pnpm db:studio` | Prisma Studio GUI       |

---

## Stack técnico

| Capa           | Tecnología                          |
| -------------- | ----------------------------------- |
| Framework      | Next.js 15 (App Router)             |
| Lenguaje       | TypeScript strict                   |
| Estilos        | Tailwind CSS 3 + custom tokens      |
| Componentes    | shadcn/ui (por agregar en Fase 1)   |
| Animaciones    | Framer Motion 11                    |
| Auth           | NextAuth.js 4 (magic link + Google) |
| ORM            | Prisma 6 + PostgreSQL :5434         |
| Validación     | Zod                                 |
| Tests unit     | Vitest                              |
| Tests e2e      | Playwright                          |
| Observabilidad | Sentry + PostHog (cableados)        |
| CI             | GitHub Actions                      |

---

## Diseño visual

Paleta dark "Kronos": `--bg #1a1d20` · `--recovery #19f08b` · `--strain #3aa3ff` · `--pr #ff5e5e`

Fuentes: **Inter** (UI) · **Space Grotesk** (display/títulos) · **JetBrains Mono** (datos/eyebrows)

Referencia visual completa: [`_design-source/README.md`](./_design-source/README.md)

---

## Lane discipline (quién toca qué)

| Lane            | Scope                                                                    | Regla                                                        |
| --------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------ |
| **Kimi**        | UI/CSS: `src/app/**`, `src/components/**`, `*.css`, `tailwind.config.ts` | Maneja diseño visual, mockups, porting del `_design-source/` |
| **Claude Code** | Backend: `src/server/**`, `prisma/**`, `src/lib/**`, tests, CI           | Lógica de negocio, multi-tenancy, server actions, BD         |
| **Ambos**       | `src/app/.../page.tsx` que mezcle datos + UI                             | Coordinar — Claude hace el data layer, Kimi el render        |

**Regla de oro:** NUNCA query sin `withTenant(tenantId)`. La única excepción es buscar un Box por slug durante el auth.

---

## Multi-tenancy

Cada query de datos debe ir envuelta en `withTenant(tenantId)`:

```typescript
// Correcto
const db = withTenant(session.user.tenantId);
const athletes = await db.athlete.findMany();

// Prohibido — expone datos de todos los tenants
const athletes = await prisma.athlete.findMany();
```

El `tenantId` del usuario viene del JWT (guardado en `session.user.tenantId`).

---

## Roadmap

| Fase       | Contenido                                         | Estado    |
| ---------- | ------------------------------------------------- | --------- |
| **Fase 0** | Scaffold, schema, auth, multi-tenancy, UI tokens  | Completa  |
| **Fase 1** | App atleta completa, reservas, WODs, leaderboards | Pendiente |
| **Fase 2** | Pantalla TV, pagos (MercadoPago), reportes        | Pendiente |
| **Fase 3** | Comunicaciones, gamificación completa, mobile PWA | Pendiente |
| **Fase 4** | Multi-box onboarding, billing SaaS, admin global  | Pendiente |

---

## Contributing

1. Crear branch desde `main`: `git checkout -b feature/<nombre>`
2. Respetar lane discipline de la tabla de arriba
3. `pnpm typecheck && pnpm lint && pnpm test` deben pasar antes del PR
4. Commit convention: `feat(scope): descripción` / `fix(scope): descripción`
