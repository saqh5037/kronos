"use client";

import { useState, useTransition } from "react";
import {
  createProgramDays,
  deleteProgramWod,
  type ScheduledProgramWod,
} from "@/server/actions/athlete-program";

type Props = {
  initialUpcoming: ScheduledProgramWod[];
};

const DAY_LABELS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmtDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtDateShort(d: Date): string {
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

type DayState = {
  enabled: boolean;
  name: string;
  description: string;
};

export default function ProgramWeekForm({ initialUpcoming }: Props) {
  const [upcoming, setUpcoming] =
    useState<ScheduledProgramWod[]>(initialUpcoming);
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeekMonday(new Date()),
  );
  const [days, setDays] = useState<DayState[]>(() =>
    Array.from({ length: 7 }, () => ({
      enabled: false,
      name: "",
      description: "",
    })),
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateDay(idx: number, patch: Partial<DayState>) {
    setDays((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx]!, ...patch };
      return next;
    });
  }

  function shiftWeek(deltaDays: number) {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + deltaDays);
    setWeekStart(startOfWeekMonday(next));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const payload = days
      .map((d, i) => {
        if (!d.enabled || !d.name.trim()) return null;
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        return {
          scheduledFor: date,
          name: d.name.trim(),
          description: d.description.trim() || undefined,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (payload.length === 0) {
      setError("Activa al menos un día y dale nombre.");
      return;
    }

    startTransition(async () => {
      const r = await createProgramDays(payload);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setSuccess(`${r.createdCount} WODs guardados.`);
      setDays(
        Array.from({ length: 7 }, () => ({
          enabled: false,
          name: "",
          description: "",
        })),
      );
      // best effort refresh — server revalidatePath ya disparó
      window.location.reload();
    });
  }

  function handleDelete(id: string) {
    if (typeof window !== "undefined") {
      const ok = window.confirm("¿Borrar este WOD del programa?");
      if (!ok) return;
    }
    startTransition(async () => {
      const r = await deleteProgramWod(id);
      if (r.ok) {
        setUpcoming((prev) => prev.filter((u) => u.id !== id));
      } else {
        setError(r.error ?? "No se pudo borrar");
      }
    });
  }

  return (
    <>
      {/* UPCOMING */}
      {upcoming.length > 0 && (
        <section style={{ padding: "0 16px 20px" }}>
          <div
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: "var(--k-t2)",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Próximos WODs · {upcoming.length}
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {upcoming.map((u) => (
              <div
                key={u.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  background: "var(--k-elevated)",
                  border: "1px solid var(--k-line)",
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    width: 50,
                    textAlign: "center",
                    paddingRight: 8,
                    borderRight: "1px solid var(--k-line)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--k-font-display)",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      color: "var(--k-accent)",
                      textTransform: "uppercase",
                    }}
                  >
                    {DAY_LABELS[
                      (new Date(u.scheduledFor).getDay() + 6) % 7
                    ]?.slice(0, 3)}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--k-font-display)",
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--k-t1)",
                      marginTop: 2,
                    }}
                  >
                    {fmtDateShort(new Date(u.scheduledFor))}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--k-font-display)",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--k-t1)",
                      letterSpacing: "0.02em",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {u.name}
                  </div>
                  {u.description && (
                    <div
                      style={{
                        fontFamily: "var(--k-font-body)",
                        fontSize: 11,
                        color: "var(--k-t3)",
                        marginTop: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {u.description}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(u.id)}
                  disabled={isPending}
                  aria-label="Borrar WOD"
                  className="k-tap"
                  style={{
                    background: "transparent",
                    border: "1px solid var(--k-line)",
                    color: "var(--k-t3)",
                    padding: "6px 10px",
                    borderRadius: 8,
                    cursor: isPending ? "wait" : "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: "0 16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            background: "var(--k-surface)",
            border: "1px solid var(--k-line)",
            borderRadius: 12,
          }}
        >
          <button
            type="button"
            onClick={() => shiftWeek(-7)}
            className="k-tap"
            style={navBtn}
          >
            ‹
          </button>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.18em",
                color: "var(--k-t3)",
              }}
            >
              SEMANA DE
            </div>
            <div
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 14,
                fontWeight: 700,
                color: "var(--k-t1)",
              }}
            >
              {fmtDateShort(weekStart)} —{" "}
              {fmtDateShort(addDaysJS(weekStart, 6))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => shiftWeek(7)}
            className="k-tap"
            style={navBtn}
          >
            ›
          </button>
        </div>

        {days.map((d, i) => {
          const date = addDaysJS(weekStart, i);
          return (
            <div
              key={i}
              style={{
                padding: 14,
                background: d.enabled
                  ? "var(--k-elevated)"
                  : "var(--k-surface)",
                border: `1px solid ${
                  d.enabled ? "var(--k-accent-line)" : "var(--k-line)"
                }`,
                borderRadius: 12,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={d.enabled}
                  onChange={(e) => updateDay(i, { enabled: e.target.checked })}
                />
                <span
                  style={{
                    fontFamily: "var(--k-font-display)",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    color: "var(--k-t2)",
                    textTransform: "uppercase",
                    flex: 1,
                  }}
                >
                  {DAY_LABELS[i]} · {fmtDateInput(date)}
                </span>
              </label>
              {d.enabled && (
                <>
                  <input
                    type="text"
                    placeholder="Nombre del WOD (Ej: Fran)"
                    value={d.name}
                    onChange={(e) => updateDay(i, { name: e.target.value })}
                    maxLength={80}
                    style={inputStyle}
                  />
                  <textarea
                    placeholder="Descripción (movimientos, reps, peso) — opcional"
                    value={d.description}
                    onChange={(e) =>
                      updateDay(i, { description: e.target.value })
                    }
                    maxLength={1000}
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </>
              )}
            </div>
          );
        })}

        {error && (
          <div
            role="alert"
            style={{
              padding: 10,
              background: "var(--k-elevated)",
              border: "1px solid var(--k-danger)",
              borderRadius: 10,
              color: "var(--k-danger)",
              fontFamily: "var(--k-font-body)",
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            style={{
              padding: 10,
              background: "var(--k-accent-soft)",
              border: "1px solid var(--k-accent-line)",
              borderRadius: 10,
              color: "var(--k-accent)",
              fontFamily: "var(--k-font-display)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            ✓ {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="k-tap"
          style={{
            background: "var(--k-accent)",
            color: "var(--k-accent-on)",
            border: "none",
            borderRadius: 12,
            padding: "14px 18px",
            fontFamily: "var(--k-font-display)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            cursor: isPending ? "wait" : "pointer",
            opacity: isPending ? 0.6 : 1,
            boxShadow: "var(--k-accent-glow)",
            marginTop: 8,
          }}
        >
          {isPending ? "Guardando..." : "Guardar programa"}
        </button>
      </form>
    </>
  );
}

function addDaysJS(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  background: "var(--k-bg)",
  border: "1px solid var(--k-line-2)",
  borderRadius: 8,
  color: "var(--k-t1)",
  fontFamily: "var(--k-font-body)",
  fontSize: 14,
  fontWeight: 500,
  outline: "none",
  width: "100%",
};

const navBtn: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 10,
  background: "var(--k-elevated)",
  border: "1px solid var(--k-line)",
  color: "var(--k-t1)",
  fontFamily: "var(--k-font-display)",
  fontSize: 18,
  fontWeight: 700,
  cursor: "pointer",
};
