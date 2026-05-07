/**
 * E2E: Invitar atletas (sprint 2.4)
 *
 * Cubre:
 *  - Owner navega a /admin/atletas/invitar y ve el form
 *  - Owner pega bulk de emails, ve preview con conteos
 *  - Owner envía invitaciones → AthleteInvitation rows creadas
 *  - Owner ve invitaciones pendientes con CTA Reenviar/Revocar
 *  - Token válido en /invitacion/[token] muestra form
 *  - Aceptar la invitación crea Athlete + User + marca acceptedAt
 *  - Token inválido muestra estado "no encontrada"
 *  - Token aceptado muestra estado "ya aceptada"
 */
import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";
import { db, disconnect, getSeedBoxId } from "./fixtures/db";

const TEST_EMAIL_1 = `invite-test-${Date.now()}-1@example.com`;
const TEST_EMAIL_2 = `invite-test-${Date.now()}-2@example.com`;

async function clearTestInvitations() {
  const tenantId = await getSeedBoxId();
  await db().athleteInvitation.deleteMany({
    where: {
      tenantId,
      email: { contains: "invite-test-" },
    },
  });
  // Cleanup users + athletes from prior runs
  const users = await db().user.findMany({
    where: { tenantId, email: { contains: "invite-test-" } },
    select: { id: true, athlete: { select: { id: true } } },
  });
  for (const u of users) {
    if (u.athlete) {
      await db()
        .athlete.delete({ where: { id: u.athlete.id } })
        .catch(() => {});
    }
    await db()
      .user.delete({ where: { id: u.id } })
      .catch(() => {});
  }
}

test.describe.serial("Invitaciones de atletas", () => {
  test.beforeAll(async () => {
    await clearTestInvitations();
  });

  test.afterAll(async () => {
    await clearTestInvitations();
    await disconnect();
  });

  test("owner ve la página de invitar y envía bulk", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/admin/atletas/invitar");

    await expect(page.getByRole("heading", { name: /atletas/i })).toBeVisible();

    const textarea = page.locator("#invite-bulk");
    await expect(textarea).toBeVisible();

    // Pegar dos emails
    await textarea.fill(
      `${TEST_EMAIL_1},Alice Test,555-1111\n${TEST_EMAIL_2},Bob Test`,
    );

    // Preview muestra "2 válidos"
    await expect(page.getByText(/2 válidos/i)).toBeVisible();

    // Enviar
    await page.getByRole("button", { name: /Enviar 2/i }).click();

    // Confirmación visible
    await expect(page.getByText(/2 invitaciones enviadas/i)).toBeVisible({
      timeout: 10_000,
    });

    // DB: 2 invitaciones creadas
    const tenantId = await getSeedBoxId();
    const invs = await db().athleteInvitation.findMany({
      where: {
        tenantId,
        email: { in: [TEST_EMAIL_1, TEST_EMAIL_2] },
      },
    });
    expect(invs).toHaveLength(2);
    expect(invs[0]?.acceptedAt).toBeNull();
    expect(invs[0]?.token).toBeTruthy();
  });

  test("owner ve invitaciones pendientes en sidebar", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/admin/atletas/invitar");

    // Ambos emails aparecen en lista pending
    await expect(page.getByText(TEST_EMAIL_1)).toBeVisible();
    await expect(page.getByText(TEST_EMAIL_2)).toBeVisible();
  });

  test("token válido en /invitacion/[token] permite aceptar y crea Athlete + User", async ({
    page,
    context,
  }) => {
    const tenantId = await getSeedBoxId();
    const inv = await db().athleteInvitation.findFirst({
      where: { tenantId, email: TEST_EMAIL_1, acceptedAt: null },
    });
    expect(inv).toBeTruthy();
    const token = inv!.token;

    // Limpiar cookies — la página de invitación debe ser pública
    await context.clearCookies();

    await page.goto(`/invitacion/${token}`);

    await expect(page.getByText(/Te invitaron a/i)).toBeVisible();
    await expect(page.locator('input[id="firstName"]')).toHaveValue("Alice");

    // Aceptar
    await page.getByRole("button", { name: /Aceptar invitación/i }).click();

    // Confirmación visible (el server re-renderiza con el branch ACCEPTED feliz)
    await expect(page.getByText(/¡Listo!/i)).toBeVisible({ timeout: 10_000 });

    // DB: invitación marcada acceptedAt + Athlete creado + User creado
    const updated = await db().athleteInvitation.findUnique({
      where: { id: inv!.id },
    });
    expect(updated?.acceptedAt).not.toBeNull();

    const user = await db().user.findUnique({
      where: { email: TEST_EMAIL_1 },
      include: { athlete: true },
    });
    expect(user).toBeTruthy();
    expect(user?.role).toBe("ATHLETE");
    expect(user?.tenantId).toBe(tenantId);
    expect(user?.athlete).toBeTruthy();
    expect(user?.athlete?.firstName).toBe("Alice");
  });

  test("token inválido muestra estado 'no encontrada'", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await page.goto("/invitacion/token-que-no-existe-12345");
    await expect(page.getByText(/no encontrada/i)).toBeVisible();
  });

  test("token ya aceptado muestra estado 'ya aceptada'", async ({
    page,
    context,
  }) => {
    const tenantId = await getSeedBoxId();
    const accepted = await db().athleteInvitation.findFirst({
      where: { tenantId, email: TEST_EMAIL_1 },
    });
    expect(accepted?.acceptedAt).not.toBeNull();

    await context.clearCookies();
    await page.goto(`/invitacion/${accepted!.token}`);
    await expect(page.getByText(/Tu cuenta ya está creada/i)).toBeVisible();
  });
});
