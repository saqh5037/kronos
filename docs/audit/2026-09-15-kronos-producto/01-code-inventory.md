---
title: Kronos — Code inventory (product audit 2026-09-15)
source: read-only Explore agent over main@808fbac, seeded local
status: evidence
---

Here is the factual inventory.

# Kronos — Product Implementation Inventory (code-verified, 2026-09)

Repo: `/Users/samuelquiroz/Documents/proyectos/kronos` · 761 TS/TSX files in `src/` (~105.7k LOC incl. CSS) · 53 Prisma models · 109 unit test files + 6 lib/discipline + 4 integration + 26 Playwright specs.

---

## 1. Auth & onboarding — [BUILT]

- **Providers** (`/Users/samuelquiroz/Documents/proyectos/kronos/src/server/auth.ts`): NextAuth 4 JWT, 90-day session, EmailProvider magic link (Resend via `src/lib/email.ts`), **6-digit OTP derived from the hashed email token** (`src/server/otp.ts`, `src/app/api/auth/otp/verify/route.ts`, `src/app/(auth)/login/otp/page.tsx`), Google OAuth (env-gated on `GOOGLE_CLIENT_ID`), password credentials (`src/server/auth-password.ts`, bcryptjs), and **dev-login credentials provider gated to `NODE_ENV=development` + `NEXT_PUBLIC_DEV_LOGIN`** (`src/server/auth-dev.ts`).
- **Magic-link tenant validation**: `src/server/auth-signin.ts` (tested in `tests/unit/auth-signin.test.ts`).
- **Box signup**: `src/app/(public)/signup/page.tsx` → `src/server/actions/signup.ts` (`createBoxAndOwner`, creates Box with `subscriptionStatus=TRIAL` + `trialEndsAt`).
- **Box owner onboarding wizard**: `src/app/admin/onboarding/OnboardingWizard.tsx` (1,206 lines, 5 steps) backed by `src/server/actions/onboarding.ts` (`getOnboardingStatus`, `createFirstPlan`, `inviteStaff`, `completeOnboarding`) + `src/components/admin/OnboardingBanner.tsx`.
- **Athlete signup (independent)**: `src/app/(public)/atleta-signup/AtletaSignupForm.tsx` (573 lines) → `src/server/actions/atleta-signup.ts` creates a **personal box** (`src/lib/personal-box.ts`, slug `me-*`), which switches the athlete UI via `src/server/actions/box-mode.ts`.
- **Athlete 9-step onboarding**: `src/app/atleta/onboarding/` (steps/ + lib/), actions `atleta-onboarding.ts` / `atleta-onboarding-v2.ts`; gate enforced in DB (not JWT) at `src/app/atleta/layout.tsx`.
- **Invitations**: athlete (`src/server/actions/athlete-invitations.ts`, bulk text parse + preview + resend/revoke, `src/app/invitacion/[token]/`) and staff (`staff-invitations.ts`, `src/app/invitacion-staff/[token]/`).
- **Pilot/beta**: signed-token landing `src/app/(public)/piloto-beta/page.tsx` + `src/lib/pilot-beta-token.ts` (JTI revocation model `RevokedPilotBetaJti`), `src/server/actions/pilot-beta.ts`, super-admin pilot provisioning `src/app/admin/super/pilotos/nuevo/PilotOnboardingForm.tsx` → `src/server/actions/pilot-onboarding.ts`.
- **Tests**: `tests/unit/otp.test.ts`, `otp-soft-consume.test.ts`, `dev-login.test.ts`, `auth-signin.test.ts`, `password-validation.test.ts`, `athlete-invitation.test.ts`, `staff-invitation.test.ts`, `pilot-beta-*.test.ts` (3), `atleta-signup-validation.test.ts`, `wizard-validate.test.ts`, `use-wizard-state.test.ts`, `atleta-onboarding-{prefs,skip}.test.ts`; e2e `e2e/auth.spec.ts`, `atleta-signup.spec.ts`, `atleta-onboarding-9steps.spec.ts`, `invite-athletes.spec.ts`, `invite-staff.spec.ts`.
- TODO: `src/server/auth.ts:73` and `src/lib/email.ts:25` — Resend DNS/default `EMAIL_FROM` pending.

## 2. Multi-tenancy & permissions — [BUILT]

