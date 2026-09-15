/**
 * Audit-log humanisation (audit 2026-09-15, admin-management P1).
 *
 * The owner-facing feed must read like Spanish, not like a database dump:
 *   - a headline that names the real act ("Cobro en efectivo")
 *   - the athlete, the plan and the amount, money through `formatMXN`
 *   - never an opaque `Payment #8-active` / `User #163d4tti` when a name exists
 *   - "Hoy" grouping that cannot hold a future timestamp
 *   - the "Sensible" flag reserved for acts gated by a `PermissionAction`
 *
 * Everything here is pure so `tests/unit/admin-mgmt-audit-humanize.test.ts`
 * can pin the contract.
 */
import type {
  AuditAction,
  PaymentGateway,
  PermissionAction,
} from "@prisma/client";
import { formatDateWeekday, formatMXN } from "./format";

export type AuditCategory =
  | "billing"
  | "email"
  | "invitations"
  | "settings"
  | "bookings"
  | "other";

export type AuditSeverity = "info" | "warning" | "sensitive";

export type HumanizedEvent = {
  label: string;
  category: AuditCategory;
  severity: AuditSeverity;
  /** Permission gate this act maps to, when any. Drives the "Sensible" flag. */
  permission?: PermissionAction;
  /** One-line detail, composed when the payload carries enough context. */
  detail?: string;
};

export const AUDIT_CATEGORY_LABELS: Record<AuditCategory, string> = {
  billing: "Facturación",
  email: "Emails",
  invitations: "Invitaciones",
  settings: "Configuración",
  bookings: "Reservas",
  other: "Otros",
};

export const AUDIT_CATEGORIES: AuditCategory[] = [
  "billing",
  "email",
  "invitations",
  "settings",
  "bookings",
  "other",
];

const KIND_MAP: Record<
  string,
  { label: string; category: AuditCategory; severity: AuditSeverity }
> = {
  // Billing — checkout / lifecycle
  SAAS_CHECKOUT_INITIATED: {
    label: "Checkout iniciado",
    category: "billing",
    severity: "info",
  },
  SAAS_CHECKOUT_CONFIRMED_MOCK: {
    label: "Suscripción activada (modo demo)",
    category: "billing",
    severity: "sensitive",
  },
  SAAS_WEBHOOK_CONFIRMED: {
    label: "Cobro confirmado por MercadoPago",
    category: "billing",
    severity: "sensitive",
  },
  SAAS_WEBHOOK_NON_APPROVED: {
    label: "Webhook MP recibido sin aprobación",
    category: "billing",
    severity: "warning",
  },
  SAAS_LIFECYCLE_PAST_DUE: {
    label: "Suscripción quedó en pago pendiente",
    category: "billing",
    severity: "warning",
  },
  SAAS_LIFECYCLE_EXPIRED: {
    label: "Suscripción expirada por falta de pago",
    category: "billing",
    severity: "sensitive",
  },
  TRIAL_EXPIRED: {
    label: "Trial expirado",
    category: "billing",
    severity: "warning",
  },
  SAAS_SUBSCRIPTION_CANCELLED: {
    label: "Suscripción cancelada por el owner",
    category: "billing",
    severity: "sensitive",
  },
  SAAS_RENEWED_MOCK: {
    label: "Renovación automática (modo demo)",
    category: "billing",
    severity: "info",
  },

  // Email
  EMAIL_SENT_OWNER_DIGEST: {
    label: "Resumen semanal enviado",
    category: "email",
    severity: "info",
  },
  EMAIL_SENT_PAYMENT_FAILED: {
    label: "Email enviado: pago pendiente",
    category: "email",
    severity: "warning",
  },
  EMAIL_SENT_SUBSCRIPTION_EXPIRED: {
    label: "Email enviado: suscripción expirada",
    category: "email",
    severity: "warning",
  },
  EMAIL_SENT_TRIAL_EXPIRING: {
    label: "Email enviado: trial por terminar",
    category: "email",
    severity: "info",
  },

  // Invitations
  INVITATION_SENT: {
    label: "Invitación de atleta enviada",
    category: "invitations",
    severity: "info",
  },
  INVITATION_ACCEPTED: {
    label: "Atleta aceptó la invitación",
    category: "invitations",
    severity: "info",
  },
  INVITATION_REVOKED: {
    label: "Invitación de atleta revocada",
    category: "invitations",
    severity: "warning",
  },
  STAFF_INVITATION_SENT: {
    label: "Invitación de staff/coach enviada",
    category: "invitations",
    severity: "info",
  },
  STAFF_INVITATION_ACCEPTED: {
    label: "Staff/coach aceptó la invitación",
    category: "invitations",
    severity: "info",
  },
  STAFF_INVITATION_REVOKED: {
    label: "Invitación de staff revocada",
    category: "invitations",
    severity: "warning",
  },

  // Settings
  BOX_NOTIFICATIONS_UPDATED: {
    label: "Preferencias de notificaciones actualizadas",
    category: "settings",
    severity: "info",
  },
};

