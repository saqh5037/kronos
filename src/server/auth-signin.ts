export type SignInUserLookup = (email: string) => Promise<{
  tenantId: string;
} | null>;

export type SignInDecision =
  | { type: "allow" }
  | { type: "redirect"; url: string }
  | { type: "deny" };

export async function validateMagicLinkSignIn(
  provider: string | undefined,
  email: string | null | undefined,
  lookup: SignInUserLookup,
  baseUrl: string = "",
): Promise<SignInDecision> {
  if (provider !== "email") return { type: "allow" };
  const normalized = email?.toLowerCase().trim();
  if (!normalized) return { type: "deny" };
  const user = await lookup(normalized);
  if (!user?.tenantId) {
    const prefix = baseUrl.replace(/\/+$/, "");
    return {
      type: "redirect",
      url: `${prefix}/signup?email=${encodeURIComponent(normalized)}&reason=no_account`,
    };
  }
  return { type: "allow" };
}
