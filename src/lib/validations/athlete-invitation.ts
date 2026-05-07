import { z } from "zod";

export const inviteAthleteItemSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  firstName: z
    .string()
    .trim()
    .min(1, "Mínimo 1 caracter")
    .max(80)
    .nullable()
    .optional(),
  lastName: z.string().trim().max(80).nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
});

export type InviteAthleteItem = z.infer<typeof inviteAthleteItemSchema>;

export const acceptInvitationSchema = z.object({
  token: z.string().min(8),
  firstName: z.string().trim().min(1, "Mínimo 1 caracter").max(80),
  lastName: z.string().trim().max(80).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
});

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
