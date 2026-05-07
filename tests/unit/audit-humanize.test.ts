import { describe, it, expect } from "vitest";
import {
  humanizeAuditEvent,
  AUDIT_CATEGORIES,
  AUDIT_CATEGORY_LABELS,
} from "@/lib/audit-humanize";

describe("humanizeAuditEvent", () => {
  describe("billing kinds", () => {
    it("SAAS_CHECKOUT_CONFIRMED_MOCK → activación demo", () => {
      const r = humanizeAuditEvent({
        action: "PAYMENT_CONFIRMED",
        metadata: { kind: "SAAS_CHECKOUT_CONFIRMED_MOCK" },
      });
      expect(r.category).toBe("billing");
      expect(r.severity).toBe("sensitive");
      expect(r.label).toContain("demo");
    });

    it("SAAS_LIFECYCLE_PAST_DUE → warning billing", () => {
      const r = humanizeAuditEvent({
        action: "PAYMENT_FAILED",
        metadata: { kind: "SAAS_LIFECYCLE_PAST_DUE" },
      });
      expect(r.category).toBe("billing");
      expect(r.severity).toBe("warning");
    });

    it("SAAS_LIFECYCLE_EXPIRED → sensitive", () => {
      const r = humanizeAuditEvent({
        action: "MEMBERSHIP_CANCELLED",
        metadata: { kind: "SAAS_LIFECYCLE_EXPIRED" },
      });
      expect(r.category).toBe("billing");
      expect(r.severity).toBe("sensitive");
    });

    it("SAAS_SUBSCRIPTION_CANCELLED → sensitive (acción del owner)", () => {
      const r = humanizeAuditEvent({
        action: "MEMBERSHIP_CANCELLED",
        metadata: { kind: "SAAS_SUBSCRIPTION_CANCELLED" },
      });
      expect(r.severity).toBe("sensitive");
    });

    it("TRIAL_EXPIRED → warning", () => {
      const r = humanizeAuditEvent({
        action: "MEMBERSHIP_CANCELLED",
        metadata: { kind: "TRIAL_EXPIRED" },
      });
      expect(r.label).toBe("Trial expirado");
      expect(r.severity).toBe("warning");
    });

    it("SAAS_RENEWED_MOCK → billing info", () => {
      const r = humanizeAuditEvent({
        action: "PAYMENT_CONFIRMED",
        metadata: { kind: "SAAS_RENEWED_MOCK" },
      });
      expect(r.category).toBe("billing");
      expect(r.severity).toBe("info");
      expect(r.label).toContain("demo");
    });
  });

  describe("email kinds", () => {
    it("EMAIL_SENT_OWNER_DIGEST → category email, info", () => {
      const r = humanizeAuditEvent({
        action: "PAYMENT_INITIATED",
        metadata: { kind: "EMAIL_SENT_OWNER_DIGEST" },
      });
      expect(r.category).toBe("email");
      expect(r.severity).toBe("info");
    });

    it("EMAIL_SENT_PAYMENT_FAILED → warning", () => {
      const r = humanizeAuditEvent({
        action: "PAYMENT_INITIATED",
        metadata: { kind: "EMAIL_SENT_PAYMENT_FAILED" },
      });
      expect(r.category).toBe("email");
      expect(r.severity).toBe("warning");
    });

    it("EMAIL_SENT_TRIAL_EXPIRING → info", () => {
      const r = humanizeAuditEvent({
        action: "PAYMENT_INITIATED",
        metadata: { kind: "EMAIL_SENT_TRIAL_EXPIRING" },
      });
      expect(r.category).toBe("email");
    });
  });

  describe("invitations", () => {
    it("INVITATION_SENT → category invitations, info", () => {
      const r = humanizeAuditEvent({
        action: "BOOKING_CREATED",
        metadata: { kind: "INVITATION_SENT" },
      });
      expect(r.category).toBe("invitations");
      expect(r.label).toContain("atleta");
    });

    it("INVITATION_ACCEPTED → info", () => {
      const r = humanizeAuditEvent({
        action: "BOOKING_CREATED",
        metadata: { kind: "INVITATION_ACCEPTED" },
      });
      expect(r.label).toContain("aceptó");
    });

    it("STAFF_INVITATION_REVOKED → warning", () => {
      const r = humanizeAuditEvent({
        action: "BOOKING_CANCELLED",
        metadata: { kind: "STAFF_INVITATION_REVOKED" },
      });
      expect(r.category).toBe("invitations");
      expect(r.severity).toBe("warning");
    });
  });

  describe("settings", () => {
    it("BOX_NOTIFICATIONS_UPDATED → category settings", () => {
      const r = humanizeAuditEvent({
        action: "USER_LOGIN",
        metadata: { kind: "BOX_NOTIFICATIONS_UPDATED" },
      });
      expect(r.category).toBe("settings");
      expect(r.severity).toBe("info");
    });
  });

  describe("fallback por action (sin kind)", () => {
    it("BOOKING_CREATED sin kind → bookings info", () => {
      const r = humanizeAuditEvent({
        action: "BOOKING_CREATED",
        metadata: null,
      });
      expect(r.category).toBe("bookings");
      expect(r.severity).toBe("info");
      expect(r.label).toBe("Reserva creada");
    });

    it("PAYMENT_REGISTERED sin kind → billing sensitive", () => {
      const r = humanizeAuditEvent({
        action: "PAYMENT_REGISTERED",
        metadata: null,
      });
      expect(r.category).toBe("billing");
      expect(r.severity).toBe("sensitive");
    });

    it("USER_LOGIN sin kind → settings info", () => {
      const r = humanizeAuditEvent({
        action: "USER_LOGIN",
        metadata: {},
      });
      expect(r.category).toBe("settings");
      expect(r.label).toBe("Inicio de sesión");
    });
  });

  describe("último resort", () => {
    it("action desconocido sin metadata → other", () => {
      const r = humanizeAuditEvent({
        action: "SOME_FUTURE_ACTION_XYZ",
      });
      expect(r.category).toBe("other");
      expect(r.severity).toBe("info");
      expect(r.label).toBe("SOME_FUTURE_ACTION_XYZ");
    });
  });

  describe("constantes", () => {
    it("AUDIT_CATEGORIES tiene 6 categorías", () => {
      expect(AUDIT_CATEGORIES).toHaveLength(6);
    });

    it("AUDIT_CATEGORY_LABELS cubre todas las categorías", () => {
      for (const cat of AUDIT_CATEGORIES) {
        expect(AUDIT_CATEGORY_LABELS[cat]).toBeTruthy();
      }
    });
  });
});
