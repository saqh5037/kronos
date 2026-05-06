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
  return {
    firstName: ctx.firstName,
    streakDays: ctx.attendanceStreakDays,
    weekProgress: `${ctx.weekAttendance}/${ctx.weekGoal}`,
    daysSinceLastPR: ctx.lastPRDaysAgo,
    plateau: ctx.lastPRDaysAgo !== null && ctx.lastPRDaysAgo > PLATEAU_DAYS,
    readinessToday: ctx.todayReadiness,
    nextClassWod: ctx.nextClass?.wodName ?? null,
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
  const lines = [
    "Eres el coach virtual de Kronos. Genera UNA frase corta (máximo 18 palabras) en español, motivadora pero NO genérica.",
    "La frase DEBE referenciar al menos 2 datos concretos del atleta para sentirse personal.",
    "No uses emojis. No uses signos de exclamación dobles. Estilo coach honesto, no marketing.",
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
