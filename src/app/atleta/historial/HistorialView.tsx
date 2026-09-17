"use client";

/**
 * HistorialView — the athlete's score history.
 *
 * Audit 2026-09-15 (P2 consistency, /atleta/historial): every row printed the
 * unit twice — "78 kg" from `formatScore` and a second "kg" underneath, and a
 * time result showed "10:06" with an "s" under it. `formatScore` already
 * carries the unit, so the duplicate line is gone and its space now holds the
 * scaling, which the row actually lacked.
 *
 * The "Todos / Todo" filters also name what they filter, and the scaling select
 * uses the shared labels instead of the raw enum.
 */

import { useEffect, useState, useTransition, useCallback } from "react";
import {
  listMyScoresPaged,
  type MyScoreRow,
  type MyScoreSort,
} from "@/server/actions/scores";
import { ChevronLeft, ChevronRight } from "lucide-react";

import KCard from "@/components/kronos/KCard";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";
import { formatScore } from "@/lib/scores";
import { scalingLabel } from "@/lib/labels";
import { formatDateLong } from "@/lib/format";
import type { Scaling } from "@prisma/client";
import type { ScoreType } from "@/lib/validations/wod";
import { TourTriggerButton } from "@/components/tour/TourTriggerButton";
import { historialTour } from "@/components/tour/tours/historial";

type WODOption = { id: string; name: string; scoreType: ScoreType };

type Props = {
  wodOptions: WODOption[];
};

const selectClass =
  "k-card px-3 py-2.5 text-[12px] font-medium rounded-xl appearance-none min-h-[44px]";

const selectStyle: React.CSSProperties = {
  background: "var(--k-elevated)",
  border: "1px solid var(--k-line)",
  color: "var(--k-t1)",
};

