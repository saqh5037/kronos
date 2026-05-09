import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/server/auth";
import KCard from "@/components/kronos/KCard";
import KronosLogo from "@/components/brand/KronosLogo";
import SignupForm from "./SignupForm";

export const metadata = { title: "Kronos — Empezá tu trial" };

type SignupPageProps = {
  searchParams: Promise<{ email?: string; reason?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect(session.user.role === "ATHLETE" ? "/atleta" : "/admin");
  }

  const params = await searchParams;
  const initialEmail = params.email?.toLowerCase().trim() ?? "";
  const reason = params.reason ?? "";

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--k-bg)" }}
    >
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex mb-4">
            <KronosLogo variant="mark" size={56} />
          </div>
          <h1 className="font-display font-bold text-3xl tracking-[-0.01em]">
            Empezá tu trial
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--k-t2)" }}>
            14 días gratis. Sin tarjeta. Tu box operando hoy mismo.
          </p>
        </div>

        <KCard animate={false}>
          <div className="p-6">
            <SignupForm initialEmail={initialEmail} reason={reason} />
          </div>
        </KCard>

        <p
          className="text-center text-xs mt-6"
          style={{ color: "var(--k-t3)" }}
        >
          ¿Ya tenés cuenta?{" "}
          <Link
            href="/login"
            className="underline"
            style={{ color: "var(--k-t2)" }}
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
