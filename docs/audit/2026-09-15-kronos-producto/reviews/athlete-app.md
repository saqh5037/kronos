# Athlete app — design review (2026-09-15)

Surface: `/atleta/**` (mobile-web PWA, seed athlete Emma Soto, Iron Hands CrossFit · Polanco). Primary breakpoint 360×780; 768 and 1280 checked where noted. Source: full-page captures + `manifest.jsonl` signals.

## Surface verdict

1. The visual system is genuinely strong (lime-on-black, Plex Mono numbers, the streak hero) and the WOD screen puts the log form on the same page as the workout, which is the right architecture.
2. Structurally the app is a feature catalog stacked vertically, not a daily loop: the home leads with a streak and a trophy shelf, today's WOD is 1,100 px down and only as a leaderboard header, and the first tappable action is **Cancelar**.
3. Data coherence is the biggest trust problem: 0 XP next to four unlocked badges, an unsorted "MURPH HOY" ranking with 4-minute Murphs, Emma's 120 kg squat missing from a leaderboard that tops at 111 kg, Cardio 0 with Helen/Karen/Fran scores on file.
4. House rules are broken systematically, not occasionally: decorative orange/red on ~12 elements, at least five header patterns (three with the back link rendered under the hamburger), English enums and model strings surfacing in Spanish UI.
5. Against the Whoop/Garmin bar: aesthetically 70% there, behaviorally 35% — no anchor number, no trends anywhere, no autofill, no readiness surface, and a 4,193 px profile instead of score → 7-day → 30-day → raw.

## Per-screen findings

### /atleta

One line: a streak-first trophy wall; today's workout and the primary action are outside the first viewport.

- [P0] [hierarchy] First viewport at 360 = hamburger/bell, "Hola, Emma", streak hero (7 días), three rings (2 / 7 / 5), start of LOGROS. Zero actions. The first button reachable by scrolling is **Cancelar** on tomorrow's 06:00 class, a destructive action. The screen never answers "what do I do now".
- [P1] [loop] Today's WOD (Murph) appears only as "LEADERBOARD · MURPH HOY" ~1,100 px down. Logging today = scroll, tap 5th tab, scroll 830 px. Whoop/Hevy do this in one tap from the home.
- [P1] [gamification] "LOGROS · 0 XP" sits directly above four DESBLOQUEADO badges; `/atleta/logros/first-class` awards "+50 XP". The economy contradicts itself on screen one.
- [P1] [color] PRs ring is orange; both recent-PR rows use orange kettlebell icons and an orange "PR" chip. Nothing here is a warning. Four decorative-orange violations on the home alone.
- [P1] [bug] "MURPH HOY" ranks 11:48, 9:04, 4:04, 9:00 as 1–4: not sorted in either direction, and physically impossible Murph times. Whether seed or sort, the ranking is visibly wrong.
- [P2] [hierarchy] Streak is stated three times (hero, ring, profile). Rings carry no trend and no target except "esta semana".
- [P2] [copy] Kronos AI card (legible at 768): "Emma, con tu alta energía, es hora de que Helen sienta tu nuevo PR." Helen is a WOD; the sentence is meaningless. Tag "PUSH" in English.
- [P2] [responsive] 1280 and 768 are the 360 layout stretched: 400 px ring tiles with a 70 px ring at the far left, leaderboard names 1,100 px from their times, a 6-tab phone bar spanning 1,280 px. No max-width column, no grid.
- [P3] [a11y] Eyebrow labels ("ESTA SEM", "DÍAS DE RACHA") in `#54545c` on `#08080a` at ~9 px are under 3:1.

### /atleta/wod

One line: right architecture (WOD + form on one screen), wrong details in almost every field.

