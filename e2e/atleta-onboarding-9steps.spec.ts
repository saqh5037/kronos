import { test, expect, type Page } from "@playwright/test";

/**
 * E2E tests for 9-step athlete onboarding wizard (Slice 8 Hardening)
 *
 * Validated flow:
 *  - Athlete con onboardingCompletedAt NOT NULL → middleware/layout redirige
 *    a /atleta (no permite re-entrar al wizard)
 *  - Athlete con onboardingCompletedAt NULL → layout redirige a wizard al
 *    visitar cualquier ruta /atleta/*
 *  - Wizard renderiza correctamente con shell fullscreen (sin TabBar ni
 *    drawer durante onboarding)
 *  - Signup independiente crea Box Personal (B2C); Step 8 muestra 3 radios
 *    SIN checkbox "También entreno solo" (que es exclusivo de B2B)
 *
 * Tests pendientes (require DB reset entre runs o setup adicional):
 *  - Completar todos los 9 pasos end-to-end → /atleta home
 *  - Resume parcial via localStorage tras exit en Step 4
 *  - B2B box pre-loaded en Step 8 con atleta@iron-hands.demo
 *  - Cinematic closing animation phases (creating/testimonials/complete)
 *  - Audit logging por step
 */

const DEV_PASSWORD = process.env.DEV_PASSWORD ?? "dev";

function uniqueEmail(): string {
  return `e2e-onboard-${Date.now()}-${Math.floor(Math.random() * 1e6)}@kronos.test`;
}

/**
 * Crea un atleta independiente via /atleta-signup. Skip password phase
 * (queda en magic link mode); el dev-login provider acepta DEV_PASSWORD
 * sin importar lo que haya en BD para users existentes.
 */
async function signupNewAtleta(
  page: Page,
  firstName = "E2E",
  lastName = "Onboard",
): Promise<string> {
  const email = uniqueEmail();
  await page.goto("/atleta-signup");

  // Phase 1: email
  await page
    .locator('[data-testid="atleta-signup-email-phase"] input[type="email"]')
    .fill(email);
  await page
    .locator('[data-testid="atleta-signup-email-phase"]')
    .getByRole("button", { name: /Continuar/ })
    .click();

  // Phase 2: details
  await page.waitForSelector('[data-testid="atleta-signup-details-phase"]', {
    timeout: 10_000,
  });
  await page.locator('input[name="firstName"]').fill(firstName);
  await page.locator('input[name="lastName"]').fill(lastName);
  await page
    .locator('[data-testid="atleta-signup-details-phase"]')
    .getByRole("button", { name: /Continuar/ })
    .click();

  // Phase 3: goals — skip
  await page.waitForSelector('[data-testid="atleta-signup-goals-phase"]', {
    timeout: 10_000,
  });
  await page.getByRole("button", { name: /^Saltar$/ }).click();

  // Success state (magic link mode mostrará "Te enviamos un enlace mágico")
  await expect(page.getByText(/enlace mágico|Ya puedes entrar/i)).toBeVisible({
    timeout: 15_000,
  });

  return email;
}

async function devLoginAs(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await page.locator('input[placeholder="email"]').fill(email);
  await page.locator('input[placeholder="password"]').fill(DEV_PASSWORD);
  await Promise.all([
    page.waitForURL(/\/atleta/, { timeout: 15_000 }),
    page.getByRole("button", { name: /Entrar \(dev\)/ }).click(),
  ]);
}

