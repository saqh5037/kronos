# Athlete audit — production, 2026-09-16

Walked the athlete surface on `kronos-fit.com` as a brand-new independent
athlete, on a 390×844 viewport, with a desktop spot-check at 1280×900. The app
was **used**, not just looked at: three WODs logged, including beating a previous
mark.

- **Account**: `squiroz@wbinnova.com` ("Audit QA"), created through
  `/atleta-signup` — the product's own front door, no DB surgery. Personal box
  (`me-*` slug), `role=ATHLETE`.
- **Build**: live at 2026-09-16 ~20:45 CDMX (deploy `70f87b3`).
- **Previous pass**: Engram `#734` (2026-05-27).

## Coverage

**21 of 24 athlete routes.** The three not reached are structurally unreachable
for a personal athlete, not skipped: `/atleta/eventos/[slug]` (no events exist),
`/atleta/logros/[code]` (zero badges exist — see F4), and
`/atleta/pagos/[id]/resultado` (no payments by design).

**Still not covered — the same gap as `#734`**: every box-member flow. Booking a
real class, check-in, the box's WOD, a populated leaderboard, membership dues.
These need an athlete inside a real box; `/atleta-signup` only ever creates a
personal box, and an owner account cannot reach `/atleta` at all (F14).

---

## P0 — the independent athlete's product does not work

### F1. The personal Home was built and never wired up

`src/components/atleta/PersonalHomeView.tsx` is **360 lines** of a Home designed
for exactly this athlete. Its CTAs are the right ones: `/atleta/wod/nuevo`,
`/atleta/programa`, `/atleta/wod/foto`, `/atleta/perfil`.

