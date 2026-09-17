# Kronos admin operations — design review

Surface: owner/coach admin (`/admin/**`). Captured 2026-09-15 on seeded dev (Iron Hands CrossFit · Polanco, 27 athletes, 6 classes today) at 360, 768 and 1280. Mode: Operate. Sources: `scratchpad/screens/{owner,coach}/{360,768,1280}/`, crops in `scratchpad/crops/admin-ops/`.

## Surface verdict

1. The admin ships **two app shells plus a "no shell"**: `/admin` draws its own sidebar + topbar inside `AdminDashboardV3.tsx` ("ADMIN · v1.0"); the other eleven routes use `AdminSidebar.tsx` ("OS · v1.0", collapse button, no topbar, different nav items); a coach on `/admin` gets no navigation at all because `SidebarGate` hides the shared sidebar on that path assuming V3 will draw one.
2. The owner dashboard has **no responsive layer** (inline styles, fixed grids like `72px 180px 140px 1fr 90px 110px`): at 360 the sidebar stays pinned and content becomes a 90px column; at 768 the topbar wraps into three lines.
3. The **daily coach loop is inverted**: check-in on `/admin/asistencia` sits under four KPI tiles, three glow charts and a no-show table (y≈1,270 at 1280, ≈1,760 at 360); `/admin/reservas` at 360 renders the roster with no athlete names and overflows to 504px.
4. **Color and copy break the house rules on most screens**: negative revenue rendered lime with an up-caret, orange class times, orange/red WOD titles by type, "ATTENDED"/"BOOKED"/"ACTIVE"/"ROUNDS_REPS" chips, "Mantené el tono", "Subí una foto", emoji icons (📸, 🔥).
5. The bones are good: week grid, PR cards, utilization heatmap and the whiteboard step flow are the right ideas. The fix list is mechanical, not conceptual.

## Per-screen findings

### /admin (owner)

Verdict: the most polished screen and the most structurally broken — own shell, no responsive layer, and a headline number that lies about direction.

- [P0] [consistency] Chrome differs from every other page. Here: sidebar "ADMIN · v1.0", badges (Atletas 27, Reservas 17), Reportes/Ajustes/Auditoría, topbar with box chip, ⌘K search, bell, moon, avatar. Elsewhere: "OS · v1.0", collapse chevron, Eventos + Cerrar sesión, no badges, no topbar, and its GESTIÓN block is clipped by the sticky "EN BOX" footer at 800px (Comunicaciones half-cut; Reportes/Ajustes/Auditoría hidden). Root: `src/app/admin/_components/SidebarGate.tsx` returns null on `/admin`.
- [P0] [responsive] At 360 the 240px sidebar stays pinned and the page is a ~90px column ("Buen / días / Iron", MRR shows "$", class table shows only HORA). At 768 the box chip and search placeholder each wrap to three lines. Manifest `hOverflow:false` only because content is clipped.
- [P1] [color] "-51.4% · -$147,000 vs período anterior" in lime with an up-caret; same on "Revenue diario $138,750 ^ -51.4%". Revenue halved and the tile says good news.
- [P1] [dataviz] Range "Últimos 30 días" but both x-axes read "1 abr · 8 · 15 · 22 · 29 · 7 ma" — April data under a September label. Y ticks (~8px, `--k-t3` on `--k-surface`) are unreadable.
- [P1] [IA] Two competing range controls: header "ÚLTIMOS 30 DÍAS" dropdown and per-chart "1S 1M 3M 1A".
- [P1] [bug] "Próximas clases · hoy" lists 05:00 p.m., 06:00 p.m., 07:00 p.m., 06:00 a.m., 07:00 a.m. — not chronological, and at 12:52 the morning classes already ran. 12-hour here; Operación pages use 24-hour.
- [P1] [states] "Atletas en riesgo · 0 de 0 totales" while `/admin/atletas` reports 3 of 42. "0 de 0" reads as a failed query.
- [P2] [copy] "Buenos días, Iron" at 12:52: `session.user.name.split(" ")[0]` with English fallback "Owner" (`src/app/admin/page.tsx:207-210`), no time-of-day. "Revenue diario" (`AdminDashboardV3.tsx:2144`) is English. Box switcher shows the literal "TU BOX / OWNER" (`AdminDashboardV3.tsx:466`), not the box name.
- [P2] [consistency] Moon/theme toggle on a dark-only system; unlabeled download icon; bell dot without count.
- [P2] [hierarchy] "Asistencias hoy 17 / 27 · 63%": 27 is reserved seats, not capacity (6 × 10). Say "17 de 27 reservados".

