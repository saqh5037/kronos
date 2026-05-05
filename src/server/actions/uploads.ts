"use server";

import { getServerSession } from "next-auth";
import { put } from "@vercel/blob";
import { authOptions } from "../auth";
import { db as rawDb, withTenant } from "../db";
import { logAudit } from "../audit";

const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB
const EXPIRE_DAYS = 7;

async function requireCoachSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  const role = session.user.role;
  if (role !== "OWNER" && role !== "COACH" && role !== "STAFF") {
    throw new Error("Forbidden — COACH/OWNER/STAFF only");
  }
  return session;
}

export type UploadResult = {
  uploadId: string;
  url: string;
};

/**
 * Upload a whiteboard photo to Vercel Blob.
 * Requires BLOB_READ_WRITE_TOKEN env var. In dev without the token,
 * returns a clear error rather than crashing.
 */
export async function uploadWhiteboardPhoto(
  formData: FormData,
): Promise<UploadResult> {
  const session = await requireCoachSession();
  const tenantId = session.user.tenantId;

  const classId = formData.get("classId") as string | null;
  if (!classId) throw new Error("classId requerido");

  const file = formData.get("file") as File | null;
  if (!file) throw new Error("Archivo requerido");

  // Validate mime type
  if (!file.type.startsWith("image/")) {
    throw new Error("Solo se aceptan imágenes (image/*)");
  }

  // Validate size
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("La imagen no puede superar 8 MB");
  }

  // Check token — fail cleanly in dev without token
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN no configurado. Para producción, configúralo en el dashboard de Vercel. Para dev, puedes omitir la foto y usar datos manuales.",
    );
  }

  // Verify class belongs to tenant
  const db = withTenant(tenantId);
  const klass = await db.class.findUnique({ where: { id: classId } });
  if (!klass) throw new Error("Clase no encontrada");

  const pathname = `whiteboards/${tenantId}/${classId}/${Date.now()}-${file.name}`;
  const blob = await put(pathname, file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + EXPIRE_DAYS);

  const upload = await rawDb.whiteboardUpload.create({
    data: {
      tenantId,
      classId,
      uploaderId: session.user.id,
      url: blob.url,
      blobPathname: blob.pathname,
      expiresAt,
    },
  });

  await logAudit({
    tenantId,
    actorId: session.user.id,
    action: "WHITEBOARD_UPLOADED",
    targetType: "WhiteboardUpload",
    targetId: upload.id,
    metadata: { classId, url: blob.url },
  });

  return { uploadId: upload.id, url: blob.url };
}

/**
 * Mark a specific upload as EXPIRED (called from cron).
 */
export async function markUploadExpired(uploadId: string): Promise<void> {
  await rawDb.whiteboardUpload.update({
    where: { id: uploadId },
    data: { status: "EXPIRED" },
  });
}
