import { NextResponse } from "next/server";
import { invalidateTodayWod } from "@/server/cache";

/**
 * Dev-only cache invalidation for e2e fixtures.
 *
 * E2E fixtures mutate the DB directly (Prisma), bypassing the server actions
 * that call revalidateTag — so the 10-minute today-WOD cache keeps serving
 * stale data mid-suite. Fixtures POST here after mutating classes/WODs.
 *
 * Gated to NODE_ENV=development (same posture as the dev login provider):
 * in production builds this route always responds 404.
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as {
    tenantId?: string;
    dateKey?: string;
  } | null;

  if (!body?.tenantId || !/^\d{4}-\d{2}-\d{2}$/.test(body.dateKey ?? "")) {
    return NextResponse.json(
      { ok: false, error: "tenantId and dateKey (YYYY-MM-DD) required" },
      { status: 400 },
    );
  }

  invalidateTodayWod(body.tenantId, body.dateKey!);
  return NextResponse.json({ ok: true });
}
