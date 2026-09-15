/**
 * Mexican phone display format (audit 2026-09-15, `/admin/atletas` P3).
 * "5553165435" reads as a serial number; "55 5316 5435" reads as a phone.
 *
 * Grouping follows the local convention: 2-4-4 for the 2-digit area codes
 * (CDMX, Guadalajara, Monterrey) and 3-3-4 for the 3-digit ones.
 */

/** Digits only, dropping a leading MX country code (52 / +52 / 0052). */
export function normalizePhoneMX(raw: string | null | undefined): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("52")) return digits.slice(2);
  if (digits.length === 13 && digits.startsWith("521")) return digits.slice(3);
  if (digits.length === 14 && digits.startsWith("0052")) return digits.slice(4);
  return digits;
}

const TWO_DIGIT_AREA_CODES = new Set(["55", "56", "33", "81"]);

/**
 * "5553165435" becomes "55 5316 5435"; "4771234567" becomes "477 123 4567".
 * Anything that is not a 10-digit national number is returned trimmed and
 * unchanged (never mangled); empty input renders as the fallback.
 */
export function formatPhoneMX(
  raw: string | null | undefined,
  fallback = "—",
): string {
  const original = (raw ?? "").trim();
  if (!original) return fallback;
  const digits = normalizePhoneMX(original);
  if (digits.length !== 10) return original;
  if (TWO_DIGIT_AREA_CODES.has(digits.slice(0, 2))) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

/** `tel:` href for the same number — +52 when we have 10 national digits. */
export function phoneHrefMX(raw: string | null | undefined): string | null {
  const digits = normalizePhoneMX(raw);
  if (digits.length !== 10) return null;
  return `tel:+52${digits}`;
}
