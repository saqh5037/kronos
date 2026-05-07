"use client";
import Link from "next/link";

type View = "day" | "week" | "month";

const LABELS: Record<View, string> = {
  day: "Día",
  week: "Semana",
  month: "Mes",
};

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ScheduleViewSwitch({
  view,
  date,
  basePath = "/admin/programacion",
}: {
  view: View;
  date: Date;
  basePath?: string;
}) {
  return (
    <div
      className="inline-flex rounded-full p-1 gap-0.5"
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-line)",
      }}
    >
      {(["day", "week", "month"] as View[]).map((v) => {
        const isActive = v === view;
        return (
          <Link
            key={v}
            href={{ pathname: basePath, query: { view: v, date: ymd(date) } }}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{
              background: isActive ? "var(--k-accent)" : "transparent",
              color: isActive ? "var(--k-accent-on)" : "var(--k-t2)",
            }}
          >
            {LABELS[v]}
          </Link>
        );
      })}
    </div>
  );
}
