"use client";

import { useTour } from "./TourProvider";

export function TourTriggerButton({
  tourId,
  label = "Ver tour de esta pantalla",
}: {
  tourId: string;
  label?: string;
}) {
  const { startTour } = useTour();

  return (
    <button
      type="button"
      onClick={() => startTour(tourId)}
      aria-label={label}
      title={label}
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: "transparent",
        border: "1px solid var(--k-line)",
        color: "var(--k-t2)",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--k-font-display)",
        fontSize: 14,
        fontWeight: 700,
      }}
    >
      ?
    </button>
  );
}
