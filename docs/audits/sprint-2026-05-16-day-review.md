# Auditoría Sprint Kronos 2026-05-16

> 12 commits, 2 schema deploys (`Box.trialLastNotifiedAt`, `AuditAction.PILOT_BETA_SIGNED`), 1130 tests reportados. Auditoría por: architect agent. Scope: `0c9d851..3f9a7fa`.

## Resumen ejecutivo

- **Bug funcional latente en F1.5 cache**: los tags granulares por boxId nunca se registran (`unstable_cache` usa el array de tags global `["box-discipline"]`); las invalidaciones granulares no invalidan nada. El cache "funciona" hoy porque siempre se cae al tag global, pero la API granular es decorativa. Bajo riesgo de producción inmediato, alto riesgo de bug confuso cuando F2 conecte mutadores.
- **Gap de seguridad: `generatePilotBetaTokenForBox` y `listPilotBoxes` no validan super-admin dentro de la action**. Hoy las protege únicamente el layout `/admin/super/*` por `notFound()`. Una server action está expuesta como POST RPC en cualquier ruta del mismo origen — alguien autenticado podría disparar `generatePilotBetaTokenForBox` desde `/admin` (no super) si conoce el endpoint Next genera. Es defensa-en-profundidad faltante. `createPilotBox` sí valida, así que el patrón está al alcance.
- **Test del SmartWODForm es un placebo**: `tests/unit/smart-wod-form.test.ts` no importa el componente. Re-implementa la lógica en un helper local y prueba el helper. Cero protección de regresión real. Si alguien borra el `if (disciplineSlug === "hyrox")` del componente, los 4 tests siguen verdes.
- **Voseo argentino sigue presente en 18+ archivos** (CLAUDE.md lo marca como regla cardinal). Owners de los Boxes piloto van a leer "podés / tenés / querés" en `/admin/billing`, `/admin/ajustes/seguridad`, `/admin/onboarding`, etc. Severidad alta para identidad de producto, baja para riesgo técnico.
- **Drift de migraciones: 2 nuevos cambios de schema deployados con `db push --skip-generate`**. El runbook ya advierte deuda #352. Cobra cuando intentes hacer `migrate deploy` para promover un nuevo cambio: Prisma encontrará columnas/enums que no existen en migration history y exigirá baseline. Plan: agendar baseline a una fecha. **Antes** de F2 grande.

---

## Hallazgos por severidad

### Crítico (bloquea producción / requiere fix antes de pilot real)

- **`src/server/cache.ts:46-50` + `:73-77` — tags granulares nunca registrados.** Los `unstable_cache` registran `tags: ["box-discipline"]` y `tags: ["athlete-memberships"]` (constantes globales). Las funciones de invalidación intentan invalidar `cacheTags.boxDiscipline(boxId) → "box:${boxId}:discipline"`, que jamás se asignó a entrada alguna. Las cache entries solo se invalidan vía el tag global. Resultado: hoy "funciona por casualidad" porque invalidateBoxDiscipline también llama `revalidateTag("box-discipline")`. Fix: pasar `tags` como función del input (`(boxId) => [cacheTags.boxDiscipline(boxId), "box-discipline"]`) — Next.js soporta esa forma.
- **`src/server/actions/super-pilotos.ts:54,136` — server actions sin gate propio.** Tanto `listPilotBoxes` como `generatePilotBetaTokenForBox` se marcan `"use server"` y se exportan, lo que las convierte en endpoints invocables. Comparar con `pilot-onboarding.ts:78-85` que sí valida `isSuperAdmin(session?.user?.email)`. Fix: copiar exactamente ese bloque al inicio de ambas actions. El comentario "NO requiere super-admin gate aquí — el layout ya lo aplica" es incorrecto a nivel modelo de amenazas: las server actions de Next no están gateadas por el layout que las importa.

### Alto (debería arreglarse en siguiente sprint)

