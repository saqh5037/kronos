import { z } from "zod";

/**
 * Input para la firma del contrato piloto-beta. El boxId NO viene en el
 * input — sale del token verificado. Aquí solo lo que el owner escribe.
 */
export const pilotBetaSignSchema = z.object({
  // Token magic link de la URL — re-validado server-side.
  token: z.string().min(10, "Token inválido"),
  // Nombre legal completo del firmante (no el del Box).
  fullName: z
    .string()
    .trim()
    .min(3, "Mínimo 3 caracteres")
    .max(120, "Máximo 120 caracteres"),
  // Términos aceptados (checkbox).
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar los términos" }),
  }),
  // Honeypot defensivo.
  website: z.string().max(200).optional().or(z.literal("")),
});

export type PilotBetaSignInput = z.infer<typeof pilotBetaSignSchema>;