- [P1] [copy] Chip reads "FORTIME" (no space); the movement card header says "FOR TIME — ROUNDS FOR TIME" on a For Time WOD; form heading "SUBIR MI SCORE".
- [P1] [bug] The structured list collapses Murph's two runs into "3200 Run" (no unit) and contradicts the free-text block above it ("1 mile run … 1 mile run"). The structured version changes the workout.
- [P1] [forms] Result placeholder "ej. 5:30" on a 60' cap; "UNIDAD" prefilled with "s" while the placeholder implies mm:ss; three identical "?" pills next to ESCALADO explain nothing; no time-cap/DNF (reps at cap), no vest/partner variant, no RX+, no "Tu último Murph" autofill.
- [P1] [hierarchy] The form starts ~830 px down. At 360 the first viewport shows PREV/NEXT, title, description and the first movement — no CTA and no sticky "Registrar".
- [P2] [consistency] Leading "·" artifact in "· TIME · CAP 60'"; right-side icons (runner, bar, lightning) are decorative and unexplained; "↗" unicode arrows used as link affordances.
- [P2] [bug] `/atleta/wod/nuevo` and `/atleta/wod/foto` redirect here with "Rendered more hooks than during the previous render".

### /atleta/reservar

One line: functional two-tap booking buried under filters and past classes.

- [P1] [IA] Three stacked full-width selects (tipos, coaches, día) take 170 px before the first class. A box with six classes a day and one coach does not need filters above the fold.
- [P1] [states] Past classes (06:00, 07:00, 09:00) keep a dimmed "RESERVAR" button plus an 8 px "PASADA" chip. A past row should link to the WOD/results, not offer a disabled booking.
- [P2] [copy] "MARTES 15 · 6 CLASES", then "6 CLASES", then "15-SEP": the same fact three times in 120 px.
- [P2] [hierarchy] Card internals are cramped: "COACH LOBO RAMÍREZ" wraps to three lines at 8 px, the capacity bar is ~70 px, "F"/"S" and "?" chips are unexplained; 19 sub-40 px targets recorded.
- [P2] [loop] No "tienes clase mañana 06:00" summary; the lime dot on MIÉ 16 is the only booked indicator, and the day strip clips at "DO" with no scroll affordance.
- [P3] [responsive] 1280: 1,250 px rows, 1,000 px capacity bar; 768 acceptable.

### /atleta/perfil

One line: 4,193 px of 13 stacked modules — a data warehouse, not a trends experience.

- [P1] [hierarchy] Order: streak (again) → four static tiles → PRs → goals → AI predictions → 10-row score history → activity bars → normalized 90-day line → radar → capability bars → heatmap → Explorar → notifications. Nothing has a 7/30-day trend; nothing collapses.
- [P1] [dataviz] "PROGRESO · ÚLTIMOS 90 DÍAS" plots kg and mm:ss "normalizados 0–100" on one line, with bars and a line double-encoding the same series: meaningless. Activity chart labels read "07- 08- 09- 10- 11- 14- 14-" (truncated, duplicated).
- [P1] [bug] Capability profile shows Cardio 0 and Core 0 with Helen/Karen/Fran on file; the 90-day heatmap lights ~4 cells against a 7-day streak and "17 clases"; the Back Squat "120" renders inside a ghosted highlight box; hydration mismatch logged on this route.
- [P1] [copy] Goal titled "ATTENDANCE"; prediction copy "Necesitamos al menos 3 attempts"; "99% CONFIANZA" on a six-week 1RM forecast is an overclaim that will be wrong in public.
- [P2] [color] "Olympic · A MEJORAR" in orange; "¿Cómo habilitar?" link in orange.
- [P2] [gamification] "#1 DE 36" here, absent from the box leaderboard for the same lift (below).
- [P3] [responsive] 1280: tiles go 2-col, everything else is a 1,250 px single column with a 200 px radar.

### /atleta/historial

One line: clean list, zero insight.

- [P2] [consistency] Unit printed twice ("78 kg" then "kg" beneath); time results get "s" under "10:06".
- [P2] [loop] No PR flags, no grouping by WOD, no delta vs last attempt; filters "Todos los WODs / Todo" are vague.

### /atleta/leaderboard

One line: six strangers, no me.

