/**
 * E2E: Atleta — inicio de checkout MercadoPago
 *
 * Cubre solo el inicio del flow:
 *  - Admin crea Membership PENDING + Payment PENDING en BD para el atleta demo
 *  - Atleta loguea, abre /atleta/pagos, ve el botón Pagar
 *  - Click en Pagar dispara POST a /api/payments/[id]/mp-checkout
 *
 * NO completa el pago real — eso requeriría sandbox MP + tarjeta de testing.
 * El test mockea el endpoint para devolver un init_point dummy.
 */
import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";
import { db, disconnect, getDemoAthlete, getSeedBoxId } from "./fixtures/db";

async function ensurePendingMembership(): Promise<{
  membershipId: string;
  paymentId: string;
}> {
  const athlete = await getDemoAthlete();
  const tenantId = await getSeedBoxId();

  // limpia previos pendientes para arrancar limpio
  await db().payment.deleteMany({
    where: {
      tenantId,
      membership: { athleteId: athlete.id },
      gateway: "MERCADOPAGO",
      status: "PENDING",
    },
  });
  await db().membership.deleteMany({
    where: { tenantId, athleteId: athlete.id, status: "PENDING" },
  });

  let plan = await db().membershipPlan.findFirst({
    where: { tenantId, isActive: true },
  });
  if (!plan) {
    plan = await db().membershipPlan.create({
      data: {
        tenantId,
        name: "E2E Mensual",
        type: "MONTHLY",
        price: 1500,
        currency: "MXN",
        durationDays: 30,
        isActive: true,
      },
    });
  }

  const membership = await db().membership.create({
    data: {
      tenantId,
      athleteId: athlete.id,
      planId: plan.id,
      startDate: new Date(),
      status: "PENDING",
      autoRenew: false,
    },
  });

  const payment = await db().payment.create({
    data: {
      tenantId,
      membershipId: membership.id,
      amount: plan.price,
      currency: plan.currency,
      gateway: "MERCADOPAGO",
      status: "PENDING",
    },
  });

  return { membershipId: membership.id, paymentId: payment.id };
}

test.describe.serial("Atleta — checkout MercadoPago", () => {
  test.afterAll(async () => {
    await disconnect();
  });

  test("ve membership PENDING en /atleta/pagos con botón Pagar", async ({
    page,
  }) => {
    await ensurePendingMembership();

    await loginAs(page, "atleta");
    await page.goto("/atleta/pagos");

    await expect(page.getByText(/Membres/i).first()).toBeVisible();
    await expect(page.getByText(/PENDIENTE DE PAGO/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Pagar \d/i }).first(),
    ).toBeVisible();
  });

  test("click en Pagar dispara POST a mp-checkout (mocked init_point)", async ({
    page,
  }) => {
    const { paymentId } = await ensurePendingMembership();

    // Interceptar la llamada al checkout y devolver init_point dummy.
    // Esto evita necesidad de MP_ACCESS_TOKEN real en CI.
    await page.route(
      `**/api/payments/${paymentId}/mp-checkout`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            paymentId,
            initPoint:
              "https://www.mercadopago.com.mx/checkout/v1/redirect?pref_id=mock",
            sandboxInitPoint:
              "https://sandbox.mercadopago.com.mx/checkout/v1/redirect?pref_id=mock",
          }),
        });
      },
    );

    // Tras el redirect, mock el destino para no salir del dominio
    await page.route("https://sandbox.mercadopago.com.mx/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<html><body>MP sandbox mock</body></html>",
      });
    });
    await page.route("https://www.mercadopago.com.mx/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<html><body>MP prod mock</body></html>",
      });
    });

    await loginAs(page, "atleta");
    await page.goto("/atleta/pagos");

    const payBtn = page.getByRole("button", { name: /Pagar \d/i }).first();
    await expect(payBtn).toBeVisible();

    await Promise.all([
      page.waitForURL(/mercadopago\.com/, { timeout: 10_000 }),
      payBtn.click(),
    ]);

    expect(page.url()).toMatch(/mercadopago\.com/);
  });
});
