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

/**
 * The four addresses that must never appear again.
 *
 * `soporte@` joined the list once `AdminErrorState` stopped handing it out: it
 * reads like the obvious support desk, which is exactly why it kept getting
 * typed into new screens, and no mailbox has ever answered there.
 */
const INVENTED_ADDRESSES = /(demo|ventas|contacto|soporte)@kronos-fit\.com/;

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

  it("uses no demo@, ventas@, contacto@ or soporte@ address", () => {
    const hits: string[] = [];
    for (const file of FILES) {
      const rel = path.relative(process.cwd(), file);
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

  it("has no exemption list left to go stale", () => {
    // The scan used to carry a PENDING_HANDOFF set for the founding-reservation
    // email template. It is fixed, so the exemption is gone: an allow-list is
    // how a scan quietly stops scanning, and the only safe size for it is zero.
    const selfSource = readFileSync(
      path.join(process.cwd(), "tests", "unit", "wiring-support-email.test.ts"),
      "utf8",
    );
    expect(selfSource).not.toMatch(/PENDING_HANDOFF\s*=/);
  });
});
