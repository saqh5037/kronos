"use client";

import { useMemo, useState } from "react";
import type { AvailableClass } from "@/server/actions/bookings";
import { BookButton } from "@/components/BookingActions";
import KCard from "@/components/kronos/KCard";
import { AnimatedItem } from "@/components/kronos/AnimatedSection";

const WOD_TYPE_ICONS: Record<string, { color: string; label: string }> = {
  STRENGTH: { color: "var(--strain)", label: "F" },
  METCON: { color: "var(--recovery)", label: "M" },
  EMOM: { color: "var(--pr)", label: "E" },
  TABATA: { color: "#f5a623", label: "T" },
  FORTIME: { color: "var(--recovery)", label: "F" },
  AMRAP: { color: "var(--strain)", label: "A" },
};

const formatTime = (d: Date) =>
  new Date(d).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const formatDayMonth = (d: Date) =>
  new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });

type TimeBucket = "all" | "morning" | "midday" | "afternoon";

const TIME_BUCKETS: {
  value: TimeBucket;
  label: string;
  range: [number, number];
}[] = [
  { value: "all", label: "Todo el día", range: [0, 24] },
  { value: "morning", label: "Mañana (5-12)", range: [5, 12] },
  { value: "midday", label: "Mediodía (12-17)", range: [12, 17] },
  { value: "afternoon", label: "Tarde (17-22)", range: [17, 22] },
];

