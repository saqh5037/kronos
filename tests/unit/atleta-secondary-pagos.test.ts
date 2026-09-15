/**
 * Payment result state machine (audit 2026-09-15: `/atleta/pagos/[id]/resultado`
 * was "the most anxious screen in the app" — an infinite spinner with no
 * amount, no order id, no timeout and no retry).
 */

import { describe, it, expect } from "vitest";
import {
  PAYMENT_POLL_TIMEOUT_MS,
  isTerminal,
  paymentResultState,
  paymentResultView,
  secondsLeft,
  shouldKeepPolling,
} from "@/app/atleta/pagos/[id]/resultado/state";

const base = { status: null, initialStatus: null, elapsedMs: 0 } as const;

describe("paymentResultState", () => {
  it("spins while the gateway has not decided", () => {
    expect(paymentResultState({ ...base, elapsedMs: 5_000 })).toBe(
      "processing",
    );
    expect(
      paymentResultState({ ...base, status: "PENDING", elapsedMs: 5_000 }),
    ).toBe("processing");
  });

  it("resolves on a confirmed payment", () => {
    expect(paymentResultState({ ...base, status: "PAID" })).toBe("paid");
  });

  it("resolves on a rejection", () => {
    expect(paymentResultState({ ...base, status: "FAILED" })).toBe("failed");
  });

  it("trusts the return redirect when our own poll has not answered yet", () => {
    expect(
      paymentResultState({ ...base, status: null, initialStatus: "failure" }),
    ).toBe("failed");
  });

  it("prefers our own status over the redirect hint", () => {
    expect(
      paymentResultState({ ...base, status: "PAID", initialStatus: "failure" }),
    ).toBe("paid");
  });

  it("gives up at 60 s instead of spinning forever", () => {
    expect(
      paymentResultState({ ...base, elapsedMs: PAYMENT_POLL_TIMEOUT_MS - 1 }),
    ).toBe("processing");
    expect(
      paymentResultState({ ...base, elapsedMs: PAYMENT_POLL_TIMEOUT_MS }),
    ).toBe("timeout");
    expect(PAYMENT_POLL_TIMEOUT_MS).toBe(60_000);
  });

  it("still reports a late confirmation after the timeout", () => {
    expect(
      paymentResultState({
        ...base,
        status: "PAID",
        elapsedMs: PAYMENT_POLL_TIMEOUT_MS + 10_000,
      }),
    ).toBe("paid");
  });

  it("handles a refund as its own terminal state", () => {
    expect(paymentResultState({ ...base, status: "REFUNDED" })).toBe(
      "refunded",
    );
  });
});

describe("shouldKeepPolling", () => {
  it("keeps polling under the timeout with no decision", () => {
    expect(shouldKeepPolling({ ...base, elapsedMs: 10_000 })).toBe(true);
  });

  it("stops on any terminal status", () => {
    expect(shouldKeepPolling({ ...base, status: "PAID" })).toBe(false);
    expect(shouldKeepPolling({ ...base, status: "FAILED" })).toBe(false);
    expect(shouldKeepPolling({ ...base, status: "REFUNDED" })).toBe(false);
  });

  it("stops at the timeout", () => {
    expect(
      shouldKeepPolling({ ...base, elapsedMs: PAYMENT_POLL_TIMEOUT_MS }),
    ).toBe(false);
  });

  it("isTerminal only accepts decided statuses", () => {
    expect(isTerminal(null)).toBe(false);
    expect(isTerminal("PENDING")).toBe(false);
    expect(isTerminal("PAID")).toBe(true);
  });
});

describe("secondsLeft", () => {
  it("counts down and never goes negative", () => {
    expect(secondsLeft(0)).toBe(60);
    expect(secondsLeft(30_000)).toBe(30);
    expect(secondsLeft(PAYMENT_POLL_TIMEOUT_MS)).toBe(0);
    expect(secondsLeft(PAYMENT_POLL_TIMEOUT_MS + 5_000)).toBe(0);
  });
});

describe("paymentResultView · what the athlete reads", () => {
  it("offers the audit's exact timeout copy and a retry", () => {
    const view = paymentResultView({
      ...base,
      elapsedMs: PAYMENT_POLL_TIMEOUT_MS,
    });
    expect(view.state).toBe("timeout");
    expect(view.body).toBe(
      "Seguimos esperando la confirmación de Mercado Pago. Te avisamos por correo.",
    );
    expect(view.showSpinner).toBe(false);
    expect(view.showRetry).toBe(true);
  });

  it("stops the spinner on every decided state", () => {
    for (const status of ["PAID", "FAILED", "REFUNDED"] as const) {
      expect(paymentResultView({ ...base, status }).showSpinner).toBe(false);
    }
  });

  it("offers a retry only where retrying makes sense", () => {
    expect(paymentResultView({ ...base, status: "PAID" }).showRetry).toBe(
      false,
    );
    expect(paymentResultView({ ...base, status: "FAILED" }).showRetry).toBe(
      true,
    );
  });

  it("uses tuteo, never voseo, in its copy", () => {
    const bodies = [
      paymentResultView({ ...base }),
      paymentResultView({ ...base, status: "PAID" }),
      paymentResultView({ ...base, status: "FAILED" }),
      paymentResultView({ ...base, elapsedMs: PAYMENT_POLL_TIMEOUT_MS }),
    ].map((v) => `${v.title} ${v.body}`);
    for (const copy of bodies) {
      expect(copy).not.toMatch(/intentá|podés|tenés|querés/i);
    }
  });
});