- **`src/app/admin/super/pilotos/CopyMagicLinkButton.tsx:31` — `result.expiresAt.toLocaleDateString` corre en cliente sin locale fijo después de venir de un server action.** El Date se serializa OK, pero `toLocaleDateString("es-MX", ...)` depende del runtime del browser. En toast no rompe hidratación, pero sí podría dar fecha distinta entre devices con timezones distintas para el mismo "7 días desde ahora". Diferencia es < 24h, así que es cosmético.
- **`src/server/actions/pilot-beta.ts:35-131` — sin rate limit.** Honeypot ayuda pero un atacante con un magic link válido (link filtrado/reusado) puede spamear submissions hasta que `Box.pilotBetaSignedAt` se setee. Cada intento dispara `prismaBase.box.findUnique`. Aplicar `rateLimit(\`pilot-beta:${ip}\`, 5, 60_000)` como en founding-dominus. Riesgo de DoS bajo (el HMAC verify es barato) pero gratis de prevenir.
- **`src/server/actions/pilot-onboarding.ts` y `founding-dominus.ts` — sin `logAudit` para BOX_CREATED.** Solo se loggea en `signPilotBeta`. Si un super-admin (Samuel) o un atacante con sesión válida crea Boxes basura, no hay trail. Acción: agregar `AuditAction.BOX_CREATED` enum + `logAudit({ action: "BOX_CREATED", actorId, tenantId: box.id, targetType: "Box", targetId: box.id, metadata: { source: "wizard" | "founding" } })` después del transaction commit en ambos paths.
- **`tests/unit/smart-wod-form.test.ts:18-23` — test placebo.** Cualquiera puede borrar el dispatcher del componente real y los tests siguen verdes. Fix: usar `@testing-library/react` + render real con `<SmartWODForm disciplineSlug="hyrox" .../>` y assert que el placeholder con texto "Hyrox · Editor en construcción" está en el DOM. Mockear `next/dynamic` si hace ruido (vitest tiene patrón documentado para esto).
- **Voseo argentino en producción.** 18+ archivos identificados con `grep -nE "querés|podés|tenés"`. Los más visibles a Owners piloto:
  - `src/app/admin/ajustes/seguridad/page.tsx:74` — "Ya tenés una contraseña configurada. Podés cambiarla..."
  - `src/app/admin/billing/page.tsx:92` — "Aún no tenés un estado de suscripción registrado."
  - `src/app/admin/billing/checkout/page.tsx:34` — "podés simular el pago..."
  - `src/app/admin/onboarding/OnboardingWizard.tsx:503,578` — wizard que TODOS los Owners ven en primer login.
  - `src/components/auth/MagicLinkWaiting.tsx:162` — "Lo podés usar en Chrome..."
    Acción: sweep `perl -i -pe` mexicanizando (tenés→tienes, podés→puedes, querés→quieres, usá→usa, fijate→fíjate, tildá→marca). 30 min, sin riesgo. Hacerlo antes del primer link a un Box real.
- **`src/app/admin/super/pilotos/page.tsx:199,267,347` — referencia a `--k-font-plex-mono` que no existe.** El token correcto es `--k-font-display` (alias en `globals.css:1674-1675`). Cae al fallback `monospace` system. Cosmético, pero rompe la consistencia "todo Plex Mono en super-admin dashboard". Fix: reemplazar con `var(--k-font-display)`.

### Medio (deuda técnica visible, no bloquea)

- **AdminSidebar.tsx 992 líneas con 9 sub-componentes internos** (KronosLogo, KronosMark, BoxCard, LiveStrip, LiveClock, NavItem, SignOutNavItem, NavGroup, NavIcon, default). Ya no es un Sidebar — es un módulo de brand-system. Split sugerido:
  - `src/components/brand/KronosLogo.tsx` (ya existe uno con mismo nombre — verificar conflicto)
  - `src/components/admin/sidebar/BoxCard.tsx`
  - `src/components/admin/sidebar/LiveStrip.tsx` + `LiveClock.tsx`
  - `src/components/admin/sidebar/NavItem.tsx` + `NavGroup.tsx`
    Beneficio: hot reload más rápido, test del KronosLogo aislado, reuso del LiveStrip en posibles dashboards.
- **`src/components/wod-form/SmartWODForm.tsx:26 + HyroxWODFormPlaceholder.tsx:1-50` — split por dynamic ahorra ~1KB.** El placeholder son 50 líneas de JSX estático sin imports de runtime. El "ahorro de bundle CrossFit" es teórico hasta que el editor Hyrox real (con stations + race format) entre. Hoy: overhead de runtime + un round trip más por hidratación del dynamic. Recomiendo dejar el `dynamic({ ssr: false })` solo cuando se implemente la versión real; mientras tanto un import directo basta y es 1 render menos. **Trade-off**: si lo dejas armado, el día que llegue el código pesado solo cambias `HyroxWODFormPlaceholder` por `HyroxWODFormReal` y el infrastructure ya está. Decisión de Samuel.
- **F1.3 `DisciplineBranding` config inline escalable a 4 disciplinas, no a 20.** Para F3 (Yoga + Pilates) está bien — agregar 2 entradas al record es trivial. El día que sumen 5+ disciplinas con copy distinto por país, el archivo va a partirse en `src/lib/branding/crossfit.ts`, etc. No pre-optimizar.
- **`src/server/actions/super-pilotos.ts:79-86 + 92-99` — query con `_count` + groupBy separado.** No es N+1 (es 2 queries fijas: 1 findMany + 1 groupBy). OK hasta ~500 pilotos. Pasado eso, sustituir por una raw query con LEFT JOIN al subselect de PushSubscription count. No urgente — Samuel tendría que escalar primero.
- **`src/lib/pilot-beta-token.ts:64-83` — implementación HMAC propia vs `jsonwebtoken`.** Justificable: 0 dependencias, ~60 líneas auditables, sin features que no usemos (audience, issuer, etc). El payload es `{boxId, exp}` — no necesita la complejidad de JWT. Lo único faltante para alcanzar paridad: no incluir `iat` (issued-at). Si en futuro quieres revocar tokens emitidos antes de fecha X, no puedes. Acción opcional: agregar `iat` al payload + chequear contra `process.env.PILOT_BETA_TOKEN_REVOKE_BEFORE`.

