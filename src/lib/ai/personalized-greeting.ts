export type GreetingContext = {
  firstName: string;
  attendanceStreakDays: number;
  weekAttendance: number;
  weekGoal: number;
  lastPRDaysAgo: number | null;
  todayReadiness: "low" | "mid" | "high" | null;
  nextClass: {
    startsAt: Date;
    wodName: string | null;
    coachName: string | null;
  } | null;
};

export type GreetingTone =
  | "push"
  | "maintain"
  | "recover"
  | "comeback"
  | "celebrate";

export type GreetingComputed = {
  tone: GreetingTone;
  fallbackText: string;
  promptInputs: Record<string, string | number | boolean | null>;
};

const PLATEAU_DAYS = 21;

export function computeGreetingTone(ctx: GreetingContext): GreetingTone {
  if (ctx.todayReadiness === "low") return "recover";
  if (ctx.attendanceStreakDays === 0 && ctx.weekAttendance === 0)
    return "comeback";
  if (ctx.lastPRDaysAgo !== null && ctx.lastPRDaysAgo <= 3) return "celebrate";
  if (ctx.todayReadiness === "high" && ctx.attendanceStreakDays >= 2)
    return "push";
  return "maintain";
}

export function buildPromptInputs(
  ctx: GreetingContext,
): Record<string, string | number | boolean | null> {
  const wodName = ctx.nextClass?.wodName ?? null;
  return {
    firstName: ctx.firstName,
    streakDays: ctx.attendanceStreakDays,
    weekProgress: `${ctx.weekAttendance}/${ctx.weekGoal}`,
    daysSinceLastPR: ctx.lastPRDaysAgo,
    plateau: ctx.lastPRDaysAgo !== null && ctx.lastPRDaysAgo > PLATEAU_DAYS,
    readinessToday: ctx.todayReadiness,
    nextClassWod: wodName,
    // Benchmark WODs are named after people (Helen, Murph, Fran, Chelsea…).
    // Without this flag the model writes sentences like "es hora de que Helen
    // sienta tu nuevo PR" — audit 2026-09-15, P2 copy on /atleta.
    nextClassWodIsBenchmarkName: wodName !== null,
    nextClassCoach: ctx.nextClass?.coachName ?? null,
    nextClassWhen: ctx.nextClass
      ? formatRelative(ctx.nextClass.startsAt)
      : null,
  };
}

export function buildFallbackText(ctx: GreetingContext): string {
  const tone = computeGreetingTone(ctx);
  const name = ctx.firstName;
  switch (tone) {
    case "celebrate":
      return `${name}, ${ctx.lastPRDaysAgo === 0 ? "hoy hiciste PR" : `PR hace ${ctx.lastPRDaysAgo} día${ctx.lastPRDaysAgo === 1 ? "" : "s"}`}. Sigue así.`;
    case "comeback":
      return `${name}, te extrañamos. Hoy puede ser el día.`;
    case "push":
      return `${name}, llevas ${ctx.attendanceStreakDays} días seguidos. Buen día para ir fuerte.`;
    case "recover":
      return `${name}, hoy reportaste energía baja. Activa recovery, mañana das más.`;
    case "maintain":
    default: {
      const wp = `${ctx.weekAttendance}/${ctx.weekGoal} esta semana`;
      if (ctx.lastPRDaysAgo !== null && ctx.lastPRDaysAgo > PLATEAU_DAYS) {
        return `${name}, vas ${wp}. Sin PR en ${ctx.lastPRDaysAgo} días — esta semana puede romper la racha.`;
      }
      return `${name}, vas ${wp}. Mantén el ritmo.`;
    }
  }
}

export function buildGeminiPrompt(ctx: GreetingContext): string {
  const inputs = buildPromptInputs(ctx);
  const tone = computeGreetingTone(ctx);
  const wodName = ctx.nextClass?.wodName ?? null;
  const lines = [
    "Eres el coach virtual de Kronos. Genera UNA frase corta (máximo 18 palabras) en español, motivadora pero NO genérica.",
    "La frase DEBE referenciar al menos 2 datos concretos del atleta para sentirse personal.",
    "No uses emojis. No uses signos de exclamación dobles. Estilo coach honesto, no marketing.",
    "Español de México, trato de tú. Nunca voseo (nada de 'dale', 'tenés', 'podés', 'acordate').",
    ...(wodName
      ? [
          `IMPORTANTE: "${wodName}" es el nombre de un WOD, no es una persona.`,
          `Los WODs benchmark llevan nombre propio (Helen, Murph, Fran). Nunca conviertas "${wodName}" en sujeto de la frase: no puede sentir, pedir, esperar ni reaccionar.`,
          `Escribe "entra a ${wodName}", "hoy toca ${wodName}" o "${wodName} a las <hora>", nunca "${wodName} siente/quiere/te espera".`,
        ]
      : []),
    "",
    `Tono sugerido: ${tone}`,
    "",
    "Datos del atleta:",
    JSON.stringify(inputs, null, 2),
    "",
    "Devuelve SOLO la frase, sin comillas ni preámbulo.",
  ];
  return lines.join("\n");
}

/**
 * Verbs that turn a WOD name into an animate subject. Matched right after the
 * WOD name (allowing "te/se/me/lo/la" clitics and one filler word) — that is
 * the exact shape the audit caught: "Helen sienta tu nuevo PR".
 */
const PERSONIFYING_VERBS = [
  "sient\\w*",
  "quier\\w*",
  "esper\\w*",
  "pid\\w*",
  "ped\\w*",
  "dese\\w*",
  "necesit\\w*",
  "extrañ\\w*",
  "conoc\\w*",
  "salud\\w*",
  "reacion\\w*",
  "reaccion\\w*",
  "va a ",
  "está list\\w*",
  "piens\\w*",
  "sabe",
  "cre\\w*",
  "dice",
  "habl\\w*",
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * True when the generated greeting is safe to show.
 *
 * Guards two failure modes seen in production:
 *  - empty / whitespace-only model output;
 *  - the next class's WOD name used as an animate subject.
 */
export function isSafeGreeting(text: string, ctx: GreetingContext): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 4) return false;

  const wodName = ctx.nextClass?.wodName?.trim();
  if (!wodName) return true;

  const name = escapeRegExp(wodName);
  const clitics = "(?:\\s+(?:te|se|me|nos|lo|la|le|les))?";
  const verbs = PERSONIFYING_VERBS.join("|");
  // "Helen sienta…", "Helen te va a pedir…", "que Murph quiere…"
  const personified = new RegExp(
    `\\b${name}\\b${clitics}(?:\\s+\\w+)?\\s+(?:${verbs})`,
    "i",
  );
  return !personified.test(trimmed);
}

/**
 * Returns the model text when it is safe, otherwise the deterministic
 * fallback. The athlete never sees a sentence where the workout is a person.
 */
export function sanitizeGreeting(text: string, ctx: GreetingContext): string {
  return isSafeGreeting(text, ctx) ? text.trim() : buildFallbackText(ctx);
}

export function computeGreeting(ctx: GreetingContext): GreetingComputed {
  return {
    tone: computeGreetingTone(ctx),
    fallbackText: buildFallbackText(ctx),
    promptInputs: buildPromptInputs(ctx),
  };
}

function formatRelative(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60000);
  const diffH = Math.round(diffMin / 60);
  if (diffMin < 0) return "ya empezó";
  if (diffMin < 60) return `en ${diffMin} min`;
  if (diffH < 24) return `en ${diffH}h`;
  const diffD = Math.round(diffH / 24);
  return diffD === 1 ? "mañana" : `en ${diffD} días`;
}
