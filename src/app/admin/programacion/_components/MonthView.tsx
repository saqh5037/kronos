import Link from "next/link";
import type { ClassRow } from "@/server/actions/classes";

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function MonthView({
  monthAnchor,
  classes,
}: {
  monthAnchor: Date;
  classes: ClassRow[];
}) {
  const year = monthAnchor.getFullYear();
  const month = monthAnchor.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  // Grid starts on Monday
  const startOffset = (first.getDay() + 6) % 7;
  const totalCells = Math.ceil((startOffset + last.getDate()) / 7) * 7;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = ymd(today);

  const byDay = new Map<string, ClassRow[]>();
  for (const c of classes) {
    const k = ymd(c.startsAt);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(c);
  }

  const days = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startOffset + 1;
    const date = new Date(year, month, dayNum);
    const inMonth = date.getMonth() === month;
    return { date, inMonth };
  });

  const labels = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

  return (
    <div className="k-card p-4">
      <div className="grid grid-cols-7 gap-1 mb-2">
        {labels.map((l) => (
          <p
            key={l}
            className="font-mono text-[10px] font-bold tracking-[0.12em] text-center py-1"
            style={{ color: "var(--k-t3)" }}
          >
            {l}
          </p>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map(({ date, inMonth }, i) => {
          const k = ymd(date);
          const dayClasses = byDay.get(k) ?? [];
          const isToday = k === todayKey;
          const totalCap = dayClasses.reduce((s, c) => s + c.capacity, 0);
          const totalBooked = dayClasses.reduce(
            (s, c) => s + c.bookingCount,
            0,
          );
          const fillPct = totalCap > 0 ? (totalBooked / totalCap) * 100 : 0;
          const hasOpenBox = dayClasses.some((c) => c.kind === "OPEN_BOX");

          return (
            <Link
              key={i}
              href={{
                pathname: "/admin/programacion",
                query: { view: "day", date: k },
              }}
              className="rounded-lg p-1.5 min-h-[80px] transition-all hover:border-[var(--k-line-2)]"
              style={{
                background: inMonth ? "var(--k-elevated)" : "transparent",
                border: isToday
                  ? "1px solid var(--k-warning)"
                  : "1px solid var(--k-line)",
                opacity: inMonth ? 1 : 0.4,
              }}
            >
              <div className="flex items-center justify-between">
                <p
                  className="font-display text-sm font-bold leading-none"
                  style={{
                    color: isToday ? "var(--k-warning)" : "var(--k-t1)",
                  }}
                >
                  {date.getDate()}
                </p>
                {dayClasses.length > 0 && (
                  <span
                    className="font-mono text-[8px] font-bold"
                    style={{ color: "var(--k-t3)" }}
                  >
                    {dayClasses.length}c
                  </span>
                )}
              </div>
              {dayClasses.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  <div
                    className="h-[3px] rounded-full overflow-hidden"
                    style={{ background: "var(--btn-ghost-bg)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, fillPct)}%`,
                        background:
                          fillPct >= 80
                            ? "var(--k-accent)"
                            : fillPct >= 50
                              ? "var(--k-accent)"
                              : "var(--k-t2)",
                      }}
                    />
                  </div>
                  {hasOpenBox && (
                    <span
                      className="font-mono text-[7px] font-bold uppercase tracking-wider"
                      style={{ color: "var(--k-warning)" }}
                    >
                      Open Box
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
