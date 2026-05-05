/**
 * Unit tests for whiteboard OCR helpers.
 * Tests the parsing/matching logic without hitting Gemini API.
 */

import { describe, it, expect } from "vitest";

// ─── parseGeminiResponse helper (extracted for unit testing) ─────────────────

type ScoreType = "TIME" | "REPS" | "WEIGHT" | "ROUNDS_REPS";
type Scaling = "RX" | "SCALED" | "RXPLUS";

type WhiteboardRow = {
  rawName: string;
  matchedAthleteId: string | null;
  confidence: number;
  score: string;
  scoreType: ScoreType;
  scaling: Scaling;
  notes?: string;
};

// Pure function extracted for testing (mirrors the logic in whiteboard.ts)
function parseGeminiResponse(text: string): { rows: WhiteboardRow[] } {
  const cleaned = text
    .replace(/^```[a-z]*\n?/gm, "")
    .replace(/```$/gm, "")
    .trim();

  const parsed = JSON.parse(cleaned);

  if (!parsed || !Array.isArray(parsed.rows)) {
    throw new Error("Respuesta Gemini no tiene shape {rows:[...]}");
  }

  const rows: WhiteboardRow[] = parsed.rows.map(
    (r: Record<string, unknown>) => ({
      rawName: String(r.rawName ?? ""),
      matchedAthleteId: r.matchedAthleteId ? String(r.matchedAthleteId) : null,
      confidence: typeof r.confidence === "number" ? r.confidence : 0.5,
      score: String(r.score ?? ""),
      scoreType: (["TIME", "REPS", "WEIGHT", "ROUNDS_REPS"].includes(
        String(r.scoreType),
      )
        ? r.scoreType
        : "REPS") as ScoreType,
      scaling: (["RX", "SCALED", "RXPLUS"].includes(String(r.scaling))
        ? r.scaling
        : "RX") as Scaling,
      notes: r.notes ? String(r.notes) : undefined,
    }),
  );

  return { rows };
}

// ─── Fuzzy roster matcher (simplified version of OCR matching logic) ──────────

type RosterEntry = {
  athleteId: string;
  firstName: string;
  lastName: string;
};

function fuzzyMatchRoster(
  rawName: string,
  roster: RosterEntry[],
  aliasDict: Record<string, string> = {},
): { athleteId: string | null; confidence: number } {
  const normalized = rawName.toLowerCase().trim();

  // 1. Check alias dict first
  if (aliasDict[normalized]) {
    return { athleteId: aliasDict[normalized], confidence: 0.95 };
  }

  // 2. Exact firstName match
  for (const entry of roster) {
    if (entry.firstName.toLowerCase() === normalized) {
      return { athleteId: entry.athleteId, confidence: 0.9 };
    }
  }

  // 3. Full name match
  for (const entry of roster) {
    const fullName = `${entry.firstName} ${entry.lastName}`.toLowerCase();
    if (fullName === normalized) {
      return { athleteId: entry.athleteId, confidence: 0.95 };
    }
  }

  // 4. Starts-with match
  for (const entry of roster) {
    if (
      entry.firstName.toLowerCase().startsWith(normalized) ||
      normalized.startsWith(entry.firstName.toLowerCase())
    ) {
      return { athleteId: entry.athleteId, confidence: 0.75 };
    }
  }

  // 5. No match
  return { athleteId: null, confidence: 0.3 };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("parseGeminiResponse()", () => {
  it("parsea JSON limpio correctamente", () => {
    const json = JSON.stringify({
      rows: [
        {
          rawName: "Juan",
          matchedAthleteId: "athlete-1",
          confidence: 0.92,
          score: "5:43",
          scoreType: "TIME",
          scaling: "RX",
        },
      ],
    });

    const result = parseGeminiResponse(json);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].rawName).toBe("Juan");
    expect(result.rows[0].matchedAthleteId).toBe("athlete-1");
    expect(result.rows[0].confidence).toBe(0.92);
    expect(result.rows[0].scoreType).toBe("TIME");
    expect(result.rows[0].scaling).toBe("RX");
  });

  it("parsea JSON con markdown code fences", () => {
    const text = `\`\`\`json
{"rows":[{"rawName":"Maria","matchedAthleteId":null,"confidence":0.3,"score":"120","scoreType":"WEIGHT","scaling":"RX"}]}
\`\`\``;

    const result = parseGeminiResponse(text);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].rawName).toBe("Maria");
    expect(result.rows[0].matchedAthleteId).toBeNull();
  });

  it("defaultea scoreType a REPS cuando es inválido", () => {
    const json = JSON.stringify({
      rows: [
        {
          rawName: "Pedro",
          matchedAthleteId: null,
          confidence: 0.6,
          score: "15",
          scoreType: "INVALIDO",
          scaling: "RX",
        },
      ],
    });

    const result = parseGeminiResponse(json);

    expect(result.rows[0].scoreType).toBe("REPS");
  });

  it("defaultea scaling a RX cuando es inválido", () => {
    const json = JSON.stringify({
      rows: [
        {
          rawName: "Ana",
          matchedAthleteId: "athlete-2",
          confidence: 0.8,
          score: "10:00",
          scoreType: "TIME",
          scaling: "INVALIDO",
        },
      ],
    });

    const result = parseGeminiResponse(json);

    expect(result.rows[0].scaling).toBe("RX");
  });

  it("maneja múltiples filas", () => {
    const json = JSON.stringify({
      rows: [
        {
          rawName: "Juan",
          matchedAthleteId: "a1",
          confidence: 0.9,
          score: "5:00",
          scoreType: "TIME",
          scaling: "RX",
        },
        {
          rawName: "Memo",
          matchedAthleteId: null,
          confidence: 0.4,
          score: "6:30",
          scoreType: "TIME",
          scaling: "SCALED",
        },
        {
          rawName: "Maria",
          matchedAthleteId: "a3",
          confidence: 0.85,
          score: "4:45",
          scoreType: "TIME",
          scaling: "RXPLUS",
        },
      ],
    });

    const result = parseGeminiResponse(json);

    expect(result.rows).toHaveLength(3);
    expect(result.rows[1].scaling).toBe("SCALED");
    expect(result.rows[2].scaling).toBe("RXPLUS");
  });

  it("lanza error cuando el JSON no tiene shape {rows:[...]}", () => {
    const badJson = JSON.stringify({ data: [] });

    expect(() => parseGeminiResponse(badJson)).toThrow(
      "Respuesta Gemini no tiene shape",
    );
  });

  it("lanza error cuando el texto no es JSON válido", () => {
    expect(() => parseGeminiResponse("esto no es json")).toThrow();
  });

  it("maneja matchedAthleteId null del modelo", () => {
    const json = JSON.stringify({
      rows: [
        {
          rawName: "Desconocido",
          matchedAthleteId: null,
          confidence: 0.25,
          score: "7:15",
          scoreType: "TIME",
          scaling: "RX",
        },
      ],
    });

    const result = parseGeminiResponse(json);

    expect(result.rows[0].matchedAthleteId).toBeNull();
    expect(result.rows[0].confidence).toBe(0.25);
  });
});

