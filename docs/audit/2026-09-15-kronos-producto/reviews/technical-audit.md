# Kronos — Technical Cross-Cutting Audit (2026-09-15)

Scope: responsive integrity, accessibility, runtime errors, theming/design-system integrity, performance signals, role/tenant behavior. Evidence: 264 captured screens (4 roles × 3 breakpoints), axe-core on 14 screens, Impeccable detector (13 findings), read-only source review of `/Users/samuelquiroz/Documents/proyectos/kronos` (Next 15.5.18, React 19, framer-motion 11.15, Recharts 3.8). Dev-server timings are excluded as unreliable. Severity: P0 blocks a primary flow or exposes data; P1 visible defect for most users of a surface; P2 degrades quality/measurable standard; P3 hygiene.

---

## A. Responsive integrity

| Signal                                              | 360                            | 768                                      | 1280 |
| --------------------------------------------------- | ------------------------------ | ---------------------------------------- | ---- |
| Screens with horizontal overflow                    | 3 (2 routes)                   | 0                                        | 0    |
| Screens with ≥1 sub-40px target                     | 85/88                          | 86/88                                    | 0    |
| Screens with >20 sub-40px targets                   | 28 (owner 21, coach 6, anon 1) | 33 (owner 24, coach 7, anon 1, atleta 1) | 0    |
| Sum of sub-40px targets                             | 1,343 (max 181)                | 1,438 (max 186)                          | 0    |
| Avg sub-40px per screen, owner `/admin/*` vs atleta | 30.3 vs 4.1                    | 32.1 vs 4.2                              | —    |

**[P1] `/admin` at 360 renders the desktop shell.** `SidebarGate.tsx:19` suppresses `AdminSidebar` on `/admin` because `AdminDashboardV3.tsx:568-590` renders its own `Sidebar` with inline `width: 240` and no breakpoint (`AdminDashboardV3.tsx:2088-2110`). At 360 the content column is ~120px wide; the MRR hero shows only "$" (`owner/360/admin.png`). Every other admin route uses the responsive `AdminSidebar` drawer and is usable. Fix: delete the V3 internal `Sidebar`/`AdminHeader`, let `SidebarGate` render `AdminSidebar` everywhere, and give the dashboard body a fluid grid.

**[P1] `/admin` at 768 clips the primary KPI.** Same shell: 240px sidebar + 528px content; "$138,750" is clipped to "$138" and the box-switcher/search topbar overlaps content (`owner/768/admin.png`). Fix: `font-size: clamp()` on the KPI and collapse the sidebar to the 64px `collapsed` mode below `lg`.

**[P1] `/admin/reservas` overflows the viewport at 360 (owner and coach).** Document is 504px wide (`owner/360/admin_reservas.png`). Culprit: the roster table uses `grid-cols-[1fr_120px_120px_140px]` (`ReservasView.tsx:371,382`) — 380px of fixed columns + gaps + padding inside a 360px viewport, with no `overflow-x-auto` wrapper. Fix: stack rows below `md` (name + status pill; actions as a menu) or wrap in a scroll container.

**[P2] `/tv/[slug]` overflows at 360 (415px).** `text-7xl` clock + `text-5xl` "KRONOS" in a non-wrapping `flex justify-between` header (`tv/[slug]/page.tsx:55-80`). TV is a large-screen surface, but the page is public and indexable; use `clamp()` sizes and allow wrapping.

**[P2] `/admin/ajustes/horarios`: 181 sub-40px targets at 360, 186 at 768.** 160 hour chips at 38×30px (`ScheduleForm.tsx:214-215`) plus 17 sidebar links. The `sticky bottom-4` save bar (`ScheduleForm.tsx:241`) overlaps the "Lunes" heading and chips while scrolling (`owner/360/admin_ajustes_horarios.png`). Fix: 44px chips in a 6-column grid per day, and a fixed bottom action bar with body padding.

**[P2] Admin small-target baseline.** Simple admin pages still report 21 sub-40px targets at 360 (`/admin/reportes`, `/admin/eventos`), and 19 admin screens report exactly 17 links — the sidebar items themselves measure under 40px. UNVERIFIED which shell elements fail; audit `AdminSidebar` item height and topbar icon buttons once, fixing all 32 routes.

