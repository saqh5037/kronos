/**
 * Movement library regressions (audit 2026-09-15, `/atleta/movimientos` and
 * `/atleta/movimientos/[id]`).
 *
 * Targets:
 *  - "Thumbnails are chaos … fully blank cards. One thumbnail 404s in console."
 *  - "equipment 'Barbell / Plates'; muscles 'Quads, Glutes, Shoulders …'"
 *  - "Description leaks model text: '… Score: weight (kg). Tips RX: …'"
 */

import { describe, it, expect } from "vitest";
import {
  extractYouTubeId,
  getYouTubeThumbnail,
  isPlaceholderThumbnail,
  isValidYouTubeId,
  thumbnailUrlFor,
} from "@/lib/youtube";
import {
  cleanMovementDescription,
  equipmentLabel,
  equipmentLabels,
  muscleLabel,
  muscleLabels,
} from "@/app/atleta/movimientos/_lib/movement-i18n";

describe("youtube id validation", () => {
  it("accepts exactly 11 url-safe characters", () => {
    expect(isValidYouTubeId("dQw4w9WgXcQ")).toBe(true);
    expect(isValidYouTubeId("_-Aa09Zz123")).toBe(true);
  });

  it("rejects wrong lengths, empty values and illegal characters", () => {
    expect(isValidYouTubeId("")).toBe(false);
    expect(isValidYouTubeId(null)).toBe(false);
    expect(isValidYouTubeId(undefined)).toBe(false);
    expect(isValidYouTubeId("short")).toBe(false);
    expect(isValidYouTubeId("dQw4w9WgXcQextra")).toBe(false);
    expect(isValidYouTubeId("dQw4w9WgXc!")).toBe(false);
  });

  it("extracts ids from watch, short, embed and shorts URLs", () => {
    expect(
      extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toBe("dQw4w9WgXcQ");
    expect(extractYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
    expect(extractYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
    expect(extractYouTubeId("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("returns null for non-YouTube or malformed URLs", () => {
    expect(extractYouTubeId(null)).toBeNull();
    expect(extractYouTubeId("")).toBeNull();
    expect(extractYouTubeId("https://vimeo.com/12345")).toBeNull();
    expect(extractYouTubeId("https://youtu.be/abc")).toBeNull();
  });
});

describe("thumbnail fallback rule", () => {
  it("builds a URL only for a provable id", () => {
    expect(thumbnailUrlFor("https://youtu.be/dQw4w9WgXcQ")).toBe(
      getYouTubeThumbnail("dQw4w9WgXcQ"),
    );
  });

  it("returns null instead of a URL that would 404 in the console", () => {
    expect(thumbnailUrlFor(null)).toBeNull();
    expect(thumbnailUrlFor("https://youtu.be/broken")).toBeNull();
    expect(thumbnailUrlFor("/uploads/movement.png")).toBeNull();
  });

  it("classifies YouTube's 120x90 gray filler as a placeholder", () => {
    expect(isPlaceholderThumbnail(120)).toBe(true);
    expect(isPlaceholderThumbnail(0)).toBe(true);
    expect(isPlaceholderThumbnail(Number.NaN)).toBe(true);
  });

  it("accepts a real 480x360 hqdefault", () => {
    expect(isPlaceholderThumbnail(480)).toBe(false);
  });
});

describe("equipment / muscle mapper", () => {
  it("translates the seeded English equipment names", () => {
    expect(equipmentLabel("Barbell")).toBe("Barra");
    expect(equipmentLabel("Plates")).toBe("Discos");
    expect(equipmentLabel("Jump Rope")).toBe("Cuerda de saltar");
    expect(equipmentLabel("Pull-up bar")).toBe("Barra de dominadas");
  });

  it("translates the seeded English muscle names", () => {
    expect(muscleLabel("Quads")).toBe("Cuádriceps");
    expect(muscleLabel("Glutes")).toBe("Glúteos");
    expect(muscleLabel("Shoulders")).toBe("Hombros");
    expect(muscleLabel("Core")).toBe("Core");
    expect(muscleLabel("Triceps")).toBe("Tríceps");
  });

  it("is idempotent — already-Spanish values pass through", () => {
    expect(equipmentLabel("Barra")).toBe("Barra");
    expect(muscleLabel("Cuádriceps")).toBe("Cuádriceps");
    expect(muscleLabel(muscleLabel("Quads"))).toBe("Cuádriceps");
  });

  it("ignores case and accents when matching", () => {
    expect(equipmentLabel("  BARBELL ")).toBe("Barra");
    expect(muscleLabel("QUADS")).toBe("Cuádriceps");
  });

  it("leaves unknown values untouched instead of blanking the chip", () => {
    expect(equipmentLabel("Zercher harness")).toBe("Zercher harness");
    expect(muscleLabel("Serrato")).toBe("Serrato");
  });

  it("maps whole lists", () => {
    expect(equipmentLabels(["Barbell", "Plates"])).toEqual(["Barra", "Discos"]);
    expect(muscleLabels(["Quads", "Core"])).toEqual(["Cuádriceps", "Core"]);
  });
});

describe("cleanMovementDescription", () => {
  it("strips the model scaffolding the audit quoted", () => {
    const raw =
      "Front squat into overhead press in one fluid movement. Score: weight (kg). Tips RX: barra en rack frontal.";
    const cleaned = cleanMovementDescription(raw);
    expect(cleaned).not.toMatch(/Score:/);
    expect(cleaned).toMatch(/Claves RX:/);
  });

  it("returns null for empty or all-scaffolding text", () => {
    expect(cleanMovementDescription(null)).toBeNull();
    expect(cleanMovementDescription("   ")).toBeNull();
    expect(cleanMovementDescription("Score: weight (kg).")).toBeNull();
  });

  it("leaves clean Spanish copy untouched", () => {
    const raw = "Sentadilla frontal seguida de un press sobre la cabeza.";
    expect(cleanMovementDescription(raw)).toBe(raw);
  });
});
