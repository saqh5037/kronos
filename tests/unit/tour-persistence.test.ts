import { describe, it, expect } from "vitest";
import { markTourSeen } from "../../src/components/tour/persistence";

describe("markTourSeen", () => {
  it("writes the storage key with an ISO timestamp", () => {
    const store = new Map<string, string>();
    const fakeStorage = {
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
    };
    markTourSeen(
      "kronos_tour_home_v1",
      fakeStorage,
      new Date("2026-06-01T00:00:00.000Z"),
    );
    expect(store.get("kronos_tour_home_v1")).toBe("2026-06-01T00:00:00.000Z");
  });

  it("swallows storage errors silently (private mode / blocked)", () => {
    const throwingStorage = {
      setItem: () => {
        throw new Error("QuotaExceeded");
      },
    };
    expect(() =>
      markTourSeen("kronos_tour_reservar_v1", throwingStorage),
    ).not.toThrow();
  });

  it("is a no-op when no storage is available (SSR / node)", () => {
    expect(() =>
      markTourSeen("kronos_tour_perfil_v1", undefined),
    ).not.toThrow();
  });
});
