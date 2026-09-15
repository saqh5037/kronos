---
title: Kronos — Consolidated screen audit (2026-09-15)
status: evidence, validated
inputs: reviews/public-auth.md, reviews/admin-operations.md, reviews/admin-management.md, reviews/athlete-app.md, reviews/technical-audit.md, manifest.jsonl, axe-results.json, detect-impeccable.json
---

# Consolidated screen audit

264 full-page captures (88 routes × 360 / 768 / 1280) as anon, owner, coach and athlete on a seeded local build of `main@808fbac`. Five independent reviewers with fresh context wrote the per-surface reports in `reviews/`; this document reconciles them, removes what did not survive validation, and names the systemic patterns the redesign has to fix. Severity: P0 blocks a core task or destroys credibility, P1 major, P2 minor, P3 polish.

## Scoreboard

| Surface                      | Nielsen score  | Reviewer verdict in one line                                                                                                       |
| ---------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Public + auth                | 18 / 36 (50 %) | Authored visual system; the B2B page sells features that do not exist and the trial length changes three times                     |
| Admin — operations           | 15 / 40 (38 %) | Two app shells plus a no-shell for coaches; check-in buried under analytics; colour and copy break the house rules on most screens |
| Admin — management           | 17 / 40 (43 %) | Money screens do not agree with each other; phone tables clip the money columns; checkout leaks configuration                      |
| Athlete app                  | 18 / 40 (45 %) | Premium look, feature catalogue instead of a daily loop; no anchor number, no trends, data that contradicts itself                 |
| Technical (impeccable audit) | 8 / 20 (Poor)  | Accessibility 1, Performance 2, Responsive 2, Theming 2, Implementation integrity 1                                                |

Counts after reconciliation: **8 P0**, **≈45 P1**, ≈70 P2, ≈30 P3 across the four surfaces plus the technical audit (43 findings: 0 P0, 10 P1, 21 P2, 12 P3).

## Validation notes (what was re-checked before accepting)

- **Home `/` blank at 360/768 (reported P0)**: reproduced only on the dev bundle (`Invalid or unexpected token` page error). A passive load of `https://kronos-fit.com/` at 360 and 1280 shows the H1 visible (opacity 1), 6–7 visible buttons and zero console errors. Downgraded to **P2 robustness**: `RouterSplit.tsx` still starts every element at `opacity: 0`, so any client error leaves the landing invisible; render visible by default.
- **Owner → `/atleta` 90 s timeout**: coincided with a Next dev-server memory restart, not a middleware loop. Discarded.
- **Load times** from the walkthrough are dev-mode cold compiles; not used as evidence anywhere. `/box` at ~17 s is the one exception worth measuring on the production build (autoplay mp4 hero).
- **Super-admin as coach → 404**: intentional (hides the area), consistent across roles. Not a finding.
- **Manifest `hOverflow=false` on clipped tables**: the flag only sees document-level overflow; inner containers that clip (pagos, reservas, permisos at 360) were verified visually.

## Systemic issues (the redesign brief comes from here)

