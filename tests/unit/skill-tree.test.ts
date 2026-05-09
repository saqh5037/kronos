import { describe, it, expect } from "vitest";
import {
  progressionToSlug,
  annotateProgressionTree,
  canAchieveNode,
  type AthleteLevel,
} from "@/lib/skill-tree";
import type { Progression } from "@/lib/validations/movement";

const PROGRESSIONS: Progression[] = [
  { name: "Ring rows", level: "beginner" },
  { name: "Banded pull-ups", level: "beginner" },
  { name: "Strict pull-up", level: "intermediate" },
  { name: "Chest-to-bar", level: "advanced" },
];

describe("progressionToSlug", () => {
  it("convierte a lowercase + guiones", () => {
    expect(progressionToSlug("Strict Pull-Up")).toBe("strict-pull-up");
    expect(progressionToSlug("Ring Rows")).toBe("ring-rows");
  });

  it("colapsa caracteres especiales", () => {
    expect(progressionToSlug("Goblet Squat (KB)")).toBe("goblet-squat-kb");
  });

  it("normaliza acentos", () => {
    expect(progressionToSlug("Mancuérnas Snátch")).toBe("mancuernas-snatch");
  });
});

describe("annotateProgressionTree", () => {
  it("primer nodo está current si atleta no tiene niveles", () => {
    const nodes = annotateProgressionTree(PROGRESSIONS, [], "pull-up");
    expect(nodes[0]?.status).toBe("current");
    expect(nodes[1]?.status).toBe("locked");
    expect(nodes[2]?.status).toBe("locked");
    expect(nodes[3]?.status).toBe("locked");
  });

  it("nodo achieved + siguiente es current automático", () => {
    const levels: AthleteLevel[] = [
      {
        movementSlug: "pull-up",
        progressionSlug: "ring-rows",
        status: "ACHIEVED",
        achievedAt: new Date(),
      },
    ];
    const nodes = annotateProgressionTree(PROGRESSIONS, levels, "pull-up");
    expect(nodes[0]?.status).toBe("achieved");
    expect(nodes[1]?.status).toBe("current");
    expect(nodes[2]?.status).toBe("locked");
    expect(nodes[3]?.status).toBe("locked");
  });

  it("CURRENT explícito de atleta gana sobre auto-current", () => {
    const levels: AthleteLevel[] = [
      {
        movementSlug: "pull-up",
        progressionSlug: "strict-pull-up",
        status: "CURRENT",
        achievedAt: null,
      },
    ];
    const nodes = annotateProgressionTree(PROGRESSIONS, levels, "pull-up");
    // Strict pull-up está current explícito (atleta marcó "estoy entrenando esto")
    expect(nodes[2]?.status).toBe("current");
    // Ring rows no está achieved → primer nodo sigue auto-current
    // pero como hay levels, el primer nodo NO arranca current
    expect(nodes[0]?.status).toBe("locked");
  });

  it("ignora niveles de otros movements", () => {
    const levels: AthleteLevel[] = [
      {
        movementSlug: "muscle-up",
        progressionSlug: "ring-rows",
        status: "ACHIEVED",
        achievedAt: new Date(),
      },
    ];
    const nodes = annotateProgressionTree(PROGRESSIONS, levels, "pull-up");
    expect(nodes[0]?.status).toBe("locked");
  });

  it("cadena completa achieved", () => {
    const levels: AthleteLevel[] = [
      {
        movementSlug: "pull-up",
        progressionSlug: "ring-rows",
        status: "ACHIEVED",
        achievedAt: new Date(),
      },
      {
        movementSlug: "pull-up",
        progressionSlug: "banded-pull-ups",
        status: "ACHIEVED",
        achievedAt: new Date(),
      },
      {
        movementSlug: "pull-up",
        progressionSlug: "strict-pull-up",
        status: "ACHIEVED",
        achievedAt: new Date(),
      },
    ];
    const nodes = annotateProgressionTree(PROGRESSIONS, levels, "pull-up");
    expect(nodes[0]?.status).toBe("achieved");
    expect(nodes[1]?.status).toBe("achieved");
    expect(nodes[2]?.status).toBe("achieved");
    expect(nodes[3]?.status).toBe("current"); // siguiente desbloqueado
  });
});

describe("canAchieveNode", () => {
  it("permite primer nodo siempre", () => {
    const r = canAchieveNode({
      progressions: PROGRESSIONS,
      movementSlug: "pull-up",
      targetSlug: "ring-rows",
      athleteLevels: [],
    });
    expect(r.ok).toBe(true);
  });

  it("bloquea segundo nodo si primero no achieved", () => {
    const r = canAchieveNode({
      progressions: PROGRESSIONS,
      movementSlug: "pull-up",
      targetSlug: "banded-pull-ups",
      athleteLevels: [],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("previous-not-achieved");
  });

  it("permite segundo nodo si primero achieved", () => {
    const r = canAchieveNode({
      progressions: PROGRESSIONS,
      movementSlug: "pull-up",
      targetSlug: "banded-pull-ups",
      athleteLevels: [
        {
          movementSlug: "pull-up",
          progressionSlug: "ring-rows",
          status: "ACHIEVED",
          achievedAt: new Date(),
        },
      ],
    });
    expect(r.ok).toBe(true);
  });

  it("retorna error si target no existe en el árbol", () => {
    const r = canAchieveNode({
      progressions: PROGRESSIONS,
      movementSlug: "pull-up",
      targetSlug: "ghost-progression",
      athleteLevels: [],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("progression-not-found");
  });

  it("CURRENT del nodo previo NO desbloquea (solo ACHIEVED)", () => {
    const r = canAchieveNode({
      progressions: PROGRESSIONS,
      movementSlug: "pull-up",
      targetSlug: "banded-pull-ups",
      athleteLevels: [
        {
          movementSlug: "pull-up",
          progressionSlug: "ring-rows",
          status: "CURRENT",
          achievedAt: null,
        },
      ],
    });
    expect(r.ok).toBe(false);
  });
});