### Bajo (mejora opcional)

- **PR #37 (`3f9a7fa`) +1287/-321 en 1 commit** mezclando CSS, AdminSidebar, AdminDashboardV3, e icons. Coherente como "aplicar diseño Visual BOX" pero el size penaliza review. Split sugerido a futuro: 1 commit para iconos nuevos, 1 commit para CSS extension, 1 commit para refactor AdminSidebar, 1 commit para refactor Dashboard. Lección post-mortem, no acción urgente.
- **`src/server/cache.ts:7-9` — comentario "wrappers listos pero NO consumidos por UI todavía"** falso desde `src/app/admin/wods/page.tsx:32` que sí usa `getCachedBoxDiscipline`. Actualizar comentario para reflejar el estado.
- **`scripts/generate-pilot-beta-link.ts:32` — `process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"`.** El default localhost es razonable en dev pero peligroso si Samuel corre el script desde EC2 sin la env: generaría links rotos. Cambiar default a `https://www.kronos-fit.com` y forzar warning si no está seteada.

---

## Por área

### 1. Seguridad

**Token HMAC F1.8 (`src/lib/pilot-beta-token.ts`)** — diseño sólido para el use case. Cobertura de amenazas:

| Vector                              | Cubierto                                                | Notas                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tampering del payload               | Sí                                                      | `timingSafeEqual` después de chequear `length`                                                                                                                                                                                                                                                                                             |
| Replay del mismo token              | Sí, hasta exp                                           | No hay `jti` ni revocación post-emisión. Si Samuel manda link a Owner X y el link se filtra (correo comprometido), atacante puede firmar como X dentro de los 7 días. Mitigación actual: `pilotBetaSignedAt` es idempotente (ALREADY_SIGNED). Si X ya firmó, atacante no puede sobreescribir. Si X no firmó, atacante firma con su nombre. |
| Mismatch de secret entre instancias | Detectado como `INVALID_SIGNATURE`                      | OK. Único riesgo: si rotas secret en server pero el script de Samuel todavía tiene el viejo, links generados quedan inválidos. Solución: rotation policy + revalidación tras rotación.                                                                                                                                                     |
| Token expirado con sig válida       | Rechazado como `EXPIRED`                                | OK. Chequeo de exp es lo último — significa que tokens válidos pero expirados se distinguen claramente.                                                                                                                                                                                                                                    |
| Brute force del secret              | 16+ chars min HMAC-SHA256 — computacionalmente inviable | OK                                                                                                                                                                                                                                                                                                                                         |
| Brute force del payload             | Imposible sin secret                                    | OK                                                                                                                                                                                                                                                                                                                                         |

**Gaps**:

1. **No hay `jti` (token ID)** — no puedes invalidar un token específico antes de exp. Si Samuel descubre que mandó el link al email equivocado, la única salida es esperar a que expire o rotar el secret (invalida TODOS los tokens). Considerar tabla `RevokedPilotBetaToken { jti, revokedAt }` chequeada en verify. Trabajo: ~30 min, beneficio: respuesta a incidentes en <5min.
2. **No hay rate limit en `signPilotBeta`**. Atacante con token válido puede spamear el endpoint hasta race-condition con el `box.findUnique → box.update`. Riesgo bajo (idempotente, pero gasta DB queries). Aplicar `rateLimit` como founding-dominus.

**`generatePilotBetaTokenForBox` (super-pilotos.ts:136-165)** — falta gate explícito. La server action está exportada con `"use server"`. La protección del layout `/admin/super/*` aplica al render del page, no al RPC del server action. Un atacante con session válida (cualquier OWNER de cualquier Box) podría disparar la action si conoce el endpoint generado por Next. Fix obligatorio:

```ts
const session = await getServerSession(authOptions);
if (!isSuperAdmin(session?.user?.email)) {
  return { ok: false, error: "UNAUTHORIZED" };
}
```

Mismo para `listPilotBoxes`. Bajo es perfectamente posible que Next bloquee esto a nivel framework (la doc menciona "Server Actions are public HTTP endpoints"), pero defensa en profundidad es gratis y consistente con el patrón de `createPilotBox`.

**`SUPER_ADMIN_EMAILS` env-based gate** — pragmático para 1 super-admin (Samuel). Cuando agregues ops humanos:

- Pro: zero migration, instant revoke (remove email + restart).
- Con: cada deploy reinicia el proceso = ventana de minutos sin gate si la env no carga. Mitigar con `notFound()` fail-closed (ya implementado).
- Recomendación futura (no urgente): mover a tabla `SuperAdmin { email, addedAt, addedBy }` cuando lleguen 3+ super-admins. No antes — añadiría complejidad sin valor.
- **2FA / IP whitelist** no aplica todavía. Un solo super-admin, el blast radius es manejable. Después del primer Box piloto real, vale la pena agregar `WebauthnPasskey` en NextAuth para el email super-admin específico.

**Cron `/api/cron/notify-trial-expiring`** — Bearer auth correcto, 503 si secret falta (fail-closed). Pero el crontab del servidor EC2 con `Authorization: Bearer $CRON_SECRET` hardcoded en `crontab -l` es exposure point: cualquiera con shell en EC2 lee el secret. Mitigación:

- Mover el secret a `/etc/kronos/cron.env` (chmod 600 root:root) y que el cron job haga `source` antes del curl.
- O migrar a Vercel Cron (ya configurado en `vercel.json:23-26`) y dejar EC2 sin crontab para esto. Vercel pasa el header automáticamente.
- Si EC2 cron debe quedarse: rotation cada 90 días + log de uso del endpoint.

**F1.9 `disciplineSlug` en `founding-dominus`** — auto-activa `features.hyrox = true` (línea 178). Validación: el schema (`FoundingDisciplineSlug` enum de zod) limita a `crossfit | hyrox`. Sin abuse vector — no puedes mandar `?disciplineSlug=admin` para activar features arbitrarias. El zod parse rechaza primero. OK.

### 2. Arquitectura y trade-offs

**F1.5 cache layer** — la decisión de mantener `AuditEvent` (historial inmutable) + `Box.trialLastNotifiedAt` (current state) es **correcta**. Patrón estándar de "event sourcing light":

- `AuditEvent` es la fuente de verdad histórica. Inmutable, append-only.
- `Box.trialLastNotifiedAt` es proyección rápida para throttle. Mutable.

El riesgo es que se desincronicen — alguien actualiza `trialLastNotifiedAt` sin agregar AuditEvent. Mitigación: encapsular la mutación dentro de `notifyTrialExpiring` que escribe ambos. Hoy lo hace (revisar `notifyTrialExpiring`). Patrón similar en el código: `Box.pilotBetaSignedAt` + `AuditEvent PILOT_BETA_SIGNED`, `Box.subscriptionStatus` + `SaasSubscription` history.

**F1.4 SmartWODForm con dynamic** — el dynamic import + placeholder es **correcto en arquitectura pero prematuro en payoff**. El bundle Hyrox son 50 líneas — el ahorro hoy es <1KB. Cuando el editor real entre, el dynamic ya armado ahorra ~20-50KB en el bundle base CrossFit (suponiendo stations + draggable + race timer). Mantener como inversión hacia el futuro. **No build-time conditional** porque cada Box puede cambiar discipline en runtime (via super-admin tool) — debe poder cargar el editor opuesto sin recompilar.

**F1.3 DisciplineBranding** — config inline escalable a F3 (Yoga + Pilates) sin refactor. Más allá necesita partición:

- Hoy: `BRANDING_BY_SLUG = { crossfit, hyrox }` — 2 entradas, ~70 líneas.
- F3: agregar yoga, pilates — ~150 líneas, sigue OK.
- F4+ (5+ disciplinas): split a `branding/{slug}.ts` + index re-export.

Decisión arquitectónica solo cuando llegues a 5+. Hoy: dejar inline.

**CP.2 listPilotBoxes** — query con `_count` interno (athletes, wods) + `groupBy` separado para PushSubscription. Es 2 queries totales, ambas escaladas linealmente con número de pilotos. No es N+1 (que sería 1 + N queries). Para 100 pilotos: ~5-10ms total. Para 1000: ~50ms (un solo groupBy con tenantId IN ()). Plan: si pasamos 500 pilotos, raw SQL con CTE. Hoy: no toquen.

