import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { SignOutButton } from "@/components/auth/SignOutButton";
import ThemeToggle from "@/components/ThemeToggle";
import Eyebrow from "@/components/kronos/Eyebrow";

export const metadata = { title: "Kronos — Ajustes" };

export default async function AjustesAtletaPage() {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name ?? session?.user?.email ?? "Atleta";
  const userEmail = session?.user?.email ?? null;

  return (
    <div className="pb-28 px-4 pt-10">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/atleta/perfil"
          aria-label="Volver"
          className="w-9 h-9 rounded-full flex items-center justify-center k-glass shrink-0"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <Eyebrow>Cuenta</Eyebrow>
          <h1 className="font-display font-extrabold text-2xl leading-none mt-1">
            Ajustes
          </h1>
        </div>
      </div>

      {/* User card */}
      <section className="k-card p-5 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-display text-lg font-bold"
            style={{
              background: "var(--k-accent)",
              color: "#0a0a0c",
            }}
          >
            {userName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-base truncate">{userName}</p>
            {userEmail && (
              <p className="text-xs truncate" style={{ color: "var(--k-t3)" }}>
                {userEmail}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Preferences */}
      <section className="k-card p-5 mb-4">
        <p
          className="font-mono text-[10px] font-bold uppercase tracking-wider mb-3"
          style={{ color: "var(--k-t3)" }}
        >
          Preferencias
        </p>
        <div className="flex items-center justify-between gap-3 py-2">
          <div>
            <p className="font-medium text-sm">Tema</p>
            <p className="text-xs" style={{ color: "var(--k-t3)" }}>
              Claro u oscuro
            </p>
          </div>
          <ThemeToggle />
        </div>
      </section>

      {/* Session */}
      <section className="k-card p-5">
        <p
          className="font-mono text-[10px] font-bold uppercase tracking-wider mb-3"
          style={{ color: "var(--k-t3)" }}
        >
          Sesión
        </p>
        <SignOutButton variant="danger" />
      </section>

      <p
        className="text-center text-[10px] mt-8"
        style={{ color: "var(--k-t3)" }}
      >
        Kronos · v1.0
      </p>
    </div>
  );
}
