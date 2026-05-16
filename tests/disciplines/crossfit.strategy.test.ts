import { describe, expect, it } from "vitest";
import {
  CrossfitStrategy,
  CROSSFIT_SESSION_TYPES,
} from "@/lib/disciplines/crossfit";

describe("CrossfitStrategy", () => {
  describe("supportedMeasurements + supportedSessionTypes", () => {
    it("declara TIME/REPS/WEIGHT/ROUNDS_REPS como measurements", () => {
      expect(CrossfitStrategy.supportedMeasurements).toEqual(
        expect.arrayContaining(["TIME", "REPS", "WEIGHT", "ROUNDS_REPS"]),
      );
    });

    it("supportedSessionTypes incluye AMRAP/EMOM/FORTIME/TABATA", () => {
      expect(CROSSFIT_SESSION_TYPES).toEqual(
        expect.arrayContaining(["AMRAP", "EMOM", "FORTIME", "TABATA"]),
      );
    });

    it("leaderboardSortKey es PR", () => {
      expect(CrossfitStrategy.leaderboardSortKey).toBe("PR");
    });
  });

  describe("validateSessionPayload", () => {
    it("acepta AMRAP válido", () => {
      expect(
        CrossfitStrategy.validateSessionPayload({ type: "AMRAP" }),
      ).toEqual({
        ok: true,
      });
    });

    it("rechaza payload no-objeto", () => {
      expect(CrossfitStrategy.validateSessionPayload("not an object")).toEqual({
        ok: false,
        error: expect.stringContaining("objeto"),
      });
    });

    it("rechaza payload sin type", () => {
      expect(CrossfitStrategy.validateSessionPayload({})).toEqual({
        ok: false,
        error: expect.stringContaining("type"),
      });
    });

    it("rechaza type inválido para CrossFit (ej. HYROX_RACE)", () => {
      const result = CrossfitStrategy.validateSessionPayload({
        type: "HYROX_RACE",
      });
      expect(result).toEqual({
        ok: false,
        error: expect.stringContaining("inválido"),
      });
    });

    it("rechaza array como payload", () => {
      expect(CrossfitStrategy.validateSessionPayload([])).toEqual({
        ok: false,
        error: expect.any(String),
      });
    });
  });

  describe("validateScorePayload — TIME (Fran-style)", () => {
    it("acepta valueSeconds positivo", () => {
      expect(
        CrossfitStrategy.validateScorePayload(
          { valueSeconds: 250 },
          "FORTIME",
          "TIME",
        ),
      ).toEqual({ ok: true });
    });

    it("rechaza valueSeconds 0 o negativo", () => {
      expect(
        CrossfitStrategy.validateScorePayload(
          { valueSeconds: 0 },
          "FORTIME",
          "TIME",
        ),
      ).toEqual({ ok: false, error: expect.any(String) });
      expect(
        CrossfitStrategy.validateScorePayload(
          { valueSeconds: -10 },
          "FORTIME",
          "TIME",
        ),
      ).toEqual({ ok: false, error: expect.any(String) });
    });

    it("rechaza sin valueSeconds", () => {
      expect(
        CrossfitStrategy.validateScorePayload({}, "FORTIME", "TIME"),
      ).toEqual({ ok: false, error: expect.any(String) });
    });
  });

  describe("validateScorePayload — REPS / WEIGHT / ROUNDS_REPS", () => {
    it("REPS acepta 0 (ej. WOD sin completar)", () => {
      expect(
        CrossfitStrategy.validateScorePayload({ reps: 0 }, "AMRAP", "REPS"),
      ).toEqual({ ok: true });
    });

    it("WEIGHT requiere positivo", () => {
      expect(
        CrossfitStrategy.validateScorePayload(
          { weight: 100 },
          "STRENGTH",
          "WEIGHT",
        ),
      ).toEqual({ ok: true });
      expect(
        CrossfitStrategy.validateScorePayload(
          { weight: 0 },
          "STRENGTH",
          "WEIGHT",
        ),
      ).toEqual({ ok: false, error: expect.any(String) });
    });

    it("ROUNDS_REPS válido con rounds + partialReps", () => {
      expect(
        CrossfitStrategy.validateScorePayload(
          { rounds: 5, partialReps: 12 },
          "AMRAP",
          "ROUNDS_REPS",
        ),
      ).toEqual({ ok: true });
    });

    it("ROUNDS_REPS válido sin partialReps (default 0)", () => {
      expect(
        CrossfitStrategy.validateScorePayload(
          { rounds: 5 },
          "AMRAP",
          "ROUNDS_REPS",
        ),
      ).toEqual({ ok: true });
    });
  });

  describe("formatScore", () => {
    it("TIME formatea m:ss", () => {
      expect(CrossfitStrategy.formatScore({ valueSeconds: 247 }, "TIME")).toBe(
        "4:07",
      );
    });

    it("REPS formatea con sufijo", () => {
      expect(CrossfitStrategy.formatScore({ reps: 42 }, "REPS")).toBe(
        "42 reps",
      );
    });

    it("WEIGHT formatea con kg", () => {
      expect(CrossfitStrategy.formatScore({ weight: 100 }, "WEIGHT")).toBe(
        "100 kg",
      );
    });

    it("ROUNDS_REPS formatea como rounds+partial", () => {
      expect(
        CrossfitStrategy.formatScore(
          { rounds: 5, partialReps: 12 },
          "ROUNDS_REPS",
        ),
      ).toBe("5+12");
    });

    it("devuelve — si payload incompleto", () => {
      expect(CrossfitStrategy.formatScore({}, "TIME")).toBe("—");
      expect(CrossfitStrategy.formatScore({}, "REPS")).toBe("—");
    });
  });

  describe("detectPR + isBetterScore (delegan a helpers legacy)", () => {
    it("TIME: candidate menor es PR", () => {
      expect(CrossfitStrategy.detectPR(250, 240, "TIME")).toBe(240);
      expect(CrossfitStrategy.detectPR(240, 250, "TIME")).toBe(null);
    });

    it("WEIGHT: candidate mayor es PR", () => {
      expect(CrossfitStrategy.detectPR(100, 110, "WEIGHT")).toBe(110);
      expect(CrossfitStrategy.detectPR(110, 100, "WEIGHT")).toBe(null);
    });

    it("sin previousPR (null), candidate siempre es PR", () => {
      expect(CrossfitStrategy.detectPR(null, 1, "TIME")).toBe(1);
      expect(CrossfitStrategy.detectPR(null, 1, "REPS")).toBe(1);
    });

    it("isBetterScore: TIME asc, WEIGHT desc", () => {
      expect(CrossfitStrategy.isBetterScore(250, 240, "TIME")).toBe(true);
      expect(CrossfitStrategy.isBetterScore(100, 110, "WEIGHT")).toBe(true);
      expect(CrossfitStrategy.isBetterScore(110, 100, "WEIGHT")).toBe(false);
    });
  });
});