- `withTenant(tenantId)` Prisma `$extends` injecting `tenantId` on findMany/findFirst/findUnique/create/update/delete/count (`src/server/db.ts`); 203 references across 100+ files. `src/server/tenant.ts` holds an AsyncLocalStorage helper (`runWithTenant`) that is effectively vestigial — call sites pass tenantId explicitly.
- **RBAC**: `src/server/permissions.ts` `can(action, session)` — OWNER bypass, otherwise `Permission` row per tenant+action with `requiresOwnerApproval`; UI `src/components/admin/PermissionMatrix.tsx` at `src/app/admin/ajustes/permisos/page.tsx`.
- **Gap**: `PermissionGrantRequest` has exactly one write (`createGrantRequest`) and **no approval UI anywhere** — grep for `GrantRequest` in `src/app`/`src/components` returns nothing → [STUB].
- **Super admin**: email allowlist `SUPER_ADMIN_EMAILS` (`src/lib/super-admin.ts`), render gate `src/app/admin/super/layout.tsx`, RPC gate `src/server/super-admin-guard.ts`; pages `admin/super/platform` (389 lines) and `admin/super/pilotos` (365 lines).
- Role routing + trial/expired redirect in `src/middleware.ts` (also IP rate-limits `/api/auth/signin/email` and password callback).
- Tests: `tests/unit/tenant-guard.test.ts`, `permissions.test.ts`, `super-admin.test.ts`, `super-platform.test.ts`, `super-pilotos.test.ts`, `cache.test.ts`; e2e `e2e/cross-tenant-isolation.spec.ts`, `device-cache-anti-leak.spec.ts`.

## 3. Box SaaS billing — [BUILT] (Mercado Pago only; mock-confirm path in use)

- Actions `src/server/actions/saas-billing.ts` (457 lines): `listSaasPlans`, `getCurrentSubscription`, `createSaasCheckout`, **`confirmCheckoutMock`**, `listSaasInvoices`, `exportSaasInvoicesCsv`, `getOwnerSaasSpendMetrics`, `cancelSaasSubscription`.
- Engine: `src/server/saas-billing/{lifecycle,renewal,metrics,notifications,trial-dispatch}.ts` + `src/lib/saas-billing.ts`, `src/lib/saas-invoices-csv.ts`.
- UI: `src/app/admin/billing/page.tsx` (295), `/checkout` (`CheckoutClient.tsx`), `/historial` (filters + CSV export), `SpendMetricsCard`, `CancelSubscriptionButton`.
- Webhook `src/app/api/webhooks/mp-saas/route.ts` (HMAC via `src/lib/payments/mp-webhook.ts`, `WebhookEvent` black box). Cron `src/app/api/cron/saas-billing-lifecycle/route.ts` (hourly in `vercel.json`) + `notify-trial-expiring`.
- **Known gap in code comments**: real recurring charge via MP preapproval is not wired — `src/app/api/cron/saas-billing-lifecycle/route.ts:82` and `src/server/saas-billing/renewal.ts:16` both say "TODO sprint 4.x". **No Stripe integration exists** (only `PaymentGateway.STRIPE` enum + landing copy).
- Emails: `src/server/email-templates/billing/{trial-expiring,payment-failed,subscription-expired}.ts`.
- Tests: `tests/unit/saas-{billing,lifecycle,metrics,invoices-csv}.test.ts`, `subscription.test.ts`, `trial-dispatch.test.ts`; e2e `saas-checkout.spec.ts`, `saas-billing-lifecycle.spec.ts`, `saas-renewal-mock.spec.ts`.

## 4. Athlete memberships & payments — [BUILT] (Mercado Pago + cash)

- `src/server/actions/payments.ts` (663 lines): `listPaymentsPaged`, `getRevenueByDay`, `listOverdueMemberships`, `getPaymentStats`, `registerCashPayment`, `initMpCheckout`, `getPaymentStatus`, `voidPayment`; plans/memberships in `plans.ts`, `memberships.ts`, `src/lib/membership.ts`.
- Admin UI `src/app/admin/pagos/` (table, filters, RevenueChart, PlanDonut, MembershipsTable) + `src/components/{PlanForm,MembershipAssignForm,CashPaymentForm}.tsx`.
- Athlete UI `src/app/atleta/pagos/` + `[id]/resultado/` (MP return state) + `src/components/atleta/PayMembershipButton.tsx`; API `src/app/api/payments/[paymentId]/{mp-checkout,status}/route.ts`; webhook `src/app/api/webhooks/mercadopago/route.ts`.
- MP client `src/lib/payments/mp-client.ts` fails fast in prod without `MP_BACK_URL_BASE`.
- Tests: `payments-mp.test.ts`, `mp-client.test.ts`, `mp-webhook.test.ts`, `mp-back-url.test.ts`, `payment-validation.test.ts`, `membership.test.ts`; e2e `checkout-mp.spec.ts`.

