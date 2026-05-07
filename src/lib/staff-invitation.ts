export {
  INVITATION_DEFAULT_TTL_DAYS,
  isInvitationExpired,
  isInvitationActionable,
  buildInvitationExpiry,
  type InvitationCheck,
} from "./athlete-invitation";

export const STAFF_INVITATION_ROLES = ["COACH", "STAFF"] as const;
export type StaffInvitationRole = (typeof STAFF_INVITATION_ROLES)[number];
