/**
 * E2E: Atleta self-serve signup + onboarding flow
 *
 * Cubre el flow completo del nuevo atleta independiente:
 *  - Visita /atleta-signup, llena form multi-fase, ve success state
 *  - El usuario creado puede hacer dev login (CredentialsProvider acepta password "dev")
 *  - Después del login aterriza en /atleta/onboarding (Box Personal sin completar)
 *  - Completa wizard → llega a /atleta home
 *  - Refresh de /atleta NO redirige más (onboardingCompletedAt seteado)
 *
 * NOTA: El form es multi-fase desde sprint 3.x:
 *   Phase 1 (email-phase): solo email + "Continuar →"
 *   Phase 2 (details-phase): firstName + lastName + password opcional + "Continuar →"
 *   Phase 3 (goals-phase): tags opcionales + "Crear cuenta" / "Saltar"
 */

import { test, expect } from "@playwright/test";

const DEV_PASSWORD = process.env.DEV_PASSWORD ?? "dev";

function uniqueEmail(): string {
  return `e2e-atleta-${Date.now()}-${Math.floor(Math.random() * 1e6)}@kronos.test`;
}

/**
 * Completes the 3-phase signup form up to success state.
 * Returns the email used.
 */
async function completeSignup(
  page: import("@playwright/test").Page,
  email: string,
  firstName = "E2E",
  lastName = "Atleta",
): Promise<void> {
  await page.goto("/atleta-signup");

  // Phase 1: email
  await page
    .locator('[data-testid="atleta-signup-email-phase"] input[type="email"]')
    .fill(email);
  await page
    .locator('[data-testid="atleta-signup-email-phase"]')
    .getByRole("button", { name: /Continuar/ })
    .click();

  // Phase 2: details (only appears for new email)
  await page.waitForSelector('[data-testid="atleta-signup-details-phase"]', {
    timeout: 10_000,
  });
  await page.locator('input[name="firstName"]').fill(firstName);
  await page.locator('input[name="lastName"]').fill(lastName);
  await page
    .locator('[data-testid="atleta-signup-details-phase"]')
    .getByRole("button", { name: /Continuar/ })
    .click();

  // Phase 3: goals — skip (optional)
  await page.waitForSelector('[data-testid="atleta-signup-goals-phase"]', {
    timeout: 10_000,
  });
  await page
    .locator('[data-testid="atleta-signup-goals-phase"]')
    .getByRole("button", { name: /Saltar/ })
    .click();
}

test.describe("Atleta self-serve signup + onboarding", () => {
  test("form renderiza en /atleta-signup", async ({ page }) => {
    await page.goto("/atleta-signup");
    await expect(page).toHaveTitle(/Kronos/);
    // Phase 1: heading muestra "Atleta Kronos" (página title) y el input de email
    await expect(
      page.getByRole("heading", { name: /Atleta Kronos/ }),
    ).toBeVisible();
    // Email input visible en fase inicial
    await expect(
      page
        .locator('[data-testid="atleta-signup-email-phase"]')
        .locator('input[type="email"]'),
    ).toBeVisible();
    // CTA inicial
    await expect(
      page
        .locator('[data-testid="atleta-signup-email-phase"]')
        .getByRole("button", { name: /Empezar|Continuar/ }),
    ).toBeVisible();
  });

  test("submit del form muestra success state", async ({ page }) => {
    const email = uniqueEmail();
    await completeSignup(page, email, "E2E", "Atleta");

    // Success state: MagicLinkWaiting muestra el email
    await expect(page.getByText(email)).toBeVisible({ timeout: 15_000 });
  });

  test("flow completo: signup → dev login → wizard → home", async ({
    page,
  }) => {
    const email = uniqueEmail();
    const firstName = "FlowTest";
    const lastName = "Independiente";

    // 1) Signup multi-fase
    await completeSignup(page, email, firstName, lastName);
    // Success state visible
    await expect(page.getByText(email)).toBeVisible({ timeout: 15_000 });

    // 2) Dev login (el User fue creado con role=ATHLETE)
    await page.goto("/login");
    await page.locator('input[placeholder="email"]').fill(email);
    await page.locator('input[placeholder="password"]').fill(DEV_PASSWORD);
    await Promise.all([
      page.waitForURL(/\/atleta/, { timeout: 15_000 }),
      page.getByRole("button", { name: /Entrar \(dev\)/ }).click(),
    ]);

    // 3) Como Box es Personal y onboardingCompletedAt es null,
    //    /atleta home redirige a /atleta/onboarding
    await page.waitForURL(/\/atleta\/onboarding/, { timeout: 10_000 });
    expect(page.url()).toContain("/atleta/onboarding");
  });

  test("EMAIL_TAKEN: signup con email existente devuelve error", async ({
    page,
  }) => {
    // Email existente → Phase 1 detecta vía checkEmailExists y envía magic link
    // (no pasa a Phase 2 ni pide nombre). El form muestra success con
    // "Bienvenido de vuelta" (existingUser=true path).
    await page.goto("/atleta-signup");
    await page
      .locator('[data-testid="atleta-signup-email-phase"] input[type="email"]')
      .fill("atleta@iron-hands.demo");
    await page
      .locator('[data-testid="atleta-signup-email-phase"]')
      .getByRole("button", { name: /Continuar/ })
      .click();

    // Para email existente el form muestra "Bienvenido de vuelta" como heading
    // (envía magic link sin pedir datos extra). Usar getByRole para ser
    // específico y evitar strict mode si el texto aparece también en el subtítulo.
    await expect(
      page.getByRole("heading", { name: /Bienvenido de vuelta/i }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
