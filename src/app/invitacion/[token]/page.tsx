import Link from "next/link";
import { notFound } from "next/navigation";
import KronosLogo from "@/components/brand/KronosLogo";
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

  // Token que no resuelve a nada: 404 real (audit 2026-09-15). El estado vive
  // en not-found.tsx, con logo, explicación y una sola acción primaria.
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

/**
 * Una sola acción primaria (crear cuenta gratis) y una secundaria (ya tengo
 * cuenta). Antes había dos enlaces al mismo login y ninguna salida real.
 */
export function InvitationActions() {
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
            Kronos es la app donde tu box lleva las clases y tú llevas tus PRs,
            tu racha y tus resultados.
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
