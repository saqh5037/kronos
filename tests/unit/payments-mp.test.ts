/**
 * initMpCheckout — idempotencia + auth + reuso de preference.
 *
 * Estrategia: mockear next-auth, withTenant/db, mp-client, audit.
 * Verificar que 2 llamadas con misma membership devuelven mismo paymentId
 * y la 2da NO crea nueva preference (reusa mpPreferenceId).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSession = {
  user: {
    id: "user-athlete-1",
    role: "ATHLETE" as const,
    tenantId: "box-1",
  },
};

const mockMembership = {
  id: "memb-1",
  athleteId: "ath-1",
  planId: "plan-1",
  athlete: {
    id: "ath-1",
    userId: "user-athlete-1",
    firstName: "Ana",
    lastName: "Pérez",
  },
  plan: { name: "Mensual", price: 1500, currency: "MXN" },
};

const mockBox = { name: "Iron Hands", currency: "MXN" };

const paymentStore: Record<
  string,
  {
    id: string;
    membershipId: string;
    gateway: string;
    status: string;
    mpPreferenceId: string | null;
  }
> = {};

const findFirstMock = vi.fn(
  async (args: { where: Record<string, unknown> }) => {
    const { membershipId, gateway, status } = args.where as {
      membershipId: string;
      gateway: string;
      status: string;
    };
    const found = Object.values(paymentStore).find(
      (p) =>
        p.membershipId === membershipId &&
        p.gateway === gateway &&
        p.status === status,
    );
    return found ?? null;
  },
);

const createPaymentMock = vi.fn(
  async (args: { data: { membershipId: string; status: string } }) => {
    const id = `pay-${Object.keys(paymentStore).length + 1}`;
    const payment = {
      id,
      membershipId: args.data.membershipId,
      gateway: "MERCADOPAGO",
      status: args.data.status,
      mpPreferenceId: null,
    };
    paymentStore[id] = payment;
    return payment;
  },
);

const updatePaymentMock = vi.fn(
  async (args: { where: { id: string }; data: { mpPreferenceId: string } }) => {
    const p = paymentStore[args.where.id];
    if (p) p.mpPreferenceId = args.data.mpPreferenceId;
    return p;
  },
);

const preferenceCreateMock = vi.fn(async () => ({
  id: "PREF-12345",
  init_point:
    "https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=PREF-12345",
  sandbox_init_point:
    "https://sandbox.mercadopago.com.mx/checkout/v1/redirect?pref_id=PREF-12345",
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(async () => mockSession),
}));

vi.mock("../../src/server/auth", () => ({
  authOptions: {},
}));

vi.mock("../../src/server/db", () => ({
  withTenant: vi.fn(() => ({
    membership: {
      findUnique: vi.fn(async () => mockMembership),
    },
    box: {
      findUnique: vi.fn(async () => mockBox),
    },
    payment: {
      findFirst: findFirstMock,
      findMany: vi.fn(async () => []),
      findUnique: vi.fn(async () => null),
    },
  })),
  db: {
    payment: {
      create: createPaymentMock,
      update: updatePaymentMock,
    },
  },
}));

vi.mock("../../src/lib/payments/mp-client", () => ({
  isMpConfigured: vi.fn(() => true),
  getPreferenceClient: vi.fn(() => ({ create: preferenceCreateMock })),
  resolveMpBackUrlBase: vi.fn(() => "https://www.kronos-fit.com"),
}));

vi.mock("../../src/server/audit", () => ({
  logAudit: vi.fn(async () => undefined),
}));

vi.mock("../../src/lib/analytics", () => ({
  trackEvent: vi.fn(async () => undefined),
}));

beforeEach(() => {
  for (const key of Object.keys(paymentStore)) delete paymentStore[key];
  findFirstMock.mockClear();
  createPaymentMock.mockClear();
  updatePaymentMock.mockClear();
  preferenceCreateMock.mockClear();
});

describe("initMpCheckout — idempotencia", () => {
  it("2 llamadas devuelven mismo paymentId y crean preference UNA sola vez", async () => {
    const { initMpCheckout } =
      await import("../../src/server/actions/payments");

    const first = await initMpCheckout({ membershipId: "memb-1" });
    const second = await initMpCheckout({ membershipId: "memb-1" });

    expect(first.paymentId).toBe(second.paymentId);
    expect(createPaymentMock).toHaveBeenCalledTimes(1);
    expect(preferenceCreateMock).toHaveBeenCalledTimes(1);
    expect(updatePaymentMock).toHaveBeenCalledTimes(1);
  });

  it("init_point del 2do call usa el mpPreferenceId guardado (reuso)", async () => {
    const { initMpCheckout } =
      await import("../../src/server/actions/payments");

    const first = await initMpCheckout({ membershipId: "memb-1" });
    const second = await initMpCheckout({ membershipId: "memb-1" });

    expect(first.initPoint).toContain("PREF-12345");
    expect(second.initPoint).toContain("PREF-12345");
    expect(second.sandboxInitPoint).toContain("PREF-12345");
  });

  it("crea Payment PENDING con gateway MERCADOPAGO", async () => {
    const { initMpCheckout } =
      await import("../../src/server/actions/payments");

    await initMpCheckout({ membershipId: "memb-1" });

    expect(createPaymentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          membershipId: "memb-1",
          gateway: "MERCADOPAGO",
          status: "PENDING",
          tenantId: "box-1",
        }),
      }),
    );
  });

  it("guarda mpPreferenceId en Payment después de crear preference", async () => {
    const { initMpCheckout } =
      await import("../../src/server/actions/payments");

    await initMpCheckout({ membershipId: "memb-1" });

    expect(updatePaymentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { mpPreferenceId: "PREF-12345" },
      }),
    );
  });
});

describe("initMpCheckout — guards", () => {
  it("falla si MercadoPago no está configurado", async () => {
    const mpClient = await import("../../src/lib/payments/mp-client");
    vi.mocked(mpClient.isMpConfigured).mockReturnValueOnce(false);

    const { initMpCheckout } =
      await import("../../src/server/actions/payments");

    await expect(initMpCheckout({ membershipId: "memb-1" })).rejects.toThrow(
      /MERCADOPAGO_ACCESS_TOKEN/,
    );
  });

  it("falla con input inválido (membershipId vacío)", async () => {
    const { initMpCheckout } =
      await import("../../src/server/actions/payments");

    await expect(initMpCheckout({ membershipId: "" })).rejects.toThrow();
  });
});
