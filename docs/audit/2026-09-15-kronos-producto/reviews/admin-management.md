# Kronos · Admin management surface — design review

Reviewed 2026-09-15 from seeded dev captures (box "Iron Hands CrossFit · Polanco"), 1280 primary / 360 secondary. Mode: Operate. Scope: `/admin/pagos`, `/admin/comunicaciones`, `/admin/reportes`, `/admin/eventos`, `/admin/auditoria`, `/admin/billing*`, `/admin/onboarding`, `/admin/ajustes*` (7), `/admin/super/*` (3).

## Surface verdict

The visual system is strong and disciplined (lime, Plex Mono numbers, dark cards), but the management surface does not yet earn an owner's trust with money: the Pagos KPI says 27 payments while its own table says 33, Reportes and Pagos disagree on 30-day revenue ($214,000 vs $138,750), and the SaaS checkout prints an environment-variable name to the box owner. At 360 the three money tables silently clip their most important columns (monto, estado, adeudo) with no scroll affordance, so phone-based cash reconciliation is not possible. Settings are seven pages with three chromes and two content widths; only three show the tab bar that makes them one area, and the capacity setting lives twice. Copy is the weakest layer: raw English enums (PAID, IN_APP, UNLIMITED, ACTIVE), voseo ("recibís"), dev notes in product ("proveedor mockeado en Fase 1", "MERCADOPAGO_ACCESS_TOKEN"), emoji as icons in Auditoría and Permisos. Ship-blockers are few and mechanical; the harder work is making numbers agree and making each screen answer one owner question in the first viewport.

## Per-screen findings

### /admin/pagos

Verdict: dense and handsome at 1280, but the three owner questions (who owes, what came in, what failed) get three inconsistent answers, and the phone version hides the money columns.

- [P0] [responsive] At 360 the Pagos table shows only Fecha/Atleta/Plan/"Mét…"; Método, Estado and Monto are clipped inside the card with no scroll hint. Memberships hides Clases/Pagado; Morosos hides Adeudo. Document hOverflow is false, so this is an inner overflow container signalling nothing.
- [P0] [trust] KPI "Pagos rango 27" vs section header "33 pagos en el rango" under the same "Últimos 30 días" filter.
- [P1] [hierarchy] "Por cobrar $56,000" (orange) beside "Morosos 4 · $1,000 adeudados" with no explanation of the 56× gap; neither links to its rows. No "Fallidos" KPI although two FAILED rows exist.
- [P1] [dataviz] "Ingresos diarios" y-axis starts at "$-10,000" and the last bars extend below the baseline; revenue cannot be negative. Axis labels overlap the plot; bars and line double-encode one series with no legend.
- [P1] [dataviz] "Distribución de planes" donut has no legend, labels or values, and all segments are the same lime: decoration.
- [P1] [copy] English enums in Spanish UI: PAID/FAILED/PENDING, UNLIMITED/MONTHLY/ANNUAL/DROPIN, "MEMBERSHIPS", "+ ASIGNAR MEMBERSHIP", eyebrow "OPERACIÓN · REVENUE". Method chip "STRIPE" in a Mercado Pago product; "$" and "◆" glyphs used as icons.
- [P1] [hierarchy] "+ Registrar cobro en efectivo" is a grey ghost button at ~2,500 px of a 4,368 px page (6,700 px at 360). The most frequent owner action is the least visible control.
- [P1] [bug] Morosos lists "Joaquín Ortiz · Drop-in" twice (12-ago, 01-sep), both $250; rows have no action (recordar, cobrar, ver atleta).
- [P2] [consistency] Money formatted three ways on one page: "$138,750", "$250 MXN", "$24,000". "Pagado $5,000" for a $2,500 Mensual plan is unexplained.
- [P2] [color] A red glyph precedes "MOROSOS (4)" and reads as an emoji; the -51.4% / -20.6% delta pills are trends, not warnings, yet render orange.
- [P2] [forms] Filter row wraps so "Plan · Todos" sits alone on line two at 1280; "Últimos 30 días" looks like a button, not a range picker. Plan cards say "1 clases/mes", "1 días", "0 memberships activas".

### /admin/comunicaciones

Verdict: a readable list, but the composer is invisible and the page announces it is mocked.