**Nothing imports it.** Verified across the whole tree, including dynamic
imports — the only occurrence of the name is its own `export default`. It was
added in `0ac7f34`, _"feat(atleta): frictionless signup + OTP + PWA + **Box
Personal standalone** + Foto-WOD OCR (#14)"_ — the commit that created the B2C
line — and has been dead since.

`src/app/atleta/page.tsx` instead renders the box layout unconditionally:
`TodaySection`, `BookingSection`, `WeekStripSection`, `LeaderboardSection`… with
no branch. So the independent athlete gets:

| Element on Home                                           | Reality                                 |
| --------------------------------------------------------- | --------------------------------------- |
| `RESERVAR` — the largest, brightest control on the screen | dead end: "Las reservas son por box"    |
| `Ver clases disponibles`                                  | same dead end                           |
| `0/5 ASISTENCIAS` + day strip                             | attendance to classes that cannot exist |
| `Sin WOD programado` in the biggest type                  | see F2                                  |

This is the whole audit in one line: **the B2C home experience exists, finished,
and is not connected.**

### F2. Logging a WOD moves nothing on Home

Logged "Fran, 4:32, Rx" and reloaded Home. It still reads **"Sin WOD
programado"** in the largest type on the screen — while the same screen lists
"Fran · 4:32 · 16 SEP" further down. The screen contradicts itself.

Streak stayed 0 ("Empieza hoy con tu primera clase"), week stayed 0/5, and the AI
card said _"la racha y progreso semanal están en cero. Es tu momento de
reiniciar."_ to an athlete who had just trained.

Root cause in `src/server/actions/athlete-home.ts`: streak and attendance come
from `Booking` rows with `status: ATTENDED` (`streakFromBookings`,
`db.booking.count`). A personal athlete never has a booking, so **every
progress number on Home is frozen at zero forever**, no matter how much they
train.

### F3. PRs are never created through the only path the athlete has

The signup promises, in public copy: **"Tus PRs, tus movimientos, tu progreso."**

Logged Back Squat 5RM at 120 kg, then again at 130 kg — a clear improvement.
Result on Home and Perfil: **`PRs: 0 TOTALES`**, with `SCORES: 3 REGISTRADOS`
and the history correctly showing 130 kg and 120 kg.

Two defects in `src/server/actions/atleta-quick-wod.ts`, the athlete's only
WOD-logging path:

1. **It never writes a `PR` row.** `pR.create` / `pR.upsert` appear only in
   `src/server/actions/scores.ts` (the coach/box path). Quick-WOD computes
   `isPR` (line 184) and returns it for a toast, then discards it. Home counts
   `db.pR.count(...)`, so the number can never move.
2. **It never links the score to a `Movement`.** No `movementId` anywhere in the
   file.

That second one cascades:

- `/atleta/movimientos` — "52 MOVIMIENTOS · **0 ENTRENADOS EN 90 DÍAS**", the
  `ENTRENADOS (0)` filter permanently empty.
- `/atleta/movimientos/[id]` for Back Squat — _"Aún no tienes marcas en este
  movimiento. **Regístralo en tu próximo WOD** y aquí verás tu PR…"_ It is
  telling the athlete to do the exact thing they just did twice.

### F4. The whole gamification layer is empty by construction

`/atleta/logros`: **"0 / 0 LOGROS"**, "NIVEL 1 · 0 XP · 300 XP PARA EL NIVEL 2",
and _"Aún no hay logros disponibles… sigue registrando tus WODs y PRs"_ — as if
registering would unlock something.

`atleta-signup.ts:164` seeds `movement` rows and **nothing else**. A personal box
is created with zero badges, so XP, levels and achievements can never move. The
UI presents a progression system that has no content behind it.

### F5. Skills sends a coachless athlete to ask their coach

`/atleta/skills` advertises **"10 SKILLS DISPONIBLES"**; only **4** are (counted
live: 4 `DISPONIBLE` badges and 4 clickable links vs 6 `PIDE NIVEL …` locks).

Open either available skill and it says:

> "Este skill aún no tiene progresiones configuradas. **Pídele al coach del box
> que las añada** al movimiento double-under."

Checked `double-under` and `pistol-squat` — identical. So one of five primary
tabs offers ten things, delivers four, and those four instruct the athlete to
contact a person who does not exist in their account.

### F6. The onboarding's plan ceremony produces nothing

After nine steps the app plays "Creando tu plan — IA está adaptando el programa a
tu perfil". `/atleta/plan` then says:

> "Aún no tienes objetivos activos. Crea uno en tu perfil para que la IA genere
> tu plan."

Two different things share the word _objetivo_: onboarding step 4 stores a
profile preference, while `/atleta/plan` requires a `Goal` record via
`listMyGoals()` (`plan/page.tsx:6`). The athlete answers "your objective", then
is told to create an objective.

### F7. `/atleta/programa` is the cure for F2 and is effectively orphaned

The screen says: _"Carga tu semana de entrenamientos. **Cada día verás el WOD que
toca en tu Inicio**."_ That is precisely what would fix "Sin WOD programado".

Its only inbound link in the entire codebase is from `PersonalHomeView.tsx` —
the dead component of F1. Not in the tab bar, not in the drawer, not on Home.

Minor, same screen: day rows render raw ISO dates — `LUNES · 2026-09-14` —
instead of going through `src/lib/format.ts`.

### F8. "Gratis para siempre" rests on a null column

`/atleta-signup` promises it in public copy. The code honors it by accident:

| Step                       | What happens                                       |
| -------------------------- | -------------------------------------------------- |
| `atleta-signup.ts:135-141` | personal box created `TRIAL`, **no** `trialEndsAt` |
| `lifecycle.ts:72-74`       | `if (!trialEndsAt)` → unchanged                    |

But the sweeping cron (`api/cron/saas-billing-lifecycle/route.ts:155-156`) selects
`{ subscriptionStatus: "TRIAL" }` with **no exclusion for personal boxes**, and
`notifySubscriptionExpired` sends to `owner.email` — in a personal box, the
athlete's own address. One backfill of `trialEndsAt` and every independent
athlete gets "tu suscripción expiró".

Nothing pins it: `tests/unit/personal-box.test.ts` only checks the slug format.
The rule _athletes are free, the box pays_ exists nowhere in code.

**Suggested fix**: a house-style guard asserting (a) `atleta-signup` never writes
`trialEndsAt`, and (b) the lifecycle cron excludes personal-slug boxes.

---

## P1 — friction

### F9. Twelve questions before the product

Signup asks 3, then onboarding opens at "Paso 1 de 9". Motivation is asked three
times: signup's "¿Por qué entrenas?", step 1's "¿Por qué empiezas ahora?", and
step 4's "¿Cuál es tu objetivo?" — whose options map 1:1 to the signup answer.
Step 4 arrives with `Siguiente` **disabled**, proving nothing was carried over.

Step 5 shows how it should work: recommends 4 days, pre-fills it, explains why.
One screen out of nine.

### F10. Weight, age and height are ±1 steppers with no keyboard entry

Measured: one tap = one unit, value is a display node, not an input. A
41-year-old, 95 kg, 185 cm athlete needs **56 taps** on one screen.

### F11. The weekly goal ignores the athlete's answer

`athlete-home.ts` hardcodes `weekGoal: 5` ("// capacity goal (default 5)"), and
`ai.ts` repeats it. The athlete's `weeklyFrequency` **is** persisted and **does**
drive the AI plan (`lib/ai/training-plan.ts`). I chose 4; Home shows `0/5`.

### F12. Smaller cuts

- Creating an account doesn't log you in — you land on `/login`, where **"Enviar
  código" is the primary button** even though you set a password 30 seconds
  earlier and `hasPassword` is known.
- `/atleta/wod/nuevo`: choosing type **Fuerza** leaves the result field asking
  for **"Tu tiempo (MM:SS)"**. The natural pairing with _Peso_ isn't inferred.
- `/atleta/historial` lists 130 kg above 120 kg for the same WOD and never marks
  the improvement.
- Whoop: `/atleta/ajustes` promises "traer tus datos de **sueño y recuperación**
  a Kronos". Per the code's own comments (`DevicesCard.tsx`, `SaludContent.tsx`)
  that surface "is a later phase". The athlete grants health-data OAuth for
  nothing.
- Drawer labels `Historial · Tus clases`; the screen is "Mis scores".
- Perfil shows the streak twice (hero + grid) and offers "Ranking · Top del box"
  to a boxless athlete; the hero says "Vas por buen camino" at streak 0.
- `/atleta/ayuda` includes a tutorial "Cómo reservar una clase".
- Onboarding step 8 offers _Gym grande / Gym pequeño / Casa_ — no "box", in a
  product about boxes. Step 9's sample notification promises "Reserva
  confirmada".

---

## P2 — polish

- **4 console errors, still open from May (`#734` #4)**: YouTube thumbnails 404
  on `/atleta/movimientos`. IDs `P099n4qjKy0`, `IHGhp3pW6FE`, `MzmJmRGFVDo`,
  `JrHciIJQMBQ` → `prisma/data/movements.ts` lines 207, 216, 234, 252, 333 —
  Kipping Pull-up, Chest-to-Bar, Muscle-up (Bar), Handstand Push-up, Bar
  Muscle-up. `P099n4qjKy0` is used twice, on two movements that look like
  duplicates of each other. Everywhere else: zero console errors.
- Five `.woff2` files preloaded and unused on **every** page load (measured 145
  warnings over 29 navigations).
- No desktop treatment at 1280: no `max-width`, a ~1200 px-wide `RESERVAR`
  button, mobile tab bar spanning the viewport.
- The PWA install banner sits above the fold on every screen.
- OTP copy leaks implementation: _"Lo puedes usar en Chrome y Safari los primeros
  5 minutos."_
- `/atleta/leaderboard` has no `<h1>`. Page titles are inconsistent: `"Logros ·
Kronos"` vs `"Kronos — Salud"`.

---

## Closed since the May pass (`#734`)

| May finding                                        | Status                                                                       |
| -------------------------------------------------- | ---------------------------------------------------------------------------- |
| #7 "ELIGE UN OBJETIVO" was a non-interactive div   | **Fixed** — real `<a>`, `cursor: pointer`                                    |
| #3 voseo "evolucionás" in Salud                    | **Fixed** — "evolucionas"                                                    |
| #2 dead "Tema claro" toggle in Ajustes             | **Fixed** — gone                                                             |
| #9 "Mis pagos" bounced personal athletes to inicio | **Fixed** — honest empty state that states the free-athlete rule outright    |
| #1 `/atleta/ayuda` orphaned                        | **Partial** — one link, from `/atleta/ajustes`, itself not in drawer or tabs |
| #4 four YouTube thumbnails 404                     | **Still open** — same four, see P2                                           |

The empty states on `/atleta/reservar`, `/atleta/wod`, `/atleta/salud`,
`/atleta/pagos`, `/atleta/leaderboard` and `/atleta/eventos` are genuinely good:
they explain _why_ and offer a real way out. `/atleta/historial` and
`/atleta/eventos` (QR + event code) work well. That work holds up.

## Checked and discarded

Recorded so nobody re-reports them:

- **Drawer links without accessible names** — false. The a11y snapshot renders
  icon+text links without a name, but the DOM has `textContent`, no `aria-label`,
  no `aria-hidden`.
- **Content hidden behind the fixed tab bar** — false. Measured at the bottom of
  `/atleta/skills`; the only overlap was a link inside the closed drawer.

## The shape of it

Five of the eight P0s are the same sentence: **the independent athlete is a
first-class product line with a finished Home that was never plugged in, and a
logging path that writes scores but no PRs and no movement links.** Fix
`PersonalHomeView`'s wiring and quick-WOD's two omissions and most of this
report collapses.

## Cleanup

Test account to remove: user `squiroz@wbinnova.com`, its personal box, three
scores and three WODs. Nothing else in production was touched — no DB writes, no
billing action, no change to Samuel's own box or its subscription.
