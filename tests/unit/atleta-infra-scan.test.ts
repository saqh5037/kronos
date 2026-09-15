import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Static hygiene scan over the athlete-infrastructure files (audit §B, §D).
 *
 * Guards four rules that regressed repeatedly in visual sweeps:
 *  1. no emoji / typographic glyphs standing in for icons (screen readers
 *     announce "money bag"; `lucide-react` is the only icon source)
 *  2. no Argentine voseo (CLAUDE.md: neutral Mexican Spanish)
 *  3. no legacy `var(--text|--card|--line|--bg|--accent)` tokens — `--k-*` only
 *  4. no `window.alert` / `window.confirm`
 */

const ROOT = process.cwd();

/** Files and directories owned by the atleta-infra slice. */
const OWNED_ENTRIES = [
  "src/app/atleta/layout.tsx",
  "src/app/atleta/template.tsx",
  "src/app/atleta/error.tsx",
  "src/app/atleta/loading.tsx",
  "src/app/atleta/programa",
  "src/app/atleta/onboarding",
  "src/app/atleta/wod/nuevo/page.tsx",
  "src/app/atleta/wod/foto/page.tsx",
  "src/components/atleta/PushSubscribeButton.tsx",
  "src/components/atleta/InstallPwaBanner.tsx",
  "src/components/atleta/NotificationBell.tsx",
  "src/components/providers",
  "src/components/PwaRegister.tsx",
];

function walk(abs: string, acc: string[]): void {
  const st = statSync(abs);
  if (st.isFile()) {
    if (/\.tsx?$/.test(abs)) acc.push(abs);
    return;
  }
  for (const entry of readdirSync(abs)) {
    walk(join(abs, entry), acc);
  }
}

function ownedFiles(): string[] {
  const acc: string[] = [];
  for (const entry of OWNED_ENTRIES) walk(join(ROOT, entry), acc);
  return acc.sort();
}

const FILES = ownedFiles();

function read(abs: string): string {
  return readFileSync(abs, "utf8");
}

/** Strips block comments, then drops comment-only lines. */
function codeLines(src: string): { line: number; text: string }[] {
  const withoutBlocks = src.replace(/\/\*[\s\S]*?\*\//g, (m) =>
    m.replace(/[^\n]/g, " "),
  );
  return withoutBlocks
    .split("\n")
    .map((text, i) => ({ line: i + 1, text }))
    .filter(({ text }) => {
      const t = text.trim();
      return t !== "" && !t.startsWith("//") && !t.startsWith("*");
    });
}

/**
 * Emoji and typographic glyphs used as icon/affordance substitutes:
 * arrows, misc technical, geometric shapes, dingbats, emoji planes,
 * plus the vertical ellipsis and single angle quotes used as chevrons.
 */
const GLYPH_ICON_RE = new RegExp(
  "[" +
    "\\u{2190}-\\u{21FF}" + // arrows
    "\\u{2300}-\\u{23FF}" + // misc technical
    "\\u{25A0}-\\u{27BF}" + // geometric shapes + misc symbols + dingbats
    "\\u{2B00}-\\u{2BFF}" + // supplemental arrows
    "\\u{FE0F}" + // emoji variation selector
    "\\u{22EE}\\u{2039}\\u{203A}" + // vertical ellipsis, angle quotes
    "\\u{1F000}-\\u{1FAFF}" + // emoji planes
    "]",
  "u",
);

const VOSEO_WORDS = [
  "dale",
  "che",
  "vos",
  "sos",
  "acordate",
  "acordá",
  "fijate",
  "fijáte",
  "pedile",
  "decile",
  "tenés",
  "querés",
  "podés",
  "sabés",
  "ponés",
  "mirá",
  "hacé",
  "andá",
  "mandá",
  "elegí",
  "tocá",
  "probá",
  "revisá",
  "guardá",
  "activá",
  "ingresá",
  "completá",
  "cargá",
  "creá",
  "agregá",
  "usá",
  "dejá",
  "empezá",
  "mové",
  "cambiá",
  "contá",
  "mostrá",
  "apretá",
  "deslizá",
  "tomá",
  "agarrá",
];
const VOSEO_RE = new RegExp(`\\b(${VOSEO_WORDS.join("|")})\\b`, "iu");

