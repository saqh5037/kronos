/**
 * sendEmail — fallback al mock si no hay RESEND_API_KEY,
 * Resend real cuando sí está cableada.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const sendMock = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn(() => ({
    emails: { send: sendMock },
  })),
}));

function setEnv(key: string, value: string | undefined) {
  (process.env as Record<string, string | undefined>)[key] = value;
}

const originalKey = process.env.RESEND_API_KEY;

afterEach(() => {
  setEnv("RESEND_API_KEY", originalKey);
  sendMock.mockReset();
  vi.resetModules();
});

beforeEach(() => {
  vi.resetModules();
});

describe("sendEmail", () => {
  it("falla a mock cuando no hay RESEND_API_KEY (dev sin key)", async () => {
    setEnv("RESEND_API_KEY", "");
    const { sendEmail } = await import("../../src/lib/email");

    const result = await sendEmail({
      to: ["a@b.c", "d@e.f"],
      subject: "Hola",
      html: "<p>hi</p>",
    });

    expect(result).toEqual({ ok: true, delivered: 2, failed: 0 });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("usa Resend cuando hay RESEND_API_KEY", async () => {
    setEnv("RESEND_API_KEY", "re_test_key_123");
    sendMock.mockResolvedValueOnce({ data: { id: "id-1" }, error: null });

    const { sendEmail } = await import("../../src/lib/email");

    const result = await sendEmail({
      to: ["x@y.z"],
      subject: "Real",
      html: "<p>real</p>",
      from: "Kronos <noreply@kronos.app>",
    });

    expect(sendMock).toHaveBeenCalledWith({
      from: "Kronos <noreply@kronos.app>",
      to: ["x@y.z"],
      subject: "Real",
      html: "<p>real</p>",
    });
    expect(result).toEqual({ ok: true, delivered: 1, failed: 0 });
  });

  it("propaga el error de Resend en EmailResult", async () => {
    setEnv("RESEND_API_KEY", "re_test_key_123");
    sendMock.mockResolvedValueOnce({
      data: null,
      error: { message: "Invalid recipient" },
    });

    const { sendEmail } = await import("../../src/lib/email");

    const result = await sendEmail({
      to: ["bad@addr"],
      subject: "Boom",
      html: "<p>x</p>",
    });

    expect(result.ok).toBe(false);
    expect(result.failed).toBe(1);
    expect(result.error).toBe("Invalid recipient");
  });

  it("captura excepciones runtime de Resend", async () => {
    setEnv("RESEND_API_KEY", "re_test_key_123");
    sendMock.mockRejectedValueOnce(new Error("network down"));

    const { sendEmail } = await import("../../src/lib/email");

    const result = await sendEmail({
      to: ["x@y.z"],
      subject: "Boom",
      html: "<p>x</p>",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe("network down");
  });
});
