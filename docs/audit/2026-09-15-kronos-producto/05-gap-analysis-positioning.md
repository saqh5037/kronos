---
title: Kronos — Gap analysis and positioning thesis (2026-09-15)
status: proposal, for partner discussion
inputs: 01-code-inventory.md, 02-screen-audit.md, 03-benchmark-b2c-wellness.md, 04-benchmark-b2b-box-saas.md
---

# Gap analysis and positioning thesis

## 1. Where Kronos actually is

| Dimension         | State on 2026-09-15                                                                                                                                                                                                                                                                                                                                                                                           | Evidence                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Engineering       | Healthy. Typecheck, lint, 1,363 unit tests, build all green; 26 e2e specs; CI; Sentry and PostHog wired                                                                                                                                                                                                                                                                                                       | `00-README.md`               |
| Feature surface   | Wide. 53 models, 88 routes, 4 roles, SaaS billing, memberships + Mercado Pago + cash, classes/bookings/waitlist/check-in, WODs + movement library, scores/PRs/leaderboards, gamification (badges, streaks, XP, skills), AI in 7 flows (Gemini), events, TV mode, push, surveys, audit log, super-admin, pilot provisioning, personal-box mode for independent athletes, **complete Whoop backend with no UI** | `01-code-inventory.md`       |
| Product coherence | Weak. Three admin shells, a coach landing with no navigation, numbers that disagree across screens, an athlete home without today's workout, gamification that contradicts itself, ~45 P1 findings                                                                                                                                                                                                            | `02-screen-audit.md`         |
| Truthfulness      | Broken. The B2B landing and the Terms sell Stripe, OXXO, SPEI, CFDI 4.0, payroll, native apps, API, SSO and SLA that do not exist                                                                                                                                                                                                                                                                             | `reviews/public-auth.md`     |
| Design identity   | Strong and authored (lime on near-black, IBM Plex Mono, streak hero). Every reviewer said "not templated"                                                                                                                                                                                                                                                                                                     | all reviews                  |
| Accessibility     | Poor. `--k-t3` at 2.67:1 in 534 usages, 325 axe nodes on 14 screens, emoji icons in 71 files, 1,343 sub-40 px targets at 360 in admin                                                                                                                                                                                                                                                                         | `reviews/technical-audit.md` |
| Market position   | Private pilot in Mexico, one real box (Grizzlys), MXN list prices $2,500 / $3,500 / $5,000 per month, three months without commits                                                                                                                                                                                                                                                                            | Engram, git                  |

Summary: Kronos has more built than the team remembers (the project CLAUDE.md is 226 commits stale) and less finished than the landing claims. The gap is not features. It is coherence, truth and finish.

## 2. What the market looks like in 2026

### Box-management SaaS (who the box pays today)

|                                         | Wodify                                                | PushPress                                                    | SugarWOD                                            | BTWB                             | LatAm players (Klasius, Crossfy, GymGestión, Boxmagic) |
| --------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------- | -------------------------------- | ------------------------------------------------------ |
| List price                              | ~$179–199 USD/mo + add-ons (Perform, branded app $79) | $0 / $159 / $229 + Train $79 + Grow $329 (≈ $559 full stack) | per athlete, ~$29–219 USD                           | athletes $7.99; gyms unpublished | $200–1,500 MXN/mo flat                                 |
| Spanish UI                              | No                                                    | No                                                           | Yes                                                 | No                               | Yes (Argentine voseo in one)                           |
| Mexican rails (MP, OXXO, SPEI, Conekta) | No (Stripe)                                           | No (Stripe)                                                  | n/a (no billing)                                    | No                               | Partial (MP; manual cash/SPEI)                         |
| WhatsApp                                | US/CA SMS only                                        | via Grow $329                                                | No                                                  | No                               | Yes (reminders, payment links)                         |
| Wearables                               | Myzone belts                                          | No                                                           | Apple Health runs                                   | Apple Watch timer                | No                                                     |
| AI                                      | Ask Wodify (insights), Retain                         | AI assistant (ops, not programming)                          | No                                                  | AI planner                       | Crossfy claims routine generation                      |
| Competitions                            | Wodify Arena (separate product)                       | Paid/invite events, no heats                                 | No                                                  | No                               | No                                                     |
| Top complaints                          | price hikes, glitchy releases, slow app               | erratic billing, glitchy, expensive stack                    | forced logouts, removed 1RM charts, price increases | clicks, small fonts              | thin CrossFit depth, no athlete app                    |

