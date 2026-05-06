import { describe, expect, it } from "vitest";
import { detectChurnRisk, type ChurnSignals } from "@/lib/insights/detectors";

function signals(over: Partial<ChurnSignals> = {}): ChurnSignals {
  return {
    daysSinceLastAttended: 0,
    attendanceDeltaPct: 0,
    daysSinceLastPR: null,
    recentCancellationsRatio: 0,
    ...over,
  };
}

describe("detectChurnRisk", () => {
  it("returns not at risk when no signals fire", () => {
    const r = detectChurnRisk(signals());
    expect(r.atRisk).toBe(false);
    expect(r.signalCount).toBe(0);
    expect(r.reasons).toEqual([]);
  });

  it("counts absence after 14 days", () => {
    const r = detectChurnRisk(signals({ daysSinceLastAttended: 14 }));
    expect(r.signalCount).toBe(1);
    expect(r.atRisk).toBe(false);
    expect(r.reasons[0]).toContain("14 días");
  });

  it("does not count absence at 13 days", () => {
    const r = detectChurnRisk(signals({ daysSinceLastAttended: 13 }));
    expect(r.signalCount).toBe(0);
  });

  it("counts attendance drop at exactly threshold (-0.20)", () => {
    const r = detectChurnRisk(signals({ attendanceDeltaPct: -0.2 }));
    expect(r.signalCount).toBe(1);
    expect(r.reasons[0]).toContain("-20");
  });

  it("counts stale PR after 60 days", () => {
    const r = detectChurnRisk(signals({ daysSinceLastPR: 60 }));
    expect(r.signalCount).toBe(1);
  });

  it("counts cancellations at 40% ratio", () => {
    const r = detectChurnRisk(signals({ recentCancellationsRatio: 0.4 }));
    expect(r.signalCount).toBe(1);
  });

  it("severity 'med' with 2 signals", () => {
    const r = detectChurnRisk(
      signals({ daysSinceLastAttended: 20, attendanceDeltaPct: -0.3 }),
    );
    expect(r.atRisk).toBe(true);
    expect(r.severity).toBe("med");
    expect(r.signalCount).toBe(2);
  });

  it("severity 'high' with 3+ signals", () => {
    const r = detectChurnRisk(
      signals({
        daysSinceLastAttended: 20,
        attendanceDeltaPct: -0.3,
        daysSinceLastPR: 90,
      }),
    );
    expect(r.atRisk).toBe(true);
    expect(r.severity).toBe("high");
    expect(r.signalCount).toBe(3);
  });

  it("4 signals fire → high severity, all reasons listed", () => {
    const r = detectChurnRisk({
      daysSinceLastAttended: 30,
      attendanceDeltaPct: -0.5,
      daysSinceLastPR: 120,
      recentCancellationsRatio: 0.7,
    });
    expect(r.signalCount).toBe(4);
    expect(r.severity).toBe("high");
    expect(r.reasons).toHaveLength(4);
  });

  it("respects custom thresholds", () => {
    const r = detectChurnRisk(signals({ daysSinceLastAttended: 5 }), {
      ABSENT_DAYS: 5,
    });
    expect(r.signalCount).toBe(1);
  });

  it("null daysSinceLastAttended does not count as absent", () => {
    const r = detectChurnRisk(signals({ daysSinceLastAttended: null }));
    expect(r.signalCount).toBe(0);
  });
});
