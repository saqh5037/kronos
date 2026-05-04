import { z } from "zod";

export const planTypes = [
  "MONTHLY",
  "ANNUAL",
  "PACKAGE",
  "DROPIN",
  "UNLIMITED",
  "FAMILY",
] as const;
export type PlanType = (typeof planTypes)[number];

export const membershipStatuses = [
  "PENDING",
  "ACTIVE",
  "PAUSED",
  "EXPIRED",
  "CANCELLED",
] as const;
export type MembershipStatus = (typeof membershipStatuses)[number];

export const membershipPlanSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(80),
  type: z.enum(planTypes).default("MONTHLY"),
  price: z.coerce.number().min(0).max(100000),
  currency: z.string().min(3).max(5).default("MXN"),
  classesPerMonth: z.coerce
    .number()
    .int()
    .min(0)
    .max(500)
    .optional()
    .nullable()
    .transform((v) => (v === 0 ? null : v)),
  durationDays: z.coerce
    .number()
    .int()
    .min(1)
    .max(3650)
    .optional()
    .nullable()
    .transform((v) => (v === 0 ? null : v)),
  isActive: z.coerce.boolean().default(true),
});

export type MembershipPlanInput = z.infer<typeof membershipPlanSchema>;

export const membershipAssignSchema = z.object({
  athleteId: z.string().min(1, "Atleta requerido"),
  planId: z.string().min(1, "Plan requerido"),
  startDate: z
    .union([z.string(), z.date()])
    .transform((v) => (v instanceof Date ? v : new Date(v)))
    .refine((d) => !Number.isNaN(d.getTime()), "Fecha inválida"),
  autoRenew: z.coerce.boolean().default(true),
  pendingPayment: z.coerce.boolean().default(false),
});

export type MembershipAssignInput = z.infer<typeof membershipAssignSchema>;
