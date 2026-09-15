/**
 * Copy guard for the admin management surface (audit 2026-09-15, S3/S7).
 *
 * The five screens in this tree shipped raw English enums, Rioplatense voseo,
 * emoji used as icons and internal notes meant for developers. Reviews catch
 * those once; this catches them every time.
 *
 * Scope: /admin/pagos, /admin/comunicaciones, /admin/reportes, /admin/eventos,
 * /admin/auditoria, /admin/billing, /admin/onboarding, /admin/ajustes,
 * /admin/super and src/lib/audit-humanize.ts.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";

const ROOT = process.cwd();

const SCAN_DIRS = [
  "src/app/admin/pagos",
  "src/app/admin/comunicaciones",
  "src/app/admin/reportes",
  "src/app/admin/eventos",
  "src/app/admin/auditoria",
  "src/app/admin/billing",
  "src/app/admin/onboarding",
  "src/app/admin/ajustes",
  "src/app/admin/super",
].map((p) => path.join(ROOT, p));

const SCAN_FILES = [path.join(ROOT, "src/lib/audit-humanize.ts")];

function collectFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectFiles(full));
    else if (full.endsWith(".ts") || full.endsWith(".tsx")) out.push(full);
  }
  return out;
}

function tree(): { file: string; rel: string; source: string }[] {
  const files = [
    ...SCAN_DIRS.filter((d) => {
      try {
        return statSync(d).isDirectory();
      } catch {
        return false;
      }
    }).flatMap(collectFiles),
    ...SCAN_FILES,
  ];
  return files.map((file) => ({
    file,
    rel: path.relative(ROOT, file),
    source: readFileSync(file, "utf-8"),
  }));
}

/**
 * Text that renders between tags: `>Texto<`.
 *
 * Anything carrying code punctuation is a TypeScript expression that happened
 * to sit between a `>` and a `<` (`=>`, a generic, a call), not prose.
 */
function jsxTextNodes(source: string): string[] {
  const out: string[] = [];
  const re = />([^<>{}]+)</g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const raw = m[1];
    if (/[=;()[\]`"'*\\|&]/.test(raw)) continue;
    const text = raw.replace(/\s+/g, " ").trim();
    if (!text) continue;
    if (!/\p{L}/u.test(text)) continue;
    out.push(text);
  }
  return out;
}

function violations(
  check: (entry: { rel: string; source: string }) => string[],
): string[] {
  return tree().flatMap((entry) =>
    check(entry).map((hit) => `${entry.rel}  →  ${hit}`),
  );
}

describe("admin management copy guard", () => {
  it("scans a non-empty tree", () => {
    const files = tree();
    expect(files.length).toBeGreaterThan(20);
    expect(files.some((f) => f.rel.includes("pagos"))).toBe(true);
    expect(files.some((f) => f.rel.includes("audit-humanize"))).toBe(true);
  });

  it("renders no raw enum token as UI text", () => {
    const ENUMS =
      /(PAID|FAILED|PENDING|ACTIVE|UNLIMITED|MONTHLY|ANNUAL|DROPIN|IN_APP|ALL|DRAFT|SCHEDULED|SENT|STRIPE)/;
    const hits = violations(({ source }) =>
      jsxTextNodes(source).filter((text) => ENUMS.test(text)),
    );
    expect(
      hits,
      `Raw enum in UI text — use src/lib/labels.ts:\n${hits.join("\n")}`,
    ).toEqual([]);
  });

  it("uses Mexican-neutral Spanish, never voseo", () => {
    const VOSEO =
      /(?<!\p{L})(recibís|tenés|podés|querés|sabés|acá|ajustá|mirá|fijate|acordate|dale|vos|cargás?|guardás?|revisás?|elegís?|entrás?)(?!\p{L})/giu;
    const hits = violations(({ source }) => {
      const found = source.match(VOSEO);
      return found ? Array.from(new Set(found)) : [];
    });
    expect(
      hits,
      `Voseo found (use MX-neutral Spanish):\n${hits.join("\n")}`,
    ).toEqual([]);
  });

  it("uses lucide icons, never emoji", () => {
    const EMOJI =
      /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/u;
    const hits = violations(({ source }) =>
      source
        .split("\n")
        .filter((line) => EMOJI.test(line))
        .map((line) => line.trim()),
    );
    expect(hits, `Emoji found — use lucide-react:\n${hits.join("\n")}`).toEqual(
      [],
    );
  });

  it("uses no unicode arrow as an affordance in UI text", () => {
    const ARROWS = /[\u{2190}-\u{21FF}]/u;
    const hits = violations(({ source }) =>
      jsxTextNodes(source).filter((text) => ARROWS.test(text)),
    );
    expect(
      hits,
      `Unicode arrow in UI text — use a lucide icon:\n${hits.join("\n")}`,
    ).toEqual([]);
  });

  it("never names an environment variable to the box owner", () => {
    const hits = violations(({ source }) =>
      source.includes("MERCADOPAGO_ACCESS_TOKEN")
        ? ["MERCADOPAGO_ACCESS_TOKEN"]
        : [],
    );
    expect(
      hits,
      `Dev configuration leaked into a product screen:\n${hits.join("\n")}`,
    ).toEqual([]);
  });

  it("ships no internal build note", () => {
    const NOTES = /(mockeado|mock provider|proveedor mockeado|\(F2\)|TODO:)/i;
    const hits = violations(({ source }) =>
      jsxTextNodes(source).filter((text) => NOTES.test(text)),
    );
    expect(
      hits,
      `Internal note shown to the owner:\n${hits.join("\n")}`,
    ).toEqual([]);
  });

  it("never says 'tenant' to a human", () => {
    const TENANT = /(?<!\p{L})tenants?(?!\p{L})/iu;
    const hits = violations(({ source }) =>
      jsxTextNodes(source).filter((text) => TENANT.test(text)),
    );
    expect(
      hits,
      `"tenant" is our word, not theirs:\n${hits.join("\n")}`,
    ).toEqual([]);
  });

  it("never says 'wizard', 'submit' or 'feature flags' to a human", () => {
    const JARGON =
      /(?<!\p{L})(wizard|submit|feature flags?|revenue|bookings)(?!\p{L})/iu;
    const hits = violations(({ source }) =>
      jsxTextNodes(source).filter((text) => JARGON.test(text)),
    );
    expect(hits, `English jargon in UI text:\n${hits.join("\n")}`).toEqual([]);
  });
});