export function ClassesList({
  classes,
  usualHours = [],
}: {
  classes: AvailableClass[];
  usualHours?: number[];
}) {
  const [type, setType] = useState<string>("");
  const [coach, setCoach] = useState<string>("");
  const [bucket, setBucket] = useState<TimeBucket>("all");
  const [onlyUsual, setOnlyUsual] = useState(false);

  const wodTypes = useMemo(() => {
    const set = new Set<string>();
    classes.forEach((c) => c.wod?.type && set.add(c.wod.type));
    return Array.from(set).sort();
  }, [classes]);

  const coaches = useMemo(() => {
    const set = new Set<string>();
    classes.forEach((c) => c.coach?.name && set.add(c.coach.name));
    return Array.from(set).sort();
  }, [classes]);

  const filtered = useMemo(() => {
    const range = TIME_BUCKETS.find((b) => b.value === bucket)!.range;
    return classes.filter((c) => {
      if (type && c.wod?.type !== type) return false;
      if (coach && c.coach?.name !== coach) return false;
      const h = new Date(c.startsAt).getHours();
      if (h < range[0] || h >= range[1]) return false;
      if (onlyUsual && usualHours.length && !usualHours.includes(h))
        return false;
      return true;
    });
  }, [classes, type, coach, bucket, onlyUsual, usualHours]);

  const byDay = useMemo(() => {
    const map = new Map<string, AvailableClass[]>();
    for (const c of filtered) {
      const k = new Date(c.startsAt).toISOString().slice(0, 10);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(c);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="px-3.5">
      {/* Filtros */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-lg border border-[var(--line)] bg-[var(--card)] px-2 py-1.5 text-xs text-[var(--text)]"
          aria-label="Filtrar por tipo"
        >
          <option value="">Todos los tipos</option>
          {wodTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {coaches.length > 0 ? (
          <select
            value={coach}
            onChange={(e) => setCoach(e.target.value)}
            className="rounded-lg border border-[var(--line)] bg-[var(--card)] px-2 py-1.5 text-xs text-[var(--text)]"
            aria-label="Filtrar por coach"
          >
            <option value="">Todos los coaches</option>
            {coaches.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        ) : null}
        <select
          value={bucket}
          onChange={(e) => setBucket(e.target.value as TimeBucket)}
          className="rounded-lg border border-[var(--line)] bg-[var(--card)] px-2 py-1.5 text-xs text-[var(--text)]"
          aria-label="Filtrar por hora"
        >
          {TIME_BUCKETS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
        {usualHours.length > 0 && (
          <button
            type="button"
            onClick={() => setOnlyUsual((v) => !v)}
            className="rounded-lg px-2.5 py-1.5 text-[10px] font-bold tracking-wider uppercase transition-all"
            style={{
              background: onlyUsual ? "var(--cyan)" : "transparent",
              color: onlyUsual ? "#0a0a0c" : "var(--cyan)",
              border: `1px solid var(--cyan)`,
            }}
          >
            Mi horario
          </button>
        )}
        {(type || coach || bucket !== "all" || onlyUsual) && (
          <button
            type="button"
            onClick={() => {
              setType("");
              setCoach("");
              setBucket("all");
              setOnlyUsual(false);
            }}
            className="rounded-lg px-2 py-1.5 text-[10px] text-[var(--text-3)] hover:text-[var(--text-2)]"
          >
            Limpiar
          </button>
        )}
        <span className="ml-auto font-mono text-[10px] text-[var(--text-3)]">
          {filtered.length} clase{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <KCard>
            <p
              className="py-6 text-center text-sm"
              style={{ color: "var(--text-2)" }}
            >
              Sin clases que cumplan los filtros.
            </p>
          </KCard>
        ) : (
          byDay.map(([dateKey, dayClasses]) => {
            const date = new Date(dateKey + "T12:00:00.000Z");
            const isToday =
              new Date(dateKey).toDateString() === new Date().toDateString();
            return (
              <div key={dateKey} className="flex flex-col gap-2">
                {!isToday && (
                  <p
                    className="font-display sticky top-0 z-10 px-1 pb-1 pt-3 text-sm font-semibold"
                    style={{ color: "var(--text-2)" }}
                  >
                    {formatDayMonth(date)}
                  </p>
                )}
                {dayClasses.map((c) => (
                  <ClassRow
                    key={c.id}
                    c={c}
                    isUsual={usualHours.includes(
                      new Date(c.startsAt).getHours(),
                    )}
                  />
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ClassRow({
  c,
  isUsual = false,
}: {
  c: AvailableClass;
  isUsual?: boolean;
}) {
  const full = c.bookedCount >= c.capacity;
  const fillRatio = c.bookedCount / c.capacity;
  const past = new Date(c.startsAt) < new Date();
  const isBooked = c.myBookingStatus === "BOOKED";
  const isOpenBox = c.kind === "OPEN_BOX";

  const barColor =
    full || fillRatio >= 0.85
      ? "var(--pr)"
      : fillRatio >= 0.6
        ? "var(--strain)"
        : "var(--recovery)";

  const typeInfo = WOD_TYPE_ICONS[c.wod?.type ?? ""] ?? {
    color: "var(--text-3)",
    label: "?",
  };

  return (
    <AnimatedItem>
      <div
        className="k-card relative p-3.5"
        style={{
          opacity: past ? 0.45 : 1,
          borderColor: isBooked
            ? "var(--recovery-line)"
            : isUsual
              ? "var(--cyan)"
              : undefined,
          boxShadow: isBooked
            ? "0 0 16px rgba(25,240,139,0.12)"
            : isUsual
              ? "0 0 12px rgba(0,191,255,0.15)"
              : undefined,
        }}
      >
        {isUsual && !isBooked && (
          <span
            className="absolute -top-2 left-3 px-2 py-0.5 rounded-full font-mono text-[8px] font-bold tracking-wider uppercase"
            style={{
              background: "var(--cyan)",
              color: "#0a0a0c",
            }}
          >
            Tu horario
          </span>
        )}
        <div className="flex items-center gap-3.5">
          <div className="flex min-w-[64px] flex-col items-center gap-1">
            <div
              className="font-display text-[22px] font-bold"
              style={{
                color: isBooked
                  ? "var(--recovery)"
                  : past
                    ? "var(--text-3)"
                    : "var(--text)",
                letterSpacing: "-0.03em",
              }}
            >
              {formatTime(c.startsAt)}
            </div>
            <div
              className="font-mono text-[9px] font-bold tracking-[0.08em]"
              style={{ color: "var(--text-3)" }}
            >
              {c.durationMin} MIN
            </div>
            <div
              className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold"
              style={{
                background: `${typeInfo.color}18`,
                color: typeInfo.color,
                border: `1px solid ${typeInfo.color}30`,
              }}
            >
              {typeInfo.label}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="mb-2 truncate text-[13px] font-semibold"
              style={{ color: isOpenBox ? "var(--cyan)" : undefined }}
            >
              {isOpenBox
                ? "Open Box · Acceso libre"
                : (c.wod?.name ?? "WOD por definir")}
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-2 flex-1 overflow-hidden rounded-full"
                style={{ background: "var(--btn-ghost-bg)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, fillRatio * 100)}%`,
                    background: barColor,
                    boxShadow: fillRatio > 0.5 ? `0 0 8px ${barColor}` : "none",
                  }}
                />
              </div>
              <div
                className="min-w-[40px] text-right font-mono text-[10px] font-bold"
                style={{ color: "var(--text-2)" }}
              >
                {c.bookedCount}/{c.capacity}
              </div>
            </div>
            <div
              className="mt-1.5 flex items-center gap-1.5 text-[10px]"
              style={{ color: "var(--text-3)" }}
            >
              {c.coach?.name && <span>Coach {c.coach.name}</span>}
              {c.coach?.name && c.wod?.type && (
                <span className="opacity-40">·</span>
              )}
              {c.wod?.type && (
                <span
                  className="k-chip"
                  style={{
                    fontSize: 8,
                    padding: "2px 6px",
                    background: `${typeInfo.color}15`,
                    color: typeInfo.color,
                    border: `1px solid ${typeInfo.color}25`,
                  }}
                >
                  {c.wod.type}
                </span>
              )}
              {past && (
                <span
                  className="k-chip k-chip-ghost"
                  style={{ fontSize: 8, padding: "2px 6px" }}
                >
                  PASADA
                </span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            {isBooked ? (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{
                  background: "var(--recovery-soft)",
                  border: "1px solid var(--recovery-line)",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--recovery)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
            ) : (
              <BookButton
                classId={c.id}
                bookedCount={c.bookedCount}
                capacity={c.capacity}
                myStatus={c.myBookingStatus}
                myBookingId={c.myBookingId}
              />
            )}
          </div>
        </div>
      </div>
    </AnimatedItem>
  );
}
