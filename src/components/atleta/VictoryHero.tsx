import Link from "next/link";
import type { Route } from "next";
import type { ActiveSkillData, SkillTier } from "@/lib/skills/types";

const TIER_VERB: Record<SkillTier, string> = {
  principiante: "Aprende",
  escalado: "Perfecciona",
  rx: "Domina",
};

type Props = {
  athleteFirstName: string;
  athleteTier: SkillTier;
  activeSkill: ActiveSkillData | null;
};

export default function VictoryHero({
  athleteFirstName,
  athleteTier,
  activeSkill,
}: Props) {
  return (
    <section
      style={{
        position: "relative",
        padding: "56px 20px 24px",
        overflow: "hidden",
      }}
    >
      {/* Backdrop cinemático — barbell en sombras geométricas. Opacity baja
          para que el texto y los stats sigan siendo el foco. El bottom
          gradient suaviza el corte hacia el resto de la home. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/images/app/wod-card-default.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.18,
          pointerEvents: "none",
          maskImage:
            "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)",
        }}
      />
      <div
        style={{
          position: "relative",
          fontFamily: "var(--k-font-display)",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.2em",
          color: "var(--k-t3)",
          textTransform: "uppercase",
        }}
      >
        INICIO · {athleteFirstName.toUpperCase()}
      </div>
      <div
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.18em",
          color: "var(--k-accent)",
          textTransform: "uppercase",
          marginTop: 14,
        }}
      >
        TU PRÓXIMA VICTORIA
      </div>

      {activeSkill ? (
        <ActiveHero data={activeSkill} tier={athleteTier} />
      ) : (
        <EmptyHero firstName={athleteFirstName} />
      )}
    </section>
  );
}

function ActiveHero({
  data,
  tier,
}: {
  data: ActiveSkillData;
  tier: SkillTier;
}) {
  const verb = TIER_VERB[tier];
  const skill = data.skill;
  const currentProg = data.progressions.find((p) => p.status === "current");

  return (
    <Link
      href={`/atleta/skills/${skill.id}` as Route}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <h1
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          textTransform: "uppercase",
          color: "var(--k-t1)",
          margin: "4px 0 14px",
        }}
      >
        {verb} <span style={{ color: "var(--k-accent)" }}>{skill.name}</span>
      </h1>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
        <div
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 76,
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
        <div style={{ paddingBottom: 10 }}>
          <div
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.06em",
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
            {data.achievedCount}/{data.totalCount}
          </div>
        </div>
      </div>

      <div
        style={{
          height: 3,
          background: "var(--k-line)",
          borderRadius: 2,
          overflow: "hidden",
          marginTop: 10,
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

      {currentProg && (
        <div
          style={{
            fontFamily: "var(--k-font-body)",
            fontSize: 12,
            color: "var(--k-t2)",
            marginTop: 8,
            lineHeight: 1.4,
          }}
        >
          Hoy: <span style={{ color: "var(--k-t1)" }}>{currentProg.name}</span>
        </div>
      )}

      <div
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.16em",
          color: "var(--k-accent)",
          marginTop: 8,
          textTransform: "uppercase",
        }}
      >
        VER SKILL →
      </div>
    </Link>
  );
}

function EmptyHero({ firstName }: { firstName: string }) {
  return (
    <Link
      href={"/atleta/skills" as Route}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <h1
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          textTransform: "uppercase",
          color: "var(--k-t1)",
          margin: "4px 0 12px",
        }}
      >
        Hola, {firstName}.{" "}
        <span style={{ color: "var(--k-accent)" }}>Elige tu objetivo.</span>
      </h1>
      <p
        style={{
          fontFamily: "var(--k-font-body)",
          fontSize: 13,
          color: "var(--k-t2)",
          lineHeight: 1.5,
          margin: "0 0 12px",
        }}
      >
        Skills es tu mapa de progreso. Elige uno y te decimos qué practicar.
      </p>
      <div
        style={{
          display: "inline-block",
          padding: "10px 16px",
          background: "var(--k-accent)",
          color: "var(--k-accent-on)",
          fontFamily: "var(--k-font-display)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          borderRadius: 10,
          boxShadow: "var(--k-accent-glow)",
        }}
      >
        Ir a Skills →
      </div>
    </Link>
  );
}
