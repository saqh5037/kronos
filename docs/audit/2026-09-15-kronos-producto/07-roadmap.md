---
title: Kronos — Roadmap to a sellable product (2026-09-15)
status: proposal, gates require Samuel (and partner where marked)
inputs: 05-gap-analysis-positioning.md, 06-redesign-direction.md, 02-screen-audit.md
---

# Roadmap

Estimates are in LLM terms (sessions · tool calls · wall-clock LLM time), not human days. Human blockers are marked. Each phase ends with a gate; nothing from the next phase starts before the gate.

## Phase 0 — Truth and hygiene

Goal: nothing the product shows is false, broken or embarrassing. No redesign yet.

- Landing and Terms truth pass: tag every bullet shipped / en piloto / roadmap; remove Stripe, OXXO, SPEI, CFDI, nómina, App Store, API, SSO, SLA, 12-week blocks; one trial length; two CTA labels; real seeded numbers in the admin mock; remove "ejemplo ilustrativo" reviews.
- Remove dev notes from owner routes (checkout env var, "(DEMO)", "proveedor mockeado"), vendor names, and `src/app/dev/*` from production routing.
- Dialect sweep (≥ 8 files) plus a lint rule that fails the build on voseo forms; enum → label map for every chip; emoji → Lucide sweep (71 files); unicode arrows → icons.
- Accessibility floor: raise `--k-t3`, add `<main>` to the athlete layout, `MotionConfig reducedMotion="user"`, focus styles on inputs.
- Fix the two athlete runtime errors (`PushSubscribeButton` permission read into `useEffect`; personal-box gate moved into the layout) and add e2e assertions of zero page errors on those routes; landing renders visible on SSR.
- Service worker: `/uploads` and `/invitacion*` network-only.
- Repo hygiene: delete the ~200 loose PNGs at the root and the `worktree-agent-*` / backup branches; decide merge or delete for `feat/ai-programming-cycle`, `feat/admin-crud-editing`, `feat/super-admin-suite`; refresh the project `CLAUDE.md` from `01-code-inventory.md`.

Estimate: 3–4 sessions · ~450 tool calls · ~4 h LLM. Human blocker: none.
Gate 0: deploy to prod, axe re-run on the 14 screens (contrast nodes < 20), e2e green, Samuel opens `/box` and finds nothing he would not sign.

## Phase 1 — Design system v4 and shells

Goal: one component layer, one shell per surface, one source of numbers.

- Tokens v4 (`tokens.ts` + CSS), codemod of the 59 legacy-token files and 2,676 inline styles into utilities, compat layer deleted.
- shadcn/ui base installed with the repo's CLI rule and restyled; Kronos primitives (`AppBar`, `TabBar`, `SideRail`, `StatTile`, `TrendDelta`, `Ring`, `ProgressBar`, `Chip`, `ResponsiveList`, `EmptyState`, `Skeleton`, `Sheet`).
- One `AdminShell` from the layout for every role and route; `AdminDashboardV3` internal shell deleted and the dashboard split into server sections with client islands; one `AthleteShell` with 5-tab bar and desktop side rail; 720 px centred column for athlete pages.
- Chart kit (sparkline, bar, line, heatmap) with the axis rules; existing charts migrated.
- Period-summary service feeding dashboard, Pagos, Reportes, Atletas; tests asserting KPI = table; every number shows its period.
- Gallery route (env-gated) rendering every primitive in every state for `/visual-iterate`.

Estimate: 6–8 sessions · ~1,000 tool calls · ~10 h LLM. Human blocker: none.
Gate 1: visual-iterate at 360/768/1280 on the gallery and on `/admin` as owner and coach; Samuel checks the coach phone flow (open app → next class → roster) in under 10 seconds.

## Phase 2 — Athlete app rebuilt

Goal: a daily loop that an athlete opens at 5:40 am and again after class.

- **Hoy** with Estado del día (survey + load, Whoop when connected, provenance), today's WOD, class time, one CTA, two tiles, AI briefing about today.
- **WOD + registro**: one structured list, sticky CTA, type-aware inputs, cap/DNF, RX/Escalado control, last-result autofill, leaderboard with "tu posición".
- **Reservar**: list first, filters in a sheet, booked summary, past classes → results, waitlist states.
- **Progreso**: three tiles with sparklines and deltas → 30/90-day → raw; PRs; skills; badges (unlocked ≠ locked, real progress %); body metrics.
- **Yo**: real identity, membership and next charge, payments with receipts, notifications, devices (Whoop connect UI on the existing backend + Recovery card), privacy, help.
- Gamification ledger reconciled (one XP source, badge progress computed, rankings sorted by metric direction, capability from real scores); fixture tests per view.
- Invitation and first-run states with box name, coach contact, first class CTA.
- Personal-box mode preserved, no new features.

Estimate: 10–14 sessions · ~2,000 tool calls · ~20 h LLM. Human blockers: Whoop app approval request (10-member cap until approved; needs privacy policy URL); Grizzlys athletes for the pilot.
Gate 2: two-week pilot with Grizzlys athletes; targets: ≥ 60 % of members open Hoy ≥ 3 days/week, ≥ 50 % of WOD scores logged in-app, zero runtime errors in Sentry on athlete routes. Samuel uses it as an athlete for a week (his own rule: validate as a real user).