### /admin (coach)

Verdict: a coach who logs in lands on a page with nowhere to go.

- [P0] [IA] No sidebar, topbar or hamburger at any width. Exits: "Ver semana →" and "Detalle →". Reservas, WODs, Atletas and logout need a typed URL. Root: `SidebarGate` hides the shell on `/admin`; `CoachDashboard` (`src/app/admin/page.tsx:415`) draws none.
- [P1] [color] Class times 06:00…19:00 and both links in orange.
- [P1] [copy] "Tu equipo viene parejo. Mantené el tono." — voseo (`src/app/admin/_components/AtRiskCard.tsx:40`). "Martes, 15 De Septiembre" Title Case.
- [P2] [a11y] "✓ Ningún atleta en riesgo" is a text glyph, not an SVG.
- [P2] [hierarchy] Occupancy encoded three times per row ("6/10", "60% lleno", "6/6 asistidos"); "0/4 asistidos" on a 17:00 class at 12:46 reads as a problem. "Asistencia hoy" card is 80% empty.
- [P2] [efficiency] No check-in action: the next class has no "Pasar lista".
- 360: stacks cleanly, two small targets. The one screen that works at 360 is the one with no chrome — the chrome is the problem.

### /admin/atletas

Verdict: a CRM list that hides 34 of 42 athletes by default behind a glowing chart.

- [P1] [IA] Default "Últimos 30 días" filter → "8 en filtro · 42 activos totales". A member who joined in July is invisible until the owner spots the date chip. Default must be all active.
- [P1] [bug] "42 activos totales" vs "27 atletas activos" and sidebar badge 27 on the dashboard.
- [P1] [dataviz] "Crecimiento": bars and a line superimposed with no legend, y-axis 40→52 (truncated axis exaggerates growth), heavy glow, 290px tall, pushes the list to y≈950. Less information than the four tiles above it.
- [P1] [copy] "ACTIVE" chip on every row; "Estado" is a native `<select>` with a white browser chevron.
- [P1] [a11y] "🔥 ATLETAS EN RIESGO (3)" — emoji as section icon (`src/app/admin/atletas/page.tsx:234`), in orange.
- [P2] [states] At-risk rows say "Días sin asistir: NUNCA" beside "Membresía: Vigente" with no action (WhatsApp, note) and no link to the athlete.
- [P2] [efficiency] Row checkboxes with no bulk bar; eight sortable columns with no visible sort state; "1 / 1" pager with disabled arrows still rendered.
- [P3] [copy] "5553165435" unformatted.
- 360: hamburger header works; the table scrolls sideways inside its card (Atleta/Teléfono/Estado visible); 39 targets under 44px (checkboxes, sort glyphs, pager). A card list beats a clipped table.

### /admin/atletas/forma

Verdict: a Gemini demo parked under "Atletas", in voseo, with browser-default controls.

- [P1] [copy] "Subí una foto…" twice (`forma/page.tsx:43`, `FormAnalyzerClient.tsx:195`).
- [P1] [consistency] Native "Choose File / No file chosen" (English, unstyled) and native selects in a branded form.
- [P2] [IA] Highlights "Atletas" in the sidebar but is an AI vision tool; the right card is a passive placeholder repeating the left copy, and at 360 it renders after the submit button.
- [P2] [copy] "Gemini Vision" vendor name and "KRONOS AI · VISION" eyebrow in user copy.
- [P3] [states] No sample result, loading or error state.

### /admin/atletas/invitar

Verdict: functional bulk invite; the primary button is visually broken and the channel is wrong for Mexico.

