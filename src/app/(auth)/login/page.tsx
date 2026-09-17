import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import LoginForm from "./LoginForm";
import KCard from "@/components/kronos/KCard";
import { CTA_TRIAL_LABEL } from "@/app/(landing)/_data/cta";

export const metadata = { title: "Kronos — Iniciar sesión" };

type LoginPageProps = {
  searchParams: Promise<{ email?: string; callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    // Cookie corrupta (otro app NextAuth en mismo host, secret rotado, etc.)
    // — dejarla pasar al form; al loguearse se sobrescribe.
  }
  if (session?.user?.id) {
    const role = session.user?.role;
    if (role === "ATHLETE") redirect("/atleta");
    redirect("/admin");
  }

  const params = await searchParams;
  const initialEmail =
    typeof params.email === "string" ? params.email.trim().toLowerCase() : "";

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--k-bg)" }}
    >
      <div className="w-full max-w-sm">
        {/* Wordmark */}
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

        <KCard>
          <div className="p-5">
            <LoginForm initialEmail={initialEmail} />
          </div>
        </KCard>

        {/* Dos caminos, no uno (audit 2026-09-15): antes el único enlace era
            para dueños de box y el atleta que caía aquí no tenía salida. */}
        <p
          className="text-center text-sm mt-6"
          style={{ color: "var(--k-t2)" }}
        >
          ¿Eres atleta?{" "}
          <Link
            href="/atleta-signup"
            className="underline"
            style={{ color: "var(--k-accent)" }}
          >
            Entra o crea tu cuenta gratis
          </Link>
        </p>
        <p
          className="text-center text-xs mt-3"
          style={{ color: "var(--k-t3)" }}
        >
          ¿Tienes un box y todavía no lo das de alta?{" "}
          <Link
            href="/signup"
            className="underline"
            style={{ color: "var(--k-t2)" }}
          >
            {CTA_TRIAL_LABEL}
          </Link>
        </p>
      </div>
    </main>
  );
}
