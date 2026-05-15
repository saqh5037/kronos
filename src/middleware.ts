import { withAuth } from "next-auth/middleware";
import { NextResponse, type NextRequest } from "next/server";
import {
  shouldRedirectToBilling,
  type SubscriptionStatus,
} from "@/lib/subscription";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const SIGNIN_EMAIL_PATH = "/api/auth/signin/email";
const PASSWORD_CALLBACK_PATH = "/api/auth/callback/password";

const authMiddleware = withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const tokenId = token?.id as string | undefined;
    const role = token?.role as string | undefined;
    const subscriptionStatus = token?.subscriptionStatus as
      | SubscriptionStatus
      | null
      | undefined;
    const pathname = req.nextUrl.pathname;
    const isAdminSurface = pathname.startsWith("/admin");
    const isAtletaSurface = pathname.startsWith("/atleta");

    if (token && !tokenId) {
      const url = new URL("/api/auth/signout", req.url);
      url.searchParams.set("callbackUrl", "/login");
      return NextResponse.redirect(url);
    }

    if (!role) return NextResponse.next();

    if (role === "ATHLETE" && isAdminSurface) {
      return NextResponse.redirect(new URL("/atleta", req.url));
    }

    if (role !== "ATHLETE" && isAtletaSurface) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    // Athlete onboarding gate — forzar wizard si el atleta no completó
    // onboardingCompletedAt. La ruta /atleta/onboarding queda exenta para
    // evitar bucles. Cuando completa, el siguiente request refresca el JWT
    // (callback en auth.ts) y este bloque deja de aplicar.
    const athleteOnboardedAt = token?.athleteOnboardedAt as boolean | undefined;
    if (
      role === "ATHLETE" &&
      isAtletaSurface &&
      !athleteOnboardedAt &&
      pathname !== "/atleta/onboarding"
    ) {
      return NextResponse.redirect(new URL("/atleta/onboarding", req.url));
    }
    if (
      role === "ATHLETE" &&
      athleteOnboardedAt &&
      pathname === "/atleta/onboarding"
    ) {
      return NextResponse.redirect(new URL("/atleta", req.url));
    }

    if (shouldRedirectToBilling(subscriptionStatus, pathname)) {
      return NextResponse.redirect(new URL("/admin/billing", req.url));
    }

    return NextResponse.next();
  },
  {
    pages: { signIn: "/login" },
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

// Top-level middleware: rate-limit antes de delegar al auth middleware.
// withAuth ignora rutas /api/auth/* por convención, así que el rate-limit del
// magic link debe aplicarse acá fuera del wrapper.
export default function middleware(
  req: NextRequest,
  event: Parameters<typeof authMiddleware>[1],
) {
  const pathname = req.nextUrl.pathname;

  if (pathname === SIGNIN_EMAIL_PATH && req.method === "POST") {
    const ip = getClientIp(req.headers);
    const rl = rateLimit(`signin-email:${ip}`, 10, 60_000);
    if (!rl.ok) {
      return new NextResponse(
        JSON.stringify({
          error: "rate_limited",
          retryAfter: rl.retryAfterSec,
        }),
        {
          status: 429,
          headers: {
            "content-type": "application/json",
            "retry-after": String(rl.retryAfterSec),
          },
        },
      );
    }
    return NextResponse.next();
  }

  if (pathname === PASSWORD_CALLBACK_PATH && req.method === "POST") {
    const ip = getClientIp(req.headers);
    const rl = rateLimit(`signin-password:${ip}`, 10, 60_000);
    if (!rl.ok) {
      return new NextResponse(
        JSON.stringify({
          error: "rate_limited",
          retryAfter: rl.retryAfterSec,
        }),
        {
          status: 429,
          headers: {
            "content-type": "application/json",
            "retry-after": String(rl.retryAfterSec),
          },
        },
      );
    }
    return NextResponse.next();
  }

  return authMiddleware(req as Parameters<typeof authMiddleware>[0], event);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/atleta/:path*",
    "/api/auth/signin/email",
    "/api/auth/callback/password",
  ],
};
