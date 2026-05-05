import { z } from "zod";

export const bodyMetricTypes = [
  "WEIGHT",
  "BODY_FAT",
  "MUSCLE_MASS",
  "BMI",
  "CUSTOM",
] as const;

export type BodyMetricType = (typeof bodyMetricTypes)[number];

export const bodyMetricSchema = z
  .object({
    type: z.enum(bodyMetricTypes),
    label: z.string().max(40).optional().nullable(),
    value: z.coerce.number().positive().lt(1000),
    unit: z.string().min(1).max(10),
    measuredAt: z.coerce.date().optional(),
    notes: z.string().max(500).optional().nullable(),
  })
  .superRefine((d, ctx) => {
    if (d.type === "CUSTOM" && !d.label) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["label"],
        message: "Especifica el nombre de la métrica",
      });
    }
  });

export type BodyMetricInput = z.infer<typeof bodyMetricSchema>;
