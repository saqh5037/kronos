import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import {
  shouldRedirectToBilling,
  type SubscriptionStatus,
} from "@/lib/subscription";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const SIGNIN_EMAIL_PATH = "/api/auth/signin/email";

export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname;

    // Rate limit del endpoint de magic link (anti-spam pre-evento).
    // 10 req/min/IP — generoso para uso humano, bloquea floods.
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

    const token = req.nextauth.token;
    const tokenId = token?.id as string | undefined;
    const role = token?.role as string | undefined;
    const subscriptionStatus = token?.subscriptionStatus as
      | SubscriptionStatus
      | null
      | undefined;
    const isAdminSurface = pathname.startsWith("/admin");
    const isAtletaSurface = pathname.startsWith("/atleta");

    // Stale JWT (user was deleted, e.g. after DB reset) — purge and re-login.
    if (token && !tokenId) {
      const url = new URL("/api/auth/signout", req.url);
      url.searchParams.set("callbackUrl", "/login");
      return NextResponse.redirect(url);
    }

    if (!role) return NextResponse.next();

    // ATHLETE only on /atleta — anything else (e.g. /admin) → redirect.
    if (role === "ATHLETE" && isAdminSurface) {
      return NextResponse.redirect(new URL("/atleta", req.url));
    }

    // OWNER/COACH/STAFF only on /admin — block /atleta.
    if (role !== "ATHLETE" && isAtletaSurface) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    // Subscription gate: EXPIRED boxes are read-only, force /admin/billing.
    if (shouldRedirectToBilling(subscriptionStatus, pathname)) {
      return NextResponse.redirect(new URL("/admin/billing", req.url));
    }

    return NextResponse.next();
  },
  {
    pages: { signIn: "/login" },
    callbacks: {
      authorized: ({ token, req }) => {
        // Permitir signin/email pasar sin token — el middleware aplica
        // rate limit y delega al handler de NextAuth.
        if (req.nextUrl.pathname === SIGNIN_EMAIL_PATH) return true;
        return !!token;
      },
    },
  },
);

export const config = {
  matcher: ["/admin/:path*", "/atleta/:path*", "/api/auth/signin/email"],
};
