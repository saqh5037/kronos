import { z } from "zod";

export const bodyMetricTypes = [
  "WEIGHT",
  "BODY_FAT",
  "MUSCLE_MASS",
  "BMI",
  "HEIGHT",
  "WAIST",
  "HIP",
  "ARM",
  "THIGH",
  "CHEST",
  "CUSTOM",
] as const;

export type BodyMetricType = (typeof bodyMetricTypes)[number];

export const BODY_METRIC_LABEL: Record<BodyMetricType, string> = {
  WEIGHT: "Peso",
  BODY_FAT: "% Grasa",
  MUSCLE_MASS: "% Músculo",
  BMI: "IMC",
  HEIGHT: "Altura",
  WAIST: "Cintura",
  HIP: "Cadera",
  ARM: "Brazo",
  THIGH: "Muslo",
  CHEST: "Pecho",
  CUSTOM: "Otra",
};

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