## 5. Classes, scheduling, bookings, waitlist, check-in — [BUILT]

- `src/server/actions/classes.ts` (CRUD + recurrence), `bookings.ts` (`bookClass`, `cancelBooking`, `checkInAthlete`, `markNoShow`, `getClassRoster`, `getAthleteUsualSlots`), `attendance.ts` (day stats, heatmap, streak recompute, frequent no-shows), `src/lib/booking.ts`, `src/lib/booking-suggestion.ts`.
- Admin: `admin/programacion` (weekly grid), `admin/reservas/_components/ReservasView.tsx` (roster, waitlist counters, check-in), `admin/asistencia/_components/BulkRoster.tsx` (bulk check-in).
- Athlete: `atleta/reservar/_components/{ClassesList,MonthGrid}.tsx` (611-line list), `OneTapBookButton`, `SuggestedBookingCard`, `CancelMyBookingButton`.
- Tests: `booking-guard.test.ts`, `booking-cancel-ownership.test.ts`, `booking-suggestion.test.ts`, `class-validation.test.ts`, `reservar-empty-states.test.ts`, `tests/integration/booking.integration.test.ts`; e2e `reservar.spec.ts`.

## 6. WODs, programming, movements, whiteboard — [BUILT], Hyrox editor [STUB]

- `src/server/actions/wods.ts`, `wod-presets.ts` (+ `src/lib/wod-presets-data.ts`), `movements.ts`, `movement-content.ts`; admin `admin/wods`, `admin/movimientos` (+ `MovementContentEditor`), athlete `atleta/movimientos/[id]/page.tsx` (999 lines).
- **Whiteboard OCR is real AI**: `src/server/ocr/whiteboard.ts` (Gemini Vision, roster + alias cross-reference) driving the 3-step flow `src/app/admin/clases/[id]/scores-from-whiteboard/_steps/{Step1Upload,Step2Review,Step3Confirm}.tsx` (`Step2Review` = 718 lines), uploads via `src/server/actions/uploads.ts` + `WhiteboardUpload` model + `api/cron/cleanup-uploads`.
- **Athlete photo-WOD**: `src/server/ocr/photo-wod.ts` + `src/app/atleta/wod/foto/PhotoWodFlow.tsx` (616 lines), rate-limited 10/day.
- Hyrox: `src/components/wod-form/SmartWODForm.tsx` self-describes as "F1.4 minimal stub"; `HyroxWODFormPlaceholder.tsx` renders "Editor Hyrox próximamente". Feature flags live per-Box in `Box.features` (`src/lib/features.ts`: `hyrox`, `mm_athlete`, `yoga`, `pilates`) — `yoga`/`pilates` have no consumers.
- Tests: `whiteboard-ocr.test.ts`, `photo-wod.test.ts`, `wod-validation.test.ts`, `wod-date.test.ts`, `smart-wod-form.test.ts`, `movements-catalog.test.ts`, `movement-content-ai.test.ts`, `aliases.test.ts`; e2e `wod-date-nav.spec.ts`.

## 7. Scores, PRs, leaderboards, BodyMetric — [BUILT]

- `src/server/actions/scores.ts` (777 lines), `prs.ts`, `leaderboards.ts`, `body-metrics.ts`; analytics `src/server/analytics/{rankings,tonnage,movement,capability,adherence,coach-insights,churn}.ts`; `src/lib/{scores,prs/freshness,prs/log,tonnage/*,analytics/percentile}`.
- UI: `admin/prs`, `admin/leaderboards` (Podium), `atleta/leaderboard`, `atleta/perfil`, `atleta/historial`, `atleta/salud` (BodyMetric charts + goals), `src/components/ScoreForm.tsx`, `src/components/atleta/BodyMetricSection.tsx`. `PRAttempt` used in 8 places (attempt log + confirm-bulk).
- Tests: `scores.test.ts`, `pr-progression.test.ts`, `rankings.test.ts`, `tonnage.test.ts`, `capability.test.ts`, `movement-profile.test.ts`, `body-metric.test.ts`, `adherence.test.ts`, `tests/integration/scores.integration.test.ts`; e2e `score-pr.spec.ts`, `leaderboard.spec.ts`, `historial-filters.spec.ts`.

