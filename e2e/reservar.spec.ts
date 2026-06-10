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
  getSeedBoxId,
  db,
  disconnect,
} from "./fixtures/db";

/**
 * WOD name link — P1-b
 *
 * Verifies that a class card's WOD name is a link to
 * /atleta/wod?date=YYYY-MM-DD matching the class's local calendar day.
 *
 * Requires dev server + pnpm db:seed.
 */
test.describe("Reservar — WOD name link", () => {
  test.afterAll(async () => {
    await disconnect();
  });

  test("class card WOD name link href matches /atleta/wod?date=YYYY-MM-DD", async ({
    page,
  }) => {
    // Find the first seeded future class that has a WOD (not Open Box)
    const boxId = await getSeedBoxId();
    const box = await db().box.findUnique({
      where: { id: boxId },
      select: { timezone: true },
    });
    const timezone = box?.timezone ?? "UTC";

    const now = new Date();
    const klass = await db().class.findFirst({
      where: {
        tenantId: boxId,
        startsAt: { gte: now },
        isActive: true,
        wodId: { not: null },
        kind: { not: "OPEN_BOX" },
      },
      include: { wod: { select: { id: true, name: true } } },
      orderBy: { startsAt: "asc" },
    });

    const wodName = klass?.wod?.name ?? null;
    if (!wodName) {
      test.skip(); // No seeded future class with WOD — skip gracefully
      return;
    }

    // Compute expected dateKey using same logic as classToWodDateKey
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const expectedDateKey = fmt.format(klass!.startsAt);

    // Navigate to the day that contains this class
    await loginAs(page, "atleta");
    await page.goto(`/atleta/reservar?date=${expectedDateKey}`);

    // The WOD name should appear as a link with the correct href
    const link = page.getByRole("link", { name: wodName }).first();
    await expect(link).toBeVisible({ timeout: 15_000 });

    const href = await link.getAttribute("href");
    expect(href).toBe(`/atleta/wod?date=${expectedDateKey}`);
  });
});

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
    await expect(
      page.getByText("RESERVAR", { exact: true }).first(),
    ).toBeVisible();
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
    // Tomorrow: every class is in the future (today's early classes already
    // started and decideBooking rejects CLASS_IN_PAST).
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    await page.goto(`/atleta/reservar?date=${tomorrow}`);

    // Sanity: arranco con 0 bookings activos
    const before = await db().booking.count({
      where: { athleteId: athlete.id, status: "BOOKED" },
    });
    expect(before).toBe(0);

    // Reservar la primera clase con cupo visible
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

    // Cancelar — abre el modal de useConfirm() y se confirma ahí
    await page
      .getByRole("button", { name: /^Cancelar$/ })
      .first()
      .click();
    await page.getByRole("button", { name: "Sí, cancelar" }).click();

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
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    await page.goto(`/atleta/reservar?date=${tomorrow}`);

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