**[P2] Tablet (768) gets no designed layout anywhere.** Admin = desktop layout squeezed (`/admin/programacion` week grid shows 7 columns of ~100px with truncated names "EMOM 1…", "1RM Sna…", `owner/768/admin_programacion.png`); atleta = phone layout stretched (single column, hamburger drawer, bottom TabBar, full-width rows on `/atleta/reservar`, `atleta/768/atleta_reservar.png`). No `md:`-specific composition was observed in any capture.

**[P2] Atleta at 1280 is a stretched phone.** `atleta/layout.tsx` sets no max-width; only 7 of 24 atleta `page.tsx` files set one. Home cards, the streak hero, and reservation rows stretch to 1280px (`atleta/1280/atleta.png`, `atleta_reservar.png`) while `DesktopTabBar.tsx` pins a phone-style tab strip to the bottom. Fix: `max-w-[720px] mx-auto` in the layout, or a two-column desktop composition.

**[P3] `/admin/ajustes/permisos` matrix clipped at 360.** Third column header reads "APROB…" inside its scroll container (`owner/360/admin_ajustes_permisos.png`); no document overflow, but no scroll affordance either.

---

## B. Accessibility

### axe-core (14 screens, WCAG 2.0/2.1 A/AA + best-practice): 325 violation nodes

| Rule                 | Impact   | Screens        | Nodes | Example selector                                                        |
| -------------------- | -------- | -------------- | ----- | ----------------------------------------------------------------------- |
| color-contrast       | serious  | 12/14          | 186   | `/login .mb-8 > p`, `/atleta-signup label`, admin table headers         |
| region               | moderate | 6              | 129   | `.lp-root > div:nth-child(6)`, `/atleta .lg\:hidden > div:nth-child(2)` |
| landmark-one-main    | moderate | 5 (all atleta) | 5     | `html`                                                                  |
| page-has-heading-one | moderate | 2              | 2     | `/atleta/wod`, `/atleta/reservar`                                       |
| heading-order        | moderate | 2              | 2     | `/box div:nth-child(2) > h4`, `/admin/pagos .k-card h3`                 |
| aria-prohibited-attr | serious  | 1              | 1     | `span[aria-label="Kronos"]`                                             |

Worst screens: `/atleta/reservar` 91 nodes, `/atleta/perfil` 83, `/atleta` 32, `/atleta/wod` 31. Clean: `/` at 360 (0).

**[P1] Contrast: `--k-t3` fails everywhere it is used as text.** Computed from `globals.css` tokens: `#54545c` on `#08080a` = **2.67:1**, on `--k-surface` 2.53:1, on `--k-elevated` 2.45:1 (AA needs 4.5:1; even large-text 3:1 fails). It is used as a text color in **534 places across 190 files** — eyebrows, table headers at 9–10px (`ReservasView.tsx:372`), captions. `--k-t2` `#8a8a94` passes (5.85:1). Lime on dark (16.96:1), `--k-warning` (10.94:1) and `--k-danger` (6.54:1) pass. Fix: raise `--k-t3` to ≥ `#7a7a84` (≈4.6:1) or restrict it to non-text decoration; that single token change resolves most of the 186 nodes.

**[P1] Atleta surface has no `<main>` landmark.** `atleta/layout.tsx:65-99` wraps `children` in `<div>`; admin uses `<main>` (`admin/layout.tsx:21`). Result: 5/5 atleta screens fail `landmark-one-main` and contribute most of the 129 `region` nodes. Fix: one-line change to `<main id="main">` plus a skip link (present only on the landing, `(landing)/page.tsx:42`).

**[P2] Missing h1** on `/atleta/wod`, `/atleta/reservar`, `/tv` (manifest, 1280; 6/88 role-routes lack h1, 3 are real pages). No page has multiple h1s.

