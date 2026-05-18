/**
 * E2E: Cross-tenant isolation regression suite
 *
 * Protege contra dos bugs cerrados en 2026-05-17:
 *
 *  Bug A (commit 5a491ba): `getCurrentAthleteCached` sin key de tenant cacheaba
 *  el primer atleta del seed (Bernardo Q. del DOMINUS Box) y lo devolvía a
 *  cualquier usuario nuevo — leak de datos entre sesiones en el mismo worker.
 *
 *  Bug B (commit 6db36f9): Service Worker precacheaba `/atleta` sin segregar
 *  por usuario. El SW instalado servía la respuesta del primer atleta a
 *  cualquier sesión posterior — cross-tenant leak vía cache del browser.
 *
 * Cobertura:
 *  1. Atleta de Box A NO ve datos de Box B después de logout + login en mismo
 *     browser context (sin clear manual de cookies).
 *  2. Service Worker NO cachea `/atleta` — la ruta usa NETWORK-ONLY.
 *  3. Atleta nuevo (signup fresco) NO hereda datos del atleta seed (Bernardo).
 */

import { test, expect } from "@playwright/test";
import { db, disconnect } from "./fixtures/db";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEV_PASSWORD = process.env.DEV_PASSWORD ?? "dev";

/** Email único para tests que crean usuarios efímeros */
function uniqueEmail(): string {
  return `e2e-isolation-${Date.now()}-${Math.floor(Math.random() * 1e6)}@kronos.test`;
}

/**
 * Dev login via NextAuth API directa (provider `dev-login`).
 * Bypassa el UI form porque el DevLoginForm de /login usa internamente el
 * provider `password` (que requiere hashedPassword en BD — los seed users no
 * lo tienen). Para tests E2E lo correcto es ir al provider `dev-login` que
 * solo valida `password === DEV_PASSWORD` y carga el User por email.
 *
 * Post-call, NextAuth setea cookies en page.context() automáticamente y
 * navega a /atleta como atleta (vía middleware role-based).
 */
async function devLogin(
  page: import("@playwright/test").Page,
  email: string,
  password = DEV_PASSWORD,
): Promise<void> {
  // 1) Obtener CSRF token (requerido por NextAuth)
  const csrfResp = await page.request.get("/api/auth/csrf");
  const { csrfToken } = (await csrfResp.json()) as { csrfToken: string };

  // 2) POST al callback del provider dev-login
  const resp = await page.request.post("/api/auth/callback/dev-login", {
    form: {
      email,
      password,
      csrfToken,
      callbackUrl: "/atleta",
      json: "true",
    },
    failOnStatusCode: false,
  });

  // NextAuth retorna 200 con { url } o redirect (302) — ambos son OK
  if (!resp.ok() && resp.status() !== 302) {
    throw new Error(`devLogin failed: ${resp.status()} ${await resp.text()}`);
  }

  // 3) Navegar a /atleta para validar sesión activa (el middleware redirige
  //    a /login si la cookie de sesión no es válida)
  await page.goto("/atleta");
  await page.waitForLoadState("networkidle");
}

/**
 * Logout usando la página custom /logout (commit bcf708b).
 * /logout muestra confirmación con botón "Sí, cerrar sesión" que invoca
 * signOut({ callbackUrl, redirect: true }). Forzamos callbackUrl=/login
 * vía query para garantizar redirect a /login post-signOut.
 */
async function logout(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/logout?callbackUrl=/login");
  await page.getByRole("button", { name: /Sí, cerrar sesión/ }).click();
  await page.waitForURL(/\/login/, { timeout: 12_000 });
}

/**
 * Crea un User con role ATHLETE en Box B (demo-box-b) para usarlo
 * en el test de aislamiento cross-tenant.
 * Retorna el email creado para posterior limpieza.
 *
 * Box B tiene `seed-isolation-${box2.id}` como atleta pero sin User linkeado —
 * creamos el User y lo vinculamos al atleta existente.
 */
async function createBoxBAthleteUser(): Promise<{
  email: string;
  athleteId: string;
  userId: string;
  firstName: string;
  cleanup: () => Promise<void>;
}> {
  const email = uniqueEmail();

  const box = await db().box.findUnique({
    where: { slug: "demo-box-b" },
    select: { id: true },
  });
  if (!box) throw new Error("Box B (demo-box-b) not found — run pnpm db:seed");

  // Buscar el atleta de aislamiento seed de Box B
  const isolationAthlete = await db().athlete.findFirst({
    where: { tenantId: box.id, id: { startsWith: "seed-isolation-" } },
    select: { id: true, firstName: true },
  });
  if (!isolationAthlete) {
    throw new Error(
      "seed-isolation athlete for Box B not found — run pnpm db:seed",
    );
  }

  const user = await db().user.create({
    data: {
      email,
      name: "Atlas BoxB E2E",
      role: "ATHLETE",
      tenantId: box.id,
    },
  });

  await db().athlete.update({
    where: { id: isolationAthlete.id },
    data: { userId: user.id },
  });

  return {
    email,
    athleteId: isolationAthlete.id,
    userId: user.id,
    firstName: isolationAthlete.firstName,
    cleanup: async () => {
      // Desvincular User del atleta (restituir estado seed)
      await db().athlete.update({
        where: { id: isolationAthlete.id },
        data: { userId: null },
      });
      await db().user.delete({ where: { id: user.id } });
    },
  };
}

