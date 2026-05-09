import { z } from "zod";
import { signupSchema } from "./signup";

export const BillingCycle = z.enum(["monthly", "annual"]);
export type BillingCycle = z.infer<typeof BillingCycle>;

export const foundingReservationSchema = signupSchema.extend({
  billingCycle: BillingCycle,
  phone: z
    .string()
    .trim()
    .max(40, "Máximo 40 caracteres")
    .optional()
    .or(z.literal("")),
});

export type FoundingReservationInput = z.infer<
  typeof foundingReservationSchema
>;
