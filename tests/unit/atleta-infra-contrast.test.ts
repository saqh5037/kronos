import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Contrast floor for the V3 text tokens (technical-audit.md §B).
 *
 * `--k-t3` shipped as `#54545c`, which is 2.67:1 on `--k-bg` — it failed AA
 * (4.5:1) and even the large-text 3:1 floor, in 534 usages across 190 files.
 * This test parses the real token values out of `globals.css` and implements
 * the WCAG 2.1 relative-luminance formula so the token can never regress
 * below AA again.
 *
 * ── Why three backgrounds and not just `--k-bg` (fase 0, batch 4) ───────────
 * The first fix raised `--k-t3` to `#7a7a84`, which clears AA on `--k-bg`
 * (4.71:1) and nowhere else: `--k-surface` is 4.48:1 and `--k-elevated` is
 * 4.32:1. Almost every one of the ~600 `--k-t3` labels sits inside a `.k-card`,
 * i.e. on a surface, so the token was still failing AA where it is actually
 * used. The matrix below pins every text token against every background the
 * design system paints behind text.
 */

const GLOBALS_CSS = join(process.cwd(), "src/app/globals.css");

function readGlobalsCss(): string {
  return readFileSync(GLOBALS_CSS, "utf8");
}

/** Every declaration of a custom property, in source order. */
function readTokenDeclarations(css: string, token: string): string[] {
  const re = new RegExp(`--${token}\\s*:\\s*([^;]+);`, "g");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) out.push(m[1].trim());
  return out;
}

function parseHex(hex: string): [number, number, number] {
  const raw = hex.trim().replace(/^#/, "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`Not a hex color: ${hex}`);
  }
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** WCAG 2.1 relative luminance. */
function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.1 contrast ratio, always >= 1. */
function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("WCAG ratio helper (self-check)", () => {
  it("returns 21:1 for black on white and 1:1 for identical colors", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#08080a", "#08080a")).toBeCloseTo(1, 5);
  });

  it("reproduces the audited failure of the old --k-t3 value", () => {
    expect(contrastRatio("#54545c", "#08080a")).toBeLessThan(3);
  });
});

/**
 * The backgrounds the design system paints behind body text. `--k-line` and
 * `--k-line-2` are borders, not text beds, so they are deliberately absent.
 */
const TEXT_BACKGROUND_TOKENS = ["k-bg", "k-surface", "k-elevated"] as const;

/** Every token used for text. `--k-t4` is a disabled/hairline tone, not copy. */
const TEXT_TOKENS = ["k-t1", "k-t2", "k-t3"] as const;

describe("globals.css text tokens clear AA on every surface they sit on", () => {
  const css = readGlobalsCss();

  it("declares every text token and every background token", () => {
    for (const token of [...TEXT_TOKENS, ...TEXT_BACKGROUND_TOKENS]) {
      expect(
        readTokenDeclarations(css, token).length,
        `--${token} is not declared in globals.css`,
      ).toBeGreaterThan(0);
    }
  });

  it("declares each text token with a single canonical value", () => {
    for (const token of TEXT_TOKENS) {
      const decls = readTokenDeclarations(css, token);
      expect(new Set(decls).size, `--${token} has ${decls.length} values`).toBe(
        1,
      );
    }
  });

  for (const token of TEXT_TOKENS) {
    for (const background of TEXT_BACKGROUND_TOKENS) {
      it(`--${token} on --${background} is >= 4.5:1`, () => {
        const texts = readTokenDeclarations(css, token);
        const backgrounds = readTokenDeclarations(css, background);
        for (const text of texts) {
          for (const bg of backgrounds) {
            const ratio = contrastRatio(text, bg);
            expect(
              ratio,
              `--${token} ${text} on --${background} ${bg} = ${ratio.toFixed(2)}:1`,
            ).toBeGreaterThanOrEqual(4.5);
          }
        }
      });
    }
  }

  it("reproduces the two values this matrix was written to reject", () => {
    // #54545c failed even on the darkest background; #7a7a84 passed there and
    // failed on the one that matters (.k-card sits on --k-elevated).
    expect(contrastRatio("#54545c", "#08080a")).toBeLessThan(4.5);
    expect(contrastRatio("#7a7a84", "#14141a")).toBeLessThan(4.5);
  });
});

describe("globals.css focus-visible floor for form controls", () => {
  const css = readGlobalsCss();

  it("gives inputs, selects, textareas and ARIA widgets a visible focus ring", () => {
    // The V3 block only covered a/button/.k-btn-*/.k-chip (audit §B).
    const required = [
      "input:focus-visible",
      "select:focus-visible",
      "textarea:focus-visible",
      '[role="checkbox"]:focus-visible',
      '[role="switch"]:focus-visible',
      '[role="tab"]:focus-visible',
    ];
    for (const selector of required) {
      expect(css, `missing ${selector}`).toContain(selector);
    }
  });

  it("uses the accent token for the focus outline", () => {
    const block = css.slice(css.indexOf("input:focus-visible"));
    const decl = block.slice(0, block.indexOf("}"));
    expect(decl).toMatch(/outline:\s*2px solid var\(--k-accent\)/);
  });
});
