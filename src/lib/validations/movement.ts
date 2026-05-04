import { z } from "zod";

export const movementSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(80),
  videoUrl: z
    .string()
    .url("URL inválida")
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((v) => (v === "" || v == null ? null : v)),
  standardDescription: z
    .string()
    .max(1000)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  equipment: z.array(z.string().max(40)).default([]),
});

export type MovementInput = z.infer<typeof movementSchema>;
