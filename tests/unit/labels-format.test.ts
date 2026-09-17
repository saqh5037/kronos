import { describe, expect, it } from "vitest";
import {
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
import { humanizeEnum, label, labelMaps } from "@/lib/labels";
import {
  formatDateFull,
  formatDateLong,
  formatDateShort,
  formatDateWeekday,
  formatDecimal,
  formatInt,
  formatMoney,
  formatMonthYear,
  formatMXN,
  formatMXNDelta,
  formatPercentDelta,
  formatTime24,
} from "@/lib/format";

const prismaEnums: Record<keyof typeof labelMaps, Record<string, string>> = {
  bookingStatus: BookingStatus,
  paymentStatus: PaymentStatus,
  paymentGateway: PaymentGateway,
  membershipStatus: MembershipStatus,
  planType: PlanType,
  athleteStatus: AthleteStatus,
  subscriptionStatus: SubscriptionStatus,
  saasSubscriptionStatus: SaasSubscriptionStatus,
  saasInvoiceStatus: SaasInvoiceStatus,
  wodType: WODType,
  scoreType: ScoreType,
  scaling: Scaling,
  classKind: ClassKind,
  movementCategory: MovementCategory,
  goalMetric: GoalMetric,
  goalStatus: GoalStatus,
  announcementStatus: AnnouncementStatus,
  announcementChannel: AnnouncementChannel,
  announcementAudience: AnnouncementAudience,
  alertChannel: AlertChannel,
  role: Role,
  eventStatus: EventStatus,
  wearableProvider: WearableProvider,
  wearableStatus: WearableStatus,
  badgeTier: BadgeTier,
  whiteboardStatus: WhiteboardStatus,
  permissionAction: PermissionAction,
};

describe("labels: every Prisma enum value has a Spanish label", () => {
  for (const [name, prismaEnum] of Object.entries(prismaEnums)) {
    it(name, () => {
      const map = labelMaps[name as keyof typeof labelMaps] as Record<
        string,
        string
      >;
      const expected = Object.values(prismaEnum).sort();
      expect(Object.keys(map).sort()).toEqual(expected);
      for (const v of expected) {
        expect(map[v], `${name}.${v}`).toMatch(/\S/);
        // No raw enum leaks: a label never equals its SCREAMING_CASE key unless it is CrossFit jargon.
        if (!/^(RX|RX\+|AMRAP|EMOM|WOD|PR)$/.test(map[v]))
          expect(map[v]).not.toBe(v);
      }
    });
  }

  it("label() falls back to a humanised key instead of the raw enum", () => {
    expect(label("bookingStatus", "ATTENDED")).toBe("Asistió");
    expect(label("bookingStatus", "SOMETHING_NEW")).toBe("Something new");
    expect(label("bookingStatus", null)).toBe("");
    expect(humanizeEnum("PAST_DUE")).toBe("Past due");
  });
});

describe("format", () => {
  it("money in MXN without decimals by default", () => {
    expect(formatMXN(2500)).toBe("$2,500 MXN");
    expect(formatMXN(2500.5, { cents: true })).toBe("$2,500.50 MXN");
    expect(formatMXN(0)).toBe("$0 MXN");
    expect(formatMXN(2500, { suffix: false })).toBe("$2,500");
  });
  it("signed deltas use a true minus sign", () => {
    expect(formatMXNDelta(-147000)).toBe("−$147,000 MXN");
    expect(formatMXNDelta(1200)).toBe("+$1,200 MXN");
    expect(formatPercentDelta(-51.4)).toBe("−51.4 %");
    expect(formatPercentDelta(12)).toBe("+12.0 %");
  });
  it("dates and 24h times in Mexico City", () => {
    const d = new Date("2026-09-15T12:05:00-06:00");
    expect(formatDateShort(d)).toBe("15 sep");
    expect(formatDateWeekday(d)).toBe("mar 15 sep");
    expect(formatDateWeekday(d)).not.toMatch(/,|\bde\b|[A-Z]/);
    expect(formatDateLong(d)).toBe("15 sep 2026");
    expect(formatTime24(d)).toBe("12:05");
    expect(formatInt(1363)).toBe("1,363");
  });

  /**
   * The owner dashboard used to build its own `Intl.NumberFormat(box.locale,
   * …)`, so "$2,500" on /admin sat next to "$2,500 MXN" on /admin/pagos for
   * the same peso (audit 2026-09-15, S4). One formatter, one style.
   */
  it("money honours a box locale/currency and keeps one house style", () => {
    expect(formatMoney(2500)).toBe(formatMXN(2500));
    expect(formatMoney(2500, { locale: "es-MX", currency: "MXN" })).toBe(
      "$2,500 MXN",
    );
    expect(formatMoney(2500, { suffix: false })).toBe("$2,500");
    expect(formatMoney(2500.5, { cents: true })).toBe("$2,500.50 MXN");
    expect(formatMoney(2500, { currency: "USD" })).toMatch(/2,500.*USD$/);
  });

  it("falls back to the house formatter on an unusable locale/currency", () => {
    expect(formatMoney(2500, { locale: "", currency: "" })).toBe("$2,500 MXN");
    expect(formatMoney(2500, { locale: "not a locale" })).toBe("$2,500 MXN");
  });

  it("long dates and month headers stay in the box timezone", () => {
    // 22:00 of 30 sep in CDMX, already October in UTC.
    const d = new Date("2026-10-01T04:00:00.000Z");
    expect(formatDateFull(d)).toBe("30 de septiembre de 2026");
    expect(formatMonthYear(d)).toBe("septiembre 2026");
    expect(formatDateFull(d, "UTC")).toBe("1 de octubre de 2026");
  });

  it("decimals share the thousands separator of the rest of the admin", () => {
    expect(formatDecimal(1363)).toBe("1,363");
    expect(formatDecimal(1363.456, 2)).toBe("1,363.46");
    expect(formatDecimal(0.5, 1)).toBe("0.5");
  });
});