**F1.8 token sin `jsonwebtoken`** — **justificado**. La decisión paga así:

- `jsonwebtoken` (4MB minified incluyendo deps de crypto) → vendor lock + features que no usas (RS256, audience, etc).
- HMAC propio (60 líneas, Node `crypto`) → cero dependencias, auditable de un vistazo.

El único feature de JWT que aporta valor es `iat` (issued-at) para revocación temporal — agregar 1 línea. Premature optimization no es; es la solución correcta dado el scope.

**PR #37 size (+1287/-321 en 1 commit)** — coherente como "aplicar diseño visual" pero penaliza review. Mejor pattern futuro:

- 1 commit: add icons (icons.tsx)
- 1 commit: CSS extension en globals.css
- 1 commit: refactor AdminSidebar (con su 894 líneas)
- 1 commit: refactor AdminDashboardV3
- 1 PR merge

Cada uno bisectable independientemente. Lección para futuras visual sweeps grandes.

### 3. Calidad de código

**Convención de tests de integration (pilot-onboarding)**: mock de `next-auth` + `@/server/auth` + `@/lib/super-admin`, DB Postgres real. **Buen patrón** porque:

- Mock solo la frontera de auth (donde Vitest no puede inyectar session real).
- DB real garantiza que constraints (FK, unique slug, JSON serialization de `features`) se respeten.
- `vi.hoisted` evita el bootstrap-order trap de Vitest.

**Frágil**: el cleanup de `afterAll` borra users + boxes pero si el test crashea a mitad, residuos persisten. Sugerencia: usar Prisma transaction y rollback al final, o un `tenantId` con prefijo `__test__` que tenga un sweep diario.

**Server actions sin `withTenant()`**: `pilot-onboarding`, `super-pilotos`, `pilot-beta` usan `prismaBase` directo. **Justificado** porque:

- `pilot-onboarding` crea el Box (no hay tenantId que aplicar antes).
- `super-pilotos` opera cross-tenant intencionalmente.
- `pilot-beta` recibe el `boxId` del token verificado, no de session.

NO es leak de multi-tenancy — es scope correctamente super-admin / sin-sesión. Sí confirmar en review que el patrón sigue cuando agreguen funcionalidad. Por ejemplo: si `listPilotBoxes` después agrega "ver scores del Box", esa parte SÍ debe usar `withTenant(box.id)`.

**Voseo deuda** — 18+ archivos. Severidad **alta para identidad de producto**:

```
src/app/admin/ajustes/seguridad/page.tsx:74          (Owner-facing)
src/app/admin/ajustes/seguridad/PasswordForm.tsx:28  (Owner-facing)
src/app/admin/_components/CoachClassesTodayCard.tsx:39 (Coach-facing)
src/app/admin/programacion/_components/DayView.tsx:86 (Admin)
src/app/admin/billing/page.tsx:92                    (Owner)
src/app/admin/billing/checkout/page.tsx:34           (Owner)
src/app/admin/billing/checkout/_components/CheckoutClient.tsx:89
src/app/admin/atletas/forma/page.tsx:52
src/app/admin/onboarding/OnboardingWizard.tsx:503,578  (TODOS los nuevos Owners)
src/server/otp.ts:40                                 (comment, ignorable)
src/server/ocr/photo-wod.ts:64                       (AI prompt — IMPACTA OUTPUT)
src/server/ai/coach-cards-prompt.ts:127              (AI prompt — IMPACTA OUTPUT)
src/server/actions/password.ts:86
src/components/auth/MagicLinkWaiting.tsx:25,162      (TODOS los login)
src/lib/rate-limit.ts:54,81                          (comment, ignorable)
```

Los AI prompts (`photo-wod.ts:64`, `coach-cards-prompt.ts:127`) son críticos: el modelo aprende del prompt y replica el voseo en sus outputs hacia atletas. Sweep urgente. **Tiempo estimado: 30 min de perl bulk + 5 min de review**.

**F1.6 fonts cleanup** — `grep -rE "font-playfair|font-dancing|font-jetbrains"` da 0 hits en `src/`. Limpio. Confirmar manualmente que `_design-source/` no tiene tampoco (no es código compilado pero como referencia es bueno limpiar).

**PR #37 AdminSidebar.tsx 992 líneas** — monolítico. 9 sub-componentes que merecen archivos propios. Beneficio operativo: hot-reload más rápido, lazy load del LiveStrip (que tiene `setInterval`), test del KronosLogo aislado. No urgente, agregar a backlog técnico.

### 4. Performance