- [P2] [bug] "ENVIAR 0 INVITACIONES" overflows its button at 1280 and 360 (E cut by the left edge); the disabled style (olive fill, bright top edge) reads as a glitch.
- [P2] [copy] Placeholder "alice@example.com,Alice Liddell,5551234…" rendered at near body-text contrast, so it reads as pre-filled data. "aparecerán acá" → "aquí" (`PendingInvitationsList.tsx:51`).
- [P2] [IA] Email only; Mexican boxes onboard through WhatsApp. No "copiar link" or share.
- 360: fine apart from the button.

### /admin/programacion

Verdict: the strongest Operate screen, undermined by intra-day sort order and decorative orange.

- [P1] [bug] Cards inside each day are not chronological: MAR 15 lists 18:00, 19:00, 06:00, 07:00, 09:00, 17:00; every day repeats the pattern.
- [P1] [color] "Open Box" classes (SÁB 19) titled in orange with orange fill bars. Class type is not a warning.
- [P2] [hierarchy] Cards show no coach and no WOD; a day is six near-identical cards. Past day muted — good.
- [P2] [responsive] 768: seven ~100px columns truncate names ("1RM Sna…") and clip chips ("13/2"). 360: a 3,058px vertical week with today second and no "jump to now".
- [P3] [copy] "Semana 15 Sep" vs "Semana del 14-sep al 20-sep" 60px apart.

### /admin/wods

Verdict: a loud library where color encodes type instead of meaning and enums leak into the UI.

- [P1] [color] Titles colored by type: STRENGTH orange, EMOM coral/red, AMRAP orange, TABATA amber. "Death by Burpees" is red because it is an EMOM.
- [P1] [copy] Raw enums as labels: "HEAVIEST", "REPS", "ROUNDS_REPS"; "FOR TIME" chip and "• FOR TIME" measure duplicated on one card.
- [P2] [efficiency] Twenty cards, no search/filter/sort; ragged two-column masonry; "15-SEP" (seed date) on every card.
- [P2] [responsive] The movement-library rail is a fixed-height box clipping its 8th row at 1280; at 360 it lands after 5,079px of cards.

### /admin/movimientos

Verdict: clean, boring, correct — the only table that behaves.

- [P2] [states] 15 of 52 rows show a grey "•••" placeholder thumbnail; a resource 404 fires on every load (manifest `consoleErrors`). "ESTÁNDAR" on all 52 rows conveys nothing.
- [P2] [efficiency] No "sin video" filter; the pencil is the only action, ~16px at 360 (26 small targets).
- [P3] [copy] The slug ("back-squat") under every name is developer information.

### /admin/clases/…/scores-from-whiteboard

Verdict: a promising feature whose first step is a bare dropzone with an emoji and no way back.

- [P1] [a11y] "📸" emoji as the dropzone icon (`_steps/Step1Upload.tsx:188`).
- [P1] [IA] No back link, breadcrumb, active sidebar item or cancel. "PASO 1 DE 3" without naming steps 2–3. No entry point is visible on any reviewed screen — neither the roster nor the Asistencia class cards offer "Cargar pizarra".
- [P2] [states] No guidance that drives OCR accuracy (frame the whole board, avoid glare, one line per athlete) and no note that names are matched to the roster and editable in step 2.
- [P2] [consistency] "09:00 a.m." (12h) vs 24h on Operación pages; centered layout vs left-aligned everywhere else.
- 360: the dropzone is a generous tap target — the correct mobile affordance.

### /admin/reservas

Verdict: the desktop roster is solid; the 360 version is unusable.

- [P0] [responsive] At 360 the roster renders no athlete names — the Atleta column collapses to zero width and rows read "ATTENDED · 14-sep, 06:00 a.m." only. The tab row (TODAS … NO-SHOW) overflows to 504px (`hOverflow:true`, both roles).
- [P1] [copy] "ATTENDED" chips beside Spanish tabs.
- [P1] [consistency] Three time formats on one screen: "06:00", "06:00 A.M.", "14-sep, 06:00 a.m.". "Martes, 15 De Septiembre" Title Case.
- [P2] [efficiency] Auto-selects 06:00 Murph (over six hours earlier at 12:46) instead of the next class. "Acciones" column empty for attended rows.
- [P2] [hierarchy] "Reservadas 0 · Lista 0 · Asist. 6 · No-show 0" next to "6/10": "Reservadas" means pending but reads as a contradiction.
- Owner = coach pixels.

