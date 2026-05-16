import { z } from "zod";
import { signupSchema } from "./signup";

export const BillingCycle = z.enum(["monthly", "annual"]);
export type BillingCycle = z.infer<typeof BillingCycle>;

export const FoundingDisciplineSlug = z.enum(["crossfit", "hyrox"]);
export type FoundingDisciplineSlugType = z.infer<typeof FoundingDisciplineSlug>;

export const foundingReservationSchema = signupSchema.extend({
  billingCycle: BillingCycle,
  // Disciplina principal del Box. Default crossfit por retrocompat — signups
  // pre-F1.9 no enviaban este campo.
  disciplineSlug: FoundingDisciplineSlug.default("crossfit"),
  phone: z
    .string()
    .trim()
    .max(40, "Máximo 40 caracteres")
    .optional()
    .or(z.literal("")),
  // Honeypot — campo oculto al usuario, debe quedar vacío.
  // Si un bot lo rellena, la action devuelve fake-success sin tocar DB.
  website: z.string().max(200).optional().or(z.literal("")),
});

export type FoundingReservationInput = z.infer<
  typeof foundingReservationSchema
>;
