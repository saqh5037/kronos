import { describe, it, expect } from "vitest";
import { readPrefs, withReplacedTag } from "@/lib/atleta-prefs";

describe("readPrefs", () => {
  it("devuelve null para tags vacíos", () => {
    expect(readPrefs([])).toEqual({ unit: null, level: null });
  });

  it("ignora tags que no son prefs (no-prefix match)", () => {
    expect(readPrefs(["foo", "bar:baz", "level"])).toEqual({
      unit: null,
      level: null,
    });
  });

  it("lee unit:kg", () => {
    expect(readPrefs(["unit:kg"])).toEqual({ unit: "kg", level: null });
  });

  it("lee unit:lb", () => {
    expect(readPrefs(["unit:lb"])).toEqual({ unit: "lb", level: null });
  });

  it("lee level:rx", () => {
    expect(readPrefs(["level:rx"])).toEqual({ unit: null, level: "rx" });
  });

  it("lee level:scaled", () => {
    expect(readPrefs(["level:scaled"])).toEqual({ unit: null, level: "scaled" });
  });

  it("lee level:beginner", () => {
    expect(readPrefs(["level:beginner"])).toEqual({
      unit: null,
      level: "beginner",
    });
  });

  it("lee unit + level juntos", () => {
    expect(readPrefs(["unit:kg", "level:rx", "other"])).toEqual({
      unit: "kg",
      level: "rx",
    });
  });

  it("se queda con el primer match si hay duplicados", () => {
    expect(readPrefs(["unit:kg", "unit:lb"])).toEqual({
      unit: "kg",
      level: null,
    });
  });
});

describe("withReplacedTag", () => {
  it("agrega tag con prefijo a array vacío", () => {
    expect(withReplacedTag([], "unit:", "kg")).toEqual(["unit:kg"]);
  });

  it("reemplaza tag existente con mismo prefijo", () => {
    expect(withReplacedTag(["unit:kg", "level:rx"], "unit:", "lb")).toEqual([
      "level:rx",
      "unit:lb",
    ]);
  });

  it("preserva otros tags al reemplazar", () => {
    expect(
      withReplacedTag(["foo", "unit:kg", "bar"], "unit:", "lb"),
    ).toEqual(["foo", "bar", "unit:lb"]);
  });

  it("elimina tag si value es null", () => {
    expect(withReplacedTag(["unit:kg", "level:rx"], "unit:", null)).toEqual([
      "level:rx",
    ]);
  });

  it("no agrega nada si value es null y tag no existía", () => {
    expect(withReplacedTag(["foo"], "unit:", null)).toEqual(["foo"]);
  });
});
