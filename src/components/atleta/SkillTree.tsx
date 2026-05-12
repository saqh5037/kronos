"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  markMyProgressionStatus,
  unmarkMyProgression,
} from "@/server/actions/skill-levels";
import type { ProgressionNode } from "@/lib/skill-tree";

type Props = {
  movementId: string;
  movementSlug: string;
  nodes: ProgressionNode[];
};

export default function SkillTree({ movementId, movementSlug, nodes }: Props) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [unlockedBadge, setUnlockedBadge] = useState<{
    name: string;
    description: string;
  } | null>(null);
  const [xpToast, setXpToast] = useState<number | null>(null);

  function handleMark(progressionSlug: string, status: "CURRENT" | "ACHIEVED") {
    setErrorMsg(null);
    setPendingSlug(progressionSlug);
    startTransition(async () => {
      const r = await markMyProgressionStatus({
        movementSlug,
        progressionSlug,
        status,
      });
      if (!r.ok) {
        setErrorMsg(translateReason(r.reason));
      } else {
        if (r.xpAwarded > 0) {
          setXpToast(r.xpAwarded);
          setTimeout(() => setXpToast(null), 2400);
        }
        if (r.unlockedBadges.length > 0) {
          const first = r.unlockedBadges[0];
          if (first) {
            setUnlockedBadge({
              name: first.name,
              description: first.description,
            });
            setTimeout(() => setUnlockedBadge(null), 5000);
          }
        }
      }
      setPendingSlug(null);
    });
  }

  function handleUnmark(progressionSlug: string) {
    setErrorMsg(null);
    setPendingSlug(progressionSlug);
    startTransition(async () => {
      const r = await unmarkMyProgression({ movementSlug, progressionSlug });
      if (!r.ok) setErrorMsg(translateReason(r.reason));
      setPendingSlug(null);
    });
  }

  return (
    <div
      data-testid="skill-tree"
      style={{
        display: "grid",
        gap: 8,
        gridTemplateColumns: "minmax(0, 1fr)",
      }}
    >
      {nodes.map((node, idx) => (
        <SkillNode
          key={node.slug}
          node={node}
          isLast={idx === nodes.length - 1}
          disabled={isPending}
          pending={pendingSlug === node.slug}
          movementId={movementId}
          onMarkCurrent={() => handleMark(node.slug, "CURRENT")}
          onMarkAchieved={() => handleMark(node.slug, "ACHIEVED")}
          onUnmark={() => handleUnmark(node.slug)}
        />
      ))}
      {errorMsg && (
        <div
          role="alert"
          style={{
            padding: "8px 12px",
            background: "var(--k-elevated)",
            border: "1px solid var(--k-danger)",
            borderRadius: 8,
            color: "var(--k-danger)",
            fontFamily: "var(--k-font-body)",
            fontSize: 12,
          }}
        >
          {errorMsg}
        </div>
      )}
      {xpToast !== null && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            top: 60,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 60,
            padding: "10px 18px",
            background: "var(--k-accent)",
            color: "var(--k-accent-on)",
            borderRadius: 999,
            boxShadow: "var(--k-accent-glow)",
            fontFamily: "var(--k-font-display)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            pointerEvents: "none",
            animation: "k-pulse-glow 2.4s ease-out",
          }}
        >
          +{xpToast} XP
        </div>
      )}
      {unlockedBadge && (
        <div
          role="status"
          data-testid="skill-badge-toast"
          style={{
            padding: "12px 14px",
            background: "var(--k-accent-soft)",
            border: "1px solid var(--k-accent-line)",
            borderRadius: 12,
            boxShadow: "var(--k-accent-glow)",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <svg
            width={22}
            height={22}
            viewBox="0 0 22 22"
            fill="none"
            stroke="var(--k-accent)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0, marginTop: 1 }}
          >
            <path d="M11 2l3 6 6 1-4 5 1 6-6-3-6 3 1-6-4-5 6-1z" />
          </svg>
          <div>
            <div
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--k-accent)",
              }}
            >
              Logro desbloqueado
            </div>
            <div
              style={{
                fontFamily: "var(--k-font-body)",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--k-t1)",
                marginTop: 2,
              }}
            >
              {unlockedBadge.name}
            </div>
            <div
              style={{
                fontFamily: "var(--k-font-body)",
                fontSize: 11,
                color: "var(--k-t2)",
                marginTop: 2,
              }}
            >
              {unlockedBadge.description}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SkillNode({
  node,
  isLast,
  disabled,
  pending,
  movementId,
  onMarkCurrent,
  onMarkAchieved,
  onUnmark,
}: {
  node: ProgressionNode;
  isLast: boolean;
  disabled: boolean;
  pending: boolean;
  movementId: string;
  onMarkCurrent: () => void;
  onMarkAchieved: () => void;
  onUnmark: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isAchieved = node.status === "achieved";
  const isCurrent = node.status === "current";
  const isLocked = node.status === "locked";
  const techniqueHref = `/atleta/movimientos/${movementId}` as Route;

  // Achieved colapsado (default) — fila slim escaneable
  if (isAchieved && !expanded) {
    return (
      <div style={{ position: "relative", minWidth: 0 }}>
        <div
          data-testid={`skill-node-${node.slug}`}
          data-status="achieved"
          data-collapsed="true"
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: 4,
            background: "var(--k-elevated)",
            border: "1px solid var(--k-accent-line)",
            borderRadius: 12,
            opacity: pending ? 0.6 : 1,
            minHeight: 48,
            minWidth: 0,
          }}
        >
          <Link
            href={techniqueHref}
            aria-label={`Ver técnica de ${node.name}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flex: "1 1 0",
              minWidth: 0,
              padding: "8px 4px 8px 12px",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <StatusGlyph status="achieved" />
            <span
              style={{
                fontFamily: "var(--k-font-body)",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--k-t1)",
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {node.name}
            </span>
            <LevelChip level={node.level} />
          </Link>
          <button
            type="button"
            aria-label="Mostrar opciones"
            aria-expanded={false}
            aria-controls={`skill-panel-${node.slug}`}
            data-testid={`skill-toggle-${node.slug}`}
            onClick={() => setExpanded(true)}
            className="k-tap"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              minHeight: 44,
              background: "transparent",
              border: "none",
              color: "var(--k-t2)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <svg
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>

        {!isLast && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: 24,
              top: "100%",
              width: 2,
              height: 8,
              background: "var(--k-line-2)",
            }}
          />
        )}
      </div>
    );
  }

  // Achieved expandido, current, locked, pending — vista detallada
  const styles = nodeStyles(node.status);
  const containerBg = isAchieved ? "var(--k-elevated)" : styles.bg;
  const containerBorder = isAchieved
    ? "1px solid var(--k-accent-line)"
    : styles.border;
  const containerShadow = isAchieved ? "none" : styles.shadow;
  const titleColor = isAchieved ? "var(--k-t1)" : styles.text;

  return (
    <div style={{ position: "relative", minWidth: 0 }}>
      <div
        data-testid={`skill-node-${node.slug}`}
        data-status={node.status}
        data-collapsed="false"
        id={`skill-panel-${node.slug}`}
        style={{
          padding: 14,
          borderRadius: 14,
          background: containerBg,
          border: containerBorder,
          boxShadow: containerShadow,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          opacity: pending ? 0.6 : 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <StatusGlyph status={node.status} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--k-font-body)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: titleColor,
                }}
              >
                {node.name}
              </span>
              <LevelChip level={node.level} />
            </div>
            {node.description && (
              <p
                style={{
                  margin: "4px 0 0",
                  fontFamily: "var(--k-font-body)",
                  fontSize: 12,
                  color: "var(--k-t2)",
                  lineHeight: 1.4,
                }}
              >
                {node.description}
              </p>
            )}
            {!isLocked && (
              <Link
                href={techniqueHref}
                data-testid={`skill-technique-link-${node.slug}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 8,
                  fontFamily: "var(--k-font-display)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--k-accent)",
                  textDecoration: "none",
                }}
              >
                Ver técnica →
              </Link>
            )}
          </div>
          {isAchieved && (
            <button
              type="button"
              aria-label="Ocultar opciones"
              aria-expanded={true}
              aria-controls={`skill-panel-${node.slug}`}
              data-testid={`skill-toggle-${node.slug}`}
              onClick={() => setExpanded(false)}
              className="k-tap"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                background: "transparent",
                border: "none",
                color: "var(--k-t2)",
                cursor: "pointer",
                flexShrink: 0,
                marginTop: -4,
                marginRight: -6,
              }}
            >
              <svg
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M6 15l6-6 6 6" />
              </svg>
            </button>
          )}
        </div>

        {!isLocked && (
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              borderTop: "1px solid var(--k-line)",
              paddingTop: 10,
            }}
          >
            {isAchieved ? (
              <button
                type="button"
                disabled={disabled}
                onClick={onUnmark}
                className="k-tap"
                style={ghostBtn()}
              >
                Quitar dominado
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={onMarkAchieved}
                  className="k-tap"
                  style={primaryBtn()}
                >
                  Lo domino
                </button>
                {!isCurrent && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={onMarkCurrent}
                    className="k-tap"
                    style={ghostBtn()}
                  >
                    Estoy en este
                  </button>
                )}
                {isCurrent && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={onUnmark}
                    className="k-tap"
                    style={ghostBtn()}
                  >
                    Quitar
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {!isLast && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 24,
            top: "100%",
            width: 2,
            height: 8,
            background: "var(--k-line-2)",
          }}
        />
      )}
    </div>
  );
}

