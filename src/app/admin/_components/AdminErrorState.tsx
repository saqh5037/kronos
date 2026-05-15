"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminDashboardErrorKind } from "@/lib/errors";

type Props = {
  kind: AdminDashboardErrorKind;
  /** Email del usuario en sesión (si lo hay) para incluir en mailto */
  userEmail?: string | null;
  /** User id en sesión, útil para soporte */
  userId?: string | null;
  /** Stack trace solo si estamos en dev — el page.tsx decide pasarlo o no */
  devDetail?: string | null;
};

type Copy = {
  eyebrow: string;
  title: string;
  body: string;
  primary: { label: string; action: "logout" | "retry" | "mailto" };
};

function buildCopy({
  kind,
  userEmail,
  userId,
}: {
  kind: AdminDashboardErrorKind;
  userEmail?: string | null;
  userId?: string | null;
}): Copy & { mailtoHref?: string } {
  switch (kind) {
    case "UNAUTHORIZED":
      return {
        eyebrow: "SESIÓN",
        title: "Tu sesión perdió el contexto del box.",
        body: "Esto suele pasar tras un cambio reciente de cuenta o cookie corrupta. Vuelve a iniciar sesión para continuar.",
        primary: {
          label: "Cerrar sesión y entrar de nuevo",
          action: "logout",
        },
      };
    case "BOX_NOT_FOUND": {
      const subject = encodeURIComponent("Mi box no aparece — necesito ayuda");
      const lines = [
        "Hola equipo Kronos,",
        "",
        "Cuando entro a /admin me dice que no encuentran mi box.",
        userEmail ? `Email: ${userEmail}` : "",
        userId ? `User ID: ${userId}` : "",
        "",
        "Gracias.",
      ].filter(Boolean);
      const body = encodeURIComponent(lines.join("\n"));
      return {
        eyebrow: "INCIDENCIA",
        title: "No encontramos tu box en el sistema.",
        body: "Esto puede ser una incidencia técnica de nuestro lado. Escríbenos a soporte y lo revisamos.",
        primary: { label: "Contactar soporte", action: "mailto" },
        mailtoHref: `mailto:soporte@kronos-fit.com?subject=${subject}&body=${body}`,
      };
    }
    case "DB_ERROR":
    default:
      return {
        eyebrow: "CONEXIÓN",
        title: "No pudimos conectar con la base de datos.",
        body: "Esto suele resolverse solo en pocos segundos. Reintenta o avísanos si persiste.",
        primary: { label: "Reintentar", action: "retry" },
      };
  }
}

export default function AdminErrorState({
  kind,
  userEmail,
  userId,
  devDetail,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const copy = buildCopy({ kind, userEmail, userId });

  function handleClick() {
    if (copy.primary.action === "logout") {
      window.location.href = "/api/auth/signout?callbackUrl=/login";
      return;
    }
    if (copy.primary.action === "mailto") {
      if (copy.mailtoHref) window.location.href = copy.mailtoHref;
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--k-bg)",
        color: "var(--k-t1)",
        padding: "64px 24px",
        fontFamily: "var(--k-font-body)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ maxWidth: 560, width: "100%" }}>
        <p
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 11,
            letterSpacing: "0.22em",
            color: "var(--k-t3)",
            margin: 0,
            marginBottom: 14,
            fontWeight: 600,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--k-accent)",
              marginRight: 10,
              verticalAlign: "middle",
            }}
          />
          {copy.eyebrow}
        </p>

        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            color: "var(--k-t1)",
            margin: 0,
            marginBottom: 16,
          }}
        >
          {copy.title}
        </h1>

        <p
          style={{
            color: "var(--k-t2)",
            fontSize: 15,
            lineHeight: 1.55,
            margin: 0,
            marginBottom: 28,
          }}
        >
          {copy.body}
        </p>

        <button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          className="lp-btn-lime lp-btn-lg"
          style={{
            cursor: isPending ? "wait" : "pointer",
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending ? "Cargando…" : copy.primary.label}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>

        {devDetail ? (
          <details
            style={{
              marginTop: 32,
              padding: 16,
              border: "1px solid var(--k-line)",
              borderRadius: 8,
              fontFamily: "var(--k-font-display)",
              fontSize: 12,
              color: "var(--k-t3)",
            }}
          >
            <summary style={{ cursor: "pointer", outline: "none" }}>
              Detalle técnico (solo en desarrollo)
            </summary>
            <pre
              style={{
                marginTop: 12,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                color: "var(--k-t2)",
                fontSize: 11,
                lineHeight: 1.4,
              }}
            >
              {devDetail}
            </pre>
          </details>
        ) : null}
      </div>
    </main>
  );
}
