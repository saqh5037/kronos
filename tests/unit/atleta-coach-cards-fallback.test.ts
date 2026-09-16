/**
 * P2 — every AI flow in Kronos claims a deterministic fallback (CLAUDE.md,
 * "IA (Gemini) … Todos con fallback determinista"). CoachCards was the one that
 * did not have one: `parseCoachCardResponse` throws on bad JSON or a bad shape,
 * `generateCoachCardsForAthlete` caught it and returned `{ generated: 0 }`, and
 * the section simply vanished from `/atleta` — no error, no empty state, no
 * trace the athlete could act on.
 *
 * `deterministicCoachCards` builds cards from the SAME facts the prompt gets,
 * so the section survives a model outage with the athlete's real numbers.
 */

import { describe, it, expect } from "vitest";
import {
  deterministicCoachCards,
  parseCoachCardResponse,
  type CoachCardInput,
} from "@/server/ai/coach-cards-prompt";

const EMPTY_FACTS: CoachCardInput["facts"] = {
  stagnantPRs: [],
  recentPRs: [],
  nextUnlocks: [],
  avoidancePatterns: [],
};

function input(facts: Partial<CoachCardInput["facts"]>): CoachCardInput {
  return {
    athleteFirstName: "Samuel",
    isPersonalBox: false,
    facts: { ...EMPTY_FACTS, ...facts },
  };
}

const FULL = input({
  recentPRs: [
    {
      movementName: "Deadlift",
      deltaPct: 7.5,
      achievedAt: new Date("2026-09-10T12:00:00Z"),
    },
  ],
  stagnantPRs: [{ movementName: "Snatch", daysStuck: 62, lastValue: "60 kg" }],
  nextUnlocks: [
    {
      movementName: "Pull-up",
      currentProgressionName: "Kipping",
      nextProgressionName: "Butterfly",
    },
  ],
  avoidancePatterns: [{ muscleGroup: "Piernas", daysWithout: 21 }],
});

describe("the real parser still rejects a bad response", () => {
  it("throws on invalid JSON", () => {
    expect(() => parseCoachCardResponse("no soy json")).toThrow(
      /JSON inválido/,
    );
  });

  it("throws on a valid JSON of the wrong shape", () => {
    expect(() => parseCoachCardResponse('{"cards":[{"type":"NOPE"}]}')).toThrow(
      /shape inválido/,
    );
  });
});

describe("deterministicCoachCards", () => {
  it("returns nothing when there is no signal", () => {
    expect(deterministicCoachCards(input({}))).toEqual([]);
  });

  it("never returns more than the three the read query takes", () => {
    expect(deterministicCoachCards(FULL).length).toBe(3);
  });

  it("builds each card from the athlete's own numbers", () => {
    const [celebration, stagnation] = deterministicCoachCards(FULL);

    expect(celebration.type).toBe("CELEBRATION");
    expect(celebration.body).toContain("7.5 %");
    expect(celebration.title).toContain("Deadlift");

    expect(stagnation.type).toBe("STAGNATION");
    expect(stagnation.title).toContain("62");
    expect(stagnation.body).toContain("60 kg");
  });

  it("orders by priority, lowest first (the read query's orderBy)", () => {
    const priorities = deterministicCoachCards(FULL).map((c) => c.priority);
    expect(priorities).toEqual([...priorities].sort((a, b) => a - b));
  });

  it("covers each fact kind on its own", () => {
    expect(
      deterministicCoachCards(
        input({ nextUnlocks: FULL.facts.nextUnlocks }),
      ).map((c) => c.type),
    ).toEqual(["NEXT_UNLOCK"]);
    expect(
      deterministicCoachCards(
        input({ avoidancePatterns: FULL.facts.avoidancePatterns }),
      ).map((c) => c.type),
    ).toEqual(["AVOIDANCE_PATTERN"]);
  });

  it("speaks neutral Mexican Spanish with no emoji", () => {
    const text = deterministicCoachCards(FULL)
      .flatMap((c) => [c.title, c.body, c.ctaLabel ?? ""])
      .join(" ");
    expect(text).not.toMatch(
      /(?<!\p{L})(?:tenés|querés|podés|sabés|mirá|probá|sumá|acá|dale)(?!\p{L})/iu,
    );
    expect(text).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });

  it("only points at routes that exist", () => {
    for (const card of deterministicCoachCards(FULL)) {
      if (!card.ctaHref) continue;
      expect(card.ctaHref).toMatch(/^\/atleta\/(movimientos|skills|wod)/);
    }
  });
});
