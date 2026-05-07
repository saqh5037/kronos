/**
 * E2E: Invitar coaches/staff (sprint 2.5)
 *
 * Cubre:
 *  - StaffInvitation creada → aceptar en /invitacion-staff/[token] crea User con role correcto
 *  - Token inválido muestra "no encontrada"
 *  - Token ya aceptado muestra "Tu cuenta ya está activa"
 *  - Token expirado muestra "Invitación expirada"
 */
import { test, expect } from "@playwright/test";
import { db, disconnect, getSeedBoxId } from "./fixtures/db";
import { randomBytes } from "node:crypto";

const TEST_EMAIL_COACH = `staff-test-${Date.now()}-coach@example.com`;
const TEST_EMAIL_STAFF = `staff-test-${Date.now()}-staff@example.com`;
const TEST_EMAIL_EXPIRED = `staff-test-${Date.now()}-exp@example.com`;

function buildToken(): string {
  return randomBytes(24).toString("hex");
}

async function clearTestStaffInvitations() {
  const tenantId = await getSeedBoxId();
  await db().staffInvitation.deleteMany({
    where: { tenantId, email: { contains: "staff-test-" } },
  });
  await db().user.deleteMany({
    where: { tenantId, email: { contains: "staff-test-" } },
  });
}

test.describe.serial("Invitaciones de staff/coach", () => {
  test.beforeAll(async () => {
    await clearTestStaffInvitations();
  });

  test.afterAll(async () => {
    await clearTestStaffInvitations();
    await disconnect();
  });

  test("token válido permite aceptar y crea User con role COACH", async ({
    page,
    context,
  }) => {
    const tenantId = await getSeedBoxId();
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const token = buildToken();

    await db().staffInvitation.create({
      data: {
        tenantId,
        email: TEST_EMAIL_COACH,
        name: "Coach Test",
        role: "COACH",
        token,
        expiresAt,
      },
    });

    await context.clearCookies();
    await page.goto(`/invitacion-staff/${token}`);

    await expect(page.getByText(/Te invitaron a/i)).toBeVisible();
    await expect(page.getByText(/coach/i).first()).toBeVisible();
    await expect(page.locator('input[id="name"]')).toHaveValue("Coach Test");

    await page.getByRole("button", { name: /Activar mi cuenta/i }).click();
    await expect(page.getByText(/¡Listo!/i)).toBeVisible({ timeout: 10_000 });

    const user = await db().user.findUnique({
      where: { email: TEST_EMAIL_COACH },
    });
    expect(user).toBeTruthy();
    expect(user?.role).toBe("COACH");
    expect(user?.tenantId).toBe(tenantId);
    expect(user?.name).toBe("Coach Test");

    const inv = await db().staffInvitation.findUnique({
      where: { token },
    });
    expect(inv?.acceptedAt).not.toBeNull();
  });

  test("token válido para STAFF crea User con role STAFF", async ({
    page,
    context,
  }) => {
    const tenantId = await getSeedBoxId();
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const token = buildToken();

    await db().staffInvitation.create({
      data: {
        tenantId,
        email: TEST_EMAIL_STAFF,
        name: "Staff Test",
        role: "STAFF",
        token,
        expiresAt,
      },
    });

    await context.clearCookies();
    await page.goto(`/invitacion-staff/${token}`);

    await expect(page.locator('input[id="name"]')).toHaveValue("Staff Test");
    await page.getByRole("button", { name: /Activar mi cuenta/i }).click();
    await expect(page.getByText(/¡Listo!/i)).toBeVisible({ timeout: 10_000 });

    const user = await db().user.findUnique({
      where: { email: TEST_EMAIL_STAFF },
    });
    expect(user?.role).toBe("STAFF");
  });

  test("token inválido muestra estado 'no encontrada'", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await page.goto("/invitacion-staff/token-fake-staff-12345");
    await expect(page.getByText(/no encontrada/i)).toBeVisible();
  });

  test("token ya aceptado muestra 'Tu cuenta ya está activa'", async ({
    page,
    context,
  }) => {
    const tenantId = await getSeedBoxId();
    const accepted = await db().staffInvitation.findFirst({
      where: { tenantId, email: TEST_EMAIL_COACH },
    });
    expect(accepted?.acceptedAt).not.toBeNull();

    await context.clearCookies();
    await page.goto(`/invitacion-staff/${accepted!.token}`);
    await expect(page.getByText(/Tu cuenta ya está activa/i)).toBeVisible();
  });

  test("token expirado muestra 'Invitación expirada'", async ({
    page,
    context,
  }) => {
    const tenantId = await getSeedBoxId();
    const expiresAt = new Date(Date.now() - 1000);
    const token = buildToken();

    await db().staffInvitation.create({
      data: {
        tenantId,
        email: TEST_EMAIL_EXPIRED,
        name: "Expired Test",
        role: "COACH",
        token,
        expiresAt,
      },
    });

    await context.clearCookies();
    await page.goto(`/invitacion-staff/${token}`);
    await expect(page.getByText(/Invitación expirada/i)).toBeVisible();
  });
});
