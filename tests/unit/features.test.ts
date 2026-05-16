import { describe, expect, it } from "vitest";
import {
  ALL_FEATURE_FLAGS,
  boxHasFeature,
  getEnabledFeatures,
  withFeature,
} from "@/lib/features";

describe("features primitive", () => {
  describe("boxHasFeature", () => {
    it("returns false when box.features is missing", () => {
      expect(boxHasFeature({}, "hyrox")).toBe(false);
    });

    it("returns false when box.features is null", () => {
      expect(boxHasFeature({ features: null }, "hyrox")).toBe(false);
    });

    it("returns false when box.features is an array", () => {
      expect(boxHasFeature({ features: ["hyrox"] }, "hyrox")).toBe(false);
    });

    it("returns true when feature is explicitly enabled", () => {
      expect(boxHasFeature({ features: { hyrox: true } }, "hyrox")).toBe(true);
    });

    it("returns false when feature is explicitly disabled", () => {
      expect(boxHasFeature({ features: { hyrox: false } }, "hyrox")).toBe(
        false,
      );
    });

    it("returns false for non-boolean truthy values", () => {
      expect(boxHasFeature({ features: { hyrox: "yes" } }, "hyrox")).toBe(
        false,
      );
      expect(boxHasFeature({ features: { hyrox: 1 } }, "hyrox")).toBe(false);
    });

    it("ignores unknown flags in JSON", () => {
      expect(boxHasFeature({ features: { unknown_flag: true } }, "hyrox")).toBe(
        false,
      );
    });
  });

  describe("getEnabledFeatures", () => {
    it("returns empty array when features is missing", () => {
      expect(getEnabledFeatures({})).toEqual([]);
    });

    it("returns only flags set to true", () => {
      const enabled = getEnabledFeatures({
        features: { hyrox: true, mm_athlete: false, yoga: true },
      });
      expect(enabled).toEqual(expect.arrayContaining(["hyrox", "yoga"]));
      expect(enabled).not.toContain("mm_athlete");
    });

    it("filters out unknown flag names", () => {
      const enabled = getEnabledFeatures({
        features: { hyrox: true, totally_made_up: true },
      });
      expect(enabled).toEqual(["hyrox"]);
    });
  });

  describe("withFeature", () => {
    it("enables a flag when starting from empty", () => {
      const next = withFeature({}, "hyrox", true);
      expect(next).toEqual({ hyrox: true });
    });

    it("preserves other flags", () => {
      const next = withFeature(
        { features: { mm_athlete: true } },
        "hyrox",
        true,
      );
      expect(next).toEqual({ mm_athlete: true, hyrox: true });
    });

    it("excludes false flags from output (clean representation)", () => {
      const next = withFeature({ features: { hyrox: true } }, "hyrox", false);
      expect(next.hyrox).toBe(false);
    });
  });

  describe("ALL_FEATURE_FLAGS", () => {
    it("contains the documented MVP flags", () => {
      expect(ALL_FEATURE_FLAGS).toContain("hyrox");
      expect(ALL_FEATURE_FLAGS).toContain("mm_athlete");
      expect(ALL_FEATURE_FLAGS).toContain("yoga");
      expect(ALL_FEATURE_FLAGS).toContain("pilates");
    });
  });
});
