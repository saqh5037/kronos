import { InvitationActions, Layout } from "./page";

/**
 * Estado 404 de una invitación de atleta (audit 2026-09-15).
 *
 * Antes este era un dead end sin logo, sin explicación de qué es Kronos y con
 * dos enlaces al mismo login. Ahora: marca, una línea de qué es Kronos, a quién
 * escribirle, una acción primaria (crear cuenta gratis) y una secundaria.
 */
export default function InvitationNotFound() {
  return (
    <Layout>
      <h1 className="font-display text-2xl font-bold mb-3">
        Este link de invitación ya no sirve
      </h1>
      <p className="text-[var(--k-t2)] mb-4">
        No encontramos ninguna invitación con este link. Suele pasar cuando el
        correo lo recortó o cuando la invitación se venció. Escríbele a tu coach
        y te manda una nueva.
      </p>
      <p className="text-[var(--k-t2)] mb-6">
        No tienes que esperar: crea tu cuenta gratis y empieza a registrar tus
        PRs y tu racha hoy. Cuando tu coach te vuelva a invitar, todo se conecta
        solo.
      </p>
      <InvitationActions />
    </Layout>
  );
}
