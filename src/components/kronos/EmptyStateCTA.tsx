"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmptyStateCTAProps {
  /**
   * Optional icon/illustration. Render any ReactNode — typically an SVG or emoji.
   * When omitted, the component renders without an icon area.
   */
  icon?: ReactNode;
  /** Primary heading. Keep it short and action-oriented. */
  title: string;
  /** Optional supporting text below the title. */
  description?: string;
  /** Label for the primary CTA button. Required when `ctaHref` or `onCta` is provided. */
  ctaLabel?: string;
  /**
   * Navigate to this URL when the CTA is clicked.
   * Mutually usable with `onCta` — if both are provided, `ctaHref` wins (renders as <Link>).
   * Must be a valid Next.js route string (typed as Route for strict mode compatibility).
   */
  ctaHref?: Route;
  /** Client-side action when the CTA is clicked (used when `ctaHref` is not provided). */
  onCta?: () => void;
  /** Extra class on the outermost container. */
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EmptyStateCTA({
  icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  onCta,
  className,
}: EmptyStateCTAProps) {
  const hasCta = ctaLabel && (ctaHref || onCta);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
      style={{ minHeight: 200 }}
    >
      {/* Icon area */}
      {icon && (
        <div
          aria-hidden
          style={{
            marginBottom: 16,
            width: 56,
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            background: "var(--k-accent-soft)",
            border: "1px solid var(--k-accent-line)",
            color: "var(--k-accent)",
            fontSize: 24,
          }}
        >
          {icon}
        </div>
      )}

      {/* Title */}
      <h3
        style={{
          margin: "0 0 8px",
          fontFamily: "var(--k-font-display)",
          fontSize: 18,
          fontWeight: 700,
          fontStyle: "italic",
          letterSpacing: "-0.01em",
          color: "var(--k-t1)",
          lineHeight: 1.2,
        }}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          style={{
            margin: hasCta ? "0 0 20px" : 0,
            fontFamily: "var(--k-font-body)",
            fontSize: 14,
            lineHeight: 1.5,
            color: "var(--k-t2)",
            maxWidth: 280,
          }}
        >
          {description}
        </p>
      )}

      {/* CTA */}
      {hasCta &&
        (ctaHref ? (
          <Link
            href={ctaHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 44,
              paddingInline: 24,
              paddingBlock: 10,
              borderRadius: 12,
              background: "var(--k-accent)",
              color: "var(--k-accent-on)",
              fontFamily: "var(--k-font-display)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              textDecoration: "none",
              boxShadow: "var(--k-accent-glow)",
              cursor: "pointer",
            }}
          >
            {ctaLabel}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onCta}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 44,
              paddingInline: 24,
              paddingBlock: 10,
              borderRadius: 12,
              background: "var(--k-accent)",
              color: "var(--k-accent-on)",
              fontFamily: "var(--k-font-display)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              border: "none",
              boxShadow: "var(--k-accent-glow)",
              cursor: "pointer",
            }}
          >
            {ctaLabel}
          </button>
        ))}
    </div>
  );
}
