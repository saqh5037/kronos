import { z } from "zod";

const VIDEO_URL_REGEX =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/|vimeo\.com\/)[\w\-./?=&]+$/i;

export const isAllowedVideoUrl = (url: string): boolean =>
  VIDEO_URL_REGEX.test(url);

export const cuesSchema = z
  .object({
    setup: z.array(z.string().min(1).max(140)).max(10).optional(),
    dos: z.array(z.string().min(1).max(140)).max(10).optional(),
    donts: z.array(z.string().min(1).max(140)).max(10).optional(),
  })
  .strict();

export const commonMistakeSchema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().max(280).optional(),
  fixCue: z.string().max(140).optional(),
});

export const progressionSchema = z.object({
  name: z.string().min(1).max(60),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  description: z.string().max(280).optional(),
});

export const cuesArraySchema = z.array(commonMistakeSchema).max(8).optional();
export const progressionsArraySchema = z
  .array(progressionSchema)
  .max(6)
  .optional();
export const musclesSchema = z
  .array(z.string().min(1).max(40))
  .max(8)
  .optional();
export const difficultySchema = z.number().int().min(1).max(5).optional();

export type Cues = z.infer<typeof cuesSchema>;
export type CommonMistake = z.infer<typeof commonMistakeSchema>;
export type Progression = z.infer<typeof progressionSchema>;

const optionalUrl = z
  .string()
  .optional()
  .nullable()
  .or(z.literal(""))
  .transform((v) => (v === "" || v == null ? null : v))
  .refine((v) => v == null || isAllowedVideoUrl(v), {
    message: "Solo URLs de YouTube o Vimeo",
  });

export const movementSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(80),
  videoUrl: optionalUrl,
  videoUrlCues: optionalUrl,
  standardDescription: z
    .string()
    .max(1000)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  equipment: z.array(z.string().max(40)).default([]),
  cues: cuesSchema.optional().nullable(),
  commonMistakes: cuesArraySchema.nullable(),
  progressions: progressionsArraySchema.nullable(),
  musclesWorked: musclesSchema.default([]),
  difficulty: difficultySchema.nullable(),
});

export type MovementInput = z.infer<typeof movementSchema>;