### /admin/asistencia

Verdict: an analytics page wearing the coach's uniform — check-in is the last thing on it.

- [P1] [hierarchy] Today's classes start at y≈1,270 (1280) and ≈1,760 (360), under four tiles, three charts and the no-show table, on a 3,000–3,500px page.
- [P1] [bug] Subtitle "Últimos 7 días · 170 asistencias" vs filter "Últimos 30 días". Y-axes go negative ("Asistencia diaria" 60→-20, "No-shows diarios" 5→-1). No day labels on x.
- [P1] [copy] "ATTENDED"/"BOOKED" chips, "No-show rate", "Clases De Hoy · Martes, 15 De Septiembre".
- [P1] [a11y] Check-in control is a 16px native checkbox plus a 12px `--k-t3` "Seleccionar 4" link; no visible "Marcar asistencia" button. 30 small targets at 360.
- [P2] [dataviz] Bars + curve + glow on both charts add weight, not information; the heatmap "Utilización por día y hora" is the useful one and its hour labels are ~7px.
- [P2] [states] Past classes list only ATTENDED rows; the 7% no-shows the KPI counts never appear. The icon before "NO-SHOWS RECURRENTES" is not an SVG.
- Coach = owner pixels: a coach sees no-show rate and recurring offenders before their own class.

### /admin/prs

Verdict: readable, and the one page where lime unambiguously means "best".

- [P2] [dataviz] Nine cards in a 3-col grid with heights from 1 to 16 rows — ~900px of empty card in rows two and three. No collapse, no athlete search.
- [P2] [consistency] Dates "3/9/2026" here vs "03-sep" elsewhere.
- [P3] [a11y] Rank numbers in `--k-t3` on `--k-surface` sit under 3:1.

### /admin/leaderboards

Verdict: a podium for a WOD picker — pretty, low utility.

- [P1] [color] Weekly attendance ranks 1–3 in orange.
- [P2] [dataviz] Podium spends 220px on three names; the table begins at #4. "Score: WEIGHT · 6 atletas" leaks the enum.
- [P2] [IA] Native `<select>` WOD picker; no date range; four athletes tied at 3 with no tiebreak.
- [P2] [responsive] 360: podium names overflow the card edge; table clips "LOGRADO".

## Heuristic scores

| #   | Heuristic                   | 0–4 | Evidence                                                       |
| --- | --------------------------- | --- | -------------------------------------------------------------- |
| 1   | Visibility of system status | 2   | Occupancy bars good; range labels and KPIs contradict data     |
| 2   | Match with the real world   | 1   | ATTENDED/BOOKED/ACTIVE/ROUNDS_REPS, voseo, 12h/24h mix         |
| 3   | User control and freedom    | 1   | Coach dashboard has no nav; whiteboard step has no back/cancel |
| 4   | Consistency and standards   | 1   | Two shells + no-shell; three time formats on one screen        |
| 5   | Error prevention            | 2   | Invite parser documented; disabled button visually broken      |
| 6   | Recognition over recall     | 2   | Clear nav labels; hidden 30-day filter on athletes             |
| 7   | Flexibility and efficiency  | 1   | Check-in buried; no WOD search; no next-class autoselect       |
| 8   | Aesthetic and minimalist    | 2   | Strong type; glow charts and podium spend pixels on nothing    |
| 9   | Error recognition/recovery  | 2   | No error states observed; silent 404                           |
| 10  | Help and documentation      | 1   | No OCR guidance; ARPU/CHURN undefined                          |

Total 15/40 → **37.5/100**.

## Top 8 issues

