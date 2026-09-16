/**
 * Shared formatters for money, dates and times (audit 2026-09-15, systemic issues S3/S4).
 * One locale (es-MX), one currency style, 24-hour times across admin.
 */

import { DEFAULT_BOX_TIMEZONE } from "@/lib/tz";

const HOUSE_LOCALE = "es-MX";
const HOUSE_CURRENCY = "MXN";

const MONEY_FORMATTERS = new Map<string, Intl.NumberFormat>();

function moneyFormatter(
  locale: string,
  currency: string,
  cents: boolean,
): Intl.NumberFormat {
  const key = `${locale}|${currency}|${cents ? 2 : 0}`;
  const cached = MONEY_FORMATTERS.get(key);
  if (cached) return cached;

  const digits = cents ? 2 : 0;
  let formatter: Intl.NumberFormat;
  try {
    formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  } catch {
    // A box row with a typo in `locale`/`currency` must never 500 a dashboard.
    formatter = new Intl.NumberFormat(HOUSE_LOCALE, {
      style: "currency",
      currency: HOUSE_CURRENCY,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }
  MONEY_FORMATTERS.set(key, formatter);
  return formatter;
}

export type MoneyOptions = {
  /** `Box.locale`. Defaults to es-MX. */
  locale?: string | null;
  /** `Box.currency` (ISO 4217). Defaults to MXN. */
  currency?: string | null;
  /** Two decimals instead of whole units. */
  cents?: boolean;
  /** `false` drops the trailing currency code. */
  suffix?: boolean;
};

/**
 * "$2,500 MXN" — one money style for every screen.
 *
 * The owner dashboard used to build its own `Intl.NumberFormat(box.locale, …)`
 * with no suffix, so "$2,500" on /admin sat beside "$2,500 MXN" on
 * /admin/pagos for the same peso (audit 2026-09-15, S4). Locale and currency
 * stay configurable because `Box.locale`/`Box.currency` exist; the *shape* of
 * the string does not.
 */
export function formatMoney(amount: number, opts: MoneyOptions = {}): string {
  const locale = opts.locale?.trim() || HOUSE_LOCALE;
  const currency = (opts.currency?.trim() || HOUSE_CURRENCY).toUpperCase();
  const formatted = moneyFormatter(locale, currency, opts.cents === true)
    .format(amount)
    // ICU renders the code either as a suffix ("2,500.00 MXN") or as a
    // region-prefixed symbol ("MX$2,500.00"); the house style is neither.
    .replace(new RegExp(`\\s?${currency}\\s?`, "g"), "")
    .replace(/^[A-Z]{2}\$/, "$")
    .trim();
  return opts.suffix === false ? formatted : `${formatted} ${currency}`;
}

/** "$2,500 MXN" — whole pesos by default; pass `cents: true` for "$2,500.50 MXN". */
export function formatMXN(
  amount: number,
  opts: { cents?: boolean; suffix?: boolean } = {},
): string {
  return formatMoney(amount, {
    cents: opts.cents,
    suffix: opts.suffix,
  });
}

/** Signed money delta: "+$1,200 MXN" / "−$3,400 MXN" (true minus sign). */
export function formatMXNDelta(amount: number): string {
  const sign = amount < 0 ? "−" : "+";
  return `${sign}${formatMXN(Math.abs(amount))}`;
}

/** Signed percentage with one decimal: "+12.4 %" / "−51.4 %". */
export function formatPercentDelta(value: number, digits = 1): string {
  const sign = value < 0 ? "−" : "+";
  return `${sign}${Math.abs(value).toFixed(digits)} %`;
}

/**
 * Every formatter here renders in the box timezone, never the server's. It is
 * re-exported so the modules that COMPUTE with dates (countdowns, periods) can
 * use the same zone — the two drifting apart is what printed
 * "faltan 18 días · 2 oct" on a UTC host.
 */
const TZ = DEFAULT_BOX_TIMEZONE;
export { DEFAULT_BOX_TIMEZONE };

/**
 * Browser and Node ICU disagree on es-MX short dates ("mar, 15 de sep" vs "mar 15 sep").
 * Normalise to the house style: no commas, no "de", no trailing dots, single spaces.
 */
function normalizeEsDate(s: string): string {
  return s
    .replace(/\./g, "")
    .replace(/,/g, "")
    .replace(/\bde\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** "15 sep" */
export function formatDateShort(date: Date, timeZone: string = TZ): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    timeZone,
  })
    .format(date)
    .replace(".", "");
}

/** "mar 15 sep" */
export function formatDateWeekday(date: Date, timeZone: string = TZ): string {
  return normalizeEsDate(
    new Intl.DateTimeFormat("es-MX", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone,
    }).format(date),
  );
}

/** "15 sep 2026" */
export function formatDateLong(date: Date, timeZone: string = TZ): string {
  return normalizeEsDate(
    new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone,
    }).format(date),
  );
}

/**
 * "30 de septiembre de 2026" — the formal, unabbreviated date a confirmation
 * screen or a contract uses. Keeps the "de" on purpose: this is the one place
 * the house style is long-form, not the compact `formatDateLong`.
 */
export function formatDateFull(date: Date, timeZone: string = TZ): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(date);
}

/** "septiembre 2026" — month header for the calendar views. */
export function formatMonthYear(date: Date, timeZone: string = TZ): string {
  return normalizeEsDate(
    new Intl.DateTimeFormat("es-MX", {
      month: "long",
      year: "numeric",
      timeZone,
    }).format(date),
  );
}

/** "06:00" — always 24-hour, zero-padded. */
export function formatTime24(date: Date, timeZone: string = TZ): string {
  return new Intl.DateTimeFormat("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(date);
}

/** "1,363" */
export function formatInt(value: number): string {
  return formatDecimal(value, 0);
}

/** "1,363.46" — same thousands separator as the rest of the admin. */
export function formatDecimal(value: number, digits = 0): string {
  return new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}
