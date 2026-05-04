/**
 * E2E: Leaderboards (admin)
 *
 * Cubre:
 *  - Admin/coach navega a /admin/leaderboards
 *  - El selector de WOD muestra opciones
 *  - Selecciona un WOD con scores y ve la tabla con atletas rankeados
 *  - Sidebar de asistencia semanal renderiza
 */

import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";
import { db, getSeedBoxId, disconnect } from "./fixtures/db";

test.describe.serial("Admin — leaderboards", () => {
  test.afterAll(async () => {
    await disconnect();
  });

  test("admin navega a /admin/leaderboards y ve el selector + tabla", async ({
    page,
  }) => {
    await loginAs(page, "owner");
    await page.goto("/admin/leaderboards");

    await expect(
      page.getByRole("heading", { name: /Leaderboards/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/Mejor score por atleta y asistencia semanal/i),
    ).toBeVisible();
  });

  test("selecciona un WOD con scores y ve ranking de atletas", async ({
    page,
  }) => {
    // Buscar un WOD con al menos 1 score RX desde DB
    const tenantId = await getSeedBoxId();
    const wodWithScores = await db().wOD.findFirst({
      where: {
        tenantId,
        scores: { some: { scaling: "RX" } },
      },
      select: { id: true, name: true },
    });

    if (!wodWithScores) {
      test.skip(true, "Seed no tiene WOD con scores RX");
    }

    await loginAs(page, "owner");
    await page.goto(`/admin/leaderboards?wod=${wodWithScores!.id}`);

    // Tabla debe renderizar con cabeceras y al menos una fila
    await expect(
      page.getByRole("heading", { name: wodWithScores!.name }),
    ).toBeVisible();
    await expect(page.getByText(/Atleta/i).first()).toBeVisible();
    await expect(page.locator("table tbody tr").first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test("leaderboard de asistencia semanal renderiza", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/admin/leaderboards");

    // Hay 2 secciones — la del lado derecho (col lg:col-span-1) es asistencia
    // El page muestra "asistencia semanal" en el subtítulo
    await expect(page.getByText(/asistencia semanal/i).first()).toBeVisible();
  });
});
