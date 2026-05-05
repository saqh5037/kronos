import { z } from "zod";

export const goalSchema = z
  .object({
    metric: z.enum(["PR", "TONNAGE", "ATTENDANCE"]),
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
    if (d.deadline.getTime() <= Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deadline"],
        message: "La fecha límite debe ser futura",
      });
    }
  });

export type GoalInput = z.infer<typeof goalSchema>;
