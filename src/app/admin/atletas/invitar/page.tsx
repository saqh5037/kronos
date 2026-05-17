import Link from "next/link";
import { listPendingInvitations } from "@/server/actions/athlete-invitations";
import { InviteForm } from "./_components/InviteForm";
import { PendingInvitationsList } from "./_components/PendingInvitationsList";

export const metadata = { title: "Kronos — Invitar atletas" };

export default async function InvitarAtletasPage() {
  let pending: Awaited<ReturnType<typeof listPendingInvitations>> = [];
  try {
    pending = await listPendingInvitations();
  } catch {
    // sesión ausente
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/atletas"
          className="k-eyebrow text-[var(--k-t3)] hover:text-[var(--k-t2)]"
        >
          ← Atletas
        </Link>
        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <span
            className="font-display text-[26px] leading-none"
            style={{ color: "var(--k-accent)" }}
          >
            Invitar
          </span>
          <h1
            className="k-h-italic font-display font-extrabold text-[38px] leading-[1] tracking-[-0.02em]"
            style={{ color: "var(--k-t1)" }}
          >
            <em>atletas</em>
          </h1>
        </div>
        <p className="mt-2 text-sm text-[var(--k-t2)]">
          Pega emails (uno por línea) para enviar invitaciones por correo. Cada
          atleta recibirá un link para confirmar nombre y empezar a usar la app.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <InviteForm />
        <PendingInvitationsList rows={pending} />
      </div>
    </div>
  );
}