Table stakes every serious product has: recurring billing with retry, booking with waitlist and per-class no-show/late-cancel policies, kiosk check-in, athlete app with WOD/score/PR, TV whiteboard, coach roster and notes, push and email, digital waivers, dashboards, Zapier or API. Kronos covers most of this. Visible holes: per-class cancellation policies, drop-in caps, waivers, a polished TV mode, and reliability of what exists.

Differentiators few have: native wearable ingestion (nobody does Whoop or Garmin), AI that programs (only BTWB's parser and Crossfy claim it), a competition module with heats and live scoring, real gamification, tracking without paid add-ons, multi-tenant admin for small chains.

Unserved in Mexico: Spanish-first with CrossFit depth, MXN pricing without add-on gating, OXXO/SPEI/cash reconciliation and CFDI in one flow, WhatsApp as the primary channel. No vendor occupies that corner today.

### Consumer fitness apps (what the athlete compares the app to)

What defines "modern" in 2026 across Whoop, Garmin, Oura, Strava, Apple and Hevy:

1. One readiness number as the daily anchor (Recovery, Training Readiness, Readiness).
2. A daily target scaled by that number.
3. An AI briefing on the home that refreshes through the day, and chat with your own data.
4. A glanceable row of 3–5 tiles: big number plus sparkline plus delta.
5. Progressive disclosure: score → 7/30-day trend → raw graph.
6. Semantic colour only for state, monochrome otherwise.
7. Strength logging with autofill of the last set, rest timer, set-type tags.
8. Social as accountability (kudos, small circles, club events, leaderboards with integrity).
9. A longitudinal health layer bolted onto fitness.
10. Cross-platform sync through Apple Health / Health Connect plus direct partner APIs.

Kronos today: 6 (partly), 7 (partly), 8 (leaderboards, badges). Missing: 1, 2, 3, 4, 5, 9, 10.

What it costs to pull wearable data: Whoop v2 API is self-serve OAuth with a 10-member cap until app approval (backend already built in Kronos); Oura v2 is self-serve; Garmin requires a business application; Apple Health and Health Connect require a native app; Strava forbids AI use of its data since 2026-06-01.

## 3. The thesis

**Kronos should not try to be Whoop. It should be the layer Whoop cannot be.**

A wearable knows your strain was 14.2 and your recovery 61 %. It does not know that you did Murph RX in 38:12, your third Murph, 2:10 faster than in May, with coach Lobo, next to eleven people who will see your name on the whiteboard tonight. The box is a data source no wearable has: coached sessions, structured programming, RX vs scaled, real PRs, attendance, a community with names. Kronos already owns that data for every athlete in the box.

The product that "has nothing to envy Whoop or Garmin" is therefore not a hardware clone. It is a **training-context app** that:

- anchors the day on one number, **Estado del día**, computed from what Kronos already has (7-day training load from scores and attendance, the existing readiness/RPE survey) and enriched when a wearable is connected (Whoop today, Oura next, Apple Health via a native wrapper later), always showing its provenance ("basado en tu Whoop + 5 entrenos esta semana");
- turns that number into today's decision ("Murph hoy: hazlo RX", "hoy técnica, mañana pesado");
- shows progress as trends (7/30/90 days) instead of a wall of modules;
- keeps the box at the centre: whiteboard, coach, class, community.

The distribution model is already on the landing and it is right: **the box pays, the athlete gets the app free**. Customer acquisition cost per athlete is near zero because the box onboards its members; the athlete app is the box's retention engine, and retention is what the box owner pays for. Independent athletes (personal-box mode) stay as a secondary funnel and get no dedicated investment until five boxes pay.

Positioning statement, for the partner conversation:

> **Kronos es el sistema operativo del box en México** (cobros en pesos con OXXO y SPEI, WhatsApp, español, CFDI) **con la app de atleta que se siente como Whoop y sabe lo que entrenaste.**

Why this wins:

| Against                                       | Kronos wins on                                                                                                                                                                      |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wodify / PushPress / BTWB                     | Spanish, MXN, Mexican rails, WhatsApp, no add-on gating, wearable fusion, AI programming, a modern athlete app; and on the incumbents' own weakness: reliability and honest pricing |
| SugarWOD                                      | Full box operations (it has none), MXN billing, gamification it refuses to build, wearable fusion                                                                                   |
| Klasius / Boxmagic / GymGestión / Crossfy     | CrossFit depth (whiteboard, PRs, leaderboards, skills, programming), an athlete app worth installing, wearable fusion, a design identity                                            |
| Whoop / Garmin / Oura (in the athlete's mind) | Knows the workout, the coach and the box; free; works without hardware; gets better with it                                                                                         |

## 4. Three strategic decisions the partners need to make

1. **Box-first or athlete-first?** Recommendation: box-first. The box pays, the athlete app is what the box sells to its members. Every roadmap phase assumes this. Athlete-first (B2C subscriptions) means competing with Whoop's marketing budget and Hevy's $2.99/month; Kronos has no edge there without the box.
2. **Wearables: how far?** Recommendation: ship the Whoop UI now (the backend exists, the API is self-serve), add Oura in the same pattern, and decide on a native wrapper (Capacitor) for Apple Health / Health Connect only after the pilot shows athletes connecting devices. Do not build the wrapper first.
3. **CrossFit only, or multi-discipline at launch?** Recommendation: CrossFit at launch, Hyrox-ready data model (already scaffolded), no Hyrox UI until five boxes pay. Hyrox is the 2026 growth story and Wodify "feels awkward for Hyrox" per reviews, so it is the second market, not the first.

Two investments the plan needs money or accounts for, not code: a Mexican PAC for CFDI 4.0 (if the box needs invoices for its own subscription, and later for athlete receipts), and WhatsApp Business API access (templates for reminders, waitlist promotion, failed-payment recovery, PR announcements).

## 5. Gaps, prioritised by what blocks a sale

| Priority | Gap                                                                                 | Why it blocks                                                                                    | Where it is fixed                                   |
| -------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| 1        | Landing and Terms promise unshipped features; trial 14 vs 30 days                   | First owner who asks for a CFDI or an OXXO reference in week one ends the sale                   | Roadmap phase 0                                     |
| 2        | Coach cannot pass attendance from a phone; owner cannot reconcile cash from a phone | The two daily jobs of the two paying personas fail on mobile                                     | Phase 1 (shell, responsive lists) and phase 3       |
| 3        | Numbers disagree across screens                                                     | One mismatch discredits every KPI; the owner opens a spreadsheet                                 | Phase 1 (period summary service, KPI = table tests) |
| 4        | Athlete home has no daily loop; no anchor, no trends                                | The athlete app is the retention engine; without a loop there is no retention                    | Phase 2                                             |
| 5        | Whoop backend has no UI                                                             | The cheapest credible "Whoop-like" move is sitting unused                                        | Phase 2                                             |
| 6        | Only Mercado Pago card + cash; no OXXO/SPEI reference flow; no CFDI                 | Mexican boxes collect in cash and transfers; CFDI is asked for in every B2B sale                 | Phase 3 (rails), partner decision (PAC)             |
| 7        | No WhatsApp channel                                                                 | Email is the wrong channel for Mexican boxes; local competitors already do it                    | Phase 3                                             |
| 8        | Accessibility and mobile ergonomics (contrast, targets, landmarks)                  | Legal exposure is low in MX, but unreadable labels in a dark gym at 5:40 am is a product problem | Phases 0 and 1                                      |
| 9        | Copy: English enums, voseo, dev notes                                               | Reads as unfinished; contradicts the Mexican positioning                                         | Phase 0                                             |
| 10       | No per-class cancellation policy, drop-in caps, waivers                             | Table stakes in every competitor                                                                 | Phase 3                                             |

## 6. What not to do

- Do not redesign the identity. Lime on near-black with Plex Mono is the most distinctive asset the product has and it is Whoop-adjacent without copying Whoop. Refine the system, do not replace it.
- Do not build the native app first. A PWA with a centred desktop column and a proper mobile shell covers the pilot; the wrapper is a phase-5 decision driven by wearable demand.
- Do not add features before the eight P0s and the ten systemic patterns in `02-screen-audit.md` are closed. The audit found ~145 issues on the surface that exists; more surface multiplies them.
- Do not ship anything the landing cannot say truthfully. The rule for the rewrite: every pricing bullet maps to a route someone can open.
