import { z } from "zod";
import { signupSchema } from "./signup";

/**
 * Schema para onboarding manual de Box piloto por super-admin.
 *
 * Reutiliza el base signupSchema (email/ownerName/boxName/slug) y agrega
 * campos exclusivos del flujo piloto: disciplina, geo, exclusividad,
 * feature flags, duración trial custom.
 */

export const PILOT_DISCIPLINE_SLUGS = ["crossfit", "hyrox"] as const;
export type PilotDisciplineSlug = (typeof PILOT_DISCIPLINE_SLUGS)[number];

export const pilotOnboardingSchema = signupSchema.extend({
  disciplineSlug: z.enum(PILOT_DISCIPLINE_SLUGS),

  city: z
    .string()
    .trim()
    .min(2, "Mínimo 2 caracteres")
    .max(80, "Máximo 80 caracteres"),
  country: z
    .string()
    .trim()
    .length(2, "Código ISO de 2 letras (MX, CO, PE, etc.)")
    .toUpperCase()
    .default("MX"),
  region: z.string().trim().max(80).optional().or(z.literal("")),

  // Trial duration custom para pilotos (default 30 días vs 14 estándar)
  trialDurationDays: z
    .number()
    .int()
    .min(7, "Mínimo 7 días")
    .max(180, "Máximo 180 días")
    .default(30),

  // Exclusividad geográfica en días desde now (default 60d)
  exclusivityDays: z
    .number()
    .int()
    .min(0, "0 = sin exclusividad")
    .max(365)
    .default(60),

  // Feature flags habilitadas para este Box (whitelist por seguridad)
  enableHyroxUI: z.boolean().default(false),
  enableMmAthlete: z.boolean().default(false),

  // Honeypot defensivo (no esperado en super-admin, pero por consistencia)
  website: z.string().max(200).optional().or(z.literal("")),
});

export type PilotOnboardingInput = z.infer<typeof pilotOnboardingSchema>;
