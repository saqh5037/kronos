# Kronos — Public + Auth surface review

Reviewed 2026-09-15 from full-page captures at 360 / 768 / 1280 (seeded dev server, box "Iron Hands CrossFit · Polanco"). Source checks were used only to classify what the captures showed.

## Surface verdict

This surface has to do two things: route a free athlete into a 10-second signup, and convince a skeptical Mexican box owner that Kronos is worth $2,500–$5,000 MXN/month. The visual system is genuinely authored (Plex Mono display, lime on near-black, numbered eyebrows) and the lead form is MX-native, so the craft is there. It fails on the two things that matter most: the home page renders **empty at 360 and 768** (the primary athlete viewport), and `/box` sells Stripe, OXXO, SPEI, CFDI 4.0, nómina, App Store apps, a public API and SSO that do not exist, while quoting a 14-day trial in the hero and a 30-day trial in pricing. The single biggest opportunity is a truth pass on `/box` plus an SSR-visible landing: fix those two and the rest of this list is polish.

## Per-screen findings

### `/`

Verdict: correct at 1280, blank at 360 and 768.

- [P0] [bug] At 360 and 768 the page shows only the header and the "© 2026 KRONOS · TÉRMINOS · PRIVACIDAD" footer; the hero and both funnel cards never paint. The manifest logs `pageError: "Invalid or unexpected token"` on exactly those two viewports. Root cause is structural: `RouterSplit.tsx` renders every element with framer `initial="hidden"` (`opacity: 0`), so any JS failure leaves the landing invisible. Fix: render visible by default (`initial={false}` or CSS-only entrance under `@media (prefers-reduced-motion: no-preference)`), then reproduce the syntax error on `pnpm build`.
- [P1] [IA] The athlete card links to `/atleta-signup`, not `/atletas`; the box card links to `/box`. Athletes get zero persuasion, owners get 9,000 px. `/atletas` has no entry point except a footer link on `/box`.
- [P2] [truth] OG/Twitter description promises "App nativa"; the product is a PWA. Athlete CTA is Plex Mono sentence case, box CTA is Inter uppercase: two button grammars on one screen.

### `/atletas`

Verdict: strong hero, then 7,000 px of dark nothing in the capture.

- [P1] [states] "Lo que entrenas con Kronos", both "RESEÑAS · EJEMPLO ILUSTRATIVO" blocks and the "Honestidad antes que venta" comparison show only their headings at 360 and 1280. `BenefitSection`, `AtletaSiNo`, `DualQuotes` and `TestimonialHero` use `initial="hidden"` + `whileInView="show"` with no timeout fallback (`RevealOnScroll.tsx` has one). No scroll, no content.
- [P1] [truth] Reviews are labeled "EJEMPLO ILUSTRATIVO" twice. Fabricated testimonials, even disclosed, cost more trust than an empty section. Replace with pilot quotes or remove.
- [P1] [responsive] Closing card at 360 clips text at the right edge: "SIN TARJETA · SIN LETRA CHICA" and "Sin permiso de t… todo se cab… tu progres…" are cut mid-word (overflow hidden on the card, so `hOverflow` stayed false).
- [P1] [hierarchy] At 360 the 700 px phone mock precedes the headline; "Tu progreso es el producto." starts at y≈900 on a 780 px screen. Put headline + CTA first on mobile.
- [P1] [copy] The product screenshot in the hero reads "Empezá hoy con tu primera clase" (Argentine imperative) and "KRONOS AI" (English) inside a Spanish UI.
- [P2] [copy] "sin gamificación cringe", nav "Skills", card "QUE MI BOX LA PIDA" (unclear what the box would request).
- [P2] [a11y] `imgNoAlt: 2`; the "Instalar Kronos" banner in the mock is overlapped by the phone notch; closing headline is Inter Light where every other display heading is Plex Mono.

### `/atletas/manual`

Verdict: honest structure, unfinished content, brutal on mobile.

