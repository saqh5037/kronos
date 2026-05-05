"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmWhiteboardScores } from "@/server/actions/scores";
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
};

type Props = {
  uploadId: string;
  classId: string;
  aiRows: WhiteboardRow[];
  roster: RosterEntry[];
  wodScoreType: ScoreType;
};

function confidenceClass(confidence: number): string {
  if (confidence >= 0.85) return "text-[--recovery] bg-[--recovery]/10";
  if (confidence >= 0.5) return "text-yellow-400 bg-yellow-400/10";
  return "text-[--pr] bg-[--pr]/10";
}

function rowBg(confidence: number): string {
  if (confidence >= 0.7) return "";
  if (confidence >= 0.5) return "bg-yellow-400/5";
  return "bg-[--pr]/5";
}

export default function Step2Review({
  uploadId,
  classId,
  aiRows,
  roster,
  wodScoreType,
}: Props) {
  const router = useRouter();

  // The WOD's scoreType is authoritative — override Gemini's guess.
  const [rows, setRows] = useState<RowState[]>(
    aiRows.map((r) => ({
      ...r,
      scoreType: wodScoreType,
      include: r.confidence >= 0.5,
      editedAthleteId: r.matchedAthleteId,
      editedScore: r.score,
      saveAlias: false,
    })),
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateRow(idx: number, patch: Partial<RowState>) {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };

      // If athlete changed and name doesn't match, auto-prompt saveAlias
      if (
        "editedAthleteId" in patch &&
        patch.editedAthleteId !== aiRows[idx].matchedAthleteId
      ) {
        next[idx].saveAlias = true;
      }

      return next;
    });
  }

  function parseScoreValue(scoreStr: string, scoreType: ScoreType): number {
    if (scoreType === "TIME") {
      // mm:ss format → seconds
      const parts = scoreStr.split(":");
      if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
      }
      return parseFloat(scoreStr) || 0;
    }
    if (scoreType === "ROUNDS_REPS") {
      // "5+8" format → 5.08
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
          {rows.length} filas detectadas ·{" "}
          {needsReview > 0 && (
            <span className="text-yellow-400">
              {needsReview} requieren revisión
            </span>
          )}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/40 border-b border-white/10">
              <th className="pb-2 pr-3 w-8"></th>
              <th className="pb-2 pr-3">Nombre en pizarra</th>
              <th className="pb-2 pr-3">Atleta</th>
              <th className="pb-2 pr-3">Score</th>
              <th className="pb-2 pr-3">Tipo</th>
              <th className="pb-2 pr-3">Scaling</th>
              <th className="pb-2">Confianza</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={idx}
                className={`border-b border-white/5 ${rowBg(row.confidence)}`}
              >
                {/* Include checkbox */}
                <td className="py-2 pr-3">
                  <input
                    type="checkbox"
                    checked={row.include}
                    onChange={(e) =>
                      updateRow(idx, { include: e.target.checked })
                    }
                    className="accent-[--recovery]"
                  />
                </td>

                {/* Raw name */}
                <td className="py-2 pr-3 font-mono text-white/80">
                  {row.rawName}
                </td>

                {/* Athlete dropdown */}
                <td className="py-2 pr-3">
                  <select
                    value={row.editedAthleteId ?? ""}
                    onChange={(e) =>
                      updateRow(idx, {
                        editedAthleteId: e.target.value || null,
                      })
                    }
                    className="bg-[--card-2] text-white text-sm rounded px-2 py-1 border border-white/10 min-w-32"
                  >
                    <option value="">-- Sin match --</option>
                    {roster.map((a) => (
                      <option key={a.athleteId} value={a.athleteId}>
                        {a.firstName} {a.lastName}
                      </option>
                    ))}
                  </select>

                  {/* Alias prompt */}
                  {row.editedAthleteId !== row.matchedAthleteId &&
                    row.rawName && (
                      <label className="flex items-center gap-1 mt-1 text-xs text-white/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={row.saveAlias}
                          onChange={(e) =>
                            updateRow(idx, { saveAlias: e.target.checked })
                          }
                          className="accent-[--strain]"
                        />
                        Guardar &quot;{row.rawName}&quot; como apodo
                      </label>
                    )}
                </td>

                {/* Score editable */}
                <td className="py-2 pr-3">
                  <input
                    type="text"
                    value={row.editedScore}
                    onChange={(e) =>
                      updateRow(idx, { editedScore: e.target.value })
                    }
                    className="bg-[--card-2] text-white text-sm rounded px-2 py-1 border border-white/10 w-20 font-mono"
                  />
                </td>

                {/* Score type */}
                <td className="py-2 pr-3">
                  <select
                    value={row.scoreType}
                    onChange={(e) =>
                      updateRow(idx, { scoreType: e.target.value as ScoreType })
                    }
                    className="bg-[--card-2] text-white text-xs rounded px-1 py-1 border border-white/10"
                  >
                    <option value="TIME">TIME</option>
                    <option value="REPS">REPS</option>
                    <option value="WEIGHT">WEIGHT</option>
                    <option value="ROUNDS_REPS">ROUNDS</option>
                  </select>
                </td>

                {/* Scaling */}
                <td className="py-2 pr-3">
                  <select
                    value={row.scaling}
                    onChange={(e) =>
                      updateRow(idx, { scaling: e.target.value as Scaling })
                    }
                    className="bg-[--card-2] text-white text-xs rounded px-1 py-1 border border-white/10"
                  >
                    <option value="RX">RX</option>
                    <option value="SCALED">SCALED</option>
                    <option value="RXPLUS">RX+</option>
                  </select>
                </td>

                {/* Confidence badge */}
                <td className="py-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono ${confidenceClass(row.confidence)}`}
                  >
                    {Math.round(row.confidence * 100)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && (
        <p className="text-sm text-[--pr] bg-[--pr]/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() =>
            router.push(`/admin/clases/${classId}/scores-from-whiteboard`)
          }
          className="k-btn-ghost px-4 py-2 text-sm"
        >
          Volver
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading || includedCount === 0}
          className="k-btn-grad px-6 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {loading
            ? "Guardando..."
            : `Confirmar ${includedCount} score${includedCount !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}
