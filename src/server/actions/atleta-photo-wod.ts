"use server";

import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { db as prismaBase } from "@/server/db";
import { isPersonalBoxSlug } from "@/lib/personal-box";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getStorage } from "@/server/storage";
import { analyzePhotoWod, type PhotoWodAIResult } from "@/server/ocr/photo-wod";
import { logAudit } from "@/server/audit";

/**
 * Sube una foto del whiteboard, la procesa con Gemini Vision, devuelve
 * el WOD parseado para que el cliente lo confirme/edite y luego llame a
 * createMyQuickWod (Slice 4.4) para guardarlo.
 *
 * NO modifica el modelo WhiteboardUpload (acoplado a Class). Storage temporal,
 * el cliente confirma y descartamos la foto. Si quieren mantener el archivo,
 * eso es deuda futura (storage permanente requiere modelo de tabla).
 *
 * Cost gates:
 *  - Rate limit por IP (5 fotos / 5 min)
 *  - Rate limit por user (10 fotos / día)
 *  - Solo Box Personal puede usar este flow
 *
 * Costo Gemini ~$0.001 por foto. 10/día por user = ~$0.01/atleta/día max.
 */

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export type PhotoWodResult =
  | { ok: true; parsed: PhotoWodAIResult; uploadId: string }
  | {
      ok: false;
      error:
        | "UNAUTH"
        | "NOT_PERSONAL"
        | "INVALID_FILE"
        | "TOO_LARGE"
        | "RATE_LIMITED"
        | "OCR_FAILED";
      message: string;
    };

export async function uploadAndAnalyzePhotoWod(
  formData: FormData,
): Promise<PhotoWodResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.tenantId) {
    return { ok: false, error: "UNAUTH", message: "Sesión expirada" };
  }

  const box = await prismaBase.box.findUnique({
    where: { id: session.user.tenantId },
    select: { slug: true },
  });
  if (!box || !isPersonalBoxSlug(box.slug)) {
    return {
      ok: false,
      error: "NOT_PERSONAL",
      message: "Esta acción es solo para atletas independientes.",
    };
  }

  // Rate limits: por IP (anti scraper) + por user (cost gate diario)
  const ip = getClientIp(await headers());
  const rlIp = rateLimit(`photo-wod-ip:${ip}`, 5, 5 * 60_000);
  if (!rlIp.ok) {
    return {
      ok: false,
      error: "RATE_LIMITED",
      message: `Esperá ${rlIp.retryAfterSec}s antes de subir otra foto.`,
    };
  }
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
  const rlUser = rateLimit(
    `photo-wod-user:${session.user.id}:${today}`,
    10,
    24 * 60 * 60_000,
  );
  if (!rlUser.ok) {
    return {
      ok: false,
      error: "RATE_LIMITED",
      message: "Llegaste al límite de 10 fotos por día. Inténtalo mañana.",
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "INVALID_FILE", message: "Falta la foto" };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      ok: false,
      error: "INVALID_FILE",
      message: "Formato no soportado. Sube JPG, PNG o WEBP.",
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      ok: false,
      error: "TOO_LARGE",
      message: "Foto muy grande (max 8 MB).",
    };
  }

  // Guardar en storage temporal. Pathname agrupa por tenant para fácil cleanup.
  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";
  const pathname = `photo-wod/${session.user.tenantId}/${session.user.id}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  let uploadOutput;
  try {
    const storage = getStorage();
    uploadOutput = await storage.put({
      buffer,
      contentType: file.type,
      pathname,
    });
  } catch (e) {
    console.error("[atleta-photo-wod] storage upload failed:", e);
    return {
      ok: false,
      error: "OCR_FAILED",
      message: "No pudimos guardar la foto. Inténtalo de nuevo.",
    };
  }

  // Llamar al OCR
  let parsed: PhotoWodAIResult;
  try {
    parsed = await analyzePhotoWod({ buffer, mimeType: file.type });
  } catch (e) {
    console.error("[atleta-photo-wod] OCR failed:", e);
    // Cleanup del storage si OCR falla
    try {
      await getStorage().delete(uploadOutput.pathname);
    } catch {
      // ignore
    }
    return {
      ok: false,
      error: "OCR_FAILED",
      message:
        "No pudimos leer la foto. Inténtalo con otra con mejor luz, o ingresa el WOD manualmente.",
    };
  }

  await logAudit({
    tenantId: session.user.tenantId,
    actorId: session.user.id,
    action: "BULK_SCORES_FROM_WHITEBOARD",
    targetType: "PhotoWod",
    targetId: pathname,
    metadata: {
      source: "atleta-photo-wod",
      hasName: parsed.wodName != null,
      hasScore: parsed.score.value != null,
    },
  });

  return { ok: true, parsed, uploadId: uploadOutput.pathname };
}