## 8. Gamification & skills — [BUILT], DailyMission [MISSING]

- Badges/achievements: `src/server/achievements/{criteria,evaluate}.ts` (+ `awardXP` writing `XPLedger`), `src/server/actions/badges.ts`, `src/lib/badges/{level,tier}.ts`; UI `atleta/logros` + `atleta/logros/[code]`, `TrophyStrip(V4)`, `BadgeShareCanvas.tsx` (541 lines), `AchievementToast` (**disabled** — commented out in `src/app/layout.tsx:99` due to canvas-confetti bundling TODO).
- Skills: `src/lib/skills/{catalog,progress,xp,types}.ts`, `src/lib/skill-tree.ts`, `src/server/actions/{skills,skill-levels}.ts` (`AthleteSkillLevel`), UI `atleta/skills/page.tsx` (793) + `[id]` + `src/components/atleta/SkillTree.tsx` (692).
- Streaks: `src/lib/streak.ts` + `Streak` model, `StreakHero.tsx`; Goals: `src/server/actions/goals.ts`, `src/lib/goals/progress.ts`.
- **`DailyMission` has zero code references** (schema-only).
- `atleta/plan` is a **real Gemini AI plan** per goal (`generateGoalPlan` in `src/server/actions/ai.ts:374`, prompt/fallback in `src/lib/ai/training-plan.ts`).
- Tests: `achievements-{criteria,evaluate}.test.ts`, `tests/lib/skills/{progress,xp-idempotency}.test.ts`, `tests/lib/badges/level.test.ts`, `skill-tree.test.ts`, `streak.test.ts`, `goals.test.ts`, `training-plan.test.ts`; e2e `atleta-streak.spec.ts`.

## 9. Wearables (Whoop) — [PARTIAL: backend BUILT, UI MISSING]

- Full backend: OAuth `src/app/api/wearables/whoop/{connect,callback}/route.ts` with signed state (`src/lib/wearables/state.ts`), token encryption `src/lib/crypto/token-vault.ts`, client + pagination `src/lib/wearables/whoop-client.ts`, sync/backfill/incremental + score linking `whoop-sync.ts`, webhook HMAC `whoop-webhook.ts` + `src/app/api/webhooks/whoop/route.ts`, hourly backstop `src/app/api/cron/wearables-sync/route.ts`, actions `src/server/actions/wearables.ts`.
- **No UI consumes it**: `grep -rn "actions/wearables" src` → 0 hits; `Whoop` appears only in API routes. `/atleta/salud` renders BodyMetric + Goal only (`src/app/atleta/salud/_components/*`). `docs/wearables-whoop.md` assigns `/atleta/dispositivos`, `<RecoveryCard>`, `/admin/atletas/[id]/wearables` to the "Kimi" lane (brief `KIMI_VISUAL_BRIEF_WEARABLES.md`) — never built. Same doc lists 9 accepted debt items (multi-provider unique constraints, webhook idempotency by `event.id`, cron concurrency, UTC bucketing, payload retention, key rotation).
- Env-gated: `WHOOP_CLIENT_ID/SECRET/REDIRECT_URI/STATE_SECRET/WEBHOOK_SECRET`, `WEARABLES_TOKEN_ENCRYPTION_KEY`.
- Tests: `whoop-{client,paginate,sync-mapping,webhook}.test.ts`, `token-vault.test.ts`, `wearables-state.test.ts`, `wellness-calculations.test.ts`.

## 10. AI features — [BUILT] (Gemini only)

Single provider: `@google/generative-ai` via `src/lib/ai/gemini-client.ts` (default `gemini-2.5-flash`, in-memory TTL cache, retries; `GEMINI_API_KEY`, `GEMINI_API_KEY_ALT`). Six consumers:

