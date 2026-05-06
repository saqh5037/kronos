"use client";

import { useState, useRef, type FormEvent } from "react";
import {
  analyzeMovementForm,
  type FormAnalysisResult,
} from "@/server/actions/ai";
import { FORM_ANALYSIS_DISCLAIMER } from "@/lib/ai/form-analysis";

const AI_PRIMARY = "#ff2bd6";
const AI_SECONDARY = "#00e5ff";

const SCORE_LABEL: Record<
  FormAnalysisResult["feedback"]["overallScore"],
  string
> = {
  excellent: "EXCELENTE",
  good: "BUENA",
  fair: "ACEPTABLE",
  "needs-work": "POR MEJORAR",
  unable: "NO EVALUABLE",
};

const SCORE_COLOR: Record<
  FormAnalysisResult["feedback"]["overallScore"],
  string
> = {
  excellent: "var(--moss)",
  good: "var(--moss)",
  fair: "var(--amber)",
  "needs-work": "var(--ember)",
  unable: "var(--text-3)",
};

export default function FormAnalyzerClient({
  athletes,
  movements,
}: {
  athletes: Array<{ id: string; name: string }>;
  movements: Array<{ id: string; name: string; category: string }>;
}) {
  const [result, setResult] = useState<FormAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData(e.currentTarget);
      const r = await analyzeMovementForm(formData);
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <form
        onSubmit={handleSubmit}
        className="k-card p-5 space-y-4"
        encType="multipart/form-data"
      >
        <div>
          <label className="k-eyebrow mb-2 block">Atleta (opcional)</label>
          <select
            name="athleteId"
            className="w-full rounded-md border border-[var(--line-strong)] bg-[var(--bg-soft)] px-3 py-2 text-sm"
          >
            <option value="">— Sin atleta específico —</option>
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="k-eyebrow mb-2 block">Movimiento *</label>
          <select
            name="movementId"
            required
            className="w-full rounded-md border border-[var(--line-strong)] bg-[var(--bg-soft)] px-3 py-2 text-sm"
          >
            <option value="">— Elegí el movimiento —</option>
            {movements.map((m) => (
              <option key={m.id} value={m.id}>
                {m.category} · {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="k-eyebrow mb-2 block">Foto de la ejecución *</label>
          <input
            ref={fileInputRef}
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            required
            onChange={handleFileChange}
            className="w-full text-xs"
          />
          <p className="mt-1.5 text-[10px]" style={{ color: "var(--text-3)" }}>
            JPG / PNG / WEBP · máximo 6MB · Vista frontal o 3/4 idealmente.
          </p>
          {previewUrl && (
            <div className="mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- blob URL preview */}
              <img
                src={previewUrl}
                alt="Vista previa"
                className="rounded-md max-h-48 border border-[var(--line)]"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full font-mono text-[11px] tracking-[0.16em] font-bold uppercase px-4 py-2.5 rounded-md transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          style={{
            color: "#1c1917",
            background: `linear-gradient(95deg, ${AI_PRIMARY} 0%, #6a3bff 50%, ${AI_SECONDARY} 100%)`,
            boxShadow: `0 0 14px ${AI_PRIMARY}55`,
          }}
        >
          {loading ? "Analizando con Gemini Vision…" : "Analizar postura"}
        </button>

        {error && (
          <p
            className="text-sm rounded-md p-3"
            style={{
              background: "var(--ember-soft)",
              color: "var(--ember)",
              border: "1px solid var(--ember-line)",
            }}
          >
            {error}
          </p>
        )}

        <p
          className="text-[10px] leading-[1.5]"
          style={{ color: "var(--text-3)" }}
        >
          {FORM_ANALYSIS_DISCLAIMER}
        </p>
      </form>

      <div className="space-y-4">
        {!result && !loading && (
          <div className="k-card p-8 text-center">
            <div
              className="mx-auto mb-3 h-12 w-12 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${AI_PRIMARY}33, ${AI_SECONDARY}33)`,
                border: "1px solid var(--line-strong)",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke={AI_PRIMARY}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <p className="text-sm" style={{ color: "var(--text-2)" }}>
              Subí una foto y el modelo te da feedback técnico de la ejecución.
            </p>
          </div>
        )}

        {result && (
          <div
            className="k-card p-5 relative overflow-hidden"
            style={{
              boxShadow:
                result.feedback.source === "ai"
                  ? `0 0 0 1px ${AI_PRIMARY}33, 0 6px 22px ${AI_PRIMARY}1f`
                  : "var(--card-glow)",
            }}
          >
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <p
                  className="font-mono text-[10px] tracking-[0.16em] font-bold uppercase mb-0.5"
                  style={{ color: "var(--text-3)" }}
                >
                  {result.athleteName ?? "Análisis de forma"}
                </p>
                <p className="font-display text-lg font-bold">
                  {result.movementName}
                </p>
              </div>
              <span
                className="font-mono text-[10px] tracking-[0.16em] font-bold uppercase px-2.5 py-1 rounded-md"
                style={{
                  color: SCORE_COLOR[result.feedback.overallScore],
                  background: "var(--bg-soft)",
                  border: `1px solid ${SCORE_COLOR[result.feedback.overallScore]}55`,
                }}
              >
                {SCORE_LABEL[result.feedback.overallScore]}
              </span>
            </div>

            <p className="text-sm mb-4" style={{ color: "var(--text-2)" }}>
              {result.feedback.summary}
            </p>

            {result.feedback.safetyFlags.length > 0 && (
              <div
                className="mb-4 rounded-md p-3"
                style={{
                  background: "var(--ember-soft)",
                  border: "1px solid var(--ember-line)",
                }}
              >
                <p
                  className="font-mono text-[10px] tracking-[0.16em] font-bold uppercase mb-1.5"
                  style={{ color: "var(--ember)" }}
                >
                  ⚠ Atención
                </p>
                <ul className="space-y-1 text-sm">
                  {result.feedback.safetyFlags.map((s, i) => (
                    <li key={i} style={{ color: "var(--ember)" }}>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.feedback.strengths.length > 0 && (
              <div className="mb-3">
                <p
                  className="font-mono text-[10px] tracking-[0.16em] font-bold uppercase mb-1.5"
                  style={{ color: "var(--moss)" }}
                >
                  ✓ Puntos fuertes
                </p>
                <ul className="space-y-1 text-sm">
                  {result.feedback.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span
                        aria-hidden
                        className="mt-1.5 h-1 w-1 rounded-full flex-shrink-0"
                        style={{ background: "var(--moss)" }}
                      />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.feedback.improvements.length > 0 && (
              <div>
                <p
                  className="font-mono text-[10px] tracking-[0.16em] font-bold uppercase mb-1.5"
                  style={{ color: "var(--amber)" }}
                >
                  ↗ A mejorar
                </p>
                <ul className="space-y-1 text-sm">
                  {result.feedback.improvements.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span
                        aria-hidden
                        className="mt-1.5 h-1 w-1 rounded-full flex-shrink-0"
                        style={{ background: "var(--amber)" }}
                      />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p
              className="mt-4 pt-3 text-[10px] leading-[1.5]"
              style={{
                color: "var(--text-3)",
                borderTop: "1px solid var(--line)",
              }}
            >
              Análisis:{" "}
              {result.feedback.source === "ai"
                ? "Gemini Vision"
                : "fallback (sin IA)"}
              {" · "}
              {FORM_ANALYSIS_DISCLAIMER}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
