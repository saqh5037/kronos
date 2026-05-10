import Link from "next/link";
import { notFound } from "next/navigation";
import SkillTree from "@/components/atleta/SkillTree";
import { getSkillById, SKILL_CATALOG } from "@/lib/skills/catalog";
import { getMyMovementSkillTree } from "@/server/actions/skill-levels";

export const metadata = { title: "Kronos — Skill" };

export async function generateStaticParams() {
  return SKILL_CATALOG.map((s) => ({ id: s.id }));
}

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const skill = getSkillById(id);
  if (!skill) notFound();

  const tree = await getMyMovementSkillTree(skill.movementSlug).catch(
    () => null,
  );

  return (
    <div className="pb-28 relative">
      <header style={{ padding: "56px 20px 16px" }}>
        <div style={{ marginBottom: 8 }}>
          <Link
            href="/atleta/skills"
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.16em",
              color: "var(--k-t3)",
              textDecoration: "none",
              textTransform: "uppercase",
            }}
          >
            ← SKILLS
          </Link>
        </div>
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
          {tierLabel(skill.tier)}
        </span>
        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            textTransform: "uppercase",
            color: "var(--k-t1)",
            margin: "6px 0 0",
          }}
        >
          {skill.name}
        </h1>
      </header>

      <section style={{ padding: "0 14px 20px" }}>
        {tree && tree.nodes.length > 0 ? (
          <SkillTree movementSlug={skill.movementSlug} nodes={tree.nodes} />
        ) : (
          <div
            style={{
              padding: 20,
              background: "var(--k-surface)",
              border: "1px solid var(--k-line)",
              borderRadius: 14,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "var(--k-font-body)",
                fontSize: 13,
                color: "var(--k-t2)",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Este skill aún no tiene progresiones configuradas. Pídele al coach
              del box que las añada al movimiento{" "}
              <span style={{ color: "var(--k-accent)" }}>
                {skill.movementSlug}
              </span>
              .
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function tierLabel(tier: "principiante" | "escalado" | "rx"): string {
  if (tier === "rx") return "NIVEL RX · ATLETA";
  if (tier === "escalado") return "NIVEL ESCALADO · ATLETA";
  return "NIVEL PRINCIPIANTE · ATLETA";
}
