import { describe, it, expect } from "vitest";
import { buildFeedEvents } from "../../src/lib/feed/build";

describe("buildFeedEvents", () => {
  it("returns empty for empty input", () => {
    expect(buildFeedEvents({})).toEqual([]);
  });

  it("emits PR events with computed deltaPct", () => {
    const out = buildFeedEvents({
      prs: [
        {
          athleteId: "a1",
          athleteName: "Ana",
          achievedAt: "2026-04-28T12:00:00.000Z",
          movementName: "Back Squat",
          value: 110,
          unit: "kg",
          prevBest: 100,
        },
      ],
    });
    expect(out).toHaveLength(1);
    expect(out[0].type).toBe("PR");
    expect((out[0].payload as { deltaPct: number }).deltaPct).toBe(10);
  });

  it("PR without prevBest has null deltaPct", () => {
    const out = buildFeedEvents({
      prs: [
        {
          athleteId: "a1",
          athleteName: "Ana",
          achievedAt: "2026-04-28T12:00:00.000Z",
          movementName: "Snatch",
          value: 60,
          unit: "kg",
          prevBest: null,
        },
      ],
    });
    expect((out[0].payload as { deltaPct: number | null }).deltaPct).toBeNull();
  });

  it("STREAK events only emit on milestone counts (7/14/30/...)", () => {
    const out = buildFeedEvents({
      streaks: [
        {
          athleteId: "a1",
          athleteName: "Ana",
          lastEventAt: "2026-04-28T12:00:00.000Z",
          count: 6,
          streakType: "ATTENDANCE",
        },
        {
          athleteId: "a1",
          athleteName: "Ana",
          lastEventAt: "2026-04-29T12:00:00.000Z",
          count: 7,
          streakType: "ATTENDANCE",
        },
      ],
    });
    expect(out).toHaveLength(1);
    expect(out[0].type).toBe("STREAK");
    expect((out[0].payload as { count: number }).count).toBe(7);
  });

  it("FIRST_SCORE only when isFirstEver=true", () => {
    const out = buildFeedEvents({
      firstScores: [
        {
          athleteId: "a1",
          athleteName: "Ana",
          createdAt: "2026-04-28T12:00:00.000Z",
          wodName: "Fran",
          scoreId: "s1",
          isFirstEver: false,
        },
        {
          athleteId: "a2",
          athleteName: "Beto",
          createdAt: "2026-04-29T12:00:00.000Z",
          wodName: "Cindy",
          scoreId: "s2",
          isFirstEver: true,
        },
      ],
    });
    expect(out).toHaveLength(1);
    expect(out[0].type).toBe("FIRST_SCORE");
    expect(out[0].athleteId).toBe("a2");
  });

  it("sorts events descending by ts", () => {
    const out = buildFeedEvents({
      prs: [
        {
          athleteId: "a1",
          athleteName: "Ana",
          achievedAt: "2026-01-01T00:00:00.000Z",
          movementName: "M1",
          value: 100,
          unit: "kg",
          prevBest: 95,
        },
        {
          athleteId: "a1",
          athleteName: "Ana",
          achievedAt: "2026-04-01T00:00:00.000Z",
          movementName: "M2",
          value: 100,
          unit: "kg",
          prevBest: 95,
        },
      ],
    });
    expect(out[0].ts > out[1].ts).toBe(true);
  });

  it("dedups same-day same-type events on same movement", () => {
    const out = buildFeedEvents({
      prs: [
        {
          athleteId: "a1",
          athleteName: "Ana",
          achievedAt: "2026-04-28T08:00:00.000Z",
          movementName: "Snatch",
          value: 60,
          unit: "kg",
          prevBest: 55,
        },
        {
          athleteId: "a1",
          athleteName: "Ana",
          achievedAt: "2026-04-28T18:00:00.000Z",
          movementName: "Snatch",
          value: 62,
          unit: "kg",
          prevBest: 60,
        },
      ],
    });
    expect(out).toHaveLength(1);
  });

  it("respects since cursor", () => {
    const out = buildFeedEvents({
      prs: [
        {
          athleteId: "a1",
          athleteName: "Ana",
          achievedAt: "2026-01-01T00:00:00.000Z",
          movementName: "M1",
          value: 100,
          unit: "kg",
          prevBest: 95,
        },
        {
          athleteId: "a1",
          athleteName: "Ana",
          achievedAt: "2026-04-01T00:00:00.000Z",
          movementName: "M2",
          value: 100,
          unit: "kg",
          prevBest: 95,
        },
      ],
      since: "2026-03-01T00:00:00.000Z",
    });
    expect(out).toHaveLength(1);
    expect((out[0].payload as { movementName: string }).movementName).toBe(
      "M2",
    );
  });
});
