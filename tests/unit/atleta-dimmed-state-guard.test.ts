import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Dimmed states must not dim their own copy (fase 0, batch 7).
 *
 * Three components said "this is secondary" by lowering `opacity` on a
 * container that had text inside it. CSS opacity composites the whole subtree
 * against the page, so the text tone gets mixed with the background and the
 * ratio collapses — `--k-t2` fell from 5.85:1 to 2.43:1 and `--k-t3` from
 * 4.91:1 to 2.15:1. axe counted 42 colour-contrast nodes across three screens
 * and every one of them came from that shortcut:
 *
 *   - `ClassesList` past class card   `opacity: 0.55`  → 21 nodes
 *   - `skills/page` locked cards/rows `opacity: 0.45–0.7` → 18 nodes
 *   - `TabBar` translucent bar        `rgba(8,8,10,0.92)` → 3 nodes
 *
 * House rule 4 of the design system ("colour = different thing, opacity =
 * intensity") is about the ACCENT. It never licensed a container opacity that
 * drags text under AA. The replacement dims the CHROME — surface, border,
 * accent, plus a word ("Terminada", "BLOQUEADO") and a lucide `Lock` — and
 * leaves every text tone at full strength.
 *
 * This guard is source-level on purpose: the axe ratchet in `e2e/axe.spec.ts`
 * measures the rendered result but needs a dev server, a seeded database and
 * three logins, so it does not run in `pnpm test`. This one does.
 */

const ROOT = process.cwd();

/**
 * Files whose containers hold text, so an `opacity` below the floor is a
 * contrast bug rather than a stylistic choice.
 */
const TEXT_CONTAINER_FILES = [
  "src/app/atleta/reservar/_components/ClassesList.tsx",
  "src/app/atleta/skills/page.tsx",
  "src/components/atleta/SkillTree.tsx",
  "src/components/kronos/TabBar.tsx",
] as const;

/**
 * Below this, a grey text token stops clearing 4.5:1 on `--k-bg`. 0.9 leaves
 * room for a hairline nudge without leaving room for a "dimmed card".
 */
const OPACITY_FLOOR = 0.9;

/** Comments discuss the old values by name; only real code should be scanned. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[\s{[(,;])\/\/[^\n]*/g, "$1");
}

/** Every numeric literal attached to an `opacity:` declaration. */
function opacityLiterals(source: string): number[] {
  const out: number[] = [];
  const re = /\bopacity\s*:\s*([^,\n}]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    for (const n of m[1].matchAll(/-?\d*\.?\d+/g)) {
      out.push(Number.parseFloat(n[0]));
    }
  }
  return out;
}

function read(relative: string): string {
  return stripComments(readFileSync(join(ROOT, relative), "utf8"));
}

describe("scanner self-check", () => {
  it("reads the literals out of both branches of a ternary", () => {
    expect(opacityLiterals("opacity: past ? 0.55 : 1,")).toEqual([0.55, 1]);
    expect(opacityLiterals("opacity: 0.45 }")).toEqual([0.45]);
  });

  it("ignores an opacity that only appears in a comment", () => {
    const src = read("src/app/atleta/reservar/_components/ClassesList.tsx");
    expect(src).not.toContain("opacity: 0.55");
  });

  it("does not mistake a URL for a line comment", () => {
    expect(stripComments(`"http://www.w3.org/2000/svg"`)).toContain(
      "www.w3.org",
    );
  });
});

describe("no container that holds text dims itself below the floor", () => {
  for (const file of TEXT_CONTAINER_FILES) {
    it(`${file} keeps every opacity >= ${OPACITY_FLOOR}`, () => {
      const found = opacityLiterals(read(file));
      const tooLow = found.filter((value) => value < OPACITY_FLOOR);
      expect(
        tooLow,
        `${file} dims a text container to ${tooLow.join(", ")} — dim the ` +
          `surface, the border and the accent instead, and say it in words`,
      ).toEqual([]);
    });
  }
});

