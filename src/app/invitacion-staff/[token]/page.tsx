import Link from "next/link";
import { notFound } from "next/navigation";
import KronosLogo from "@/components/brand/KronosLogo";
import { getStaffInvitationByToken } from "@/server/actions/staff-invitations";
import { isInvitationActionable } from "@/lib/staff-invitation";
import { AcceptStaffInvitationForm } from "./_components/AcceptStaffInvitationForm";

export const metadata = { title: "Kronos — Invitación al equipo" };
export const dynamic = "force-dynamic";

export default async function StaffInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const inv = await getStaffInvitationByToken(token);

  // Token que no resuelve a nada: 404 real (audit 2026-09-15).
  if (!inv) notFound();

  const check = isInvitationActionable(inv);
  if (!check.ok) {
    if (check.reason === "ACCEPTED") {
      return (
        <Layout boxName={inv.box.name} brandColor={inv.box.brandColor ?? null}>
          <p className="font-bold text-[var(--k-accent)] text-lg mb-2">
            ✓ ¡Listo!
          </p>
          <h1 className="font-display text-2xl font-bold mb-3">
            Tu cuenta ya está activa
          </h1>
          <p className="text-[var(--k-t2)] mb-6">
            Inicia sesión con tu correo <strong>{inv.email}</strong> para entrar
            al panel del Box.
          </p>
          <Link
            href={`/login?email=${encodeURIComponent(inv.email)}`}
            className="k-btn-grad w-full text-center block"
          >
            Iniciar sesión
          </Link>
        </Layout>
      );
    }
    const expired = check.reason === "EXPIRED";
    return (
      <Layout boxName={inv.box.name} brandColor={inv.box.brandColor ?? null}>
        <h1 className="font-display text-2xl font-bold mb-3">
          {expired ? "Esta invitación expiró" : "Esta invitación fue cancelada"}
        </h1>
        <p className="text-[var(--k-t2)] mb-6">
          {expired
            ? `La invitación de ${inv.box.name} ya venció.`
            : `${inv.box.name} canceló esta invitación.`}{" "}
          Pídele al dueño del box que te mande una nueva desde el panel.
        </p>
        <StaffInvitationActions />
      </Layout>
    );
  }

  const roleLabel = inv.role === "COACH" ? "coach" : "staff";

  return (
    <Layout boxName={inv.box.name} brandColor={inv.box.brandColor ?? null}>
      <p className="k-eyebrow text-[var(--k-t3)] mb-1">Invitación al equipo</p>
      <h1 className="font-display text-3xl font-bold mb-2">
        Te invitaron a{" "}
        <span style={{ color: "var(--k-accent)" }}>{inv.box.name}</span> como{" "}
        <em style={{ color: "var(--k-accent)" }}>{roleLabel}</em>
      </h1>
      <p className="text-[var(--k-t2)] mb-6">
        Confirma tu nombre para activar tu cuenta y entrar al panel del Box.
      </p>

      <AcceptStaffInvitationForm
        token={token}
        email={inv.email}
        defaultName={inv.name ?? ""}
      />
    </Layout>
  );
}

/**
 * A un coach lo invita el dueño del box, no "su Box" (audit 2026-09-15). Su
 * salida primaria sigue siendo una cuenta gratis: con ella entra hoy y el dueño
 * la conecta al equipo después.
 */
export function StaffInvitationActions() {
  return (
    <div className="flex flex-col gap-3">
      <Link href="/atleta-signup" className="k-btn-grad w-full text-center">
        Crear cuenta gratis
      </Link>
      <Link href="/login" className="k-btn-ghost w-full text-center">
        Ya tengo cuenta
      </Link>
    </div>
  );
}

export function Layout({
  children,
  boxName,
  brandColor,
}: {
  children: React.ReactNode;
  boxName?: string;
  brandColor?: string | null;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--k-bg)]">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-6">
          <KronosLogo variant="lockup-h" size={34} />
          <p className="text-xs text-center text-[var(--k-t3)] max-w-[22rem]">
            Kronos es el sistema con el que un box lleva clases, reservas, WODs,
            asistencia y cobros en un solo lugar.
          </p>
          {boxName && (
            <p
              className="k-eyebrow text-center"
              style={{ color: brandColor ?? "var(--k-t3)" }}
            >
              {boxName}
            </p>
          )}
        </div>
        <div className="k-card p-6">{children}</div>
      </div>
    </div>
  );
}
