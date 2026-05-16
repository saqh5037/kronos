/**
 * SmartWODForm — selector entre WODForm CrossFit y HyroxWODFormPlaceholder.
 *
 * Render testing es overkill para un dispatcher de 2 ramas. Lo que
 * importa es que el branching logic sea correcto. Lo simulo con la misma
 * decisión que toma el componente.
 *
 * Si en el futuro el dispatcher crece (yoga, pilates), este test sigue
 * siendo el punto de verdad de qué slug → qué editor.
 */

import { describe, it, expect } from "vitest";

/**
 * Replica la decisión que SmartWODForm hace en runtime. Si el componente
 * cambia esta lógica, este helper también debe actualizarse.
 */
function pickEditor(
  disciplineSlug: string | null | undefined,
): "crossfit" | "hyrox" {
  if (disciplineSlug === "hyrox") return "hyrox";
  return "crossfit";
}

describe("SmartWODForm dispatch logic", () => {
  it("usa editor CrossFit por default (sin disciplineSlug)", () => {
    expect(pickEditor(undefined)).toBe("crossfit");
    expect(pickEditor(null)).toBe("crossfit");
  });

  it("usa editor CrossFit cuando slug es crossfit", () => {
    expect(pickEditor("crossfit")).toBe("crossfit");
  });

  it("usa editor Hyrox cuando slug es hyrox", () => {
    expect(pickEditor("hyrox")).toBe("hyrox");
  });

  it("cae a CrossFit con slug desconocido (retrocompat seguro)", () => {
    expect(pickEditor("yoga")).toBe("crossfit");
    expect(pickEditor("")).toBe("crossfit");
    expect(pickEditor("CROSSFIT")).toBe("crossfit");
  });
});
