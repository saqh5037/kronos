import { describe, it, expect } from "vitest";
import { computeGoalProgress } from "../../src/lib/goals/progress";
import { goalSchema } from "../../src/lib/validations/goal";

describe("computeGoalProgress", () => {
  const created = "2026-04-01T00:00:00.000Z";
  const deadline = "2026-06-01T00:00:00.000Z"; // 61 days
  const goal = {
    metric: "PR" as const,
    targetValue: 150,
    startValue: 100,
    deadline,
    createdAt: created,
  };

  it("returns 0% before any progress is made", () => {
    const r = computeGoalProgress(goal, 100, new Date(created));
    expect(r.pct).toBe(0);
    expect(r.achieved).toBe(false);
  });

  it("returns 100% and achieved=true when target is met", () => {
    const r = computeGoalProgress(
      goal,
      150,
      new Date("2026-05-01T00:00:00.000Z"),
    );
    expect(r.pct).toBe(100);
    expect(r.achieved).toBe(true);
  });

  it("clamps pct over target to 100", () => {
    const r = computeGoalProgress(
      goal,
      200,
      new Date("2026-05-01T00:00:00.000Z"),
    );
    expect(r.pct).toBe(100);
  });

  it("computes daysLeft from now to deadline", () => {
    const r = computeGoalProgress(
      goal,
      120,
      new Date("2026-05-15T00:00:00.000Z"), // 17 days before deadline
    );
    expect(r.daysLeft).toBe(17);
  });

  it("daysLeft never negative when past deadline", () => {
    const r = computeGoalProgress(
      goal,
      120,
      new Date("2026-07-01T00:00:00.000Z"),
    );
    expect(r.daysLeft).toBe(0);
  });

  it("flags onTrack when pct >= elapsed%", () => {
    // Halfway through timeline (~30d in), progress 50% (125kg) → onTrack
    const r = computeGoalProgress(
      goal,
      125,
      new Date("2026-05-01T00:00:00.000Z"),
    );
    expect(r.onTrack).toBe(true);
  });

  it("flags off-track when behind schedule", () => {
    // 80% through timeline (~49d in), progress only 10% → off track
    const r = computeGoalProgress(
      goal,
      105,
      new Date("2026-05-20T00:00:00.000Z"),
    );
    expect(r.onTrack).toBe(false);
  });

  it("eta is null when no progress yet", () => {
    const r = computeGoalProgress(
      goal,
      100,
      new Date("2026-04-15T00:00:00.000Z"),
    );
    expect(r.eta).toBeNull();
  });

  it("eta is an ISO string when there's positive progress mid-timeline", () => {
    const r = computeGoalProgress(
      goal,
      125,
      new Date("2026-05-01T00:00:00.000Z"),
    );
    expect(r.eta).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe("goalSchema", () => {
  it("requires movementId for PR goals", () => {
    expect(() =>
      goalSchema.parse({
        metric: "PR",
        targetValue: 150,
        unit: "kg",
        deadline: new Date(Date.now() + 86400000 * 30),
      }),
    ).toThrow();
  });

  it("accepts attendance goal without movementId", () => {
    const out = goalSchema.parse({
      metric: "ATTENDANCE",
      targetValue: 20,
      unit: "clases",
      deadline: new Date(Date.now() + 86400000 * 30),
    });
    expect(out.metric).toBe("ATTENDANCE");
  });

  it("rejects past deadline", () => {
    expect(() =>
      goalSchema.parse({
        metric: "ATTENDANCE",
        targetValue: 10,
        unit: "clases",
        deadline: new Date(Date.now() - 86400000),
      }),
    ).toThrow();
  });

  it("rejects negative targets", () => {
    expect(() =>
      goalSchema.parse({
        metric: "TONNAGE",
        targetValue: -100,
        unit: "kg",
        deadline: new Date(Date.now() + 86400000 * 30),
      }),
    ).toThrow();
  });

  it("accepts BODY_COMPOSITION goal in kg", () => {
    const out = goalSchema.parse({
      metric: "BODY_COMPOSITION",
      targetValue: 72,
      unit: "kg",
      startValue: 78,
      deadline: new Date(Date.now() + 86400000 * 60),
    });
    expect(out.metric).toBe("BODY_COMPOSITION");
    expect(out.unit).toBe("kg");
  });

  it("accepts BODY_COMPOSITION goal in %", () => {
    const out = goalSchema.parse({
      metric: "BODY_COMPOSITION",
      targetValue: 18,
      unit: "%",
      deadline: new Date(Date.now() + 86400000 * 90),
    });
    expect(out.unit).toBe("%");
  });

  it("rejects BODY_COMPOSITION goal with invalid unit", () => {
    expect(() =>
      goalSchema.parse({
        metric: "BODY_COMPOSITION",
        targetValue: 72,
        unit: "lb",
        deadline: new Date(Date.now() + 86400000 * 30),
      }),
    ).toThrow();
  });

  it("rejects BODY_COMPOSITION with movementId", () => {
    expect(() =>
      goalSchema.parse({
        metric: "BODY_COMPOSITION",
        movementId: "mov_123",
        targetValue: 72,
        unit: "kg",
        deadline: new Date(Date.now() + 86400000 * 30),
      }),
    ).toThrow();
  });
});