/** `var(--text)`, `var(--card-2)`, `var(--fire-line)`… but never `var(--k-*)`. */
const LEGACY_TOKEN_RE =
  /var\(\s*--(?!k-)[a-z0-9-]*(?:text|card|line|bg|accent|track|fire|amber|moss|grad|strain|cyan|blue|red)[a-z0-9-]*\s*\)/i;

describe("atleta-infra owned file set", () => {
  it("resolves the expected files", () => {
    expect(FILES.length).toBeGreaterThan(20);
    expect(FILES.some((f) => f.endsWith("src/app/atleta/layout.tsx"))).toBe(
      true,
    );
  });
});

describe("scan patterns (self-check)", () => {
  it("flags the glyphs this slice removed", () => {
    for (const s of ["🔥", "💡", "📷", "✓", "✕", "← Atrás", "›", "⋮", "⚠️"]) {
      expect(GLYPH_ICON_RE.test(s), s).toBe(true);
    }
  });

  it("does not flag ordinary Spanish punctuation or tokens", () => {
    for (const s of [
      "OCR Gemini · 1 WOD por foto",
      "Mañana a las 18:30 — CrossFit 101",
      "¿Qué hiciste hoy?",
      'style={{ color: "var(--k-t3)" }}',
    ]) {
      expect(GLYPH_ICON_RE.test(s), s).toBe(false);
    }
  });

  it("flags voseo but not neutral Mexican Spanish", () => {
    expect(VOSEO_RE.test("Pedile a tu Box")).toBe(true);
    expect(VOSEO_RE.test("¿Querés entrenar?")).toBe(true);
    expect(VOSEO_RE.test("Pide a tu box que te invite")).toBe(false);
    expect(VOSEO_RE.test("Ya está listo, revisa tu correo")).toBe(false);
  });

  it("flags legacy tokens but not --k-* tokens", () => {
    expect(LEGACY_TOKEN_RE.test("border: 1px solid var(--line)")).toBe(true);
    expect(LEGACY_TOKEN_RE.test("text-[var(--text)]")).toBe(true);
    expect(LEGACY_TOKEN_RE.test("var(--fire-line)")).toBe(true);
    expect(LEGACY_TOKEN_RE.test("border: 1px solid var(--k-line)")).toBe(false);
    expect(LEGACY_TOKEN_RE.test("text-[var(--k-accent-on)]")).toBe(false);
  });
});

describe("no emoji or glyph icons in owned JSX", () => {
  it.each(FILES.map((f) => [relative(ROOT, f), f] as const))(
    "%s",
    (_rel, abs) => {
      const offenders = codeLines(read(abs))
        .filter(({ text }) => GLYPH_ICON_RE.test(text))
        .map(({ line, text }) => `${line}: ${text.trim()}`);
      expect(offenders, offenders.join("\n")).toEqual([]);
    },
  );
});

describe("no Argentine voseo in owned copy", () => {
  it.each(FILES.map((f) => [relative(ROOT, f), f] as const))(
    "%s",
    (_rel, abs) => {
      const offenders = codeLines(read(abs))
        .filter(({ text }) => VOSEO_RE.test(text))
        .map(({ line, text }) => `${line}: ${text.trim()}`);
      expect(offenders, offenders.join("\n")).toEqual([]);
    },
  );
});

describe("no legacy design tokens in owned files", () => {
  it.each(FILES.map((f) => [relative(ROOT, f), f] as const))(
    "%s",
    (_rel, abs) => {
      const offenders = codeLines(read(abs))
        .filter(({ text }) => LEGACY_TOKEN_RE.test(text))
        .map(({ line, text }) => `${line}: ${text.trim()}`);
      expect(offenders, offenders.join("\n")).toEqual([]);
    },
  );
});

