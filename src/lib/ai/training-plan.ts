export type TrainingPlanInputs = {
  athleteFirstName: string;
  goalMetric: "PR" | "TONNAGE" | "ATTENDANCE";
  goalMovementName: string | null;
  goalTargetValue: number;
  goalStartValue: number | null;
  goalUnit: string;
  goalDeadline: Date;
  weeksAvailable: number;
  weeklyTrainingFrequency: number; // sessions/week historical
  recentPRs: Array<{ movementName: string; value: number; daysAgo: number }>;
  todayDate: Date;
};

export type WeekPlan = {
  weekNumber: number;
  focus: string;
  sessions: Array<{ day: string; type: string; description: string }>;
  notes: string;
};

export type TrainingPlan = {
  weeks: WeekPlan[];
  overview: string;
  source: "ai" | "fallback";
};

export function buildTrainingPlanPrompt(inputs: TrainingPlanInputs): string {
  const lines = [
    "Eres el coach virtual de Kronos. Vas a generar un plan de 12 semanas (o el número de semanas disponibles) en JSON estricto para un atleta de CrossFit.",
    "",
    "REGLAS:",
    "- Responde SOLO JSON válido, sin markdown ni texto antes/después.",
    "- Estructura del JSON:",
    "  {",
    '    "overview": "frase corta de 1-2 líneas sobre la estrategia",',
    '    "weeks": [',
    "      {",
    '        "weekNumber": 1,',
    '        "focus": "fuerza base | potencia | volumen | competición | descarga | etc",',
    '        "sessions": [{ "day": "Lun", "type": "Fuerza | Met-Con | Recovery", "description": "frase corta del WOD/foco" }],',
    '        "notes": "consejo breve para esta semana"',
    "      }",
    "    ]",
    "  }",
    "- weekNumber empieza en 1.",
    `- Programa exactamente ${inputs.weeksAvailable} semanas.`,
    "- Por semana, programa entre 3 y 5 sesiones según frequency histórica del atleta.",
    "- Incluye al menos 1 semana de descarga cada 4 semanas (volume bajo).",
    "- Las últimas 1-2 semanas: peak/test del objetivo.",
    "- Lenguaje en español, conciso, coach honesto. Sin emojis.",
    "",
    "DATOS DEL ATLETA Y OBJETIVO:",
    JSON.stringify(
      {
        firstName: inputs.athleteFirstName,
        goal: {
          metric: inputs.goalMetric,
          movement: inputs.goalMovementName,
          target: `${inputs.goalTargetValue} ${inputs.goalUnit}`,
          start: inputs.goalStartValue
            ? `${inputs.goalStartValue} ${inputs.goalUnit}`
            : "no registrado",
          deadline: inputs.goalDeadline.toISOString().slice(0, 10),
          weeksAvailable: inputs.weeksAvailable,
        },
        weeklyFrequency: inputs.weeklyTrainingFrequency,
        recentPRs: inputs.recentPRs.slice(0, 5),
        today: inputs.todayDate.toISOString().slice(0, 10),
      },
      null,
      2,
    ),
  ];
  return lines.join("\n");
}

export function buildFallbackPlan(inputs: TrainingPlanInputs): TrainingPlan {
  const weeks: WeekPlan[] = [];
  const total = Math.max(1, Math.min(12, inputs.weeksAvailable));
  const freq = Math.min(5, Math.max(3, inputs.weeklyTrainingFrequency || 3));

  for (let i = 1; i <= total; i++) {
    const isDeload = i % 4 === 0 && i !== total;
    const isPeak = i >= total - 1;
    const focus = isPeak
      ? "Peak / test"
      : isDeload
        ? "Descarga"
        : i <= total / 3
          ? "Fuerza base"
          : i <= (total * 2) / 3
            ? "Volumen + técnica"
            : "Potencia + tempo";
    const sessions = Array.from({ length: freq }, (_, k) => ({
      day: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][k] ?? "—",
      type: k % 2 === 0 ? "Fuerza" : "Met-Con",
      description: isDeload
        ? "Volumen bajo, técnica"
        : isPeak
          ? "Test de objetivo + auxiliares ligeros"
          : "Foco semanal + accesorios",
    }));
    weeks.push({
      weekNumber: i,
      focus,
      sessions,
      notes: isDeload
        ? "Semana de descarga: 50-60% volumen, prioriza recovery."
        : isPeak
          ? "Llega fresco, calienta bien, intenta el target."
          : "Mantén consistencia, registra todos los lifts.",
    });
  }

  return {
    weeks,
    overview: `Plan determinístico de ${total} semanas para alcanzar ${inputs.goalTargetValue} ${inputs.goalUnit}${inputs.goalMovementName ? ` en ${inputs.goalMovementName}` : ""}. Sin IA — usa esto como guía base.`,
    source: "fallback",
  };
}

export function parseGeminiPlan(raw: string): TrainingPlan | null {
  try {
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?/, "")
      .replace(/```$/, "")
      .trim();
    const parsed = JSON.parse(cleaned) as {
      overview?: string;
      weeks?: Array<{
        weekNumber?: number;
        focus?: string;
        sessions?: Array<{ day?: string; type?: string; description?: string }>;
        notes?: string;
      }>;
    };
    if (
      !parsed.weeks ||
      !Array.isArray(parsed.weeks) ||
      parsed.weeks.length === 0
    ) {
      return null;
    }
    const weeks: WeekPlan[] = parsed.weeks.map((w, i) => ({
      weekNumber: typeof w.weekNumber === "number" ? w.weekNumber : i + 1,
      focus: typeof w.focus === "string" ? w.focus : "Foco semanal",
      sessions: Array.isArray(w.sessions)
        ? w.sessions.map((s) => ({
            day: typeof s.day === "string" ? s.day : "—",
            type: typeof s.type === "string" ? s.type : "—",
            description: typeof s.description === "string" ? s.description : "",
          }))
        : [],
      notes: typeof w.notes === "string" ? w.notes : "",
    }));
    return {
      weeks,
      overview:
        typeof parsed.overview === "string"
          ? parsed.overview
          : "Plan generado.",
      source: "ai",
    };
  } catch (err) {
    console.error("[ai.training-plan] parse failed:", err);
    return null;
  }
}

export function weeksAvailableUntil(
  deadline: Date,
  today: Date = new Date(),
): number {
  const diffMs = deadline.getTime() - today.getTime();
  const weeks = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 7));
  return Math.max(1, Math.min(12, weeks));
}
