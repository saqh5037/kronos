/**
 * Human labels for the Box's locale, currency and timezone selects.
 *
 * `/admin/ajustes` asked the owner to choose between `es-MX`, `pt-BR` and
 * `America/Argentina/Buenos_Aires` — identifiers written for a runtime, not
 * for a person (audit 2026-09-15, S7: "raw codes in the UI"). The stored value
 * is unchanged; only what the owner reads is.
 *
 * Same contract as `src/lib/labels.ts`: `Record<T, string>` keyed on the union,
 * so adding a supported value to `src/lib/validations/box.ts` breaks the build
 * until it has a label.
 */
import type {
  SUPPORTED_CURRENCIES,
  SUPPORTED_LOCALES,
  SUPPORTED_TIMEZONES,
} from "@/lib/validations/box";

type Locale = (typeof SUPPORTED_LOCALES)[number];
type Currency = (typeof SUPPORTED_CURRENCIES)[number];
type Timezone = (typeof SUPPORTED_TIMEZONES)[number];

export const localeLabel: Record<Locale, string> = {
  "es-MX": "Español (México)",
  "es-AR": "Español (Argentina)",
  "es-ES": "Español (España)",
  "es-CO": "Español (Colombia)",
  "en-US": "Inglés (Estados Unidos)",
  "pt-BR": "Portugués (Brasil)",
};

/** Name first, code second: the owner picks pesos, not "MXN". */
export const currencyLabel: Record<Currency, string> = {
  MXN: "Peso mexicano (MXN)",
  USD: "Dólar estadounidense (USD)",
  ARS: "Peso argentino (ARS)",
  COP: "Peso colombiano (COP)",
  BRL: "Real brasileño (BRL)",
  EUR: "Euro (EUR)",
};

/** The city, as a person would say it — not the IANA path. */
export const timezoneLabel: Record<Timezone, string> = {
  "America/Mexico_City": "Ciudad de México",
  "America/Tijuana": "Tijuana",
  "America/Cancun": "Cancún",
  "America/Bogota": "Bogotá",
  "America/Argentina/Buenos_Aires": "Buenos Aires",
  "America/Sao_Paulo": "São Paulo",
  "Europe/Madrid": "Madrid",
};
