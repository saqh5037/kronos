/**
 * E2E: Auth flow
 *
 * Cubre:
 *  - Login page renderiza con magic link + dev login UI
 *  - Acceso no autenticado a /admin y /atleta redirige a /login
 *  - /tv es público (sin redirect)
 *  - Dev login funciona con OWNER, COACH y ATHLETE
 *  - Sign out vuelve a /login
 */

import { test, expect } from "@playwright/test";
import { loginAs, signOut, SEED_USERS } from "./fixtures/auth";

test.describe("Auth — guards y dev login", () => {
  test("login page renderiza", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/Kronos/);
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.getByText(/Solo desarrollo/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Entrar \(dev\)/ }),
    ).toBeVisible();
  });

  test("/admin sin sesión redirige a /login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/login/);
  });

  test("/atleta sin sesión redirige a /login", async ({ page }) => {
    await page.goto("/atleta");
    await expect(page).toHaveURL(/login/);
  });

  test("/tv es público (sin redirect)", async ({ page }) => {
    await page.goto("/tv");
    await expect(page).not.toHaveURL(/login/);
  });

  test("dev login OWNER → /admin con sesión activa", async ({ page }) => {
    await loginAs(page, "owner");
    await expect(page).toHaveURL(/\/admin/);
    // Dashboard debe mostrar el nombre del box (KPI hero del dashboard)
    await expect(page.getByText(/Iron Hands CrossFit/)).toBeVisible();
  });

  test("dev login COACH → /admin con acceso a módulos", async ({ page }) => {
    await loginAs(page, "coach");
    await expect(page).toHaveURL(/\/admin/);
    // Sidebar muestra Reservas (verifica que el layout admin cargó)
    await expect(page.getByRole("link", { name: /Reservas/ })).toBeVisible();
  });

  test("dev login ATHLETE → llega a admin (deuda: middleware sin role guard)", async ({
    page,
  }) => {
    await loginAs(page, "atleta");
    await expect(page).toHaveURL(/\/(admin|atleta)/);
  });

  test("sign out vuelve a /login", async ({ page }) => {
    await loginAs(page, "owner");
    await signOut(page);
    await expect(page).toHaveURL(/login/);
  });

  test("password incorrecto muestra error y no autentica", async ({ page }) => {
    await page.goto("/login");
    await page
      .locator('input[placeholder="email"]')
      .fill(SEED_USERS.owner.email);
    await page.locator('input[placeholder="password"]').fill("wrong-password");
    await page.getByRole("button", { name: /Entrar \(dev\)/ }).click();
    await expect(page.getByText(/Credenciales inválidas/i)).toBeVisible({
      timeout: 5000,
    });
    await expect(page).toHaveURL(/login/);
  });
});