**F1.6 fonts: 5 → 2** — la fuente de mayor LCP improvement es **no la cantidad de fonts sino el `display: swap`** + `preload`. Hoy `display: "swap"` está ON pero no hay `preload` explícito. Next/font hace preload automático para las fonts referenciadas en el layout root — lo cual ya pasa con Inter + Plex Mono. Impacto medible esperado: ~200-400ms LCP en 3G simulado. Probarlo con Lighthouse antes y después es trivial.

**F1.5 cache wrappers** — solo consumidos en `/admin/wods/page.tsx:32` (un solo path). El resto del admin sigue haciendo lookups directos. Es OK por ahora — F1.5 era infra. F2 debería conectar:

- `/admin/dashboard` — KPIs día (high traffic)
- `/atleta/inicio` — Box discipline lookup en cada page load (CRITICAL)
- `/atleta/perfil` — memberships

**F1.4 dynamic import HyroxWODFormPlaceholder** — el ahorro **hoy** es marginal (~1KB del placeholder). El ahorro **mañana** cuando entre el editor real va a ser sustancial. Inversión correcta.

**CP.2 listPilotBoxes** — `_count` + `groupBy` ya optimizado. Cuando agreguen "ver scores recientes del Box" en la tarjeta, sí debería ser lazy. Hoy la query es OK.

### 5. Tests

**Coverage de hoy: +33 tests netos** (10 cache + 6 trial-dispatch + 12 branding + 4 founding + 4 smart-wod + 10 token + 7 schema + 13 super-pilotos + 7 integration). Faltan:

- **`signPilotBeta` no tiene tests** (solo `pilot-beta-token` + `pilot-beta-schema`). El flow completo (token → verify → box lookup → update + audit) no se prueba. Riesgo medio: el path crítico no tiene regression test.
- **Cron route `/api/cron/notify-trial-expiring/route.ts`** sin test directo. La lógica está en `dispatchTrialExpiringNotifications` que sí tiene tests (trial-dispatch). El route es thin wrapper de auth Bearer — testable con un Request mock para verificar:
  - 503 si `CRON_SECRET` no setea (importante: si Samuel olvida la env, el endpoint debe estar OFF, no abierto)
  - 401 si Bearer falta
  - 401 si Bearer mismatch
    Hoy no hay nada de esto.
- **`generatePilotBetaTokenForBox` no testea el super-admin gate** — porque hoy no existe el gate. Tras el fix, agregar test "rechaza si caller no es super-admin (UNAUTHORIZED)".
- **`SmartWODForm` render real** — el test actual no importa el componente. Reemplazar con render test (ver Alto arriba).
- **Token edge cases faltantes** (mencionado en el prompt):
  - Payload con keys extra (`{boxId, exp, evil: true}`) — sig válida pero payload tiene basura. Hoy el verify acepta (solo chequea typeof boxId, exp). Acción: agregar `Object.keys(payload).length` check o usar zod en verify.
  - JSON malformado pero sig válida (`base64UrlDecode` retorna un string que no parsea). Hoy lo cubre el `try/catch` del `JSON.parse` → retorna INVALID_FORMAT. Test recomendado para no perder esto.

**F1.10 integration test** — solo cubre happy path + 4 errores. No cubre:

- `DISCIPLINE_NOT_FOUND` (slug válido pero disciplina marcada inactiva)
- `enableHyroxUI=true + disciplineSlug=crossfit` → ¿features.hyrox debería ser true? El código dice sí (línea 185-187). Test no verifica.
- Honeypot — el test pasa `website: ""` (no triggering) pero no prueba el path donde website tiene contenido.
- Caller con `session.user.email = null` (ej: sesión malformada) — el test mockea siempre con email.

Agregar 4 tests más = ~25 minutos.

### 6. Operaciones y deuda

**2 schema changes con `db push --skip-generate`** — deuda real:

- `Box.trialLastNotifiedAt` (CP.1)
- `AuditAction.PILOT_BETA_SIGNED` enum value (F1.8)

Ambos aplicados en EC2 directamente con `pnpm db:push`. Migration history sigue en `0_init` + `20260511143129_add_wellness_module`. No hay migration para los cambios de mayo. **Cobra cuando**:

- Necesites un `prisma migrate deploy` para promover un cambio futuro → Prisma compara `_prisma_migrations` table con migration folder y exige baseline.
- Quieras restaurar DB en otro environment (staging, dev nuevo) → `db push` desde schema funciona pero pierdes versionado.

**Plan recomendado** (1 hora total):