/**
 * Base severity per action. "sensitive" is never stored here — it is derived
 * from `AUDIT_ACTION_PERMISSION` so the flag means exactly one thing: this act
 * is gated by a permission the owner can revoke.
 */
const ACTION_FALLBACK: Record<
  AuditAction,
  { label: string; category: AuditCategory; severity: "info" | "warning" }
> = {
  CLASS_CANCELLED: {
    label: "Clase cancelada",
    category: "bookings",
    severity: "warning",
  },
  BOOKING_CREATED: {
    label: "Reserva creada",
    category: "bookings",
    severity: "info",
  },
  BOOKING_CANCELLED: {
    label: "Reserva cancelada",
    category: "bookings",
    severity: "info",
  },
  BOOKING_CHECKIN: {
    label: "Check-in registrado",
    category: "bookings",
    severity: "info",
  },
  BOOKING_NOSHOW: {
    label: "No-show marcado",
    category: "bookings",
    severity: "warning",
  },
  WAITLIST_PROMOTED: {
    label: "Atleta promovido de lista de espera",
    category: "bookings",
    severity: "info",
  },
  SCORE_SUBMITTED: {
    label: "Score registrado",
    category: "bookings",
    severity: "info",
  },
  PR_ACHIEVED: {
    label: "PR alcanzado",
    category: "bookings",
    severity: "info",
  },
  WOD_ARCHIVED: {
    label: "WOD archivado",
    category: "settings",
    severity: "warning",
  },
  PLAN_ARCHIVED: {
    label: "Plan archivado",
    category: "settings",
    severity: "warning",
  },
  MEMBERSHIP_ASSIGNED: {
    label: "Membresía asignada",
    category: "billing",
    severity: "info",
  },
  MEMBERSHIP_PAUSED: {
    label: "Membresía pausada",
    category: "billing",
    severity: "warning",
  },
  MEMBERSHIP_CANCELLED: {
    label: "Membresía cancelada",
    category: "billing",
    severity: "warning",
  },
  PAYMENT_REGISTERED: {
    label: "Pago registrado",
    category: "billing",
    severity: "info",
  },
  PAYMENT_VOIDED: {
    label: "Pago anulado",
    category: "billing",
    severity: "warning",
  },
  PAYMENT_INITIATED: {
    label: "Pago iniciado",
    category: "billing",
    severity: "info",
  },
  PAYMENT_CONFIRMED: {
    label: "Pago confirmado",
    category: "billing",
    severity: "info",
  },
  PAYMENT_FAILED: {
    label: "Pago fallido",
    category: "billing",
    severity: "warning",
  },
  WEBHOOK_RECEIVED: {
    label: "Webhook recibido",
    category: "billing",
    severity: "info",
  },
  WHITEBOARD_UPLOADED: {
    label: "Pizarra subida",
    category: "bookings",
    severity: "info",
  },
  BULK_SCORES_FROM_WHITEBOARD: {
    label: "Scores cargados desde la pizarra",
    category: "bookings",
    severity: "info",
  },
  USER_LOGIN: {
    label: "Inicio de sesión",
    category: "settings",
    severity: "info",
  },
  USER_LOGOUT: {
    label: "Cierre de sesión",
    category: "settings",
    severity: "info",
  },
  PASSWORD_SET: {
    label: "Contraseña configurada",
    category: "settings",
    severity: "warning",
  },
  PASSWORD_CLEARED: {
    label: "Contraseña eliminada",
    category: "settings",
    severity: "warning",
  },
  ATHLETE_ONBOARDING_STEP_COMPLETED: {
    label: "Atleta completó un paso de su alta",
    category: "settings",
    severity: "info",
  },
  ATHLETE_ONBOARDING_COMPLETED: {
    label: "Atleta terminó su alta",
    category: "settings",
    severity: "info",
  },
  ATHLETE_ONBOARDING_SKIPPED: {
    label: "Atleta omitió su alta",
    category: "settings",
    severity: "info",
  },
  PILOT_BETA_SIGNED: {
    label: "Convenio de piloto firmado",
    category: "settings",
    severity: "warning",
  },
  WEARABLE_CONNECTED: {
    label: "Wearable conectado",
    category: "settings",
    severity: "info",
  },
  WEARABLE_DISCONNECTED: {
    label: "Wearable desconectado",
    category: "settings",
    severity: "info",
  },
  WEARABLE_SYNC_FAILED: {
    label: "Falló la sincronización del wearable",
    category: "settings",
    severity: "warning",
  },
  WEARABLE_RECONNECT_REQUIRED: {
    label: "El wearable necesita reconectarse",
    category: "settings",
    severity: "warning",
  },
  ATHLETE_QUICK_WOD_SAVED: {
    label: "WOD rápido guardado por el atleta",
    category: "bookings",
    severity: "info",
  },
};