**[P2] Emoji used as icons in 71 files (128 occurrences).** `PermissionMatrix.tsx:33-39` (row icons 💵🏷️🗑️📊, visible at `owner/360/admin_ajustes_permisos.png`), `AuditTimeline.tsx:10-15`, `AlertRulesPanel.tsx:26-30` and inside `<option>` (line 167-170), `AtRiskCard` "🔥", `ScoreForm.tsx:100` toast "🏆". Screen readers announce "money bag", "wastebasket"; a hand-rolled icon set exists (`kronos/v3/icons.tsx`). Also 124 `→` and 26 `←` text arrows used as link affordances ("Ver semana →").

**[P2] Focus visibility is partial.** `globals.css:1920-1926` and `landing.css:27-34` define `:focus-visible` outlines for `a`, `button`, `.k-btn-*`, `.k-chip` only. Inputs, selects, checkboxes are not covered; 46 `outline-none` occurrences in TSX against 49 `focus:ring|focus:border` replacements (not verified 1:1). The `AdminSidebar` drawer (`AdminSidebar.tsx:759-900`) uses `aria-expanded` and a backdrop, but no `role="dialog"`, focus trap, or Escape handling (UNVERIFIED Escape).

**[P2] Reduced motion is opt-in per component.** 5 `prefers-reduced-motion` blocks in `globals.css` (405, 1361, 1463, 1520, 1617), 2 in `landing.css`; `useReducedMotion` in 25 of the 69 files using `m.*`; `MotionProvider.tsx` has no `MotionConfig reducedMotion="user"`, so up to 44 animated components ignore the OS setting.

**[P2] White on `--k-warning` = 1.83:1** on the unread badge (`NotificationBell.tsx:160`).

**[P3] `aria-label` on `<span>`** without a role (`KronosLogo.tsx:116,127,142`) — use `role="img"`.
**[P3] Empty `alt=""` on 7 landing photos** (`SectionOwner.tsx:63`, `SectionWhiteLabel.tsx:39`, `SectionLeadForm.tsx:338`, `CtaTail.tsx:21`, `TestimonialHero.tsx:48`, `AtletaClosingCTA.tsx:36`): valid only if decorative; the `/box` coach/box photos carry meaning (4 of 5 images on `/box` flagged).
**[P3] heading-order** on `/box` (h4 after h2) and `/admin/pagos` (h3 in cards without h2).

---

## C. Runtime errors

| Error                                                                       | Where                                                                      | Count | Severity                          |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----- | --------------------------------- |
| `Rendered more hooks than during the previous render.`                      | atleta `/atleta/wod/nuevo`, `/atleta/wod/foto`, `/atleta/programa` × 3 bps | 9     | P1                                |
| `Hydration failed because the server rendered HTML didn't match the client` | atleta `/atleta/perfil` × 3 bps                                            | 3     | P1                                |
| `Invalid or unexpected token` (SyntaxError)                                 | anon `/` at 360, 768                                                       | 2     | see below                         |
| `Failed to load resource: 404`                                              | `/atleta/movimientos`, `/admin/movimientos` × 3 bps                        | 6     | P3                                |
| `A tree hydrated but some attributes … didn't match`                        | atleta 768 `/atleta/wod` (via `/foto`), `/atleta/reservar`                 | 2     | P2                                |
| `ERR_INCOMPLETE_CHUNKED_ENCODING` / `ERR_CONNECTION_REFUSED` / 90s timeout  | owner → `/atleta`                                                          | 1     | dev-server restart, not a finding |

**[P1] Hooks-order crash on the personal-box redirects.** All three pages call `getBoxMode()` then server `redirect()` (`wod/nuevo/page.tsx:13`, `wod/foto/page.tsx:14`, `programa/page.tsx:14`) under `atleta/layout.tsx`, which has already awaited the DB and streamed the shell (drawer, dynamic `TabBar`, `NotificationBell`, `InstallPwaBanner`). The redirect resolves client-side and React sees a different hook count during the transition; direct visits to the destinations (`/atleta/wod`, `/atleta`) are clean, so the trigger is the redirect path. The exact client component was not pinned (UNVERIFIED). Production impact: error boundary flash + Sentry noise on every box-mode athlete who taps those links. Fix: move the box-mode gate into `atleta/layout.tsx` (it already queries the athlete) or render an in-place empty state; add an e2e asserting zero `pageerror` on those routes.

