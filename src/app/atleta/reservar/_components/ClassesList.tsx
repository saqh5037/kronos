"use client";

/**
 * ClassesList — the day's classes on /atleta/reservar.
 *
 * Audit 2026-09-15 (P1/P2, /atleta/reservar) fixed here:
 *  - Three stacked full-width selects took 170 px before the first class →
 *    they collapse into one "Filtros" toggle that shows the active count, and
 *    the list is the first thing on the page.
 *  - Past classes kept a dimmed "RESERVAR" button plus an 8 px "PASADA" chip →
 *    a past row now links to its results, never offers a booking. Fase 0 batch
 *    7: the row also stopped dimming itself with `opacity`, which was dragging
 *    its own copy below AA — see the comment on `cardBorder`.
 *  - "F"/"S" initials and a "?" pill stood in for the WOD type → readable
 *    labels via `wodTypeLabel` / `classKindLabel`, coach name on one line.
 *  - The capacity bar animated `width`, a layout property → `transform:
 *    scaleX()` (impeccable detector, 10 layout-property animations).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { ChevronRight, SlidersHorizontal, X } from "lucide-react";
import type { AvailableClass } from "@/server/actions/bookings";
import { classToWodDateKey } from "@/lib/wod-date";
import { BookButton } from "@/components/BookingActions";
import { AnimatedItem } from "@/components/kronos/AnimatedSection";
import { EmptyState } from "@/components/kronos/EmptyState";
import { wodTypeLabel, classKindLabel } from "@/lib/labels";
import { formatDateShort, formatTime24 } from "@/lib/format";
import type { WODType, ClassKind } from "@prisma/client";

/**
 * P0-4: both used to be bare `toLocale*String` calls inside this `"use client"`
 * component, so SSR printed the class hour in the SERVER's zone and the browser
 * re-printed it in the phone's. They now take the box timezone explicitly and
 * go through the shared formatters.
 */
const formatTime = (d: Date, timeZone: string) =>
  formatTime24(new Date(d), timeZone);

const formatDayMonth = (d: Date, timeZone: string) =>
  formatDateShort(new Date(d), timeZone);

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
  padding: "10px 30px 10px 12px",
  fontFamily: "var(--k-font-body)",
  fontSize: 13,
  fontWeight: 500,
  appearance: "none",
  WebkitAppearance: "none",
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a8a94' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  cursor: "pointer",
  minHeight: 44,
  width: "100%",
};

function wodTypeName(type: string | null | undefined): string | null {
  if (!type) return null;
  return wodTypeLabel[type as WODType] ?? type;
}

