export const INVITATION_DEFAULT_TTL_DAYS = 14;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ParsedInvitation = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
};

export type ParseError = {
  line: number;
  input: string;
  reason: "INVALID_EMAIL";
};

export type ParseResult = {
  valid: ParsedInvitation[];
  duplicates: string[];
  errors: ParseError[];
};

function splitFields(line: string): string[] {
  if (line.includes("\t")) return line.split("\t").map((p) => p.trim());
  if (line.includes(",")) return line.split(",").map((p) => p.trim());
  if (line.includes(";")) return line.split(";").map((p) => p.trim());
  return [line.trim()];
}

function splitName(full: string | undefined): {
  firstName: string | null;
  lastName: string | null;
} {
  const trimmed = (full ?? "").trim();
  if (!trimmed) return { firstName: null, lastName: null };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0]!, lastName: null };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}

export function parseBulkInvitations(input: string): ParseResult {
  const valid: ParsedInvitation[] = [];
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const errors: ParseError[] = [];

  const lines = input.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] ?? "";
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) continue;

    const parts = splitFields(trimmed);
    const email = (parts[0] ?? "").toLowerCase().trim();
    if (!EMAIL_RE.test(email)) {
      errors.push({ line: i + 1, input: trimmed, reason: "INVALID_EMAIL" });
      continue;
    }
    if (seen.has(email)) {
      if (!duplicates.includes(email)) duplicates.push(email);
      continue;
    }
    seen.add(email);

    const { firstName, lastName } = splitName(parts[1]);
    const phoneRaw = parts[2]?.trim();
    const phone = phoneRaw ? phoneRaw : null;

    valid.push({ email, firstName, lastName, phone });
  }

  return { valid, duplicates, errors };
}

export function isInvitationExpired(
  inv: { expiresAt: Date },
  now: Date = new Date(),
): boolean {
  return inv.expiresAt.getTime() <= now.getTime();
}

export type InvitationCheck =
  | { ok: true }
  | { ok: false; reason: "ACCEPTED" | "REVOKED" | "EXPIRED" };

export function isInvitationActionable(
  inv: { expiresAt: Date; acceptedAt: Date | null; revokedAt: Date | null },
  now: Date = new Date(),
): InvitationCheck {
  if (inv.acceptedAt) return { ok: false, reason: "ACCEPTED" };
  if (inv.revokedAt) return { ok: false, reason: "REVOKED" };
  if (isInvitationExpired(inv, now)) return { ok: false, reason: "EXPIRED" };
  return { ok: true };
}

export function buildInvitationExpiry(
  ttlDays: number = INVITATION_DEFAULT_TTL_DAYS,
  from: Date = new Date(),
): Date {
  return new Date(from.getTime() + ttlDays * 24 * 60 * 60 * 1000);
}
