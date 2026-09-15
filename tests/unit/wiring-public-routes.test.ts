/**
 * The machine-readable mirrors of the public pages (audit 2026-09-15,
 * public-truth review).
 *
 * `/box.json` and `/box.md` advertised a demo desk, a sales inbox and a 30-day
 * trial against the 14 days the product grants. `/atletas.json` and
 * `/atletas.md` published three blank testimonials under an "ejemplos
 * ilustrativos" heading, because the invented quotes upstream had been emptied
 * out but the endpoints kept emitting the section.
 *
 * These endpoints are what an LLM or a crawler reads, so a lie here is a lie at
 * scale.
 */
import { describe, it, expect } from "vitest";
import { GET as boxJson } from "@/app/box.json/route";
import { GET as boxMd } from "@/app/box.md/route";
import { GET as atletasJson } from "@/app/atletas.json/route";
import { GET as atletasMd } from "@/app/atletas.md/route";
import {
  CTA_TRIAL_LABEL,
  CTA_WHATSAPP_LABEL,
  TRIAL_DAYS,
} from "@/app/(landing)/_data/cta";
import { SUPPORT_EMAIL } from "@/lib/contact";

async function boxPayload() {
  return (await boxJson().json()) as {
    cta: {
      primary: { label: string; href: string };
      secondary: { label: string; href: string };
      contact: string;
      trial: string;
      trialDays: number;
    };
  };
}

describe("/box.json", () => {
  it("offers the two canonical CTAs and nothing else", async () => {
    const { cta } = await boxPayload();
    expect(cta.primary.label).toBe(CTA_TRIAL_LABEL);
    expect(cta.primary.href).toBe("/signup");
    expect(cta.secondary.label).toBe(CTA_WHATSAPP_LABEL);
  });

  it("offers no demo booking and no sales call", async () => {
    const body = JSON.stringify(await boxPayload());
    expect(body).not.toContain("Reservar demo");
    expect(body).not.toContain("Hablar con ventas");
    expect(body).not.toContain("demo@kronos-fit.com");
    expect(body).not.toContain("ventas@kronos-fit.com");
  });

  it("quotes the one trial length", async () => {
    const { cta } = await boxPayload();
    expect(cta.trialDays).toBe(TRIAL_DAYS);
    expect(cta.trial).toContain(`${TRIAL_DAYS} días`);
    expect(cta.trial).not.toContain("30 días");
  });

  it("points at the one contact address", async () => {
    const { cta } = await boxPayload();
    expect(cta.contact).toBe(`mailto:${SUPPORT_EMAIL}`);
  });
});

describe("/box.md", () => {
  it("names the canonical CTAs and the real trial length", async () => {
    const body = await boxMd().text();
    expect(body).toContain(CTA_TRIAL_LABEL);
    expect(body).toContain(CTA_WHATSAPP_LABEL);
    expect(body).toContain(`${TRIAL_DAYS} días sin cargo`);
  });

  it("promises no demo and no sales inbox", async () => {
    const body = await boxMd().text();
    expect(body).not.toContain("Reservar demo");
    expect(body).not.toContain("Hablar con ventas");
    expect(body).not.toMatch(/(demo|ventas)@kronos-fit\.com/);
    // "30 días" still appears legitimately in the backup-retention FAQ answer;
    // what must not come back is the 30-day TRIAL claim.
    expect(body).not.toContain("30 días sin cargo");
  });

  it("gives every link an address a crawler can follow", async () => {
    const body = await boxMd().text();
    const links = body
      .split("\n")
      .filter((line) => line.startsWith("- ") && line.includes(": "))
      .map((line) => line.slice(line.indexOf(": ") + 2).trim());
    expect(links.length).toBeGreaterThan(0);
    for (const href of links) {
      expect(href).toMatch(/^(https?:\/\/|mailto:)/);
    }
  });
});

describe("/atletas.json", () => {
  it("publishes no testimonials key at all", async () => {
    const payload = (await atletasJson().json()) as Record<string, unknown>;
    expect("testimonials" in payload).toBe(false);
  });

  it("still publishes the sections that are real", async () => {
    const payload = (await atletasJson().json()) as {
      hero: { claim: string };
      benefits: unknown[];
      why: unknown;
      finalCta: unknown;
    };
    expect(payload.hero.claim.trim().length).toBeGreaterThan(0);
    expect(payload.benefits).toHaveLength(2);
    expect(payload.why).toBeDefined();
    expect(payload.finalCta).toBeDefined();
  });
});

describe("/atletas.md", () => {
  it("has no reviews section and no empty blockquote", async () => {
    const body = await atletasMd().text();
    expect(body).not.toContain("Reseñas");
    expect(body).not.toContain("ejemplos ilustrativos");
    // An empty quote is `> ""` — the shape the emptied stubs produced.
    expect(body).not.toContain('> ""');
  });

  it("still renders the real sections", async () => {
    const body = await atletasMd().text();
    expect(body).toContain("# Kronos · Atletas");
    expect(body).toContain("Entrar: https://www.kronos-fit.com/login");
  });
});