/** Every action the feed can render, for completeness tests. */
export const AUDIT_ALL_ACTIONS = Object.keys(ACTION_FALLBACK) as AuditAction[];

/**
 * Audit action → the `PermissionAction` that gates it.
 *
 * Only these render the "Sensible" flag. A gateway webhook or a lifecycle
 * expiry is not sensitive: nobody had to be allowed to do it.
 */
export const AUDIT_ACTION_PERMISSION: Partial<
  Record<AuditAction, PermissionAction>
> = {
  PAYMENT_REGISTERED: "REGISTER_CASH_PAYMENT",
  PAYMENT_VOIDED: "REFUND_PAYMENT",
  PLAN_ARCHIVED: "EDIT_PLAN_PRICING",
};

const PAYMENT_METHOD_HEADLINE: Record<PaymentGateway, string> = {
  CASH: "Cobro en efectivo",
  MERCADOPAGO: "Cobro por Mercado Pago",
  STRIPE: "Cobro con tarjeta",
};

const PAYMENT_ACTIONS = new Set<AuditAction>([
  "PAYMENT_REGISTERED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_INITIATED",
]);

function isPaymentGateway(v: unknown): v is PaymentGateway {
  return v === "CASH" || v === "MERCADOPAGO" || v === "STRIPE";
}

/**
 * The act, in Spanish. Payments name their method so the owner can tell a cash
 * register entry from a gateway charge without opening the row.
 */
export function auditHeadline(input: {
  action: string;
  gateway?: unknown;
}): string {
  const action = input.action as AuditAction;
  if (PAYMENT_ACTIONS.has(action) && isPaymentGateway(input.gateway)) {
    return PAYMENT_METHOD_HEADLINE[input.gateway];
  }
  return ACTION_FALLBACK[action]?.label ?? input.action;
}

export type AuditLineParts = {
  label: string;
  athleteName?: string | null;
  planName?: string | null;
  amount?: number | null;
  currency?: string | null;
};

function formatAuditAmount(amount: number, currency?: string | null): string {
  const cur = (currency ?? "MXN").toUpperCase();
  if (cur !== "MXN") {
    return `${amount.toLocaleString("es-MX", {
      maximumFractionDigits: 2,
    })} ${cur}`;
  }
  return formatMXN(amount, { cents: !Number.isInteger(amount) });
}

/** "Cobro en efectivo · Mía Moreno · Mensual Ilimitado · $2,500 MXN" */
export function composeAuditLine(parts: AuditLineParts): string {
  const segments: string[] = [parts.label];
  if (parts.athleteName) segments.push(parts.athleteName);
  if (parts.planName) segments.push(parts.planName);
  if (typeof parts.amount === "number" && Number.isFinite(parts.amount)) {
    segments.push(formatAuditAmount(parts.amount, parts.currency));
  }
  return segments.join(" · ");
}

/** `Payment #8-active`, `User #163d4tti`, `Score #0vcblq` — never show these. */
export function isOpaqueEntityLabel(label: string | null | undefined): boolean {
  if (!label) return false;
  return /^[A-Za-z]+\s#[A-Za-z0-9-]+$/.test(label.trim());
}

