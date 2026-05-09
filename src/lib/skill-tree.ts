/**
 * Helpers puros para skill progressions.
 *
 * Las progressions viven en Movement.progressions (Json) con shape
 * {name, level, description}. AthleteSkillLevel referencia cada nodo por
 * `progressionSlug` derivado del name.
 *
 * Trade-off conocido: si admin renombra una progression, el slug cambia y
 * AthleteSkillLevel.progressionSlug queda huérfano (esa fila ya no matchea
 * ninguna progression). Aceptable para MVP — el PRD lo lista como riesgo.
 */

import type { Progression } from "@/lib/validations/movement";

export type ProgressionNodeStatus = "locked" | "current" | "achieved";

export type ProgressionNode = Progression & {
  slug: string;
  status: ProgressionNodeStatus;
  index: number;
};

export type AthleteLevel = {
  movementSlug: string;
  progressionSlug: string;
  status: "CURRENT" | "ACHIEVED";
  achievedAt: Date | null;
};

/**
 * Convierte un nombre de progression a slug. Lowercase, alphanumeric y
 * guiones. Si dos progressions tienen el mismo name, los slugs colisionan
 * — decisión: el seed/admin deben evitar duplicados (validable en
 * curación).
 */
export function progressionToSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Pure: dado el array de progressions de un Movement y los niveles del
 * atleta, retorna nodos con status calculado.
 *
 * Reglas:
 * - El nodo con AthleteSkillLevel.status=ACHIEVED → "achieved"
 * - El nodo con AthleteSkillLevel.status=CURRENT → "current"
 * - Si no tiene fila en AthleteSkillLevel:
 *   - Es "current" si el nodo previo está achieved (siguiente desbloqueable)
 *   - Es "locked" en otro caso
 *
 * Excepción: el primer nodo (index 0) siempre está disponible si no hay
 * ninguno marcado.
 */
export function annotateProgressionTree(
  progressions: Progression[],
  athleteLevels: AthleteLevel[],
  movementSlug: string,
): ProgressionNode[] {
  const levelByProgressionSlug = new Map<string, AthleteLevel>();
  for (const lvl of athleteLevels) {
    if (lvl.movementSlug === movementSlug) {
      levelByProgressionSlug.set(lvl.progressionSlug, lvl);
    }
  }

  const nodes = progressions.map((p, idx) => {
    const slug = progressionToSlug(p.name);
    return { ...p, slug, index: idx };
  });

  return nodes.map((node, idx) => {
    const lvl = levelByProgressionSlug.get(node.slug);
    let status: ProgressionNodeStatus;

    if (lvl?.status === "ACHIEVED") {
      status = "achieved";
    } else if (lvl?.status === "CURRENT") {
      status = "current";
    } else {
      // No row → ¿está desbloqueable?
      const prevNode = idx > 0 ? nodes[idx - 1] : null;
      const prevLvl = prevNode
        ? levelByProgressionSlug.get(prevNode.slug)
        : null;
      const prevAchieved = prevLvl?.status === "ACHIEVED";
      const isFirstAndNoneAchieved = idx === 0 && athleteLevels.length === 0;

      if (prevAchieved || isFirstAndNoneAchieved) {
        status = "current";
      } else {
        status = "locked";
      }
    }

    return { ...node, status };
  });
}

/**
 * Valida si un nodo puede marcarse como ACHIEVED. Reglas:
 * - El nodo previo (index-1) debe estar ACHIEVED, O
 * - Es el primer nodo (index 0) y el atleta no tiene nada todavía
 *
 * Esto previene saltarse niveles (ej: marcar muscle-up sin haber dominado
 * strict pull-up).
 */
export function canAchieveNode(args: {
  progressions: Progression[];
  movementSlug: string;
  targetSlug: string;
  athleteLevels: AthleteLevel[];
}): { ok: true } | { ok: false; reason: string } {
  const { progressions, movementSlug, targetSlug, athleteLevels } = args;

  const targetIdx = progressions.findIndex(
    (p) => progressionToSlug(p.name) === targetSlug,
  );
  if (targetIdx === -1) {
    return { ok: false, reason: "progression-not-found" };
  }

  if (targetIdx === 0) return { ok: true };

  const prevSlug = progressionToSlug(progressions[targetIdx - 1]!.name);
  const prevLvl = athleteLevels.find(
    (l) => l.movementSlug === movementSlug && l.progressionSlug === prevSlug,
  );

  if (prevLvl?.status === "ACHIEVED") return { ok: true };

  return { ok: false, reason: "previous-not-achieved" };
}
