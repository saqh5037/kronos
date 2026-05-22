"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { AvailableClass } from "@/server/actions/bookings";
import { BookButton } from "@/components/BookingActions";
import { AnimatedItem } from "@/components/kronos/AnimatedSection";
import { EmptyState } from "@/components/kronos/EmptyState";

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
  { value: "morning", label: "Mañana 5–12", range: [5, 12] },
  { value: "midday", label: "Mediodía 12–17", range: [12, 17] },
  { value: "afternoon", label: "Tarde 17–22", range: [17, 22] },
];

const selectStyle: React.CSSProperties = {
  background: "var(--k-elevated)",
  color: "var(--k-t1)",
  border: "1px solid var(--k-line)",
  borderRadius: 10,
  padding: "8px 30px 8px 12px",
  fontFamily: "var(--k-font-body)",
  fontSize: 12,
  fontWeight: 500,
  appearance: "none",
  WebkitAppearance: "none",
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a8a94' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  cursor: "pointer",
};

export function ClassesList({
  classes,
  usualHours = [],
}: {
  classes: AvailableClass[];
  usualHours?: number[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const type = params.get("type") ?? "";
  const coach = params.get("coach") ?? "";
  const bucket = (params.get("bucket") as TimeBucket) || "all";
  const onlyUsual = params.get("usual") === "1";

  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
  }, []);

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const sp = new URLSearchParams(params.toString());
      if (!value || value === "all" || value === "") sp.delete(key);
      else sp.set(key, value);
      const qs = sp.toString();
      router.replace((qs ? `${pathname}?${qs}` : pathname) as never);
    },
    [params, pathname, router],
  );

  const setType = (v: string) => updateParam("type", v);
  const setCoach = (v: string) => updateParam("coach", v);
  const setBucket = (v: TimeBucket) => updateParam("bucket", v);
  const setOnlyUsual = (v: boolean) => updateParam("usual", v ? "1" : null);
  const clearAll = () => {
    const sp = new URLSearchParams(params.toString());
    sp.delete("type");
    sp.delete("coach");
    sp.delete("bucket");
    sp.delete("usual");
    const qs = sp.toString();
    router.replace((qs ? `${pathname}?${qs}` : pathname) as never);
  };

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

  const hasFilters = type || coach || bucket !== "all" || onlyUsual;

  // Tour anchors: the first visible card carries `reservar.class-card`,
  // the first card that still needs booking carries `reservar.book-button`.
  const tourCardId = filtered[0]?.id ?? null;
  const tourBookId =
    filtered.find((c) => c.myBookingStatus !== "BOOKED")?.id ?? null;

  return (
    <div style={{ padding: "0 16px" }}>
      {/* Filtros — en mobile: selects stack vertical, botones en fila aparte */}
      <div data-tour="reservar.time-filter" className="mb-3 space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={selectStyle}
            className="w-full sm:w-auto sm:min-w-[140px]"
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
              style={selectStyle}
              className="w-full sm:w-auto sm:min-w-[140px]"
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
            style={selectStyle}
            className="w-full sm:w-auto sm:min-w-[140px]"
            aria-label="Filtrar por hora"
          >
            {TIME_BUCKETS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          {usualHours.length > 0 && (
            <button
              type="button"
              onClick={() => setOnlyUsual(!onlyUsual)}
              aria-pressed={onlyUsual}
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                padding: "8px 12px",
                borderRadius: 10,
                background: onlyUsual ? "var(--k-accent)" : "transparent",
                color: onlyUsual ? "var(--k-accent-on)" : "var(--k-accent)",
                border: onlyUsual ? "none" : "1px solid var(--k-accent-line)",
                cursor: "pointer",
                boxShadow: onlyUsual ? "var(--k-accent-glow)" : "none",
              }}
            >
              Mi horario
            </button>
          )}
          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                padding: "8px 10px",
                borderRadius: 8,
                background: "transparent",
                border: "none",
                color: "var(--k-t3)",
                cursor: "pointer",
              }}
            >
              Limpiar
            </button>
          )}
          <span
            style={{
              marginLeft: "auto",
              fontFamily: "var(--k-font-display)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.14em",
              color: "var(--k-t3)",
              textTransform: "uppercase",
            }}
          >
            {filtered.length} clase{filtered.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.length === 0 ? (
          <EmptyState
            tone="info"
            title={
              hasFilters
                ? "No hay clases con estos filtros"
                : "Sin clases en este rango"
            }
            description={
              hasFilters
                ? "Probá ampliar el rango de horas o cambiar el tipo."
                : "Cambiá la fecha o vista para ver más opciones."
            }
            action={
              hasFilters ? (
                <button
                  type="button"
                  onClick={clearAll}
                  style={{
                    fontFamily: "var(--k-font-display)",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    padding: "9px 14px",
                    borderRadius: 10,
                    background: "transparent",
                    color: "var(--k-accent)",
                    border: "1px solid var(--k-accent-line)",
                    cursor: "pointer",
                  }}
                >
                  Limpiar filtros
                </button>
              ) : null
            }
          />
        ) : (
          byDay.map(([dateKey, dayClasses]) => {
            const date = new Date(dateKey + "T12:00:00.000Z");
            const isToday =
              now !== null &&
              new Date(dateKey).toDateString() === new Date(now).toDateString();
            return (
              <div
                key={dateKey}
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {!isToday && (
                  <p
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      margin: 0,
                      padding: "12px 4px 6px",
                      fontFamily: "var(--k-font-display)",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "var(--k-t2)",
                    }}
                  >
                    {formatDayMonth(date)}
                  </p>
                )}
                {dayClasses.map((c) => (
                  <ClassRow
                    key={c.id}
                    c={c}
                    now={now}
                    isUsual={usualHours.includes(
                      new Date(c.startsAt).getHours(),
                    )}
                    isTourCardAnchor={c.id === tourCardId}
                    isTourBookAnchor={c.id === tourBookId}
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
  now,
  isTourCardAnchor = false,
  isTourBookAnchor = false,
}: {
  c: AvailableClass;
  isUsual?: boolean;
  now: number | null;
  isTourCardAnchor?: boolean;
  isTourBookAnchor?: boolean;
}) {
  const full = c.bookedCount >= c.capacity;
  const fillRatio = c.bookedCount / c.capacity;
  const past = now !== null && new Date(c.startsAt).getTime() < now;
  const isBooked = c.myBookingStatus === "BOOKED";
  const isOpenBox = c.kind === "OPEN_BOX";

  // Escala monocromática lima — la opacidad indica presión sobre el cupo
  let barColor = "var(--k-line-2)";
  let barGlow = "none";
  if (fillRatio >= 0.85) {
    barColor = "var(--k-accent)";
    barGlow = "0 0 8px rgba(200, 255, 45, 0.45)";
  } else if (fillRatio >= 0.6) {
    barColor = "rgba(200, 255, 45, 0.6)";
  } else if (fillRatio > 0) {
    barColor = "rgba(200, 255, 45, 0.32)";
  }

  const typeInitial =
    (c.wod?.type ?? "?").trim().charAt(0).toUpperCase() || "?";

  const cardBorder = isBooked
    ? "var(--k-accent-line)"
    : isUsual
      ? "var(--k-accent-line)"
      : "var(--k-line)";
  const cardShadow = isBooked ? "0 0 14px rgba(200, 255, 45, 0.16)" : "none";

  return (
    <AnimatedItem>
      <div
        {...(isTourCardAnchor ? { "data-tour": "reservar.class-card" } : {})}
        style={{
          position: "relative",
          background: "var(--k-surface)",
          border: `1px solid ${cardBorder}`,
          borderRadius: 16,
          padding: 14,
          opacity: past ? 0.4 : 1,
          boxShadow: cardShadow,
        }}
      >
        {isUsual && !isBooked && (
          <span
            style={{
              position: "absolute",
              top: -8,
              left: 14,
              padding: "2px 8px",
              borderRadius: 999,
              background: "var(--k-accent)",
              color: "var(--k-accent-on)",
              fontFamily: "var(--k-font-display)",
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Tu horario
          </span>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Hora + duración + tipo */}
          <div
            style={{
              minWidth: 64,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <div
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: isBooked
                  ? "var(--k-accent)"
                  : past
                    ? "var(--k-t3)"
                    : "var(--k-t1)",
                lineHeight: 1,
              }}
            >
              {formatTime(c.startsAt)}
            </div>
            <div
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.14em",
                color: "var(--k-t3)",
              }}
            >
              {c.durationMin} MIN
            </div>
            {c.wod?.type && (
              <div
                style={{
                  marginTop: 2,
                  width: 24,
                  height: 24,
                  borderRadius: 8,
                  background: "var(--k-elevated)",
                  border: "1px solid var(--k-line)",
                  color: "var(--k-accent)",
                  fontFamily: "var(--k-font-display)",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title={c.wod.type}
              >
                {typeInitial}
              </div>
            )}
          </div>

          {/* Body */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                marginBottom: 8,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFamily: "var(--k-font-body)",
                fontSize: 13,
                fontWeight: 600,
                color: isOpenBox ? "var(--k-accent)" : "var(--k-t1)",
                letterSpacing: "-0.01em",
              }}
            >
              {isOpenBox
                ? "Open Box · Acceso libre"
                : (c.wod?.name ?? "WOD por definir")}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  height: 4,
                  flex: 1,
                  overflow: "hidden",
                  borderRadius: 999,
                  background: "var(--k-line)",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${Math.min(100, fillRatio * 100)}%`,
                    background: barColor,
                    boxShadow: barGlow,
                    borderRadius: 999,
                    transition: "width 500ms ease, background 200ms ease",
                  }}
                />
              </div>
              <div
                style={{
                  minWidth: 44,
                  textAlign: "right",
                  fontFamily: "var(--k-font-display)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  color: full ? "var(--k-accent)" : "var(--k-t2)",
                }}
              >
                {c.bookedCount}/{c.capacity}
              </div>
            </div>
            <div
              style={{
                marginTop: 6,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "var(--k-font-display)",
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--k-t3)",
              }}
            >
              {c.coach?.name && <span>Coach {c.coach.name}</span>}
              {c.coach?.name && c.wod?.type && <span aria-hidden>·</span>}
              {c.wod?.type && <span>{c.wod.type}</span>}
              {past && (
                <span
                  style={{
                    padding: "2px 6px",
                    borderRadius: 6,
                    background: "var(--k-elevated)",
                    border: "1px solid var(--k-line)",
                    color: "var(--k-t3)",
                  }}
                >
                  Pasada
                </span>
              )}
            </div>
          </div>

          {/* CTA */}
          <div
            {...(isTourBookAnchor
              ? { "data-tour": "reservar.book-button" }
              : {})}
            style={{ flexShrink: 0 }}
          >
            {isBooked ? (
              <div
                style={{
                  display: "flex",
                  width: 40,
                  height: 40,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 999,
                  background: "var(--k-accent-soft)",
                  border: "1px solid var(--k-accent-line)",
                }}
                aria-label="Reservada"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--k-accent)"
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
