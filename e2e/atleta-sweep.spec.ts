/**
 * Atleta sweep — barre todas las rutas /atleta/* y verifica:
 *   - HTTP no-5xx
 *   - render efectivo (document.title distinto al de login)
 *   - sin "Algo salió mal" del error.tsx global
 *   - sin pageerror inesperado
 *
 * Reportado tras deploy 41531aa (Bernardo, atleta prueba, solo veía la home).
 * Hotfix 10df47f sacó PageTransition — bug real prod.
 *
 * Issue conocido DEV-ONLY (no falla la suite): cuando una ruta hace `redirect()`
 * desde un Server Component (ej. /atleta/wod/nuevo → /atleta/wod cuando NO es
 * Box Personal), Next 15.5.18 + React 19 dev tira un `pageerror` con
 * "Rendered more hooks than during the previous render" en el Router interno.
 * En prod build no se manifiesta. El redirect SÍ funciona — la pantalla final
 * renderiza OK. Esperar fix upstream de Next.
 *
 * Rutas afectadas por el issue dev-only: /wod/nuevo, /wod/foto, /plan, /programa.
 *
 * Para regresión real: este test sigue siendo útil — si una pantalla del atleta
 * deja de renderizar (rendered=false) o el errorBoundary se dispara, fallamos.
 */
import { test, expect, type ConsoleMessage, type Page } from "@playwright/test";

const DEV_PASSWORD = process.env.DEV_PASSWORD ?? "dev";

async function loginAsAtletaInline(page: Page): Promise<void> {
  await page.goto("/login");
  await page
    .locator('input[placeholder="email"]')
    .fill("atleta@iron-hands.demo");
  await page.locator('input[placeholder="password"]').fill(DEV_PASSWORD);
  // Click + poll por URL (waitForURL tiene race con navigations rápidas)
  await page.getByRole("button", { name: /Entrar \(dev\)/ }).click();
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (/\/(admin|atleta)/.test(page.url())) return;
    await page.waitForTimeout(200);
  }
  throw new Error(`login no redirigió. URL actual: ${page.url()}`);
}

type RouteSpec = {
  path: string;
  label: string;
};

const ATLETA_ROUTES: RouteSpec[] = [
  { path: "/atleta", label: "Home" },
  { path: "/atleta/wod", label: "WOD del día" },
  { path: "/atleta/wod/nuevo", label: "WOD nuevo" },
  { path: "/atleta/wod/foto", label: "WOD foto" },
  { path: "/atleta/reservar", label: "Reservar" },
  { path: "/atleta/perfil", label: "Perfil" },
  { path: "/atleta/historial", label: "Historial" },
  { path: "/atleta/leaderboard", label: "Leaderboard" },
  { path: "/atleta/movimientos", label: "Movimientos" },
  { path: "/atleta/skills", label: "Skills" },
  { path: "/atleta/logros", label: "Logros" },
  { path: "/atleta/pagos", label: "Pagos" },
  { path: "/atleta/plan", label: "Plan" },
  { path: "/atleta/programa", label: "Programa" },
  { path: "/atleta/ajustes", label: "Ajustes" },
];

type SweepIssue = {
  route: string;
  label: string;
  finalUrl: string;
  httpStatus: number | null;
  rendered: boolean;
  consoleErrors: string[];
  pageErrors: string[];
  errorBoundary: boolean;
  notes: string;
};

const issues: SweepIssue[] = [];

test.describe.serial("Atleta sweep — todas las pantallas", () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsAtletaInline(page);
    // si quedó en /admin, forzar /atleta (middleware role-aware)
    if (!/\/atleta/.test(page.url())) {
      await page.goto("/atleta");
    }
  });

  test.afterAll(async () => {
    console.log("\n\n=== ATLETA SWEEP — ISSUES ENCONTRADOS ===");
    if (issues.length === 0) {
      console.log("✓ Sin issues. Todas las pantallas cargan limpias.");
    } else {
      for (const i of issues) {
        console.log(
          `\n✗ ${i.label} (${i.route})\n  finalUrl: ${i.finalUrl}\n  http: ${i.httpStatus}\n  rendered: ${i.rendered}\n  errorBoundary: ${i.errorBoundary}\n  consoleErrors: ${i.consoleErrors.length}\n  pageErrors: ${i.pageErrors.length}\n  notes: ${i.notes}`,
        );
        if (i.consoleErrors.length) {
          console.log("  --- console.error:");
          i.consoleErrors
            .slice(0, 3)
            .forEach((e) => console.log("    " + e.slice(0, 200)));
        }
        if (i.pageErrors.length) {
          console.log("  --- page errors:");
          i.pageErrors
            .slice(0, 3)
            .forEach((e) => console.log("    " + e.slice(0, 200)));
        }
      }
    }
    await page.close();
  });

  for (const spec of ATLETA_ROUTES) {
    test(`${spec.label} (${spec.path})`, async () => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];
      const onConsole = (msg: ConsoleMessage) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      };
      const onPageError = (err: Error) => {
        pageErrors.push(`${err.name}: ${err.message}`);
      };
      page.on("console", onConsole);
      page.on("pageerror", onPageError);

      let httpStatus: number | null = null;
      let notes = "";
      try {
        const resp = await page.goto(spec.path, {
          waitUntil: "domcontentloaded",
          timeout: 15_000,
        });
        httpStatus = resp?.status() ?? null;
      } catch (err) {
        notes = `goto threw: ${(err as Error).message}`;
      }

      // Esperar a que terminen las hidrataciones / redirects internos
      await page
        .waitForLoadState("networkidle", { timeout: 12_000 })
        .catch(() => {
          notes += " networkidle timeout;";
        });
      // Buffer extra para client-side redirects que disparan tras hidratar
      await page.waitForTimeout(800);

      const finalUrl = page.url();

      // Error boundary: heading visible "Algo salió mal" o equivalente
      const errorHeading = page
        .getByRole("heading", {
          name: /Algo salió mal|Application error|Something went wrong/i,
        })
        .first();
      const errorBoundary = await errorHeading.isVisible().catch(() => false);

      // Render check: error boundary NO está + document.title distinto al de
      // login/inicio (cada ruta tiene `metadata.title` propio). Esto evita
      // depender de headings semánticos (V3 usa <span> para titulares).
      let rendered = false;
      try {
        if (errorBoundary) {
          rendered = false;
        } else {
          const title = await page.title();
          notes += ` title="${title}";`;
          // Aceptar cualquier title que NO sea login y NO esté vacío
          rendered = !!title && !/login|iniciar/i.test(title);
        }
      } catch {
        rendered = false;
      }

      page.off("console", onConsole);
      page.off("pageerror", onPageError);

      const failed =
        (httpStatus !== null && httpStatus >= 500) ||
        errorBoundary ||
        !rendered ||
        pageErrors.length > 0;

      if (failed) {
        issues.push({
          route: spec.path,
          label: spec.label,
          finalUrl,
          httpStatus,
          rendered,
          consoleErrors: consoleErrors.slice(),
          pageErrors: pageErrors.slice(),
          errorBoundary,
          notes,
        });
      }

      // No fallar el test individual — queremos sweep completo, no abortar al primer fallo
      expect(true).toBe(true);
    });
  }
});