## Phase 3 — Admin rebuilt and Mexican rails

Goal: the owner runs the box from Kronos and the coach never touches paper.

- **Hoy** owner and coach on the new shell; **Clases** unified (grid → class → roster → check-in → whiteboard OCR → scores); **Atletas** CRM with detail page and bulk actions.
- **Dinero**: register cash, MP link, OXXO/SPEI references (via Mercado Pago's cash/transfer methods or Conekta; pick one after quoting), delinquency with WhatsApp reminder, financial reports from the period summary; CFDI decision executed if the partners approve a PAC.
- **Entrenamiento**: WOD library with search, programming cycles (merge and finish `feat/ai-programming-cycle`), movement library with validated media.
- **Comunicación**: real composer (channel, audience, schedule), WhatsApp Business templates (reminders, waitlist promotion, failed payment, PR shout-out), weekly digest.
- **Ajustes** on one shell; per-class cancellation policies, drop-in caps, digital waivers (table stakes).
- Audit log humanised; super-admin with its own band; SaaS billing page with plan, price, renewal, invoices; real recurring charge (the "TODO sprint 4.x").

Estimate: 10–14 sessions · ~2,000 tool calls · ~20 h LLM. Human blockers (partner): Mercado Pago or Conekta account for OXXO/SPEI, WhatsApp Business API access, PAC contract for CFDI, decision on pricing tiers.
Gate 3: the Grizzlys owner runs a full month (collect, reconcile, program, communicate) without a spreadsheet; the "numbers reconcile" test suite is green; Samuel passes attendance from a phone at a real class.

## Phase 4 — Launch

Goal: five paying boxes.

- Landing v2 from the truth table with real screenshots, MXN pricing, one trial, WhatsApp CTA; Aviso de Privacidad (LFPDPPP); Terms aligned.
- Self-serve onboarding hardened (signup → wizard → first class → first invite → first payment) with e2e.
- TV mode white-label and sized to content.
- Lighthouse CI on the production build (`/`, `/atleta`, `/atleta/progreso`, `/admin`), Sentry alerts, uptime check, backup and restore drill (the deploy runbook exists).
- Go-to-market: pilot offer for five boxes in CDMX/GDL/MTY, migration from Wodify/PushPress/SugarWOD/Boxmagic (CSV import already promised on the landing), referral from Grizzlys.

Estimate: 4–6 sessions · ~700 tool calls · ~7 h LLM. Human blockers: partner sign-off on pricing and offer; five boxes to pitch; a real domain per box if white-label domains are sold.
Gate 4: five boxes in trial, two converted.

## Phase 5 — Differentiators (backlog, in order)

1. AI daily briefing and chat with your data (Gemini already wired; add memory of the athlete's goals).
2. Oura connection on the Whoop pattern.
3. Native wrapper (Capacitor) for Apple Health and Health Connect, only if ≥ 20 % of pilot athletes connected a device.
4. Competition module with heats and live scoring (the events model exists; the create UI does not).
5. Hyrox UI on the existing discipline scaffolding, after five paying boxes.
6. Multi-location admin for small chains.

## Totals

| Phase                          | Sessions  | Tool calls | LLM wall-clock | Human blockers                         |
| ------------------------------ | --------- | ---------- | -------------- | -------------------------------------- |
| 0 Truth and hygiene            | 3–4       | ~450       | ~4 h           | none                                   |
| 1 System and shells            | 6–8       | ~1,000     | ~10 h          | none                                   |
| 2 Athlete app                  | 10–14     | ~2,000     | ~20 h          | Whoop approval, pilot athletes         |
| 3 Admin and rails              | 10–14     | ~2,000     | ~20 h          | MP/Conekta, WhatsApp API, PAC, pricing |
| 4 Launch                       | 4–6       | ~700       | ~7 h           | partner sign-off, five boxes           |
| **Total to five paying boxes** | **33–46** | **~6,150** | **~61 h**      |                                        |

Method for the rebuild sessions: `/intent` → `/module-design` for Hoy, Estado del día and Dinero (the three bounded contexts with real ambiguity) → `/mockup` with three states → `/build` with TDD → `/visual-iterate` at three breakpoints → native review receipt → PR. UI writes stay serial; exploration and review run in parallel.

## Risks

| Risk                                                  | Mitigation                                                                                                                   |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Rebuild scope grows into a rewrite                    | Phases 1–3 replace shells, IA and components, not the data model or the server actions; every phase ships to prod            |
| Whoop approval delays the "wearable" story            | Estado del día works from survey + load without a device; Whoop enriches it                                                  |
| Mexican rails need accounts the team does not control | Phase 3 starts with cash + MP card (exists) and adds OXXO/SPEI when the account exists; the landing only claims what is live |
| Pilot box has no time to test                         | Samuel validates as athlete and as coach himself first (his own rule), then Grizzlys                                         |
| Design identity drifts during the codemod             | Tokens v4 are typed; the gallery route and `/visual-iterate` are the gate for every UI PR                                    |
| Numbers still disagree after the summary service      | The KPI = table tests are part of Phase 1's gate, not an afterthought                                                        |
