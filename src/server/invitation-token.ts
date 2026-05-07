import { randomBytes } from "node:crypto";

export function buildInvitationToken(): string {
  return randomBytes(24).toString("hex");
}
