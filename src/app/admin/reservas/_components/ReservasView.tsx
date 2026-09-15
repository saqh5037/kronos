"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Camera } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  CheckInButton,
  NoShowButton,
  CancelBookingButton,
} from "@/components/BookingActions";
import { EmptyState } from "@/components/kronos/EmptyState";
import {
  ResponsiveList,
  type ColumnSpec,
} from "@/components/data/ResponsiveList";
import { bookingStatusLabel, classKindLabel } from "@/lib/labels";
import { formatDateShort, formatDateWeekday, formatTime24 } from "@/lib/format";

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

type BookingStatusValue =
  | "BOOKED"
  | "WAITLIST"
  | "ATTENDED"
  | "NOSHOW"
  | "CANCELLED";

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
    status: BookingStatusValue;
    bookedAt: string;
    checkedInAt: string | null;
  }[];
};

type Status = "ALL" | BookingStatusValue;

/**
 * Tab labels: the roster is filtered by what the booking IS, so "BOOKED" is
 * "Pendientes" (nobody has checked in yet) — "Reservadas" read as a
 * contradiction next to "6/10" (audit /admin/reservas P2).
 */
const STATUS_LABEL: Record<Status, string> = {
  ALL: "Todas",
  BOOKED: "Pendientes",
  WAITLIST: "Lista de espera",
  ATTENDED: "Asistieron",
  NOSHOW: "No vinieron",
  CANCELLED: "Canceladas",
};

const STATUS_COLOR: Record<BookingStatusValue, string> = {
  BOOKED: "var(--k-t2)",
  WAITLIST: "var(--k-t2)",
  ATTENDED: "var(--k-accent)",
  NOSHOW: "var(--k-danger)",
  CANCELLED: "var(--k-t3)",
};

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type RosterBooking = RosterDTO["bookings"][number];

/**
 * The roster's four columns, shared by the table and the phone cards.
 *
 * Module scope, not a `useMemo` inside the component: nothing here closes over
 * props or state, so there is one array for the lifetime of the module.
 */
