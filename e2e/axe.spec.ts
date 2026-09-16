/**
 * Accessibility ratchet — axe-core over the 14 screens of the audit baseline.
 *
 * `docs/audit/2026-09-15-kronos-producto/axe-results.json` measured 325
 * violation nodes, 187 of them serious/critical and 186 of those colour
 * contrast, across 14 screens at three roles. Gate 0 of the rebuild asks for
 * fewer than 20 contrast nodes.
 *
 * This spec re-measures the SAME screens, at the same role and viewport, writes
 * the result next to the baseline, and then behaves as a RATCHET: it fails when
 * any screen's serious+critical or contrast count goes ABOVE the committed
 * `e2e/fixtures/axe-baseline.json`. Going down is always allowed — that is what
 * lets it be switched on with the debt still inside. Re-run and commit the
 * fixture (see `pnpm test:e2e:axe:update`) once a screen improves, and the new,
 * lower number is what the next regression is measured against.
 *
 * Requires: pnpm db:seed && pnpm db:seed:ops && pnpm db:seed:story, a dev server
 * with NEXT_PUBLIC_DEV_LOGIN=1.
 */
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loginAs, signOut, type Role } from "./fixtures/auth";
import { disconnect, ensureDemoAthleteOnboarded } from "./fixtures/db";

type ScreenRole = "anon" | "atleta" | "owner";

type Screen = {
  role: ScreenRole;
  route: string;
  width: number;
  height: number;
  mobile: boolean;
};

type ViolationSummary = {
  id: string;
  impact: string;
  help: string;
  nodes: number;
  sample: string[];
};

type ScreenResult = Screen & {
  violations: ViolationSummary[];
  passes: number;
  incomplete: number;
};

/**
 * The audit's 14 screens, with the exact role and viewport each was measured
 * at. Anonymous and athlete screens were audited on a 360 px phone, owner
 * screens on a 1280 px desktop — mixing them would make the numbers
 * incomparable to the baseline.
 */
const SCREENS: Screen[] = [
  { role: "anon", route: "/", width: 360, height: 780, mobile: true },
  { role: "anon", route: "/box", width: 1280, height: 800, mobile: false },
  { role: "anon", route: "/login", width: 360, height: 780, mobile: true },
  {
    role: "anon",
    route: "/atleta-signup",
    width: 360,
    height: 780,
    mobile: true,
  },
  { role: "atleta", route: "/atleta", width: 360, height: 780, mobile: true },
  {
    role: "atleta",
    route: "/atleta/wod",
    width: 360,
    height: 780,
    mobile: true,
  },
  {
    role: "atleta",
    route: "/atleta/reservar",
    width: 360,
    height: 780,
    mobile: true,
  },
  {
    role: "atleta",
    route: "/atleta/perfil",
    width: 360,
    height: 780,
    mobile: true,
  },
  {
    role: "atleta",
    route: "/atleta/skills",
    width: 360,
    height: 780,
    mobile: true,
  },
  { role: "owner", route: "/admin", width: 1280, height: 800, mobile: false },
  {
    role: "owner",
    route: "/admin/atletas",
    width: 1280,
    height: 800,
    mobile: false,
  },
  {
    role: "owner",
    route: "/admin/programacion",
    width: 1280,
    height: 800,
    mobile: false,
  },
  {
    role: "owner",
    route: "/admin/pagos",
    width: 1280,
    height: 800,
    mobile: false,
  },
  {
    role: "owner",
    route: "/admin/ajustes",
    width: 1280,
    height: 800,
    mobile: false,
  },
];

const ROOT = path.resolve(__dirname, "..");
const BASELINE_PATH = path.join(ROOT, "e2e", "fixtures", "axe-baseline.json");
const OUT_PATH = path.join(
  ROOT,
  "docs",
  "audit",
  "2026-09-15-kronos-producto",
  "axe-results-2026-09-16.json",
);

/** Per-screen ceilings. `null` fixture = first run, which writes it. */
type BaselineEntry = { seriousCritical: number; contrast: number };
type Baseline = Record<string, BaselineEntry>;

const keyOf = (s: Screen) => `${s.role} ${s.route} ${s.width}`;

function readBaseline(): Baseline | null {
  try {
    return JSON.parse(readFileSync(BASELINE_PATH, "utf8")) as Baseline;
  } catch {
    return null;
  }
}

