import { describe, it, expect } from "vitest";
import {
  isAllowedVideoUrl,
  cuesSchema,
  commonMistakeSchema,
  progressionSchema,
  movementSchema,
} from "@/lib/validations/movement";

describe("isAllowedVideoUrl", () => {
  it("accepts youtube.com/watch", () => {
    expect(isAllowedVideoUrl("https://www.youtube.com/watch?v=abc123")).toBe(
      true,
    );
  });
  it("accepts youtu.be short URL", () => {
    expect(isAllowedVideoUrl("https://youtu.be/abc123")).toBe(true);
  });
  it("accepts youtube.com/embed", () => {
    expect(isAllowedVideoUrl("https://www.youtube.com/embed/abc123")).toBe(
      true,
    );
  });
  it("accepts youtube.com/shorts", () => {
    expect(isAllowedVideoUrl("https://www.youtube.com/shorts/abc123")).toBe(
      true,
    );
  });
  it("accepts vimeo.com", () => {
    expect(isAllowedVideoUrl("https://vimeo.com/123456789")).toBe(true);
  });
  it("rejects arbitrary URLs", () => {
    expect(isAllowedVideoUrl("https://malicious.example/video")).toBe(false);
    expect(isAllowedVideoUrl("not a url")).toBe(false);
    expect(isAllowedVideoUrl("https://google.com/search")).toBe(false);
  });
});

describe("cuesSchema", () => {
  it("accepts a full cues object", () => {
    const r = cuesSchema.parse({
      setup: ["Pies a la altura de hombros"],
      dos: ["Codos altos en el front rack"],
      donts: ["Despegar talones del piso"],
    });
    expect(r.dos).toHaveLength(1);
  });
  it("rejects entries over 140 chars", () => {
    expect(() => cuesSchema.parse({ dos: ["x".repeat(200)] })).toThrow();
  });
  it("rejects more than 10 entries", () => {
    expect(() =>
      cuesSchema.parse({
        dos: Array(11).fill("ok"),
      }),
    ).toThrow();
  });
});

describe("commonMistakeSchema", () => {
  it("requires title", () => {
    expect(() => commonMistakeSchema.parse({ description: "x" })).toThrow();
  });
  it("accepts optional description and fixCue", () => {
    const r = commonMistakeSchema.parse({
      title: "Espalda redondeada",
      description: "Pierdes columna neutra",
      fixCue: "Activa core antes",
    });
    expect(r.title).toBe("Espalda redondeada");
  });
});

describe("progressionSchema", () => {
  it("accepts beginner / intermediate / advanced", () => {
    const r = progressionSchema.parse({
      name: "Goblet squat",
      level: "beginner",
    });
    expect(r.level).toBe("beginner");
  });
  it("rejects invalid level", () => {
    expect(() =>
      progressionSchema.parse({ name: "x", level: "expert" }),
    ).toThrow();
  });
});

describe("movementSchema · video URL filtering", () => {
  it("accepts movement with valid YouTube URL", () => {
    const r = movementSchema.parse({
      name: "Thruster",
      videoUrl: "https://www.youtube.com/watch?v=abc",
      equipment: [],
    });
    expect(r.videoUrl).toBe("https://www.youtube.com/watch?v=abc");
  });
  it("rejects non-YouTube/Vimeo URL", () => {
    expect(() =>
      movementSchema.parse({
        name: "Thruster",
        videoUrl: "https://example.com/vid.mp4",
        equipment: [],
      }),
    ).toThrow();
  });
  it("treats empty string as null videoUrl", () => {
    const r = movementSchema.parse({
      name: "Thruster",
      videoUrl: "",
      equipment: [],
    });
    expect(r.videoUrl).toBeNull();
  });
});

describe("movementSchema · cues + mistakes + progressions", () => {
  it("accepts a full movement with all enrichment", () => {
    const r = movementSchema.parse({
      name: "Thruster",
      equipment: ["barbell"],
      cues: { dos: ["Codos altos"], donts: ["Espalda redondeada"] },
      commonMistakes: [{ title: "Pies estrechos", fixCue: "Aumenta apertura" }],
      progressions: [
        { name: "Goblet squat", level: "beginner" },
        { name: "Front squat con KB", level: "intermediate" },
      ],
      musclesWorked: ["quads", "glutes", "shoulders"],
      difficulty: 3,
    });
    expect(r.cues?.dos?.[0]).toBe("Codos altos");
    expect(r.commonMistakes?.[0]?.title).toBe("Pies estrechos");
    expect(r.progressions).toHaveLength(2);
    expect(r.difficulty).toBe(3);
  });
});