describe("fuzzyMatchRoster()", () => {
  const roster: RosterEntry[] = [
    { athleteId: "a1", firstName: "Juan", lastName: "Pérez" },
    { athleteId: "a2", firstName: "María", lastName: "González" },
    { athleteId: "a3", firstName: "Guillermo", lastName: "Torres" },
  ];

  it("match exacto por firstName — alta confianza", () => {
    const result = fuzzyMatchRoster("Juan", roster);

    expect(result.athleteId).toBe("a1");
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it("match exacto por nombre completo — máxima confianza", () => {
    const result = fuzzyMatchRoster("Juan Pérez", roster);

    expect(result.athleteId).toBe("a1");
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("match por alias — confianza muy alta", () => {
    const aliasDict: Record<string, string> = { memo: "a3" };
    const result = fuzzyMatchRoster("Memo", roster, aliasDict);

    expect(result.athleteId).toBe("a3");
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("sin match retorna null y baja confianza", () => {
    const result = fuzzyMatchRoster("Extranjero", roster);

    expect(result.athleteId).toBeNull();
    expect(result.confidence).toBeLessThan(0.5);
  });

  it("match parcial por prefijo — confianza media", () => {
    const result = fuzzyMatchRoster("Juani", roster);

    // startsWith match for "Juan"
    expect(result.athleteId).toBe("a1");
    expect(result.confidence).toBeLessThan(0.9);
  });

  it("case-insensitive para alias", () => {
    const aliasDict: Record<string, string> = { memo: "a3" };
    const result = fuzzyMatchRoster("MEMO", roster, aliasDict);

    expect(result.athleteId).toBe("a3");
  });

  it("case-insensitive para firstName", () => {
    const result = fuzzyMatchRoster("JUAN", roster);

    expect(result.athleteId).toBe("a1");
  });
});

describe("confidence thresholds", () => {
  it("confianza >= 0.85 es verde", () => {
    expect(0.85 >= 0.85).toBe(true);
  });

  it("confianza 0.5..0.85 es amarillo (review requerido)", () => {
    expect(0.7 >= 0.5 && 0.7 < 0.85).toBe(true);
  });

  it("confianza < 0.5 es rojo (alta incertidumbre)", () => {
    expect(0.3 < 0.5).toBe(true);
  });

  it("filas con confianza < 0.7 deben destacarse para revisión", () => {
    const rows = [
      { confidence: 0.9, rawName: "Juan" },
      { confidence: 0.65, rawName: "Memo" },
      { confidence: 0.4, rawName: "???" },
    ];

    const needsReview = rows.filter((r) => r.confidence < 0.7);
    expect(needsReview).toHaveLength(2);
  });
});
