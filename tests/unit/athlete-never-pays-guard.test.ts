/**
 * The athlete never pays Kronos — only a box does.
 *
 * That is a product rule, and until this guard existed it held only by
 * coincidence: the SaaS billing crons swept every `subscriptionStatus: "TRIAL"`
 * box, personal boxes included, and nothing reached those athletes purely
 * because a personal box happens to have no OWNER user (so the dunning email
 * has no recipient) and a null `trialEndsAt` (so the expiry sweep no-ops).
 * Either coincidence could be removed by an unrelated change — giving the
 * athlete-signup flow a trial date, for instance — and every independent
 * athlete's box would flip to EXPIRED with a "subscription expired" mail path.
 *
 * It also pins the post-login landing: both handlers used to hardcode "/admin",
 * so an athlete was sent to a surface their role forbids and bounced back by
 * the middleware.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { evaluateTrialLifecycle } from "@/server/saas-billing/lifecycle";

const ROOT = path.resolve(__dirname, "../..");
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

const BILLING_SWEEPS = [
  "src/server/saas-billing/trial-dispatch.ts",
  "src/app/api/cron/saas-billing-lifecycle/route.ts",
] as const;

describe("athlete never pays Kronos", () => {
  it.each(BILLING_SWEEPS)(
    "%s excludes personal boxes from its TRIAL sweep",
    (rel) => {
      const src = read(rel);
      expect(src).toContain("PERSONAL_PREFIX");
      // The exclusion has to be in the query, not just imported.
      expect(src).toMatch(
        /NOT:\s*\{\s*slug:\s*\{\s*startsWith:\s*PERSONAL_PREFIX/,
      );
    },
  );

  it.each(BILLING_SWEEPS)("%s still filters on TRIAL status", (rel) => {
    expect(read(rel)).toContain('subscriptionStatus: "TRIAL"');
  });

  it("leaves a TRIAL box with no trial date alone", () => {
    // Personal boxes are created without trial dates; this is the second
    // coincidence the guard above stops depending on.
    expect(
      evaluateTrialLifecycle(
        { subscriptionStatus: "TRIAL", trialEndsAt: null },
        new Date("2026-09-17T00:00:00Z"),
      ),
    ).toEqual({ nextStatus: "TRIAL", changed: false });
  });

  it("still expires a real box whose trial ended", () => {
    expect(
      evaluateTrialLifecycle(
        {
          subscriptionStatus: "TRIAL",
          trialEndsAt: new Date("2026-09-01T00:00:00Z"),
        },
        new Date("2026-09-17T00:00:00Z"),
      ),
    ).toEqual({ nextStatus: "EXPIRED", changed: true });
  });
});

describe("post-login landing follows the role", () => {
  const LOGIN_FORM = "src/app/(auth)/login/LoginForm.tsx";

  it("never hardcodes /admin as the landing", () => {
    expect(read(LOGIN_FORM)).not.toContain('window.location.href = "/admin"');
  });

  it("routes an ATHLETE to /atleta", () => {
    const src = read(LOGIN_FORM);
    expect(src).toContain("landingForCurrentSession");
    expect(src).toMatch(/role === "ATHLETE"\s*\?\s*"\/atleta"/);
  });
});
