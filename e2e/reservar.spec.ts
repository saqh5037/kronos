/**
 * E2E: Atleta — flujo de reserva
 *
 * Cubre:
 *  - Atleta navega a /atleta/reservar y ve clases del seed
 *  - Atleta reserva una clase con cupo → estado pasa a "Cancelar"
 *  - Atleta cancela su reserva → estado vuelve a "Reservar"
 *  - DB refleja el booking (BOOKED tras reservar, CANCELLED tras cancelar)
 */

import { test, expect } from "@playwright/test";
import { loginAs } from "./fixtures/auth";
import {
  clearFutureBookingsForDemoAthlete,
  getDemoAthlete,
  db,
  disconnect,
} from "./fixtures/db";

test.describe.serial("Atleta — reservar", () => {
  test.beforeEach(async () => {
    await clearFutureBookingsForDemoAthlete();
  });

  test.afterAll(async () => {
    await clearFutureBookingsForDemoAthlete();
    await disconnect();
  });

  test("atleta navega a /atleta/reservar y ve calendario", async ({ page }) => {
    await loginAs(page, "atleta");
    await page.goto("/atleta/reservar");
    await expect(page.getByText(/Reservar clase/i)).toBeVisible();
    // Al menos una clase visible
    await expect(
      page.getByRole("button", { name: /Reservar/ }).first(),
    ).toBeVisible();
  });

  test("atleta reserva clase y luego la cancela — booking persiste en DB", async ({
    page,
  }) => {
    const athlete = await getDemoAthlete();

    await loginAs(page, "atleta");
    await page.goto("/atleta/reservar");

    // Sanity: arranco con 0 bookings activos
    const before = await db().booking.count({
      where: { athleteId: athlete.id, status: "BOOKED" },
    });
    expect(before).toBe(0);

    // Reservar la primera clase con cupo visible (día seleccionado por default = hoy)
    const reservarBtn = page
      .getByRole("button", { name: /^Reservar$/ })
      .first();
    await expect(reservarBtn).toBeVisible({ timeout: 5000 });
    await reservarBtn.click();

    // Tras reservar, el botón debe cambiar a "Cancelar"
    await expect(
      page.getByRole("button", { name: /^Cancelar$/ }).first(),
    ).toBeVisible({ timeout: 10_000 });

    // DB: exactamente 1 booking BOOKED nuevo
    const afterBook = await db().booking.count({
      where: { athleteId: athlete.id, status: "BOOKED" },
    });
    expect(afterBook).toBe(1);

    // Cancelar — el componente usa confirm() nativo
    page.on("dialog", (dialog) => {
      void dialog.accept();
    });
    await page
      .getByRole("button", { name: /^Cancelar$/ })
      .first()
      .click();

    // Esperar a que la BD refleje el cancel (server action async)
    await expect
      .poll(
        async () =>
          db().booking.count({
            where: { athleteId: athlete.id, status: "BOOKED" },
          }),
        { timeout: 10_000 },
      )
      .toBe(0);
  });

  test("atleta no puede reservar dos veces la misma clase (idempotencia visual)", async ({
    page,
  }) => {
    const athlete = await getDemoAthlete();

    await loginAs(page, "atleta");
    await page.goto("/atleta/reservar");

    const reservarBtn = page
      .getByRole("button", { name: /^Reservar$/ })
      .first();
    await expect(reservarBtn).toBeVisible({ timeout: 5000 });
    await reservarBtn.click();

    await expect(
      page.getByRole("button", { name: /^Cancelar$/ }).first(),
    ).toBeVisible({ timeout: 10_000 });

    // Recargar página: el estado persiste (sin doble-booking)
    await page.reload();
    await expect(
      page.getByRole("button", { name: /^Cancelar$/ }).first(),
    ).toBeVisible({ timeout: 10_000 });

    const bookedCount = await db().booking.count({
      where: { athleteId: athlete.id, status: "BOOKED" },
    });
    expect(bookedCount).toBe(1);
  });
});
