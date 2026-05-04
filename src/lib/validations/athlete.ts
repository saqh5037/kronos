import { z } from "zod";

export const athleteSchema = z.object({
  firstName: z.string().min(1, "Nombre requerido").max(100),
  lastName: z.string().min(1, "Apellido requerido").max(100),
  phone: z.string().optional(),
  dob: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  healthHistory: z.string().optional(),
  emergencyContact: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(["ACTIVE", "PAUSED", "DROPIN", "CANCELLED"]).default("ACTIVE"),
});

export type AthleteInput = z.infer<typeof athleteSchema>;
