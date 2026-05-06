import { describe, expect, it } from "vitest";
import {
  buildFormAnalysisPrompt,
  fallbackFeedback,
  parseFormFeedback,
  FORM_ANALYSIS_DISCLAIMER,
} from "@/lib/ai/form-analysis";

describe("buildFormAnalysisPrompt", () => {
  it("includes the movement and JSON-only instruction", () => {
    const prompt = buildFormAnalysisPrompt({
      movementName: "Snatch",
      movementCategory: "OLYMPIC",
      athleteFirstName: "Sam",
    });
    expect(prompt).toContain("Snatch");
    expect(prompt).toContain("JSON válido");
    expect(prompt).toContain("safetyFlags");
  });

  it("instructs no medical advice and no emojis", () => {
    const prompt = buildFormAnalysisPrompt({
      movementName: "Deadlift",
      movementCategory: "STRENGTH",
      athleteFirstName: null,
    });
    expect(prompt).toContain("NUNCA des consejo médico");
    expect(prompt).toContain("Sin emojis");
  });
});

describe("parseFormFeedback", () => {
  it("parses valid feedback JSON", () => {
    const raw = JSON.stringify({
      overallScore: "good",
      strengths: ["torso vertical", "ROM completo"],
      improvements: ["codos más altos"],
      safetyFlags: [],
      summary: "Buena ejecución general.",
    });
    const result = parseFormFeedback(raw);
    expect(result).not.toBeNull();
    expect(result!.overallScore).toBe("good");
    expect(result!.strengths).toHaveLength(2);
    expect(result!.improvements).toHaveLength(1);
    expect(result!.source).toBe("ai");
  });

  it("strips markdown fences", () => {
    const raw =
      '```json\n{"overallScore":"fair","strengths":[],"improvements":[],"safetyFlags":[],"summary":"ok"}\n```';
    const result = parseFormFeedback(raw);
    expect(result).not.toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(parseFormFeedback("garbage {")).toBeNull();
  });

  it("falls back to 'fair' for unknown overallScore", () => {
    const raw = JSON.stringify({ overallScore: "amazing" });
    const result = parseFormFeedback(raw);
    expect(result!.overallScore).toBe("fair");
  });

  it("filters non-string entries from arrays", () => {
    const raw = JSON.stringify({
      overallScore: "good",
      strengths: ["valid", 123, null, "another"],
      summary: "ok",
    });
    const result = parseFormFeedback(raw);
    expect(result!.strengths).toEqual(["valid", "another"]);
  });

  it("uses default summary if missing", () => {
    const raw = JSON.stringify({ overallScore: "good" });
    const result = parseFormFeedback(raw);
    expect(result!.summary).toBeTruthy();
  });
});

describe("fallbackFeedback", () => {
  it("returns 'unable' with given reason", () => {
    const fb = fallbackFeedback("Sin GEMINI_API_KEY configurado");
    expect(fb.overallScore).toBe("unable");
    expect(fb.summary).toContain("GEMINI_API_KEY");
    expect(fb.source).toBe("fallback");
  });
});

describe("FORM_ANALYSIS_DISCLAIMER", () => {
  it("clearly states it's not medical advice", () => {
    expect(FORM_ANALYSIS_DISCLAIMER.toLowerCase()).toContain("informativo");
    expect(FORM_ANALYSIS_DISCLAIMER.toLowerCase()).toContain("médico");
  });
});
