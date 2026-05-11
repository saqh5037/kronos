import { z } from "zod";

export const GOAL_METRICS = [
  "PR",
  "TONNAGE",
  "ATTENDANCE",
  "BODY_COMPOSITION",
] as const;

export type GoalMetricCode = (typeof GOAL_METRICS)[number];

export const BODY_COMPOSITION_UNITS = ["kg", "%"] as const;
export type BodyCompositionUnit = (typeof BODY_COMPOSITION_UNITS)[number];

export const goalSchema = z
  .object({
    metric: z.enum(GOAL_METRICS),
    movementId: z.string().min(1).optional().nullable(),
    targetValue: z.coerce.number().positive(),
    unit: z.string().min(1).max(10),
    startValue: z.coerce.number().nonnegative().optional().nullable(),
    deadline: z.coerce.date(),
  })
  .superRefine((d, ctx) => {
    if (d.metric === "PR" && !d.movementId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["movementId"],
        message: "movementId es requerido para metas de PR",
      });
    }
    if (d.metric === "BODY_COMPOSITION") {
      if (d.movementId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["movementId"],
          message: "Las metas de composición corporal no usan movementId",
        });
      }
      const allowed = BODY_COMPOSITION_UNITS as readonly string[];
      if (!allowed.includes(d.unit)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["unit"],
          message: "Unidad inválida para BODY_COMPOSITION (usa kg o %)",
        });
      }
    }
    if (d.deadline.getTime() <= Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deadline"],
        message: "La fecha límite debe ser futura",
      });
    }
  });

export type GoalInput = z.infer<typeof goalSchema>;