- [P1] [trust] Subtitle "(proveedor mockeado en Fase 1)" is an internal status note shown to the owner.
- [P1] [copy] Chips are raw enums: IN_APP, ALL, ACTIVE, DRAFT, SCHEDULED, SENT. Only in-app ever appears although the subtitle promises email/push.
- [P1] [states] "Enviar ahora" on a DRAFT and on a SCHEDULED item is a plain text link; "Borrar" is 13 px grey text. No visible guard on either.
- [P2] [IA] No composer on the page; channels, scheduling and audience can only be inferred from chips. "Enviado a 49" shows no opens/reads.
- [P2] [responsive] At 360 the three chips stack one per line, tripling card height.

### /admin/reportes

Verdict: a good-looking dashboard that is mostly decoration and contradicts Pagos.

- [P1] [trust] "Ingresos del mes $214,000" vs Pagos "$138,750", both under "Últimos 30 días"; header says "Septiembre De 2026" while the filter says 30 days.
- [P1] [dataviz] "Readiness del box hoy 100%" in 40 px lime with "1/42 respondieron" in 12 px grey; the chip "Engagement bajo" contradicts the headline number.
- [P1] [trust] "En riesgo de churn · 0 atletas · todo bajo control" while Pagos shows 4 morosos and this page shows "5 pausados".
- [P2] [dataviz] Revenue y-axis again starts negative ("$-100.0k"); "$400.0k" format differs from "$40,000" on Pagos. Plan bars are proportional to count, so ANNUAL ($240,000) gets the shortest bar. "Bajas" series is orange (categorical, not a warning).
- [P2] [copy] "REVENUE · ÚLTIMOS 12 MESES", "SCORES SUBIDOS", "BOOKINGS DEL MES", UNLIMITED/MONTHLY/ANNUAL; "Septiembre De 2026" title-cases the preposition.
- [P2] [IA] Nothing is actionable: no export, no drill-down, no comparison period beyond a delta pill.

### /admin/eventos

Verdict: a single card in a different chrome, with copy that has aged past the event.

- [P2] [states] "Dominus Murph 2026 · 23 may 2026" (four months ago) still says "…no se ha inscrito a este evento todavía." Past events need a closed state.
- [P2] [consistency] Eyebrow without the dash rule, plain H1, column starts at 274 px not 260; date "23 may 2026" vs "15-sep" elsewhere; "↗" unicode as icon; "cross-box", "partners (Dominus, etc.)".

### /admin/auditoria

Verdict: an audit log that cannot be audited: opaque IDs, emoji, wrong dates, wrong numbers.

- [P1] [copy] Every entry is a raw entity: "Payment #3-active", "User #163d4tti", "Score #0vcblq", "Booking #rwjewvn0". No athlete, method, WOD or value. "Feed" in the title.
- [P1] [bug] With "Hoy" selected the feed shows DOM 27 through MIÉ 16 SEP before "HOY" (15-sep). Three different actors all show "User #163d4tti"; "Payment #8-active" appears with $24,000 and $1,500 on different days.
- [P1] [color] Emoji as icons (money bag, pushpin, weightlifter, check). Avatars are blue ("IO") and teal ("AD", "LR"), both legacy colours.
- [P1] [consistency] Amounts render "$24000.00" / "$1500.00" vs "$24,000" everywhere else.
- [P1] [bug] After the "HOY" group the cards fade out and a ~1,000 px void follows before "LUN 14 DE SEP" (both breakpoints): a broken lazy-load sentinel.
- [P2] [hierarchy] "SENSIBLE" orange chip on all 11 payments dilutes the flag; no search, export or pagination for 69 events; column starts at 402 px.

### /admin/billing

Verdict: a billing page with no billing information.

- [P1] [trust] The only datum is "ESTADO ACTUAL · ACTIVE" (English enum). No plan, price, renewal date, payment method, invoices, or links to checkout/historial. Subtitle admits "cuando esté configurado el cobro".
- [P2] [consistency] 402 px column; nothing links the three billing routes.

### /admin/billing/checkout

Verdict: the SaaS trust moment, and it leaks dev configuration.