function countsOf(r: ScreenResult): BaselineEntry {
  let seriousCritical = 0;
  let contrast = 0;
  for (const v of r.violations) {
    if (v.impact === "serious" || v.impact === "critical")
      seriousCritical += v.nodes;
    if (v.id === "color-contrast") contrast += v.nodes;
  }
  return { seriousCritical, contrast };
}

async function scan(page: Page, screen: Screen): Promise<ScreenResult> {
  await page.setViewportSize({ width: screen.width, height: screen.height });
  await page.goto(screen.route, { waitUntil: "load", timeout: 60_000 });
  // Role routing bounces the wrong role away silently. Without this, a broken
  // login records `/admin`'s numbers while actually measuring `/atleta`.
  expect(
    new URL(page.url()).pathname,
    `${screen.role} was redirected away from ${screen.route}`,
  ).toBe(screen.route);
  // Sections stream in behind Suspense; scanning before they land measures an
  // empty page and reports a flattering zero.
  await page
    .waitForLoadState("networkidle", { timeout: 30_000 })
    .catch(() => {});
  await page.waitForTimeout(700);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  return {
    ...screen,
    violations: results.violations.map((v) => ({
      id: v.id,
      impact: v.impact ?? "unknown",
      help: v.help,
      nodes: v.nodes.length,
      sample: v.nodes.slice(0, 2).map((n) => n.target.join(" ")),
    })),
    passes: results.passes.length,
    incomplete: results.incomplete.length,
  };
}

test.describe
  .serial("axe — accessibility ratchet over the audit's 14 screens", () => {
  // 14 screens, three logins, cold dev compiles.
  test.setTimeout(900_000);

  test.afterAll(async () => {
    await disconnect();
  });

  test("no screen regresses on serious/critical or contrast nodes", async ({
    page,
  }) => {
    await ensureDemoAthleteOnboarded();

    const results: ScreenResult[] = [];
    let loggedInAs: Role | null = null;

    for (const screen of SCREENS) {
      if (screen.role === "anon") {
        if (loggedInAs !== null) {
          await signOut(page);
          loggedInAs = null;
        }
      } else if (loggedInAs !== screen.role) {
        if (loggedInAs !== null) await signOut(page);
        await loginAs(page, screen.role);
        loggedInAs = screen.role;
      }
      results.push(await scan(page, screen));
    }

    mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    writeFileSync(OUT_PATH, JSON.stringify(results, null, 2) + "\n", "utf8");

    const totals = results.reduce(
      (acc, r) => {
        const c = countsOf(r);
        acc.nodes += r.violations.reduce((n, v) => n + v.nodes, 0);
        acc.seriousCritical += c.seriousCritical;
        acc.contrast += c.contrast;
        return acc;
      },
      { nodes: 0, seriousCritical: 0, contrast: 0 },
    );
    console.log(
      `\naxe totals — nodes ${totals.nodes} · serious+critical ${totals.seriousCritical} · contrast ${totals.contrast}` +
        `\n(audit baseline: 325 / 187 / 186 · Gate 0 target: contrast < 20)\n`,
    );
    for (const r of results) {
      const c = countsOf(r);
      console.log(
        `  ${r.role.padEnd(6)} ${r.route.padEnd(22)} serious+critical ${String(c.seriousCritical).padStart(3)} · contrast ${String(c.contrast).padStart(3)}`,
      );
    }

    const current: Baseline = Object.fromEntries(
      results.map((r) => [keyOf(r), countsOf(r)]),
    );
    const baseline = readBaseline();

    if (!baseline || process.env.AXE_UPDATE_BASELINE === "1") {
      writeFileSync(
        BASELINE_PATH,
        JSON.stringify(current, null, 2) + "\n",
        "utf8",
      );
      console.log(`Wrote ${path.relative(ROOT, BASELINE_PATH)}.`);
      if (!baseline) return; // first run establishes the ratchet
    }

    const regressions: string[] = [];
    for (const [key, now] of Object.entries(current)) {
      const was = baseline?.[key];
      if (!was) {
        regressions.push(`${key}: not in the baseline — re-generate it`);
        continue;
      }
      if (now.seriousCritical > was.seriousCritical) {
        regressions.push(
          `${key}: serious+critical ${was.seriousCritical} → ${now.seriousCritical}`,
        );
      }
      if (now.contrast > was.contrast) {
        regressions.push(
          `${key}: colour-contrast ${was.contrast} → ${now.contrast}`,
        );
      }
    }
    expect(regressions).toEqual([]);
  });
});
