import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "./db";
import { authorizeDev } from "./auth-dev";
import { authorizePassword } from "./auth-password";
import { logAudit } from "./audit";
import { sendEmail } from "@/lib/email";
import {
  renderMagicLinkEmail,
  renderMagicLinkText,
} from "./email-templates/magic-link";
import { validateMagicLinkSignIn } from "./auth-signin";
import { deriveOtpFromToken, hashEmailToken } from "./otp";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 días — keep-alive mobile
const SESSION_UPDATE_AGE_SECONDS = 60 * 60 * 24; // refrescar JWT 1x/día si activo

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: SESSION_UPDATE_AGE_SECONDS,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: SESSION_MAX_AGE_SECONDS,
      },
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/logout",
    error: "/login",
  },
  logger: {
    error(code, metadata) {
      // Silenciar ruido de cookies stale en dev (otra ejecución de NextAuth con
      // secret distinto deja cookie undecryptable hasta que el usuario haga login).
      if (
        code === "JWT_SESSION_ERROR" &&
        metadata instanceof Error &&
        /decryption operation failed/i.test(metadata.message)
      ) {
        return;
      }
      console.error(`[next-auth][error][${code}]`, metadata);
    },
    warn(code) {
      console.warn(`[next-auth][warn][${code}]`);
    },
    debug() {
      // noop
    },
  },
  providers: [
    EmailProvider({
      // TODO(D3): default a "Kronos <noreply@kronos-fit.com>" cuando DNS Resend listo.
      from: process.env.EMAIL_FROM ?? "Kronos <noreply@kronos.app>",
      // Token vive 1h. OTP es reusable los primeros 5 min post-primer-uso
      // (ver REUSE_GRACE_MS en src/server/otp.ts).
      maxAge: 60 * 60,
      async sendVerificationRequest({ identifier, url, provider, token }) {
        // El `token` que NextAuth pasa acá es el RAW (32 bytes random). Pero
        // NextAuth almacena en DB el HASH = sha256(token + secret), no el raw.
        // Para que el OTP del email matchee con findOtpMatch (que deriva del
        // hash almacenado en DB), reproducimos el hashing acá.
        const secret = process.env.NEXTAUTH_SECRET!;
        const hashedToken = hashEmailToken(token, secret);
        const code = deriveOtpFromToken(hashedToken, secret);
        const codePretty = `${code.slice(0, 3)} ${code.slice(3, 6)}`;
        const result = await sendEmail({
          to: [identifier],
          subject: `Tu código Kronos: ${codePretty}`,
          html: renderMagicLinkEmail({ email: identifier, url, code }),
          text: renderMagicLinkText({ email: identifier, url, code }),
          from: provider.from,
        });
        if (!result.ok) {
          throw new Error(result.error ?? "Failed to send magic link");
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    CredentialsProvider({
      id: "password",
      name: "Email + contraseña",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: (creds) => authorizePassword(creds),
    }),
    ...(process.env.NODE_ENV === "development"
      ? [
          CredentialsProvider({
            id: "dev-login",
            name: "Dev Login",
            credentials: {
              email: { label: "Email", type: "email" },
              password: { label: "Password", type: "password" },
            },
            authorize: (creds) => authorizeDev(creds),
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      const decision = await validateMagicLinkSignIn(
        account?.provider,
        user.email,
        (email) =>
          db.user.findUnique({ where: { email }, select: { tenantId: true } }),
        process.env.NEXTAUTH_URL ?? "",
      );
      if (decision.type === "allow") return true;
      if (decision.type === "redirect") return decision.url;
      return false;
    },
    async jwt({ token, user }) {
      if (user) {
        // Initial sign-in: hydrate token from DB
        const dbUser = await db.user.findUnique({
          where: { email: user.email! },
          select: {
            id: true,
            role: true,
            tenantId: true,
            box: { select: { subscriptionStatus: true } },
            athlete: { select: { onboardingCompletedAt: true } },
          },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.tenantId = dbUser.tenantId;
          token.subscriptionStatus = dbUser.box?.subscriptionStatus ?? null;
          token.athleteOnboardedAt = !!dbUser.athlete?.onboardingCompletedAt;
        }
      } else if (token.id) {
        // Subsequent request: revalidate that the user still exists and refresh
        // subscription status + athlete onboarding state from DB (catches
        // expirations and onboarding completion between requests).
        const exists = await db.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            role: true,
            tenantId: true,
            box: { select: { subscriptionStatus: true } },
            athlete: { select: { onboardingCompletedAt: true } },
          },
        });
        if (!exists) {
          return {
            ...token,
            id: undefined,
            role: undefined,
            tenantId: undefined,
            subscriptionStatus: undefined,
            athleteOnboardedAt: undefined,
          };
        }
        if (exists.tenantId !== token.tenantId) {
          token.tenantId = exists.tenantId;
        }
        if (exists.role !== token.role) {
          token.role = exists.role;
        }
        token.subscriptionStatus = exists.box?.subscriptionStatus ?? null;
        token.athleteOnboardedAt = !!exists.athlete?.onboardingCompletedAt;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as string;
        session.user.subscriptionStatus = token.subscriptionStatus ?? null;
        session.user.athleteOnboardedAt = token.athleteOnboardedAt ?? false;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      const dbUser = await db.user.findUnique({
        where: { email: user.email ?? "" },
        select: { id: true, tenantId: true },
      });
      if (!dbUser) return;
      await logAudit({
        tenantId: dbUser.tenantId,
        actorId: dbUser.id,
        action: "USER_LOGIN",
        targetType: "User",
        targetId: dbUser.id,
      });
    },
    async signOut({ token }) {
      if (!token?.id || !token?.tenantId) return;
      await logAudit({
        tenantId: token.tenantId as string,
        actorId: token.id as string,
        action: "USER_LOGOUT",
        targetType: "User",
        targetId: token.id as string,
      });
    },
  },
};
