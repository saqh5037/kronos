import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @google/generative-ai antes de importar el módulo (evita instanciar API).
vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn(),
}));

// Mock env: NO seteamos GEMINI_API_KEY para validar el path de error.
beforeEach(() => {
  vi.unstubAllEnvs();
});

const { analyzePhotoWod } = await import("@/server/ocr/photo-wod");

describe("analyzePhotoWod", () => {
  it("falla con mensaje claro si no hay GEMINI_API_KEY", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    await expect(
      analyzePhotoWod({ buffer: Buffer.from(""), mimeType: "image/jpeg" }),
    ).rejects.toThrow(/GEMINI_API_KEY/);
  });
});

// Tests para normalización del JSON parsed son via re-import dinámico para
// que no necesitemos exportar normalizeResult — lo testeamos indirectamente
// con un mock del SDK que devuelve JSON predecible.

describe("analyzePhotoWod (con mock de Gemini)", () => {
  beforeEach(async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
  });

  async function setupMockResponse(jsonText: string) {
    const mod = await import("@google/generative-ai");
    const generateContent = vi.fn().mockResolvedValue({
      response: { text: () => jsonText },
    });
    (
      mod.GoogleGenerativeAI as unknown as ReturnType<typeof vi.fn>
    ).mockReturnValue({
      getGenerativeModel: () => ({ generateContent }),
    });
  }

  it("normaliza un response válido completo", async () => {
    await setupMockResponse(
      JSON.stringify({
        wodName: "Fran",
        wodType: "FORTIME",
        scoreType: "TIME",
        timeCapSeconds: 600,
        score: { value: "5:43", scaling: "RX" },
        notes: "se sintió bien",
      }),
    );
    const out = await analyzePhotoWod({
      buffer: Buffer.from("fake"),
      mimeType: "image/jpeg",
    });
    expect(out.wodName).toBe("Fran");
    expect(out.wodType).toBe("FORTIME");
    expect(out.scoreType).toBe("TIME");
    expect(out.timeCapSeconds).toBe(600);
    expect(out.score.value).toBe("5:43");
    expect(out.score.scaling).toBe("RX");
  });

  it("limpia wrapper ```json ... ``` si Gemini lo agrega", async () => {
    await setupMockResponse(
      "```json\n" +
        JSON.stringify({
          wodName: "Murph",
          wodType: "FORTIME",
          scoreType: "TIME",
          score: { value: null, scaling: null },
        }) +
        "\n```",
    );
    const out = await analyzePhotoWod({
      buffer: Buffer.from("fake"),
      mimeType: "image/jpeg",
    });
    expect(out.wodName).toBe("Murph");
  });

  it("retorna nulls para campos missing/inválidos en vez de crashear", async () => {
    await setupMockResponse(
      JSON.stringify({
        wodName: null,
        wodType: "INVENTED_TYPE",
        scoreType: "WEIRD",
        score: {},
      }),
    );
    const out = await analyzePhotoWod({
      buffer: Buffer.from("fake"),
      mimeType: "image/jpeg",
    });
    expect(out.wodName).toBeNull();
    expect(out.wodType).toBeNull(); // INVENTED_TYPE no está en el enum
    expect(out.scoreType).toBeNull();
    expect(out.score.value).toBeNull();
    expect(out.score.scaling).toBeNull();
  });

  it("rechaza JSON inválido con mensaje claro", async () => {
    await setupMockResponse("esto no es JSON");
    await expect(
      analyzePhotoWod({ buffer: Buffer.from("x"), mimeType: "image/jpeg" }),
    ).rejects.toThrow(/JSON inválido/);
  });

  it("acepta scoreType ROUNDS_REPS y wodType AMRAP", async () => {
    await setupMockResponse(
      JSON.stringify({
        wodName: "AMRAP 12",
        wodType: "AMRAP",
        scoreType: "ROUNDS_REPS",
        timeCapSeconds: 720,
        score: { value: "5+12", scaling: "SCALED" },
      }),
    );
    const out = await analyzePhotoWod({
      buffer: Buffer.from("x"),
      mimeType: "image/jpeg",
    });
    expect(out.wodType).toBe("AMRAP");
    expect(out.scoreType).toBe("ROUNDS_REPS");
    expect(out.score.value).toBe("5+12");
    expect(out.score.scaling).toBe("SCALED");
  });
});
