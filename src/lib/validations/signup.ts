import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  ownerName: z
    .string()
    .trim()
    .min(2, "Mínimo 2 caracteres")
    .max(80, "Máximo 80 caracteres"),
  boxName: z
    .string()
    .trim()
    .min(2, "Mínimo 2 caracteres")
    .max(120, "Máximo 120 caracteres"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Mínimo 2 caracteres")
    .max(40, "Máximo 40 caracteres")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Solo minúsculas, números y guiones (sin espacios ni acentos)",
    ),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const TRIAL_DURATION_DAYS = 14;
