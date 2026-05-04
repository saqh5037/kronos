import crypto from "node:crypto";
import type { PaymentStatus } from "@prisma/client";

export type VerifyResult = { valid: boolean; reason?: string };

export function verifyMpSignature(params: {
  signatureHeader: string | null;
  requestIdHeader: string | null;
  dataId: string | null;
  secret: string;
}): VerifyResult {
  const { signatureHeader, requestIdHeader, dataId, secret } = params;

  if (!secret) return { valid: false, reason: "no secret configured" };
  if (!signatureHeader)
    return { valid: false, reason: "missing x-signature header" };
  if (!dataId) return { valid: false, reason: "missing data.id" };

  const parts = signatureHeader
    .split(",")
    .reduce<Record<string, string>>((acc, part) => {
      const [k, v] = part.split("=").map((s) => s.trim());
      if (k && v) acc[k] = v;
      return acc;
    }, {});

  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return { valid: false, reason: "malformed x-signature" };

  const manifest = `id:${dataId};request-id:${requestIdHeader ?? ""};ts:${ts};`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  const equal =
    expected.length === v1.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));

  return equal
    ? { valid: true }
    : { valid: false, reason: "signature mismatch" };
}

export function mapMpStatusToLocal(
  mpStatus: string | undefined | null,
): PaymentStatus {
  switch (mpStatus) {
    case "approved":
    case "authorized":
      return "PAID";
    case "in_process":
    case "pending":
      return "PENDING";
    case "rejected":
    case "cancelled":
      return "FAILED";
    case "refunded":
    case "charged_back":
      return "REFUNDED";
    default:
      return "PENDING";
  }
}
