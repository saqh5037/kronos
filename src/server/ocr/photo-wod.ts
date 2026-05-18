/**
 * Photo-WOD OCR — Gemini 2.0 Flash Vision adaptado al caso de atleta self-serve.
 *
 * Diferencias vs el whiteboard de coach (analyzeWhiteboard):
 *  - NO recibe roster (el atleta sube SU foto, no la pizarra del box)
 *  - Output es estructura del WOD + su score: { wodName, wodType, scoreType,
 *    timeCap, score, scaling }, NO una lista de filas con N atletas
 *  - Prompt instruye a extraer SOLO un WOD principal (no múltiples)
 *
 * Costo: ~$0.0001 input + ~$0.0004 output ≈ <$0.001 por foto. Gateado por
 * rate limit a 10 fotos/atleta/día desde el caller.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ScoreType, Scaling } from "@prisma/client";

export type WodType =
  | "FORTIME"
  | "AMRAP"
  | "EMOM"
  | "TABATA"
  | "STRENGTH"
  | "CUSTOM";

export type PhotoWodAIResult = {
  wodName: string | null;
  wodType: WodType | null;
  scoreType: ScoreType | null;
  timeCapSeconds: number | null;
  score: {
    value: string | null; // raw del whiteboard, ej "5:43" o "120" o "5+12"
    scaling: Scaling | null;
  };
  notes?: string;
};

function buildPrompt(): string {
  return `Eres un experto en lectura de pizarras de boxes de CrossFit.
La foto que recibes fue tomada por un atleta independiente (sin coach) que
quiere loggear su WOD personal en su app. Tu tarea es extraer la estructura
del WOD principal de la imagen y el resultado del atleta si está visible.

IMPORTANTE: solo extrae UN WOD (el principal). Si hay múltiples WODs en la
foto, elige el que tenga mayor protagonismo visual o el primero.

Devolvé SOLO un objeto JSON con esta estructura exacta (sin texto extra):
{
  "wodName": "Fran" | null,                    // Nombre del WOD si lo dice (Fran, Murph, Helen, "AMRAP 12 min", etc). null si no se ve.
  "wodType": "FORTIME" | "AMRAP" | "EMOM" | "TABATA" | "STRENGTH" | "CUSTOM",
  "scoreType": "TIME" | "REPS" | "WEIGHT" | "ROUNDS_REPS",
  "timeCapSeconds": 1200 | null,                // Time cap en segundos. Si dice "20 min" → 1200. null si no aplica.
  "score": {
    "value": "5:43" | null,                     // El score del atleta TAL COMO aparece en la foto. null si no hay.
    "scaling": "RX" | "SCALED" | "RXPLUS" | null
  },
  "notes": "..."                                 // opcional, contexto extra de la foto
}

Reglas para inferir wodType y scoreType cuando no es obvio:
- Si dice "FOR TIME" o "RFT" → FORTIME, scoreType TIME
- Si dice "AMRAP X min" → AMRAP, scoreType ROUNDS_REPS
- Si dice "EMOM X min" → EMOM, scoreType REPS
- Si es trabajo de fuerza (3RM, 1RM, "max") → STRENGTH, scoreType WEIGHT
- Si no puedes inferir, usa CUSTOM + TIME

Responde SOLO con el JSON, sin markdown, sin explicaciones, sin \`\`\`.`;
}

export async function analyzePhotoWod(
  imageInput: { buffer: Buffer; mimeType: string } | { url: string },
): Promise<PhotoWodAIResult> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY no configurado. Agregalo a .env.local para usar foto-WOD.",
    );
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
  });

  let imagePart;
  if ("buffer" in imageInput) {
    imagePart = {
      inlineData: {
        data: imageInput.buffer.toString("base64"),
        mimeType: imageInput.mimeType,
      },
    };
  } else {
    // Fallback: fetch URL → buffer (storage local en dev usa URL pública)
    const res = await fetch(imageInput.url);
    if (!res.ok) {
      throw new Error(`No pudimos leer la imagen (${res.status})`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const mimeType = res.headers.get("content-type") ?? "image/jpeg";
    imagePart = {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType,
      },
    };
  }

  const result = await model.generateContent([buildPrompt(), imagePart]);
  const responseText = result.response.text().trim();

  // Limpiar posibles wrappers ```json ... ``` que Gemini a veces añade.
  const cleaned = responseText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `OCR devolvió JSON inválido. Texto crudo: ${responseText.slice(0, 200)}`,
    );
  }

  return normalizeResult(parsed);
}

function normalizeResult(raw: unknown): PhotoWodAIResult {
  const r = (raw ?? {}) as Record<string, unknown>;
  const score = (r.score ?? {}) as Record<string, unknown>;

  const wodTypes: WodType[] = [
    "FORTIME",
    "AMRAP",
    "EMOM",
    "TABATA",
    "STRENGTH",
    "CUSTOM",
  ];
  const scoreTypes: ScoreType[] = ["TIME", "REPS", "WEIGHT", "ROUNDS_REPS"];
  const scalings: Scaling[] = ["RX", "SCALED", "RXPLUS"];

  const wodType = wodTypes.includes(r.wodType as WodType)
    ? (r.wodType as WodType)
    : null;
  const scoreType = scoreTypes.includes(r.scoreType as ScoreType)
    ? (r.scoreType as ScoreType)
    : null;
  const scaling = scalings.includes(score.scaling as Scaling)
    ? (score.scaling as Scaling)
    : null;
  const timeCap =
    typeof r.timeCapSeconds === "number" && r.timeCapSeconds >= 0
      ? Math.round(r.timeCapSeconds)
      : null;

  return {
    wodName: typeof r.wodName === "string" ? r.wodName.trim() : null,
    wodType,
    scoreType,
    timeCapSeconds: timeCap,
    score: {
      value: typeof score.value === "string" ? score.value.trim() : null,
      scaling,
    },
    notes: typeof r.notes === "string" ? r.notes : undefined,
  };
}