1. **Three shells for one product (P0).** Why: chrome is the user's map; changing it per route and removing it for coaches makes the admin feel like three apps. Fix: delete the V3 in-component sidebar/topbar, render `AdminSidebar` from `layout.tsx` for every role and route, port search/bell into that shared shell, remove `SidebarGate`'s `/admin` exception.
2. **Coach lands with no navigation (P0).** Why: coaches are the daily users; two links on a phone is a dead end. Fix: item 1, plus a "Pasar lista" primary action on each upcoming class row.
3. **Dashboard is not responsive (P0).** Why: inline styles and fixed grids; at 360 it is a 90px column. Fix: rebuild on the Tailwind grid the other pages use (`lg:` sidebar, single column below), collapse the class table to rows under `md`.
4. **Reservas roster at 360 loses names and overflows (P0).** Why: a roster without names cannot be used for check-in. Fix: `overflow-x:auto` tab strip, and stacked rows (name + status + reserved-at) instead of a four-column table under `md`.
5. **Check-in is under the analytics (P1).** Why: the coach's task is the last 40% of a 3,500px page. Fix: "Clases de hoy" first with the next class expanded, 44px "Asistió / No vino" toggles per row, sticky "Guardar (4)" bar, charts under a "Tendencias" tab.
6. **Negative revenue shown as lime up (P1).** Why: owners read direction from color before digits; -51% in lime is false reassurance. Fix: a delta component mapping sign → `--k-danger` + down / `--k-accent` + up, and a range that never shows April under "últimos 30 días".
7. **English chips, raw enums, voseo, emoji (P1).** Why: rules 1 and 3; individually small, together they read as unfinished. Fix: one label map (`ATTENDED→Asistió`, `BOOKED→Reservado`, `ACTIVE→Activo`, `ROUNDS_REPS→Rondas + reps`, `HEAVIEST→Más pesado`, `WEIGHT→Peso`); "Mantené"→"Mantén", "Subí"→"Sube", "acá"→"aquí"; SVGs for 📸/🔥/✓.
8. **Sorting and time format (P1).** Why: a class list is read as a timeline. Fix: sort by `startsAt` everywhere (dashboard, each day column, Asistencia), hide finished classes from "Próximas", and standardize on 24h across admin.

## What works

- **Week grid on /admin/programacion**: seven columns, muted past day, "HOY" chip, capacity fill bars plus a numeric chip — the week reads in one glance.
- **PR cards on /admin/prs**: lime top-1 with name and date, then a ranked list with right-aligned kg — the hierarchy the data needs.
- **Utilization heatmap on /admin/asistencia**: day × hour occupancy is the most decision-useful viz in the admin (when to add or cut a class); it only needs bigger labels.
- **Whiteboard flow framing**: scoped to a class, numbered steps, a large tap target that works at 360.
- **Shell B at 360**: hamburger header and single-column stacking hold on 10 of 12 routes with no overflow.

## Persona red flags

**Coach, phone, 3 minutes before 17:00.** Opens `/admin`: no menu. Taps "Detalle" → `/admin/asistencia` (~9.6s load on the coach capture), scrolls ~1,800px past tiles, glow charts and a no-show table to reach "17:00 1RM Push Press", then meets 16px checkboxes, a 12px "Seleccionar 4" link and no visible save. The alternative, `/admin/reservas` at 360, pans sideways and shows statuses with no names. Net: 1 tap, 1 long scroll, 4 sub-44px taps, an unknown save — attendance goes on paper.

**Owner, Monday morning, checking money.** "$138,750" in 96px lime with "^ -51.4%" also lime — fine for two seconds, until "-$147,000 vs período anterior". The 30-day chart shows April. "Atletas en riesgo: 0 de 0", but Atletas says 3 at-risk and 42 active while the dashboard said 27; CHURN is "—". No two numbers agree, so the owner opens a spreadsheet. The dashboard needs one source of truth for active/at-risk/MRR and a delta component that cannot show red news in green.

## Questions to consider

1. Is `AdminDashboardV3` meant to replace `AdminSidebar` everywhere, or was it a one-page port? Either answer deletes one shell.
2. Is `/admin/asistencia` two products (coach check-in vs owner attendance report) sharing one URL? If so, split them by role or by tab.
3. Which time format is canonical in admin — 24h (Operación) or 12h (dashboard, whiteboard, roster column)?
4. Where does a coach start the whiteboard OCR flow? No reviewed screen links to it.
5. Are "activos" 27 or 42, and is "en riesgo" a 14-day rule or a membership rule? Dashboard, sidebar badge and athletes page disagree.
