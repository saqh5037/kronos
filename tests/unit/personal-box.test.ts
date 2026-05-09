import { describe, it, expect } from "vitest";
import {
  generatePersonalSlug,
  isPersonalBoxSlug,
  PERSONAL_PREFIX,
  PERSONAL_BOX_NAME,
} from "@/lib/personal-box";

describe("personal-box", () => {
  describe("generatePersonalSlug", () => {
    it("siempre arranca con el prefijo me-", () => {
      const slug = generatePersonalSlug();
      expect(slug.startsWith(PERSONAL_PREFIX)).toBe(true);
    });

    it("tiene 11 chars: me- (3) + 8 hex", () => {
      const slug = generatePersonalSlug();
      expect(slug.length).toBe(11);
      expect(slug).toMatch(/^me-[0-9a-f]{8}$/);
    });

    it("genera slugs distintos en llamadas consecutivas (sanity)", () => {
      const slugs = new Set<string>();
      for (let i = 0; i < 100; i++) slugs.add(generatePersonalSlug());
      expect(slugs.size).toBe(100);
    });
  });

  describe("isPersonalBoxSlug", () => {
    it("true para slugs con prefijo me-", () => {
      expect(isPersonalBoxSlug("me-abc12345")).toBe(true);
      expect(isPersonalBoxSlug("me-")).toBe(true);
      expect(isPersonalBoxSlug("me-test")).toBe(true);
    });

    it("false para slugs sin prefijo me-", () => {
      expect(isPersonalBoxSlug("iron-hands")).toBe(false);
      expect(isPersonalBoxSlug("dominus")).toBe(false);
      expect(isPersonalBoxSlug("megabox")).toBe(false); // arranca con "me" pero no "me-"
      expect(isPersonalBoxSlug("memory-fit")).toBe(false);
      expect(isPersonalBoxSlug("")).toBe(false);
    });
  });

  it("PERSONAL_BOX_NAME es el copy esperado", () => {
    expect(PERSONAL_BOX_NAME).toBe("Mi entrenamiento");
  });
});
