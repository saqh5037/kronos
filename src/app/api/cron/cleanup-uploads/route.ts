import { NextResponse } from "next/server";
import { db as rawDb } from "@/server/db";
import { getStorage } from "@/server/storage";

/**
 * Cron: clean up expired whiteboard uploads.
 * Deletes files from the configured storage driver and marks rows EXPIRED.
 * Schedule: daily (e.g. "0 3 * * *")
 * Auth: Bearer CRON_SECRET header.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const expired = await rawDb.whiteboardUpload.findMany({
    where: {
      expiresAt: { lt: now },
      status: { not: "EXPIRED" },
    },
    select: { id: true, blobPathname: true },
  });

  if (expired.length === 0) {
    return NextResponse.json({ cleaned: 0 });
  }

  const storage = getStorage();
  let cleaned = 0;
  const errors: string[] = [];

  for (const upload of expired) {
    try {
      if (upload.blobPathname) {
        await storage.delete(upload.blobPathname);
      }

      await rawDb.whiteboardUpload.update({
        where: { id: upload.id },
        data: { status: "EXPIRED" },
      });

      cleaned++;
    } catch (err) {
      errors.push(`${upload.id}: ${err}`);
      console.error(`[cleanup-uploads] failed for ${upload.id}:`, err);
    }
  }

  return NextResponse.json({
    cleaned,
    errors: errors.length > 0 ? errors : undefined,
  });
}
