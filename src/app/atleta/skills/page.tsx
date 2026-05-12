import Link from "next/link";
import type { Route } from "next";
import KCard from "@/components/kronos/KCard";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";
import RevealOnScroll from "@/components/kronos/RevealOnScroll";
import {
  getActiveSkillForAthlete,
  getSkillCatalogForAthlete,
  getSkillContextualPRPredictions,
} from "@/server/actions/skills";
import type { getTop3PRPredictions } from "@/server/actions/ai";

import type {
  ActiveSkillData,
  CatalogSkill,
  SkillTier,
} from "@/lib/skills/types";
import type { ProgressionNode } from "@/lib/skill-tree";

export const metadata = { title: "Kronos — Skills" };

const TIER_VERB: Record<SkillTier, string> = {
  principiante: "Aprende",
  escalado: "Perfecciona",
  rx: "Domina",
};

const TIER_LABEL: Record<
  SkillTier,
  { label: string; color: string; bg: string }
> = {
  principiante: {
    label: "PRINCIPIANTE",
    color: "var(--k-t2)",
    bg: "var(--k-elevated)",
  },
  escalado: {
    label: "ESCALADO",
    color: "var(--k-accent)",
    bg: "var(--k-accent-soft)",
  },
  rx: { label: "RX", color: "var(--k-accent)", bg: "var(--k-accent-soft)" },
};

export default async function SkillsPage() {
  const [activeSkill, catalogResult] = await Promise.all([
    getActiveSkillForAthlete().catch(() => null),
    getSkillCatalogForAthlete().catch(() => ({
      athleteTier: "principiante" as SkillTier,
      catalog: [] as CatalogSkill[],
    })),
  ]);

  const prPredictions: Awaited<ReturnType<typeof getTop3PRPredictions>> =
    activeSkill
      ? await getSkillContextualPRPredictions(activeSkill.skill.id).catch(
          () => [],
        )
      : [];

  const tierCfg = TIER_LABEL[catalogResult.athleteTier];

  return (
    <div className="pb-28 relative">
      <header style={{ padding: "56px 20px 0" }}>
        <div className="flex items-center gap-2 mb-3">
          <span
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.2em",
              color: "var(--k-t3)",
              textTransform: "uppercase",
            }}
          >
            SKILLS · ATLETA
          </span>
          <span
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.14em",
              padding: "2px 7px",
              borderRadius: 4,
              background: tierCfg.bg,
              color: tierCfg.color,
              border: `1px solid currentColor`,
            }}
          >
            {tierCfg.label}
          </span>
        </div>
      </header>

      {activeSkill ? (
        <ActiveSkillView
          data={activeSkill}
          tier={catalogResult.athleteTier}
          catalog={catalogResult.catalog.filter(
            (c) => c.id !== activeSkill.skill.id,
          )}
          prPredictions={prPredictions}
        />
      ) : (
        <EmptySkillView catalog={catalogResult.catalog} />
      )}
    </div>
  );
}