- [P1] [states] 7 of 9 phone frames say "CAPTURA · PRÓXIMAMENTE — Esta sección se ilustrará con captura real en la próxima iteración"; Perfil and Logros render as pure black rectangles with no placeholder text at all. At 360 that is roughly 3,600 px of empty phone frames to thumb through.
- [P1] [copy] Same "Empezá hoy" voseo inside the /02 screenshot.
- [P2] [IA] Chips "BOX PERSONAL / AMBOS / ATLETA DE BOX" have no legend; the index is not sticky and there is no return link after section 9.
- [P2] [copy] "Linkeable por sección", "OCR Gemini lo lee" (vendor name in athlete copy), "sparkline", "skill tree". `imgNoAlt: 1`.

### `/box`

Verdict: the best-designed page and the least truthful one.

- [P0] [truth] Hero strip "STRIPE + MERCADO PAGO + OXXO"; owner section "Stripe para tarjeta, Mercado Pago para tarjeta y OXXO, SPEI para transferencias"; Hierro "+ Stripe + Mercado Pago"; Acero "Programación de bloques (12 semanas)", "nómina automática", "Apps móviles cobranded", "Facturación electrónica MX (CFDI 4.0)", "OXXO + SPEI nativos"; Titanio "Apps con tu nombre en App Store y Play Store", "API pública + webhooks", "SSO", "SLA 99.9% · soporte 24/7"; white-label card "Apple Developer Account a tu nombre". Payments are Mercado Pago + cash; nothing else here is shipped. Terms §3 says prices "están publicados en la landing page", so these bullets are contractual.
- [P1] [conversion] Trial length: hero "TENGO UN BOX · TRIAL 14 DÍAS →" vs pricing "PROBAR ACERO 30 DÍAS →" vs closing "30 DÍAS · SIN TARJETA · SIN CLÁUSULAS" vs `/signup` "14 días gratis". Five CTA labels for two actions: "RESERVAR LUGAR", "TENGO UN BOX · TRIAL 14 DÍAS", "RESERVAR DEMO", "HABLAR CON VENTAS", "RESERVAR MI LUGAR". Hierro promises "Onboarding self-service" while the closing section says "Te llamamos en menos de 24 horas hábiles… para armar el setup".
- [P1] [hierarchy] The "cifras frías" admin mock shows "MRR $0K ↑12% MOM · ATLETAS 0 ↑28 NETO · CHURN 0.0%". Zero revenue with a 12% growth arrow is the opposite of proof.
- [P1] [truth] Palette proof cards cite "CALIFA CROSSFIT · CO", "ALPHA BOX · PE", "HÚSARES · MX" as if they were customers; the pilot is Mexican and private. "Si tu Box opera en MX, CO o PE… hay 20 cupos durante 2026" contradicts "Diseñada para CrossFit en México" three lines above and self-serve signup below.
- [P1] [responsive] Same closing-card clipping as `/atletas` at 360: "SIN CLÁUSU…", "Si no funciona para tu Box[,] te exportamos… e[n] CSV". Phone video precedes the headline at 360 and 768; the value proposition sits below the fold.
- [P1] [bug] `loadMs` ≈ 17 s at every viewport (video hero). Every other route loads in 2–5 s.
- [P2] [states] Footer "Documentación PRÓX.", "Estado del sistema PRÓX.", "Changelog PRÓX." — three placeholders in the primary navigation.
- [P2] [copy] Owner-hostile jargon: "owner", "tier", "slug", "MRR, churn, CAC, LTV", "multi-tenant cross-Box", "setup fee", "Pricing" next to "Pagos", "Push notifications + announcements". "Precios en MXN, sin IVA" is ambiguous. Every pricing bullet shows a lime "+" glyph and then a literal "+ ": "+ + App atleta GRATIS…". The form signs off "SIN PROMESAS VACÍAS." under a page that makes a dozen.
- [P2] [consistency] Footer "HECHO EN LATAM, PARA BOXES EN LATAM" vs `/atletas` footer "HECHO EN MÉXICO"; closing headline in Inter, not Plex Mono. `imgNoAlt: 4`, `smallTargets` 25 at 360 (plan radios, consent checkbox, footer links).

### `/login`

Verdict: clean, but built for owners only.

- [P1] [IA] `/atleta` redirects here and the only signup link is "¿Aún no tienes box? Empieza tu trial de 14 días". An athlete has no path. Placeholder "correo@tubox.com" reinforces it.
- [P2] [consistency] Wordmark here is "KRONOS" + tagline "EL TIEMPO ES TU RIVAL"; `/login/otp` shows "Kronos" in Plex Mono with no tagline; the tagline appears nowhere on the landing pages.
- [P3] [a11y] "Usar contraseña" is under 44 px at 360; confirm the "SOLO DESARROLLO" block never ships.

