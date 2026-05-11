/**
 * Inicia el checkout de MercadoPago para un Payment PENDING.
 *
 * Auth: session NextAuth. El atleta solo puede iniciar el checkout de SU membership.
 * OWNER/COACH/STAFF también pueden iniciarlo (caso "regenerar link" desde admin).
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { withTenant } from "@/server/db";
import { initMpCheckout } from "@/server/actions/payments";
import { isMpConfigured } from "@/lib/payments/mp-client";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ paymentId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  // Rate limit: 10 requests / 5 min per user
  const userId = session.user.id;
  const rl = rateLimit(`mp-checkout:user:${userId}`, 10, 5 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: `Demasiados intentos. Probá en ${rl.retryAfterSec} segundos.`,
      },
      { status: 429 },
    );
  }

  if (!isMpConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: "MercadoPago no está configurado en el servidor.",
      },
      { status: 503 },
    );
  }

  const { paymentId } = await ctx.params;
  const db = withTenant(session.user.tenantId);
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, membershipId: true, status: true, gateway: true },
  });
  if (!payment) {
    return NextResponse.json(
      { ok: false, error: "Payment no encontrado" },
      { status: 404 },
    );
  }
  if (!payment.membershipId) {
    return NextResponse.json(
      { ok: false, error: "El payment no está asociado a una membership" },
      { status: 400 },
    );
  }
  if (payment.status === "PAID") {
    return NextResponse.json(
      { ok: false, error: "Este pago ya está confirmado" },
      { status: 409 },
    );
  }

  try {
    const result = await initMpCheckout({ membershipId: payment.membershipId });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error iniciando checkout";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
