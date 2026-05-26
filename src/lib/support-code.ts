/**
 * Support code helpers for Kronos super-admin impersonation.
 *
 * Format: KRN-XXXX (4 chars from an unambiguous alphabet).
 * Alphabet: ABCDEFGHJKLMNPQRSTUVWXYZ23456789
 *   → excludes O, 0, I, 1, L to prevent visual confusion.
 *
 * Codes are static per Box (nullable in schema). They are generated once
 * and stored — they never rotate automatically. A super-admin can look up a
 * box by its code without enumerating IDs.
 */

import { randomInt } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 4;
const PREFIX = "KRN-";
const MAX_RETRIES = 10;

/**
 * Generates a raw 4-character code (no prefix, no dash).
 * Uses crypto.randomInt for cryptographically secure randomness.
 */
function generateRaw(): string {
  let result = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    result += ALPHABET[randomInt(ALPHABET.length)];
  }
  return result;
}

/**
 * Returns a new "KRN-XXXX" support code.
 * Does NOT check for collisions — use generateUniqueSupportCode for that.
 */
export function generateSupportCode(): string {
  return `${PREFIX}${generateRaw()}`;
}

/**
 * Generates a support code guaranteed to be unique in the DB.
 * Retries up to MAX_RETRIES times on collision (@unique constraint).
 *
 * @param prisma — raw PrismaClient (not withTenant — Box is cross-tenant).
 */
export async function generateUniqueSupportCode(
  prisma: PrismaClient,
): Promise<string> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const code = generateSupportCode();
    const existing = await prisma.box.findUnique({
      where: { supportCode: code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  throw new Error(
    `Failed to generate unique support code after ${MAX_RETRIES} attempts`,
  );
}

/**
 * Normalizes a user-supplied support code to the canonical "KRN-XXXX" format.
 *
 * Tolerates:
 *   - Lowercase: "krn-a7k2" → "KRN-A7K2"
 *   - No dashes:  "KRNA7K2"  → "KRN-A7K2"
 *   - Spaces:     "KRN A7K2" → "KRN-A7K2"
 *   - Extra dashes: "KRN--A7K2" → "KRN-A7K2"
 *
 * Returns null if the result doesn't match the expected pattern.
 */
export function normalizeSupportCode(raw: string): string | null {
  // Strip whitespace, uppercase
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, "");

  // Try to extract exactly "KRN" + 4 alphanumeric chars
  const match = cleaned.match(/^KRN[-]?([A-Z0-9]{4})$/);
  if (!match) return null;

  return `${PREFIX}${match[1]}`;
}
