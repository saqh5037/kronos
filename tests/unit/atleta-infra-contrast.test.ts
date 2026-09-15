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

describe("globals.css text tokens on --k-bg", () => {
  const css = readGlobalsCss();
  const bgDecls = readTokenDeclarations(css, "k-bg");
  const t3Decls = readTokenDeclarations(css, "k-t3");

  it("declares --k-bg and --k-t3", () => {
    expect(bgDecls.length).toBeGreaterThan(0);
    expect(t3Decls.length).toBeGreaterThan(0);
  });

  it("declares --k-t3 with a single canonical value in every block", () => {
    expect(new Set(t3Decls).size).toBe(1);
  });

  it("keeps --k-t3 on --k-bg at AA (>= 4.5:1) in every declared block", () => {
    for (const bg of bgDecls) {
      for (const t3 of t3Decls) {
        const ratio = contrastRatio(t3, bg);
        expect(
          ratio,
          `--k-t3 ${t3} on --k-bg ${bg} = ${ratio.toFixed(2)}:1`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("keeps --k-t2 on --k-bg at AA as well (no regression)", () => {
    const t2Decls = readTokenDeclarations(css, "k-t2");
    for (const bg of bgDecls) {
      for (const t2 of t2Decls) {
        expect(contrastRatio(t2, bg)).toBeGreaterThanOrEqual(4.5);
      }
    }
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
