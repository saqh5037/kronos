import CancelClassButton from "@/components/CancelClassButton";
import { formatTime24 } from "@/lib/format";
import { classKindLabel } from "@/lib/labels";
import type { ClassRow } from "@/server/actions/classes";

export function ClassCard({
  c,
  compact = false,
}: {
  c: ClassRow;
  compact?: boolean;
}) {
  const fillRatio = c.capacity > 0 ? c.bookingCount / c.capacity : 0;
  const isOpenBox = c.kind === "OPEN_BOX";
  // A class format is not a warning: everything is lime and how full the class
  // is reads as intensity (audit /admin/programacion P1 colour).
  const chipClass = fillRatio >= 0.7 ? "k-chip-moss" : "k-chip-ghost";
  const fillOpacity = fillRatio >= 1 ? 1 : fillRatio >= 0.7 ? 0.8 : 0.5;

  return (
    <div
      className="rounded-xl border p-2 relative overflow-hidden group transition-all hover:border-[var(--k-line-2)] hover:shadow-sm"
      style={{ background: "var(--k-elevated)", borderColor: "var(--k-line)" }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-[2.5px]"
        style={{ background: "var(--k-accent)", opacity: fillOpacity }}
      />
      <div className="pl-2">
        <div className="flex items-center justify-between gap-1">
          <div className="font-mono text-[10px] font-bold tracking-wide">
            {formatTime24(c.startsAt)}
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
              style={{ color: "var(--k-t1)" }}
            >
              {classKindLabel.OPEN_BOX}
            </p>
            {!compact && (
              <p
                className="text-[10px] mt-0.5 truncate font-medium"
                style={{ color: "var(--k-t2)" }}
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
            {c.coach && (
              <p
                className="text-[10px] mt-0.5 truncate font-medium"
                style={{ color: "var(--k-t2)" }}
              >
                {c.coach.name ?? "Coach"}
              </p>
            )}
          </>
        )}
        <div className="mt-1.5 flex items-center gap-1.5">
          <div
            className="flex-1 h-[3px] rounded-full overflow-hidden"
            style={{ background: "var(--k-line-2)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, fillRatio * 100)}%`,
                background: "var(--k-accent)",
                opacity: fillOpacity,
              }}
            />
          </div>
        </div>
        {!compact && (
          <div className="mt-1 flex justify-end opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <CancelClassButton id={c.id} />
          </div>
        )}
      </div>
    </div>
  );
}
