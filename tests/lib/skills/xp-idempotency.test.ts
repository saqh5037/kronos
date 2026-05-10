import { describe, it, expect } from "vitest";
import {
  SKILL_PROGRESSION_XP,
  SKILL_XP_LEDGER_REASON,
  SKILL_XP_LEDGER_SOURCE_TYPE,
  buildSkillXPLedgerSourceId,
} from "@/lib/skills/xp";

describe("Skill XP awarding contract", () => {
  it("awards 100 XP per progression", () => {
    expect(SKILL_PROGRESSION_XP).toBe(100);
  });

  it("uses canonical sourceType + reason for ledger uniqueness", () => {
    expect(SKILL_XP_LEDGER_SOURCE_TYPE).toBe("skill_progression");
    expect(SKILL_XP_LEDGER_REASON).toBe("skill_progression_achieved");
  });

  it("derives a stable sourceId from movementSlug + progressionSlug", () => {
    expect(buildSkillXPLedgerSourceId("ring-dip", "ring-support-20s")).toBe(
      "ring-dip:ring-support-20s",
    );
  });

  it("sourceId is stable across calls (idempotent for same inputs)", () => {
    const a = buildSkillXPLedgerSourceId("handstand-walk", "wall-walk");
    const b = buildSkillXPLedgerSourceId("handstand-walk", "wall-walk");
    expect(a).toBe(b);
  });

  it("sourceId differs by progression for the same movement", () => {
    expect(
      buildSkillXPLedgerSourceId("ring-dip", "p1") !==
        buildSkillXPLedgerSourceId("ring-dip", "p2"),
    ).toBe(true);
  });
});
