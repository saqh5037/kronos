/**
 * GET /api/payments/[paymentId]/status
 *
 * Polling endpoint para la página resultado del checkout. Devuelve el estado
 * actual del Payment para que el cliente actualice la UI sin recargar.
 *
 * Auth: session NextAuth. Atleta solo puede leer su propio Payment.
 */
import { NextRequest, NextResponse } from "next/server";
import { getPaymentStatus } from "@/server/actions/payments";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ paymentId: string }> },
) {
  // Rate limit: 30 requests / 1 min per IP (polling endpoint)
  const ip = getClientIp(req.headers);
  const rl = rateLimit(`payment-status:ip:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `Demasiadas consultas. Probá en ${rl.retryAfterSec} segundos.`,
      },
      { status: 429 },
    );
  }

  const { paymentId } = await ctx.params;
  try {
    const status = await getPaymentStatus(paymentId);
    if (!status) {
      return NextResponse.json(
        { ok: false, error: "Not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, payment: status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    const code = msg === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ ok: false, error: msg }, { status: code });
  }
}
