import {
  MercadoPagoConfig,
  Preference,
  Payment as MpPayment,
} from "mercadopago";

let cachedConfig: MercadoPagoConfig | null = null;

function getAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "MERCADOPAGO_ACCESS_TOKEN no está configurado. Agregarlo a .env.local (TEST-... en dev, APP_USR-... en prod).",
    );
  }
  return token;
}

export function getMpConfig(): MercadoPagoConfig {
  if (!cachedConfig) {
    cachedConfig = new MercadoPagoConfig({
      accessToken: getAccessToken(),
      options: { timeout: 10_000 },
    });
  }
  return cachedConfig;
}

export function getPreferenceClient() {
  return new Preference(getMpConfig());
}

export function getPaymentClient() {
  return new MpPayment(getMpConfig());
}

export function isMpConfigured(): boolean {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

/**
 * Resolves the MercadoPago back/callback base URL (used to build success/
 * failure return URLs and webhook back-references).
 *
 * Fail-fast in production: never silently fall back to localhost. A localhost
 * back-url shipped to prod silently breaks the payment redirect flow — the
 * user is sent to an unreachable URL after paying.
 */
export function resolveMpBackUrlBase(): string {
  const base = process.env.MP_BACK_URL_BASE?.trim();
  if (base) return base;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "MP_BACK_URL_BASE no está configurado en producción. Es obligatorio para las URLs de retorno de MercadoPago (ej: https://www.kronos-fit.com).",
    );
  }
  return "http://localhost:3000";
}

export function resetMpConfigCache() {
  cachedConfig = null;
}