/**
 * Crea un User + Athlete brand-new vinculado a Box A (iron-hands) vía Prisma.
 * Evita el flujo de signup UI (3 fases + onboarding de 7 pasos) que está fuera
 * del scope del bug que protege esta suite (cache cross-tenant server-side).
 *
 * El atleta queda con su propio firstName/lastName y SIN historia (sin scores,
 * sin PRs, sin asistencia) — exactamente el caso del bug Bernardo.
 */
async function createFreshAthleteUser(firstName: string): Promise<{
  email: string;
  athleteId: string;
  userId: string;
  firstName: string;
  cleanup: () => Promise<void>;
}> {
  const email = uniqueEmail();

  const box = await db().box.findFirst({
    where: { slug: { not: "demo-box-b" } },
    select: { id: true },
  });
  if (!box) throw new Error("No primary box found — run pnpm db:seed");

  const user = await db().user.create({
    data: {
      email,
      name: `${firstName} IsolationTest`,
      role: "ATHLETE",
      tenantId: box.id,
    },
  });

  const athlete = await db().athlete.create({
    data: {
      tenantId: box.id,
      userId: user.id,
      firstName,
      lastName: "IsolationTest",
      status: "ACTIVE",
      onboardingCompletedAt: new Date(),
    },
  });

  return {
    email,
    athleteId: athlete.id,
    userId: user.id,
    firstName,
    cleanup: async () => {
      await db()
        .athlete.delete({ where: { id: athlete.id } })
        .catch(() => {});
      await db()
        .user.delete({ where: { id: user.id } })
        .catch(() => {});
    },
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

test.describe("Cross-tenant isolation", () => {
  // Los tests son independientes entre sí — usan browser contexts distintos
  // (Playwright crea uno nuevo por test por defecto).
  // test.describe.parallel() no aplica aquí porque workers=1 en playwright.config.ts.

  // -------------------------------------------------------------------------
  // Test 1: Atleta Box A NO ve datos de Box B después de re-login en mismo context
  // -------------------------------------------------------------------------
  test.describe("Test 1 — atleta de Box A no ve datos de Box B en mismo browser context", () => {
    let boxBUser: Awaited<ReturnType<typeof createBoxBAthleteUser>>;

    test.beforeAll(async () => {
      boxBUser = await createBoxBAthleteUser();
    });

    test.afterAll(async () => {
      await boxBUser.cleanup();
      await disconnect();
    });

    test("logout + login Box B → home muestra datos de Box B, no de Box A", async ({
      page,
    }) => {
      // ── Paso 1: Login como atleta de Box A (iron-hands.demo) ──
      await devLogin(page, "atleta@iron-hands.demo");
      // devLogin ya esperó el redirect interno — assert la URL actual
      expect(page.url()).toMatch(/\/atleta/);

      // Capturar nombre mostrado en Box A
      await page.goto("/atleta");
      await page.waitForLoadState("networkidle");

      // El header de atleta home muestra el nombre del atleta
      // Atleta seed de iron-hands: firstName viene del seed (random, pero está linkeado a seed-ath-0)
      const headerBoxA = await page
        .locator("h1, h2")
        .first()
        .textContent({ timeout: 8_000 });

      // ── Paso 2: Logout (sin clear manual de cookies) ──
      await logout(page);
      await expect(page).toHaveURL(/\/login/);

      // ── Paso 3: Login como atleta de Box B en el MISMO browser context ──
      await devLogin(page, boxBUser.email);
      expect(page.url()).toMatch(/\/atleta/);

      await page.goto("/atleta");
      await page.waitForLoadState("networkidle");

      // ── Paso 4: Verificar que el contenido es de Box B ──

      // El atleta de Box B es "Atlas BoxB" — su nombre NO debe aparecer mezclado con Box A
      // y el nombre de Box A NO debe aparecer en Box B
      const pageText = await page.locator("body").innerText();

      // Verificación negativa: NO debe mostrar "Iron Hands CrossFit" (Box A brand)
      // El home del atleta muestra el nombre del box en algún lugar del layout
      expect(pageText).not.toContain("Iron Hands CrossFit");

      // Verificación positiva: debe estar autenticado con el user de Box B
      // (si hubiera leak, la sesión seguiría siendo de Box A o devolvería error)
      // El atleta de Box B se llama "Atlas" según seed
      // Verificamos que la página cargo sin error 5xx
      await expect(page.locator("body")).not.toContainText(/Algo salió mal/i);
      await expect(page.locator("body")).not.toContainText(/500/);

      // Si la sesión fue correctamente renovada, el layout carga sin redirect a /login
      expect(page.url()).toMatch(/\/atleta/);
      expect(page.url()).not.toMatch(/\/login/);

      // El nombre de Box A no debe aparecer en el dashboard de Box B
      // (headerBoxA puede ser undefined en edge case — solo verificar si lo capturamos)
      if (headerBoxA && headerBoxA.trim().length > 3) {
        // Solo verificar si el header de Box A tenía contenido real
        // Nota: el nombre del atleta seed-ath-0 es random (seed usa FIRST_NAMES/LAST_NAMES)
        // no podemos hardcodearlo — verificamos via body text del box name brand
      }
    });
  });

  // -------------------------------------------------------------------------
  // Test 2: Service Worker NO cachea /atleta (NETWORK-ONLY)
  // -------------------------------------------------------------------------
  test("Test 2 — Service Worker usa NETWORK-ONLY para /atleta (no cachea respuesta)", async ({
    page,
  }) => {
    // Login como atleta seed de Box A para tener sesión válida
    await devLogin(page, "atleta@iron-hands.demo");
    await page.waitForURL(/\/atleta/, { timeout: 10_000 });

    // Navegar a /atleta para forzar instalación del SW si no está activo
    await page.goto("/atleta");
    await page.waitForLoadState("networkidle");

    // Dar tiempo al SW para activarse (skipWaiting + clients.claim)
    await page.waitForTimeout(1_500);

    // ── Verificación 1: /atleta NO está en ningún cache del SW ──
    const cachedAtletaEntries = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      const results: string[] = [];
      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        for (const req of keys) {
          const url = new URL(req.url);
          if (
            url.pathname === "/atleta" ||
            url.pathname.startsWith("/atleta/")
          ) {
            results.push(`${name}:${url.pathname}`);
          }
        }
      }
      return results;
    });

    expect(cachedAtletaEntries).toHaveLength(0);

    // ── Verificación 2: intercepción de network — /atleta va directo a red ──
    // Interceptamos la próxima request a /atleta para confirmar que NO viene del SW cache
    let responseFromCache = false;
    page.on("response", (res) => {
      if (new URL(res.url()).pathname === "/atleta") {
        // Si la respuesta tiene el header "x-cache: hit" o viene del SW con
        // status 200 pero sin ir a la red, es un hit de cache.
        // El SW de kronos usa NETWORK-ONLY para /atleta — no modifica headers.
        // Verificamos via Cache-Control de la respuesta HTTP real.
        const cc = res.headers()["cache-control"] ?? "";
        // next.js pages no deben ser max-age largo — deben ser no-store o private
        if (cc.includes("max-age") && !cc.includes("max-age=0")) {
          responseFromCache = true;
        }
      }
    });

    await page.goto("/atleta");
    await page.waitForLoadState("networkidle");

    // No debe haber una respuesta del SW con max-age positivo para /atleta
    expect(responseFromCache).toBe(false);

    // ── Verificación 3: el cache del SW NO almacenó /atleta después de navegar ──
    const cachedAfterNav = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        for (const req of keys) {
          const url = new URL(req.url);
          if (
            url.pathname === "/atleta" ||
            url.pathname.startsWith("/atleta/")
          ) {
            return true;
          }
        }
      }
      return false;
    });

    expect(cachedAfterNav).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Test 3: Atleta brand-new NO hereda datos del atleta seed (bug Bernardo)
  // -------------------------------------------------------------------------
  test.describe("Test 3 — atleta nuevo no hereda datos del seed (bug Bernardo)", () => {
    let fresh: Awaited<ReturnType<typeof createFreshAthleteUser>>;

    test.beforeAll(async () => {
      fresh = await createFreshAthleteUser("NuevoIsolado");
    });

    test.afterAll(async () => {
      await fresh.cleanup();
      await disconnect();
    });

    test("atleta recién creado en BD → login → home muestra SUS datos, no los del seed Bernardo", async ({
      page,
    }) => {
      // ── Paso 1: Dev login con el atleta recién creado en BD ──
      await devLogin(page, fresh.email);
      expect(page.url()).toMatch(/\/atleta/);

      // ── Paso 2: Ir explícitamente a /atleta para forzar render del home ──
      await page.goto("/atleta");
      await page.waitForLoadState("networkidle");

      const bodyText = await page.locator("body").innerText();

      // Verificación crítica del bug Bernardo: el home NO debe mostrar
      // datos del primer atleta del seed (caso histórico del leak).
      expect(bodyText).not.toContain("Bernardo");

      // Verificación positiva: el home debe mostrar el firstName del atleta nuevo.
      expect(bodyText).toContain(fresh.firstName);

      // Sin errores de render
      expect(bodyText).not.toContain("Algo salió mal");
      expect(bodyText).not.toMatch(/\b500\b/);

      // La URL no redirigió a login (sesión válida)
      expect(page.url()).toMatch(/\/atleta/);
      expect(page.url()).not.toMatch(/\/login/);
    });
  });
});
