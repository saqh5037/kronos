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

const ACTION_FALLBACK: Partial<
  Record<
    string,
    { label: string; category: AuditCategory; severity: AuditSeverity }
  >
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
    label: "Atleta promovido de waitlist",
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
    severity: "sensitive",
  },
  PAYMENT_REGISTERED: {
    label: "Pago registrado",
    category: "billing",
    severity: "sensitive",
  },
  PAYMENT_VOIDED: {
    label: "Pago anulado",
    category: "billing",
    severity: "sensitive",
  },
  PAYMENT_INITIATED: {
    label: "Pago iniciado",
    category: "billing",
    severity: "info",
  },
  PAYMENT_CONFIRMED: {
    label: "Pago confirmado",
    category: "billing",
    severity: "sensitive",
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
    label: "Pizarra subida (OCR)",
    category: "bookings",
    severity: "info",
  },
  BULK_SCORES_FROM_WHITEBOARD: {
    label: "Scores cargados desde pizarra",
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
};

export function humanizeAuditEvent(input: {
  action: string;
  metadata?: Record<string, unknown> | null;
  targetType?: string;
}): HumanizedEvent {
  const kind =
    typeof input.metadata?.kind === "string"
      ? (input.metadata.kind as string)
      : null;

  if (kind && KIND_MAP[kind]) {
    return KIND_MAP[kind];
  }

  const fallback = ACTION_FALLBACK[input.action];
  if (fallback) return fallback;

  return {
    label: input.action,
    category: "other",
    severity: "info",
  };
}
