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
  formatDateShort,
  formatInt,
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
    expect(formatTime24(d)).toBe("12:05");
    expect(formatInt(1363)).toBe("1,363");
  });
});
