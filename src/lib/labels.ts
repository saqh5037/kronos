/**
 * Presentation-boundary label maps: Prisma enums → neutral Mexican Spanish UI labels.
 *
 * Rule (audit 2026-09-15, systemic issue S3): no raw enum ever reaches the UI.
 * Every chip, badge, select option or table cell that renders an enum value goes
 * through `label(...)` or one of the typed maps below. Keys are checked against the
 * Prisma enums in tests/unit/labels-format.test.ts so a new enum value fails the build
 * until it has a label.
 */
import type {
  AlertChannel,
  AnnouncementAudience,
  AnnouncementChannel,
  AnnouncementStatus,
  AthleteStatus,
  BadgeTier,
  BookingStatus,
  ClassKind,
  EventStatus,
  GoalMetric,
  GoalStatus,
  MembershipStatus,
  MovementCategory,
  PaymentGateway,
  PaymentStatus,
  PermissionAction,
  PlanType,
  Role,
  SaasInvoiceStatus,
  SaasSubscriptionStatus,
  Scaling,
  ScoreType,
  SubscriptionStatus,
  WearableProvider,
  WearableStatus,
  WhiteboardStatus,
  WODType,
} from "@prisma/client";

export const bookingStatusLabel: Record<BookingStatus, string> = {
  BOOKED: "Reservado",
  WAITLIST: "En lista de espera",
  ATTENDED: "Asistió",
  NOSHOW: "No vino",
  CANCELLED: "Cancelada",
};

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  FAILED: "Fallido",
  REFUNDED: "Reembolsado",
};

export const paymentGatewayLabel: Record<PaymentGateway, string> = {
  MERCADOPAGO: "Mercado Pago",
  STRIPE: "Tarjeta",
  CASH: "Efectivo",
};

export const membershipStatusLabel: Record<MembershipStatus, string> = {
  PENDING: "Pendiente",
  ACTIVE: "Activa",
  PAUSED: "Pausada",
  EXPIRED: "Vencida",
  CANCELLED: "Cancelada",
};

export const planTypeLabel: Record<PlanType, string> = {
  MONTHLY: "Mensual",
  ANNUAL: "Anual",
  PACKAGE: "Paquete de clases",
  DROPIN: "Visita",
  UNLIMITED: "Ilimitado",
  FAMILY: "Familiar",
};

export const athleteStatusLabel: Record<AthleteStatus, string> = {
  ACTIVE: "Activo",
  PAUSED: "Pausado",
  DROPIN: "Visita",
  CANCELLED: "Baja",
};

export const subscriptionStatusLabel: Record<SubscriptionStatus, string> = {
  TRIAL: "En prueba",
  ACTIVE: "Activa",
  PAST_DUE: "Pago vencido",
  CANCELLED: "Cancelada",
  EXPIRED: "Expirada",
};

export const saasSubscriptionStatusLabel: Record<
  SaasSubscriptionStatus,
  string
> = {
  PENDING: "Pendiente",
  ACTIVE: "Activa",
  PAST_DUE: "Pago vencido",
  CANCELLED: "Cancelada",
  EXPIRED: "Expirada",
};

export const saasInvoiceStatusLabel: Record<SaasInvoiceStatus, string> = {
  PAID: "Pagada",
  REFUNDED: "Reembolsada",
};

export const wodTypeLabel: Record<WODType, string> = {
  FORTIME: "For Time",
  AMRAP: "AMRAP",
  EMOM: "EMOM",
  TABATA: "Tabata",
  STRENGTH: "Fuerza",
  CUSTOM: "Personalizado",
};

export const scoreTypeLabel: Record<ScoreType, string> = {
  TIME: "Tiempo",
  REPS: "Repeticiones",
  WEIGHT: "Peso",
  ROUNDS_REPS: "Rondas + reps",
};

export const scalingLabel: Record<Scaling, string> = {
  RX: "RX",
  SCALED: "Escalado",
  RXPLUS: "RX+",
};

export const classKindLabel: Record<ClassKind, string> = {
  WOD: "WOD",
  OPEN_BOX: "Open Box",
};

export const movementCategoryLabel: Record<MovementCategory, string> = {
  STRENGTH: "Fuerza",
  GYMNASTICS: "Gimnasia",
  MONOSTRUCTURAL: "Cardio",
  OLYMPIC: "Olímpico",
  ACCESSORY: "Accesorio",
};

export const goalMetricLabel: Record<GoalMetric, string> = {
  PR: "PR",
  TONNAGE: "Tonelaje",
  ATTENDANCE: "Asistencia",
  BODY_COMPOSITION: "Composición corporal",
};

export const goalStatusLabel: Record<GoalStatus, string> = {
  ACTIVE: "Activo",
  ACHIEVED: "Logrado",
  EXPIRED: "Vencido",
  CANCELLED: "Cancelado",
};