export function ClassesList({
  classes,
  usualHours = [],
  boxTimezone = "UTC",
}: {
  classes: AvailableClass[];
  usualHours?: number[];
  boxTimezone?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const type = params.get("type") ?? "";
  const coach = params.get("coach") ?? "";
  const bucket = (params.get("bucket") as TimeBucket) || "all";
  const onlyUsual = params.get("usual") === "1";

  const [now, setNow] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
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

  const activeFilterCount =
    (type ? 1 : 0) +
    (coach ? 1 : 0) +
    (bucket !== "all" ? 1 : 0) +
    (onlyUsual ? 1 : 0);
  const hasFilters = activeFilterCount > 0;

  // Tour anchors: the first visible card carries `reservar.class-card`,
  // the first card that still needs booking carries `reservar.book-button`.
  const tourCardId = filtered[0]?.id ?? null;
  const tourBookId =
    filtered.find((c) => c.myBookingStatus !== "BOOKED")?.id ?? null;

  return (
    <div style={{ padding: "0 16px" }}>
      {/* Filtros — one compact toggle; the list comes first */}
      <div data-tour="reservar.time-filter" className="mb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            aria-controls="reservar-filtros"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              minHeight: 40,
              padding: "8px 12px",
              borderRadius: 10,
              background: hasFilters
                ? "var(--k-accent-soft)"
                : "var(--k-elevated)",
              border: `1px solid ${hasFilters ? "var(--k-accent-line)" : "var(--k-line)"}`,
              color: hasFilters ? "var(--k-accent)" : "var(--k-t2)",
              fontFamily: "var(--k-font-display)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {filtersOpen ? (
              <X width={14} height={14} aria-hidden />
            ) : (
              <SlidersHorizontal width={14} height={14} aria-hidden />
            )}
            Filtros
            {activeFilterCount > 0 && ` · ${activeFilterCount}`}
          </button>

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
                minHeight: 40,
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

        {filtersOpen && (
          <div
            id="reservar-filtros"
            className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap"
            style={{
              padding: 12,
              borderRadius: 12,
              background: "var(--k-surface)",
              border: "1px solid var(--k-line)",
            }}
          >
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={selectStyle}
              className="sm:w-auto sm:min-w-[150px]"
              aria-label="Filtrar por tipo de WOD"
            >
              <option value="">Todos los tipos</option>
              {wodTypes.map((t) => (
                <option key={t} value={t}>
                  {wodTypeName(t)}
                </option>
              ))}
            </select>
            {coaches.length > 0 && (
              <select
                value={coach}
                onChange={(e) => setCoach(e.target.value)}
                style={selectStyle}
                className="sm:w-auto sm:min-w-[150px]"
                aria-label="Filtrar por coach"
              >
                <option value="">Todos los coaches</option>
                {coaches.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
            <select
              value={bucket}
              onChange={(e) => setBucket(e.target.value as TimeBucket)}
              style={selectStyle}
              className="sm:w-auto sm:min-w-[150px]"
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
                onClick={() => setOnlyUsual(!onlyUsual)}
                aria-pressed={onlyUsual}
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  minHeight: 44,
                  padding: "8px 14px",
                  borderRadius: 10,
                  background: onlyUsual ? "var(--k-accent)" : "transparent",
                  color: onlyUsual ? "var(--k-accent-on)" : "var(--k-accent)",
                  border: onlyUsual ? "none" : "1px solid var(--k-accent-line)",
                  cursor: "pointer",
                }}
              >
                Mi horario
              </button>
            )}
          </div>
        )}
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
                ? "Prueba ampliar el rango de horas o cambiar el tipo."
                : "Cambia la fecha o vista para ver más opciones."
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
                    minHeight: 44,
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
                    {formatDayMonth(date, boxTimezone)}
                  </p>
                )}
                {dayClasses.map((c) => (
                  <ClassRow
                    key={c.id}
                    c={c}
                    now={now}
                    boxTimezone={boxTimezone}
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
  boxTimezone = "UTC",
  isTourCardAnchor = false,
  isTourBookAnchor = false,
}: {
  c: AvailableClass;
  isUsual?: boolean;
  now: number | null;
  boxTimezone?: string;
  isTourCardAnchor?: boolean;
  isTourBookAnchor?: boolean;
}) {
  const full = c.bookedCount >= c.capacity;
  const fillRatio = Math.min(1, c.bookedCount / Math.max(1, c.capacity));
  const past = now !== null && new Date(c.startsAt).getTime() < now;
  const isBooked = c.myBookingStatus === "BOOKED";
  const isOpenBox = c.kind === "OPEN_BOX";

  // Escala monocromática lima — la opacidad indica presión sobre el cupo.
  // Una clase pasada no compite por cupo: su barra se apaga al color de línea.
  let barColor = "var(--k-line-2)";
  let barGlow = "none";
  if (past) {
    barColor = "var(--k-line-2)";
  } else if (fillRatio >= 0.85) {
    barColor = "var(--k-accent)";
    barGlow = "0 0 8px rgba(200, 255, 45, 0.45)";
  } else if (fillRatio >= 0.6) {
    barColor = "rgba(200, 255, 45, 0.6)";
  } else if (fillRatio > 0) {
    barColor = "rgba(200, 255, 45, 0.32)";
  }

  const typeName = wodTypeName(c.wod?.type);
  const kindName = classKindLabel[c.kind as ClassKind] ?? c.kind;
  const wodDateKey = classToWodDateKey(c.startsAt, boxTimezone);

  /**
   * Una clase terminada se apaga por CROMO, no por opacidad.
   *
   * El card entero llevaba `opacity: 0.55`, que mezcla el texto con el fondo de
   * la página: `--k-t2` caía a 2.43:1 y `--k-t3` a 2.15:1 — 21 nodos de
   * color-contrast en /atleta/reservar. La regla 4 del design system ("opacidad
   * = intensidad") habla del ACENTO, no de un contenedor con texto adentro.
   *
   * Lo que queda apagado: la superficie baja de `--k-surface` a `--k-bg` (el
   * card se hunde en la página en vez de flotar sobre ella), el borde se vuelve
   * punteado, el acento se retira (borde, glow, hora reservada, barra de cupo)
   * y un chip "Terminada" lo dice con palabras. El texto se queda a tono
   * completo: sobre `--k-bg`, `--k-t2` da 5.85:1 y `--k-t3` 4.91:1.
   */
  const cardBorder = past
    ? "var(--k-line)"
    : isBooked || isUsual
      ? "var(--k-accent-line)"
      : "var(--k-line)";
  const cardShadow =
    isBooked && !past ? "0 0 14px rgba(200, 255, 45, 0.16)" : "none";

  return (
    <AnimatedItem>
      <div
        {...(isTourCardAnchor ? { "data-tour": "reservar.class-card" } : {})}
        style={{
          position: "relative",
          background: past ? "var(--k-bg)" : "var(--k-surface)",
          border: `1px ${past ? "dashed" : "solid"} ${cardBorder}`,
          borderRadius: 16,
          padding: 14,
          boxShadow: cardShadow,
        }}
      >
        {past && (
          <span
            style={{
              position: "absolute",
              top: -8,
              left: 14,
              padding: "2px 8px",
              borderRadius: 999,
              background: "var(--k-bg)",
              border: "1px solid var(--k-line-2)",
              color: "var(--k-t2)",
              fontFamily: "var(--k-font-display)",
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Terminada
          </span>
        )}
        {isUsual && !isBooked && !past && (
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
          {/* Hora + duración */}
          <div
            style={{
              minWidth: 60,
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
                color: past
                  ? "var(--k-t2)"
                  : isBooked
                    ? "var(--k-accent)"
                    : "var(--k-t1)",
                lineHeight: 1,
              }}
            >
              {formatTime(c.startsAt, boxTimezone)}
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
          </div>

          {/* Body */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                marginBottom: 6,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFamily: "var(--k-font-body)",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--k-t1)",
                letterSpacing: "-0.01em",
              }}
            >
              {isOpenBox ? (
                `${kindName} · acceso libre`
              ) : c.wod?.name ? (
                <Link
                  href={`/atleta/wod?date=${wodDateKey}` as Route}
                  style={{
                    color: "inherit",
                    textDecoration: "underline",
                    textDecorationColor: past
                      ? "var(--k-line-2)"
                      : "var(--k-accent-line)",
                    textUnderlineOffset: 3,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {c.wod.name}
                </Link>
              ) : (
                "WOD por definir"
              )}
            </div>

            {/* Coach + tipo, en una sola línea legible */}
            <div
              style={{
                marginBottom: 8,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFamily: "var(--k-font-body)",
                fontSize: 11,
                color: "var(--k-t2)",
              }}
            >
              {[c.coach?.name ? `Coach ${c.coach.name}` : null, typeName]
                .filter(Boolean)
                .join(" · ")}
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
                {/*
                  Animating `width` forces layout on every frame; `scaleX` runs
                  on the compositor. Same visual, no reflow.
                */}
                <div
                  style={{
                    height: "100%",
                    width: "100%",
                    transformOrigin: "left center",
                    transform: `scaleX(${fillRatio})`,
                    background: barColor,
                    boxShadow: barGlow,
                    borderRadius: 999,
                    transition: "transform 500ms ease, background 200ms ease",
                  }}
                />
              </div>
              <div
                style={{
                  minWidth: 52,
                  textAlign: "right",
                  fontFamily: "var(--k-font-display)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  color: full && !past ? "var(--k-accent)" : "var(--k-t2)",
                }}
              >
                {c.bookedCount}/{c.capacity}
              </div>
            </div>
          </div>

          {/* CTA — una clase pasada no se reserva, se consulta */}
          <div
            {...(isTourBookAnchor && !past
              ? { "data-tour": "reservar.book-button" }
              : {})}
            style={{ flexShrink: 0 }}
          >
            {past ? (
              /*
               * "VER RESULTADOS" medía 144 px de los 328 del card a 360 px y dejaba
               * 63 px al cuerpo: el WOD se leía "1RM Ba…" y el coach "Coach Lo…".
               * Con el card ya sin `opacity` esa mutilación queda a la vista.
               * "RESULTADOS" + la flecha dicen lo mismo y le devuelven ~30 px al
               * nombre del WOD, que es el dato por el que el atleta abre una clase
               * terminada. El `aria-label` conserva la frase completa.
               */
              <Link
                href={`/atleta/wod?date=${wodDateKey}` as Route}
                aria-label={`Ver resultados de ${c.wod?.name ?? "la clase"}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  minHeight: 40,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "transparent",
                  border: "1px solid var(--k-line)",
                  color: "var(--k-t2)",
                  fontFamily: "var(--k-font-display)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Resultados
                <ChevronRight width={13} height={13} aria-hidden />
              </Link>
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
