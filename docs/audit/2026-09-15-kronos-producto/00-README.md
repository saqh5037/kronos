---
title: Kronos — Product & UI audit (2026-09-15)
status: complete (evidence + synthesis)
owner: Samuel Quiroz
scope: full product walkthrough (owner, coach, athlete, public) + competitive benchmark + redesign direction
---

# Kronos — Product & UI audit, 2026-09-15

Purpose: decide how to take Kronos from a three-month-idle pilot to a sellable product, and give the partner conversation (same model as Lisko) a factual base. This folder is the evidence; the executive summary for the partner is a separate page.

## Method

| Step            | What was done                                                                                                                                                                                                                                                                                          | Artifact                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Health          | `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` on `main@808fbac`                                                                                                                                                                                                                             | this file, "Health"                                                                                 |
| Code inventory  | Read-only agent over the whole repo, domain by domain, maturity tags                                                                                                                                                                                                                                   | `01-code-inventory.md`                                                                              |
| Walkthrough     | Playwright script over every route as anon / owner / coach / athlete at 360×780, 768×1024 and 1280×800 against a seeded local dev server (never prod). 264 full-page captures + a JSON manifest of signals per screen (console errors, overflow, touch targets < 40px, text flags, images without alt) | `screens/` (curated), `manifest.jsonl`                                                              |
| Design review   | Five independent reviewers with fresh context, one per surface, using Nielsen heuristics, cognitive load, design specificity, persona walk-throughs and the house rules of the V3 design system                                                                                                        | `reviews/*.md`                                                                                      |
| Technical audit | axe-core (WCAG 2A/2AA/2.1AA + best practice) on 14 representative screens, impeccable deterministic detector on the UI tree, manifest signals, code-level token/theming checks                                                                                                                         | `reviews/technical-audit.md`                                                                        |
| Benchmark       | Web research with primary sources on the 2026 state of consumer fitness apps (Whoop, Garmin, Strava, Apple, Oura, Hevy/Strong) and box-management SaaS (Wodify, SugarWOD, BTWB, PushPress, TrainHeroic, LatAm players)                                                                                 | `03-benchmark-b2c-wellness.md`, `04-benchmark-b2b-box-saas.md`                                      |
| Synthesis       | Consolidated screen audit, gap analysis and positioning thesis, redesign direction, phased roadmap                                                                                                                                                                                                     | `02-screen-audit.md`, `05-gap-analysis-positioning.md`, `06-redesign-direction.md`, `07-roadmap.md` |

Seed used for the walkthrough: `pnpm db:seed` + `db:seed:ops` + `db:seed:story` (box "Iron Hands CrossFit · Polanco": 27 athletes, 132 classes over 4 weeks, 894 bookings, 433 scores, 75 PRs, 37 active memberships, 182 paid payments, 5 announcements, 1 sport event). Dev login as `owner@`, `coach@`, `atleta@iron-hands.demo`.

## Health (main@808fbac, last commit 2026-06-10)

| Check                | Result                                                                                                                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm typecheck`     | pass                                                                                                                                                                                |
| `pnpm lint`          | pass, 3 warnings (`<img>` instead of `next/image` in `atleta/ayuda` and `atleta/wod/foto`)                                                                                          |
| `pnpm test` (vitest) | 1363 / 1363 in 115 files                                                                                                                                                            |
| `pnpm build`         | pass                                                                                                                                                                                |
| e2e (Playwright)     | 26 specs present, not run in this audit (suite was healed in `993152e`)                                                                                                             |
| Local bring-up       | Docker (OrbStack) needed an explicit `orb start`; fresh volume needed `prisma db push` + seeds; Next dev server restarted itself twice for memory during the 264-screen walkthrough |

Verdict: **GREEN** on engineering health. The problems are product and design, not build stability.

## Unmerged branches worth a decision

| Branch                                                                                                                                      | Ahead / behind main | Last commit | Content                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ----------- | ------------------------------------------------------------------------------------- |
| `feat/ai-programming-cycle`                                                                                                                 | +2 / −44            | 2026-05-26  | `ProgrammingCycle` schema + pure AI box-programming logic with tests (1,183 lines)    |
| `feat/admin-crud-editing`                                                                                                                   | +6 / −44            | 2026-05-26  | Edit WOD (nested movements), edit athlete, edit class, payment/plan actions in tables |
| `feat/super-admin-suite`                                                                                                                    | +4 / −44            | 2026-05-25  | Super-admin chrome, cross-tenant support access with code verification, boxes list    |
| `feat/super-admin-atletas-pagos`                                                                                                            | +6 / −44            | 2026-05-25  | Superset of the above + cross-tenant athletes and SaaS payments views                 |
| `feat/seed-week-simulation`, `fix/onboarding-bug-bash-2026-05-18`, `perf/atleta-fonts-cleanup`, 3 `worktree-agent-*`, `backup-pre-rebase-*` | small               | May 2026    | Likely superseded; confirm and delete                                                 |

## How to reproduce the walkthrough

The capture script lives outside the repo (session scratchpad). It logs in through the dev credentials provider, visits every route per role and breakpoint, expands the admin `<main>` scroll container at desktop, takes a full-page screenshot, then records console errors, overflow, small targets and text flags. It refuses to run against `kronos-fit.com`.
