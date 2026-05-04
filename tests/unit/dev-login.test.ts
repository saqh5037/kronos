/**
 * Dev login (CredentialsProvider) — only active in NODE_ENV=development.
 * Verifies authorize logic + that the provider is gated by env.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../src/server/db", () => ({
  db: {
    user: { findUnique: vi.fn() },
  },
}));

import { db } from "../../src/server/db";
import { authorizeDev, DEV_LOGIN_PASSWORD } from "../../src/server/auth-dev";

const findUnique = db.user.findUnique as unknown as ReturnType<typeof vi.fn>;

describe("authorizeDev", () => {
  beforeEach(() => {
    findUnique.mockReset();
  });

  it("returns user when email exists and password matches", async () => {
    findUnique.mockResolvedValueOnce({
      id: "user-1",
      email: "coach@iron-hands.demo",
      name: "Coach Lobo",
      image: null,
    });

    const result = await authorizeDev({
      email: "coach@iron-hands.demo",
      password: DEV_LOGIN_PASSWORD,
    });

    expect(result).toEqual({
      id: "user-1",
      email: "coach@iron-hands.demo",
      name: "Coach Lobo",
      image: null,
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { email: "coach@iron-hands.demo" },
      select: { id: true, email: true, name: true, image: true },
    });
  });

  it("returns null when password is wrong", async () => {
    const result = await authorizeDev({
      email: "coach@iron-hands.demo",
      password: "wrong",
    });
    expect(result).toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("returns null when email does not exist", async () => {
    findUnique.mockResolvedValueOnce(null);
    const result = await authorizeDev({
      email: "ghost@nowhere.demo",
      password: DEV_LOGIN_PASSWORD,
    });
    expect(result).toBeNull();
  });

  it("returns null when credentials are missing", async () => {
    expect(await authorizeDev(undefined)).toBeNull();
    expect(await authorizeDev({ email: "x@y.z" })).toBeNull();
    expect(await authorizeDev({ password: "dev" })).toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });
});

function setNodeEnv(value: string | undefined) {
  // process.env.NODE_ENV is read-only in TS but writable at runtime via cast
  (process.env as Record<string, string | undefined>).NODE_ENV = value;
}

describe("CredentialsProvider gating by NODE_ENV", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.resetModules();
    vi.doMock("next-auth/providers/email", () => ({
      default: (cfg: unknown) => ({
        id: "email",
        type: "email",
        ...(cfg as object),
      }),
    }));
    vi.doMock("next-auth/providers/google", () => ({
      default: (cfg: unknown) => ({
        id: "google",
        type: "oauth",
        ...(cfg as object),
      }),
    }));
    vi.doMock("@next-auth/prisma-adapter", () => ({
      PrismaAdapter: () => ({}),
    }));
  });

  afterEach(() => {
    setNodeEnv(originalEnv);
    vi.resetModules();
    vi.doUnmock("next-auth/providers/email");
    vi.doUnmock("next-auth/providers/google");
    vi.doUnmock("@next-auth/prisma-adapter");
  });

  it("includes a credentials provider when NODE_ENV=development", async () => {
    setNodeEnv("development");
    const mod = await import("../../src/server/auth");
    const providers = mod.authOptions.providers as Array<{
      type?: string;
      options?: { id?: string };
    }>;
    const credsProvider = providers.find((p) => p.type === "credentials");
    expect(credsProvider).toBeDefined();
    expect(credsProvider?.options?.id).toBe("dev-login");
  });

  it("does NOT include any credentials provider when NODE_ENV=production", async () => {
    setNodeEnv("production");
    const mod = await import("../../src/server/auth");
    const providers = mod.authOptions.providers as Array<{ type?: string }>;
    const credsProvider = providers.find((p) => p.type === "credentials");
    expect(credsProvider).toBeUndefined();
  });
});
