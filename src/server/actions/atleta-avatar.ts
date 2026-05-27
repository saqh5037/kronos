"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { db as prismaBase } from "../db";
import { getStorage } from "../storage";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

export type AvatarUploadResult =
  | { ok: true; photoUrl: string }
  | {
      ok: false;
      error:
        | "UNAUTH"
        | "NO_FILE"
        | "BAD_TYPE"
        | "TOO_LARGE"
        | "NOT_FOUND"
        | "STORAGE_FAILED";
      message: string;
    };

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

export async function uploadAtletaAvatar(
  formData: FormData,
): Promise<AvatarUploadResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.tenantId) {
    return { ok: false, error: "UNAUTH", message: "Sesión expirada" };
  }
  const tenantId = session.user.tenantId;
  const userId = session.user.id;

  const file = formData.get("file") as File | null;
  if (!file) {
    return {
      ok: false,
      error: "NO_FILE",
      message: "No se recibió ningún archivo",
    };
  }

  if (!ALLOWED_MIME.includes(file.type)) {
    return {
      ok: false,
      error: "BAD_TYPE",
      message: "Solo aceptamos JPG, PNG o WEBP",
    };
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return {
      ok: false,
      error: "TOO_LARGE",
      message: "La imagen no puede superar 5 MB",
    };
  }

  const athlete = await prismaBase.athlete.findFirst({
    where: { tenantId, userId },
    select: { id: true, photoUrl: true },
  });
  if (!athlete) {
    return {
      ok: false,
      error: "NOT_FOUND",
      message: "No encontramos tu perfil",
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";
  const pathname = `avatars/${tenantId}/${userId}/${Date.now()}-${safeName(file.name || `avatar.${ext}`)}`;

  let storedUrl: string;
  try {
    const storage = getStorage();
    const stored = await storage.put({
      buffer,
      contentType: file.type,
      pathname,
    });
    storedUrl = stored.url;
  } catch (e) {
    console.error("[atleta-avatar] storage failed:", e);
    return {
      ok: false,
      error: "STORAGE_FAILED",
      message: "No pudimos guardar la imagen. Inténtalo de nuevo.",
    };
  }

  await prismaBase.athlete.update({
    where: { id: athlete.id },
    data: { photoUrl: storedUrl },
  });

  return { ok: true, photoUrl: storedUrl };
}

export async function removeAtletaAvatar(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.tenantId) {
    return { ok: false, message: "Sesión expirada" };
  }
  const tenantId = session.user.tenantId;
  const userId = session.user.id;

  const athlete = await prismaBase.athlete.findFirst({
    where: { tenantId, userId },
    select: { id: true },
  });
  if (!athlete) return { ok: false, message: "No encontramos tu perfil" };

  await prismaBase.athlete.update({
    where: { id: athlete.id },
    data: { photoUrl: null },
  });
  return { ok: true };
}
