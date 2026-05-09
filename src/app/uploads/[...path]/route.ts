import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

/**
 * Sirve archivos del storage local cuando UPLOAD_BASE_DIR está fuera de `public/`.
 *
 * En dev sin UPLOAD_BASE_DIR los archivos viven en `public/uploads/` y Next los
 * sirve de forma nativa — este handler igual responde como fallback.
 *
 * Hardening: bloquea path traversal (`..`) y limita a la base configurada.
 */

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
};

function resolveBaseDir(): string {
  const custom = process.env.UPLOAD_BASE_DIR?.trim();
  if (custom && custom.length > 0) return custom;
  return path.join(process.cwd(), "public", "uploads");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;

  if (!segments || segments.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Reject path traversal and absolute paths
  if (segments.some((s) => s === "" || s === "." || s === ".." || s.includes("/") || s.includes("\\"))) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const baseDir = resolveBaseDir();
  const fullPath = path.join(baseDir, ...segments);

  // Defense in depth: ensure resolved path stays under baseDir
  const resolvedFull = path.resolve(fullPath);
  const resolvedBase = path.resolve(baseDir);
  if (!resolvedFull.startsWith(resolvedBase + path.sep)) {
    return new NextResponse("Bad request", { status: 400 });
  }

  let buffer: Buffer;
  try {
    buffer = await fs.readFile(resolvedFull);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      return new NextResponse("Not found", { status: 404 });
    }
    throw e;
  }

  const ext = path.extname(resolvedFull).toLowerCase();
  const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
