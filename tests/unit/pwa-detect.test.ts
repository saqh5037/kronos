import { describe, it, expect } from "vitest";
import { detectPwaPlatform, buildSafariDeepLink } from "@/lib/pwa-detect";

describe("detectPwaPlatform", () => {
  describe("ios-safari (real Safari iOS)", () => {
    it("iPhone Safari iOS 17", () => {
      const ua =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
      expect(detectPwaPlatform(ua)).toBe("ios-safari");
    });

    it("iPad Safari iPadOS 17", () => {
      const ua =
        "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
      expect(detectPwaPlatform(ua)).toBe("ios-safari");
    });
  });

  describe("ios-other (browsers iOS no-Safari)", () => {
    it("Chrome iOS — bug regresión: el UA TIENE 'Safari' pero también 'CriOS'", () => {
      const ua =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1";
      expect(detectPwaPlatform(ua)).toBe("ios-other");
    });

    it("Firefox iOS", () => {
      const ua =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/120.0 Mobile/15E148 Safari/605.1.15";
      expect(detectPwaPlatform(ua)).toBe("ios-other");
    });

    it("Edge iOS", () => {
      const ua =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/120.0 Mobile/15E148 Safari/605.1.15";
      expect(detectPwaPlatform(ua)).toBe("ios-other");
    });

    it("Gmail in-app browser (WKWebView sin Safari marker)", () => {
      // Algunos in-app browsers omiten "Safari" del UA
      const ua =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
      expect(detectPwaPlatform(ua)).toBe("ios-other");
    });

    it("DuckDuckGo iOS", () => {
      const ua =
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 DuckDuckGo/7";
      expect(detectPwaPlatform(ua)).toBe("ios-other");
    });
  });

  describe("android (resto)", () => {
    it("Android Chrome", () => {
      const ua =
        "Mozilla/5.0 (Linux; Android 14; SM-G990B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
      expect(detectPwaPlatform(ua)).toBe("android");
    });

    it("Desktop Chrome (no es iOS)", () => {
      const ua =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
      expect(detectPwaPlatform(ua)).toBe("android");
    });

    it("Desktop Safari (Mac, no iPhone) — no es iOS", () => {
      const ua =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
      expect(detectPwaPlatform(ua)).toBe("android");
    });
  });
});

describe("buildSafariDeepLink", () => {
  it("convierte https:// a x-safari-https://", () => {
    expect(buildSafariDeepLink("https://kronos-fit.com/atleta")).toBe(
      "x-safari-https://kronos-fit.com/atleta",
    );
  });

  it("convierte http:// (sin s) a x-safari-https:// también (forzar https en Safari)", () => {
    expect(buildSafariDeepLink("http://kronos-fit.com")).toBe(
      "x-safari-https://kronos-fit.com",
    );
  });

  it("preserva path y query string", () => {
    expect(
      buildSafariDeepLink("https://kronos-fit.com/atleta/perfil?tab=stats"),
    ).toBe("x-safari-https://kronos-fit.com/atleta/perfil?tab=stats");
  });
});
