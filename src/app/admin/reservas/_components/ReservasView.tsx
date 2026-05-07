"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  CheckInButton,
  NoShowButton,
  CancelBookingButton,
} from "@/components/BookingActions";

type ClassChip = {
  id: string;
  startsAt: string;
  kind: "WOD" | "OPEN_BOX";
  wodName: string | null;
  coachName: string | null;
  bookingCount: number;
  capacity: number;
  timeLabel: string;
};

type RosterDTO = {
  classId: string;
  startsAt: string;
  capacity: number;
  wodName: string | null;
  coachName: string | null;
  bookings: {
    bookingId: string;
    athleteId: string;
    firstName: string;
    lastName: string;
    status: "BOOKED" | "WAITLIST" | "ATTENDED" | "NOSHOW" | "CANCELLED";
    bookedAt: string;
    checkedInAt: string | null;
  }[];
};

type Status =
  | "ALL"
  | "BOOKED"
  | "WAITLIST"
  | "ATTENDED"
  | "NOSHOW"
  | "CANCELLED";

const STATUS_LABEL: Record<Status, string> = {
  ALL: "Todas",
  BOOKED: "Reservadas",
  WAITLIST: "Lista espera",
  ATTENDED: "Asistieron",
  NOSHOW: "No-show",
  CANCELLED: "Canceladas",
};