1. Whiteboard OCR — `src/server/ocr/whiteboard.ts`
2. Photo-WOD OCR — `src/server/ocr/photo-wod.ts`
3. Personalized daily greeting — `src/lib/ai/personalized-greeting.ts` → `getDailyGreeting` (`GreetingSection.tsx`)
4. PR prediction narrative — `src/lib/ai/pr-prediction.ts` → `getTop3PRPredictions` (`PRPredictionCard.tsx`)
5. Training plan — `src/lib/ai/training-plan.ts` → `/atleta/plan`
6. Movement form analysis — `src/lib/ai/form-analysis.ts` → `analyzeMovementForm`, UI `src/app/admin/atletas/forma/_components/FormAnalyzerClient.tsx`
   Plus **CoachCard generation** `src/server/ai/coach-cards-prompt.ts` + weekly cron. Every path has a deterministic fallback (`buildFallbackPlan`, `fallbackFeedback`, `buildFallbackText`). Tests: `personalized-greeting.test.ts`, `pr-prediction.test.ts`, `training-plan.test.ts`, `form-analysis.test.ts`, `coach-cards-parse.test.ts`, `movement-content-ai.test.ts`.

## 11. Communications & PWA push — [BUILT]

- `Announcement`: `src/server/actions/announcements.ts` + `src/server/announcements/dispatch.ts`, UI `admin/comunicaciones` + `AnnouncementForm`, cron `api/cron/dispatch-announcements` (\*/5).
- `InAppNotification`: `src/server/actions/notifications.ts` (`notify`, unread count, mark read) + `src/components/atleta/NotificationBell.tsx`; per-box prefs `admin/ajustes/notificaciones` (`box-notifications.ts`).
- **Web push**: `src/server/push.ts` (`web-push`, VAPID env), `api/push/{subscribe,unsubscribe}`, `PushSubscription` model, `src/components/atleta/PushSubscribeButton.tsx`, SW handler `public/sw.js`.
- `Survey`/`SurveyResponse`: `src/server/actions/surveys.ts`, `QuickSurvey.tsx`, `ReadinessChip.tsx`, `SurveySection.tsx`, readiness average in `admin/reportes`.
- Email templates (7) under `src/server/email-templates/`; owner weekly digest `src/server/owner-digest/*` + cron.
- Tests: `announcement-{dispatch,validation}.test.ts`, `notifications.test.ts`, `push-helpers.test.ts`, `surveys.test.ts`, `email{,-templates}.test.ts`, `owner-digest-should-send.test.ts`; e2e `notifications-opt-out.spec.ts`, `owner-weekly-digest.spec.ts`.

## 12. Events / competitions — [PARTIAL]

- `src/server/actions/events.ts`: read + athlete write only (`getEventByAccessToken`, `getEventBySlugForAthlete`, `registerToEvent`, `submitEventResult`, `listMyEventEntries`, `listBoxEntriesForEvent`, `listOpenEvents`) + `src/lib/event-score.ts`.
- **No `SportEvent` create/update anywhere in `src/` or `scripts/`** — events must be inserted manually/DB-side. `admin/eventos/page.tsx` (202 lines) is read-only entries.
- Athlete: `atleta/eventos` + `[slug]`; public token entry `src/app/eventos/[token]/`. Founding offer: `src/app/(public)/founding-dominus/` + `src/server/actions/founding-dominus.ts` + `src/lib/dominus-promo.ts` + `email-templates/founding-reservation.ts`.
- Placeholder: `src/app/atleta/eventos/[slug]/page.tsx:257` — "Kit digital · próximamente".
- Tests: `event-score.test.ts`, `events-submit-schema.test.ts`, `founding-dominus.test.ts`, `dominus-promo.test.ts`; e2e `evento-pasado.spec.ts`.

## 13. TV mode, reports, audit, alerts, CoachCard — [BUILT]

- TV: `src/app/tv/[slug]/page.tsx` (411) + `src/server/actions/tv.ts` (`getTVDisplay`), index `src/app/tv/page.tsx`.
- Reports: `src/app/admin/reportes/page.tsx` (495) wired to `reports.ts`, `surveys.ts`, `src/server/analytics/churn.ts` (`ChurnRiskTable`), revenue/athletes by month.
- Audit: `src/server/audit.ts` + `AuditEvent`, `src/lib/audit-humanize.ts`, UI `admin/auditoria` (`AuditTimeline`, `AuditFilters`, owner live feed `owner-feed.ts`).
- Alerts: `src/server/actions/alerts.ts` (`evaluateAndDispatch` hooked to audit payloads) + `admin/ajustes/alertas` (`AlertRulesPanel`).
- CoachCard: `src/server/actions/coach-cards.ts` + `api/cron/generate-coach-cards` (weekly) + `src/components/atleta/CoachCardsSection.tsx`.
- Tests: `alert-rules.test.ts`, `audit-humanize.test.ts`, `auditoria-categories.spec.ts` (e2e), `churn-detector.test.ts`, `coach-insights.test.ts`, `owner-feed.test.ts`, `dashboard.test.ts`.