function nodeStyles(status: ProgressionNode["status"]) {
  if (status === "achieved") {
    return {
      bg: "var(--k-surface)",
      border: "1px solid var(--k-accent-line)",
      shadow: "none",
      text: "var(--k-t1)",
    };
  }
  if (status === "current") {
    return {
      bg: "var(--k-surface)",
      border: "1px solid var(--k-accent-line)",
      shadow: "var(--k-accent-glow)",
      text: "var(--k-t1)",
    };
  }
  return {
    bg: "var(--k-elevated)",
    border: "1px solid var(--k-line)",
    shadow: "none",
    text: "var(--k-t3)",
  };
}

function StatusGlyph({ status }: { status: ProgressionNode["status"] }) {
  if (status === "achieved") {
    return (
      <svg
        width={20}
        height={20}
        viewBox="0 0 20 20"
        fill="none"
        stroke="var(--k-accent)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0, marginTop: 2 }}
        aria-hidden
      >
        <circle
          cx={10}
          cy={10}
          r={9}
          stroke="var(--k-line-2)"
          strokeWidth={1.5}
        />
        <path d="M5.5 10l3 3 6-6" />
      </svg>
    );
  }
  if (status === "current") {
    return (
      <svg
        width={20}
        height={20}
        viewBox="0 0 20 20"
        fill="none"
        stroke="var(--k-accent)"
        strokeWidth={2}
        style={{ flexShrink: 0, marginTop: 2 }}
      >
        <circle cx={10} cy={10} r={6} />
        <circle cx={10} cy={10} r={2.5} fill="var(--k-accent)" />
      </svg>
    );
  }
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      fill="none"
      stroke="var(--k-t3)"
      strokeWidth={2}
      style={{ flexShrink: 0, marginTop: 2 }}
    >
      <rect x={5} y={9} width={10} height={8} rx={1.5} />
      <path d="M7 9V7a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function LevelChip({ level }: { level: ProgressionNode["level"] }) {
  const labelMap = {
    beginner: "PRINCIPIANTE",
    intermediate: "INTERMEDIO",
    advanced: "AVANZADO",
  };
  return (
    <span
      className="k-mono"
      style={{
        fontSize: 9,
        letterSpacing: 1.2,
        padding: "2px 6px",
        borderRadius: 4,
        border: "1px solid currentColor",
        color: "var(--k-t3)",
      }}
    >
      {labelMap[level]}
    </span>
  );
}

function primaryBtn(): React.CSSProperties {
  return {
    fontFamily: "var(--k-font-display)",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    padding: "10px 16px",
    minHeight: 44,
    background: "var(--k-accent)",
    color: "var(--k-accent-on)",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
  };
}

function ghostBtn(): React.CSSProperties {
  return {
    fontFamily: "var(--k-font-display)",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    padding: "10px 16px",
    minHeight: 44,
    background: "transparent",
    color: "var(--k-t1)",
    border: "1px solid var(--k-line)",
    borderRadius: 10,
    cursor: "pointer",
  };
}

function translateReason(reason: string): string {
  const map: Record<string, string> = {
    "movement-not-found": "Movimiento no encontrado.",
    "no-progressions": "Este movimiento no tiene progresiones aún.",
    "progression-not-found": "Progresión no encontrada.",
    "previous-not-achieved":
      "Tenés que dominar la progresión anterior primero.",
  };
  return map[reason] ?? `Error: ${reason}`;
}
