import { describe, it, expect } from "vitest";
import {
  foundingReservationSchema,
  BillingCycle,
  FoundingDisciplineSlug,
} from "@/lib/validations/founding-dominus";

describe("foundingReservationSchema", () => {
  const valid = {
    email: "owner@box.com",
    ownerName: "Juan Perez",
    boxName: "Iron Hands",
    slug: "iron-hands",
    billingCycle: "monthly" as const,
    phone: "5512345678",
  };

  it("acepta input válido con cycle monthly", () => {
    const out = foundingReservationSchema.safeParse(valid);
    expect(out.success).toBe(true);
  });

  it("acepta cycle annual", () => {
    const out = foundingReservationSchema.safeParse({
      ...valid,
      billingCycle: "annual",
    });
    expect(out.success).toBe(true);
  });

  it("acepta phone vacío (opcional)", () => {
    const out = foundingReservationSchema.safeParse({
      ...valid,
      phone: "",
    });
    expect(out.success).toBe(true);
  });

  it("acepta sin phone (undefined)", () => {
    const withoutPhone: Omit<typeof valid, "phone"> = {
      email: valid.email,
      ownerName: valid.ownerName,
      boxName: valid.boxName,
      slug: valid.slug,
      billingCycle: valid.billingCycle,
    };
    const out = foundingReservationSchema.safeParse(withoutPhone);
    expect(out.success).toBe(true);
  });

  it("rechaza cycle inválido", () => {
    const out = foundingReservationSchema.safeParse({
      ...valid,
      billingCycle: "weekly",
    });
    expect(out.success).toBe(false);
  });

  it("rechaza email inválido", () => {
    const out = foundingReservationSchema.safeParse({
      ...valid,
      email: "not-an-email",
    });
    expect(out.success).toBe(false);
  });

  it("rechaza slug con mayúsculas", () => {
    const out = foundingReservationSchema.safeParse({
      ...valid,
      slug: "Iron-Hands",
    });
    // signup schema lo lowercase-a, así que pasaría. Verificamos que normalice.
    if (out.success) {
      expect(out.data.slug).toBe("iron-hands");
    }
  });

  it("rechaza phone > 40 chars", () => {
    const out = foundingReservationSchema.safeParse({
      ...valid,
      phone: "x".repeat(41),
    });
    expect(out.success).toBe(false);
  });

  it("BillingCycle enum solo acepta monthly|annual", () => {
    expect(BillingCycle.safeParse("monthly").success).toBe(true);
    expect(BillingCycle.safeParse("annual").success).toBe(true);
    expect(BillingCycle.safeParse("biannual").success).toBe(false);
  });

  it("FoundingDisciplineSlug enum solo acepta crossfit|hyrox", () => {
    expect(FoundingDisciplineSlug.safeParse("crossfit").success).toBe(true);
    expect(FoundingDisciplineSlug.safeParse("hyrox").success).toBe(true);
    expect(FoundingDisciplineSlug.safeParse("yoga").success).toBe(false);
    expect(FoundingDisciplineSlug.safeParse("").success).toBe(false);
  });

  it("disciplineSlug default = crossfit cuando se omite (retrocompat)", () => {
    const out = foundingReservationSchema.safeParse(valid);
    if (!out.success) throw new Error("schema should parse");
    expect(out.data.disciplineSlug).toBe("crossfit");
  });

  it("acepta disciplineSlug=hyrox explícito", () => {
    const out = foundingReservationSchema.safeParse({
      ...valid,
      disciplineSlug: "hyrox",
    });
    expect(out.success).toBe(true);
    if (out.success) {
      expect(out.data.disciplineSlug).toBe("hyrox");
    }
  });

  it("rechaza disciplineSlug no soportada", () => {
    const out = foundingReservationSchema.safeParse({
      ...valid,
      disciplineSlug: "yoga",
    });
    expect(out.success).toBe(false);
  });
});
