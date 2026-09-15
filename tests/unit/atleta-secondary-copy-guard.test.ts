/**
 * Copy guard for the athlete secondary surfaces (logros, skills, movimientos,
 * salud, eventos, pagos, ajustes, ayuda plus their components and libs).
 *
 * The audit (2026-09-15) found the same four classes of defect over and over,
 * and a `dialect-guard` test that only covered voseo did not catch them:
 *
 *  - raw Prisma enums rendered in Spanish UI ("UNLIMITED", "MONTHLY",
 *    "ATTENDANCE", "ROUNDS_REPS", …) — everything must go through
 *    `@/lib/labels`;
 *  - voseo forms the existing dialect guard misses ("Intentá", "Editá");
 *  - emoji and unicode arrows used as icons (house rule 1 is lucide only);
 *  - dead or borrowed copy: "TROPHY ROOM", "Atleta Demo", "Bernardo",
 *    "PRONTO".
 *
 * Comment lines are skipped: this guard is about what the athlete reads, and
 * the code comments quote the audit findings on purpose.
 */

import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import path from "path";

const ROOT = process.cwd();

/** Every path this agent owns and every file it renders from. */
const OWNED: string[] = [
  "src/app/atleta/logros",
  "src/app/atleta/skills",
  "src/app/atleta/movimientos",
  "src/app/atleta/salud",
  "src/app/atleta/eventos",
  "src/app/atleta/pagos",
  "src/app/atleta/ajustes",
  "src/app/atleta/ayuda",
  "src/components/atleta/TrophyStrip.tsx",
  "src/components/atleta/TrophyStripV4.tsx",
  "src/components/atleta/VictoryHero.tsx",
  "src/components/atleta/LogrosCatalogCached.tsx",
  "src/components/atleta/SkillTree.tsx",
  "src/components/atleta/BadgeShareCanvas.tsx",
  "src/components/atleta/CoachCardsSection.tsx",
  "src/components/atleta/BodyMetricSection.tsx",
  "src/components/atleta/PayMembershipButton.tsx",
  "src/lib/skills",
  "src/lib/badges",
  "src/lib/skill-tree.ts",
  "src/lib/streak.ts",
  "src/lib/event-score.ts",
  "src/lib/youtube.ts",
  "src/server/achievements",
  "src/server/actions/badges.ts",
  "src/server/actions/skills.ts",
  "src/server/actions/skill-levels.ts",
  "src/server/actions/goals.ts",
  "src/server/actions/body-metrics.ts",
  "src/server/actions/events.ts",
  "src/server/actions/movement-content.ts",
];

function collect(target: string): string[] {
  const full = path.join(ROOT, target);
  if (!existsSync(full)) return [];
  if (statSync(full).isFile()) {
    return full.endsWith(".ts") || full.endsWith(".tsx") ? [full] : [];
  }
  const out: string[] = [];
  for (const entry of readdirSync(full, { withFileTypes: true })) {
    out.push(...collect(path.join(target, entry.name)));
  }
  return out;
}

const FILES = OWNED.flatMap(collect);

/**
 * Drop comment-only lines and the leading `*` of a block comment, so a code
 * comment that quotes an audit finding is not itself a finding.
 */
function isCommentLine(line: string): boolean {
  const t = line.trim();
  return (
    t.startsWith("//") ||
    t.startsWith("/*") ||
    t.startsWith("*") ||
    t.startsWith("*/")
  );
}

type Rule = {
  name: string;
  re: RegExp;
  hint: string;
  /** Lines matching this are legitimate (e.g. the label map itself). */
  allow?: RegExp;
};

/**
 * Raw enum tokens that reached the UI according to the audit. We flag them as
 * bare quoted strings or as JSX text, not as object keys — a label map keyed by
 * `UNLIMITED:` is exactly the fix.
 */
const ENUM_TOKENS = [
  "UNLIMITED",
  "MONTHLY",
  "ANNUAL",
  "DROPIN",
  "PACKAGE",
  "FAMILY",
  "ATTENDANCE",
  "ROUNDS_REPS",
  "HEAVIEST",
  "ATTENDED",
  "NOSHOW",
  "BOOKED",
  "WAITLIST",
  "REFUNDED",
  "PAST_DUE",
  "MERCADOPAGO",
  "IN_APP",
  "MONOSTRUCTURAL",
  "GYMNASTICS",
  "RECONNECT_REQUIRED",
];

const RULES: Rule[] = [
  {
    name: "raw enum token in UI text",
    // `>UNLIMITED<`, `"UNLIMITED"` or `{"MONTHLY"}` — but not `UNLIMITED:` (a
    // map key), `"UNLIMITED" ===` (a comparison) or a type/enum import.
    re: new RegExp(`>\\s*(${ENUM_TOKENS.join("|")})\\s*<`),
    hint: "render enums through @/lib/labels",
  },
  {
    name: "voseo",
    re: /(?<!\p{L})(intentá|editá|quitá|mirá|fijate|acordate|tenés|podés|querés|sabés|hacés|probá|dejá|mandá|guardá|cargá|revisá|anotá|reservá|sumá|volvé|empezá|registrá|llevate)(?!\p{L})/iu,
    hint: "use Mexican-neutral tuteo",
  },
  {
    name: "emoji or pictographic character",
    re: /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/u,
    hint: "use a lucide-react icon",
  },
  {
    name: "unicode arrow or glyph used as an icon",
    re: /[→←↑↓↗↘↖↙▸▾▴◂›‹★☆✕✓✗]/u,
    hint: "use a lucide-react icon",
  },
  {
    name: '"TROPHY ROOM"',
    re: /trophy\s*room/i,
    hint: 'the surface is called "Logros"',
  },
  {
    name: '"Atleta Demo"',
    re: /atleta\s+demo/i,
    hint: "read the identity from the athlete profile",
  },
  {
    name: '"Bernardo" (borrowed persona)',
    re: /(?<!\p{L})bernardo(?!\p{L})/iu,
    hint: "help content must not name another athlete",
  },
  {
    name: '"PRONTO" placeholder',
    re: /(?<!\p{L})pr[óo]ximamente|·\s*pronto(?!\p{L})/iu,
    hint: "ship the control or remove it",
  },
];

describe("athlete secondary surfaces — copy guard", () => {
  it("scans a non-empty owned file set", () => {
    expect(FILES.length).toBeGreaterThan(20);
  });

  for (const rule of RULES) {
    it(`has no ${rule.name}`, () => {
      const hits: string[] = [];

      for (const file of FILES) {
        const lines = readFileSync(file, "utf-8").split("\n");
        lines.forEach((line, i) => {
          if (isCommentLine(line)) return;
          if (rule.allow?.test(line)) return;
          if (!rule.re.test(line)) return;
          hits.push(`${path.relative(ROOT, file)}:${i + 1}  →  ${line.trim()}`);
        });
      }

      expect(hits, `${rule.name} — ${rule.hint}:\n${hits.join("\n")}`).toEqual(
        [],
      );
    });
  }
});
