import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { getPasswordStatus } from "@/server/actions/password";
import { PasswordForm } from "./PasswordForm";
import { SettingsShell } from "../_components/SettingsShell";

export const metadata = { title: "Kronos — Seguridad" };
export const dynamic = "force-dynamic";

export default async function SeguridadPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) redirect("/login");

  const { hasPassword } = await getPasswordStatus();

  return (
    <SettingsShell
      active="seguridad"
      title="Tu"
      emphasis="seguridad"
      description="Cómo entras a tu cuenta. El enlace mágico por correo siempre funciona; la contraseña es un atajo."
    >
      <div className="k-card p-6">
        <h2
          className="font-display mb-1 text-xl font-bold"
          style={{ color: "var(--k-t1)" }}
        >
          Contraseña
        </h2>
        <p className="mb-5 text-sm" style={{ color: "var(--k-t2)" }}>
          {hasPassword
            ? "Ya tienes una contraseña configurada. Puedes cambiarla o eliminarla."
            : "El enlace mágico funciona perfecto, pero con una contraseña entras sin esperar el correo."}
        </p>
        <PasswordForm hasPassword={hasPassword} />
      </div>
    </SettingsShell>
  );
}
