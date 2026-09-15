/**
 * Reads the athlete and plan names `logAudit` stamps onto payment audit
 * metadata (see `withPaymentSubject` in `src/server/audit.ts`) and hands them
 * to `composeAuditLine`.
 *
 * Pure and framework-free so the composed line is unit-testable: the audit
 * feed used to print `Cobro en efectivo` over a raw `$2500.00 MXN` built with
 * `toFixed(2)`, which is neither the shared money format nor an answer to
 * "whose payment was it?".
 */
import { composeAuditLine } from "@/lib/audit-humanize";

export type AuditSubject = {
  athleteName: string | null;
  planName: string | null;
  amount: number | null;
  currency: string | null;
};

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  // Prisma `Decimal` columns arrive as strings through the JSON metadata column.
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function readAuditSubject(
  metadata: Record<string, unknown> | null | undefined,
): AuditSubject {
  return {
    athleteName: readString(metadata?.athleteName),
    planName: readString(metadata?.planName),
    amount: readNumber(metadata?.amount),
    currency: readString(metadata?.currency),
  };
}

/**
 * "Cobro en efectivo · Mía Moreno · Mensual Ilimitado · $2,500 MXN", or just
 * the headline when the metadata carries nothing to add to it.
 */
export function auditDetailLine(
  label: string,
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  const subject = readAuditSubject(metadata);
  const line = composeAuditLine({ label, ...subject });
  return line === label ? null : line;
}