// CLAUDE.md: no `window.confirm()` / `window.alert()` — the project ships a
// real modal via `useConfirm()`, so a bare `confirm(...)` from that hook is
// fine; `window.*` dialogs and any `alert(` are not.
const NATIVE_DIALOG_RE =
  /window\.(?:alert|confirm)\s*\(|(?:^|[^.\w])alert\s*\(/;

describe("no native dialogs in owned files", () => {
  it.each(FILES.map((f) => [relative(ROOT, f), f] as const))(
    "%s",
    (_rel, abs) => {
      const offenders = codeLines(read(abs))
        .filter(({ text }) => NATIVE_DIALOG_RE.test(text))
        .map(({ line, text }) => `${line}: ${text.trim()}`);
      expect(offenders, offenders.join("\n")).toEqual([]);
    },
  );
});

/** File contents with comments removed, so prose never satisfies a JSX assertion. */
function readCode(rel: string): string {
  return codeLines(read(join(ROOT, rel)))
    .map(({ text }) => text)
    .join("\n");
}

describe("atleta layout landmarks", () => {
  const layout = readCode("src/app/atleta/layout.tsx");

  it('renders exactly one <main id="main"> wrapper', () => {
    const matches = layout.match(/<main\b/g) ?? [];
    expect(matches).toHaveLength(1);
    expect(layout).toMatch(/<main[^>]*id="main"/);
  });

  it("ships a skip link to that main landmark", () => {
    expect(layout).toContain('href="#main"');
    expect(layout).toContain("Saltar al contenido");
  });

  it("mounts NotificationBell exactly once (not per breakpoint)", () => {
    const matches = layout.match(/<NotificationBell\b/g) ?? [];
    expect(matches).toHaveLength(1);
  });

  it("resolves box mode once and feeds the TabBar", () => {
    expect(layout).toContain("getBoxMode");
    expect(layout).toMatch(/<TabBar[^>]*mode=/);
  });
});

describe("personal-box pages render in place instead of redirecting", () => {
  const PERSONAL_ONLY = [
    "src/app/atleta/programa/page.tsx",
    "src/app/atleta/wod/nuevo/page.tsx",
    "src/app/atleta/wod/foto/page.tsx",
  ];

  // Root cause of "Rendered more hooks than during the previous render":
  // a page-level server redirect() resolved client-side AFTER the layout had
  // already streamed its client shell (audit §C).
  it.each(PERSONAL_ONLY)("%s has no page-level redirect()", (rel) => {
    const src = readCode(rel);
    expect(src).not.toMatch(/\bredirect\s*\(/);
    expect(src).not.toContain('from "next/navigation"');
  });

  it.each(PERSONAL_ONLY)("%s explains the box-athlete case in place", (rel) => {
    const src = read(join(ROOT, rel));
    expect(src).toContain("getBoxMode");
    expect(src).toContain("EmptyStateCTA");
    expect(src).toContain("atletas independientes");
  });
});

describe("MotionProvider honours the OS reduced-motion setting", () => {
  const src = read(join(ROOT, "src/components/providers/MotionProvider.tsx"));

  it('wraps the tree in <MotionConfig reducedMotion="user">', () => {
    expect(src).toContain("MotionConfig");
    expect(src).toMatch(/reducedMotion="user"/);
  });

  it("keeps LazyMotion in strict mode", () => {
    expect(src).toMatch(/<LazyMotion[^>]*strict/);
  });

  it("keeps domMax because layout / layoutId animations are in use", () => {
    expect(src).toContain("domMax");
  });
});

describe("NotificationBell unread badge", () => {
  const src = read(join(ROOT, "src/components/atleta/NotificationBell.tsx"));

  it("uses lime on --k-accent-on, never white on orange", () => {
    expect(src).toContain("var(--k-accent)");
    expect(src).toContain("var(--k-accent-on)");
    expect(src).not.toContain("var(--k-warning)");
    expect(src).not.toMatch(/text-white/);
  });

  it("announces the unread count", () => {
    expect(src).toMatch(/notificaciones sin leer/);
  });

  it("gives the bell a 44px touch target", () => {
    expect(src).toMatch(/44/);
  });
});

describe("InstallPwaBanner respects the notch", () => {
  const src = read(join(ROOT, "src/components/atleta/InstallPwaBanner.tsx"));

  it("offsets the top by env(safe-area-inset-top)", () => {
    expect(src).toContain("env(safe-area-inset-top");
  });

  it("keeps the 7-day dismiss persistence", () => {
    expect(src).toContain("kronos-pwa-dismissed");
    expect(src).toContain("DISMISS_DAYS");
  });
});
