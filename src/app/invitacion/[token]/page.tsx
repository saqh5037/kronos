import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { getInvitationByToken } from "@/server/actions/athlete-invitations";
import { isInvitationActionable } from "@/lib/athlete-invitation";
import { AcceptInvitationForm } from "./_components/AcceptInvitationForm";
import { Layout, InvitationActions } from "./_components/InvitationShell";

export const metadata = { title: "Kronos — Invitación" };
export const dynamic = "force-dynamic";

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const inv = await getInvitationByToken(token);

  // Token que no resuelve a nada: 404 real (audit 2026-09-15). El estado vive
  // en not-found.tsx, con logo, explicación y una sola acción primaria.
  if (!inv) notFound();

  const check = isInvitationActionable(inv);
  if (!check.ok) {
    if (check.reason === "ACCEPTED") {
      return (
        <Layout boxName={inv.box.name} brandColor={inv.box.brandColor ?? null}>
          <p className="font-bold text-[var(--k-accent)] text-lg mb-2 inline-flex items-center gap-1.5">
            <Check size={18} aria-hidden />
            ¡Listo!
          </p>
          <h1 className="font-display text-2xl font-bold mb-3">
            Tu cuenta ya está creada
          </h1>
          <p className="text-[var(--k-t2)] mb-6">
            Inicia sesión con tu correo <strong>{inv.email}</strong> para entrar
            a la app.
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
        <p className="text-[var(--k-t2)] mb-4">
          {expired
            ? `La invitación de ${inv.box.name} ya venció.`
            : `${inv.box.name} canceló esta invitación.`}{" "}
          Escríbele a tu coach y te manda una nueva.
        </p>
        <p className="text-[var(--k-t2)] mb-6">
          Mientras tanto puedes crear tu cuenta gratis: registras tus PRs y tu
          racha desde hoy, y cuando tu coach te vuelva a invitar todo se conecta
          solo.
        </p>
        <InvitationActions />
      </Layout>
    );
  }

  return (
    <Layout boxName={inv.box.name} brandColor={inv.box.brandColor ?? null}>
      <p className="k-eyebrow text-[var(--k-t3)] mb-1">Invitación</p>
      <h1 className="font-display text-3xl font-bold mb-2">
        Te invitaron a{" "}
        <span style={{ color: "var(--k-accent)" }}>{inv.box.name}</span>
      </h1>
      <p className="text-[var(--k-t2)] mb-6">
        Confirma tus datos para entrar a la app del atleta.
      </p>

      <AcceptInvitationForm
        token={token}
        email={inv.email}
        defaultFirstName={inv.firstName ?? ""}
        defaultLastName={inv.lastName ?? ""}
        defaultPhone={inv.phone ?? ""}
      />
    </Layout>
  );
}
