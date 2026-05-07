"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

type View = "day" | "week" | "month";

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function shift(date: Date, view: View, dir: -1 | 1): Date {
  const d = new Date(date);
  if (view === "day") d.setDate(d.getDate() + dir);
  else if (view === "week") d.setDate(d.getDate() + 7 * dir);
  else d.setMonth(d.getMonth() + dir);
  return d;
}

export function ScheduleNav({
  view,
  date,
  basePath = "/admin/programacion",
}: {
  view: View;
  date: Date;
  basePath?: string;
}) {
  const router = useRouter();
  const prev = shift(date, view, -1);
  const next = shift(date, view, 1);

  const label =
    view === "day"
      ? date.toLocaleDateString("es-MX", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : view === "month"
        ? date.toLocaleDateString("es-MX", {
            month: "long",
            year: "numeric",
          })
        : `Semana ${date.toLocaleDateString("es-MX", {
            day: "numeric",
            month: "short",
          })}`;

  return (
    <div className="flex items-center gap-2">
      <Link
        href={{ pathname: basePath, query: { view, date: ymd(prev) } }}
        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--k-elevated)]"
        style={{ border: "1px solid var(--k-line)" }}
        aria-label="Anterior"
      >
        ←
      </Link>
      <button
        onClick={() => {
          const t = new Date();
          t.setHours(0, 0, 0, 0);
          const url = `${basePath}?view=${view}&date=${ymd(t)}`;
          router.push(url as never);
        }}
        className="px-3 py-1.5 rounded-full text-xs font-bold transition-colors hover:bg-[var(--k-elevated)]"
        style={{ border: "1px solid var(--k-line)" }}
      >
        Hoy
      </button>
      <Link
        href={{ pathname: basePath, query: { view, date: ymd(next) } }}
        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--k-elevated)]"
        style={{ border: "1px solid var(--k-line)" }}
        aria-label="Siguiente"
      >
        →
      </Link>
      <p
        className="text-sm font-bold capitalize ml-2"
        style={{ color: "var(--k-t1)" }}
      >
        {label}
      </p>
    </div>
  );
}
