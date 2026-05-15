import type { DefaultSession } from "next-auth";
import type { SubscriptionStatus } from "@/lib/subscription";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      tenantId: string;
      subscriptionStatus: SubscriptionStatus | null;
      athleteOnboardedAt: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    tenantId?: string;
    subscriptionStatus?: SubscriptionStatus | null;
    athleteOnboardedAt?: boolean;
  }
}
