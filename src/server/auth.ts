import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "./db";
import { authorizeDev } from "./auth-dev";
import { logAudit } from "./audit";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER ?? "",
      from: process.env.EMAIL_FROM ?? "noreply@kronos.app",
    }),
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
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
    async jwt({ token, user }) {
      if (user) {
        // Initial sign-in: hydrate token from DB
        const dbUser = await db.user.findUnique({
          where: { email: user.email! },
          select: { id: true, role: true, tenantId: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.tenantId = dbUser.tenantId;
        }
      } else if (token.id) {
        // Subsequent request: revalidate that the user still exists.
        // Catches the "DB was reset, JWT points to a deleted user/tenant" case.
        const exists = await db.user.findUnique({
          where: { id: token.id as string },
          select: { id: true, role: true, tenantId: true },
        });
        if (!exists) {
          // User no longer exists — invalidate token to force re-login.
          return {
            ...token,
            id: undefined,
            role: undefined,
            tenantId: undefined,
          };
        }
        if (exists.tenantId !== token.tenantId) {
          token.tenantId = exists.tenantId;
        }
        if (exists.role !== token.role) {
          token.role = exists.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as string;
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