- [P1] [gamification] Emma (Back Squat PR 120 kg, profile "#1 de 36") is not on the 1RM Back Squat ranking that tops at 111 kg. Either PRs are not scores or the ranking is wrong; the athlete sees a contradiction either way.
- [P2] [hierarchy] No pinned "Tu posición" row; no time scope; three names for one thing (title "Tabla de rankings", eyebrow "LEADERBOARDS", profile tile "Ranking").

### /atleta/logros

One line: a trophy room where trophies and empty shelves look the same.

- [P1] [bug] "‹ INICIO" back link is rendered under the hamburger button.
- [P1] [gamification] Unlocked badges are gray two-letter codes (RW, FP, S7, FC) with the same treatment as locked ones; "30 días seguidos" shows 0% while the athlete is on day 7 (should be 23%); seven cards repeat "Pendiente de desbloquear · 0%".
- [P2] [copy] Eyebrow "TROPHY ROOM · ATLETA".
- [P3] [consistency] Text codes as icons violates the SVG-only rule in spirit; there is no glyph system.

### /atleta/logros/first-class

One line: celebration screen that contradicts the home.

- [P1] [bug] "‹ VOLVER A LOGROS" hidden under the hamburger (renders "LVER A LOGROS").
- [P1] [gamification] "+50 XP" vs "0 XP" on the home; criterion "17 / 1 clases · 100%".
- [P2] [states] "COMPARTIR · PRONTO" disabled placeholder button; copy "Cada PR cuenta una historia" on a first-class badge.

### /atleta/skills

One line: an empty-state hero sitting on top of a list; comprehensible only after the first tap.

- [P1] [hierarchy] The first viewport is "¿En qué quieres mejorar?" with "ELIGE UN OBJETIVO ↓" (a button that scrolls). An athlete with an active progression should land on it.
- [P2] [IA] Dimmed rows say "Nivel Escalado" / "Nivel RX" without saying whether that is a prerequisite or her level; the "PRINCIPIANTE" badge contradicts "#1 de 36".

### /atleta/skills/double-under

One line: the best-structured screen in the app.

- [P2] [forms] "LO DOMINO / QUITAR": QUITAR is ambiguous (drop the skill? the step?). No "Paso 1 de 5", no inline technique video ("VER TÉCNICA →" leaves the flow).

### /atleta/movimientos

One line: 6,210 px stitching two products (trained ranking + 52-card library) vertically.

- [P1] [consistency] Thumbnails are chaos: white CrossFit stills, YouTube frames reading "FIX THIS! KEEP THIS STRAIGHT" and "How To", letter placeholders (B, C, H, K, M, R) and fully blank cards (Double Under, Row, Run, Clean, every Accesorio). One thumbnail 404s in console.
- [P1] [color] Category chips: CARDIO orange, OLÍMPICO solid yellow-orange, GIMNASIA lime, FUERZA gray — decorative color on a category taxonomy.
- [P2] [IA] Search and filter chips appear 1,500 px down, after 14 ranked rows. The library should be the page and "entrenados" a filter.
- [P2] [a11y] Filter chips ~28 px tall; 8 small targets recorded.

### /atleta/movimientos/[id] (Thruster)

One line: real coaching content, half in English, ending on empty stats.

- [P1] [copy] Description leaks model text and mixes languages: "Front squat into overhead press in one fluid movement. Score: weight (kg). Tips RX: bar en rack frontal…"; equipment "Barbell / Plates"; muscles "Quads, Glutes, Shoulders, Core, Triceps".
- [P1] [color] Level chips INTERMEDIO orange and AVANZADO red; "ERRORES COMUNES" header orange. Avanzado is not an error.
- [P2] [states] Stat tiles "– PR ACTUAL · 0% PERCENTIL EN BOX · #0 RANK DE 3 · 1 ENTRENOS 90D" and a 250 px "Sin datos de progresión" box. "#0 de 3" is nonsense; zero states should shrink or hide.

### /atleta/plan

One line: a picker pretending to be a plan.

- [P1] [hierarchy] The athlete has an AI plan; the page shows "Elige el objetivo para el que quieres generar un plan" and two rows. 70% empty at 360. No current week, no next session, no adherence.
- [P2] [copy] "3 DE OCTUBRE DE 2026" uppercase mono takes a full line; no "faltan 18 días".

