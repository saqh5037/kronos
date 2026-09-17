/**
 * Source guards for wiring that only breaks in the browser (audit 2026-09-15,
 * S4 "two numbers, one screen" + fase 0 follow-ups P1-11 / ADM-12).
 *
 * These are the same kind of deterministic source assertion as
 * `admin-mgmt-copy-guard.test.ts`: a render test would need a database and a
 * session, and the defects below are all "the page asks two different
 * questions and prints the answers side by side".
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf-8");

describe("/admin/reportes asks one question per screen", () => {
  const source = read("src/app/admin/reportes/page.tsx");

  it("scopes the churn list to the period the KPIs use", () => {
    // `getChurnRiskList()` fell back to its own default period while the KPI
    // beside it came from `getReports(periodInput)`: the header said "Este
    // mes" over a list computed for another window.
    expect(source).toMatch(/getChurnRiskList\(\s*periodInput\s*\)/);
    expect(source).not.toMatch(/getChurnRiskList\(\s*\)/);
  });

  it("does not claim the list ignores money while rows cite an overdue membership", () => {
    expect(source).not.toMatch(/No mira el dinero/);
  });

  it("describes the three real at-risk signals", () => {
    expect(source).toMatch(/días sin check-in/i);
    expect(source).toMatch(/nunca ha asistido/i);
    expect(source).toMatch(/membresía\s+vencida/i);
  });
});

describe("/admin/atletas labels its numbers", () => {
  const source = read("src/app/admin/atletas/page.tsx");

  it("derives the inactivity window from the shared rule, not a literal", () => {
    expect(source).toMatch(/AT_RISK_DEFAULT_INACTIVITY_DAYS/);
    expect(source).not.toMatch(/Sin check-in 14\+/);
  });

  it("gives every KPI card the period it was computed for", () => {
    // Pagos and Reportes require `period` on their KpiCard; this page printed
    // four numbers with no window attached at all.
    expect(source).toMatch(/period: string/);
    const cards = source.match(/<KpiCard\b/g) ?? [];
    const periods = source.match(/\n\s+period=\{/g) ?? [];
    expect(cards.length).toBeGreaterThan(0);
    expect(periods.length).toBe(cards.length);
  });
});

describe("the owner audit log carries no development notes", () => {
  const source = read("src/lib/audit-humanize.ts");

  it("never labels an owner-facing event '(modo demo)'", () => {
    expect(source).not.toMatch(/\(modo demo\)/);
  });
});
