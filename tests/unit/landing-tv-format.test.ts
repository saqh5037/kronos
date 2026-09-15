/**
 * Formateo de la cuenta regresiva de la pantalla del Box.
 *
 * La TV mostraba "EN 257MIN" (audit 2026-09-15). Nadie lee 257 minutos como
 * cuatro horas y cuarto, y menos de reojo desde el otro lado del gimnasio.
 */
import { describe, expect, it } from "vitest";
import {
  formatDurationMinutes,
  formatMinutesUntil,
} from "@/app/tv/_lib/format-countdown";
import { divisionLabel } from "@/app/eventos/[token]/_lib/division-label";

describe("formatMinutesUntil", () => {
  it("deja los minutos como minutos abajo de una hora", () => {
    expect(formatMinutesUntil(1)).toBe("en 1 min");
    expect(formatMinutesUntil(12)).toBe("en 12 min");
    expect(formatMinutesUntil(59)).toBe("en 59 min");
  });

  it("convierte a horas y minutos a partir de la hora", () => {
    expect(formatMinutesUntil(60)).toBe("en 1 h");
    expect(formatMinutesUntil(90)).toBe("en 1 h 30 min");
    // El caso exacto del audit.
    expect(formatMinutesUntil(257)).toBe("en 4 h 17 min");
    expect(formatMinutesUntil(120)).toBe("en 2 h");
  });

  it("redondea al minuto más cercano", () => {
    expect(formatMinutesUntil(59.4)).toBe("en 59 min");
    expect(formatMinutesUntil(59.6)).toBe("en 1 h");
  });

  it("dice ahora cuando la clase ya arrancó o el dato no sirve", () => {
    expect(formatMinutesUntil(0)).toBe("ahora");
    expect(formatMinutesUntil(-5)).toBe("ahora");
    expect(formatMinutesUntil(Number.NaN)).toBe("ahora");
    expect(formatMinutesUntil(Number.POSITIVE_INFINITY)).toBe("ahora");
  });
});

describe("formatDurationMinutes", () => {
  it("no lleva prefijo, es una duración y no una espera", () => {
    expect(formatDurationMinutes(45)).toBe("45 min");
    expect(formatDurationMinutes(60)).toBe("1 h");
    expect(formatDurationMinutes(90)).toBe("1 h 30 min");
  });

  it("aguanta valores vacíos sin romper la pantalla", () => {
    expect(formatDurationMinutes(0)).toBe("0 min");
    expect(formatDurationMinutes(-1)).toBe("0 min");
    expect(formatDurationMinutes(Number.NaN)).toBe("0 min");
  });
});

describe("divisionLabel", () => {
  it("traduce las divisiones que llegan en inglés desde la base", () => {
    expect(divisionLabel("Partitioned")).toBe("En equipo (reps divididas)");
    expect(divisionLabel("Scaled")).toBe("Escalado");
    expect(divisionLabel("Partner")).toBe("En pareja");
  });

  it("no toca las que ya se dicen igual", () => {
    expect(divisionLabel("RX")).toBe("RX");
  });

  it("deja pasar una división que nadie previó, en vez de vaciarla", () => {
    expect(divisionLabel("Máster 45+")).toBe("Máster 45+");
  });

  it("ignora mayúsculas y espacios de más", () => {
    expect(divisionLabel("  scaled ")).toBe("Escalado");
  });
});
