export type FormAnalysisInputs = {
  movementName: string;
  movementCategory: string;
  athleteFirstName: string | null;
};

export type FormFeedback = {
  overallScore: "excellent" | "good" | "fair" | "needs-work" | "unable";
  strengths: string[];
  improvements: string[];
  safetyFlags: string[];
  summary: string;
  source: "ai" | "fallback" | "error";
};

const DISCLAIMER =
  "ANÁLISIS INFORMATIVO basado en una foto. NO es consejo médico ni diagnóstico. Cualquier dolor o síntoma requiere evaluación profesional.";

export function buildFormAnalysisPrompt(inputs: FormAnalysisInputs): string {
  const lines = [
    "Eres un coach de CrossFit. Vas a analizar la foto de un atleta ejecutando un movimiento.",
    "",
    "REGLAS:",
    "- Responde SOLO JSON válido, sin markdown ni texto antes/después.",
    "- Estructura del JSON:",
    "  {",
    '    "overallScore": "excellent" | "good" | "fair" | "needs-work" | "unable",',
    '    "strengths": ["punto fuerte 1", "punto fuerte 2"],',
    '    "improvements": ["mejora 1", "mejora 2"],',
    '    "safetyFlags": ["bandera roja si la hay, ej: \\"rodilla colapsa hacia adentro\\""],',
    '    "summary": "1-2 frases de resumen"',
    "  }",
    "- Solo evalúa lo que se ve claramente en la foto.",
    '- Si la foto no es clara, usa overallScore="unable" y di qué falta ver.',
    "- Lenguaje en español, conciso, coach honesto.",
    "- NUNCA des consejo médico. Solo descripción técnica de la postura.",
    "- Si detectas postura peligrosa, ponlo en safetyFlags.",
    "- Sin emojis.",
    "",
    "DATOS:",
    JSON.stringify(
      {
        movement: inputs.movementName,
        category: inputs.movementCategory,
        athleteName: inputs.athleteFirstName,
      },
      null,
      2,
    ),
  ];
  return lines.join("\n");
}

export function parseFormFeedback(raw: string): FormFeedback | null {
  try {
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?/, "")
      .replace(/```$/, "")
      .trim();
    const parsed = JSON.parse(cleaned) as {
      overallScore?: string;
      strengths?: unknown;
      improvements?: unknown;
      safetyFlags?: unknown;
      summary?: unknown;
    };
    const validScores: Array<FormFeedback["overallScore"]> = [
      "excellent",
      "good",
      "fair",
      "needs-work",
      "unable",
    ];
    const overallScore = validScores.includes(
      parsed.overallScore as FormFeedback["overallScore"],
    )
      ? (parsed.overallScore as FormFeedback["overallScore"])
      : "fair";
    return {
      overallScore,
      strengths: Array.isArray(parsed.strengths)
        ? (parsed.strengths as unknown[]).filter(
            (s): s is string => typeof s === "string",
          )
        : [],
      improvements: Array.isArray(parsed.improvements)
        ? (parsed.improvements as unknown[]).filter(
            (s): s is string => typeof s === "string",
          )
        : [],
      safetyFlags: Array.isArray(parsed.safetyFlags)
        ? (parsed.safetyFlags as unknown[]).filter(
            (s): s is string => typeof s === "string",
          )
        : [],
      summary:
        typeof parsed.summary === "string"
          ? parsed.summary
          : "Análisis sin resumen.",
      source: "ai",
    };
  } catch (err) {
    console.error("[ai.form-analysis] parse failed:", err);
    return null;
  }
}

export function fallbackFeedback(reason: string): FormFeedback {
  return {
    overallScore: "unable",
    strengths: [],
    improvements: [],
    safetyFlags: [],
    summary: reason,
    source: "fallback",
  };
}

export const FORM_ANALYSIS_DISCLAIMER = DISCLAIMER;
