"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDateShort, formatDateWeekday } from "@/lib/format";

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
      ? formatDateWeekday(date)
      : view === "month"
        ? date.toLocaleDateString("es-MX", {
            month: "long",
            year: "numeric",
          })
        : `Semana del ${formatDateShort(date)}`;

  return (
    <div className="flex items-center gap-2">
      <Link
        href={{ pathname: basePath, query: { view, date: ymd(prev) } }}
        className="w-11 h-11 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--k-elevated)]"
        style={{ border: "1px solid var(--k-line)" }}
        aria-label="Anterior"
      >
        <ChevronLeft size={16} aria-hidden />
      </Link>
      <button
        onClick={() => {
          const t = new Date();
          t.setHours(0, 0, 0, 0);
          const url = `${basePath}?view=${view}&date=${ymd(t)}`;
          router.push(url as never);
        }}
        className="min-h-11 px-4 rounded-full text-xs font-bold transition-colors hover:bg-[var(--k-elevated)]"
        style={{ border: "1px solid var(--k-line)" }}
      >
        Hoy
      </button>
      <Link
        href={{ pathname: basePath, query: { view, date: ymd(next) } }}
        className="w-11 h-11 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--k-elevated)]"
        style={{ border: "1px solid var(--k-line)" }}
        aria-label="Siguiente"
      >
        <ChevronRight size={16} aria-hidden />
      </Link>
      <p className="text-sm font-bold ml-2" style={{ color: "var(--k-t1)" }}>
        {label}
      </p>
    </div>
  );
}