**[P1] Hydration failure on `/atleta/perfil` — root cause confirmed.** `PushSubscribeButton.tsx:7-16` seeds `useState` from `Notification.permission`/`serviceWorker` presence; the server renders "idle" and the client's first render is "subscribed"/"denied"/"unsupported", so React discards and regenerates the whole tree on the heaviest atleta page (4,085px tall): visible CLS, doubled render, "1 Issue" badge in dev (`atleta/1280/atleta_perfil.png`). The same component sits in onboarding Step 9. `MyHeatmap90d.tsx:10` (server `new Date()` passed into the client `Heatmap`, which formats with `date-fns` in local time) is a secondary timezone risk. Fix: initialize to "idle" and resolve permission in `useEffect` (the project's own CLAUDE.md hydration pattern).

**[P1] Landing content is invisible without JavaScript; the SyntaxError itself is UNVERIFIED.** The two captures show only nav + footer (`anon/360/root.png`, `anon/768/root.png`) although the manifest shows the h1 and 7 links present in the DOM. Re-running `/` at 360 on the same dev server gave 0 console errors, h1 opacity 1, scrollWidth 360 — the SyntaxError coincided with the dev-server restarts and is classified as a transient chunk artifact; re-test on `next build && next start`. What the captures do prove: the SSR HTML ships the `RouterSplit`/hero content inside 3 wrappers with `opacity:0; transform:translateY(16–20px)` (framer `initial="hidden"`, `RouterSplit.tsx:8-31`, `Hero.tsx:13-19`). Any script failure, blocked JS, or slow hydration leaves the marketing home blank. Fix: `initial={false}` when rendering on the server (animate only after mount), or CSS `@starting-style` animations.

**[P3] 404 thumbnails on movimientos.** `lib/youtube.ts:25` builds `img.youtube.com/vi/<id>/hqdefault.jpg` for seeded/invalid IDs. `MovementCatalog.tsx:62-75` has an `onError`/`naturalWidth ≤ 120` fallback; `MovementAdminClient.tsx:211` has none. Validate IDs at save time or verify the thumbnail server-side.

**[P2] Attribute mismatch at 768 only** (`/atleta/wod`, `/atleta/reservar`): candidates are `ClassesList.tsx` today/past logic and the two tab bars both rendered and CSS-hidden. UNVERIFIED; reproduce with React DevTools hydration diff on a 768 viewport.

---

## D. Theming and design-system integrity

| Measure (src/app + src/components, excl. `dev/`, email templates, `_design-source`)                | Count                                                                                                                                    |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | ----------------------------------------------------------------------- |
| Files still using `var(--text                                                                      | --card                                                                                                                                   | --line | --bg)` | **59** (occurrences: `--line` 125, `--card` 63, `--text` 47, `--bg` 12) |
| `var(--accent)`, `--moss`, `--fire`, `--grad`, `--text-2`, `--blue`, `--cyan`, `--strain`, `--red` | 0                                                                                                                                        |
| Legacy semantic aliases `--amber-soft/--amber-line/--fire-soft/--fire-line`                        | 3 (`ConfidenceBadge.tsx:32,38`, `Step3Confirm.tsx:142`)                                                                                  |
| Hard-coded hex in TSX                                                                              | 156 occurrences / 39 files; **16 files carry off-palette colors**                                                                        |
| Banned legacy hex (`#19f08b`, `#3aa3ff`, navy)                                                     | 0                                                                                                                                        |
| Hex in `globals.css` / `landing.css`                                                               | 82 / 5 (landing.css references `var(--k-*)` 248 times — good)                                                                            |
| `--k-warning` usage                                                                                | 67 files / 129 occurrences                                                                                                               |
| `--k-danger` usage                                                                                 | 62 files / 98 occurrences                                                                                                                |
| Emoji in JSX                                                                                       | 71 files / 128 occurrences                                                                                                               |
| Inline `style={{`                                                                                  | 320 of 482 TSX files, 2,676 occurrences (vs 429 Tailwind `[var(--…)]` classes)                                                           |
| Ways to declare the display font                                                                   | 4: `font-display` class (666), inline `var(--k-font-display)` (441), `font-mono` (253) + `k-mono` (23), literal `fontFamily` strings (5) |
| Unique custom properties in `globals.css`                                                          | 135 names (the 273 figure counts redefinitions in the alias blocks at lines 36, 62, 83, 213 and the V3 override at 1969)                 |

