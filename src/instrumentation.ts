export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }

  if (
    process.env.NODE_ENV === "production" &&
    !process.env.SENTRY_DSN &&
    !process.env.NEXT_PUBLIC_SENTRY_DSN
  ) {
    console.warn(
      "[sentry] DSN no configurado en producción — el monitoreo de errores está deshabilitado.",
    );
  }
}

export { captureRequestError as onRequestError } from "@sentry/nextjs";
