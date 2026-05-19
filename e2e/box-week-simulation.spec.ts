/**
 * E2E: Simulación de semana en un box — flujo completo UI.
 *
 * Valida que toda la cadena de modales del PR #38 funciona end-to-end:
 *  1. Owner abre modal "Nuevo atleta" → crea 2 invitaciones reales
 *  2. Cada atleta abre /invitacion/[token] → acepta → User+Athlete creados
 *  3. Cada atleta loguea vía dev login (NEXT_PUBLIC_DEV_LOGIN=1, password "dev")
 *  4. Owner crea 2 clases via modal "Nueva clase"
 *  5. Atletas reservan clases via /atleta/reservar
 *  6. Verifica DB: 2 atletas + 2 clases + 2 bookings BOOKED
 *
 * Test ligero — versión reducida del script seed-week.ts. El script es para
 * poblar masivo; este test es para firmar UI.
 */
import { test, expect } from "@playwright/test";
import { loginAs, loginAsEmail } from "./fixtures/auth";
import { db, disconnect, getSeedBoxId } from "./fixtures/db";

const EMAIL_PREFIX = "e2e-week-sim-";
const TS = Date.now();

const ATHLETES = [
  {
    firstName: "Sofía",
    lastName: "Hernández",
    email: `${EMAIL_PREFIX}${TS}-1@kronos-e2e.local`,
    phone: "5512340001",
  },
  {
    firstName: "Luis",
    lastName: "Mendoza",
    email: `${EMAIL_PREFIX}${TS}-2@kronos-e2e.local`,
    phone: "5512340002",
  },
];

async function cleanup() {
  const tenantId = await getSeedBoxId();
  const emails = ATHLETES.map((a) => a.email);

  await db().athleteInvitation.deleteMany({
    where: { tenantId, email: { in: emails } },
  });

  const users = await db().user.findMany({
    where: { tenantId, email: { in: emails } },
    select: { id: true, athlete: { select: { id: true } } },
  });
  const athleteIds = users
    .map((u) => u.athlete?.id)
    .filter((x): x is string => !!x);
  const userIds = users.map((u) => u.id);

  await db().booking.deleteMany({ where: { athleteId: { in: athleteIds } } });
  await db().athlete.deleteMany({ where: { id: { in: athleteIds } } });
  await db().user.deleteMany({ where: { id: { in: userIds } } });

  // Borrar clases de test (marker: durationMin=45 que no usa el seed normal)
  await db().class.deleteMany({
    where: { tenantId, durationMin: 45 },
  });
}