**[P2] Off-palette hex (16 files):** `Step3Confirm.tsx` confetti `#4a7c59 #dc4b17 #e8893a #64748b` (pre-V3 palette), `ParticleMesh.tsx` `#00bfff #e60026`, `WODHeroCard.tsx:7` `TABATA: #f5a623`, `ScoreForm.tsx:12` / `pagos/[id]/resultado/client.tsx:23` / `PagosContent.tsx:293` `ERROR_RED = #ff5e5e` (a second red next to `--k-danger #ff5a5a`), `Podium.tsx` `#1c1917`, `#0a0a0c` in 6 files (a near-bg not in the token set), `PhoneFrame.tsx`, `landing/_data/mock.ts` discipline colors, `charts/tokens.ts:12` `pink: "#FFB020"` (the _warning_ token aliased as a decorative series color).

**[P2] Warning/danger tokens used decoratively.** `ScheduleForm.tsx:218` (hour-chip state), `NotificationBell.tsx:160` (unread count badge), `AuditTimeline.tsx:62-64,232-233` (event category dot with `animate-ping`), `ConfidenceBadge.tsx:29-43` (AI confidence tiers), `RecentActivitySection.tsx:46,97` (PR ring stroke — the orange third ring on the atleta home, `atleta/768/atleta.png`), "Open Box" classes rendered orange on the programación grid (`owner/768/admin_programacion.png`; source UNVERIFIED), `Step2Review.tsx:267,471` side-tab borders. The CLAUDE.md rule ("opacity for intensity, color for different things") is violated on the home hero rings, which is the first thing an athlete sees.

**[P1] Duplicated shells.** Admin has three navigation implementations: (1) `AdminSidebar.tsx` (995 lines, drawer + desktop) on every `/admin/*` except `/admin`; (2) `AdminDashboardV3.tsx` internal `Sidebar` + `AdminHeader` (owner `/admin` only, duplicated nav list, no breakpoints); (3) coach `/admin` renders `CoachDashboard` with **no shell at all** (`SidebarGate.tsx:19` returns null, `admin/page.tsx:425-470` renders a bare page: 0 buttons, 2 links, `coach/1280/admin.png`). Atleta has three nav components for one surface: `AthleteDrawer` + `TabBar` (mobile) and `DesktopTabBar` (desktop), plus a `NotificationBell` mounted twice in breakpoint wrappers (`atleta/layout.tsx:70-95`). Landing (`Nav.tsx`/`Footer.tsx`/`FooterMinimal.tsx`) and TV add two more. Fix: one `AdminShell` used by the layout for all roles; one `AtletaNav` with responsive variants.

**[P2] Dead theme toggle.** `layout.tsx:87-92` sets `forcedTheme="dark"` and `enableSystem={false}`; `atleta/ajustes/page.tsx:133` still renders `<ThemeToggle/>` whose `setTheme` is ignored under a forced theme, while announcing "Cambiar a tema claro" to assistive tech. It also styles itself with legacy `var(--card)`/`var(--line)`. Remove it or ship a real light theme.

**[P2] Two styling systems.** 2,676 inline style objects in 66% of TSX files alongside Tailwind arbitrary values; the same button appears as `k-btn-grad`, `bg-[var(--k-accent)]`, and `style={{ background: "var(--k-accent)" }}` (`RouterSplit.tsx:58-68`). Codemod inline tokens to utility classes before the next sweep.

---

## E. Performance signals (code-level; not measured)

