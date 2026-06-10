/**
 * E2E: Atleta — submit score con auto-detect PR
 *
 * PR detection en Kronos solo dispara para WODs STRENGTH + WEIGHT + 1 movimiento
 * (estilo 1RM). Para los demás (Fran TIME, etc.) Score se guarda sin PR.
 *
 * Cubre:
 *  - Atleta sube primer score 1RM → PR detectado (UI + tabla PR)
 *  - Atleta sube score MEJOR → PR actualizado (1 PR por movement, upsert)
 *  - Atleta sube score PEOR → Score guardado, PR no cambia
 *  - Perfil renderiza
 */

import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";
import {
  clearScoresAndPR,
  ensureTodayStrengthClass,
  getDemoAthlete,
  db,
  disconnect,
} from "./fixtures/db";

test.describe.serial("Atleta — score submission + PR detection (1RM)", () => {
  let wodId: string;
  let movementId: string;

  test.beforeAll(async () => {
    const target = await ensureTodayStrengthClass();
    wodId = target.wodId;
    movementId = target.movementId;
    await clearScoresAndPR(wodId, movementId);
  });

  test.afterAll(async () => {
    if (wodId && movementId) await clearScoresAndPR(wodId, movementId);
    await disconnect();
  });

  test("primer score → PR detectado", async ({ page }) => {
    const athlete = await getDemoAthlete();

    await loginAs(page, "atleta");
    await page.goto("/atleta/wod");

    await page.locator('input[name="value"]').fill("100");
    await page.getByRole("button", { name: /Guardar score/i }).click();

    // "Nuevo PR registrado" aparece tanto en el label del ScoreForm como en el
    // toast. Usamos el toast (.k-toast__title) para evitar strict mode violation.
    await expect(
      page.locator(".k-toast__title", { hasText: /Nuevo PR registrado/i }),
    ).toBeVisible({ timeout: 10_000 });

    await expect
      .poll(
        async () =>
          db().score.count({ where: { athleteId: athlete.id, wodId } }),
        { timeout: 5000 },
      )
      .toBe(1);

    const pr = await db().pR.findUnique({
      where: { athleteId_movementId: { athleteId: athlete.id, movementId } },
    });
    expect(pr).not.toBeNull();
    expect(Number(pr?.value)).toBe(100);
  });

  test("score MEJOR → PR actualizado al nuevo valor", async ({ page }) => {
    const athlete = await getDemoAthlete();

    await loginAs(page, "atleta");
    await page.goto("/atleta/wod");

    await page.locator('input[name="value"]').fill("120");
    await page.getByRole("button", { name: /Guardar score/i }).click();

    await expect(
      page.locator(".k-toast__title", { hasText: /Nuevo PR registrado/i }),
    ).toBeVisible({ timeout: 10_000 });

    await expect
      .poll(
        async () => {
          const pr = await db().pR.findUnique({
            where: {
              athleteId_movementId: { athleteId: athlete.id, movementId },
            },
          });
          return pr ? Number(pr.value) : -1;
        },
        { timeout: 5000 },
      )
      .toBe(120);

    // 1 PR record (upsert mantiene singleton por athlete+movement)
    const prCount = await db().pR.count({
      where: { athleteId: athlete.id, movementId },
    });
    expect(prCount).toBe(1);
  });

  test("score PEOR → guardado sin tocar el PR", async ({ page }) => {
    const athlete = await getDemoAthlete();

    await loginAs(page, "atleta");
    await page.goto("/atleta/wod");

    await page.locator('input[name="value"]').fill("80");
    await page.getByRole("button", { name: /Guardar score/i }).click();

    // "Score guardado" aparece tanto como feedback inline como en el toast.
    // Usar el toast específicamente para evitar strict mode violation.
    await expect(
      page.locator(".k-toast__title", { hasText: /Score guardado/i }),
    ).toBeVisible({ timeout: 10_000 });

    const pr = await db().pR.findUnique({
      where: { athleteId_movementId: { athleteId: athlete.id, movementId } },
    });
    expect(Number(pr?.value)).toBe(120); // intacto

    // Score peor sí se persiste (auditable)
    const totalScores = await db().score.count({
      where: { athleteId: athlete.id, wodId },
    });
    expect(totalScores).toBe(3);
  });

  test("/atleta/perfil carga sin errores", async ({ page }) => {
    await loginAs(page, "atleta");
    await page.goto("/atleta/perfil");
    await expect(page).toHaveURL(/perfil/);
    await expect(page.locator("body")).toBeVisible();
  });
});
