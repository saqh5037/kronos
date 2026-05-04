/**
 * GET /api/payments/[paymentId]/status
 *
 * Polling endpoint para la página resultado del checkout. Devuelve el estado
 * actual del Payment para que el cliente actualice la UI sin recargar.
 *
 * Auth: session NextAuth. Atleta solo puede leer su propio Payment.
 */
import { NextResponse } from "next/server";
import { getPaymentStatus } from "@/server/actions/payments";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ paymentId: string }> },
) {
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