const rosterColumns: ColumnSpec<RosterBooking>[] = [
  {
    key: "athlete",
    label: "Atleta",
    // The name leads: a roster without names cannot be used.
    primary: true,
    render: (b) => (
      <span className="text-sm font-semibold md:truncate">
        {b.firstName} {b.lastName}
      </span>
    ),
  },
  {
    key: "status",
    label: "Estado",
    render: (b) => (
      <span
        className="inline-block w-fit rounded-full px-2 py-1 font-mono text-[10px] font-bold tracking-wider uppercase"
        style={{
          background: "var(--k-surface)",
          color: STATUS_COLOR[b.status],
          border: `1px solid ${STATUS_COLOR[b.status]}40`,
        }}
      >
        {bookingStatusLabel[b.status]}
      </span>
    ),
  },
  {
    key: "bookedAt",
    label: "Reservó",
    render: (b) => (
      <span className="font-mono text-[10px]" style={{ color: "var(--k-t2)" }}>
        {formatDateShort(new Date(b.bookedAt))} ·{" "}
        {formatTime24(new Date(b.bookedAt))}
      </span>
    ),
  },
  {
    key: "actions",
    label: "Acciones",
    render: (b) => (
      <span className="flex flex-wrap gap-1.5">
        {b.status === "BOOKED" || b.status === "WAITLIST" ? (
          <>
            <CheckInButton bookingId={b.bookingId} />
            <NoShowButton bookingId={b.bookingId} />
            <CancelBookingButton bookingId={b.bookingId} />
          </>
        ) : b.status === "ATTENDED" ? (
          <NoShowButton bookingId={b.bookingId} />
        ) : b.status === "NOSHOW" ? (
          <CheckInButton bookingId={b.bookingId} />
        ) : (
          <span
            className="font-mono text-[10px]"
            style={{ color: "var(--k-t2)" }}
          >
            Sin acciones
          </span>
        )}
      </span>
    ),
  },
];

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
          style={{ color: "var(--k-t2)" }}
        >
          {view === "day" ? "Clases del día" : "Clases de la semana"}
        </p>
        <div className="flex flex-col gap-1.5">
          {groupedByDay.map(([dayKey, dayClasses]) => (
            <div key={dayKey} className="flex flex-col gap-1.5">
              {view === "week" && (
                <p
                  className="font-mono text-[10px] font-bold uppercase tracking-wider px-1 pt-1.5"
                  style={{ color: "var(--k-t2)" }}
                >
                  {formatDateWeekday(new Date(dayKey + "T12:00:00"))}
                </p>
              )}
              {dayClasses.map((c) => {
                const fillRatio = c.bookingCount / Math.max(1, c.capacity);
                const accent =
                  fillRatio >= 0.7 ? "var(--k-accent)" : "var(--k-t2)";
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
                      background: isSelected
                        ? "var(--k-elevated)"
                        : "var(--k-surface)",
                      borderColor: isSelected
                        ? "var(--k-accent-line)"
                        : "var(--k-line)",
                      boxShadow: isSelected
                        ? "inset 3px 0 0 var(--k-accent)"
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
                          background: "var(--k-accent-soft)",
                          color: accent,
                        }}
                      >
                        {c.bookingCount}/{c.capacity}
                      </span>
                    </div>
                    <p
                      className="text-[11px] mt-1 truncate font-semibold"
                      style={{ color: "var(--k-t1)" }}
                    >
                      {c.kind === "OPEN_BOX"
                        ? classKindLabel.OPEN_BOX
                        : (c.wodName ?? classKindLabel.WOD)}
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
          <EmptyState
            tone="info"
            title="Selecciona una clase"
            description="Toca una clase de la lista para ver su roster, hacer check-in o gestionar la lista de espera."
          />
        ) : (
          <div className="k-card p-4 lg:p-5">
            <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
              <div>
                <p
                  className="font-mono text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--k-t2)" }}
                >
                  Roster · {formatDateWeekday(new Date(roster.startsAt))} ·{" "}
                  {formatTime24(new Date(roster.startsAt))}
                </p>
                <h2 className="font-display text-2xl font-bold mt-1">
                  {roster.wodName ?? classKindLabel.OPEN_BOX}
                </h2>
                {roster.coachName && (
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--k-t2)" }}
                  >
                    Coach: {roster.coachName}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Link
                  href={
                    `/admin/clases/${roster.classId}/scores-from-whiteboard` as Route
                  }
                  className="k-btn-ghost inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-semibold"
                >
                  <Camera size={14} aria-hidden />
                  Cargar pizarra
                </Link>
                <div className="flex flex-wrap gap-2">
                  <Stat
                    label={STATUS_LABEL.BOOKED}
                    value={counts.booked}
                    color="var(--k-t2)"
                  />
                  <Stat
                    label="Lista"
                    value={counts.waitlist}
                    color="var(--k-t2)"
                  />
                  <Stat
                    label="Asist."
                    value={counts.attended}
                    color="var(--k-accent)"
                  />
                  <Stat
                    label="No-show"
                    value={counts.noshow}
                    color="var(--k-danger)"
                  />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <input
                type="search"
                placeholder="Buscar atleta…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-lg border bg-[var(--k-elevated)] px-3 py-1.5 text-sm flex-1 min-w-[180px]"
                style={{ borderColor: "var(--k-line-2)" }}
              />
              {/* Scrollable strip: at 360 the six tabs overflowed the viewport. */}
              <div className="-mx-1 w-full overflow-x-auto px-1 sm:mx-0 sm:w-auto sm:px-0">
                <div
                  className="inline-flex w-max rounded-full p-1 gap-0.5"
                  style={{
                    background: "var(--k-elevated)",
                    border: "1px solid var(--k-line-2)",
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
                      className="whitespace-nowrap rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all"
                      style={{
                        background:
                          statusFilter === s
                            ? "var(--k-surface)"
                            : "transparent",
                        color:
                          statusFilter === s ? "var(--k-t1)" : "var(--k-t2)",
                      }}
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bookings list */}
            {filteredBookings.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  tone="neutral"
                  title={
                    search || statusFilter !== "ALL"
                      ? "Sin atletas con estos filtros"
                      : "Aún no hay reservas"
                  }
                  description={
                    search || statusFilter !== "ALL"
                      ? "Prueba con otro nombre o cambia el estado."
                      : "Cuando los atletas reserven, aparecerán aquí para hacer check-in."
                  }
                  action={
                    search || statusFilter !== "ALL" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearch("");
                          setStatusFilter("ALL");
                        }}
                        className="k-btn-ghost px-4 py-2 text-xs font-bold"
                      >
                        Limpiar filtros
                      </button>
                    ) : null
                  }
                />
              </div>
            ) : (
              /*
                One column spec, two renderings. The hand-rolled grid this
                replaced dropped its column headers below `md`, so on a phone
                the status chip and the timestamp sat there unlabelled — the
                coach had to know what each line meant (audit 2026-09-15, P0 #4).
              */
              <ResponsiveList
                rows={filteredBookings}
                columns={rosterColumns}
                rowKey={(b) => b.bookingId}
                caption="Roster de la clase seleccionada"
              />
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