### /atleta/salud

One line: a weight log labeled as health — this is where the Whoop readiness card must live.

- [P1] [hierarchy] Anchor is 74.9 kg. When Whoop lands, the anchor must be recovery/readiness (one 0–100 number, 7-day trend, "hoy: entrena fuerte / suave") with weight secondary.
- [P1] [responsive] 360: "Tu cuerpo en el tiempo" wraps to three lines squeezed against "?" and "+ REGISTRAR".
- [P1] [color] "↓ 1.5 %" body fat is rendered in orange — a positive change in warning color.
- [P2] [dataviz] Bars and line double-encode one series; y-axis labels (79, 76.5, 74…) sit on top of bars; "-0.40 kg" has no reference ("vs. última medición").

### /atleta/eventos

One line: an instruction manual with no action.

- [P1] [states] "EVENTOS ABIERTOS" lists "Dominus Murph 2026 · 23 may 2026", a past event the detail page calls FINALIZADO. No result shown although the athlete presumably competed.
- [P2] [loop] The only action ("escanea el código QR que reparte el organizador") is prose. No "Escanear QR" button, no camera entry.

### /atleta/eventos/dominus-murph-2026

One line: a closed door.

- [P1] [states] "Este evento ya concluyó. El período de registro de resultados está cerrado." No result, no rank, no link to the event leaderboard. 80% of the viewport is empty.

### /atleta/pagos

One line: membership cards, not a trust moment.

- [P1] [copy] Plan types leak enums: "UNLIMITED", "MONTHLY".
- [P1] [hierarchy] No next charge date or amount, no payment method, no "Pagar" or "Descargar comprobante"; history collapsed behind an ASCII "▸ HISTORIAL (4)".
- [P2] [copy] "Mensual Ilimitado · 18 MAY 2026 → 5 OCT 2026" is 4.5 months for a "mensual" plan.

### /atleta/pagos/[id]/resultado

One line: the most anxious screen in the app.

- [P1] [states] "Procesando pago… Esperamos confirmación de Mercado Pago." with an infinite spinner: no amount, no order ID, no "te avisamos por correo", no timeout, no retry.

### /atleta/ajustes

One line: two settings and a logout.

- [P1] [consistency] Account card says "Atleta Demo · atleta@iron-hands.demo" while every other screen says Emma Soto. Identity mismatch.
- [P1] [states] "Tema · Claro u oscuro" in a dark-only design system is a dead control. No notifications (the profile says they are blocked), units, privacy, Whoop connect or payment method, although the Explorar tile promises "Cuenta y privacidad".
- [P2] [consistency] A fifth header pattern: round "←" button under the hamburger + "— CUENTA / Ajustes" + "?".

### /atleta/ayuda

One line: good intent, broken previews.

- [P1] [bug] Back link overlapped by the hamburger ("NICIO"). Tutorial thumbnails are composite mock UI whose text bleeds outside its cards ("Tu Strict Press no ha mejorado en 37 días…" over "¡Felicidades por tu Deadlift! ¡Qué gran logro, Bernardo!").
- [P2] [copy] Another persona (Bernardo) inside Emma's help center; "Tu Home en 30 segundos"; Title Case buttons "Ver Guía Interactiva / Ver Video" versus UPPERCASE mono everywhere else; "CENTRO DE AYUDA" is the only lime H1 in the app.
- [P2] [IA] Footer "¿Necesitas más ayuda? Pregunta a tu coach en el box → VER MIS AJUSTES": settings is not help.

### Cross-cutting

- [P1] [consistency] Chrome: home (hamburger + bell + "?"), WOD/Reservar (centered title), Historial/Salud ("‹ INICIO" below header), Logros/Ayuda/first-class (back link under hamburger), Ajustes (round arrow). One AppBar is needed.
- [P1] [IA] Tab bar "INICIO · RESERVAR · SKILLS · SALUD · WOD · YO": the daily core (WOD) is fifth, behind two tabs that are empty for most members; six 60 px tabs with 8 px labels at 360.
- [P2] [bug] `/atleta/programa` and `/atleta/onboarding` redirect to `/atleta` with a hooks-order error; the 360 onboarding capture is a blank dark frame after a 36 s load.
- [P3] [consistency] Unicode arrows ("→", "↗", "↓", "←") used as icons on buttons and links across the surface.

