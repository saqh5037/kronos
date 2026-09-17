import Link from "next/link";
import type { Route } from "next";
import { ChevronRight } from "lucide-react";
import type { FeaturedTrophy } from "@/server/actions/athlete-home";
import { badgeIconName } from "@/lib/badges/progress";
import { BadgeGlyph } from "@/app/atleta/logros/_components/BadgeGlyph";

type Props = {
  featured: FeaturedTrophy | null;
};

export default function TrophyStripV4({ featured }: Props) {
  if (!featured) {
    return (
      <Link
        href={"/atleta/logros" as Route}
        style={{
          display: "block",
          padding: "14px 16px",
          background: "var(--k-elevated)",
          border: "1px solid var(--k-line)",
          borderRadius: 14,
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <div
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.16em",
            color: "var(--k-t3)",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          LOGROS
        </div>
        <div
          style={{
            fontFamily: "var(--k-font-body)",
            fontSize: 13,
            color: "var(--k-t2)",
          }}
        >
          Aún sin logros desbloqueados. Explora qué puedes ganar.
        </div>
      </Link>
    );
  }

  const fechaRel = formatRelativeMonth(featured.earnedAt);
  const eyebrow = featured.isThisMonth
    ? "LOGRO DEL MES"
    : `TU ÚLTIMO LOGRO · ${fechaRel.toUpperCase()}`;

  return (
    <Link
      href={`/atleta/logros/${featured.code}` as Route}
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        style={{
          padding: "16px 18px",
          background: "var(--k-surface)",
          border: "1px solid var(--k-accent-line)",
          borderRadius: 16,
          boxShadow: "var(--k-accent-glow)",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <BadgeGlyph icon={badgeIconName(featured.code)} unlocked size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.16em",
              color: "var(--k-accent)",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "var(--k-t1)",
            }}
          >
            {featured.name}
          </div>
          <div
            style={{
              fontFamily: "var(--k-font-body)",
              fontSize: 11,
              color: "var(--k-t2)",
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {featured.description}
          </div>
        </div>
        <ChevronRight
          size={18}
          aria-hidden
          style={{ color: "var(--k-t3)", flexShrink: 0 }}
        />
      </div>
    </Link>
  );
}

function formatRelativeMonth(date: Date): string {
  const formatter = new Intl.DateTimeFormat("es-MX", {
    month: "short",
    year: "numeric",
  });
  return formatter.format(date);
}