- [P0] [trust] Footer: "Para activar cobros reales con MercadoPago, configura la variable de entorno MERCADOPAGO_ACCESS_TOKEN."
- [P1] [color] "plan" in the H1 and "Modo demo activo:" are orange: decorative warning colour on the page that should be calmest.
- [P1] [trust] "Founding Box Dominus $3,500 MXN/mes" costs 3.5× Premium ($999) yet caps at 200 athletes where Premium is unlimited. Every CTA reads "ELEGIR PLAN (DEMO)"; nothing states what happens next, trial days left, cycle, IVA or cancellation.
- [P2] [responsive] Four cards in a 3-column grid orphan the Dominus card at 1280; its price wraps "$3,500 MXN /" + "mes". "Hasta 1 coaches"; "·" bullets for limits vs "✓" for features; Free CTA "Incluido en trial" disabled without reason.

### /admin/billing/historial

Verdict: fine empty state; wrong dialect, pointless filters.

- [P2] [copy] "aparecerá acá" is rioplatense; es-MX is "aquí". Date inputs show the browser's "dd/mm/yyyy".
- [P2] [forms] Desde/Hasta/Plan filters over an empty dataset; "PLAN" label sits lower than its siblings and the select is taller. Smiley icon is off-tone for billing.

### /admin/onboarding

Verdict: the best-toned page in the set; consistent tú form, clear stepper.

- [P2] [consistency] Third distinct content width (370 px); "← Atrás" underlined link vs pill buttons elsewhere.
- [P3] [responsive] At 360 the stepper drops all six labels.

### /admin/ajustes

Verdict: a real settings home with tabs; the tabs then vanish on four of seven sub-pages.

- [P1] [IA] Tab bar appears on Box, Notificaciones and Seguridad only. Horarios, Alertas, Apodos and Permisos drop it and use four different eyebrows (CONFIGURACIÓN, NOTIFICACIONES, AJUSTES, SEGURIDAD).
- [P1] [IA] "Capacidad default por clase: 10" here and "Capacity por defecto: 10" on Horarios are one setting in two places.
- [P2] [forms] Idioma "es-MX" and Zona horaria "America/Mexico_City" are raw codes; Slug is a freely editable public URL with no warning; no required markers or inline validation visible. "Subir logo" is findable, which is good.
- [P2] [color] Default brand colour is #19F08B, the retired teal.
- [P2] [responsive] At 360 the tab bar clips at "Aler…" with no scroll affordance.

### /admin/ajustes/alertas

Verdict: clear rules, unclear relationship to Notificaciones.

- [P1] [IA] "Alertas" (box events → email) and "Notificaciones" (Kronos → owner email) are both "emails I receive", split across two tabs; the Alertas page even uses a "NOTIFICACIONES" eyebrow.
- [P2] [a11y] Delete is a ~12 px grey trash glyph beside the toggle, below 44 px and unguarded. Blue "IO" avatar again.

### /admin/ajustes/apodos

Verdict: honest empty state, wrong chrome, internal vocabulary.

- [P2] [copy] "No se comparten entre tenants", "pizarra OCR", "matches de nombres".
- [P2] [color] Peach tag illustration is outside the palette; no tab bar; eyebrow "AJUSTES".

### /admin/ajustes/horarios

Verdict: powerful grid, poor ergonomics, colour rule broken.

- [P1] [a11y] 24 hour toggles × 6 days at ~34 px: 181 sub-44 px targets at 360.
- [P1] [bug] The fixed "GUARDAR CAMBIOS" pill covers Miércoles 17/18/19 at 1280 and the "Lunes" header plus WOD/OPEN BOX switch at 360.
- [P1] [color] Saturday "OPEN BOX" hours render orange, a category colour.
- [P2] [copy] "Capacity por defecto", "Default 24h", "se renderiza"; no tab bar.

### /admin/ajustes/notificaciones

Verdict: two well-explained toggles, wrong dialect.

- [P1] [copy] "Controla qué emails recibís de Kronos", "Cada lunes a las 9am recibís un email con revenue del mes": voseo twice plus "revenue".
- [P3] [states] "GUARDAR" in muddy olive reads as broken rather than disabled.

### /admin/ajustes/permisos

Verdict: the matrix is the right idea; execution hides half of it on a phone and uses emoji per row.