| #   | Pattern                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Evidence across surfaces                  | Why it matters                                                                                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | **No shared shell.** Three admin shells (`AdminDashboardV3` draws its own sidebar + topbar; `AdminSidebar` elsewhere; `SidebarGate` returns null on `/admin` so a coach gets no navigation), three athlete nav treatments and five header patterns (back link rendered under the hamburger on 3 screens)                                                                                                                                                                                                                                      | admin ops, admin mgmt, athlete, technical | Chrome is the user's map; a coach on a phone lands on a dead end; ~600 duplicated lines                                                         |
| S2  | **Colour semantics broken.** Orange/red used decoratively on ≥12 athlete elements (PR ring, PR chips, category chips, level chips, body-fat delta) and ≥8 admin spots (class times, rank numbers, Open Box, WOD titles by type, "plan" in the checkout H1); a −51 % revenue delta rendered lime with an up-caret                                                                                                                                                                                                                              | all four                                  | The one rule the V3 system has ("lime brand, orange warning, red danger") is the one it breaks; owners read direction from colour before digits |
| S3  | **Language leaks.** Raw English enums in Spanish UI (ATTENDED, BOOKED, PAID, FAILED, ACTIVE, UNLIMITED, MONTHLY, ROUNDS_REPS, HEAVIEST, WEIGHT, ATTENDANCE), Argentine voseo in ≥8 files ("Mantené el tono", "Subí una foto", "recibís", "Pedile a tu Box", "Si cancelás", "acá", "Empezá hoy" inside product screenshots), dev notes shown to owners ("proveedor mockeado en Fase 1", "configura la variable de entorno MERCADOPAGO_ACCESS_TOKEN"), vendor names in copy ("Gemini Vision", "OCR Gemini")                                     | all four                                  | Reads as unfinished to a Mexican owner and contradicts the house dialect rule; a `dialect-guard` test exists and did not catch it               |
| S4  | **One fact, many numbers.** Payments 27 (KPI) vs 33 (table) on the same filter; revenue $138,750 (Pagos) vs $214,000 (Reportes) for "últimos 30 días"; active athletes 27 (dashboard, badge) vs 42 (Atletas); at-risk 0 (dashboard, Reportes) vs 3 (Atletas) vs 4 morosos (Pagos); dashboard charts show April under a "30 días" label                                                                                                                                                                                                        | admin ops, admin mgmt                     | One visible mismatch discredits every KPI; the owner opens a spreadsheet                                                                        |
| S5  | **Everything-pages, no anchor.** Athlete profile 4,193 px / 13 modules with no 7- or 30-day trend; athlete home leads with streak + badges and puts today's WOD 1,100 px down; Asistencia puts check-in at y≈1,270 (1280) / ≈1,760 (360) under four tiles, three glow charts and a no-show table; Pagos 4,368 px with "Registrar cobro en efectivo" as a grey ghost at 2,500 px                                                                                                                                                               | athlete, admin ops, admin mgmt            | Whoop/Garmin/Oura win on one number + one action + progressive disclosure; Kronos stacks features                                               |
| S6  | **Mobile admin not designed; athlete desktop not designed.** Owner dashboard is inline-styled with fixed grids → a 90 px column at 360, topbar wrapping at 768; `/admin/reservas` at 360 renders the roster without athlete names and overflows to 504 px; Pagos/Memberships/Morosos clip Monto/Estado/Adeudo; Horarios has 181 sub-44 px targets; 1,343 sub-40 px targets at 360 across admin. Athlete at 1280 is the 360 layout stretched (1,250 px rows, 6-tab phone bar, no max-width)                                                    | admin ops, admin mgmt, athlete, technical | Coaches use admin on phones between classes; owners reconcile cash on Sunday night on a phone                                                   |
| S7  | **No icon system.** Emoji as icons in 71 files (📸 dropzone, 🔥 at-risk, 🏆 TV, money bag/pushpin in audit log, 9 per-row emoji in Permisos), unicode arrows (→ ↗ ↓ ←) as affordances, two-letter text codes as badge glyphs (RW, FP, S7)                                                                                                                                                                                                                                                                                                     | all four                                  | Breaks house rule 1; badges unlocked and locked look the same                                                                                   |
| S8  | **Landing truth gap.** `/box` and Terms §5 promise Stripe, OXXO, SPEI, CFDI 4.0, nómina automática, App Store / Play Store apps, API pública + webhooks, SSO, SLA 99.9 %, 12-week block programming; the code ships Mercado Pago + cash. Trial is 14 days in the hero and `/signup`, 30 days in pricing and the closing card; five CTA labels for two actions; "cifras frías" mock shows MRR $0K with a +12 % arrow; palette proof cites boxes in CO/PE as if customers; TV mode is Kronos-branded on the page that sells "cero marca Kronos" | public                                    | The first owner who asks for a CFDI or an OXXO reference in week one ends the sale; Terms make the bullets contractual                          |
| S9  | **Contrast.** `--k-t3` (#54545c on #08080a) measures 2.67:1 and is used 534 times for labels, eyebrows, axis ticks; axe reports 186 colour-contrast nodes on 14 screens (325 nodes total incl. 129 content-outside-landmarks; `atleta/layout.tsx` has no `<main>`)                                                                                                                                                                                                                                                                            | technical                                 | Fails WCAG AA on every screen; unreadable on a dimmed phone in a dark gym at 5:40 am                                                            |
| S10 | **Gamification and rankings do not reconcile.** "LOGROS · 0 XP" above four unlocked badges while a badge page awards +50 XP; "30 días seguidos" at 0 % during a 7-day streak; "MURPH HOY" ranked 11:48, 9:04, 4:04, 9:00; Emma's 120 kg squat PR absent from a leaderboard topping at 111 kg while her profile says "#1 de 36"; capability radar shows Cardio 0 with Helen/Karen/Fran on file; heatmap lights 4 cells against "17 clases"                                                                                                     | athlete                                   | Trust in the numbers is the whole product for a competitive athlete                                                                             |

## P0 — fix before anyone else sees the product

| #   | Where                                                         | Finding                                                                                                                                                  | Fix direction                                                                                                                                        |
| --- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `/box`, `/legal/terminos` §5, `/atletas` reviews              | Sells unshipped payment rails, invoicing, native apps, API, SSO, SLA, payroll, block programming; fabricated testimonials labelled "ejemplo ilustrativo" | Truth pass: tag every bullet shipped / en piloto / roadmap; remove the rest; one trial length; two CTA labels; real seeded numbers in the admin mock |
| 2   | `/admin` (coach) + `SidebarGate.tsx`                          | Coach lands on a dashboard with no sidebar, topbar or hamburger; exits are two text links                                                                | One shell rendered from `admin/layout.tsx` for every role and route; delete the V3 internal shell                                                    |
| 3   | `/admin` (owner) at 360 / 768                                 | Inline-styled dashboard: 240 px sidebar pinned, content a 90 px column; topbar wraps to three lines at 768                                               | Rebuild the dashboard on the Tailwind grid the other pages use                                                                                       |
| 4   | `/admin/reservas` at 360                                      | Roster rows show status and time but no athlete name; tab strip overflows the viewport                                                                   | Stacked row cards under `md`; scrollable tab strip                                                                                                   |
| 5   | `/admin/pagos` at 360                                         | Payments, memberships and overdue tables clip Monto / Estado / Adeudo with no scroll affordance; cash-payment CTA is a grey ghost 2,500 px down          | Row cards under `md`; primary "Registrar cobro" in the first viewport                                                                                |
| 6   | `/admin/pagos`, `/admin/reportes`, `/admin`, `/admin/atletas` | KPIs, section counts and pages disagree on payments, revenue, active and at-risk athletes                                                                | One server-side period summary feeding every KPI; period label on every number; test asserting KPI count equals table count                          |
| 7   | `/admin/billing/checkout`                                     | Footer instructs the owner to "configura la variable de entorno MERCADOPAGO_ACCESS_TOKEN"; every CTA reads "(DEMO)"; orange H1                           | Dev-only banner; trial days left, next charge, IVA note, what happens next                                                                           |
| 8   | `/atleta` (home)                                              | First viewport has zero actions; today's WOD appears only as a leaderboard header 1,100 px down; the first reachable button is **Cancelar**              | "Hoy" card first: WOD + your class + one lime CTA; streak and readiness as a second row; badges off the home                                         |

## P1 — major, grouped

**Athlete app**

- Score form invites wrong data: placeholder "ej. 5:30" on a 60' cap, unit field prefilled "s", three identical "?" pills, no time-cap/DNF, no RX+, no "tu último Murph" autofill, form starts 830 px down with no sticky CTA.
- Structured movement list changes the workout ("3200 Run" collapses two runs, no unit) and contradicts the free-text block; "ROUNDS FOR TIME" on a For Time WOD; chip "FORTIME".
- Gamification contradictions (S10) and unreconciled rankings; "99 % confianza" on a six-week 1RM forecast.
- Decorative orange/red on ~12 elements (S2); five header patterns with back links rendered under the hamburger on Logros, Ayuda and badge detail (S1).
- Profile is a wall: 13 modules, no deltas, a "normalized 0–100" line mixing kg and mm:ss; activity labels truncated and duplicated.
- English and model strings: UNLIMITED, MONTHLY, ATTENDANCE, "attempts", "Score: weight (kg)", Barbell/Plates, TROPHY ROOM; movement descriptions half in English.
- Tab bar priorities inverted (WOD is fifth of six; Skills and Salud empty for most members; 8 px labels).
- Reservar: three stacked filters before the list; past classes keep a dimmed "RESERVAR"; "COACH LOBO RAMÍREZ" wraps to three lines.
- Payment result page: infinite spinner, no amount, order, timeout or retry; Pagos shows no next charge, method or receipt.
- Salud anchors on weight; body-fat "↓ 1.5 %" in orange; this is where the Whoop readiness card must land.
- Ajustes: account says "Atleta Demo" while every other screen says Emma Soto; "Tema · Claro u oscuro" is a dead control on a dark-only system; no notifications, units, privacy, Whoop connect or payment method.
- Movement library thumbnails are chaos (white stills, YouTube frames with English overlays, letter placeholders, blank cards, one 404); category chips coloured orange/yellow.
- Events: a past event listed under "abiertos"; detail page is a closed door with no result or rank; the only action is prose ("escanea el QR").
- Runtime: hydration mismatch on `/atleta/perfil`; "Rendered more hooks" on the personal-box redirects (`wod/nuevo`, `wod/foto`, `programa`, `onboarding`).

**Admin — operations**

- Negative revenue delta in lime with an up-caret; dashboard chart x-axis shows April under "últimos 30 días"; two competing range controls.
- Class lists not chronological (dashboard, every day column in Programación, Asistencia); 12 h on dashboard/whiteboard/roster vs 24 h on Operación pages.
- Check-in buried under analytics on Asistencia; control is a 16 px native checkbox and a 12 px link; no visible save.
- Atletas defaults to a 30-day filter that hides 34 of 42 athletes; glow chart with a truncated y-axis pushes the list to y≈950; 🔥 emoji section header.
- WOD titles coloured by type (STRENGTH orange, EMOM red); raw enums HEAVIEST / ROUNDS_REPS; no search or filter over 20 cards.
- Whiteboard OCR flow: 📸 emoji dropzone, no back/cancel, no visible entry point from roster or class cards, no guidance that drives OCR accuracy.
- Form analyzer under "Atletas" in voseo with native "Choose File" controls and the vendor name in copy.
- Invite: "ENVIAR 0 INVITACIONES" overflows its button; email-only in a WhatsApp market.

**Admin — management**

- Audit log unreadable: "Payment #8-active", "User #163d4tti", emoji icons, "$24000.00", future dates under "Hoy", a ~1,000 px void from a broken lazy-load sentinel.
- Settings: seven pages, tab bar on three of them, four different eyebrows, four content widths; capacity setting lives twice; Alertas vs Notificaciones split for one concept; default brand colour is the retired teal `#19F08B`.
- Horarios: 181 sub-44 px hour toggles at 360; the floating "GUARDAR CAMBIOS" covers Wednesday–Friday at 1280 and the Monday header at 360; Open Box hours in orange.
- Permisos: nine emoji row icons, orange checkboxes, table clipped after STAFF at 360, no save or autosave indicator.
- Billing home shows only "ESTADO ACTUAL · ACTIVE"; no plan, price, renewal, method or invoices; the three billing routes do not link to each other.
- Comunicaciones announces "(proveedor mockeado en Fase 1)"; enum chips (IN_APP, ALL, DRAFT); "Enviar ahora" and "Borrar" unguarded.
- Reportes: "Readiness 100 %" from 1/42 responses; "0 en riesgo · todo bajo control" beside 4 morosos; negative revenue axis; plan bars proportional to count.
- Super-admin indistinguishable from box admin (same sidebar, "TU BOX · OWNER" switcher).
- At 1280 × 800 the shared sidebar clips its GESTIÓN block under the pinned "EN BOX" footer: Reportes, Ajustes, Auditoría and Suscripción have no visible nav entry and no scroll affordance.

**Public + auth**

- Trial 14 vs 30 days; five CTA labels; self-serve "Onboarding self-service" vs "te llamamos en 24 horas".
- `/atletas` below the hero is invisible without scroll-triggered animation (four sections on `whileInView` with no fallback); closing card clips mid-word at 360; the 700 px phone mock precedes the headline on mobile.
- Manual: 7 of 9 phone frames say "CAPTURA · PRÓXIMAMENTE"; two are black rectangles.
- Invitation error state: no brand, no box name, no coach contact, voseo, two links to the same login; `/login` offers no athlete path.
- TV mode: Kronos wordmark larger than the box name, ranks and PR values in orange, 🏆 emoji, overflows at 360, WOD card with ~550 px of void.
- Privacy page is not a Mexican "Aviso de Privacidad" (no LFPDPPP / ARCO); four different contact addresses across pages.

**Technical**

- `--k-t3` 2.67:1 in 534 usages; 186 axe contrast nodes; no `<main>` in the athlete layout (129 landmark nodes).
- 59 files still on legacy token names; 16 files off-palette; 2,676 inline styles beside Tailwind; 4 font declarations; dead theme toggle shipped under `forcedTheme="dark"`.
- Emoji icons in 71 files; 10 layout-property animations (impeccable detector); 3 side-tab accent borders.
- Service worker still caches uploads; autoplay mp4 hero on `/box`; a 2,170-line client component for the dashboard. Nothing measured on a production build yet (Lighthouse CI exists in the repo; run it on `pnpm build` + `pnpm start`).

## What works (keep it in the redesign)

- **The identity.** Lime on near-black, IBM Plex Mono numerals, the streak hero with grain, numbered eyebrows. Every reviewer called it authored, not templated. It is Whoop-adjacent without copying Whoop.
- **WOD + score form on one screen.** Right architecture; needs a sticky CTA and a type-aware input.
- **Skill progression ladder** (`/atleta/skills/[id]`): highlighted current step, locked next steps, one completion action. The model for Plan and Logros.
- **Week grid** (`/admin/programacion`): seven columns, muted past, "HOY" chip, capacity bars. Needs sorting and coach/WOD on the card.
- **PR cards**, **utilization heatmap** (day × hour), **whiteboard OCR framing** (scoped to a class, three numbered steps, generous drop target), **onboarding wizard tone**, **MX-native lead form** (WhatsApp field, plain consent), **movement coaching content** (Haz / No hagas / Errores / Cue), **empty states that say when content appears**, **TV mode as a concept**.

## Per-surface detail

- `reviews/public-auth.md` — 18 routes, heuristic table, 8 issues, two personas.
- `reviews/admin-operations.md` — 12 routes incl. coach comparison, root causes verified in source (`SidebarGate.tsx`, `AdminDashboardV3.tsx`, `admin/page.tsx:207-210`).
- `reviews/admin-management.md` — 19 routes incl. billing, settings, super-admin, onboarding.
- `reviews/athlete-app.md` — 20 routes at 360, six at 1280, three personas, ten issues.
- `reviews/technical-audit.md` — responsive, accessibility, runtime errors with source locations, theming counts, performance signals, role/tenant behaviour, impeccable audit table.

Curated captures: `screens/` (31 images, downscaled). Full manifest: `manifest.jsonl`. Accessibility raw data: `axe-results.json`. Detector raw data: `detect-impeccable.json`.
