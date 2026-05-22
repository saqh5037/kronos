import { describe, expect, it } from "vitest";
import { z } from "zod";

const MAX_NOTES_LEN = 1000;
const MAX_DIVISION_LEN = 80;
const MAX_SCORE_SECONDS = 24 * 60 * 60;

const submitSchema = z.object({
  entryId: z.string().min(1),
  division: z.string().trim().min(1).max(MAX_DIVISION_LEN),
  scoreSeconds: z.number().int().min(0).max(MAX_SCORE_SECONDS),
  scoreText: z.string().trim().max(40),
  notes: z
    .string()
    .trim()
    .max(MAX_NOTES_LEN)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

describe("event submit schema (mirror of src/server/actions/events.ts)", () => {
  it("accepts a valid Murph submission", () => {
    const parsed = submitSchema.parse({
      entryId: "ckxyz",
      division: "RX",
      scoreSeconds: 32 * 60 + 45,
      scoreText: "32:45",
      notes: "Con chaleco",
    });
    expect(parsed.scoreSeconds).toBe(1965);
    expect(parsed.notes).toBe("Con chaleco");
  });

  it("collapses empty notes to null", () => {
    const parsed = submitSchema.parse({
      entryId: "ckxyz",
      division: "Scaled",
      scoreSeconds: 60,
      scoreText: "01:00",
      notes: "",
    });
    expect(parsed.notes).toBeNull();
  });

  it("collapses whitespace-only notes to null", () => {
    const parsed = submitSchema.parse({
      entryId: "ckxyz",
      division: "Scaled",
      scoreSeconds: 60,
      scoreText: "01:00",
      notes: "   ",
    });
    expect(parsed.notes).toBeNull();
  });

  it("rejects empty division", () => {
    expect(() =>
      submitSchema.parse({
        entryId: "ckxyz",
        division: "",
        scoreSeconds: 60,
        scoreText: "01:00",
      }),
    ).toThrow();
  });

  it("rejects negative scoreSeconds", () => {
    expect(() =>
      submitSchema.parse({
        entryId: "ckxyz",
        division: "RX",
        scoreSeconds: -1,
        scoreText: "—",
      }),
    ).toThrow();
  });

  it("rejects scoreSeconds beyond 24h", () => {
    expect(() =>
      submitSchema.parse({
        entryId: "ckxyz",
        division: "RX",
        scoreSeconds: MAX_SCORE_SECONDS + 1,
        scoreText: "25:00:01",
      }),
    ).toThrow();
  });

  it("rejects non-integer scoreSeconds (we store integers)", () => {
    expect(() =>
      submitSchema.parse({
        entryId: "ckxyz",
        division: "RX",
        scoreSeconds: 60.5,
        scoreText: "01:00",
      }),
    ).toThrow();
  });

  it("rejects notes over MAX_NOTES_LEN", () => {
    expect(() =>
      submitSchema.parse({
        entryId: "ckxyz",
        division: "RX",
        scoreSeconds: 60,
        scoreText: "01:00",
        notes: "x".repeat(MAX_NOTES_LEN + 1),
      }),
    ).toThrow();
  });

  it("rejects empty entryId", () => {
    expect(() =>
      submitSchema.parse({
        entryId: "",
        division: "RX",
        scoreSeconds: 60,
        scoreText: "01:00",
      }),
    ).toThrow();
  });
});
