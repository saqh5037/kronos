import CancelClassButton from "@/components/CancelClassButton";
import { formatTime } from "@/lib/week";
import type { ClassRow } from "@/server/actions/classes";

export function ClassCard({
  c,
  compact = false,
}: {
  c: ClassRow;
  compact?: boolean;
}) {
  const fillRatio = c.bookingCount / c.capacity;
  const isOpenBox = c.kind === "OPEN_BOX";
  const chipClass = isOpenBox
    ? "k-chip-cyan"
    : fillRatio >= 1
      ? "k-chip-red"
      : fillRatio >= 0.7
        ? "k-chip-steel"
        : "k-chip-moss";
  const accent = isOpenBox
    ? "var(--cyan)"
    : fillRatio >= 1
      ? "var(--red)"
      : fillRatio >= 0.7
        ? "var(--steel)"
        : "var(--moss)";

  return (
    <div
      className="rounded-xl border p-2 relative overflow-hidden group transition-all hover:border-[var(--line-strong)] hover:shadow-sm"
      style={{ background: "var(--card-2)", borderColor: "var(--line)" }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-[2.5px]"
        style={{ background: accent }}
      />
      <div className="pl-2">
        <div className="flex items-center justify-between gap-1">
          <div className="font-mono text-[10px] font-bold tracking-wide">
            {formatTime(c.startsAt)}
          </div>
          <span
            className={`k-chip ${chipClass}`}
            style={{ padding: "2px 7px", fontSize: 8 }}
          >
            {c.bookingCount}/{c.capacity}
          </span>
        </div>
        {isOpenBox ? (
          <>
            <p
              className="text-[11px] mt-1 font-semibold truncate leading-tight"
              style={{ color: "var(--cyan)" }}
            >
              Open Box
            </p>
            {!compact && (
              <p
                className="text-[10px] mt-0.5 truncate font-medium"
                style={{ color: "var(--text-3)" }}
              >
                Acceso libre
              </p>
            )}
          </>
        ) : (
          <>
            {c.wod && (
              <p
                className="text-[11px] mt-1 font-semibold truncate leading-tight"
                title={c.wod.name}
              >
                {c.wod.name}
              </p>
            )}
            {!compact && c.coach && (
              <p
                className="text-[10px] mt-0.5 truncate font-medium"
                style={{ color: "var(--text-3)" }}
              >
                {c.coach.name ?? "Coach"}
              </p>
            )}
          </>
        )}
        <div className="mt-1.5 flex items-center gap-1.5">
          <div
            className="flex-1 h-[3px] rounded-full overflow-hidden"
            style={{ background: "var(--btn-ghost-bg)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, fillRatio * 100)}%`,
                background: accent,
              }}
            />
          </div>
        </div>
        {!compact && (
          <div className="mt-1 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <CancelClassButton id={c.id} />
          </div>
        )}
      </div>
    </div>
  );
}
