import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { getEventByAccessToken } from "@/server/actions/events";
import { label } from "@/lib/labels";
import RegisterButton from "./_components/RegisterButton";
import { divisionLabel } from "./_lib/division-label";

export const metadata = { title: "Kronos — Eventos" };
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ token: string }>;
};

function formatDate(d: Date | null) {
  if (!d) return null;
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export default async function EventoLandingPage({ params }: PageProps) {
  const { token } = await params;
  const event = await getEventByAccessToken(token);

  const session = await getServerSession(authOptions).catch(() => null);

  const callbackUrl = `/eventos/${token}`;

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--k-bg)" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 border"
            style={{
              background: "var(--k-surface)",
              borderColor: "var(--k-line-2)",
            }}
          >
            <span
              className="font-display font-bold text-xl"
              style={{ color: "var(--k-accent)" }}
            >
              K
            </span>
          </div>
          <p className="k-eyebrow" style={{ color: "var(--k-t2)" }}>
            Eventos deportivos
          </p>
        </div>

        {!event ? (
          <div className="k-card p-6 text-center">
            <h1 className="font-display text-xl mb-2">Evento no encontrado</h1>
            <p className="text-sm" style={{ color: "var(--k-t2)" }}>
              El código del QR no coincide con ningún evento activo. Verifica
              que tengas el código correcto o pídele uno nuevo a tu organizador.
            </p>
            {/* Salida: este estado era un callejón sin salida (audit 2026-09-15). */}
            <Link
              href="/"
              className="mt-4 inline-flex min-h-11 items-center justify-center gap-1.5 text-sm underline"
              style={{ color: "var(--k-accent)" }}
            >
              <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
              Volver a Kronos
            </Link>
          </div>
        ) : (
          <div className="k-card p-6">
            <div className="mb-4">
              {event.partnerName ? (
                <p
                  className="k-eyebrow mb-1"
                  style={{ color: "var(--k-accent)" }}
                >
                  Organiza · {event.partnerName}
                </p>
              ) : null}
              <h1
                className="font-display text-2xl tracking-tight"
                style={{ color: "var(--k-t1)" }}
              >
                {event.name}
              </h1>
              {event.startDate ? (
                <p className="mt-1 text-sm" style={{ color: "var(--k-t2)" }}>
                  {formatDate(event.startDate)}
                </p>
              ) : null}
            </div>

            {event.description ? (
              <p
                className="text-sm leading-relaxed mb-4 whitespace-pre-line"
                style={{ color: "var(--k-t2)" }}
              >
                {event.description}
              </p>
            ) : null}

            {event.divisions.length > 0 ? (
              <div className="mb-5 flex flex-wrap gap-2">
                {event.divisions.map((d) => (
                  <span key={d} className="k-chip">
                    {divisionLabel(d)}
                  </span>
                ))}
              </div>
            ) : null}

            {event.status !== "OPEN" ? (
              <div
                className="rounded-lg border px-4 py-3 text-sm"
                style={{
                  borderColor: "var(--k-line-2)",
                  background: "var(--k-surface)",
                  color: "var(--k-t2)",
                }}
              >
                Este evento{" "}
                {event.status === "CLOSED"
                  ? "está cerrado"
                  : "no está aceptando inscripciones todavía"}
                .
              </div>
            ) : !session?.user ? (
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                className="k-btn-grad w-full text-center block px-5 py-3 leading-snug"
              >
                Iniciar sesión para inscribirme
              </Link>
            ) : session.user.role !== "ATHLETE" ? (
              <div
                className="rounded-lg border px-4 py-3 text-sm"
                style={{
                  borderColor: "var(--k-line-2)",
                  background: "var(--k-surface)",
                  color: "var(--k-t2)",
                }}
              >
                Inicia sesión como atleta para inscribirte. Tu sesión actual es{" "}
                <strong style={{ color: "var(--k-t1)" }}>
                  {label("role", session.user.role)}
                </strong>
                .{" "}
                <Link
                  href={`/logout?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                  style={{ color: "var(--k-accent)" }}
                >
                  Cambiar de cuenta
                </Link>
              </div>
            ) : (
              <RegisterButton token={token} />
            )}
          </div>
        )}

        <p
          className="mt-6 text-center text-xs"
          style={{ color: "var(--k-t3)" }}
        >
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center gap-1.5"
            style={{ color: "var(--k-t3)" }}
          >
            <ArrowLeft size={14} strokeWidth={1.75} aria-hidden />
            Kronos · Plataforma para boxes y atletas
          </Link>
        </p>
      </div>
    </main>
  );
}