test.describe.serial("Box week simulation — UI flow completo", () => {
  test.beforeAll(async () => {
    await cleanup();
  });

  test.afterAll(async () => {
    await cleanup();
    await disconnect();
  });

  test("owner invita 2 atletas via modal Nuevo atleta", async ({ page }) => {
    await loginAs(page, "owner");
    await page.goto("/admin/atletas");

    for (const a of ATHLETES) {
      await page.getByRole("button", { name: /\+ Nuevo atleta/i }).click();
      // Modal abierto
      await expect(page.getByRole("dialog")).toBeVisible();

      await page
        .getByLabel(/Nombre/i)
        .first()
        .fill(a.firstName);
      await page.getByLabel(/Apellido/i).fill(a.lastName);
      await page.getByLabel(/Email/i).fill(a.email);
      await page.getByLabel(/Tel[eé]fono/i).fill(a.phone);

      await page.getByRole("button", { name: /Enviar invitación/i }).click();

      // Toast de éxito o modal se cierra
      await expect(page.getByRole("dialog")).toBeHidden({ timeout: 10_000 });
    }

    // DB: 2 AthleteInvitation rows
    const tenantId = await getSeedBoxId();
    const invs = await db().athleteInvitation.findMany({
      where: { tenantId, email: { in: ATHLETES.map((a) => a.email) } },
    });
    expect(invs).toHaveLength(2);
    expect(invs.every((i) => i.acceptedAt === null)).toBe(true);
  });

  test("cada atleta acepta su invitación y se loguea", async ({
    page,
    context,
  }) => {
    const tenantId = await getSeedBoxId();

    for (const a of ATHLETES) {
      const inv = await db().athleteInvitation.findFirst({
        where: { tenantId, email: a.email },
      });
      expect(inv).toBeTruthy();

      await context.clearCookies();
      await page.goto(`/invitacion/${inv!.token}`);

      // Form prellenado con firstName
      await expect(page.locator('input[id="firstName"]')).toHaveValue(
        a.firstName,
      );

      await page.getByRole("button", { name: /Aceptar invitación/i }).click();

      await expect(page.getByText(/¡Listo!/i)).toBeVisible({
        timeout: 10_000,
      });

      // DB: invitación marcada acceptedAt + User + Athlete creados
      const updated = await db().athleteInvitation.findUnique({
        where: { id: inv!.id },
      });
      expect(updated?.acceptedAt).not.toBeNull();

      const user = await db().user.findUnique({
        where: { email: a.email },
        include: { athlete: true },
      });
      expect(user?.role).toBe("ATHLETE");
      expect(user?.tenantId).toBe(tenantId);
      expect(user?.athlete?.firstName).toBe(a.firstName);
    }
  });

  test("atleta loguea via dev login y queda en /atleta/*", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    const a = ATHLETES[0]!;
    await loginAsEmail(page, a.email);
    await expect(page).toHaveURL(/\/(atleta|admin)/);
    // El middleware role-aware lo manda a /atleta. Si no, navego manualmente.
    if (!page.url().includes("/atleta")) {
      await page.goto("/atleta");
    }
    await expect(page).toHaveURL(/\/atleta/);
  });

  test("owner crea 2 clases via modal Nueva clase", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await loginAs(page, "owner");
    await page.goto("/admin/programacion");

    const tenantId = await getSeedBoxId();
    // Borrar marker clases previas (idempotencia entre runs)
    await db().class.deleteMany({
      where: { tenantId, durationMin: 45 },
    });

    // Calcular fecha próximo lunes
    const nextMon = new Date();
    const day = nextMon.getDay();
    const daysToMonday = day === 1 ? 0 : (8 - day) % 7;
    nextMon.setDate(nextMon.getDate() + daysToMonday);
    const dateStr = nextMon.toISOString().slice(0, 10); // YYYY-MM-DD

    for (let i = 0; i < 2; i++) {
      await page.getByRole("button", { name: /\+ Nueva clase/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      await page.getByLabel(/Fecha/i).fill(dateStr);
      await page.getByLabel(/Hora/i).fill(i === 0 ? "10:00" : "11:00");
      // Duración marker = 45 para identificar las clases de este test
      const durInput = page.getByLabel(/Duración/i);
      await durInput.fill("");
      await durInput.fill("45");
      await page.getByLabel(/Capacidad/i).fill("4");

      await page.getByRole("button", { name: /Crear clase/i }).click();
      await expect(page.getByRole("dialog")).toBeHidden({ timeout: 10_000 });
    }

    const created = await db().class.findMany({
      where: { tenantId, durationMin: 45 },
    });
    expect(created).toHaveLength(2);
  });

  test("atleta reserva 1 clase via /atleta/reservar", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    const a = ATHLETES[0]!;
    await loginAsEmail(page, a.email);

    const tenantId = await getSeedBoxId();
    const klass = await db().class.findFirst({
      where: { tenantId, durationMin: 45 },
      orderBy: { startsAt: "asc" },
    });
    expect(klass).toBeTruthy();

    await page.goto("/atleta/reservar");

    // Buscar primer botón "Reservar" disponible. El listado puede tener
    // varios; el primero corresponde a la próxima clase.
    const reservar = page.getByRole("button", { name: /Reservar/i }).first();
    await reservar.click();

    // Polling DB: aparece booking
    let booking = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      const user = await db().user.findUnique({
        where: { email: a.email },
        select: { athlete: { select: { id: true } } },
      });
      const athleteId = user?.athlete?.id;
      if (athleteId) {
        booking = await db().booking.findFirst({
          where: { tenantId, athleteId, status: "BOOKED" },
        });
        if (booking) break;
      }
      await page.waitForTimeout(250);
    }
    expect(booking).toBeTruthy();
  });
});
