/**
 * Box settings — schema validation + updateBox authorization.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { boxSettingsSchema } from "../../src/lib/validations/box";

vi.mock("../../src/server/db", () => ({
  db: {
    box: { update: vi.fn() },
  },
  withTenant: vi.fn(() => ({
    box: { findUnique: vi.fn() },
  })),
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("next-auth/providers/email", () => ({
  default: () => ({ id: "email", type: "email" }),
}));
vi.mock("next-auth/providers/google", () => ({
  default: () => ({ id: "google", type: "oauth" }),
}));
vi.mock("@next-auth/prisma-adapter", () => ({
  PrismaAdapter: () => ({}),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { db } from "../../src/server/db";
import { revalidatePath } from "next/cache";
import { updateBox } from "../../src/server/actions/box";

const mockSession = getServerSession as unknown as ReturnType<typeof vi.fn>;
const mockUpdate = db.box.update as unknown as ReturnType<typeof vi.fn>;
const mockRevalidate = revalidatePath as unknown as ReturnType<typeof vi.fn>;

const validInput = {
  name: "Iron Hands · Polanco",
  locale: "es-MX" as const,
  currency: "MXN" as const,
  timezone: "America/Mexico_City" as const,
  defaultClassCapacity: 16,
  brandColor: "#19f08b",
  logoUrl: "https://example.com/logo.png",
};

describe("boxSettingsSchema", () => {
  it("accepts valid input", () => {
    expect(() => boxSettingsSchema.parse(validInput)).not.toThrow();
  });

  it("rejects malformed brandColor", () => {
    expect(() =>
      boxSettingsSchema.parse({ ...validInput, brandColor: "not-a-hex" }),
    ).toThrow();
  });

  it("accepts empty brandColor (transforms to undefined)", () => {
    const parsed = boxSettingsSchema.parse({ ...validInput, brandColor: "" });
    expect(parsed.brandColor).toBeUndefined();
  });

  it("rejects invalid currency", () => {
    expect(() =>
      boxSettingsSchema.parse({ ...validInput, currency: "JPY" }),
    ).toThrow();
  });

  it("coerces defaultClassCapacity from string", () => {
    const parsed = boxSettingsSchema.parse({
      ...validInput,
      defaultClassCapacity: "24" as unknown as number,
    });
    expect(parsed.defaultClassCapacity).toBe(24);
  });

  it("rejects defaultClassCapacity over 200", () => {
    expect(() =>
      boxSettingsSchema.parse({ ...validInput, defaultClassCapacity: 999 }),
    ).toThrow();
  });

  it("rejects defaultClassCapacity below 1", () => {
    expect(() =>
      boxSettingsSchema.parse({ ...validInput, defaultClassCapacity: 0 }),
    ).toThrow();
  });
});

describe("updateBox authorization", () => {
  beforeEach(() => {
    mockSession.mockReset();
    mockUpdate.mockReset();
    mockRevalidate.mockReset();
  });

  it("rejects when no session", async () => {
    mockSession.mockResolvedValueOnce(null);
    await expect(updateBox(validInput)).rejects.toThrow("Unauthorized");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects when role is COACH (not OWNER)", async () => {
    mockSession.mockResolvedValueOnce({
      user: { tenantId: "tenant-1", role: "COACH" },
    });
    await expect(updateBox(validInput)).rejects.toThrow(/Forbidden/);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects when role is ATHLETE", async () => {
    mockSession.mockResolvedValueOnce({
      user: { tenantId: "tenant-1", role: "ATHLETE" },
    });
    await expect(updateBox(validInput)).rejects.toThrow(/Forbidden/);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("happy path: OWNER updates box and triggers revalidation", async () => {
    mockSession.mockResolvedValueOnce({
      user: { tenantId: "tenant-1", role: "OWNER" },
    });
    mockUpdate.mockResolvedValueOnce({
      id: "tenant-1",
      slug: "iron-hands",
      ...validInput,
    });

    await updateBox(validInput);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "tenant-1" },
        data: expect.objectContaining({
          name: validInput.name,
          locale: "es-MX",
          currency: "MXN",
          timezone: "America/Mexico_City",
          defaultClassCapacity: 16,
          brandColor: "#19f08b",
          logoUrl: "https://example.com/logo.png",
        }),
      }),
    );
    expect(mockRevalidate).toHaveBeenCalledWith("/admin/ajustes");
    expect(mockRevalidate).toHaveBeenCalledWith("/tv/iron-hands");
  });

  it("rejects with ZodError when input is invalid", async () => {
    mockSession.mockResolvedValueOnce({
      user: { tenantId: "tenant-1", role: "OWNER" },
    });
    await expect(
      updateBox({ ...validInput, brandColor: "not-hex" }),
    ).rejects.toThrow();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
