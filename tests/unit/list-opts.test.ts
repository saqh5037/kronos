import { describe, it, expect } from "vitest";
import {
  normalizePagination,
  dateRangeFilter,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "../../src/server/actions/types";

describe("normalizePagination", () => {
  it("uses defaults when opts undefined", () => {
    expect(normalizePagination()).toEqual({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      skip: 0,
      take: DEFAULT_PAGE_SIZE,
    });
  });

  it("computes skip from page", () => {
    const out = normalizePagination({ page: 3, pageSize: 10 });
    expect(out).toEqual({ page: 3, pageSize: 10, skip: 20, take: 10 });
  });

  it("clamps page to >= 1", () => {
    expect(normalizePagination({ page: 0 }).page).toBe(1);
    expect(normalizePagination({ page: -5 }).page).toBe(1);
  });

  it("clamps pageSize to >= 1", () => {
    expect(normalizePagination({ pageSize: 0 }).pageSize).toBe(1);
    expect(normalizePagination({ pageSize: -10 }).pageSize).toBe(1);
  });

  it("clamps pageSize to MAX_PAGE_SIZE", () => {
    expect(normalizePagination({ pageSize: 9999 }).pageSize).toBe(
      MAX_PAGE_SIZE,
    );
  });
});

describe("dateRangeFilter", () => {
  it("returns undefined when both dates missing", () => {
    expect(dateRangeFilter()).toBeUndefined();
    expect(dateRangeFilter(null, null)).toBeUndefined();
  });

  it("returns gte only when toDate missing", () => {
    const from = new Date("2026-01-01");
    expect(dateRangeFilter(from, null)).toEqual({ gte: from });
  });

  it("returns lte only when fromDate missing", () => {
    const to = new Date("2026-01-31");
    expect(dateRangeFilter(null, to)).toEqual({ lte: to });
  });

  it("returns both when both provided", () => {
    const from = new Date("2026-01-01");
    const to = new Date("2026-01-31");
    expect(dateRangeFilter(from, to)).toEqual({ gte: from, lte: to });
  });
});
