/**
 * Validación HMAC del webhook MercadoPago + mapeo de status local.
 *
 * El secret + manifest se firman como:
 *   id:{dataId};request-id:{x-request-id};ts:{ts};
 * con HMAC-SHA256 hex.
 */
import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import {
  verifyMpSignature,
  mapMpStatusToLocal,
} from "@/lib/payments/mp-webhook";

function sign(secret: string, dataId: string, requestId: string, ts: string) {
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  return crypto.createHmac("sha256", secret).update(manifest).digest("hex");
}

const SECRET = "test-secret-key-do-not-use-in-prod";

describe("verifyMpSignature", () => {
  it("acepta firma válida con manifest correcto", () => {
    const dataId = "12345678";
    const requestId = "req-abc";
    const ts = "1700000000";
    const v1 = sign(SECRET, dataId, requestId, ts);
    const result = verifyMpSignature({
      signatureHeader: `ts=${ts},v1=${v1}`,
      requestIdHeader: requestId,
      dataId,
      secret: SECRET,
    });
    expect(result.valid).toBe(true);
  });

  it("rechaza si secret es incorrecto", () => {
    const dataId = "12345678";
    const ts = "1700000000";
    const v1 = sign("otro-secret", dataId, "req-abc", ts);
    const result = verifyMpSignature({
      signatureHeader: `ts=${ts},v1=${v1}`,
      requestIdHeader: "req-abc",
      dataId,
      secret: SECRET,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/mismatch/);
  });

  it("rechaza si dataId fue alterado (replay)", () => {
    const ts = "1700000000";
    const v1 = sign(SECRET, "ORIGINAL", "req-abc", ts);
    const result = verifyMpSignature({
      signatureHeader: `ts=${ts},v1=${v1}`,
      requestIdHeader: "req-abc",
      dataId: "TAMPERED",
      secret: SECRET,
    });
    expect(result.valid).toBe(false);
  });

  it("rechaza si request-id fue alterado", () => {
    const dataId = "abc";
    const ts = "1700000000";
    const v1 = sign(SECRET, dataId, "original-req", ts);
    const result = verifyMpSignature({
      signatureHeader: `ts=${ts},v1=${v1}`,
      requestIdHeader: "tampered-req",
      dataId,
      secret: SECRET,
    });
    expect(result.valid).toBe(false);
  });

  it("rechaza si falta x-signature header", () => {
    const result = verifyMpSignature({
      signatureHeader: null,
      requestIdHeader: "req",
      dataId: "abc",
      secret: SECRET,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/x-signature/);
  });

  it("rechaza si falta dataId", () => {
    const result = verifyMpSignature({
      signatureHeader: "ts=1,v1=abc",
      requestIdHeader: "req",
      dataId: null,
      secret: SECRET,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/data\.id/);
  });

  it("rechaza signature header malformado (sin ts o v1)", () => {
    const result = verifyMpSignature({
      signatureHeader: "garbage=value",
      requestIdHeader: "req",
      dataId: "abc",
      secret: SECRET,
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/malformed/);
  });

  it("rechaza si secret está vacío (no se permite skip)", () => {
    const result = verifyMpSignature({
      signatureHeader: "ts=1,v1=abc",
      requestIdHeader: "req",
      dataId: "abc",
      secret: "",
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/secret/);
  });

  it("rechaza firma de longitud distinta sin tirar (timing-safe)", () => {
    const ts = "1700000000";
    // v1 más corta que la firma esperada
    const result = verifyMpSignature({
      signatureHeader: `ts=${ts},v1=deadbeef`,
      requestIdHeader: "req",
      dataId: "abc",
      secret: SECRET,
    });
    expect(result.valid).toBe(false);
  });
});

describe("mapMpStatusToLocal", () => {
  it("mapea approved → PAID", () => {
    expect(mapMpStatusToLocal("approved")).toBe("PAID");
  });
  it("mapea authorized → PAID", () => {
    expect(mapMpStatusToLocal("authorized")).toBe("PAID");
  });
  it("mapea in_process → PENDING", () => {
    expect(mapMpStatusToLocal("in_process")).toBe("PENDING");
  });
  it("mapea pending → PENDING", () => {
    expect(mapMpStatusToLocal("pending")).toBe("PENDING");
  });
  it("mapea rejected → FAILED", () => {
    expect(mapMpStatusToLocal("rejected")).toBe("FAILED");
  });
  it("mapea cancelled → FAILED", () => {
    expect(mapMpStatusToLocal("cancelled")).toBe("FAILED");
  });
  it("mapea refunded → REFUNDED", () => {
    expect(mapMpStatusToLocal("refunded")).toBe("REFUNDED");
  });
  it("mapea charged_back → REFUNDED", () => {
    expect(mapMpStatusToLocal("charged_back")).toBe("REFUNDED");
  });
  it("mapea null → PENDING (safe default)", () => {
    expect(mapMpStatusToLocal(null)).toBe("PENDING");
  });
  it("mapea undefined → PENDING", () => {
    expect(mapMpStatusToLocal(undefined)).toBe("PENDING");
  });
  it("mapea unknown → PENDING", () => {
    expect(mapMpStatusToLocal("alien_status")).toBe("PENDING");
  });
});