describe("the bottom tab bar is opaque", () => {
  const source = read("src/components/kronos/TabBar.tsx");

  it("paints the bar with a solid token, not a translucent rgba()", () => {
    // An accent-filled card scrolling behind an 8 %-transparent bar tinted it
    // green and dropped the `--k-t3` labels to 4.26:1. A nav bar's contrast
    // cannot depend on what happens to be underneath it.
    expect(source).toContain('background: "var(--k-bg)"');
    const translucent = [...source.matchAll(/rgba\([^)]*?,\s*(0?\.\d+)\s*\)/g)]
      .map((m) => Number.parseFloat(m[1]))
      .filter((alpha) => alpha < 0.98);
    // The only rgba left is the notification dot's glow, which paints no text.
    expect(
      source.slice(0, source.indexOf("</div>")).match(/rgba\(8\s*,\s*8/),
      "the bar background is translucent again",
    ).toBeNull();
    expect(translucent.length, "unexpected translucent fills").toBeLessThan(2);
  });

  it("does not lean on a backdrop blur for legibility", () => {
    expect(source).not.toContain("backdropFilter");
  });
});

/* ── WCAG maths: why dimming the chrome is safe and dimming the box was not ── */

const GLOBALS_CSS = join(ROOT, "src/app/globals.css");

function tokenValue(token: string): string {
  const css = readFileSync(GLOBALS_CSS, "utf8");
  const matches = [
    ...css.matchAll(new RegExp(`--${token}\\s*:\\s*([^;]+);`, "g")),
  ]
    .map((m) => m[1].trim())
    .filter((v) => /^#[0-9a-fA-F]{3,6}$/.test(v));
  const unique = [...new Set(matches)];
  if (unique.length !== 1) {
    throw new Error(
      `--${token} has ${unique.length} hex values in globals.css`,
    );
  }
  return unique[0];
}

function parseHex(hex: string): [number, number, number] {
  const raw = hex.replace(/^#/, "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** WCAG 2.1 relative luminance. */
function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** What `opacity: alpha` on a container actually paints, per channel. */
function composite(hex: string, alpha: number, backdrop: string): string {
  const fg = parseHex(hex);
  const bg = parseHex(backdrop);
  return (
    "#" +
    fg
      .map((c, i) =>
        Math.round(c * alpha + bg[i] * (1 - alpha))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

describe("the tones the new dimmed states rely on clear AA", () => {
  /**
   * Every (text token, surface) pair the batch-7 treatments put on screen. A
   * ghost card paints no background of its own, so its text sits on whatever
   * the page is: `--k-bg`.
   */
  const PAIRS: [string, string, string][] = [
    ["k-t2", "k-bg", "past class card · hour, coach, count, 'Terminada' chip"],
    ["k-t3", "k-bg", "past class card · duration; ghost skill card · detail"],
    ["k-t2", "k-bg", "locked catalog card · skill name"],
    ["k-t3", "k-surface", "locked progression row inside a .k-card"],
    ["k-t3", "k-elevated", "available (unlocked) catalog card · status label"],
    ["k-t3", "k-bg", "tab bar labels over the now-opaque bar"],
  ];

  for (const [text, background, where] of PAIRS) {
    it(`--${text} on --${background} (${where}) is >= 4.5:1`, () => {
      const ratio = contrast(tokenValue(text), tokenValue(background));
      expect(
        ratio,
        `--${text} on --${background} = ${ratio.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(4.5);
    });
  }

  it("reproduces the failures this batch removed", () => {
    const bg = tokenValue("k-bg");
    // The past class card: `--k-surface` box at 55 % over the page.
    expect(
      contrast(
        composite(tokenValue("k-t2"), 0.55, bg),
        composite(tokenValue("k-surface"), 0.55, bg),
      ),
    ).toBeLessThan(3);
    // The locked catalog card: `--k-elevated` box at 55 %.
    expect(
      contrast(
        composite(tokenValue("k-t3"), 0.55, bg),
        composite(tokenValue("k-elevated"), 0.55, bg),
      ),
    ).toBeLessThan(3);
    // The locked progression row: 45 % inside a `.k-card`.
    expect(
      contrast(
        composite(tokenValue("k-t3"), 0.45, bg),
        composite(tokenValue("k-surface"), 0.45, bg),
      ),
    ).toBeLessThan(3);
  });

  it("shows the tab bar tint that the translucent background allowed", () => {
    // 8 % of the accent bleeding through lifted the bar's own luminance while
    // the label stayed put — 4.91:1 became 4.26:1, under AA.
    const tinted = composite(tokenValue("k-accent"), 0.08, tokenValue("k-bg"));
    const ratio = contrast(tokenValue("k-t3"), tinted);
    expect(ratio).toBeLessThan(4.5);
    expect(
      contrast(tokenValue("k-t3"), tokenValue("k-bg")),
    ).toBeGreaterThanOrEqual(4.5);
  });
});
