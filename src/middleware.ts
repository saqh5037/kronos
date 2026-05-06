import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const tokenId = token?.id as string | undefined;
    const role = token?.role as string | undefined;
    const pathname = req.nextUrl.pathname;
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

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

export const config = {
  matcher: ["/admin/:path*", "/atleta/:path*"],
};