## 14. Landing, marketing, legal, i18n — [BUILT]; i18n [MISSING]

- Routes: `/` router split (`(landing)/page.tsx` + `_components/router/RouterSplit.tsx`), `/box`, `/atletas`, `/atletas/manual`, each with `opengraph-image.tsx` + `twitter-image.tsx`; LLM-facing `box.md|box.json|atletas.md|atletas.json` route handlers.
- 21 landing components incl. `Pricing`, `SectionWhiteLabel`, `SectionLeadForm`, `CurrencySwitcher`, `HeroVideo`, `DominusPromoBanner`; copy centralized in `src/app/(landing)/_data/mock.ts` (self-documented: "@mock es ilustrativo"; `SOCIAL_PROOF_BOXES` intentionally empty).
- `Lead` capture: `src/app/api/leads/route.ts` (zod, honeypot, 3/hour IP limit, email notify) — only **1** Prisma write against `Lead`.
- Legal: `src/app/legal/{privacidad,terminos}` + layout.
- **i18n: none.** No `next-intl`/`useTranslations`; all copy is hardcoded Spanish, `lang="es"` in root layout, `es-MX`/`es_MX` literals; `Box.locale`/`currency` only feed `Intl` formatters. Landing claims "Stripe + Mercado Pago + OXXO" which the code does not implement (Stripe absent).
- Tests: `branding.test.ts`, `dialect-guard.test.ts`, `fitness-goal-tags.test.ts`.

## 15. Design system — [BUILT, but layered/legacy-heavy]

- `src/app/globals.css` — 2,074 lines, **273 CSS custom properties**, **193 utility/component class definitions**, sectioned as: Forge v2.0 tokens (`:root`/`.dark`) → `@layer base` → keyframes → decorative effects (noise, spotlight, aurora, scroll-progress, corner decor, reveal) → `@layer components` (`.k-card` etc.) → reduced-motion → responsive hides → Sonner theme → skeleton shimmer → **V3 "Cuarto Oscuro" token set** (`--k-*`, lima neon `#c8ff2d`) → K utility classes → Visual Box extended utilities → **legacy-compat block remapping old tokens (`--bg`, `--card`, `--text`) onto `--k-*`** → router dual grid. Separate 1,982-line `src/app/(landing)/landing.css`.
- Component dirs: `kronos/` 46 files (incl. `kronos/forms/` 7, `kronos/skeletons/` 2, `kronos/v3/` 3 with `AdminDashboardV3.tsx` at 2,170 lines), `atleta/` 30, `charts/` 21 (Recharts, impl/wrapper split + `tokens.ts`), `tour/` 19 (custom product tour w/ persistence), `admin/` 10, `data/` 9 (DataTable/Filters/CSV), `auth/` 3, `wod-form/` 2, `providers/` 2, `ui/` **1**, `brand/` 1, plus 18 loose root components.
- **No shadcn/ui primitives layer** — `src/components/ui/` contains only `ConfirmDialog.tsx`. **No icon library** (0 imports of lucide/heroicons/react-icons); icons are hand-rolled SVGs, centralized in `src/components/kronos/v3/icons.tsx` (`Icon.*`).
- Motion: `framer-motion` in **74 files**, loaded via `LazyMotion` (`src/components/providers/MotionProvider.tsx`, `m.*` migration, commit `4c17e61`).
- Legacy tokens: **312 files** use `var(--k-*)`; **62 files** still reference legacy `var(--text|--card|--line|--bg|--accent)` names kept alive by the compat block.
- Dark-only: `forcedTheme="dark"` in `src/app/layout.tsx` while `ThemeToggle.tsx`/`next-themes` remain shipped → dead affordance.

## 16. PWA / mobile — [BUILT]

`public/manifest.webmanifest` (standalone, `start_url=/atleta`, maskable icons), `public/sw.js` (196 lines, `kronos-shell-v2`, static-only precache, `/atleta/*` forced network-only after a documented 2026-05-17 cross-tenant cache leak), registration `src/components/PwaRegister.tsx`, install prompt `src/components/atleta/InstallPwaBanner.tsx` + `src/app/(public)/atleta-signup/IosPwaTip.tsx`, detection `src/lib/pwa-detect.ts` / `pwa-visits.ts` (tested), `viewportFit: "cover"` + `appleWebApp` in root layout, `env(safe-area-inset-*)` in `src/app/atleta/layout.tsx`, bottom nav `src/components/kronos/TabBar.tsx` + `DesktopTabBar.tsx` + mobile `AthleteDrawer.tsx`. Offline: shell assets only, no offline page/queue; React Query persisted to IDB (`@tanstack/react-query-persist-client`, `idb-keyval`, keyed by userId).