1. En EC2 (o local clonando prod DB): `prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --script > migrations/20260516_pilot_beta_baseline.sql`
2. Inspeccionar el SQL generado. Debería contener: ALTER TABLE Box ADD COLUMN trialLastNotifiedAt + ALTER TYPE AuditAction ADD VALUE 'PILOT_BETA_SIGNED'.
3. Crear `prisma/migrations/20260516143000_pilot_beta_baseline/migration.sql` con ese contenido.
4. En prod: `prisma migrate resolve --applied 20260516143000_pilot_beta_baseline` (marca como aplicada sin re-ejecutar).
5. De ahí en adelante volver a `migrate dev` para nuevos cambios.

**Env `PILOT_BETA_TOKEN_SECRET`** — necesita rotation strategy. Hoy:

- ¿Backup del valor? Si Samuel pierde acceso al EC2, no puede regenerar. Recomendación: `~/.claude/credentials/kronos-secrets.env` chmod 600 con todos los secrets (CRON_SECRET, PILOT_BETA_TOKEN_SECRET, NEXTAUTH_SECRET).
- ¿Rotation? Rotar invalida todos los tokens emitidos. Política: rotar solo si hay sospecha de leak. Si rotas, regenerar links activos manualmente.

**Crontab Bearer hardcoded** — ver sección Seguridad. Mover a `/etc/kronos/cron.env`.

**Binary dump en reflog (`58abf44`)** — el archivo `backups/kronos_pre-cleanup_2026-05-15-1634.dump` está en la base de datos de objetos de Git localmente (reachable via reflog HEAD@{4}). **Estado real**:

- NO está en `main` (`3f9a7fa` no lo contiene).
- NO está en PR #37 head (`d09bd690` no lo contiene — Samuel hizo `git reset HEAD^` antes de re-commit).
- NO está en ninguna rama remota (`git ls-remote` confirma).
- Local-only, expira automáticamente con `git gc` (default 90 días para reflog).

**Acción recomendada**: forzar gc local con `git reflog expire --expire=now --all && git gc --aggressive --prune=now` ahora. Tarda ~10 segundos. Después de eso, el blob desaparece de tu workstation. NO necesitas BFG porque nunca llegó al repo público. Si Samuel hizo push del branch en algún momento del día (debe verificar con `git reflog show feat/admin-visual-box-redesign@{remote}`), entonces sí necesita force-delete del remote branch + BFG.

**`docs/qa/pilot-onboarding-e2e-test.md` secret leak vía screenshot del terminal**:

- El playbook tiene comandos como `curl -H "Authorization: Bearer $(grep CRON_SECRET .env.local | cut -d= -f2 | tr -d '\"')"` que en el terminal se renderizan como `Bearer <valor>`. Si Samuel captura screenshot del comando ejecutado, leak.
- Mitigación: usar `bash -c '... "$CRON_SECRET" ...'` con `source ~/.env.local` previo. El shell expansion en logs muestra `$CRON_SECRET` literal.
- O simplemente recordar no hacer screenshot de comandos con secrets. Low risk si Samuel está consciente.

### 7. Riesgos para el primer Box piloto real

Si Samuel manda mañana el primer magic link, los **3 paths más probables de fallar**:

1. **El owner no recibe el email** — todo el flow F1.7 + F1.8 no envía email automáticamente. El playbook QA dice "Samuel mandará el link manual". El owner ve un correo de "Samuel Quiroz <samuel@...>" con un link, no de "Kronos". Riesgo: spam folder + percepción "esto no parece producto". **Mitigación**: agregar paso `await sendEmail({ to: ownerEmail, ... })` después de `createPilotBox` con el template de magic link. Trabajo: ~1h (template ya existe en email-templates/).
2. **Browser bloquea cookies/storage en incógnito** — el flow `/piloto-beta` no requiere session, OK. Pero después de firmar, el redirect a `/admin` exige login con magic link de NextAuth. Si el owner está en incógnito (como recomienda el playbook), la próxima magic link va a un browser, otro tab puede no estar sincronizado. **Mitigación**: tras la firma, mandar email "Bienvenido a Kronos" con magic link de auth para iniciar sesión.
3. **`PILOT_BETA_TOKEN_SECRET` no está en EC2** o tiene diferente valor que el script local — link generado en localhost, página corriendo en prod = INVALID_SIGNATURE. **Mitigación**: verificar antes del primer pilot con `curl -I https://www.kronos-fit.com/piloto-beta?token=test` y revisar que el response sea 200 (con InvalidStateScreen) y no 500.

**Top 3 riesgos consolidados**:

