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

export function resetMpConfigCache() {
  cachedConfig = null;
}
