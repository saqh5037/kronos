import LogoutClient from "./LogoutClient";
import { getCachedSession } from "@/server/session";

export const metadata = { title: "Kronos — Cerrar sesión" };

type LogoutPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function LogoutPage({ searchParams }: LogoutPageProps) {
  const params = await searchParams;
  const callbackUrl =
    typeof params.callbackUrl === "string" && params.callbackUrl
      ? params.callbackUrl
      : "/";

  // Read userId server-side so LogoutClient doesn't need useSession()
  // (the /logout page has no SessionProvider in its layout tree).
  const session = await getCachedSession();
  const userId = session?.user?.id;

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--k-bg)" }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 border"
            style={{
              background: "var(--k-surface)",
              borderColor: "var(--k-line-2)",
            }}
          >
            <span
              className="font-display font-bold text-2xl"
              style={{ color: "var(--k-accent)" }}
            >
              K
            </span>
          </div>
          <h1 className="font-display font-bold text-2xl tracking-[0.02em] uppercase">
            Kronos
          </h1>
          <p className="k-eyebrow mt-1">El tiempo es tu rival</p>
        </div>

        <LogoutClient callbackUrl={callbackUrl} userId={userId} />
      </div>
    </main>
  );
}
