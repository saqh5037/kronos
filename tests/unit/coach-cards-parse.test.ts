import { describe, it, expect } from "vitest";
import { parseCoachCardResponse } from "@/server/ai/coach-cards-prompt";

const VALID = {
  cards: [
    {
      type: "CELEBRATION",
      title: "PR nuevo en deadlift",
      body: "Subiste 12% en 2 semanas. Buena progresión, mantené ese plan.",
      ctaLabel: "Ver progresión",
      ctaHref: "/atleta/movimientos/deadlift",
      priority: 10,
      meta: { movementSlug: "deadlift" },
    },
    {
      type: "STAGNATION",
      title: "Tu back squat está estancado",
      body: "30 días sin moverse. Probá cambiar a tempo 3-1-X-1 por 2 semanas.",
      ctaLabel: null,
      ctaHref: null,
      priority: 50,
      meta: null,
    },
  ],
};

describe("parseCoachCardResponse", () => {
  it("parsea respuesta válida con varias cards", () => {
    const out = parseCoachCardResponse(JSON.stringify(VALID));
    expect(out).toHaveLength(2);
    expect(out[0]?.type).toBe("CELEBRATION");
    expect(out[0]?.ctaHref).toBe("/atleta/movimientos/deadlift");
    expect(out[1]?.type).toBe("STAGNATION");
    expect(out[1]?.ctaLabel).toBeUndefined();
  });

  it("acepta cards vacío", () => {
    const out = parseCoachCardResponse(JSON.stringify({ cards: [] }));
    expect(out).toHaveLength(0);
  });

  it("strippea markdown fences", () => {
    const wrapped = "```json\n" + JSON.stringify(VALID) + "\n```";
    const out = parseCoachCardResponse(wrapped);
    expect(out).toHaveLength(2);
  });

  it("rechaza JSON inválido", () => {
    expect(() => parseCoachCardResponse("not json")).toThrow(
      /coach-cards JSON inválido/,
    );
  });

  it("rechaza type inválido", () => {
    const bad = {
      cards: [
        {
          ...VALID.cards[0],
          type: "MOTIVATION",
        },
      ],
    };
    expect(() => parseCoachCardResponse(JSON.stringify(bad))).toThrow(
      /coach-cards shape inválido/,
    );
  });

  it("rechaza más de 3 cards", () => {
    const bad = {
      cards: [VALID.cards[0], VALID.cards[0], VALID.cards[0], VALID.cards[0]],
    };
    expect(() => parseCoachCardResponse(JSON.stringify(bad))).toThrow(
      /coach-cards shape inválido/,
    );
  });

  it("rechaza body demasiado largo (>280 chars)", () => {
    const bad = {
      cards: [
        {
          ...VALID.cards[0],
          body: "x".repeat(300),
        },
      ],
    };
    expect(() => parseCoachCardResponse(JSON.stringify(bad))).toThrow(
      /coach-cards shape inválido/,
    );
  });

  it("priority fuera de rango falla", () => {
    const bad = {
      cards: [
        {
          ...VALID.cards[0],
          priority: 500,
        },
      ],
    };
    expect(() => parseCoachCardResponse(JSON.stringify(bad))).toThrow(
      /coach-cards shape inválido/,
    );
  });
});