- [P1] [color] Nine emoji row icons plus a shield emoji in the "Aprobación" header; orange checkboxes for "Aprobación".
- [P1] [responsive] At 360 the table clips after STAFF; Aprobación, Umbral and Owner are unreachable without an unsignalled scroll.
- [P1] [forms] No save button or autosave indicator; no legend for "Aprobación"; "Umbral (MXN)" inputs on rows where a threshold is meaningless (Eliminar atleta, Editar scores); "OWNER" repeated nine times. No tab bar; eyebrow "SEGURIDAD" while Seguridad is another tab.

### /admin/ajustes/seguridad

Verdict: fine form, thin page for its name.

- [P2] [trust] Only a set-password form: no current-password check, 2FA, sessions list or "cerrar otras sesiones". No show/hide toggle; olive disabled CTA.

### /admin/super/platform

Verdict: indistinguishable from box admin.

- [P1] [IA] Same sidebar, same "TU BOX · OWNER" switcher; the only marker is a lime eyebrow "SUPER-ADMIN". A team member cannot tell they left tenant scope.
- [P2] [consistency] "ACTIVE" enum; "15 sep 2026" is a third date format; Demo Box B card lacks the OWNER field; "Datos actualizados al recargar"; no actions on box cards.

### /admin/super/pilotos

Verdict: clean empty state, mixed language.

- [P2] [copy] "via wizard", "wizard de onboarding manual"; two identical CTAs 200 px apart.

### /admin/super/pilotos/nuevo

Verdict: a sensible four-section form for an internal user; the copy is a Jira ticket.

- [P2] [copy] "feature flags", "auto-on si disciplina=hyrox", "(F2)", "después del submit", "CrossFit (crossfit)".
- [P2] [forms] No required markers; placeholders ("María Pérez") read as values; no summary or confirmation before creating a tenant and sending a magic link; the sole CTA is sentence-case while every other CTA is uppercase. At 360 "Exclusividad geográfica (días)" wraps three lines and misaligns its input.

### Cross-cutting chrome

- [P1] [IA] In every 1280×800 capture the sidebar list ends at "Comunicaciones" under the pinned "EN BOX" footer; none of the routes reviewed here (Reportes, Auditoría, Ajustes, Suscripción, Super) shows a visible nav entry and there is no scroll affordance.
- [P2] [consistency] Four content-column origins (260, 274, 370, 402 px) and three heading treatments across 19 routes.

## Heuristic scores

| Nielsen heuristic                   | 0–4                | Evidence                                                                           |
| ----------------------------------- | ------------------ | ---------------------------------------------------------------------------------- |
| Visibility of system status         | 2                  | Toggles and KPIs clear; save states muddy; Permisos gives no feedback              |
| Match between system and real world | 1                  | Raw enums, opaque IDs, env var, voseo, "tenants"                                   |
| User control and freedom            | 2                  | Back links on billing/onboarding; one-click "Enviar ahora"; editable slug; no undo |
| Consistency and standards           | 1                  | 4 widths, tabs on 3/7 settings pages, 3 date and 3 money formats                   |
| Error prevention                    | 1                  | Unguarded Borrar/trash/Enviar ahora; no confirm on pilot creation; negative axes   |
| Recognition rather than recall      | 2                  | Settings tabs help when present; audit IDs force recall; donut without legend      |
| Flexibility and efficiency          | 2                  | Filters and CSV export; cash register buried; no bulk actions                      |
| Aesthetic and minimalist design     | 3                  | Strong system; decorative donut/readiness bar and emoji add noise                  |
| Error recognition and recovery      | 1                  | FAILED rows have no next step; no inline validation observed                       |
| Help and documentation              | 2                  | Helper text under fields; internal notes where help should be                      |
| **Total**                           | **17/40 → 4.3/10** |                                                                                    |

## Top 8 issues

