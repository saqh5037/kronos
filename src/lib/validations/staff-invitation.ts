import { z } from "zod";

export const STAFF_INVITATION_ROLES = ["COACH", "STAFF"] as const;

export const inviteStaffItemSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(80),
  role: z.enum(STAFF_INVITATION_ROLES),
});

export type InviteStaffItem = z.infer<typeof inviteStaffItemSchema>;

export const acceptStaffInvitationSchema = z.object({
  token: z.string().min(8),
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(80),
});

export type AcceptStaffInvitationInput = z.infer<
  typeof acceptStaffInvitationSchema
>;