function ActiveSkillView({
  data,
  tier,
  catalog,
  prPredictions,
}: {
  data: ActiveSkillData;
  tier: SkillTier;
  catalog: CatalogSkill[];
  prPredictions: Awaited<ReturnType<typeof getTop3PRPredictions>>;
}) {
  const tierVerb = TIER_VERB[tier];
  const skill = data.skill;

  const currentProg = data.progressions.find((p) => p.status === "current");
  const nextLocked = data.progressions.find((p) => p.status === "locked");

  return (
    <>
      <section style={{ padding: "0 20px 32px" }}>
        <div
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.2em",
            color: "var(--k-t3)",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          TU PRÓXIMA VICTORIA
        </div>

        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            textTransform: "uppercase",
            color: "var(--k-t1)",
            margin: "0 0 20px",
          }}
        >
          {tierVerb}{" "}
          <span style={{ color: "var(--k-accent)" }}>{skill.name}</span>
        </h1>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
          <div
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 96,
              fontWeight: 700,
              letterSpacing: "-0.06em",
              lineHeight: 1,
              color: "var(--k-accent)",
              fontFeatureSettings: '"tnum" 1',
              textShadow:
                data.progressPercent > 0 ? "var(--k-accent-glow)" : "none",
            }}
          >
            {data.progressPercent}
          </div>
          <div style={{ paddingBottom: 14 }}>
            <div
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--k-t3)",
              }}
            >
              %
            </div>
            <div
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--k-t3)",
                marginTop: 2,
              }}
            >
              PROGRESO
            </div>
          </div>
        </div>

        <div
          style={{
            height: 4,
            background: "var(--k-line)",
            borderRadius: 2,
            overflow: "hidden",
            marginTop: 12,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${data.progressPercent}%`,
              background: "var(--k-accent)",
              borderRadius: 2,
              transition: "width 800ms ease",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 6,
          }}
        >
          <span
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.14em",
              color: "var(--k-t3)",
            }}
          >
            {data.achievedCount}/{data.totalCount} PROGRESIONES
          </span>
          {data.progressPercent === 0 && (
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.12em",
                color: "var(--k-accent)",
              }}
            >
              EMPIEZA HOY
            </span>
          )}
        </div>

        {currentProg && (
          <div
            style={{
              marginTop: 20,
              padding: "12px 14px",
              background: "var(--k-surface)",
              border: "1px solid var(--k-accent-line)",
              borderRadius: 14,
              boxShadow: "var(--k-accent-glow)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.18em",
                color: "var(--k-accent)",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              FOCO DE HOY
            </div>
            <div
              style={{
                fontFamily: "var(--k-font-body)",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--k-t1)",
              }}
            >
              {currentProg.name}
            </div>
            {currentProg.description && (
              <div
                style={{
                  fontFamily: "var(--k-font-body)",
                  fontSize: 12,
                  color: "var(--k-t2)",
                  marginTop: 3,
                  lineHeight: 1.4,
                }}
              >
                {currentProg.description}
              </div>
            )}
          </div>
        )}

        {nextLocked && (
          <div
            style={{
              marginTop: 8,
              padding: "10px 14px",
              background: "var(--k-elevated)",
              border: "1px solid var(--k-line)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              gap: 10,
              opacity: 0.7,
            }}
          >
            <svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--k-t3)"
              strokeWidth={2}
            >
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            <div>
              <div
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  color: "var(--k-t3)",
                  textTransform: "uppercase",
                }}
              >
                SIGUIENTE
              </div>
              <div
                style={{
                  fontFamily: "var(--k-font-body)",
                  fontSize: 12,
                  color: "var(--k-t3)",
                }}
              >
                {nextLocked.name}
              </div>
            </div>
          </div>
        )}
      </section>

      <RevealOnScroll variant="fade-up" className="px-3.5 mb-4">
        <KCard>
          <div className="p-4">
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <span className="k-eyebrow" style={{ color: "var(--k-t2)" }}>
                PROGRESIONES
              </span>
              <Link
                href={`/atleta/skills/${skill.id}` as Route}
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  color: "var(--k-accent)",
                  textDecoration: "none",
                }}
              >
                VER COMPLETO →
              </Link>
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {data.progressions.map((p, i) => (
                <ProgressionRow
                  key={p.slug}
                  progression={p}
                  index={i}
                  total={data.progressions.length}
                />
              ))}
            </div>
          </div>
        </KCard>
      </RevealOnScroll>

      {prPredictions && prPredictions.length > 0 && (
        <RevealOnScroll variant="fade-up" className="px-3.5 mb-4">
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 8,
              padding: "0 4px",
            }}
          >
            <span className="k-eyebrow" style={{ color: "var(--k-t2)" }}>
              TU PLAN · KRONOS AI
            </span>
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: "var(--k-t3)",
              }}
            >
              REGRESIÓN + IA
            </span>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {prPredictions.slice(0, 2).map((card) => (
              <KCard key={card.movementId}>
                <div
                  style={{
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--k-font-display)",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--k-t1)",
                      }}
                    >
                      {card.movementName}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--k-font-body)",
                        fontSize: 11,
                        color: "var(--k-t2)",
                        marginTop: 2,
                        lineHeight: 1.4,
                      }}
                    >
                      {card.narrative}
                    </div>
                  </div>
                </div>
              </KCard>
            ))}
          </div>
        </RevealOnScroll>
      )}

      {catalog.length > 0 && (
        <RevealOnScroll variant="fade-up" className="px-3.5 mb-4">
          <span
            className="k-eyebrow"
            style={{ color: "var(--k-t2)", display: "block", marginBottom: 10 }}
          >
            OTROS SKILLS
          </span>
          <AnimatedSection className="grid gap-2">
            {catalog.map((s) => (
              <AnimatedItem key={s.id}>
                <SkillCatalogCard skill={s} />
              </AnimatedItem>
            ))}
          </AnimatedSection>
        </RevealOnScroll>
      )}
    </>
  );
}

function EmptySkillView({ catalog }: { catalog: CatalogSkill[] }) {
  return (
    <>
      <section style={{ padding: "24px 20px 40px" }}>
        <div
          style={{
            padding: 28,
            background: "var(--k-surface)",
            border: "1px solid var(--k-accent-line)",
            borderRadius: 20,
            boxShadow: "var(--k-accent-glow)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--k-accent-soft)",
              border: "1px solid var(--k-accent-line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "var(--k-accent-glow)",
            }}
          >
            <svg
              width={28}
              height={28}
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--k-accent)"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2l3 6 6 1-4 5 1 6-6-3-6 3 1-6-4-5 6-1z" />
            </svg>
          </div>

          <h1
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--k-t1)",
              margin: "0 0 8px",
            }}
          >
            ¿En qué quieres mejorar?
          </h1>
          <p
            style={{
              fontFamily: "var(--k-font-body)",
              fontSize: 14,
              color: "var(--k-t2)",
              lineHeight: 1.5,
              margin: "0 0 20px",
            }}
          >
            Elige un skill y te decimos exactamente qué practicar para lograrlo.
          </p>

          <div
            style={{
              display: "inline-block",
              padding: "12px 20px",
              background: "var(--k-accent)",
              color: "var(--k-accent-on)",
              fontFamily: "var(--k-font-display)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              borderRadius: 12,
              boxShadow: "var(--k-accent-glow)",
            }}
          >
            Elige un objetivo ↓
          </div>
        </div>
      </section>

      {catalog.length > 0 && (
        <section style={{ padding: "0 14px 16px" }}>
          <span
            className="k-eyebrow"
            style={{
              color: "var(--k-t2)",
              display: "block",
              marginBottom: 12,
            }}
          >
            {catalog.length} SKILLS DISPONIBLES
          </span>
          <AnimatedSection className="grid gap-2">
            {catalog.map((s) => (
              <AnimatedItem key={s.id}>
                <SkillCatalogCard skill={s} selectable />
              </AnimatedItem>
            ))}
          </AnimatedSection>
        </section>
      )}
    </>
  );
}

function ProgressionRow({
  progression,
  index,
  total,
}: {
  progression: ProgressionNode;
  index: number;
  total: number;
}) {
  const isAchieved = progression.status === "achieved";
  const isCurrent = progression.status === "current";
  const isLocked = progression.status === "locked";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 0",
        borderBottom: index < total - 1 ? "1px solid var(--k-line)" : undefined,
        opacity: isLocked ? 0.45 : 1,
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: isAchieved
            ? "var(--k-surface)"
            : isLocked
              ? "transparent"
              : "var(--k-surface)",
          border: isAchieved
            ? "2px solid var(--k-accent-line)"
            : isCurrent
              ? "2px solid var(--k-accent)"
              : "1.5px solid var(--k-line)",
        }}
      >
        {isAchieved && (
          <svg
            width={13}
            height={13}
            viewBox="0 0 20 20"
            fill="none"
            stroke="var(--k-accent)"
            strokeWidth={2.5}
          >
            <path d="M4 10l4 4 8-8" />
          </svg>
        )}
        {isCurrent && (
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--k-accent)",
            }}
          />
        )}
        {isLocked && (
          <svg
            width={11}
            height={11}
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--k-t3)"
            strokeWidth={2}
          >
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--k-font-body)",
            fontSize: 13,
            fontWeight: isCurrent ? 700 : 500,
            color: isAchieved
              ? "var(--k-t1)"
              : isCurrent
                ? "var(--k-t1)"
                : "var(--k-t3)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {progression.name}
        </div>
        {isCurrent && (
          <div
            style={{
              fontFamily: "var(--k-font-body)",
              fontSize: 11,
              color: "var(--k-accent)",
              marginTop: 1,
            }}
          >
            ← trabaja esto hoy
          </div>
        )}
      </div>

      <div
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 11,
          fontWeight: 700,
          color: "var(--k-t3)",
          letterSpacing: "0.04em",
          opacity: 0.5,
        }}
      >
        {index + 1}
      </div>
    </div>
  );
}

function SkillCatalogCard({
  skill,
  selectable = false,
}: {
  skill: CatalogSkill;
  selectable?: boolean;
}) {
  const isCompleted = skill.status === "completed";
  const isActive = skill.status === "active";
  const isLocked = skill.status === "locked";

  const statusConfig = {
    completed: { label: "COMPLETADO", color: "var(--k-accent)" },
    active: {
      label: `${skill.progressPercent ?? 0}%`,
      color: "var(--k-accent)",
    },
    available: { label: "DISPONIBLE", color: "var(--k-t3)" },
    locked: { label: skill.lockReason ?? "BLOQUEADO", color: "var(--k-t3)" },
  }[skill.status];

  const inner = (
    <div
      className={selectable && !isLocked ? "k-tap" : undefined}
      style={{
        padding: "13px 16px",
        background: isCompleted
          ? "var(--k-accent-soft)"
          : isActive
            ? "var(--k-surface)"
            : "var(--k-elevated)",
        border: `1px solid ${
          isCompleted
            ? "var(--k-accent-line)"
            : isActive
              ? "var(--k-accent-line)"
              : "var(--k-line)"
        }`,
        borderRadius: 14,
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity: isLocked ? 0.55 : 1,
        boxShadow: isActive ? "var(--k-accent-glow)" : "none",
        cursor: selectable && !isLocked ? "pointer" : "default",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 13,
            fontWeight: 700,
            color: isCompleted || isActive ? "var(--k-t1)" : "var(--k-t2)",
            letterSpacing: "0.02em",
          }}
        >
          {skill.name}
        </div>

        {isActive && skill.progressPercent !== undefined && (
          <div
            style={{
              height: 3,
              background: "var(--k-line)",
              borderRadius: 2,
              marginTop: 6,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${skill.progressPercent}%`,
                background: "var(--k-accent)",
                borderRadius: 2,
              }}
            />
          </div>
        )}
      </div>

      <div
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.12em",
          color: statusConfig.color,
          textAlign: "right",
          whiteSpace: "nowrap",
          maxWidth: 110,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {statusConfig.label}
      </div>
    </div>
  );

  if (isLocked) return inner;

  return (
    <Link
      href={`/atleta/skills/${skill.id}` as Route}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      {inner}
    </Link>
  );
}