export default function HistorialPage({ wodOptions }: Props) {
  const [scores, setScores] = useState<MyScoreRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [wodId, setWodId] = useState("");
  const [scaling, setScaling] = useState("");
  const [sortBy] = useState<MyScoreSort>("createdAt");
  const [sortDir] = useState<"asc" | "desc">("desc");
  const [isPending, startTransition] = useTransition();

  const load = useCallback(
    (
      p: number,
      opts?: {
        wodId?: string;
        scaling?: string;
        sortBy?: MyScoreSort;
        sortDir?: "asc" | "desc";
      },
    ) => {
      startTransition(async () => {
        try {
          const result = await listMyScoresPaged({
            page: p,
            pageSize,
            wodId: opts?.wodId ?? wodId,
            scaling: ((opts?.scaling ?? scaling) || undefined) as
              | "RX"
              | "SCALED"
              | "RXPLUS"
              | undefined,
            sortBy: opts?.sortBy ?? sortBy,
            sortDir: opts?.sortDir ?? sortDir,
          });
          setScores(result.rows);
          setTotal(result.total);
          setPage(result.page);
        } catch {
          setScores([]);
          setTotal(0);
        }
      });
    },
    [wodId, scaling, sortBy, sortDir, pageSize],
  );

  useEffect(() => {
    load(1);
    // intentionally empty: load only on mount; subsequent loads triggered by filter changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="pb-28 relative">
      {/* HERO V3 — limpio */}
      <header
        data-tour="historial.header"
        style={{
          padding: "20px 20px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 20, right: 20 }}>
          <TourTriggerButton tourId={historialTour.id} />
        </div>
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.2em",
            color: "var(--k-t3)",
            textTransform: "uppercase",
          }}
        >
          HISTORIAL · ATLETA
        </span>
        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--k-t1)",
            margin: 0,
            lineHeight: 1.05,
          }}
        >
          Mis scores
        </h1>
        <p
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--k-t2)",
            margin: "4px 0 0",
          }}
        >
          {total} scores registrados
        </p>
      </header>

      {/* Filters */}
      <AnimatedSection data-tour="historial.filtros" className="px-3.5">
        <AnimatedItem>
          <div className="flex gap-2">
            <select
              value={wodId}
              onChange={(e) => {
                setWodId(e.target.value);
                load(1, { wodId: e.target.value });
              }}
              className={`flex-1 ${selectClass}`}
              style={selectStyle}
              aria-label="Filtrar por WOD"
            >
              <option value="">Todos los WODs</option>
              {wodOptions.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <select
              value={scaling}
              onChange={(e) => {
                setScaling(e.target.value);
                load(1, { scaling: e.target.value });
              }}
              className={`w-[130px] ${selectClass}`}
              style={selectStyle}
              aria-label="Filtrar por escala"
            >
              <option value="">Toda escala</option>
              <option value="RX">{scalingLabel.RX}</option>
              <option value="SCALED">{scalingLabel.SCALED}</option>
              <option value="RXPLUS">{scalingLabel.RXPLUS}</option>
            </select>
          </div>
        </AnimatedItem>
      </AnimatedSection>

      {/* Scores list */}
      <div data-tour="historial.lista" className="px-3.5 mt-3 space-y-2">
        {isPending && scores.length === 0 && (
          <KCard variant="ghost" className="p-6 text-center">
            <div className="text-sm" style={{ color: "var(--k-t3)" }}>
              Cargando…
            </div>
          </KCard>
        )}

        {!isPending && scores.length === 0 && (
          <KCard variant="ghost" className="p-6 text-center">
            <p className="text-sm" style={{ color: "var(--k-t2)" }}>
              No hay scores que coincidan con los filtros.
            </p>
          </KCard>
        )}

        {scores.map((s) => (
          <KCard
            key={s.id}
            variant="ghost"
            className="p-3.5 flex items-center gap-3"
          >
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
              style={{
                background: "var(--k-elevated)",
                border: "1px solid var(--k-line)",
              }}
            >
              <span
                className="text-[9px] font-bold"
                style={{
                  color: s.scaling === "SCALED" ? "var(--k-t3)" : "var(--k-t2)",
                }}
              >
                {scalingLabel[s.scaling as Scaling] ?? s.scaling}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate">
                {s.wodName}
              </div>
              <div
                className="text-[10px] font-mono"
                style={{ color: "var(--k-t3)" }}
              >
                {formatDateLong(new Date(s.createdAt))}
              </div>
            </div>
            {/*
              `formatScore` already carries the unit ("78 kg", "10:06"), so the
              second unit line the audit flagged ("78 kg / kg") is gone.
            */}
            <div className="text-right shrink-0">
              <div className="font-display text-sm font-bold">
                {formatScore(s.value, s.scoreType)}
              </div>
            </div>
          </KCard>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          data-tour="historial.paginacion"
          className="px-3.5 mt-4 flex items-center justify-between"
        >
          <button
            onClick={() => load(page - 1)}
            disabled={page <= 1 || isPending}
            className="px-4 min-h-[44px] rounded-lg text-[11px] font-bold disabled:opacity-30 inline-flex items-center gap-1.5"
            style={{
              background: "var(--k-elevated)",
              border: "1px solid var(--k-line)",
              color: "var(--k-t1)",
            }}
          >
            <ChevronLeft width={14} height={14} aria-hidden />
            Anterior
          </button>
          <span
            className="text-[11px] font-bold"
            style={{ color: "var(--k-t3)" }}
          >
            {page} / {totalPages}
          </span>
          <button
            onClick={() => load(page + 1)}
            disabled={page >= totalPages || isPending}
            className="px-4 min-h-[44px] rounded-lg text-[11px] font-bold disabled:opacity-30 inline-flex items-center gap-1.5"
            style={{
              background: "var(--k-elevated)",
              border: "1px solid var(--k-line)",
              color: "var(--k-t1)",
            }}
          >
            Siguiente
            <ChevronRight width={14} height={14} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
