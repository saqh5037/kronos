import Link from "next/link";
import type { ComponentProps } from "react";
import { Icon } from "./icons";
import { TourTriggerButton } from "@/components/tour/TourTriggerButton";
import { wodTour } from "@/components/tour/tours/wod";

const ACC = "var(--k-accent)";
const ACC_ON = "var(--k-accent-on)";

type LinkHref = ComponentProps<typeof Link>["href"];

export type MovementRowData = {
  reps: string;
  name: string;
  sub?: string;
  iconKind?: "run" | "kb" | "pull" | "default";
  /** When present, the row links to the movement detail page. */
  movementId?: string;
};

export type WodDetalleV3Props = {
  wodName: string;
  wodType: string;
  scoreType: string;
  timeCap?: number | null;
  movements: MovementRowData[];
  /** total rounds e.g. "3 RFT" o "AMRAP 12" */
  roundsLabel: string;
  /** "ROUNDS FOR TIME" o similar */
  roundsSub: string;
  /** Mejor score formateado (ej "9:42" / "RX") */
  bestScore?: string;
  /** Fecha del best ya formateada */
  bestScoreDateLabel?: string;
  /** Sparkline values (números) */
  bestScoreSpark?: number[];
  /** Diff motivacional ej "↓ 38s desde el 1°" */
  bestScoreDelta?: string;
  /** Difficulty 1-5 */
  difficulty?: number;
  difficultyLabel?: string;
  /** Estimación duración */
  estimatedTimeLabel?: string;
  /** Coach note opcional */
  coachNote?: {
    coachInitial: string;
    coachName: string;
    minutesAgo?: string;
    text: string;
  };
  /** Si true, oculta CTA primaria (ya hay form abajo) */
  hidePrimaryCta?: boolean;
  primaryCtaLabel?: string;
  leaderboardHref?: LinkHref;
  backHref?: LinkHref;
  /** El form real de score (server interaction) */
  scoreFormSlot?: React.ReactNode;
};

function MovIcon({ kind }: { kind: MovementRowData["iconKind"] }) {
  if (kind === "run") return <Icon.MovRun width={20} height={20} />;
  if (kind === "kb") return <Icon.MovKB width={20} height={20} />;
  if (kind === "pull") return <Icon.MovPull width={20} height={20} />;
  return <Icon.Bolt width={18} height={18} />;
}

