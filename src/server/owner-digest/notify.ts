import { sendEmail } from "@/lib/email";
import { logAudit } from "../audit";
import { renderOwnerDigestEmail } from "../email-templates/owner-digest";
import type { OwnerDigestData } from "./compute";

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "";
}

export async function notifyOwnerDigest(
  data: OwnerDigestData,
  tenantId: string,
): Promise<void> {
  const html = renderOwnerDigestEmail({
    boxName: data.boxName,
    ownerName: data.ownerName,
    monthlyRevenueCents: data.monthlyRevenueCents,
    invoiceCount: data.invoiceCount,
    activeAthletesCount: data.activeAthletesCount,
    activeAthletesDelta: data.activeAthletesDelta,
    bookingsLastWeek: data.bookingsLastWeek,
    athletesAtRisk: data.athletesAtRisk,
    nextBillingDate: data.nextBillingDate,
    ctaUrl: `${baseUrl()}/admin`,
  });

  try {
    await sendEmail({
      to: [data.ownerEmail],
      subject: `Tu resumen semanal de ${data.boxName} en Kronos`,
      html,
    });
    await logAudit({
      tenantId,
      actorId: null,
      action: "PAYMENT_INITIATED",
      targetType: "Box",
      targetId: tenantId,
      metadata: {
        kind: "EMAIL_SENT_OWNER_DIGEST",
        revenueCents: data.monthlyRevenueCents,
        activeAthletes: data.activeAthletesCount,
        atRiskCount: data.athletesAtRisk.length,
      },
    });
  } catch (err) {
    console.error(
      `[owner-digest] failed to send to ${data.ownerEmail}:`,
      err instanceof Error ? err.message : err,
    );
  }
}
