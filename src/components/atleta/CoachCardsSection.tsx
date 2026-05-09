"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Route } from "next";
import { dismissCoachCard } from "@/server/actions/coach-cards";
import type { CoachCardType } from "@prisma/client";

export type CoachCard = {
  id: string;
  type: CoachCardType;
  title: string;
  body: string;
  ctaLabel: string | null;
  ctaHref: string | null;
};

type Props = {
  cards: CoachCard[];
};

export default function CoachCardsSection({ cards }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const visible = cards.filter((c) => !dismissed.has(c.id));
  if (visible.length === 0) return null;

  function handleDismiss(cardId: string) {
    setDismissed((prev) => {
      const n = new Set(prev);
      n.add(cardId);
      return n;
    });
    startTransition(async () => {
      await dismissCoachCard(cardId).catch(() => {
        // si falla, revertimos en próximo render por revalidate
      });
    });
  }

  return (
    <section
      data-testid="coach-cards-section"
      style={{
        padding: "0 14px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <p
        className="k-eyebrow"
        style={{
          color: "var(--k-t3)",
          margin: "0 0 4px",
          paddingLeft: 2,
        }}
      >
        Tu coach esta semana
      </p>
      {visible.map((card) => (
        <article
          key={card.id}
          data-testid="coach-card"
          data-type={card.type}
          style={{
            position: "relative",
            padding: 14,
            borderRadius: 14,
            background: bgForType(card.type),
            border: borderForType(card.type),
            boxShadow:
              card.type === "CELEBRATION" ? "var(--k-accent-glow)" : "none",
          }}
        >
          <button
            type="button"
            aria-label="Descartar"
            onClick={() => handleDismiss(card.id)}
            disabled={isPending}
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 44,
              height: 44,
              borderRadius: 22,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--k-t3)",
            }}
          >
            <svg
              width={14}
              height={14}
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            >
              <path d="M3 3l8 8M11 3l-8 8" />
            </svg>
          </button>

          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <CardGlyph type={card.type} />
            <div style={{ flex: 1, paddingRight: 40 }}>
              <h3
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: textForType(card.type),
                  margin: "0 0 4px",
                  letterSpacing: "0.01em",
                }}
              >
                {card.title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--k-font-body)",
                  fontSize: 12,
                  color: "var(--k-t2)",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {card.body}
              </p>
              {card.ctaLabel && card.ctaHref && (
                <Link
                  href={card.ctaHref as Route}
                  className="k-tap"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    marginTop: 8,
                    marginLeft: -10,
                    minHeight: 44,
                    padding: "10px 10px",
                    fontFamily: "var(--k-font-display)",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--k-accent)",
                    textDecoration: "none",
                  }}
                >
                  {card.ctaLabel} →
                </Link>
              )}
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

function bgForType(t: CoachCardType): string {
  if (t === "CELEBRATION") return "var(--k-accent-soft)";
  return "var(--k-surface)";
}

function borderForType(t: CoachCardType): string {
  if (t === "CELEBRATION") return "1px solid var(--k-accent-line)";
  return "1px solid var(--k-line)";
}

function textForType(t: CoachCardType): string {
  if (t === "CELEBRATION") return "var(--k-accent)";
  return "var(--k-t1)";
}

function CardGlyph({ type }: { type: CoachCardType }) {
  const stroke = type === "CELEBRATION" ? "var(--k-accent)" : "var(--k-t2)";
  if (type === "CELEBRATION") {
    return (
      <svg
        width={20}
        height={20}
        viewBox="0 0 20 20"
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0, marginTop: 1 }}
      >
        <path d="M10 2L12 7l5 0.5-4 3.5 1 5L10 13l-4 3 1-5L3 7.5 8 7z" />
      </svg>
    );
  }
  if (type === "STAGNATION") {
    return (
      <svg
        width={20}
        height={20}
        viewBox="0 0 20 20"
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0, marginTop: 1 }}
      >
        <circle cx={10} cy={10} r={7} />
        <path d="M10 6v4l2 2" />
      </svg>
    );
  }
  if (type === "NEXT_UNLOCK") {
    return (
      <svg
        width={20}
        height={20}
        viewBox="0 0 20 20"
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0, marginTop: 1 }}
      >
        <rect x={4} y={9} width={12} height={9} rx={1.5} />
        <path d="M7 9V6a3 3 0 0 1 6 0" />
      </svg>
    );
  }
  // AVOIDANCE_PATTERN
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      stroke={stroke}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, marginTop: 1 }}
    >
      <path d="M10 2v6M10 18v-2M2 10h6M18 10h-2" />
      <circle cx={10} cy={10} r={3} />
    </svg>
  );
}
