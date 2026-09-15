import { describe, it, expect } from "vitest";
import {
  formatPhoneMX,
  normalizePhoneMX,
  phoneHrefMX,
} from "@/app/admin/_lib/phone";

describe("normalizePhoneMX", () => {
  it("keeps 10 national digits", () => {
    expect(normalizePhoneMX("5553165435")).toBe("5553165435");
  });

  it("strips punctuation and spaces", () => {
    expect(normalizePhoneMX("(55) 5316-5435")).toBe("5553165435");
  });

  it("strips the +52 / 52 / 0052 country code", () => {
    expect(normalizePhoneMX("+52 55 5316 5435")).toBe("5553165435");
    expect(normalizePhoneMX("525553165435")).toBe("5553165435");
    expect(normalizePhoneMX("00525553165435")).toBe("5553165435");
  });

  it("strips the legacy 521 mobile prefix", () => {
    expect(normalizePhoneMX("5215553165435")).toBe("5553165435");
  });
});

describe("formatPhoneMX", () => {
  it("formats the audit's example as 55 5316 5435", () => {
    expect(formatPhoneMX("5553165435")).toBe("55 5316 5435");
  });

  it("uses 2-4-4 for two-digit area codes", () => {
    expect(formatPhoneMX("3312345678")).toBe("33 1234 5678");
    expect(formatPhoneMX("8112345678")).toBe("81 1234 5678");
  });

  it("uses 3-3-4 for three-digit area codes", () => {
    expect(formatPhoneMX("4771234567")).toBe("477 123 4567");
  });

  it("formats an international-looking input the same way", () => {
    expect(formatPhoneMX("+52 555 316 5435")).toBe("55 5316 5435");
  });

  it("renders an em dash for empty values", () => {
    expect(formatPhoneMX(null)).toBe("—");
    expect(formatPhoneMX("")).toBe("—");
    expect(formatPhoneMX("   ")).toBe("—");
  });

  it("honours a custom fallback", () => {
    expect(formatPhoneMX(undefined, "Sin teléfono")).toBe("Sin teléfono");
  });

  it("never mangles a number it does not understand", () => {
    expect(formatPhoneMX("12345")).toBe("12345");
    expect(formatPhoneMX("+1 415 555 2671")).toBe("+1 415 555 2671");
  });
});

describe("phoneHrefMX", () => {
  it("builds a +52 tel: link for national numbers", () => {
    expect(phoneHrefMX("55 5316 5435")).toBe("tel:+525553165435");
  });

  it("is null when there is no usable number", () => {
    expect(phoneHrefMX("12345")).toBeNull();
    expect(phoneHrefMX(null)).toBeNull();
  });
});
