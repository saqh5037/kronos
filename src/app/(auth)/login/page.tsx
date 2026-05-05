import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import KCard from "@/components/kronos/KCard";

export const metadata = { title: "Kronos — Iniciar sesión" };

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/admin");

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
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
      </div>
    </main>
  );
}
