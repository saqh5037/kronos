import { describe, it, expect } from "vitest";
import { parseAIResponse } from "@/server/ai/movement-content";

const VALID = {
  cues: {
    setup: ["Pies a ancho de cadera", "Barra sobre el medio del pie"],
    dos: ["Espalda neutra", "Empujar el piso", "Codos arriba en el rack"],
    donts: ["Encorvar la espalda", "Despegar los talones"],
  },
  commonMistakes: [
    {
      title: "Espalda redondeada",
      description: "Pierde tensión en la cadena posterior",
      fixCue: "Pecho arriba",
    },
  ],
  progressions: [
    {
      name: "Goblet squat",
      level: "beginner",
      description: "Para aprender el patrón antes de cargar",
    },
    {
      name: "Back squat",
      level: "intermediate",
      description: "Carga estándar con barra",
    },
  ],
  musclesWorked: ["cuádriceps", "glúteos", "core"],
  difficulty: 3,
  videoUrl: "https://www.youtube.com/embed/abc123XYZ",
};

describe("parseAIResponse", () => {
  it("parsea JSON válido sin code fences", () => {
    const out = parseAIResponse(JSON.stringify(VALID));
    expect(out.cues?.dos).toHaveLength(3);
    expect(out.commonMistakes).toHaveLength(1);
    expect(out.progressions).toHaveLength(2);
    expect(out.musclesWorked).toEqual(["cuádriceps", "glúteos", "core"]);
    expect(out.difficulty).toBe(3);
    expect(out.videoUrl).toBe("https://www.youtube.com/embed/abc123XYZ");
  });

  it("strippea ```json fences si Gemini los devuelve", () => {
    const wrapped = "```json\n" + JSON.stringify(VALID) + "\n```";
    const out = parseAIResponse(wrapped);
    expect(out.cues?.setup).toHaveLength(2);
  });

  it("strippea fences sin lenguaje", () => {
    const wrapped = "```\n" + JSON.stringify(VALID) + "\n```";
    const out = parseAIResponse(wrapped);
    expect(out.difficulty).toBe(3);
  });

  it("nullifica videoUrl si no es YouTube/Vimeo", () => {
    const bad = { ...VALID, videoUrl: "https://malicious.com/video" };
    const out = parseAIResponse(JSON.stringify(bad));
    expect(out.videoUrl).toBeNull();
  });

  it("acepta videoUrl null", () => {
    const noVideo = { ...VALID, videoUrl: null };
    const out = parseAIResponse(JSON.stringify(noVideo));
    expect(out.videoUrl).toBeNull();
  });

  it("acepta videoUrl Vimeo", () => {
    const vimeo = { ...VALID, videoUrl: "https://vimeo.com/123456" };
    const out = parseAIResponse(JSON.stringify(vimeo));
    expect(out.videoUrl).toBe("https://vimeo.com/123456");
  });

  it("rechaza JSON inválido", () => {
    expect(() => parseAIResponse("no es json")).toThrow(/no es JSON válido/);
  });

  it("rechaza shape inválido (sin cues)", () => {
    const bad = { ...VALID } as Partial<typeof VALID>;
    delete bad.cues;
    expect(() => parseAIResponse(JSON.stringify(bad))).toThrow(
      /no pasó validación/,
    );
  });

  it("rechaza difficulty fuera de rango", () => {
    const bad = { ...VALID, difficulty: 7 };
    expect(() => parseAIResponse(JSON.stringify(bad))).toThrow(
      /no pasó validación/,
    );
  });

  it("rechaza progression con level inválido", () => {
    const bad = {
      ...VALID,
      progressions: [
        { name: "Test", level: "expert", description: "Bad level" },
      ],
    };
    expect(() => parseAIResponse(JSON.stringify(bad))).toThrow(
      /no pasó validación/,
    );
  });

  it("rechaza más de 8 musclesWorked", () => {
    const bad = {
      ...VALID,
      musclesWorked: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9"],
    };
    expect(() => parseAIResponse(JSON.stringify(bad))).toThrow(
      /no pasó validación/,
    );
  });
});
