"use client";

import { useMemo, useState } from "react";
import {
  KronosLineChart,
  KronosAreaChart,
} from "@/components/charts/kronos-chart";
import { CHART_COLORS } from "@/components/charts/tokens";

interface PRPoint {
  date: string;
  value: number;
}

// Mulberry32: PRNG determinística → mismo seed produce mismas series.
// Evita hydration mismatch (SSR/CSR generan los mismos números).
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildPRSeries(seed: number): PRPoint[] {
  const rand = mulberry32(seed + 1);
  const today = new Date();
  const points: PRPoint[] = [];
  let v = 60;
  for (let i = 90; i >= 0; i -= 9) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    v += rand() * 3 + (i < 45 ? 1.2 : 0.6);
    if (rand() > 0.6) v += rand() * 4;
    points.push({
      date: d.toISOString(),
      value: Math.round(v * 10) / 10,
    });
  }
  return points;
}

function buildRevenueSeries(seed: number) {
  const rand = mulberry32(seed + 2);
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago"];
  return months.map((m, i) => ({
    month: m,
    actual: 38000 + i * 4200 + rand() * 8000,
    anterior: 32000 + i * 3000 + rand() * 5000,
  }));
}

function buildAttendance(seed: number) {
  const rand = mulberry32(seed + 3);
  const days = ["L", "M", "X", "J", "V", "S", "D"];
  return days.map((d) => ({
    day: d,
    asistencia: Math.round(58 + rand() * 30),
  }));
}

function formatDate(iso: unknown) {
  if (typeof iso !== "string") return String(iso ?? "");
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", { month: "short", day: "numeric" });
}

const moneyFmt = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

export function ChartsDemo() {
  const [seed, setSeed] = useState(0);
  const prData = useMemo(() => buildPRSeries(seed), [seed]);
  const revenueData = useMemo(() => buildRevenueSeries(seed), [seed]);
  const attendanceData = useMemo(() => buildAttendance(seed), [seed]);
  const currentBest = Math.max(...prData.map((p) => p.value));

  return (
    <div
      style={{
        background: "var(--bg)",
        minHeight: "100vh",
        color: "var(--text)",
      }}
      className="p-4 md:p-8"
    >
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              KronosChart — demo cinematic
            </h1>
            <p
              className="text-xs md:text-sm font-mono mt-1"
              style={{ color: "var(--text-3)" }}
            >
              dev only · /dev/charts-demo · path-draw + glow + head orb + grid
              stagger
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSeed((s) => s + 1)}
            className="k-btn-ghost"
          >
            Re-animar
          </button>
        </header>

        <section className="k-card p-4 md:p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="k-eyebrow">PR Histórico — Back Squat</h2>
              <p className="font-display text-3xl font-bold mt-1">
                {currentBest.toFixed(1)}{" "}
                <span
                  className="text-sm font-mono"
                  style={{ color: "var(--text-3)" }}
                >
                  kg
                </span>
              </p>
            </div>
          </div>
          <KronosLineChart
            data={prData}
            xKey="date"
            yKey="value"
            color={CHART_COLORS.fire}
            height={260}
            formatY={(v) => `${v.toFixed(0)}kg`}
            formatX={(v) => formatDate(v)}
            referenceLines={[
              {
                y: currentBest,
                color: CHART_COLORS.moss,
                label: "PR ACTUAL",
              },
            ]}
            ariaLabel="Histórico de PRs en back squat últimos 90 días"
          />
        </section>

        <section className="k-card p-4 md:p-6 space-y-3">
          <h2 className="k-eyebrow">
            Ingresos mensuales · vs período anterior
          </h2>
          <KronosAreaChart
            data={revenueData}
            xKey="month"
            series={[
              {
                key: "actual",
                color: CHART_COLORS.fire,
                label: "Actual",
              },
              {
                key: "anterior",
                color: CHART_COLORS.steel,
                label: "Anterior",
              },
            ]}
            height={260}
            formatY={(v) => moneyFmt.format(v).replace("MX$", "$")}
            formatX={(v) => String(v)}
            ariaLabel="Ingresos por mes"
          />
        </section>

        <section className="k-card p-4 md:p-6 space-y-3">
          <h2 className="k-eyebrow">Asistencia semana</h2>
          <KronosAreaChart
            data={attendanceData}
            xKey="day"
            yKey="asistencia"
            color={CHART_COLORS.moss}
            height={220}
            formatY={(v) => `${v.toFixed(0)}`}
            formatX={(v) => String(v)}
            ariaLabel="Asistencia por día de la semana"
          />
        </section>

        <section className="k-card p-4 md:p-6 space-y-3">
          <h2 className="k-eyebrow">Sin grid · sin axis · solo la línea</h2>
          <KronosLineChart
            data={prData}
            xKey="date"
            yKey="value"
            color={CHART_COLORS.amber}
            height={140}
            showGrid={false}
            showAxis={false}
            showHeadOrb
            formatY={(v) => `${v.toFixed(1)}kg`}
            formatX={(v) => formatDate(v)}
          />
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="k-eyebrow">Variant CINEMATIC — stock chart style</h2>
            <p
              className="text-xs font-mono mt-1"
              style={{ color: "var(--text-3)" }}
            >
              bars + line + halo intenso + paleta azul · fondo deep navy con
              grid azul
            </p>
          </div>
          <KronosLineChart
            data={prData}
            xKey="date"
            yKey="value"
            variant="cinematic"
            height={300}
            gradient
            formatY={(v) => `${v.toFixed(0)}kg`}
            formatX={(v) => formatDate(v)}
            ariaLabel="Demo cinematic — PR Back Squat"
          />
        </section>

        <section className="space-y-3">
          <h2 className="k-eyebrow">Cinematic compacto · asistencia semana</h2>
          <KronosLineChart
            data={attendanceData}
            xKey="day"
            yKey="asistencia"
            variant="cinematic"
            height={220}
            gradient
            formatY={(v) => `${v.toFixed(0)}`}
            formatX={(v) => String(v)}
            ariaLabel="Demo cinematic compacto"
          />
        </section>
      </div>
    </div>
  );
}
