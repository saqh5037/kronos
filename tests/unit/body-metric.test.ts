import { describe, it, expect } from "vitest";
import { bodyMetricSchema } from "../../src/lib/validations/body-metric";

describe("bodyMetricSchema", () => {
  it("accepts a minimal weight entry", () => {
    const out = bodyMetricSchema.parse({
      type: "WEIGHT",
      value: 75.4,
      unit: "kg",
    });
    expect(out.type).toBe("WEIGHT");
  });

  it("rejects negative or zero value", () => {
    expect(() =>
      bodyMetricSchema.parse({ type: "WEIGHT", value: -5, unit: "kg" }),
    ).toThrow();
    expect(() =>
      bodyMetricSchema.parse({ type: "WEIGHT", value: 0, unit: "kg" }),
    ).toThrow();
  });

  it("rejects absurd value (>=1000)", () => {
    expect(() =>
      bodyMetricSchema.parse({ type: "WEIGHT", value: 9999, unit: "kg" }),
    ).toThrow();
  });

  it("requires label when type is CUSTOM", () => {
    expect(() =>
      bodyMetricSchema.parse({ type: "CUSTOM", value: 50, unit: "cm" }),
    ).toThrow();
    const out = bodyMetricSchema.parse({
      type: "CUSTOM",
      label: "Cintura",
      value: 80,
      unit: "cm",
    });
    expect(out.label).toBe("Cintura");
  });

  it("coerces a string measuredAt into Date", () => {
    const out = bodyMetricSchema.parse({
      type: "BODY_FAT",
      value: 18,
      unit: "%",
      measuredAt: "2026-04-15T08:00:00.000Z",
    });
    expect(out.measuredAt).toBeInstanceOf(Date);
  });

  it("rejects invalid type", () => {
    expect(() =>
      bodyMetricSchema.parse({ type: "INVALID", value: 1, unit: "x" }),
    ).toThrow();
  });
});