### `/login/otp`

Verdict: acceptable error state, terse tone.

- [P2] [copy] Heading "Falta info" reads like a log line; the body ("Este link no trae código. Ve al login para pedir uno nuevo.") has the right voice. Orange "?" badge for a missing parameter is neither warning nor error; use neutral.

### `/signup`

Verdict: efficient form, wrong vocabulary, no plan.

- [P1] [conversion] "Empieza tu trial · 14 días gratis" with no plan choice; `/box` just told the owner to "PROBAR ACERO 30 DÍAS". Which tier and how many days does this create?
- [P2] [copy] "trial" in the heading, "PRUEBA DE 14 DÍAS" in the button, "EMAIL DEL OWNER", "SLUG (URL ÚNICA)"; placeholders "Iron Hands CrossFit" / "iron-hands" read as prefilled values. Solid lime K tile here, dark tile on `/login`.

### `/atleta-signup`

Verdict: the right friction level for a free athlete.

- [P2] [copy] The same sentence appears twice (above the card and inside it). "¿Primera vez? Te lleva 10 segundos →" is a lime link competing with the primary button with no clear destination.

### `/piloto-beta`

Verdict: token-less dead end.

- [P2] [copy] "Abre el link completo que Samuel te envió." hardcodes the founder's first name in production UI.
- [P2] [states] "Escribir a contacto" has no link affordance (no underline, no color) and there is no way home.

### `/founding-dominus`

Verdict: closed promo, two visible bugs.

- [P2] [a11y] "Saltar al contenido" skip link is permanently visible top-left at 360 and 1280; the `lp-skip` hiding CSS lives in the `(landing)` group and is not loaded here.
- [P3] [hierarchy] "PROMO CERRADA" chip overlaps the K logo's lower-right corner at 1280. No link home.

### `/legal/privacidad`

Verdict: readable, not Mexican.

- [P1] [copy] "Si cancelás, te damos 30 días…" (voseo, `legal/privacidad/page.tsx:163`).
- [P1] [truth] Says athlete data "los ingresa el Box al dar de alta a sus atletas"; athletes self-register for free. Claims "autenticación de dos factores disponible"; verify before shipping.
- [P2] [copy] A Mexican owner expects an "Aviso de Privacidad" with LFPDPPP and derechos ARCO wording. "NO VENDEMOS TU DATA", "Encryption at rest", "hosting cloud", "follow-up comercial", "tracking", "landing page".
- [P2] [consistency] Contact is hola@; `/founding-dominus` and `/piloto-beta` use contacto@; `CtaTail` uses ventas@ and demo@.

### `/legal/terminos`

Verdict: same document, one contractual error.

- [P1] [truth] §5 "Kronos integra pasarelas de pago de terceros (Stripe, Mercado Pago)".
- [P2] [copy] "servicio.Atleta" (missing space); "setup fee", "white-label", "encryption at rest".

### `/tv`

Verdict: developer instruction page.

- [P2] [IA] "Acceder a una pantalla específica: /tv/<slug-del-box>" asks an owner to know a slug. Offer a box picker or a login-bound redirect.

### `/tv/iron-hands-polanco`

Verdict: the whiteboard works, but it is Kronos's whiteboard, not the box's.

- [P1] [truth] "KRONOS" is the largest wordmark on screen and the box name is a 10 px eyebrow, on the page `/box` describes as "Cero marca Kronos en pantalla".
- [P1] [color] Ranks 1–3, every PR value ("82kg", "149kg"…) and the "PRS RECIENTES" label are orange; none is a warning.
- [P1] [consistency] `🏆 PRs recientes` is a unicode emoji (`tv/[slug]/page.tsx:380`).
- [P2] [responsive] `hOverflow: true` at 360 (document is 415 px wide): the clock and "Martes, 15 De Septiembre" push past the viewport.
- [P2] [hierarchy] The WOD card is 750 px tall with one line ("Push Press") and ~550 px of void; "1RM Push Press" appears twice; "TOP DE LA SEMANA" shows 3-3-3-3-2 with no tiebreak. "EN 257MIN", "De Septiembre" capitalized, seed WOD text in English.