## 17. Test & quality signals — [BUILT]

- 119 vitest files (`tests/unit` 109, `tests/lib` 3, `tests/disciplines` 3, `tests/integration` 4 excluded from default run via `vitest.config.ts`), **0 colocated tests in `src/`**; 26 Playwright specs (4,130 lines, `e2e/`, chromium only, serial, dev-server with `NEXT_PUBLIC_DEV_LOGIN=1`).
- CI `.github/workflows/ci.yml`: prisma generate → typecheck → lint → unit tests (no e2e, no integration). `.github/workflows/lighthouse.yml` + `lighthouserc.json` with `skip-perf` label escape hatch.
- Husky: `pre-commit` = lint-staged; `pre-push` = `typecheck && test`.
- ESLint flat config extends `next/core-web-vitals` + `next/typescript` only (no custom rules).
- Sentry: 3 config files + `withSentryConfig` in `next.config.ts` + `src/lib/observability.ts` (`reportError`) — env-gated on DSN, **active**. PostHog: server-side fetch wrapper `src/lib/analytics.ts` with a 12-event typed enum + landing `AnalyticsProvider`/`LandingTracker` (`posthog-js`) — env-gated, active.
- Security headers + typedRoutes in `next.config.ts`; in-memory rate limiting (`src/lib/rate-limit.ts`) — not distributed.

## 18. Deployment — [BUILT]

PM2 cluster (`ecosystem.config.cjs`, `instances: "max"`, port 3000, `/var/log/kronos/*`), nginx vhost `deploy/nginx/kronos.conf`, provisioning `deploy/setup-server.sh`, deploy script `scripts/deploy.sh`, smoke `scripts/smoke.sh`, `docs/DEPLOY.md`. Postgres via `docker-compose.yml` (port **5434**). `vercel.json` declares 6 crons — **`api/cron/wearables-sync` and `api/cron/achievements-backfill` are not scheduled there** (manual/host-side only). No Dockerfile for the app.
Env vars referenced in code (names only): `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`, `EMAIL_FROM`, `RESEND_API_KEY`, `GOOGLE_CLIENT_ID/SECRET`, `NEXT_PUBLIC_DEV_LOGIN`, `DEV_PASSWORD`, `SUPER_ADMIN_EMAILS`, `CRON_SECRET`, `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `MP_BACK_URL_BASE`, `GEMINI_API_KEY`, `GEMINI_API_KEY_ALT`, `GEMINI_MODEL`, `WHOOP_CLIENT_ID/SECRET/REDIRECT_URI/STATE_SECRET/WEBHOOK_SECRET`, `WEARABLES_TOKEN_ENCRYPTION_KEY`, `VAPID_PUBLIC_KEY/PRIVATE_KEY/SUBJECT`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `STORAGE_DRIVER`, `UPLOAD_BASE_DIR`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET/REGION/PUBLIC_HOST`, `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG/PROJECT`, `NEXT_PUBLIC_POSTHOG_KEY/HOST`, `PILOT_BETA_TOKEN_SECRET`, `LEADS_EMAIL`, `NEXT_PUBLIC_WHATSAPP_SUPPORT`, `UNSPLASH_ACCESS_KEY`, `PEXELS_API_KEY`, `BFL_API_KEY`, `GRIZZLYS_OWNER_EMAIL`, `GRIZZLYS_ATHLETE_EMAIL`. (`.env*` files not read.)

---

## 15 largest source files (`src/**`, by lines)