- **framer-motion (72 files): correct pattern.** `MotionProvider.tsx:15` uses `LazyMotion features={domMax} strict`; all 69 consumers import `m`, zero import `motion`. Minor: `domMax` (layout/drag features) is loaded globally including landing/login where `domAnimation` suffices — **[P3]**.
- **Recharts 3.8: correct.** 3 `*.impl.tsx` files, all behind `next/dynamic` (`BarChart.tsx:19`, `DonutChart.tsx:7`, `CapabilityRadar.tsx:7`); the line/area charts are custom SVG.
- **[P2] Large client components on hot routes.** `AdminDashboardV3.tsx` 2,170 lines (shell + KPIs + charts, all `"use client"`) on the owner's default route; `OnboardingWizard.tsx` 1,206; `AdminSidebar.tsx` 995; `Step2Review.tsx` 718; `SkillTree.tsx` 692; `PhotoWodFlow.tsx` 616; `ClassesList.tsx` 611. 262 of ~482 TSX files are client components. Split V3 into server KPI sections with small client islands.
- **[P2] 10 layout-property animations** (Impeccable detector): progress bars animating `width` in `TrophyStrip.tsx:182`, `VictoryHero.tsx:175`, `LogrosCatalogCached.tsx:234`, `GoalCard.tsx:150`, `ClassesList.tsx:537`, `skills/page.tsx:229`, `logros/[code]/page.tsx:256`, `AdminSidebar.tsx:989` (sidebar collapse), `landing.css:834,910`. Replace with `transform: scaleX()` / `grid-template-rows`.
- **[P3] Images:** 9 files use raw `<img>` (YouTube thumbs, uploads, whiteboard previews, logos) and `next.config` `remotePatterns` only allows Unsplash, so none of them get optimization; landing correctly uses `next/image` via `DuotoneImage`. **[P3]** Landing hero autoplays `/landing/kronos-tour.mp4` with `preload="auto"` (`HeroVideo.tsx:38-43`); file size UNVERIFIED — likely the LCP/bandwidth risk on mobile.
- **CSS:** `globals.css` (2,074 lines) loads on every route; `landing.css` (1,982 lines) is correctly scoped to the `(landing)` layout.
- **Service worker (`public/sw.js`, v2):** `/api/*`, `/admin*`, `/atleta*` are network-only (the 2026-05-17 leak fix holds; registered at scope `/`, `PwaRegister.tsx:30`); `_next/static` + icons cache-first; everything else network-first with 3s timeout and cache fallback. **[P2] Residual caching risk:** network-first also caches `/uploads/whiteboards/*` (athlete names/scores photos, `storage/local.ts:16`) and `/invitacion/<token>` HTML — on a shared box tablet these survive logout offline. Add `/uploads` and `/invitacion*` to the network-only list; delete the unused `staleWhileRevalidate`. Manifest is sound (`start_url: /atleta`, maskable icons).
- **What to measure on the production build:** `next build` per-route First Load JS (`/admin`, `/atleta`, `/atleta/perfil`, `/admin/ajustes/horarios`), `@next/bundle-analyzer` for framer `domMax`, Recharts, `posthog-js`; Lighthouse mobile on `next start` for `/` (LCP vs the mp4), `/atleta/perfil` (CLS from the hydration regenerate), `/admin` (TBT from the 2,170-line client tree), `/admin/ajustes/horarios` (INP with 160 buttons).

---

## F. Role and tenant behavior

| Actor → route                                                  | Result                                              | Mechanism                           | Verdict           |
| -------------------------------------------------------------- | --------------------------------------------------- | ----------------------------------- | ----------------- |
| anon → `/admin`, `/atleta`                                     | 200 `/login?callbackUrl=…`                          | `middleware.ts` `withAuth`          | correct           |
| atleta → `/admin`                                              | 200 `/atleta`                                       | `middleware.ts:34-36`               | correct, silent   |
| owner → `/atleta`                                              | `/admin` (capture timed out on dev restart)         | `middleware.ts:38-40`               | correct           |
| coach → `/admin/billing`                                       | `/admin`                                            | `billing/page.tsx:109`              | silent redirect   |
| coach → `/admin/ajustes/permisos`                              | `/admin`                                            | `permisos/page.tsx:12`              | silent redirect   |
| coach → `/admin/super/platform`                                | 200, 404 page "Página no encontrada", no shell      | `super/layout.tsx:19-20 notFound()` | different pattern |
| owner → `/admin/super/*`                                       | rendered (seed owner is in `SUPER_ADMIN_EMAILS`)    | —                                   | correct           |
| anon → `/invitacion/invalid-token-test`, `/invitacion-staff/…` | 200, card "Invitación no encontrada", "Ir al login" | page-level                          | graceful          |
| anon → `/piloto-beta` (no params)                              | 200, "Link incompleto"                              | page-level                          | graceful          |

