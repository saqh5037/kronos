import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import LoginForm from "./LoginForm";
import KCard from "@/components/kronos/KCard";

export const metadata = { title: "Kronos — Iniciar sesión" };

export default async function LoginPage() {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    // Cookie corrupta (otro app NextAuth en mismo host, secret rotado, etc.)
    // — dejarla pasar al form; al loguearse se sobrescribe.
  }
  if (session) {
    const role = session.user?.role;
    if (role === "ATHLETE") redirect("/atleta");
    redirect("/admin");
  }

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
            <LoginForm />
          </div>
        </KCard>

        <p
          className="text-center text-xs mt-6"
          style={{ color: "var(--k-t3)" }}
        >
          ¿Aún no tienes box?{" "}
          <Link
            href="/signup"
            className="underline"
            style={{ color: "var(--k-t2)" }}
          >
            Empieza tu trial de 14 días
          </Link>
        </p>
      </div>
    </main>
  );
}
