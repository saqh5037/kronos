import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/server/auth";
import KCard from "@/components/kronos/KCard";
import KronosLogo from "@/components/brand/KronosLogo";
import AtletaSignupForm from "./AtletaSignupForm";

export const metadata = {
  title: "Kronos — Soy atleta",
  description:
    "Registrate gratis y empezá a trackear tus PRs, movimientos y avances. Si tenés box, podés unirte después.",
};

type AtletaSignupPageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function AtletaSignupPage({
  searchParams,
}: AtletaSignupPageProps) {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect(session.user.role === "ATHLETE" ? "/atleta" : "/admin");
  }

  const params = await searchParams;
  const initialEmail = params.email?.toLowerCase().trim() ?? "";

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--k-bg)" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex mb-4">
            <KronosLogo variant="mark" size={56} />
          </div>
          <h1 className="font-display font-bold text-3xl tracking-[-0.01em]">
            Empezá a trackear
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--k-t2)" }}>
            Tus PRs, tus movimientos, tu progreso. Gratis. Sin box requerido.
          </p>
        </div>

        <KCard animate={false}>
          <div className="p-6">
            <AtletaSignupForm initialEmail={initialEmail} />
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
        <p
          className="text-center text-xs mt-2"
          style={{ color: "var(--k-t3)" }}
        >
          ¿Sos dueño de un box?{" "}
          <Link
            href="/signup"
            className="underline"
            style={{ color: "var(--k-t2)" }}
          >
            Registrá tu box acá
          </Link>
        </p>
      </div>
    </main>
  );
}
