/**
 * Whiteboard OCR — Gemini 2.0 Flash Vision
 * Reads a whiteboard photo and extracts athlete names + scores,
 * cross-referencing against the class roster and tenant alias dict.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ScoreType, Scaling } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type WhiteboardRow = {
  rawName: string;
  matchedAthleteId: string | null;
  confidence: number; // 0..1
  score: string;
  scoreType: ScoreType;
  scaling: Scaling;
  notes?: string;
};

export type WhiteboardAIResult = {
  rows: WhiteboardRow[];
};

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(
  rosterJson: string,
  aliasJson: string,
  defaultScoreType: ScoreType,
): string {
  return `Eres un experto en lectura de pizarras de boxes de CrossFit.
Tu tarea es extraer nombres de atletas y sus scores de la imagen proporcionada.

Roster esperado (en JSON):
${rosterJson}

Diccionario de apodos conocidos (alias → athleteId):
${aliasJson}

Tipo de score por defecto para este WOD: ${defaultScoreType}
Opciones de scaling: RX, SCALED, RXPLUS

Instrucciones:
1. Para cada línea con nombre+score en la pizarra, genera un objeto JSON.
2. Intenta matchear el nombre crudo contra el roster (firstName, lastName) y los apodos.
3. Si hay match, coloca el athleteId en matchedAthleteId y confidence > 0.7.
4. Si no hay match claro, matchedAthleteId = null y confidence < 0.5.
5. El campo "score" debe ser el valor tal como aparece en la pizarra (ej: "5:43", "120", "15+8").
6. El campo "scoreType" debe inferirse del formato: TIME si hay mm:ss, ROUNDS_REPS si hay +, WEIGHT si tiene kg/lbs, REPS en otros casos. Si no puedes inferir, usa el tipo por defecto.
7. El campo "scaling" debe inferirse: busca RX, SCALED, +, * en la pizarra. Default = RX.
8. "notes" es opcional, solo si hay texto adicional relevante.

Devuelve SOLO JSON válido, sin markdown, sin explicaciones:
{"rows":[{"rawName":"...","matchedAthleteId":null|"id","confidence":0.0,"score":"...","scoreType":"TIME|ROUNDS_REPS|WEIGHT|REPS","scaling":"RX|SCALED|RXPLUS","notes":"..."}]}`;
}

// ─── Parse helpers ────────────────────────────────────────────────────────────

function parseGeminiResponse(text: string): WhiteboardAIResult {
  // Remove potential markdown code fences
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

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Analyze a whiteboard photo URL using Gemini 2.0 Flash Vision.
 * Returns structured rows with name matching against the class roster.
 */
/**
 * Analyze whiteboard using Gemini Vision, loading roster and aliases
 * from classId (requires session context from getClassRoster).
 * For session-free use, prefer analyzeWhiteboardWithRoster().
 */
export async function analyzeWhiteboard(
  uploadId: string,
  imageUrl: string,
  classId: string,
  defaultScoreType: ScoreType = "TIME",
): Promise<WhiteboardAIResult> {
  // Delegate to the with-roster variant after loading context.
  // Roster/alias loading happens in processWhiteboardUpload (scores.ts)
  // which calls analyzeWhiteboardWithRoster directly.
  // This function is kept as a convenience entry point if session is available.
  const { db: rawDb } = await import("../db");
  const { getAliasDict } = await import("../actions/aliases");

  const bookings = await rawDb.booking.findMany({
    where: { classId },
    include: {
      athlete: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  const upload = await rawDb.whiteboardUpload.findUnique({
    where: { id: uploadId },
    select: { tenantId: true },
  });

  const rosterJson = JSON.stringify(
    bookings.map((b) => ({
      athleteId: b.athlete.id,
      firstName: b.athlete.firstName,
      lastName: b.athlete.lastName,
    })),
  );

  const aliasDict = upload ? await getAliasDict(upload.tenantId) : {};
  const aliasJson = JSON.stringify(aliasDict);

  return analyzeWhiteboardWithRoster(
    uploadId,
    imageUrl,
    rosterJson,
    aliasJson,
    defaultScoreType,
  );
}

/**
 * Overload that accepts roster + aliasDict directly (for server-side use
 * where session may not be available).
 */
export async function analyzeWhiteboardWithRoster(
  uploadId: string,
  imageUrl: string,
  rosterJson: string,
  aliasJson: string,
  defaultScoreType: ScoreType = "TIME",
): Promise<WhiteboardAIResult> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY no configurado. Agrégalo a .env.local para usar el OCR.",
    );
  }

  const prompt = buildPrompt(rosterJson, aliasJson, defaultScoreType);

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  let imageBytes: string;
  let mimeType: string;
  try {
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    imageBytes = Buffer.from(buffer).toString("base64");
    mimeType = response.headers.get("content-type") ?? "image/jpeg";
  } catch (fetchErr) {
    throw new Error(`No se pudo descargar la imagen: ${fetchErr}`);
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await model.generateContent([
        prompt,
        { inlineData: { data: imageBytes, mimeType } },
      ]);
      const text = result.response.text();
      return parseGeminiResponse(text);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`[whiteboard-ocr] attempt ${attempt + 1} failed:`, err);
    }
  }

  throw lastError ?? new Error("analyzeWhiteboardWithRoster: unknown error");
}
