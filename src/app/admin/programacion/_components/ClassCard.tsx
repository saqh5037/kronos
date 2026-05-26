"use client";

import { useState } from "react";
import CancelClassButton from "@/components/CancelClassButton";
import ClassForm from "@/components/ClassForm";
import { formatTime } from "@/lib/week";
import type { ClassRow } from "@/server/actions/classes";

type Coach = { id: string; name: string | null; email: string };
type WOD = { id: string; name: string; type: string };

export function ClassCard({
  c,
  compact = false,
  coaches,
  wods,
}: {
  c: ClassRow;
  compact?: boolean;
  coaches?: Coach[];
  wods?: WOD[];
}) {
  const [editOpen, setEditOpen] = useState(false);

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
    ? "var(--k-warning)"
    : fillRatio >= 1
      ? "var(--k-accent)"
      : fillRatio >= 0.7
        ? "var(--k-t2)"
        : "var(--k-accent)";

  const canEdit = !compact && coaches && wods;

  return (
    <>
      <div
        className="rounded-xl border p-2 relative overflow-hidden group transition-all hover:border-[var(--k-line-2)] hover:shadow-sm"
        style={{
          background: "var(--k-elevated)",
          borderColor: "var(--k-line)",
        }}
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
                style={{ color: "var(--k-warning)" }}
              >
                Open Box
              </p>
              {!compact && (
                <p
                  className="text-[10px] mt-0.5 truncate font-medium"
                  style={{ color: "var(--k-t3)" }}
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
                  style={{ color: "var(--k-t3)" }}
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
            <div className="mt-1 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="text-xs px-2 py-1 rounded-md transition-colors"
                  style={{ color: "var(--k-t2)" }}
                  title="Editar clase"
                >
                  Editar
                </button>
              )}
              <CancelClassButton id={c.id} />
            </div>
          )}
        </div>
      </div>

      {canEdit && (
        <ClassForm
          mode="edit"
          initialClass={c}
          coaches={coaches}
          wods={wods}
          open={editOpen}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}
