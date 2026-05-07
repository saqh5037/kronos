import { z } from "zod";

export const PLAN_TYPES = [
  "MONTHLY",
  "ANNUAL",
  "PACKAGE",
  "DROPIN",
  "UNLIMITED",
  "FAMILY",
] as const;

export const onboardingPlanSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(80),
  type: z.enum(PLAN_TYPES),
  price: z.coerce.number().min(0, "Precio no puede ser negativo").max(99999),
  classesPerMonth: z.coerce
    .number()
    .int()
    .min(0)
    .max(200)
    .optional()
    .nullable(),
  durationDays: z.coerce.number().int().min(0).max(3650).optional().nullable(),
});

export type OnboardingPlanInput = z.infer<typeof onboardingPlanSchema>;

export const STAFF_ROLES = ["COACH", "STAFF"] as const;

export const onboardingInviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(80),
  role: z.enum(STAFF_ROLES),
});

export type OnboardingInviteInput = z.infer<typeof onboardingInviteSchema>;
