import Link from "next/link";
import type { Route } from "next";
import type { FeaturedTrophy } from "@/server/actions/athlete-home";

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
          LOGROS · TROPHY ROOM
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

  const initial =
    featured.code
      .split("-")
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "★";

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
        <div
          aria-hidden
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "var(--k-accent-soft)",
            border: "1px solid var(--k-accent-line)",
            display: "grid",
            placeItems: "center",
            color: "var(--k-accent)",
            fontFamily: "var(--k-font-display)",
            fontSize: 20,
            fontWeight: 700,
            flexShrink: 0,
            boxShadow: "var(--k-accent-glow)",
          }}
        >
          {initial}
        </div>
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
        <span style={{ color: "var(--k-t3)", fontSize: 18 }}>›</span>
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
