import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { redirect } from "next/navigation";
import OtpRedirectClient from "./OtpRedirectClient";

export const metadata = { title: "Kronos — Entrando…" };

/**
 * Landing del link "Copiar código y abrir Kronos →" del email.
 *
 * - Si ya hay sesión activa, redirige al surface correcto (rol-aware).
 * - Si no, el client component copia el código al portapapeles, hace POST a
 *   /api/auth/otp/verify, y redirige a `data.redirectTo` al loguear.
 */
export default async function OtpRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; email?: string }>;
}) {
  const { code, email } = await searchParams;

  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    // Cookie corrupta — dejar al client component crear la sesión nueva.
  }
  if (session) {
    const target = session.user.role === "ATHLETE" ? "/atleta" : "/admin";
    redirect(target);
  }

  return <OtpRedirectClient code={code} email={email} />;
}
