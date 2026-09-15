/**
 * Pure state machine for `/atleta/pagos/[id]/resultado`.
 *
 * Audit 2026-09-15 called this "the most anxious screen in the app": an
 * infinite spinner with no amount, no order id, no timeout and no retry. The
 * decision of *what* to render is isolated here so it is testable without a
 * browser, and so the timeout can never be forgotten again.
 *
 * States:
 *  - `processing`  polling, under the timeout
 *  - `paid`        gateway confirmed
 *  - `failed`      gateway rejected
 *  - `timeout`     the wait exceeded TIMEOUT_MS with no decision — the screen
 *                  stops spinning and hands the athlete two exits
 */

export const PAYMENT_POLL_INTERVAL_MS = 2_000;
/** 60 s: the audit's requirement — after this we stop pretending. */
export const PAYMENT_POLL_TIMEOUT_MS = 60_000;

export type GatewayStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type PaymentResultState =
  | "processing"
  | "paid"
  | "failed"
  | "refunded"
  | "timeout";

export type PaymentResultInput = {
  /** Latest status from our own API, null while the first poll is in flight. */
  status: GatewayStatus | null;
  /** `?status=` handed back by Mercado Pago on the return redirect. */
  initialStatus: string | null;
  /** Milliseconds since polling started. */
  elapsedMs: number;
};

export type PaymentResultView = {
  state: PaymentResultState;
  title: string;
  body: string;
  /** Show the spinner only while a decision is still plausible. */
  showSpinner: boolean;
  /** Offer "Reintentar" — a new checkout attempt makes sense. */
  showRetry: boolean;
};

export function isTerminal(status: GatewayStatus | null): boolean {
  return status === "PAID" || status === "FAILED" || status === "REFUNDED";
}

export function paymentResultState(
  input: PaymentResultInput,
): PaymentResultState {
  if (input.status === "PAID") return "paid";
  if (input.status === "FAILED") return "failed";
  if (input.status === "REFUNDED") return "refunded";
  // The redirect can tell us about a rejection before our own poll catches up.
  if (input.status === null && input.initialStatus === "failure") {
    return "failed";
  }
  if (input.elapsedMs >= PAYMENT_POLL_TIMEOUT_MS) return "timeout";
  return "processing";
}

/** Whether the client should schedule another poll. */
export function shouldKeepPolling(input: PaymentResultInput): boolean {
  if (isTerminal(input.status)) return false;
  return input.elapsedMs < PAYMENT_POLL_TIMEOUT_MS;
}

/** Whole seconds left before the screen gives up. Never negative. */
export function secondsLeft(elapsedMs: number): number {
  const left = Math.ceil((PAYMENT_POLL_TIMEOUT_MS - elapsedMs) / 1000);
  return left > 0 ? left : 0;
}

export function paymentResultView(
  input: PaymentResultInput,
): PaymentResultView {
  const state = paymentResultState(input);

  switch (state) {
    case "paid":
      return {
        state,
        title: "Pago confirmado",
        body: "Tu membresía ya está activa.",
        showSpinner: false,
        showRetry: false,
      };
    case "failed":
      return {
        state,
        title: "Pago rechazado",
        body: "Mercado Pago no autorizó el cargo. Puedes intentar con otro método o tarjeta.",
        showSpinner: false,
        showRetry: true,
      };
    case "refunded":
      return {
        state,
        title: "Pago reembolsado",
        body: "Este cargo se devolvió. Si esperabas que siguiera activo, habla con tu coach.",
        showSpinner: false,
        showRetry: false,
      };
    case "timeout":
      return {
        state,
        title: "Seguimos esperando",
        body: "Seguimos esperando la confirmación de Mercado Pago. Te avisamos por correo.",
        showSpinner: false,
        showRetry: true,
      };
    default:
      return {
        state: "processing",
        title: "Procesando tu pago",
        body: "Estamos confirmando el cargo con Mercado Pago. No cierres esta pantalla.",
        showSpinner: true,
        showRetry: false,
      };
  }
}
