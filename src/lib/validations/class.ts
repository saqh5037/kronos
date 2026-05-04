import { z } from "zod";

export const recurrenceFreqs = ["NONE", "DAILY", "WEEKLY"] as const;
export type RecurrenceFreq = (typeof recurrenceFreqs)[number];

export const recurrenceSchema = z
  .object({
    freq: z.enum(recurrenceFreqs).default("NONE"),
    count: z.coerce.number().int().min(1).max(52).optional(),
  })
  .optional();

export const classSchema = z.object({
  startsAt: z
    .union([z.string(), z.date()])
    .transform((v) => (v instanceof Date ? v : new Date(v)))
    .refine((d) => !Number.isNaN(d.getTime()), "Fecha inválida"),
  durationMin: z.coerce.number().int().min(15).max(240).default(60),
  capacity: z.coerce.number().int().min(1).max(50).default(16),
  coachId: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  wodId: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  recurrence: recurrenceSchema,
});

export type ClassInput = z.infer<typeof classSchema>;
export type RecurrenceInput = z.infer<typeof recurrenceSchema>;

/**
 * Serialize recurrence config to a minimal RFC 5545-style RRULE string.
 * Returns null when there is no recurrence.
 */
export function recurrenceToRRule(rec: RecurrenceInput): string | null {
  if (!rec || rec.freq === "NONE") return null;
  const parts = [`FREQ=${rec.freq}`];
  if (rec.count) parts.push(`COUNT=${rec.count}`);
  return parts.join(";");
}

/**
 * Expand an RRULE string to a list of Date instances starting at `start`.
 * Returns [start] when rrule is null. Default count is 12 if absent.
 */
export function expandRecurrence(start: Date, rrule: string | null): Date[] {
  if (!rrule) return [start];

  const params = Object.fromEntries(
    rrule.split(";").map((p) => {
      const [k, v] = p.split("=");
      return [k, v];
    }),
  );

  const freq = params.FREQ as "DAILY" | "WEEKLY" | undefined;
  const count = Number.parseInt(params.COUNT ?? "12", 10);
  if (!freq || !Number.isFinite(count) || count <= 0) return [start];

  const stepDays = freq === "DAILY" ? 1 : 7;
  const result: Date[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * stepDays);
    result.push(d);
  }
  return result;
}