1. `src/components/kronos/v3/AdminDashboardV3.tsx` — 2,170
2. `src/app/globals.css` — 2,074
3. `src/app/(landing)/landing.css` — 1,982
4. `src/app/admin/onboarding/OnboardingWizard.tsx` — 1,206
5. `src/app/atleta/movimientos/[id]/page.tsx` — 999
6. `src/components/AdminSidebar.tsx` — 995
7. `src/components/kronos/v3/WodDetalleV3.tsx` — 800
8. `src/app/atleta/skills/page.tsx` — 793
9. `src/server/actions/scores.ts` — 777
10. `src/app/admin/clases/[id]/scores-from-whiteboard/_steps/Step2Review.tsx` — 718
11. `src/components/atleta/SkillTree.tsx` — 692
12. `src/server/actions/payments.ts` — 663
13. `src/server/actions/ai.ts` — 619
14. `src/app/atleta/wod/foto/PhotoWodFlow.tsx` — 616
15. `src/app/atleta/reservar/_components/ClassesList.tsx` — 611

## Dead code / experiment zones

- `src/app/dev/{charts-demo,skeletons-demo,toast-demo}` — 207 lines total, **not env-gated** (routable in prod).
- `_design-source/` — ~35 JSX/HTML/CSS mockup files (Whoop-styled prototypes, logo options, 3 CSS variants) never imported by `src/`.
- `scripts/` — 39 files mixing prod tooling (`deploy.sh`, `smoke.sh`, backfills) with one-offs (`reduce-lime.js`, `final-lime-sweep.js`, `refactor_lime.py`, `remove-bernardo-quiroz.ts`, `check-miyagi.ts`, tutorial video/voice pipeline).
- Repo root holds **~200 loose PNG/JPEG QA screenshots** plus `kimi-review/`, `folletos-evento/`, `Imspiracion/`, `backups/`, `screenshots/`, `test-results/`.
- `src/server/tenant.ts` AsyncLocalStorage — no runtime consumer.
- `src/components/ThemeToggle.tsx` — theme is force-dark.

## Surprises vs CLAUDE.md (stale, dated 2026-05-07)

1. **Test counts**: doc says "669 unit tests / 54 files"; actual = **119 vitest files** (109 in `tests/unit`) + 4 integration + **26 e2e specs** (doc says 11 failing e2e; commit `993152e` says the suite was healed).
2. **"Sentry + PostHog — cableados, sin eventos activos aún"** → both now emit: 12-event typed PostHog wrapper (`src/lib/analytics.ts`) and `reportError` calls across webhooks/actions.
3. **Entire SaaS billing domain is undocumented** in CLAUDE.md: `SaasPlan/SaasSubscription/SaasInvoice`, `/admin/billing/*`, MP SaaS webhook, lifecycle cron, trial gating in middleware.
4. **Payments**: doc never names a processor; code is **Mercado Pago + cash only**. Landing/legal copy promises **Stripe + OXXO + SPEI** — not implemented (Stripe exists only as an unused enum value).
5. **Wearables/Whoop (5 models, OAuth, webhook, cron, encryption vault, 6 test files) is entirely absent from the doc — and has zero UI**. Biggest "built backend, invisible product" gap.
6. **AI is pervasive and undocumented**: Gemini powers whiteboard OCR, photo-WOD, greetings, PR predictions, training plans, form analysis, coach cards. Doc mentions no AI at all.
7. **Gamification/skills layer** (Badge/Achievement/Streak/XPLedger/AthleteSkillLevel/CoachCard, `/atleta/logros`, `/atleta/skills`, `/atleta/plan`) is missing from the doc; `DailyMission` is schema-only dead weight.
8. **Multi-discipline scaffolding** (`Discipline` model, `src/lib/disciplines/*` registry + crossfit/hyrox strategies with 3 test files, per-Box `features` flags) exists; the Hyrox WOD editor is an explicit stub.
9. **Independent-athlete / personal-box mode** (`me-*` slugs, `getBoxMode`, `/atleta-signup`) is a whole B2C product line absent from the doc.
10. **Auth is broader**: OTP codes, password credentials, 90-day sessions, pilot-beta signed links, staff invitations — doc lists only magic link + Google + dev login.
11. **Events/competitions + founding-dominus + TV mode + super-admin platform + custom product tour + PWA/push/service worker** all post-date the doc.
12. **Design system reality**: doc describes V3 tokens as canonical at `globals.css:1612-1675`; the file is now 2,074 lines with a legacy-compat remap block and **62 files still on legacy token names**, no primitives layer, no icon library, and Kimi/Claude "lane discipline" no longer matches a codebase where `src/app/**` and `src/server/**` are co-edited.
13. **Onboarding gate moved from JWT to DB** (`src/app/atleta/layout.tsx`) and a cross-tenant service-worker cache leak was fixed in `public/sw.js` — both invariants worth carrying into any new doc.
