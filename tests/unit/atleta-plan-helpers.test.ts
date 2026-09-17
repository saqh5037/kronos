import { describe, it, expect } from "vitest";
import {
  goalMetricLabel,
  normalizeGoalId,
  formatDeadline,
} from "../../src/app/atleta/plan/_helpers";
import { formatDeadlineWithCountdown } from "../../src/lib/scores/copy";

/** The same sentence, with the zone named out loud instead of defaulted. */
const formatDeadlineInZone = (target: Date, now: Date) =>
  formatDeadlineWithCountdown(target, now, "America/Mexico_City");

describe("goalMetricLabel", () => {
  it("maps known metrics to Spanish labels", () => {
    expect(goalMetricLabel("PR")).toBe("PR");
    expect(goalMetricLabel("TONNAGE")).toBe("Tonelaje");
    expect(goalMetricLabel("ATTENDANCE")).toBe("Asistencia");
    expect(goalMetricLabel("BODY_COMPOSITION")).toBe("Composición corporal");
  });

  it("returns 'objetivo' for unknown metric", () => {
    expect(goalMetricLabel("UNKNOWN")).toBe("objetivo");
    expect(goalMetricLabel("")).toBe("objetivo");
  });
});

describe("normalizeGoalId", () => {
  it("returns null for undefined", () => {
    expect(normalizeGoalId(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(normalizeGoalId("")).toBeNull();
  });

  it("returns null for whitespace-only string", () => {
    expect(normalizeGoalId("   ")).toBeNull();
  });

  it("trims surrounding whitespace from a valid id", () => {
    expect(normalizeGoalId("  abc123  ")).toBe("abc123");
  });

  it("returns the id unchanged when already clean", () => {
    expect(normalizeGoalId("clxyz123abc")).toBe("clxyz123abc");
  });
});

describe("formatDeadline", () => {
  // Audit 2026-09-15 (P2 copy, /atleta/plan): the deadline used to render as
  // "3 DE OCTUBRE DE 2026" — a full uppercase line the athlete had to do date
  // arithmetic on. It now leads with the countdown and keeps a short date, so
  // the old "must contain the year" expectation is deliberately gone.
  //
  // Every instant below is written in UTC and chosen so the CDMX wall clock is
  // the date named in the expectation. The old version of this suite built its
  // dates with `new Date(y, m, d)` — the SERVER's calendar — which is exactly
  // the bug it was supposed to be pinning: on a UTC host the countdown counted
  // UTC days while the date rendered in CDMX, and the page shipped
  // "faltan 18 días · 2 oct".
  const at = (iso: string) => new Date(iso);
  const SEP_15 = at("2026-09-15T18:00:00.000Z"); // Sep 15 12:00 CDMX
  const OCT_3 = at("2026-10-03T06:00:00.000Z"); // Oct 3 00:00 CDMX

  it("leads with the countdown, not the long date", () => {
    expect(formatDeadline(OCT_3, SEP_15)).toBe("faltan 18 días · 3 oct");
  });

  it("includes a recognizable month reference (es-MX)", () => {
    const now = at("2026-08-20T18:00:00.000Z"); // Aug 20 12:00 CDMX
    const deadline = at("2026-09-01T06:00:00.000Z"); // Sep 1 00:00 CDMX
    const formatted = formatDeadline(deadline, now).toLowerCase();
    // es-MX can render "septiembre" or abbreviated "sep"
    expect(formatted).toMatch(/sep/);
  });

  it("agrees with itself on the last instant of a CDMX day", () => {
    // 05:59:59.999Z on Oct 3 is still Oct 2 in CDMX. The countdown and the
    // printed date must move together or the sentence contradicts itself.
    const lateOct2 = at("2026-10-03T05:59:59.999Z");
    expect(formatDeadline(lateOct2, SEP_15)).toBe("faltan 17 días · 2 oct");
  });

  it("does not depend on the machine's timezone", () => {
    // The formatter and the counter both pin America/Mexico_City, so the
    // result is the same whether CI runs in UTC or a laptop runs in CDMX.
    expect(formatDeadline(OCT_3, SEP_15)).toBe(
      formatDeadlineInZone(OCT_3, SEP_15),
    );
  });
});