### `/eventos/evt_…`

Verdict: a card, not an event page.

- [P1] [conversion] No time, venue, price, cupo, deadline or organizer contact; only name, date and a 4-line WOD. "INICIAR SESIÓN PARA INSCRIBIRME" is the sole action and requires an account before seeing any of that.
- [P2] [responsive] At 1280 the CTA is ~22 px tall with text touching the edges; at 360 it wraps and is fine. "PARTNER", "PARTITIONED" in English.

### `/invitacion/invalid-token-test`

Verdict: this is the first screen many athletes will see, and it is a dead end.

- [P1] [copy] "Pedile a tu Box que te envíe uno nuevo." (`invitacion/[token]/page.tsx:24`, also `:24` and `:60` in the staff variant).
- [P1] [states] No logo, no box name, no coach contact, no explanation of what Kronos is. "Ir al login" (ghost button) and "¿Ya tienes cuenta? Iniciar sesión" go to the same place.

### `/invitacion-staff/invalid-token-test`

Verdict: pixel-identical to the athlete variant.

- [P2] [copy] A coach is told "Pedile a tu Box"; the person who invited them is the owner. Distinguish the copy.

### `/logout`

Verdict: the most consistent screen on the surface.

- [P3] [consistency] Only here and on `/login` does "EL TIEMPO ES TU RIVAL" appear.

## Heuristic scores

| #   | Heuristic                       | Score (0–4)         | Evidence                                                                                         |
| --- | ------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------ |
| 1   | Visibility of system status     | 2                   | 17 s load on `/box` with no indicator; blank `/` on mobile; OTP/invite states exist              |
| 2   | Match with the real world       | 2                   | +52 WhatsApp field, MXN, right competitor names; but "owner", "slug", "tier", MRR/CAC/LTV, voseo |
| 3   | User control and freedom        | 2                   | Logout confirm is good; invitation, piloto-beta, founding-dominus and eventos have no way home   |
| 4   | Consistency and standards       | 1                   | Six logo/chrome variants, five CTA labels, 14 vs 30 days, MX vs LATAM, four contact addresses    |
| 5   | Error prevention                | 2                   | Slug helper text and consent copy; signup creates a trial with no plan                           |
| 6   | Recognition over recall         | 2                   | `/tv` demands a slug; "Te lleva 10 segundos →" and "QUE MI BOX LA PIDA" unexplained              |
| 7   | Flexibility and efficiency      | n/a                 | Persuade surface; auth flows are intentionally single-path                                       |
| 8   | Aesthetic and minimalist design | 3                   | Authored system; undercut by "+ +" bullets, empty phone frames, void WOD card                    |
| 9   | Error recognition and recovery  | 2                   | Clear invite copy, wrong dialect, no contact path                                                |
| 10  | Help and documentation          | 2                   | Manual exists but 7/9 sections are placeholders; docs/status/changelog "PRÓX."                   |
|     | **Renormalized total**          | **2.0 / 4 (18/36)** |                                                                                                  |

## Top 8 issues

