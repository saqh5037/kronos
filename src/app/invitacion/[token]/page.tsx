import Link from "next/link";
import { getInvitationByToken } from "@/server/actions/athlete-invitations";
import { isInvitationActionable } from "@/lib/athlete-invitation";
import { AcceptInvitationForm } from "./_components/AcceptInvitationForm";

export const metadata = { title: "Kronos — Invitación" };
export const dynamic = "force-dynamic";

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const inv = await getInvitationByToken(token);

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
            Tu cuenta ya está creada
          </h1>
          <p className="text-[var(--k-t2)] mb-6">
            Inicia sesión con tu email <strong>{inv.email}</strong> para entrar
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
    const message =
      check.reason === "EXPIRED"
        ? "Esta invitación expiró. Pídele a tu Box que te envíe una nueva."
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
