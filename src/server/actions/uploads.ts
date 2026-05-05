"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { db as rawDb, withTenant } from "../db";
import { logAudit } from "../audit";
import { getStorage } from "../storage";

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

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

/**
 * Upload a whiteboard photo via the configured storage driver.
 * STORAGE_DRIVER=local (default) writes to public/uploads.
 * STORAGE_DRIVER=s3 uses AWS_S3_BUCKET / AWS credentials.
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

  if (!file.type.startsWith("image/")) {
    throw new Error("Solo se aceptan imágenes (image/*)");
  }

  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("La imagen no puede superar 8 MB");
  }

  const db = withTenant(tenantId);
  const klass = await db.class.findUnique({ where: { id: classId } });
  if (!klass) throw new Error("Clase no encontrada");

  const buffer = Buffer.from(await file.arrayBuffer());
  const pathname = `whiteboards/${tenantId}/${classId}/${Date.now()}-${safeName(file.name)}`;

  const storage = getStorage();
  const stored = await storage.put({
    buffer,
    contentType: file.type || "image/jpeg",
    pathname,
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + EXPIRE_DAYS);

  const upload = await rawDb.whiteboardUpload.create({
    data: {
      tenantId,
      classId,
      uploaderId: session.user.id,
      url: stored.url,
      blobPathname: stored.pathname,
      expiresAt,
    },
  });

  await logAudit({
    tenantId,
    actorId: session.user.id,
    action: "WHITEBOARD_UPLOADED",
    targetType: "WhiteboardUpload",
    targetId: upload.id,
    metadata: { classId, url: stored.url, driver: stored.driver },
  });

  return { uploadId: upload.id, url: stored.url };
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
