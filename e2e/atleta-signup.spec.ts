/**
 * E2E: Atleta self-serve signup + onboarding flow
 *
 * Cubre el flow completo del nuevo atleta independiente:
 *  - Visita /atleta-signup, llena form, ve success state
 *  - El usuario creado puede hacer dev login (CredentialsProvider acepta password "dev")
 *  - Después del login aterriza en /atleta/onboarding (Box Personal sin completar)
 *  - Completa wizard 3 pasos (skipea foto y box) → llega a /atleta home
 *  - Refresh de /atleta NO redirige más (onboardingCompletedAt seteado)
 */

import { test, expect } from "@playwright/test";

const DEV_PASSWORD = process.env.DEV_PASSWORD ?? "dev";

function uniqueEmail(): string {
  return `e2e-atleta-${Date.now()}-${Math.floor(Math.random() * 1e6)}@kronos.test`;
}

test.describe("Atleta self-serve signup + onboarding", () => {
  test("form renderiza en /atleta-signup", async ({ page }) => {
    await page.goto("/atleta-signup");
    await expect(page).toHaveTitle(/Kronos/);
    await expect(
      page.getByRole("heading", { name: /Empezá a trackear/ }),
    ).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Empezar gratis/ }),
    ).toBeVisible();
  });

  test("submit del form muestra success state", async ({ page }) => {
    const email = uniqueEmail();
    await page.goto("/atleta-signup");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="firstName"]').fill("E2E");
    await page.locator('input[name="lastName"]').fill("Atleta");
    await page.getByRole("button", { name: /Empezar gratis/ }).click();

    // Success state: header "¡Listo!" + email mostrado
    await expect(page.getByRole("heading", { name: /Listo/ })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(email)).toBeVisible();
  });

  test("flow completo: signup → dev login → wizard → home", async ({
    page,
  }) => {
    const email = uniqueEmail();
    const firstName = "FlowTest";
    const lastName = "Independiente";

    // 1) Signup
    await page.goto("/atleta-signup");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="firstName"]').fill(firstName);
    await page.locator('input[name="lastName"]').fill(lastName);
    await page.getByRole("button", { name: /Empezar gratis/ }).click();
    await expect(page.getByRole("heading", { name: /Listo/ })).toBeVisible({
      timeout: 15_000,
    });

    // 2) Dev login (el User fue creado por createIndependentAthlete con role=ATHLETE)
    await page.goto("/login");
    await page.locator('input[placeholder="email"]').fill(email);
    await page.locator('input[placeholder="password"]').fill(DEV_PASSWORD);
    await Promise.all([
      page.waitForURL(/\/atleta/, { timeout: 10_000 }),
      page.getByRole("button", { name: /Entrar \(dev\)/ }).click(),
    ]);

    // 3) Como Box es Personal y onboardingCompletedAt es null,
    //    /atleta home redirige a /atleta/onboarding
    await page.waitForURL(/\/atleta\/onboarding/, { timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: /Bienvenido/ }),
    ).toBeVisible();
    // Step 1 prefilled con firstName del signup
    await expect(page.locator('input[value="' + firstName + '"]')).toBeVisible();

    // 4) Step 1 → Siguiente
    await page.getByRole("button", { name: /^Siguiente$/ }).click();

    // 5) Step 2 (prefs) → Siguiente con defaults (kg + scaled)
    await expect(
      page.getByRole("heading", { name: /Tus preferencias/ }),
    ).toBeVisible();
    await page.getByRole("button", { name: /^Siguiente$/ }).click();

    // 6) Step 3 (¿box?) → Empezar sin box
    await expect(
      page.getByRole("heading", { name: /¿Tenés un box\?/ }),
    ).toBeVisible();
    await page.getByRole("button", { name: /Empezar sin box/ }).click();

    // 7) Aterriza en /atleta home (NO debería volver a redirigir a onboarding)
    await page.waitForURL(/\/atleta(\?|$|\/$)/, { timeout: 10_000 });
    expect(page.url()).not.toContain("/atleta/onboarding");

    // 8) Refresh para confirmar persistencia del flag
    await page.goto("/atleta");
    await page.waitForLoadState("networkidle");
    expect(page.url()).not.toContain("/atleta/onboarding");
  });

  test("EMAIL_TAKEN: signup con email existente devuelve error", async ({
    page,
  }) => {
    // Usar el seed atleta@iron-hands.demo (existe siempre tras pnpm db:seed)
    await page.goto("/atleta-signup");
    await page.locator('input[name="email"]').fill("atleta@iron-hands.demo");
    await page.locator('input[name="firstName"]').fill("Duplicado");
    await page.getByRole("button", { name: /Empezar gratis/ }).click();

    // Toast con mensaje de email taken
    await expect(page.getByText(/ya tiene cuenta/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
