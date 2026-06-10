import Link from "next/link";
import { getStaffInvitationByToken } from "@/server/actions/staff-invitations";
import { isInvitationActionable } from "@/lib/staff-invitation";
import { AcceptStaffInvitationForm } from "./_components/AcceptStaffInvitationForm";

export const metadata = { title: "Kronos — Invitación Staff" };
export const dynamic = "force-dynamic";

export default async function StaffInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const inv = await getStaffInvitationByToken(token);

  if (!inv) {
    return (
      <Layout>
        <h1 className="font-display text-2xl font-bold mb-3">
          Invitación no encontrada
        </h1>
        <p className="text-[var(--k-t2)] mb-6">
          Este link no coincide con ninguna invitación. Pedile a tu Box que te
          envíe uno nuevo.
        </p>
        <Link href="/login" className="k-btn-ghost">
          Ir al login
        </Link>
      </Layout>
    );
  }

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
            Iniciá sesión con tu email <strong>{inv.email}</strong> para entrar
            al admin del Box.
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
    const message =
      check.reason === "EXPIRED"
        ? "Esta invitación expiró. Pedile a tu Box que te envíe una nueva."
        : "Esta invitación fue revocada por tu Box.";
    return (
      <Layout boxName={inv.box.name}>
        <h1 className="font-display text-2xl font-bold mb-3">
          {check.reason === "EXPIRED"
            ? "Invitación expirada"
            : "Invitación revocada"}
        </h1>
        <p className="text-[var(--k-t2)] mb-6">{message}</p>
        <Link href="/login" className="k-btn-ghost">
          Ir al login
        </Link>
      </Layout>
    );
  }

  const roleLabel = inv.role === "COACH" ? "coach" : "staff";

  return (
    <Layout boxName={inv.box.name} brandColor={inv.box.brandColor ?? null}>
      <p className="k-eyebrow text-[var(--k-t3)] mb-1">Invitación staff</p>
      <h1 className="font-display text-3xl font-bold mb-2">
        Te invitaron a{" "}
        <span style={{ color: "var(--k-accent)" }}>{inv.box.name}</span> como{" "}
        <em style={{ color: "var(--k-accent)" }}>{roleLabel}</em>
      </h1>
      <p className="text-[var(--k-t2)] mb-6">
        Confirma tu nombre para activar tu cuenta y entrar al admin del Box.
      </p>

      <AcceptStaffInvitationForm
        token={token}
        email={inv.email}
        defaultName={inv.name ?? ""}
      />
    </Layout>
  );
}

function Layout({
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
        {boxName && (
          <p
            className="k-eyebrow text-center mb-6"
            style={{ color: brandColor ?? "var(--k-t3)" }}
          >
            {boxName}
          </p>
        )}
        <div className="k-card p-6">{children}</div>
        <p className="mt-4 text-xs text-center text-[var(--k-t3)]">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="text-[var(--k-accent)] hover:underline"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
