/**
 * One contact address across the product surface (audit 2026-09-15).
 *
 * The surface handed out five: `hola@`, `contacto@`, `soporte@`, `demo@` and
 * `ventas@`. The last three were invention — there is no demo desk and no sales
 * team for a self-serve product, so a `mailto:` promising one is a dead end
 * dressed up as a channel.
 *
 * This is a source scan rather than a behaviour test because the failure mode
 * is a literal typed into a new component months from now.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";
import { SUPPORT_EMAIL, supportMailto } from "@/lib/contact";

const SRC = path.join(process.cwd(), "src");

/** The three addresses that must never appear again. */
const INVENTED_ADDRESSES = /(demo|ventas|contacto)@kronos-fit\.com/;

/**
 * Files outside this branch's ownership that still carry an invented address.
 * Each one is a hand-off, not a tolerance: the entry goes away with the fix.
 *
 * - `src/server/email-templates/founding-reservation.ts` belongs to whoever
 *   owns the email templates; it renders `contacto@` inside the reservation
 *   email's HTML.
 */
const PENDING_HANDOFF = new Set([
  path.join("src", "server", "email-templates", "founding-reservation.ts"),
]);

function collect(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collect(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const FILES = statSync(SRC).isDirectory() ? collect(SRC) : [];

describe("SUPPORT_EMAIL", () => {
  it("is the one address, and it matches the landing's CONTACT_EMAIL", () => {
    expect(SUPPORT_EMAIL).toBe("hola@kronos-fit.com");
  });

  it("builds a mailto with an encoded subject", () => {
    expect(supportMailto("Beta editor Hyrox")).toBe(
      "mailto:hola@kronos-fit.com?subject=Beta%20editor%20Hyrox",
    );
  });

  it("builds a bare mailto when there is no subject", () => {
    expect(supportMailto()).toBe("mailto:hola@kronos-fit.com");
  });
});

describe("no invented contact address in src/", () => {
  it("scans the whole source tree", () => {
    expect(FILES.length).toBeGreaterThan(300);
  });

  it("uses no demo@, ventas@ or contacto@ address", () => {
    const hits: string[] = [];
    for (const file of FILES) {
      const rel = path.relative(process.cwd(), file);
      if (PENDING_HANDOFF.has(rel)) continue;
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (INVENTED_ADDRESSES.test(line)) {
            hits.push(`${rel}:${i + 1} ${line.trim()}`);
          }
        });
    }
    expect(hits.join("\n")).toBe("");
  });

  it("keeps the hand-off list honest: every entry still has the problem", () => {
    // A stale exemption is how a scan quietly stops scanning.
    for (const rel of PENDING_HANDOFF) {
      const source = readFileSync(path.join(process.cwd(), rel), "utf8");
      expect(
        INVENTED_ADDRESSES.test(source),
        `${rel} is clean now — drop it from PENDING_HANDOFF`,
      ).toBe(true);
    }
  });
});
