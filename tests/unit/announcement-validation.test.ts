import { describe, it, expect } from "vitest";
import { announcementSchema } from "../../src/lib/validations/announcement";

describe("announcementSchema", () => {
  it("parses minimal announcement with defaults", () => {
    const a = announcementSchema.parse({
      title: "Cierre por feriado",
      body: "Cerramos el lunes",
    });
    expect(a.audience).toBe("ALL");
    expect(a.channel).toBe("IN_APP");
    expect(a.scheduledAt).toBeUndefined();
  });

  it("rejects empty title", () => {
    expect(() => announcementSchema.parse({ title: "", body: "x" })).toThrow();
  });

  it("rejects empty body", () => {
    expect(() => announcementSchema.parse({ title: "x", body: "" })).toThrow();
  });

  it("rejects unknown audience", () => {
    expect(() =>
      announcementSchema.parse({
        title: "x",
        body: "y",
        audience: "INVALID",
      }),
    ).toThrow();
  });

  it("accepts scheduledAt as ISO string", () => {
    const a = announcementSchema.parse({
      title: "x",
      body: "y",
      scheduledAt: "2026-12-01T10:00:00Z",
    });
    expect(a.scheduledAt).toBeInstanceOf(Date);
  });

  it("rejects invalid scheduledAt", () => {
    expect(() =>
      announcementSchema.parse({
        title: "x",
        body: "y",
        scheduledAt: "not-a-date",
      }),
    ).toThrow();
  });

  it("rejects body over 5000 chars", () => {
    expect(() =>
      announcementSchema.parse({
        title: "x",
        body: "a".repeat(5001),
      }),
    ).toThrow();
  });
});
