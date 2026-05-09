import { z } from "zod";

export const atletaSignupSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  firstName: z
    .string()
    .trim()
    .min(2, "Mínimo 2 caracteres")
    .max(60, "Máximo 60 caracteres"),
  lastName: z
    .string()
    .trim()
    .max(60, "Máximo 60 caracteres")
    .optional()
    .default(""),
});

export type AtletaSignupInput = z.infer<typeof atletaSignupSchema>;
