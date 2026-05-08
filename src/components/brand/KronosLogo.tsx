import type { CSSProperties } from "react";

export type KronosLogoVariant =
  | "mark"
  | "mark-outline"
  | "mark-paper"
  | "wordmark"
  | "lockup-h"
  | "lockup-v"
  | "monoline";

type Props = {
  variant?: KronosLogoVariant;
  size?: number;
  className?: string;
  tagline?: string;
  ariaLabel?: string;
};

const PLEX_FAMILY =
  "var(--font-plex-mono), 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

const LIMA = "#C8FF2D";
const INK = "#08080A";
const PAPER = "#F5F5F7";

function MarkSVG({
  size = 56,
  fill,
  textFill,
  stroke,
  strokeWidth = 0,
}: {
  size?: number;
  fill: string;
  textFill: string;
  stroke?: string;
  strokeWidth?: number;
}) {
  const radius = Math.round(size * 0.225);
  const inset = stroke ? Math.max(1, strokeWidth) : 0;
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <rect
        x={inset}
        y={inset}
        width={size - inset * 2}
        height={size - inset * 2}
        rx={radius}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth || undefined}
      />
      <text
        x={size / 2}
        y={size * 0.7}
        textAnchor="middle"
        fontFamily={PLEX_FAMILY}
        fontSize={Math.round(size * 0.66)}
        fontWeight={700}
        letterSpacing={-Math.round(size * 0.03)}
        fill={textFill}
      >
        K
      </text>
    </svg>
  );
}

function Wordmark({
  size = 32,
  color = "currentColor",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <span
      style={{
        fontFamily: PLEX_FAMILY,
        fontWeight: 700,
        letterSpacing: "-0.04em",
        lineHeight: 1,
        fontSize: size,
        color,
        whiteSpace: "nowrap",
      }}
    >
      KRONOS
    </span>
  );
}

export default function KronosLogo({
  variant = "mark",
  size,
  className,
  tagline,
  ariaLabel = "Kronos",
}: Props) {
  const wrapStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    lineHeight: 1,
  };

  if (variant === "mark") {
    return (
      <span className={className} style={wrapStyle} aria-label={ariaLabel}>
        <MarkSVG size={size ?? 56} fill={LIMA} textFill={INK} />
      </span>
    );
  }

  if (variant === "mark-outline") {
    return (
      <span
        className={className}
        style={{ ...wrapStyle, color: "currentColor" }}
        aria-label={ariaLabel}
      >
        <MarkSVG
          size={size ?? 56}
          fill="none"
          textFill="currentColor"
          stroke="currentColor"
          strokeWidth={2}
        />
      </span>
    );
  }

  if (variant === "mark-paper") {
    return (
      <span className={className} style={wrapStyle} aria-label={ariaLabel}>
        <MarkSVG size={size ?? 56} fill={INK} textFill={PAPER} />
      </span>
    );
  }

  if (variant === "wordmark") {
    return (
      <span
        className={className}
        style={{ ...wrapStyle, color: "currentColor" }}
        aria-label={ariaLabel}
      >
        <Wordmark size={size ?? 32} />
      </span>
    );
  }

  if (variant === "lockup-h") {
    const markSize = size ?? 38;
    const wordSize = Math.round(markSize * 0.58);
    return (
      <span
        className={className}
        style={{
          ...wrapStyle,
          gap: Math.round(markSize * 0.37),
          color: "currentColor",
        }}
        aria-label={ariaLabel}
      >
        <MarkSVG size={markSize} fill={LIMA} textFill={INK} />
        <span
          style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}
        >
          <Wordmark size={wordSize} />
          {tagline ? (
            <span
              style={{
                fontFamily: PLEX_FAMILY,
                fontSize: Math.max(9, Math.round(wordSize * 0.4)),
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--k-t3, #54545C)",
              }}
            >
              {tagline}
            </span>
          ) : null}
        </span>
      </span>
    );
  }

  if (variant === "lockup-v") {
    const markSize = size ?? 84;
    const wordSize = Math.round(markSize * 0.36);
    return (
      <span
        className={className}
        style={{
          ...wrapStyle,
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          color: "currentColor",
        }}
        aria-label={ariaLabel}
      >
        <MarkSVG size={markSize} fill={LIMA} textFill={INK} />
        <Wordmark size={wordSize} />
        {tagline ? (
          <span
            style={{
              fontFamily: PLEX_FAMILY,
              fontSize: Math.max(9, Math.round(wordSize * 0.34)),
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--k-t2, #8A8A94)",
            }}
          >
            {tagline}
          </span>
        ) : null}
      </span>
    );
  }

  if (variant === "monoline") {
    const markSize = size ?? 28;
    const wordSize = Math.round(markSize * 0.7);
    return (
      <span
        className={className}
        style={{
          ...wrapStyle,
          gap: Math.round(markSize * 0.5),
          color: "currentColor",
        }}
        aria-label={ariaLabel}
      >
        <MarkSVG
          size={markSize}
          fill="none"
          textFill="currentColor"
          stroke="currentColor"
          strokeWidth={1.5}
        />
        <Wordmark size={wordSize} />
      </span>
    );
  }

  return null;
}
