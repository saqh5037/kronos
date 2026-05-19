# seed-week — Simulación de semana en un box

Pobla el **último box creado con OWNER y onboarding completo** con una semana de actividad real: 5 atletas que pasan por el flujo de invitación, 28 clases (25 WOD lun-vie + 3 OPEN_BOX sábado), 20 reservas distribuidas.

Útil para:

- Mostrarle a un cliente un box "vivo" con datos.
- Validar end-to-end el flujo de invitación + reservas tras un cambio.
- Smoke test rápido pre-deploy.

## Comandos

```bash
# Dry-run: imprime el plan sin tocar BD
pnpm tsx scripts/seed-week.ts --dry-run

# Run real (recomendado para empezar)
pnpm tsx scripts/seed-week.ts

# Apuntar a un box específico
pnpm tsx scripts/seed-week.ts --box-slug iron-hands-polanco

# Email real via mail.tm (requiere RESEND_API_KEY)
pnpm tsx scripts/seed-week.ts --real-email

# Cambiar número de atletas (1-50)
pnpm tsx scripts/seed-week.ts --athletes 10

# Forzar WAITLIST: capacidad de 3 por clase
pnpm tsx scripts/seed-week.ts --small-capacity

# Solo atletas + clases, sin reservas
pnpm tsx scripts/seed-week.ts --skip-bookings

# Limpiar lo que el script creó previamente
pnpm tsx scripts/seed-week.ts --reset
```

## Cómo identifica el box target

Por defecto: `Box.findFirst({ orderBy: { createdAt: "desc" }, where: { onboardingCompletedAt: { not: null }, users: { some: { role: "OWNER" } } } })`.

Si quieres uno específico: `--box-slug <slug>`. El script aborta si el slug no existe.

El primer log muestra el box elegido — interrúmpelo si no es el que querías.

## Idempotencia

- Cada corrida usa timestamp único en el email (`seed-atleta-<ts>-N@kronos-seed.local`), por lo que no chocan entre runs.
- Antes de invitar, el script verifica que NO existan invitaciones con prefijo `seed-atleta-` para ese box. Si las hay, aborta y pide `--reset`.
- `--reset` borra: invitaciones, atletas, users, bookings y clases del seed previo (clases creadas en últimas 24h dentro de la próxima semana).

## Modos de email

**DB mode (default):**

- No envía emails. El script lee el token directamente de la BD.
- Es lo más rápido (~5s para 5 atletas).
- Sirve perfectamente para poblar el box; NO valida que Resend funcione.

**Real mode (`--real-email`):**

- Crea un inbox temporal por atleta en [mail.tm](https://mail.tm) (API pública gratuita).
- Llama a `sendEmail()` con la address de mail.tm — Resend debe estar cableado (`RESEND_API_KEY`).
- Hace polling al inbox 60s esperando el email.
- Si mail.tm timeout, falla al ese atleta y usa fallback DB.
- Útil para validar deliverability, DNS, template HTML en cliente de mail real.

## Distribución de clases creadas

```
Lun-Vie: 5 clases WOD  (6:00, 7:00, 9:00, 17:00, 18:00)  = 25 clases
Sábado:  3 clases OPEN_BOX (8:00, 9:00, 10:00)             = 3 clases
Domingo: cerrado                                            = 0 clases
                                                  Total:    28 clases
```

Todas con `coachId = ownerId` (porque un box nuevo de un cliente típicamente no tiene coaches todavía).

## Distribución de reservas

- 4 reservas por atleta (5 × 4 = 20 totales)
- Distribuidas determinísticamente via Fisher-Yates con seed del athleteId
- Por defecto todas BOOKED (capacidad 12). Con `--small-capacity` capacidad 3 — las primeras 3 quedan BOOKED, las siguientes WAITLIST.

## Limitaciones conocidas

1. **`createClass()` UI no expone `kind`** — la action de Next.js solo crea WOD. El script va con Prisma directo para crear OPEN_BOX sábados. La UI de programación tampoco muestra el distintivo todavía.
2. **Timezone estático**: el helper `buildClassStartsAt` asume offset fijo (México UTC-6). Boxes en zonas con DST agresivo pueden quedar desfasados 1h.
3. **No genera scores ni PRs**: solo atletas + clases + reservas. Para data más rica (PRs, badges, leaderboards), correr `pnpm db:seed` después.

## Verificación post-run

```bash
# Atletas creados
pnpm tsx -e "
import { db } from './src/server/db';
(async () => {
  const u = await db.user.findMany({
    where: { email: { startsWith: 'seed-atleta-' } },
    select: { email: true, athlete: { select: { _count: { select: { bookings: true } } } } }
  });
  console.table(u);
  await db.\$disconnect();
})();
"
```

O abrir el admin en el navegador:

- `/admin/dashboard` — KPIs del día reflejados
- `/admin/atletas` — los 5 atletas nuevos
- `/admin/programacion` — calendario con 28 clases
- `/admin/reservas` — 20 reservas
- `/admin/leaderboards` — ranking de asistencia

## Test e2e relacionado

`e2e/box-week-simulation.spec.ts` valida el mismo flujo con UI real (modales, clicks, redirects). Es una versión reducida (2 atletas, 2 clases, 1 booking) que firma que la UI funciona. ~1 min.

```bash
pnpm test:e2e e2e/box-week-simulation.spec.ts
```