1. **Seguridad: gate ausente en server actions super-pilotos** (Alto-Crítico). Antes del primer link real, agregar el `isSuperAdmin` check a `generatePilotBetaTokenForBox` + `listPilotBoxes`. 10 minutos.
2. **Copy voseo en `/admin/onboarding/OnboardingWizard.tsx` y `/admin/billing/`** (Alto). El primer Owner externo va a aterrizar en estas páginas y leer "tenés / podés". Identidad de producto comprometida. 30 minutos de sweep.
3. **Email automático ausente del flow piloto-beta** (Medio-Alto). Samuel manda link manualmente — proceso frágil, sin tracking, sin branded sender. Si el piloto se siente "informal", la confianza baja. Agregar email branded antes del primer link. 1 hora.

---

## Recomendaciones priorizadas

**Antes del primer Box piloto real (este fin de semana)**:

1. **Fix gate en `super-pilotos.ts`** — agregar `isSuperAdmin` check al inicio de `listPilotBoxes` y `generatePilotBetaTokenForBox`. 10 min. **CRÍTICO**.
2. **Sweep voseo** — perl bulk en los 18+ archivos. 30 min. **ALTO**.
3. **Fix `--k-font-plex-mono` typo** en super-pilotos page. 5 min. **ALTO** (cosmético pero visible).
4. **Test del super-admin gate** que acabas de agregar. 15 min. **ALTO**.
5. **Verificar `PILOT_BETA_TOKEN_SECRET` en EC2** + smoke test del flow. 10 min. **CRÍTICO**.

**Siguiente sprint (este mes)**:

6. **Fix cache layer tags granulares** — el bug del `unstable_cache.tags` array vs function. 30 min. **ALTO**.
7. **Email automático tras `createPilotBox`** con magic link de firma. 1h. **MEDIO-ALTO**.
8. **Audit log en pilot-onboarding + founding-dominus** (`BOX_CREATED` enum). 20 min. **MEDIO**.
9. **Rate limit en `signPilotBeta`**. 10 min. **MEDIO**.
10. **Test real del `SmartWODForm`** (no helper). 30 min. **MEDIO**.

**Backlog técnico (siguiente Q)**:

11. **Baseline de migrations** para resolver drift `db push --skip-generate` (deuda #352). 1h. **MEDIO**.
12. **Split de `AdminSidebar.tsx`** en 5-6 archivos. 1h. **BAJO**.
13. **`git gc` local** para limpiar el dump del reflog. 1 min. **BAJO**.
14. **`jti` + revocation table** para tokens pilot-beta. 1h. **BAJO** (cuando haya 5+ pilotos activos).

---

## Lo que SÍ se hizo bien

- **F1.8 token HMAC propio** — decisión correcta (60 líneas auditable vs 4MB de `jsonwebtoken` con features no usadas). `timingSafeEqual`, length check, fail-closed sin secret. Patrón limpio.
- **`pilot-beta-token.test.ts`** — 10 tests con buenos edge cases: tampered sig, sig de otro secret (cross-tenant), short secret, missing secret, expired. Cobertura sólida del módulo.
- **F1.7 `createPilotBox` con super-admin gate explícito** — defensa en profundidad correctamente aplicada. Mismo patrón debe aplicarse a las dos actions hermanas.
- **F1.5 invalidación granular por tag** (la API) — diseño correcto, solo falta el wiring de tags en `unstable_cache`. La intención queda clara para futuros mantenedores.
- **F1.10 integration tests con DB real** — `vi.hoisted` + Prisma real + mock solo en frontera de auth. Patrón replicable para otras integration tests.
- **F1.3 `DisciplineBranding` con default crossfit + fallback** — retrocompatibilidad limpia. Boxes pre-F1.1 sin disciplineId siguen funcionando. La función `getDisciplineBranding(null)` retorna crossfit en vez de throw — fail-soft correcto para data path público.
- **CP.1 dispatch dispatch separado de la route** — `trial-dispatch.ts` es pure logic testeable, `route.ts` es thin wrapper de auth. Separation of concerns que paga en testabilidad.
- **Robots noindex en `/piloto-beta` y `/admin/super/*`** — links privados no indexables. Detalle pequeño pero crítico.
- **Honeypot en `signPilotBeta` y `reserveFoundingPlan`** — bot defense estándar implementado.
- **Idempotencia de `pilotBetaSignedAt`** — preserva evidence trail, no permite re-firma. Diseño correcto para campo legal.
- **`vercel.json` con cron schedule** — infraestructura como código, no manual.
- **Playbook E2E (`docs/qa/pilot-onboarding-e2e-test.md`)** — pasos repetibles + cleanup + troubleshooting. Esto reduce el costo de iteración a futuro.

---

**Generado**: 2026-05-16 por architect agent. Para preguntas o profundizar en algún hallazgo, abrir conversación con el agente y mencionar la sección específica.
