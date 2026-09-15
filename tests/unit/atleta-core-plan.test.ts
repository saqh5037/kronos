import { describe, it, expect } from "vitest";
import {
  goalMetricLabel,
  formatDeadline,
  formatDeadlineCountdown,
  normalizeGoalId,
  pickDefaultGoal,
  currentPlanWeek,
} from "@/app/atleta/plan/_helpers";

describe("goal metric labels", () => {
  it("never returns the raw enum", () => {
    expect(goalMetricLabel("ATTENDANCE")).toBe("Asistencia");
    expect(goalMetricLabel("TONNAGE")).toBe("Tonelaje");
    expect(goalMetricLabel("BODY_COMPOSITION")).toBe("Composición corporal");
    expect(goalMetricLabel("PR")).toBe("PR");
    expect(goalMetricLabel("SOMETHING_NEW")).toBe("objetivo");
  });
});

describe("deadline copy", () => {
  const now = new Date(2026, 8, 15);

  it("leads with the countdown, not the long date", () => {
    const label = formatDeadline(new Date(2026, 9, 3), now);
    expect(label.startsWith("faltan 18 días")).toBe(true);
    expect(label).not.toMatch(/3 DE OCTUBRE DE 2026/i);
  });

  it("exposes the bare countdown too", () => {
    expect(formatDeadlineCountdown(new Date(2026, 8, 16), now)).toBe("mañana");
  });
});

describe("goalId normalisation", () => {
  it("trims and nulls empties", () => {
    expect(normalizeGoalId(" abc ")).toBe("abc");
    expect(normalizeGoalId("   ")).toBeNull();
    expect(normalizeGoalId(undefined)).toBeNull();
  });
});

describe("default goal", () => {
  const goals = [
    { id: "far", status: "ACTIVE", deadline: new Date(2026, 11, 1) },
    { id: "near", status: "ACTIVE", deadline: new Date(2026, 9, 3) },
    { id: "done", status: "ACHIEVED", deadline: new Date(2026, 8, 1) },
  ];

  it("opens on the active goal with the nearest deadline", () => {
    expect(pickDefaultGoal(goals)!.id).toBe("near");
  });

  it("ignores non-active goals and empty lists", () => {
    expect(pickDefaultGoal([goals[2]])).toBeNull();
    expect(pickDefaultGoal([])).toBeNull();
  });

  it("does not mutate the input order", () => {
    pickDefaultGoal(goals);
    expect(goals.map((g) => g.id)).toEqual(["far", "near", "done"]);
  });
});

describe("current plan week", () => {
  const now = new Date(2026, 8, 15);

  it("is week 1 when the whole plan is still ahead", () => {
    // 6 weeks left of a 6-week plan.
    expect(currentPlanWeek(6, new Date(2026, 9, 27), now)).toBe(1);
  });

  it("advances as the deadline approaches", () => {
    // ~4 weeks left of a 6-week plan → week 3.
    expect(currentPlanWeek(6, new Date(2026, 9, 13), now)).toBe(3);
    // ~1 week left → week 6.
    expect(currentPlanWeek(6, new Date(2026, 8, 22), now)).toBe(6);
  });

  it("clamps into the plan instead of running off the end", () => {
    expect(currentPlanWeek(6, new Date(2026, 7, 1), now)).toBe(6);
    expect(currentPlanWeek(6, new Date(2027, 0, 1), now)).toBe(1);
    expect(currentPlanWeek(0, new Date(2026, 9, 3), now)).toBe(0);
  });
});
