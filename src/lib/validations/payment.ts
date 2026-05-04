import { z } from "zod";

export const paymentGateways = ["MERCADOPAGO", "STRIPE", "CASH"] as const;
export type PaymentGateway = (typeof paymentGateways)[number];

export const paymentStatuses = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export const cashPaymentSchema = z.object({
  membershipId: z.string().min(1, "Membership requerida"),
  amount: z.coerce.number().min(0.01, "Monto debe ser positivo").max(1000000),
  currency: z.string().min(3).max(5).default("MXN"),
  paidAt: z
    .union([z.string(), z.date()])
    .optional()
    .transform((v) => (v ? (v instanceof Date ? v : new Date(v)) : new Date()))
    .refine((d) => !Number.isNaN(d.getTime()), "Fecha inválida"),
  notes: z
    .string()
    .max(300)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

export type CashPaymentInput = z.infer<typeof cashPaymentSchema>;
