/**
 * AI generator de contenido rico para movements.
 *
 * Llamado on-demand cuando un Movement no tiene cues/commonMistakes/progressions
 * todavía. Cachea resultado en BD permanentemente (cambia contentSource a
 * AI_GENERATED). Admin puede override manual con contentSource = MANUAL_OVERRIDE.
 *
 * Disclaimer obligatorio en UI: "Generado con IA · consultá un coach para
 * casos específicos". El AI evita prescribir pesos absolutos y se enfoca en
 * técnica + safety.
 */

import { generateText } from "@/lib/ai/gemini-client";
import {
  cuesSchema,
  type Cues,
  type CommonMistake,
  type Progression,
} from "@/lib/validations/movement";
import { z } from "zod";

export type GeneratedMovementContent = {
  cues: Cues | null;
  commonMistakes: CommonMistake[] | null;
  progressions: Progression[] | null;
  musclesWorked: string[];
  difficulty: number | null;
  videoUrl: string | null;
};

const generatedSchema = z.object({
  cues: cuesSchema,
  commonMistakes: z.array(
    z.object({
      title: z.string().min(1).max(80),
      description: z.string().max(280).optional(),
      fixCue: z.string().max(140).optional(),
    }),
  ),
  progressions: z.array(
    z.object({
      name: z.string().min(1).max(60),
      level: z.enum(["beginner", "intermediate", "advanced"]),
      description: z.string().max(280).optional(),
    }),
  ),
  musclesWorked: z.array(z.string().min(1).max(40)).max(8),
  difficulty: z.number().int().min(1).max(5),
  videoUrl: z
    .string()
    .nullable()
    .transform((v) => (v === "" || v == null ? null : v)),
});

const SYSTEM_PROMPT = `Eres un coach certificado de CrossFit con 10+ años de experiencia. Generas contenido técnico para una app de boxes de CrossFit en español neutro mexicano.

Tu output es ESTRICTAMENTE JSON válido sin markdown, sin texto extra. Solo el objeto JSON.

NUNCA prescribas pesos absolutos en kg/lbs. Solo técnica + safety + progresión.

Disclaimer implícito: el atleta verá tu contenido con label "Generado con IA · consultá un coach para casos específicos". No te excedas dando recomendaciones médicas o de rehabilitación.`;

const USER_PROMPT_TEMPLATE = `Movement: {name}
Categoría: {category}
Equipo: {equipment}

Generá un objeto JSON con estos campos exactos:

{
  "cues": {
    "setup": ["bullet 1", "bullet 2", ...],
    "dos": ["bullet 1", "bullet 2", ...],
    "donts": ["bullet 1", "bullet 2", ...]
  },
  "commonMistakes": [
    { "title": "Título corto", "description": "Por qué pasa", "fixCue": "Cue corto para corregir" }
  ],
  "progressions": [
    { "name": "Nombre progresión", "level": "beginner|intermediate|advanced", "description": "Cuándo usarla" }
  ],
  "musclesWorked": ["primario", "secundario", ...],
  "difficulty": 1-5,
  "videoUrl": "https://www.youtube.com/embed/VIDEO_ID o null"
}

Reglas:
- "setup": 2-4 bullets de cómo posicionarse antes de ejecutar
- "dos": 3-5 bullets de qué SÍ hacer durante la ejecución
- "donts": 3-5 bullets de qué NO hacer (errores que el coach corrige más)
- "commonMistakes": 3-5 errores con title (corto), description (1 línea), fixCue (cue corto)
- "progressions": 3-5 progresiones ordenadas de más fácil a más difícil
- "musclesWorked": máximo 8, primarios primero
- "difficulty": 1=principiante absoluto, 5=competidor avanzado
- "videoUrl": URL embed YouTube de un video TÉCNICO (no flashy) de un canal CrossFit serio (CrossFit HQ, Catalyst Athletics, Squat University). Si no estás 100% seguro de un URL exacto, devolvé null.

Importante: bullets cortos (max 140 chars), tono accionable. Nada de pesos absolutos.

Devolvé SOLO el JSON. Nada antes, nada después.`;

const VIDEO_URL_REGEX =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/|vimeo\.com\/)[\w\-./?=&]+$/i;

export async function generateMovementContent(args: {
  name: string;
  category: string;
  equipment?: string[];
}): Promise<GeneratedMovementContent> {
  const prompt = `${SYSTEM_PROMPT}\n\n${USER_PROMPT_TEMPLATE.replace(
    "{name}",
    args.name,
  )
    .replace("{category}", args.category)
    .replace(
      "{equipment}",
      args.equipment && args.equipment.length > 0
        ? args.equipment.join(", ")
        : "ninguno",
    )}`;

  const raw = await generateText(prompt);
  return parseAIResponse(raw);
}

export function parseAIResponse(raw: string): GeneratedMovementContent {
  const cleaned = stripCodeFences(raw).trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `AI response no es JSON válido: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const result = generatedSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `AI response no pasó validación: ${result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
    );
  }

  // Validate videoUrl against allowed pattern; if invalid, null it.
  let videoUrl = result.data.videoUrl;
  if (videoUrl != null && !VIDEO_URL_REGEX.test(videoUrl)) {
    videoUrl = null;
  }

  return {
    cues: result.data.cues,
    commonMistakes: result.data.commonMistakes,
    progressions: result.data.progressions,
    musclesWorked: result.data.musclesWorked,
    difficulty: result.data.difficulty,
    videoUrl,
  };
}

function stripCodeFences(s: string): string {
  // Remove ```json ... ``` or ``` ... ``` wrappers if present
  const fenceMatch = s.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (fenceMatch?.[1]) return fenceMatch[1];
  return s;
}