## Heuristic scores

| #   | Nielsen heuristic                 | Score (0–4)            | Evidence                                                                                   |
| --- | --------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------ |
| 1   | Visibility of system status       | 2                      | Booked dot, capacity bars, streak; but no "today" status on home, infinite payment spinner |
| 2   | Match with the real world         | 2                      | "3200 Run", "ROUNDS FOR TIME", "UNLIMITED", "attempts", English movement content           |
| 3   | User control and freedom          | 2                      | Cancelar exists; back links overlapped on 3 screens; "QUITAR" ambiguous; no undo on score  |
| 4   | Consistency and standards         | 1                      | Five header patterns, decorative orange/red, Title Case vs UPPERCASE, "kg kg"              |
| 5   | Error prevention                  | 1                      | Unit "s" vs mm:ss placeholder, no cap/DNF, past classes look bookable, "17 / 1 clases"     |
| 6   | Recognition over recall           | 2                      | RW/FP badge codes, "?" pills, "F"/"S" chips, unexplained "Nivel RX" gating                 |
| 7   | Flexibility and efficiency        | 2                      | No last-result autofill, no one-tap book/log from home, filters before list                |
| 8   | Aesthetic and minimalist design   | 2                      | Strong identity; 4,193 px profile, streak ×3, three stacked filters, dead zero-state boxes |
| 9   | Recognize and recover from errors | 1                      | Payment stuck state, silent 404 thumbnail, hydration error, no visible error states        |
| 10  | Help and documentation            | 3                      | Per-page "?", six tutorials; thumbnails broken, "Ver Video" unverified                     |
|     | **Total**                         | **18 / 40 → 45 / 100** |                                                                                            |

## Top 10 issues

1. **Home does not lead with today (P0).** Why: the daily loop starts here at 5:40 am and the screen offers a streak, rings, badges and a Cancelar button. Fix: a "Hoy" card first — WOD name + your class time (or "sin clase") + one lime CTA ("Reservar 06:00" / "Registrar Murph"); streak and readiness as a second row of two tiles; badges off the home.
2. **Score logging invites wrong data (P1).** Why: "ej. 5:30" on a 60' WOD, unit "s", three "?" pills, no cap handling. Fix: type-aware input (mm:ss mask for time, kg stepper for load, reps counter), "Cap alcanzado → reps completadas" toggle, RX/Escalado segmented control with a single info sheet, prefilled "Tu último Murph: 41:20 (RX)", sticky "Registrar" bar.
3. **Gamification contradicts itself (P1).** Why: 0 XP vs +50 XP, badges at 0% during a 7-day streak, unlocked = locked visually. Fix: one XP ledger feeding home and detail; computed progress on locked badges; lime fill + SVG glyph for unlocked; drop XP entirely if it buys nothing.
4. **Rankings and stats do not reconcile (P1, bug).** Why: unsorted 4-minute Murphs, Emma missing from a lift she leads, Cardio 0, heatmap vs streak. Fix: derive leaderboards, PRs, capability profile and heatmap from the same scores/attendance source; sort by metric direction (TIME asc, else desc); add a fixture test per view.
5. **Decorative orange and red (P1).** Why: house rule; orange now means "PR", "Cardio", "Olympic", "intermedio", "−1.5 % grasa" and sometimes "warning". Fix: token audit — PR ring and chips lime, categories monochrome with opacity, level chips gray outline, body-fat delta lime/gray, keep orange for real warnings only.
6. **Five header patterns and three overlapped back links (P1).** Why: every screen re-teaches navigation and three are visually broken. Fix: one `AppBar` (back or hamburger left, title center, ≤1 action right) with a fixed 56 px offset; delete per-page "?" or make it a single help entry.
7. **Profile is a wall, not a trend (P1).** Why: 13 modules, no 7/30-day deltas, a normalized kg+time line. Fix: split into "Progreso" (three tiles: asistencia, fuerza, cardio — big number + 7d sparkline + delta; tap → 30/90 days → raw list) and "Yo" (account). Remove the normalized line; collapse everything else.
8. **English and model strings leak (P1).** Why: UNLIMITED, MONTHLY, ATTENDANCE, "attempts", "Score: weight (kg)", Barbell/Plates, muscle names, TROPHY ROOM, ROUNDS FOR TIME. Fix: enum → label dictionary at the presentation boundary; translate the movement library content once; lint rule that fails on raw enum rendering.
9. **Tab bar priorities are inverted (P1).** Why: WOD fifth of six; Skills and Salud have no daily content for most members; 8 px labels. Fix: five tabs — Inicio · WOD · Reservar · Progreso · Yo; Skills lives under Progreso until it has an active progression; Salud becomes "Recuperación" and earns a tab only when Whoop data ships.
10. **Desktop is a stretched phone (P2).** Why: at 1280 every page is one 1,250 px column with a phone tab bar. Fix: `max-width: 720px` centered column for all athlete pages (cheapest, honest), or at ≥1024 a side rail replacing the tab bar and a 2-col grid for home/profile.