1. **`/` is empty at 360 and 768.** Why: it is the athlete's first screen and the QR/WhatsApp entry point; a JS parse error plus opacity-0 initial state means zero content. Fix: SSR-visible markup in `RouterSplit.tsx` (`initial={false}` or CSS entrance), then reproduce and kill the "Invalid or unexpected token" on a production build.
2. **`/box` and the Terms sell unshipped features.** Why: a pilot owner will ask for a CFDI or an OXXO reference in week one and the sale is dead. Fix: one truth pass with three tags per bullet (shipped / en piloto / roadmap); remove Stripe, OXXO, SPEI, CFDI, nómina, App Store, API, SSO, 12-week blocks from Hierro/Acero/Titanio and from Terms §5; replace "cifras frías" $0K mock with real seeded numbers.
3. **Trial and CTA incoherence.** Why: 14 vs 30 days and self-serve vs "te llamamos" make the owner distrust the price sheet. Fix: one trial length in `Hero.tsx`, `mock.ts`, `CtaTail.tsx`, `SectionLeadForm.tsx`, `/signup`, `/login`; two CTA labels total ("Empezar prueba" self-serve, "Hablar por WhatsApp" assisted).
4. **`/atletas` content hidden behind in-view animation and fake reviews.** Why: below the hero the page is blank without scroll and the only social proof is labeled illustrative. Fix: add the `RevealOnScroll` timeout fallback to the four framer sections (or `initial={false}` under `useReducedMotion`), remove "EJEMPLO ILUSTRATIVO" blocks until pilot quotes exist.
5. **Voseo and English inside Spanish UI.** Why: the house rule is neutral Mexican Spanish and the product screenshots themselves say "Empezá". Fix: `invitacion/[token]/page.tsx:24`, `invitacion-staff/[token]/page.tsx:24,60`, `legal/privacidad/page.tsx:163`; re-capture hero/manual screenshots; replace "KRONOS AI", "Skills", "Pricing", "owner", "slug", "trial".
6. **Manual and footer placeholders.** Why: rule 5, and 3,600 px of empty phone frames on mobile. Fix: hide frames without a capture (show the bullet list only), remove "PRÓX." links from the footer until they resolve.
7. **Athlete first-run dead ends.** Why: invalid invite has no brand, no contact, duplicate links; `/atleta` bounces to a box-owner login; closing CTA card clips at 360. Fix: invite error shows box name + "Escríbele a tu coach" + "Crear cuenta gratis"; `/login` gets an athlete path; card gets `overflow: visible` and word-wrap.
8. **TV mode contradicts white-label and the color rule.** Why: whiteboards are the most photographed screen in a box; this one advertises Kronos, uses decorative orange and an emoji, and overflows at 360. Fix: box logo/brandColor as the primary mark, lime-opacity ranks, SVG trophy, WOD card sized to content.

## What works

- The "V3 Cuarto Oscuro" system is authored, not templated: Plex Mono display against Inter body, numbered eyebrows ("/02 · PARA EL OWNER"), one lime accent with opacity for intensity in the occupancy chart.
- The `/box` hero phone plays real product video ("Reservas tu clase en segundos", "ACTIVAR SONIDO") — concrete proof rather than a Figma mock.
- The lead form is MX-native: WhatsApp field with "+52 55 0000 0000", "Te escribimos por WhatsApp, no spammeamos", plain-language consent, "24 horas hábiles".
- FAQ names the right incumbents ("¿Migran mi data desde Wodify, PushPress, SugarWOD o Boxmagic?") and the CSV-export promise appears in pricing, closing card and Terms.
- `/logout` and `/atleta-signup` are the two calmest screens: one decision, SVG icon, reassurance line, nothing else.

## Persona red flags

**Mexican box owner (skeptical, price-sensitive, WhatsApp-native).** He reads "STRIPE + MERCADO PAGO + OXXO" and "CFDI 4.0", asks for a CFDI in the demo, and there is none. He sees "TRIAL 14 DÍAS" then "PROBAR ACERO 30 DÍAS" and assumes the fine print wins. "Sin IVA" does not tell him whether he pays 16% more or gets an invoice for his own subscription. He wants to write on WhatsApp now; the page offers a seven-field form and "te llamamos". He Googles "Califa CrossFit Colombia" and finds nothing. "PILOTO PRIVADO · 20 cupos" next to self-serve signup reads as manufactured scarcity. MRR, churn, CAC, LTV, tier, slug: he thinks in "mensualidades", "morosos" and "cuántos vinieron hoy".

**First-time athlete opening an invitation link on a phone.** A stale token lands her on a logo-less card that says "Pedile a tu Box" and offers the same login twice; she does not know what Kronos is, who sent it, or how to reach her coach. The root URL is blank at 360. `/login` asks "¿Aún no tienes box?", which is not her question. The app screenshots say "Empezá hoy", the "Instalar Kronos" banner sits under the notch in every mock, and nothing says this is a PWA rather than an App Store download.

## Questions to consider

1. Is `/box` selling the 2026 pilot or the 2027 roadmap, and who owns the rule that every pricing bullet must map to a shipped feature?
2. Which trial is real, 14 days self-serve or 30 days assisted, and which tier does `/signup` actually provision?
3. Who is `/atletas` for, given the home router sends athletes straight to `/atleta-signup` and the page has no other entry point?
4. If TV mode is white-label, why is KRONOS the largest word on the box's own wall?
5. Is this a Mexico product or a LATAM product? The hero, pilot line, palette proof and the two footers currently disagree.
