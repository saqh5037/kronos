/**
 * POST /api/auth/otp/verify
 * Body: { email: string, code: string }
 *
 * Valida un OTP de 6 dígitos contra los VerificationToken activos del email.
 * Si matchea: consume el token, encode JWT con mismo shape que callback jwt(),
 * setea cookie next-auth.session-token, devuelve { ok: true, redirectTo }.
 *
 * Mismo efecto que clickear el magic link — solo que via input numérico,
 * útil cuando el link no funciona (cross-browser iOS, webview Gmail, link
 * en spam, etc).
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { encode } from "next-auth/jwt";
import { db } from "@/server/db";
import { logAudit } from "@/server/audit";
import { findOtpMatch, markOtpConsumed } from "@/server/otp";
import {
  rateLimit,
  rateLimitCheck,
  rateLimitHit,
  getClientIp,
} from "@/lib/rate-limit";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 días, igual que auth.ts

export async function POST(req: NextRequest) {
  // Rate limit por IP: 20 requests / 5 min (preventivo anti-spam — cuenta
  // TODOS los requests, exitosos o no, para limitar bots agresivos).
  const ip = getClientIp(req.headers);
  const rlIp = rateLimit(`otp-verify-ip:${ip}`, 20, 5 * 60_000);
  if (!rlIp.ok) {
    return NextResponse.json(
      {
        error: "RATE_LIMITED",
        message: `Demasiados intentos. Intenta en ${rlIp.retryAfterSec} segundos.`,
      },
      { status: 429 },
    );
  }

  let body: { email?: unknown; code?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "INVALID_BODY", message: "Cuerpo inválido" },
      { status: 400 },
    );
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!email || !code) {
    return NextResponse.json(
      { error: "MISSING_FIELDS", message: "Falta email o código" },
      { status: 400 },
    );
  }

  // Rate limit por email: 8 FALLOS / 10 min (anti brute force al código de 6
  // dígitos). Solo cuenta intentos fallidos — un atleta legítimo que mete el
  // código bien al primer intento NO consume cap. Cuando entra al rango
  // /login/otp redirect tras un reenvío, no se penaliza el éxito.
  const rlKey = `otp-verify-email-fail:${email}`;
  const rlEmail = rateLimitCheck(rlKey, 8, 10 * 60_000);
  if (!rlEmail.ok) {
    return NextResponse.json(
      {
        error: "RATE_LIMITED",
        message: `Demasiados intentos para este email. Intenta en ${rlEmail.retryAfterSec} segundos.`,
      },
      { status: 429 },
    );
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error("[otp/verify] NEXTAUTH_SECRET no configurado");
    return NextResponse.json(
      { error: "SERVER_CONFIG", message: "Error de configuración" },
      { status: 500 },
    );
  }

  const match = await findOtpMatch(email, code, secret);
  if (!match.ok) {
    // Penalizar este fallo en el bucket por-email (anti brute force).
    rateLimitHit(rlKey, 10 * 60_000);
    const message =
      match.reason === "EXPIRED"
        ? "El código expiró. Pedí uno nuevo."
        : match.reason === "NO_TOKEN"
          ? "No tenemos un código activo para este email. Pedí uno nuevo."
          : "Código incorrecto. Verificalo o pedí uno nuevo.";
    return NextResponse.json({ error: match.reason, message }, { status: 400 });
  }

  // Match. Soft-consume el token (queda válido 5 min más para cross-browser)
  // y resuelve el usuario para construir el JWT.
  await markOtpConsumed(match.identifier, match.token);

  const user = await db.user.findUnique({
    where: { email: match.identifier },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      tenantId: true,
      box: { select: { subscriptionStatus: true } },
    },
  });

  if (!user) {
    // Caso raro: token activo pero usuario eliminado entre el envío y el
    // canje. NextAuth normalmente crearía el user en este punto si no existe.
    // Para OTP-fallback exigimos user pre-existente (signup ya pasó).
    return NextResponse.json(
      {
        error: "NO_USER",
        message: "No encontramos tu cuenta. Prueba con /atleta-signup.",
      },
      { status: 400 },
    );
  }

  // Encode JWT con el shape que el callback jwt() de auth.ts produce.
  // Si auth.ts cambia el shape, también hay que actualizar este encode
  // (ver tests/unit/otp-jwt-shape.test.ts).
  const sessionToken = await encode({
    token: {
      name: user.name ?? null,
      email: user.email,
      sub: user.id,
      id: user.id,
      role: user.role,
      tenantId: user.tenantId,
      subscriptionStatus: user.box?.subscriptionStatus ?? null,
    },
    secret,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  const isProd = process.env.NODE_ENV === "production";
  const cookieStore = await cookies();
  cookieStore.set({
    name: isProd
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token",
    value: sessionToken,
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  // Audit best-effort, no bloquea la respuesta.
  await logAudit({
    tenantId: user.tenantId,
    actorId: user.id,
    action: "USER_LOGIN",
    targetType: "User",
    targetId: user.id,
    metadata: { via: "otp" },
  });

  // Redirect target depende del rol — atleta → /atleta, owner/coach → /admin.
  const redirectTo = user.role === "ATHLETE" ? "/atleta" : "/admin";
  return NextResponse.json({ ok: true, redirectTo });
}
