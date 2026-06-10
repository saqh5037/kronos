import Link from "next/link";
import type { WodDayNav } from "@/lib/wod-date";

/**
 * Day navigation bar for the WOD page.
 * Server component — all dates pre-computed, no client Date.now().
 * Uses Link chips: prev / today (if not today) / next.
 */
export default function WodDayNavBar({ dayNav }: { dayNav: WodDayNav }) {
  const chipBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
    padding: "10px 16px",
    borderRadius: 999,
    fontFamily: "var(--k-font-display)",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.18em",
    textDecoration: "none",
    cursor: "pointer",
  };

  const chipActive: React.CSSProperties = {
    ...chipBase,
    background: "var(--k-accent-soft)",
    border: "1px solid var(--k-accent-line)",
    color: "var(--k-accent)",
  };

  const chipGhost: React.CSSProperties = {
    ...chipBase,
    background: "transparent",
    border: "1px solid var(--k-line)",
    color: "var(--k-t2)",
  };

  const chipDisabled: React.CSSProperties = {
    ...chipBase,
    background: "transparent",
    border: "1px solid var(--k-line)",
    color: "var(--k-t3)",
    opacity: 0.4,
    cursor: "default",
    pointerEvents: "none",
  };

  return (
    <div
      data-testid="wod-day-nav"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "0 20px",
        flexWrap: "wrap",
      }}
    >
      {/* Prev */}
      {dayNav.prevKey ? (
        <Link
          href={`/atleta/wod?date=${dayNav.prevKey}`}
          style={chipGhost}
          aria-label="Día anterior"
          data-testid="wod-nav-prev"
        >
          ← PREV
        </Link>
      ) : (
        <span
          style={chipDisabled}
          aria-disabled="true"
          data-testid="wod-nav-prev-disabled"
        >
          ← PREV
        </span>
      )}

      {/* Today shortcut — only shown when viewing another day */}
      {!dayNav.isToday && (
        <Link href="/atleta/wod" style={chipGhost} data-testid="wod-nav-today">
          HOY
        </Link>
      )}

      {/* Current date label */}
      <span style={chipActive} data-testid="wod-nav-current">
        {dayNav.label}
      </span>

      {/* Next */}
      {dayNav.nextKey ? (
        <Link
          href={`/atleta/wod?date=${dayNav.nextKey}`}
          style={chipGhost}
          aria-label="Día siguiente"
          data-testid="wod-nav-next"
        >
          NEXT →
        </Link>
      ) : (
        <span
          style={chipDisabled}
          aria-disabled="true"
          data-testid="wod-nav-next-disabled"
        >
          NEXT →
        </span>
      )}
    </div>
  );
}
