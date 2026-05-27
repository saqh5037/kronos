import * as Sentry from "@sentry/nextjs";

/**
 * Reports a swallowed error to both the console and Sentry. Use in catch blocks
 * that handle an operation failure and return a response (so the error never
 * propagates to Next's onRequestError hook and would otherwise be invisible).
 */
export function reportError(
  context: string,
  err: unknown,
  extra?: Record<string, unknown>,
): void {
  console.error(`[${context}]`, err);
  Sentry.captureException(err, {
    tags: { context },
    ...(extra ? { extra } : {}),
  });
}
