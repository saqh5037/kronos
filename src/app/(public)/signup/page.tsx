import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/server/auth";
import KCard from "@/components/kronos/KCard";
import SignupForm from "./SignupForm";

export const metadata = { title: "Kronos — Empezá tu trial" };

export default async function SignupPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect(session.user.role === "ATHLETE" ? "/atleta" : "/admin");
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--bg)" }}
    >
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 border"
            style={{
              background: "var(--card)",
              borderColor: "var(--line-strong)",
            }}
          >
            <span
              className="font-display font-bold text-2xl"
              style={{ color: "var(--fire)" }}
            >
              K
            </span>
          </div>
          <h1 className="font-display font-bold text-3xl tracking-[-0.01em]">
            Empezá tu trial
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-2)" }}>
            14 días gratis. Sin tarjeta. Tu box operando hoy mismo.
          </p>
        </div>

        <KCard animate={false}>
          <div className="p-6">
            <SignupForm />
          </div>
        </KCard>

        <p
          className="text-center text-xs mt-6"
          style={{ color: "var(--text-3)" }}
        >
          ¿Ya tenés cuenta?{" "}
          <Link
            href="/login"
            className="underline"
            style={{ color: "var(--text-2)" }}
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
