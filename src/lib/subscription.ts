export type SubscriptionStatus =
  | "TRIAL"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELLED"
  | "EXPIRED";

export function shouldRedirectToBilling(
  status: SubscriptionStatus | null | undefined,
  pathname: string,
): boolean {
  if (status !== "EXPIRED") return false;
  if (!pathname.startsWith("/admin")) return false;
  if (pathname === "/admin/billing" || pathname.startsWith("/admin/billing/")) {
    return false;
  }
  return true;
}
