import { describe, expect, it } from "vitest";
import {
  formatSecondsToTime,
  parseTimeToSeconds,
} from "../../src/lib/event-score";

describe("parseTimeToSeconds", () => {
  it("parses mm:ss format", () => {
    expect(parseTimeToSeconds("32:45")).toBe(32 * 60 + 45);
    expect(parseTimeToSeconds("00:30")).toBe(30);
    expect(parseTimeToSeconds("01:00")).toBe(60);
  });

  it("parses hh:mm:ss format", () => {
    expect(parseTimeToSeconds("1:00:00")).toBe(3600);
    expect(parseTimeToSeconds("1:30:15")).toBe(3600 + 30 * 60 + 15);
    expect(parseTimeToSeconds("0:00:01")).toBe(1);
  });

  it("accepts leading/trailing whitespace", () => {
    expect(parseTimeToSeconds("  32:45  ")).toBe(32 * 60 + 45);
  });

  it("returns null for empty or whitespace-only input", () => {
    expect(parseTimeToSeconds("")).toBeNull();
    expect(parseTimeToSeconds("   ")).toBeNull();
  });

  it("returns null for malformed input", () => {
    expect(parseTimeToSeconds("abc")).toBeNull();
    expect(parseTimeToSeconds("32")).toBeNull();
    expect(parseTimeToSeconds("32:")).toBeNull();
    expect(parseTimeToSeconds(":45")).toBeNull();
    expect(parseTimeToSeconds("1:2:3:4")).toBeNull();
    expect(parseTimeToSeconds("12.5:30")).toBeNull();
  });

  it("returns null when seconds field is >= 60", () => {
    expect(parseTimeToSeconds("12:60")).toBeNull();
    expect(parseTimeToSeconds("12:99")).toBeNull();
  });

  it("returns null when minutes field in hh:mm:ss is >= 60", () => {
    expect(parseTimeToSeconds("1:60:00")).toBeNull();
  });

  it("returns null for negative values", () => {
    expect(parseTimeToSeconds("-1:00")).toBeNull();
    expect(parseTimeToSeconds("1:-30")).toBeNull();
  });

  it("returns null for decimals", () => {
    expect(parseTimeToSeconds("12.5:30")).toBeNull();
    expect(parseTimeToSeconds("12:30.5")).toBeNull();
  });

  it("allows 0:00 as a valid edge case", () => {
    expect(parseTimeToSeconds("0:00")).toBe(0);
    expect(parseTimeToSeconds("00:00")).toBe(0);
  });

  it("handles long Murph times (>40 min)", () => {
    expect(parseTimeToSeconds("47:23")).toBe(47 * 60 + 23);
    expect(parseTimeToSeconds("65:00")).toBe(65 * 60);
  });
});

describe("formatSecondsToTime", () => {
  it("formats <1h as mm:ss with zero padding", () => {
    expect(formatSecondsToTime(0)).toBe("00:00");
    expect(formatSecondsToTime(30)).toBe("00:30");
    expect(formatSecondsToTime(60)).toBe("01:00");
    expect(formatSecondsToTime(1845)).toBe("30:45");
    expect(formatSecondsToTime(3599)).toBe("59:59");
  });

  it("formats >=1h as h:mm:ss", () => {
    expect(formatSecondsToTime(3600)).toBe("1:00:00");
    expect(formatSecondsToTime(3661)).toBe("1:01:01");
    expect(formatSecondsToTime(7200 + 5 * 60 + 9)).toBe("2:05:09");
  });

  it("floors fractional seconds", () => {
    expect(formatSecondsToTime(30.7)).toBe("00:30");
  });

  it("returns 00:00 for non-finite or negative input", () => {
    expect(formatSecondsToTime(-5)).toBe("00:00");
    expect(formatSecondsToTime(Number.NaN)).toBe("00:00");
    expect(formatSecondsToTime(Number.POSITIVE_INFINITY)).toBe("00:00");
  });

  it("round-trips with parseTimeToSeconds", () => {
    const inputs = [0, 30, 60, 599, 1845, 3599, 3600, 3661];
    for (const s of inputs) {
      const formatted = formatSecondsToTime(s);
      expect(parseTimeToSeconds(formatted)).toBe(s);
    }
  });
});