const TARGET_TYPE_LABELS: Record<string, string> = {
  Athlete: "Atleta",
  Payment: "Pago",
  Membership: "Membresía",
  Class: "Clase",
  Score: "Score del atleta",
  SaasSubscription: "Suscripción del box",
  Box: "Configuración del Box",
  AthleteInvitation: "Invitación de atleta",
  StaffInvitation: "Invitación de staff",
  User: "Usuario del equipo",
  Plan: "Plan",
  WOD: "WOD",
  Booking: "Reserva",
  Whiteboard: "Pizarra",
};

/**
 * Prefer a real name; then a Spanish entity name; never the raw id.
 * Returns "" when there is nothing honest to show, so the caller can hide it.
 */
export function humanizeAuditTargetLabel(input: {
  targetType: string;
  label: string | null | undefined;
  actorName?: string | null;
}): string {
  const label = input.label?.trim() ?? "";
  if (label && !isOpaqueEntityLabel(label)) return label;
  if (input.targetType === "User" && input.actorName) return input.actorName;
  return TARGET_TYPE_LABELS[input.targetType] ?? "";
}

export function humanizeAuditEvent(input: {
  action: string;
  metadata?: Record<string, unknown> | null;
  targetType?: string;
  /** Resolved names for the row, when the caller already has them. */
  subject?: { athleteName?: string | null; planName?: string | null };
}): HumanizedEvent {
  const kind =
    typeof input.metadata?.kind === "string"
      ? (input.metadata.kind as string)
      : null;

  const permission =
    AUDIT_ACTION_PERMISSION[input.action as AuditAction] ?? undefined;

  if (kind && KIND_MAP[kind]) {
    const base = KIND_MAP[kind];
    return {
      ...base,
      ...(permission ? { permission } : {}),
    };
  }

  const fallback = ACTION_FALLBACK[input.action as AuditAction];
  if (!fallback) {
    return { label: input.action, category: "other", severity: "info" };
  }

  const gateway = input.metadata?.gateway;
  const label = auditHeadline({ action: input.action, gateway });
  const amount =
    typeof input.metadata?.amount === "number"
      ? (input.metadata.amount as number)
      : null;
  const currency =
    typeof input.metadata?.currency === "string"
      ? (input.metadata.currency as string)
      : null;

  const detail = composeAuditLine({
    label,
    athleteName: input.subject?.athleteName ?? null,
    planName: input.subject?.planName ?? null,
    amount,
    currency,
  });

  return {
    label,
    category: fallback.category,
    severity: permission ? "sensitive" : fallback.severity,
    ...(permission ? { permission } : {}),
    ...(detail !== label ? { detail } : {}),
  };
}

// ───── Day grouping ────────────────────────────────────────────────────────

const FEED_TZ = "America/Mexico_City";

/** YYYY-MM-DD in the box timezone — stable key for "same day". */
function tzDayKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).format(date);
}

/** An audit row cannot have happened after `now`; seeded futures are noise. */
export function dropFutureAuditEvents<T extends { when: Date }>(
  events: readonly T[],
  now: Date,
): T[] {
  const cutoff = now.getTime();
  return events.filter((e) => e.when.getTime() <= cutoff);
}

export type AuditDayGroup<T> = {
  /** YYYY-MM-DD in the box timezone. */
  key: string;
  /** "Hoy" · "Ayer" · "lun 14 sep" */
  label: string;
  date: Date;
  events: T[];
};

/**
 * Groups the feed by day, newest first, newest-first inside each day.
 * Future rows are dropped, so "Hoy" can never lead with next month.
 */
export function groupAuditEventsByDay<T extends { when: Date }>(
  events: readonly T[],
  now: Date,
  timeZone: string = FEED_TZ,
): AuditDayGroup<T>[] {
  const todayKey = tzDayKey(now, timeZone);
  const yesterdayKey = tzDayKey(
    new Date(now.getTime() - 24 * 60 * 60 * 1000),
    timeZone,
  );

  const buckets = new Map<string, T[]>();
  for (const event of dropFutureAuditEvents(events, now)) {
    const key = tzDayKey(event.when, timeZone);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(event);
    else buckets.set(key, [event]);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([key, rows]) => {
      const sorted = [...rows].sort(
        (a, b) => b.when.getTime() - a.when.getTime(),
      );
      const label =
        key === todayKey
          ? "Hoy"
          : key === yesterdayKey
            ? "Ayer"
            : formatDateWeekday(sorted[0].when, timeZone);
      return { key, label, date: sorted[0].when, events: sorted };
    });
}
