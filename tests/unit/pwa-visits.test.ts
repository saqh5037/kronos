import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock localStorage + window minimal antes de importar el módulo bajo test.
// Evita necesitar jsdom como dep solo para este test.
function createLocalStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k: string) => store.get(k) ?? null,
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    removeItem: (k: string) => store.delete(k),
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
  };
}

vi.stubGlobal("localStorage", createLocalStorageMock());
vi.stubGlobal("window", {
  localStorage: createLocalStorageMock(),
});

// Importar DESPUÉS de stubear globals.
const {
  incrementVisit,
  getVisitCount,
  markOnboarded,
  isOnboarded,
  shouldShowInstallBanner,
} = await import("@/lib/pwa-visits");

beforeEach(() => {
  localStorage.clear();
});

describe("pwa-visits", () => {
  describe("incrementVisit + getVisitCount", () => {
    it("incrementa de 0 → 1 en la primera llamada", () => {
      expect(getVisitCount()).toBe(0);
      incrementVisit();
      expect(getVisitCount()).toBe(1);
    });

    it("no incrementa si la última visita fue hace <30 min (anti refresh)", () => {
      incrementVisit();
      expect(getVisitCount()).toBe(1);
      // Llamada inmediata: el TTL bloquea
      incrementVisit();
      expect(getVisitCount()).toBe(1);
    });

    it("incrementa si la última visita fue hace >30 min", () => {
      incrementVisit();
      // Falsificar timestamp viejo
      const past = Date.now() - 31 * 60 * 1000;
      localStorage.setItem("kronos-last-visit-ts", String(past));
      incrementVisit();
      expect(getVisitCount()).toBe(2);
    });
  });

  describe("markOnboarded + isOnboarded", () => {
    it("flag persiste en localStorage", () => {
      expect(isOnboarded()).toBe(false);
      markOnboarded();
      expect(isOnboarded()).toBe(true);
    });
  });

  describe("shouldShowInstallBanner", () => {
    it("returns false en estado limpio (no visits, no onboarded)", () => {
      expect(shouldShowInstallBanner("")).toBe(false);
    });

    it("returns true con ?install=1 (override explícito)", () => {
      expect(shouldShowInstallBanner("?install=1")).toBe(true);
      expect(shouldShowInstallBanner("?foo=bar&install=1&baz=qux")).toBe(true);
    });

    it("returns true cuando isOnboarded", () => {
      markOnboarded();
      expect(shouldShowInstallBanner("")).toBe(true);
    });

    it("returns true con visits >= 3", () => {
      // 3 visitas con 30+ min entre cada una
      for (let i = 0; i < 3; i++) {
        incrementVisit();
        const past = Date.now() - 31 * 60 * 1000;
        localStorage.setItem("kronos-last-visit-ts", String(past));
      }
      expect(getVisitCount()).toBe(3);
      expect(shouldShowInstallBanner("")).toBe(true);
    });

    it("returns false con visits=2", () => {
      for (let i = 0; i < 2; i++) {
        incrementVisit();
        const past = Date.now() - 31 * 60 * 1000;
        localStorage.setItem("kronos-last-visit-ts", String(past));
      }
      expect(getVisitCount()).toBe(2);
      expect(shouldShowInstallBanner("")).toBe(false);
    });
  });
});