1. **Money tables clip their money at 360 (P0).** Why: the Sunday-night persona cannot see Monto/Estado/Adeudo, so the core mobile job fails. Fix: below 768 render Pagos, Memberships and Morosos as stacked row-cards (name + plan, date + method chip, amount right-aligned in Plex Mono); where a table must scroll, add an edge fade and a "desliza" hint.
2. **Numbers disagree across and within screens (P0).** Why: 27 vs 33 payments, $138,750 vs $214,000, "0 en riesgo" vs 4 morosos; one visible mismatch discredits every KPI. Fix: one server-side period summary feeding KPIs, section counts and Reportes; label the period on every KPI ("1–15 sep"); a test asserting KPI count equals table count.
3. **Checkout leaks configuration and misuses colour (P0).** Why: the plan page is where the owner decides to pay; an env var name, "(DEMO)" on every CTA and an orange headline read as unfinished. Fix: gate the dev footer and "(DEMO)" behind a dev-only banner style; H1 in white/lime; add trial days remaining, next charge date, IVA note and a "qué pasa después" line.
4. **Audit log is unreadable (P1).** Why: "Payment #8-active · $24000.00" with a money-bag emoji tells the owner nothing; future dates under "Hoy" look like a bug. Fix: humanised lines ("Cobro en efectivo · Mía Moreno · Mensual Ilimitado · $2,500"), line icons, `Intl.NumberFormat('es-MX')`, fixed grouping and sentinel, search and export.
5. **Settings are seven pages with three chromes (P1).** Why: the tab bar is what says "this is one area", and it vanishes on four pages; capacity lives twice. Fix: a shared settings shell (eyebrow, italic H1, tab bar, 260 px column) for all seven; merge Alertas into Notificaciones as two sections; single capacity source.
6. **Emoji and off-palette colour (P1).** Why: house rules 1 and 2 break on Auditoría, Permisos, Apodos, Horarios and every avatar. Fix: existing line-icon set; avatars in `--k-elevated` with lime initials; Open Box hours as outlined lime pills; "Bajas" in `--k-t3`; "Aprobación" checkboxes lime with a legend.
7. **Copy: enums, voseo, dev notes (P1).** Why: PAID/IN_APP/UNLIMITED/ACTIVE, "recibís", "acá", "mockeado", "tenants", "submit" break the es-MX voice. Fix: a `labels.ts` map for every enum surfaced in UI; a lint rule failing on `recibís|tenés|querés|acá` under `src/app/**`; strip dev notes from owner routes.
8. **Horarios ergonomics (P1).** Why: 181 sub-44 px targets and a floating Save that covers what it saves. Fix: 44 px hour pills in a 6-column grid at 360, a sticky bottom bar with safe-area padding, and "copiar a todos los días".

## What works

- The Pagos KPI row plus Morosos table is the right first viewport for "who owes me": name, plan, days overdue and amount scan in one glance at 1280.
- Horarios' weekly grid shows a whole schedule without a modal; lime pills for open hours are instantly legible and "Domingo · cerrado" collapses correctly.
- Onboarding step 6 has the best tone in the product: tú form, short, one CTA, honest "Puedes afinar todo desde Ajustes".
- Comunicaciones separates "Borradores y programados" from "Historial" and shows author, time and "Enviado a N" per card; the model is right even if the chips are not.
- Empty states (Apodos, Historial de cobros, Pilotos) say when content will appear instead of leaving a blank card.

## Persona red flags

**Owner reconciling cash on Sunday night, on a phone.** She opens Pagos at 360: filters take the first 500 px, the chart the next 600, and the payments list then clips Método, Estado and Monto with no hint to swipe. "Registrar cobro en efectivo" is a grey ghost 2,500 px down. The KPI says 27 payments, the list says 33; two rows are FAILED with no next step; Joaquín Ortiz is a moroso twice. She finishes the night in a spreadsheet.

**Kronos team member provisioning a pilot box.** He lands on /admin/super/pilotos/nuevo inside a sidebar labelled "TU BOX · OWNER" and cannot tell whether he acts as the platform or as Iron Hands. Nothing is marked required, placeholders look like values, and "Crear Box piloto" creates a tenant and emails a magic link with no summary. Afterwards Pilotos says "Aún no hay Boxes piloto" while Plataforma shows two boxes, and box cards offer no action.

## Questions to consider

1. Which number is the owner's source of truth for "ingresos", the Pagos range total or the Reportes month total, and should the other exist?
2. Should Alertas and Notificaciones become one "Avisos" page, and which one owns the weekly summary?
3. Is "Por cobrar" or "Morosos" the number that drives Sunday-night action, and can the other move below the fold?
4. Does super-admin need its own shell (sidebar, colour band, "Plataforma" switcher) before the first external pilot?
5. What is the audit log for — compliance export, dispute resolution or coach oversight? Each implies a different event grain and first filter.
