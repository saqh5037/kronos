/**
 * Coach virtual — generador de cards proactivas semanales.
 *
 * Se ejecuta async (cron lunes 6am) por atleta. Toma context rico (PRs,
 * skill levels, frecuencia, ranking) y genera 1-3 cards relevantes.
 *
 * Cards posibles:
 * - STAGNATION: PR sin cambio en 30+ días
 * - NEXT_UNLOCK: cerca de desbloquear una progression
 * - AVOIDANCE_PATTERN: 0 logs de un grupo muscular en 30 días
 * - CELEBRATION: PR reciente con buen delta
 *
 * El AI no inventa cards — recibe los hechos del atleta y elige cuáles
 * mencionar y con qué tono. Si no hay nada relevante, retorna array vacío.
 */

import { generateText } from "@/lib/ai/gemini-client";
import { z } from "zod";

export type CoachCardType =
  | "STAGNATION"
  | "NEXT_UNLOCK"
  | "AVOIDANCE_PATTERN"
  | "CELEBRATION";

export type CoachCardInput = {
  athleteFirstName: string;
  isPersonalBox: boolean;
  facts: {
    stagnantPRs: {
      movementName: string;
      daysStuck: number;
      lastValue: string;
    }[];
    recentPRs: { movementName: string; deltaPct: number; achievedAt: Date }[];
    nextUnlocks: {
      movementName: string;
      currentProgressionName: string;
      nextProgressionName: string;
    }[];
    avoidancePatterns: {
      muscleGroup: string;
      daysWithout: number;
    }[];
  };
};

export type GeneratedCoachCard = {
  type: CoachCardType;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  priority: number;
  meta?: Record<string, unknown>;
};

const cardSchema = z.object({
  type: z.enum([
    "STAGNATION",
    "NEXT_UNLOCK",
    "AVOIDANCE_PATTERN",
    "CELEBRATION",
  ]),
  title: z.string().min(3).max(80),
  body: z.string().min(10).max(280),
  ctaLabel: z.string().max(40).optional().nullable(),
  ctaHref: z.string().max(160).optional().nullable(),
  priority: z.number().int().min(1).max(100),
  meta: z.record(z.string(), z.unknown()).optional().nullable(),
});

const responseSchema = z.object({
  cards: z.array(cardSchema).max(3),
});

const SYSTEM_PROMPT = `Eres el coach virtual de Kronos, una app multi-tenant de CrossFit. Generás cards de feedback proactivas para atletas que entrenan en boxes (con coach humano) o en Box Personal (solos, sin coach).

Tu tono: cálido, accionable, mexicano neutro. Como coach experimentado que conoce al atleta.

Output: JSON estricto sin markdown, sin texto extra. Solo el objeto.

NUNCA inventes hechos. Solo usás los datos que te paso. Si no hay nada relevante para una categoría, no inventes una card de esa categoría.

Máximo 3 cards. Priorizá por relevancia:
- CELEBRATION (PR reciente >5%) > NEXT_UNLOCK (cerca) > STAGNATION (>30d) > AVOIDANCE_PATTERN

Si Box Personal: tono más íntimo ("buena progresión solo en 2 meses"). Si Box real: comparativo ("top 25% del box"). Te indico cuál con isPersonalBox.

NUNCA prescribas pesos absolutos en kg. Solo técnica + progresión + sugerencia de WOD/movement.`;

const USER_PROMPT_TEMPLATE = `Atleta: {firstName} (Box {boxKind})

Hechos de los últimos 90 días:

PRs estancados (sin movimiento en 30+ días):
{stagnantPRs}

PRs recientes (delta >0):
{recentPRs}

Próximos desbloqueos en árbol de progresiones:
{nextUnlocks}

Patrones de evitación (grupos musculares sin trabajar):
{avoidancePatterns}

Generá 1-3 cards en este formato JSON:

{
  "cards": [
    {
      "type": "STAGNATION|NEXT_UNLOCK|AVOIDANCE_PATTERN|CELEBRATION",
      "title": "Título corto, 3-7 palabras, español",
      "body": "Mensaje del coach en 1-2 oraciones, máximo 280 chars",
      "ctaLabel": "Ver más" | "Probar este WOD" | null,
      "ctaHref": "/atleta/movimientos/{slug}" | "/atleta/wod/nuevo" | null,
      "priority": 1-100 (menor = más arriba),
      "meta": { "movementSlug": "...", "extra": "..." } | null
    }
  ]
}

Reglas:
- Body en 2da persona ("tu deadlift", "te falta", "intentá").
- Si Box Personal y tiene CELEBRATION: tono solidario, no comparativo.
- Si Box real y tiene CELEBRATION: podés mencionar comparativo cuando aporte.
- Si NO hay datos relevantes: devolvé { "cards": [] }.

Devolvé SOLO el JSON. Nada antes, nada después.`;

export async function generateCoachCards(
  input: CoachCardInput,
): Promise<GeneratedCoachCard[]> {
  const facts = formatFacts(input.facts);
  const prompt =
    SYSTEM_PROMPT +
    "\n\n" +
    USER_PROMPT_TEMPLATE.replace("{firstName}", input.athleteFirstName)
      .replace("{boxKind}", input.isPersonalBox ? "Personal" : "real")
      .replace("{stagnantPRs}", facts.stagnantPRs)
      .replace("{recentPRs}", facts.recentPRs)
      .replace("{nextUnlocks}", facts.nextUnlocks)
      .replace("{avoidancePatterns}", facts.avoidance);

  const raw = await generateText(prompt);
  return parseCoachCardResponse(raw);
}

function formatFacts(facts: CoachCardInput["facts"]) {
  const stagnantPRs =
    facts.stagnantPRs.length > 0
      ? facts.stagnantPRs
          .map(
            (p) =>
              `- ${p.movementName}: ${p.lastValue} (${p.daysStuck} días sin moverse)`,
          )
          .join("\n")
      : "- (ninguno)";

  const recentPRs =
    facts.recentPRs.length > 0
      ? facts.recentPRs
          .map(
            (p) =>
              `- ${p.movementName}: +${p.deltaPct.toFixed(1)}% el ${p.achievedAt.toISOString().slice(0, 10)}`,
          )
          .join("\n")
      : "- (ninguno)";

  const nextUnlocks =
    facts.nextUnlocks.length > 0
      ? facts.nextUnlocks
          .map(
            (u) =>
              `- ${u.movementName}: actualmente en "${u.currentProgressionName}", próximo: "${u.nextProgressionName}"`,
          )
          .join("\n")
      : "- (ninguno)";

  const avoidance =
    facts.avoidancePatterns.length > 0
      ? facts.avoidancePatterns
          .map((a) => `- ${a.muscleGroup}: ${a.daysWithout} días sin trabajar`)
          .join("\n")
      : "- (ninguno)";

  return { stagnantPRs, recentPRs, nextUnlocks, avoidance };
}

export function parseCoachCardResponse(raw: string): GeneratedCoachCard[] {
  const cleaned = stripCodeFences(raw).trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `coach-cards JSON inválido: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const result = responseSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `coach-cards shape inválido: ${result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
    );
  }

  return result.data.cards.map((c) => ({
    type: c.type,
    title: c.title,
    body: c.body,
    ctaLabel: c.ctaLabel ?? undefined,
    ctaHref: c.ctaHref ?? undefined,
    priority: c.priority,
    meta: (c.meta ?? undefined) as Record<string, unknown> | undefined,
  }));
}

function stripCodeFences(s: string): string {
  const fenceMatch = s.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (fenceMatch?.[1]) return fenceMatch[1];
  return s;
}