export const announcementStatusLabel: Record<AnnouncementStatus, string> = {
  DRAFT: "Borrador",
  SCHEDULED: "Programado",
  SENDING: "Enviando",
  SENT: "Enviado",
  FAILED: "Fallido",
};

export const announcementChannelLabel: Record<AnnouncementChannel, string> = {
  EMAIL: "Correo",
  PUSH: "Notificación push",
  IN_APP: "En la app",
};

export const announcementAudienceLabel: Record<AnnouncementAudience, string> = {
  ALL: "Todos",
  ACTIVE: "Activos",
  PAUSED: "Pausados",
  COACHES: "Coaches",
};

export const alertChannelLabel: Record<AlertChannel, string> = {
  EMAIL: "Correo",
  PUSH: "Notificación push",
  IN_APP: "En la app",
  BOTH: "Correo y push",
};

export const roleLabel: Record<Role, string> = {
  OWNER: "Dueño",
  COACH: "Coach",
  ATHLETE: "Atleta",
  STAFF: "Staff",
};

export const eventStatusLabel: Record<EventStatus, string> = {
  DRAFT: "Borrador",
  OPEN: "Abierto",
  CLOSED: "Cerrado",
  ARCHIVED: "Archivado",
};

export const wearableProviderLabel: Record<WearableProvider, string> = {
  WHOOP: "Whoop",
  GARMIN: "Garmin",
  APPLE_HEALTH: "Apple Health",
  OURA: "Oura",
};

export const wearableStatusLabel: Record<WearableStatus, string> = {
  CONNECTED: "Conectado",
  REVOKED: "Desconectado",
  ERROR: "Con error",
  RECONNECT_REQUIRED: "Reconectar",
};

export const badgeTierLabel: Record<BadgeTier, string> = {
  PRINCIPIANTE: "Principiante",
  ESCALADO: "Escalado",
  RX: "RX",
};

export const whiteboardStatusLabel: Record<WhiteboardStatus, string> = {
  PENDING: "Pendiente",
  PROCESSED: "Procesada",
  CONFIRMED: "Confirmada",
  EXPIRED: "Expirada",
  FAILED: "Fallida",
};

export const permissionActionLabel: Record<PermissionAction, string> = {
  REGISTER_CASH_PAYMENT: "Registrar cobro en efectivo",
  APPLY_DISCOUNT: "Aplicar descuento",
  REFUND_PAYMENT: "Reembolsar pago",
  EDIT_PLAN_PRICING: "Editar precios de planes",
  DELETE_ATHLETE: "Eliminar atleta",
  MARK_OVERDUE: "Marcar como moroso",
  VIEW_FINANCIAL_REPORTS: "Ver reportes financieros",
  EDIT_OTHERS_SCORES: "Editar scores de otros",
  MANAGE_ATHLETE_METRICS: "Gestionar métricas de atletas",
};

/** Every map, keyed by a stable name, for generic lookups and for the completeness test. */
export const labelMaps = {
  bookingStatus: bookingStatusLabel,
  paymentStatus: paymentStatusLabel,
  paymentGateway: paymentGatewayLabel,
  membershipStatus: membershipStatusLabel,
  planType: planTypeLabel,
  athleteStatus: athleteStatusLabel,
  subscriptionStatus: subscriptionStatusLabel,
  saasSubscriptionStatus: saasSubscriptionStatusLabel,
  saasInvoiceStatus: saasInvoiceStatusLabel,
  wodType: wodTypeLabel,
  scoreType: scoreTypeLabel,
  scaling: scalingLabel,
  classKind: classKindLabel,
  movementCategory: movementCategoryLabel,
  goalMetric: goalMetricLabel,
  goalStatus: goalStatusLabel,
  announcementStatus: announcementStatusLabel,
  announcementChannel: announcementChannelLabel,
  announcementAudience: announcementAudienceLabel,
  alertChannel: alertChannelLabel,
  role: roleLabel,
  eventStatus: eventStatusLabel,
  wearableProvider: wearableProviderLabel,
  wearableStatus: wearableStatusLabel,
  badgeTier: badgeTierLabel,
  whiteboardStatus: whiteboardStatusLabel,
  permissionAction: permissionActionLabel,
} as const;

export type LabelMapName = keyof typeof labelMaps;

/**
 * Generic lookup with a safe fallback: unknown values render as a humanised
 * version of the raw key ("PAST_DUE" → "Past due") instead of leaking the enum.
 */
export function label<M extends LabelMapName>(
  map: M,
  value: string | null | undefined,
): string {
  if (!value) return "";
  const dict = labelMaps[map] as Record<string, string>;
  return dict[value] ?? humanizeEnum(value);
}

export function humanizeEnum(value: string): string {
  const lower = value.toLowerCase().replace(/_/g, " ");
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
