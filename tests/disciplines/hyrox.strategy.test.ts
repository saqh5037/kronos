import { describe, expect, it } from "vitest";
import { HyroxStrategy, HYROX_SESSION_TYPES } from "@/lib/disciplines/hyrox";

describe("HyroxStrategy", () => {
  describe("supported* metadata", () => {
    it("solo soporta TIME como measurement (Hyrox = race)", () => {
      expect(HyroxStrategy.supportedMeasurements).toEqual(["TIME"]);
    });

    it("supportedSessionTypes incluye HYROX_RACE/DOUBLES/PRO/RELAY/TRAINING", () => {
      expect(HYROX_SESSION_TYPES).toEqual(
        expect.arrayContaining([
          "HYROX_RACE",
          "HYROX_DOUBLES",
          "HYROX_PRO",
          "HYROX_RELAY",
          "HYROX_TRAINING",
        ]),
      );
    });

    it("leaderboardSortKey es PR (tiempo total ranking)", () => {
      expect(HyroxStrategy.leaderboardSortKey).toBe("PR");
    });
  });

  describe("validateSessionPayload", () => {
    it("acepta HYROX_RACE con stations completas", () => {
      expect(
        HyroxStrategy.validateSessionPayload({
          type: "HYROX_RACE",
          stations: [
            "ski",
            "sled-push",
            "sled-pull",
            "burpee-broad",
            "row",
            "farmer",
            "sandbag-lunges",
            "wall-balls",
          ],
        }),
      ).toEqual({ ok: true });
    });

    it("rechaza HYROX_RACE sin stations", () => {
      expect(
        HyroxStrategy.validateSessionPayload({ type: "HYROX_RACE" }),
      ).toEqual({
        ok: false,
        error: expect.stringContaining("stations"),
      });
    });

    it("rechaza stationId inválido", () => {
      expect(
        HyroxStrategy.validateSessionPayload({
          type: "HYROX_RACE",
          stations: ["ski", "NOT_A_REAL_STATION"],
        }),
      ).toEqual({
        ok: false,
        error: expect.stringContaining("inválido"),
      });
    });

    it("HYROX_TRAINING permite sin stations", () => {
      expect(
        HyroxStrategy.validateSessionPayload({ type: "HYROX_TRAINING" }),
      ).toEqual({ ok: true });
    });

    it("rechaza type CrossFit (ej. AMRAP)", () => {
      expect(HyroxStrategy.validateSessionPayload({ type: "AMRAP" })).toEqual({
        ok: false,
        error: expect.stringContaining("inválido"),
      });
    });
  });

  describe("validateScorePayload", () => {
    it("acepta totalSeconds positivo", () => {
      expect(
        HyroxStrategy.validateScorePayload(
          { totalSeconds: 3900 },
          "HYROX_RACE",
          "TIME",
        ),
      ).toEqual({ ok: true });
    });

    it("rechaza scoreType distinto a TIME", () => {
      expect(
        HyroxStrategy.validateScorePayload(
          { reps: 100 },
          "HYROX_TRAINING",
          "REPS",
        ),
      ).toEqual({
        ok: false,
        error: expect.stringContaining("TIME"),
      });
    });

    it("rechaza totalSeconds 0 o negativo", () => {
      expect(
        HyroxStrategy.validateScorePayload(
          { totalSeconds: 0 },
          "HYROX_RACE",
          "TIME",
        ),
      ).toEqual({ ok: false, error: expect.any(String) });
    });

    it("acepta splits válidos opcionales", () => {
      expect(
        HyroxStrategy.validateScorePayload(
          {
            totalSeconds: 4200,
            splits: { ski: 280, "sled-push": 95, row: 240 },
          },
          "HYROX_RACE",
          "TIME",
        ),
      ).toEqual({ ok: true });
    });

    it("rechaza splits con stationId inválido", () => {
      expect(
        HyroxStrategy.validateScorePayload(
          {
            totalSeconds: 4200,
            splits: { FAKE_STATION: 100 },
          },
          "HYROX_RACE",
          "TIME",
        ),
      ).toEqual({
        ok: false,
        error: expect.stringContaining("FAKE_STATION"),
      });
    });

    it("rechaza split con tiempo no-positivo", () => {
      expect(
        HyroxStrategy.validateScorePayload(
          {
            totalSeconds: 4200,
            splits: { ski: -1 },
          },
          "HYROX_RACE",
          "TIME",
        ),
      ).toEqual({ ok: false, error: expect.any(String) });
    });
  });

  describe("formatScore", () => {
    it("TIME formatea totalSeconds como m:ss", () => {
      expect(HyroxStrategy.formatScore({ totalSeconds: 3900 }, "TIME")).toBe(
        "65:00",
      );
    });

    it("scoreType no-TIME devuelve —", () => {
      expect(HyroxStrategy.formatScore({ totalSeconds: 3900 }, "REPS")).toBe(
        "—",
      );
    });

    it("payload sin totalSeconds devuelve —", () => {
      expect(HyroxStrategy.formatScore({}, "TIME")).toBe("—");
    });
  });

  describe("detectPR + isBetterScore", () => {
    it("TIME asc: race más rápida es PR", () => {
      expect(HyroxStrategy.detectPR(3900, 3800, "TIME")).toBe(3800);
      expect(HyroxStrategy.detectPR(3800, 3900, "TIME")).toBe(null);
    });

    it("primer race siempre es PR", () => {
      expect(HyroxStrategy.detectPR(null, 4500, "TIME")).toBe(4500);
    });
  });
});
