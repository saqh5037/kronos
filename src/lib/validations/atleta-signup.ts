import { z } from "zod";
import { passwordSchema } from "./password";
import { FITNESS_GOAL_TAGS } from "./athlete";

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
    .min(2, "Mínimo 2 caracteres")
    .max(60, "Máximo 60 caracteres"),
  // Opcional. Si viene, se hashea con bcrypt y se guarda en User.passwordHash.
  // Permite login con email+password desde cualquier browser/PWA — soluciona
  // el bug iOS de magic link cross-browser. Recomendado pero no required.
  password: z
    .string()
    .optional()
    .refine(
      (p) => !p || passwordSchema.safeParse(p).success,
      "Mínimo 10 caracteres con letras y números",
    ),
  // Optional fitness goal tags from signup step. Stored as `goal:<value>` in
  // Athlete.tags so they coexist with existing prefixes (level:*).
  fitnessGoals: z.array(z.enum(FITNESS_GOAL_TAGS)).optional(),
});

export type AtletaSignupInput = z.infer<typeof atletaSignupSchema>;