## What works

- **WOD + form on one screen.** No modal, no separate route; the athlete reads the workout and logs beneath it. Keep this and add the sticky CTA.
- **Double-under progression ladder.** Highlighted current step, locked next steps with level chips, "LO DOMINO" as a clear completion action. This is the model for Plan and Logros.
- **Visual identity.** The streak hero with the lime flame and grain texture, Plex Mono numerals, monochrome capacity bars in Reservar — it reads as a premium consumer app, not a box admin tool.
- **Reservar day strip.** Today/booked-dot/capacity-bar language is instantly readable and one tap away from booking at 17:00–19:00.
- **Movement coaching content.** "Haz esto / No hagas esto / Errores comunes / Cue" is the kind of content Garmin does not have; it needs translation and a PR CTA, not a redesign.

## Persona red flags

**34-year-old, 3×/week, opens the app at 5:40 am before the 06:00 class.** Sees "Hola, Emma", a 7 and three rings; must know WOD is the fifth tab to see Murph; her class is 700 px down, where the nearest button is Cancelar (a mis-tap at 5:40 cancels her spot). After class, logging means scrolling 830 px and decoding "UNIDAD s". 9 px `#54545c` labels are unreadable on a dimmed phone in a dark gym.

**Competitive athlete who wants trends and box comparison.** Finds no trend anywhere: four static tiles, a normalized line that mixes kg and minutes, a radar that says Cardio 0. The leaderboard omits her 120 kg squat while the profile says #1 de 36. A "99% confianza" forecast will be wrong and she will remember it. Movement detail says "0% percentil · #0 rank de 3". There is no "tú vs. el box" on any lift.

**Brand-new member who just accepted an invitation.** Onboarding redirects to a home that shows 0 XP, empty rings, seven locked badges and "PRINCIPIANTE"; nothing says "tu primera clase es el jueves, reserva aquí". Ajustes calls her "Atleta Demo". Pagos shows "UNLIMITED" in English on the first invoice she ever sees. The help center thumbnails congratulate "Bernardo".

## Questions to consider

1. What is the single daily anchor: streak today, readiness when Whoop lands, or "today's WOD + your class"? The home currently hedges with all three and commits to none.
2. Are 1RM PRs leaderboard scores or a separate ledger? The answer decides whether Emma's 120 kg belongs on the ranking and whether "#1 de 36" is true.
3. What does XP buy? If nothing, remove it; if something (rank tiers, box perks), it needs a single ledger and a visible balance.
4. Do Skills and Salud deserve top-level tabs before most members have an active progression or a connected wearable?
5. Is 1280 a real athlete context (coach demo, box TV, laptop at work)? If not, a centered 720 px column solves desktop in one line; if yes, the surface needs a real layout, not a stretched phone.