test.describe("Athlete Onboarding 9-Step Wizard", () => {
  test("Scenario 4: atleta seed (onboarded) NO entra al wizard", async ({
    page,
  }) => {
    // Seed: atleta@iron-hands.demo tiene onboardingCompletedAt seteado tras
    // `pnpm db:seed`. El layout `atleta/layout.tsx` debe permitir libre
    // navegación; y un acceso directo a /atleta/onboarding debe redirigir
    // a /atleta (bypass inverso del page.tsx onboarding).
    await devLoginAs(page, "atleta@iron-hands.demo");

    // Tras login el browser ya está en /atleta (o subpath); NO debe estar
    // en /atleta/onboarding.
    expect(page.url()).not.toContain("/atleta/onboarding");

    // Intento directo a /atleta/onboarding → redirige a /atleta (bypass
    // inverso del page.tsx del onboarding).
    await page.goto("/atleta/onboarding");
    await page.waitForURL(
      (url) => !url.pathname.startsWith("/atleta/onboarding"),
      { timeout: 10_000 },
    );
    expect(page.url()).not.toContain("/atleta/onboarding");
  });

  test("Scenario 1 (parcial): signup nuevo → wizard renderiza Step 1", async ({
    page,
  }) => {
    // Signup crea atleta nuevo con Box Personal (B2C). El gate del
    // `atleta/layout.tsx` debe forzar redirect a /atleta/onboarding al
    // tocar cualquier ruta /atleta/*. El wizard debe renderizar Paso 1
    // con título "¿Cuál es tu objetivo?" y 4 RadioCards.
    const email = await signupNewAtleta(page, "Wizard", "Tester");
    await devLoginAs(page, email);

    // Tras login, el layout gate redirige a /atleta/onboarding
    await page.waitForURL(/\/atleta\/onboarding/, { timeout: 15_000 });

    // Page title del wizard
    await expect(page).toHaveTitle(/Bienvenido/);

    // Heading del Step 1
    await expect(
      page.getByRole("heading", { name: /¿Cuál es tu objetivo\?/ }),
    ).toBeVisible();

    // Indicador "Paso 1 de 9"
    await expect(page.getByText(/Paso 1 de 9/)).toBeVisible();

    // 4 RadioCards de Step1Reason
    await expect(page.getByText(/Soy principiante/)).toBeVisible();
    await expect(page.getByText(/Mejorar mi rutina/)).toBeVisible();
    await expect(page.getByText(/Estoy aburrido de lo actual/)).toBeVisible();
    await expect(page.getByText(/Plan óptimo personalizado/)).toBeVisible();

    // Botón Siguiente disabled hasta seleccionar
    const nextBtn = page.getByRole("button", { name: /^Siguiente$/ });
    await expect(nextBtn).toBeDisabled();

    // Wizard fullscreen: no debe haber TabBar inferior ni drawer
    await expect(page.getByRole("link", { name: /^Reservar$/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Menú$/ })).toHaveCount(0);
  });

  test("Scenario 5: B2C signup → Step 8 muestra 3 radios SIN checkbox B2B", async ({
    page,
  }) => {
    // Signup crea atleta en Box Personal (B2C). Avanzamos hasta Step 8
    // y verificamos que el render adaptativo muestre 3 radios y NO el
    // checkbox "También entreno solo" (que es exclusivo de B2B).
    const email = await signupNewAtleta(page, "B2C", "Step8");
    await devLoginAs(page, email);
    await page.waitForURL(/\/atleta\/onboarding/, { timeout: 15_000 });

    // Step 1 → seleccionar "Soy principiante" → Siguiente
    await page.getByText(/Soy principiante/).click();
    await page.getByRole("button", { name: /^Siguiente$/ }).click();

    // Step 2 → seleccionar Hombre, valores default ya cargados pero el state
    // interno es NULL hasta interacción. Click "+" en cada stepper para
    // setear el valor explícitamente.
    await expect(
      page.getByRole("heading", { name: /perfil físico/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: /^Hombre$/ }).click();
    // Cada NumberStepper tiene 2 botones: "−" y "+". Click "+" en los 3.
    const plusButtons = page.getByRole("button", { name: "+" });
    await plusButtons.nth(0).click(); // weight
    await plusButtons.nth(1).click(); // age
    await plusButtons.nth(2).click(); // height
    await page.getByRole("button", { name: /^Siguiente$/ }).click();

    // Step 3 → Principiante
    await expect(
      page.getByRole("heading", { name: /experiencia/i }),
    ).toBeVisible();
    await page.getByText(/^Principiante$/).click();
    await page.getByRole("button", { name: /^Siguiente$/ }).click();

    // Step 4 → Estar en forma general
    await expect(page.getByText(/Estar en forma general/)).toBeVisible();
    await page.getByText(/Estar en forma general/).click();
    await page.getByRole("button", { name: /^Siguiente$/ }).click();

    // Step 5 → frequency (NumberStepper). Click "+" 1 vez para setear.
    await expect(page.getByText(/Días por semana/)).toBeVisible();
    await page.getByRole("button", { name: "+" }).click();
    await page.getByRole("button", { name: /^Siguiente$/ }).click();

    // Step 6 → IA elige (por defecto, scroll y siguiente)
    // El default puede ser AUTO o requerir click. Selecciono "Enfoque en
    // recuperación" para ser explícito.
    await page.getByText(/Enfoque en recuperación/).click();
    await page.getByRole("button", { name: /^Siguiente$/ }).click();

    // Step 7 → músculos excluidos (opcional, skip)
    // El step debería permitir Siguiente sin selecciones.
    await page.getByRole("button", { name: /^Siguiente$/ }).click();

    // Step 8: verificación clave del test
    await expect(
      page.getByRole("heading", { name: /¿Dónde entrenas\?/ }),
    ).toBeVisible();

    // 3 radios visibles (B2C path)
    await expect(page.getByText(/^Gym grande$/)).toBeVisible();
    await expect(page.getByText(/^Gym pequeño$/)).toBeVisible();
    await expect(page.getByText(/^Casa$/)).toBeVisible();

    // NO checkbox "También entreno solo" (es exclusivo de B2B)
    await expect(page.getByText(/También entreno solo/)).toHaveCount(0);

    // NO sticky card "Entrenas en ..." (también exclusivo B2B)
    await expect(page.getByText(/^Entrenas en/)).toHaveCount(0);
  });

  test.skip("Scenario 2: Box B2B first login → Step 8 shows box pre-loaded", async () => {
    // Requiere DB reset: atleta@iron-hands.demo con onboardingCompletedAt=NULL
    // antes del test, y restaurar a NOW() después. Implementar con setup
    // global o endpoint /api/test-helpers/reset-onboarding.
  });

  /**
   * P0-b regression: B2B athlete completes wizard WITHOUT toggling
   * "También entreno solo" and reaches /atleta (no generic toast dead-end).
   *
   * EXECUTION STATUS: spec written, CANNOT RUN in CI — reuseExistingServer
   * requires NEXT_PUBLIC_DEV_LOGIN=1 and a B2B seed athlete with
   * onboardingCompletedAt=NULL. The spec is correct; it cannot be claimed
   * green without a running dev server and the correct seed state.
   *
   * To run manually:
   *   1. pnpm db:seed (creates atleta@iron-hands.demo with onboardingCompletedAt=NULL
   *      if you wipe and re-seed, or use /api/test-helpers/reset-onboarding)
   *   2. NEXT_PUBLIC_DEV_LOGIN=1 pnpm dev
   *   3. pnpm test:e2e --grep "B2B path without entreno solo"
   */
  test.skip("Scenario 8 (P0-b regression): B2B path without 'También entreno solo' → reaches /atleta", async ({
    page,
  }) => {
    // This test requires atleta@iron-hands.demo with onboardingCompletedAt=NULL.
    // After pnpm db:seed that seed user has onboardingCompletedAt set, so you
    // need to reset it via: UPDATE "Athlete" SET "onboardingCompletedAt"=NULL WHERE ...
    // or a /api/test-helpers/reset-onboarding endpoint.

    await devLoginAs(page, "atleta@iron-hands.demo");
    await page.waitForURL(/\/atleta\/onboarding/, { timeout: 15_000 });

    // Step 1 → seleccionar "Soy principiante"
    await page.getByText(/Soy principiante/).click();
    await page.getByRole("button", { name: /^Siguiente$/ }).click();

    // Step 2 → sexo biológico + steppers
    await expect(
      page.getByRole("heading", { name: /perfil físico/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: /^Hombre$/ }).click();
    const plusButtons = page.getByRole("button", { name: "+" });
    await plusButtons.nth(0).click();
    await plusButtons.nth(1).click();
    await plusButtons.nth(2).click();
    await page.getByRole("button", { name: /^Siguiente$/ }).click();

    // Step 3 → Principiante
    await page.getByText(/^Principiante$/).click();
    await page.getByRole("button", { name: /^Siguiente$/ }).click();

    // Step 4 → Estar en forma general
    await page.getByText(/Estar en forma general/).click();
    await page.getByRole("button", { name: /^Siguiente$/ }).click();

    // Step 5 → frequency
    await page.getByRole("button", { name: "+" }).click();
    await page.getByRole("button", { name: /^Siguiente$/ }).click();

    // Step 6 → routine preference
    await page.getByText(/Enfoque en recuperación/).click();
    await page.getByRole("button", { name: /^Siguiente$/ }).click();

    // Step 7 → skip excluded muscles
    await page.getByRole("button", { name: /^Siguiente$/ }).click();

    // Step 8 — B2B path: verify box card is shown, do NOT touch "También entreno solo"
    await expect(
      page.getByRole("heading", { name: /Tu lugar de entrenamiento/i }),
    ).toBeVisible();
    // Box card must be visible
    await expect(page.getByText(/Entrenas en/)).toBeVisible();
    // Do NOT toggle "También entreno solo"
    // Siguiente must be ENABLED (not blocked by missing trainingLocation)
    const nextBtn = page.getByRole("button", { name: /^Siguiente$/ });
    await expect(nextBtn).not.toBeDisabled();
    await nextBtn.click();

    // Step 9 → notifications → finish
    await expect(page.getByText(/Paso 9 de 9/)).toBeVisible();
    await page.getByRole("button", { name: /^Siguiente$/ }).click();

    // Should NOT show generic "Completa todos los campos" toast
    await expect(
      page.getByText(/Completa todos los campos para continuar/),
    ).toHaveCount(0);

    // Should reach /atleta (plan creating animation then redirect)
    await page.waitForURL(/\/atleta(?!\/onboarding)/, { timeout: 20_000 });
    expect(page.url()).not.toContain("/atleta/onboarding");
  });

  test.skip("Scenario 3: Resume partial — exit Step 4 → re-login → resume Step 4", async () => {
    // Requiere localStorage persistido entre sessions distintas y un atleta
    // con onboardingCompletedAt=NULL. Mismo requisito de DB reset que #2.
  });

  test.skip("Scenario 6: Cinematic closing animation timing", async () => {
    // Requiere llegar a Step 9 (completar todo el wizard). Más simple
    // testear las phases con Playwright`s page.waitForTimeout matching
    // las 3.5s/6.5s/7.5s del PlanCreatingScreen — pero el riesgo de
    // flake es alto. Mejor unit test de PlanCreatingScreen con jest.
  });

  test.skip("Scenario 7: Audit logging por step completado", async () => {
    // Requiere logAudit cableado a cada step (ATHLETE_ONBOARDING_STEP_COMPLETED)
    // y query al modelo AuditLog post-test. Pendiente implementación del
    // logAudit en el wizard (parte del Slice 8 pendiente).
  });

  test.skip("Responsive 360/768/1280 — validado vía /visual-iterate", async () => {
    // Validado con /visual-iterate en commit 8671c75. Resultado:
    // 360/768/1280 → 0 issues a todos los breakpoints. Conservado como
    // referencia; la verdad funcional vive en /visual-iterate (Playwright
    // MCP con detector de overflow + touch targets + tiny text).
  });
});
