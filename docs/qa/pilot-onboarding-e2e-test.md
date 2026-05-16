# QA playbook — Pipeline piloto-onboarding end-to-end

Valida F1.7 (wizard pilotos) + F1.8 (firma piloto-beta) + CP.1 (trial expiring drip) localmente antes de ofrecer a un Box piloto real.

**Estimado**: 10 minutos.

## Pre-requisitos

- Dev server corriendo en `:3000` (`pnpm dev`)
- Postgres del compose corriendo en `:5434` (`docker compose up -d db`)
- `.env.local` con:
  - `NEXT_PUBLIC_DEV_LOGIN="1"`
  - `SUPER_ADMIN_EMAILS="owner@iron-hands.demo"` (o tu email seed)
  - `PILOT_BETA_TOKEN_SECRET="..."` (mín 16 chars)
- Seed aplicado al menos una vez (`pnpm db:seed`) para que existan disciplines + owner@iron-hands.demo

## Flow E2E

### Paso 1 — Login como super-admin

1. Abre `http://localhost:3000/login`
2. Sección "Solo desarrollo" → email `owner@iron-hands.demo` + password `dev`
3. Click "Entrar (dev)" → debería redirigir a `/admin`

### Paso 2 — Crear Box piloto vía wizard

1. Navega a `http://localhost:3000/admin/super/pilotos/nuevo`
2. Llena el form con datos de prueba:
   - **Email owner**: `owner@boxprueba.test`
   - **Nombre completo**: `Owner Prueba`
   - **Box name**: `Box Prueba Hyrox`
   - **Slug**: `box-prueba-hyrox`
   - **Disciplina**: Hyrox
   - **Ciudad**: CDMX
   - **País**: MX
   - **Trial días**: 30 (default)
   - **Exclusividad días**: 60 (default)
3. Submit → debería mostrar pantalla de confirmación con boxId

### Paso 3 — Generar magic link de firma

En la terminal:

```bash
pnpm tsx --env-file=.env.local scripts/generate-pilot-beta-link.ts box-prueba-hyrox
```

Output esperado:

```
📦  Box Prueba Hyrox
    slug: box-prueba-hyrox
    id:   cm...
    geo:  CDMX, MX
    disciplina: Hyrox (hyrox)
    owner: owner@boxprueba.test (Owner Prueba)
    estado: TRIAL
    trial:  30 días restantes (vence 2026-06-15)
    exclusividad: 60 días restantes
    firma piloto-beta: ⏳ pendiente

🔗  Magic link (válido 7 días):
   http://localhost:3000/piloto-beta?token=...
```

Copia el URL.

### Paso 4 — Firmar el contrato

1. **Abre el link en modo incógnito o cierra sesión primero**: en producción, el owner del Box no tiene cuenta todavía, así que la page debe funcionar sin auth. Probarlo en incógnito asegura ese path.
2. Verifica que carga la page con:
   - Header "Firma piloto-beta · Cupo limitado"
   - Heading "Firma tu acuerdo piloto para Box Prueba Hyrox"
   - Resumen del acuerdo (4 bullets)
   - Form: nombre legal + checkbox términos
3. Llena el form:
   - **Nombre legal completo**: `Owner Prueba Completo`
   - **Checkbox**: marcado
4. Click "Firmar acuerdo piloto"
5. Espera la pantalla de confirmación verde: "¡Acuerdo firmado!" con fecha

### Paso 5 — Verificar persistencia

En la terminal:

```bash
pnpm tsx --env-file=.env.local scripts/generate-pilot-beta-link.ts box-prueba-hyrox
```

Output esperado:

```
    firma piloto-beta: ✓ 2026-05-16
```

Si la fecha aparece, F1.8 funcionó end-to-end. El audit log también quedó registrado:

```bash
docker compose exec db psql -U kronos -d kronos_db -c \
  "SELECT action, metadata, \"createdAt\" FROM \"AuditEvent\" WHERE action = 'PILOT_BETA_SIGNED' ORDER BY \"createdAt\" DESC LIMIT 3;"
```

### Paso 6 — Probar idempotencia (opcional)

Abre de nuevo el mismo magic link. Debería mostrar la pantalla "Ya firmaste el acuerdo" con la fecha original — no permite re-firmar (preserva evidence trail).

### Paso 7 — Probar link expirado/inválido (opcional)

- **Link tampered**: cambia un char del token al final → pantalla "Link no válido"
- **Sin token**: abre `/piloto-beta` (sin query string) → pantalla "Link incompleto"

## Limpieza tras el test

Borrar el Box de prueba:

```bash
docker compose exec db psql -U kronos -d kronos_db -c \
  "DELETE FROM \"User\" WHERE email = 'owner@boxprueba.test';
   DELETE FROM \"Box\" WHERE slug = 'box-prueba-hyrox';"
```

(El orden importa: User primero por FK).

## Smoke verify del cron CP.1 (opcional)

El cron `/api/cron/notify-trial-expiring` está armado pero requiere `CRON_SECRET` y un Box con `trialEndsAt` entre 1-3 días. Para probarlo:

```bash
# Simular Box con trial venciendo en 2 días
docker compose exec db psql -U kronos -d kronos_db -c \
  "UPDATE \"Box\" SET \"trialEndsAt\" = NOW() + INTERVAL '2 days', \"trialLastNotifiedAt\" = NULL WHERE slug = 'box-prueba-hyrox';"

# Disparar cron manualmente
curl -H "Authorization: Bearer $(grep CRON_SECRET .env.local | cut -d= -f2 | tr -d '\"')" \
  http://localhost:3000/api/cron/notify-trial-expiring
```

Output esperado: `{"ok":true,"scanned":1,"notified":1,"skipped":0,"errors":[]}`

El email a `owner@boxprueba.test` se loguea a console (no se envía sin RESEND_API_KEY).

## Si algo falla

| Síntoma                                    | Causa probable                                                    | Fix                                                       |
| ------------------------------------------ | ----------------------------------------------------------------- | --------------------------------------------------------- |
| Wizard tira 404                            | SUPER_ADMIN_EMAILS no setea o no reiniciaste dev                  | Verifica `.env.local` + `pkill -f "next dev" && pnpm dev` |
| Script falla con "PILOT_BETA_TOKEN_SECRET" | Env var faltante en `.env.local`                                  | Agregar var (mín 16 chars) + restart dev                  |
| /piloto-beta tira "Link no válido" siempre | Secret distinto entre script y dev server (uno reinició, otro no) | Restart dev server, regenerar link                        |
| Form firma no responde                     | NEXT_PUBLIC_DEV_LOGIN cookie persiste                             | Probar en incógnito (escenario real es sin sesión)        |