**[P1] The coach's landing page after login has no navigation.** Redirect targets for both denials are `/admin`, where the coach gets a page with 2 content links and no sidebar/topbar (section D). A denied coach cannot tell they were redirected nor where to go.
**[P2] Inconsistent, silent denials.** Role denials redirect; super-admin denial 404s. Both are acceptable individually (404 hides the super surface), but redirects should carry a flash (`?denied=billing`) and the dashboard must expose navigation.
**[P3] Super-admin 404 leaks intent in the tab title** ("Platform · Kronos super-admin" is set by metadata before `notFound()` runs).
**[P3] Invalid invitation returns HTTP 200** (should be 404) and uses voseo ("Pedile a tu Box", `anon/1280/invitacion_invalid_token_test.png`) against the neutral-Mexican rule; commit `993152e` fixed only the staff variant.
**[P3] `/tv` index** renders no h1, links, or box selector (`anon/1280/tv.png`).
No cross-tenant symptom was observed; all owner/coach screens show Iron Hands data only.

---

## G. Scores and executive summary

| Dimension                | Score (0–4) | Band     | Justification                                                                                                                                                                                                            |
| ------------------------ | ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Accessibility            | 1           | Poor     | 325 axe nodes on 14 screens; `--k-t3` at 2.67:1 in 534 usages; atleta has no `<main>`; emoji icons in 71 files; 1,343 sub-40px targets at 360                                                                            |
| Performance              | 2           | Adequate | LazyMotion + dynamic charts done right; but a 2,170-line client dashboard, 10 layout animations, autoplay mp4 hero, SW still caches uploads; nothing measured on a prod build                                            |
| Responsive               | 2           | Adequate | Only 2 overflowing routes, but the owner dashboard shell is unusable at 360 and clipped at 768, no tablet compositions, atleta stretched at 1280, horarios 181 small targets                                             |
| Theming                  | 2           | Adequate | V3 tokens dominate (0 banned hex, landing 100% tokenized); 59 files still on `--text/--card/--line/--bg`, 16 files off-palette, warning color used decoratively on the home hero, 4 font declarations, dead theme toggle |
| Implementation integrity | 1           | Poor     | 3 admin shells + 3 atleta navs, coach dashboard with no nav, 2 reproducible runtime errors on athlete paths, landing invisible without JS, 2,676 inline styles beside Tailwind                                           |

**Counts by severity (43 findings):** P0 **0** · P1 **10** · P2 **21** · P3 **12**. No P0 because no data exposure or fully blocked flow was observed; the owner dashboard at 360 (A) becomes P0 if phone-first owners are a primary persona.

**Top 5 technical fixes (ordered by impact per hour):**

1. **Unify the admin shell** — delete the V3 internal sidebar/header, render `AdminSidebar` from the layout for every role and route. Fixes the 360/768 dashboard, the coach no-nav dashboard, and removes ~600 duplicated lines (A1, A2, D4, F1).
2. **Raise `--k-t3` to ≥ 4.5:1 and add `<main>` to `atleta/layout.tsx`** — two token/markup edits that clear the majority of the 325 axe nodes across both surfaces (B1, B2).
3. **Fix the two athlete runtime errors** — `PushSubscribeButton` permission read into `useEffect`; move the personal-box gate out of page-level `redirect()` into the layout. Add e2e `pageerror === 0` assertions for `/atleta/perfil`, `/atleta/programa`, `/atleta/wod/nuevo`, `/atleta/wod/foto` (C1, C2).
4. **Make the landing render without JS** — `initial={false}` on SSR for `RouterSplit`/`Hero` variants, then re-verify the SyntaxError on a production build (C3).
5. **Responsive tables and touch targets in admin** — stack the reservas roster below `md`, 44px hour chips + fixed action bar in horarios, and audit the sidebar item height once for all 32 admin routes (A3, A5, A6).