export default function WodDetalleV3(props: WodDetalleV3Props) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--k-bg)",
        color: "var(--k-t1)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        fontFamily: "var(--k-font-body)",
        paddingBottom: 96,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 18,
          paddingTop: 8,
        }}
      >
        {/* Header */}
        <div
          style={{
            height: 48,
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href={props.backHref ?? "/atleta"}
            aria-label="Volver"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "transparent",
              border: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--k-t1)",
              textDecoration: "none",
            }}
          >
            <Icon.Back width={20} height={20} />
          </Link>
          <span
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.2em",
              color: "var(--k-t2)",
            }}
          >
            WOD · HOY
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TourTriggerButton tourId={wodTour.id} />
            <button
              type="button"
              aria-label="Compartir"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "transparent",
                border: 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--k-t1)",
              }}
            >
              <Icon.Share width={18} height={18} />
            </button>
          </div>
        </div>

        {/* Hero */}
        <div
          data-tour="wod.hero"
          style={{
            margin: "0 20px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignSelf: "flex-start",
              padding: "4px 10px",
              borderRadius: 999,
              background: "var(--k-accent-soft)",
              border: `1px solid ${ACC}`,
            }}
          >
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.2em",
                color: ACC,
              }}
            >
              {props.wodType.toUpperCase()}
            </span>
          </div>
          <div
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 80,
              fontWeight: 700,
              letterSpacing: "-0.05em",
              color: "var(--k-t1)",
              lineHeight: 0.85,
              wordBreak: "break-word",
            }}
          >
            {props.wodName.toUpperCase()}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 4,
              flexWrap: "wrap",
            }}
          >
            {typeof props.difficulty === "number" && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ display: "flex", gap: 4 }}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background:
                          i < (props.difficulty ?? 0) ? ACC : "var(--k-line)",
                      }}
                    />
                  ))}
                </div>
                {props.difficultyLabel && (
                  <span
                    style={{
                      fontFamily: "var(--k-font-display)",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.16em",
                      color: "var(--k-t2)",
                    }}
                  >
                    {props.difficultyLabel.toUpperCase()}
                  </span>
                )}
              </div>
            )}
            {props.estimatedTimeLabel && (
              <>
                <span
                  style={{
                    fontFamily: "var(--k-font-display)",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.16em",
                    color: "var(--k-t3)",
                  }}
                >
                  ·
                </span>
                <span
                  style={{
                    fontFamily: "var(--k-font-display)",
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.16em",
                    color: "var(--k-t2)",
                  }}
                >
                  {props.estimatedTimeLabel.toUpperCase()}
                </span>
              </>
            )}
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.16em",
                color: "var(--k-t3)",
              }}
            >
              ·
            </span>
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.16em",
                color: "var(--k-t2)",
              }}
            >
              {props.scoreType}
              {props.timeCap ? ` · CAP ${props.timeCap}'` : ""}
            </span>
          </div>
        </div>

        {/* Movements */}
        {props.movements.length > 0 && (
          <div
            data-tour="wod.movements"
            className="k-grain"
            style={{
              margin: "0 20px",
              padding: "18px 22px",
              background: "var(--k-elevated)",
              border: "1px solid var(--k-line)",
              borderRadius: 16,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 10,
                marginBottom: 6,
                paddingBottom: 14,
                borderBottom: "1px solid var(--k-line)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 32,
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                  color: ACC,
                  lineHeight: 1,
                }}
              >
                {props.roundsLabel}
              </span>
              <span
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 10,
                  fontWeight: 500,
                  color: "var(--k-t3)",
                  letterSpacing: "0.14em",
                }}
              >
                {props.roundsSub.toUpperCase()}
              </span>
            </div>
            {props.movements.map((m, i) => {
              const last = i === props.movements.length - 1;
              const inner = (
                <>
                  <span
                    style={{
                      fontFamily: "var(--k-font-display)",
                      fontSize: 18,
                      fontWeight: 600,
                      color: "var(--k-t1)",
                      letterSpacing: "-0.02em",
                      minWidth: 62,
                    }}
                  >
                    {m.reps}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--k-font-body)",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--k-t1)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {m.name}
                      {m.movementId && (
                        <span
                          aria-hidden="true"
                          style={{
                            color: "var(--k-accent)",
                            marginLeft: 6,
                            fontSize: 11,
                          }}
                        >
                          ↗
                        </span>
                      )}
                    </span>
                    {m.sub && (
                      <span
                        style={{
                          fontFamily: "var(--k-font-display)",
                          fontSize: 10,
                          fontWeight: 500,
                          color: "var(--k-t2)",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {m.sub.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "var(--k-elevated)",
                      border: "1px solid var(--k-line)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--k-t2)",
                    }}
                  >
                    <MovIcon kind={m.iconKind} />
                  </div>
                </>
              );
              const rowStyle: React.CSSProperties = {
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 0",
                borderBottom: last ? "none" : "1px solid var(--k-line)",
                color: "inherit",
                textDecoration: "none",
              };
              if (m.movementId) {
                return (
                  <Link
                    key={i}
                    href={`/atleta/movimientos/${m.movementId}` as LinkHref}
                    style={rowStyle}
                    data-testid="wod-movement-row"
                    data-movement-id={m.movementId}
                  >
                    {inner}
                  </Link>
                );
              }
              return (
                <div key={i} style={rowStyle}>
                  {inner}
                </div>
              );
            })}
          </div>
        )}

        {/* PR card */}
        {props.bestScore && (
          <div
            className="k-grain"
            style={{
              margin: "0 20px",
              padding: "20px 22px",
              background: "var(--k-surface)",
              border: "1px solid var(--k-line)",
              borderRadius: 16,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.2em",
                color: "var(--k-t3)",
                marginBottom: 12,
              }}
            >
              TU PR EN {props.wodName.toUpperCase()}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 16,
                marginBottom: 14,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 4,
                  lineHeight: 0.85,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--k-font-display)",
                    fontSize: 64,
                    fontWeight: 700,
                    letterSpacing: "-0.05em",
                    color: "var(--k-t1)",
                  }}
                >
                  {props.bestScore}
                </span>
              </div>
              {props.bestScoreSpark && props.bestScoreSpark.length >= 2 && (
                <PrSparkline values={props.bestScoreSpark} />
              )}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: 14,
                borderTop: "1px solid var(--k-line)",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {props.bestScoreDateLabel && (
                <span
                  style={{
                    fontFamily: "var(--k-font-display)",
                    fontSize: 10,
                    fontWeight: 500,
                    color: "var(--k-t3)",
                    letterSpacing: "0.14em",
                  }}
                >
                  {props.bestScoreDateLabel.toUpperCase()}
                </span>
              )}
              {props.bestScoreDelta && (
                <span
                  style={{
                    fontFamily: "var(--k-font-body)",
                    fontSize: 11,
                    color: "var(--k-t2)",
                  }}
                >
                  {props.bestScoreDelta}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Coach Notes */}
        {props.coachNote && (
          <div
            style={{
              margin: "0 20px",
              padding: "16px 18px",
              background: "var(--k-surface)",
              border: "1px solid var(--k-line)",
              borderRadius: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--k-line)",
                  border: "1px solid var(--k-line-2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--k-font-body)",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--k-t1)",
                }}
              >
                {props.coachNote.coachInitial}
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  lineHeight: 1.2,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--k-font-body)",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--k-t1)",
                  }}
                >
                  Coach {props.coachNote.coachName}
                </span>
                {props.coachNote.minutesAgo && (
                  <span
                    style={{
                      fontFamily: "var(--k-font-display)",
                      fontSize: 9,
                      fontWeight: 500,
                      color: "var(--k-t3)",
                      letterSpacing: "0.12em",
                      marginTop: 2,
                    }}
                  >
                    {props.coachNote.minutesAgo.toUpperCase()}
                  </span>
                )}
              </div>
              <div
                style={{
                  padding: "2px 8px",
                  borderRadius: 999,
                  border: `1px solid ${ACC}`,
                  background: "var(--k-accent-soft)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--k-font-display)",
                    fontSize: 8,
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    color: ACC,
                  }}
                >
                  NOTA
                </span>
              </div>
            </div>
            <p
              style={{
                margin: 0,
                fontFamily: "var(--k-font-body)",
                fontSize: 13,
                color: "var(--k-t1)",
                lineHeight: 1.5,
              }}
            >
              {props.coachNote.text}
            </p>
          </div>
        )}

        {/* Score form slot (provided by page) */}
        {props.scoreFormSlot && (
          <div data-tour="wod.score-form" style={{ margin: "0 20px" }}>
            {props.scoreFormSlot}
          </div>
        )}

        {/* CTAs */}
        <div
          style={{
            margin: "0 20px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {!props.hidePrimaryCta && props.primaryCtaLabel && (
            <button
              type="button"
              className="k-tap"
              style={{
                height: 54,
                borderRadius: 12,
                border: 0,
                cursor: "pointer",
                background: ACC,
                color: ACC_ON,
                fontFamily: "var(--k-font-body)",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {props.primaryCtaLabel}
              <Icon.Arrow width={16} height={16} />
            </button>
          )}
          {props.leaderboardHref && (
            <Link
              data-tour="wod.leaderboard"
              href={props.leaderboardHref}
              className="k-tap"
              style={{
                height: 54,
                borderRadius: 12,
                cursor: "pointer",
                background: "transparent",
                border: "1px solid var(--k-line)",
                color: "var(--k-t1)",
                fontFamily: "var(--k-font-body)",
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                textDecoration: "none",
              }}
            >
              VER LEADERBOARD
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function PrSparkline({ values }: { values: number[] }) {
  const W = 110;
  const H = 36;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return [x, y] as const;
  });
  const path = pts
    .map(
      (p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`,
    )
    .join(" ");
  return (
    <svg width={W} height={H} style={{ flexShrink: 0 }}>
      <path
        d={path}
        fill="none"
        stroke={ACC}
        strokeWidth="1.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p[0]}
          cy={p[1]}
          r={i === pts.length - 1 ? 3 : 2}
          fill={i === pts.length - 1 ? ACC : "var(--k-t3)"}
        />
      ))}
    </svg>
  );
}
