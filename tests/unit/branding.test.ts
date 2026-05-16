/**
 * branding/index.ts — config por disciplina para landing pública.
 *
 * Validamos:
 *  - Fallback a crossfit cuando el slug es inválido/null/undefined.
 *  - hyrox slug resuelve a HYROX_BRANDING.
 *  - Cada branding tiene los campos requeridos sin strings vacíos.
 *  - isSupportedDiscipline filtra correctamente.
 */

import { describe, it, expect } from "vitest";
import {
  getDisciplineBranding,
  isSupportedDiscipline,
  BRANDING_BY_SLUG,
  DEFAULT_DISCIPLINE_BRANDING,
  type DisciplineBranding,
} from "@/lib/branding";

const REQUIRED_KEYS: Array<keyof DisciplineBranding> = [
  "slug",
  "name",
  "metaTitle",
  "metaDescription",
  "heroTitleLine1",
  "heroTitleLine2",
  "heroSubtitle",
  "heroEyebrow",
  "productTagline",
  "faqExtras",
];

describe("getDisciplineBranding", () => {
  it("retorna CROSSFIT cuando el slug es 'crossfit'", () => {
    const b = getDisciplineBranding("crossfit");
    expect(b.slug).toBe("crossfit");
    expect(b.name).toBe("CrossFit");
  });

  it("retorna HYROX cuando el slug es 'hyrox'", () => {
    const b = getDisciplineBranding("hyrox");
    expect(b.slug).toBe("hyrox");
    expect(b.name).toBe("Hyrox");
    expect(b.heroTitleLine2).toMatch(/Hyrox/);
  });

  it("retorna CROSSFIT (fallback) cuando el slug es null", () => {
    expect(getDisciplineBranding(null).slug).toBe("crossfit");
  });

  it("retorna CROSSFIT (fallback) cuando el slug es undefined", () => {
    expect(getDisciplineBranding(undefined).slug).toBe("crossfit");
  });

  it("retorna CROSSFIT (fallback) cuando el slug es un valor desconocido", () => {
    expect(getDisciplineBranding("yoga").slug).toBe("crossfit");
    expect(getDisciplineBranding("").slug).toBe("crossfit");
  });
});

describe("isSupportedDiscipline", () => {
  it("acepta crossfit y hyrox", () => {
    expect(isSupportedDiscipline("crossfit")).toBe(true);
    expect(isSupportedDiscipline("hyrox")).toBe(true);
  });

  it("rechaza disciplinas no soportadas todavía", () => {
    expect(isSupportedDiscipline("yoga")).toBe(false);
    expect(isSupportedDiscipline("pilates")).toBe(false);
    expect(isSupportedDiscipline(null)).toBe(false);
    expect(isSupportedDiscipline(undefined)).toBe(false);
    expect(isSupportedDiscipline("")).toBe(false);
  });
});

describe("BRANDING_BY_SLUG completeness", () => {
  it.each(["crossfit", "hyrox"] as const)(
    "%s tiene todos los campos requeridos sin strings vacíos",
    (slug) => {
      const b = BRANDING_BY_SLUG[slug];
      expect(b).toBeDefined();
      for (const key of REQUIRED_KEYS) {
        expect(b[key]).toBeDefined();
      }
      // Strings no vacíos
      expect(b.name.trim()).not.toBe("");
      expect(b.metaTitle.trim()).not.toBe("");
      expect(b.metaDescription.trim()).not.toBe("");
      expect(b.heroTitleLine1.trim()).not.toBe("");
      expect(b.heroTitleLine2.trim()).not.toBe("");
      expect(b.heroSubtitle.trim()).not.toBe("");
      expect(b.productTagline.trim()).not.toBe("");
      expect(Array.isArray(b.faqExtras)).toBe(true);
    },
  );

  it("HYROX incluye al menos 1 FAQ extra Hyrox-specific", () => {
    expect(BRANDING_BY_SLUG.hyrox.faqExtras.length).toBeGreaterThan(0);
  });

  it("CROSSFIT no necesita faqExtras (audiencia primaria, FAQ base ya está optimizado)", () => {
    expect(BRANDING_BY_SLUG.crossfit.faqExtras).toEqual([]);
  });
});

describe("DEFAULT_DISCIPLINE_BRANDING", () => {
  it("apunta a crossfit (default seguro para landing pública)", () => {
    expect(DEFAULT_DISCIPLINE_BRANDING.slug).toBe("crossfit");
  });
});
