import { z } from "zod";

export const announcementAudiences = [
  "ALL",
  "ACTIVE",
  "PAUSED",
  "COACHES",
] as const;
export type AnnouncementAudience = (typeof announcementAudiences)[number];

export const announcementChannels = ["EMAIL", "PUSH", "IN_APP"] as const;
export type AnnouncementChannel = (typeof announcementChannels)[number];

export const announcementSchema = z.object({
  title: z.string().min(1, "Título requerido").max(120),
  body: z.string().min(1, "Mensaje requerido").max(5000),
  audience: z.enum(announcementAudiences).default("ALL"),
  channel: z.enum(announcementChannels).default("IN_APP"),
  scheduledAt: z
    .union([z.string(), z.date()])
    .optional()
    .transform((v) => (v ? (v instanceof Date ? v : new Date(v)) : undefined))
    .refine(
      (d) => d === undefined || !Number.isNaN(d.getTime()),
      "Fecha inválida",
    ),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;
