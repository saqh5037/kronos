import { Layout, StaffInvitationActions } from "./_components/InvitationShell";

/**
 * Estado 404 de una invitación al equipo (audit 2026-09-15). A un coach lo
 * invita el dueño del box, así que la salida lo manda con él y no con "su Box".
 */
export default function StaffInvitationNotFound() {
  return (
    <Layout>
      <h1
        data-testid="invitation-not-found"
        className="font-display text-2xl font-bold mb-3"
      >
        Este link de invitación ya no sirve
      </h1>
      <p className="text-[var(--k-t2)] mb-4">
        No encontramos ninguna invitación con este link. Suele pasar cuando el
        correo lo recortó o cuando la invitación se venció. Pídele al dueño del
        box que te mande una nueva desde el panel.
      </p>
      <p className="text-[var(--k-t2)] mb-6">
        Si ya tienes cuenta en Kronos, entra con tu correo: el dueño puede
        sumarte al equipo sin que vuelvas a registrarte.
      </p>
      <StaffInvitationActions />
    </Layout>
  );
}
