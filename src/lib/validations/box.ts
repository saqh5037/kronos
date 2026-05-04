import { z } from "zod";

export const SUPPORTED_LOCALES = [
  "es-MX",
  "es-AR",
  "es-ES",
  "es-CO",
  "en-US",
  "pt-BR",
] as const;

export const SUPPORTED_CURRENCIES = [
  "MXN",
  "USD",
  "ARS",
  "COP",
  "BRL",
  "EUR",
] as const;

export const SUPPORTED_TIMEZONES = [
  "America/Mexico_City",
  "America/Tijuana",
  "America/Cancun",
  "America/Bogota",
  "America/Argentina/Buenos_Aires",
  "America/Sao_Paulo",
  "Europe/Madrid",
] as const;

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export const boxSettingsSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(120),
  locale: z.enum(SUPPORTED_LOCALES),
  currency: z.enum(SUPPORTED_CURRENCIES),
  timezone: z.enum(SUPPORTED_TIMEZONES),
  defaultClassCapacity: z.coerce
    .number()
    .int()
    .min(1, "Capacidad mínima 1")
    .max(200, "Capacidad máxima 200"),
  brandColor: z
    .string()
    .regex(HEX_COLOR, "Formato hex requerido (#RRGGBB)")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  logoUrl: z
    .string()
    .url("URL inválida")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type BoxSettingsInput = z.infer<typeof boxSettingsSchema>;
