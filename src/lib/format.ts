/**
 * Shared formatters for money, dates and times (audit 2026-09-15, systemic issues S3/S4).
 * One locale (es-MX), one currency style, 24-hour times across admin.
 */

const MXN = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const MXN_CENTS = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "$2,500 MXN" — whole pesos by default; pass `cents: true` for "$2,500.50 MXN". */
export function formatMXN(
  amount: number,
  opts: { cents?: boolean; suffix?: boolean } = {},
): string {
  const base = (opts.cents ? MXN_CENTS : MXN)
    .format(amount)
    .replace(/\s?MXN\s?/g, "")
    .replace("MX$", "$")
    .trim();
  return opts.suffix === false ? base : `${base} MXN`;
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

const TZ = "America/Mexico_City";

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
  return new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }).format(
    value,
  );
}