const STATUS_COLOR: Record<string, string> = {
  BOOKED: "var(--moss)",
  WAITLIST: "var(--steel)",
  ATTENDED: "var(--recovery)",
  NOSHOW: "var(--red)",
  CANCELLED: "var(--text-3)",
};

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ReservasView({
  classes,
  roster,
  view,
  date,
}: {
  classes: ClassChip[];
  roster: RosterDTO | null;
  view: "day" | "week";
  date: Date;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const search = params.get("q") ?? "";
  const statusFilter = (params.get("status") as Status) || "ALL";

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const sp = new URLSearchParams(params.toString());
      if (!value || value === "ALL" || value === "") sp.delete(key);
      else sp.set(key, value);
      const qs = sp.toString();
      router.replace((qs ? `${pathname}?${qs}` : pathname) as never);
    },
    [params, pathname, router],
  );

  const setSearch = (v: string) => updateParam("q", v);
  const setStatusFilter = (v: Status) => updateParam("status", v);

  const selectedId = roster?.classId ?? null;

  const groupedByDay = useMemo(() => {
    const map = new Map<string, ClassChip[]>();
    for (const c of classes) {
      const k = c.startsAt.slice(0, 10);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(c);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [classes]);

  const filteredBookings = useMemo(() => {
    if (!roster) return [];
    const q = search.trim().toLowerCase();
    return roster.bookings.filter((b) => {
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      if (q) {
        const name = `${b.firstName} ${b.lastName}`.toLowerCase();
        if (!name.includes(q)) return false;
      }
      return true;
    });
  }, [roster, search, statusFilter]);

  const counts = useMemo(() => {
    if (!roster)
      return { booked: 0, waitlist: 0, attended: 0, noshow: 0, cancelled: 0 };
    return {
      booked: roster.bookings.filter((b) => b.status === "BOOKED").length,
      waitlist: roster.bookings.filter((b) => b.status === "WAITLIST").length,
      attended: roster.bookings.filter((b) => b.status === "ATTENDED").length,
      noshow: roster.bookings.filter((b) => b.status === "NOSHOW").length,
      cancelled: roster.bookings.filter((b) => b.status === "CANCELLED").length,
    };
  }, [roster]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
      {/* Class chips column */}
      <aside className="flex flex-col gap-2">
        <p
          className="font-mono text-[10px] font-bold uppercase tracking-wider px-1"
          style={{ color: "var(--text-3)" }}
        >
          {view === "day" ? "Clases del día" : "Clases de la semana"}
        </p>
        <div className="flex flex-col gap-1.5">
          {groupedByDay.map(([dayKey, dayClasses]) => (
            <div key={dayKey} className="flex flex-col gap-1.5">
              {view === "week" && (
                <p
                  className="font-mono text-[10px] font-bold uppercase tracking-wider px-1 pt-1.5"
                  style={{ color: "var(--text-3)" }}
                >
                  {new Date(dayKey + "T12:00:00").toLocaleDateString("es-MX", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                  })}
                </p>
              )}
              {dayClasses.map((c) => {
                const fillRatio = c.bookingCount / c.capacity;
                const accent =
                  c.kind === "OPEN_BOX"
                    ? "var(--cyan)"
                    : fillRatio >= 1
                      ? "var(--red)"
                      : fillRatio >= 0.7
                        ? "var(--steel)"
                        : "var(--moss)";
                const isSelected = c.id === selectedId;
                return (
                  <Link
                    key={c.id}
                    href={{
                      pathname: "/admin/reservas",
                      query: {
                        view,
                        date: ymd(date),
                        classId: c.id,
                      },
                    }}
                    className="rounded-xl p-3 border transition-all"
                    style={{
                      background: isSelected ? "var(--card-2)" : "var(--card)",
                      borderColor: isSelected
                        ? "var(--line-strong)"
                        : "var(--line)",
                      boxShadow: isSelected
                        ? `inset 3px 0 0 ${accent}`
                        : "none",
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[12px] font-bold">
                        {c.timeLabel}
                      </span>
                      <span
                        className="font-mono text-[9px] font-bold rounded-full px-1.5 py-0.5"
                        style={{
                          background: `${accent}22`,
                          color: accent,
                        }}
                      >
                        {c.bookingCount}/{c.capacity}
                      </span>
                    </div>
                    <p
                      className="text-[11px] mt-1 truncate font-semibold"
                      style={{
                        color:
                          c.kind === "OPEN_BOX" ? "var(--cyan)" : "var(--text)",
                      }}
                    >
                      {c.kind === "OPEN_BOX"
                        ? "Open Box"
                        : (c.wodName ?? "WOD")}
                    </p>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      {/* Roster column */}
      <section>
        {!roster ? (
          <div className="k-card p-6 text-center">
            <p className="text-sm" style={{ color: "var(--text-2)" }}>
              Selecciona una clase para ver el roster.
            </p>
          </div>
        ) : (
          <div className="k-card p-4 lg:p-5">
            <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
              <div>
                <p
                  className="font-mono text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--text-3)" }}
                >
                  ROSTER ·{" "}
                  {new Date(roster.startsAt).toLocaleString("es-MX", {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <h2 className="font-display text-2xl font-bold mt-1">
                  {roster.wodName ?? "Open Box"}
                </h2>
                {roster.coachName && (
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--text-2)" }}
                  >
                    Coach: {roster.coachName}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Stat
                  label="Reservadas"
                  value={counts.booked}
                  color="var(--moss)"
                />
                <Stat
                  label="Lista"
                  value={counts.waitlist}
                  color="var(--steel)"
                />
                <Stat
                  label="Asist."
                  value={counts.attended}
                  color="var(--recovery)"
                />
                <Stat
                  label="No-show"
                  value={counts.noshow}
                  color="var(--red)"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <input
                type="search"
                placeholder="Buscar atleta…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-lg border bg-[var(--card-2)] px-3 py-1.5 text-sm flex-1 min-w-[180px]"
                style={{ borderColor: "var(--line)" }}
              />
              <div
                className="inline-flex rounded-full p-1 gap-0.5"
                style={{
                  background: "var(--card-2)",
                  border: "1px solid var(--line)",
                }}
              >
                {(
                  [
                    "ALL",
                    "BOOKED",
                    "WAITLIST",
                    "ATTENDED",
                    "NOSHOW",
                  ] as Status[]
                ).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all"
                    style={{
                      background:
                        statusFilter === s ? "var(--card)" : "transparent",
                      color:
                        statusFilter === s ? "var(--text)" : "var(--text-3)",
                    }}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Bookings table */}
            {filteredBookings.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: "var(--text-3)" }}>
                  Sin atletas que cumplan el filtro.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div
                  className="grid grid-cols-[1fr_120px_120px_140px] gap-3 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--text-3)" }}
                >
                  <span>Atleta</span>
                  <span>Estado</span>
                  <span>Reservó</span>
                  <span>Acciones</span>
                </div>
                {filteredBookings.map((b) => (
                  <div
                    key={b.bookingId}
                    className="grid grid-cols-[1fr_120px_120px_140px] gap-3 items-center px-3 py-2.5 rounded-lg"
                    style={{ background: "var(--card-2)" }}
                  >
                    <span className="font-medium text-sm truncate">
                      {b.firstName} {b.lastName}
                    </span>
                    <span
                      className="font-mono text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-1 inline-block w-fit"
                      style={{
                        background: `${STATUS_COLOR[b.status]}22`,
                        color: STATUS_COLOR[b.status],
                      }}
                    >
                      {b.status}
                    </span>
                    <span
                      className="font-mono text-[10px]"
                      style={{ color: "var(--text-3)" }}
                    >
                      {new Date(b.bookedAt).toLocaleString("es-MX", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <div className="flex gap-1.5 flex-wrap">
                      {(b.status === "BOOKED" || b.status === "WAITLIST") && (
                        <>
                          <CheckInButton bookingId={b.bookingId} />
                          <NoShowButton bookingId={b.bookingId} />
                          <CancelBookingButton bookingId={b.bookingId} />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="rounded-lg px-3 py-1.5"
      style={{ background: `${color}15`, border: `1px solid ${color}40` }}
    >
      <p
        className="font-mono text-[8px] font-bold uppercase tracking-wider"
        style={{ color }}
      >
        {label}
      </p>
      <p
        className="font-display text-base font-bold leading-none mt-0.5"
        style={{ color }}
      >
        {value}
      </p>
    </div>
  );
}
