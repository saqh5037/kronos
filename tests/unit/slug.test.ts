import { describe, it, expect } from "vitest";
import { slugify, isValidSlug } from "@/lib/slug";

describe("slugify", () => {
  it("baja a minúsculas", () => {
    expect(slugify("Iron Hands")).toBe("iron-hands");
  });

  it("reemplaza espacios por guiones", () => {
    expect(slugify("Cross Fit Polanco")).toBe("cross-fit-polanco");
  });

  it("quita acentos", () => {
    expect(slugify("Atlético México")).toBe("atletico-mexico");
    expect(slugify("Águila ñoño")).toBe("aguila-nono");
  });

  it("colapsa múltiples espacios/guiones a uno", () => {
    expect(slugify("Iron   Hands  -  Polanco")).toBe("iron-hands-polanco");
  });

  it("recorta guiones leading/trailing", () => {
    expect(slugify("  Iron Hands  ")).toBe("iron-hands");
    expect(slugify("---hi---")).toBe("hi");
  });

  it("descarta caracteres no alfanuméricos", () => {
    expect(slugify("CrossFit @ Polanco!")).toBe("crossfit-polanco");
    expect(slugify("Box #1")).toBe("box-1");
  });

  it("strings vacíos y solo símbolos → string vacío", () => {
    expect(slugify("")).toBe("");
    expect(slugify("@@@")).toBe("");
    expect(slugify("   ")).toBe("");
  });
});

describe("isValidSlug", () => {
  it("acepta slugs válidos", () => {
    expect(isValidSlug("iron-hands")).toBe(true);
    expect(isValidSlug("box1")).toBe(true);
    expect(isValidSlug("a")).toBe(true);
    expect(isValidSlug("abc-123-xyz")).toBe(true);
  });

  it("rechaza slugs vacíos", () => {
    expect(isValidSlug("")).toBe(false);
  });

  it("rechaza mayúsculas", () => {
    expect(isValidSlug("Iron-Hands")).toBe(false);
  });

  it("rechaza espacios o caracteres especiales", () => {
    expect(isValidSlug("iron hands")).toBe(false);
    expect(isValidSlug("iron_hands")).toBe(false);
    expect(isValidSlug("iron@hands")).toBe(false);
  });

  it("rechaza dashes leading/trailing", () => {
    expect(isValidSlug("-iron")).toBe(false);
    expect(isValidSlug("iron-")).toBe(false);
  });

  it("rechaza dashes consecutivos", () => {
    expect(isValidSlug("iron--hands")).toBe(false);
  });

  it("rechaza demasiado largos (>40)", () => {
    expect(isValidSlug("a".repeat(40))).toBe(true);
    expect(isValidSlug("a".repeat(41))).toBe(false);
  });

  it("rechaza demasiado cortos (<2)", () => {
    expect(isValidSlug("a")).toBe(true);
    expect(isValidSlug("")).toBe(false);
  });
});
