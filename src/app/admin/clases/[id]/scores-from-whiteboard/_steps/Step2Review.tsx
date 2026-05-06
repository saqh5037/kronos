"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { confirmWhiteboardScores } from "@/server/actions/scores";
import ConfidenceBadge from "@/components/kronos/ConfidenceBadge";
import AthleteCombobox from "@/components/kronos/AthleteCombobox";
import type { WhiteboardRow } from "@/server/ocr/whiteboard";
import type { ScoreType, Scaling } from "@prisma/client";

type RosterEntry = {
  athleteId: string;
  firstName: string;
  lastName: string;
};

type RowState = WhiteboardRow & {
  include: boolean;
  editedAthleteId: string | null;
  editedScore: string;
  saveAlias: boolean;
  shake: boolean;
};

type Props = {
  uploadId: string;
  classId: string;
  aiRows: WhiteboardRow[];
  roster: RosterEntry[];
  wodScoreType: ScoreType;
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export default function Step2Review({
  uploadId,
  classId,
  aiRows,
  roster,
  wodScoreType,
}: Props) {
  const router = useRouter();

  const [rows, setRows] = useState<RowState[]>(
    aiRows.map((r) => ({
      ...r,
      scoreType: wodScoreType,
      include: r.confidence >= 0.5,
      editedAthleteId: r.matchedAthleteId,
      editedScore: r.score,
      saveAlias: false,
      shake: false,
    })),
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerShake = useCallback((idx: number) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], shake: true };
      return next;
    });
    setTimeout(() => {
      setRows((prev) => {
        const next = [...prev];
        if (next[idx]) next[idx] = { ...next[idx], shake: false };
        return next;
      });
    }, 500);
  }, []);

  function updateRow(idx: number, patch: Partial<RowState>) {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };

      if (
        "editedAthleteId" in patch &&
        patch.editedAthleteId !== aiRows[idx].matchedAthleteId
      ) {
        next[idx].saveAlias = true;
      }

      return next;
    });
  }

  function validateScore(scoreStr: string, scoreType: ScoreType): boolean {
    if (scoreType === "TIME") {
      const parts = scoreStr.split(":");
      if (parts.length === 2) {
        return !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]));
      }
      return !isNaN(parseFloat(scoreStr)) && scoreStr.trim() !== "";
    }
    if (scoreType === "ROUNDS_REPS") {
      const parts = scoreStr.split("+");
      if (parts.length === 2) {
        return !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]));
      }
      return !isNaN(parseFloat(scoreStr)) && scoreStr.trim() !== "";
    }
    return !isNaN(parseFloat(scoreStr)) && scoreStr.trim() !== "";
  }

  function parseScoreValue(scoreStr: string, scoreType: ScoreType): number {
    if (scoreType === "TIME") {
      const parts = scoreStr.split(":");
      if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
      }
      return parseFloat(scoreStr) || 0;
    }
    if (scoreType === "ROUNDS_REPS") {
      const parts = scoreStr.split("+");
      if (parts.length === 2) {
        return parseInt(parts[0]) + parseInt(parts[1]) / 100;
      }
      return parseFloat(scoreStr) || 0;
    }
    return parseFloat(scoreStr) || 0;
  }

  async function handleConfirm() {
    const included = rows.filter((r) => r.include && r.editedAthleteId);

    if (included.length === 0) {
      setError("Selecciona al menos un atleta para confirmar");
      return;
    }

    let hasInvalid = false;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.include && !validateScore(row.editedScore, wodScoreType)) {
        triggerShake(i);
        hasInvalid = true;
      }
    }
    if (hasInvalid) {
      setError("Corrige los scores marcados en rojo antes de continuar");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const confirmRows = included.map((r) => ({
        athleteId: r.editedAthleteId!,
        value: parseScoreValue(r.editedScore, wodScoreType),
        type: wodScoreType,
        scaling: r.scaling as Scaling,
        notes: r.notes,
        includeAlias:
          r.saveAlias && r.rawName ? { rawName: r.rawName } : undefined,
      }));

      await confirmWhiteboardScores(uploadId, confirmRows);
      router.push(`?step=done&count=${included.length}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al confirmar scores",
      );
      setLoading(false);
    }
  }

  const includedCount = rows.filter(
    (r) => r.include && r.editedAthleteId,
  ).length;
  const needsReview = rows.filter(
    (r) => r.confidence < 0.7 && r.include,
  ).length;

  return (
    <div className="space-y-4">
      <div>
        <p className="k-eyebrow mb-1">Paso 2 de 3</p>
        <h2 className="text-xl font-display font-bold text-white">
          Revisar scores detectados
        </h2>
        <p className="text-sm text-white/60 mt-1">
          {rows.length} filas detectadas{" "}
          {needsReview > 0 && (
            <span className="text-[var(--amber)] font-medium">
              · {needsReview} requieren revisión
            </span>
          )}
        </p>
      </div>

      {/* ─── DESKTOP TABLE (lg+) ─── */}
      <motion.div
        className="hidden lg:block overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--card)]"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/40 border-b border-[var(--line)]">
              <th className="pb-3 pt-3 pr-3 pl-4 w-10"></th>
              <th className="pb-3 pt-3 pr-3 font-mono text-[10px] uppercase tracking-wider">
                Nombre en pizarra
              </th>
              <th className="pb-3 pt-3 pr-3 font-mono text-[10px] uppercase tracking-wider">
                Atleta
              </th>
              <th className="pb-3 pt-3 pr-3 font-mono text-[10px] uppercase tracking-wider">
                Score
              </th>
              <th className="pb-3 pt-3 pr-3 font-mono text-[10px] uppercase tracking-wider">
                Tipo
              </th>
              <th className="pb-3 pt-3 pr-3 font-mono text-[10px] uppercase tracking-wider">
                Scaling
              </th>
              <th className="pb-3 pt-3 pr-4 font-mono text-[10px] uppercase tracking-wider">
                Confianza
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const isLowConfidence = row.confidence < 0.5;
              const isAutoMatch = row.confidence > 0.7;
              const scoreInvalid =
                row.include &&
                row.editedScore &&
                !validateScore(row.editedScore, wodScoreType);

              return (
                <motion.tr
                  key={idx}
                  variants={rowVariants}
                  className={`border-b border-[var(--line)] transition-colors hover:bg-[var(--hover-subtle)] ${
                    isLowConfidence
                      ? "border-l-[3px] border-l-[var(--ember)]"
                      : "border-l-[3px] border-l-transparent"
                  } ${scoreInvalid ? "bg-[var(--ember-soft)]" : ""}`}
                  animate={row.shake ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Include checkbox */}
                  <td className="py-3 pr-3 pl-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={row.include}
                        onChange={(e) =>
                          updateRow(idx, { include: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 rounded border-2 border-white/20 peer-checked:bg-[var(--moss)] peer-checked:border-[var(--moss)] flex items-center justify-center transition-colors">
                        {row.include && (
                          <motion.svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500 }}
                          >
                            <path
                              d="M2.5 6.5L5 9L9.5 3.5"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </motion.svg>
                        )}
                      </div>
                    </label>
                  </td>

                  {/* Raw name */}
                  <td className="py-3 pr-3">
                    <span className="font-mono text-white/80">
                      {row.rawName}
                    </span>
                  </td>

                  {/* Athlete combobox */}
                  <td className="py-3 pr-3 min-w-[180px]">
                    <AthleteCombobox
                      athletes={roster}
                      value={row.editedAthleteId}
                      onChange={(id) => updateRow(idx, { editedAthleteId: id })}
                      placeholder="Buscar atleta..."
                    />

                    <AnimatePresence>
                      {row.editedAthleteId !== row.matchedAthleteId &&
                        row.rawName && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, y: -4 }}
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -4 }}
                            transition={{
                              duration: 0.25,
                              ease: "easeOut",
                            }}
                            className="overflow-hidden"
                          >
                            <label className="flex items-center gap-2 mt-2 text-xs text-[var(--steel)] cursor-pointer bg-[var(--steel-soft)] rounded-md px-2 py-1.5 border border-[var(--steel-line)]">
                              <input
                                type="checkbox"
                                checked={row.saveAlias}
                                onChange={(e) =>
                                  updateRow(idx, {
                                    saveAlias: e.target.checked,
                                  })
                                }
                                className="sr-only peer"
                              />
                              <div className="w-4 h-4 rounded border border-[var(--steel-line)] peer-checked:bg-[var(--steel)] peer-checked:border-[var(--steel)] flex items-center justify-center transition-colors shrink-0">
                                {row.saveAlias && (
                                  <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 12 12"
                                    fill="none"
                                  >
                                    <path
                                      d="M2.5 6.5L5 9L9.5 3.5"
                                      stroke="white"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                )}
                              </div>
                              <span className="truncate">
                                Guardar &quot;{row.rawName}&quot; como apodo
                              </span>
                            </label>
                          </motion.div>
                        )}
                    </AnimatePresence>
                  </td>

                  {/* Score editable */}
                  <td className="py-3 pr-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={row.editedScore}
                        onChange={(e) =>
                          updateRow(idx, { editedScore: e.target.value })
                        }
                        className={`bg-[var(--card-2)] text-white text-sm rounded-lg px-3 py-2 border w-24 font-mono transition-colors focus:outline-none ${
                          scoreInvalid
                            ? "border-[var(--ember)] focus:border-[var(--ember)] shadow-[0_0_8px_rgba(196,69,54,0.3)]"
                            : "border-white/10 focus:border-[var(--steel)]"
                        }`}
                      />
                      {scoreInvalid && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute -right-1 -top-1 text-[var(--ember)] text-xs"
                        >
                          ⚠
                        </motion.span>
                      )}
                    </div>
                  </td>

                  {/* Score type */}
                  <td className="py-3 pr-3">
                    <select
                      value={row.scoreType}
                      onChange={(e) =>
                        updateRow(idx, {
                          scoreType: e.target.value as ScoreType,
                        })
                      }
                      className="bg-[var(--card-2)] text-white text-xs rounded-lg px-2 py-2 border border-white/10 focus:outline-none focus:border-[var(--steel)] transition-colors"
                    >
                      <option value="TIME">TIME</option>
                      <option value="REPS">REPS</option>
                      <option value="WEIGHT">WEIGHT</option>
                      <option value="ROUNDS_REPS">ROUNDS</option>
                    </select>
                  </td>

                  {/* Scaling */}
                  <td className="py-3 pr-3">
                    <select
                      value={row.scaling}
                      onChange={(e) =>
                        updateRow(idx, {
                          scaling: e.target.value as Scaling,
                        })
                      }
                      className="bg-[var(--card-2)] text-white text-xs rounded-lg px-2 py-2 border border-white/10 focus:outline-none focus:border-[var(--steel)] transition-colors"
                    >
                      <option value="RX">RX</option>
                      <option value="SCALED">SCALED</option>
                      <option value="RXPLUS">RX+</option>
                    </select>
                  </td>

                  {/* Confidence badge */}
                  <td className="py-3 pr-4">
                    <ConfidenceBadge
                      confidence={row.confidence}
                      showCheck={isAutoMatch}
                      delay={idx * 0.04}
                    />
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      {/* ─── MOBILE CARDS (<lg) ─── */}
      <motion.div
        className="lg:hidden space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {rows.map((row, idx) => {
          const isLowConfidence = row.confidence < 0.5;
          const isAutoMatch = row.confidence > 0.7;
          const scoreInvalid =
            row.include &&
            row.editedScore &&
            !validateScore(row.editedScore, wodScoreType);

          return (
            <motion.div
              key={idx}
              variants={cardVariants}
              className={`rounded-xl border bg-[var(--card)] p-4 space-y-3 ${
                isLowConfidence
                  ? "border-l-[3px] border-l-[var(--ember)] border-[var(--line)]"
                  : "border-[var(--line)]"
              } ${scoreInvalid ? "bg-[var(--ember-soft)]" : ""}`}
              animate={row.shake ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Header: raw name + confidence + include toggle */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-white/80 text-sm truncate">
                    {row.rawName}
                  </p>
                  <p className="text-[10px] text-white/30 mt-0.5 font-mono uppercase tracking-wider">
                    Nombre en pizarra
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <ConfidenceBadge
                    confidence={row.confidence}
                    showCheck={isAutoMatch}
                    delay={idx * 0.04}
                  />
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={row.include}
                      onChange={(e) =>
                        updateRow(idx, { include: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 rounded border-2 border-white/20 peer-checked:bg-[var(--moss)] peer-checked:border-[var(--moss)] flex items-center justify-center transition-colors">
                      {row.include && (
                        <motion.svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500 }}
                        >
                          <path
                            d="M2.5 6.5L5 9L9.5 3.5"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </motion.svg>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Athlete */}
              <div>
                <p className="text-[10px] text-white/30 mb-1.5 font-mono uppercase tracking-wider">
                  Atleta
                </p>
                <AthleteCombobox
                  athletes={roster}
                  value={row.editedAthleteId}
                  onChange={(id) => updateRow(idx, { editedAthleteId: id })}
                  placeholder="Buscar atleta..."
                />
                <AnimatePresence>
                  {row.editedAthleteId !== row.matchedAthleteId &&
                    row.rawName && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -4 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -4 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <label className="flex items-center gap-2 mt-2 text-xs text-[var(--steel)] cursor-pointer bg-[var(--steel-soft)] rounded-md px-2 py-1.5 border border-[var(--steel-line)]">
                          <input
                            type="checkbox"
                            checked={row.saveAlias}
                            onChange={(e) =>
                              updateRow(idx, {
                                saveAlias: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-4 h-4 rounded border border-[var(--steel-line)] peer-checked:bg-[var(--steel)] peer-checked:border-[var(--steel)] flex items-center justify-center transition-colors shrink-0">
                            {row.saveAlias && (
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 12 12"
                                fill="none"
                              >
                                <path
                                  d="M2.5 6.5L5 9L9.5 3.5"
                                  stroke="white"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </div>
                          <span className="truncate">
                            Guardar &quot;{row.rawName}&quot; como apodo
                          </span>
                        </label>
                      </motion.div>
                    )}
                </AnimatePresence>
              </div>

              {/* Score + Type + Scaling row */}
              <div className="flex items-end gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white/30 mb-1.5 font-mono uppercase tracking-wider">
                    Score
                  </p>
                  <div className="relative">
                    <input
                      type="text"
                      value={row.editedScore}
                      onChange={(e) =>
                        updateRow(idx, { editedScore: e.target.value })
                      }
                      className={`w-full bg-[var(--card-2)] text-white text-sm rounded-lg px-3 py-2 border font-mono transition-colors focus:outline-none ${
                        scoreInvalid
                          ? "border-[var(--ember)] focus:border-[var(--ember)] shadow-[0_0_8px_rgba(196,69,54,0.3)]"
                          : "border-white/10 focus:border-[var(--steel)]"
                      }`}
                    />
                    {scoreInvalid && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute -right-1 -top-1 text-[var(--ember)] text-xs"
                      >
                        ⚠
                      </motion.span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-white/30 mb-1.5 font-mono uppercase tracking-wider">
                    Tipo
                  </p>
                  <select
                    value={row.scoreType}
                    onChange={(e) =>
                      updateRow(idx, {
                        scoreType: e.target.value as ScoreType,
                      })
                    }
                    className="bg-[var(--card-2)] text-white text-xs rounded-lg px-2 py-2 border border-white/10 focus:outline-none focus:border-[var(--steel)] transition-colors"
                  >
                    <option value="TIME">TIME</option>
                    <option value="REPS">REPS</option>
                    <option value="WEIGHT">WEIGHT</option>
                    <option value="ROUNDS_REPS">ROUNDS</option>
                  </select>
                </div>
                <div>
                  <p className="text-[10px] text-white/30 mb-1.5 font-mono uppercase tracking-wider">
                    Scaling
                  </p>
                  <select
                    value={row.scaling}
                    onChange={(e) =>
                      updateRow(idx, {
                        scaling: e.target.value as Scaling,
                      })
                    }
                    className="bg-[var(--card-2)] text-white text-xs rounded-lg px-2 py-2 border border-white/10 focus:outline-none focus:border-[var(--steel)] transition-colors"
                  >
                    <option value="RX">RX</option>
                    <option value="SCALED">SCALED</option>
                    <option value="RXPLUS">RX+</option>
                  </select>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-sm text-[var(--ember)] bg-[var(--ember-soft)] rounded-lg px-4 py-3 border border-[var(--ember-line)] flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle
                cx="8"
                cy="8"
                r="6"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M8 5V8.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle cx="8" cy="11" r="0.75" fill="currentColor" />
            </svg>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() =>
            router.push(`/admin/clases/${classId}/scores-from-whiteboard`)
          }
          className="k-btn-ghost px-4 py-2.5 text-sm"
        >
          Volver
        </button>
        <motion.button
          type="button"
          onClick={handleConfirm}
          disabled={loading || includedCount === 0}
          className="k-btn-grad px-6 py-2.5 text-sm font-semibold disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Guardando...
            </span>
          ) : (
            `Confirmar ${includedCount} score${includedCount !== 1 ? "s" : ""}`
          )}
        </motion.button>
      </div>
    </div>
  );
}
