"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { RefreshCw } from "lucide-react";

/**
 * Breaks the billing redirect loop when the session cookie is out of date.
 *
 * The middleware gates every /admin route on the `subscriptionStatus` claim
 * inside the JWT cookie. It reads that cookie through `withAuth` and cannot
 * re-issue it, so once the claim says EXPIRED the owner is bounced to
 * /admin/billing on every single admin link — including the "Volver al panel"
 * link on this very page. Each tap navigates and lands right back here, which
 * reads to the owner as the whole menu being dead.
 *
 * The database is the truth, and this page already has it. When the two
 * disagree, one GET to NextAuth's session endpoint re-runs the `jwt` callback,
 * which re-reads the box and re-issues the cookie with the real status — then
 * /admin stops bouncing.
 *
 * `useSession()` is not an option: the app mounts no SessionProvider anywhere,
 * on purpose.
 */
export function StaleSessionRecovery({
  dbStatus,
  bounced,
}: {
  dbStatus: string | null;
  bounced: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "checking" | "stuck">("idle");

  const refresh = useCallback(async () => {
    setState("checking");
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      const session = (await res.json()) as {
        user?: { subscriptionStatus?: string | null };
      } | null;
      const claim = session?.user?.subscriptionStatus ?? null;
      if (claim !== "EXPIRED") {
        router.replace("/admin");
        return;
      }
    } catch {
      // fall through to the manual exit
    }
    setState("stuck");
  }, [router]);

  useEffect(() => {
    // Only when the middleware forced us here AND the database disagrees with
    // the claim that did it. An owner who opened billing on purpose is left
    // alone. Once per tab: a second automatic attempt would be a loop.
    if (!bounced || dbStatus === "EXPIRED" || dbStatus === null) return;
    try {
      if (sessionStorage.getItem("kronos:billing-recovery") === "1") return;
      sessionStorage.setItem("kronos:billing-recovery", "1");
    } catch {
      // private mode — attempting once without the guard is still better than
      // leaving the owner stuck.
    }
    void refresh();
  }, [bounced, dbStatus, refresh]);

  if (!bounced || dbStatus === "EXPIRED" || dbStatus === null) return null;
  if (state === "idle" || state === "checking") return null;

  return (
    <div
      className="k-card"
      style={{
        padding: 16,
        marginTop: 16,
        borderColor: "var(--k-accent-line)",
      }}
    >
      <p style={{ fontSize: 14, color: "var(--k-t1)", margin: 0 }}>
        Tu suscripción está al corriente, pero esta sesión trae información
        vieja y por eso el panel te regresa aquí.
      </p>
      <p style={{ fontSize: 13, color: "var(--k-t2)", margin: "8px 0 14px" }}>
        Entra de nuevo y se resuelve.
      </p>
      <div className="flex flex-wrap" style={{ gap: 10 }}>
        <button
          type="button"
          onClick={() => void refresh()}
          className="k-btn-ghost k-tap"
          style={{ minHeight: 44, paddingInline: 16, borderRadius: 12 }}
        >
          <RefreshCw size={16} aria-hidden style={{ marginRight: 8 }} />
          Reintentar
        </button>
        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: "/login" })}
          className="k-btn-grad k-tap"
          style={{
            minHeight: 44,
            paddingInline: 16,
            borderRadius: 12,
            fontWeight: 700,
          }}
        >
          Cerrar sesión y entrar de nuevo
        </button>
      </div>
    </div>
  );
}
